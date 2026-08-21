import { createClient } from "@supabase/supabase-js";

const getAdmin = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Second Brain authentication is not configured");
  return createClient(url, key, { auth:{ autoRefreshToken:false, persistSession:false } });
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error:"Method not allowed" });
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!bearer) return res.status(401).json({ error:"Unauthorized" });

  try {
    const { data:{ user }, error } = await getAdmin().auth.getUser(bearer);
    if (error || !user) return res.status(401).json({ error:"Invalid session" });
    if (!process.env.CRON_SECRET) throw new Error("Rambam controls secret is not configured");

    const upstream = await fetch("https://rambam-leaderboard.mendy-ez.chatgpt.site/api/controls", {
      headers: { Authorization:`Bearer ${process.env.CRON_SECRET}` },
    });
    const body = await upstream.text();
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(body);
  } catch (err) {
    return res.status(500).json({ error:err.message || "Could not load Rambam controls" });
  }
}
