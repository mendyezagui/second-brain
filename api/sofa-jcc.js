// /api/sofa-jcc — the SoFa JCC associate's server side.
//
//   GET  /api/sofa-jcc                 -> dry run: what it WOULD do, no writes
//   POST { action: "scan" }            -> run the daily scan (idempotent)
//   POST { action: "research_speaker", speaker_id | name }
//   POST { action: "render", event_id } -> (re)render a flyer's HTML
//
// The daily scan is also invoked in-process by api/sweep.js — the Vercel
// Hobby plan allows only two cron entries and both are already spent, so this
// rides the existing 6:30am sweep rather than asking for a third.
//
// Autonomy rails, matching docs/proactive-orchestrator-spec.md §5:
//   auto-allowed : create/refresh event rows, draft flyers, write nudges,
//                  send a push to Mendy's own devices.
//   never        : publish a flyer, post anywhere public, email the
//                  community, delete an event Mendy created.

import { createClient } from "@supabase/supabase-js";
import { sendPush } from "./_push.js";
import { planDay, renderFor, templateFor } from "../src/lib/sofa/agent.js";
import { computeGaps, flyerStatus, missingSentence } from "../src/lib/sofa/gaps.js";
import { handoffPrompt, ordersForFlyers } from "../src/lib/sofa/dev.js";
import { isoDate } from "../src/lib/sofa/hebcal.js";

// Web search for speaker research can exceed the default budget.
export const config = { maxDuration: 60 };

const db = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const GEONAMEID = process.env.SOFA_HEBCAL_GEONAMEID || undefined;

async function callClaude(system, user, { maxTokens = 900, tools } = {}) {
  if (!process.env.ANTHROPIC_API_KEY) return "";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
      ...(tools ? { tools } : {}),
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text).join("\n").trim();
}

const log = (sb, type, message, priority = "medium") =>
  sb.from("agentlogs").select("id").order("id", { ascending: false }).limit(1)
    .then(({ data }) => sb.from("agentlogs").insert({
      id: ((data && data[0] && data[0].id) || 0) + 1,
      agent: "SoFa JCC", type, message,
      ts: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/New_York" }),
      priority,
    }))
    .catch(() => {});

// ------------------------------------------------------------------
// The daily scan. Exported so api/sweep.js can call it directly.
// ------------------------------------------------------------------
export async function runSofaScan({ today = isoDate(), dryRun = false, sb = db() } = {}) {
  const [events, flyers, nudges, speakers] = await Promise.all([
    sb.from("sofa_events").select("*"),
    sb.from("sofa_flyers").select("*"),
    sb.from("sofa_nudges").select("dedupe_key"),
    sb.from("sofa_speakers").select("*"),
  ]);

  const speakersById = Object.fromEntries((speakers.data || []).map((s) => [s.id, s]));
  const plan = await planDay({
    today,
    existingEvents: events.data || [],
    existingFlyers: flyers.data || [],
    sentNudgeKeys: (nudges.data || []).map((n) => n.dedupe_key),
    speakersById,
    geonameid: GEONAMEID,
  });

  if (dryRun) return { ...plan, dryRun: true, applied: null };

  const applied = { events: 0, flyers: 0, nudges: 0, pushed: 0, pushErrors: [] };
  const eventIdByKey = new Map((events.data || []).filter((e) => e.hebcal_key).map((e) => [e.hebcal_key, e.id]));

  // 1. Event rows. Upsert on hebcal_key so a re-run updates in place.
  for (const u of plan.upserts) {
    const { reason, ...row } = u;
    const { data, error } = await sb.from("sofa_events")
      .upsert({ ...row, modified_by: "agent:sofa-jcc", modified_at: new Date().toISOString() }, { onConflict: "hebcal_key" })
      .select("id,hebcal_key").maybeSingle();
    if (!error && data) { eventIdByKey.set(data.hebcal_key, data.id); applied.events++; }
  }

  // 2. Flyer drafts. Copy is written by Claude when a key is present, but the
  //    deterministic copy from the core is already in hand — a failed model
  //    call degrades to a correct, plainer flyer rather than to nothing.
  const allEvents = (await sb.from("sofa_events").select("*")).data || [];
  const eventById = Object.fromEntries(allEvents.map((e) => [e.id, e]));

  for (const d of plan.drafts) {
    const eventId = d.event_id ?? eventIdByKey.get(d.event_key);
    if (!eventId) continue;
    const ev = eventById[eventId];
    if (!ev) continue;
    const speaker = ev.speaker_id ? speakersById[ev.speaker_id] : null;

    let copy = d.copy;
    if (copy && process.env.ANTHROPIC_API_KEY) {
      const improved = await callClaude(
        [
          "You write flyer copy for SoFa Jewish Community Center, a warm Chabad shul in South Florida.",
          "House voice: warm, plain, welcoming to someone with no background. Never salesy, never ornate.",
          "HARD RULES: invent no facts. Do not state a time, price, address, phone number or name that is not given to you.",
          "The description is at most two sentences.",
          'Reply as JSON only: {"headline":"","subhead":"","body":""}',
          "headline <= 34 chars. subhead <= 78 chars. Keep the holiday's real name in the headline.",
        ].join("\n"),
        `Event: ${JSON.stringify({ title: ev.title, date: ev.event_date, hebrew_date: ev.hebrew_date, notes: ev.notes, description: ev.description })}\n` +
        `Current copy: ${JSON.stringify(copy)}\n` +
        (speaker ? `Speaker: ${JSON.stringify({ name: speaker.name, title: speaker.title, org: speaker.org, bio: speaker.short_bio })}\n` : "") +
        "Improve the copy within the rules.",
        { maxTokens: 500 }
      );
      try {
        const m = improved.match(/\{[\s\S]*\}/);
        if (m) copy = { ...copy, ...JSON.parse(m[0]) };
      } catch { /* keep deterministic copy */ }
    }

    const flyerRow = {
      event_id: eventId,
      template: d.template,
      version: d.version,
      status: d.status,
      missing: d.gaps,
      modified_by: "agent:sofa-jcc",
      modified_at: new Date().toISOString(),
      ...(copy ? { headline: copy.headline, subhead: copy.subhead, body: copy.body, footer: copy.footer } : {}),
    };
    flyerRow.html = renderFor(ev, { ...flyerRow, ...(copy || {}) }, speaker);

    if (d.flyer_id) await sb.from("sofa_flyers").update(flyerRow).eq("id", d.flyer_id);
    else await sb.from("sofa_flyers").insert(flyerRow);
    applied.flyers++;
  }

  // 3. Nudges + push. The row is written BEFORE the push is attempted, so a
  //    push failure never causes the same nudge to fire twice tomorrow.
  for (const n of plan.nudges) {
    const eventId = n.event_id ?? eventIdByKey.get(n.event_key);
    const { reason, gaps, event_key, ...row } = n;
    const { data: inserted, error } = await sb.from("sofa_nudges")
      .insert({ ...row, event_id: eventId ?? null, status: "pending", modified_by: "agent:sofa-jcc" })
      .select("id").maybeSingle();
    // Unique violation on dedupe_key = already fired. Correct, not an error.
    if (error) continue;
    applied.nudges++;

    const result = await sendPush({
      title: n.title,
      body: n.body,
      url: n.url,
      tag: `sofa-${n.event_key}`,
      renotify: true,
      severity: n.severity,
      data: { event_id: eventId ?? null, nudge_id: inserted?.id ?? null },
    }, { db: sb });

    await sb.from("sofa_nudges").update({
      status: result.ok ? "sent" : "failed",
      channel: result.ok ? "webpush" : "none",
      push_result: result,
      sent_at: result.ok ? new Date().toISOString() : null,
    }).eq("id", inserted.id);

    if (result.ok) applied.pushed += result.sent;
    else applied.pushErrors.push(result.reason || (result.errors || []).join("; "));
  }

  // 4. Hand work to the developer associate. Only flyers with no gaps left
  //    become work orders — a half-finished flyer is the business associate's
  //    problem, not the developer's. dedupe_key stops a re-scan re-raising it.
  const { data: existingOrders } = await sb.from("sofa_work_orders").select("dedupe_key");
  const { data: currentFlyers } = await sb.from("sofa_flyers").select("*");
  const orders = ordersForFlyers(currentFlyers || [], eventById, {
    existingKeys: (existingOrders || []).map((o) => o.dedupe_key),
  });
  applied.workOrders = 0;
  for (const o of orders) {
    const row = { ...o, handoff_prompt: handoffPrompt(o), modified_by: "agent:sofa-jcc" };
    const { error } = await sb.from("sofa_work_orders").insert(row);
    if (!error) applied.workOrders++;
  }

  await log(
    sb, "daily-scan",
    `${plan.summary} · applied ${applied.events} event(s), ${applied.flyers} flyer(s), ${applied.nudges} nudge(s), ${applied.pushed} push(es), ${applied.workOrders} work order(s).` +
    (applied.pushErrors.length ? ` Push issues: ${applied.pushErrors.join("; ")}` : ""),
    plan.nudges.some((n) => n.severity === "high") ? "high" : "medium"
  );

  return { ...plan, applied };
}

// ------------------------------------------------------------------
// Quick create — free text in, an event + a drafted flyer out.
//
// This is the "just tell it what you need" path. Extraction is held to the
// same rule as everything else: it may only pull out what the text actually
// says. Anything absent stays empty and becomes a gap, so a vague sentence
// produces a flyer that ASKS rather than one that invents a 7:30pm start.
//
// A date is the one hard requirement — sofa_events.event_date is NOT NULL and
// a flyer without a date is not a flyer — so when none can be read from the
// text this returns needs:["date"] rather than guessing one.
// ------------------------------------------------------------------
export async function quickCreate({ text, today = isoDate(), sb = db() }) {
  if (!text || !text.trim()) return { ok: false, reason: "Describe the event first." };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: "ANTHROPIC_API_KEY not set." };

  const raw = await callClaude(
    [
      "You turn a plain-English description of a shul event into structured fields for a flyer.",
      `Today is ${today}. Resolve relative dates ("this Friday", "next Sunday") against it and output YYYY-MM-DD.`,
      "HARD RULES:",
      "- Extract ONLY what the text states. If a field is not stated, return an empty string. Never guess.",
      "- Never invent a time, address, venue, price, phone number, or a person's name or title.",
      "- If no date can be determined at all, set event_date to \"\".",
      "- kind is \"speaker\" only if a named guest speaker is mentioned, else \"holiday\" for a Yom Tov / festival, else \"weekly\".",
      "- occasion is the short eyebrow line, e.g. \"Friday Night\" or \"Chanukah\". title is what the event is called.",
      'Reply as JSON only: {"title":"","kind":"","event_date":"","start_time":"","end_time":"","location":"","address":"","occasion":"","description":"","audience":"","rsvp_url":"","speaker_name":"","speaker_title":"","speaker_org":""}',
    ].join("\n"),
    text.trim(),
    { maxTokens: 700 },
  );

  let f = {};
  try { const m = raw.match(/\{[\s\S]*\}/); if (m) f = JSON.parse(m[0]); } catch { /* below */ }
  if (!f.title && !f.event_date) return { ok: false, reason: "Could not read an event out of that. Try naming what it is and when." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.event_date || "")) {
    return { ok: false, needs: ["date"], reason: "I need a date — say when it is and I'll take the rest from here.", extracted: f };
  }

  // A named speaker becomes a roster row so the research step can enrich it.
  let speaker = null;
  if (f.speaker_name) {
    const { data: existing } = await sb.from("sofa_speakers").select("*").ilike("name", f.speaker_name).maybeSingle();
    if (existing) speaker = existing;
    else {
      const { data } = await sb.from("sofa_speakers").insert({
        name: f.speaker_name, title: f.speaker_title || "", org: f.speaker_org || "",
        research_status: "pending", modified_by: "agent:sofa-jcc",
      }).select("*").maybeSingle();
      speaker = data;
    }
  }

  const kind = speaker ? "speaker" : (["holiday", "weekly", "speaker"].includes(f.kind) ? f.kind : "special");
  const { data: ev, error } = await sb.from("sofa_events").insert({
    title: f.title || "Untitled event",
    kind,
    event_date: f.event_date,
    start_time: f.start_time || "",
    end_time: f.end_time || "",
    location: f.location || "",
    address: f.address || "",
    occasion: f.occasion || "",
    description: f.description || "",
    audience: f.audience || "",
    rsvp_url: f.rsvp_url || "",
    speaker_id: speaker?.id || null,
    status: "draft",
    source: "manual:quick-create",
    modified_by: "mendy",
  }).select("*").maybeSingle();
  if (error) return { ok: false, reason: error.message };

  const template = templateFor(ev);
  const gaps = computeGaps(ev, { speaker, template });
  const status = flyerStatus(gaps);
  const html = renderFor(ev, {}, speaker);

  const { data: flyer } = await sb.from("sofa_flyers").insert({
    event_id: ev.id, template, version: 1, status,
    headline: ev.title, body: ev.description || "", html, missing: gaps,
    modified_by: "agent:sofa-jcc",
  }).select("*").maybeSingle();

  await log(sb, "quick-create", `Created "${ev.title}" (${ev.event_date}) from a plain-text ask — ${status}.`);

  return {
    ok: true, event: ev, flyer, speaker, status,
    missing: gaps, summary: missingSentence(gaps),
    researchSuggested: !!speaker && speaker.research_status === "pending",
  };
}

// ------------------------------------------------------------------
// Speaker research. Mendy gives a name; this fills in the rest.
// Web search is mandatory — an unverified bio on a printed flyer is worse
// than a blank one, so anything unfound stays empty and becomes a gap.
// ------------------------------------------------------------------
export async function researchSpeaker({ speaker_id, name, hint = "", sb = db() }) {
  let speaker = null;
  if (speaker_id) {
    const { data } = await sb.from("sofa_speakers").select("*").eq("id", speaker_id).maybeSingle();
    speaker = data;
  }
  const who = name || speaker?.name;
  if (!who) return { ok: false, reason: "no speaker name given" };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "ANTHROPIC_API_KEY not set — cannot research" };
  }

  const text = await callClaude(
    [
      "You research guest speakers for a Chabad community center so their flyer is accurate.",
      "You have a web_search tool. You MUST use it. Report ONLY what a real search result supports.",
      "If you cannot verify a field, return an empty string for it. Never guess a title, an affiliation, or a book.",
      "If more than one person shares the name and you cannot tell which, set confidence to \"ambiguous\" and explain in notes.",
      'Reply as JSON only: {"title":"","org":"","short_bio":"","topic":"","links":[{"label":"","url":""}],"notes":"","confidence":"high|low|ambiguous","source_urls":[""]}',
      "short_bio: at most 220 characters, third person, factual, flyer-ready.",
    ].join("\n"),
    `Speaker name: ${who}\n${hint ? `Context from Mendy: ${hint}\n` : ""}Research this person.`,
    { maxTokens: 1600, tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }] }
  );

  let found = {};
  try { const m = text.match(/\{[\s\S]*\}/); if (m) found = JSON.parse(m[0]); } catch { /* below */ }

  const verified = found.confidence === "high";
  const row = {
    name: who,
    title: found.title || speaker?.title || "",
    org: found.org || speaker?.org || "",
    topic: found.topic || speaker?.topic || "",
    short_bio: found.short_bio || speaker?.short_bio || "",
    bio: found.short_bio || speaker?.bio || "",
    links: found.links || [],
    source_urls: found.source_urls || [],
    research_notes: [found.notes, found.confidence ? `confidence: ${found.confidence}` : ""].filter(Boolean).join(" · "),
    research_status: verified ? "researched" : found.short_bio ? "researched" : "failed",
    researched_at: new Date().toISOString(),
    modified_by: "agent:sofa-jcc",
    modified_at: new Date().toISOString(),
  };

  const { data, error } = speaker
    ? await sb.from("sofa_speakers").update(row).eq("id", speaker.id).select("*").maybeSingle()
    : await sb.from("sofa_speakers").insert(row).select("*").maybeSingle();
  if (error) return { ok: false, reason: error.message };

  await log(sb, "speaker-research",
    `Researched "${who}" — ${row.research_status}${found.confidence ? ` (${found.confidence})` : ""}.`,
    found.confidence === "ambiguous" ? "high" : "medium");

  return { ok: true, speaker: data, confidence: found.confidence || "low", needsConfirmation: !verified };
}

// ------------------------------------------------------------------
export default async function handler(req, res) {
  // Guard writes the same way api/sweep.js does.
  const secret = process.env.CRON_SECRET;
  const authed = !secret || (req.headers["authorization"] || "") === `Bearer ${secret}`;

  try {
    if (req.method === "GET") {
      const plan = await runSofaScan({ dryRun: true });
      return res.status(200).json(plan);
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!authed) return res.status(401).json({ error: "Unauthorized" });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (body.action === "scan") {
      return res.status(200).json(await runSofaScan({ today: body.today }));
    }
    if (body.action === "quick_create") {
      return res.status(200).json(await quickCreate({ text: body.text, today: body.today }));
    }
    if (body.action === "research_speaker") {
      return res.status(200).json(await researchSpeaker(body));
    }
    if (body.action === "render") {
      const sb = db();
      const { data: ev } = await sb.from("sofa_events").select("*").eq("id", body.event_id).maybeSingle();
      if (!ev) return res.status(404).json({ error: "event not found" });
      const { data: sp } = ev.speaker_id
        ? await sb.from("sofa_speakers").select("*").eq("id", ev.speaker_id).maybeSingle()
        : { data: null };
      const { data: fl } = await sb.from("sofa_flyers").select("*").eq("event_id", ev.id)
        .order("version", { ascending: false }).limit(1).maybeSingle();
      const gaps = computeGaps(ev, { speaker: sp, template: templateFor(ev), answers: fl?.answers || {} });
      const html = renderFor(ev, fl || {}, sp, { canvas: body.canvas || "portrait" });
      if (fl) await sb.from("sofa_flyers").update({ html, missing: gaps, status: flyerStatus(gaps) }).eq("id", fl.id);
      return res.status(200).json({ ok: true, html, missing: gaps, status: flyerStatus(gaps), summary: missingSentence(gaps) });
    }
    return res.status(400).json({ error: "unknown action" });
  } catch (err) {
    console.error("sofa-jcc error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
