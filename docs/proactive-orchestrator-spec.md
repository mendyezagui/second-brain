# Proactive Daily Orchestrator — Build Spec

Status: **Decisions locked (§10) · ready to build** · Owner: Mendy · Last updated: 2026-05-31
Scope: Phase 1 only. Phase 2+ sketched at the end.

---

## 0. One-paragraph summary

The Second Brain already contains a working orchestrator (`OrchestratorView`
in `src/App.jsx`): it reads goals/deals/contacts/tasks, computes
priorities against the $800K revenue goal, and — via `sweep()` — asks
Claude for a goal-aware daily action plan that gets logged to `agentlogs`.
The problem is it only runs **when Mendy clicks "Sweep" with the dashboard
open**, and it **only advises** — it doesn't book time or prepare drafts.
This phase makes it **proactive** (runs itself every morning, server-side)
and lets it **act within draft-and-hold rails** (auto-creates calendar
holds and stages drafts; never sends anything). No new "AI brain" is being
invented — we are waking up and arming the one that already exists.

---

## 1. What exists today (verified, do not rebuild)

| Piece | Where | Behavior |
|---|---|---|
| Orchestrator UI + logic | `src/App.jsx` → `OrchestratorView` | Deterministic priority engine + manual AI `sweep()` |
| Priority engine | `OrchestratorView` (`allPriorities`) | Rules: critical tasks, overdue invoices, at-risk contacts, relationship decay (>14d), stale deals (>7d), high-priority strategic projects; computes pipeline coverage vs. goal |
| AI synthesis | `sweep()` → `callClaude()` | Sends DB snapshot, returns TOP PRIORITY / DEAL MOVES / STRATEGIC PLAYS / SMART NUDGES; writes to `agentlogs` |
| LLM proxy | `/api/claude` (Vercel serverless) | Server-side, key not exposed in browser. Model `claude-sonnet-4-20250514` |
| News Engine | `runNewsEngine()` | Scans company news, creates outreach tasks (`source: agent:news_engine`) |
| Inbox + AI reply | `InboxView` | Gmail threads + multi-provider AI reply composer (Gemini/Claude/ChatGPT) — **reuse this for email drafts** |
| Calendar | `calendar_events` table | Google-synced (`google_event_id`, `start_time`, `status`, `automation_processed`, `tasks_created`) |
| Context tables | Supabase `xwacfwagyhgbbhefecdt` | `goals`, `strategies`, `deals`, `contacts`, `projects`, `tasks`, `invoices`, `documents`, `ai_memories`, `agentlogs` |

Deployment: Vite + React single-file app, auto-deploys to Vercel from
`main` (`vite-react-gamma-one-96.vercel.app`).

---

## 2. The gap (what Phase 1 closes)

1. **Manual → Proactive.** Today the orchestrator runs on a button click.
   Target: a daily server-side job runs the synthesis automatically and the
   brief is waiting in the dashboard each morning.
2. **Advises → Acts (draft-and-hold).** Today it writes tasks. Target: it
   also **creates calendar holds** for the top priorities and **stages
   drafts** (email via the existing Inbox AI; LinkedIn post text). It books
   and writes; Mendy presses send. **It never sends or posts on its own.**

Out of scope for Phase 1: deep specialist agents (Content/LinkedIn,
Pipeline, Inbox-triage as standalone reasoning agents). Those are Phase 2 —
they plug into the same orchestrator once it's proactive and acting.

---

## 3. Architecture (Phase 1)

```
Vercel Cron (daily 6:30 AM PT)
        │
        ▼
/api/orchestrator/daily   (new serverless function, runs server-side)
        │  1. load snapshot from Supabase (service-role)
        │  2. build prompt  ── shared with the React sweep() (extract to module)
        │  3. call Claude (reuse /api/claude logic or call inline)
        │  4. parse structured brief  { date, top_priorities[], deal_moves[], ... }
        │  5. persist brief  → daily_briefs table
        │  6. read Google free/busy for today 09:00–17:00 PT; for the top
        │       ≤3 priorities that need focus time, pick open slots (skip
        │       conflicts) and create calendar holds (status="proposed")
        │  7. for priorities that need a message:
        │        stage a draft (email via Gmail draft / LinkedIn text) → drafts table
        │  8. email a copy of the brief via Resend (reuse morning-brief sender)
        ▼
Dashboard (OrchestratorView)
        reads daily_briefs (today) → renders brief + proposed holds + drafts
        Mendy approves / edits / dismisses each item:
          approve hold  → confirm Google event (status "confirmed")
          approve draft → mark ready (email: leave as Gmail draft to send; never auto-send)
          dismiss       → soft-delete, logged
```

### 3.1 Shared synthesis module
Extract the snapshot-building + prompt from `sweep()` into a pure module
(e.g. `src/lib/orchestrator-core.js` or inline-shared) so **both** the
browser button and the cron function produce identical briefs. Single
source of truth for the prompt — no drift.

### 3.2 Why server-side
The cron must run with the dashboard closed, so it cannot rely on browser
state. It reads Supabase directly with a **service-role key** (Vercel env
var, never shipped to client) and calls Claude server-side.

### 3.3 Reuse, don't reinvent
- Email drafts: reuse `InboxView`'s reply-generation path.
- Calendar: reuse the existing Google sync layer that populates
  `calendar_events`; add a free/busy read + a write path for proposed holds.
- LLM: reuse `/api/claude` request shape.
- Email brief: reuse the `morning-brief` Resend sender + HTML template.

---

## 4. Data model changes (via Supabase MCP `apply_migration`, tracked)

> Per repo convention, schema changes go through `apply_migration` against
> project `xwacfwagyhgbbhefecdt` — not hand-run SQL.

### 4.1 New table `daily_briefs`
| col | type | notes |
|---|---|---|
| id | serial pk | |
| brief_date | date | one row per day (unique) |
| generated_at | timestamptz | |
| summary | text | the headline "TOP PRIORITY" line |
| payload | jsonb | full structured brief: `{ top_priorities[], deal_moves[], strategic_plays[], smart_nudges[] }`, each item `{ title, why, goal_ref, nav, suggested_block, draft_ref }` |
| status | text | `pending` / `reviewed` |
| model | text | model used |
| modified_by / modified_at | | follow existing convention |

### 4.2 New table `drafts`
| col | type | notes |
|---|---|---|
| id | serial pk | |
| kind | text | `email` / `linkedin` / `other` |
| status | text | `staged` / `ready` / `dismissed` (never `sent` by the agent) |
| subject | text | nullable (email) |
| body | text | |
| to_contact_id | int | nullable |
| related_deal_id / project_id | int | nullable |
| brief_id | int | fk → daily_briefs |
| source | text | `agent:orchestrator` |
| modified_by / modified_at | | |

### 4.3 `calendar_events` additions
Add support for **proposed** holds the orchestrator creates:
- ensure `status` can be `proposed` | `confirmed` | `cancelled`
- `source text` (e.g. `agent:orchestrator`) if not already distinguishable
- `brief_id int` nullable — link a hold back to the brief that proposed it

### 4.4 Dashboard wiring (App.jsx conventions — do not skip)
- add `daily_briefs`, `drafts` to the `DB_TABLES` map
- add any new view id to `VALID_VIEWS` and `VIEWS`
- if a new view/component is added, define its `blankRecord` helper
  (missing helper = blank tab; this previously killed the Strategies tab)

---

## 5. Autonomy rails (the contract)

- **Auto-allowed:** create calendar **holds** (proposed, ≤3/day, inside
  09:00–17:00 PT, conflict-checked), stage **drafts**, create/update tasks,
  write the daily brief, email a copy of the brief to Mendy.
- **Never without Mendy:** send an email, publish a LinkedIn post, send any
  outbound message, delete real data.
- **Everything reversible:** proposed holds and staged drafts are soft
  state; dismiss removes them; nothing hard-deletes.
- **Every agent action logged** to `agentlogs` (`agent: "Orchestrator"`,
  with `source` on the created rows) so the dashboard shows an audit trail.

---

## 6. Scheduling & idempotency

- **Vercel Cron** daily 6:30 AM PT (`vercel.json` crons entry). One run/day.
- **Idempotency:** one `daily_briefs` row per `brief_date`. If today's brief
  exists, the function returns early unless `?force=1`. (Mirrors the
  `morning-brief` worker's 409-skip pattern.)
- **No double-spend:** calendar holds / drafts are keyed to `brief_id`, so a
  re-run won't duplicate holds for the same day.
- **Failure-safe:** the brief is persisted before actions run; calendar,
  draft, and email steps are best-effort and logged, never aborting the
  brief (same posture as `morning-brief`'s publish/email steps).

---

## 7. Secrets / config (Vercel env)

| var | purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | server-side DB read/write for the cron |
| `ANTHROPIC_API_KEY` | already used by `/api/claude` |
| Google Calendar creds | reuse existing calendar-sync credentials; confirm scope allows **free/busy read** + event **insert**, not just read |
| `RESEND_API_KEY` + from-address | email the daily brief (reuse `morning-brief` config) |
| `ORCH_CRON_SECRET` | guard the `/api/orchestrator/daily` endpoint against public POSTs (Bearer), like `morning-brief`'s `TRIGGER_SECRET` |

---

## 8. Acceptance criteria (Phase 1 done =)

1. At 6:30 AM PT with no browser open, a `daily_briefs` row appears for
   today with a goal-aware prioritized brief and per-item "why".
2. Opening the Orchestrator tab shows today's brief without clicking Sweep.
3. The top ≤3 priorities that need focus time appear as **proposed**
   calendar holds, each inside 09:00–17:00 PT and not overlapping an
   existing event; approving one confirms a real Google Calendar event.
4. Priorities that need a message appear as **staged drafts** (email or
   LinkedIn text); approving an email leaves a ready Gmail draft (un-sent).
5. A copy of the brief is emailed to Mendy at 6:30 via Resend.
6. Nothing is ever sent or posted automatically.
7. Re-running the same day does not duplicate briefs, holds, or drafts.

---

## 9. Phase 2 preview (not now)

- **Content / LinkedIn specialist** — first real reasoning specialist: reads
  goals + strategies + recent posts, proposes the highest-value post this
  week, drafts it, proposes a writing/recording block. Feeds its output into
  the same orchestrator brief.
- Additional specialists (Pipeline over deals, Inbox-triage over Gmail) as
  the same shape: each emits structured findings; the orchestrator ranks
  across all of them.
- Optional later: event chaining (one specialist wakes another) — only if a
  concrete need appears; until then the daily fan-in is enough.

---

## 10. Decisions (locked 2026-05-31)

1. **Calendar holds/day: max 3**, top priorities only. Keeps the calendar
   trustworthy and avoids over-booking from a single brief.
2. **Working-hours window: 09:00–17:00 PT.** The agent does a Google
   free/busy read first and only proposes holds in open slots — never
   double-books an existing event.
3. **LinkedIn drafts: text only (copy-paste) in Phase 1.** Stored in
   `drafts.body`; a posting-API integration is deferred to a later phase.
4. **Email copy of the brief: yes.** Sent at 6:30 AM PT reusing the
   `morning-brief` Resend sender and HTML template, so the brief reaches
   Mendy even before he opens the dashboard.

### Still to confirm during build
- Which Google account/calendar the holds are written to (if more than one).
- Default hold length (suggest 45 min) and whether to leave buffer between
  back-to-back holds.
