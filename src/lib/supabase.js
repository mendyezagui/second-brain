import { createClient } from "@supabase/supabase-js";
import { initDB } from "./seed";

export const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL  || "";

export const SUPA_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const ENV_READY = SUPA_URL.startsWith("https://") && SUPA_KEY.length > 10;

export const supabase = ENV_READY ? createClient(SUPA_URL, SUPA_KEY) : null;

// Load the current tenant (RLS scopes to the caller's tenant). Returns null on
// single-tenant backends that have no `tenants` table (e.g. the owner's personal
// project) — callers treat null as "owner / all modules on".
export const loadTenant = async () => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("tenants").select("name,slug,modules").limit(1).maybeSingle();
    if (error) return null;
    return data || null;
  } catch { return null; }
};

export const DB_TABLES = [
  ["contacts",              "contacts"],
  ["payments",              "payments"],
  ["payment_allocations",   "payment_allocations"],
  ["deals",       "deals"],
  ["tasks",       "tasks"],
  ["projects",    "projects"],
  ["campaigns",   "campaigns"],
  ["invoices",    "invoices"],
  ["agentLogs",   "agentlogs"],
  ["voiceNotes",  "voicenotes"],
  ["companies",   "companies"],
  ["companyNews", "company_news"],
  ["goals",       "goals"],
  ["events",      "events"],
  ["documents",   "documents"],
  ["strategies",  "strategies"],
  ["ai_memories",  "ai_memories"],
];

export const loadAllFromDB = async () => {
  const seed = initDB();
  const result = {};
  const fetches = await Promise.all(DB_TABLES.map(([, tbl]) => supabase.from(tbl).select("*").order("id")));
  // Check if this database has EVER been seeded (any table has data)
  const hasAnyData = fetches.some(({ data }) => data && data.length > 0);
  const toSeed = [];
  DB_TABLES.forEach(([key], i) => {
    const { data, error } = fetches[i];
    if (!error && data && data.length > 0) { result[key] = data; }
    else if (!hasAnyData) { result[key] = seed[key] || []; if ((seed[key] || []).length > 0) toSeed.push({ key, i }); }
    else { result[key] = []; } // Table is empty but DB is not fresh â don't re-seed
  });
  if (toSeed.length > 0) {
    await Promise.all(toSeed.map(({ key, i }) => {
      const [, tbl] = DB_TABLES[i];
      return (seed[key] || []).length > 0 ? supabase.from(tbl).upsert(seed[key]) : Promise.resolve();
    }));
  }
  return result;
};

export const syncToDB = async (prev, next) => {
  const currentUser = (await supabase.auth.getSession())?.data?.session?.user;
  const modifiedBy = currentUser?.user_metadata?.full_name || currentUser?.email || "unknown";
  const modifiedAt = new Date().toISOString();
  for (const [key, tbl] of DB_TABLES) {
    const prevRows = prev[key] || [];
    const nextRows = next[key] || [];
    if (JSON.stringify(prevRows) === JSON.stringify(nextRows)) continue;
    const prevIds = new Set(prevRows.map(r => r.id));
    const nextIds = new Set(nextRows.map(r => r.id));
    const toUpsert = nextRows.filter(r => {
      if (!prevIds.has(r.id)) return true;
      const old = prevRows.find(p => p.id === r.id);
      return JSON.stringify(r) !== JSON.stringify(old);
    }).map(r => {
      const row = { ...r, modified_by: modifiedBy, modified_at: modifiedAt };
      // tasks.due is a date column; the form emits "" for no due date.
      if (tbl === "tasks" && row.due === "") row.due = null;
      return row;
    });
    if (toUpsert.length > 0) await supabase.from(tbl).upsert(toUpsert);
    const deleted = [...prevIds].filter(id => !nextIds.has(id));
    if (deleted.length > 0) {
      const { error } = await supabase.from(tbl).delete().in("id", deleted);
      if (error) console.error(`Delete failed for ${tbl}:`, error);
    }
  }
};
