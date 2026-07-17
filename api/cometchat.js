import { createClient } from "@supabase/supabase-js";

const DEFAULT_APP_ID = "16787737a265e4b49";
const DEFAULT_REGION = "us";
const ENVIRONMENTS = new Set(["sandbox", "production"]);
const PRODUCTION_TEST_SETUP = {
  alexUid: "alex-voice-ai",
  alexName: "Alex Voice AI",
  driverUid: "rapid-ai-test-driver",
  driverName: "Rapid AI Test Driver",
  groupGuid: "rapid-ai-voice-test-group",
  groupName: "Rapid AI Voice Test Group",
};

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function normalizeEnvironment(value) {
  const environment = String(value || "sandbox").toLowerCase();
  if (!ENVIRONMENTS.has(environment)) {
    const err = new Error("Invalid CometChat environment");
    err.status = 400;
    throw err;
  }
  return environment;
}

function getCometConfig(environmentValue) {
  const environment = normalizeEnvironment(environmentValue);
  const prefix = environment === "production" ? "COMETCHAT_PRODUCTION" : "COMETCHAT_SANDBOX";
  const appId = process.env[`${prefix}_APP_ID`] || (environment === "sandbox" ? process.env.COMETCHAT_APP_ID : "") || DEFAULT_APP_ID;
  const region = (process.env[`${prefix}_REGION`] || (environment === "sandbox" ? process.env.COMETCHAT_REGION : "") || DEFAULT_REGION).toLowerCase();
  const apiKey = process.env[`${prefix}_API_KEY`] || (environment === "sandbox" ? process.env.COMETCHAT_API_KEY : "");
  if (!apiKey) throw new Error(`Missing ${prefix}_API_KEY`);
  return { environment, appId, region, apiKey, baseUrl: `https://${appId}.api-${region}.cometchat.io/v3` };
}

async function verifySession(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const admin = getAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !user) return null;
  return user;
}

function queryString(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  });
  const out = qs.toString();
  return out ? `?${out}` : "";
}

async function cometFetch(path, options = {}) {
  const { baseUrl, apiKey } = getCometConfig(options.environment);
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
      ...(options.onBehalfOf ? { onBehalfOf: options.onBehalfOf } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = data?.error?.message || data?.message || data?.error || `CometChat returned ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function cometFetchMaybe(path, options = {}) {
  try {
    return { ok: true, data: await cometFetch(path, options) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

async function ensureUser(environment, uid, name, extra = {}) {
  const existing = await cometFetchMaybe(`/users/${encodeURIComponent(uid)}`, { environment });
  if (existing.ok) {
    const currentName = existing.data?.data?.name;
    if (currentName === name) return { status: "exists", user: existing.data?.data };
    const updated = await cometFetch(`/users/${encodeURIComponent(uid)}`, {
      environment,
      method: "PUT",
      body: JSON.stringify({ name, ...extra }),
    });
    return { status: "updated", user: updated?.data };
  }
  if (existing.error?.status !== 404) throw existing.error;
  const created = await cometFetch("/users", {
    environment,
    method: "POST",
    body: JSON.stringify({ uid, name, ...extra }),
  });
  return { status: "created", user: created?.data };
}

async function ensureGroup(environment, guid, name, ownerUid) {
  const existing = await cometFetchMaybe(`/groups/${encodeURIComponent(guid)}`, { environment, onBehalfOf: ownerUid });
  if (existing.ok) return { status: "exists", group: existing.data?.data };
  if (existing.error?.status !== 404) throw existing.error;
  const created = await cometFetch("/groups", {
    environment,
    method: "POST",
    onBehalfOf: ownerUid,
    body: JSON.stringify({
      guid,
      name,
      type: "public",
      description: "Production test group for Rapid Medical VoiceAI CometChat validation.",
      metadata: {
        source: "second-brain-cometchat-console",
        purpose: "voiceai-production-test",
      },
    }),
  });
  return { status: "created", group: created?.data };
}

async function ensureGroupMember(environment, guid, uid, scope = "participants") {
  const membersPage = await cometFetch(`/groups/${encodeURIComponent(guid)}/members${queryString({ perPage: 100 })}`, { environment });
  const existingMember = (membersPage?.data || []).find(member => member.uid === uid);
  if (existingMember) return { status: "exists", member: existingMember };
  const bucket = scope === "admins" || scope === "moderators" ? scope : "participants";
  const added = await cometFetch(`/groups/${encodeURIComponent(guid)}/members`, {
    environment,
    method: "POST",
    body: JSON.stringify({ [bucket]: [uid] }),
  });
  return { status: "added", result: added?.data || added };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const caller = await verifySession(req);
    if (!caller) return res.status(401).json({ error: "Unauthorized" });

    const { action, environment: environmentValue, ...params } = req.body || {};
    const environment = normalizeEnvironment(environmentValue);

    if (action === "status") {
      const { appId, region } = getCometConfig(environment);
      return res.status(200).json({ ok: true, environment, appId, region });
    }

    if (action === "listUsers") {
      const data = await cometFetch(`/users${queryString({ searchKey: params.searchKey, perPage: params.perPage || 30 })}`, { environment });
      return res.status(200).json(data);
    }

    if (action === "listGroups") {
      const data = await cometFetch(`/groups${queryString({ searchKey: params.searchKey, perPage: params.perPage || 30 })}`, {
        environment,
        onBehalfOf: params.onBehalfOf,
      });
      return res.status(200).json(data);
    }

    if (action === "getUserMessages") {
      if (!params.uid) return res.status(400).json({ error: "uid is required" });
      const data = await cometFetch(`/users/${encodeURIComponent(params.uid)}/messages${queryString({
        perPage: params.perPage || 75,
        hideDeleted: true,
        category: "message",
      })}`, { environment, onBehalfOf: params.onBehalfOf });
      return res.status(200).json(data);
    }

    if (action === "getGroupMessages") {
      if (!params.guid) return res.status(400).json({ error: "guid is required" });
      const data = await cometFetch(`/groups/${encodeURIComponent(params.guid)}/messages${queryString({
        perPage: params.perPage || 75,
        hideDeleted: true,
        category: "message",
      })}`, { environment, onBehalfOf: params.onBehalfOf });
      return res.status(200).json(data);
    }

    if (action === "ensureProductionTestSetup") {
      if (environment !== "production") return res.status(400).json({ error: "Production test setup only runs in production" });
      const alex = await ensureUser(environment, PRODUCTION_TEST_SETUP.alexUid, PRODUCTION_TEST_SETUP.alexName, {
        tags: ["voiceai", "system-user", "second-brain-test"],
        metadata: { source: "second-brain", purpose: "voiceai-cometchat-sender" },
      });
      const driver = await ensureUser(environment, PRODUCTION_TEST_SETUP.driverUid, PRODUCTION_TEST_SETUP.driverName, {
        tags: ["voiceai", "test-driver", "second-brain-test"],
        metadata: { source: "second-brain", purpose: "voiceai-cometchat-test-driver" },
      });
      const group = await ensureGroup(environment, PRODUCTION_TEST_SETUP.groupGuid, PRODUCTION_TEST_SETUP.groupName, PRODUCTION_TEST_SETUP.alexUid);
      const alexMember = await ensureGroupMember(environment, PRODUCTION_TEST_SETUP.groupGuid, PRODUCTION_TEST_SETUP.alexUid, "admins");
      const driverMember = await ensureGroupMember(environment, PRODUCTION_TEST_SETUP.groupGuid, PRODUCTION_TEST_SETUP.driverUid, "participants");
      return res.status(200).json({ ok: true, setup: PRODUCTION_TEST_SETUP, alex, driver, group, alexMember, driverMember });
    }

    if (action === "ensureGroupMember") {
      const { guid, uid, scope } = params;
      if (!guid) return res.status(400).json({ error: "guid is required" });
      if (!uid) return res.status(400).json({ error: "uid is required" });
      const member = await ensureGroupMember(environment, guid, uid, scope || "participants");
      return res.status(200).json({ ok: true, guid, uid, member });
    }

    if (action === "sendMessage") {
      const { senderUid, receiver, receiverType, text, metadata } = params;
      if (!senderUid) return res.status(400).json({ error: "senderUid is required" });
      if (!receiver) return res.status(400).json({ error: "receiver is required" });
      if (!text?.trim()) return res.status(400).json({ error: "text is required" });
      const data = await cometFetch("/messages", {
        environment,
        method: "POST",
        onBehalfOf: senderUid,
        body: JSON.stringify({
          receiver,
          receiverType: receiverType || "user",
          category: "message",
          type: "text",
          data: {
            text: text.trim(),
            metadata: {
              source: "second-brain-cometchat-console",
              environment,
              ...(metadata || {}),
            },
          },
          tags: ["second-brain-test"],
        }),
      });
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("CometChat API error:", err);
    return res.status(err.status || 500).json({ error: err.message || "Internal server error", details: err.data });
  }
}
