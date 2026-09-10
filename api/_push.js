// Server-side Web Push sender, shared by any Second Brain agent.
//
// Kept out of /api/ routing concerns on purpose: files starting with "_" are
// not exposed as endpoints by Vercel, so this is a plain module.

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

let configured = false;
function configure() {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:mendy@aventary.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

export const admin = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Push one payload to every registered device.
 *
 * A 404/410 from the push service means the browser threw the subscription
 * away (app deleted, permission revoked). Those rows are deleted rather than
 * retried forever — otherwise every send drags a graveyard of dead endpoints.
 */
export async function sendPush(payload, { db = admin() } = {}) {
  if (!configure()) return { ok: false, sent: 0, reason: "VAPID keys not configured" };

  const { data: subs, error } = await db.from("push_subscriptions").select("*");
  if (error) return { ok: false, sent: 0, reason: `db: ${error.message}` };
  if (!subs || subs.length === 0) return { ok: false, sent: 0, reason: "no devices subscribed" };

  const body = JSON.stringify(payload);
  const dead = [];
  let sent = 0;
  const errors = [];

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
        { TTL: 60 * 60 * 12, urgency: payload.severity === "high" ? "high" : "normal" }
      );
      sent++;
      await db.from("push_subscriptions")
        .update({ last_success_at: new Date().toISOString(), failure_count: 0 })
        .eq("id", s.id);
    } catch (e) {
      const code = e.statusCode || 0;
      if (code === 404 || code === 410) dead.push(s.id);
      else {
        errors.push(`${s.label || s.id}: ${code || e.message}`);
        await db.from("push_subscriptions").update({ failure_count: (s.failure_count || 0) + 1 }).eq("id", s.id);
      }
    }
  }));

  if (dead.length) await db.from("push_subscriptions").delete().in("id", dead);
  return { ok: sent > 0, sent, pruned: dead.length, devices: subs.length, errors };
}
