import { createClient } from "@supabase/supabase-js";

const TIME_ZONE = "America/Los_Angeles";
const BUCKET = "memory-files";
const PREFIX = "cometchat-n8n-group-audits";
const INDEX_PATH = `${PREFIX}/index.json`;

function supa() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service env");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function cometConfig() {
  const appId = process.env.COMETCHAT_PRODUCTION_APP_ID;
  const region = (process.env.COMETCHAT_PRODUCTION_REGION || "us").toLowerCase();
  const apiKey = process.env.COMETCHAT_PRODUCTION_API_KEY;
  if (!appId || !apiKey) throw new Error("Missing production CometChat env");
  return { baseUrl: `https://${appId}.api-${region}.cometchat.io/v3`, apiKey };
}

async function verifySession(req, admin) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const { data: { user }, error } = await admin.auth.getUser(auth.replace("Bearer ", ""));
  return error ? null : user;
}

function isCron(req) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && (req.headers.authorization === `Bearer ${secret}` || req.headers["x-cron-secret"] === secret));
}

function qs(params = {}) {
  const out = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out.set(k, String(v));
  });
  const text = out.toString();
  return text ? `?${text}` : "";
}

async function comet(path, params = {}) {
  const { baseUrl, apiKey } = cometConfig();
  const response = await fetch(`${baseUrl}${path}${qs(params)}`, {
    headers: { "Content-Type": "application/json", apikey: apiKey },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const err = new Error(data?.error?.message || data?.message || data?.error || `CometChat returned ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: Number(parts.minute) };
}

function offsetMinutes(date) {
  const label = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "shortOffset" })
    .formatToParts(date).find(part => part.type === "timeZoneName")?.value || "GMT";
  const match = label.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * ((Number(match[2]) * 60) + Number(match[3] || 0));
}

function localToUtcSeconds(dateKey, hour, minute = 0, second = 0) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d, hour, minute, second);
  return Math.floor((utc - offsetMinutes(new Date(utc)) * 60000) / 1000);
}

function dayWindow(dateKey) {
  return {
    fromTimestamp: localToUtcSeconds(dateKey, 0, 0, 0),
    toTimestamp: localToUtcSeconds(dateKey, 23, 59, 59),
  };
}

function metadata(message) {
  return message?.data?.metadata || {};
}

function tags(message) {
  return Array.isArray(message?.tags) ? message.tags : [];
}

function textOf(message) {
  return message?.data?.text || message?.data?.message || message?.text || "";
}

function sourceHint(message) {
  const lowerTags = tags(message).map(tag => String(tag).toLowerCase());
  const meta = metadata(message);
  if (meta.source === "ringcentral_sms_to_cometchat" || lowerTags.includes("ringcentral-sms")) return "metadata:source=ringcentral_sms_to_cometchat";
  if (meta.source === "retell_via_n8n") return "metadata:source=retell_via_n8n";
  if (meta.source === "retell_n8n") return "metadata:source=retell_n8n";
  if (String(meta.source || "").toLowerCase().includes("n8n")) return `metadata:source=${meta.source}`;
  if (meta.n8n_workflow) return "metadata:n8n_workflow";
  if (lowerTags.some(tag => tag.includes("n8n"))) return "tag:n8n";
  if (lowerTags.some(tag => tag.includes("voiceai") || tag.includes("voice-ai"))) return "tag:voiceai";
  if (message.sender === "app_system" && message.receiverType === "group") return "inferred:app_system_group_message";
  return "";
}

function sourceTypeFrom(message) {
  const meta = message.metadata || metadata(message);
  const lowerTags = (message.tags || tags(message)).map(tag => String(tag).toLowerCase());
  const source = String(meta.source || "").toLowerCase();
  const eventType = String(meta.event_type || "").toLowerCase();
  if (source === "ringcentral_sms_to_cometchat" || lowerTags.includes("ringcentral-sms") || eventType === "ringcentral_sms_bridge") {
    return "RingCentral SMS redirect";
  }
  if (source === "retell_via_n8n" || source === "retell_n8n" || eventType === "call_end_followup" || lowerTags.includes("call-end-followup")) {
    return "Retell call-end";
  }
  if (source === "second_brain" || source === "second-brain-cometchat-console" || lowerTags.some(tag => tag.includes("second-brain"))) {
    return "Manual Second Brain test";
  }
  if (message.sender === "app_system" && message.receiverType === "group") return "Unknown app_system";
  return "Other";
}

function normalize(message) {
  const senderEntity = message?.data?.entities?.sender?.entity;
  const receiverEntity = message?.data?.entities?.receiver?.entity;
  const normalized = {
    id: String(message.id),
    conversationId: message.conversationId || "",
    sender: message.sender || "",
    senderName: senderEntity?.name || (message.sender === "app_system" ? "System" : message.sender || ""),
    receiver: message.receiver || "",
    receiverName: receiverEntity?.name || message.receiver || "",
    receiverType: message.receiverType || "",
    category: message.category || "",
    type: message.type || "",
    text: textOf(message),
    metadata: metadata(message),
    tags: tags(message),
    sourceHint: sourceHint(message),
    sentAt: Number(message.sentAt || 0),
    updatedAt: Number(message.updatedAt || 0),
  };
  return { ...normalized, sourceType: sourceTypeFrom(normalized) };
}

function isN8nSystemGroupMessage(message) {
  return message.receiverType === "group" && message.sender === "app_system" && message.category === "message";
}

async function listMessages(params) {
  const rows = [];
  let cursor = null;
  for (let page = 0; page < 8; page += 1) {
    const data = await comet("/messages", {
      ...params,
      ...(cursor ? { affix: "append", id: cursor } : {}),
      limit: 1000,
      withTags: true,
      hideDeleted: true,
    });
    const batch = Array.isArray(data?.data) ? data.data : [];
    rows.push(...batch);
    const nextId = data?.meta?.next?.id;
    if (!nextId || batch.length < 1000) break;
    cursor = nextId;
  }
  return rows;
}

function scoreGroup(systemMessages, allMessages) {
  const systemIds = new Set(systemMessages.map(m => m.id));
  const nonSystem = allMessages.filter(m => !systemIds.has(m.id) && m.sender !== "app_system");
  let best = { score: 20, label: "Low", reasons: ["No non-system group replies found after the n8n message."] };
  let post30 = 0;
  let post120 = 0;
  let postDay = 0;
  let pre60 = 0;

  for (const trigger of systemMessages) {
    const pre = nonSystem.filter(m => m.sentAt >= trigger.sentAt - 3600 && m.sentAt < trigger.sentAt);
    const p30 = nonSystem.filter(m => m.sentAt > trigger.sentAt && m.sentAt <= trigger.sentAt + 1800);
    const p120 = nonSystem.filter(m => m.sentAt > trigger.sentAt && m.sentAt <= trigger.sentAt + 7200);
    const pday = nonSystem.filter(m => m.sentAt > trigger.sentAt);
    pre60 += pre.length;
    post30 += p30.length;
    post120 += p120.length;
    postDay += pday.length;

    let candidate = best;
    if (p30.length && !pre.length) candidate = { score: 90, label: "High", reasons: [`${p30.length} reply/replies within 30 minutes and no prior-hour chat.`] };
    else if (p30.length) candidate = { score: 75, label: "Medium-high", reasons: [`${p30.length} reply/replies within 30 minutes, but prior-hour chat existed.`] };
    else if (p120.length && !pre.length) candidate = { score: 65, label: "Medium", reasons: [`${p120.length} reply/replies within 2 hours and no prior-hour chat.`] };
    else if (pday.length) candidate = { score: 45, label: "Possible", reasons: [`${pday.length} later same-day reply/replies after the n8n message.`] };
    if (candidate.score > best.score) best = candidate;
  }

  return {
    ...best,
    counts: {
      priorHourNonSystemMessages: pre60,
      post30MinuteNonSystemMessages: post30,
      post2HourNonSystemMessages: post120,
      postDayNonSystemMessages: postDay,
      uniquePostSendHumanSenders: new Set(nonSystem.filter(m => systemMessages.some(trigger => m.sentAt > trigger.sentAt)).map(m => m.sender)).size,
    },
  };
}

function sourceBreakdown(systemMessages) {
  return systemMessages.reduce((acc, message) => {
    const key = message.sourceType || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function reviewFlags(sends, allMessages, confidence) {
  const sourceTypes = new Set(sends.map(msg => msg.sourceType));
  const flags = [];
  if (sends.some(msg => msg.sourceType === "Unknown app_system")) flags.push("Unknown app_system source");
  if (sourceTypes.has("RingCentral SMS redirect") && confidence.counts.postDayNonSystemMessages === 0) flags.push("SMS redirect, no app reply");
  if (confidence.score >= 65) flags.push("Likely influenced");
  if (confidence.counts.postDayNonSystemMessages > 0 && confidence.counts.post30MinuteNonSystemMessages === 0) flags.push("Late same-day reply");
  if (confidence.counts.priorHourNonSystemMessages > 0) flags.push("Prior-hour activity");
  if (allMessages.length === sends.length) flags.push("No human conversation");
  return flags;
}

async function runAudit(dateKey, triggeredBy) {
  const { fromTimestamp, toTimestamp } = dayWindow(dateKey);
  const generatedAt = new Date().toISOString();
  const messages = (await listMessages({ receiverType: "group", category: "message", fromTimestamp, toTimestamp }))
    .map(normalize)
    .sort((a, b) => a.sentAt - b.sentAt || Number(a.id) - Number(b.id));
  const systemMessages = messages.filter(isN8nSystemGroupMessage);
  const byGroup = new Map();
  for (const msg of systemMessages) {
    if (!byGroup.has(msg.receiver)) byGroup.set(msg.receiver, []);
    byGroup.get(msg.receiver).push(msg);
  }

  const groups = [...byGroup.entries()].map(([groupGuid, sends]) => {
    const allMessages = messages.filter(msg => msg.receiver === groupGuid);
    const groupName = sends.find(msg => msg.receiverName)?.receiverName || groupGuid;
    const confidence = scoreGroup(sends, allMessages);
    return {
      groupGuid,
      groupName,
      conversationId: allMessages.find(msg => msg.conversationId)?.conversationId || "",
      identifier: `${dateKey}:${groupGuid}:${sends.map(msg => msg.id).join("-")}`,
      sourceTypes: sourceBreakdown(sends),
      systemMessages: sends,
      allMessages,
      confidence,
      reviewFlags: reviewFlags(sends, allMessages, confidence),
    };
  });
  const needsReviewGroups = groups.filter(group => (group.reviewFlags || []).some(flag => flag !== "Likely influenced")).length;

  const snapshot = {
    version: 1,
    environment: "production",
    date: dateKey,
    timezone: TIME_ZONE,
    generatedAt,
    triggeredBy,
    sourceWindow: { fromTimestamp, toTimestamp },
    summary: {
      n8nGroupMessages: systemMessages.length,
      explicitlyTaggedN8nMessages: systemMessages.filter(msg => !msg.sourceHint.startsWith("inferred:")).length,
      inferredSystemGroupMessages: systemMessages.filter(msg => msg.sourceHint.startsWith("inferred:")).length,
      sourceBreakdown: sourceBreakdown(systemMessages),
      uniqueGroups: groups.length,
      likelyInfluencedGroups: groups.filter(g => g.confidence.score >= 65).length,
      possibleInfluencedGroups: groups.filter(g => g.confidence.score >= 45).length,
      needsReviewGroups,
      dailyConfidenceScore: groups.length ? Math.round(groups.reduce((sum, g) => sum + g.confidence.score, 0) / groups.length) : 0,
    },
    groups,
  };

  const admin = supa();
  const path = `${PREFIX}/${dateKey}/${generatedAt.replace(/[:.]/g, "-")}.json`;
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }), {
    contentType: "application/json",
    upsert: false,
  });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  let index = { snapshots: [] };
  const { data: existingIndex } = await admin.storage.from(BUCKET).download(INDEX_PATH);
  if (existingIndex) {
    try { index = JSON.parse(await existingIndex.text()); } catch { index = { snapshots: [] }; }
  }
  const entry = { path, date: dateKey, generatedAt, summary: snapshot.summary };
  index.snapshots = [entry, ...(index.snapshots || []).filter(item => item.path !== path)].slice(0, 500);
  await admin.storage.from(BUCKET).upload(INDEX_PATH, new Blob([JSON.stringify(index, null, 2)], { type: "application/json" }), {
    contentType: "application/json",
    upsert: true,
  });

  return { ...snapshot, storagePath: path };
}

async function listSnapshots() {
  const { data, error } = await supa().storage.from(BUCKET).download(INDEX_PATH);
  if (error) {
    if (error.statusCode === "404" || error.message?.includes("not found")) return { snapshots: [] };
    throw new Error(`Storage index download failed: ${error.message}`);
  }
  return JSON.parse(await data.text());
}

async function getSnapshot(path) {
  if (!path?.startsWith(`${PREFIX}/`) || !path.endsWith(".json")) throw new Error("Invalid snapshot path");
  const { data, error } = await supa().storage.from(BUCKET).download(path);
  if (error) throw new Error(`Storage snapshot download failed: ${error.message}`);
  return JSON.parse(await data.text());
}

export default async function handler(req, res) {
  const admin = supa();
  const cron = isCron(req);
  const caller = cron ? { id: "cron" } : await verifySession(req, admin);
  if (!caller) return res.status(401).json({ error: "Unauthorized" });

  try {
    const body = req.method === "POST" ? (req.body || {}) : {};
    const action = body.action || (req.method === "GET" ? "runDailyAudit" : "listSnapshots");
    if (action === "listSnapshots") return res.status(200).json(await listSnapshots());
    if (action === "getSnapshot") return res.status(200).json(await getSnapshot(body.path));
    if (action === "runDailyAudit") {
      const local = localParts();
      const force = body.force === true || req.query?.force === "1";
      if (cron && !force && (local.hour !== 16 || local.minute !== 45)) {
        return res.status(200).json({ ok: true, skipped: true, reason: `Local time is ${local.hour}:${String(local.minute).padStart(2, "0")} ${TIME_ZONE}, not 16:45.` });
      }
      const snapshot = await runAudit(body.date || req.query?.date || local.date, cron ? "cron" : "manual");
      return res.status(200).json({ ok: true, snapshot });
    }
    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("CometChat audit error:", err);
    return res.status(err.status || 500).json({ error: err.message || "Internal server error", details: err.data });
  }
}
