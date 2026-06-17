import { fmt } from "./utils";

export const CONTACT_CATEGORIES = ["customer_lead","partner_lead","customer","partner","vendor"];

export const TASK_STATUSES = ["todo","in_progress","waiting","done","cancelled"];

export const TASK_CATEGORIES = ["follow_up","outreach","admin","research","meeting_prep","deliverable"];

export const ASSOCIATES = [
  { id:"discovery-plan", label:"Discovery Associate", group:"Sales", artifact:"Discovery plan", prompt:"Prepare a client discovery call agenda, questions, qualification notes, risks, and next-step control." },
  { id:"discovery-synthesis", label:"Synthesis Associate", group:"Sales", artifact:"Discovery synthesis", prompt:"Turn discovery notes into diagnosis, value, scope options, risks, and next actions." },
  { id:"pitch-draft", label:"Pitch Associate", group:"Sales", artifact:"Outbound pitch", prompt:"Draft targeted outreach, referral asks, follow-ups, and pitch messages for Clarity Operator or Voitra AI." },
  { id:"pricing-strategy", label:"Pricing Associate", group:"Sales", artifact:"Pricing recommendation", prompt:"Price diagnostics, projects, retainers, and change orders based on value, risk, and leverage." },
  { id:"sow-builder", label:"SOW Associate", group:"Delivery", artifact:"Statement of work", prompt:"Build a tight statement of work with scope, deliverables, exclusions, assumptions, timeline, fees, and change control." },
  { id:"proposal", label:"Proposal Associate", group:"Delivery", artifact:"Client proposal", prompt:"Generate a value-based proposal from engagement context." },
  { id:"project-kickoff", label:"Kickoff Associate", group:"Delivery", artifact:"Kickoff plan", prompt:"Turn a signed engagement into a kickoff plan, workstreams, client asks, delivery rhythm, and first-week actions." },
  { id:"project-status", label:"Status Associate", group:"Delivery", artifact:"Status update", prompt:"Create a client-ready status update, risks, decisions, and next actions." },
  { id:"demo-builder", label:"Demo Associate", group:"Sales", artifact:"Demo plan", prompt:"Plan and script a client demo tied to buyer pain, proof points, and follow-up close." },
  { id:"plan-voice-agent", label:"Voice Agent Associate", group:"Voitra", artifact:"Voice agent spec", prompt:"Design a Retell AI voice agent from scratch: persona, flows, tool calls, prompts, and edge cases." },
  { id:"retell-review", label:"Retell Review Associate", group:"Voitra", artifact:"Retell audit", prompt:"Audit an existing Retell AI agent config for gaps, hallucination risks, broken tool paths, and edge cases." },
  { id:"office-hours", label:"Office Hours Associate", group:"Operator", artifact:"Decision memo", prompt:"Interrogate this idea, client situation, or decision. Be direct. No cheerleading." },
  { id:"weekly-retro", label:"Retro Associate", group:"Operator", artifact:"Weekly review", prompt:"Review pipeline health, delivery status, risks, revenue tracking, and next week priorities." },
  { id:"bd-signal", label:"BD Signal Associate", group:"Operator", artifact:"BD signal brief", prompt:"Surface BD opportunities from current context, market signals, conversations, and client situations." },
  { id:"second-brain-sync", label:"Memory Associate", group:"Power", artifact:"Memory summary", prompt:"Distill the key session output into reusable Second Brain memory and linked follow-up tasks." },
];

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
