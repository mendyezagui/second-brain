// api/news.js — daily real-news refresh (Vercel cron)
//
// Picks the companies whose news is stalest, asks Claude (with the web_search
// tool) for one genuinely recent, real article each, and writes them straight
// into the company_news table. Runs server-side so it isn't bound by the
// in-app "Scan" button's request timeout and can rotate through all companies
// a few at a time, day by day.
//
// Trigger: Vercel cron (see vercel.json) once per day. Can also be invoked
// manually for testing. If CRON_SECRET is set, manual calls must pass it as
// ?key=... or an Authorization: Bearer header; Vercel's own cron calls are
// always allowed.

import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 60 };

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const BATCH = 6;          // companies refreshed per daily run
const MAX_SEARCHES = 6;   // web searches per run (one per company)

export default async function handler(req, res) {
  // Auth — Vercel cron requests carry the x-vercel-cron header. If a CRON_SECRET
  // is configured, manual invocations must supply it; otherwise anyone could
  // trigger a (paid) web-search run.
  const secret = process.env.CRON_SECRET || "";
  const isVercelCron = !!req.headers["x-vercel-cron"];
  const provided =
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "") ||
    (req.query && req.query.key) ||
    "";
  if (secret && !isVercelCron && provided !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "Missing env vars: need VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and ANTHROPIC_API_KEY",
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  try {
    // 1) Find the stalest companies (those with the oldest / no news first).
    const [{ data: companies, error: cErr }, { data: news, error: nErr }] = await Promise.all([
      supabase.from("companies").select("id,name,news_keywords,status").neq("status", "parked"),
      supabase.from("company_news").select("id,companyId,created_at"),
    ]);
    if (cErr) throw cErr;
    if (nErr) throw nErr;

    const latestByCompany = {};
    for (const n of news || []) {
      const t = n.created_at || "";
      if (!latestByCompany[n.companyId] || t > latestByCompany[n.companyId]) {
        latestByCompany[n.companyId] = t;
      }
    }
    const ranked = (companies || [])
      .filter((c) => c.name)
      .sort((a, b) => (latestByCompany[a.id] || "").localeCompare(latestByCompany[b.id] || ""))
      .slice(0, BATCH);
    if (ranked.length === 0) {
      return res.status(200).json({ ok: true, inserted: 0, note: "No companies to refresh" });
    }

    // 2) Ask Claude (with web search) for one real, recent item per company.
    const companyList = ranked
      .map((c) => `${c.name}${c.news_keywords ? ` (keywords: ${c.news_keywords})` : ""}`)
      .join(", ");
    const system =
      `You are a News Intelligence Agent with a web_search tool. You MUST use web search, and only report news you can verify from a real, recent search result.\n` +
      `RULES:\n` +
      `- For each company in the list, find ONE genuinely recent (prefer the last 30 days) news item. If you cannot find a real recent item, skip that company.\n` +
      `- Use the EXACT company name from the list for "companyName" so it maps to the CRM.\n` +
      `- "published_date" must be the article's real date as YYYY-MM-DD.\n` +
      `- "source_url" must be the real article URL.\n` +
      `- "relevance_score" is 1-10 (business relevance for a consultant tracking this company).\n` +
      `- Never invent or guess. Return ONLY a JSON array of the form:\n` +
      `[{"companyName":"","headline":"","summary":"","relevance_score":5,"published_date":"","source_url":""}]`;
    const user = `Companies to research: ${companyList}`;

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system,
        messages: [{ role: "user", content: user }],
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES }],
      }),
    });
    const data = await anthropicResp.json();
    if (!anthropicResp.ok) {
      return res.status(502).json({ error: "Anthropic API error", detail: data });
    }

    const text = (data.content || [])
      .filter((b) => b && b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("\n");
    let items = [];
    try {
      const m = text.match(/\[[\s\S]*\]/);
      if (m) items = JSON.parse(m[0]);
    } catch {
      items = [];
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(200).json({ ok: true, inserted: 0, note: "No items returned by the model" });
    }

    // 3) Map results back to companies and build rows with fresh integer ids.
    const byName = {};
    for (const c of ranked) byName[c.name.toLowerCase()] = c;

    const { data: maxRow } = await supabase
      .from("company_news")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);
    let nextId = ((maxRow && maxRow[0] && maxRow[0].id) || 0) + 1;

    const todayIso = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const rows = [];
    for (const it of items) {
      const c = byName[String(it.companyName || "").toLowerCase()];
      if (!c || !it.headline) continue;
      rows.push({
        id: nextId++,
        companyId: c.id,
        headline: String(it.headline).slice(0, 500),
        source_url: it.source_url || "",
        summary: String(it.summary || "").slice(0, 2000),
        relevance_score: Math.max(1, Math.min(10, parseInt(it.relevance_score, 10) || 5)),
        published_date: it.published_date || todayIso,
        action_taken: false,
        taskId: null,
        created_at: todayIso,
        modified_by: "news-cron",
        modified_at: nowIso,
      });
    }
    if (rows.length === 0) {
      return res.status(200).json({ ok: true, inserted: 0, note: "No model items matched a tracked company" });
    }

    const { error: insErr } = await supabase.from("company_news").insert(rows);
    if (insErr) throw insErr;

    return res.status(200).json({
      ok: true,
      inserted: rows.length,
      companies: ranked.map((c) => c.name),
    });
  } catch (e) {
    console.error("news cron error:", e);
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
