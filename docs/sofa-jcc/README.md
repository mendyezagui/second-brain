# SoFa JCC Associate

> Paired with the **[SoFa Developer Associate](./DEVELOPER.md)** (`#/sofa_dev`), which
> builds what this one asks for. This associate watches the business; that one
> does the work.

The associate that runs Beis Chacham Yitzchak — The SoFa Jewish Community Center: the weekly calendar, the
Jewish holidays, the flyers, the brand, and the speaker pipeline.

It is one of the Second Brain associates (`ASSOCIATES` in
`src/lib/constants.js`), but unlike the others it is not only a prompt — it has
its own tables, its own console, its own schedule, and its own push channel.

**Console:** `#/sofa_jcc` · **Sidebar:** SoFa JCC

---

## What it actually does

| | |
|---|---|
| **Knows the calendar** | Reads the real Jewish calendar from hebcal.com every morning — dates, Hebrew dates, candle lighting, havdalah — for the shul's own city. It does not compute Hebrew dates itself and it does not guess. |
| **Speaks up early** | At **T-4, T-2, T-1 and T-0** before a flyer-worthy holiday it pushes a notification to your phone: *"Rosh Hashana is in 4 days."* |
| **Drafts before it asks** | The flyer already exists by the time it notifies you. The notification is about what's *missing*, not a request to start. |
| **Says what's missing** | *"Your SoFa JCC agent drafted the flyer and is missing start time, location and address."* That list is computed from empty fields — never from a model's opinion. |
| **Owns the design** | Three locked HTML templates (holiday / speaker / weekly) using the real sofajcc.org palette and crest. The model writes words into slots; it cannot move the layout. |
| **Runs the speaker pipeline** | You give a name. It web-searches, fills title, org, bio and topic, records its confidence and sources, and flags anything it could not verify rather than inventing it. |
| **Keeps its own history** | Every event, flyer version, gap list, answer and nudge is a row. Nothing is regenerated from scratch; drafts supersede, they don't overwrite. |

## How you actually use it

Two ways in, both at `#/sofa_jcc`.

**1. Tell it what you need.** A plain-English box at the top of the console:

> *"Chanukah party this Sunday at 5pm in the main hall, families welcome"*
> *"Friday night shiur with Rabbi Meni Even-Israel on Dec 12"*

It extracts what the sentence actually says, creates the event, drafts the
flyer, and reports what is still missing. **It never fills a blank with a
guess** — anything you left out becomes a question. A date is the one hard
requirement; without one it asks rather than inventing a day.

Name a speaker and they are added to the roster automatically, ready for the
research step.

**2. Wait for it to come to you.** For anything on the Jewish calendar you do
nothing — the flyer is drafted days ahead and the push tells you what it needs.

Either way you land in the same place: fields on the left, live flyer on the
right, updating as you type.

### Getting the flyer out

| button | gives you | good for |
|---|---|---|
| **PDF** | Opens the print dialog — choose *Save as PDF*. The template declares `@page { size: 1275px 1650px; margin: 0 }`, so it comes out pixel-exact and single-page, no library and no server. | Printing, bulletin board, emailing |
| **HTML** | The flyer as a standalone file | Editing by hand, archiving |
| `scripts/render-flyer.mjs` | PNG at exact canvas size (needs Playwright locally) | WhatsApp / Instagram |

There is no one-click PNG in the browser yet. Browser-side rasterisers
re-implement CSS and get `object-fit` on the headshot wrong, which would ship a
distorted face — not worth it. Save as PDF, or use the script.

## Autonomy rails

Following `docs/proactive-orchestrator-spec.md` §5:

- **Auto-allowed** — create and refresh event rows, draft and redraft flyers,
  compute gaps, write nudges, push to *your own* devices.
- **Never on its own** — publish a flyer, post to social, email the community,
  delete an event you created, or print a fact it did not verify.
- **Everything reversible.** A published flyer is never silently redrawn.

---

## Where it runs

The associate has **two** runtimes, and the Supabase one is the reliable one:

| runtime | drives | works on |
|---|---|---|
| `supabase/functions/sofa-jcc-scan` + `pg_cron` | the daily scan | **anywhere** — needs no frontend and no Vercel |
| `api/sofa-jcc.js` via `/api/sweep` | the same scan, plus speaker research and quick-create | Vercel only |

This matters because the app is served from **Cloudflare Pages**
(`2nd.mendyezagui.com`), where Vercel-format `api/*.js` routes do not run —
`POST /api/sofa-jcc` returns 405 there, not JSON. The Edge Function keeps the
associate working regardless. See
`supabase/functions/sofa-jcc-scan/README.md`.

## How it runs

```
Vercel cron 6:30am PT  →  /api/sweep  →  runSofaScan()   ← rides the existing cron
                                            │              (Hobby caps crons at 2,
                                            │               both already spent)
                                            ├─ hebcal read for the next 21 days
                                            ├─ upsert sofa_events   (key: hebcal_key)
                                            ├─ draft sofa_flyers    (HTML + gap list)
                                            ├─ insert sofa_nudges   (key: dedupe_key)
                                            └─ Web Push → your phone

#/sofa_jcc  →  planDay()  ← the SAME core, dry-run
                             so the console shows exactly what the cron will do
```

`src/lib/sofa/agent.js` is pure: data in, intents out. Both the cron and the
browser call it, so they cannot disagree about what day a holiday is.

### Idempotency

Re-running the scan any number of times a day is safe.

- `sofa_events.hebcal_key` — unique. A re-scan updates the row in place.
- `sofa_nudges.dedupe_key` — unique, `<hebcal_key>:t-<leadDays>`. One nudge per
  event per lead day, ever. The row is written *before* the push is attempted,
  so a push failure can never cause a duplicate notification tomorrow.

---

## Setup

### 1. Database

Run `schema-sofa-jcc.sql` in the Supabase SQL editor (or apply it via the
Supabase MCP `apply_migration`, per repo convention). Creates `sofa_speakers`,
`sofa_events`, `sofa_flyers`, `sofa_nudges`, `push_subscriptions`.

### 2. Push keys

```bash
npm run vapid          # prints a keypair — run ONCE
```

Add to Vercel → Settings → Environment Variables:

| var | scope | notes |
|---|---|---|
| `VAPID_PUBLIC_KEY` | server | |
| `VAPID_PRIVATE_KEY` | server | never commit |
| `VAPID_SUBJECT` | server | `mailto:you@yourdomain.com` |
| `VITE_VAPID_PUBLIC_KEY` | client | same value as the public key |
| `SOFA_HEBCAL_GEONAMEID` | server | optional; defaults to Los Angeles (`5368361`) |

`VITE_*` vars are inlined at build time — **redeploy after adding them.**

Regenerating VAPID keys invalidates every existing subscription and every
device has to re-enable notifications. Do it once.

### 3. Turn on notifications

Open `#/sofa_jcc` → **Turn on**.

> **iPhone:** Safari refuses Web Push in a normal tab. Open the site, Share →
> **Add to Home Screen**, then open it from *that icon* and turn notifications
> on there. The console detects this and says so rather than pretending push is
> working. Android and desktop work in the tab.

### 4. Candle-lighting times

The default is **Los Angeles**, lighting **12 minutes** before sunset. That
offset is not a guess: Hebcal's default of 18 minutes gives 7:30pm for Friday
7 August 2026, and the shul's own printed flyer for that night reads 7:36pm —
which is exactly `b=12`. Confirm it against a second flyer before trusting it
blindly; it is one data point. Both are overridable
(`SOFA_HEBCAL_GEONAMEID`, and `CANDLE_MINUTES_BEFORE_SUNSET` in
`src/lib/sofa/hebcal.js`).

---

## Files

| path | what |
|---|---|
| `src/lib/sofa/brand.js` | Locked palette, type, crest, canvas sizes. **The only place brand values live.** |
| `src/lib/sofa/hebcal.js` | Calendar read, lead-day maths, which holidays get a flyer |
| `src/lib/sofa/gaps.js` | "What's missing" — deterministic, no model |
| `src/lib/sofa/templates.js` | The three flyer templates |
| `src/lib/sofa/agent.js` | The decision core (pure) |
| `src/views/SofaJCCView.jsx` | The console |
| `src/lib/push.js` | Browser subscribe / unsubscribe |
| `public/sw.js` | Push service worker |
| `api/sofa-jcc.js` | Scan, speaker research, render |
| `api/push.js`, `api/_push.js` | Device registry + sender |
| `scripts/render-flyer.mjs` | HTML → PNG (local; needs playwright) |
| `scripts/gen-vapid.mjs` | One-time keygen |
| `src/lib/sofa/dev.js` | Work orders + handoff briefs (developer associate) |
| `src/views/SofaDevView.jsx` | The developer console |
| `api/sofa-dev.js` | Spec, build, handoff |
| `public/sofa-jcc/brand/` | The real logo files + the sefarim label template |
| `schema-sofa-jcc.sql` | The tables |

## Exporting a flyer as PNG

The app stores flyers as HTML because that stays editable and diffable. For
something to send to a WhatsApp group or pin to a board:

```bash
npm i -D playwright && npx playwright install chromium   # once
node scripts/render-flyer.mjs --template holiday \
  --data flyer.json --out public/sofa-jcc/flyers/rosh-hashana.png
```

Or hit **HTML** in the console and open the file in a browser.
