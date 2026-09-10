// /api/push — device registration + a manual test send.
//
// GET  ?action=status   -> is push configured, how many devices
// POST { action:"test" } -> send a test notification to every device
//
// Subscribing itself happens client-side straight into Supabase under RLS
// (src/lib/push.js); this endpoint exists for the things that need the
// service-role key or the VAPID private key.

import { admin, sendPush } from "./_push.js";

export default async function handler(req, res) {
  const db = admin();

  if (req.method === "GET") {
    const { count, error } = await db.from("push_subscriptions").select("id", { count: "exact", head: true });
    return res.status(200).json({
      configured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      devices: error ? null : count,
      publicKey: process.env.VAPID_PUBLIC_KEY || null,
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  if (body.action !== "test") return res.status(400).json({ error: "unknown action" });

  const result = await sendPush({
    title: body.title || "SoFa JCC associate",
    body: body.body || "Push is wired up. This is a test.",
    url: body.url || "/#/sofa_jcc",
    tag: "sofa-test",
    renotify: true,
  }, { db });

  return res.status(result.ok ? 200 : 502).json(result);
}
