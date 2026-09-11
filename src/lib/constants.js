import { fmt } from "./utils";

export const CONTACT_CATEGORIES = ["customer_lead","partner_lead","customer","partner","vendor"];

export const TASK_STATUSES = ["todo","in_progress","waiting","done","cancelled"];

export const TASK_CATEGORIES = ["follow_up","outreach","admin","research","meeting_prep","deliverable"];

// The associate roster moved out of this file and into the `associates` table.
//
// It lived here as a flat array of prompt strings, which is why fifteen of the
// seventeen never actually did anything: an array has no schedule, no memory,
// no history and no way to say what it needs. An associate is now a ROW —
// see schema-associates.sql, seed-associates.sql and docs/associates/README.md.
// Add one with an INSERT, not a code change.

export const DOCUMENT_ENTITY_TYPES = [
  { type:"contact", key:"contacts", label:"Contact", name:r=>r.name },
  { type:"company", key:"companies", label:"Company", name:r=>r.name },
  { type:"document", key:"documents", label:"Document", name:r=>r.title || r.file_name || r.url },
  { type:"project", key:"projects", label:"Project", name:r=>r.name },
  { type:"task", key:"tasks", label:"Task", name:r=>r.title },
  { type:"campaign", key:"campaigns", label:"Campaign", name:r=>r.name },
  { type:"deal", key:"deals", label:"Deal", name:r=>r.name },
  { type:"invoice", key:"invoices", label:"Invoice", name:r=>r.number || r.client },
  { type:"payment", key:"payments", label:"Payment", name:r=>`${r.date || "Payment"} Â· ${fmt(r.amount || 0)}` },
  { type:"strategy", key:"strategies", label:"Strategy", name:r=>r.name },
  { type:"goal", key:"goals", label:"Goal", name:r=>r.name },
  { type:"ai_memory", key:"ai_memories", label:"AI Memory", name:r=>r.subject || r.memory_summary },
];

export const RECORD_ROUTE_ALIASES = {
  contact:"contacts", contacts:"contact", company:"companies", companies:"company",
  deal:"deals", deals:"deal", document:"documents", documents:"document",
  project:"projects", projects:"project", task:"tasks", tasks:"task",
  campaign:"campaigns", campaigns:"campaign", invoice:"invoices", invoices:"invoice",
  payment:"payments", payments:"payment", strategy:"strategies", strategies:"strategy",
  goal:"goals", goals:"goal", ai_memory:"ai-memories", ai_memories:"ai_memory", "ai-memories":"ai_memory",
};

export const MASTER_VIEW_FOR_TYPE = {
  contact:"crm", company:"companies", campaign:"marketing", project:"projects",
  deal:"deals", task:"tasks", goal:"goals", strategy:"strategies",
  invoice:"invoices", payment:"payments", document:"documents", ai_memory:"ai_memories",
};
