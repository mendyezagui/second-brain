// api/datadog.js — read-only proxy that surfaces DataDog monitor status inside Second Brain.
// The DataDog API/APP keys live ONLY here (server-side); they are never shipped to the browser.
// Env (set in Vercel project settings):
//   DD_API_KEY   - DataDog API key
//   DD_APP_KEY   - DataDog Application key (scope it to monitors_read if possible)
//   DD_SITE      - optional, defaults to us5.datadoghq.com
// redeploy trigger: 2026-06-22 (rebuild to pick up DD_* env vars)

const SITE = process.env.DD_SITE || "us5.datadoghq.com";

export default async function handler(req, res) {
  const apiKey = process.env.DD_API_KEY;
  const appKey = process.env.DD_APP_KEY;
  if (!apiKey || !appKey) {
    return res.status(200).json({ ok: false, configured: false, error: "DataDog keys not set (DD_API_KEY / DD_APP_KEY)." });
  }
  try {
    const r = await fetch(`https://api.${SITE}/api/v1/monitor`, {
      headers: { "DD-API-KEY": apiKey, "DD-APPLICATION-KEY": appKey, Accept: "application/json" },
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(200).json({ ok: false, configured: true, error: `DataDog ${r.status}: ${text.slice(0, 200)}` });
    }
    const all = await r.json();
    const list = Array.isArray(all) ? all : [];
    // Only surface our Vantaca monitors — keeps the panel focused and avoids exposing unrelated org monitors.
    const monitors = list
      .filter((m) => /vantaca/i.test(m.name || ""))
      .map((m) => ({
        id: m.id,
        name: m.name,
        status: m.overall_state || "Unknown", // OK | Alert | Warn | No Data | Skipped
        type: m.type,
        message: String(m.message || "").split("@")[0].trim().slice(0, 200),
        last_triggered: m.overall_state_modified || null,
        url: `https://app.${SITE}/monitors/${m.id}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    // Small edge cache so repeated Refreshes don't hammer the DataDog API.
    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");
    return res.status(200).json({ ok: true, configured: true, site: SITE, count: monitors.length, monitors });
  } catch (e) {
    return res.status(200).json({ ok: false, configured: true, error: String(e).slice(0, 200) });
  }
}
