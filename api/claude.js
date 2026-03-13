// api/claude.js — Vercel Serverless Function
// Proxies Anthropic API calls so the key stays server-side
// Deploy at: /api/claude  (Vercel auto-routes files in /api/)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: restrict to your own domain in production
  const origin = req.headers.origin || "";
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && origin !== allowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        // MCP header forwarded if present (for Gmail scan)
        ...(req.body?.mcp_servers ? { "anthropic-beta": "mcp-client-2025-04-04" } : {}),
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Claude proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
