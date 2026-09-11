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
// THE PIN IS A MAINTENANCE STEP, NOT A SET-AND-FORGET. Twice now a fix landed
// on main while this function kept running the older commit — once leaving the
// wrong candle-lighting time in place. PINNED_SHA is therefore echoed in every
// response and in every agentlog line, so a stale pin is visible instead of
// silent. Compare it against origin/main whenever the scan looks wrong.
//
// The same hazard runs the other way, and bit us too: this file in the repo
// drifted BEHIND what was deployed, so a redeploy from the checkout would have
// silently reverted the zip override and the pin echo. Pull the live copy
// (Supabase MCP get_edge_function) before editing.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { planDay, renderFor } from "https://raw.githubusercontent.com/mendyezagui/second-brain/0abc8cbcb160afc3a633f58109eebfb3cd24bdd1/src/lib/sofa/agent.js";
import { isoDate } from "https://raw.githubusercontent.com/mendyezagui/second-brain/0abc8cbcb160afc3a633f58109eebfb3cd24bdd1/src/lib/sofa/hebcal.js";
import { ordersForFlyers, handoffPrompt } from "https://raw.githubusercontent.com/mendyezagui/second-brain/0abc8cbcb160afc3a633f58109eebfb3cd24bdd1/src/lib/sofa/dev.js";

// Keep in step with the three import URLs above.
const PINNED_SHA = "0abc8cbcb160afc3a633f58109eebfb3cd24bdd1";

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
    // agentlogs.id has a sequence; let Postgres allocate it. Computing
    // max(id)+1 by hand — what this used to do — does not advance the
    // sequence, so it sets up exactly the collision ops/resync_sequences.sh
    // exists to clean up after.
    await sb.from("agentlogs").insert({
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
    zip: Deno.env.get("SOFA_HEBCAL_ZIP") || undefined,
  });

  if (dryRun) return { ...plan, pinned_sha: PINNED_SHA, dryRun: true, applied: null };

  const applied = { events: 0, flyers: 0, nudges: 0, workOrders: 0 };
  const idByKey = new Map<string, number>(
    (events.data || []).filter((e: any) => e.hebcal_key).map((e: any) => [e.hebcal_key, e.id]),
  );

  // 1. Event rows, upserted on hebcal_key so a re-run updates in place.
  //    planDay already refuses to touch a candle time a human has confirmed;
  //    Hebcal's sunset model and the shul's luach do not agree, so the
  //    confirmation has to outrank the calculation.
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

  // 4. Hand finished work to the developer associate.
  //
  //    This step existed only in api/sofa-jcc.js — the Vercel path — and that
  //    path does not run: every daily-scan line in agentlogs is tagged [edge],
  //    and sofa_work_orders sat empty for the entire life of the pair. The
  //    developer associate was not idle, it was unreachable.
  //
  //    Only a flyer with no gaps left becomes an order; a half-finished flyer
  //    is the business associate's problem, not the developer's. dedupe_key
  //    keeps a re-scan from raising the same order twice.
  //
  //    It reads STORED flyers rather than the plan's drafts, because a flyer
  //    usually turns ready days after it was drafted — on a run that emits no
  //    draft for it at all.
  const { data: existingOrders } = await sb.from("sofa_work_orders").select("dedupe_key");
  // Re-read the flyers: step 2 has just written this morning's, and the ones
  // that turned ready on an earlier day are only visible in stored state.
  const { data: currentFlyers } = await sb.from("sofa_flyers").select("*");
  const orders = ordersForFlyers(currentFlyers || [], eventById, {
    existingKeys: (existingOrders || []).map((o: any) => o.dedupe_key),
  });
  for (const o of orders as any[]) {
    const { error } = await sb.from("sofa_work_orders")
      .insert({ ...o, handoff_prompt: handoffPrompt(o), modified_by: "agent:sofa-jcc" });
    if (!error) applied.workOrders++;
  }

  await log(
    sb,
    "daily-scan",
    `${plan.summary} · applied ${applied.events} event(s), ${applied.flyers} flyer(s), ` +
      `${applied.nudges} nudge(s), ${applied.workOrders} work order(s). [edge @ ${PINNED_SHA.slice(0, 8)}]`,
    plan.nudges.some((n: any) => n.severity === "high") ? "high" : "medium",
  );

  return { ...plan, pinned_sha: PINNED_SHA, applied };
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
