import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { createClient } from "@supabase/supabase-js";
import {Brain, Users, Megaphone, Briefcase, DollarSign, Mic,
  TrendingUp, AlertCircle, CheckCircle, Clock, Plus, Zap, Target,
  Phone, Building, Search, BarChart2, Calendar, Loader, Shield,
  ChevronRight, Eye, MicOff, ArrowUp, ArrowDown, Inbox, RefreshCw,
  FileText, Trash2, Pencil, X, Save, MoreVertical, Check, Sparkles, Hash,
  MessageSquare, Send, Paperclip, Loader2, Copy, Mail,
  Linkedin, ExternalLink, Filter, SortAsc, ChevronDown, CreditCard, Globe, Newspaper,
  Star, ArrowRightCircle, Activity, Award, Building2, BookOpen, ChevronUp, Upload} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

/* ── STYLES ── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
    :root {
      --bg:#f4f6f9; --bg-card:#fff; --bg-el:#f0f2f5; --bg-hover:#e8ecf2;
      --border:#e2e6ed; --border-hi:#d0d6e0;
      --blue:#0077cc; --blue-dim:rgba(0,119,204,0.08);
      --amber:#d97706; --amber-dim:rgba(217,119,6,0.10);
      --green:#059669; --green-dim:rgba(5,150,105,0.10);
      --red:#dc2626; --red-dim:rgba(220,38,38,0.08);
      --purple:#7c3aed; --purple-dim:rgba(124,58,237,0.10);
      --text:#1a202c; --text-sec:#64748b; --text-dim:#a0aec0;
      --font-d:'Syne',sans-serif; --font-m:'IBM Plex Mono',monospace; --font-b:'DM Sans',sans-serif;
      --shadow:0 1px 4px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.04);
      --shadow-lg:0 8px 32px rgba(0,0,0,0.12);
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--bg);color:var(--text);font-family:var(--font-b)}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border-hi);border-radius:2px}
    .mono{font-family:var(--font-m)}.display{font-family:var(--font-d)}
    @keyframes slide-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes drawer-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
    @keyframes fade-in{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
    @keyframes pulse-voice{0%,100%{box-shadow:0 4px 16px rgba(0,119,204,0.4)}50%{box-shadow:0 4px 24px rgba(0,119,204,0.6),0 0 0 8px rgba(0,119,204,0.1)}}
    .slide-in{animation:slide-in .25s ease}
    .spin{animation:spin 1s linear infinite}
    .blink{animation:blink 1.2s ease-in-out infinite}
    .card{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow)}
    .card-el{background:var(--bg-el);border:1px solid var(--border);border-radius:8px}
    .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-family:var(--font-b);font-size:13px;font-weight:500;cursor:pointer;border:none;transition:all .15s;white-space:nowrap}
    .btn-blue{background:var(--blue);color:#fff}.btn-blue:hover{filter:brightness(1.1)}
    .btn-ghost{background:transparent;color:var(--text-sec);border:1px solid var(--border)}.btn-ghost:hover{background:var(--bg-hover);color:var(--text)}
    .btn-danger{background:var(--red-dim);color:var(--red);border:1px solid rgba(220,38,38,0.25)}.btn-danger:hover{background:var(--red);color:#fff}
    .btn-icon{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:6px;cursor:pointer;border:none;background:transparent;transition:all .15s;flex-shrink:0}
    .btn-icon:hover{background:var(--bg-hover)}.btn-icon.delete:hover{background:var(--red-dim);color:var(--red)}
    .btn-gmail{background:#fff;color:#444;border:1px solid var(--border);box-shadow:0 1px 3px rgba(0,0,0,0.08)}.btn-gmail:hover{background:var(--bg-hover)}
    .tag{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:4px;font-family:var(--font-m);font-size:11px;font-weight:500}
    .input{background:#fff;border:1px solid var(--border-hi);border-radius:8px;padding:9px 13px;color:var(--text);font-family:var(--font-b);font-size:13px;width:100%;outline:none;transition:border .15s;box-shadow:inset 0 1px 2px rgba(0,0,0,0.03)}
    .input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,119,204,0.1)}
    select.input{cursor:pointer}
    textarea.input{resize:vertical;min-height:90px}
    .nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;color:var(--text-sec);font-size:13px;font-weight:500;transition:all .15s;border:none;background:transparent;width:100%}
    .nav-item:hover{background:var(--bg-hover);color:var(--text)}
    .nav-item.active{background:var(--blue-dim);color:var(--blue);border:1px solid rgba(0,119,204,0.15)}
    .row-hover:hover .row-actions{opacity:1!important}
    .form-label{font-size:11px;font-weight:600;color:var(--text-sec);font-family:var(--font-m);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;display:block}
    .form-group{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}
    .drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.25);z-index:100;animation:fade-in .2s ease}
    .drawer{position:fixed;top:0;right:0;bottom:0;width:min(480px,100vw);background:var(--bg-card);box-shadow:var(--shadow-lg);z-index:101;display:flex;flex-direction:column;animation:drawer-in .25s ease}
    .confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:200;display:flex;align-items:center;justify-content:center;animation:fade-in .15s ease}
    .confirm-box{background:#fff;border-radius:14px;padding:28px;width:340px;box-shadow:var(--shadow-lg)}
    .filter-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 0}
    .filter-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--bg-card);color:var(--text-sec);transition:all .15s}
    .filter-chip:hover,.filter-chip.active{background:var(--blue-dim);color:var(--blue);border-color:var(--blue)}
    .filter-select{padding:4px 8px;border-radius:6px;font-size:11px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-sec);cursor:pointer;font-family:var(--font-m)}

    /* ── Mobile responsiveness (≤768px) ── */
    .mobile-back{display:none;align-items:center;gap:6px;background:transparent;border:none;color:var(--blue);font-size:13px;cursor:pointer;padding:6px 0;margin-bottom:12px}
    .view-shell{display:flex;height:100%;overflow:hidden}
    .grid-resp-4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    @media (max-width:768px){
      .btn{padding:10px 16px;min-height:40px;font-size:13px}
      .btn-icon{width:36px;height:36px}
      .filter-chip{padding:6px 12px;font-size:12px}
      .input{padding:11px 13px;font-size:14px}
      .drawer{width:100vw}
      .confirm-box{width:min(340px,92vw);padding:22px}
      .card{border-radius:10px}
      .view-shell{flex-direction:column}
      .view-shell .list-pane{width:100%!important;border-right:none!important;border-bottom:1px solid var(--border);max-height:none}
      .view-shell .detail-pane{padding:16px!important}
      .view-shell.has-selection .list-pane{display:none}
      .view-shell:not(.has-selection) .detail-pane{display:none}
      .mobile-back{display:inline-flex}
      .grid-resp-4{grid-template-columns:repeat(2,1fr)}
      .fab-stack{bottom:calc(78px + env(safe-area-inset-bottom, 0px))!important;right:14px!important}
      main{padding-bottom:calc(64px + env(safe-area-inset-bottom, 0px))!important}
      .header-actions{flex-wrap:wrap!important;justify-content:flex-end!important}
    }
  `}</style>
);

/* ── SEED DATA ── */
const initDB = () => ({
  contacts: [
    { id:1, name:"Dave Scott", co:"Scott Management", role:"CEO", email:"dave@scottmgmt.com", phone:"(310) 555-0121", status:"client", score:92, tags:["anchor"], lastTouch:"2026-03-10", notes:"Anchor client. Happy. Wants to expand AI ops to 3 more communities.", category:"customer", companyId:null },
    { id:2, name:"Rachel Kim", co:"Rapid Medical", role:"COO", email:"r.kim@rapidmed.com", phone:"(323) 555-0188", status:"at-risk", score:41, tags:["payments-behind"], lastTouch:"2026-02-28", notes:"Payments 30+ days behind. Engagement at risk.", category:"customer", companyId:null },
    { id:3, name:"Michael Torres", co:"Horizon HOA Group", role:"VP Operations", email:"m.torres@horizonhoa.com", phone:"(714) 555-0244", status:"prospect", score:78, tags:["warm"], lastTouch:"2026-03-05", notes:"Interested in Salesforce ops fix. $80K potential.", category:"customer_lead", companyId:null },
    { id:4, name:"Sandra Liu", co:"Westcoast Property Partners", role:"Director IT", email:"sliu@wcpp.com", phone:"(818) 555-0311", status:"prospect", score:65, tags:["cold"], lastTouch:"2026-02-15", notes:"Met at NAA conference.", category:"customer_lead", companyId:null },
    { id:5, name:"James Okafor", co:"SunRidge Communities", role:"CFO", email:"j.okafor@sunridge.com", phone:"(619) 555-0177", status:"prospect", score:55, tags:["new"], lastTouch:"2026-03-12", notes:"Referred by Dave Scott.", category:"customer_lead", companyId:null },
    { id:6, name:"Priya Mehta", co:"ClearPath HOA", role:"CEO", email:"priya@clearpathoa.com", phone:"(424) 555-0299", status:"prospect", score:48, tags:["cold"], lastTouch:"2026-01-20", notes:"Initial outreach via LinkedIn.", category:"customer_lead", companyId:null },
  ],
  deals: [
    { id:1, name:"Scott Mgmt — Phase 2 Expansion", contactId:1, companyId:null, value:120000, stage:"negotiation", probability:85, closeDate:"2026-04-30", notes:"Expanding to 3 more HOA communities." },
    { id:2, name:"Rapid Medical — AWS Bedrock POC", contactId:2, companyId:null, value:45000, stage:"at-risk", probability:25, closeDate:"2026-03-31", notes:"Invoice unpaid. POC stalled." },
    { id:3, name:"Horizon HOA — Salesforce Ops Fix", contactId:3, companyId:null, value:80000, stage:"proposal", probability:60, closeDate:"2026-05-15", notes:"Sent SOW draft." },
    { id:4, name:"SunRidge — AI Ops Pilot", contactId:5, companyId:null, value:35000, stage:"discovery", probability:40, closeDate:"2026-06-01", notes:"Intro call scheduled." },
    { id:5, name:"ClearPath HOA — Ops Audit", contactId:6, companyId:null, value:18000, stage:"outreach", probability:15, closeDate:"2026-07-01", notes:"Need to re-engage." },
  ],
  campaigns: [
    { id:1, name:"HOA Ops Intelligence Series", type:"Email", status:"active", leads:47, opens:38, conversions:4, startDate:"2026-02-01" },
    { id:2, name:"LinkedIn — AI Ops Positioning", type:"Social", status:"active", leads:23, opens:1800, conversions:2, startDate:"2026-01-15" },
    { id:3, name:"Scott Mgmt Referral Program", type:"Referral", status:"active", leads:3, opens:3, conversions:1, startDate:"2026-03-01" },
    { id:4, name:"Property Mgmt Pain-Point Outreach", type:"Email", status:"draft", leads:0, opens:0, conversions:0, startDate:"2026-04-01" },
  ],
  projects: [
    { id:1, name:"Scott Mgmt AI Ops Deployment", client:"Scott Management", companyId:null, type:"client", status:"active", progress:72, dueDate:"2026-04-15", priority:"high", notes:"" },
    { id:2, name:"Rapid Medical — Agentforce POC", client:"Rapid Medical", companyId:null, status:"stalled", progress:35, dueDate:"2026-03-31", priority:"critical", notes:"Stalled at 35%." },
    { id:3, name:"Horizon HOA SOW Finalization", client:"Horizon HOA", companyId:null, status:"active", progress:20, dueDate:"2026-03-20", priority:"high", notes:"" },
    { id:4, name:"BD Signal Tool — V2", client:"Internal", companyId:null, type:"strategic", status:"active", progress:55, dueDate:"2026-04-01", priority:"medium", notes:"" },
  ],
  tasks: [
    { id:1, title:"Follow up with Rachel Kim re: payment", projectId:2, contactId:2, companyId:null, dealId:2, due:"2026-03-14", done:false, priority:"critical", assignedTo:"Orchestrator", notes:"", status:"todo", category:"follow_up", source:"manual", recurrence:"none" },
    { id:2, title:"Send Phase 2 proposal to Dave Scott", projectId:1, contactId:1, companyId:null, dealId:1, due:"2026-03-16", done:false, priority:"high", assignedTo:"CRM Agent", notes:"", status:"todo", category:"deliverable", source:"manual", recurrence:"none" },
    { id:3, title:"SOW revision — Horizon HOA scope", projectId:3, contactId:3, companyId:null, dealId:3, due:"2026-03-18", done:false, priority:"high", assignedTo:"Ops Agent", notes:"", status:"in_progress", category:"deliverable", source:"manual", recurrence:"none" },
    { id:4, title:"Prep SunRidge intro call (3/18)", projectId:4, contactId:5, companyId:null, dealId:4, due:"2026-03-17", done:false, priority:"high", assignedTo:"CRM Agent", notes:"", status:"todo", category:"meeting_prep", source:"manual", recurrence:"none" },
    { id:5, title:"Publish LinkedIn post — AI Ops ROI", projectId:4, contactId:null, companyId:null, dealId:null, due:"2026-03-15", done:true, priority:"medium", assignedTo:"Marketing Agent", notes:"", status:"done", category:"outreach", source:"manual", recurrence:"none" },
  ],
  invoices: [
    { id:1, client:"Scott Management", amount:18500, status:"paid", issued:"2026-03-01", due:"2026-03-15", number:"INV-031", notes:"" },
    { id:2, client:"Scott Management", amount:18500, status:"pending", issued:"2026-03-15", due:"2026-04-01", number:"INV-032", notes:"" },
    { id:3, client:"Rapid Medical", amount:12500, status:"overdue", issued:"2026-02-01", due:"2026-02-28", number:"INV-029", notes:"13 days overdue." },
    { id:4, client:"Rapid Medical", amount:12500, status:"overdue", issued:"2026-02-15", due:"2026-03-01", number:"INV-030", notes:"12 days overdue." },
    { id:5, client:"Horizon HOA", amount:8000, status:"draft", issued:"", due:"", number:"INV-033", notes:"" },
  ],
  agentLogs: [
    { id:1, agent:"Billing Agent", type:"alert", message:"Rapid Medical: 2 invoices overdue ($25K). Recommend escalation call.", ts:"09:42", priority:"critical" },
    { id:2, agent:"CRM Agent", type:"opportunity", message:"SunRidge Communities (Scott referral) — $35K pilot. Intro call 3/18.", ts:"09:15", priority:"high" },
    { id:3, agent:"Marketing Agent", type:"insight", message:"3 SoCal HOA groups posted LinkedIn pain-points. BD Signal flagged.", ts:"08:50", priority:"medium" },
    { id:4, agent:"Ops Agent", type:"risk", message:"Rapid Medical POC stalled at 35% for 65 days.", ts:"08:30", priority:"critical" },
    { id:5, agent:"Orchestrator", type:"synthesis", message:"Revenue gap to $800K: $486K. Pipeline covers 58%. Need 2 new clients.", ts:"08:00", priority:"high" },
  ],
  voiceNotes: [],
  companies: [],
  companyNews: [],
  goals: [{ id:1, name:"Annual Revenue Target", target_value:800000, current_value:0, unit:"$", period:"annual", start_date:"2026-01-01", end_date:"2026-12-31", status:"active", notes:"" }],
  events: [],
  documents: [],
  ai_memories: [],
});

/* ── SUPABASE CLIENT ── */
const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL  || "";
const SUPA_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const ENV_READY = SUPA_URL.startsWith("https://") && SUPA_KEY.length > 10;

const supabase = ENV_READY ? createClient(SUPA_URL, SUPA_KEY) : null;

const DB_TABLES = [
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

const loadAllFromDB = async () => {
  const seed = initDB();
  const result = {};
  const fetches = await Promise.all(DB_TABLES.map(([, tbl]) => supabase.from(tbl).select("*").order("id")));
  // Check if this database has EVER been seeded (any table has data)
  const hasAnyData = fetches.some(({ data }) => data && data.length > 0);
  const toSeed = [];
  DB_TABLES.forEach(([key], i) => {
    const { data, error } = fetches[i];
    if (!error && data && data.length > 0) { result[key] = data; }
    else if (!hasAnyData) { result[key] = seed[key]; toSeed.push({ key, i }); }
    else { result[key] = []; } // Table is empty but DB is not fresh — don't re-seed
  });
  if (toSeed.length > 0) {
    await Promise.all(toSeed.map(({ key, i }) => {
      const [, tbl] = DB_TABLES[i];
      return seed[key].length > 0 ? supabase.from(tbl).upsert(seed[key]) : Promise.resolve();
    }));
  }
  return result;
};

const syncToDB = async (prev, next) => {
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
    }).map(r => ({ ...r, modified_by: modifiedBy, modified_at: modifiedAt }));
    if (toUpsert.length > 0) await supabase.from(tbl).upsert(toUpsert);
    const deleted = [...prevIds].filter(id => !nextIds.has(id));
    if (deleted.length > 0) {
      const { error } = await supabase.from(tbl).delete().in("id", deleted);
      if (error) console.error(`Delete failed for ${tbl}:`, error);
    }
  }
};

/* ── HELPERS ── */
const nextId = (arr) => arr.length ? Math.max(...arr.map(r => r.id)) + 1 : 1;
const fmt = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;
const sc = (k) => ({ client:"var(--green)", "at-risk":"var(--red)", prospect:"var(--blue)", active:"var(--green)", stalled:"var(--red)", draft:"var(--text-sec)", paid:"var(--green)", pending:"var(--amber)", overdue:"var(--red)", critical:"var(--red)", high:"var(--amber)", medium:"var(--blue)", low:"var(--green)", customer:"var(--green)", partner:"var(--purple)", customer_lead:"var(--blue)", partner_lead:"var(--purple)", vendor:"var(--amber)", inactive:"var(--text-dim)", todo:"var(--blue)", in_progress:"var(--amber)", waiting:"var(--purple)", done:"var(--green)", cancelled:"var(--text-dim)" }[k] || "var(--text-sec)");
const revenueData = [
  {m:"Oct",rev:32000},{m:"Nov",rev:28000},{m:"Dec",rev:41000},
  {m:"Jan",rev:37000},{m:"Feb",rev:31000},{m:"Mar",rev:47000},
];
const CONTACT_CATEGORIES = ["customer_lead","partner_lead","customer","partner","vendor"];
const TASK_STATUSES = ["todo","in_progress","waiting","done","cancelled"];
const TASK_CATEGORIES = ["follow_up","outreach","admin","research","meeting_prep","deliverable"];
const ASSOCIATES = [
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
const DOCUMENT_ENTITY_TYPES = [
  { type:"contact", key:"contacts", label:"Contact", name:r=>r.name },
  { type:"company", key:"companies", label:"Company", name:r=>r.name },
  { type:"document", key:"documents", label:"Document", name:r=>r.title || r.file_name || r.url },
  { type:"project", key:"projects", label:"Project", name:r=>r.name },
  { type:"task", key:"tasks", label:"Task", name:r=>r.title },
  { type:"campaign", key:"campaigns", label:"Campaign", name:r=>r.name },
  { type:"deal", key:"deals", label:"Deal", name:r=>r.name },
  { type:"invoice", key:"invoices", label:"Invoice", name:r=>r.number || r.client },
  { type:"payment", key:"payments", label:"Payment", name:r=>`${r.date || "Payment"} · ${fmt(r.amount || 0)}` },
  { type:"strategy", key:"strategies", label:"Strategy", name:r=>r.name },
  { type:"goal", key:"goals", label:"Goal", name:r=>r.name },
  { type:"ai_memory", key:"ai_memories", label:"AI Memory", name:r=>r.subject || r.memory_summary },
];
const RECORD_ROUTE_ALIASES = {
  contact:"contacts", contacts:"contact", company:"companies", companies:"company",
  deal:"deals", deals:"deal", document:"documents", documents:"document",
  project:"projects", projects:"project", task:"tasks", tasks:"task",
  campaign:"campaigns", campaigns:"campaign", invoice:"invoices", invoices:"invoice",
  payment:"payments", payments:"payment", strategy:"strategies", strategies:"strategy",
  goal:"goals", goals:"goal", ai_memory:"ai-memories", ai_memories:"ai_memory", "ai-memories":"ai_memory",
};
const recordPath = (type, id) => `#/${RECORD_ROUTE_ALIASES[type] || `${type}s`}/${id}`;
const parseAppHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  const [head, id] = raw.split("/");
  const type = RECORD_ROUTE_ALIASES[head];
  if (type && id) {
    const num = Number(id);
    return { view:"record", record:{ type, id: Number.isFinite(num) ? num : id } };
  }
  const valid = ["dashboard","orchestrator","associates","mstack","crm","companies","deals","marketing","tasks","projects","documents","voice","inbox","gcal","invoices","payments","goals","strategies","ai_memories","multi_llm","voitra_gate","admin"];
  return { view:valid.includes(head) ? head : "dashboard", record:null };
};
const daysBetween = (a,b) => Math.round((new Date(b)-new Date(a))/(1000*60*60*24));
const today = () => new Date().toISOString().split("T")[0];

async function callClaude(system, user, max=800, extra={}) {
  const r = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:max, system, messages:[{role:"user",content:user}], ...extra }),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

const logEvent = (db, setDB, entityType, entityId, eventType, description, source="system") => {
  setDB(d => ({...d, events: [{id:nextId(d.events), entity_type:entityType, entity_id:entityId, event_type:eventType, description, ts:new Date().toISOString(), source, metadata:"{}"}, ...d.events]}));
};

/* ── SHARED UI ── */
const Tag = ({ label, color }) => {
  const c = color || sc(label);
  return <span className="tag" style={{ color:c, background:`${c}18`, border:`1px solid ${c}30` }}>{label}</span>;
};

const ScoreBadge = ({ score }) => {
  const c = score>=70?"var(--green)":score>=50?"var(--amber)":"var(--red)";
  return <span className="mono" style={{ fontSize:11, padding:"2px 7px", borderRadius:4, background:`${c}15`, color:c, border:`1px solid ${c}30` }}>{score}</span>;
};

const MetricCard = ({ icon:Icon, label, value, sub, color="--blue", trend }) => (
  <div className="card slide-in" style={{ padding:"18px 20px", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, var(${color}), transparent)` }} />
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
      <div style={{ padding:8, borderRadius:8, background:`var(${color}-dim,rgba(0,119,204,0.08))` }}>
        <Icon size={15} color={`var(${color})`} />
      </div>
      {trend!=null && <span style={{ fontSize:11, color:trend>=0?"var(--green)":"var(--red)", display:"flex", alignItems:"center", gap:2 }}>
        {trend>=0?<ArrowUp size={11}/>:<ArrowDown size={11}/>}{Math.abs(trend)}%
      </span>}
    </div>
    <div style={{ fontFamily:"var(--font-d)", fontSize:26, fontWeight:800, color:`var(${color})`, lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:12, color:"var(--text-sec)", marginTop:5 }}>{label}</div>
    {sub && <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginTop:3 }}>{sub}</div>}
  </div>
);

const AgentBadge = ({ agent }) => {
  const c = ({Orchestrator:"var(--purple)","CRM Agent":"var(--blue)","Marketing Agent":"var(--amber)","Billing Agent":"var(--red)","Ops Agent":"var(--green)","News Engine":"var(--blue)"}[agent])||"var(--text-sec)";
  return <span className="mono" style={{ fontSize:10, color:c, background:`${c}18`, padding:"1px 6px", borderRadius:3 }}>{agent}</span>;
};

const ConfirmDelete = ({ label, onConfirm, onCancel }) => (
  <div className="confirm-overlay" onClick={onCancel}>
    <div className="confirm-box" onClick={e=>e.stopPropagation()}>
      <div style={{ width:44, height:44, borderRadius:"50%", background:"var(--red-dim)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
        <Trash2 size={20} color="var(--red)" />
      </div>
      <div style={{ fontFamily:"var(--font-d)", fontSize:17, fontWeight:700, marginBottom:8 }}>Delete {label}?</div>
      <p style={{ fontSize:13, color:"var(--text-sec)", lineHeight:1.5, marginBottom:24 }}>This cannot be undone.</p>
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn btn-danger" onClick={onConfirm} style={{ flex:1, justifyContent:"center" }}><Trash2 size={13}/>Delete</button>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1, justifyContent:"center" }}>Cancel</button>
      </div>
    </div>
  </div>
);

const Drawer = ({ title, onClose, onSave, saveLabel="Save", children }) => (
  <>
    <div className="drawer-overlay" onClick={onClose} />
    <div className="drawer">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700 }}>{title}</div>
        <button className="btn-icon" onClick={onClose}><X size={16}/></button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>{children}</div>
      <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", display:"flex", gap:8 }}>
        <button className="btn btn-blue" onClick={onSave} style={{ flex:1, justifyContent:"center" }}><Save size={13}/>{saveLabel}</button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </>
);

const Field = ({ label, children }) => (
  <div className="form-group"><label className="form-label">{label}</label>{children}</div>
);
const Inp = ({ value, onChange, placeholder, type="text" }) => (
  <input className="input" type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />
);
const Sel = ({ value, onChange, options }) => (
  <select className="input" value={value} onChange={e=>onChange(e.target.value)}>
    {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
  </select>
);
const Tex = ({ value, onChange, placeholder }) => (
  <textarea className="input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />
);
const SearchSelect = ({ value, onChange, options, placeholder, entityType, navigate }) => {
  // options: [{value:"1", label:"Name"}, ...]. value is the selected value string.
  // entityType + navigate (optional): when both provided and a value is selected,
  // the displayed label becomes a clickable EntityLink that navigates to that record.
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  const hasValue = !open && selected;
  const linkable = hasValue && entityType && navigate && ENTITY_NAV[entityType];
  return (
    <div style={{ position:"relative" }}>
      {linkable ? (
        <div className="input" style={{ fontSize:13, paddingRight:28, display:"flex", alignItems:"center", minHeight:36, cursor:"pointer" }}
             onClick={() => { setOpen(true); setQ(""); }}>
          <EntityLink type={entityType} id={value} navigate={navigate} style={{ fontSize:13, color:"var(--blue)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {selected.label}
          </EntityLink>
        </div>
      ) : (
        <input className="input" value={open ? q : (selected?.label || "")} placeholder={placeholder || "Search…"}
          onFocus={() => { setOpen(true); setQ(""); }}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          style={{ fontSize:13, paddingRight: hasValue ? 28 : undefined }}
        />
      )}
      {hasValue && (
        <button
          type="button"
          title="Clear"
          onMouseDown={e => e.preventDefault()}
          onClick={(e) => { e.stopPropagation(); onChange(""); setQ(""); setOpen(false); }}
          style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", width:18, height:18, borderRadius:4, border:"none", background:"transparent", cursor:"pointer", color:"var(--text-sec)", display:"flex", alignItems:"center", justifyContent:"center", padding:0, zIndex:2 }}
        ><X size={12}/></button>
      )}
      {open && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:998 }} onClick={() => setOpen(false)}/>
          <div style={{ position:"absolute", top:"100%", left:0, right:0, maxHeight:180, overflowY:"auto", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:999, marginTop:2 }}>
            <div style={{ padding:"6px 10px", fontSize:11, color:"var(--text-dim)", cursor:"pointer", borderBottom:"1px solid var(--border)" }} onClick={() => { onChange(""); setOpen(false); }}>— none —</div>
            {filtered.slice(0, 20).map(o => (
              <div key={o.value} style={{ padding:"7px 10px", fontSize:12, cursor:"pointer", background:String(o.value)===String(value)?"var(--blue-dim)":"transparent" }}
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(String(o.value)); setOpen(false); setQ(""); }}>
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding:"8px 10px", fontSize:11, color:"var(--text-dim)" }}>No results</div>}
          </div>
        </>
      )}
    </div>
  );
};

const EntityLink = ({ type, id, navigate, children, className, style, title }) => {
  if (!id) return <span className={className} style={style}>{children}</span>;
  const openRecord = () => navigate ? navigate("record", { type, id }) : window.location.hash = recordPath(type, id);
  return (
    <span
      className={className}
      title={title || `Open ${type}`}
      onClick={(e) => { e.stopPropagation(); openRecord(); }}
      style={{ ...style, cursor:"pointer", textDecoration:"underline", textDecorationStyle:"dotted", textDecorationColor:"var(--border-hi)", textUnderlineOffset:2 }}
    >{children}</span>
  );
};

const docAssociationKey = (a) => `${a.type}:${a.id}`;
const normalizeDocId = (id) => Number(id) || id;
const docHasAssociation = (doc, type, id) => (doc.associations || []).some(a => a.type === type && String(a.id) === String(id));
const getDocEntityConfig = (type) => DOCUMENT_ENTITY_TYPES.find(e => e.type === type);
const getDocEntityLabel = (db, assoc) => {
  const cfg = getDocEntityConfig(assoc.type);
  const rec = cfg ? (db[cfg.key] || []).find(r => String(r.id) === String(assoc.id)) : null;
  return rec ? `${cfg.label}: ${cfg.name(rec) || "Untitled"}` : `${cfg?.label || assoc.type}: ${assoc.id}`;
};
const formatDocSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};
const getDocKindLabel = (doc) => {
  if (doc.file_name || doc.storage_path || doc.kind === "attachment" || doc.kind === "file") return "Attachment";
  if (doc.url || doc.kind === "link") return "Link";
  return "Document";
};
const uploadDocumentFile = async (file) => {
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
const blankDocument = (associations=[]) => ({
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
const buildDocOptions = (db) => DOCUMENT_ENTITY_TYPES.map(cfg => ({
  ...cfg,
  options:(db[cfg.key] || []).map(r => ({ value:String(r.id), label:cfg.name(r) || "Untitled" }))
}));

const DocumentAssociationEditor = ({ db, value, onChange }) => {
  const options = buildDocOptions(db);
  const addAssociation = (type, id) => {
    if (!id) return;
    const next = [...(value || []), { type, id:normalizeDocId(id) }];
    const unique = Array.from(new Map(next.map(a => [docAssociationKey(a), a])).values());
    onChange(unique);
  };
  const removeAssociation = (assoc) => onChange((value || []).filter(a => docAssociationKey(a) !== docAssociationKey(assoc)));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {(value || []).map(a => (
          <span key={docAssociationKey(a)} className="tag" style={{ color:"var(--blue)", background:"var(--blue-dim)", border:"1px solid rgba(0,119,204,0.18)" }}>
            {getDocEntityLabel(db, a)}
            <button type="button" onClick={() => removeAssociation(a)} style={{ border:"none", background:"transparent", color:"inherit", cursor:"pointer", padding:0, display:"flex" }}><X size={11}/></button>
          </span>
        ))}
        {(value || []).length === 0 && <span className="mono" style={{ fontSize:11, color:"var(--text-dim)" }}>No associations yet</span>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {options.map(cfg => (
          <SearchSelect
            key={cfg.type}
            value=""
            onChange={id => addAssociation(cfg.type, id)}
            options={cfg.options}
            placeholder={`Add ${cfg.label.toLowerCase()}...`}
          />
        ))}
      </div>
    </div>
  );
};

const AssociatedDocumentsPanel = ({ db, setDB, entityType, entityId, title="Documents" }) => {
  const [drawer, setDrawer] = useState(null);
  const [doc, setDoc] = useState(blankDocument([{ type:entityType, id:entityId }]));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const drawerFileInputRef = useRef(null);
  const docs = (db.documents || []).filter(d => docHasAssociation(d, entityType, entityId)).sort((a,b) => (b.id || 0) - (a.id || 0));
  const openNew = () => { setDoc(blankDocument([{ type:entityType, id:entityId }])); setDrawer("add"); };
  const openEdit = (d) => { setDoc({ ...d, associations:d.associations || [] }); setDrawer("edit"); };
  const saveDoc = () => {
    if (!doc.title && !doc.file_name && !doc.url) return;
    const rec = { ...doc, title:doc.title || doc.file_name || (doc.kind === "link" ? doc.url : "Untitled document"), associations:doc.associations || [] };
    setDB(prev => drawer === "add"
      ? { ...prev, documents:[{ ...rec, id:nextId(prev.documents || []) }, ...(prev.documents || [])] }
      : { ...prev, documents:(prev.documents || []).map(d => d.id === rec.id ? rec : d) }
    );
    setDrawer(null);
  };
  const uploadForEntity = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        try {
          uploaded.push({ ...blankDocument([{ type:entityType, id:entityId }]), id:0, ...(await uploadDocumentFile(file)) });
        } catch (error) { console.error("Upload error:", error); }
      }
      if (uploaded.length) {
        setDB(prev => {
          let id = nextId(prev.documents || []);
          return { ...prev, documents:[...uploaded.map(d => ({ ...d, id:id++ })), ...(prev.documents || [])] };
        });
      }
    } catch (err) { console.error("Document upload failed:", err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const attachFileToDraft = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadDocumentFile(file);
      setDoc(p => ({ ...p, ...uploaded, title:p.title || uploaded.title }));
    } catch (err) { console.error("Document upload failed:", err); }
    setUploading(false);
    if (drawerFileInputRef.current) drawerFileInputRef.current.value = "";
  };
  return (
    <div className="card-el" style={{ padding:14, marginTop:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{title.toUpperCase()} ({docs.length})</div>
        <div style={{ display:"flex", gap:6 }}>
          <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={uploadForEntity}/>
          <button className="btn btn-ghost" style={{ fontSize:11, padding:"4px 8px" }} disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <><Loader size={11} className="spin"/>Uploading</> : <><Upload size={11}/>Add File</>}
          </button>
          <button className="btn btn-blue" style={{ fontSize:11, padding:"4px 8px" }} onClick={openNew}><Plus size={11}/>New Document</button>
        </div>
      </div>
      {docs.length === 0 ? <div className="mono" style={{ fontSize:11, color:"var(--text-dim)" }}>No documents linked yet.</div> : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {docs.map(d => (
            <div key={d.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, background:"var(--bg)" }}>
              {(d.file_name || d.storage_path) ? <Paperclip size={13} color="var(--blue)"/> : <ExternalLink size={13} color="var(--blue)"/>}
              <div style={{ flex:1, minWidth:0 }}>
                <a href={d.url || "#"} target={d.url ? "_blank" : undefined} rel="noopener noreferrer" style={{ fontSize:12, fontWeight:600, color:d.url ? "var(--blue)" : "var(--text)", textDecoration:"none" }}>{d.title || d.file_name || "Untitled document"}</a>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{getDocKindLabel(d)} · {(d.associations || []).length} association{(d.associations || []).length === 1 ? "" : "s"}{d.file_size ? ` · ${formatDocSize(d.file_size)}` : ""}</div>
              </div>
              <button className="btn-icon" title="Edit associations" onClick={() => openEdit(d)}><Pencil size={13}/></button>
            </div>
          ))}
        </div>
      )}
      {drawer && <Drawer title={drawer === "add" ? "New Document" : "Edit Document"} onClose={() => setDrawer(null)} onSave={saveDoc}>
        <Field label="Title"><Inp value={doc.title || ""} onChange={v => setDoc(p => ({ ...p, title:v }))} placeholder="Document title"/></Field>
        <Field label="Description"><Tex value={doc.description || ""} onChange={v => setDoc(p => ({ ...p, description:v }))} placeholder="What this document is for"/></Field>
        <Field label="Attachment">
          <input ref={drawerFileInputRef} type="file" style={{ display:"none" }} onChange={attachFileToDraft}/>
          <button type="button" className="btn btn-ghost" disabled={uploading} onClick={() => drawerFileInputRef.current?.click()}>
            {uploading ? <><Loader size={13} className="spin"/>Uploading...</> : <><Paperclip size={13}/>Upload attachment</>}
          </button>
          <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginTop:6 }}>PDF, image, markdown, HTML, ZIP, Office files, text, CSV, and other file types.</div>
          {doc.file_name && <div className="card-el" style={{ padding:"8px 10px", marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
            <Paperclip size={13} color="var(--blue)"/>
            <span style={{ flex:1, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.file_name}</span>
            <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{formatDocSize(doc.file_size)}</span>
          </div>}
        </Field>
        <Field label="Link"><Inp value={doc.kind === "link" || !doc.file_name ? (doc.url || "") : ""} onChange={v => setDoc(p => ({ ...p, url:v, kind:v ? "link" : p.kind, file_name:v ? "" : p.file_name, file_type:v ? "" : p.file_type, file_size:v ? 0 : p.file_size, storage_path:v ? "" : p.storage_path }))} placeholder="https://..."/></Field>
        <Field label="Associations"><DocumentAssociationEditor db={db} value={doc.associations || []} onChange={v => setDoc(p => ({ ...p, associations:v }))}/></Field>
      </Drawer>}
    </div>
  );
};
const RowActions = ({ onEdit, onDelete }) => (
  <div className="row-actions" style={{ display:"flex", gap:2, opacity:0, transition:"opacity .15s" }}>
    <button className="btn-icon" title="Edit" onClick={e=>{e.stopPropagation();onEdit();}}><Pencil size={13} color="var(--text-sec)"/></button>
    <button className="btn-icon delete" title="Delete" onClick={e=>{e.stopPropagation();onDelete();}}><Trash2 size={13} color="var(--text-sec)"/></button>
  </div>
);

/* ── ACTIVITY TIMELINE COMPONENT ── */
const ActivityTimeline = ({ events, entityType, entityId }) => {
  const filtered = events.filter(e => e.entity_type === entityType && e.entity_id === entityId).slice(0, 10);
  if (filtered.length === 0) return null;
  return (
    <div style={{ marginTop:16 }}>
      <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>ACTIVITY TIMELINE</div>
      {filtered.map(e => (
        <div key={e.id} className="card-el" style={{ padding:"8px 12px", marginBottom:6, borderLeft:`2px solid ${sc(e.event_type)}`, display:"flex", gap:8, alignItems:"flex-start" }}>
          <Activity size={11} color="var(--text-sec)" style={{ flexShrink:0, marginTop:3 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, lineHeight:1.5 }}>{e.description}</div>
            <div className="mono" style={{ fontSize:9, color:"var(--text-dim)", marginTop:2 }}>{e.ts ? new Date(e.ts).toLocaleDateString() : ""} · {e.source}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── AUTH SCREENS ── */
const LoadingScreen = ({ msg="Loading…" }) => (
  <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--bg)", gap:14 }}>
    <div style={{ width:44, height:44, borderRadius:12, background:"var(--blue-dim)", border:"1px solid rgba(0,119,204,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Brain size={22} color="var(--blue)"/>
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:8, color:"var(--text-sec)", fontSize:13 }}>
      <Loader size={14} className="spin" color="var(--blue)"/>
      <span className="mono">{msg}</span>
    </div>
  </div>
);

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const signIn = async () => {
    if (!email || !password) { setError("Email and password required."); return; }
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) setError(e.message);
    setLoading(false);
  };
  return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <GlobalStyle/>
      <div className="card" style={{ width:"min(400px,92vw)", padding:36, display:"flex", flexDirection:"column", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginBottom:4 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"var(--blue-dim)", border:"1px solid rgba(0,119,204,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Brain size={26} color="var(--blue)"/>
          </div>
          <div className="display" style={{ fontSize:20, fontWeight:800 }}>Second Brain</div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>Life Operating System · Private Access</div>
        </div>
        {error && <div style={{ background:"var(--red-dim)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:8, padding:"10px 14px", fontSize:12, color:"var(--red)", display:"flex", gap:7 }}><AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }}/>{error}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Field label="Email"><input className="input" type="email" value={email} placeholder="you@example.com" onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&signIn()}/></Field>
          <Field label="Password"><input className="input" type="password" value={password} placeholder="••••••••" onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&signIn()}/></Field>
        </div>
        <button className="btn btn-blue" onClick={signIn} disabled={loading} style={{ justifyContent:"center", opacity:loading?0.6:1, height:42, fontSize:14 }}>
          {loading ? <><Loader size={14} className="spin"/>Signing in…</> : <><Shield size={14}/>Sign In</>}
        </button>
      </div>
    </div>
  );
};

/* ── SIDEBAR ── */
const NAV = [
  {id:"dashboard",icon:BarChart2,label:"Dashboard"},
  {id:"associates",icon:BookOpen,label:"Associates"},
  {id:"tasks",icon:CheckCircle,label:"Tasks"},
  {divider:true},
  {id:"crm",icon:Users,label:"Contacts"},
  {id:"companies",icon:Building2,label:"Companies"},
    {id:"marketing",icon:Megaphone,label:"Marketing"},
  {id:"projects",icon:Briefcase,label:"Projects"},
  {id:"documents",icon:FileText,label:"Documents"},
    {id:"_fin",icon:DollarSign,label:"Financials",group:true,children:["deals","invoices","payments"]},
  {id:"deals",icon:Target,label:"Deals",parent:"_fin"},
  {id:"invoices",icon:FileText,label:"Invoices",parent:"_fin"},
  {id:"payments",icon:CreditCard,label:"Payments",parent:"_fin"},
  {divider:true},
  {id:"inbox",icon:Inbox,label:"Inbox"},
  {id:"gcal",icon:Calendar,label:"Google Cal"},
  {divider:true},
  {id:"ai_memories",icon:Sparkles,label:"AI Memories"},
  {id:"multi_llm",icon:MessageSquare,label:"AI Playground"},
  {id:"strategies",icon:Target,label:"Strategies"},
  {id:"goals",icon:Award,label:"Goals"},
  {id:"voitra_gate",icon:Mic,label:"Voitra Agent Control"},
  {id:"admin",icon:Shield,label:"Admin"},
];

const Sidebar = ({ view, setView, collapsed, setCollapsed, alerts, db }) => {
  const [collGroups, setCollGroups] = useState({});
  return (<div style={{ width:collapsed?60:210, background:"var(--bg-card)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", padding:"14px 8px", gap:2, transition:"width .25s", flexShrink:0 }}>
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 6px 18px", cursor:"pointer" }} onClick={()=>setCollapsed(!collapsed)}>
      <div style={{ width:32, height:32, borderRadius:8, background:"var(--blue-dim)", border:"1px solid rgba(0,119,204,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Brain size={16} color="var(--blue)"/>
      </div>
      {!collapsed && <div><div className="display" style={{ fontSize:13, fontWeight:700 }}>Second Brain</div><div className="mono" style={{ fontSize:9, color:"var(--text-sec)" }}>Life OS</div></div>}
    </div>
    {NAV.map((n,i)=>{
              if(!n.id) return <div key={i} style={{marginTop:8,marginBottom:8,borderTop:"1px solid var(--border)"}} />;
              if(n.group) { const open=!collGroups[n.id]; const childActive=n.children&&n.children.includes(view); return <div key={i}>
                <button onClick={()=>setCollGroups(g=>({...g,[n.id]:!g[n.id]}))} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 12px",border:"none",background:childActive?"var(--active-bg,rgba(59,130,246,0.08))":"transparent",color:childActive?"var(--accent)":"var(--text-sec)",cursor:"pointer",borderRadius:8,fontSize:"0.85rem"}}>
                  <n.icon size={16}/><span style={{flex:1,textAlign:"left"}}>{n.label}</span><ChevronRight size={14} style={{transform:open?"rotate(90deg)":"none",transition:"transform 0.2s"}}/>
                </button>
                {open&&<div style={{marginLeft:12}}>
                  {NAV.filter(c=>c.parent===n.id).map(c=>{const act=view===c.id;return <button key={c.id} onClick={()=>setView(c.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"5px 12px",border:"none",background:act?"var(--active-bg,rgba(59,130,246,0.08))":"transparent",color:act?"var(--accent)":"var(--text-sec)",cursor:"pointer",borderRadius:8,fontSize:"0.82rem"}}><c.icon size={14}/>{c.label}</button>})}
                </div>}
              </div>; }
              if(n.parent) return null;
              const act=view===n.id;
              return <button key={i} onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 12px",border:"none",background:act?"var(--active-bg,rgba(59,130,246,0.08))":"transparent",color:act?"var(--accent)":"var(--text-sec)",cursor:"pointer",borderRadius:8,fontSize:"0.85rem"}}><n.icon size={16}/>{n.label}{n.id==="orchestrator"&&(db.tasks||[]).filter(t=>t.priority==="critical"&&t.status!=="done").length>0&&<span style={{marginLeft:"auto",background:"var(--red,#e53e3e)",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:"0.7rem"}}>{(db.tasks||[]).filter(t=>t.priority==="critical"&&t.status!=="done").length}</span>}</button>;
            })}
    <div style={{ marginTop:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 6px" }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", flexShrink:0 }} className="blink"/>
        {!collapsed && <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>6 agents live</span>}
      </div>
    </div>
  </div>
)}

const BottomNav = ({ view, setView }) => {
  const [showMore, setShowMore] = useState(false);
  const primary = [{id:"dashboard",icon:BarChart2,label:"Home"},{id:"associates",icon:BookOpen,label:"Associates"},{id:"orchestrator",icon:Brain,label:"AI"},{id:"crm",icon:Users,label:"Contacts"},{id:"tasks",icon:CheckCircle,label:"Tasks"}];
  const secondary = [{id:"deals",icon:Target,label:"Deals"},{id:"projects",icon:Briefcase,label:"Projects"},{id:"documents",icon:FileText,label:"Docs"},{id:"inbox",icon:Inbox,label:"Inbox"},{id:"gcal",icon:Calendar,label:"Calendar"},{id:"companies",icon:Building2,label:"Companies"},{id:"invoices",icon:DollarSign,label:"Billing"},{id:"payments",icon:CreditCard,label:"Payments"},{id:"ai_memories",icon:Sparkles,label:"Memories"},{id:"strategies",icon:Target,label:"Strategies"},{id:"goals",icon:Award,label:"Goals"},{id:"admin",icon:Shield,label:"Admin"}];
  const isSecondaryActive = secondary.some(n=>n.id===view);
  return (
    <>
      {showMore && <div style={{ position:"fixed", inset:0, zIndex:998 }} onClick={()=>setShowMore(false)}/>}
      {showMore && (
        <div style={{ position:"fixed", bottom:"calc(56px + env(safe-area-inset-bottom, 0px))", left:0, right:0, background:"var(--bg-card)", borderTop:"1px solid var(--border)", padding:"8px 6px", display:"flex", flexWrap:"wrap", gap:4, zIndex:999, boxShadow:"0 -4px 20px rgba(0,0,0,0.15)" }}>
          {secondary.map(n=>(
            <button key={n.id} onClick={()=>{setView(n.id);setShowMore(false);}} style={{ flex:"1 1 30%", display:"flex", alignItems:"center", gap:6, background:view===n.id?"var(--blue-dim)":"transparent", border:view===n.id?"1px solid rgba(0,119,204,0.2)":"1px solid transparent", borderRadius:8, cursor:"pointer", padding:"8px 10px" }}>
              <n.icon size={15} color={view===n.id?"var(--blue)":"var(--text-sec)"}/>
              <span style={{ fontSize:12, color:view===n.id?"var(--blue)":"var(--text-sec)" }}>{n.label}</span>
            </button>
          ))}
        </div>
      )}
      <div style={{ position:"fixed", left:0, right:0, bottom:0, display:"flex", background:"var(--bg-card)", borderTop:"1px solid var(--border)", padding:"6px 0 calc(10px + env(safe-area-inset-bottom, 0px))", flexShrink:0, zIndex:997, boxShadow:"0 -2px 12px rgba(0,0,0,0.08)" }}>
        {primary.map(n=>(
          <button key={n.id} onClick={()=>{setView(n.id);setShowMore(false);}} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"transparent", border:"none", cursor:"pointer", padding:"4px 0" }}>
            <n.icon size={17} color={view===n.id?"var(--blue)":"var(--text-sec)"}/>
            <span style={{ fontSize:9, color:view===n.id?"var(--blue)":"var(--text-sec)" }}>{n.label}</span>
          </button>
        ))}
        <button onClick={()=>setShowMore(!showMore)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"transparent", border:"none", cursor:"pointer", padding:"4px 0" }}>
          <MoreVertical size={17} color={showMore||isSecondaryActive?"var(--blue)":"var(--text-sec)"}/>
          <span style={{ fontSize:9, color:showMore||isSecondaryActive?"var(--blue)":"var(--text-sec)" }}>More</span>
        </button>
      </div>
    </>
  );
};

/* ────────────────────────────────────────────────────────
   DASHBOARD — Morning Brief + Goal Tracking
──────────────────────────────────────────────────────── */
const Dashboard = ({ db, setDB, setView, navigate, session , runSweep, sweepRunning, setShowVoiceLab}) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userName = session?.user?.user_metadata?.full_name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "there";
  const paid = db.invoices.filter(i=>i.status==="paid").reduce((a,i)=>a+i.amount,0);
  const pipeline = db.deals.reduce((a,d)=>a+d.value*d.probability/100,0);
  const overdue = db.invoices.filter(i=>i.status==="overdue").reduce((a,i)=>a+i.amount,0);
  const goal = db.goals.find(g=>g.status==="active") || { target_value:800000 };
  const goalPct = Math.round((paid / goal.target_value) * 100);
  const openTasks = db.tasks.filter(t=>!t.done && t.status !== "done" && t.status !== "cancelled");
  const dueTodayOrOverdue = openTasks.filter(t => t.due && t.due <= today());
  const criticalItems = openTasks.filter(t=>t.priority==="critical");
  const decayedContacts = db.contacts.filter(c => c.lastTouch && c.score >= 60 && daysBetween(c.lastTouch, today()) > 14);
  const todayEvents = (db.events||[]).filter(e=>e.date===today()).sort((a,b)=>(a.start_time||"").localeCompare(b.start_time||""));

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:22 }}>
      {/* Morning Brief */}
      <div className="card" style={{ padding:20, borderLeft:"4px solid var(--purple)", background:"linear-gradient(135deg, rgba(124,58,237,0.03), transparent)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div className="display" style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>{greeting}, {userName}.</div>
            <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>
              {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} · 6 agents running
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><button className="btn btn-sm" style={{display:"flex",alignItems:"center",gap:4,fontSize:11,padding:"4px 10px"}} onClick={()=>{if(!sweepRunning)runSweep()}}>{sweepRunning?<Loader size={13} className="spin"/>:<Zap size={13}/>} {sweepRunning?"Running...":"AI Sweep"}</button><button className="btn btn-sm" style={{display:"flex",alignItems:"center",gap:4,fontSize:11,padding:"4px 10px"}} onClick={()=>{setShowVoiceLab(true)}}><Mic size={13}/> Voice</button></div>
        </div>
        {(dueTodayOrOverdue.length > 0 || criticalItems.length > 0 || decayedContacts.length > 0 || todayEvents.length > 0) && (
          <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:6 }}>
            <div className="mono" style={{ fontSize:10, color:"var(--purple)" }}>TODAY'S PRIORITIES</div>
            {criticalItems.slice(0,3).map(t => (
              <div key={t.id} onClick={()=>navigate("tasks",{type:"task",id:t.id})} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"var(--red-dim)", borderRadius:6, cursor:"pointer", transition:"filter .15s" }} onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
                <AlertCircle size={12} color="var(--red)"/>
                <span style={{ fontWeight:600, color:"var(--red)" }}>CRITICAL:</span>
                <span>{t.title}</span>
                {t.due && <span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>Due {t.due}</span>}
                <ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0}}/>
              </div>
            ))}
            {dueTodayOrOverdue.filter(t=>t.priority!=="critical").slice(0,4).map(t => (
              <div key={t.id} onClick={()=>navigate("tasks",{type:"task",id:t.id})} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"var(--amber-dim)", borderRadius:6, cursor:"pointer", transition:"filter .15s" }} onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
                <Clock size={12} color="var(--amber)"/>
                <span>{t.title}</span>
                <Tag label={t.priority}/>
                {t.due && <span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>{t.due}</span>}
                <ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0}}/>
              </div>
            ))}
            {decayedContacts.slice(0,2).map(c => (
              <div key={c.id} onClick={()=>navigate("crm",{type:"contact",id:c.id})} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"var(--blue-dim)", borderRadius:6, cursor:"pointer", transition:"filter .15s" }} onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
                <Users size={12} color="var(--blue)"/>
                <span>Reconnect with <strong>{c.name}</strong> ({c.co}) — {daysBetween(c.lastTouch, today())} days since last touch</span>
                <ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0}}/>
              </div>
            ))}
            {todayEvents.length > 0 && <>
              <div className="mono" style={{ fontSize:10, color:"var(--blue)", marginTop:6 }}>TODAY'S SCHEDULE</div>
              {todayEvents.slice(0,4).map(evt => (
                <div key={evt.id} onClick={()=>setView("gcal")} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"rgba(0,119,204,0.06)", borderRadius:6, cursor:"pointer", borderLeft:`3px solid ${({meeting:"var(--blue)",call:"var(--purple)",reminder:"var(--amber)",event:"var(--green)"}[evt.type]||"var(--blue)")}` }}>
                  <Calendar size={12} color="var(--blue)"/>
                  <span className="mono" style={{ fontSize:11, color:"var(--text-sec)", flexShrink:0 }}>{evt.start_time}</span>
                  <span style={{ fontWeight:500 }}>{evt.title}</span>
                  {evt.location&&<span className="mono" style={{ fontSize:10, color:"var(--text-dim)" }}>📍 {evt.location}</span>}
                  <ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0, marginLeft:"auto"}}/>
                </div>
              ))}
            </>}
          </div>
        )}
      </div>

      {/* AI Nudges — latest orchestrator sweep */}
      {(()=>{
        const latestSweep = (db.agentLogs||[]).find(l=>l.agent==="Orchestrator"&&l.type==="sweep");
        if(!latestSweep) return null;
        const lines = latestSweep.message.split(/\n+/).filter(l=>l.trim());
        return (
          <div className="card" style={{ padding:20, borderLeft:"4px solid var(--amber)", background:"linear-gradient(135deg, rgba(245,158,11,0.04), transparent)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Zap size={14} color="var(--amber)"/>
                <span style={{ fontFamily:"var(--font-d)", fontSize:14, fontWeight:700 }}>Today's AI Nudges</span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{latestSweep.ts}</span>
                <button className="btn btn-sm" style={{ fontSize:10, padding:"3px 8px" }} onClick={()=>{if(!sweepRunning)runSweep()}}>{sweepRunning?<Loader size={11} className="spin"/>:<RefreshCw size={11}/>}</button>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {lines.map((line,i)=>{
                const isBold = /^(\d+\.|TOP|DEAL|STRATEGIC|SMART|NUDGE|PRIORITY)/i.test(line.trim());
                return <div key={i} style={{ fontSize:13, lineHeight:1.6, fontWeight:isBold?600:400, color:isBold?"var(--text)":"var(--text-sec)", paddingLeft:isBold?0:8 }}>{line}</div>;
              })}
            </div>
          </div>
        );
      })()}

      {/* Metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12 }}>
        <MetricCard icon={TrendingUp} label="YTD Revenue" value={fmt(paid)} sub={`${fmt(goal.target_value)} target · ${goalPct}%`} color="--blue" trend={12}/>
        <MetricCard icon={Target} label="Wtd Pipeline" value={fmt(Math.round(pipeline))} sub={`${db.deals.length} deals`} color="--amber" trend={8}/>
        <MetricCard icon={AlertCircle} label="Overdue A/R" value={fmt(overdue)} color="--red"/>
        <MetricCard icon={CheckCircle} label="Tasks Due" value={dueTodayOrOverdue.length} sub={`${openTasks.length} total open`} color="--green"/>
      </div>

      {/* Goal Progress Bar */}
      <div className="card" style={{ padding:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <Award size={14} color="var(--purple)"/>
            <span style={{ fontFamily:"var(--font-d)", fontSize:14, fontWeight:700 }}>{goal.name || "Revenue Goal"}</span>
          </div>
          <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{fmt(paid)} / {fmt(goal.target_value)}</span>
        </div>
        <div style={{ height:8, background:"var(--bg-el)", borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.min(goalPct,100)}%`, background:goalPct>=80?"var(--green)":goalPct>=40?"var(--amber)":"var(--red)", borderRadius:4, transition:"width .5s" }}/>
        </div>
        <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:6 }}>
          {goalPct}% of target · {fmt(goal.target_value - paid)} remaining · Pipeline coverage: {Math.round((pipeline/(goal.target_value-paid))*100)}%
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="card" style={{ padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700 }}>Revenue Trend</div>
          <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>Oct → Mar</span>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={revenueData}>
            <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0077cc" stopOpacity={.15}/><stop offset="95%" stopColor="#0077cc" stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="m" tick={{fill:"var(--text-sec)",fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"var(--text-sec)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}K`}/>
            <Tooltip contentStyle={{background:"#fff",border:"1px solid var(--border)",borderRadius:8,fontSize:12}} formatter={v=>[`$${v.toLocaleString()}`,"Revenue"]}/>
            <Area type="monotone" dataKey="rev" stroke="#0077cc" strokeWidth={2} fill="url(#bg)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Feed */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700 }}>Agent Feed</div>
          <button className="btn btn-ghost" style={{ fontSize:12, padding:"5px 10px" }} onClick={()=>{}}>All <ChevronRight size={12}/></button>
        </div>
        {db.agentLogs.slice(0,4).map(l=>(
          <div key={l.id} className="card-el slide-in" style={{ padding:"12px 14px", marginBottom:8, borderLeft:`2px solid ${sc(l.priority)}` }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
              <AgentBadge agent={l.agent}/><Tag label={l.type} color={sc(l.priority)}/>
              <span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>{l.ts}</span>
            </div>
            <p style={{ fontSize:13, lineHeight:1.5 }}>{l.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   CRM — Contacts with Categories + Company Linking
──────────────────────────────────────────────────────── */
const blankContact = () => ({ name:"", co:"", role:"", email:"", phone:"", status:"prospect", score:50, notes:"", lastTouch:today(), tags:[], linkedin_url:"", headline:"", connected_date:"", messaging_activity:"", priority:"Medium", follow_up:"", category:"customer_lead", companyId:"", source:"", referredBy:"", campaignId:"" });

const ContactForm = ({ data, onChange, companies, contacts, campaigns, setDB, db }) => {
  const handleCompany = (v) => {
    if (v) {
      const comp = companies.find(c => c.id === parseInt(v));
      onChange({...data, companyId: parseInt(v), co: comp?.name || data.co});
    } else {
      onChange({...data, companyId: null});
    }
  };
  const handleCompanyCreate = (name) => {
    if (!name.trim()) return;
    const existing = companies.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      onChange({...data, companyId: existing.id, co: existing.name});
    } else if (setDB) {
      const newId = companies.length ? Math.max(...companies.map(c=>c.id)) + 1 : 1;
      const newCo = { id: newId, name: name.trim(), industry: "", website: "", linkedin_url: "", news_keywords: "", status: "prospect", notes: "", created_at: new Date().toISOString().split("T")[0] };
      setDB(d => ({...d, companies: [...d.companies, newCo]}));
      onChange({...data, companyId: newId, co: name.trim()});
    }
  };
  return (
  <>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Field label="Name"><Inp value={data.name} onChange={v=>onChange({...data,name:v})} placeholder="Full name"/></Field>
      <Field label="Company">
        <div style={{display:"flex",gap:6}}>
          <div style={{flex:1}}><SearchSelect value={data.companyId?String(data.companyId):""} onChange={handleCompany} options={companies.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search companies…"/></div>
          <button type="button" className="btn btn-ghost" style={{fontSize:11,padding:"4px 8px",whiteSpace:"nowrap"}} onClick={()=>{const name=prompt("New company name:");if(name)handleCompanyCreate(name);}}>+ New</button>
        </div>
      </Field>
      <Field label="Role"><Inp value={data.role} onChange={v=>onChange({...data,role:v})} placeholder="Title"/></Field>
      <Field label="Category"><Sel value={data.category||"customer_lead"} onChange={v=>onChange({...data,category:v})} options={CONTACT_CATEGORIES.map(c=>({value:c,label:c.replace(/_/g," ")}))}/></Field>
      <Field label="Status"><Sel value={data.status} onChange={v=>onChange({...data,status:v})} options={["prospect","active","outreach","client","at-risk","inactive"]}/></Field>
      <Field label="Email"><Inp value={data.email} onChange={v=>onChange({...data,email:v})} placeholder="email@co.com"/></Field>
      <Field label="Phone"><Inp value={data.phone} onChange={v=>onChange({...data,phone:v})} placeholder="(xxx) xxx-xxxx"/></Field>
      <Field label="Score (0-100)"><Inp type="number" value={data.score} onChange={v=>onChange({...data,score:parseInt(v)||50})}/></Field>
      <Field label="Last Touch"><Inp type="date" value={data.lastTouch} onChange={v=>onChange({...data,lastTouch:v})}/></Field>
      <Field label="LinkedIn URL"><Inp value={data.linkedin_url||""} onChange={v=>onChange({...data,linkedin_url:v})} placeholder="https://linkedin.com/in/..."/></Field>
      <Field label="Headline"><Inp value={data.headline||""} onChange={v=>onChange({...data,headline:v})} placeholder="LinkedIn headline"/></Field>
      <Field label="Connected Date"><Inp value={data.connected_date||""} onChange={v=>onChange({...data,connected_date:v})} placeholder="e.g. Mar 12"/></Field>
      <Field label="Priority"><Sel value={data.priority||"Medium"} onChange={v=>onChange({...data,priority:v})} options={["High","Medium","Low"]}/></Field>
      <Field label="Source"><Sel value={data.source||""} onChange={v=>onChange({...data,source:v})} options={[{value:"",label:"Select source..."},{value:"referral",label:"Referral"},{value:"linkedin",label:"LinkedIn"},{value:"cold_outreach",label:"Cold Outreach"},{value:"inbound",label:"Inbound"},{value:"event",label:"Event"},{value:"campaign",label:"Campaign"},{value:"website",label:"Website"},{value:"other",label:"Other"}]}/></Field>
      <Field label="Referred By"><SearchSelect value={data.referredBy?String(data.referredBy):""} onChange={v=>onChange({...data,referredBy:v?parseInt(v):null})} options={(contacts||[]).filter(c=>c.id!==data.id).map(c=>({value:String(c.id),label:c.name+(c.co?" ("+c.co+")":"")}))} placeholder="Search contacts…"/></Field>
      <Field label="Campaign"><SearchSelect value={data.campaignId?String(data.campaignId):""} onChange={v=>onChange({...data,campaignId:v?parseInt(v):null})} options={(campaigns||[]).map(c=>({value:String(c.id),label:c.name}))} placeholder="Search campaigns…"/></Field>
    </div>
    <Field label="Messaging Activity"><Tex value={data.messaging_activity||""} onChange={v=>onChange({...data,messaging_activity:v})} placeholder="Messaging history summary…"/></Field>
    <Field label="Follow-Up Recommendation"><Tex value={data.follow_up||""} onChange={v=>onChange({...data,follow_up:v})} placeholder="Recommended next action…"/></Field>
    <Field label="Notes"><Tex value={data.notes} onChange={v=>onChange({...data,notes:v})} placeholder="Context, next steps…"/></Field>
  </>
  );
};

const CRMView = ({ db, setDB, setView, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [editContact, setEditContact] = useState(null);

  // Sync editContact when selection changes
  useEffect(() => {
    if (sel) {
      const c = db.contacts.find(c => c.id === sel);
      if (c) setEditContact({...c, companyId: c.companyId ? String(c.companyId) : "", referredBy: c.referredBy ? String(c.referredBy) : "", campaignId: c.campaignId ? String(c.campaignId) : ""});
    } else setEditContact(null);
  }, [sel, db.contacts]);

  useEffect(() => {
    if(focus?.type==="contact" && focus.id) { setCatFilter("all"); setSel(focus.id); setFocus(null); }
  }, [focus]);

  const filtered = db.contacts.filter(c => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !(c.co||"").toLowerCase().includes(query.toLowerCase())) return false;
    if (catFilter !== "all" && c.category !== catFilter) return false;
    return true;
  });

  const contact = sel ? db.contacts.find(c=>c.id===sel) : null;
  const contactDeals = contact ? db.deals.filter(d=>d.contactId===contact.id) : [];
  const contactTasks = contact ? db.tasks.filter(t=>t.contactId===contact.id && !t.done) : [];
  const contactCompany = contact && contact.companyId ? db.companies.find(c=>c.id===contact.companyId) : null;

  const save = () => {
    if (drawer.mode==="add") {
      const newC = {...drawer.data, id:nextId(db.contacts)};
      setDB(d=>({...d,contacts:[...d.contacts,newC]}));
      logEvent(db, setDB, "contact", newC.id, "created", `Contact created: ${newC.name} (${newC.co})`);
    } else {
      setDB(d=>({...d,contacts:d.contacts.map(c=>c.id===drawer.data.id?drawer.data:c)}));
    }
    setDrawer(null);
  };

  const del = (id) => {
    setDB(d=>({...d,contacts:d.contacts.filter(c=>c.id!==id)}));
    if(sel===id) setSel(null);
    setConfirm(null);
  };

  const convertContact = (contact, toCategory) => {
    const updated = {...contact, category:toCategory, status: toCategory==="customer"?"client":"active"};
    setDB(d => {
      let newState = {...d, contacts:d.contacts.map(c=>c.id===contact.id?updated:c)};
      // Auto-create deal if converting to customer
      if (toCategory === "customer") {
        const newDeal = { id:nextId(d.deals), name:`${contact.co||contact.name} — New Engagement`, contactId:contact.id, companyId:contact.companyId, value:0, stage:"discovery", probability:50, closeDate:"", notes:`Auto-created on conversion from ${contact.category}.` };
        newState = {...newState, deals:[...d.deals, newDeal]};
      }
      // Auto-create project if converting to partner
      if (toCategory === "partner") {
        const newProj = { id:nextId(d.projects), name:`Partner: ${contact.co||contact.name}`, client:contact.co||contact.name, companyId:contact.companyId, status:"active", progress:0, dueDate:"", priority:"medium", notes:`Partnership initiated. Converted from ${contact.category}.` };
        newState = {...newState, projects:[...d.projects, newProj]};
      }
      return newState;
    });
    logEvent(db, setDB, "contact", contact.id, "converted", `${contact.name} converted from ${contact.category} to ${toCategory}`);
  };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      {/* LEFT LIST */}
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Contacts</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setDrawer({mode:"add",data:blankContact()})}><Plus size={12}/>Add</button>
          </div>
          {/* Category filter chips */}
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
            {["all",...CONTACT_CATEGORIES].map(cat=>(
              <button key={cat} className={`filter-chip${catFilter===cat?" active":""}`} onClick={()=>setCatFilter(cat)}>
                {cat==="all"?"All":cat.replace(/_/g," ")}
              </button>
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(c=>(
            <div key={c.id} className="row-hover" onClick={()=>navigate("record",{type:"contact",id:c.id})}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===c.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ minWidth:0 }}>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</span>
                  {c.category && <span style={{ fontSize:9, padding:"1px 4px", borderRadius:3, background:`${sc(c.category)}15`, color:sc(c.category), fontFamily:"var(--font-m)" }}>{c.category.replace(/_/g," ")}</span>}
                </div>
                <div style={{ fontSize:11, color:"var(--text-sec)", marginTop:2 }}>{c.co||c.headline||""}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                <ScoreBadge score={c.score}/>
                <RowActions onEdit={()=>navigate("record",{type:"contact",id:c.id})} onDelete={()=>setConfirm({id:c.id,label:c.name})}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(contact && editContact) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("crm");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to contacts</button>
            {/* Header with name and actions */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{contact.name}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{contact.co} · {contact.role}</div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center" }}>
                <Tag label={contact.category?.replace(/_/g," ")||"lead"} color={sc(contact.category)}/>
                <Tag label={contact.status}/><ScoreBadge score={contact.score}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={()=>{
                  const updated = {...editContact, companyId:parseInt(editContact.companyId)||null, score:parseInt(editContact.score)||50, referredBy:parseInt(editContact.referredBy)||null, campaignId:parseInt(editContact.campaignId)||null};
                  setDB(d=>({...d,contacts:d.contacts.map(c=>c.id===updated.id?updated:c)}));
                }}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:contact.id,label:contact.name})}><Trash2 size={12}/></button>
              </div>
            </div>

            {/* Convert buttons for leads */}
            {(contact.category === "customer_lead" || contact.category === "partner_lead") && (
              <div className="card" style={{ padding:14, marginBottom:16, borderLeft:"3px solid var(--purple)", display:"flex", gap:8, alignItems:"center" }}>
                <ArrowRightCircle size={14} color="var(--purple)"/>
                <span style={{ fontSize:12, color:"var(--text-sec)" }}>Ready to convert?</span>
                {contact.category === "customer_lead" && <button className="btn btn-blue" style={{ fontSize:11, padding:"4px 10px" }} onClick={()=>convertContact(contact,"customer")}><Star size={11}/>Convert to Customer</button>}
                {contact.category === "partner_lead" && <button className="btn" style={{ fontSize:11, padding:"4px 10px", background:"var(--purple)", color:"#fff" }} onClick={()=>convertContact(contact,"partner")}><Star size={11}/>Convert to Partner</button>}
                {contact.category === "customer_lead" && <button className="btn btn-ghost" style={{ fontSize:11, padding:"4px 10px" }} onClick={()=>convertContact(contact,"partner")}>→ Partner instead</button>}
                {contact.category === "partner_lead" && <button className="btn btn-ghost" style={{ fontSize:11, padding:"4px 10px" }} onClick={()=>convertContact(contact,"customer")}>→ Customer instead</button>}
              </div>
            )}

            {/* Clickable contact links */}
            {(contact.linkedin_url || contact.email || contact.phone) && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                {contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="card-el" style={{ padding:"8px 12px", display:"flex", gap:6, alignItems:"center", fontSize:12, color:"#0A66C2", textDecoration:"none" }}><Linkedin size={13} color="#0A66C2"/>LinkedIn</a>}
                {contact.email && <a href={`mailto:${contact.email}`} className="card-el" style={{ padding:"8px 12px", display:"flex", gap:6, alignItems:"center", fontSize:12, color:"var(--blue)", textDecoration:"none" }}><Mail size={13}/>{contact.email}</a>}
                {contact.phone && <a href={`tel:${contact.phone}`} className="card-el" style={{ padding:"8px 12px", display:"flex", gap:6, alignItems:"center", fontSize:12, color:"var(--blue)", textDecoration:"none" }}><Phone size={13}/>{contact.phone}</a>}
              </div>
            )}

            {/* Inline editable form */}
            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <ContactForm data={editContact} onChange={setEditContact} companies={db.companies} contacts={db.contacts} campaigns={db.campaigns} setDB={setDB} db={db}/>
            </div>

            {/* Company snapshot — read-only */}
            {contactCompany && (
              <div className="card-el" style={{ padding:14, marginBottom:16 }}>
                <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>COMPANY PROFILE</div>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                  <Building2 size={14} color="var(--text-sec)"/>
                  <span style={{ fontSize:14, fontWeight:600 }}><EntityLink type="company" id={contactCompany.id} navigate={navigate}>{contactCompany.name}</EntityLink></span>
                  <Tag label={contactCompany.status}/>
                  {contactCompany.industry && <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{contactCompany.industry}</span>}
                </div>
                <div style={{ display:"flex", gap:14, flexWrap:"wrap", fontSize:12 }}>
                  {contactCompany.website && <a href={contactCompany.website.startsWith("http")?contactCompany.website:`https://${contactCompany.website}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--blue)", display:"flex", gap:4, alignItems:"center" }}><Globe size={11}/>{contactCompany.website}</a>}
                  {contactCompany.linkedin_url && <a href={contactCompany.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color:"#0A66C2", display:"flex", gap:4, alignItems:"center" }}><Linkedin size={11}/>LinkedIn</a>}
                </div>
              </div>
            )}

            {/* Related Tasks */}
            {contactTasks.length>0&&<div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>OPEN TASKS ({contactTasks.length})</div>
              {contactTasks.map(t=>(
                <div key={t.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:500 }}><EntityLink type="task" id={t.id} navigate={navigate}>{t.title}</EntityLink></div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>Due {t.due} · {t.category}</div></div>
                  <Tag label={t.priority}/>
                </div>
              ))}
            </div>}

            {/* Related Deals */}
            {contactDeals.length>0&&<div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>DEALS</div>
              {contactDeals.map(d=>(
                <div key={d.id} className="card-el" style={{ padding:14, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{ fontSize:13, fontWeight:600 }}><EntityLink type="deal" id={d.id} navigate={navigate}>{d.name}</EntityLink></div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>Close {d.closeDate} · {d.probability}%</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ fontSize:15, fontWeight:700, color:"var(--blue)", fontFamily:"var(--font-d)" }}>{fmt(d.value)}</div><Tag label={d.stage}/></div>
                </div>
              ))}
            </div>}

            {/* Source info */}
            {(contact.source || contact.referredBy || contact.campaignId) && <div className="card-el" style={{ padding:14, marginBottom:16 }}>
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:6 }}>SOURCE</div>
              <div style={{ display:"flex", gap:12, fontSize:12, flexWrap:"wrap" }}>
                {contact.source && <span>Channel: <strong>{contact.source.replace(/_/g," ")}</strong></span>}
                {contact.referredBy && <span>Referred by: <strong><EntityLink type="contact" id={contact.referredBy} navigate={navigate}>{(db.contacts.find(c=>c.id===contact.referredBy))?.name || "Unknown"}</EntityLink></strong></span>}
                {contact.campaignId && <span>Campaign: <strong>{(db.campaigns.find(c=>c.id===contact.campaignId))?.name || "Unknown"}</strong></span>}
              </div>
            </div>}

            {/* Company News */}
            {contact.companyId && db.companyNews.filter(n=>n.companyId===contact.companyId).length>0 && (
              <div style={{ marginBottom:16 }}>
                <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>COMPANY NEWS</div>
                {db.companyNews.filter(n=>n.companyId===contact.companyId).slice(0,5).map(n=>(
                  <div key={n.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, borderLeft:"2px solid var(--blue)" }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>{n.headline}</div>
                    <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{n.published_date} · Relevance: {n.relevance_score}/10</div>
                  </div>
                ))}
              </div>
            )}

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="contact" entityId={contact.id}/>
            <ActivityTimeline events={db.events} entityType="contact" entityId={contact.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Users size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a contact</p>
          </div>
        )}
      </div>

      {drawer&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Contact`} onClose={()=>setDrawer(null)} onSave={save} saveLabel={drawer.mode==="add"?"Add Contact":"Save Changes"}>
        <ContactForm data={drawer.data} onChange={data=>setDrawer(d=>({...d,data}))} companies={db.companies} contacts={db.contacts} campaigns={db.campaigns} setDB={setDB} db={db}/>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   COMPANIES — NEW VIEW
──────────────────────────────────────────────────────── */
const blankCompany = () => ({ name:"", industry:"", website:"", linkedin_url:"", news_keywords:"", status:"prospect", notes:"", created_at:today() });

const CompaniesView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editCompany, setEditCompany] = useState(null);

  useEffect(() => {
    if(focus?.type==="company" && focus.id) { setStatusFilter("all"); setSel(focus.id); setFocus(null); }
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const c = db.companies.find(c => c.id === sel);
      if (c) setEditCompany({...c});
    } else setEditCompany(null);
  }, [sel, db.companies]);

  const filtered = db.companies.filter(c => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const company = sel ? db.companies.find(c=>c.id===sel) : null;
  const companyContacts = company ? db.contacts.filter(c=>c.companyId===company.id || c.co===company.name) : [];
  const companyDeals = company ? db.deals.filter(d=>d.companyId===company.id || companyContacts.some(c=>c.id===d.contactId)) : [];
  const companyProjects = company ? db.projects.filter(p=>p.companyId===company.id || p.client===company.name) : [];
  const companyNews = company ? db.companyNews.filter(n=>n.companyId===company.id) : [];
  const companyTasks = company ? db.tasks.filter(t=>t.companyId===company.id || companyContacts.some(c=>c.id===t.contactId)) : [];

  const save = () => {
    if (drawer.mode==="add") setDB(d=>({...d,companies:[...d.companies,{...drawer.data,id:nextId(d.companies)}]}));
    else setDB(d=>({...d,companies:d.companies.map(c=>c.id===drawer.data.id?drawer.data:c)}));
    setDrawer(null);
  };
  const del = (id) => { setDB(d=>({...d,companies:d.companies.filter(c=>c.id!==id)})); if(sel===id) setSel(null); setConfirm(null); };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Companies</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setDrawer({mode:"add",data:blankCompany()})}><Plus size={12}/>Add</button>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
            {["all","prospect","customer","partner","parked","churned"].map(s=>(
              <button key={s} className={`filter-chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(c=>{
            const contactCount = db.contacts.filter(ct=>ct.companyId===c.id||ct.co===c.name).length;
            return (
            <div key={c.id} className="row-hover" onClick={()=>navigate("record",{type:"company",id:c.id})}
                style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===c.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
                  <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{c.industry||"—"} · {contactCount} contacts</div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Tag label={c.status}/>
                  <RowActions onEdit={()=>navigate("record",{type:"company",id:c.id})} onDelete={()=>setConfirm({id:c.id,label:c.name})}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(company && editCompany) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("companies");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to companies</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{company.name}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{company.industry}</div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={company.status}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={()=>{
                  setDB(d=>({...d,companies:d.companies.map(c=>c.id===editCompany.id?editCompany:c)}));
                }}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:company.id,label:company.name})}><Trash2 size={12}/></button>
              </div>
            </div>

            {/* Clickable links */}
            {(editCompany.website || editCompany.linkedin_url) && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                {editCompany.website && <a href={editCompany.website.startsWith("http")?editCompany.website:`https://${editCompany.website}`} target="_blank" rel="noopener noreferrer" className="card-el" style={{ padding:"8px 12px", display:"flex", gap:6, alignItems:"center", fontSize:12, color:"var(--blue)", textDecoration:"none" }}><Globe size={13}/>{editCompany.website}</a>}
                {editCompany.linkedin_url && <a href={editCompany.linkedin_url} target="_blank" rel="noopener noreferrer" className="card-el" style={{ padding:"8px 12px", display:"flex", gap:6, alignItems:"center", fontSize:12, color:"#0A66C2", textDecoration:"none" }}><Linkedin size={13}/>LinkedIn</a>}
              </div>
            )}

            <div className="grid-resp-4" style={{ marginBottom:20 }}>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--blue)" }}>{companyContacts.length}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Contacts</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--amber)" }}>{companyDeals.length}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Deals</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--green)" }}>{fmt(companyDeals.reduce((a,d)=>a+d.value,0))}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Pipeline</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--purple)" }}>{companyTasks.filter(t=>!t.done).length}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Open Tasks</div></div>
            </div>

            {/* Inline editable form */}
            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Company Name"><Inp value={editCompany.name} onChange={v=>setEditCompany(c=>({...c,name:v}))}/></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Industry"><Inp value={editCompany.industry||""} onChange={v=>setEditCompany(c=>({...c,industry:v}))}/></Field>
                <Field label="Status"><Sel value={editCompany.status} onChange={v=>setEditCompany(c=>({...c,status:v}))} options={["prospect","customer","partner","parked","churned"]}/></Field>
                <Field label="Website"><Inp value={editCompany.website||""} onChange={v=>setEditCompany(c=>({...c,website:v}))} placeholder="example.com"/></Field>
                <Field label="LinkedIn URL"><Inp value={editCompany.linkedin_url||""} onChange={v=>setEditCompany(c=>({...c,linkedin_url:v}))} placeholder="https://linkedin.com/company/..."/></Field>
              </div>
              <Field label="News Keywords (for monitoring)"><Inp value={editCompany.news_keywords||""} onChange={v=>setEditCompany(c=>({...c,news_keywords:v}))} placeholder="e.g. funding, acquisition"/></Field>
              <Field label="Notes"><Tex value={editCompany.notes||""} onChange={v=>setEditCompany(c=>({...c,notes:v}))}/></Field>
            </div>

            {companyContacts.length>0 && <div style={{ marginBottom:16 }}><div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>PEOPLE ({companyContacts.length})</div>
              {companyContacts.map(c=><div key={c.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}><div><div style={{ fontSize:13, fontWeight:500 }}><EntityLink type="contact" id={c.id} navigate={navigate}>{c.name}</EntityLink></div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{c.role} · {c.category?.replace(/_/g," ")}</div></div><div style={{ display:"flex", gap:6 }}><Tag label={c.status}/><ScoreBadge score={c.score}/></div></div>)}
            </div>}

            {companyDeals.length>0 && <div style={{ marginBottom:16 }}><div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>DEALS ({companyDeals.length})</div>
              {companyDeals.map(d=><div key={d.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between" }}><div><div style={{ fontSize:13, fontWeight:500 }}><EntityLink type="deal" id={d.id} navigate={navigate}>{d.name}</EntityLink></div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{d.probability}% · Close {d.closeDate}</div></div><div style={{ textAlign:"right" }}><div style={{ fontFamily:"var(--font-d)", fontWeight:700, color:"var(--blue)" }}>{fmt(d.value)}</div><Tag label={d.stage}/></div></div>)}
            </div>}

            {companyNews.length>0 && <div style={{ marginBottom:16 }}><div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}><Newspaper size={11}/> NEWS</div>
              {companyNews.slice(0,5).map(n=><div key={n.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, borderLeft:"2px solid var(--blue)" }}><div style={{ fontSize:12, fontWeight:600 }}>{n.headline}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{n.published_date} · Score: {n.relevance_score}/10</div>{n.summary&&<p style={{ fontSize:11, color:"var(--text-sec)", marginTop:3 }}>{n.summary}</p>}</div>)}
            </div>}

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="company" entityId={company.id}/>
            <ActivityTimeline events={db.events} entityType="company" entityId={company.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Building2 size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a company</p>
          </div>
        )}
      </div>

      {drawer&&drawer.mode==="add"&&<Drawer title="New Company" onClose={()=>setDrawer(null)} onSave={save}>
        <Field label="Company Name"><Inp value={drawer.data.name} onChange={v=>setDrawer(d=>({...d,data:{...d.data,name:v}}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Industry"><Inp value={drawer.data.industry} onChange={v=>setDrawer(d=>({...d,data:{...d.data,industry:v}}))}/></Field>
          <Field label="Status"><Sel value={drawer.data.status} onChange={v=>setDrawer(d=>({...d,data:{...d.data,status:v}}))} options={["prospect","customer","partner","parked","churned"]}/></Field>
          <Field label="Website"><Inp value={drawer.data.website} onChange={v=>setDrawer(d=>({...d,data:{...d.data,website:v}}))}/></Field>
          <Field label="LinkedIn URL"><Inp value={drawer.data.linkedin_url} onChange={v=>setDrawer(d=>({...d,data:{...d.data,linkedin_url:v}}))}/></Field>
        </div>
        <Field label="News Keywords (for monitoring)"><Inp value={drawer.data.news_keywords} onChange={v=>setDrawer(d=>({...d,data:{...d.data,news_keywords:v}}))} placeholder="e.g. funding, acquisition, partnership"/></Field>
        <Field label="Notes"><Tex value={drawer.data.notes} onChange={v=>setDrawer(d=>({...d,data:{...d.data,notes:v}}))}/></Field>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   DEALS — with Pipeline Automations
──────────────────────────────────────────────────────── */
const blankDeal = () => ({ name:"", contactId:"", companyId:"", value:0, stage:"discovery", probability:50, closeDate:"", notes:"" });

const DealsView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankDeal());
  const [editDeal, setEditDeal] = useState(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  useEffect(() => {
    if(focus?.type==="deal" && focus.id) { setStageFilter("all"); setSel(focus.id); setFocus(null); }
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const dl = db.deals.find(x => x.id === sel);
      if (dl) setEditDeal({...dl, value:String(dl.value), probability:String(dl.probability), contactId:String(dl.contactId||""), companyId:String(dl.companyId||"")});
    } else setEditDeal(null);
  }, [sel, db.deals]);

  const STAGES = ["outreach","discovery","proposal","negotiation","at-risk","won","lost"];
  const stageColor = { outreach:"var(--text-sec)", discovery:"var(--purple)", proposal:"var(--blue)", negotiation:"var(--amber)", "at-risk":"var(--red)", won:"var(--green)", lost:"var(--text-sec)" };

  const filtered = db.deals.filter(deal => {
    if (query && !deal.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (stageFilter !== "all" && deal.stage !== stageFilter) return false;
    return true;
  });

  const deal = sel ? db.deals.find(x => x.id === sel) : null;
  const dealContact = deal && deal.contactId ? db.contacts.find(c => c.id === deal.contactId) : null;
  const dealCompany = deal && deal.companyId ? db.companies.find(c => c.id === deal.companyId) : null;

  const saveInline = () => {
    if (!editDeal) return;
    const rec = { ...editDeal, value:parseFloat(editDeal.value)||0, probability:parseInt(editDeal.probability)||50, contactId:parseInt(editDeal.contactId)||null, companyId:parseInt(editDeal.companyId)||null };
    const oldDeal = db.deals.find(x => x.id === rec.id);
    setDB(prev => {
      let next = {...prev, deals:prev.deals.map(x=>x.id===rec.id?rec:x)};
      if (oldDeal && oldDeal.stage !== rec.stage) {
        const contact = prev.contacts.find(c=>c.id===rec.contactId);
        if (rec.stage === "won") {
          if (contact && contact.category !== "customer") next = {...next, contacts:next.contacts.map(c=>c.id===contact.id?{...c,category:"customer",status:"client"}:c)};
          next = {...next, projects:[...next.projects, {id:nextId(next.projects), name:`Onboarding: ${rec.name}`, client:contact?.co||"", companyId:rec.companyId, status:"active", progress:0, dueDate:"", priority:"high", notes:`Auto-created when deal "${rec.name}" was won.`}]};
          next = {...next, invoices:[...next.invoices, {id:nextId(next.invoices), number:`INV-${String(nextId(next.invoices)).padStart(3,"0")}`, client:contact?.co||"", contactId:rec.contactId, amount:rec.value, status:"draft", issued:today(), due:"", notes:`Auto-created from won deal: ${rec.name}`}]};
        }
        if (rec.stage === "lost") {
          const reengageDate = new Date(Date.now() + 90*86400000).toISOString().split("T")[0];
          next = {...next, tasks:[...next.tasks, {id:nextId(next.tasks), title:`Re-engage: ${contact?.name||rec.name} (90 days post-loss)`, projectId:null, contactId:rec.contactId, companyId:rec.companyId, dealId:rec.id, due:reengageDate, done:false, priority:"medium", assignedTo:"CRM Agent", notes:`Deal "${rec.name}" was lost.`, status:"todo", category:"outreach", source:"agent:orchestrator", recurrence:"none"}]};
        }
      }
      return next;
    });
  };

  const save = () => {
    const rec = { ...d, value:parseFloat(d.value)||0, probability:parseInt(d.probability)||50, contactId:parseInt(d.contactId)||null, companyId:parseInt(d.companyId)||null };
    const oldDeal = drawer==="edit" ? db.deals.find(x=>x.id===rec.id) : null;

    if (drawer==="add") {
      setDB(db=>({...db,deals:[...db.deals,{...rec,id:nextId(db.deals)}]}));
    } else {
      setDB(prev => {
        let next = {...prev, deals:prev.deals.map(x=>x.id===rec.id?rec:x)};

        // Pipeline automations on stage change
        if (oldDeal && oldDeal.stage !== rec.stage) {
          const contact = prev.contacts.find(c=>c.id===rec.contactId);

          if (rec.stage === "won") {
            // Convert contact to customer
            if (contact && contact.category !== "customer") {
              next = {...next, contacts:next.contacts.map(c=>c.id===contact.id?{...c,category:"customer",status:"client"}:c)};
            }
            // Create onboarding project
            next = {...next, projects:[...next.projects, {id:nextId(next.projects), name:`Onboarding: ${rec.name}`, client:contact?.co||"", companyId:rec.companyId, status:"active", progress:0, dueDate:"", priority:"high", notes:`Auto-created when deal "${rec.name}" was won.`}]};
            // Create first invoice draft
            next = {...next, invoices:[...next.invoices, {id:nextId(next.invoices), number:`INV-${String(nextId(next.invoices)).padStart(3,"0")}`, client:contact?.co||"", contactId:rec.contactId, amount:rec.value, status:"draft", issued:today(), due:"", notes:`Auto-created from won deal: ${rec.name}`}]};
            // Log it
            next = {...next, agentLogs:[{id:nextId(next.agentLogs), agent:"Orchestrator", type:"opportunity", message:`DEAL WON: "${rec.name}" — ${fmt(rec.value)}. Onboarding project + invoice draft created.`, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:"high"}, ...next.agentLogs]};
          }

          if (rec.stage === "lost") {
            // Create re-engage task for 90 days
            const reengageDate = new Date(Date.now() + 90*86400000).toISOString().split("T")[0];
            next = {...next, tasks:[...next.tasks, {id:nextId(next.tasks), title:`Re-engage: ${contact?.name||rec.name} (90 days post-loss)`, projectId:null, contactId:rec.contactId, companyId:rec.companyId, dealId:rec.id, due:reengageDate, done:false, priority:"medium", assignedTo:"CRM Agent", notes:`Deal "${rec.name}" was lost. Schedule re-engagement.`, status:"todo", category:"outreach", source:"agent:orchestrator", recurrence:"none"}]};
            next = {...next, agentLogs:[{id:nextId(next.agentLogs), agent:"CRM Agent", type:"risk", message:`Deal lost: "${rec.name}". Re-engage task created for ${reengageDate}.`, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:"medium"}, ...next.agentLogs]};
          }
        }
        return next;
      });
    }
    setDrawer(null);
  };

  const del = (id) => { setDB(db=>({...db,deals:db.deals.filter(x=>x.id!==id)})); if(sel===id) setSel(null); setConfirm(null); };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Deals</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setD(blankDeal());setDrawer("add");}}><Plus size={12}/>Add</button>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
            {["all", ...STAGES].map(s=>(
              <button key={s} className={`filter-chip${stageFilter===s?" active":""}`} onClick={()=>setStageFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search deals…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(dx=>(
            <div key={dx.id} className="row-hover" onClick={()=>navigate("record",{type:"deal",id:dx.id})}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===dx.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{dx.name}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{fmt(dx.value)} · {dx.probability}%</div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                <Tag label={dx.stage}/>
                <RowActions onEdit={()=>navigate("record",{type:"deal",id:dx.id})} onDelete={()=>setConfirm({id:dx.id,label:dx.name})}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(deal && editDeal) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("deals");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to deals</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{deal.name}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{dealCompany?<EntityLink type="company" id={dealCompany.id} navigate={navigate}>{dealCompany.name}</EntityLink>:"—"}{dealContact && <> · <EntityLink type="contact" id={dealContact.id} navigate={navigate}>{dealContact.name}</EntityLink></>}</div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={deal.stage}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:deal.id,label:deal.name})}><Trash2 size={12}/></button>
              </div>
            </div>

            <div className="grid-resp-4" style={{ marginBottom:20 }}>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--blue)" }}>{fmt(deal.value)}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Value</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--amber)" }}>{deal.probability}%</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Probability</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--green)" }}>{fmt(Math.round(deal.value*deal.probability/100))}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Weighted</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:13, fontWeight:600, fontFamily:"var(--font-d)" }}>{deal.closeDate||"—"}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Close Date</div></div>
            </div>

            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Deal Name"><Inp value={editDeal.name} onChange={v=>setEditDeal(p=>({...p,name:v}))}/></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Contact"><SearchSelect value={editDeal.contactId} onChange={v=>setEditDeal(p=>({...p,contactId:v}))} options={db.contacts.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search contacts…"/></Field>
                <Field label="Company"><SearchSelect value={editDeal.companyId} onChange={v=>setEditDeal(p=>({...p,companyId:v}))} options={db.companies.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search companies…"/></Field>
                <Field label="Stage"><Sel value={editDeal.stage} onChange={v=>setEditDeal(p=>({...p,stage:v}))} options={STAGES}/></Field>
                <Field label="Value ($)"><Inp type="number" value={editDeal.value} onChange={v=>setEditDeal(p=>({...p,value:v}))}/></Field>
                <Field label="Probability (%)"><Inp type="number" value={editDeal.probability} onChange={v=>setEditDeal(p=>({...p,probability:v}))}/></Field>
                <Field label="Close Date"><Inp type="date" value={editDeal.closeDate||""} onChange={v=>setEditDeal(p=>({...p,closeDate:v}))}/></Field>
              </div>
              <Field label="Notes"><Tex value={editDeal.notes||""} onChange={v=>setEditDeal(p=>({...p,notes:v}))}/></Field>
            </div>

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="deal" entityId={deal.id}/>
            <ActivityTimeline events={db.events} entityType="deal" entityId={deal.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Target size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a deal</p>
          </div>
        )}
      </div>

      {drawer==="add"&&<Drawer title="New Deal" onClose={()=>setDrawer(null)} onSave={save}>
        <Field label="Deal Name"><Inp value={d.name} onChange={v=>setD(p=>({...p,name:v}))} placeholder="Client — Initiative"/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Contact"><SearchSelect value={d.contactId} onChange={v=>setD(p=>({...p,contactId:v}))} options={db.contacts.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search contacts…"/></Field>
          <Field label="Company"><SearchSelect value={d.companyId} onChange={v=>setD(p=>({...p,companyId:v}))} options={db.companies.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search companies…"/></Field>
          <Field label="Stage"><Sel value={d.stage} onChange={v=>setD(p=>({...p,stage:v}))} options={STAGES}/></Field>
          <Field label="Value ($)"><Inp type="number" value={d.value} onChange={v=>setD(p=>({...p,value:v}))}/></Field>
          <Field label="Probability (%)"><Inp type="number" value={d.probability} onChange={v=>setD(p=>({...p,probability:v}))}/></Field>
          <Field label="Close Date"><Inp type="date" value={d.closeDate} onChange={v=>setD(p=>({...p,closeDate:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={d.notes} onChange={v=>setD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   MARKETING — CAMPAIGNS (mostly unchanged)
──────────────────────────────────────────────────────── */
const blankCampaign = () => ({ name:"", type:"Email", status:"draft", leads:0, opens:0, conversions:0, startDate:"" });

const MarketingView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankCampaign());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editCampaign, setEditCampaign] = useState(null);

  useEffect(() => {
    if(focus?.type==="campaign" && focus.id) { setStatusFilter("all"); setSel(focus.id); setFocus(null); }
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const c = db.campaigns.find(c => c.id === sel);
      if (c) setEditCampaign({...c, leads:String(c.leads), opens:String(c.opens), conversions:String(c.conversions)});
    } else setEditCampaign(null);
  }, [sel, db.campaigns]);

  const filtered = (db.campaigns||[]).filter(c => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const campaign = sel ? db.campaigns.find(c=>c.id===sel) : null;
  const campaignLeads = campaign ? (db.contacts||[]).filter(c=>c.campaignId===campaign.id) : [];
  const campaignDeals = campaign ? (db.deals||[]).filter(deal=>campaignLeads.some(l=>l.id===deal.contactId)) : [];

  const save = () => {
    const rec = { ...d, leads:parseInt(d.leads)||0, opens:parseInt(d.opens)||0, conversions:parseInt(d.conversions)||0 };
    if (drawer==="add") setDB(db=>({...db,campaigns:[...db.campaigns,{...rec,id:nextId(db.campaigns)}]}));
    else setDB(db=>({...db,campaigns:db.campaigns.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };
  const del = (id) => { setDB(db=>({...db,campaigns:db.campaigns.filter(x=>x.id!==id)})); if(sel===id) setSel(null); setConfirm(null); };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      {/* LEFT LIST */}
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Marketing</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setD(blankCampaign());setDrawer("add");}}><Plus size={12}/>Add</button>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
            {["all","draft","active","paused","complete"].map(s=>(
              <button key={s} className={`filter-chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search campaigns…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(c=>(
            <div key={c.id} className="row-hover" onClick={()=>navigate("record",{type:"campaign",id:c.id})}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===c.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{c.type} · {c.startDate||"—"}</div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <Tag label={c.status}/>
                <RowActions onEdit={()=>navigate("record",{type:"campaign",id:c.id})} onDelete={()=>setConfirm({id:c.id,label:c.name})}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT DETAIL */}
      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(campaign && editCampaign) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("marketing");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to marketing</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{campaign.name}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{campaign.type} · Started {campaign.startDate || "—"}</div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={campaign.status}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={()=>{
                  const rec = {...editCampaign, leads:parseInt(editCampaign.leads)||0, opens:parseInt(editCampaign.opens)||0, conversions:parseInt(editCampaign.conversions)||0};
                  setDB(d=>({...d,campaigns:d.campaigns.map(x=>x.id===rec.id?rec:x)}));
                }}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:campaign.id,label:campaign.name})}><Trash2 size={12}/></button>
              </div>
            </div>

            <div className="grid-resp-4" style={{ marginBottom:20 }}>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--blue)" }}>{(campaign.leads||0).toLocaleString()}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Leads</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--amber)" }}>{(campaign.opens||0).toLocaleString()}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Impressions</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--green)" }}>{(campaign.conversions||0).toLocaleString()}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Conversions</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--purple)" }}>{campaign.leads>0?Math.round((campaign.conversions/campaign.leads)*100):0}%</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Conv. Rate</div></div>
            </div>

            {/* Inline editable form */}
            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Campaign Name"><Inp value={editCampaign.name} onChange={v=>setEditCampaign(p=>({...p,name:v}))}/></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Type"><Sel value={editCampaign.type} onChange={v=>setEditCampaign(p=>({...p,type:v}))} options={["Email","Social","Referral","Paid","Event","Other"]}/></Field>
                <Field label="Status"><Sel value={editCampaign.status} onChange={v=>setEditCampaign(p=>({...p,status:v}))} options={["draft","active","paused","complete"]}/></Field>
                <Field label="Start Date"><Inp type="date" value={editCampaign.startDate||""} onChange={v=>setEditCampaign(p=>({...p,startDate:v}))}/></Field>
                <Field label="Leads"><Inp type="number" value={editCampaign.leads} onChange={v=>setEditCampaign(p=>({...p,leads:v}))}/></Field>
                <Field label="Impressions"><Inp type="number" value={editCampaign.opens} onChange={v=>setEditCampaign(p=>({...p,opens:v}))}/></Field>
                <Field label="Conversions"><Inp type="number" value={editCampaign.conversions} onChange={v=>setEditCampaign(p=>({...p,conversions:v}))}/></Field>
              </div>
              <Field label="Notes"><Tex value={editCampaign.notes||""} onChange={v=>setEditCampaign(p=>({...p,notes:v}))}/></Field>
            </div>

            {campaignLeads.length>0 && <div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>ASSOCIATED LEADS ({campaignLeads.length})</div>
              {campaignLeads.map(c=>(
                <div key={c.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}><EntityLink type="contact" id={c.id} navigate={navigate}>{c.name}</EntityLink></div>
                    <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{c.co}{c.role?` · ${c.role}`:""}</div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <Tag label={c.status}/>
                    <ScoreBadge score={c.score}/>
                  </div>
                </div>
              ))}
            </div>}

            {campaignDeals.length>0 && <div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>DEALS FROM THIS CAMPAIGN ({campaignDeals.length})</div>
              {campaignDeals.map(deal=>(
                <div key={deal.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                  <div><div style={{ fontSize:13, fontWeight:500 }}><EntityLink type="deal" id={deal.id} navigate={navigate}>{deal.name}</EntityLink></div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{deal.probability}% · Close {deal.closeDate}</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ fontFamily:"var(--font-d)", fontWeight:700, color:"var(--blue)" }}>{fmt(deal.value)}</div><Tag label={deal.stage}/></div>
                </div>
              ))}
            </div>}

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="campaign" entityId={campaign.id}/>
            <ActivityTimeline events={db.events} entityType="campaign" entityId={campaign.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Megaphone size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a campaign</p>
          </div>
        )}
      </div>

      {drawer==="add"&&<Drawer title="New Campaign" onClose={()=>setDrawer(null)} onSave={save}>
        <Field label="Campaign Name"><Inp value={d.name} onChange={v=>setD(p=>({...p,name:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Type"><Sel value={d.type} onChange={v=>setD(p=>({...p,type:v}))} options={["Email","Social","Referral","Paid","Event","Other"]}/></Field>
          <Field label="Status"><Sel value={d.status} onChange={v=>setD(p=>({...p,status:v}))} options={["draft","active","paused","complete"]}/></Field>
          <Field label="Start Date"><Inp type="date" value={d.startDate} onChange={v=>setD(p=>({...p,startDate:v}))}/></Field>
          <Field label="Leads"><Inp type="number" value={d.leads} onChange={v=>setD(p=>({...p,leads:v}))}/></Field>
          <Field label="Impressions"><Inp type="number" value={d.opens} onChange={v=>setD(p=>({...p,opens:v}))}/></Field>
          <Field label="Conversions"><Inp type="number" value={d.conversions} onChange={v=>setD(p=>({...p,conversions:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={d.notes||""} onChange={v=>setD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   OPERATIONS — Projects + RELATIONAL TASKS with Filters
──────────────────────────────────────────────────────── */
const blankProject = () => ({ name:"", client:"", companyId:"", type:"client", status:"active", progress:0, dueDate:"", priority:"medium", notes:"", links:[], files:[], strategyId:"" });
const blankTask = () => ({ title:"", projectId:"", contactId:"", companyId:"", dealId:"", due:"", done:false, priority:"medium", assignedTo:"", notes:"", status:"todo", category:"follow_up", source:"manual", recurrence:"none", reschedule_count:0 });

/* ────────────────────────────────────────────────────────
   TASKS VIEW (standalone)
──────────────────────────────────────────────────────── */
const TasksView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [td, setTD] = useState(blankTask());

  // Task filters
  const [fStatus, setFStatus] = useState("open"); // open = not done/cancelled
  const [fPriority, setFPriority] = useState("all");
  const [fCategory, setFCategory] = useState("all");
  const [fSource, setFSource] = useState("mine"); // mine = user-created, agent = auto-generated, all = everything
  const [searchQ, setSearchQ] = useState(""); // free-text search across title, contact, company, project
  const [sortBy, setSortBy] = useState("due"); // priority, due
  const [groupBy, setGroupBy] = useState("none"); // none, project, company, person, status

  useEffect(() => {
    if(focus?.type==="task" && focus.id) { setFStatus("all"); const t=db.tasks.find(t=>t.id===focus.id); if(t) { setTD({...t,projectId:String(t.projectId||""),contactId:String(t.contactId||""),companyId:String(t.companyId||""),dealId:String(t.dealId||"")}); setDrawer({mode:"edit",type:"task"}); } setFocus(null); }
  }, [focus]);

  const filteredTasks = useMemo(() => {
    let tasks = db.tasks;
    if (fStatus === "open") tasks = tasks.filter(t => !t.done && t.status !== "done" && t.status !== "cancelled");
    else if (fStatus !== "all") tasks = tasks.filter(t => t.status === fStatus);
    if (fPriority !== "all") tasks = tasks.filter(t => t.priority === fPriority);
    if (fCategory !== "all") tasks = tasks.filter(t => t.category === fCategory);
    if (fSource === "mine") tasks = tasks.filter(t => !(t.source||"").startsWith("agent:"));
    else if (fSource === "agent") tasks = tasks.filter(t => (t.source||"").startsWith("agent:"));
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      tasks = tasks.filter(t => {
        const contact = db.contacts.find(c=>c.id===t.contactId);
        const company = db.companies.find(c=>c.id===t.companyId);
        const project = db.projects.find(p=>p.id===t.projectId);
        return (t.title||"").toLowerCase().includes(q) || (t.notes||"").toLowerCase().includes(q) || (contact?.name||"").toLowerCase().includes(q) || (company?.name||"").toLowerCase().includes(q) || (project?.name||"").toLowerCase().includes(q);
      });
    }

    const priOrder = { critical:0, high:1, medium:2, low:3 };
    tasks = [...tasks].sort((a,b) => {
      if (sortBy === "due") return (a.due||"9999").localeCompare(b.due||"9999");
      if (sortBy === "priority") return (priOrder[a.priority]||9) - (priOrder[b.priority]||9);
      return 0;
    });
    return tasks;
  }, [db.tasks, fStatus, fPriority, fCategory, fSource, searchQ, sortBy, db.contacts, db.companies, db.projects]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return [{ label:null, tasks:filteredTasks }];
    const groups = {};
    filteredTasks.forEach(t => {
      let key = "Ungrouped";
      if (groupBy === "project") { const p = db.projects.find(p=>p.id===t.projectId); key = p?.name || "No Project"; }
      else if (groupBy === "company") { const c = db.companies.find(c=>c.id===t.companyId); key = c?.name || "No Company"; }
      else if (groupBy === "person") { const c = db.contacts.find(c=>c.id===t.contactId); key = c?.name || "Unassigned"; }
      else if (groupBy === "status") key = t.status || "todo";
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups).map(([label,tasks])=>({label,tasks}));
  }, [filteredTasks, groupBy, db.projects, db.companies, db.contacts]);

  const saveTask = (d) => {
    const rec = {...d, projectId:parseInt(d.projectId)||null, contactId:parseInt(d.contactId)||null, companyId:parseInt(d.companyId)||null, dealId:parseInt(d.dealId)||null};
    if(drawer.mode==="add") setDB(db=>({...db,tasks:[...db.tasks,{...rec,id:nextId(db.tasks)}]}));
    else setDB(db=>{const old=db.tasks.find(x=>x.id===rec.id);let updated={...rec};if(old&&old.due!==rec.due&&rec.due){updated.reschedule_count=(old.reschedule_count||0)+1;if(updated.reschedule_count>=3){updated.priority="low";updated.notes=(updated.notes?updated.notes+"\n":"")+"\u26a0\ufe0f Auto-downgraded: due date changed "+updated.reschedule_count+" times \u2014 may not be critical.";}}return{...db,tasks:db.tasks.map(x=>x.id===rec.id?updated:x)};});
    setDrawer(null);
  };
  const delTask = (id) => { setDB(db=>({...db,tasks:db.tasks.filter(x=>x.id!==id)})); setConfirm(null); };
  const toggleTask = (id) => setDB(db=>({...db,tasks:db.tasks.map(t=>t.id===id?{...t,done:!t.done,status:t.done?"todo":"done"}:t)}));

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Tasks</div>
        <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setTD(blankTask());setDrawer({mode:"add",type:"task"});}}><Plus size={12}/>Task</button>
      </div>

      {true && (
        <>
          {/* SEARCH + FILTER BAR */}
          <div className="card" style={{ padding:"10px 14px" }}>
            <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:180 }}>
                <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:9, pointerEvents:"none" }}/>
                <input className="input" placeholder="Search tasks…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{ paddingLeft:30, fontSize:12 }}/>
              </div>
              <select className="filter-select" value={fStatus} onChange={e=>setFStatus(e.target.value)}>
                <option value="open">Open</option><option value="all">All</option>
                {TASK_STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select>
              <select className="filter-select" value={fPriority} onChange={e=>setFPriority(e.target.value)}>
                <option value="all">Any Priority</option>
                {["critical","high","medium","low"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <select className="filter-select" value={fCategory} onChange={e=>setFCategory(e.target.value)}>
                <option value="all">Any Category</option>
                {TASK_CATEGORIES.map(c=><option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
              </select>
              <select className="filter-select" value={fSource} onChange={e=>setFSource(e.target.value)}>
                <option value="mine">Mine</option>
                <option value="agent">Agent</option>
                <option value="all">All Sources</option>
              </select>
              <select className="filter-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="priority">Sort: Urgency</option><option value="due">Sort: Due Date</option>
              </select>
              <select className="filter-select" value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
                <option value="none">No Grouping</option>
                {["project","company","person","status"].map(g=><option key={g} value={g}>Group: {g}</option>)}
              </select>
              <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{filteredTasks.length} tasks</span>
            </div>
          </div>

          {/* TASK LIST */}
          {grouped.map((group, gi) => (
            <div key={gi}>
              {group.label && <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", padding:"8px 0 4px", borderBottom:"1px solid var(--border)", marginBottom:8 }}>{group.label} ({group.tasks.length})</div>}
              {group.tasks.map(t => {
                const contact = db.contacts.find(c=>c.id===t.contactId);
                const company = db.companies.find(c=>c.id===t.companyId);
                const project = db.projects.find(p=>p.id===t.projectId);
                const isOverdue = t.due && t.due < today() && !t.done;
                return (
                  <div key={t.id} className="card-el row-hover" onClick={()=>navigate("record",{type:"task",id:t.id})} style={{ padding:"12px 14px", display:"flex", gap:12, alignItems:"flex-start", opacity:t.done?0.55:1, marginBottom:6, borderLeft:isOverdue?"3px solid var(--red)":t.priority==="critical"?"3px solid var(--red)":undefined, cursor:"pointer" }}>
                    <button onClick={(e)=>{e.stopPropagation();toggleTask(t.id);}} style={{ width:18, height:18, borderRadius:4, border:`2px solid ${t.done?"var(--green)":"var(--border-hi)"}`, background:t.done?"var(--green)":"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
                      {t.done&&<Check size={11} color="#fff"/>}
                    </button>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, textDecoration:t.done?"line-through":"none", color:t.done?"var(--text-sec)":"var(--text)" }}>{t.title}</div>
                      <div style={{ display:"flex", gap:6, marginTop:4, alignItems:"center", flexWrap:"wrap" }}>
                        {t.due&&<span className="mono" style={{ fontSize:10, color:isOverdue?"var(--red)":"var(--text-sec)" }}>{isOverdue?"OVERDUE ":""}Due {t.due}</span>}
                        <Tag label={t.priority}/>
                        <Tag label={t.category?.replace(/_/g," ")||"task"} color="var(--purple)"/>
                        {t.status && t.status !== "todo" && t.status !== "done" && <Tag label={t.status.replace(/_/g," ")}/>}
                        {contact&&<EntityLink type="contact" id={contact.id} navigate={navigate} className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>👤 {contact.name}</EntityLink>}
                        {company&&<EntityLink type="company" id={company.id} navigate={navigate} className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>🏢 {company.name}</EntityLink>}
                        {project&&<EntityLink type="project" id={project.id} navigate={navigate} className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>📁 {project.name}</EntityLink>}
                        {t.source!=="manual"&&<span className="mono" style={{ fontSize:9, color:"var(--text-dim)", background:"var(--bg-el)", padding:"1px 4px", borderRadius:3 }}>{t.source}</span>}
                      </div>
                    </div>
                    <RowActions onEdit={()=>{setTD({...t,projectId:String(t.projectId||""),contactId:String(t.contactId||""),companyId:String(t.companyId||""),dealId:String(t.dealId||"")});setDrawer({mode:"edit",type:"task"});}} onDelete={()=>setConfirm({id:t.id,label:t.title,type:"task"})}/>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}

      {drawer?.type==="task"&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Task`} onClose={()=>setDrawer(null)} onSave={()=>saveTask(td)}>
        <Field label="Task Title"><Inp value={td.title} onChange={v=>setTD(p=>({...p,title:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Status"><Sel value={td.status} onChange={v=>setTD(p=>({...p,status:v}))} options={TASK_STATUSES.map(s=>({value:s,label:s.replace(/_/g," ")}))}/></Field>
          <Field label="Priority"><Sel value={td.priority} onChange={v=>setTD(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
          <Field label="Category"><Sel value={td.category} onChange={v=>setTD(p=>({...p,category:v}))} options={TASK_CATEGORIES.map(c=>({value:c,label:c.replace(/_/g," ")}))}/></Field>
          <Field label="Due Date"><Inp type="date" value={td.due} onChange={v=>setTD(p=>({...p,due:v}))}/></Field>
          <Field label="Person"><SearchSelect value={td.contactId} onChange={v=>setTD(p=>({...p,contactId:v}))} options={db.contacts.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search contacts…" entityType="contact" navigate={navigate}/></Field>
          <Field label="Company"><SearchSelect value={td.companyId} onChange={v=>setTD(p=>({...p,companyId:v}))} options={db.companies.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search companies…" entityType="company" navigate={navigate}/></Field>
          <Field label="Project"><SearchSelect value={td.projectId} onChange={v=>setTD(p=>({...p,projectId:v}))} options={db.projects.map(x=>({value:String(x.id),label:x.name}))} placeholder="Search projects…" entityType="project" navigate={navigate}/></Field>
          <Field label="Deal"><SearchSelect value={td.dealId} onChange={v=>setTD(p=>({...p,dealId:v}))} options={db.deals.map(x=>({value:String(x.id),label:x.name}))} placeholder="Search deals…" entityType="deal" navigate={navigate}/></Field>
          <Field label="Assigned To"><Inp value={td.assignedTo} onChange={v=>setTD(p=>({...p,assignedTo:v}))}/></Field>
          <Field label="Source"><Sel value={td.source} onChange={v=>setTD(p=>({...p,source:v}))} options={["manual","user:voice","agent:orchestrator","agent:news_engine","agent:gmail_scan","agent:ai_sweep","agent:signal-engine","agent:claude_assist"]}/></Field>
        </div>
        <Field label="Notes"><Tex value={td.notes} onChange={v=>setTD(p=>({...p,notes:v}))}/></Field>
        {drawer.mode === "edit" && td.id && <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="task" entityId={td.id}/>}
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>delTask(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   PROJECTS VIEW (with AI Agent)
──────────────────────────────────────────────────────── */
const ProjectsView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pd, setPD] = useState(blankProject());
  const [expandedId, setExpandedId] = useState(null);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProposals, setAiProposals] = useState(null);
  const [selectedProposals, setSelectedProposals] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if(focus?.type==="project" && focus.id) {
      setExpandedId(focus.id);
      setFocus(null);
    }
  }, [focus]);

  const saveProject = (d) => {
    const rec = {...d, progress:parseInt(d.progress)||0, companyId:parseInt(d.companyId)||null, strategyId:parseInt(d.strategyId)||null, links:d.links||[], files:d.files||[]};
    if(drawer.mode==="add") setDB(db=>({...db,projects:[...db.projects,{...rec,id:nextId(db.projects)}]}));
    else setDB(db=>({...db,projects:db.projects.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };

  const handleProjectFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = 'projects/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        const { error } = await supabase.storage.from('memory-files').upload(path, file);
        if (error) { console.error('Upload error:', error); continue; }
        const { data: urlData } = supabase.storage.from('memory-files').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size, path });
      }
      setPD(p => ({ ...p, files: [...(p.files||[]), ...uploaded] }));
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeProjectFile = async (fileObj) => {
    if (fileObj.path) await supabase.storage.from('memory-files').remove([fileObj.path]);
    setPD(p => ({ ...p, files: (p.files||[]).filter(f => f.path !== fileObj.path) }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1048576).toFixed(1) + ' MB';
  };
  const delProject = (id) => { setDB(db=>({...db,projects:db.projects.filter(x=>x.id!==id)})); setConfirm(null); };
  const toggleTask = (id) => setDB(db=>({...db,tasks:db.tasks.map(t=>t.id===id?{...t,done:!t.done,status:t.done?"todo":"done"}:t)}));

  const handleAIGenerate = async (projectId) => {
    const proj = db.projects.find(p=>p.id===projectId);
    if (!proj || !aiInput.trim()) return;
    setAiLoading(true);
    try {
      const existingTasks = db.tasks.filter(t=>t.projectId===projectId).map(t=>`- ${t.title} (${t.status}, ${t.priority})`).join("\n");
      const system = `You are a project task planner. Given a project context and user instructions, generate actionable tasks. Return ONLY valid JSON: { "tasks": [{ "title": "...", "priority": "high|medium|low", "category": "follow_up|outreach|admin|research|meeting_prep|deliverable", "due": "YYYY-MM-DD or null", "notes": "..." }] }`;
      const user = `Project: ${proj.name}\nClient: ${proj.client}\nProgress: ${proj.progress}%\nDue: ${proj.dueDate}\nExisting tasks:\n${existingTasks||"(none)"}\n\nUser request: ${aiInput}\n\nGenerate 3-6 concrete tasks. Today is ${today()}.`;
      const response = await callClaude(system, user, 1200);
      let parsed;
      try { parsed = JSON.parse(response); } catch {
        const m = response.match(/\{[\s\S]*\}/);
        try { parsed = JSON.parse(m?.[0] || "{}"); } catch { parsed = { tasks: [] }; }
      }
      const tasks = parsed.tasks || [];
      setAiProposals(tasks);
      const sel = {}; tasks.forEach((_,i) => sel[i]=true);
      setSelectedProposals(sel);
    } catch(e) { console.error("AI gen failed:", e); setAiProposals([]); }
    setAiLoading(false);
  };

  const commitProposals = () => {
    const toAdd = (aiProposals||[]).filter((_,i) => selectedProposals[i]);
    if(toAdd.length > 0) {
      const proj = db.projects.find(p=>p.id===expandedId);
      const companyId = proj?.companyId || null;
      setDB(db => {
        let id = nextId(db.tasks);
        return {...db, tasks:[...db.tasks, ...toAdd.map(t => ({...blankTask(), ...t, id:id++, projectId:expandedId, companyId, source:"agent:ai_sweep"}))]};
      });
    }
    setAiProposals(null); setAiInput(""); setSelectedProposals({});
  };

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Projects</div>
        <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setPD(blankProject());setDrawer({mode:"add",type:"project"});}}><Plus size={12}/>Project</button>
      </div>

      
      {db.projects.map(p => {
        const pTasks = db.tasks.filter(t=>t.projectId===p.id);
        const open = pTasks.filter(t=>!t.done && t.status!=="done" && t.status!=="cancelled");
        const isExpanded = expandedId === p.id;
        return (
          <div key={p.id}>
            <div className="card row-hover" style={{ padding:16, borderLeft:`3px solid ${sc(p.status)}`, cursor:"pointer", borderRadius:isExpanded?"12px 12px 0 0":undefined }} onClick={()=>{setExpandedId(isExpanded?null:p.id); navigate("record",{type:"project",id:p.id});}}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, flexWrap:"wrap", gap:8 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>{p.name} <span style={{ fontSize:9, padding:"1px 6px", borderRadius:8, background: (p.type||"client")==="strategic"?"var(--purple-dim)":"var(--blue-dim)", color:(p.type||"client")==="strategic"?"var(--purple)":"var(--blue)", fontWeight:500 }}>{(p.type||"client")}</span></div>
                  <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{p.companyId ? <EntityLink type="company" id={p.companyId} navigate={navigate}>{p.client}</EntityLink> : p.client} · Due {p.dueDate} · {open.length} open / {pTasks.length} tasks</div>
                  {(p.files||[]).length > 0 && <div className="mono" style={{fontSize:9,color:"var(--text-dim)",marginTop:1,display:"flex",alignItems:"center",gap:3}}><Paperclip size={9}/> {(p.files||[]).length} file{(p.files||[]).length>1?"s":""}</div>}
                  {p.strategyId && (db.strategies||[]).find(s=>s.id===p.strategyId) && <div className="mono" style={{fontSize:9,color:"var(--purple)",marginTop:1}}>Strategy: {(db.strategies||[]).find(s=>s.id===p.strategyId)?.name}</div>}
                </div>
                <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }} onClick={e=>e.stopPropagation()}>
                  <Tag label={p.priority}/><Tag label={p.status}/>
                  <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={()=>{setPD({...p,progress:String(p.progress),companyId:String(p.companyId||""),strategyId:String(p.strategyId||""),links:p.links||[],files:p.files||[]});setDrawer({mode:"edit",type:"project"});}}><Pencil size={12}/>Edit</button>
                  <RowActions onEdit={()=>{setPD({...p,progress:String(p.progress),companyId:String(p.companyId||""),strategyId:String(p.strategyId||""),links:p.links||[],files:p.files||[]});setDrawer({mode:"edit",type:"project"});}} onDelete={()=>setConfirm({id:p.id,label:p.name})}/>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1, height:5, background:"var(--bg-el)", borderRadius:3 }}><div style={{ height:"100%", width:`${p.progress}%`, background:p.progress<40?"var(--red)":p.progress<70?"var(--amber)":"var(--green)", borderRadius:3, transition:"width .5s" }}/></div>
                <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{p.progress}%</span>
                <ChevronDown size={14} color="var(--text-sec)" onClick={(e)=>{e.stopPropagation();setExpandedId(isExpanded?null:p.id);}} style={{ transform:isExpanded?"rotate(180deg)":"none", transition:"transform .2s", cursor:"pointer" }}/>
              </div>
            </div>

            {isExpanded && (
              <div className="card-el" style={{ padding:16, borderRadius:"0 0 12px 12px", borderTop:"1px dashed var(--border)" }}>
                {/* COMPANY SNAPSHOT */}
                {(()=>{ const co = p.companyId ? db.companies.find(c=>c.id===p.companyId) : null; return co ? (
                  <div className="card-el" style={{ padding:"10px 14px", marginBottom:14, background:"var(--bg-card)", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    <Building2 size={14} color="var(--text-sec)"/>
                    <span style={{ fontSize:13, fontWeight:600 }}><EntityLink type="company" id={co.id} navigate={navigate}>{co.name}</EntityLink></span>
                    {co.industry && <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{co.industry}</span>}
                    <Tag label={co.status}/>
                    {co.website && <a href={co.website.startsWith("http")?co.website:`https://${co.website}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft:"auto", fontSize:11, color:"var(--blue)", display:"flex", gap:4, alignItems:"center" }} onClick={e=>e.stopPropagation()}><Globe size={11}/>Website</a>}
                  </div>
                ) : null; })()}
{/* PROJECT LINKS */}
                {(p.links||[]).length > 0 && <div style={{marginBottom:14}}>
                  <div className="mono" style={{fontSize:10,color:"var(--text-sec)",marginBottom:6}}>LINKS</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {(p.links||[]).map((lnk,li)=>(<a key={li} href={lnk.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,fontSize:11,color:"var(--blue)",textDecoration:"none",cursor:"pointer"}} title={lnk.desc||lnk.url}><ExternalLink size={11}/>{lnk.label||lnk.url}</a>))}
                  </div>
                </div>}
                {/* PROJECT FILES */}
                {(p.files||[]).length > 0 && <div style={{marginBottom:14}}>
                  <div className="mono" style={{fontSize:10,color:"var(--text-sec)",marginBottom:6}}>FILES</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {(p.files||[]).map((f,fi)=>(<a key={fi} href={f.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,fontSize:11,color:"var(--blue)",textDecoration:"none",cursor:"pointer"}} title={f.name}><FileText size={11}/>{f.name}</a>))}
                  </div>
                </div>}
                <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="project" entityId={p.id}/>
                                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:8 }}>PROJECT TASKS</div>
                {pTasks.length > 0 ? pTasks.map(t => (
                  <div key={t.id} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                    <button onClick={()=>toggleTask(t.id)} style={{ width:16, height:16, borderRadius:3, border:`2px solid ${t.done?"var(--green)":"var(--border-hi)"}`, background:t.done?"var(--green)":"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{t.done&&<Check size={9} color="#fff"/>}</button>
                    <EntityLink type="task" id={t.id} navigate={navigate} style={{ fontSize:12, flex:1, textDecoration:t.done?"line-through":"none", opacity:t.done?0.5:1 }}>{t.title}</EntityLink>
                    <Tag label={t.priority}/><span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{t.due||""}</span>
                  </div>
                )) : <div style={{ fontSize:12, color:"var(--text-dim)", padding:"8px 0" }}>No tasks yet — use the AI agent below to generate some.</div>}

                {/* AI AGENT */}
                <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}><Sparkles size={13} color="var(--blue)"/><span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>AI TASK AGENT</span></div>
                  <textarea className="input" value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder="Describe what needs to happen for this project..." style={{ marginBottom:8 }}/>
                  <button className="btn btn-blue" onClick={()=>handleAIGenerate(p.id)} disabled={aiLoading||!aiInput.trim()} style={{ opacity:aiLoading||!aiInput.trim()?0.5:1, fontSize:12 }}>
                    {aiLoading?<><Loader size={12} className="spin"/>Thinking...</>:<><Sparkles size={12}/>Generate Tasks</>}
                  </button>

                  {aiProposals && aiProposals.length > 0 && expandedId===p.id && (
                    <div style={{ marginTop:12, padding:12, background:"var(--bg)", borderRadius:8, border:"1px solid var(--border)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:600 }}>Proposed Tasks ({aiProposals.length})</span>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="btn btn-ghost" style={{ fontSize:10, padding:"3px 8px" }} onClick={()=>{const s={};aiProposals.forEach((_,i)=>s[i]=true);setSelectedProposals(s);}}>All</button>
                          <button className="btn btn-ghost" style={{ fontSize:10, padding:"3px 8px" }} onClick={()=>setSelectedProposals({})}>None</button>
                        </div>
                      </div>
                      {aiProposals.map((t, idx) => (
                        <label key={idx} style={{ display:"flex", gap:8, padding:"8px 6px", borderBottom:"1px solid var(--border)", cursor:"pointer", alignItems:"flex-start" }}>
                          <input type="checkbox" checked={!!selectedProposals[idx]} onChange={e=>setSelectedProposals(s=>({...s,[idx]:e.target.checked}))} style={{ marginTop:3 }}/>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:500 }}>{t.title}</div>
                            <div style={{ display:"flex", gap:4, marginTop:3 }}><Tag label={t.priority}/><Tag label={(t.category||"").replace(/_/g," ")} color="var(--purple)"/>{t.due&&<span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>Due {t.due}</span>}</div>
                            {t.notes&&<div style={{ fontSize:10, color:"var(--text-sec)", marginTop:3, fontStyle:"italic" }}>{t.notes}</div>}
                          </div>
                        </label>
                      ))}
                      <div style={{ display:"flex", gap:8, marginTop:10 }}>
                        <button className="btn btn-blue" style={{ flex:1, justifyContent:"center", fontSize:12 }} onClick={commitProposals}><Check size={12}/>Commit Selected</button>
                        <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center", fontSize:12 }} onClick={()=>{setAiProposals(null);setAiInput("");}}>Discard</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {drawer?.type==="project"&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Project`} onClose={()=>setDrawer(null)} onSave={()=>saveProject(pd)}>
        <Field label="Project Name"><Inp value={pd.name} onChange={v=>setPD(p=>({...p,name:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Client"><Inp value={pd.client} onChange={v=>setPD(p=>({...p,client:v}))}/></Field>
          <Field label="Company"><SearchSelect value={pd.companyId||""} onChange={v=>setPD(p=>({...p,companyId:v}))} options={db.companies.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search companies…"/></Field>
          <Field label="Status"><Sel value={pd.status} onChange={v=>setPD(p=>({...p,status:v}))} options={["active","stalled","complete","on-hold"]}/></Field>
          <Field label="Type"><Sel value={pd.type||"client"} onChange={v=>setPD(p=>({...p,type:v}))} options={["client","strategic"]}/></Field>
          <Field label="Priority"><Sel value={pd.priority} onChange={v=>setPD(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
          <Field label="Progress (%)"><Inp type="number" value={pd.progress} onChange={v=>setPD(p=>({...p,progress:v}))}/></Field>
          <Field label="Due Date"><Inp type="date" value={pd.dueDate} onChange={v=>setPD(p=>({...p,dueDate:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={pd.notes} onChange={v=>setPD(p=>({...p,notes:v}))}/></Field>
        <Field label="Strategy"><Sel value={pd.strategyId||""} onChange={v=>setPD(p=>({...p,strategyId:v}))} options={[{value:"",label:"None"},...(db.strategies||[]).map(s=>({value:String(s.id),label:s.name}))]}/></Field>
        <div style={{marginTop:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:600,color:"var(--text-sec)"}}>Links</span>
            <button type="button" className="btn btn-ghost" style={{fontSize:11,padding:"3px 8px"}} onClick={()=>setPD(p=>({...p,links:[...(p.links||[]),{url:"",label:"",desc:""}]}))}>+ Add Link</button>
          </div>
          {(pd.links||[]).map((lnk,li)=>(<div key={li} style={{display:"flex",gap:6,marginBottom:8,alignItems:"flex-start"}}>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
              <input className="input" placeholder="Label (e.g. Google Drive)" value={lnk.label} onChange={e=>{const links=[...(pd.links||[])];links[li]={...links[li],label:e.target.value};setPD(p=>({...p,links}));}} style={{padding:"6px 8px",fontSize:12}}/>
              <input className="input" placeholder="https://..." value={lnk.url} onChange={e=>{const links=[...(pd.links||[])];links[li]={...links[li],url:e.target.value};setPD(p=>({...p,links}));}} style={{padding:"6px 8px",fontSize:12}}/>
              <input className="input" placeholder="Short description" value={lnk.desc||""} onChange={e=>{const links=[...(pd.links||[])];links[li]={...links[li],desc:e.target.value};setPD(p=>({...p,links}));}} style={{padding:"6px 8px",fontSize:12}}/>
            </div>
            <button type="button" onClick={()=>setPD(p=>({...p,links:(p.links||[]).filter((_,i)=>i!==li)}))} style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",padding:4,marginTop:2}}><X size={14}/></button>
          </div>))}
        </div>
        <div style={{marginTop:14,borderTop:"1px solid var(--border)",paddingTop:14}}>
          <div className="mono" style={{fontSize:11,color:"var(--text-sec)",marginBottom:8,textTransform:"uppercase"}}>Attached Files</div>
          {(pd.files||[]).length > 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
              {(pd.files||[]).map((f,fi)=>(
                <div key={fi} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",borderRadius:6,background:"var(--bg-sec)",border:"1px solid var(--border)"}}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--blue)",textDecoration:"none",overflow:"hidden"}}>
                    <FileText size={13}/> <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                    <span className="mono" style={{fontSize:10,color:"var(--text-dim)",flexShrink:0}}>{f.size?'('+formatFileSize(f.size)+')':''}</span>
                  </a>
                  <button className="btn btn-sm" style={{padding:"2px 6px",color:"var(--red)"}} onClick={()=>removeProjectFile(f)} title="Remove file"><X size={12}/></button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" multiple style={{display:"none"}} onChange={handleProjectFileUpload}/>
          <button className="btn btn-sm" onClick={()=>fileInputRef.current?.click()} disabled={uploading} style={{fontSize:12,gap:6}}>
            {uploading ? <><Loader size={12} className="spin"/> Uploading...</> : <><Upload size={12}/> Upload Files</>}
          </button>
        </div>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>delProject(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};


/* ────────────────────────────────────────────────────────
   BILLING — INVOICES (mostly unchanged)
──────────────────────────────────────────────────────── */
const blankInvoice = () => ({ number:"", client:"", amount:0, status:"draft", issued:"", due:"", notes:"" });

const BillingView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankInvoice());

  useEffect(() => {
    if(focus?.type==="invoice" && focus.id) { const inv=db.invoices.find(x=>x.id===focus.id); if(inv) { setD({...inv}); setDrawer("edit"); } setFocus(null); }
  }, [focus]);
  const save = () => {
    const rec = {...d,amount:parseFloat(d.amount)||0};
    if(drawer==="add") setDB(db=>({...db,invoices:[...db.invoices,{...rec,id:nextId(db.invoices)}]}));
    else setDB(db=>({...db,invoices:db.invoices.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };
  const del = (id) => { setDB(db=>({...db,invoices:db.invoices.filter(x=>x.id!==id)})); setConfirm(null); };
  const paid = db.invoices.filter(i=>i.status==="paid").reduce((a,i)=>a+i.amount,0);
  const overdue = db.invoices.filter(i=>i.status==="overdue").reduce((a,i)=>a+i.amount,0);
  const pending = db.invoices.filter(i=>i.status==="pending").reduce((a,i)=>a+i.amount,0);
  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Invoices</div>
        <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setD(blankInvoice());setDrawer("add");}}><Plus size={12}/>New Invoice</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        <MetricCard icon={CheckCircle} label="Collected" value={fmt(paid)} color="--green"/>
        <MetricCard icon={Clock} label="Pending" value={fmt(pending)} color="--amber"/>
        <MetricCard icon={AlertCircle} label="Overdue" value={fmt(overdue)} color="--red"/>
        <MetricCard icon={TrendingUp} label="ARR Run Rate" value={fmt(Math.round(paid*12/3))} sub={`toward ${fmt(db.goals[0]?.target_value||800000)}`} color="--blue"/>
      </div>
      {overdue>0&&<div className="card" style={{ padding:16, borderLeft:"3px solid var(--red)" }}>
        <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:6 }}><AlertCircle size={14} color="var(--red)"/><span style={{ fontSize:12, fontWeight:700, color:"var(--red)" }}>INVOICE AGENT ALERT</span></div>
        <p style={{ fontSize:13, lineHeight:1.5 }}>{db.invoices.filter(i=>i.status==="overdue").length} invoices totaling {fmt(overdue)} overdue. Escalation recommended.</p>
      </div>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {db.invoices.map(inv=>(
          <div key={inv.id} className="card row-hover" onClick={()=>navigate("record",{type:"invoice",id:inv.id})} style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}><span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{inv.number}</span><span style={{ fontSize:13, fontWeight:600 }}>{inv.contactId ? <EntityLink type="contact" id={inv.contactId} navigate={navigate}>{inv.client}</EntityLink> : inv.client}</span></div>
              {inv.due&&<div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>Due: {inv.due}</div>}
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}><div style={{ fontFamily:"var(--font-d)", fontSize:15, fontWeight:700 }}>{fmt(inv.amount)}</div><Tag label={inv.status}/></div>
            <RowActions onEdit={()=>{setD({...inv,amount:String(inv.amount)});setDrawer("edit");}} onDelete={()=>setConfirm({id:inv.id,label:inv.number})}/>
          </div>
        ))}
      </div>
      {drawer&&<Drawer title={drawer==="add"?"New Invoice":"Edit Invoice"} onClose={()=>setDrawer(null)} onSave={save}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Invoice #"><Inp value={d.number} onChange={v=>setD(p=>({...p,number:v}))}/></Field>
          <Field label="Client"><Inp value={d.client} onChange={v=>setD(p=>({...p,client:v}))}/></Field>
          <Field label="Amount ($)"><Inp type="number" value={d.amount} onChange={v=>setD(p=>({...p,amount:v}))}/></Field>
          <Field label="Status"><Sel value={d.status} onChange={v=>setD(p=>({...p,status:v}))} options={["draft","pending","paid","overdue","void"]}/></Field>
          <Field label="Issued"><Inp type="date" value={d.issued} onChange={v=>setD(p=>({...p,issued:v}))}/></Field>
          <Field label="Due Date"><Inp type="date" value={d.due} onChange={v=>setD(p=>({...p,due:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={d.notes} onChange={v=>setD(p=>({...p,notes:v}))}/></Field>
        {drawer === "edit" && d.id && <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="invoice" entityId={d.id}/>}
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

const selectedAssociations = ({ contactId, companyId, dealId, projectId }) => [
  contactId && { type:"contact", id:Number(contactId) || contactId },
  companyId && { type:"company", id:Number(companyId) || companyId },
  dealId && { type:"deal", id:Number(dealId) || dealId },
  projectId && { type:"project", id:Number(projectId) || projectId },
].filter(Boolean);

const collectAssociateContext = (db, ids) => {
  const records = {
    contact: ids.contactId ? (db.contacts || []).find(x => String(x.id) === String(ids.contactId)) : null,
    company: ids.companyId ? (db.companies || []).find(x => String(x.id) === String(ids.companyId)) : null,
    deal: ids.dealId ? (db.deals || []).find(x => String(x.id) === String(ids.dealId)) : null,
    project: ids.projectId ? (db.projects || []).find(x => String(x.id) === String(ids.projectId)) : null,
  };
  const associations = selectedAssociations(ids);
  const docs = (db.documents || []).filter(d => (d.associations || []).some(a => associations.some(sel => sel.type === a.type && String(sel.id) === String(a.id))));
  const memories = (db.ai_memories || []).filter(m =>
    (ids.contactId && String(m.contactId) === String(ids.contactId)) ||
    (ids.companyId && String(m.companyId) === String(ids.companyId)) ||
    (ids.dealId && String(m.dealId) === String(ids.dealId)) ||
    (ids.projectId && String(m.projectId) === String(ids.projectId))
  );
  const tasks = (db.tasks || []).filter(t =>
    (ids.contactId && String(t.contactId) === String(ids.contactId)) ||
    (ids.companyId && String(t.companyId) === String(ids.companyId)) ||
    (ids.dealId && String(t.dealId) === String(ids.dealId)) ||
    (ids.projectId && String(t.projectId) === String(ids.projectId))
  );
  return {
    records,
    documents:docs.slice(0, 12).map(d => ({ id:d.id, title:d.title || d.file_name, description:d.description, kind:d.kind, file_name:d.file_name, url:d.url })),
    memories:memories.slice(0, 12).map(m => ({ id:m.id, subject:m.subject, memory_type:m.memory_type, summary:m.memory_summary, source:m.source_context })),
    tasks:tasks.slice(0, 16).map(t => ({ id:t.id, title:t.title, status:t.status, due:t.due, priority:t.priority, notes:t.notes })),
  };
};

/* ────────────────────────────────────────────────────────
   ASSOCIATES — AI Workbench
──────────────────────────────────────────────────────── */
const AssociatesView = ({ db, setDB, navigate }) => {
  const [selected, setSelected] = useState(ASSOCIATES[4].id);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [output, setOutput] = useState("");
  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [dealId, setDealId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [running, setRunning] = useState(false);
  const [createTask, setCreateTask] = useState(true);
  const [saveDocument, setSaveDocument] = useState(true);
  const [saveMemory, setSaveMemory] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");
  const [saved, setSaved] = useState(null);
  const associate = ASSOCIATES.find(c => c.id === selected) || ASSOCIATES[0];
  const ids = { contactId, companyId, dealId, projectId };
  const contextPack = useMemo(() => collectAssociateContext(db, ids), [db, contactId, companyId, dealId, projectId]);
  const recent = (db.ai_memories || []).filter(m => (m.source_context || "").includes("associates/") || (m.source_context || "").includes("mstack/")).slice(0, 8);
  const linkedName = contextPack.records.deal?.name || contextPack.records.project?.name || contextPack.records.company?.name || contextPack.records.contact?.name || "";

  const runAssociate = async () => {
    setRunning(true);
    setSaved(null);
    try {
      const system = [
        "You are an AI associate working for Mendy Ezagui, independent AI operations and Salesforce consultant.",
        "Brand context: Clarity Operator for consulting, Voitra AI for voice AI.",
        "Be direct, useful, and outcome-focused. No filler. Do not invent facts not in the context.",
        "Use value-based framing. Avoid hourly pricing unless explicitly required.",
        "If the output is client-facing, make it polished but not corporate. Never say 'I hope this finds you well.'",
        `Associate role: ${associate.label}. Required artifact: ${associate.artifact}.`,
        associate.prompt,
      ].join("\n");
      const user = [
        `ASSOCIATE: ${associate.label}`,
        `REQUEST TITLE: ${title || linkedName || associate.artifact}`,
        `LINKED SECOND BRAIN CONTEXT:\n${JSON.stringify(contextPack, null, 2)}`,
        `ADDITIONAL INSTRUCTIONS FROM MENDY:\n${instructions || "None."}`,
        "Return a complete, usable artifact. Include assumptions, risks, and next actions when relevant. If this is an SOW/proposal, include scope, deliverables, exclusions, timeline, fees if enough context exists, acceptance, and change control.",
      ].join("\n\n");
      const generated = await callClaude(system, user, 2200);
      setOutput(generated);
    } catch (error) {
      console.error("Associate run failed:", error);
      setOutput("Associate run failed. Check /api/claude and environment configuration.");
    }
    setRunning(false);
  };

  const saveAssociateWork = () => {
    const subject = title || `${associate.artifact}${linkedName ? ` - ${linkedName}` : ""}`;
    const summary = [instructions && `Instructions:\n${instructions}`, output && `Output:\n${output}`].filter(Boolean).join("\n\n");
    if (!summary.trim()) return;
    setDB(prev => {
      const memoryId = nextId(prev.ai_memories || []);
      const documentId = nextId(prev.documents || []);
      const associations = selectedAssociations(ids);
      let next = { ...prev };
      if (saveMemory) {
        const nextMemory = {
        id:memoryId,
        subject,
        ai_system:"codex",
        memory_summary:summary,
        memory_type:"context",
          source_context:`associates/${associate.id}`,
        companyId:companyId || null,
        contactId:contactId || null,
        dealId:dealId || null,
        projectId:projectId || null,
        strategyId:null,
        files:[],
        created_at:new Date().toISOString(),
      };
        next.ai_memories = [nextMemory, ...(prev.ai_memories || [])];
      }
      if (saveDocument) {
        next.documents = [{
          ...blankDocument(associations),
          id:documentId,
          title:subject,
          description:output,
          kind:"generated",
          created_at:new Date().toISOString(),
        }, ...(prev.documents || [])];
      }
      if (createTask && (taskTitle || subject)) {
        next.tasks = [...(prev.tasks || []), {
          ...blankTask(),
          id:nextId(prev.tasks || []),
          title:taskTitle || `Follow up: ${subject}`,
          due:today(),
          priority:"high",
          status:"todo",
          category:"follow_up",
          source:"agent:associate",
          contactId:contactId || null,
          companyId:companyId || null,
          dealId:dealId || null,
          projectId:projectId || null,
          notes:`Created from associates/${associate.id}.${saveMemory ? ` Memory #${memoryId}.` : ""}${saveDocument ? ` Document #${documentId}.` : ""}`,
        }];
      }
      return next;
    });
    setSaved({ memoryId:saveMemory ? nextId(db.ai_memories || []) : null, documentId:saveDocument ? nextId(db.documents || []) : null });
  };
  const resetDraft = () => {
    setTitle("");
    setInstructions("");
    setOutput("");
    setTaskTitle("");
    setSaved(null);
  };
  return (
    <div style={{ padding:24, maxWidth:1180, margin:"0 auto", display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <BookOpen size={18} color="var(--blue)"/>
            <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>AI ASSOCIATES</span>
          </div>
          <div className="display" style={{ fontSize:26, fontWeight:800 }}>Associates</div>
          <div style={{ fontSize:13, color:"var(--text-sec)", marginTop:6, maxWidth:680, lineHeight:1.6 }}>
            Give an associate the client, deal, project, documents, memories, and extra instructions. It does the work, then saves the result back into Second Brain.
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-ghost" onClick={()=>navigate("ai_memories")}><Sparkles size={13}/>AI Memories</button>
          <button className="btn btn-blue" onClick={runAssociate} disabled={running}>{running ? <><Loader size={13} className="spin"/>Running</> : <><Zap size={13}/>Run Associate</>}</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"320px minmax(0,1fr)", gap:18 }}>
        <div className="card" style={{ padding:14, alignSelf:"start" }}>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:10 }}>ASSOCIATES</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {ASSOCIATES.map(c => (
              <button key={c.id} onClick={()=>setSelected(c.id)} className="row-hover" style={{ textAlign:"left", border:"1px solid "+(selected===c.id ? "rgba(0,119,204,0.25)" : "var(--border)"), background:selected===c.id ? "var(--blue-dim)" : "var(--bg-card)", borderRadius:8, padding:"10px 12px", cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:13, fontWeight:700, color:selected===c.id ? "var(--blue)" : "var(--text)" }}>{c.label}</span>
                  <span className="mono" style={{ fontSize:9, color:"var(--text-sec)" }}>{c.group}</span>
                </div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginTop:4 }}>{c.artifact}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card" style={{ padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center", marginBottom:14 }}>
              <div>
                <div className="display" style={{ fontSize:17, fontWeight:800 }}>{associate.label}</div>
                <div style={{ fontSize:12, color:"var(--text-sec)", lineHeight:1.5, marginTop:3 }}>{associate.prompt}</div>
              </div>
              <button className="btn btn-blue" onClick={runAssociate} disabled={running}>{running ? <><Loader size={13} className="spin"/>Running</> : <><Zap size={13}/>Run</>}</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Field label="Request"><Inp value={title} onChange={setTitle} placeholder={`${associate.artifact} - client / deal / project`}/></Field>
              <Field label="Follow-up Task"><Inp value={taskTitle} onChange={setTaskTitle} placeholder="Optional task title"/></Field>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10 }}>
              <Field label="Contact"><SearchSelect value={contactId} onChange={setContactId} options={(db.contacts || []).map(c => ({ value:c.id, label:c.name }))} placeholder="Link contact..."/></Field>
              <Field label="Company"><SearchSelect value={companyId} onChange={setCompanyId} options={(db.companies || []).map(c => ({ value:c.id, label:c.name }))} placeholder="Link company..."/></Field>
              <Field label="Deal"><SearchSelect value={dealId} onChange={setDealId} options={(db.deals || []).map(d => ({ value:d.id, label:d.name }))} placeholder="Link deal..."/></Field>
              <Field label="Project"><SearchSelect value={projectId} onChange={setProjectId} options={(db.projects || []).map(p => ({ value:p.id, label:p.name }))} placeholder="Link project..."/></Field>
            </div>
            <Field label="Additional Instructions"><Tex value={instructions} onChange={setInstructions} placeholder="Tell the associate what is not already in Second Brain: special client asks, constraints, tone, pricing, deadlines, exclusions, or what kind of output you want."/></Field>
            <div className="card-el" style={{ padding:12, marginBottom:14 }}>
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:8 }}>CONTEXT THE ASSOCIATE WILL READ</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, fontSize:12 }}>
                <div><strong>Records</strong><div className="mono" style={{ color:"var(--text-sec)", fontSize:10 }}>{Object.values(contextPack.records).filter(Boolean).length} linked</div></div>
                <div><strong>Documents</strong><div className="mono" style={{ color:"var(--text-sec)", fontSize:10 }}>{contextPack.documents.length} matched</div></div>
                <div><strong>Memories</strong><div className="mono" style={{ color:"var(--text-sec)", fontSize:10 }}>{contextPack.memories.length} matched</div></div>
                <div><strong>Tasks</strong><div className="mono" style={{ color:"var(--text-sec)", fontSize:10 }}>{contextPack.tasks.length} matched</div></div>
              </div>
            </div>
            <Field label="Generated Output">
              <textarea className="input" rows={12} value={output} onChange={e=>setOutput(e.target.value)} placeholder="Run an associate to generate the artifact. You can edit the result before saving." style={{ width:"100%", resize:"vertical", fontFamily:"inherit", fontSize:13, lineHeight:1.6 }}/>
            </Field>
            <div style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center", marginTop:8 }}>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--text-sec)", cursor:"pointer" }}><input type="checkbox" checked={saveDocument} onChange={e=>setSaveDocument(e.target.checked)}/>Save generated document</label>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--text-sec)", cursor:"pointer" }}><input type="checkbox" checked={saveMemory} onChange={e=>setSaveMemory(e.target.checked)}/>Save AI memory</label>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--text-sec)", cursor:"pointer" }}><input type="checkbox" checked={createTask} onChange={e=>setCreateTask(e.target.checked)}/>Create task</label>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {saved?.documentId && <button className="btn btn-ghost" onClick={()=>navigate("record",{type:"document",id:saved.documentId})}><FileText size={13}/>Open Document</button>}
                {saved?.memoryId && <button className="btn btn-ghost" onClick={()=>navigate("record",{type:"ai_memory",id:saved.memoryId})}><Sparkles size={13}/>Open Memory</button>}
                <button className="btn btn-ghost" onClick={resetDraft}><X size={13}/>Clear</button>
                <button className="btn btn-blue" onClick={saveAssociateWork}><Save size={13}/>Save Work</button>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding:18 }}>
            <div className="display" style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>Recent Associate Work</div>
            {recent.length === 0 ? <div className="mono" style={{ fontSize:11, color:"var(--text-dim)" }}>No associate outputs saved yet.</div> : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {recent.map(m => (
                  <div key={m.id} className="card-el" style={{ padding:"10px 12px", display:"flex", alignItems:"center", gap:10 }}>
                    <Sparkles size={13} color="var(--purple)"/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700 }}>{recordLink("ai_memory", m.id, db, navigate) || m.subject}</div>
                      <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{m.source_context}</div>
                    </div>
                    {m.projectId && recordLink("project", m.projectId, db, navigate)}
                    {m.dealId && recordLink("deal", m.dealId, db, navigate)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   ORCHESTRATOR — Daily Priorities + News Engine + AI Sweep
──────────────────────────────────────────────────────── */
const OrchestratorView = ({ db, setDB, navigate }) => {
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [dismissed, setDismissed] = useState({});
  const [snoozing, setSnoozing] = useState(null); // key of item being snoozed

  const openTasks = db.tasks.filter(t => !t.done && t.status !== "done" && t.status !== "cancelled");
  const criticalTasks = openTasks.filter(t => t.priority === "critical");
  const highTasks = openTasks.filter(t => t.priority === "high");
  const overdueInv = db.invoices.filter(i => i.status === "overdue");
  const pendingInv = db.invoices.filter(i => i.status === "pending");
  const stalledProj = db.projects.filter(p => p.status === "stalled");
  const activeProj = db.projects.filter(p => p.status === "active");
  const activeDeals = db.deals.filter(d => !["won","lost"].includes(d.stage));
  const atRiskC = db.contacts.filter(c => c.status === "at-risk");
  const clients = db.contacts.filter(c => c.category === "customer" || c.status === "client");
  const leads = db.contacts.filter(c => c.category === "customer_lead" || c.category === "partner_lead" || c.status === "prospect");
  const paidYTD = db.invoices.filter(i => i.status === "paid").reduce((a,i) => a+i.amount, 0);
  const overdueAR = overdueInv.reduce((a,i) => a+i.amount, 0);
  const weightedPipe = Math.round(db.deals.reduce((a,d) => a+d.value*(d.probability/100), 0));
  const totalPipe = db.deals.reduce((a,d) => a+d.value, 0);
  const goal = db.goals.find(g=>g.status==="active") || { target_value:800000 };
  const revenueGap = Math.max(0, goal.target_value - paidYTD);
  const pipelineCoverage = revenueGap > 0 ? Math.round((weightedPipe / revenueGap) * 100) : 100;

  // Relationship decay detection
  const decayedContacts = db.contacts.filter(c => c.lastTouch && c.score >= 50 && daysBetween(c.lastTouch, today()) > 14);

  // Engagement recommendations from across platform
  const engagementRecs = [];
  db.contacts.filter(c=>c.follow_up).forEach(c => engagementRecs.push({ type:"follow_up", source:"CRM", message:`${c.name}: ${c.follow_up}`, priority:c.priority==="High"?"high":"medium", contactId:c.id }));
  db.deals.filter(d=>d.notes && d.probability>=50 && !["won","lost"].includes(d.stage)).forEach(d => {
    const contact = db.contacts.find(c=>c.id===d.contactId);
    engagementRecs.push({ type:"deal_action", source:"Deals", message:`${d.name} (${d.probability}%): ${d.notes}`, priority:d.probability>=70?"high":"medium", contactId:d.contactId });
  });

  // Build daily priorities (with navigation targets)
  const allPriorities = [
    ...criticalTasks.map(t => ({ key:`task-${t.id}`, isTask:true, icon:"🔴", label:t.title, detail:`Due ${t.due} · Critical`, priority:"critical", nav:{view:"tasks",focus:{type:"task",id:t.id}} })),
    ...overdueInv.map(i => ({ key:`inv-${i.id}`, isTask:false, icon:"💰", label:`${i.number} — ${i.client} — ${fmt(i.amount)} OVERDUE`, detail:`Due ${i.due}`, priority:"critical", nav:{view:"invoices",focus:{type:"invoice",id:i.id}}, taskTitle:`Follow up on overdue invoice ${i.number} — ${i.client} (${fmt(i.amount)})`, taskPriority:"critical", contactId:null, companyId:null })),
    ...atRiskC.map(c => ({ key:`risk-${c.id}`, isTask:false, icon:"⚠️", label:`${c.name} (${c.co}) is at-risk`, detail:`Score: ${c.score}. Last touch: ${c.lastTouch}`, priority:"critical", nav:{view:"crm",focus:{type:"contact",id:c.id}}, taskTitle:`Re-engage at-risk contact: ${c.name} (${c.co})`, taskPriority:"high", contactId:c.id, companyId:c.companyId||null })),
    ...highTasks.filter(t=>t.due && t.due <= today()).map(t => ({ key:`task-${t.id}`, isTask:true, icon:"🟡", label:t.title, detail:`Due today or overdue`, priority:"high", nav:{view:"tasks",focus:{type:"task",id:t.id}} })),
    ...decayedContacts.slice(0,3).map(c => ({ key:`decay-${c.id}`, isTask:false, icon:"📞", label:`Reconnect: ${c.name} (${c.co})`, detail:`${daysBetween(c.lastTouch, today())} days since last touch. Score: ${c.score}`, priority:"medium", nav:{view:"crm",focus:{type:"contact",id:c.id}}, taskTitle:`Reconnect with ${c.name} (${c.co})`, taskPriority:"medium", contactId:c.id, companyId:c.companyId||null })),
    ...engagementRecs.slice(0,3).map((r,i) => ({ key:`eng-${i}`, isTask:false, icon:"💡", label:r.message, detail:`Source: ${r.source}`, priority:r.priority, nav:r.contactId?{view:"crm",focus:{type:"contact",id:r.contactId}}:null, taskTitle:r.message.substring(0,120), taskPriority:r.priority==="high"?"high":"medium", contactId:r.contactId||null, companyId:null })),
      ...(db.projects||[]).filter(p=>p.type==="strategic"&&(p.priority==="high"||p.priority==="critical")&&p.status==="active").map(p=>({ key:"strat-"+p.id, icon:Star, color:"var(--purple)", label:p.name, sub:"Strategic priority — "+p.priority, taskTitle:"Advance "+p.name, taskPriority:p.priority, companyId:p.companyId||null })),
    ...(db.deals||[]).filter(d=>d.stage!=="closed_won"&&d.stage!=="closed_lost"&&d.lastActivity&&daysBetween(d.lastActivity,today())>7).map(d=>({ key:"stale-deal-"+d.id, icon:AlertCircle, color:"var(--amber)", label:d.name+" (⚠ stale)", sub:"No activity in "+daysBetween(d.lastActivity,today())+" days — $"+fmt(d.value), taskTitle:"Follow up on "+d.name, taskPriority:"high", dealId:d.id, companyId:d.companyId||null })),
  ];
  const dailyPriorities = allPriorities.filter(p => !dismissed[p.key]);

  const convertToTask = (p) => {
    const newTask = { id:nextId(db.tasks), title:p.taskTitle, due:today(), done:false, priority:p.taskPriority||"medium", status:"done", category:"follow_up", contactId:p.contactId||null, companyId:p.companyId||null, dealId:null, projectId:null, assignedTo:"", notes:`Completed from Orchestrator priority on ${today()}.`, source:"agent:orchestrator", recurrence:"none" };
    setDB(d=>({...d, tasks:[...d.tasks, newTask]}));
    setDismissed(d=>({...d,[p.key]:true}));
  };
  const snoozeItem = (p, newDate) => {
    const newTask = { id:nextId(db.tasks), title:p.taskTitle||p.label, due:newDate, done:false, priority:p.taskPriority||"medium", status:"todo", category:"follow_up", contactId:p.contactId||null, companyId:p.companyId||null, dealId:null, projectId:null, assignedTo:"", notes:`Snoozed from Orchestrator priority. Original: ${p.label}`, source:"agent:orchestrator", recurrence:"none" };
    setDB(d=>({...d, tasks:[...d.tasks, newTask]}));
    setDismissed(d=>({...d,[p.key]:true}));
    setSnoozing(null);
  };
  const dismissItem = (p) => setDismissed(d=>({...d,[p.key]:true}));

  const liveAlerts = [
    ...overdueInv.map(i => ({ id:`ov-${i.id}`, agent:"Billing Agent", type:"alert", priority:"critical", message:`${i.number} — ${i.client} — ${fmt(i.amount)} OVERDUE (due ${i.due}).`, nav:{view:"invoices",focus:{type:"invoice",id:i.id}} })),
    ...atRiskC.map(c => ({ id:`ar-${c.id}`, agent:"CRM Agent", type:"risk", priority:"critical", message:`${c.name} (${c.co}) at-risk. Score: ${c.score}/100. Last touch: ${c.lastTouch}.`, nav:{view:"crm",focus:{type:"contact",id:c.id}} })),
    ...criticalTasks.map(t => ({ id:`ct-${t.id}`, agent:"Ops Agent", type:"task", priority:"critical", message:`CRITICAL: "${t.title}" — due ${t.due}.`, nav:{view:"tasks",focus:{type:"task",id:t.id}} })),
    ...stalledProj.map(p => ({ id:`sp-${p.id}`, agent:"Ops Agent", type:"risk", priority:"high", message:`Project stalled: "${p.name}" (${p.client}) — ${p.progress}%.`, nav:{view:"projects",focus:{type:"project",id:p.id}} })),
    ...decayedContacts.map(c => ({ id:`decay-${c.id}`, agent:"CRM Agent", type:"alert", priority:"medium", message:`Relationship decay: ${c.name} (${c.co}) — ${daysBetween(c.lastTouch, today())} days since last contact.`, nav:{view:"crm",focus:{type:"contact",id:c.id}} })),
    ...activeDeals.filter(d=>d.probability>=60).map(d => ({ id:`deal-${d.id}`, agent:"CRM Agent", type:"opportunity", priority:"high", message:`${d.name} — ${fmt(d.value)} at ${d.probability}%.`, nav:{view:"deals",focus:{type:"deal",id:d.id}} })),
    { id:"pipe-summary", agent:"Orchestrator", type:"synthesis", priority:"high", message:`Pipeline: ${fmt(totalPipe)} total, ${fmt(weightedPipe)} weighted. Gap to ${fmt(goal.target_value)}: ${fmt(revenueGap)}. Coverage: ${pipelineCoverage}%.`, nav:null },
  ];

  const agents = [
    { name:"Orchestrator", color:"var(--purple)", stat:`${dailyPriorities.length} priorities`, detail:`${liveAlerts.length} alerts` },
    { name:"CRM Agent", color:"var(--blue)", stat:`${db.contacts.length} contacts`, detail:`${atRiskC.length} at-risk · ${leads.length} leads` },
    { name:"Marketing Agent", color:"var(--amber)", stat:`${db.campaigns.filter(c=>c.status==="active").length} campaigns`, detail:`${db.campaigns.reduce((a,c)=>a+c.leads,0)} leads` },
    { name:"Ops Agent", color:"var(--green)", stat:`${activeProj.length} active`, detail:`${stalledProj.length} stalled · ${openTasks.length} tasks` },
    { name:"Billing Agent", color:"var(--red)", stat:`${fmt(overdueAR)} overdue`, detail:`${overdueInv.length} invoices` },
    { name:"News Engine", color:"var(--blue)", stat:`${db.companyNews.length} articles`, detail:`${db.companies.length} companies tracked` },
  ];

  const sweep = async () => {
    setLoading(true);
    try {
      const snap = {
        contacts: db.contacts.filter(c=>{const comp=(db.companies||[]).find(co=>co.name===c.co);return !comp||comp.status!=="parked"}).map(c=>({name:c.name,co:c.co,status:c.status,category:c.category,score:c.score,lastTouch:c.lastTouch,follow_up:c.follow_up})),
        deals: db.deals.map(d=>({name:d.name,value:d.value,stage:d.stage,probability:d.probability,closeDate:d.closeDate,notes:d.notes})),
        projects: db.projects.map(p=>({name:p.name,client:p.client,type:p.type||"client",status:p.status,progress:p.progress,priority:p.priority,dueDate:p.dueDate})),
        tasks: openTasks.map(t=>({title:t.title,due:t.due,priority:t.priority,category:t.category,contactId:t.contactId})),
        invoices: db.invoices.filter(i=>i.status!=="paid").map(i=>({client:i.client,amount:i.amount,status:i.status,due:i.due})),
        metrics: { paidYTD, weightedPipeline:weightedPipe, totalPipeline:totalPipe, overdueAR, revenueGap, pipelineCoverage, openTasks:openTasks.length, decayedContacts:decayedContacts.length }};
      const msg = await callClaude(
        `You are Mendy Ezagui's Orchestrator Agent. He's an independent AI ops consultant targeting property management/HOA. Revenue target: ${fmt(goal.target_value)}. Projects have a "type" field: "client" (revenue-generating work) or "strategic" (partnerships, marketing, internal tools). Strategic projects have priority levels (critical/high/medium/low). HIGH-PRIORITY STRATEGIC projects should be weighted alongside client deliverables when generating priorities. Use goals and strategic project priorities to shape your daily recommendations. Be specific — name names and cite numbers.`,
        `Live snapshot \u2014 ${today()}:\n${JSON.stringify(snap,null,2)}\n\nGenerate a DAILY ACTION PLAN with these sections:\n1. TOP PRIORITY: The single most critical action today (revenue, deadline, or relationship at stake)\n2. DEAL MOVES: Specific next steps for deals closest to closing or with highest revenue potential\n3. STRATEGIC PLAYS: Actions to advance high-priority strategic projects and partnerships\n4. SMART NUDGES: Flag any stale deals (no activity 7+ days), contacts not touched in 14+ days, upcoming deadlines this week, or at-risk relationships\n\nBe specific \u2014 name people, dollar amounts, and exact actions. Max 8 sentences total.`,
        500
      );
      setDB(d=>({...d, agentLogs:[{id:nextId(d.agentLogs)+1, agent:"Orchestrator", type:"synthesis", message:msg, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:"high"}, ...d.agentLogs]}));
    } catch {
      setDB(d=>({...d, agentLogs:[{id:nextId(d.agentLogs), agent:"Orchestrator", type:"error", message:"Sweep failed.", ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:"medium"}, ...d.agentLogs]}));
    }
    setLoading(false);
  };

  const runNewsEngine = async () => {
    setNewsLoading(true);
    try {
      const companiesWithKeywords = db.companies.filter(c => c.name && c.status !== "parked");
      if (companiesWithKeywords.length === 0) { setNewsLoading(false); return; }

      const companyList = companiesWithKeywords.map(c => `${c.name}${c.news_keywords ? ` (keywords: ${c.news_keywords})` : ""}`).join(", ");
      const contactContext = db.contacts.filter(c=>c.companyId).map(c => `${c.name} at company ID ${c.companyId}`).join(", ");

      const raw = await callClaude(
        `You are a News Intelligence Agent. Search for recent news about these companies and return actionable intelligence. Return ONLY a JSON array.`,
        `Companies to monitor: ${companyList}\n\nContacts: ${contactContext}\n\nFor each company, find 1-2 recent news items (funding, partnerships, leadership changes, product launches, industry trends). Return JSON array: [{"companyName":"","companyId":null,"headline":"","summary":"","relevance_score":1-10,"published_date":"","suggested_action":"","suggested_contact":"","action_priority":"high|medium|low"}]`,
        2000
      );

      let newsItems = [];
      try { const m = raw.match(/\[[\s\S]*\]/); if (m) newsItems = JSON.parse(m[0]); } catch { newsItems = []; }

      if (newsItems.length > 0) {
        const newNews = [];
        const newTasks = [];
        const newLogs = [];

        newsItems.forEach(item => {
          const company = db.companies.find(c => c.name === item.companyName) || (item.companyId ? db.companies.find(c=>c.id===item.companyId) : null);
          if (!company) return;

          const newsId = nextId([...db.companyNews, ...newNews]);
          newNews.push({ id:newsId, companyId:company.id, headline:item.headline||"", source_url:"", summary:item.summary||"", relevance_score:item.relevance_score||5, published_date:item.published_date||today(), action_taken:false, taskId:null, created_at:today() });

          if (item.relevance_score >= 7 && item.suggested_action) {
            const contact = db.contacts.find(c => c.companyId === company.id || c.co === company.name);
            const taskId = nextId([...db.tasks, ...newTasks]);
            newTasks.push({ id:taskId, title:`News: ${item.suggested_action.substring(0,80)}`, projectId:null, contactId:contact?.id||null, companyId:company.id, dealId:null, due:new Date(Date.now()+3*86400000).toISOString().split("T")[0], done:false, priority:item.action_priority||"medium", assignedTo:"CRM Agent", notes:`News: "${item.headline}"\n${item.summary}\n\nSuggested action: ${item.suggested_action}`, status:"todo", category:"outreach", source:"agent:news_engine", recurrence:"none" });
          }
        });

        newLogs.push({ id:nextId(db.agentLogs), agent:"News Engine", type:"insight", message:`Found ${newNews.length} news items across ${[...new Set(newNews.map(n=>n.companyId))].length} companies. Created ${newTasks.length} action tasks.`, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:newTasks.length>0?"high":"medium" });

        setDB(d => ({...d,
          companyNews: [...newNews, ...d.companyNews],
          tasks: [...d.tasks, ...newTasks],
          agentLogs: [...newLogs, ...d.agentLogs],
        }));
      }
    } catch(e) {
      console.error("News engine error:", e);
      setDB(d=>({...d, agentLogs:[{id:nextId(d.agentLogs), agent:"News Engine", type:"error", message:"News scan failed.", ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:"medium"}, ...d.agentLogs]}));
    }
    setNewsLoading(false);
  };

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div className="display" style={{ fontSize:18, fontWeight:700 }}>Orchestrator</div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginTop:3 }}>
            Live · {db.contacts.length} contacts · {activeDeals.length} deals · {openTasks.length} tasks
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-ghost" onClick={runNewsEngine} disabled={newsLoading} style={{ fontSize:12, opacity:newsLoading?0.6:1 }}>
            {newsLoading?<><Loader size={12} className="spin"/>Scanning news…</>:<><Newspaper size={12}/>Scan Company News</>}
          </button>
          <button className="btn btn-blue" onClick={sweep} disabled={loading} style={{ opacity:loading?0.6:1 }}>
            {loading?<><Loader size={13} className="spin"/>Running…</>:<><Zap size={13}/>AI Insight Sweep</>}
          </button>
        </div>
      </div>


      {/* Agent stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10 }}>
        {agents.map(a=>(
          <div key={a.name} className="card" style={{ padding:14, borderTop:`3px solid ${a.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:11, fontWeight:600, color:a.color }}>{a.name}</span>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)" }} className="blink"/>
            </div>
            <div style={{ fontSize:15, fontWeight:700, fontFamily:"var(--font-d)", marginBottom:2 }}>{a.stat}</div>
            <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{a.detail}</div>
          </div>
        ))}
      </div>


      {/* Live Alerts */}
      <div>
        <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:10 }}>LIVE STATUS — {liveAlerts.length} alerts</div>
        {liveAlerts.map(l=>(
          <div key={l.id} onClick={()=>l.nav&&navigate(l.nav.view,l.nav.focus)} className="card-el" style={{ padding:"12px 14px", marginBottom:8, borderLeft:`2px solid ${sc(l.priority)}`, cursor:l.nav?"pointer":"default", transition:"background .15s" }} onMouseEnter={e=>{if(l.nav)e.currentTarget.style.background="var(--bg-hover)"}} onMouseLeave={e=>e.currentTarget.style.background=""}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}><AgentBadge agent={l.agent}/><Tag label={l.type} color={sc(l.priority)}/><Tag label={l.priority}/>{l.nav&&<ChevronRight size={12} color="var(--text-dim)" style={{marginLeft:"auto",flexShrink:0}}/>}</div>
            <p style={{ fontSize:13, lineHeight:1.5 }}>{l.message}</p>
          </div>
        ))}
      </div>

      {/* Recent News */}
      {db.companyNews.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:10 }}><Newspaper size={11}/> RECENT COMPANY NEWS — {db.companyNews.length} articles</div>
          {db.companyNews.slice(0,6).map(n=>{
            const company = db.companies.find(c=>c.id===n.companyId);
            return (
              <div key={n.id} onClick={()=>company&&navigate("companies",{type:"company",id:company.id})} className="card-el" style={{ padding:"12px 14px", marginBottom:8, borderLeft:"2px solid var(--blue)", cursor:company?"pointer":"default", transition:"background .15s" }} onMouseEnter={e=>{if(company)e.currentTarget.style.background="var(--bg-hover)"}} onMouseLeave={e=>e.currentTarget.style.background=""}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{n.headline}</span>
                  {company&&<><span className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginLeft:"auto" }}>{company.name}</span><ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0}}/></>}
                </div>
                <p style={{ fontSize:12, color:"var(--text-sec)", lineHeight:1.5 }}>{n.summary}</p>
                <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginTop:4 }}>Relevance: {n.relevance_score}/10 · {n.published_date}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Sweep log */}
      {db.agentLogs.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:10 }}>AI SWEEP LOG — {db.agentLogs.length} entries</div>
          {db.agentLogs.slice(0,10).map(l=>(
            <div key={l.id} className="card-el" style={{ padding:"12px 14px", marginBottom:8, borderLeft:`2px solid ${sc(l.priority)}`, opacity:0.85 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}><AgentBadge agent={l.agent}/><Tag label={l.type} color={sc(l.priority)}/><span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>{l.ts}</span></div>
              <p style={{ fontSize:13, lineHeight:1.5 }}>{l.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   VOICE LAB
──────────────────────────────────────────────────────── */
const VoiceView = ({ db, setDB, autoRecord }) => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [proposals, setProposals] = useState(null); // AI-proposed operations
  const [selected, setSelected] = useState({}); // { index: true/false }
  const [committed, setCommitted] = useState(null); // after commit
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [history, setHistory] = useState([]);
  const recRef = useRef(null);
  const autoStarted = useRef(false);
  const start = () => {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setTranscript("Speech recognition not available in this browser.");return;}
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=e=>{let t="";for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;setTranscript(t);};
    r.start();recRef.current=r;setRecording(true);
  };
  const stop = () => {recRef.current?.stop();setRecording(false);};

  // Auto-start recording when opened via floating button
  useEffect(() => {
    if (autoRecord && !autoStarted.current && !recording) {
      autoStarted.current = true;
      setTimeout(() => start(), 300);
    }
  }, [autoRecord]);

  const buildContext = () => {
    const contacts = (db.contacts||[]).filter(c=>{const comp=(db.companies||[]).find(co=>co.name===c.co);return !comp||comp.status!=="parked"}).map(c=>`[Contact id:${c.id}] ${c.name} — ${c.co||""} — ${c.role||""} (category:${c.category||"none"}, score:${c.score||0})`).join("\n");
    const companies = (db.companies||[]).filter(c=>c.status!=="parked").map(c=>`[Company id:${c.id}] ${c.name} — ${c.industry||""} (status:${c.status||"prospect"})`).join("\n");
    const deals = (db.deals||[]).map(d=>`[Deal id:${d.id}] ${d.name} — $${d.value} — stage:${d.stage} (prob:${d.probability}%)`).join("\n");
    const projects = (db.projects||[]).map(p=>`[Project id:${p.id}] ${p.name} (${p.type||"client"}) — status:${p.status} priority:${p.priority||"medium"} (progress:${p.progress}%)`).join("\n");
    const tasks = (db.tasks||[]).map(t=>`[Task id:${t.id}] ${t.title} — due:${t.due||"none"} priority:${t.priority||"medium"} status:${t.status||"todo"}`).join("\n");
    return `CONTACTS:\n${contacts}\n\nCOMPANIES:\n${companies}\n\nDEALS:\n${deals}\n\nPROJECTS:\n${projects}\n\nTASKS:\n${tasks}`;
  };

  /* Describe an operation in human-readable form */
  const describeOp = (op) => {
    if(op.action==="create_task") return {icon:"Zap",color:"var(--amber)",text:`Create task: ${op.data?.title||"Untitled"}`,detail:`Due: ${op.data?.due||"none"} · Priority: ${op.data?.priority||"medium"} · Category: ${op.data?.category||"—"}`};
    if(op.action==="update_contact") { const c=(db.contacts||[]).find(c=>c.id===op.data?.id); return {icon:"Users",color:"var(--blue)",text:`Update contact: ${c?.name||"ID "+op.data?.id}`,detail:`Fields: ${Object.keys(op.data?.fields||{}).join(", ")}`}; }
    if(op.action==="create_deal") return {icon:"Briefcase",color:"var(--green)",text:`Create deal: ${op.data?.name||"Untitled"}`,detail:`Value: $${op.data?.value||0} · Stage: ${op.data?.stage||"discovery"}`};
    if(op.action==="update_deal") { const d=(db.deals||[]).find(d=>d.id===op.data?.id); return {icon:"Briefcase",color:"var(--purple)",text:`Update deal: ${d?.name||"ID "+op.data?.id}`,detail:`Fields: ${Object.keys(op.data?.fields||{}).join(", ")}`}; }
    if(op.action==="update_project") { const p=(db.projects||[]).find(p=>p.id===op.data?.id); return {icon:"Target",color:"var(--blue)",text:`Update project: ${p?.name||"ID "+op.data?.id}`,detail:`Fields: ${Object.keys(op.data?.fields||{}).join(", ")}`}; }
    if(op.action==="create_contact") return {icon:"Users",color:"var(--green)",text:`Create contact: ${op.data?.name||"Unknown"}`,detail:`${op.data?.co||""} · ${op.data?.role||""} · Category: ${op.data?.category||"—"}`};
    if(op.action==="log_event") return {icon:"FileText",color:"var(--text-sec)",text:`Log event: ${op.data?.event_type||"voice_note"}`,detail:op.data?.description||""};
    return {icon:"AlertCircle",color:"var(--text-dim)",text:`Unknown: ${op.action}`,detail:""};
  };

  const iconFor = (name) => {
    if(name==="Zap") return <Zap size={13} style={{flexShrink:0}}/>;
    if(name==="Users") return <Users size={13} style={{flexShrink:0}}/>;
    if(name==="Briefcase") return <Briefcase size={13} style={{flexShrink:0}}/>;
    if(name==="Target") return <Target size={13} style={{flexShrink:0}}/>;
    if(name==="FileText") return <FileText size={13} style={{flexShrink:0}}/>;
    return <AlertCircle size={13} style={{flexShrink:0}}/>;
  };

  /* Step 1: Analyze — send to Claude, get proposed operations back */
  const analyze = async () => {
    if(!transcript.trim())return;
    setLoading(true);setProposals(null);setCommitted(null);setSelected({});
    try {
      const ctx = buildContext();
      const sysPrompt = `You are Mendy's Life OS Voice Agent. You receive a voice note and the current state of the database. Your job:
1. Understand what Mendy said
2. Determine ALL database operations needed (create tasks, update contacts, create deals, update deals, add notes, etc.)
3. Match mentions to EXISTING records by id when possible
4. Return ONLY valid JSON (no markdown, no backticks):
{
  "summary": "Brief summary of what the note was about",
  "operations": [
    {"action":"create_task","data":{"title":"...","due":"YYYY-MM-DD","priority":"high|medium|low","category":"follow_up|outreach|admin|research|meeting_prep|deliverable","contactId":null,"companyId":null,"dealId":null,"projectId":null,"status":"todo"}},
    {"action":"update_contact","data":{"id":123,"fields":{"notes":"append: ...","score":85,"lastTouch":"YYYY-MM-DD","status":"client","category":"customer"}}},
    {"action":"create_deal","data":{"name":"...","contactId":null,"companyId":null,"value":0,"stage":"discovery|outreach|proposal|negotiation|won|lost","probability":50,"closeDate":"YYYY-MM-DD","notes":"..."}},
    {"action":"update_deal","data":{"id":123,"fields":{"stage":"negotiation","probability":70,"notes":"append: ..."}}},
    {"action":"update_project","data":{"id":123,"fields":{"status":"active","progress":50,"notes":"append: ..."}}},
    {"action":"create_contact","data":{"name":"...","co":"...","role":"...","email":"","phone":"","status":"prospect","score":50,"category":"customer_lead","notes":"..."}},
    {"action":"log_event","data":{"entity_type":"contact|deal|project|task","entity_id":null,"event_type":"voice_note","description":"..."}}
  ]
}
Rules:
- Always set lastTouch to today when a contact is mentioned
- When appending notes, prefix with date and "Voice note: "
- Create tasks for any follow-ups, action items, or reminders mentioned
- Link tasks to the right contact/company/deal/project by id
- If a new person is mentioned who is NOT in the database, create_contact
- Be thorough — capture EVERYTHING actionable from the note
- For dates, today is ${today()}`;

      const raw = await callClaude(sysPrompt, `DATABASE STATE:\n${ctx}\n\nVOICE NOTE:\n"${transcript}"`, 1500);
      let parsed;
      try { parsed = JSON.parse(raw); } catch {
        const m = raw.match(/\{[\s\S]*\}/);
        try { parsed = JSON.parse(m?.[0]||"{}"); } catch { parsed = {summary:"Could not parse AI response.",operations:[]}; }
      }
      const ops = parsed.operations || parsed.committed || [];
      setProposals({ summary: parsed.summary, operations: ops });
      /* Select all by default */
      const sel = {};
      ops.forEach((_,i) => { sel[i] = true; });
      setSelected(sel);
    } catch(err) { setProposals({summary:`Error: ${err.message}`,operations:[]}); }
    setLoading(false);
  };

  /* Step 2: Commit only selected operations */
  const commitSelected = () => {
    if(!proposals) return;
    setCommitting(true);
    const ops = proposals.operations.filter((_,i) => selected[i]);
    const logs = [];
    setDB(prev => {
      const d = {...prev};
      for (const op of ops) {
        try {
          if (op.action === "create_task" && op.data) {
            const t = { id: nextId(d.tasks||[]), ...op.data, source: "user:voice" };
            d.tasks = [...(d.tasks||[]), t];
            logs.push({icon:"Zap",color:"var(--amber)",text:`Created task: ${t.title}`});
          } else if (op.action === "update_contact" && op.data?.id) {
            d.contacts = (d.contacts||[]).map(c => {
              if (c.id !== op.data.id) return c;
              const f = {...op.data.fields};
              if (f.notes?.startsWith("append:")) f.notes = (c.notes||"") + "\n" + f.notes.replace("append:","").trim();
              return {...c, ...f};
            });
            const cName = (d.contacts||[]).find(c=>c.id===op.data.id)?.name||"Contact";
            logs.push({icon:"Users",color:"var(--blue)",text:`Updated ${cName}: ${Object.keys(op.data.fields||{}).join(", ")}`});
          } else if (op.action === "create_deal" && op.data) {
            const deal = { id: nextId(d.deals||[]), ...op.data };
            d.deals = [...(d.deals||[]), deal];
            logs.push({icon:"Briefcase",color:"var(--green)",text:`Created deal: ${deal.name}`});
          } else if (op.action === "update_deal" && op.data?.id) {
            d.deals = (d.deals||[]).map(dl => {
              if (dl.id !== op.data.id) return dl;
              const f = {...op.data.fields};
              if (f.notes?.startsWith("append:")) f.notes = (dl.notes||"") + "\n" + f.notes.replace("append:","").trim();
              return {...dl, ...f};
            });
            const dName = (d.deals||[]).find(dl=>dl.id===op.data.id)?.name||"Deal";
            logs.push({icon:"Briefcase",color:"var(--purple)",text:`Updated deal: ${dName}`});
          } else if (op.action === "update_project" && op.data?.id) {
            d.projects = (d.projects||[]).map(p => {
              if (p.id !== op.data.id) return p;
              const f = {...op.data.fields};
              if (f.notes?.startsWith("append:")) f.notes = (p.notes||"") + "\n" + f.notes.replace("append:","").trim();
              return {...p, ...f};
            });
            const pName = (d.projects||[]).find(p=>p.id===op.data.id)?.name||"Project";
            logs.push({icon:"Target",color:"var(--blue)",text:`Updated project: ${pName}`});
          } else if (op.action === "create_contact" && op.data) {
            const c = { id: nextId(d.contacts||[]), score:50, tags:[], lastTouch:today(), ...op.data };
            d.contacts = [...(d.contacts||[]), c];
            logs.push({icon:"Users",color:"var(--green)",text:`Created contact: ${c.name}`});
          } else if (op.action === "log_event" && op.data) {
            const ev = { id: nextId(d.events||[]), ts: new Date().toISOString(), source:"voice_agent", ...op.data };
            d.events = [...(d.events||[]), ev];
            logs.push({icon:"FileText",color:"var(--text-sec)",text:`Logged event: ${op.data.description||op.data.event_type}`});
          }
        } catch(err) { logs.push({icon:"AlertCircle",color:"var(--red)",text:`Error: ${err.message}`}); }
      }
      d.voiceNotes = [{id:nextId(d.voiceNotes||[{id:0}]),transcript,ts:new Date().toLocaleTimeString(),summary:proposals.summary},...(d.voiceNotes||[])];
      return d;
    });
    setCommitted({ summary: proposals.summary, logs });
    setHistory(h => [{ transcript, summary: proposals.summary, count: ops.length, ts: new Date().toLocaleTimeString() }, ...h]);
    setProposals(null);
    setTranscript("");
    setCommitting(false);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const totalCount = proposals?.operations?.length || 0;
  const toggleAll = () => {
    const allOn = selectedCount === totalCount;
    const sel = {};
    (proposals?.operations||[]).forEach((_,i) => { sel[i] = !allOn; });
    setSelected(sel);
  };

  return (
    <div style={{ padding:24, maxWidth:720, display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Voice Agent</div>
        <div style={{ fontSize:11, color:"var(--text-dim)", fontFamily:"var(--font-m)" }}>Record → Review → Commit</div>
      </div>

      {/* Recording + Transcript */}
      <div className="card" style={{ padding:24, textAlign:"center" }}>
        <div onClick={recording?stop:start} style={{ width:80, height:80, borderRadius:"50%", background:recording?"var(--red-dim)":"var(--blue-dim)", border:`3px solid ${recording?"var(--red)":"var(--blue)"}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", cursor:"pointer", transition:"all .2s" }}>
          {recording?<MicOff size={28} color="var(--red)"/>:<Mic size={28} color="var(--blue)"/>}
        </div>
        <p style={{ fontSize:13, color:"var(--text-sec)", marginBottom:14 }}>{recording?<span className="blink" style={{color:"var(--red)"}}>Recording… tap to stop</span>:"Tap to record a note"}</p>
        <textarea className="input" placeholder='Example: "Had a great call with Dave Scott. He wants to expand the project to 3 more communities. Set up a follow-up meeting next week. Also need to send the SOW to Michael Torres by Friday."' value={transcript} onChange={e=>setTranscript(e.target.value)} style={{ marginBottom:14, minHeight:100 }}/>
        <button className="btn btn-blue" onClick={analyze} disabled={!transcript.trim()||loading} style={{ width:"100%", justifyContent:"center", padding:"11px 20px", fontSize:14, opacity:(!transcript.trim()||loading)?0.5:1 }}>
          {loading?<><Loader size={14} className="spin"/>Analyzing…</>:<><Sparkles size={14}/>Analyze</>}
        </button>
      </div>

      {/* Proposed Operations — select which to commit */}
      {proposals&&!committed&&<div className="card slide-in" style={{ padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <Sparkles size={16} color="var(--amber)"/>
            <span style={{ fontSize:14, fontWeight:600 }}>Proposed Operations</span>
            <span className="tag" style={{ background:"var(--amber-dim)", color:"var(--amber)" }}>{totalCount} found</span>
          </div>
          <button className="btn btn-ghost" onClick={toggleAll} style={{ padding:"4px 10px", fontSize:11 }}>
            {selectedCount===totalCount?"Deselect All":"Select All"}
          </button>
        </div>
        <p style={{ fontSize:13, lineHeight:1.6, marginBottom:16, color:"var(--text-sec)" }}>{proposals.summary}</p>

        {proposals.operations.length>0&&<div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
          {proposals.operations.map((op,i)=>{
            const desc = describeOp(op);
            const isOn = !!selected[i];
            return (
              <div key={i} onClick={()=>setSelected(s=>({...s,[i]:!s[i]}))} className="card-el" style={{ padding:"10px 13px", fontSize:13, display:"flex", gap:10, alignItems:"flex-start", cursor:"pointer", borderColor:isOn?"var(--blue)":"var(--border)", background:isOn?"rgba(0,119,204,0.03)":"var(--bg-el)", transition:"all .15s" }}>
                <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${isOn?"var(--blue)":"var(--border-hi)"}`, background:isOn?"var(--blue)":"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1, transition:"all .15s" }}>
                  {isOn&&<Check size={12} color="#fff"/>}
                </div>
                <div style={{ color:desc.color, marginTop:1 }}>{iconFor(desc.icon)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:500 }}>{desc.text}</div>
                  {desc.detail&&<div style={{ fontSize:11, color:"var(--text-dim)", marginTop:2 }}>{desc.detail}</div>}
                </div>
              </div>
            );
          })}
        </div>}

        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-blue" onClick={commitSelected} disabled={selectedCount===0||committing} style={{ flex:1, justifyContent:"center", padding:"10px 18px", fontSize:13, opacity:selectedCount===0?0.4:1 }}>
            {committing?<><Loader size={13} className="spin"/>Committing…</>:<><CheckCircle size={13}/>Commit {selectedCount} of {totalCount}</>}
          </button>
          <button className="btn btn-ghost" onClick={()=>{setProposals(null);setSelected({});}} style={{ padding:"10px 18px", fontSize:13 }}>
            Discard
          </button>
        </div>
      </div>}

      {/* Committed Results */}
      {committed&&<div className="card slide-in" style={{ padding:20 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:14 }}>
          <CheckCircle size={16} color="var(--green)"/>
          <span style={{ fontSize:14, fontWeight:600 }}>Committed to Database</span>
          <span className="tag" style={{ background:"var(--green-dim)", color:"var(--green)" }}>{committed.logs?.length||0} operations</span>
        </div>
        <p style={{ fontSize:13, lineHeight:1.6, marginBottom:16, color:"var(--text-sec)" }}>{committed.summary}</p>
        {committed.logs?.length>0&&<div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {committed.logs.map((l,i)=>(
            <div key={i} className="card-el" style={{ padding:"10px 13px", fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ color:l.color }}>{iconFor(l.icon)}</div>
              {l.text}
            </div>
          ))}
        </div>}
        <button className="btn btn-ghost" onClick={()=>setCommitted(null)} style={{ marginTop:12, fontSize:11 }}>Dismiss</button>
      </div>}

      {/* History */}
      {history.length>0&&<div>
        <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:8 }}>RECENT VOICE NOTES</div>
        {history.map((h,i)=>(
          <div key={i} className="card-el" style={{ padding:"10px 13px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>{h.summary}</div>
              <div style={{ fontSize:11, color:"var(--text-dim)" }}>{h.transcript.substring(0,80)}{h.transcript.length>80?"…":""}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
              <div className="tag" style={{ background:"var(--blue-dim)", color:"var(--blue)" }}>{h.count} ops</div>
              <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:3 }}>{h.ts}</div>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   INBOX — unified Gmail across all connected accounts
   Reads from public.emails (written by email-sync edge fn).
   Actions go through email-action edge fn (archive/trash/send).
   AI replies via llm-proxy (Gemini by default).
   Images stripped by default — banner offers explicit display.
──────────────────────────────────────────────────────── */
const INBOX_ACCOUNT_COLORS = ["var(--blue)","var(--purple)","var(--green)","var(--amber)","var(--red)"];
const INBOX_REPLY_PROVIDERS = [
  { id: "google",    label: "Gemini" },
  { id: "anthropic", label: "Claude" },
  { id: "openai",    label: "ChatGPT" },
];

function inboxStripImages(html) {
  if (!html) return { html: "", imgCount: 0 };
  let imgCount = 0;
  let out = html.replace(/<img\b[^>]*>/gi, () => { imgCount++; return ""; });
  // Neutralize CSS background-image URLs too
  out = out.replace(/background(-image)?:\s*url\([^)]*\)/gi, "background:none");
  return { html: out, imgCount };
}

const InboxView = ({ session }) => {
  const [accounts, setAccounts] = useState([]);
  const [acctColors, setAcctColors] = useState({});
  const [selectedAcct, setSelectedAcct] = useState(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [emails, setEmails] = useState([]); // lightweight list rows
  const [selectedThread, setSelectedThread] = useState(null); // { key, thread_id, account_id, emails: [full] }
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showHtml, setShowHtml] = useState(true);
  const [error, setError] = useState(null);
  const [showImagesFor, setShowImagesFor] = useState({});
  const [expandedMessages, setExpandedMessages] = useState({});

  // Reply composer state
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyProvider, setReplyProvider] = useState("google");
  const [replyFromAccount, setReplyFromAccount] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const loadAccounts = async () => {
    if (!supabase) return;
    const { data, error: e } = await supabase
      .from("email_accounts")
      .select("id, address, display_name, provider, is_active")
      .eq("is_active", true)
      .order("address");
    if (e) { setError(e.message); return; }
    const list = data || [];
    setAccounts(list);
    const colors = {};
    list.forEach((a, i) => { colors[a.id] = INBOX_ACCOUNT_COLORS[i % INBOX_ACCOUNT_COLORS.length]; });
    setAcctColors(colors);
  };

  const loadEmails = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    let q = supabase
      .from("emails")
      .select("id, account_id, provider_thread_id, from_addr, from_name, subject, snippet, received_at, is_read, direction, is_archived")
      .or("is_archived.is.null,is_archived.eq.false")
      .order("received_at", { ascending: false })
      .limit(400);
    if (selectedAcct) q = q.eq("account_id", selectedAcct);
    if (unreadOnly) q = q.eq("is_read", false);
    if (debounced.trim()) {
      const s = debounced.trim().replace(/[%_\\]/g, m => "\\" + m);
      q = q.or(`subject.ilike.%${s}%,from_addr.ilike.%${s}%,from_name.ilike.%${s}%,snippet.ilike.%${s}%`);
    }
    const { data, error: e } = await q;
    if (e) { setError(e.message); setLoading(false); return; }
    setEmails(data || []);
    setLoading(false);
  };

  // Group flat emails into threads by provider_thread_id
  const threads = useMemo(() => {
    const map = new Map();
    for (const e of emails) {
      const key = e.provider_thread_id ? `t:${e.account_id}:${e.provider_thread_id}` : `m:${e.id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          thread_id: e.provider_thread_id || null,
          account_id: e.account_id,
          emails: [],
          subject: e.subject,
          latest_at: e.received_at,
          latest_from_name: e.from_name,
          latest_from_addr: e.from_addr,
          latest_snippet: e.snippet,
          unread_count: 0,
        });
      }
      const t = map.get(key);
      t.emails.push(e);
      if (new Date(e.received_at) >= new Date(t.latest_at)) {
        t.latest_at = e.received_at;
        t.subject = e.subject;
        t.latest_from_name = e.from_name;
        t.latest_from_addr = e.from_addr;
        t.latest_snippet = e.snippet;
      }
      if (!e.is_read) t.unread_count++;
    }
    return [...map.values()].sort((a, b) => new Date(b.latest_at) - new Date(a.latest_at));
  }, [emails]);

  const openThread = async (thread) => {
    if (!supabase) return;
    setReplyOpen(false);
    setReplyBody("");
    setActionMsg(null);

    let fullEmails = [];
    if (thread.thread_id) {
      const { data, error: e } = await supabase
        .from("emails")
        .select("*")
        .eq("account_id", thread.account_id)
        .eq("provider_thread_id", thread.thread_id)
        .order("received_at", { ascending: true });
      if (e) { setError(e.message); return; }
      fullEmails = data || [];
    } else {
      const { data, error: e } = await supabase
        .from("emails")
        .select("*")
        .eq("id", thread.emails[0].id)
        .maybeSingle();
      if (e) { setError(e.message); return; }
      fullEmails = data ? [data] : [];
    }

    setSelectedThread({
      key: thread.key,
      thread_id: thread.thread_id,
      account_id: thread.account_id,
      emails: fullEmails,
    });

    // Default expanded: only the latest message (last in array since asc order)
    const expanded = {};
    if (fullEmails.length > 0) expanded[fullEmails[fullEmails.length - 1].id] = true;
    setExpandedMessages(expanded);

    const latest = fullEmails[fullEmails.length - 1];
    if (latest) {
      setReplyTo(latest.from_addr || "");
      const subj = (latest.subject || "").trim();
      setReplySubject(/^re:/i.test(subj) ? subj : (subj ? `Re: ${subj}` : "Re:"));
      setReplyFromAccount(latest.account_id || "");
    }

    // Mark unread messages in the thread as read
    const unreadIds = thread.emails.filter(e => !e.is_read).map(e => e.id);
    if (unreadIds.length > 0) {
      setEmails(es => es.map(e => unreadIds.includes(e.id) ? { ...e, is_read: true } : e));
      supabase.from("emails").update({ is_read: true }).in("id", unreadIds).then(() => {});
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" };
      await Promise.all([
        fetch(`${SUPA_URL}/functions/v1/email-sync`, { method: "POST", headers }),
        fetch(`${SUPA_URL}/functions/v1/calendar-sync?primary_only=true`, { method: "POST", headers }),
      ]);
    } catch (e) { setError(String(e)); }
    await loadAccounts();
    await loadEmails();
    setSyncing(false);
  };

  const callEmailAction = async (payload) => {
    const r = await fetch(`${SUPA_URL}/functions/v1/email-action`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
    return j;
  };

  // Archive/trash operate on a whole thread (Gmail semantics)
  const handleArchiveThread = async (thread) => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setError(null);
    try {
      const ids = thread.emails.map(e => e.id);
      for (const id of ids) {
        await callEmailAction({ action: "archive", message_id: id });
      }
      setEmails(es => es.filter(e => !ids.includes(e.id)));
      if (selectedThread?.key === thread.key) setSelectedThread(null);
      setActionMsg(ids.length > 1 ? `Archived ${ids.length} messages.` : "Archived.");
    } catch (e) { setError(String(e.message || e)); }
    setActionInProgress(false);
  };

  const handleTrashThread = async (thread) => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setError(null);
    try {
      const ids = thread.emails.map(e => e.id);
      for (const id of ids) {
        await callEmailAction({ action: "trash", message_id: id });
      }
      setEmails(es => es.filter(e => !ids.includes(e.id)));
      if (selectedThread?.key === thread.key) setSelectedThread(null);
      setActionMsg(ids.length > 1 ? `Moved ${ids.length} messages to Trash.` : "Moved to Trash.");
    } catch (e) { setError(String(e.message || e)); }
    setActionInProgress(false);
  };

  const generateReply = async () => {
    if (!selectedThread || !selectedThread.emails.length || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const latest = selectedThread.emails[selectedThread.emails.length - 1];
      const orig = (latest.body_text || latest.snippet || "").slice(0, 6000);
      const r = await fetch(`${SUPA_URL}/functions/v1/llm-proxy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: replyProvider,
          system: "You are drafting an email reply on behalf of the user. Write a concise, natural, professional response. Plain text only — no markdown, no salutation if obvious from context, no signature. Match the tone of the original.",
          messages: [{
            role: "user",
            content: `Original email:\nFrom: ${latest.from_name || ""} <${latest.from_addr || ""}>\nSubject: ${latest.subject || ""}\n\n${orig}\n\n---\nDraft a short reply:`,
          }],
          maxTokens: 600,
        }),
      });
      const j = await r.json();
      if (j.text) setReplyBody(j.text.trim());
      else if (j.error) setError(`AI: ${j.error}`);
    } catch (e) { setError(`AI: ${String(e.message || e)}`); }
    setGenerating(false);
  };

  const sendReply = async () => {
    if (!selectedThread || !selectedThread.emails.length || !replyBody.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const latest = selectedThread.emails[selectedThread.emails.length - 1];
      const sentFrom = accounts.find(a => a.id === replyFromAccount)?.address;
      await callEmailAction({
        action: "send",
        message_id: latest.id,
        to: replyTo,
        subject: replySubject,
        body: replyBody,
        from_account_id: replyFromAccount || undefined,
      });
      setActionMsg(`Reply sent${sentFrom ? ` from ${sentFrom}` : ""}.`);
      setReplyOpen(false);
      setReplyBody("");
    } catch (e) { setError(`Send failed: ${String(e.message || e)}`); }
    setSending(false);
  };

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { loadEmails(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedAcct, unreadOnly, debounced]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { triggerSync(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: "short", day: "numeric" });
    return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  };

  const fmtAddrs = (a) => Array.isArray(a) && a.length > 0
    ? a.map(x => x.name ? `${x.name} <${x.addr}>` : x.addr).join(", ")
    : null;

  // Render the From line in thread message header — robust against missing name/addr
  const renderFromLine = (from_name, from_addr) => {
    if (!from_name && !from_addr) return <em style={{ color: "var(--text-dim)" }}>(no sender)</em>;
    if (from_name && from_addr) return (<><strong>{from_name}</strong> <span style={{ color: "var(--text-sec)" }}>&lt;{from_addr}&gt;</span></>);
    if (from_name) return <strong>{from_name}</strong>;
    return <span>{from_addr}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", flexWrap: "wrap" }}>
        <div className="display" style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <Inbox size={18} color="var(--blue)" /> Inbox
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setSelectedAcct(null)} className="filter-chip"
            style={selectedAcct === null ? { background: "var(--blue-dim)", color: "var(--blue)", borderColor: "var(--blue)" } : {}}>
            All
          </button>
          {accounts.map(a => {
            const color = acctColors[a.id];
            const active = selectedAcct === a.id;
            return (
              <button key={a.id} onClick={() => setSelectedAcct(a.id)} className="filter-chip"
                style={{ background: active ? color : "var(--bg-card)", color: active ? "#fff" : "var(--text-sec)", borderColor: active ? color : "var(--border)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#fff" : color }} />
                {a.address}
              </button>
            );
          })}
        </div>
        <input className="input" placeholder="Search subject, sender, snippet…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 320, marginLeft: "auto" }} />
        <button className="btn btn-ghost" onClick={() => setUnreadOnly(u => !u)}
          style={unreadOnly ? { background: "var(--blue-dim)", color: "var(--blue)", borderColor: "var(--blue)" } : {}}>
          Unread
        </button>
        <button className="btn btn-blue" onClick={triggerSync} disabled={syncing}>
          {syncing ? <><Loader size={13} className="spin" /> Syncing…</> : <><RefreshCw size={13} /> Sync now</>}
        </button>
      </div>

      {error && (
        <div style={{ padding: "8px 24px", background: "var(--red-dim)", color: "var(--red)", fontSize: 12, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={13} /> {error}
          <button className="btn-icon" onClick={() => setError(null)} style={{ marginLeft: "auto" }}><X size={13} /></button>
        </div>
      )}
      {actionMsg && !error && (
        <div style={{ padding: "6px 24px", background: "var(--green-dim)", color: "var(--green)", fontSize: 12, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={13} /> {actionMsg}
          <button className="btn-icon" onClick={() => setActionMsg(null)} style={{ marginLeft: "auto" }}><X size={13} /></button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 460px) 1fr", flex: 1, overflow: "hidden" }}>
        {/* THREAD LIST */}
        <div style={{ borderRight: "1px solid var(--border)", overflowY: "auto", background: "var(--bg)" }}>
          {loading && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-sec)", fontSize: 13 }}>
              <Loader size={16} className="spin" /> Loading…
            </div>
          )}
          {!loading && threads.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-sec)", fontSize: 13 }}>No messages.</div>
          )}
          {!loading && threads.map(thread => {
            const color = acctColors[thread.account_id] || "var(--text-sec)";
            const isSel = selectedThread?.key === thread.key;
            const fromDisplay = thread.latest_from_name || thread.latest_from_addr || "(no sender)";
            const messageCount = thread.emails.length;
            const isUnread = thread.unread_count > 0;
            return (
              <div key={thread.key} className="row-hover" onClick={() => openThread(thread)}
                style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: isSel ? "var(--bg-card)" : "transparent", borderLeft: isSel ? `3px solid ${color}` : "3px solid transparent", transition: "background 0.1s", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: isUnread ? 700 : 500, color: isUnread ? "var(--text)" : "var(--text-sec)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    {fromDisplay}
                    {messageCount > 1 && (
                      <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 400, flexShrink: 0 }}>· {messageCount}</span>
                    )}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0 }}>{fmtTime(thread.latest_at)}</span>
                </div>
                <div style={{ fontSize: 13, marginTop: 3, color: isUnread ? "var(--text)" : "var(--text-sec)", fontWeight: isUnread ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {thread.subject || "(no subject)"}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 3 }}>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {thread.latest_snippet || ""}
                  </div>
                  <span className="row-actions" style={{ display: "flex", gap: 2, opacity: 0, transition: "opacity 0.15s", flexShrink: 0 }}>
                    <button className="btn-icon" title="Archive" disabled={actionInProgress}
                      onClick={(e) => { e.stopPropagation(); handleArchiveThread(thread); }}
                      style={{ width: 24, height: 24 }}>
                      <ArrowDown size={13} color="var(--text-sec)" />
                    </button>
                    <button className="btn-icon delete" title="Trash" disabled={actionInProgress}
                      onClick={(e) => { e.stopPropagation(); handleTrashThread(thread); }}
                      style={{ width: 24, height: 24 }}>
                      <Trash2 size={13} color="var(--text-sec)" />
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* DETAIL */}
        <div style={{ overflowY: "auto", padding: "20px 32px 32px", background: "var(--bg-card)" }}>
          {!selectedThread && (
            <div style={{ color: "var(--text-dim)", textAlign: "center", marginTop: "30vh", fontSize: 14 }}>
              Select a message to read
            </div>
          )}
          {selectedThread && selectedThread.emails.length > 0 && (() => {
            const acct = accounts.find(a => a.id === selectedThread.account_id);
            const acctLabel = acct ? acct.address : "?";
            const latestSubject = selectedThread.emails[selectedThread.emails.length - 1].subject || "(no subject)";
            const anyHasHtml = selectedThread.emails.some(e => e.body_html);
            return (
              <Fragment>
                {/* TOP ACTION BAR — Reply only (archive/trash live in the list) */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
                  <button className="btn btn-blue" onClick={() => setReplyOpen(o => !o)} disabled={actionInProgress}>
                    <Send size={13} /> Reply
                  </button>
                  {anyHasHtml && (
                    <button className="btn btn-ghost" style={{ marginLeft: "auto", fontSize: 11, padding: "4px 10px" }}
                      onClick={() => setShowHtml(h => !h)}>
                      {showHtml ? "Plain text" : "HTML"}
                    </button>
                  )}
                </div>

                {/* REPLY COMPOSER — AT THE TOP */}
                {replyOpen && (
                  <div className="card slide-in" style={{ marginBottom: 20, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <Send size={14} color="var(--blue)" />
                      <strong style={{ fontSize: 14 }}>Reply</strong>
                      <select className="filter-select" value={replyProvider} onChange={e => setReplyProvider(e.target.value)} style={{ marginLeft: "auto" }}>
                        {INBOX_REPLY_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                      <button className="btn btn-ghost" onClick={generateReply} disabled={generating}>
                        {generating ? <><Loader size={12} className="spin" /> Generating…</> : <><Sparkles size={12} /> Draft with AI</>}
                      </button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">From {accounts.length > 1 && <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>· {accounts.length} accounts</span>}</label>
                      {accounts.length === 0 ? (
                        <div className="input" style={{ color: "var(--text-dim)" }}>Loading accounts…</div>
                      ) : (
                        <select className="input" value={replyFromAccount || ""}
                          onChange={e => setReplyFromAccount(e.target.value)}
                          style={{ cursor: "pointer", appearance: "auto" }}>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.display_name ? `${a.display_name} (${a.address})` : a.address}
                            </option>
                          ))}
                        </select>
                      )}
                      {replyFromAccount && replyFromAccount !== selectedThread.account_id && (
                        <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 4 }}>
                          Sending from a different account — won&apos;t thread with the original conversation.
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">To</label>
                      <input className="input" value={replyTo} onChange={e => setReplyTo(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input className="input" value={replySubject} onChange={e => setReplySubject(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message</label>
                      <textarea className="input" value={replyBody} onChange={e => setReplyBody(e.target.value)} style={{ minHeight: 180, fontFamily: "var(--font-b)" }} placeholder="Type your reply, or click Draft with AI…" />
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost" onClick={() => { setReplyOpen(false); setReplyBody(""); }}>
                        Cancel
                      </button>
                      <button className="btn btn-blue" onClick={sendReply} disabled={sending || !replyBody.trim()}>
                        {sending ? <><Loader size={13} className="spin" /> Sending…</> : <><Send size={13} /> Send</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBJECT + thread meta */}
                <h2 style={{ fontSize: 20, color: "var(--text)", lineHeight: 1.3, fontWeight: 700, marginBottom: 8 }}>
                  {latestSubject}
                </h2>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                  In: {acctLabel}
                  {selectedThread.emails.length > 1 && ` · ${selectedThread.emails.length} messages in thread`}
                </div>

                {/* MESSAGES */}
                {selectedThread.emails.map((email, idx) => {
                  const isExpanded = !!expandedMessages[email.id];
                  const showImg = !!showImagesFor[email.id];
                  const stripped = email.body_html ? inboxStripImages(email.body_html) : { html: "", imgCount: 0 };
                  const dt = email.received_at ? new Date(email.received_at).toLocaleString() : "";
                  const toLine = fmtAddrs(email.to_addrs);
                  const ccLine = fmtAddrs(email.cc_addrs);
                  return (
                    <div key={email.id} className="card" style={{ marginBottom: 10, overflow: "hidden" }}>
                      {/* HEADER (always visible, clickable to toggle) */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", cursor: "pointer", background: isExpanded ? "var(--bg)" : "transparent" }}
                        onClick={() => setExpandedMessages(s => ({ ...s, [email.id]: !s[email.id] }))}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13 }}>
                            {renderFromLine(email.from_name, email.from_addr)}
                          </div>
                          {!isExpanded && email.snippet && (
                            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {email.snippet}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0, textAlign: "right" }}>
                          {dt}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "0 16px 16px" }}>
                          <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                            <div><span style={{ color: "var(--text-dim)" }}>To:</span> {toLine || acctLabel}</div>
                            {ccLine && <div style={{ marginTop: 3 }}><span style={{ color: "var(--text-dim)" }}>Cc:</span> {ccLine}</div>}
                          </div>

                          {showHtml && email.body_html && stripped.imgCount > 0 && !showImg && (
                            <div style={{ background: "var(--amber-dim)", border: "1px solid rgba(217,119,6,0.35)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 10 }}>
                              <Shield size={16} color="var(--amber)" />
                              <span style={{ flex: 1 }}>
                                <strong>{stripped.imgCount}</strong> image{stripped.imgCount > 1 ? "s" : ""} hidden. Loading them tells the sender you opened this email and may track you.
                              </span>
                              <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() => setShowImagesFor(s => ({ ...s, [email.id]: true }))}>
                                Display images
                              </button>
                            </div>
                          )}

                          <div style={{ color: "var(--text)", lineHeight: 1.7, fontSize: 14 }}>
                            {showHtml && email.body_html ? (
                              <iframe sandbox="allow-same-origin" srcDoc={showImg ? email.body_html : stripped.html}
                                style={{ width: "100%", minHeight: 400, border: "1px solid var(--border)", background: "#fff", borderRadius: 6 }} />
                            ) : (
                              <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", fontFamily: "var(--font-b)", fontSize: 14 }}>
                                {email.body_text || "(no plain text)"}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            );
          })()}
        </div>
      </div>
    </div>
  );
};


/* ────────────────────────────────────────────────────────
   GCAL — Google Calendar (bi-directional, week/day grid)
   Reads from public.calendar_events (written by calendar-sync).
   Writes via calendar-action edge fn → both Google + local row.
   CRM-link fields (contactId/companyId/projectId/dealId/invoiceId)
   stored locally only — Google Calendar has no equivalent.
──────────────────────────────────────────────────────── */
const GCAL_ACCOUNT_COLORS = ["var(--blue)","var(--purple)","var(--green)","var(--amber)","var(--red)"];

const gcalIsoToLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const gcalLocalToIsoOrDate = (localStr, allDay) => {
  if (!localStr) return null;
  if (allDay) return localStr.slice(0, 10);
  return new Date(localStr).toISOString();
};

const blankGCalEvent = (defaults = {}) => {
  const baseDate = defaults.date || today();
  const start = new Date(`${baseDate}T09:00:00`);
  const end   = new Date(`${baseDate}T10:00:00`);
  return {
    id:              null,
    account_id:      defaults.account_id || "",
    calendar_id:     defaults.calendar_id || null,
    summary:         "",
    description:     "",
    location:        "",
    all_day:         false,
    start_time:      gcalIsoToLocalInput(start.toISOString()),
    end_time:        gcalIsoToLocalInput(end.toISOString()),
    google_event_id: null,
    contactId:       "",
    companyId:       "",
    projectId:       "",
    dealId:          "",
    invoiceId:       "",
  };
};

const gcalDaysInWeek = (anchorYmd, mode = "week") => {
  // mode: "week" (Sun-Sat, 7 days), "workWeek" (Mon-Fri, 5 days), "day" (1 day)
  if (mode === "day") return [anchorYmd];
  const d = new Date(anchorYmd + "T12:00:00");
  const day = d.getDay();
  const start = new Date(d);
  if (mode === "workWeek") {
    // Anchor to Monday: if Sunday, jump forward to Mon; else back to Mon
    const offset = day === 0 ? 1 : 1 - day;
    start.setDate(d.getDate() + offset);
    return Array.from({ length: 5 }, (_, i) => {
      const x = new Date(start); x.setDate(start.getDate() + i);
      return x.toISOString().split("T")[0];
    });
  }
  // Full week — Sun to Sat
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start); x.setDate(start.getDate() + i);
    return x.toISOString().split("T")[0];
  });
};

const gcalDayKey = (iso) => {
  // Convert ISO timestamp to local YYYY-MM-DD for bucket matching
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const GCalView = ({ session, db, setDB }) => {
  const [accounts, setAccounts] = useState([]);
  const [acctColors, setAcctColors] = useState({});
  const [selectedAcct, setSelectedAcct] = useState(null);
  const [mode, setMode] = useState("day");           // "day" | "workWeek" | "week"
  const [date, setDate] = useState(today());          // YYYY-MM-DD anchor
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState(blankGCalEvent());
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const visibleDays = useMemo(() => gcalDaysInWeek(date, mode), [mode, date]);

  const loadAccounts = async () => {
    if (!supabase) return;
    const { data, error: e } = await supabase
      .from("email_accounts")
      .select("id, address, display_name, provider, is_active")
      .eq("is_active", true)
      .order("address");
    if (e) { setError(e.message); return; }
    const list = data || [];
    setAccounts(list);
    const colors = {};
    list.forEach((a, i) => { colors[a.id] = GCAL_ACCOUNT_COLORS[i % GCAL_ACCOUNT_COLORS.length]; });
    setAcctColors(colors);
  };

  const loadEvents = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const rangeStart = `${visibleDays[0]}T00:00:00`;
    const rangeEnd   = `${visibleDays[visibleDays.length - 1]}T23:59:59`;
    let q = supabase
      .from("calendar_events")
      .select("*")
      .gte("start_time", new Date(rangeStart).toISOString())
      .lte("start_time", new Date(rangeEnd).toISOString())
      .order("start_time", { ascending: true })
      .limit(500);
    if (selectedAcct) q = q.eq("account_id", selectedAcct);
    const { data, error: e } = await q;
    if (e) { setError(e.message); setLoading(false); return; }
    setEvents(data || []);
    setLoading(false);
  };

  const triggerSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await fetch(`${SUPA_URL}/functions/v1/calendar-sync?primary_only=true`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
      });
    } catch (e) { setError(String(e)); }
    await loadEvents();
    setSyncing(false);
  };

  const openEvent = (ev) => {
    setSelected(ev);
    setCreatingNew(false);
    setEditing(false);
    setDrawerOpen(true);
    setForm({
      id:              ev.id,
      account_id:      ev.account_id,
      calendar_id:     ev.calendar_id,
      summary:         ev.summary || "",
      description:     ev.description || "",
      location:        ev.location || "",
      all_day:         !!ev.all_day,
      start_time:      gcalIsoToLocalInput(ev.start_time),
      end_time:        gcalIsoToLocalInput(ev.end_time),
      google_event_id: ev.google_event_id,
      contactId:       ev.contact_id ? String(ev.contact_id) : "",
      companyId:       ev.company_id ? String(ev.company_id) : "",
      projectId:       ev.project_id ? String(ev.project_id) : "",
      dealId:          ev.deal_id ? String(ev.deal_id) : "",
      invoiceId:       ev.invoice_id ? String(ev.invoice_id) : "",
    });
  };

  const openNew = (dayStr) => {
    if (accounts.length === 0) { setError("No accounts connected."); return; }
    const defaultAcct = selectedAcct || accounts[0]?.id;
    const acct = accounts.find(a => a.id === defaultAcct) || accounts[0];
    setSelected(null);
    setCreatingNew(true);
    setEditing(true);
    setDrawerOpen(true);
    setForm(blankGCalEvent({ account_id: acct.id, calendar_id: acct.address, date: dayStr || date }));
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(false);
    setCreatingNew(false);
    setSelected(null);
  };

  const callCalendarAction = async (payload) => {
    const r = await fetch(`${SUPA_URL}/functions/v1/calendar-action`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
    return j;
  };

  // Persist CRM-link fields directly to the local row (Google has no equivalent)
  const persistCrmLinks = async (localId, links) => {
    if (!supabase) return;
    const update = {
      contact_id: links.contactId  ? Number(links.contactId)  : null,
      company_id: links.companyId  ? Number(links.companyId)  : null,
      project_id: links.projectId  ? Number(links.projectId)  : null,
      deal_id:    links.dealId     ? Number(links.dealId)     : null,
      invoice_id: links.invoiceId  ? Number(links.invoiceId)  : null,
    };
    await supabase.from("calendar_events").update(update).eq("id", localId);
  };

  const handleSave = async () => {
    if (!form.summary.trim()) { setError("Title is required."); return; }
    if (!form.start_time)     { setError("Start time is required."); return; }
    if (!form.end_time)       { setError("End time is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        action:      creatingNew ? "create" : "update",
        summary:     form.summary,
        description: form.description,
        location:    form.location,
        all_day:     form.all_day,
        start:       gcalLocalToIsoOrDate(form.start_time, form.all_day),
        end:         gcalLocalToIsoOrDate(form.end_time,   form.all_day),
        timeZone:    Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (creatingNew) {
        payload.account_id  = form.account_id;
        payload.calendar_id = form.calendar_id || (accounts.find(a => a.id === form.account_id)?.address);
      } else {
        payload.local_id = form.id;
      }
      const j = await callCalendarAction(payload);
      const updatedEvent = j.event;
      // Persist CRM links separately (Google doesn't store them)
      if (updatedEvent?.id) {
        await persistCrmLinks(updatedEvent.id, form);
        // Reflect into local copy
        updatedEvent.contact_id = form.contactId ? Number(form.contactId) : null;
        updatedEvent.company_id = form.companyId ? Number(form.companyId) : null;
        updatedEvent.project_id = form.projectId ? Number(form.projectId) : null;
        updatedEvent.deal_id    = form.dealId    ? Number(form.dealId)    : null;
        updatedEvent.invoice_id = form.invoiceId ? Number(form.invoiceId) : null;
      }
      setEvents(es => {
        if (creatingNew) return [updatedEvent, ...es].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        return es.map(e => e.id === updatedEvent.id ? updatedEvent : e);
      });
      setActionMsg(creatingNew ? "Event created in Google Calendar." : "Event updated in Google Calendar.");
      closeDrawer();
    } catch (e) { setError(`Save failed: ${String(e.message || e)}`); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!form.id) return;
    setDeleting(true);
    setError(null);
    try {
      await callCalendarAction({ action: "delete", local_id: form.id });
      setEvents(es => es.filter(e => e.id !== form.id));
      setActionMsg("Event deleted from Google Calendar.");
      closeDrawer();
    } catch (e) { setError(`Delete failed: ${String(e.message || e)}`); }
    setDeleting(false);
    setConfirm(null);
  };

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { loadEvents(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedAcct, date, mode]);
  // Auto-sync once when this view mounts
  useEffect(() => { triggerSync(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const eventsByDay = useMemo(() => {
    const buckets = {};
    for (const day of visibleDays) buckets[day] = [];
    for (const ev of events) {
      const k = gcalDayKey(ev.start_time);
      if (buckets[k]) buckets[k].push(ev);
    }
    return buckets;
  }, [events, visibleDays]);

  const todayCount = useMemo(() => events.filter(e => gcalDayKey(e.start_time) === today()).length, [events]);

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18, height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Calendar size={20} color="var(--blue)" />
          <div className="display" style={{ fontSize: 18, fontWeight: 700 }}>Google Calendar</div>
          {todayCount > 0 && <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>{todayCount} today</span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "var(--bg-el)", borderRadius: 8, padding: 3 }}>
            {[["day","Day"],["workWeek","Work week"],["week","Week"]].map(([v,lbl]) => (
              <button key={v} onClick={() => setMode(v)}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", background: mode === v ? "#fff" : "transparent", color: mode === v ? "var(--text)" : "var(--text-sec)", boxShadow: mode === v ? "var(--shadow)" : "none" }}>
                {lbl}
              </button>
            ))}
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" style={{ padding: "5px 8px", fontSize: 12, width: "auto" }} />
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setDate(today())}>Today</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={triggerSync} disabled={syncing}>
            {syncing ? <><Loader size={12} className="spin" /> Syncing…</> : <><RefreshCw size={12} /> Sync</>}
          </button>
          <button className="btn btn-blue" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => openNew(date)}><Plus size={12} /> Event</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setSelectedAcct(null)} className="filter-chip"
          style={selectedAcct === null ? { background: "var(--blue-dim)", color: "var(--blue)", borderColor: "var(--blue)" } : {}}>
          All
        </button>
        {accounts.map(a => {
          const color = acctColors[a.id];
          const active = selectedAcct === a.id;
          return (
            <button key={a.id} onClick={() => setSelectedAcct(a.id)} className="filter-chip"
              style={{ background: active ? color : "var(--bg-card)", color: active ? "#fff" : "var(--text-sec)", borderColor: active ? color : "var(--border)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#fff" : color }} />
              {a.address}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: "8px 14px", background: "var(--red-dim)", color: "var(--red)", fontSize: 12, borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={13} /> {error}
          <button className="btn-icon" onClick={() => setError(null)} style={{ marginLeft: "auto" }}><X size={13} /></button>
        </div>
      )}
      {actionMsg && !error && (
        <div style={{ padding: "6px 14px", background: "var(--green-dim)", color: "var(--green)", fontSize: 12, borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={13} /> {actionMsg}
          <button className="btn-icon" onClick={() => setActionMsg(null)} style={{ marginLeft: "auto" }}><X size={13} /></button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)`, gap: 10 }}>
          {visibleDays.map(dayStr => {
            const evts = eventsByDay[dayStr] || [];
            const d = new Date(dayStr + "T12:00:00");
            const isToday = dayStr === today();
            return (
              <div key={dayStr} className="card"
                style={{ padding: 14, minHeight: mode === "day" ? 500 : 340, display: "flex", flexDirection: "column", background: isToday ? "rgba(0,119,204,0.03)" : "var(--bg-card)", borderTop: isToday ? "3px solid var(--blue)" : "none" }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: isToday ? "var(--blue)" : "var(--text)", marginBottom: 10 }}>
                  {d.toLocaleDateString("en-US", { weekday: "short" })} {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  {loading && evts.length === 0 ? null : (
                    evts.length > 0 ? evts.map(ev => {
                      const color = acctColors[ev.account_id] || "var(--text-sec)";
                      return (
                        <div key={ev.id} className="card-el" style={{ padding: 8, borderLeft: `3px solid ${color}`, cursor: "pointer" }} onClick={() => openEvent(ev)}>
                          <div className="mono" style={{ fontSize: 10, fontWeight: 600, color }}>
                            {ev.all_day ? "All day" : `${fmtTime(ev.start_time)}–${fmtTime(ev.end_time)}`}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ev.summary || "(no title)"}
                          </div>
                          {ev.location && <div className="mono" style={{ fontSize: 9, color: "var(--text-sec)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {ev.location}</div>}
                          {ev.conference_link && <div className="mono" style={{ fontSize: 9, color: "var(--blue)", marginTop: 2 }}>🎥 join</div>}
                        </div>
                      );
                    }) : <div style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", marginTop: 40 }}>No events</div>
                  )}
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 10, width: "100%", marginTop: 8, justifyContent: "center" }} onClick={() => openNew(dayStr)}>+ Add</button>
              </div>
            );
          })}
        </div>
      </div>

      {drawerOpen && (
        <Drawer
          title={creatingNew ? "New Event" : (editing ? "Edit Event" : (form.summary || "(no title)"))}
          onClose={closeDrawer}
          onSave={editing ? handleSave : null}>
          {!editing && !creatingNew && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button className="btn btn-ghost" onClick={() => setEditing(true)}><Pencil size={13} /> Edit</button>
              <button className="btn btn-danger" onClick={() => setConfirm({ id: form.id, label: form.summary || "(no title)" })}><Trash2 size={13} /> Delete</button>
              {selected?.conference_link && (
                <a href={selected.conference_link} target="_blank" rel="noreferrer"
                  className="btn btn-blue" style={{ marginLeft: "auto", textDecoration: "none" }}>
                  <Mic size={13} /> Join
                </a>
              )}
            </div>
          )}
          {creatingNew && (
            <Field label="Account">
              <select className="input" value={form.account_id}
                onChange={e => {
                  const acct = accounts.find(a => a.id === e.target.value);
                  setForm(f => ({ ...f, account_id: e.target.value, calendar_id: acct?.address || null }));
                }}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.address}</option>)}
              </select>
            </Field>
          )}
          <Field label="Title">
            {editing ? (
              <Inp value={form.summary} onChange={v => setForm(f => ({ ...f, summary: v }))} />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{form.summary || "(no title)"}</div>
            )}
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label={`Start${form.all_day ? " (date)" : ""}`}>
              {editing ? (
                <Inp type={form.all_day ? "date" : "datetime-local"}
                  value={form.all_day ? form.start_time.slice(0, 10) : form.start_time}
                  onChange={v => setForm(f => ({ ...f, start_time: v }))} />
              ) : (
                <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                  {form.all_day ? form.start_time.slice(0, 10) : new Date(form.start_time).toLocaleString()}
                </div>
              )}
            </Field>
            <Field label={`End${form.all_day ? " (date)" : ""}`}>
              {editing ? (
                <Inp type={form.all_day ? "date" : "datetime-local"}
                  value={form.all_day ? form.end_time.slice(0, 10) : form.end_time}
                  onChange={v => setForm(f => ({ ...f, end_time: v }))} />
              ) : (
                <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                  {form.all_day ? form.end_time.slice(0, 10) : new Date(form.end_time).toLocaleString()}
                </div>
              )}
            </Field>
          </div>
          <Field label="All day">
            <input type="checkbox" checked={form.all_day} disabled={!editing}
              onChange={e => setForm(f => ({ ...f, all_day: e.target.checked }))}
              style={{ width: 16, height: 16 }} />
          </Field>
          <Field label="Location">
            {editing ? (
              <Inp value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-sec)" }}>{form.location || "—"}</div>
            )}
          </Field>
          <Field label="Description">
            {editing ? (
              <Tex value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-sec)", whiteSpace: "pre-wrap" }}>{form.description || "—"}</div>
            )}
          </Field>
          {db && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Person">
                <SearchSelect value={form.contactId} onChange={v => setForm(f => ({ ...f, contactId: v }))}
                  options={(db.contacts || []).map(c => ({ value: String(c.id), label: c.name }))}
                  placeholder="Search contacts…" />
              </Field>
              <Field label="Company">
                <SearchSelect value={form.companyId} onChange={v => setForm(f => ({ ...f, companyId: v }))}
                  options={(db.companies || []).map(c => ({ value: String(c.id), label: c.name }))}
                  placeholder="Search companies…" />
              </Field>
              <Field label="Project">
                <SearchSelect value={form.projectId} onChange={v => setForm(f => ({ ...f, projectId: v }))}
                  options={(db.projects || []).map(p => ({ value: String(p.id), label: p.name }))}
                  placeholder="Search projects…" />
              </Field>
              <Field label="Deal">
                <SearchSelect value={form.dealId} onChange={v => setForm(f => ({ ...f, dealId: v }))}
                  options={(db.deals || []).map(d => ({ value: String(d.id), label: d.name }))}
                  placeholder="Search deals…" />
              </Field>
              <Field label="Invoice">
                <SearchSelect value={form.invoiceId} onChange={v => setForm(f => ({ ...f, invoiceId: v }))}
                  options={(db.invoices || []).map(i => ({ value: String(i.id), label: `${i.number} — ${i.client}` }))}
                  placeholder="Search invoices…" />
              </Field>
            </div>
          )}
          {!creatingNew && selected?.conference_link && (
            <Field label="Conference link">
              <a href={selected.conference_link} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: "var(--blue)", wordBreak: "break-all" }}>
                {selected.conference_link}
              </a>
            </Field>
          )}
          {!creatingNew && Array.isArray(selected?.attendees) && selected.attendees.length > 0 && (
            <Field label="Attendees">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {selected.attendees.map((att, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--text-sec)" }}>
                    {att.email}{att.responseStatus ? ` · ${att.responseStatus}` : ""}
                  </div>
                ))}
              </div>
            </Field>
          )}
          {!editing && !creatingNew && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-m)" }}>
              Account: {accounts.find(a => a.id === form.account_id)?.address || "?"}
              {form.calendar_id && form.calendar_id !== accounts.find(a => a.id === form.account_id)?.address && ` · Calendar: ${form.calendar_id}`}
            </div>
          )}
        </Drawer>
      )}
      {confirm && <ConfirmDelete label={confirm.label} onConfirm={handleDelete} onCancel={() => setConfirm(null)} />}
      {(saving || deleting) && (
        <div className="confirm-overlay" style={{ background: "rgba(0,0,0,0.15)" }}>
          <div className="confirm-box" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Loader size={16} className="spin" /> {saving ? "Saving to Google…" : "Deleting…"}
          </div>
        </div>
      )}
    </div>
  );
};



/* ────────────────────────────────────────────────────────
   GOALS VIEW
──────────────────────────────────────────────────────── */
/* ────────────────────────────────────────────────────────
   PAYMENTS VIEW
──────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════
   MULTI-LLM VIEW  — fan-out to Anthropic, OpenAI, Google Gemini
   Paste this block into src/App.jsx anywhere after `supabase` is
   defined (a natural home is just above the `VoitraGateView`
   declaration, around line ~2490).
   Also wire it up in three places:
     1. lucide-react import  → add: MessageSquare, Send, Paperclip, Loader2
     2. NAV array            → add: {id:"multi_llm",icon:MessageSquare,label:"AI Playground"}
     3. VALID_VIEWS array    → push "multi_llm"
     4. VIEWS object         → multi_llm: <MultiLLMView session={session}/>
══════════════════════════════════════════════════════════════════ */

const LLM_PROXY_URL   = `${SUPA_URL}/functions/v1/llm-proxy`;
const LLM_PROVIDERS   = [
  { id:"anthropic", label:"Claude",  color:"var(--purple)" },
  { id:"openai",    label:"ChatGPT", color:"var(--green)"  },
  { id:"google",    label:"Gemini",  color:"var(--blue)"   },
];
const JUDGE_OPTIONS = [
  { value:"anthropic",  label:"Claude judges"    },
  { value:"openai",     label:"ChatGPT judges"   },
  { value:"google",     label:"Gemini judges"    },
  { value:"synthesize", label:"Claude synthesizes (merged answer)" },
  { value:"none",       label:"No judge (side-by-side only)" },
];
const JUDGE_SYSTEM_COMPARE = `You are a careful judge. Three AI assistants have answered the user's question independently. Your job:
1. In one paragraph, state which answer is strongest overall and why.
2. List each assistant's key strengths and any mistakes/weaknesses.
Keep it tight — no preamble, no conclusion.`;
const JUDGE_SYSTEM_SYNTH = `You are synthesizing the best single answer from three AI candidates. Take the strongest points from each, fix mistakes, and produce ONE clean answer to the user's prompt. Do not mention the candidates — just give the merged answer.`;

async function callLLMProxy({ provider, messages, system, model }) {
  // Always use the public anon key for the edge function call so a stale user
  // JWT can never cause a gateway 401. Provider keys live in function secrets.
  const started = Date.now();
  try {
    const r = await fetch(LLM_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${SUPA_KEY}`,
        "apikey":        SUPA_KEY,
      },
      body: JSON.stringify({ provider, messages, system, model }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d?.error || d?.message || `${provider} ${r.status}`);
    return { text: d.text || "", elapsed_ms: d.elapsed_ms ?? (Date.now() - started), error: null };
  } catch (e) {
    return { text: "", elapsed_ms: Date.now() - started, error: e.message || String(e) };
  }
}

// Build per-provider history: user messages + THIS provider's prior assistant replies
function buildHistory(messages, provider) {
  const out = [];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content, attachments: m.attachments_inline || [] });
    } else if (m.role === "assistant" && m.provider === provider) {
      out.push({ role: "assistant", content: m.content });
    }
  }
  return out;
}

// Read a File into { name, type, dataB64 }
function fileToInline(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload  = () => {
      const res = fr.result || "";
      const b64 = typeof res === "string" ? (res.split(",")[1] || "") : "";
      resolve({ name: file.name, type: file.type || "application/octet-stream", dataB64: b64 });
    };
    fr.readAsDataURL(file);
  });
}

const MultiLLMView = ({ session }) => {
  const [conversations, setConversations] = useState([]);
  const [activeId,      setActiveId]      = useState(null);
  const [messages,      setMessages]      = useState([]);   // turn-ordered; each has attachments_inline for the current session only
  const [prompt,        setPrompt]        = useState("");
  const [pendingFiles,  setPendingFiles]  = useState([]);   // File[] queued for the next send
  const [judge,         setJudge]         = useState("anthropic");
  const [busy,          setBusy]          = useState(false);
  const [renaming,      setRenaming]      = useState(null); // { id, title }
  const fileRef = useRef(null);
  const endRef  = useRef(null);

  // ── Load threads on mount
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from("llm_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      setConversations(data || []);
      if (data?.length && !activeId) setActiveId(data[0].id);
    })();
    // eslint-disable-next-line
  }, []);

  // ── Load messages when thread changes
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase
        .from("llm_messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("id", { ascending: true });
      setMessages((data || []).map(m => ({ ...m, attachments_inline: [] })));
    })();
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const newThread = async () => {
    const { data, error } = await supabase
      .from("llm_conversations")
      .insert({ title: "New conversation", judge })
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setConversations(c => [data, ...c]);
    setActiveId(data.id);
    setMessages([]);
  };

  const deleteThread = async (id) => {
    if (!window.confirm("Delete this conversation?")) return;
    await supabase.from("llm_conversations").delete().eq("id", id);
    setConversations(c => c.filter(x => x.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  };

  const renameThread = async (id, title) => {
    await supabase.from("llm_conversations").update({ title }).eq("id", id);
    setConversations(c => c.map(x => x.id === id ? { ...x, title } : x));
    setRenaming(null);
  };

  const send = async () => {
    if (busy) return;
    const text = prompt.trim();
    if (!text && pendingFiles.length === 0) return;

    // Ensure a thread exists
    let convId = activeId;
    if (!convId) {
      const { data } = await supabase
        .from("llm_conversations")
        .insert({ title: text.slice(0, 60) || "New conversation", judge })
        .select().single();
      convId = data.id;
      setConversations(c => [data, ...c]);
      setActiveId(convId);
    }

    // Convert attachments once, up-front
    const inline = [];
    for (const f of pendingFiles) { try { inline.push(await fileToInline(f)); } catch {} }

    const turn = (messages.at(-1)?.turn_index ?? 0) + 1;

    // Persist the user message
    const userRow = {
      conversation_id: convId, turn_index: turn, role: "user",
      provider: null, content: text,
      attachments: inline.map(a => ({ name: a.name, type: a.type })),
    };
    const { data: userSaved } = await supabase
      .from("llm_messages").insert(userRow).select().single();

    const optimistic = [...messages, { ...userSaved, attachments_inline: inline }];
    setMessages(optimistic);
    setPrompt("");
    setPendingFiles([]);
    setBusy(true);

    // Auto-title thread on first turn
    if (turn === 1 && text) {
      const title = text.slice(0, 60);
      await supabase.from("llm_conversations").update({ title }).eq("id", convId);
      setConversations(c => c.map(x => x.id === convId ? { ...x, title } : x));
    }

    // Fan out to all three providers in parallel
    const fanouts = await Promise.all(LLM_PROVIDERS.map(async (p) => {
      const history = buildHistory(optimistic, p.id);
      const res = await callLLMProxy({ provider: p.id, messages: history });
      const row = {
        conversation_id: convId, turn_index: turn, role: "assistant",
        provider: p.id, content: res.text,
        elapsed_ms: res.elapsed_ms, error: res.error,
      };
      const { data: saved } = await supabase
        .from("llm_messages").insert(row).select().single();
      return { ...saved, attachments_inline: [] };
    }));

    let updatedMessages = [...optimistic, ...fanouts];
    setMessages(updatedMessages);

    // Judge / Synthesize step
    if (judge !== "none") {
      const judgePrompt = [
        `User's question:\n${text}`,
        `\n\n--- Claude (anthropic) ---\n${fanouts.find(x=>x.provider==="anthropic")?.content || "(no response)"}`,
        `\n\n--- ChatGPT (openai) ---\n${fanouts.find(x=>x.provider==="openai")?.content || "(no response)"}`,
        `\n\n--- Gemini (google) ---\n${fanouts.find(x=>x.provider==="google")?.content || "(no response)"}`,
      ].join("");
      const judgeProvider = judge === "synthesize" ? "anthropic" : judge;
      const judgeSystem   = judge === "synthesize" ? JUDGE_SYSTEM_SYNTH : JUDGE_SYSTEM_COMPARE;
      const res = await callLLMProxy({
        provider: judgeProvider,
        messages: [{ role: "user", content: judgePrompt }],
        system: judgeSystem,
      });
      const row = {
        conversation_id: convId, turn_index: turn, role: "assistant",
        provider: "judge", model: `${judgeProvider}:${judge}`,
        content: res.text, elapsed_ms: res.elapsed_ms, error: res.error,
      };
      const { data: saved } = await supabase.from("llm_messages").insert(row).select().single();
      updatedMessages = [...updatedMessages, { ...saved, attachments_inline: [] }];
      setMessages(updatedMessages);
    }

    setBusy(false);
  };

  // ── Group messages by turn for rendering
  const turns = useMemo(() => {
    const groups = new Map();
    for (const m of messages) {
      if (!groups.has(m.turn_index)) groups.set(m.turn_index, { user: null, providers: {}, judge: null });
      const g = groups.get(m.turn_index);
      if (m.role === "user") g.user = m;
      else if (m.provider === "judge") g.judge = m;
      else g.providers[m.provider] = m;
    }
    return [...groups.entries()].sort((a,b) => a[0] - b[0]).map(([,g]) => g);
  }, [messages]);

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* ── Thread sidebar ── */}
      <div style={{ width:240, borderRight:"1px solid var(--border)", background:"var(--bg-card)", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)" }}>
          <button className="btn btn-blue" onClick={newThread} style={{ width:"100%", justifyContent:"center" }}>
            <Plus size={13}/> New conversation
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"6px" }}>
          {conversations.length === 0 && (
            <div style={{ padding:"14px 8px", fontSize:12, color:"var(--text-dim)" }}>No threads yet.</div>
          )}
          {conversations.map(c => (
            <div key={c.id}
              onClick={() => setActiveId(c.id)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 10px", borderRadius:7, cursor:"pointer",
                background: c.id === activeId ? "var(--blue-dim)" : "transparent",
                border:     c.id === activeId ? "1px solid rgba(0,119,204,0.2)" : "1px solid transparent",
                marginBottom:3,
              }}>
              <MessageSquare size={13} color={c.id === activeId ? "var(--blue)" : "var(--text-sec)"}/>
              {renaming?.id === c.id ? (
                <input className="input" value={renaming.title} autoFocus
                  onClick={e=>e.stopPropagation()}
                  onChange={e=>setRenaming({ ...renaming, title:e.target.value })}
                  onBlur={() => renameThread(c.id, renaming.title || c.title)}
                  onKeyDown={e=> e.key === "Enter" && renameThread(c.id, renaming.title || c.title)}
                  style={{ fontSize:12, padding:"2px 6px", flex:1 }}/>
              ) : (
                <span onDoubleClick={e=>{ e.stopPropagation(); setRenaming({ id:c.id, title:c.title });}}
                  style={{ flex:1, fontSize:12, color: c.id === activeId ? "var(--blue)" : "var(--text-sec)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {c.title}
                </span>
              )}
              <button className="btn-icon" title="Delete" onClick={e=>{ e.stopPropagation(); deleteThread(c.id); }}>
                <Trash2 size={11} color="var(--text-dim)"/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Conversation pane ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Scrollable transcript */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", background:"var(--bg)" }}>
          {turns.length === 0 && !busy && (
            <div style={{ textAlign:"center", marginTop:60, color:"var(--text-dim)" }}>
              <Sparkles size={32} style={{ opacity:0.4 }}/>
              <div style={{ fontFamily:"var(--font-d)", fontSize:17, marginTop:12, color:"var(--text-sec)" }}>
                Ask one prompt — get three answers.
              </div>
              <div style={{ fontSize:12, marginTop:6 }}>
                Each response is rendered side-by-side. A judge model picks the best or synthesizes.
              </div>
            </div>
          )}

          {turns.map((g, i) => (
            <div key={i} style={{ marginBottom:28 }}>
              {/* User bubble */}
              {g.user && (
                <div style={{
                  background:"var(--bg-card)", border:"1px solid var(--border)",
                  padding:"12px 14px", borderRadius:10, marginBottom:12, whiteSpace:"pre-wrap",
                  fontSize:13, lineHeight:1.55,
                }}>
                  <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginBottom:6 }}>YOU</div>
                  {g.user.content}
                  {(g.user.attachments || []).length > 0 && (
                    <div style={{ marginTop:8, display:"flex", gap:6, flexWrap:"wrap" }}>
                      {g.user.attachments.map((a,ai) => (
                        <span key={ai} className="mono" style={{ fontSize:10, background:"var(--bg-el)", padding:"2px 6px", borderRadius:4 }}>
                          📎 {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Provider column grid */}
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",
                gap:12,
              }}>
                {LLM_PROVIDERS.map(p => {
                  const m = g.providers[p.id];
                  return (
                    <div key={p.id} style={{
                      background:"var(--bg-card)", border:`1px solid ${p.color}33`,
                      borderRadius:10, padding:"12px 14px", fontSize:13, lineHeight:1.5,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <span className="mono" style={{ fontSize:10, color:p.color, fontWeight:600 }}>{p.label}</span>
                        {m?.elapsed_ms != null && (
                          <span className="mono" style={{ fontSize:9, color:"var(--text-dim)" }}>
                            {(m.elapsed_ms/1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      {m ? (
                        m.error
                          ? <div style={{ color:"var(--red)", fontSize:12 }}>⚠ {m.error}</div>
                          : <div style={{ whiteSpace:"pre-wrap" }}>{m.content || <em style={{ color:"var(--text-dim)" }}>(empty)</em>}</div>
                      ) : busy ? (
                        <div style={{ display:"flex", gap:6, alignItems:"center", color:"var(--text-dim)", fontSize:12 }}>
                          <Loader2 size={12} className="spin"/> thinking…
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Judge / synthesis */}
              {g.judge && (
                <div style={{
                  marginTop:12, background:"linear-gradient(135deg, var(--bg-card), rgba(124,58,237,0.04))",
                  border:"1px solid rgba(124,58,237,0.25)", borderRadius:10, padding:"12px 14px",
                  fontSize:13, lineHeight:1.55,
                }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <span className="mono" style={{ fontSize:10, color:"var(--purple)", fontWeight:600 }}>
                      ⚖ JUDGE · {g.judge.model || judge}
                    </span>
                    {g.judge.elapsed_ms != null && (
                      <span className="mono" style={{ fontSize:9, color:"var(--text-dim)" }}>
                        {(g.judge.elapsed_ms/1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  {g.judge.error
                    ? <div style={{ color:"var(--red)", fontSize:12 }}>⚠ {g.judge.error}</div>
                    : <div style={{ whiteSpace:"pre-wrap" }}>{g.judge.content}</div>}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef}/>
        </div>

        {/* ── Composer ── */}
        <div style={{ borderTop:"1px solid var(--border)", padding:"12px 16px", background:"var(--bg-card)" }}>
          {pendingFiles.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
              {pendingFiles.map((f, i) => (
                <span key={i} className="mono" style={{
                  fontSize:10, background:"var(--bg-el)", padding:"3px 8px", borderRadius:4,
                  display:"inline-flex", alignItems:"center", gap:6,
                }}>
                  📎 {f.name}
                  <button className="btn-icon" style={{ padding:0 }}
                    onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))}>
                    <X size={11} color="var(--text-dim)"/>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
            <input ref={fileRef} type="file" multiple style={{ display:"none" }}
              onChange={e => {
                const files = Array.from(e.target.files || []);
                setPendingFiles(p => [...p, ...files]);
                e.target.value = "";
              }}/>
            <button className="btn btn-ghost" title="Attach files" onClick={() => fileRef.current?.click()}
              style={{ padding:"8px 10px" }}>
              <Paperclip size={14}/>
            </button>
            <select className="input" value={judge} onChange={e=>setJudge(e.target.value)}
              style={{ width:180, fontSize:12 }}>
              {JUDGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <textarea
              className="input"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
              }}
              placeholder="Ask all three models…  (⌘+Enter to send)"
              style={{ flex:1, resize:"vertical", minHeight:42, maxHeight:220, fontSize:13, lineHeight:1.45 }}
            />
            <button className="btn btn-blue" onClick={send} disabled={busy}
              style={{ padding:"9px 14px" }}>
              {busy ? <Loader2 size={13} className="spin"/> : <Send size={13}/>}
              {busy ? "Running…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VOITRA_GATE_URL = "https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/voitra-gate";
const VOITRA_ADMIN_URL = "https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/voitra-admin";
const VOITRA_ADMIN_TOKEN = "vt-mendy-shomer-9f3k2m";

const VoitraGateView = () => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [err, setErr] = useState(null);

  const refresh = async () => {
    try {
      setErr(null);
      const r = await fetch(VOITRA_GATE_URL + "?_=" + Date.now());
      const d = await r.json();
      setState(d);
    } catch (e) {
      setErr("Couldn't reach gate: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  const act = async (action) => {
    setPending(action);
    try {
      await fetch(VOITRA_ADMIN_URL + "?t=" + encodeURIComponent(VOITRA_ADMIN_TOKEN) + "&do=" + action);
      await refresh();
    } catch (e) {
      setErr("Action failed: " + (e?.message || e));
    }
    setPending(null);
  };

  const fmtTime = (iso) => iso ? new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "America/Los_Angeles"
  }) + " PT" : null;

  const fmtHour = (h) => {
    const h12 = ((h + 11) % 12) + 1;
    return h12 + (h < 12 ? "am" : "pm");
  };

  const reasonLabel = {
    auto_open: "Open — following the schedule",
    auto_nightly: "Closed for the nightly window (11pm–6am PT)",
    auto_shabbat: "Closed for Shabbat",
    manual_on: "Forced ON (manual override)",
    manual_off: "Paused manually",
  };

  const enabled = state?.enabled;
  const statusColor = enabled ? "var(--green)" : "var(--red)";
  const statusBg = enabled ? "var(--green-dim)" : "var(--red-dim)";

  const pauseActions = [
    { do: "pause-30",      label: "Pause 30 minutes" },
    { do: "pause-60",      label: "Pause 1 hour" },
    { do: "pause-240",     label: "Pause 4 hours" },
    { do: "pause-morning", label: "Pause until 6am tomorrow" },
  ];
  const resumeActions = [
    { do: "resume",   label: "Resume auto schedule",            flavor: "go" },
    { do: "force-on", label: "Force ON (override Shabbat too)", flavor: "go-muted" },
  ];

  const buttonStyle = (flavor) => ({
    display: "block", width: "100%", textAlign: "left",
    padding: "12px 16px", marginBottom: 8,
    border: "1px solid",
    borderColor: flavor === "go"       ? "rgba(5,150,105,0.4)"
              : flavor === "go-muted"  ? "rgba(5,150,105,0.25)"
              :                          "rgba(220,38,38,0.4)",
    background:  flavor === "go"       ? "rgba(5,150,105,0.08)"
              : flavor === "go-muted"  ? "rgba(5,150,105,0.05)"
              :                          "rgba(220,38,38,0.08)",
    color: "var(--text)",
    borderRadius: 8,
    fontSize: 14, fontWeight: 600,
    cursor: pending ? "default" : "pointer",
    opacity: pending ? 0.55 : 1,
    transition: "background 0.15s",
  });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Voitra Agent Control</h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: 13 }}>
            Pause or resume the demo agents on voitra.ai/verticals
          </p>
        </div>
        <button onClick={refresh} disabled={loading}
          style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "var(--text-sec)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14}/>{loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {err && <div style={{ background: "var(--red-dim)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: 12, marginBottom: 16, color: "var(--red)", fontSize: 13 }}>
        {err}
      </div>}

      {!state ? <div style={{ color: "var(--text-dim)", fontSize: 13, padding: 32, textAlign: "center" }}>Loading status…</div> :
        <div style={{ padding: 22, borderRadius: 12, background: statusBg, border: "1px solid " + statusColor, marginBottom: 22 }}>
          <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 999, background: statusColor, color: "#fff", fontWeight: 700, fontSize: 11, letterSpacing: ".04em" }}>
            {enabled ? "AGENTS LIVE" : "AGENTS OFF"}
          </div>
          <div style={{ marginTop: 10, fontSize: 17, fontWeight: 600, color: "var(--text)" }}>
            {reasonLabel[state.reason] || state.reason}
          </div>
          {state.until && <div style={{ marginTop: 6, color: "var(--text-sec)", fontSize: 13 }}>
            Until: {fmtTime(state.until)}
          </div>}
        </div>
      }

      {state && <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-sec)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Automated schedule
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: 13.5, color: "var(--text)", alignItems: "baseline" }}>
          <div style={{ color: "var(--text-sec)" }}>This Shabbat</div>
          <div>
            {state.shabbat?.start && state.shabbat?.end ? (
              <>
                <span style={{ fontWeight: 600 }}>{fmtTime(state.shabbat.start)}</span>
                <span style={{ color: "var(--text-sec)" }}> → </span>
                <span style={{ fontWeight: 600 }}>{fmtTime(state.shabbat.end)}</span>
              </>
            ) : <span style={{ color: "var(--text-dim)" }}>(times unavailable — Hebcal unreachable)</span>}
          </div>
          <div style={{ color: "var(--text-sec)" }}>Every night</div>
          <div>
            <span style={{ fontWeight: 600 }}>{fmtHour(state.nightly?.start_hour ?? 23)}</span>
            <span style={{ color: "var(--text-sec)" }}> → </span>
            <span style={{ fontWeight: 600 }}>{fmtHour(state.nightly?.end_hour ?? 6)} next day</span>
          </div>
          <div style={{ color: "var(--text-sec)" }}>Timezone</div>
          <div style={{ fontWeight: 600 }}>{state.tz || "America/Los_Angeles"}</div>
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", color: "var(--text-dim)", fontSize: 12, lineHeight: 1.55 }}>
          Shabbat times pull live from Hebcal each week (Los Angeles, geonameid 5368361, candle-lighting 18 min before sunset, default Havdalah). Once Saturday's Havdalah passes, the schedule rolls forward to next Friday automatically — no manual update needed. Cached up to 6 hours.
        </div>
      </div>}

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-sec)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Pause for a while
        </h3>
        {pauseActions.map(a => (
          <button key={a.do} onClick={() => act(a.do)} disabled={!!pending} style={buttonStyle("pause")}>
            {pending === a.do ? "Saving…" : a.label}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-sec)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Resume
        </h3>
        {resumeActions.map(a => (
          <button key={a.do} onClick={() => act(a.do)} disabled={!!pending} style={buttonStyle(a.flavor)}>
            {pending === a.do ? "Saving…" : a.label}
          </button>
        ))}
      </div>

    </div>
  );
};

const PAYMENT_METHODS = ["check","wire","ach","card","cash","other"];
const blankPayment = () => ({ amount:0, date:today(), payer:"", payer_type:"company", method:"check", reference:"", notes:"", allocations:[] });
const PaymentsView = ({ db, setDB, navigate }) => {
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pd, setPD] = useState(blankPayment());
  const [filterMethod, setFilterMethod] = useState("all");
  const payments = useMemo(() => { let p = [...(db.payments || [])]; if (filterMethod !== "all") p = p.filter(x => x.method === filterMethod); return p.sort((a, b) => (b.date || "").localeCompare(a.date || "")); }, [db.payments, filterMethod]);
  const invoices = db.invoices || [];
  const totalReceived = (db.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
  const totalAllocated = (db.payment_allocations || []).reduce((s, a) => s + (a.amount || 0), 0);
  const unallocated = totalReceived - totalAllocated;
  const openInvoices = invoices.filter(inv => { const paid = (db.payment_allocations || []).filter(a => a.invoice_id === inv.id).reduce((s, a) => s + a.amount, 0); return inv.amount - paid > 0 && inv.status !== "cancelled"; });
  const savePayment = (d) => { const rec = { ...d, amount: parseInt(d.amount) || 0 }; const allocs = rec.allocations || []; delete rec.allocations; if (drawer.mode === "add") { const newId = nextId(db.payments || []); setDB(db => { const newAllocs = allocs.filter(a => a.amount > 0).map(a => ({ ...a, id: nextId([...(db.payment_allocations || []), ...allocs]), payment_id: newId })); return { ...db, payments: [...(db.payments || []), { ...rec, id: newId }], payment_allocations: [...(db.payment_allocations || []), ...newAllocs] }; }); } else { setDB(db => { const cleaned = (db.payment_allocations || []).filter(a => a.payment_id !== rec.id); const newAllocs = allocs.filter(a => a.amount > 0).map((a, i) => ({ id: nextId([...cleaned]), payment_id: rec.id, invoice_id: a.invoice_id, amount: parseInt(a.amount) || 0 })); return { ...db, payments: (db.payments || []).map(x => x.id === rec.id ? rec : x), payment_allocations: [...cleaned, ...newAllocs] }; }); } setDrawer(null); };
  const delPayment = (id) => { setDB(db => ({ ...db, payments: (db.payments || []).filter(x => x.id !== id), payment_allocations: (db.payment_allocations || []).filter(a => a.payment_id !== id) })); setConfirm(null); };
  const getAllocs = (pid) => (db.payment_allocations || []).filter(a => a.payment_id === pid);
  const getInvLabel = (iid) => { const inv = invoices.find(x => x.id === iid); return inv ? inv.number + " - " + inv.client : "Invoice #" + iid; };
  return (<div style={{padding:"2rem 2.5rem",maxWidth:1100,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
      <h2 style={{margin:0,fontSize:"1.5rem"}}>Payments</h2>
      <button onClick={()=>{setPD(blankPayment());setDrawer({mode:"add"})}} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"0.5rem 1.2rem",cursor:"pointer",fontWeight:600}}>+ Record Payment</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem",marginBottom:"1.5rem"}}>
      {[["Total Received","$"+(totalReceived/100).toLocaleString()],["Payments",(db.payments||[]).length],["Allocated","$"+(totalAllocated/100).toLocaleString()],["Unallocated","$"+(unallocated/100).toLocaleString()]].map(([l,v],i)=>(<div key={i} style={{background:"var(--card)",borderRadius:12,padding:"1rem 1.2rem",textAlign:"center"}}><div style={{fontSize:"1.5rem",fontWeight:700}}>{v}</div><div style={{fontSize:"0.85rem",color:"var(--text-sec)"}}>{l}</div></div>))}
    </div>
    <div style={{display:"flex",gap:"0.75rem",marginBottom:"1.5rem"}}>
      <select value={filterMethod} onChange={e=>setFilterMethod(e.target.value)} style={{padding:"0.4rem 0.8rem",borderRadius:8,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)"}}>
        <option value="all">All Methods</option>{PAYMENT_METHODS.map(m=>(<option key={m} value={m}>{m.toUpperCase()}</option>))}
      </select>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
      {payments.length===0&&<div style={{textAlign:"center",padding:"3rem",color:"var(--text-sec)"}}>No payments recorded yet.</div>}
      {payments.map(p=>{const allocs=getAllocs(p.id);return(<div key={p.id} className="row-hover" onClick={()=>navigate("record",{type:"payment",id:p.id})} style={{background:"var(--card)",borderRadius:12,padding:"1rem 1.2rem",border:"1px solid var(--border)",cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.4rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <span style={{fontWeight:700,fontSize:"1.1rem",color:"var(--green)"}}>{"$"+(p.amount/100).toLocaleString()}</span>
            <span style={{fontWeight:600}}>{p.payer}</span>
            <span style={{fontSize:"0.75rem",padding:"2px 8px",borderRadius:20,background:"var(--blue)22",color:"var(--blue)",fontWeight:600}}>{p.method}</span>
          </div>
          <div style={{display:"flex",gap:"0.5rem"}}>
            <button onClick={(e)=>{e.stopPropagation();setPD({...p,allocations:allocs.map(a=>({invoice_id:a.invoice_id,amount:a.amount}))});setDrawer({mode:"edit"})}} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:6,padding:"0.3rem 0.7rem",cursor:"pointer",fontSize:"0.8rem",color:"var(--text)"}}>Edit</button>
            <button onClick={(e)=>{e.stopPropagation();setConfirm(p)}} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:6,padding:"0.3rem 0.7rem",cursor:"pointer",fontSize:"0.8rem",color:"var(--red,#e53e3e)"}}>Del</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"1rem",fontSize:"0.78rem",color:"var(--text-dim)",flexWrap:"wrap"}}>
          <span>Date: {p.date}</span>
          {p.reference&&<span>Ref: {p.reference}</span>}
          {allocs.length>0&&<span>Applied to: {allocs.map(a=>getInvLabel(a.invoice_id)+" ($"+(a.amount/100).toLocaleString()+")").join(", ")}</span>}
          {p.notes&&<span>Notes: {p.notes.substring(0,60)}{p.notes.length>60?"...":""}</span>}
        </div>
      </div>)})}
    </div>
    {drawer&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",justifyContent:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)setDrawer(null)}}>
      <div style={{width:480,maxWidth:"90vw",background:"var(--card)",height:"100%",overflowY:"auto",padding:"1.5rem",boxShadow:"-4px 0 24px rgba(0,0,0,0.2)"}}>
        <h3 style={{marginTop:0}}>{drawer.mode==="add"?"Record Payment":"Edit Payment"}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
            <label>Amount (cents)<input type="number" value={pd.amount} onChange={e=>setPD({...pd,amount:e.target.value})} style={{width:"100%",padding:"0.4rem",borderRadius:6,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",marginTop:4}} /></label>
            <label>Date<input type="date" value={pd.date} onChange={e=>setPD({...pd,date:e.target.value})} style={{width:"100%",padding:"0.4rem",borderRadius:6,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",marginTop:4}} /></label>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
            <label>Payer<input value={pd.payer} onChange={e=>setPD({...pd,payer:e.target.value})} style={{width:"100%",padding:"0.4rem",borderRadius:6,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",marginTop:4}} /></label>
            <label>Method<select value={pd.method} onChange={e=>setPD({...pd,method:e.target.value})} style={{width:"100%",padding:"0.4rem",borderRadius:6,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",marginTop:4}}>{PAYMENT_METHODS.map(m=>(<option key={m} value={m}>{m.toUpperCase()}</option>))}</select></label>
          </div>
          <label>Reference #<input value={pd.reference} onChange={e=>setPD({...pd,reference:e.target.value})} style={{width:"100%",padding:"0.4rem",borderRadius:6,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",marginTop:4}} /></label>
          <label>Notes<textarea value={pd.notes} onChange={e=>setPD({...pd,notes:e.target.value})} rows={2} style={{width:"100%",padding:"0.4rem",borderRadius:6,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",marginTop:4,resize:"vertical"}} /></label>
          {drawer.mode==="edit"&&pd.id&&<AssociatedDocumentsPanel db={db} setDB={setDB} entityType="payment" entityId={pd.id}/>}
          <div style={{borderTop:"1px solid var(--border)",paddingTop:"0.75rem",marginTop:"0.25rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"}}>
              <strong style={{fontSize:"0.9rem"}}>Apply to Invoices</strong>
              <button onClick={()=>setPD({...pd,allocations:[...(pd.allocations||[]),{invoice_id:openInvoices[0]?.id||0,amount:0}]})} style={{background:"none",border:"1px solid var(--border)",borderRadius:6,padding:"2px 10px",cursor:"pointer",fontSize:"0.8rem",color:"var(--accent)"}}>+ Add</button>
            </div>
            {(pd.allocations||[]).map((a,ai)=>(<div key={ai} style={{display:"flex",gap:"0.5rem",alignItems:"center",marginBottom:"0.4rem"}}>
              <select value={a.invoice_id} onChange={e=>{const allocs=[...pd.allocations];allocs[ai]={...allocs[ai],invoice_id:parseInt(e.target.value)};setPD({...pd,allocations:allocs})}} style={{flex:2,padding:"0.35rem",borderRadius:6,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:"0.82rem"}}>
                <option value={0}>Select invoice...</option>{invoices.map(inv=>(<option key={inv.id} value={inv.id}>{inv.number} - {inv.client} ({"$"+(inv.amount/100).toLocaleString()})</option>))}
              </select>
              <input type="number" placeholder="Amount" value={a.amount} onChange={e=>{const allocs=[...pd.allocations];allocs[ai]={...allocs[ai],amount:parseInt(e.target.value)||0};setPD({...pd,allocations:allocs})}} style={{flex:1,padding:"0.35rem",borderRadius:6,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:"0.82rem"}} />
              <button onClick={()=>{const allocs=[...pd.allocations];allocs.splice(ai,1);setPD({...pd,allocations:allocs})}} style={{background:"none",border:"none",color:"var(--red,#e53e3e)",cursor:"pointer",fontSize:"1rem"}}>x</button>
            </div>))}
            {(pd.allocations||[]).length>0&&<div style={{fontSize:"0.8rem",color:"var(--text-dim)",marginTop:4}}>Total allocated: {"$"+((pd.allocations||[]).reduce((s,a)=>s+(parseInt(a.amount)||0),0)/100).toLocaleString()} of {"$"+((parseInt(pd.amount)||0)/100).toLocaleString()}</div>}
          </div>
          <div style={{display:"flex",gap:"0.75rem",marginTop:"0.5rem"}}>
            <button onClick={()=>savePayment(pd)} style={{flex:1,padding:"0.5rem",background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>Save</button>
            <button onClick={()=>setDrawer(null)} style={{flex:1,padding:"0.5rem",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",color:"var(--text)"}}>Cancel</button>
          </div>
        </div>
      </div>
    </div>}
    {confirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setConfirm(null)}}>
      <div style={{background:"var(--card)",borderRadius:12,padding:"1.5rem",maxWidth:400,width:"90%"}}>
        <h3 style={{marginTop:0}}>Delete Payment?</h3>
        <p>Delete payment of <strong>{"$"+(confirm.amount/100).toLocaleString()}</strong> from <strong>{confirm.payer}</strong>? This will also remove all invoice allocations.</p>
        <div style={{display:"flex",gap:"0.75rem"}}>
          <button onClick={()=>delPayment(confirm.id)} style={{flex:1,padding:"0.5rem",background:"var(--red,#e53e3e)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>Delete</button>
          <button onClick={()=>setConfirm(null)} style={{flex:1,padding:"0.5rem",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",color:"var(--text)"}}>Cancel</button>
        </div>
      </div>
    </div>}
  </div>);
};

/* ────────────────────────────────────────────────────────
   DOCUMENTS VIEW
──────────────────────────────────────────────────────── */
const DocumentsView = ({ db, setDB, navigate }) => {
  const [drawer, setDrawer] = useState(null);
  const [doc, setDoc] = useState(blankDocument());
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const drawerFileInputRef = useRef(null);

  const docs = (db.documents || []).filter(d => {
    const q = query.toLowerCase();
    const matchesSearch = !q || [d.title, d.file_name, d.description, d.url].some(v => (v || "").toLowerCase().includes(q))
      || (d.associations || []).some(a => getDocEntityLabel(db, a).toLowerCase().includes(q));
    const matchesType = filterType === "all" || (d.associations || []).some(a => a.type === filterType);
    return matchesSearch && matchesType;
  }).sort((a,b) => (b.id || 0) - (a.id || 0));

  const saveDoc = () => {
    if (!doc.title && !doc.file_name && !doc.url) return;
    const rec = { ...doc, title:doc.title || doc.file_name || (doc.kind === "link" ? doc.url : "Untitled document"), associations:doc.associations || [] };
    setDB(prev => drawer === "add"
      ? { ...prev, documents:[{ ...rec, id:nextId(prev.documents || []) }, ...(prev.documents || [])] }
      : { ...prev, documents:(prev.documents || []).map(d => d.id === rec.id ? rec : d) }
    );
    setDrawer(null);
  };
  const delDoc = async (d) => {
    if (d.storage_path) await supabase.storage.from("memory-files").remove([d.storage_path]);
    setDB(prev => ({ ...prev, documents:(prev.documents || []).filter(x => x.id !== d.id) }));
    setDrawer(null);
  };
  const uploadDocs = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        try {
          uploaded.push({ ...blankDocument(), ...(await uploadDocumentFile(file)) });
        } catch (error) { console.error("Upload error:", error); }
      }
      if (uploaded.length) setDB(prev => { let id = nextId(prev.documents || []); return { ...prev, documents:[...uploaded.map(d => ({ ...d, id:id++ })), ...(prev.documents || [])] }; });
    } catch (err) { console.error("Document upload failed:", err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const attachFileToDraft = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadDocumentFile(file);
      setDoc(p => ({ ...p, ...uploaded, title:p.title || uploaded.title }));
    } catch (err) { console.error("Document upload failed:", err); }
    setUploading(false);
    if (drawerFileInputRef.current) drawerFileInputRef.current.value = "";
  };

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div className="display" style={{ fontSize:18, fontWeight:700 }}>Documents</div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginTop:2 }}>{(db.documents || []).length} shared repository item{(db.documents || []).length === 1 ? "" : "s"}</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={uploadDocs}/>
          <button className="btn btn-ghost" disabled={uploading} onClick={() => fileInputRef.current?.click()}>{uploading ? <><Loader size={13} className="spin"/>Uploading...</> : <><Upload size={13}/>Upload Attachments</>}</button>
          <button className="btn btn-blue" onClick={() => { setDoc(blankDocument()); setDrawer("add"); }}><Plus size={13}/>New Document</button>
        </div>
      </div>
      <div className="card" style={{ padding:"10px 14px" }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:9 }}/>
            <input className="input" placeholder="Search documents and associations..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft:30 }}/>
          </div>
          <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">All associations</option>
            {DOCUMENT_ENTITY_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
          <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{docs.length} shown</span>
        </div>
      </div>
      {docs.length === 0 ? (
        <div className="card" style={{ padding:42, textAlign:"center" }}>
          <FileText size={34} color="var(--text-dim)" style={{ marginBottom:12 }}/>
          <div style={{ fontSize:14, color:"var(--text-sec)" }}>No documents found</div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-dim)", marginTop:4 }}>Upload or create a document, then associate it anywhere in the system.</div>
          <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginTop:8 }}>Supports attachments like PDF, images, markdown, HTML, ZIP, Office files, text, CSV, and links.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} className="row-hover" onClick={()=>navigate("record",{type:"document",id:d.id})} style={{ borderBottom:"1px solid var(--border)", cursor:"pointer" }}>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {(d.file_name || d.storage_path) ? <Paperclip size={14} color="var(--blue)"/> : <ExternalLink size={14} color="var(--blue)"/>}
                      <a href={d.url || "#"} target={d.url ? "_blank" : undefined} rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ fontWeight:600, color:d.url ? "var(--blue)" : "var(--text)", textDecoration:"none" }}>{d.title || d.file_name || "Untitled document"}</a>
                    </div>
                    <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:3 }}>{getDocKindLabel(d)}{d.file_name ? ` · ${d.file_name}` : ""}{d.file_size ? ` · ${formatDocSize(d.file_size)}` : ""}</div>
                    {d.description && <div style={{ fontSize:12, color:"var(--text-sec)", marginTop:5, lineHeight:1.4 }}>{d.description}</div>}
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {(d.associations || []).length === 0 ? <span className="mono" style={{ fontSize:10, color:"var(--text-dim)" }}>Unassociated</span> : (d.associations || []).map(a => (
                        <EntityLink key={docAssociationKey(a)} type={a.type} id={a.id} db={db} navigate={navigate}/>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px", textAlign:"right", width:70 }}>
                    <button className="btn-icon" title="Edit document" onClick={(e) => { e.stopPropagation(); setDoc({ ...d, associations:d.associations || [] }); setDrawer("edit"); }}><Pencil size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {drawer && <Drawer title={drawer === "add" ? "New Document" : "Edit Document"} onClose={() => setDrawer(null)} onSave={saveDoc}>
        <Field label="Title"><Inp value={doc.title || ""} onChange={v => setDoc(p => ({ ...p, title:v }))} placeholder="Document title"/></Field>
        <Field label="Description"><Tex value={doc.description || ""} onChange={v => setDoc(p => ({ ...p, description:v }))} placeholder="Purpose, contents, or notes"/></Field>
        <Field label="Attachment">
          <input ref={drawerFileInputRef} type="file" style={{ display:"none" }} onChange={attachFileToDraft}/>
          <button type="button" className="btn btn-ghost" disabled={uploading} onClick={() => drawerFileInputRef.current?.click()}>
            {uploading ? <><Loader size={13} className="spin"/>Uploading...</> : <><Paperclip size={13}/>Upload attachment</>}
          </button>
          <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginTop:6 }}>PDF, image, markdown, HTML, ZIP, Office files, text, CSV, and other file types.</div>
          {doc.file_name && <div className="card-el" style={{ padding:"8px 10px", marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
            <Paperclip size={13} color="var(--blue)"/>
            <span style={{ flex:1, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.file_name}</span>
            <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{formatDocSize(doc.file_size)}</span>
          </div>}
        </Field>
        <Field label="Link"><Inp value={doc.kind === "link" || !doc.file_name ? (doc.url || "") : ""} onChange={v => setDoc(p => ({ ...p, url:v, kind:v ? "link" : p.kind, file_name:v ? "" : p.file_name, file_type:v ? "" : p.file_type, file_size:v ? 0 : p.file_size, storage_path:v ? "" : p.storage_path }))} placeholder="https://..."/></Field>
        <Field label="Associations"><DocumentAssociationEditor db={db} value={doc.associations || []} onChange={v => setDoc(p => ({ ...p, associations:v }))}/></Field>
        {drawer === "edit" && <button className="btn btn-danger" style={{ marginTop:14 }} onClick={() => delDoc(doc)}><Trash2 size={13}/>Delete Document</button>}
      </Drawer>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   AI MEMORIES VIEW
──────────────────────────────────────────────────────── */
const MEMORY_TYPES = ["general","preference","feedback","context","decision","relationship","insight"];
const AI_SYSTEMS = ["claude","chatgpt","gemini","copilot","other"];
const blankMemory = () => ({ subject:"", ai_system:"claude", memory_summary:"", memory_type:"general", source_context:"", companyId:"", contactId:"", dealId:"", projectId:"", strategyId:"" });

const AIMemoriesView = ({ db, setDB, navigate }) => {
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [md, setMd] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [filterSystem, setFilterSystem] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const typeColors = { general:"var(--blue)", preference:"var(--purple)", feedback:"var(--amber)", context:"var(--green)", decision:"var(--red)", relationship:"var(--pink)", insight:"var(--teal)" };
  const systemIcons = { claude:"\u2728", chatgpt:"\ud83e\udd16", gemini:"\ud83d\udc8e", copilot:"\u2708\ufe0f", other:"\ud83d\udccc" };
  const AI_SYSTEMS = ["claude","chatgpt","gemini","copilot","other"];
  const MEMORY_TYPES = ["general","preference","feedback","context","decision","relationship","insight"];

  const items = (db.ai_memories||[]).filter(m => {
    if (filterType !== "all" && m.memory_type !== filterType) return false;
    if (filterSystem !== "all" && m.ai_system !== filterSystem) return false;
    if (search) { const s = search.toLowerCase(); return (m.subject||"").toLowerCase().includes(s) || (m.memory_summary||"").toLowerCase().includes(s) || (m.source_context||"").toLowerCase().includes(s); }
    return true;
  }).sort((a,b) => (b.id||0)-(a.id||0));

  const save = () => {
    if (!md.subject) return;
    setDB(prev => {
      const mem = prev.ai_memories || [];
      if (drawer === "add") {
        const id = Math.max(0, ...mem.map(x=>x.id||0)) + 1;
        return { ...prev, ai_memories: [{ ...md, id, created_at: new Date().toISOString(), files: md.files||[] }, ...mem] };
      }
      return { ...prev, ai_memories: mem.map(x => x.id === md.id ? { ...md } : x) };
    });
    setDrawer(null);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        const { data, error } = await supabase.storage.from('memory-files').upload(path, file);
        if (error) { console.error('Upload error:', error); continue; }
        const { data: urlData } = supabase.storage.from('memory-files').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size, path });
      }
      setMd(p => ({ ...p, files: [...(p.files||[]), ...uploaded] }));
    } catch(err) { console.error('Upload failed:', err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = async (fileObj) => {
    await supabase.storage.from('memory-files').remove([fileObj.path]);
    setMd(p => ({ ...p, files: (p.files||[]).filter(f => f.path !== fileObj.path) }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1048576).toFixed(1) + ' MB';
  };

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Brain size={18} color="var(--purple)"/>
          <span style={{ fontFamily:"var(--font-d)", fontSize:18, fontWeight:700 }}>AI Memories</span>
          <span className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginLeft:4 }}>{items.length}</span>
        </div>
        <button className="btn btn-primary" onClick={() => { setMd({ subject:"", memory_summary:"", ai_system:"claude", memory_type:"general", source_context:"", companyId:null, contactId:null, dealId:null, projectId:null, strategyId:null, files:[] }); setDrawer("add"); }}><Plus size={13}/> New Memory</button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-dim)" }}/>
          <input className="input" placeholder="Search memories..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:32, width:"100%" }}/>
        </div>
        <select className="input" value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ width:140 }}>
          <option value="all">All Types</option>
          {MEMORY_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
        <select className="input" value={filterSystem} onChange={e=>setFilterSystem(e.target.value)} style={{ width:140 }}>
          <option value="all">All Systems</option>
          {AI_SYSTEMS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ padding:40, textAlign:"center" }}>
          <Brain size={32} color="var(--text-dim)" style={{ marginBottom:12 }}/>
          <div style={{ fontSize:14, color:"var(--text-sec)" }}>No memories found</div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-dim)", marginTop:4 }}>Create your first AI memory to get started</div>
        </div>
      ) : (
        <div className="card" style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)", background:"var(--bg-sec)" }}>
                <th style={{ textAlign:"left", padding:"10px 14px", fontFamily:"var(--font-d)", fontSize:11, fontWeight:600, color:"var(--text-sec)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Title</th>
                <th style={{ textAlign:"left", padding:"10px 14px", fontFamily:"var(--font-d)", fontSize:11, fontWeight:600, color:"var(--text-sec)", textTransform:"uppercase", letterSpacing:"0.5px", width:100 }}>Type</th>
                <th style={{ textAlign:"left", padding:"10px 14px", fontFamily:"var(--font-d)", fontSize:11, fontWeight:600, color:"var(--text-sec)", textTransform:"uppercase", letterSpacing:"0.5px", width:100 }}>System</th>
                <th style={{ textAlign:"left", padding:"10px 14px", fontFamily:"var(--font-d)", fontSize:11, fontWeight:600, color:"var(--text-sec)", textTransform:"uppercase", letterSpacing:"0.5px", width:90 }}>Date</th>
                <th style={{ textAlign:"center", padding:"10px 14px", fontFamily:"var(--font-d)", fontSize:11, fontWeight:600, color:"var(--text-sec)", textTransform:"uppercase", letterSpacing:"0.5px", width:100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <Fragment key={m.id}>
                  <tr onClick={()=>navigate("record",{type:"ai_memory",id:m.id})} style={{ borderBottom: expandedId===m.id ? "none" : "1px solid var(--border)", cursor:"pointer", transition:"background 0.15s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-sec)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ fontWeight:600, fontSize:13, lineHeight:1.4 }}>{m.subject || "Untitled Memory"}</div>
                      {(m.files||[]).length > 0 && <span className="mono" style={{ fontSize:10, color:"var(--text-dim)", display:"flex", alignItems:"center", gap:3, marginTop:2 }}><Paperclip size={10}/> {(m.files||[]).length} file{(m.files||[]).length>1?"s":""}</span>}
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background: (typeColors[m.memory_type]||"var(--text-dim)")+"20", color: typeColors[m.memory_type]||"var(--text-dim)", fontWeight:500 }}>{m.memory_type}</span>
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{systemIcons[m.ai_system]||""} {m.ai_system}</span>
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{m.created_at ? new Date(m.created_at).toLocaleDateString() : "\u2014"}</span>
                    </td>
                    <td style={{ padding:"12px 14px", textAlign:"center" }}>
                      <div style={{ display:"flex", gap:4, justifyContent:"center" }}>
                        <button className="btn btn-sm" title="Expand / Collapse" onClick={(e)=>{e.stopPropagation();setExpandedId(expandedId===m.id?null:m.id)}} style={{ padding:"4px 6px" }}>
                          {expandedId===m.id ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                        </button>
                        <button className="btn btn-sm" title="Copy prompt / summary" onClick={(e)=>{e.stopPropagation();copyToClipboard(m.memory_summary||"",m.id)}} style={{ padding:"4px 6px", color: copiedId===m.id?"var(--green)":"inherit" }}>
                          {copiedId===m.id ? <Check size={13}/> : <Copy size={13}/>}
                        </button>
                        <button className="btn btn-sm" title="Edit" onClick={(e)=>{e.stopPropagation();setMd({...m});setDrawer("edit")}} style={{ padding:"4px 6px" }}>
                          <Pencil size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId===m.id && (
                    <tr style={{ borderBottom:"1px solid var(--border)" }}>
                      <td colSpan={5} style={{ padding:"0 14px 14px 14px", background:"var(--bg-sec)" }}>
                        <div style={{ padding:14, borderRadius:8, background:"var(--bg)", border:"1px solid var(--border)", marginTop:4 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                            <span className="mono" style={{ fontSize:10, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Summary / Prompt</span>
                            <button className="btn btn-sm" onClick={(e)=>{e.stopPropagation();copyToClipboard(m.memory_summary||"",m.id)}} style={{ fontSize:10, padding:"2px 8px", gap:4 }}>
                              {copiedId===m.id ? <><Check size={10}/> Copied</> : <><Copy size={10}/> Copy</>}
                            </button>
                          </div>
                          <div style={{ fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap", color:"var(--text)" }}>{m.memory_summary || "No summary"}</div>
                          {m.source_context && <div className="mono" style={{ fontSize:11, color:"var(--text-dim)", marginTop:10, paddingTop:8, borderTop:"1px solid var(--border)" }}>Source: {m.source_context}</div>}
                          {(m.files||[]).length > 0 && (
                            <div style={{ marginTop:10, paddingTop:8, borderTop:"1px solid var(--border)" }}>
                              <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginBottom:6, textTransform:"uppercase" }}>Attached Files</div>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                                {(m.files||[]).map((f,i) => (
                                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:6, background:"var(--bg-sec)", border:"1px solid var(--border)", fontSize:11, color:"var(--blue)", textDecoration:"none" }}>
                                    <FileText size={12}/> {f.name}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="ai_memory" entityId={m.id}/>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirm!==null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={()=>setConfirm(null)}>
          <div className="card" style={{ padding:24, maxWidth:380 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Delete this memory?</div>
            <div style={{ fontSize:13, color:"var(--text-sec)", marginBottom:20 }}>This action cannot be undone.</div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button className="btn" onClick={()=>setConfirm(null)}>Cancel</button>
              <button className="btn" style={{ background:"var(--red)", color:"#fff" }} onClick={()=>{setDB(p=>({...p,ai_memories:(p.ai_memories||[]).filter(x=>x.id!==confirm)}));setConfirm(null)}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {drawer && <Drawer title={drawer==="add"?"New AI Memory":"Edit AI Memory"} onClose={()=>setDrawer(null)} onSave={save}>
        <Field label="Subject"><Inp value={md.subject||""} onChange={v=>setMd(p=>({...p,subject:v}))} placeholder="e.g. Brand voice guidelines"/></Field>
        <Field label="Memory Summary / Prompt">
          <textarea className="input" rows={6} value={md.memory_summary||""} onChange={e=>setMd(p=>({...p,memory_summary:e.target.value}))} placeholder="The AI detail, prompt, or context to remember..." style={{ width:"100%", resize:"vertical", fontFamily:"inherit", fontSize:13, lineHeight:1.6 }}/>
        </Field>
        <Field label="AI System"><Sel value={md.ai_system||"claude"} onChange={v=>setMd(p=>({...p,ai_system:v}))} options={AI_SYSTEMS}/></Field>
        <Field label="Memory Type"><Sel value={md.memory_type||"general"} onChange={v=>setMd(p=>({...p,memory_type:v}))} options={MEMORY_TYPES}/></Field>
        <Field label="Source / Context"><Inp value={md.source_context||""} onChange={v=>setMd(p=>({...p,source_context:v}))} placeholder="Where this memory came from"/></Field>
        <Field label="Contact"><Sel value={md.contactId||""} onChange={v=>setMd(p=>({...p,contactId:v||null}))} options={[{value:"",label:"None"},...(db.contacts||[]).map(c=>({value:c.id,label:c.name}))]}/></Field>
        <Field label="Company"><Sel value={md.companyId||""} onChange={v=>setMd(p=>({...p,companyId:v||null}))} options={[{value:"",label:"None"},...(db.companies||[]).map(c=>({value:c.id,label:c.name}))]}/></Field>
        <Field label="Deal"><Sel value={md.dealId||""} onChange={v=>setMd(p=>({...p,dealId:v||null}))} options={[{value:"",label:"None"},...(db.deals||[]).map(c=>({value:c.id,label:c.name}))]}/></Field>
        <Field label="Project"><Sel value={md.projectId||""} onChange={v=>setMd(p=>({...p,projectId:v||null}))} options={[{value:"",label:"None"},...(db.projects||[]).map(c=>({value:c.id,label:c.name}))]}/></Field>
        <Field label="Strategy"><Sel value={md.strategyId||""} onChange={v=>setMd(p=>({...p,strategyId:v||null}))} options={[{value:"",label:"None"},...(db.strategies||[]).map(c=>({value:c.id,label:c.name||c.title}))]}/></Field>

        <div style={{ marginTop:14, borderTop:"1px solid var(--border)", paddingTop:14 }}>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8, textTransform:"uppercase" }}>Attached Files</div>
          {(md.files||[]).length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
              {(md.files||[]).map((f,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:6, background:"var(--bg-sec)", border:"1px solid var(--border)" }}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--blue)", textDecoration:"none", overflow:"hidden" }}>
                    <FileText size={13}/> <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                    <span className="mono" style={{ fontSize:10, color:"var(--text-dim)", flexShrink:0 }}>{f.size ? '('+formatSize(f.size)+')' : ''}</span>
                  </a>
                  <button className="btn btn-sm" style={{ padding:"2px 6px", color:"var(--red)" }} onClick={()=>removeFile(f)} title="Remove file"><X size={12}/></button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={handleFileUpload}/>
          <button className="btn btn-sm" onClick={()=>fileInputRef.current?.click()} disabled={uploading} style={{ fontSize:12, gap:6 }}>
            {uploading ? <><Loader size={12} className="spin"/> Uploading...</> : <><Upload size={12}/> Upload Files</>}
          </button>
        </div>

        {drawer==="edit" && (
          <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid var(--border)" }}>
            <button className="btn btn-sm" style={{ color:"var(--red)", fontSize:11 }} onClick={()=>{setDrawer(null);setConfirm(md.id)}}><Trash2 size={12}/> Delete Memory</button>
          </div>
        )}
      </Drawer>}
    </div>
  );
}
const blankStrategy = () => ({ name:"", description:"", goalId:"", status:"active", priority:"medium", notes:"", links:[], files:[] });
const StrategiesView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [sd, setSD] = useState(blankStrategy());
  const [editStrategy, setEditStrategy] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const strategies = (db.strategies || []);
  const goals = (db.goals || []);

  useEffect(() => {
    if (focus?.type === "strategy" && focus.id) { setStatusFilter("all"); setSel(focus.id); setFocus(null); }
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const s = strategies.find(x => x.id === sel);
      if (s) setEditStrategy({...s, goalId: String(s.goalId || ""), links: s.links || [], files: s.files || []});
    } else setEditStrategy(null);
  }, [sel, db.strategies]);

  const filtered = strategies.filter(s => {
    if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });
  const strategy = sel ? strategies.find(x => x.id === sel) : null;
  const strategyGoal = strategy && strategy.goalId ? goals.find(g => g.id === strategy.goalId) : null;
  const linkedProjects = strategy ? (db.projects || []).filter(p => p.strategyId === strategy.id) : [];

  const saveInline = () => {
    if (!editStrategy) return;
    const rec = {...editStrategy, goalId: parseInt(editStrategy.goalId) || null, links: editStrategy.links || [], files: editStrategy.files || []};
    setDB(d => ({...d, strategies: d.strategies.map(x => x.id === rec.id ? rec : x)}));
  };

  const inlineFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = 'strategies/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        const { error } = await supabase.storage.from('memory-files').upload(path, file);
        if (error) continue;
        const { data: urlData } = supabase.storage.from('memory-files').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size, path });
      }
      setEditStrategy(p => ({ ...p, files: [...(p.files||[]), ...uploaded] }));
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };
  const removeInlineFile = async (fileObj) => {
    if (fileObj.path) await supabase.storage.from('memory-files').remove([fileObj.path]);
    setEditStrategy(p => ({ ...p, files: (p.files||[]).filter(f => f.path !== fileObj.path) }));
  };

  const saveStrategy = (d) => {
    const rec = { ...d, goalId: parseInt(d.goalId) || null, links: d.links || [], files: d.files || [] };
    if (drawer.mode === "add") setDB(db => ({ ...db, strategies: [...(db.strategies || []), { ...rec, id: nextId(db.strategies || []) }] }));
    else setDB(db => ({ ...db, strategies: (db.strategies || []).map(x => x.id === rec.id ? rec : x) }));
    setDrawer(null);
  };
  const delStrategy = (id) => { setDB(db => ({ ...db, strategies: (db.strategies || []).filter(x => x.id !== id) })); setConfirm(null); };

  const handleStrategyFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = 'strategies/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        const { error } = await supabase.storage.from('memory-files').upload(path, file);
        if (error) { console.error('Upload error:', error); continue; }
        const { data: urlData } = supabase.storage.from('memory-files').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size, path });
      }
      setSD(p => ({ ...p, files: [...(p.files||[]), ...uploaded] }));
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeStrategyFile = async (fileObj) => {
    if (fileObj.path) await supabase.storage.from('memory-files').remove([fileObj.path]);
    setSD(p => ({ ...p, files: (p.files||[]).filter(f => f.path !== fileObj.path) }));
  };

  const formatStrategyFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1048576).toFixed(1) + ' MB';
  };

  const statusColor = (s) => ({ active: "var(--green)", completed: "var(--blue)", paused: "var(--amber)", cancelled: "var(--text-dim)" }[s] || "var(--text-sec)");
  const formatStrategyFileSizeOld = (bytes) => { if (!bytes) return ''; if (bytes < 1024) return bytes + ' B'; if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB'; return (bytes/1048576).toFixed(1) + ' MB'; };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Strategies</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setSD(blankStrategy());setDrawer({mode:"add"});}}><Plus size={12}/>Add</button>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
            {["all","active","completed","paused","cancelled"].map(s=>(
              <button key={s} className={`filter-chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(s=>(
            <div key={s.id} className="row-hover" onClick={()=>navigate("record",{type:"strategy",id:s.id})}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===s.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{s.priority}</div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                <Tag label={s.status}/>
                <RowActions onEdit={()=>navigate("record",{type:"strategy",id:s.id})} onDelete={()=>setConfirm({id:s.id,label:s.name})}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(strategy && editStrategy) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("strategies");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to strategies</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{strategy.name}</div>
                {strategyGoal && <div style={{ color:"var(--purple)", fontSize:12, marginTop:2 }}>Goal: <EntityLink type="goal" id={strategyGoal.id} navigate={navigate}>{strategyGoal.name}</EntityLink></div>}
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={strategy.priority}/><Tag label={strategy.status}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:strategy.id,label:strategy.name})}><Trash2 size={12}/></button>
              </div>
            </div>

            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Strategy Name"><Inp value={editStrategy.name} onChange={v=>setEditStrategy(p=>({...p,name:v}))}/></Field>
              <Field label="Description"><Tex value={editStrategy.description||""} onChange={v=>setEditStrategy(p=>({...p,description:v}))}/></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Goal"><Sel value={editStrategy.goalId||""} onChange={v=>setEditStrategy(p=>({...p,goalId:v}))} options={[{value:"",label:"None"}, ...goals.map(g=>({value:String(g.id),label:g.name}))]}/></Field>
                <Field label="Status"><Sel value={editStrategy.status} onChange={v=>setEditStrategy(p=>({...p,status:v}))} options={["active","completed","paused","cancelled"]}/></Field>
                <Field label="Priority"><Sel value={editStrategy.priority} onChange={v=>setEditStrategy(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
              </div>
              <Field label="Notes"><Tex value={editStrategy.notes||""} onChange={v=>setEditStrategy(p=>({...p,notes:v}))}/></Field>

              {/* Links */}
              <div style={{ marginTop:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--text-sec)" }}>Links</span>
                  <button type="button" className="btn btn-ghost" style={{ fontSize:11, padding:"3px 8px" }} onClick={()=>setEditStrategy(p=>({...p,links:[...(p.links||[]),{url:"",label:"",desc:""}]}))}>+ Add Link</button>
                </div>
                {(editStrategy.links||[]).map((lnk, li) => (<div key={li} style={{ display:"flex", gap:6, marginBottom:8 }}>
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                    <input className="input" placeholder="Label" value={lnk.label||""} onChange={e=>{const links=[...editStrategy.links];links[li]={...links[li],label:e.target.value};setEditStrategy(p=>({...p,links}));}} style={{ padding:"6px 8px", fontSize:12 }}/>
                    <input className="input" placeholder="https://..." value={lnk.url||""} onChange={e=>{const links=[...editStrategy.links];links[li]={...links[li],url:e.target.value};setEditStrategy(p=>({...p,links}));}} style={{ padding:"6px 8px", fontSize:12 }}/>
                  </div>
                  <button type="button" onClick={()=>setEditStrategy(p=>({...p,links:p.links.filter((_,i)=>i!==li)}))} style={{ background:"none", border:"none", color:"var(--red)", cursor:"pointer" }}><X size={14}/></button>
                </div>))}
              </div>

              {/* Files */}
              <div style={{ marginTop:14, borderTop:"1px solid var(--border)", paddingTop:14 }}>
                <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>ATTACHED FILES</div>
                {(editStrategy.files||[]).map((f, fi) => (
                  <div key={fi} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:6, background:"var(--bg-el)", border:"1px solid var(--border)", marginBottom:4 }}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--blue)", textDecoration:"none", overflow:"hidden" }}>
                      <FileText size={13}/><span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                      <span className="mono" style={{ fontSize:10, color:"var(--text-dim)" }}>{f.size?'('+formatStrategyFileSizeOld(f.size)+')':''}</span>
                    </a>
                    <button onClick={()=>removeInlineFile(f)} style={{ background:"none", border:"none", color:"var(--red)", cursor:"pointer" }}><X size={12}/></button>
                  </div>
                ))}
                <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={inlineFileUpload}/>
                <button className="btn btn-ghost" onClick={()=>fileInputRef.current?.click()} disabled={uploading} style={{ fontSize:12, marginTop:6 }}>
                  {uploading ? <><Loader size={12} className="spin"/>Uploading…</> : <><Upload size={12}/>Upload Files</>}
                </button>
              </div>
            </div>

            {/* Linked Projects */}
            <div className="card-el" style={{ padding:14, marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>LINKED PROJECTS ({linkedProjects.length})</div>
              {linkedProjects.length > 0 ? linkedProjects.map(p=>(
                <div key={p.id} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                  <Briefcase size={12} color="var(--text-sec)"/>
                  <span style={{ fontSize:12, flex:1 }}><EntityLink type="project" id={p.id} navigate={navigate}>{p.name}</EntityLink></span>
                  <Tag label={p.status}/>
                  <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{p.progress}%</span>
                </div>
              )) : <div style={{ fontSize:12, color:"var(--text-dim)" }}>No projects linked. Link via project edit form.</div>}
            </div>

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="strategy" entityId={strategy.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Target size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a strategy</p>
          </div>
        )}
      </div>

      {drawer?.mode==="add" && <Drawer title="New Strategy" onClose={() => setDrawer(null)} onSave={() => saveStrategy(sd)}>
        <Field label="Strategy Name"><Inp value={sd.name} onChange={v => setSD(p => ({ ...p, name: v }))} /></Field>
        <Field label="Description"><Tex value={sd.description} onChange={v => setSD(p => ({ ...p, description: v }))} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Goal"><Sel value={sd.goalId || ""} onChange={v => setSD(p => ({ ...p, goalId: v }))} options={[{ value: "", label: "None" }, ...goals.map(g => ({ value: String(g.id), label: g.name }))]} /></Field>
          <Field label="Status"><Sel value={sd.status} onChange={v => setSD(p => ({ ...p, status: v }))} options={["active", "completed", "paused", "cancelled"]} /></Field>
          <Field label="Priority"><Sel value={sd.priority} onChange={v => setSD(p => ({ ...p, priority: v }))} options={["critical", "high", "medium", "low"]} /></Field>
        </div>
        <Field label="Notes"><Tex value={sd.notes} onChange={v => setSD(p => ({ ...p, notes: v }))} /></Field>
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-sec)" }}>Links</span>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => setSD(p => ({ ...p, links: [...(p.links || []), { url: "", label: "", desc: "" }] }))}>+ Add Link</button>
          </div>
          {(sd.links || []).map((lnk, li) => (<div key={li} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <input className="input" placeholder="Label" value={lnk.label} onChange={e => { const links = [...(sd.links || [])]; links[li] = { ...links[li], label: e.target.value }; setSD(p => ({ ...p, links })); }} style={{ padding: "6px 8px", fontSize: 12 }} />
              <input className="input" placeholder="https://..." value={lnk.url} onChange={e => { const links = [...(sd.links || [])]; links[li] = { ...links[li], url: e.target.value }; setSD(p => ({ ...p, links })); }} style={{ padding: "6px 8px", fontSize: 12 }} />
              <input className="input" placeholder="Short description" value={lnk.desc || ""} onChange={e => { const links = [...(sd.links || [])]; links[li] = { ...links[li], desc: e.target.value }; setSD(p => ({ ...p, links })); }} style={{ padding: "6px 8px", fontSize: 12 }} />
            </div>
            <button type="button" onClick={() => setSD(p => ({ ...p, links: (p.links || []).filter((_, i) => i !== li) }))} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: 4, marginTop: 2 }}><X size={14} /></button>
          </div>))}
        </div>
        <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase" }}>Attached Files</div>
          {(sd.files || []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {(sd.files || []).map((f, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6, background: "var(--bg-sec)", border: "1px solid var(--border)" }}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--blue)", textDecoration: "none", overflow: "hidden" }}>
                    <FileText size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>{f.size ? '(' + formatStrategyFileSize(f.size) + ')' : ''}</span>
                  </a>
                  <button className="btn btn-sm" style={{ padding: "2px 6px", color: "var(--red)" }} onClick={() => removeStrategyFile(f)} title="Remove file"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleStrategyFileUpload} />
          <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ fontSize: 12, gap: 6 }}>
            {uploading ? <><Loader size={12} className="spin" /> Uploading...</> : <><Upload size={12} /> Upload Files</>}
          </button>
        </div>
      </Drawer>}
      {confirm && <ConfirmDelete label={confirm.label} onConfirm={() => delStrategy(confirm.id)} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

const GOAL_STATUSES = ["active","completed","paused","cancelled"];
const GOAL_CATEGORIES = ["professional","personal"];
const blankGoal = () => ({ name:"", description:"", category:"professional", status:"active", target_value:0, current_value:0, unit:"", period:"annual", start_date:today(), end_date:"", priority_order:0, notes:"" });
const GoalsView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [gd, setGD] = useState(blankGoal());
  const [editGoal, setEditGoal] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    if (focus?.type === "goal" && focus.id) { setStatusFilter("all"); setSel(focus.id); setFocus(null); }
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const g = (db.goals || []).find(x => x.id === sel);
      if (g) setEditGoal({...g, target_value: String(g.target_value||0), current_value: String(g.current_value||0), priority_order: String(g.priority_order||0)});
    } else setEditGoal(null);
  }, [sel, db.goals]);

  const filtered = (db.goals || []).filter(g => {
    if (query && !g.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));
  const goal = sel ? (db.goals || []).find(g => g.id === sel) : null;
  const goalStrategies = goal ? (db.strategies || []).filter(s => s.goalId === goal.id) : [];

  const saveInline = () => {
    if (!editGoal) return;
    const rec = {...editGoal, target_value: parseInt(editGoal.target_value)||0, current_value: parseInt(editGoal.current_value)||0, priority_order: parseInt(editGoal.priority_order)||0};
    setDB(d => ({...d, goals: (d.goals || []).map(x => x.id === rec.id ? rec : x)}));
  };
  const saveGoal = (data) => { const rec = {...data, target_value: parseInt(data.target_value)||0, current_value: parseInt(data.current_value)||0, priority_order: parseInt(data.priority_order)||0}; if (drawer.mode === "add") setDB(d => ({...d, goals: [...(d.goals || []), {...rec, id: nextId(d.goals || [])}]})); else setDB(d => ({...d, goals: (d.goals || []).map(x => x.id === rec.id ? rec : x)})); setDrawer(null); };
  const delGoal = (id) => { setDB(d => ({...d, goals: (d.goals || []).filter(x => x.id !== id)})); if (sel === id) setSel(null); setConfirm(null); };
  const pctOf = (g) => g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;

  return (<div className={`view-shell${sel ? " has-selection" : ""}`}>
    <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
      <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div className="display" style={{ fontSize:16, fontWeight:700 }}>Goals</div>
          <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setGD(blankGoal());setDrawer({mode:"add"});}}><Plus size={12}/>Add</button>
        </div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
          {["all", ...GOAL_STATUSES].map(s=>(
            <button key={s} className={`filter-chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s)}>{s}</button>
          ))}
        </div>
        <div style={{ position:"relative" }}>
          <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
          <input className="input" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
        </div>
      </div>
      <div style={{ overflowY:"auto", flex:1 }}>
        {filtered.map(g=>(
          <div key={g.id} className="row-hover" onClick={()=>navigate("record",{type:"goal",id:g.id})}
            style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===g.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{g.name}</div>
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{g.category} · {pctOf(g)}%</div>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
              <Tag label={g.status}/>
              <RowActions onEdit={()=>navigate("record",{type:"goal",id:g.id})} onDelete={()=>setConfirm({id:g.id,label:g.name})}/>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
      {(goal && editGoal) ? (
        <div className="slide-in">
          <button className="mobile-back" onClick={()=>{setSel(null);navigate("goals");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to goals</button>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
            <div style={{ minWidth:0 }}>
              <div className="display" style={{ fontSize:20, fontWeight:800 }}>{goal.name}</div>
              <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{goal.category} · {goal.period}</div>
            </div>
            <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              <Tag label={goal.status}/>
              <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
              <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:goal.id,label:goal.name})}><Trash2 size={12}/></button>
            </div>
          </div>

          {goal.target_value > 0 && <div className="card-el" style={{ padding:14, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
              <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
              <span style={{ fontWeight:700 }}>{pctOf(goal)}%</span>
            </div>
            <div style={{ background:"var(--bg)", borderRadius:6, height:10, overflow:"hidden" }}>
              <div style={{ width:pctOf(goal)+"%", height:"100%", background:pctOf(goal)>=100?"var(--green)":"var(--blue)", transition:"width .3s" }}/>
            </div>
          </div>}

          <div className="card" style={{ padding:20, marginBottom:16 }}>
            <Field label="Goal Name"><Inp value={editGoal.name} onChange={v=>setEditGoal(p=>({...p,name:v}))}/></Field>
            <Field label="Description"><Tex value={editGoal.description||""} onChange={v=>setEditGoal(p=>({...p,description:v}))}/></Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Field label="Category"><Sel value={editGoal.category} onChange={v=>setEditGoal(p=>({...p,category:v}))} options={GOAL_CATEGORIES}/></Field>
              <Field label="Status"><Sel value={editGoal.status} onChange={v=>setEditGoal(p=>({...p,status:v}))} options={GOAL_STATUSES}/></Field>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <Field label="Target"><Inp type="number" value={editGoal.target_value} onChange={v=>setEditGoal(p=>({...p,target_value:v}))}/></Field>
              <Field label="Current"><Inp type="number" value={editGoal.current_value} onChange={v=>setEditGoal(p=>({...p,current_value:v}))}/></Field>
              <Field label="Unit"><Inp value={editGoal.unit||""} onChange={v=>setEditGoal(p=>({...p,unit:v}))}/></Field>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <Field label="Period"><Sel value={editGoal.period} onChange={v=>setEditGoal(p=>({...p,period:v}))} options={["daily","weekly","monthly","quarterly","annual"]}/></Field>
              <Field label="Start Date"><Inp type="date" value={editGoal.start_date||""} onChange={v=>setEditGoal(p=>({...p,start_date:v}))}/></Field>
              <Field label="End Date"><Inp type="date" value={editGoal.end_date||""} onChange={v=>setEditGoal(p=>({...p,end_date:v}))}/></Field>
            </div>
            <Field label="Priority Order"><Inp type="number" value={editGoal.priority_order} onChange={v=>setEditGoal(p=>({...p,priority_order:v}))}/></Field>
            <Field label="Notes"><Tex value={editGoal.notes||""} onChange={v=>setEditGoal(p=>({...p,notes:v}))}/></Field>
          </div>

          {goalStrategies.length > 0 && <div className="card-el" style={{ padding:14, marginBottom:16 }}>
            <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>STRATEGIES ({goalStrategies.length})</div>
            {goalStrategies.map(s=>(
              <div key={s.id} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:12, flex:1 }}><EntityLink type="strategy" id={s.id} navigate={navigate}>{s.name}</EntityLink></span>
                <Tag label={s.status}/>
                <Tag label={s.priority}/>
              </div>
            ))}
          </div>}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
          <Award size={44} style={{ opacity:.15, marginBottom:14 }}/>
          <p style={{ fontSize:14 }}>Select a goal</p>
        </div>
      )}
    </div>

    {drawer?.mode==="add" && <Drawer title="New Goal" onClose={()=>setDrawer(null)} onSave={()=>saveGoal(gd)}>
      <Field label="Goal Name"><Inp value={gd.name} onChange={v=>setGD(p=>({...p,name:v}))}/></Field>
      <Field label="Description"><Tex value={gd.description} onChange={v=>setGD(p=>({...p,description:v}))}/></Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Field label="Category"><Sel value={gd.category} onChange={v=>setGD(p=>({...p,category:v}))} options={GOAL_CATEGORIES}/></Field>
        <Field label="Status"><Sel value={gd.status} onChange={v=>setGD(p=>({...p,status:v}))} options={GOAL_STATUSES}/></Field>
        <Field label="Target"><Inp type="number" value={gd.target_value} onChange={v=>setGD(p=>({...p,target_value:v}))}/></Field>
        <Field label="Current"><Inp type="number" value={gd.current_value} onChange={v=>setGD(p=>({...p,current_value:v}))}/></Field>
        <Field label="Unit"><Inp value={gd.unit} onChange={v=>setGD(p=>({...p,unit:v}))}/></Field>
        <Field label="Period"><Sel value={gd.period} onChange={v=>setGD(p=>({...p,period:v}))} options={["daily","weekly","monthly","quarterly","annual"]}/></Field>
      </div>
      <Field label="Notes"><Tex value={gd.notes} onChange={v=>setGD(p=>({...p,notes:v}))}/></Field>
    </Drawer>}
    {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>delGoal(confirm.id)} onCancel={()=>setConfirm(null)}/>}
  </div>);
};

/* ────────────────────────────────────────────────────────
   ADMIN VIEW
──────────────────────────────────────────────────────── */
const AdminView = ({ session }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drawer, setDrawer] = useState(null); // null | "create" | {mode:"edit", user} | {mode:"reset", user}
  const [form, setForm] = useState({ email:"", password:"", full_name:"", role:"" });
  const [resetPw, setResetPw] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const apiCall = async (body) => {
    const resp = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    return resp.json();
  };

  const loadUsers = async () => {
    setLoading(true); setError("");
    const res = await apiCall({ action: "list" });
    if (res.error) setError(res.error);
    else setUsers(res.users || []);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleCreate = async () => {
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    setError("");
    const res = await apiCall({ action: "create", ...form });
    if (res.error) { setError(res.error); return; }
    flash("User created successfully");
    setDrawer(null); setForm({ email:"", password:"", full_name:"", role:"" });
    loadUsers();
  };

  const handleUpdate = async () => {
    if (!drawer?.user?.id) return;
    setError("");
    const res = await apiCall({ action: "update", userId: drawer.user.id, email: form.email, full_name: form.full_name, role: form.role });
    if (res.error) { setError(res.error); return; }
    flash("User updated successfully");
    setDrawer(null); loadUsers();
  };

  const handleResetPassword = async () => {
    if (!drawer?.user?.id || !resetPw) return;
    if (resetPw.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    const res = await apiCall({ action: "reset_password", userId: drawer.user.id, new_password: resetPw });
    if (res.error) { setError(res.error); return; }
    flash("Password reset successfully");
    setResetPw(""); setDrawer(null);
  };

  const handleDelete = async (userId) => {
    setError("");
    const res = await apiCall({ action: "delete", userId });
    if (res.error) { setError(res.error); return; }
    flash("User deleted");
    setConfirmDelete(null); loadUsers();
  };

  const openEdit = (u) => {
    setForm({ email: u.email, password: "", full_name: u.full_name, role: u.role });
    setDrawer({ mode: "edit", user: u });
    setError("");
  };

  const openReset = (u) => {
    setResetPw("");
    setDrawer({ mode: "reset", user: u });
    setError("");
  };

  const openCreate = () => {
    setForm({ email: "", password: "", full_name: "", role: "" });
    setDrawer("create");
    setError("");
  };

  const inputStyle = { width:"100%", padding:"9px 12px", background:"var(--bg-main)", border:"1px solid var(--border)", borderRadius:6, color:"var(--text)", fontSize:13, outline:"none", boxSizing:"border-box" };
  const labelStyle = { fontSize:11, color:"var(--text-sec)", marginBottom:4, display:"block" };
  const btnPrimary = { padding:"9px 18px", background:"var(--blue)", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600 };
  const btnDanger = { padding:"7px 14px", background:"var(--red-dim)", color:"var(--red)", border:"1px solid var(--red)", borderRadius:6, cursor:"pointer", fontSize:12 };
  const btnGhost = { padding:"7px 14px", background:"transparent", color:"var(--text-sec)", border:"1px solid var(--border)", borderRadius:6, cursor:"pointer", fontSize:12 };

  return (
    <div style={{ padding:24, maxWidth:900, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Shield size={20} color="var(--blue)"/>
          <h2 style={{ margin:0, fontSize:18 }}>User Management</h2>
          <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{users.length} users</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={loadUsers} style={btnGhost}><RefreshCw size={12}/> Refresh</button>
          <button onClick={openCreate} style={btnPrimary}><Plus size={12}/> Add User</button>
        </div>
      </div>

      {error && <div style={{ padding:"10px 14px", background:"var(--red-dim)", border:"1px solid var(--red)", borderRadius:6, color:"var(--red)", fontSize:13, marginBottom:14 }}>{error}</div>}
      {success && <div style={{ padding:"10px 14px", background:"var(--green-dim)", border:"1px solid var(--green)", borderRadius:6, color:"var(--green)", fontSize:13, marginBottom:14 }}>{success}</div>}

      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"var(--text-sec)" }}><Loader size={20} className="spin"/> Loading users...</div>
      ) : (
        <div className="card-el" style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"var(--bg-main)", borderBottom:"1px solid var(--border)" }}>
                <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>NAME</th>
                <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>EMAIL</th>
                <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>ROLE</th>
                <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>LAST SIGN IN</th>
                <th style={{ padding:"10px 14px", textAlign:"right", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="row-hover" style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ fontWeight:600 }}>{u.full_name || "—"}</div>
                    {u.id === session.user.id && <span style={{ fontSize:10, color:"var(--blue)", background:"var(--blue-dim)", padding:"1px 6px", borderRadius:4 }}>You</span>}
                  </td>
                  <td style={{ padding:"10px 14px", color:"var(--text-sec)" }}>{u.email}</td>
                  <td style={{ padding:"10px 14px" }}>
                    {u.role ? <span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:"var(--amber-dim)", color:"var(--amber)" }}>{u.role}</span> : <span style={{ color:"var(--text-sec)" }}>—</span>}
                  </td>
                  <td style={{ padding:"10px 14px", color:"var(--text-sec)", fontSize:12 }}>
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}>
                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                      <button onClick={() => openEdit(u)} title="Edit profile" style={{ ...btnGhost, padding:"5px 8px" }}><Pencil size={12}/></button>
                      <button onClick={() => openReset(u)} title="Reset password" style={{ ...btnGhost, padding:"5px 8px" }}><Shield size={12}/></button>
                      {u.id !== session.user.id && (
                        <button onClick={() => setConfirmDelete(u)} title="Delete user" style={{ ...btnGhost, padding:"5px 8px", color:"var(--red)" }}><Trash2 size={12}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit / Reset Drawer ── */}
      {drawer && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }} onClick={() => setDrawer(null)}>
          <div className="card-el" style={{ width:420, padding:24, maxHeight:"80vh", overflow:"auto" }} onClick={e => e.stopPropagation()}>
            {drawer === "create" && <>
              <h3 style={{ margin:"0 0 16px", fontSize:16, display:"flex", alignItems:"center", gap:8 }}><Plus size={16} color="var(--blue)"/> Create New User</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({...f, full_name:e.target.value}))} placeholder="John Smith"/></div>
                <div><label style={labelStyle}>Email *</label><input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} placeholder="user@example.com"/></div>
                <div><label style={labelStyle}>Password *</label><input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} placeholder="Min 6 characters"/></div>
                <div><label style={labelStyle}>Role</label><input style={inputStyle} value={form.role} onChange={e => setForm(f => ({...f, role:e.target.value}))} placeholder="e.g. Admin, Manager, Viewer"/></div>
              </div>
              {error && <div style={{ color:"var(--red)", fontSize:12, marginTop:8 }}>{error}</div>}
              <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
                <button onClick={() => setDrawer(null)} style={btnGhost}>Cancel</button>
                <button onClick={handleCreate} style={btnPrimary}>Create User</button>
              </div>
            </>}

            {drawer?.mode === "edit" && <>
              <h3 style={{ margin:"0 0 16px", fontSize:16, display:"flex", alignItems:"center", gap:8 }}><Pencil size={16} color="var(--blue)"/> Edit User Profile</h3>
              <div style={{ fontSize:12, color:"var(--text-sec)", marginBottom:14 }}>Editing: {drawer.user.email}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({...f, full_name:e.target.value}))} /></div>
                <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} /></div>
                <div><label style={labelStyle}>Role</label><input style={inputStyle} value={form.role} onChange={e => setForm(f => ({...f, role:e.target.value}))} placeholder="e.g. Admin, Manager, Viewer"/></div>
              </div>
              {error && <div style={{ color:"var(--red)", fontSize:12, marginTop:8 }}>{error}</div>}
              <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
                <button onClick={() => setDrawer(null)} style={btnGhost}>Cancel</button>
                <button onClick={handleUpdate} style={btnPrimary}>Save Changes</button>
              </div>
            </>}

            {drawer?.mode === "reset" && <>
              <h3 style={{ margin:"0 0 16px", fontSize:16, display:"flex", alignItems:"center", gap:8 }}><Shield size={16} color="var(--amber)"/> Reset Password</h3>
              <div style={{ fontSize:12, color:"var(--text-sec)", marginBottom:14 }}>Resetting password for: {drawer.user.email}</div>
              <div><label style={labelStyle}>New Password</label><input style={inputStyle} type="password" value={resetPw} onChange={e => setResetPw(e.target.value)} placeholder="Min 6 characters"/></div>
              {error && <div style={{ color:"var(--red)", fontSize:12, marginTop:8 }}>{error}</div>}
              <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
                <button onClick={() => setDrawer(null)} style={btnGhost}>Cancel</button>
                <button onClick={handleResetPassword} style={btnPrimary}>Reset Password</button>
              </div>
            </>}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {confirmDelete && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={() => setConfirmDelete(null)}>
          <div className="card-el" style={{ width:380, padding:24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin:"0 0 10px", fontSize:16, color:"var(--red)" }}>Delete User</h3>
            <p style={{ fontSize:13, color:"var(--text-sec)", margin:"0 0 6px" }}>Are you sure you want to delete this user?</p>
            <p style={{ fontSize:13, fontWeight:600, margin:"0 0 18px" }}>{confirmDelete.full_name || confirmDelete.email}</p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={btnGhost}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} style={btnDanger}>Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   RECORD DETAIL ROUTER
──────────────────────────────────────────────────────── */
const recordListViewFor = (type) => ({
  contact:"crm", company:"companies", deal:"deals", document:"documents", project:"projects",
  task:"tasks", campaign:"marketing", invoice:"invoices", payment:"payments", strategy:"strategies",
  goal:"goals", ai_memory:"ai_memories"
}[type] || "dashboard");

const recordLink = (type, id, db, navigate) => {
  const cfg = DOCUMENT_ENTITY_TYPES.find(c => c.type === type);
  const rec = cfg ? (db[cfg.key] || []).find(r => String(r.id) === String(id)) : null;
  if (!rec) return null;
  return <EntityLink type={type} id={id} navigate={navigate}>{cfg.name(rec) || `${cfg.label} #${id}`}</EntityLink>;
};

const RecordDetailView = ({ db, setDB, record, navigate, setFocus }) => {
  const type = record?.type;
  // For types that have a master+detail view, render that view with focus pre-set.
  // This keeps the left selector list visible while showing the record's detail,
  // and uses the master view's inline-editable form instead of the read-only generic view.
  if (type === "contact")  return <CRMView        db={db} setDB={setDB} navigate={navigate} focus={record} setFocus={setFocus}/>;
  if (type === "company")  return <CompaniesView  db={db} setDB={setDB} navigate={navigate} focus={record} setFocus={setFocus}/>;
  if (type === "campaign") return <MarketingView  db={db} setDB={setDB} navigate={navigate} focus={record} setFocus={setFocus}/>;
  if (type === "project")  return <ProjectsView   db={db} setDB={setDB} navigate={navigate} focus={record} setFocus={setFocus}/>;
  if (type === "deal")     return <DealsView      db={db} setDB={setDB} navigate={navigate} focus={record} setFocus={setFocus}/>;
  if (type === "goal")     return <GoalsView      db={db} setDB={setDB} navigate={navigate} focus={record} setFocus={setFocus}/>;
  if (type === "strategy") return <StrategiesView db={db} setDB={setDB} navigate={navigate} focus={record} setFocus={setFocus}/>;

  const id = record?.id;
  const cfg = DOCUMENT_ENTITY_TYPES.find(c => c.type === type);
  const rec = cfg ? (db[cfg.key] || []).find(r => String(r.id) === String(id)) : null;

  if (!cfg || !rec) {
    return (
      <div style={{ padding:32 }}>
        <div className="card" style={{ padding:28, maxWidth:720 }}>
          <div className="display" style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Record not found</div>
          <p style={{ fontSize:13, color:"var(--text-sec)", lineHeight:1.6, marginBottom:16 }}>No record exists for `{type || "unknown"}` with ID `{id || "unknown"}`.</p>
          <button className="btn btn-blue" onClick={()=>navigate(recordListViewFor(type))}>Back</button>
        </div>
      </div>
    );
  }

  const title = cfg.name(rec) || `${cfg.label} #${rec.id}`;
  const scalarEntries = Object.entries(rec).filter(([,v]) => v == null || ["string","number","boolean"].includes(typeof v));
  const relatedDocs = (db.documents || []).filter(d => docHasAssociation(d, type, rec.id));
  const relatedTasks = (db.tasks || []).filter(t =>
    (type === "contact" && String(t.contactId) === String(rec.id)) ||
    (type === "company" && String(t.companyId) === String(rec.id)) ||
    (type === "deal" && String(t.dealId) === String(rec.id)) ||
    (type === "project" && String(t.projectId) === String(rec.id))
  );
  const relatedDeals = type === "contact"
    ? (db.deals || []).filter(d => String(d.contactId) === String(rec.id))
    : type === "company"
      ? (db.deals || []).filter(d => String(d.companyId) === String(rec.id) || (db.contacts || []).some(c => String(c.companyId) === String(rec.id) && String(c.id) === String(d.contactId)))
      : [];
  const relatedContacts = type === "company" ? (db.contacts || []).filter(c => String(c.companyId) === String(rec.id) || c.co === rec.name) : [];
  const associatedRecords = type === "document" ? (rec.associations || []) : [];
  const sourceUrl = recordPath(type, rec.id);
  const copyUrl = () => navigator.clipboard?.writeText(window.location.origin + window.location.pathname + sourceUrl);

  return (
    <div style={{ padding:24, maxWidth:1180, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:18 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <Tag label={cfg.label}/>
            <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>ID {rec.id}</span>
          </div>
          <div className="display" style={{ fontSize:26, fontWeight:800, lineHeight:1.15 }}>{title}</div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
          <button className="btn btn-ghost" onClick={()=>navigate(recordListViewFor(type))}>← Back to {cfg.label}s</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 340px", gap:18 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="card" style={{ padding:18 }}>
            <div className="display" style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
              {scalarEntries.map(([k,v]) => (
                <div key={k} className="card-el" style={{ padding:"10px 12px", minWidth:0 }}>
                  <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", textTransform:"uppercase", marginBottom:4 }}>{k}</div>
                  <div style={{ fontSize:13, lineHeight:1.5, overflowWrap:"anywhere" }}>{v == null || v === "" ? "—" : String(v)}</div>
                </div>
              ))}
            </div>
          </div>

          {associatedRecords.length > 0 && (
            <div className="card" style={{ padding:18 }}>
              <div className="display" style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Associated Records</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {associatedRecords.map(a => (
                  <div key={docAssociationKey(a)} className="card-el" style={{ padding:"10px 12px" }}>
                    {recordLink(a.type, a.id, db, navigate) || getDocEntityLabel(db, a)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {type !== "document" && <AssociatedDocumentsPanel db={db} setDB={setDB} entityType={type} entityId={rec.id}/>}
          <ActivityTimeline events={db.events || []} entityType={type} entityId={rec.id}/>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {["contactId","companyId","dealId","projectId","invoice_id","payment_id","strategyId"].some(k => rec[k]) && (
            <div className="card" style={{ padding:16 }}>
              <div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Linked Records</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:13 }}>
                {rec.contactId && <div>Contact: {recordLink("contact", rec.contactId, db, navigate) || rec.contactId}</div>}
                {rec.companyId && <div>Company: {recordLink("company", rec.companyId, db, navigate) || rec.companyId}</div>}
                {rec.dealId && <div>Deal: {recordLink("deal", rec.dealId, db, navigate) || rec.dealId}</div>}
                {rec.projectId && <div>Project: {recordLink("project", rec.projectId, db, navigate) || rec.projectId}</div>}
                {rec.invoice_id && <div>Invoice: {recordLink("invoice", rec.invoice_id, db, navigate) || rec.invoice_id}</div>}
                {rec.payment_id && <div>Payment: {recordLink("payment", rec.payment_id, db, navigate) || rec.payment_id}</div>}
                {rec.strategyId && <div>Strategy: {recordLink("strategy", rec.strategyId, db, navigate) || rec.strategyId}</div>}
              </div>
            </div>
          )}

          {relatedContacts.length > 0 && <div className="card" style={{ padding:16 }}><div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Contacts</div>{relatedContacts.slice(0,8).map(c => <div key={c.id} className="card-el" style={{ padding:10, marginBottom:6 }}>{recordLink("contact", c.id, db, navigate)}</div>)}</div>}
          {relatedDeals.length > 0 && <div className="card" style={{ padding:16 }}><div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Deals</div>{relatedDeals.slice(0,8).map(d => <div key={d.id} className="card-el" style={{ padding:10, marginBottom:6 }}>{recordLink("deal", d.id, db, navigate)} <span className="mono" style={{ color:"var(--text-sec)", fontSize:10 }}>· {fmt(d.value || 0)}</span></div>)}</div>}
          {relatedTasks.length > 0 && <div className="card" style={{ padding:16 }}><div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Tasks</div>{relatedTasks.slice(0,10).map(t => <div key={t.id} className="card-el" style={{ padding:10, marginBottom:6 }}>{recordLink("task", t.id, db, navigate)} <Tag label={t.priority || "medium"}/></div>)}</div>}
          {relatedDocs.length > 0 && <div className="card" style={{ padding:16 }}><div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Documents</div>{relatedDocs.slice(0,8).map(d => <div key={d.id} className="card-el" style={{ padding:10, marginBottom:6 }}>{recordLink("document", d.id, db, navigate)}</div>)}</div>}
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   APP ROOT
──────────────────────────────────────────────────────── */
export default function App() {
  const VALID_VIEWS = ["dashboard","orchestrator","associates","mstack","crm","companies","deals","marketing","tasks","projects","documents","voice","inbox","gcal","invoices","payments","goals","strategies","ai_memories","multi_llm","voitra_gate","admin","record"];
  const routeFromHash = () => {
    const route = parseAppHash();
    return VALID_VIEWS.includes(route.view) ? route : { view:"dashboard", record:null };
  };
  const initialRoute = routeFromHash();
  const [session, setSession] = useState(undefined);
  const [db, setDB] = useState(null);
  const [view, setView] = useState(initialRoute.view);
  const [recordTarget, setRecordTarget] = useState(initialRoute.record);
    const [focus, setFocus] = useState(null); // {type:"task"|"contact"|"deal"|"invoice"|"project"|"company", id:number}
  const navigate = (targetView, focusTarget) => {
    if (targetView === "record" || focusTarget?.type) {
      const target = targetView === "record" ? focusTarget : { type:focusTarget.type, id:focusTarget.id };
      setRecordTarget(target);
      setView("record");
      window.location.hash = recordPath(target.type, target.id);
      return;
    }
    setRecordTarget(null);
    setView(targetView);
    if(focusTarget) setFocus(focusTarget);
  };
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  const [autoRecord, setAutoRecord] = useState(false);
  const [showVoiceLab, setShowVoiceLab] = useState(false);
  const [sweepRunning, setSweepRunning] = useState(false);

  const runSweep = async () => {
    setSweepRunning(true);
    try {
      const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
      const snap = {
        projects: (db.projects||[]).map(p=>({name:p.name,client:p.client,type:p.type||"client",status:p.status,priority:p.priority||"medium",progress:p.progress})),
        deals: (db.deals||[]).map(d=>({name:d.name,value:d.value,stage:d.stage,probability:d.probability,closeDate:d.closeDate})),
        tasks: (db.tasks||[]).filter(t=>!t.done).map(t=>({title:t.title,due:t.due,priority:t.priority})),
        contacts: (db.contacts||[]).filter(c=>c.status==="at-risk"||c.score<30).map(c=>({name:c.name,co:c.co,status:c.status,score:c.score})),
        invoices: (db.invoices||[]).filter(i=>i.status!=="paid").map(i=>({client:i.client,amount:i.amount,status:i.status,due:i.due})),
      };
      const msg = await callClaude(
        "You are Mendy Ezagui's proactive daily strategist. Projects are typed client/strategic with priorities high/medium/low. Be specific with names, amounts, dates.",
        "Today is "+today+". Snapshot: "+JSON.stringify(snap)+"\nGenerate Daily Action Plan: TOP PRIORITIES (1-2 urgent items), DEAL MOVES (actions ranked by revenue+urgency), STRATEGIC PLAYS (advance high-priority strategic project), SMART NUDGES (follow-ups, cold relationships, deadlines, billing). Max 8 sentences.",
        800
      );
      const nextId = Math.max(0,...(db.agentlogs||[]).map(l=>l.id))+1;
      const ts = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
      setDB(p=>({...p, agentlogs:[...(p.agentlogs||[]),{id:nextId,agent:"Orchestrator",type:"sweep",message:msg,ts,priority:"high"}]}));
    } catch(e) { console.error("Sweep error:",e); }
    setSweepRunning(false);
  };

  // Sync view ↔ URL hash; reset autoRecord when leaving voice
  useEffect(() => {
    const nextHash = view === "record" && recordTarget ? recordPath(recordTarget.type, recordTarget.id) : "#/" + view;
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
    if (view !== "voice") setAutoRecord(false);
  }, [view, recordTarget]);
  useEffect(() => {
    const onHash = () => { const r = routeFromHash(); setView(r.view); setRecordTarget(r.record); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const dbRef = useRef(null);
  const syncLock = useRef(false);
  const pendingSync = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      if (!s) setDB(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) return;
    loadAllFromDB().then(data => { setDB(data); dbRef.current = data; });
  }, [session?.user?.id]);

  useEffect(() => {
    if (!db || !dbRef.current) return;
    if (syncLock.current) { pendingSync.current = true; return; }
    const prev = dbRef.current;
    if (prev === db) return;
    dbRef.current = db;
    syncLock.current = true;
    syncToDB(prev, db)
      .catch(err => console.error("Supabase sync error:", err))
      .finally(() => {
        syncLock.current = false;
        if (pendingSync.current) {
          pendingSync.current = false;
          const latestPrev = dbRef.current;
          if (latestPrev !== db) {
            dbRef.current = db;
            syncLock.current = true;
            syncToDB(latestPrev, db)
              .catch(err => console.error("Supabase sync error:", err))
              .finally(() => { syncLock.current = false; });
          }
        }
      });
  }, [db]);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  if (!ENV_READY) return (
    <>
      <GlobalStyle/>
      <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
        <div className="card" style={{ width:"min(480px,92vw)", padding:36, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"var(--red-dim)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><AlertCircle size={22} color="var(--red)"/></div>
            <div><div className="display" style={{ fontSize:16, fontWeight:700 }}>Missing Environment Variables</div></div>
          </div>
          <p style={{ fontSize:12, color:"var(--text-sec)", lineHeight:1.7 }}>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables.</p>
        </div>
      </div>
    </>
  );
  if (session === undefined) return <><GlobalStyle/><LoadingScreen msg="Checking auth…"/></>;
  if (!session) return <LoginScreen/>;
  if (!db) return <><GlobalStyle/><LoadingScreen msg="Loading your data…"/></>;

  const alerts = (() => {
    const openTasks = db.tasks.filter(t=>!t.done && t.status!=="done" && t.status!=="cancelled");
    const critTasks = openTasks.filter(t=>t.priority==="critical" || (t.due && t.due < today()));
    const overdueInv = db.invoices.filter(i=>i.status==="overdue");
    const atRisk = db.contacts.filter(c=>c.score && c.score < 40 && c.category && c.category.includes("customer"));
    return critTasks.length + overdueInv.length + atRisk.length;
  })();
  const VIEWS = {
    dashboard:    <Dashboard db={db} setDB={setDB} setView={setView} navigate={navigate} session={session} runSweep={runSweep} sweepRunning={sweepRunning} setShowVoiceLab={setShowVoiceLab} />,
    orchestrator: <OrchestratorView db={db} setDB={setDB} navigate={navigate}/>,
    associates:   <AssociatesView db={db} setDB={setDB} navigate={navigate}/>,
    mstack:       <AssociatesView db={db} setDB={setDB} navigate={navigate}/>,
    crm:          <CRMView db={db} setDB={setDB} setView={setView} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    companies:    <CompaniesView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    deals:        <DealsView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    marketing:    <MarketingView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    tasks:        <TasksView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    goals:        <GoalsView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    documents:   <DocumentsView db={db} setDB={setDB} navigate={navigate}/>,
    record:      <RecordDetailView db={db} setDB={setDB} record={recordTarget} navigate={navigate} setFocus={setFocus}/>,
    ai_memories: <AIMemoriesView db={db} setDB={setDB} navigate={navigate}/>,
    multi_llm:   <MultiLLMView session={session}/>,
    strategies:   <StrategiesView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    voitra_gate:  <VoitraGateView/>,
    payments:      <PaymentsView db={db} setDB={setDB} navigate={navigate}/>,
    projects:     <ProjectsView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    invoices:      <BillingView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    voice:        <VoiceView db={db} setDB={setDB} autoRecord={autoRecord}/>,
    inbox:        <InboxView session={session}/>,
    gcal:         <GCalView session={session} db={db} setDB={setDB}/>,
    admin:        <AdminView session={session}/>,
  };

  return (
    <>
      <GlobalStyle/>
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)", overflow:"hidden" }}>
        <div style={{ height:46, background:"var(--bg-card)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", padding:"0 16px", gap:10, flexShrink:0, zIndex:10 }}>
          {mobile && <div style={{ width:28, height:28, borderRadius:7, background:"var(--blue-dim)", display:"flex", alignItems:"center", justifyContent:"center" }}><Brain size={14} color="var(--blue)"/></div>}
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginLeft:mobile?0:"auto" }}>
            <span style={{ color:"var(--green)" }}>●</span> LIVE · {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            {alerts > 0 && (
              <div style={{ background:"var(--red-dim)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:6, padding:"3px 8px", fontSize:11, color:"var(--red)", fontFamily:"var(--font-m)", cursor:"pointer" }}
                onClick={()=>setView("dashboard")}>{alerts} CRITICAL</div>
            )}
            <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", background:"var(--bg-el)", padding:"4px 10px", borderRadius:6 }}>
              {(session.user.user_metadata?.full_name || session.user.email?.split("@")[0])?.toUpperCase() || "ME"}
            </div>
            <button className="btn btn-ghost" style={{ padding:"4px 10px", fontSize:11 }} onClick={()=>supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {!mobile && <Sidebar view={view} setView={setView} collapsed={collapsed} setCollapsed={setCollapsed} alerts={alerts} db={db}/>}
          <main style={{ flex:1, overflowY:"auto" }}>{VIEWS[view] || VIEWS.dashboard}</main>
        </div>
        {/* Voice Lab Overlay */}
      {showVoiceLab && <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9998,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setShowVoiceLab(false)}}>
        <div style={{background:"var(--card)",borderRadius:16,width:"90%",maxWidth:700,maxHeight:"85vh",overflow:"auto",position:"relative",padding:0}}>
          <button onClick={()=>setShowVoiceLab(false)} style={{position:"absolute",top:12,right:12,zIndex:10,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text)"}}>✕</button>
          <VoiceView db={db} setDB={setDB} autoRecord={autoRecord}/>
        </div>
      </div>}
      {/* Floating Action Buttons */}
      <div className="fab-stack" style={{position:"fixed",bottom:24,right:24,zIndex:9990,display:"flex",flexDirection:"column",gap:12,alignItems:"flex-end"}}>
        <button title="AI Sweep" onClick={()=>{if(!sweepRunning){runSweep();setShowVoiceLab(true)}}} style={{width:52,height:52,borderRadius:"50%",background:sweepRunning?"var(--amber)":"linear-gradient(135deg,#667eea,#764ba2)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 15px rgba(0,0,0,0.3)",transition:"transform 0.2s",animation:sweepRunning?"pulse 1.5s infinite":"none"}}><Zap size={22} color="#fff"/></button>
        <button title="Voice Lab" onClick={()=>{setShowVoiceLab(v=>!v);setAutoRecord(true)}} style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#cc77ff,#aaafff)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 15px rgba(0,0,0,0.3)",animation:"pulse 2s infinite"}}><Mic size={24} color="#fff"/></button>
      </div>
        {mobile && <BottomNav view={view} setView={setView}/>}
      </div>
    </>
  );
}
