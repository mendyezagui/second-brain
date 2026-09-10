# SoFa JCC Associate

The associate that runs SoFa Jewish Community Center: the weekly calendar, the
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

## Autonomy rails

Following `docs/proactive-orchestrator-spec.md` §5:

- **Auto-allowed** — create and refresh event rows, draft and redraft flyers,
  compute gaps, write nudges, push to *your own* devices.
- **Never on its own** — publish a flyer, post to social, email the community,
  delete an event you created, or print a fact it did not verify.
- **Everything reversible.** A published flyer is never silently redrawn.

---

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
| `SOFA_HEBCAL_GEONAMEID` | server | optional; defaults to Miami (`4164138`) |

`VITE_*` vars are inlined at build time — **redeploy after adding them.**

Regenerating VAPID keys invalidates every existing subscription and every
device has to re-enable notifications. Do it once.

### 3. Turn on notifications

Open `#/sofa_jcc` → **Turn on**.

> **iPhone:** Safari refuses Web Push in a normal tab. Open the site, Share →
> **Add to Home Screen**, then open it from *that icon* and turn notifications
> on there. The console detects this and says so rather than pretending push is
> working. Android and desktop work in the tab.

### 4. Confirm the city

The default is Miami. Candle-lighting times are wrong for the wrong city, so
set `SOFA_HEBCAL_GEONAMEID` to the shul's actual location
(search at hebcal.com/home/195/jewish-calendar-cities) if it isn't Miami.

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
