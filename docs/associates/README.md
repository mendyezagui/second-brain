# The Associate Runtime

> The generic spine behind every associate. Built because the SoFa JCC pair
> proved what a real associate needs, and hand-building that seventeen more
> times is not a plan.

**Console:** `#/associates` · **Sidebar:** Associates

---

## The problem it solves

Before this, an associate was an entry in a JavaScript array:

```js
{ id:"sow-builder", label:"SOW Associate", artifact:"Statement of work",
  prompt:"Build a tight statement of work with scope, deliverables..." }
```

That is a prompt, not an associate. It had no storage, no schedule, no history
and no way to say what it needed. It only existed while the tab was open, and
the numbers said so: across four months, **the entire set of fifteen produced
exactly one saved artifact** (`associates/pitch-draft`, 19 May 2026).

Meanwhile the two SoFa associates — same list, same tab — ran every morning
without anyone opening anything. The difference was never the prompt. It was
that they had their own tables, their own clock, a deterministic gap list, and
rails that let them act without letting them send.

This runtime is that difference, extracted, so an associate is a **row**.

## What an associate is now

| | |
|---|---|
| **A clock** | `schedule` + `run_at_utc` on its row. One `pg_cron` job fans out to the whole roster, so associate #20 costs nothing. |
| **Declared inputs** | `inputs` says which tables it reads and how to filter them. The cron and the console read the same spec, so they cannot disagree about what it saw. |
| **A gap list** | `requirements` says what it must not invent. Computed from empty fields — never from the model's opinion. |
| **Draft-and-hold rails** | `rails` says what it may do unattended. There is no `send` key and no send path in the code. |
| **A history** | Every run is a row, errors included. An associate that has been failing for a month is visible as failing. |

## Adding one

An INSERT. No code, no deploy, no new cron.

```sql
insert into associates (slug, label, group_name, artifact, schedule, run_at_utc, brief, inputs, requirements, rails)
values (
  'churn-watch', 'Churn Watch Associate', 'Operator', 'At-risk client brief',
  'weekly:tue', '15:00',
  'You watch for clients going quiet before they churn. Read the contact scores, the last-touch dates and the open invoices...',
  '{"linked":false,"tables":[
     {"table":"contacts","fields":["name","co","score","lastTouch","status"],
      "where":[["category","in",["customer","partner"]],["score","lt",40]],
      "order":{"field":"score","dir":"asc"},"limit":25}
   ]}'::jsonb,
  '[{"field":"tables.contacts","label":"At-risk contacts","severity":"ask",
     "question":"Nobody is below the score threshold. Is the scoring current?"}]'::jsonb,
  '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":false}'::jsonb
);
```

It appears in the console immediately and runs on the next tick.

### The `inputs` spec

```jsonc
{
  "linked": true,          // also pull the linked contact/company/deal/project
                           // and the documents, memories and tasks on them
  "tables": [
    { "table":  "deals",
      "fields": ["name","value","stage","closeDate"],   // omit for all columns
      "where":  [["stage","nin",["closed_won","closed_lost"]],
                 ["closeDate","before","today+30"]],
      "order":  { "field":"value", "dir":"desc" },
      "limit":  25 }
  ]
}
```

Operators: `eq neq in nin gt gte lt lte before after contains empty not_empty
is_true is_false`. `today`, `today+30` and `today-14` resolve at run time.

A `limit` always applies (default 25). An associate that reads 400 contacts
into a prompt reads none of them well.

### The `requirements` spec

```jsonc
[{ "field":    "scope.deal.value",      // a dotted path into the context pack
   "label":    "Fee",
   "severity": "blocking",              // blocking | ask | nice
   "question": "What is the fee? I will leave it as a placeholder otherwise." }]
```

- **blocking** — the artifact is wrong without it. The draft is held as
  `needs_input`.
- **ask** — you should answer, but the draft stands.
- **nice** — improves it; silently omitted when absent.

Gaps are handed to the model in the system prompt with an explicit instruction
not to fill them. Answering one in the console writes it to
`associate_drafts.answers`, and the associate never asks again.

Paths resolve against the context pack: `scope.contact`, `scope.deal.value`,
`tables.invoices`, `memories`, `documents`, `tasks`, `instructions`.

### The rails

```jsonc
{ "save_draft": true, "save_memory": true, "save_document": false, "create_task": false }
```

Per `docs/proactive-orchestrator-spec.md` §5. Auto-allowed: stage a draft,
write a memory, file a document, create a task. **Never:** send an email,
publish a post, send any outbound message. This is not a policy the model is
asked to follow — there is no code path that sends.

## How it runs

```
pg_cron 'associate-daily-tick'
        │
        ▼
supabase/functions/associate-tick        ← one function, N associates
        ├─ load the roster (active only)
        ├─ load today's run_keys          ← idempotency
        ├─ planTick()                     ← who is due, in the pure core
        ├─ load ONLY the tables the due associates declared
        └─ for each due associate:
             planAssociate()              ← context + gaps + prompt (pure)
             call Claude
             write associate_runs
             write associate_drafts       ← staged, never sent
             + memory / document / task, per its rails

#/associates  →  functions.invoke("associate-tick", { action:"run", slug })
                 ↑ the SAME function, so a click and a cron do the same thing
```

`src/lib/associates/core.js` and `context.js` are **pure** — data in, intents
out, no IO. The Edge Function and the browser both import them, so a scheduled
run and a manual run cannot drift.

### Why an Edge Function and not `/api`

Two reasons, both load-bearing:

1. **The Vercel Hobby plan caps crons at 2** and both are spent (`/api/sweep`,
   `/api/content`). One more agent on that path meant no more agents, ever.
2. **The app is served from Cloudflare Pages** (`2nd.mendyezagui.com`), where
   Vercel-format `api/*.js` routes do not run at all — `POST /api/sofa-jcc`
   returns **405** there, not JSON. That is a live bug in `SofaJCCView`, which
   still uses `fetch("/api/...")`. This console uses
   `supabase.functions.invoke` instead, which works on every host.

### Idempotency

`associate_runs.run_key` is unique and equals `<slug>:<YYYY-MM-DD>` for anything
on a clock. A tick that fires twice writes one run. Re-running the same day
updates the existing draft and bumps its version rather than stacking a second
one. Manual runs carry a timestamp instead, because asking for another by hand
is deliberate.

### Pinning

The Edge Function imports the core from `raw.githubusercontent.com` pinned to a
commit SHA — the same pattern as `sofa-jcc-scan`, and for the same reason:
without the pin, a later push to `main` silently changes what the cron runs
tonight. **Bump the SHA deliberately and redeploy** when you want the cron to
pick up new logic.

## Setup

### 1. Tables

```
schema-associates.sql   -- associates, associate_runs, associate_drafts
seed-associates.sql     -- the 17-row roster, idempotent on slug
```

Applied via the Supabase MCP `apply_migration` per repo convention. Re-seeding
refreshes each associate's definition but deliberately does **not** reset
`schedule`, `active` or `run_at_utc` — once you have put an associate on a
clock, a re-seed must not quietly take it off.

### 2. The model key

The function needs `ANTHROPIC_API_KEY` as an Edge Function secret
(Supabase → Edge Functions → associate-tick → Secrets). Without it every run
records `status: error` with that exact message rather than failing silently.

### 3. The cron

```sql
select cron.schedule('associate-daily-tick', '0 15 * * *', $$
  select net.http_post(
    url     := 'https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/associate-tick',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer ' || '<SERVICE_ROLE_KEY>'),
    body    := jsonb_build_object('action','tick'),
    timeout_milliseconds := 55000);
$$);
```

`verify_jwt` is **on**, so the cron sends the service-role key and the console
sends the signed-in user's JWT. An unauthenticated caller cannot spend model
credits — which is why this differs from `sofa-jcc-scan`, deployed open.

`pg_net` is async: `net.http_post` queues and returns an id immediately.
Delivery lands in `net._http_response`:

```sql
select id, status_code, error_msg, created from net._http_response order by id desc limit 5;
```

## Checking on it

```sql
-- who is on a clock, and when did they last run
select slug, schedule, run_at_utc, last_run_at from associates where active order by schedule, slug;

-- anything failing
select slug, status, summary, error, started_at from associate_runs
where status = 'error' order by started_at desc limit 20;

-- the review queue
select slug, title, status, jsonb_array_length(gaps) gaps, created_at
from associate_drafts where status in ('staged','needs_input') order by created_at desc;
```

A dry run writes nothing and calls no model — the safe way to see what tonight
would do:

```
GET https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/associate-tick
```

## What it does NOT do yet

- **No push.** Nothing notifies you that a draft is waiting; you find it in the
  review queue. `push_subscriptions` has zero rows, so there is no device to
  notify anyway — arming Web Push is its own job.
- **No chaining.** One associate cannot wake another. The daily fan-in is
  enough until a concrete need appears.
- **No per-associate model routing beyond `model`/`max_tokens`** — no tool use,
  no web search. The SoFa speaker researcher has that; the generic runtime
  does not.
- **The SoFa pair is not on it.** Their rows carry `runtime: 'custom'` and the
  tick skips them, because they already have a working scan and running them
  twice would draft every flyer twice.

## Files

| path | what |
|---|---|
| `schema-associates.sql` | The three tables |
| `seed-associates.sql` | The roster |
| `src/lib/associates/core.js` | The decision core — clock, gaps, prompt, plan (pure) |
| `src/lib/associates/context.js` | The declarative input reader (pure) |
| `supabase/functions/associate-tick/index.ts` | The runtime — the only thing that does IO |
| `src/views/AssociatesView.jsx` | The console |
