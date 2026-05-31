import { DOCUMENT_ENTITY_TYPES, MASTER_VIEW_FOR_TYPE, RECORD_ROUTE_ALIASES } from "./constants";
import { supabase } from "./supabase";

export const nextId = (arr) => arr.length ? Math.max(...arr.map(r => r.id)) + 1 : 1;

export const fmt = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;

export const sc = (k) => ({ client:"var(--green)", "at-risk":"var(--red)", prospect:"var(--blue)", active:"var(--green)", stalled:"var(--red)", draft:"var(--text-sec)", paid:"var(--green)", pending:"var(--amber)", overdue:"var(--red)", critical:"var(--red)", high:"var(--amber)", medium:"var(--blue)", low:"var(--green)", customer:"var(--green)", partner:"var(--purple)", customer_lead:"var(--blue)", partner_lead:"var(--purple)", vendor:"var(--amber)", inactive:"var(--text-dim)", todo:"var(--blue)", in_progress:"var(--amber)", waiting:"var(--purple)", done:"var(--green)", cancelled:"var(--text-dim)" }[k] || "var(--text-sec)");

export const recordPath = (type, id) => `#/${RECORD_ROUTE_ALIASES[type] || `${type}s`}/${id}`;

export const parseAppHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  const [head, id] = raw.split("/");
  const type = RECORD_ROUTE_ALIASES[head];
  if (type && id) {
    const num = Number(id);
    const numId = Number.isFinite(num) ? num : id;
    const masterView = MASTER_VIEW_FOR_TYPE[type];
    if (masterView) return { view: masterView, record: null, focus: { type, id: numId } };
    return { view:"record", record:{ type, id: numId }, focus:null };
  }
  const valid = ["dashboard","orchestrator","associates","mstack","crm","companies","deals","marketing","social","tasks","projects","documents","voice","inbox","gcal","invoices","payments","goals","strategies","ai_memories","multi_llm","voitra_gate","admin"];
  return { view:valid.includes(head) ? head : "dashboard", record:null, focus:null };
};

export const daysBetween = (a,b) => Math.round((new Date(b)-new Date(a))/(1000*60*60*24));

export const today = () => new Date().toISOString().split("T")[0];

export async function callClaude(system, user, max=800, extra={}) {
  const r = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:max, system, messages:[{role:"user",content:user}], ...extra }),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

export const logEvent = (db, setDB, entityType, entityId, eventType, description, source="system") => {
  setDB(d => ({...d, events: [{id:nextId(d.events), entity_type:entityType, entity_id:entityId, event_type:eventType, description, ts:new Date().toISOString(), source, metadata:"{}"}, ...d.events]}));
};

export const docAssociationKey = (a) => `${a.type}:${a.id}`;

export const normalizeDocId = (id) => Number(id) || id;

export const docHasAssociation = (doc, type, id) => (doc.associations || []).some(a => a.type === type && String(a.id) === String(id));

export const getDocEntityConfig = (type) => DOCUMENT_ENTITY_TYPES.find(e => e.type === type);

export const getDocEntityLabel = (db, assoc) => {
  const cfg = getDocEntityConfig(assoc.type);
  const rec = cfg ? (db[cfg.key] || []).find(r => String(r.id) === String(assoc.id)) : null;
  return rec ? `${cfg.label}: ${cfg.name(rec) || "Untitled"}` : `${cfg?.label || assoc.type}: ${assoc.id}`;
};

export const formatDocSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

export const getDocKindLabel = (doc) => {
  if (doc.file_name || doc.storage_path || doc.kind === "attachment" || doc.kind === "file") return "Attachment";
  if (doc.url || doc.kind === "link") return "Link";
  return "Document";
};

export const uploadDocumentFile = async (file) => {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `documents/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await supabase.storage.from("memory-files").upload(path, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("memory-files").getPublicUrl(path);
  return {
    title:file.name,
    file_name:file.name,
    file_type:file.type || "application/octet-stream",
    file_size:file.size,
    storage_path:path,
    url:urlData.publicUrl,
    kind:"attachment",
  };
};

export const blankDocument = (associations=[]) => ({
  title:"",
  description:"",
  kind:"attachment",
  url:"",
  file_name:"",
  file_type:"",
  file_size:0,
  storage_path:"",
  associations,
  created_at:new Date().toISOString(),
});

export const buildDocOptions = (db) => DOCUMENT_ENTITY_TYPES.map(cfg => ({
  ...cfg,
  options:(db[cfg.key] || []).map(r => ({ value:String(r.id), label:cfg.name(r) || "Untitled" }))
}));
