// api/content.js — Content Brain (LinkedIn draft-and-hold)
// Vercel cron: Mondays 15:00 UTC (~7-8 AM PT) — preps the week's drafts.
// Reads socialStrategy + recent posts + live signals → calls Claude →
// writes post DRAFTS to content_queue (status="draft"). NEVER posts anything.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role — server-side only
);

// How many drafts to generate per run, and the queue ceiling above which we
// skip (so unreviewed drafts don't pile up indefinitely).
const DRAFTS_PER_RUN = 3;
const QUEUE_CEILING = 6;

async function callClaude(system, user, max = 3000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: max,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message || "Claude error");
  return d.content?.[0]?.text || "";
}

function parseJsonArray(raw) {
  const stripped = String(raw || "").replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in model response");
  return JSON.parse(match[0]);
}

export default async function handler(req, res) {
  // Protect: only Vercel cron or requests carrying CRON_SECRET (mirrors api/sweep.js)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers["authorization"] || "";
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }
  const force = (req.query && (req.query.force === "1" || req.query.force === "true"));

  try {
    // ── Don't pile up: skip if there are already enough unreviewed drafts ──
    const { count: pendingCount } = await supabase
      .from("content_queue")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "pending"]);

    if (!force && (pendingCount || 0) >= QUEUE_CEILING) {
      return res.status(200).json({
        ok: true, skipped: true,
        reason: `${pendingCount} drafts already awaiting review (ceiling ${QUEUE_CEILING}). Append ?force=1 to override.`,
      });
    }

    // ── Pull grounding context ──
    const [strategyR, recentCalR, recentQueueR, newsR, dealsR, goalsR, instrR] = await Promise.all([
      supabase.from("socialStrategy").select("*").eq("platform", "LinkedIn").eq("status", "Active"),
      supabase.from("contentCalendar").select("videoTitle, track, caption, status").order("id", { ascending: false }).limit(12),
      supabase.from("content_queue").select("hook, pillar, status").order("id", { ascending: false }).limit(12),
      supabase.from("company_news").select("*").order("id", { ascending: false }).limit(10),
      supabase.from("deals").select("name, value, stage, probability, notes").order("id", { ascending: false }).limit(10),
      supabase.from("goals").select("name, target_value, unit, period, category, priority_order").eq("status", "active"),
      supabase.from("instructions").select("title, body").eq("active", true),
    ]);

    const strategy = (strategyR.data && strategyR.data[0]) || null;
    const recentCal = recentCalR.data || [];
    const recentQueue = recentQueueR.data || [];
    const news = newsR.data || [];
    const deals = dealsR.data || [];
    const goals = goalsR.data || [];
    const instructions = instrR.data || [];

    if (!strategy) {
      return res.status(200).json({ ok: false, error: "No active LinkedIn socialStrategy row found — cannot ground the content brain." });
    }

    // Voice exemplars: a few recent captions show the model how Mendy writes.
    const exemplars = recentCal
      .filter(c => c.caption && c.caption.trim())
      .slice(0, 4)
      .map((c, i) => `EXEMPLAR ${i + 1} — "${c.videoTitle}" [${c.track || "?"}]:\n${c.caption.trim()}`)
      .join("\n\n");

    // Avoid-repeat list: topics already drafted/published recently.
    const avoidList = [
      ...recentCal.map(c => c.videoTitle).filter(Boolean),
      ...recentQueue.map(q => q.hook).filter(Boolean),
    ].slice(0, 20).map(t => `- ${t}`).join("\n") || "(none yet)";

    const newsBlock = news.length
      ? news.map((n, i) => `${i + 1}. ${n.title || n.headline || "(untitled)"} — ${(n.summary || "").slice(0, 200)}`).join("\n")
      : "(no recent news rows)";

    const signalsBlock = [
      `RECENT INDUSTRY NEWS (real, from the CRM news engine):\n${newsBlock}`,
      `ACTIVE DEALS (for authentic, anonymized story fodder — never name clients):\n${deals.map(d => `- ${d.name} · ${d.stage} · ${(d.notes || "").slice(0, 120)}`).join("\n") || "(none)"}`,
      `MENDY'S GOALS (content should ladder toward these):\n${goals.sort((a,b)=>(a.priority_order??99)-(b.priority_order??99)).map(g => `- ${g.name} (${g.category})`).join("\n") || "(none)"}`,
      instructions.length ? `STANDING INSTRUCTIONS (override defaults):\n${instructions.map(i => `- ${i.title}: ${i.body}`).join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    const system = `You are Mendy Ezagui's Content Brain — you draft LinkedIn posts in HIS voice, not generic thought-leadership.

PLATFORM: ${strategy.platform}
AUDIENCE: ${strategy.audience}
TONE: ${strategy.tone}
RULES (follow strictly): ${strategy.rules}
CONTENT TRACKS: ${strategy.contentTracks}

VOICE MECHANICS (from his real posts):
- Contrarian or counterintuitive hook as the first line. No throat-clearing.
- Short lines, frequent line breaks, one idea per line. White space is the format.
- First-person, specific, story-driven. Proof over theory.
- Exactly one memorable, quotable "screenshot line" per post.
- Close with a tight takeaway, then 4-6 relevant hashtags.
- Kill clichés and corporate filler aggressively. Stay strictly in lane: AI for Sales & Revenue Ops. Never property management, never generic Salesforce admin.

You will be given exemplars of his actual writing — match that cadence and energy precisely.`;

    const user = `Here is how Mendy actually writes:\n\n${exemplars || "(no exemplars available — rely on the voice mechanics above)"}\n\n----\nLIVE SIGNALS TO DRAW FROM:\n\n${signalsBlock}\n\n----\nDO NOT REPEAT these recently-covered topics (pick fresh angles):\n${avoidList}\n\n----\nGenerate ${DRAFTS_PER_RUN} distinct LinkedIn post drafts. Each must be grounded in a real signal above (or a genuine RevOps/AI-in-sales insight), tied to one content track, and sound unmistakably like Mendy.

Return ONLY a valid JSON array, no markdown, no preamble:
[
  {
    "signal_source": "what prompted this post (a news item, a deal pattern, an insight)",
    "track": "Lead Leakage | AI in Sales Ops",
    "angle": "the specific take in one line",
    "why_now": "why this is timely this week",
    "risk_flag": "none | mild — note anything that could read as off-brand or risky",
    "hook": "the exact first line",
    "screenshot_line": "the one quotable line",
    "draft": "the FULL post text, line breaks as \\n, ending with hashtags",
    "voice_score": 0-100,
    "voice_notes": "honest self-assessment vs. his voice rules; what you'd tighten"
  }
]`;

    const raw = await callClaude(system, user, 3500);
    const items = parseJsonArray(raw);

    // ── Map to content_queue (status=draft). id is serial — omit it. ──
    const rows = items.slice(0, DRAFTS_PER_RUN).map(it => ({
      signal_source: String(it.signal_source || "").slice(0, 500),
      angle: String(it.angle || "").slice(0, 500),
      pillar: String(it.track || it.pillar || "").slice(0, 120),
      why_now: String(it.why_now || "").slice(0, 500),
      risk_flag: String(it.risk_flag || "none").slice(0, 200),
      platform: "LinkedIn",
      hook: String(it.hook || "").slice(0, 500),
      draft: String(it.draft || ""),
      status: "draft",
      voice_score: Number.isFinite(Number(it.voice_score)) ? Math.round(Number(it.voice_score)) : null,
      voice_notes: [
        it.screenshot_line ? `Screenshot line: ${it.screenshot_line}` : "",
        it.voice_notes || "",
      ].filter(Boolean).join("\n"),
    }));

    if (!rows.length) {
      return res.status(200).json({ ok: false, error: "Model returned no usable drafts." });
    }

    const { error: insErr } = await supabase.from("content_queue").insert(rows);
    if (insErr) throw new Error(`content_queue insert: ${insErr.message}`);

    // ── Log to agentlogs so it shows in the dashboard feed ──
    const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles" });
    const { data: lastLog } = await supabase.from("agentlogs").select("id").order("id", { ascending: false }).limit(1);
    const nextId = (lastLog?.[0]?.id || 0) + 1;
    const avg = Math.round(rows.reduce((a, r) => a + (r.voice_score || 0), 0) / rows.length);
    await supabase.from("agentlogs").insert([{
      id: nextId,
      agent: "Content Agent",
      type: "content-draft",
      message: `Drafted ${rows.length} LinkedIn posts for review (avg voice score ${avg}/100). Tracks: ${rows.map(r => r.pillar).join(", ")}. Review them in the content queue before scheduling.`,
      ts,
      priority: "medium",
    }]);

    return res.status(200).json({
      ok: true,
      drafted: rows.length,
      avg_voice_score: avg,
      tracks: rows.map(r => r.pillar),
    });

  } catch (err) {
    console.error("Content brain error:", err);
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
}
