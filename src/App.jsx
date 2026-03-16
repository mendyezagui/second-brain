import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Brain, Users, Megaphone, Briefcase, DollarSign, Mic, Mail,
  TrendingUp, AlertCircle, CheckCircle, Clock, Plus, Zap, Target,
  Phone, Building, Search, BarChart2, Calendar, Loader, Shield,
  ChevronRight, Eye, MicOff, ArrowUp, ArrowDown, Inbox, RefreshCw,
  FileText, Trash2, Pencil, X, Save, MoreVertical, Check, Sparkles, Hash,
  Linkedin, ExternalLink, Filter, SortAsc, ChevronDown, Globe, Newspaper,
  Star, ArrowRightCircle, Activity, Award, Building2
} from "lucide-react";
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
    { id:1, name:"Scott Mgmt AI Ops Deployment", client:"Scott Management", companyId:null, status:"active", progress:72, dueDate:"2026-04-15", priority:"high", notes:"" },
    { id:2, name:"Rapid Medical — Agentforce POC", client:"Rapid Medical", companyId:null, status:"stalled", progress:35, dueDate:"2026-03-31", priority:"critical", notes:"Stalled at 35%." },
    { id:3, name:"Horizon HOA SOW Finalization", client:"Horizon HOA", companyId:null, status:"active", progress:20, dueDate:"2026-03-20", priority:"high", notes:"" },
    { id:4, name:"BD Signal Tool — V2", client:"Internal", companyId:null, status:"active", progress:55, dueDate:"2026-04-01", priority:"medium", notes:"" },
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
});

/* ── SUPABASE CLIENT ── */
const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL  || "";
const SUPA_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const ENV_READY = SUPA_URL.startsWith("https://") && SUPA_KEY.length > 10;

const supabase = ENV_READY ? createClient(SUPA_URL, SUPA_KEY) : null;

const DB_TABLES = [
  ["contacts",    "contacts"],
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
];

const loadAllFromDB = async () => {
  const seed = initDB();
  const result = {};
  const fetches = await Promise.all(DB_TABLES.map(([, tbl]) => supabase.from(tbl).select("*").order("id")));
  const toSeed = [];
  DB_TABLES.forEach(([key], i) => {
    const { data, error } = fetches[i];
    if (!error && data && data.length > 0) { result[key] = data; }
    else { result[key] = seed[key]; toSeed.push({ key, i }); }
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
    });
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
  {id:"voice",icon:Mic,label:"Voice Lab"},
  {divider:true},
  {id:"dashboard",icon:BarChart2,label:"Dashboard"},
  {id:"orchestrator",icon:Brain,label:"Orchestrator"},
  {divider:true},
  {id:"crm",icon:Users,label:"CRM"},
  {id:"companies",icon:Building2,label:"Companies"},
  {id:"deals",icon:Target,label:"Deals"},
  {id:"marketing",icon:Megaphone,label:"Marketing"},
  {id:"operations",icon:Briefcase,label:"Operations"},
  {id:"billing",icon:DollarSign,label:"Billing"},
  {divider:true},
  {id:"email",icon:Mail,label:"Email Lab"},
  {divider:true},
  {id:"admin",icon:Shield,label:"Admin"},
];

const Sidebar = ({ view, setView, collapsed, setCollapsed, alerts }) => (
  <div style={{ width:collapsed?60:210, background:"var(--bg-card)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", padding:"14px 8px", gap:2, transition:"width .25s", flexShrink:0 }}>
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 6px 18px", cursor:"pointer" }} onClick={()=>setCollapsed(!collapsed)}>
      <div style={{ width:32, height:32, borderRadius:8, background:"var(--blue-dim)", border:"1px solid rgba(0,119,204,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Brain size={16} color="var(--blue)"/>
      </div>
      {!collapsed && <div><div className="display" style={{ fontSize:13, fontWeight:700 }}>Second Brain</div><div className="mono" style={{ fontSize:9, color:"var(--text-sec)" }}>Life OS</div></div>}
    </div>
    {NAV.map((n,i)=>n.divider?(
      <div key={i} style={{ height:1, background:"var(--border)", margin:"6px 6px" }}/>
    ):(
      <button key={n.id} className={`nav-item${view===n.id?" active":""}`} onClick={()=>setView(n.id)} style={{ justifyContent:collapsed?"center":"flex-start", position:"relative" }}>
        <n.icon size={15} style={{ flexShrink:0 }}/>
        {!collapsed && <span>{n.label}</span>}
        {!collapsed && n.id==="orchestrator" && alerts>0 && <span style={{ marginLeft:"auto", background:"var(--red)", color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{alerts}</span>}
      </button>
    ))}
    <div style={{ marginTop:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 6px" }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", flexShrink:0 }} className="blink"/>
        {!collapsed && <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>6 agents live</span>}
      </div>
    </div>
  </div>
);

const BottomNav = ({ view, setView }) => (
  <div style={{ display:"flex", background:"var(--bg-card)", borderTop:"1px solid var(--border)", padding:"6px 0 10px" }}>
    {[{id:"dashboard",icon:BarChart2},{id:"orchestrator",icon:Brain},{id:"crm",icon:Users},{id:"companies",icon:Building2},{id:"deals",icon:Target},{id:"operations",icon:Briefcase},{id:"billing",icon:DollarSign}].map(n=>(
      <button key={n.id} onClick={()=>setView(n.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:"transparent", border:"none", cursor:"pointer", padding:"4px 0" }}>
        <n.icon size={17} color={view===n.id?"var(--blue)":"var(--text-sec)"}/>
        <div style={{ width:4, height:4, borderRadius:"50%", background:view===n.id?"var(--blue)":"transparent" }}/>
      </button>
    ))}
  </div>
);

/* ────────────────────────────────────────────────────────
   DASHBOARD — Morning Brief + Goal Tracking
──────────────────────────────────────────────────────── */
const Dashboard = ({ db, setDB, setView, navigate }) => {
  const paid = db.invoices.filter(i=>i.status==="paid").reduce((a,i)=>a+i.amount,0);
  const pipeline = db.deals.reduce((a,d)=>a+d.value*d.probability/100,0);
  const overdue = db.invoices.filter(i=>i.status==="overdue").reduce((a,i)=>a+i.amount,0);
  const goal = db.goals.find(g=>g.status==="active") || { target_value:800000 };
  const goalPct = Math.round((paid / goal.target_value) * 100);
  const openTasks = db.tasks.filter(t=>!t.done && t.status !== "done" && t.status !== "cancelled");
  const dueTodayOrOverdue = openTasks.filter(t => t.due && t.due <= today());
  const criticalItems = openTasks.filter(t=>t.priority==="critical");
  const decayedContacts = db.contacts.filter(c => c.lastTouch && c.score >= 60 && daysBetween(c.lastTouch, today()) > 14);

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:22 }}>
      {/* Morning Brief */}
      <div className="card" style={{ padding:20, borderLeft:"4px solid var(--purple)", background:"linear-gradient(135deg, rgba(124,58,237,0.03), transparent)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div className="display" style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Good morning, Mendy.</div>
            <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>
              {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} · 6 agents running
            </div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize:11, padding:"5px 10px" }} onClick={()=>setView("orchestrator")}>
            <Brain size={12}/>Orchestrator
          </button>
        </div>
        {(dueTodayOrOverdue.length > 0 || criticalItems.length > 0 || decayedContacts.length > 0) && (
          <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:6 }}>
            <div className="mono" style={{ fontSize:10, color:"var(--purple)" }}>TODAY'S PRIORITIES</div>
            {criticalItems.slice(0,3).map(t => (
              <div key={t.id} onClick={()=>navigate("operations",{type:"task",id:t.id})} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"var(--red-dim)", borderRadius:6, cursor:"pointer", transition:"filter .15s" }} onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
                <AlertCircle size={12} color="var(--red)"/>
                <span style={{ fontWeight:600, color:"var(--red)" }}>CRITICAL:</span>
                <span>{t.title}</span>
                {t.due && <span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>Due {t.due}</span>}
                <ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0}}/>
              </div>
            ))}
            {dueTodayOrOverdue.filter(t=>t.priority!=="critical").slice(0,4).map(t => (
              <div key={t.id} onClick={()=>navigate("operations",{type:"task",id:t.id})} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"var(--amber-dim)", borderRadius:6, cursor:"pointer", transition:"filter .15s" }} onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
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
          </div>
        )}
      </div>

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
          <button className="btn btn-ghost" style={{ fontSize:12, padding:"5px 10px" }} onClick={()=>setView("orchestrator")}>All <ChevronRight size={12}/></button>
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
const blankContact = () => ({ name:"", co:"", role:"", email:"", phone:"", status:"prospect", score:50, notes:"", lastTouch:today(), tags:[], linkedin_url:"", headline:"", connected_date:"", messaging_activity:"", priority:"Medium", follow_up:"", category:"customer_lead", companyId:"" });

const ContactForm = ({ data, onChange, companies }) => (
  <>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Field label="Name"><Inp value={data.name} onChange={v=>onChange({...data,name:v})} placeholder="Full name"/></Field>
      <Field label="Company"><Sel value={data.companyId||""} onChange={v=>onChange({...data,companyId:v?parseInt(v):null,co:companies.find(c=>c.id===parseInt(v))?.name||data.co})} options={[{value:"",label:"— select or type below —"},...companies.map(c=>({value:String(c.id),label:c.name}))]}/></Field>
      <Field label="Company (text)"><Inp value={data.co} onChange={v=>onChange({...data,co:v})} placeholder="Company name"/></Field>
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
    </div>
    <Field label="Messaging Activity"><Tex value={data.messaging_activity||""} onChange={v=>onChange({...data,messaging_activity:v})} placeholder="Messaging history summary…"/></Field>
    <Field label="Follow-Up Recommendation"><Tex value={data.follow_up||""} onChange={v=>onChange({...data,follow_up:v})} placeholder="Recommended next action…"/></Field>
    <Field label="Notes"><Tex value={data.notes} onChange={v=>onChange({...data,notes:v})} placeholder="Context, next steps…"/></Field>
  </>
);

const CRMView = ({ db, setDB, setView, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [gmailState, setGmailState] = useState({ loading:false, signals:[], synthesis:"", scannedAt:null, error:null });
  const [showGmail, setShowGmail] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");

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

  const scanGmail = async () => {
    setShowGmail(true); setSel(null);
    setGmailState(s=>({...s,loading:true,error:null,signals:[],synthesis:"",scannedAt:null}));
    try {
      const cutoff = new Date(Date.now()-30*24*60*60*1000);
      const ds = `${cutoff.getFullYear()}/${String(cutoff.getMonth()+1).padStart(2,"0")}/${String(cutoff.getDate()).padStart(2,"0")}`;
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:4000,
          system:`You are the CRM Intelligence Agent for Mendy Ezagui, an independent AI operations consultant. Search Gmail for ALL emails and meeting invites from the past 30 days (after:${ds}). Return ONLY a valid JSON array: [{"subject":"","date":"YYYY-MM-DD","contact":{"name":"","email":"","company":"","role":"","phone":""},"contactType":"lead|partner|vendor|existing-customer","accountContext":"","activitySummary":"","bdOpportunity":"","taskTitle":"","taskDueDate":"YYYY-MM-DD","taskPriority":"critical|high|medium|low","taskGuidance":"","priority":"high|medium|low"}]`,
          messages:[{role:"user",content:"Search my Gmail for the past 30 days. Extract every person I communicated with. Return the full JSON array."}],
          mcp_servers:[{type:"url",url:"https://gmail.mcp.claude.com/mcp",name:"gmail"}]
        })
      });
      const data = await res.json();
      const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n");
      let signals = [];
      try { const m = text.match(/\[[\s\S]*\]/); if (m) signals = JSON.parse(m[0]); } catch { signals = []; }
      let synthesis = signals.length > 0
        ? await callClaude("You are Mendy's Orchestrator. Revenue target $800K.", `Gmail scan found ${signals.length} contacts. Top action, most at-risk, strongest lead. 3 sentences.`, 400)
        : "No contacts found. Connect Gmail under Claude Settings → Integrations.";
      setGmailState({loading:false,signals:signals.map(s=>({...s,imported:false})),synthesis,scannedAt:new Date().toLocaleTimeString(),error:null});
    } catch(e) {
      setGmailState(s=>({...s,loading:false,error:"Gmail scan failed. Connect Gmail under Claude Settings → Integrations."}));
    }
  };

  const importContact = (signal) => {
    const alreadyExists = db.contacts.some(c => c.email && signal.contact.email && c.email.toLowerCase()===signal.contact.email.toLowerCase());
    if (alreadyExists) { alert(`${signal.contact.name} is already in CRM.`); return; }
    const catMap = {"existing-customer":"customer","lead":"customer_lead","partner":"partner_lead","vendor":"vendor"};
    const newContact = { id:nextId(db.contacts), name:signal.contact.name||"Unknown", co:signal.contact.company||"", role:signal.contact.role||"", email:signal.contact.email||"", phone:signal.contact.phone||"", status:signal.contactType==="existing-customer"?"client":"prospect", score:signal.contactType==="existing-customer"?80:signal.contactType==="lead"?55:signal.contactType==="partner"?70:50, tags:[signal.contactType], lastTouch:today(), notes:signal.accountContext||"", category:catMap[signal.contactType]||"customer_lead", companyId:null };
    const newTask = { id:nextId(db.tasks), title:signal.taskTitle||`Follow up with ${signal.contact.name}`, projectId:null, contactId:newContact.id, companyId:null, dealId:null, due:signal.taskDueDate||new Date(Date.now()+3*86400000).toISOString().split("T")[0], done:false, priority:signal.taskPriority||"medium", assignedTo:"CRM Agent", notes:signal.taskGuidance||"", status:"todo", category:"follow_up", source:"gmail_scan", recurrence:"none" };
    setDB(d => ({...d, contacts:[...d.contacts,newContact], tasks:[...d.tasks,newTask], agentLogs:[{id:nextId(d.agentLogs), agent:"CRM Agent", type:"activity", message:`[IMPORTED] ${signal.contact.name} (${signal.contact.company})`, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:signal.taskPriority||"medium"}, ...d.agentLogs]}));
    setGmailState(s => ({...s, signals:s.signals.map(sg=>sg===signal?{...sg,imported:true}:sg)}));
  };

  const pasteImport = () => {
    try {
      const raw = pasteText.trim();
      const match = raw.match(/\[[\s\S]*\]/);
      const signals = JSON.parse(match ? match[0] : raw);
      if (!Array.isArray(signals)) throw new Error("Not an array");
      setGmailState({ loading:false, signals:signals.map(s=>({...s,imported:false})), synthesis:`Paste import: ${signals.length} contacts loaded.`, scannedAt:new Date().toLocaleTimeString(), error:null });
      setShowGmail(true); setSel(null); setPasteMode(false); setPasteText("");
    } catch { alert("Could not parse JSON."); }
  };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* LEFT LIST */}
      <div style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Contacts</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setDrawer({mode:"add",data:blankContact()})}><Plus size={12}/>Add</button>
          </div>
          <button className="btn btn-gmail" style={{ width:"100%", justifyContent:"center", marginBottom:6, fontSize:12, padding:"7px 10px" }} onClick={scanGmail} disabled={gmailState.loading}>
            {gmailState.loading?<><Loader size={13} className="spin" style={{color:"#EA4335"}}/>Scanning…</>:<>
              <svg width="13" height="13" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg>
              Scan Gmail — 30 Days
            </>}
          </button>
          <button className="btn btn-ghost" style={{ width:"100%", justifyContent:"center", marginBottom:8, fontSize:11, padding:"5px 10px" }} onClick={()=>setPasteMode(true)}>
            <FileText size={11}/>Paste JSON from Claude
          </button>
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
            <div key={c.id} className="row-hover" onClick={()=>{setSel(c.id);setShowGmail(false);}}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===c.id&&!showGmail?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ minWidth:0 }}>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</span>
                  {c.category && <span style={{ fontSize:9, padding:"1px 4px", borderRadius:3, background:`${sc(c.category)}15`, color:sc(c.category), fontFamily:"var(--font-m)" }}>{c.category.replace(/_/g," ")}</span>}
                </div>
                <div style={{ fontSize:11, color:"var(--text-sec)", marginTop:2 }}>{c.co||c.headline||""}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                <ScoreBadge score={c.score}/>
                <RowActions onEdit={()=>setDrawer({mode:"edit",data:{...c}})} onDelete={()=>setConfirm({id:c.id,label:c.name})}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {showGmail ? (
          <div className="slide-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg>
                <span className="display" style={{ fontSize:18, fontWeight:700 }}>Gmail Intelligence — 30 Days</span>
              </div>
              <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={scanGmail} disabled={gmailState.loading}><RefreshCw size={12}/>Rescan</button>
            </div>
            {gmailState.loading && <div className="card" style={{ padding:44, textAlign:"center" }}><Loader size={30} className="spin" style={{ color:"var(--blue)", margin:"0 auto 16px" }}/><p style={{ fontSize:13, color:"var(--text-sec)" }}>CRM Agent scanning Gmail…</p></div>}
            {gmailState.error && <div className="card" style={{ padding:18, borderLeft:"3px solid var(--red)", marginBottom:14 }}><AlertCircle size={14} color="var(--red)"/><span style={{ fontSize:13, color:"var(--red)" }}>{gmailState.error}</span></div>}
            {!gmailState.loading && gmailState.synthesis && <div className="card" style={{ padding:16, marginBottom:18, borderLeft:"3px solid var(--blue)" }}><p style={{ fontSize:13, lineHeight:1.65 }}>{gmailState.synthesis}</p></div>}
            {!gmailState.loading && gmailState.signals.map((sig,i) => (
              <div key={i} className="card" style={{ padding:18, marginBottom:12, borderLeft:`3px solid var(${({"existing-customer":"--green","lead":"--blue","partner":"--purple","vendor":"--amber"})[sig.contactType]||"--text-sec"})`, opacity:sig.imported?0.55:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>{sig.contact?.name||"Unknown"}</span>
                      <Tag label={sig.contactType}/>{sig.imported&&<span className="mono" style={{ fontSize:10, color:"var(--green)" }}>✓ imported</span>}
                    </div>
                    <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{sig.contact?.role} · {sig.contact?.company} · {sig.date}</div>
                  </div>
                  <Tag label={sig.taskPriority||"medium"}/>
                </div>
                {sig.activitySummary&&<div style={{ padding:"8px 11px", background:"var(--bg-el)", borderRadius:6, fontSize:12, marginBottom:8, lineHeight:1.5 }}>{sig.activitySummary}</div>}
                {sig.taskGuidance&&<div style={{ padding:"10px 12px", background:"rgba(0,119,204,0.06)", border:"1px solid rgba(0,119,204,0.15)", borderRadius:6, marginBottom:10 }}><div className="mono" style={{ fontSize:9, color:"var(--blue)", marginBottom:5 }}>TASK · {sig.taskTitle}</div><p style={{ fontSize:12, lineHeight:1.6 }}>{sig.taskGuidance}</p></div>}
                <div style={{ display:"flex", gap:6 }}>
                  {!sig.imported ? <button className="btn btn-blue" style={{ fontSize:11, padding:"5px 10px" }} onClick={()=>importContact(sig)}><Plus size={11}/>Import Contact + Task</button>
                  : <span style={{ fontSize:11, color:"var(--green)", display:"flex", alignItems:"center", gap:4 }}><CheckCircle size={12}/>Imported</span>}
                </div>
              </div>
            ))}
          </div>
        ) : contact ? (
          <div className="slide-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{contact.name}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{contact.co} · {contact.role}</div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <Tag label={contact.category?.replace(/_/g," ")||"lead"} color={sc(contact.category)}/>
                <Tag label={contact.status}/><ScoreBadge score={contact.score}/>
                <button className="btn btn-ghost" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setDrawer({mode:"edit",data:{...contact}})}><Pencil size={12}/>Edit</button>
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

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
              {[{icon:Mail,val:contact.email},{icon:Phone,val:contact.phone},{icon:Calendar,val:`Last touch: ${contact.lastTouch}`},{icon:Building,val:contact.co}].map(({icon:I,val},i)=>(
                <div key={i} className="card-el" style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:9 }}><I size={13} color="var(--text-sec)"/><span style={{ fontSize:13 }}>{val||"—"}</span></div>
              ))}
              {contact.linkedin_url&&<a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="card-el" style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:9, textDecoration:"none", color:"var(--text)" }}><Linkedin size={13} color="#0A66C2"/><span style={{ fontSize:13, color:"#0A66C2" }}>LinkedIn Profile</span><ExternalLink size={10} color="var(--text-sec)" style={{marginLeft:"auto"}}/></a>}
              {contact.connected_date&&<div className="card-el" style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:9 }}><Calendar size={13} color="var(--text-sec)"/><span style={{ fontSize:13 }}>Connected: {contact.connected_date}</span></div>}
            </div>

            {contact.headline&&<div className="card-el" style={{ padding:14, marginBottom:12 }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:5 }}>HEADLINE</div><p style={{ fontSize:13, lineHeight:1.6 }}>{contact.headline}</p></div>}
            {contact.priority&&<div style={{ marginBottom:12 }}><span className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginRight:8 }}>PRIORITY</span><Tag label={contact.priority}/></div>}
            {contact.messaging_activity&&contact.messaging_activity!=="No messaging activity."&&<div className="card-el" style={{ padding:14, marginBottom:12, borderLeft:"3px solid var(--blue)" }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:5 }}>MESSAGING ACTIVITY</div><p style={{ fontSize:13, lineHeight:1.6 }}>{contact.messaging_activity}</p></div>}
            {contact.follow_up&&<div className="card-el" style={{ padding:14, marginBottom:12, borderLeft:"3px solid var(--green)" }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:5 }}>FOLLOW-UP RECOMMENDATION</div><p style={{ fontSize:13, lineHeight:1.6 }}>{contact.follow_up}</p></div>}
            {contact.notes&&<div className="card-el" style={{ padding:14, marginBottom:16 }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:5 }}>NOTES</div><p style={{ fontSize:13, lineHeight:1.6 }}>{contact.notes}</p></div>}

            {/* Related Tasks */}
            {contactTasks.length>0&&<div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>OPEN TASKS ({contactTasks.length})</div>
              {contactTasks.map(t=>(
                <div key={t.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:500 }}>{t.title}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>Due {t.due} · {t.category}</div></div>
                  <Tag label={t.priority}/>
                </div>
              ))}
            </div>}

            {/* Related Deals */}
            {contactDeals.length>0&&<div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>DEALS</div>
              {contactDeals.map(d=>(
                <div key={d.id} className="card-el" style={{ padding:14, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{ fontSize:13, fontWeight:600 }}>{d.name}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>Close {d.closeDate} · {d.probability}%</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ fontSize:15, fontWeight:700, color:"var(--blue)", fontFamily:"var(--font-d)" }}>{fmt(d.value)}</div><Tag label={d.stage}/></div>
                </div>
              ))}
            </div>}

            {/* Company News */}
            {contact.companyId && db.companyNews.filter(n=>n.companyId===contact.companyId).length>0 && (
              <div style={{ marginBottom:16 }}>
                <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>COMPANY NEWS</div>
                {db.companyNews.filter(n=>n.companyId===contact.companyId).slice(0,5).map(n=>(
                  <div key={n.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, borderLeft:"2px solid var(--blue)" }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>{n.headline}</div>
                    <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{n.published_date} · Relevance: {n.relevance_score}/10</div>
                    {n.summary && <p style={{ fontSize:11, color:"var(--text-sec)", marginTop:4 }}>{n.summary}</p>}
                  </div>
                ))}
              </div>
            )}

            <ActivityTimeline events={db.events} entityType="contact" entityId={contact.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Users size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a contact or scan Gmail</p>
          </div>
        )}
      </div>

      {drawer&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Contact`} onClose={()=>setDrawer(null)} onSave={save} saveLabel={drawer.mode==="add"?"Add Contact":"Save Changes"}>
        <ContactForm data={drawer.data} onChange={data=>setDrawer(d=>({...d,data}))} companies={db.companies}/>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
      {pasteMode&&(
        <div className="confirm-overlay" onClick={()=>setPasteMode(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:14, padding:28, width:"min(600px,92vw)", boxShadow:"var(--shadow-lg)", display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700 }}>Paste Gmail JSON from Claude</div>
            <textarea className="input" placeholder="Paste the JSON array…" value={pasteText} onChange={e=>setPasteText(e.target.value)} style={{ minHeight:180, fontSize:12, fontFamily:"var(--font-m)" }}/>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-blue" onClick={pasteImport} style={{ flex:1, justifyContent:"center" }} disabled={!pasteText.trim()}><Plus size={13}/>Load Contacts</button>
              <button className="btn btn-ghost" onClick={()=>{setPasteMode(false);setPasteText("");}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   COMPANIES — NEW VIEW
──────────────────────────────────────────────────────── */
const blankCompany = () => ({ name:"", industry:"", website:"", linkedin_url:"", news_keywords:"", status:"prospect", notes:"", created_at:today() });

const CompaniesView = ({ db, setDB, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if(focus?.type==="company" && focus.id) { setStatusFilter("all"); setSel(focus.id); setFocus(null); }
  }, [focus]);

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
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <div style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Companies</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setDrawer({mode:"add",data:blankCompany()})}><Plus size={12}/>Add</button>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
            {["all","prospect","customer","partner","churned"].map(s=>(
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
              <div key={c.id} className="row-hover" onClick={()=>setSel(c.id)}
                style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===c.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
                  <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{c.industry||"—"} · {contactCount} contacts</div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Tag label={c.status}/>
                  <RowActions onEdit={()=>setDrawer({mode:"edit",data:{...c}})} onDelete={()=>setConfirm({id:c.id,label:c.name})}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {company ? (
          <div className="slide-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{company.name}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{company.industry}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <Tag label={company.status}/>
                <button className="btn btn-ghost" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setDrawer({mode:"edit",data:{...company}})}><Pencil size={12}/>Edit</button>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:20 }}>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--blue)" }}>{companyContacts.length}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Contacts</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--amber)" }}>{companyDeals.length}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Deals</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--green)" }}>{fmt(companyDeals.reduce((a,d)=>a+d.value,0))}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Pipeline</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--purple)" }}>{companyTasks.filter(t=>!t.done).length}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Open Tasks</div></div>
            </div>

            {company.website && <div className="card-el" style={{ padding:"10px 14px", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}><Globe size={13} color="var(--text-sec)"/><a href={company.website.startsWith("http")?company.website:`https://${company.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:13, color:"var(--blue)" }}>{company.website}</a></div>}
            {company.linkedin_url && <div className="card-el" style={{ padding:"10px 14px", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}><Linkedin size={13} color="#0A66C2"/><a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:13, color:"#0A66C2" }}>LinkedIn Page</a></div>}
            {company.notes && <div className="card-el" style={{ padding:14, marginBottom:16 }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:5 }}>NOTES</div><p style={{ fontSize:13, lineHeight:1.6 }}>{company.notes}</p></div>}

            {companyContacts.length>0 && <div style={{ marginBottom:16 }}><div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>PEOPLE ({companyContacts.length})</div>
              {companyContacts.map(c=><div key={c.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}><div><div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{c.role} · {c.category?.replace(/_/g," ")}</div></div><div style={{ display:"flex", gap:6 }}><Tag label={c.status}/><ScoreBadge score={c.score}/></div></div>)}
            </div>}

            {companyDeals.length>0 && <div style={{ marginBottom:16 }}><div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>DEALS ({companyDeals.length})</div>
              {companyDeals.map(d=><div key={d.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between" }}><div><div style={{ fontSize:13, fontWeight:500 }}>{d.name}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{d.probability}% · Close {d.closeDate}</div></div><div style={{ textAlign:"right" }}><div style={{ fontFamily:"var(--font-d)", fontWeight:700, color:"var(--blue)" }}>{fmt(d.value)}</div><Tag label={d.stage}/></div></div>)}
            </div>}

            {companyNews.length>0 && <div style={{ marginBottom:16 }}><div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}><Newspaper size={11}/> NEWS</div>
              {companyNews.slice(0,5).map(n=><div key={n.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, borderLeft:"2px solid var(--blue)" }}><div style={{ fontSize:12, fontWeight:600 }}>{n.headline}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{n.published_date} · Score: {n.relevance_score}/10</div>{n.summary&&<p style={{ fontSize:11, color:"var(--text-sec)", marginTop:3 }}>{n.summary}</p>}</div>)}
            </div>}

            <ActivityTimeline events={db.events} entityType="company" entityId={company.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Building2 size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a company</p>
          </div>
        )}
      </div>

      {drawer&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Company`} onClose={()=>setDrawer(null)} onSave={save}>
        <Field label="Company Name"><Inp value={drawer.data.name} onChange={v=>setDrawer(d=>({...d,data:{...d.data,name:v}}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Industry"><Inp value={drawer.data.industry} onChange={v=>setDrawer(d=>({...d,data:{...d.data,industry:v}}))}/></Field>
          <Field label="Status"><Sel value={drawer.data.status} onChange={v=>setDrawer(d=>({...d,data:{...d.data,status:v}}))} options={["prospect","customer","partner","churned"]}/></Field>
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

const DealsView = ({ db, setDB, focus, setFocus }) => {
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankDeal());

  useEffect(() => {
    if(focus?.type==="deal" && focus.id) { const dl=db.deals.find(x=>x.id===focus.id); if(dl) { setD({...dl}); setDrawer("edit"); } setFocus(null); }
  }, [focus]);
  const STAGES = ["outreach","discovery","proposal","negotiation","at-risk","won","lost"];
  const stageColor = { outreach:"var(--text-sec)", discovery:"var(--purple)", proposal:"var(--blue)", negotiation:"var(--amber)", "at-risk":"var(--red)", won:"var(--green)", lost:"var(--text-sec)" };

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
            next = {...next, tasks:[...next.tasks, {id:nextId(next.tasks), title:`Re-engage: ${contact?.name||rec.name} (90 days post-loss)`, projectId:null, contactId:rec.contactId, companyId:rec.companyId, dealId:rec.id, due:reengageDate, done:false, priority:"medium", assignedTo:"CRM Agent", notes:`Deal "${rec.name}" was lost. Schedule re-engagement.`, status:"todo", category:"outreach", source:"orchestrator", recurrence:"none"}]};
            next = {...next, agentLogs:[{id:nextId(next.agentLogs), agent:"CRM Agent", type:"risk", message:`Deal lost: "${rec.name}". Re-engage task created for ${reengageDate}.`, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:"medium"}, ...next.agentLogs]};
          }
        }
        return next;
      });
    }
    setDrawer(null);
  };

  const del = (id) => { setDB(db=>({...db,deals:db.deals.filter(x=>x.id!==id)})); setConfirm(null); };

  // Deal velocity: flag deals stuck in a stage for 21+ days
  const staleDealIds = new Set();
  // We don't have stage_changed_at but we can flag based on close date proximity or notes

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Deals</div>
        <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setD(blankDeal());setDrawer("add");}}><Plus size={12}/>New Deal</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        <MetricCard icon={Target} label="Total Pipeline" value={fmt(db.deals.reduce((a,x)=>a+x.value,0))} color="--blue"/>
        <MetricCard icon={TrendingUp} label="Weighted" value={fmt(Math.round(db.deals.reduce((a,x)=>a+x.value*x.probability/100,0)))} color="--amber"/>
        <MetricCard icon={CheckCircle} label="Won" value={db.deals.filter(d=>d.stage==="won").length} sub={fmt(db.deals.filter(d=>d.stage==="won").reduce((a,d)=>a+d.value,0))} color="--green"/>
        <MetricCard icon={AlertCircle} label="At Risk" value={db.deals.filter(d=>d.stage==="at-risk").length} color="--red"/>
      </div>

      {/* Stage pipeline visual */}
      <div style={{ display:"flex", gap:4, padding:"8px 0" }}>
        {STAGES.filter(s=>s!=="won"&&s!=="lost").map(stage => {
          const stageDeals = db.deals.filter(d=>d.stage===stage);
          const total = stageDeals.reduce((a,d)=>a+d.value,0);
          return (
            <div key={stage} style={{ flex:1, padding:"8px 10px", background:`${stageColor[stage]}10`, borderRadius:8, borderTop:`3px solid ${stageColor[stage]}`, textAlign:"center" }}>
              <div className="mono" style={{ fontSize:9, color:stageColor[stage], marginBottom:4 }}>{stage.toUpperCase()}</div>
              <div style={{ fontSize:14, fontWeight:700, fontFamily:"var(--font-d)" }}>{stageDeals.length}</div>
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{fmt(total)}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {db.deals.map(deal=>{
          const contact = db.contacts.find(c=>c.id===deal.contactId);
          return (
            <div key={deal.id} className="card row-hover" style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:stageColor[deal.stage]||"var(--text-sec)", flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{deal.name}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{contact?.name||"—"} · Close {deal.closeDate} · {deal.probability}%</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700, color:"var(--blue)" }}>{fmt(deal.value)}</div>
                <Tag label={deal.stage}/>
              </div>
              <RowActions onEdit={()=>{setD({...deal,value:String(deal.value),probability:String(deal.probability),contactId:String(deal.contactId||""),companyId:String(deal.companyId||"")});setDrawer("edit");}} onDelete={()=>setConfirm({id:deal.id,label:deal.name})}/>
            </div>
          );
        })}
      </div>
      {drawer&&<Drawer title={drawer==="add"?"New Deal":"Edit Deal"} onClose={()=>setDrawer(null)} onSave={save}>
        <Field label="Deal Name"><Inp value={d.name} onChange={v=>setD(p=>({...p,name:v}))} placeholder="Client — Initiative"/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Contact"><Sel value={d.contactId} onChange={v=>setD(p=>({...p,contactId:v}))} options={[{value:"",label:"— none —"},...db.contacts.map(c=>({value:String(c.id),label:c.name}))]}/></Field>
          <Field label="Company"><Sel value={d.companyId} onChange={v=>setD(p=>({...p,companyId:v}))} options={[{value:"",label:"— none —"},...db.companies.map(c=>({value:String(c.id),label:c.name}))]}/></Field>
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

const MarketingView = ({ db, setDB }) => {
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankCampaign());
  const save = () => {
    const rec = { ...d, leads:parseInt(d.leads)||0, opens:parseInt(d.opens)||0, conversions:parseInt(d.conversions)||0 };
    if (drawer==="add") setDB(db=>({...db,campaigns:[...db.campaigns,{...rec,id:nextId(db.campaigns)}]}));
    else setDB(db=>({...db,campaigns:db.campaigns.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };
  const del = (id) => { setDB(db=>({...db,campaigns:db.campaigns.filter(x=>x.id!==id)})); setConfirm(null); };
  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Marketing</div>
        <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setD(blankCampaign());setDrawer("add");}}><Plus size={12}/>New Campaign</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        <MetricCard icon={Megaphone} label="Active" value={db.campaigns.filter(c=>c.status==="active").length} color="--amber"/>
        <MetricCard icon={Users} label="Total Leads" value={db.campaigns.reduce((a,c)=>a+c.leads,0)} color="--blue" trend={22}/>
        <MetricCard icon={TrendingUp} label="Conversions" value={db.campaigns.reduce((a,c)=>a+c.conversions,0)} color="--green"/>
      </div>
      {db.campaigns.map(c=>(
        <div key={c.id} className="card row-hover" style={{ padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div><div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{c.type} · {c.startDate}</div></div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}><Tag label={c.status}/><RowActions onEdit={()=>{setD({...c,leads:String(c.leads),opens:String(c.opens),conversions:String(c.conversions)});setDrawer("edit");}} onDelete={()=>setConfirm({id:c.id,label:c.name})}/></div>
          </div>
          <div style={{ display:"flex", gap:24 }}>
            {[["Leads",c.leads],["Impressions",c.opens],["Conversions",c.conversions]].map(([l,v])=>(
              <div key={l}><div className="mono" style={{ fontSize:18, fontWeight:600 }}>{(v||0).toLocaleString()}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>{l}</div></div>
            ))}
          </div>
        </div>
      ))}
      {drawer&&<Drawer title={drawer==="add"?"New Campaign":"Edit Campaign"} onClose={()=>setDrawer(null)} onSave={save}>
        <Field label="Campaign Name"><Inp value={d.name} onChange={v=>setD(p=>({...p,name:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Type"><Sel value={d.type} onChange={v=>setD(p=>({...p,type:v}))} options={["Email","Social","Referral","Paid","Event","Other"]}/></Field>
          <Field label="Status"><Sel value={d.status} onChange={v=>setD(p=>({...p,status:v}))} options={["draft","active","paused","complete"]}/></Field>
          <Field label="Start Date"><Inp type="date" value={d.startDate} onChange={v=>setD(p=>({...p,startDate:v}))}/></Field>
          <Field label="Leads"><Inp type="number" value={d.leads} onChange={v=>setD(p=>({...p,leads:v}))}/></Field>
          <Field label="Impressions"><Inp type="number" value={d.opens} onChange={v=>setD(p=>({...p,opens:v}))}/></Field>
          <Field label="Conversions"><Inp type="number" value={d.conversions} onChange={v=>setD(p=>({...p,conversions:v}))}/></Field>
        </div>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   OPERATIONS — Projects + RELATIONAL TASKS with Filters
──────────────────────────────────────────────────────── */
const blankProject = () => ({ name:"", client:"", companyId:"", status:"active", progress:0, dueDate:"", priority:"medium", notes:"" });
const blankTask = () => ({ title:"", projectId:"", contactId:"", companyId:"", dealId:"", due:"", done:false, priority:"medium", assignedTo:"", notes:"", status:"todo", category:"follow_up", source:"manual", recurrence:"none" });

const OperationsView = ({ db, setDB, focus, setFocus }) => {
  const [tab, setTab] = useState("tasks");
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pd, setPD] = useState(blankProject());
  const [td, setTD] = useState(blankTask());

  // Task filters
  const [fStatus, setFStatus] = useState("open"); // open = not done/cancelled
  const [fPriority, setFPriority] = useState("all");
  const [fCategory, setFCategory] = useState("all");
  const [fCompany, setFCompany] = useState("all");
  const [fPerson, setFPerson] = useState("all");
  const [fProject, setFProject] = useState("all");
  const [sortBy, setSortBy] = useState("due"); // due, priority, company, person
  const [groupBy, setGroupBy] = useState("none"); // none, project, company, person, status

  useEffect(() => {
    if(focus?.type==="task" && focus.id) { setTab("tasks"); setFStatus("all"); const t=db.tasks.find(t=>t.id===focus.id); if(t) { setTD({...t}); setDrawer({mode:"edit",type:"task"}); } setFocus(null); }
    if(focus?.type==="project" && focus.id) { setTab("projects"); const p=db.projects.find(p=>p.id===focus.id); if(p) { setPD({...p}); setDrawer({mode:"edit",type:"project"}); } setFocus(null); }
  }, [focus]);

  const filteredTasks = useMemo(() => {
    let tasks = db.tasks;
    if (fStatus === "open") tasks = tasks.filter(t => !t.done && t.status !== "done" && t.status !== "cancelled");
    else if (fStatus !== "all") tasks = tasks.filter(t => t.status === fStatus);
    if (fPriority !== "all") tasks = tasks.filter(t => t.priority === fPriority);
    if (fCategory !== "all") tasks = tasks.filter(t => t.category === fCategory);
    if (fCompany !== "all") tasks = tasks.filter(t => String(t.companyId) === fCompany);
    if (fPerson !== "all") tasks = tasks.filter(t => String(t.contactId) === fPerson);
    if (fProject !== "all") tasks = tasks.filter(t => String(t.projectId) === fProject);

    const priOrder = { critical:0, high:1, medium:2, low:3 };
    tasks = [...tasks].sort((a,b) => {
      if (sortBy === "due") return (a.due||"9999").localeCompare(b.due||"9999");
      if (sortBy === "priority") return (priOrder[a.priority]||9) - (priOrder[b.priority]||9);
      return 0;
    });
    return tasks;
  }, [db.tasks, fStatus, fPriority, fCategory, fCompany, fPerson, fProject, sortBy]);

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

  const saveProject = (d) => {
    const rec = {...d, progress:parseInt(d.progress)||0, companyId:parseInt(d.companyId)||null};
    if(drawer.mode==="add") setDB(db=>({...db,projects:[...db.projects,{...rec,id:nextId(db.projects)}]}));
    else setDB(db=>({...db,projects:db.projects.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };
  const saveTask = (d) => {
    const rec = {...d, projectId:parseInt(d.projectId)||null, contactId:parseInt(d.contactId)||null, companyId:parseInt(d.companyId)||null, dealId:parseInt(d.dealId)||null};
    if(drawer.mode==="add") setDB(db=>({...db,tasks:[...db.tasks,{...rec,id:nextId(db.tasks)}]}));
    else setDB(db=>({...db,tasks:db.tasks.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };
  const delProject = (id) => { setDB(db=>({...db,projects:db.projects.filter(x=>x.id!==id)})); setConfirm(null); };
  const delTask = (id) => { setDB(db=>({...db,tasks:db.tasks.filter(x=>x.id!==id)})); setConfirm(null); };
  const toggleTask = (id) => setDB(db=>({...db,tasks:db.tasks.map(t=>t.id===id?{...t,done:!t.done,status:t.done?"todo":"done"}:t)}));

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Operations</div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ display:"flex", background:"var(--bg-el)", borderRadius:8, padding:3 }}>
            {["tasks","projects"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding:"5px 12px", borderRadius:6, border:"none", fontSize:12, fontWeight:500, cursor:"pointer", background:tab===t?"#fff":"transparent", color:tab===t?"var(--text)":"var(--text-sec)", boxShadow:tab===t?"var(--shadow)":"none" }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
          {tab==="projects"
            ? <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setPD(blankProject());setDrawer({mode:"add",type:"project"});}}><Plus size={12}/>Project</button>
            : <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setTD(blankTask());setDrawer({mode:"add",type:"task"});}}><Plus size={12}/>Task</button>
          }
        </div>
      </div>

      {tab==="tasks" && (
        <>
          {/* FILTER BAR */}
          <div className="card" style={{ padding:"10px 14px" }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", marginBottom:8 }}>
              <Filter size={12} color="var(--text-sec)"/>
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
              <select className="filter-select" value={fCompany} onChange={e=>setFCompany(e.target.value)}>
                <option value="all">Any Company</option>
                {db.companies.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
              <select className="filter-select" value={fPerson} onChange={e=>setFPerson(e.target.value)}>
                <option value="all">Any Person</option>
                {db.contacts.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
              <select className="filter-select" value={fProject} onChange={e=>setFProject(e.target.value)}>
                <option value="all">Any Project</option>
                {db.projects.map(p=><option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <SortAsc size={12} color="var(--text-sec)"/>
              <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>Sort:</span>
              {["due","priority"].map(s=>(<button key={s} className={`filter-chip${sortBy===s?" active":""}`} onClick={()=>setSortBy(s)}>{s}</button>))}
              <span className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginLeft:12 }}>Group:</span>
              {["none","project","company","person","status"].map(g=>(<button key={g} className={`filter-chip${groupBy===g?" active":""}`} onClick={()=>setGroupBy(g)}>{g}</button>))}
              <span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>{filteredTasks.length} tasks</span>
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
                  <div key={t.id} className="card-el row-hover" style={{ padding:"12px 14px", display:"flex", gap:12, alignItems:"flex-start", opacity:t.done?0.55:1, marginBottom:6, borderLeft:isOverdue?"3px solid var(--red)":t.priority==="critical"?"3px solid var(--red)":undefined }}>
                    <button onClick={()=>toggleTask(t.id)} style={{ width:18, height:18, borderRadius:4, border:`2px solid ${t.done?"var(--green)":"var(--border-hi)"}`, background:t.done?"var(--green)":"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
                      {t.done&&<Check size={11} color="#fff"/>}
                    </button>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, textDecoration:t.done?"line-through":"none", color:t.done?"var(--text-sec)":"var(--text)" }}>{t.title}</div>
                      <div style={{ display:"flex", gap:6, marginTop:4, alignItems:"center", flexWrap:"wrap" }}>
                        {t.due&&<span className="mono" style={{ fontSize:10, color:isOverdue?"var(--red)":"var(--text-sec)" }}>{isOverdue?"OVERDUE ":""}Due {t.due}</span>}
                        <Tag label={t.priority}/>
                        <Tag label={t.category?.replace(/_/g," ")||"task"} color="var(--purple)"/>
                        {t.status && t.status !== "todo" && t.status !== "done" && <Tag label={t.status.replace(/_/g," ")}/>}
                        {contact&&<span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>👤 {contact.name}</span>}
                        {company&&<span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>🏢 {company.name}</span>}
                        {project&&<span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>📁 {project.name}</span>}
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

      {tab==="projects" && db.projects.map(p=>(
        <div key={p.id} className="card row-hover" style={{ padding:16, borderLeft:`3px solid ${sc(p.status)}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div><div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{p.client} · Due {p.dueDate}</div></div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}><Tag label={p.priority}/><Tag label={p.status}/><RowActions onEdit={()=>{setPD({...p,progress:String(p.progress),companyId:String(p.companyId||"")});setDrawer({mode:"edit",type:"project"});}} onDelete={()=>setConfirm({id:p.id,label:p.name,type:"project"})}/></div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1, height:5, background:"var(--bg-el)", borderRadius:3 }}>
              <div style={{ height:"100%", width:`${p.progress}%`, background:p.progress<40?"var(--red)":p.progress<70?"var(--amber)":"var(--green)", borderRadius:3, transition:"width .5s" }}/>
            </div>
            <span className="mono" style={{ fontSize:11, color:"var(--text-sec)", flexShrink:0 }}>{p.progress}%</span>
          </div>
          {p.notes&&<p style={{ fontSize:12, color:"var(--text-sec)", marginTop:10, lineHeight:1.5 }}>{p.notes}</p>}
        </div>
      ))}

      {drawer?.type==="project"&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Project`} onClose={()=>setDrawer(null)} onSave={()=>saveProject(pd)}>
        <Field label="Project Name"><Inp value={pd.name} onChange={v=>setPD(p=>({...p,name:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Client"><Inp value={pd.client} onChange={v=>setPD(p=>({...p,client:v}))}/></Field>
          <Field label="Company"><Sel value={pd.companyId||""} onChange={v=>setPD(p=>({...p,companyId:v}))} options={[{value:"",label:"— none —"},...db.companies.map(c=>({value:String(c.id),label:c.name}))]}/></Field>
          <Field label="Status"><Sel value={pd.status} onChange={v=>setPD(p=>({...p,status:v}))} options={["active","stalled","complete","on-hold"]}/></Field>
          <Field label="Priority"><Sel value={pd.priority} onChange={v=>setPD(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
          <Field label="Progress (%)"><Inp type="number" value={pd.progress} onChange={v=>setPD(p=>({...p,progress:v}))}/></Field>
          <Field label="Due Date"><Inp type="date" value={pd.dueDate} onChange={v=>setPD(p=>({...p,dueDate:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={pd.notes} onChange={v=>setPD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}

      {drawer?.type==="task"&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Task`} onClose={()=>setDrawer(null)} onSave={()=>saveTask(td)}>
        <Field label="Task Title"><Inp value={td.title} onChange={v=>setTD(p=>({...p,title:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Status"><Sel value={td.status} onChange={v=>setTD(p=>({...p,status:v}))} options={TASK_STATUSES.map(s=>({value:s,label:s.replace(/_/g," ")}))}/></Field>
          <Field label="Priority"><Sel value={td.priority} onChange={v=>setTD(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
          <Field label="Category"><Sel value={td.category} onChange={v=>setTD(p=>({...p,category:v}))} options={TASK_CATEGORIES.map(c=>({value:c,label:c.replace(/_/g," ")}))}/></Field>
          <Field label="Due Date"><Inp type="date" value={td.due} onChange={v=>setTD(p=>({...p,due:v}))}/></Field>
          <Field label="Person"><Sel value={td.contactId} onChange={v=>setTD(p=>({...p,contactId:v}))} options={[{value:"",label:"— none —"},...db.contacts.map(c=>({value:String(c.id),label:c.name}))]}/></Field>
          <Field label="Company"><Sel value={td.companyId} onChange={v=>setTD(p=>({...p,companyId:v}))} options={[{value:"",label:"— none —"},...db.companies.map(c=>({value:String(c.id),label:c.name}))]}/></Field>
          <Field label="Project"><Sel value={td.projectId} onChange={v=>setTD(p=>({...p,projectId:v}))} options={[{value:"",label:"— none —"},...db.projects.map(x=>({value:String(x.id),label:x.name}))]}/></Field>
          <Field label="Deal"><Sel value={td.dealId} onChange={v=>setTD(p=>({...p,dealId:v}))} options={[{value:"",label:"— none —"},...db.deals.map(x=>({value:String(x.id),label:x.name}))]}/></Field>
          <Field label="Assigned To"><Inp value={td.assignedTo} onChange={v=>setTD(p=>({...p,assignedTo:v}))}/></Field>
          <Field label="Source"><Sel value={td.source} onChange={v=>setTD(p=>({...p,source:v}))} options={["manual","orchestrator","news_engine","gmail_scan","ai_sweep"]}/></Field>
        </div>
        <Field label="Notes"><Tex value={td.notes} onChange={v=>setTD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>confirm.type==="project"?delProject(confirm.id):delTask(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   BILLING — INVOICES (mostly unchanged)
──────────────────────────────────────────────────────── */
const blankInvoice = () => ({ number:"", client:"", amount:0, status:"draft", issued:"", due:"", notes:"" });

const BillingView = ({ db, setDB, focus, setFocus }) => {
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
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Billing</div>
        <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setD(blankInvoice());setDrawer("add");}}><Plus size={12}/>New Invoice</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        <MetricCard icon={CheckCircle} label="Collected" value={fmt(paid)} color="--green"/>
        <MetricCard icon={Clock} label="Pending" value={fmt(pending)} color="--amber"/>
        <MetricCard icon={AlertCircle} label="Overdue" value={fmt(overdue)} color="--red"/>
        <MetricCard icon={TrendingUp} label="ARR Run Rate" value={fmt(Math.round(paid*12/3))} sub={`toward ${fmt(db.goals[0]?.target_value||800000)}`} color="--blue"/>
      </div>
      {overdue>0&&<div className="card" style={{ padding:16, borderLeft:"3px solid var(--red)" }}>
        <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:6 }}><AlertCircle size={14} color="var(--red)"/><span style={{ fontSize:12, fontWeight:700, color:"var(--red)" }}>BILLING AGENT ALERT</span></div>
        <p style={{ fontSize:13, lineHeight:1.5 }}>{db.invoices.filter(i=>i.status==="overdue").length} invoices totaling {fmt(overdue)} overdue. Escalation recommended.</p>
      </div>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {db.invoices.map(inv=>(
          <div key={inv.id} className="card row-hover" style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}><span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{inv.number}</span><span style={{ fontSize:13, fontWeight:600 }}>{inv.client}</span></div>
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
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
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
    ...criticalTasks.map(t => ({ key:`task-${t.id}`, isTask:true, icon:"🔴", label:t.title, detail:`Due ${t.due} · Critical`, priority:"critical", nav:{view:"operations",focus:{type:"task",id:t.id}} })),
    ...overdueInv.map(i => ({ key:`inv-${i.id}`, isTask:false, icon:"💰", label:`${i.number} — ${i.client} — ${fmt(i.amount)} OVERDUE`, detail:`Due ${i.due}`, priority:"critical", nav:{view:"billing",focus:{type:"invoice",id:i.id}}, taskTitle:`Follow up on overdue invoice ${i.number} — ${i.client} (${fmt(i.amount)})`, taskPriority:"critical", contactId:null, companyId:null })),
    ...atRiskC.map(c => ({ key:`risk-${c.id}`, isTask:false, icon:"⚠️", label:`${c.name} (${c.co}) is at-risk`, detail:`Score: ${c.score}. Last touch: ${c.lastTouch}`, priority:"critical", nav:{view:"crm",focus:{type:"contact",id:c.id}}, taskTitle:`Re-engage at-risk contact: ${c.name} (${c.co})`, taskPriority:"high", contactId:c.id, companyId:c.companyId||null })),
    ...highTasks.filter(t=>t.due && t.due <= today()).map(t => ({ key:`task-${t.id}`, isTask:true, icon:"🟡", label:t.title, detail:`Due today or overdue`, priority:"high", nav:{view:"operations",focus:{type:"task",id:t.id}} })),
    ...decayedContacts.slice(0,3).map(c => ({ key:`decay-${c.id}`, isTask:false, icon:"📞", label:`Reconnect: ${c.name} (${c.co})`, detail:`${daysBetween(c.lastTouch, today())} days since last touch. Score: ${c.score}`, priority:"medium", nav:{view:"crm",focus:{type:"contact",id:c.id}}, taskTitle:`Reconnect with ${c.name} (${c.co})`, taskPriority:"medium", contactId:c.id, companyId:c.companyId||null })),
    ...engagementRecs.slice(0,3).map((r,i) => ({ key:`eng-${i}`, isTask:false, icon:"💡", label:r.message, detail:`Source: ${r.source}`, priority:r.priority, nav:r.contactId?{view:"crm",focus:{type:"contact",id:r.contactId}}:null, taskTitle:r.message.substring(0,120), taskPriority:r.priority==="high"?"high":"medium", contactId:r.contactId||null, companyId:null })),
  ];
  const dailyPriorities = allPriorities.filter(p => !dismissed[p.key]);

  const convertToTask = (p) => {
    const newTask = { id:nextId(db.tasks), title:p.taskTitle, due:today(), done:false, priority:p.taskPriority||"medium", status:"done", category:"follow_up", contactId:p.contactId||null, companyId:p.companyId||null, dealId:null, projectId:null, assignedTo:"", notes:`Completed from Orchestrator priority on ${today()}.`, source:"orchestrator", recurrence:"none" };
    setDB(d=>({...d, tasks:[...d.tasks, newTask]}));
    setDismissed(d=>({...d,[p.key]:true}));
  };
  const snoozeItem = (p, newDate) => {
    const newTask = { id:nextId(db.tasks), title:p.taskTitle||p.label, due:newDate, done:false, priority:p.taskPriority||"medium", status:"todo", category:"follow_up", contactId:p.contactId||null, companyId:p.companyId||null, dealId:null, projectId:null, assignedTo:"", notes:`Snoozed from Orchestrator priority. Original: ${p.label}`, source:"orchestrator", recurrence:"none" };
    setDB(d=>({...d, tasks:[...d.tasks, newTask]}));
    setDismissed(d=>({...d,[p.key]:true}));
    setSnoozing(null);
  };
  const dismissItem = (p) => setDismissed(d=>({...d,[p.key]:true}));

  const liveAlerts = [
    ...overdueInv.map(i => ({ id:`ov-${i.id}`, agent:"Billing Agent", type:"alert", priority:"critical", message:`${i.number} — ${i.client} — ${fmt(i.amount)} OVERDUE (due ${i.due}).`, nav:{view:"billing",focus:{type:"invoice",id:i.id}} })),
    ...atRiskC.map(c => ({ id:`ar-${c.id}`, agent:"CRM Agent", type:"risk", priority:"critical", message:`${c.name} (${c.co}) at-risk. Score: ${c.score}/100. Last touch: ${c.lastTouch}.`, nav:{view:"crm",focus:{type:"contact",id:c.id}} })),
    ...criticalTasks.map(t => ({ id:`ct-${t.id}`, agent:"Ops Agent", type:"task", priority:"critical", message:`CRITICAL: "${t.title}" — due ${t.due}.`, nav:{view:"operations",focus:{type:"task",id:t.id}} })),
    ...stalledProj.map(p => ({ id:`sp-${p.id}`, agent:"Ops Agent", type:"risk", priority:"high", message:`Project stalled: "${p.name}" (${p.client}) — ${p.progress}%.`, nav:{view:"operations",focus:{type:"project",id:p.id}} })),
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
        contacts: db.contacts.map(c=>({name:c.name,co:c.co,status:c.status,category:c.category,score:c.score,lastTouch:c.lastTouch,follow_up:c.follow_up})),
        deals: db.deals.map(d=>({name:d.name,value:d.value,stage:d.stage,probability:d.probability,closeDate:d.closeDate,notes:d.notes})),
        projects: db.projects.map(p=>({name:p.name,client:p.client,status:p.status,progress:p.progress})),
        tasks: openTasks.map(t=>({title:t.title,due:t.due,priority:t.priority,category:t.category,contactId:t.contactId})),
        invoices: db.invoices.filter(i=>i.status!=="paid").map(i=>({client:i.client,amount:i.amount,status:i.status,due:i.due})),
        metrics: { paidYTD, weightedPipeline:weightedPipe, totalPipeline:totalPipe, overdueAR, revenueGap, pipelineCoverage, openTasks:openTasks.length, decayedContacts:decayedContacts.length },
      };
      const msg = await callClaude(
        `You are Mendy Ezagui's Orchestrator Agent. He's an independent AI ops consultant targeting property management/HOA. Revenue target: ${fmt(goal.target_value)}. Be specific — name names, cite numbers. One tight paragraph, max 4 sentences.`,
        `Live snapshot — ${today()}:\n${JSON.stringify(snap,null,2)}\n\nSurface the single most important thing RIGHT NOW. What's at stake and what exactly should he do today?`,
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
      const companiesWithKeywords = db.companies.filter(c => c.name);
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
            newTasks.push({ id:taskId, title:`News: ${item.suggested_action.substring(0,80)}`, projectId:null, contactId:contact?.id||null, companyId:company.id, dealId:null, due:new Date(Date.now()+3*86400000).toISOString().split("T")[0], done:false, priority:item.action_priority||"medium", assignedTo:"CRM Agent", notes:`News: "${item.headline}"\n${item.summary}\n\nSuggested action: ${item.suggested_action}`, status:"todo", category:"outreach", source:"news_engine", recurrence:"none" });
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

      {/* Daily Priorities */}
      {dailyPriorities.length > 0 && (
        <div className="card" style={{ padding:18, borderLeft:"4px solid var(--purple)" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
            <Sparkles size={14} color="var(--purple)"/>
            <span style={{ fontFamily:"var(--font-d)", fontSize:14, fontWeight:700, color:"var(--purple)" }}>Daily Priorities</span>
            <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{dailyPriorities.length} items · auto-generated</span>
          </div>
          {dailyPriorities.slice(0,8).map((p,i) => (
            <div key={p.key} className="row-hover" style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"6px 4px", borderBottom:i<Math.min(dailyPriorities.length,8)-1?"1px solid var(--border)":"none", borderRadius:4, transition:"background .15s", position:"relative" }}>
              <span style={{ fontSize:13, flexShrink:0, cursor:p.nav?"pointer":"default" }} onClick={()=>p.nav&&navigate(p.nav.view,p.nav.focus)}>{p.icon}</span>
              <div style={{ flex:1, cursor:p.nav?"pointer":"default", minWidth:0 }} onClick={()=>p.nav&&navigate(p.nav.view,p.nav.focus)}>
                <div style={{ fontSize:12, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.label}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{p.detail}</div>
              </div>
              <Tag label={p.priority}/>
              {/* Action buttons for non-task items */}
              {p.isTask ? (
                <ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0,marginTop:2,cursor:"pointer"}} onClick={()=>p.nav&&navigate(p.nav.view,p.nav.focus)}/>
              ) : (
                <div className="row-actions" style={{ display:"flex", gap:2, opacity:0, transition:"opacity .15s", flexShrink:0 }}>
                  {snoozing===p.key ? (
                    <div style={{ display:"flex", gap:4, alignItems:"center" }} onClick={e=>e.stopPropagation()}>
                      {[{label:"Tomorrow",d:1},{label:"+3d",d:3},{label:"+7d",d:7}].map(opt=>(
                        <button key={opt.d} className="btn btn-ghost" style={{ padding:"2px 6px", fontSize:10, lineHeight:1 }} onClick={(e)=>{e.stopPropagation();const nd=new Date();nd.setDate(nd.getDate()+opt.d);snoozeItem(p,nd.toISOString().split("T")[0]);}}>
                          {opt.label}
                        </button>
                      ))}
                      <button className="btn-icon" style={{ width:20, height:20 }} onClick={(e)=>{e.stopPropagation();setSnoozing(null);}}><X size={10}/></button>
                    </div>
                  ) : (
                    <>
                      <button title="Mark complete" className="btn-icon" style={{ width:24, height:24 }} onClick={(e)=>{e.stopPropagation();convertToTask(p);}}><CheckCircle size={12} color="var(--green)"/></button>
                      <button title="Snooze" className="btn-icon" style={{ width:24, height:24 }} onClick={(e)=>{e.stopPropagation();setSnoozing(p.key);}}><Calendar size={12} color="var(--blue)"/></button>
                      <button title="Dismiss" className="btn-icon delete" style={{ width:24, height:24 }} onClick={(e)=>{e.stopPropagation();dismissItem(p);}}><X size={12}/></button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

      {/* Metrics strip */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[
          { label:"YTD Collected", val:fmt(paidYTD), color:"var(--green)" },
          { label:"Wtd Pipeline", val:fmt(weightedPipe), color:"var(--blue)" },
          { label:"Pipeline Coverage", val:`${pipelineCoverage}%`, color:pipelineCoverage>=80?"var(--green)":pipelineCoverage>=40?"var(--amber)":"var(--red)" },
          { label:"Overdue A/R", val:fmt(overdueAR), color:"var(--red)" },
          { label:"Revenue Gap", val:fmt(revenueGap), color:"var(--amber)" },
          { label:"Critical Items", val:criticalTasks.length+atRiskC.length+stalledProj.length, color:"var(--red)" },
        ].map(m=>(
          <div key={m.label} className="card-el" style={{ padding:"8px 14px", display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontFamily:"var(--font-d)", fontWeight:700, fontSize:15, color:m.color }}>{m.val}</span>
            <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{m.label}</span>
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
const VoiceView = ({ db, setDB }) => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [proposals, setProposals] = useState(null); // AI-proposed operations
  const [selected, setSelected] = useState({}); // { index: true/false }
  const [committed, setCommitted] = useState(null); // after commit
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [history, setHistory] = useState([]);
  const recRef = useRef(null);
  const start = () => {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setTranscript("Speech recognition not available in this browser.");return;}
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=e=>{let t="";for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;setTranscript(t);};
    r.start();recRef.current=r;setRecording(true);
  };
  const stop = () => {recRef.current?.stop();setRecording(false);};

  const buildContext = () => {
    const contacts = (db.contacts||[]).map(c=>`[Contact id:${c.id}] ${c.name} — ${c.co||""} — ${c.role||""} (category:${c.category||"none"}, score:${c.score||0})`).join("\n");
    const companies = (db.companies||[]).map(c=>`[Company id:${c.id}] ${c.name} — ${c.industry||""} (status:${c.status||"prospect"})`).join("\n");
    const deals = (db.deals||[]).map(d=>`[Deal id:${d.id}] ${d.name} — $${d.value} — stage:${d.stage} (prob:${d.probability}%)`).join("\n");
    const projects = (db.projects||[]).map(p=>`[Project id:${p.id}] ${p.name} — status:${p.status} (progress:${p.progress}%)`).join("\n");
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
            const t = { id: nextId(d.tasks||[]), ...op.data };
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
   EMAIL LAB
──────────────────────────────────────────────────────── */
const EmailView = ({ db, setDB }) => {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const parse = async () => {
    if(!email.trim())return;
    setLoading(true);
    try {
      const raw = await callClaude("You are Mendy's CRM Agent. Parse email and return JSON: {\"from\":\"\",\"company\":\"\",\"sentiment\":\"positive|neutral|negative\",\"urgency\":\"high|medium|low\",\"summary\":\"\",\"entities\":{\"people\":[],\"companies\":[],\"amounts\":[],\"dates\":[]},\"actions\":[],\"opportunities\":[],\"module\":\"crm|marketing|operations|billing\",\"suggestedResponse\":\"\"}",`Email:\n${email}`,800);
      try{setResult(JSON.parse(raw));}catch{setResult({summary:raw,entities:{},actions:[],opportunities:[]});}
    }catch{setResult({summary:"Error.",entities:{},actions:[],opportunities:[]});}
    setLoading(false);
  };
  return (
    <div style={{ padding:24, maxWidth:640, display:"flex", flexDirection:"column", gap:20 }}>
      <div className="display" style={{ fontSize:18, fontWeight:700 }}>Email Lab</div>
      <div className="card" style={{ padding:20 }}>
        <textarea className="input" placeholder="Paste email content…" value={email} onChange={e=>setEmail(e.target.value)} style={{ minHeight:160, marginBottom:12 }}/>
        <button className="btn btn-blue" onClick={parse} disabled={!email.trim()||loading} style={{ width:"100%", justifyContent:"center", opacity:(!email.trim()||loading)?0.5:1 }}>
          {loading?<><Loader size={13} className="spin"/>Parsing…</>:<><Brain size={13}/>Parse & Extract</>}
        </button>
      </div>
      {result&&<div className="card slide-in" style={{ padding:20 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:14 }}>
          <span style={{ fontSize:13, fontWeight:600, color:"var(--blue)" }}>Email Intelligence</span>
          {result.sentiment&&<Tag label={result.sentiment}/>}
          {result.urgency&&<Tag label={`${result.urgency} urgency`}/>}
          {result.module&&<Tag label={`→ ${result.module}`} color="var(--purple)"/>}
        </div>
        {result.summary&&<p style={{ fontSize:13, lineHeight:1.6, marginBottom:14 }}>{result.summary}</p>}
        {result.entities&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {Object.entries(result.entities).map(([k,v])=>Array.isArray(v)&&v.length>0&&(
            <div key={k} className="card-el" style={{ padding:"11px 13px" }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:5 }}>{k.toUpperCase()}</div>{v.map((x,i)=><div key={i} style={{ fontSize:12 }}>· {x}</div>)}</div>
          ))}
        </div>}
        {result.actions?.length>0&&<div style={{ marginBottom:12 }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:6 }}>ACTIONS</div>{result.actions.map((a,i)=><div key={i} className="card-el" style={{ padding:"9px 12px", marginBottom:6, fontSize:13 }}><Zap size={12} color="var(--amber)"/>{a}</div>)}</div>}
        {result.suggestedResponse&&<div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:6 }}>SUGGESTED RESPONSE</div><div className="card-el" style={{ padding:13, fontSize:13, lineHeight:1.6, borderLeft:"2px solid var(--blue)" }}>{result.suggestedResponse}</div></div>}
      </div>}
    </div>
  );
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
   APP ROOT
──────────────────────────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState(undefined);
  const [db, setDB] = useState(null);
  const [view, setView] = useState("dashboard");
  const [focus, setFocus] = useState(null); // {type:"task"|"contact"|"deal"|"invoice"|"project"|"company", id:number}
  const navigate = (targetView, focusTarget) => { setView(targetView); if(focusTarget) setFocus(focusTarget); };
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 768);
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

  const alerts = (db.agentLogs||[]).filter(l => l.priority === "critical").length;
  const VIEWS = {
    dashboard:    <Dashboard db={db} setDB={setDB} setView={setView} navigate={navigate}/>,
    orchestrator: <OrchestratorView db={db} setDB={setDB} navigate={navigate}/>,
    crm:          <CRMView db={db} setDB={setDB} setView={setView} focus={focus} setFocus={setFocus}/>,
    companies:    <CompaniesView db={db} setDB={setDB} focus={focus} setFocus={setFocus}/>,
    deals:        <DealsView db={db} setDB={setDB} focus={focus} setFocus={setFocus}/>,
    marketing:    <MarketingView db={db} setDB={setDB}/>,
    operations:   <OperationsView db={db} setDB={setDB} focus={focus} setFocus={setFocus}/>,
    billing:      <BillingView db={db} setDB={setDB} focus={focus} setFocus={setFocus}/>,
    voice:        <VoiceView db={db} setDB={setDB}/>,
    email:        <EmailView db={db} setDB={setDB}/>,
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
                onClick={()=>setView("orchestrator")}>{alerts} CRITICAL</div>
            )}
            <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", background:"var(--bg-el)", padding:"4px 10px", borderRadius:6 }}>
              {session.user.email?.split("@")[0]?.toUpperCase() || "ME"}
            </div>
            <button className="btn btn-ghost" style={{ padding:"4px 10px", fontSize:11 }} onClick={()=>supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {!mobile && <Sidebar view={view} setView={setView} collapsed={collapsed} setCollapsed={setCollapsed} alerts={alerts}/>}
          <main style={{ flex:1, overflowY:"auto" }}>{VIEWS[view] || VIEWS.dashboard}</main>
        </div>
        {mobile && <BottomNav view={view} setView={setView}/>}
      </div>
    </>
  );
}
