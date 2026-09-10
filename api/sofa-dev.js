// /api/sofa-dev — the SoFa Developer Associate.
//
//   GET                          -> the queue + summary
//   POST { action:"raise", ... } -> create a work order (business associate or Mendy)
//   POST { action:"spec", id }   -> turn a plain request into a precise build spec
//   POST { action:"build", id }  -> build what can be built in-app
//   POST { action:"handoff", id }-> regenerate the standalone repo brief
//   POST { action:"status", id, status, result }
//
// What it does NOT do: push to sofajcc.org. It holds no GitHub credential by
// design. For repo work it produces a brief precise enough to run unattended —
// see docs/sofa-jcc/DEVELOPER.md for what full autonomy would need.

import { createClient } from "@supabase/supabase-js";
import { blankWorkOrder, handoffPrompt, pathsFor, queueSummary, WORK_KINDS } from "../src/lib/sofa/dev.js";
import { renderFlyer } from "../src/lib/sofa/templates.js";
import { renderFor, templateFor } from "../src/lib/sofa/agent.js";

export const config = { maxDuration: 60 };

const db = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function callClaude(system, user, maxTokens = 1400) {
  if (!process.env.ANTHROPIC_API_KEY) return "";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  return (data.content || []).filter((b) => b?.type === "text").map((b) => b.text).join("\n").trim();
}

/** Write the build spec. Deliberately narrow: it plans, it does not invent scope. */
async function specify(order, sb) {
  const kind = WORK_KINDS[order.kind] || WORK_KINDS.other;
  const text = await callClaude(
    [
      "You are the SoFa JCC developer associate. You turn a plain request from the shul's business associate into a precise build spec for whoever implements it.",
      "The site is a static folder `sofajcc/` — plain HTML/CSS, no framework, no build step, deployed to Cloudflare Pages.",
      "Brand values are locked in src/lib/sofa/brand.js. Never propose new colours, fonts or logos.",
      "HARD RULES: do not add scope. Do not invent facts, times, addresses or names. If the request is missing something you need, list it under BLOCKED instead of guessing.",
      'Reply as JSON only: {"spec":"markdown build steps","acceptance":["testable statement", ...],"blocked":["what is missing", ...]}',
      "spec: at most 10 short steps, each naming the file it touches.",
    ].join("\n"),
    `Work order kind: ${order.kind} — ${kind.blurb}\nTarget: ${order.target_repo || "in-app"} ${order.target_path || ""}\n\nRequest:\n${order.request}\n\nTitle: ${order.title}`,
  );
  let out = {};
  try { const m = text.match(/\{[\s\S]*\}/); if (m) out = JSON.parse(m[0]); } catch { /* fall through */ }

  const patch = {
    spec: out.spec || "",
    acceptance: out.acceptance || [],
    // Blocked beats ready: an order missing a fact must not look runnable.
    status: (out.blocked || []).length ? "blocked" : out.spec ? "ready" : "queued",
    result: (out.blocked || []).length ? `Blocked — missing: ${out.blocked.join("; ")}` : "",
    modified_by: "agent:sofa-dev",
    modified_at: new Date().toISOString(),
  };
  patch.handoff_prompt = handoffPrompt({ ...order, ...patch });
  const { data } = await sb.from("sofa_work_orders").update(patch).eq("id", order.id).select("*").maybeSingle();
  return { ok: true, order: data, blocked: out.blocked || [] };
}

/** Build the things that genuinely can be finished inside Second Brain. */
async function build(order, sb) {
  const kind = WORK_KINDS[order.kind] || WORK_KINDS.other;
  if (!kind.buildable) {
    return { ok: false, reason: `"${kind.label}" needs a repo. Use the handoff brief.`, handoff: order.handoff_prompt };
  }

  let html = "";
  if (order.kind === "label_sheet") {
    html = renderFlyer("label", { label: { dedication_he: order.request || "", count: 4 } });
  } else if (order.kind === "flyer_publish" && order.event_id) {
    const { data: ev } = await sb.from("sofa_events").select("*").eq("id", order.event_id).maybeSingle();
    if (!ev) return { ok: false, reason: "event not found" };
    const { data: sp } = ev.speaker_id
      ? await sb.from("sofa_speakers").select("*").eq("id", ev.speaker_id).maybeSingle() : { data: null };
    const { data: fl } = await sb.from("sofa_flyers").select("*").eq("event_id", ev.id)
      .order("version", { ascending: false }).limit(1).maybeSingle();
    html = renderFor(ev, fl || {}, sp);
  } else if (order.kind === "content") {
    const copy = await callClaude(
      [
        "You write copy for Beis Chacham Yitzchak, known as The SoFa Jewish Community Center, a warm Chabad shul in Los Angeles.",
        "House voice: warm, plain, unpretentious, welcoming to someone with no background. Never salesy, never ornate.",
        "Invent no facts — no time, price, address, phone number or name that you were not given.",
        "Return the copy only. No preamble, no options, no commentary.",
      ].join("\n"),
      order.request, 900,
    );
    html = copy;
  } else {
    return { ok: false, reason: `Nothing to build for kind "${order.kind}" without more input.` };
  }

  const { data } = await sb.from("sofa_work_orders").update({
    artifact_html: html,
    status: "done",
    result: `Built in-app (${kind.label}).`,
    modified_by: "agent:sofa-dev",
    modified_at: new Date().toISOString(),
  }).eq("id", order.id).select("*").maybeSingle();
  return { ok: true, order: data, artifact_html: html };
}

const get = async (sb, id) =>
  (await sb.from("sofa_work_orders").select("*").eq("id", id).maybeSingle()).data;

export default async function handler(req, res) {
  const sb = db();
  const secret = process.env.CRON_SECRET;
  const authed = !secret || (req.headers["authorization"] || "") === `Bearer ${secret}`;

  try {
    if (req.method === "GET") {
      const { data } = await sb.from("sofa_work_orders").select("*").order("id", { ascending: false });
      return res.status(200).json({ orders: data || [], summary: queueSummary(data || []), kinds: WORK_KINDS });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!authed) return res.status(401).json({ error: "Unauthorized" });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (body.action === "raise") {
      const order = blankWorkOrder({
        ...body.order,
        ...pathsFor(body.order?.kind || "other"),
        requested_by: body.order?.requested_by || "mendy",
      });
      order.handoff_prompt = handoffPrompt(order);
      const { data, error } = await sb.from("sofa_work_orders").insert(order).select("*").maybeSingle();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true, order: data });
    }
    if (body.action === "spec")    return res.status(200).json(await specify(await get(sb, body.id), sb));
    if (body.action === "build")   return res.status(200).json(await build(await get(sb, body.id), sb));
    if (body.action === "handoff") {
      const o = await get(sb, body.id);
      const prompt = handoffPrompt(o);
      await sb.from("sofa_work_orders").update({ handoff_prompt: prompt }).eq("id", o.id);
      return res.status(200).json({ ok: true, handoff_prompt: prompt });
    }
    if (body.action === "status") {
      const { data } = await sb.from("sofa_work_orders")
        .update({ status: body.status, result: body.result ?? undefined, modified_at: new Date().toISOString() })
        .eq("id", body.id).select("*").maybeSingle();
      return res.status(200).json({ ok: true, order: data });
    }
    return res.status(400).json({ error: "unknown action" });
  } catch (err) {
    console.error("sofa-dev error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
