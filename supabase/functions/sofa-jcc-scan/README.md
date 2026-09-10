# `sofa-jcc-scan` — the associate's runtime

Deployed to Supabase project `xwacfwagyhgbbhefecdt`.
URL: `https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/sofa-jcc-scan`

## Why it lives here and not only in `api/`

The app is served from **Cloudflare Pages** (`2nd.mendyezagui.com`). Vercel-format
`api/*.js` routes do not run there — only `functions/api/*` does, and the SoFa
endpoints have no Cloudflare twin. A `POST /api/sofa-jcc` on that host returns
**405**, not JSON.

Putting the scan in an Edge Function makes the associate **host-independent**:
it drafts flyers and records nudges whether or not any frontend is deployed,
and whichever host the app eventually settles on.

This follows the pattern the codebase already uses — `CLAUDE_ENDPOINT` in
`src/lib/utils.js` already routes to a Supabase Edge Function on hosts that
have no `/api`.

## The logic is not duplicated

The imports are the **exact same modules** the browser console runs, fetched
from the public repo and **pinned to a commit**:

```
https://raw.githubusercontent.com/mendyezagui/second-brain/<sha>/src/lib/sofa/agent.js
```

Pinning matters: without it, a later push to `main` would silently change what
the nightly cron executes. **Bump the SHA deliberately when you want the cron
to pick up new logic**, and redeploy.

## Schedule

`pg_cron` job `sofa-jcc-daily-scan`, `30 14 * * *` (UTC) — the same slot as the
`vercel.json` sweep, so the two never drift to different mornings. It calls the
function through `pg_net`.

`pg_net` is async: `net.http_post` queues the request and returns an id
immediately. Delivery lands in `net._http_response`, not in the calling query.

```sql
-- did last night's run land?
select id, status_code, error_msg, created
from net._http_response order by id desc limit 5;
```

## Verified end to end

- Dry run over live data: Los Angeles, candle lighting 6:52pm — matching the
  seeded Erev Rosh Hashana row.
- Full run through `pg_net`: **HTTP 200**, wrote nudge #1, rendered flyer HTML,
  logged to `agentlogs`.
- **Idempotency:** a second identical run returned 200 and left the counts
  unchanged — 1 nudge, 1 event, 1 flyer, still version 1. A cron that
  duplicates a notification every morning is worse than no cron.

## What it does NOT do yet

**Push delivery.** VAPID signing needs its own implementation in Deno and the
keys are not configured. Nudges are still written with `status: 'pending'` and
`channel: ''`, so nothing is lost — they are visible in `sofa_nudges` and a
sender can pick them up later.

Copy generation is also deliberately absent: this path is fully deterministic,
so a scheduled run can never invent a fact into a flyer.

## Security note

Deployed with `verify_jwt: false`, matching most existing functions in this
project. `POST` is guarded **only if** `SOFA_SCAN_SECRET` is set as a function
env var — it currently is not, so anyone with the URL can trigger a scan.

The blast radius is small (idempotent, writes only agent-owned tables, reads
nothing sensitive out), but set the secret when convenient and add the header
to the cron job:

```sql
select cron.unschedule('sofa-jcc-daily-scan');
select cron.schedule('sofa-jcc-daily-scan', '30 14 * * *', $$
  select net.http_post(
    url     := 'https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/sofa-jcc-scan',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer ' || '<SOFA_SCAN_SECRET>'),
    body    := jsonb_build_object('action','scan'),
    timeout_milliseconds := 55000);
$$);
```

## Redeploying

Change `src/lib/sofa/*`, merge to `main`, then redeploy this function with the
new commit SHA in both import URLs.
