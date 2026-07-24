import { createClient } from "@supabase/supabase-js";

const SOURCE = "cometchat_webhook";
const MAX_LIMIT = 300;

function supa() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service env");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function verifySession(req, admin) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const { data: { user }, error } = await admin.auth.getUser(auth.replace("Bearer ", ""));
  return error ? null : user;
}

function secretOk(req) {
  const expected = process.env.COMETCHAT_EVENT_WEBHOOK_SECRET || process.env.CRON_SECRET;
  if (!expected) return false;
  const supplied = req.headers["x-cometchat-event-secret"] || req.headers["x-webhook-secret"] || req.body?.secret;
  return supplied === expected;
}

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function compactText(value, max = 260) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function asEpochSeconds(value) {
  if (!value) return null;
  if (typeof value === "number") return value > 9999999999 ? Math.floor(value / 1000) : Math.floor(value);
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed > 9999999999 ? Math.floor(parsed / 1000) : Math.floor(parsed);
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? Math.floor(date.getTime() / 1000) : null;
}

function extractMessage(payload = {}) {
  const data = payload.data || payload.body?.data || payload.body || {};
  return data.message || data.baseMessage || data.textMessage || payload.message || data;
}

function actorUid(actor) {
  if (!actor) return "";
  if (typeof actor === "string") return actor;
  return actor.uid || actor.id || actor.guid || "";
}

function actorName(actor) {
  if (!actor || typeof actor === "string") return "";
  return actor.name || actor.uid || actor.guid || "";
}

function messageText(message = {}) {
  return message.data?.text || message.data?.message || message.text || message.message || "";
}

function messageMetadata(message = {}) {
  return message.metadata || message.data?.metadata || {};
}

function normalizeEvent(payload = {}) {
  const trigger = payload.trigger || payload.event || payload.eventType || payload.type || "unknown";
  const message = extractMessage(payload);
  const sentAt = asEpochSeconds(message.sentAt || message.sent_at || message.updatedAt || payload.sentAt || payload.timestamp);
  const receiverType = message.receiverType || message.receiver_type || payload.receiverType || "";
  const receiver = actorUid(message.receiver) || message.receiver || message.guid || message.uid || "";
  const sender = actorUid(message.sender) || message.sender || "";
  const text = messageText(message);
  const metadata = messageMetadata(message);
  const conversationId = message.conversationId || payload.conversationId || "";
  const messageId = String(message.id || message.messageId || payload.messageId || payload.id || "");
  const dedupeKey = [
    payload.appId || payload.app_id || "",
    trigger,
    messageId || conversationId,
    sentAt || "",
    sender,
    receiver,
  ].filter(Boolean).join(":");
  const senderLabel = actorName(message.data?.entities?.sender?.entity) || actorName(message.sender) || sender || "unknown";
  const receiverLabel = actorName(message.data?.entities?.receiver?.entity) || actorName(message.receiver) || receiver || "unknown";

  return {
    row: {
      entity_type: "cometchat_event",
      entity_id: 0,
      event_type: `cometchat_${String(trigger).replace(/[^a-zA-Z0-9_]+/g, "_").toLowerCase()}`,
      description: compactText(`${senderLabel} -> ${receiverLabel}${text ? `: ${text}` : ""}`),
      ts: sentAt ? new Date(sentAt * 1000).toISOString() : new Date().toISOString(),
      source: SOURCE,
      metadata: JSON.stringify({
        version: 1,
        dedupe_key: dedupeKey,
        trigger,
        app_id: payload.appId || payload.app_id || "",
        region: payload.region || "",
        webhook: payload.webhook || "",
        message_id: messageId,
        conversation_id: conversationId,
        sender,
        sender_name: senderLabel,
        receiver,
        receiver_name: receiverLabel,
        receiver_type: receiverType,
        cometchat_entity_type: receiverType === "group" || String(conversationId).startsWith("group_") ? "group"
          : receiverType === "user" ? "user"
          : "conversation",
        cometchat_entity_id: receiver || conversationId || payload.webhook || "unknown",
        category: message.category || "",
        type: message.type || "",
        text,
        message_metadata: metadata,
        raw: payload,
      }),
    },
    dedupeKey,
  };
}

async function nextEventId(admin) {
  const { data, error } = await admin.from("events").select("id").order("id", { ascending: false }).limit(1);
  if (error) throw new Error(`Event id lookup failed: ${error.message}`);
  return Number(data?.[0]?.id || 0) + 1;
}

async function duplicateExists(admin, eventType, dedupeKey) {
  if (!dedupeKey) return false;
  const { data, error } = await admin
    .from("events")
    .select("id,metadata")
    .eq("source", SOURCE)
    .eq("event_type", eventType)
    .order("ts", { ascending: false })
    .limit(75);
  if (error) return false;
  return (data || []).some(row => parseJson(row.metadata).dedupe_key === dedupeKey);
}

async function insertEvent(admin, normalized) {
  if (await duplicateExists(admin, normalized.row.event_type, normalized.dedupeKey)) {
    return { inserted: false, duplicate: true };
  }

  const { data, error } = await admin.from("events").insert(normalized.row).select("*").single();
  if (!error) return { inserted: true, event: data };
  if (!/(id|pkey|duplicate|null value)/i.test(error.message || "")) throw new Error(`Event insert failed: ${error.message}`);

  const rowWithId = { id: await nextEventId(admin), ...normalized.row };
  const retry = await admin.from("events").insert(rowWithId).select("*").single();
  if (retry.error) throw new Error(`Event insert failed: ${retry.error.message}`);
  return { inserted: true, event: retry.data };
}

async function listEvents(admin, body = {}) {
  const limit = Math.min(Math.max(Number(body.limit || 100), 1), MAX_LIMIT);
  let query = admin.from("events").select("*").eq("source", SOURCE).order("ts", { ascending: false }).limit(limit);
  if (body.eventType) query = query.eq("event_type", body.eventType);
  if (body.entityId) query = query.eq("entity_id", body.entityId);
  if (body.date) {
    query = query.gte("ts", `${body.date}T00:00:00.000Z`).lt("ts", `${body.date}T23:59:59.999Z`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Event list failed: ${error.message}`);
  return { events: data || [] };
}

async function stats(admin) {
  const { events } = await listEvents(admin, { limit: MAX_LIMIT });
  const byType = {};
  const byEntity = {};
  for (const row of events) {
    byType[row.event_type] = (byType[row.event_type] || 0) + 1;
    byEntity[row.entity_id] = (byEntity[row.entity_id] || 0) + 1;
  }
  return { totalRecent: events.length, byType, byEntity };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const admin = supa();
  const caller = await verifySession(req, admin);
  const hasSecret = secretOk(req);
  const body = req.body || {};
  const action = body.action || (hasSecret ? "ingest" : "list");

  try {
    if (action === "ingest") {
      if (!hasSecret && !caller) return res.status(401).json({ error: "Unauthorized" });
      const payload = body.payload || body.event || body;
      const normalized = normalizeEvent(payload);
      const result = await insertEvent(admin, normalized);
      return res.status(200).json({ ok: true, ...result });
    }

    if (!caller) return res.status(401).json({ error: "Unauthorized" });
    if (action === "list") return res.status(200).json(await listEvents(admin, body));
    if (action === "stats") return res.status(200).json(await stats(admin));
    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("CometChat events error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
