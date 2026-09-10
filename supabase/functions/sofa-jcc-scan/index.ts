// SoFa JCC associate — the daily scan, running next to its own data.
//
// Why this exists as an Edge Function rather than only as a Vercel route:
// the app is served from Cloudflare Pages at 2nd.mendyezagui.com, where the
// Vercel-format api/*.js files do not run at all. Putting the scan here makes
// the agent host-independent — it drafts flyers and records nudges whether or
// not any frontend is deployed, and pg_cron can drive it without Vercel.
//
// The logic is NOT duplicated. These imports are the exact same modules the
// browser console runs, pinned to a commit so a deploy is reproducible and a
// later push to main cannot silently change what the cron executes.
//
//   POST { action: "scan", dry_run?: bool, today?: "YYYY-MM-DD" }
//   GET  -> dry run, writes nothing
//
// Guarded by SOFA_SCAN_SECRET when set (Bearer). Push notification delivery
// is deliberately NOT here yet — VAPID signing needs its own implementation
// and the keys are not configured. Nudges are still written, so nothing is
// lost; they simply sit as `pending` until a sender picks them up.
//
// Deployed with: mcp Supabase deploy_edge_function (project xwacfwagyhgbbhefecdt)
// Scheduled by:  cron job 'sofa-jcc-daily-scan', 30 14 * * * (matches vercel.json)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { planDay, renderFor } from "https://raw.githubusercontent.com/mendyezagui/second-brain/e62a88f91a55900394eb744d960b1960a17ec357/src/lib/sofa/agent.js";
import { isoDate } from "https://raw.githubusercontent.com/mendyezagui/second-brain/e62a88f91a55900394eb744d960b1960a17ec357/src/lib/sofa/hebcal.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

async function log(sb: any, type: string, message: string, priority = "medium") {
  try {
    const { data } = await sb.from("agentlogs").select("id").order("id", { ascending: false }).limit(1);
    await sb.from("agentlogs").insert({
      id: ((data?.[0]?.id) || 0) + 1,
      agent: "SoFa JCC",
      type,
      message,
      ts: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles" }),
      priority,
    });
  } catch (_) { /* logging must never fail the scan */ }
}

async function runScan({ today = isoDate(), dryRun = false }) {
  const sb = admin();

  const [events, flyers, nudges, speakers] = await Promise.all([
    sb.from("sofa_events").select("*"),
    sb.from("sofa_flyers").select("*"),
    sb.from("sofa_nudges").select("dedupe_key"),
    sb.from("sofa_speakers").select("*"),
  ]);

  const speakersById = Object.fromEntries((speakers.data || []).map((s: any) => [s.id, s]));
  const plan = await planDay({
    today,
    existingEvents: events.data || [],
    existingFlyers: flyers.data || [],
    sentNudgeKeys: (nudges.data || []).map((n: any) => n.dedupe_key),
    speakersById,
    geonameid: Deno.env.get("SOFA_HEBCAL_GEONAMEID") || undefined,
  });

  if (dryRun) return { ...plan, dryRun: true, applied: null };

  const applied = { events: 0, flyers: 0, nudges: 0 };
  const idByKey = new Map<string, number>(
    (events.data || []).filter((e: any) => e.hebcal_key).map((e: any) => [e.hebcal_key, e.id]),
  );

  // 1. Event rows, upserted on hebcal_key so a re-run updates in place.
  for (const u of plan.upserts) {
    const { reason: _reason, ...row } = u as any;
    const { data, error } = await sb
      .from("sofa_events")
      .upsert({ ...row, modified_by: "agent:sofa-jcc", modified_at: new Date().toISOString() }, { onConflict: "hebcal_key" })
      .select("id,hebcal_key")
      .maybeSingle();
    if (!error && data) { idByKey.set(data.hebcal_key, data.id); applied.events++; }
  }

  const allEvents = (await sb.from("sofa_events").select("*")).data || [];
  const eventById = Object.fromEntries(allEvents.map((e: any) => [e.id, e]));

  // 2. Flyer drafts. Copy stays deterministic here — this path never calls a
  //    model, so a scan can never invent a fact into a flyer.
  for (const d of plan.drafts as any[]) {
    const eventId = d.event_id ?? idByKey.get(d.event_key);
    if (!eventId) continue;
    const ev = eventById[eventId];
    if (!ev) continue;
    const speaker = ev.speaker_id ? speakersById[ev.speaker_id] : null;
    const copy = d.copy;

    const row: Record<string, unknown> = {
      event_id: eventId,
      template: d.template,
      version: d.version,
      status: d.status,
      missing: d.gaps,
      modified_by: "agent:sofa-jcc",
      modified_at: new Date().toISOString(),
      ...(copy ? { headline: copy.headline, subhead: copy.subhead, body: copy.body, footer: copy.footer } : {}),
    };
    try { row.html = renderFor(ev, { ...row, ...(copy || {}) }, speaker); } catch (_) { /* html is optional */ }

    if (d.flyer_id) await sb.from("sofa_flyers").update(row).eq("id", d.flyer_id);
    else await sb.from("sofa_flyers").insert(row);
    applied.flyers++;
  }

  // 3. Nudges. dedupe_key is unique, so a re-run is a no-op rather than a
  //    second notification for the same event on the same lead day.
  for (const n of plan.nudges as any[]) {
    const eventId = n.event_id ?? idByKey.get(n.event_key);
    const { reason: _r, gaps: _g, event_key: _k, ...row } = n;
    const { error } = await sb.from("sofa_nudges").insert({
      ...row,
      event_id: eventId ?? null,
      status: "pending",
      channel: "",
      modified_by: "agent:sofa-jcc",
    });
    if (!error) applied.nudges++;
  }

  await log(
    sb,
    "daily-scan",
    `${plan.summary} · applied ${applied.events} event(s), ${applied.flyers} flyer(s), ${applied.nudges} nudge(s). [edge]`,
    plan.nudges.some((n: any) => n.severity === "high") ? "high" : "medium",
  );

  return { ...plan, applied };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  try {
    if (req.method === "GET") return json(await runScan({ dryRun: true }));

    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Only writes are guarded; the dry run is harmless and useful for checking.
    const secret = Deno.env.get("SOFA_SCAN_SECRET");
    if (secret && (req.headers.get("authorization") || "") !== `Bearer ${secret}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    return json(await runScan({ today: body.today, dryRun: !!body.dry_run }));
  } catch (err) {
    console.error("sofa-jcc-scan failed:", err);
    return json({ error: String(err) }, 500);
  }
});
