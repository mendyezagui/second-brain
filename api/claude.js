// api/claude.js — Vercel Serverless Function
// Proxies Anthropic API calls so the key stays server-side.
// Deploy at: /api/claude  (Vercel auto-routes files in /api/)
//
// Special case: the in-app "News Engine" (system prompt = "News Intelligence
// Agent") is upgraded here to use Claude's server-side web_search tool, so it
// returns REAL, current news grounded in live search results instead of
// hallucinated articles. Every other Claude call passes through untouched.

// Web search + model latency can exceed the default 10s budget.
export const config = { maxDuration: 60 };

const NEWS_MARKER = "News Intelligence Agent";

// Appended to the News Engine's system prompt when web search is enabled.
const NEWS_AUGMENT = `

TOOLS: You have a web_search tool — you MUST use it. Only report news you can verify from a real, recent search result.
RULES:
- Prefer items from roughly the last 30 days; never invent or guess.
- Cover up to 12 of the most significant companies from the list, one verified item each.
- If you cannot find a real, recent item for a company, omit that company entirely.
- Use the EXACT company name from the list for "companyName" (so it matches the CRM).
- Set "published_date" to the article's real date in YYYY-MM-DD form.
- Append the real source URL to the END of each "summary", formatted exactly as: " Source: <url>".
- Return ONLY the JSON array, nothing else.`;

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
    let body = req.body || {};
    const system = typeof body.system === "string" ? body.system : "";
    const isNews = system.includes(NEWS_MARKER);

    if (isNews) {
      // Upgrade the news request: attach web search, give the model room to
      // work, and tighten the instructions so results are real and parseable.
      body = {
        ...body,
        max_tokens: Math.max(Number(body.max_tokens) || 0, 8000),
        system: system + NEWS_AUGMENT,
        tools: [
          ...(Array.isArray(body.tools) ? body.tools : []),
          { type: "web_search_20250305", name: "web_search", max_uses: 8 },
        ],
      };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        // MCP header forwarded if present (for Gmail scan)
        ...(body.mcp_servers ? { "anthropic-beta": "mcp-client-2025-04-04" } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Web search responses contain multiple content blocks (server_tool_use,
    // web_search_tool_result, text, ...). The client reads content[0].text, so
    // collapse all text blocks into a single one to keep it working unchanged.
    if (isNews && Array.isArray(data.content)) {
      const text = data.content
        .filter((b) => b && b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return res.status(200).json({ ...data, content: [{ type: "text", text }] });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Claude proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
