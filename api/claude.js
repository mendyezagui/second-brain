export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        ...(req.body?.mcp_servers ? { "anthropic-beta": "mcp-client-2025-04-04" } : {}),
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Proxy error" });
  }
}
