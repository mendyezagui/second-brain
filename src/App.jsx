import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Brain, Users, Megaphone, Briefcase, DollarSign, Mic, Mail,
  TrendingUp, AlertCircle, CheckCircle, Clock, Plus, Zap, Target,
  Phone, Building, Search, BarChart2, Calendar, Loader, Shield,
  ChevronRight, Eye, MicOff, ArrowUp, ArrowDown, Inbox, RefreshCw,
  FileText, Trash2, Pencil, X, Save, MoreVertical, Check
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
  `}</style>
);

/* ── SEED DATA ── */
const initDB = () => ({
  contacts: [
    { id:1, name:"Dave Scott", co:"Scott Management", role:"CEO", email:"dave@scottmgmt.com", phone:"(310) 555-0121", status:"client", score:92, tags:["anchor"], lastTouch:"2026-03-10", notes:"Anchor client. Happy. Wants to expand AI ops to 3 more communities." },
    { id:2, name:"Rachel Kim", co:"Rapid Medical", role:"COO", email:"r.kim@rapidmed.com", phone:"(323) 555-0188", status:"at-risk", score:41, tags:["payments-behind"], lastTouch:"2026-02-28", notes:"Payments 30+ days behind. Engagement at risk. Needs follow-up on AWS Bedrock POC." },
    { id:3, name:"Michael Torres", co:"Horizon HOA Group", role:"VP Operations", email:"m.torres@horizonhoa.com", phone:"(714) 555-0244", status:"prospect", score:78, tags:["warm"], lastTouch:"2026-03-05", notes:"Interested in Salesforce ops fix. Managing 12 communities. $80K potential." },
    { id:4, name:"Sandra Liu", co:"Westcoast Property Partners", role:"Director IT", email:"sliu@wcpp.com", phone:"(818) 555-0311", status:"prospect", score:65, tags:["cold"], lastTouch:"2026-02-15", notes:"Met at NAA conference. Evaluating automation vendors." },
    { id:5, name:"James Okafor", co:"SunRidge Communities", role:"CFO", email:"j.okafor@sunridge.com", phone:"(619) 555-0177", status:"prospect", score:55, tags:["new"], lastTouch:"2026-03-12", notes:"Referred by Dave Scott. Property mgmt group with 8 communities. Needs AI ops." },
    { id:6, name:"Priya Mehta", co:"ClearPath HOA", role:"CEO", email:"priya@clearpathoa.com", phone:"(424) 555-0299", status:"prospect", score:48, tags:["cold"], lastTouch:"2026-01-20", notes:"Initial outreach via LinkedIn. No response yet." },
  ],
  deals: [
    { id:1, name:"Scott Mgmt — Phase 2 Expansion", contactId:1, value:120000, stage:"negotiation", probability:85, closeDate:"2026-04-30", notes:"Expanding to 3 more HOA communities. Proposal sent." },
    { id:2, name:"Rapid Medical — AWS Bedrock POC", contactId:2, value:45000, stage:"at-risk", probability:25, closeDate:"2026-03-31", notes:"Invoice unpaid. POC stalled. Need exec alignment call." },
    { id:3, name:"Horizon HOA — Salesforce Ops Fix", contactId:3, value:80000, stage:"proposal", probability:60, closeDate:"2026-05-15", notes:"Sent SOW draft. Awaiting feedback." },
    { id:4, name:"SunRidge — AI Ops Pilot", contactId:5, value:35000, stage:"discovery", probability:40, closeDate:"2026-06-01", notes:"Intro call scheduled for 3/18. Scott referral." },
    { id:5, name:"ClearPath HOA — Ops Audit", contactId:6, value:18000, stage:"outreach", probability:15, closeDate:"2026-07-01", notes:"Need to re-engage. 6-week silence." },
  ],
  campaigns: [
    { id:1, name:"HOA Ops Intelligence Series", type:"Email", status:"active", leads:47, opens:38, conversions:4, startDate:"2026-02-01" },
    { id:2, name:"LinkedIn — AI Ops Positioning", type:"Social", status:"active", leads:23, opens:1800, conversions:2, startDate:"2026-01-15" },
    { id:3, name:"Scott Mgmt Referral Program", type:"Referral", status:"active", leads:3, opens:3, conversions:1, startDate:"2026-03-01" },
    { id:4, name:"Property Mgmt Pain-Point Outreach", type:"Email", status:"draft", leads:0, opens:0, conversions:0, startDate:"2026-04-01" },
  ],
  projects: [
    { id:1, name:"Scott Mgmt AI Ops Deployment", client:"Scott Management", status:"active", progress:72, dueDate:"2026-04-15", priority:"high", notes:"" },
    { id:2, name:"Rapid Medical — Agentforce POC", client:"Rapid Medical", status:"stalled", progress:35, dueDate:"2026-03-31", priority:"critical", notes:"Stalled at 35%. Needs re-scoping call." },
    { id:3, name:"Horizon HOA SOW Finalization", client:"Horizon HOA", status:"active", progress:20, dueDate:"2026-03-20", priority:"high", notes:"" },
    { id:4, name:"BD Signal Tool — V2", client:"Internal", status:"active", progress:55, dueDate:"2026-04-01", priority:"medium", notes:"" },
  ],
  tasks: [
    { id:1, title:"Follow up with Rachel Kim re: payment", projectId:2, due:"2026-03-14", done:false, priority:"critical", assignedTo:"Orchestrator" },
    { id:2, title:"Send Phase 2 proposal to Dave Scott", projectId:1, due:"2026-03-16", done:false, priority:"high", assignedTo:"CRM Agent" },
    { id:3, title:"SOW revision — Horizon HOA scope", projectId:3, due:"2026-03-18", done:false, priority:"high", assignedTo:"Ops Agent" },
    { id:4, title:"Prep SunRidge intro call (3/18)", projectId:4, due:"2026-03-17", done:false, priority:"high", assignedTo:"CRM Agent" },
    { id:5, title:"Publish LinkedIn post — AI Ops ROI", projectId:4, due:"2026-03-15", done:true, priority:"medium", assignedTo:"Marketing Agent" },
  ],
  invoices: [
    { id:1, client:"Scott Management", amount:18500, status:"paid", issued:"2026-03-01", due:"2026-03-15", number:"INV-031", notes:"" },
    { id:2, client:"Scott Management", amount:18500, status:"pending", issued:"2026-03-15", due:"2026-04-01", number:"INV-032", notes:"" },
    { id:3, client:"Rapid Medical", amount:12500, status:"overdue", issued:"2026-02-01", due:"2026-02-28", number:"INV-029", notes:"13 days overdue." },
    { id:4, client:"Rapid Medical", amount:12500, status:"overdue", issued:"2026-02-15", due:"2026-03-01", number:"INV-030", notes:"12 days overdue." },
    { id:5, client:"Horizon HOA", amount:8000, status:"draft", issued:"", due:"", number:"INV-033", notes:"" },
  ],
  agentLogs: [
    { id:1, agent:"Billing Agent", type:"alert", message:"Rapid Medical: 2 invoices overdue ($25K). Recommend escalation call before Phase 2 renewal.", ts:"09:42", priority:"critical" },
    { id:2, agent:"CRM Agent", type:"opportunity", message:"SunRidge Communities (Scott referral) has 8 communities — estimated $35K pilot. Intro call 3/18 is key.", ts:"09:15", priority:"high" },
    { id:3, agent:"Marketing Agent", type:"insight", message:"3 SoCal HOA groups posted LinkedIn pain-points. BD Signal flagged for outreach.", ts:"08:50", priority:"medium" },
    { id:4, agent:"Ops Agent", type:"risk", message:"Rapid Medical POC stalled at 35% for 65 days. Recommend re-scoping call.", ts:"08:30", priority:"critical" },
    { id:5, agent:"Orchestrator", type:"synthesis", message:"Revenue gap to $800K: $486K. Current pipeline covers 58%. Need 2 new qualified clients.", ts:"08:00", priority:"high" },
  ],
  voiceNotes: [],
});

/* ── SUPABASE CLIENT ── */
const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL  || "";
const SUPA_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const ENV_READY = SUPA_URL.startsWith("https://") && SUPA_KEY.length > 10;

const supabase = ENV_READY
  ? createClient(SUPA_URL, SUPA_KEY)
  : null;

const DB_TABLES = [
  ["contacts",   "contacts"],
  ["deals",      "deals"],
  ["tasks",      "tasks"],
  ["projects",   "projects"],
  ["campaigns",  "campaigns"],
  ["invoices",   "invoices"],
  ["agentLogs",  "agentlogs"],
  ["voiceNotes", "voicenotes"],
];

const loadAllFromDB = async () => {
  const seed = initDB();
  const result = {};
  const fetches = await Promise.all(DB_TABLES.map(([, tbl]) => supabase.from(tbl).select("*").order("id")));

  const toSeed = []; // tables that need seeding

  DB_TABLES.forEach(([key], i) => {
    const { data, error } = fetches[i];
    if (!error && data && data.length > 0) {
      result[key] = data;
    } else {
      result[key] = seed[key];
      toSeed.push({ key, i });
    }
  });

  // Write seed data to any empty tables so deletes/edits persist
  if (toSeed.length > 0) {
    await Promise.all(
      toSeed.map(({ key, i }) => {
        const [, tbl] = DB_TABLES[i];
        return seed[key].length > 0
          ? supabase.from(tbl).upsert(seed[key])
          : Promise.resolve();
      })
    );
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
    if (deleted.length > 0) await supabase.from(tbl).delete().in("id", deleted);
  }
};

/* ── HELPERS ── */
const nextId = (arr) => arr.length ? Math.max(...arr.map(r => r.id)) + 1 : 1;
const fmt = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;
const sc = (k) => ({ client:"var(--green)", "at-risk":"var(--red)", prospect:"var(--blue)", active:"var(--green)", stalled:"var(--red)", draft:"var(--text-sec)", paid:"var(--green)", pending:"var(--amber)", overdue:"var(--red)", critical:"var(--red)", high:"var(--amber)", medium:"var(--blue)", low:"var(--green)" }[k] || "var(--text-sec)");
const revenueData = [
  {m:"Oct",rev:32000},{m:"Nov",rev:28000},{m:"Dec",rev:41000},
  {m:"Jan",rev:37000},{m:"Feb",rev:31000},{m:"Mar",rev:47000},
];

async function callClaude(system, user, max=800, extra={}) {
  const r = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:max, system, messages:[{role:"user",content:user}], ...extra }),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

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
  const c = ({Orchestrator:"var(--purple)","CRM Agent":"var(--blue)","Marketing Agent":"var(--amber)","Billing Agent":"var(--red)","Ops Agent":"var(--green)"}[agent])||"var(--text-sec)";
  return <span className="mono" style={{ fontSize:10, color:c, background:`${c}18`, padding:"1px 6px", borderRadius:3 }}>{agent}</span>;
};

/* ── CONFIRM DELETE DIALOG ── */
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

/* ── DRAWER (slide-in form panel) ── */
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

/* ── ROW ACTIONS ── */
const RowActions = ({ onEdit, onDelete }) => (
  <div className="row-actions" style={{ display:"flex", gap:2, opacity:0, transition:"opacity .15s" }}>
    <button className="btn-icon" title="Edit" onClick={e=>{e.stopPropagation();onEdit();}}><Pencil size={13} color="var(--text-sec)"/></button>
    <button className="btn-icon delete" title="Delete" onClick={e=>{e.stopPropagation();onDelete();}}><Trash2 size={13} color="var(--text-sec)"/></button>
  </div>
);

/* ────────────────────────────────────────────────────────
   AUTH — LOGIN + LOADING SCREENS
──────────────────────────────────────────────────────── */
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
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

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
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>AI Ops Console · Private Access</div>
        </div>

        {error && (
          <div style={{ background:"var(--red-dim)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:8, padding:"10px 14px", fontSize:12, color:"var(--red)", display:"flex", gap:7 }}>
            <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }}/>{error}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Field label="Email">
            <input className="input" type="email" value={email} placeholder="you@example.com"
              onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&signIn()}/>
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={password} placeholder="••••••••"
              onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&signIn()}/>
          </Field>
        </div>

        <button className="btn btn-blue" onClick={signIn} disabled={loading} style={{ justifyContent:"center", opacity:loading?0.6:1, height:42, fontSize:14 }}>
          {loading ? <><Loader size={14} className="spin"/>Signing in…</> : <><Shield size={14}/>Sign In</>}
        </button>

        <p style={{ fontSize:11, color:"var(--text-dim)", textAlign:"center", lineHeight:1.6 }}>
          Private access. Create your account once in<br/>Supabase Auth → Users → Add User.
        </p>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   SIDEBAR
──────────────────────────────────────────────────────── */
const NAV = [
  {id:"dashboard",icon:BarChart2,label:"Dashboard"},
  {id:"orchestrator",icon:Brain,label:"Orchestrator"},
  {divider:true},
  {id:"crm",icon:Users,label:"CRM"},
  {id:"deals",icon:Target,label:"Deals"},
  {id:"marketing",icon:Megaphone,label:"Marketing"},
  {id:"operations",icon:Briefcase,label:"Operations"},
  {id:"billing",icon:DollarSign,label:"Billing"},
  {divider:true},
  {id:"voice",icon:Mic,label:"Voice Lab"},
  {id:"email",icon:Mail,label:"Email Lab"},
];

const Sidebar = ({ view, setView, collapsed, setCollapsed, alerts }) => (
  <div style={{ width:collapsed?60:210, background:"var(--bg-card)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", padding:"14px 8px", gap:2, transition:"width .25s", flexShrink:0 }}>
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 6px 18px", cursor:"pointer" }} onClick={()=>setCollapsed(!collapsed)}>
      <div style={{ width:32, height:32, borderRadius:8, background:"var(--blue-dim)", border:"1px solid rgba(0,119,204,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Brain size={16} color="var(--blue)"/>
      </div>
      {!collapsed && <div><div className="display" style={{ fontSize:13, fontWeight:700 }}>Second Brain</div><div className="mono" style={{ fontSize:9, color:"var(--text-sec)" }}>AI Ops Console</div></div>}
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
        {!collapsed && <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>5 agents live</span>}
      </div>
    </div>
  </div>
);

const BottomNav = ({ view, setView }) => (
  <div style={{ display:"flex", background:"var(--bg-card)", borderTop:"1px solid var(--border)", padding:"6px 0 10px" }}>
    {[{id:"dashboard",icon:BarChart2},{id:"crm",icon:Users},{id:"deals",icon:Target},{id:"operations",icon:Briefcase},{id:"billing",icon:DollarSign},{id:"voice",icon:Mic},{id:"email",icon:Mail}].map(n=>(
      <button key={n.id} onClick={()=>setView(n.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:"transparent", border:"none", cursor:"pointer", padding:"4px 0" }}>
        <n.icon size={17} color={view===n.id?"var(--blue)":"var(--text-sec)"}/>
        <div style={{ width:4, height:4, borderRadius:"50%", background:view===n.id?"var(--blue)":"transparent" }}/>
      </button>
    ))}
  </div>
);

/* ────────────────────────────────────────────────────────
   DASHBOARD
──────────────────────────────────────────────────────── */
const Dashboard = ({ db, setView }) => {
  const paid = db.invoices.filter(i=>i.status==="paid").reduce((a,i)=>a+i.amount,0);
  const pipeline = db.deals.reduce((a,d)=>a+d.value*d.probability/100,0);
  const overdue = db.invoices.filter(i=>i.status==="overdue").reduce((a,i)=>a+i.amount,0);
  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:22 }}>
      <div>
        <div className="display" style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Good morning, Mendy.</div>
        <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>Fri Mar 13 · 5 agents running · 2 critical items</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12 }}>
        <MetricCard icon={TrendingUp} label="YTD Revenue" value={fmt(paid)} sub={`$800K target · ${Math.round(paid/8000)}%`} color="--blue" trend={12}/>
        <MetricCard icon={Target} label="Wtd Pipeline" value={fmt(Math.round(pipeline))} sub={`${db.deals.length} deals`} color="--amber" trend={8}/>
        <MetricCard icon={AlertCircle} label="Overdue A/R" value={fmt(overdue)} sub="Rapid Medical" color="--red"/>
        <MetricCard icon={Users} label="Active Clients" value="2" sub={`${db.contacts.filter(c=>c.status==="prospect").length} prospects`} color="--green"/>
      </div>
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
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700 }}>Agent Feed</div>
          <button className="btn btn-ghost" style={{ fontSize:12, padding:"5px 10px" }} onClick={()=>setView("orchestrator")}>All <ChevronRight size={12}/></button>
        </div>
        {db.agentLogs.slice(0,4).map(l=>(
          <div key={l.id} className="card-el slide-in" style={{ padding:"12px 14px", marginBottom:8, borderLeft:`2px solid ${sc(l.priority)}` }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
              <AgentBadge agent={l.agent}/>
              <Tag label={l.type} color={sc(l.priority)}/>
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
   CRM — CONTACTS
──────────────────────────────────────────────────────── */
const blankContact = () => ({ name:"", co:"", role:"", email:"", phone:"", status:"prospect", score:50, notes:"", lastTouch:new Date().toISOString().split("T")[0], tags:[] });

const ContactForm = ({ data, onChange }) => (
  <>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Field label="Name"><Inp value={data.name} onChange={v=>onChange({...data,name:v})} placeholder="Full name"/></Field>
      <Field label="Company"><Inp value={data.co} onChange={v=>onChange({...data,co:v})} placeholder="Company"/></Field>
      <Field label="Role"><Inp value={data.role} onChange={v=>onChange({...data,role:v})} placeholder="Title"/></Field>
      <Field label="Status"><Sel value={data.status} onChange={v=>onChange({...data,status:v})} options={["prospect","client","at-risk","inactive"]}/></Field>
      <Field label="Email"><Inp value={data.email} onChange={v=>onChange({...data,email:v})} placeholder="email@co.com"/></Field>
      <Field label="Phone"><Inp value={data.phone} onChange={v=>onChange({...data,phone:v})} placeholder="(xxx) xxx-xxxx"/></Field>
      <Field label="Score (0-100)"><Inp type="number" value={data.score} onChange={v=>onChange({...data,score:parseInt(v)||50})}/></Field>
      <Field label="Last Touch"><Inp type="date" value={data.lastTouch} onChange={v=>onChange({...data,lastTouch:v})}/></Field>
    </div>
    <Field label="Notes"><Tex value={data.notes} onChange={v=>onChange({...data,notes:v})} placeholder="Context, next steps…"/></Field>
  </>
);

const CRMView = ({ db, setDB }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null); // {mode:"add"|"edit", data:{}}
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState("");
  const [gmailState, setGmailState] = useState({ loading:false, signals:[], synthesis:"", scannedAt:null, error:null });
  const [showGmail, setShowGmail] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const filtered = db.contacts.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.co.toLowerCase().includes(query.toLowerCase())
  );
  const contact = sel ? db.contacts.find(c=>c.id===sel) : null;
  const contactDeals = contact ? db.deals.filter(d=>d.contactId===contact.id) : [];

  const save = () => {
    if (drawer.mode==="add") {
      setDB(d=>({...d,contacts:[...d.contacts,{...drawer.data,id:nextId(d.contacts)}]}));
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

  const pasteImport = () => {
    try {
      const raw = pasteText.trim();
      const match = raw.match(/\[[\s\S]*\]/);
      const signals = JSON.parse(match ? match[0] : raw);
      if (!Array.isArray(signals)) throw new Error("Not an array");
      setGmailState({ loading:false, signals: signals.map(s=>({...s,imported:false})), synthesis:`Paste import: ${signals.length} contacts loaded. Review and click "Import Contact + Task" on each.`, scannedAt:new Date().toLocaleTimeString(), error:null });
      setShowGmail(true);
      setSel(null);
      setPasteMode(false);
      setPasteText("");
    } catch {
      alert("Could not parse JSON. Make sure you pasted the full array from Claude.");
    }
  };

  const importContact = (signal) => {
    const alreadyExists = db.contacts.some(c =>
      c.email && signal.contact.email && c.email.toLowerCase()===signal.contact.email.toLowerCase()
    );
    if (alreadyExists) { alert(`${signal.contact.name} is already in CRM.`); return; }
    const newContact = {
      id: nextId(db.contacts),
      name: signal.contact.name || "Unknown",
      co: signal.contact.company || "",
      role: signal.contact.role || "",
      email: signal.contact.email || "",
      phone: signal.contact.phone || "",
      status: signal.contactType || "prospect",
      score: signal.contactType==="existing-customer"?80:signal.contactType==="lead"?55:signal.contactType==="partner"?70:50,
      tags: [signal.contactType],
      lastTouch: new Date().toISOString().split("T")[0],
      notes: signal.accountContext || "",
    };
    const newTask = {
      id: nextId(db.tasks),
      title: signal.taskTitle || `Follow up with ${signal.contact.name}`,
      projectId: "",
      due: signal.taskDueDate || new Date(Date.now()+3*24*60*60*1000).toISOString().split("T")[0],
      done: false,
      priority: signal.taskPriority || "medium",
      assignedTo: "CRM Agent",
      notes: signal.taskGuidance || "",
    };
    const newActivity = {
      id: nextId(db.agentLogs),
      agent: "CRM Agent",
      type: "activity",
      message: `[IMPORTED] ${signal.contact.name} (${signal.contact.company}) — ${signal.activitySummary || signal.subject}`,
      ts: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
      priority: signal.taskPriority || "medium",
    };
    setDB(d => ({
      ...d,
      contacts: [...d.contacts, newContact],
      tasks: [...d.tasks, newTask],
      agentLogs: [newActivity, ...d.agentLogs],
    }));
    setGmailState(s => ({
      ...s,
      signals: s.signals.map(sg => sg===signal ? {...sg, imported:true} : sg),
    }));
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
          system:`You are the CRM Intelligence Agent for Mendy Ezagui, an independent AI operations consultant (Los Angeles). His clients: Scott Management (anchor), Rapid Medical (at-risk). Target verticals: property management, HOA companies. Annual revenue target: $800K.

YOUR TASK: Search Gmail for ALL emails and meeting invites/calendar events from the past 30 days (after:${ds}). Extract every distinct person Mendy communicated with or met. For each person, classify their relationship type and build a full CRM signal.

Contact type classification rules:
- "existing-customer": already paying clients (Scott Management, Rapid Medical, or anyone described as current client/customer)
- "lead": prospect, potential client, someone evaluating services, referral, someone at a target company (HOA, property management, real estate)
- "partner": referral partners, implementation partners, consultants, system integrators, anyone proposing collaboration
- "vendor": software vendors, tool providers, SaaS reps, service providers selling TO Mendy

For each meeting/email thread, generate a task with specific urgency guidance — not generic. Include: what happened, what's at stake, exact next action with a deadline rationale.

Return ONLY a valid JSON array (no markdown, no preamble):
[{
  "subject": "email subject or meeting title",
  "date": "YYYY-MM-DD",
  "threadId": "gmail thread id if available",
  "contact": {
    "name": "Full Name",
    "email": "email@domain.com",
    "company": "Company Name",
    "role": "Title/Role",
    "phone": "",
    "linkedIn": ""
  },
  "contactType": "lead|partner|vendor|existing-customer",
  "accountContext": "1-2 sentences about what this company does and their relevance to Mendy",
  "activitySummary": "What was discussed or decided in this email/meeting",
  "bdOpportunity": "Specific revenue or relationship opportunity if any, else empty string",
  "taskTitle": "Short action title",
  "taskDueDate": "YYYY-MM-DD",
  "taskPriority": "critical|high|medium|low",
  "taskGuidance": "3-5 sentences of specific guidance: what happened, what's at stake, exact next action, why the timing matters, and what a good outcome looks like",
  "priority": "high|medium|low"
}]`,
          messages:[{role:"user",content:"Search my Gmail including meeting invites and calendar events for the past 30 days. Extract every person I communicated with or met. Return the full JSON array."}],
          mcp_servers:[{type:"url",url:"https://gmail.mcp.claude.com/mcp",name:"gmail"}]
        })
      });
      const data = await res.json();
      const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n");
      let signals = [];
      try {
        const m = text.match(/\[[\s\S]*\]/);
        if (m) signals = JSON.parse(m[0]);
      } catch { signals = []; }

      let synthesis = "";
      if (signals.length > 0) {
        synthesis = await callClaude(
          "You are Mendy's Orchestrator Agent. Revenue target $800K. Clients: Scott Management (anchor), Rapid Medical (at-risk). Target: property mgmt/HOA.",
          `Gmail 30-day scan found ${signals.length} contacts across ${[...new Set(signals.map(s=>s.contactType))].join(", ")} categories.\nSignals:\n${JSON.stringify(signals.map(s=>({name:s.contact.name,co:s.contact.company,type:s.contactType,bd:s.bdOpportunity,task:s.taskTitle,priority:s.taskPriority})),null,2)}\n\nProvide: (1) top immediate revenue action, (2) most at-risk relationship, (3) strongest new lead. Be specific, name names. 3 sentences max.`,
          400
        );
      } else {
        synthesis = "No contacts found in the last 30 days, or Gmail is not yet connected. Go to Claude Settings → Integrations → Gmail to connect your account.";
      }
      setGmailState({loading:false,signals,synthesis,scannedAt:new Date().toLocaleTimeString(),error:null});
    } catch(e) {
      setGmailState(s=>({...s,loading:false,error:"Gmail scan failed. Connect Gmail under Claude Settings → Integrations."}));
    }
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
            {gmailState.loading?<><Loader size={13} className="spin" style={{color:"#EA4335"}}/>Scanning 30 days…</>:<>
              <svg width="13" height="13" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg>
              Scan Gmail — 30 Days
              {gmailState.scannedAt&&<span className="mono" style={{marginLeft:"auto",fontSize:10,color:"var(--text-sec)"}}>{gmailState.signals.length} contacts</span>}
            </>}
          </button>
          <button className="btn btn-ghost" style={{ width:"100%", justifyContent:"center", marginBottom:8, fontSize:11, padding:"5px 10px" }} onClick={()=>setPasteMode(true)}>
            <FileText size={11}/>Paste JSON from Claude
          </button>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(c=>(
            <div key={c.id} className="row-hover" onClick={()=>{setSel(c.id);setShowGmail(false);}}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===c.id&&!showGmail?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"background .1s" }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
                <div style={{ fontSize:11, color:"var(--text-sec)", marginTop:2 }}>{c.co}</div>
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
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg>
                <span className="display" style={{ fontSize:18, fontWeight:700 }}>Gmail Intelligence — 30 Days</span>
                {gmailState.scannedAt&&<span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>scanned {gmailState.scannedAt}</span>}
              </div>
              <button className="btn btn-ghost" style={{ fontSize:12, padding:"5px 10px" }} onClick={scanGmail} disabled={gmailState.loading}><RefreshCw size={12} className={gmailState.loading?"spin":""}/>Rescan</button>
            </div>

            {/* Loading */}
            {gmailState.loading && (
              <div className="card" style={{ padding:44, textAlign:"center" }}>
                <Loader size={30} className="spin" style={{ color:"var(--blue)", margin:"0 auto 16px" }}/>
                <p style={{ fontSize:13, color:"var(--text-sec)", marginBottom:6 }}>CRM Agent scanning Gmail + meeting invites…</p>
                <p className="mono" style={{ fontSize:11, color:"var(--text-dim)" }}>Extracting contacts · classifying relationships · building tasks</p>
              </div>
            )}

            {/* Error */}
            {gmailState.error && (
              <div className="card" style={{ padding:18, borderLeft:"3px solid var(--red)", marginBottom:14 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}><AlertCircle size={14} color="var(--red)"/><span style={{ fontSize:13, fontWeight:600, color:"var(--red)" }}>Connection Error</span></div>
                <p style={{ fontSize:13, color:"var(--text-sec)" }}>{gmailState.error}</p>
              </div>
            )}

            {/* Synthesis */}
            {!gmailState.loading && gmailState.synthesis && (
              <div className="card" style={{ padding:16, marginBottom:18, borderLeft:"3px solid var(--blue)" }}>
                <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:7 }}>
                  <Brain size={13} color="var(--blue)"/>
                  <span className="mono" style={{ fontSize:10, color:"var(--blue)" }}>ORCHESTRATOR SYNTHESIS</span>
                </div>
                <p style={{ fontSize:13, lineHeight:1.65 }}>{gmailState.synthesis}</p>
              </div>
            )}

            {/* Type buckets summary */}
            {!gmailState.loading && gmailState.signals.length > 0 && (() => {
              const buckets = gmailState.signals.reduce((a,s)=>{a[s.contactType]=(a[s.contactType]||0)+1;return a;},{});
              const typeColor = {"existing-customer":"--green","lead":"--blue","partner":"--purple","vendor":"--amber"};
              const typeLabel = {"existing-customer":"Existing Customers","lead":"Leads","partner":"Partners","vendor":"Vendors"};
              return (
                <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                  {Object.entries(buckets).map(([type,count])=>(
                    <div key={type} style={{ padding:"6px 12px", borderRadius:20, background:`var(${typeColor[type]||"--text-sec"}-dim,rgba(0,0,0,0.05))`, border:`1px solid var(${typeColor[type]||"--text-sec"})`, display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:`var(${typeColor[type]||"--text-sec"})` }}>{count}</span>
                      <span style={{ fontSize:11, color:`var(${typeColor[type]||"--text-sec"})` }}>{typeLabel[type]||type}</span>
                    </div>
                  ))}
                  <div style={{ padding:"6px 12px", borderRadius:20, background:"var(--bg-el)", fontSize:11, color:"var(--text-sec)", display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontWeight:700, fontSize:13 }}>{gmailState.signals.filter(s=>!s.imported).length}</span> not yet imported
                  </div>
                </div>
              );
            })()}

            {/* Signal cards */}
            {!gmailState.loading && gmailState.signals.map((sig,i)=>{
              const typeColor = {"existing-customer":"--green","lead":"--blue","partner":"--purple","vendor":"--amber"};
              const tc = typeColor[sig.contactType] || "--text-sec";
              const priorityColor = {critical:"var(--red)",high:"var(--amber)",medium:"var(--blue)",low:"var(--green)"};
              return (
                <div key={i} className="card" style={{ padding:18, marginBottom:12, borderLeft:`3px solid var(${tc})`, opacity:sig.imported?0.55:1 }}>
                  {/* Row 1: name + type + priority + date */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, fontWeight:700 }}>{sig.contact.name||"Unknown"}</span>
                        <Tag label={sig.contactType} color={`var(${tc})`}/>
                        {sig.imported&&<span className="mono" style={{ fontSize:10, color:"var(--green)", background:"var(--green-dim)", padding:"1px 6px", borderRadius:3 }}>✓ imported</span>}
                      </div>
                      <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>
                        {sig.contact.role&&<span>{sig.contact.role} · </span>}
                        {sig.contact.company&&<span style={{ fontWeight:600 }}>{sig.contact.company}</span>}
                        {sig.date&&<span> · {sig.date}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0, marginLeft:10 }}>
                      <Tag label={sig.taskPriority||sig.priority||"medium"}/>
                    </div>
                  </div>

                  {/* Contact details row */}
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
                    {sig.contact.email&&<div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--text-sec)" }}><Mail size={11}/>{sig.contact.email}</div>}
                    {sig.contact.phone&&<div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--text-sec)" }}><Phone size={11}/>{sig.contact.phone}</div>}
                  </div>

                  {/* Subject */}
                  {sig.subject&&<div className="mono" style={{ fontSize:11, color:"var(--text-dim)", marginBottom:8, padding:"4px 8px", background:"var(--bg-el)", borderRadius:4 }}>📧 {sig.subject}</div>}

                  {/* Account context */}
                  {sig.accountContext&&<p style={{ fontSize:12, color:"var(--text-sec)", lineHeight:1.5, marginBottom:8, fontStyle:"italic" }}>{sig.accountContext}</p>}

                  {/* Activity summary */}
                  {sig.activitySummary&&(
                    <div style={{ padding:"8px 11px", background:"var(--bg-el)", borderRadius:6, fontSize:12, color:"var(--text)", marginBottom:8, lineHeight:1.5 }}>
                      <span className="mono" style={{ fontSize:9, color:"var(--text-sec)", display:"block", marginBottom:3 }}>ACTIVITY</span>
                      {sig.activitySummary}
                    </div>
                  )}

                  {/* BD opportunity */}
                  {sig.bdOpportunity&&(
                    <div style={{ padding:"7px 11px", background:"var(--green-dim)", borderRadius:6, fontSize:12, color:"var(--green)", marginBottom:8, display:"flex", gap:7, lineHeight:1.4 }}>
                      <Target size={12} style={{flexShrink:0,marginTop:1}}/>{sig.bdOpportunity}
                    </div>
                  )}

                  {/* Task guidance */}
                  {sig.taskGuidance&&(
                    <div style={{ padding:"10px 12px", background:`rgba(${sig.taskPriority==="critical"?"220,38,38":sig.taskPriority==="high"?"217,119,6":"0,119,204"},0.06)`, border:`1px solid rgba(${sig.taskPriority==="critical"?"220,38,38":sig.taskPriority==="high"?"217,119,6":"0,119,204"},0.15)`, borderRadius:6, marginBottom:10 }}>
                      <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:5 }}>
                        <Zap size={11} color={priorityColor[sig.taskPriority||"medium"]}/>
                        <span className="mono" style={{ fontSize:9, color:priorityColor[sig.taskPriority||"medium"] }}>TASK · {sig.taskTitle}</span>
                        {sig.taskDueDate&&<span className="mono" style={{ fontSize:9, color:"var(--text-sec)", marginLeft:"auto" }}>Due {sig.taskDueDate}</span>}
                      </div>
                      <p style={{ fontSize:12, color:"var(--text)", lineHeight:1.6 }}>{sig.taskGuidance}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display:"flex", gap:6 }}>
                    {!sig.imported ? (
                      <button className="btn btn-blue" style={{ fontSize:11, padding:"5px 10px" }} onClick={()=>importContact(sig)}>
                        <Plus size={11}/>Import Contact + Task
                      </button>
                    ) : (
                      <span style={{ fontSize:11, color:"var(--green)", display:"flex", alignItems:"center", gap:4 }}><CheckCircle size={12}/>Contact, task & activity logged</span>
                    )}
                    <button className="btn btn-ghost" style={{ fontSize:11, padding:"5px 10px" }} onClick={()=>setDrawer({mode:"add",data:{name:sig.contact.name||"",co:sig.contact.company||"",role:sig.contact.role||"",email:sig.contact.email||"",phone:sig.contact.phone||"",status:sig.contactType||"prospect",score:55,notes:sig.accountContext||"",lastTouch:new Date().toISOString().split("T")[0],tags:[sig.contactType||"lead"]}})}>
                      <Pencil size={11}/>Edit Before Import
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {!gmailState.loading&&!gmailState.error&&gmailState.signals.length===0&&gmailState.scannedAt&&(
              <div className="card" style={{ padding:36, textAlign:"center" }}>
                <Inbox size={34} style={{ color:"var(--text-dim)", margin:"0 auto 12px" }}/>
                <p style={{ fontSize:13, color:"var(--text-sec)" }}>No contacts found in the past 30 days.</p>
                <p style={{ fontSize:12, color:"var(--text-dim)", marginTop:6 }}>Make sure Gmail is connected under Claude Settings → Integrations.</p>
              </div>
            )}
          </div>
        ) : contact ? (
          <div className="slide-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div><div className="display" style={{ fontSize:20, fontWeight:800 }}>{contact.name}</div><div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{contact.co} · {contact.role}</div></div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <Tag label={contact.status}/><ScoreBadge score={contact.score}/>
                <button className="btn btn-ghost" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setDrawer({mode:"edit",data:{...contact}})}><Pencil size={12}/>Edit</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:contact.id,label:contact.name})}><Trash2 size={12}/></button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
              {[{icon:Mail,val:contact.email},{icon:Phone,val:contact.phone},{icon:Calendar,val:`Last touch: ${contact.lastTouch}`},{icon:Building,val:contact.co}].map(({icon:I,val},i)=>(
                <div key={i} className="card-el" style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:9 }}><I size={13} color="var(--text-sec)"/><span style={{ fontSize:13 }}>{val}</span></div>
              ))}
            </div>
            {contact.notes&&<div className="card-el" style={{ padding:14, marginBottom:16 }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:5 }}>NOTES</div><p style={{ fontSize:13, lineHeight:1.6 }}>{contact.notes}</p></div>}
            {contactDeals.length>0&&<div>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>DEALS</div>
              {contactDeals.map(d=>(
                <div key={d.id} className="card-el" style={{ padding:14, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{ fontSize:13, fontWeight:600 }}>{d.name}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>Close {d.closeDate} · {d.probability}%</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ fontSize:15, fontWeight:700, color:"var(--blue)", fontFamily:"var(--font-d)" }}>{fmt(d.value)}</div><Tag label={d.stage}/></div>
                </div>
              ))}
            </div>}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Users size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a contact or scan Gmail</p>
          </div>
        )}
      </div>

      {drawer&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Contact`} onClose={()=>setDrawer(null)} onSave={save} saveLabel={drawer.mode==="add"?"Add Contact":"Save Changes"}>
        <ContactForm data={drawer.data} onChange={data=>setDrawer(d=>({...d,data}))}/>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}

      {/* PASTE IMPORT MODAL */}
      {pasteMode&&(
        <div className="confirm-overlay" onClick={()=>setPasteMode(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:14, padding:28, width:"min(600px,92vw)", boxShadow:"0 8px 40px rgba(0,0,0,0.18)", display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700 }}>Paste Gmail JSON from Claude</div>
              <button className="btn-icon" onClick={()=>setPasteMode(false)}><X size={16}/></button>
            </div>
            <div style={{ padding:"10px 14px", background:"var(--blue-dim,rgba(0,119,204,0.07))", borderRadius:8, borderLeft:"3px solid var(--blue)" }}>
              <p className="mono" style={{ fontSize:11, color:"var(--blue)", lineHeight:1.7 }}>Run this in a new Claude chat window (with Gmail connected):</p>
              <p className="mono" style={{ fontSize:11, color:"var(--text)", lineHeight:1.7, marginTop:6, userSelect:"all", cursor:"text" }}>
                {"\"Search my Gmail for the past 30 days. For every person I emailed or met, return a JSON array: [{contact:{name,email,company,role,phone}, contactType:'lead|partner|vendor|existing-customer', subject, date, activitySummary, accountContext, bdOpportunity, taskTitle, taskDueDate, taskPriority:'critical|high|medium|low', taskGuidance}]\""}
              </p>
            </div>
            <textarea
              className="input"
              placeholder="Paste the JSON array Claude returned here…"
              value={pasteText}
              onChange={e=>setPasteText(e.target.value)}
              style={{ minHeight:180, fontSize:12, fontFamily:"var(--font-m)", resize:"vertical" }}
            />
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-blue" onClick={pasteImport} style={{ flex:1, justifyContent:"center" }} disabled={!pasteText.trim()}>
                <Plus size={13}/>Load Contacts
              </button>
              <button className="btn btn-ghost" onClick={()=>{setPasteMode(false);setPasteText("");}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   DEALS
──────────────────────────────────────────────────────── */
const blankDeal = () => ({ name:"", contactId:"", value:0, stage:"discovery", probability:50, closeDate:"", notes:"" });

const DealsView = ({ db, setDB }) => {
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankDeal());

  const save = () => {
    const rec = { ...d, value:parseFloat(d.value)||0, probability:parseInt(d.probability)||50, contactId:parseInt(d.contactId)||null };
    if (drawer==="add") setDB(db=>({...db,deals:[...db.deals,{...rec,id:nextId(db.deals)}]}));
    else setDB(db=>({...db,deals:db.deals.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };

  const del = (id) => { setDB(db=>({...db,deals:db.deals.filter(x=>x.id!==id)})); setConfirm(null); };

  const STAGES = ["outreach","discovery","proposal","negotiation","at-risk","won","lost"];
  const stageColor = { outreach:"var(--text-sec)", discovery:"var(--purple)", proposal:"var(--blue)", negotiation:"var(--amber)", "at-risk":"var(--red)", won:"var(--green)", lost:"var(--text-sec)" };

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Deals</div>
        <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setD(blankDeal());setDrawer("add");}}><Plus size={12}/>New Deal</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        <MetricCard icon={Target} label="Total Pipeline" value={fmt(db.deals.reduce((a,x)=>a+x.value,0))} color="--blue"/>
        <MetricCard icon={TrendingUp} label="Weighted" value={fmt(Math.round(db.deals.reduce((a,x)=>a+x.value*x.probability/100,0)))} color="--amber"/>
        <MetricCard icon={CheckCircle} label="Deals" value={db.deals.length} color="--green"/>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {db.deals.map(deal=>{
          const contact = db.contacts.find(c=>c.id===deal.contactId);
          return (
            <div key={deal.id} className="card row-hover" style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:stageColor[deal.stage]||"var(--text-sec)", flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{deal.name}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{contact?.name||"—"} · Close {deal.closeDate} · {deal.probability}% probability</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700, color:"var(--blue)" }}>{fmt(deal.value)}</div>
                <Tag label={deal.stage}/>
              </div>
              <RowActions onEdit={()=>{setD({...deal,value:String(deal.value),probability:String(deal.probability),contactId:String(deal.contactId||"")});setDrawer("edit");}} onDelete={()=>setConfirm({id:deal.id,label:deal.name})}/>
            </div>
          );
        })}
      </div>
      {drawer&&<Drawer title={drawer==="add"?"New Deal":"Edit Deal"} onClose={()=>setDrawer(null)} onSave={save} saveLabel={drawer==="add"?"Add Deal":"Save"}>
        <Field label="Deal Name"><Inp value={d.name} onChange={v=>setD(p=>({...p,name:v}))} placeholder="Client — Initiative"/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Contact"><Sel value={d.contactId} onChange={v=>setD(p=>({...p,contactId:v}))} options={[{value:"",label:"— none —"},...db.contacts.map(c=>({value:String(c.id),label:c.name}))]}/></Field>
          <Field label="Stage"><Sel value={d.stage} onChange={v=>setD(p=>({...p,stage:v}))} options={STAGES}/></Field>
          <Field label="Value ($)"><Inp type="number" value={d.value} onChange={v=>setD(p=>({...p,value:v}))}/></Field>
          <Field label="Probability (%)"><Inp type="number" value={d.probability} onChange={v=>setD(p=>({...p,probability:v}))}/></Field>
          <Field label="Close Date" ><Inp type="date" value={d.closeDate} onChange={v=>setD(p=>({...p,closeDate:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={d.notes} onChange={v=>setD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   MARKETING — CAMPAIGNS
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
        <MetricCard icon={TrendingUp} label="Conversions" value={db.campaigns.reduce((a,c)=>a+c.conversions,0)} color="--green" trend={5}/>
      </div>
      {db.campaigns.map(c=>(
        <div key={c.id} className="card row-hover" style={{ padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div><div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{c.type} · {c.startDate}</div></div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <Tag label={c.status} color={c.status==="active"?"var(--green)":undefined}/>
              <RowActions onEdit={()=>{setD({...c,leads:String(c.leads),opens:String(c.opens),conversions:String(c.conversions)});setDrawer("edit");}} onDelete={()=>setConfirm({id:c.id,label:c.name})}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:24 }}>
            {[["Leads",c.leads],["Impressions",c.opens],["Conversions",c.conversions]].map(([l,v])=>(
              <div key={l}><div className="mono" style={{ fontSize:18, fontWeight:600 }}>{v.toLocaleString()}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>{l}</div></div>
            ))}
          </div>
        </div>
      ))}
      {drawer&&<Drawer title={drawer==="add"?"New Campaign":"Edit Campaign"} onClose={()=>setDrawer(null)} onSave={save} saveLabel={drawer==="add"?"Add":"Save"}>
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
   OPERATIONS — Projects + Tasks
──────────────────────────────────────────────────────── */
const blankProject = () => ({ name:"", client:"", status:"active", progress:0, dueDate:"", priority:"medium", notes:"" });
const blankTask = () => ({ title:"", projectId:"", due:"", done:false, priority:"medium", assignedTo:"" });

const OperationsView = ({ db, setDB }) => {
  const [tab, setTab] = useState("projects");
  const [drawer, setDrawer] = useState(null); // {mode, type, data}
  const [confirm, setConfirm] = useState(null);

  const saveProject = (d) => {
    const rec = {...d, progress:parseInt(d.progress)||0};
    if(drawer.mode==="add") setDB(db=>({...db,projects:[...db.projects,{...rec,id:nextId(db.projects)}]}));
    else setDB(db=>({...db,projects:db.projects.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };

  const saveTask = (d) => {
    const rec = {...d,projectId:parseInt(d.projectId)||null};
    if(drawer.mode==="add") setDB(db=>({...db,tasks:[...db.tasks,{...rec,id:nextId(db.tasks)}]}));
    else setDB(db=>({...db,tasks:db.tasks.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };

  const delProject = (id) => { setDB(db=>({...db,projects:db.projects.filter(x=>x.id!==id)})); setConfirm(null); };
  const delTask = (id) => { setDB(db=>({...db,tasks:db.tasks.filter(x=>x.id!==id)})); setConfirm(null); };
  const toggleTask = (id) => setDB(db=>({...db,tasks:db.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)}));

  const [pd, setPD] = useState(blankProject());
  const [td, setTD] = useState(blankTask());

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="display" style={{ fontSize:18, fontWeight:700 }}>Operations</div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ display:"flex", background:"var(--bg-el)", borderRadius:8, padding:3 }}>
            {["projects","tasks"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding:"5px 12px", borderRadius:6, border:"none", fontSize:12, fontWeight:500, cursor:"pointer", background:tab===t?"#fff":"transparent", color:tab===t?"var(--text)":"var(--text-sec)", boxShadow:tab===t?"var(--shadow)":"none", transition:"all .15s" }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
          {tab==="projects"
            ? <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setPD(blankProject());setDrawer({mode:"add",type:"project"});}}><Plus size={12}/>Project</button>
            : <button className="btn btn-blue" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{setTD(blankTask());setDrawer({mode:"add",type:"task"});}}><Plus size={12}/>Task</button>
          }
        </div>
      </div>

      {tab==="projects" ? db.projects.map(p=>(
        <div key={p.id} className="card row-hover" style={{ padding:16, borderLeft:`3px solid ${sc(p.status)}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div><div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{p.client} · Due {p.dueDate}</div></div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <Tag label={p.priority}/><Tag label={p.status}/>
              <RowActions onEdit={()=>{setPD({...p,progress:String(p.progress)});setDrawer({mode:"edit",type:"project"});}} onDelete={()=>setConfirm({id:p.id,label:p.name,type:"project"})}/>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1, height:5, background:"var(--bg-el)", borderRadius:3 }}>
              <div style={{ height:"100%", width:`${p.progress}%`, background:p.progress<40?"var(--red)":p.progress<70?"var(--amber)":"var(--green)", borderRadius:3, transition:"width .5s" }}/>
            </div>
            <span className="mono" style={{ fontSize:11, color:"var(--text-sec)", flexShrink:0 }}>{p.progress}%</span>
          </div>
          {p.notes&&<p style={{ fontSize:12, color:"var(--text-sec)", marginTop:10, lineHeight:1.5 }}>{p.notes}</p>}
        </div>
      )) : db.tasks.map(t=>(
        <div key={t.id} className="card-el row-hover" style={{ padding:"12px 14px", display:"flex", gap:12, alignItems:"flex-start", opacity:t.done?0.55:1 }}>
          <button onClick={()=>toggleTask(t.id)} style={{ width:18, height:18, borderRadius:4, border:`2px solid ${t.done?"var(--green)":"var(--border-hi)"}`, background:t.done?"var(--green)":"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
            {t.done&&<Check size={11} color="#fff"/>}
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500, textDecoration:t.done?"line-through":"none", color:t.done?"var(--text-sec)":"var(--text)" }}>{t.title}</div>
            <div style={{ display:"flex", gap:8, marginTop:4, alignItems:"center", flexWrap:"wrap" }}>
              <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>Due {t.due}</span>
              <Tag label={t.priority}/><AgentBadge agent={t.assignedTo}/>
            </div>
          </div>
          <RowActions onEdit={()=>{setTD({...t,projectId:String(t.projectId||"")});setDrawer({mode:"edit",type:"task"});}} onDelete={()=>setConfirm({id:t.id,label:t.title,type:"task"})}/>
        </div>
      ))}

      {drawer?.type==="project"&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Project`} onClose={()=>setDrawer(null)} onSave={()=>saveProject(pd)} saveLabel={drawer.mode==="add"?"Add Project":"Save"}>
        <Field label="Project Name"><Inp value={pd.name} onChange={v=>setPD(p=>({...p,name:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Client"><Inp value={pd.client} onChange={v=>setPD(p=>({...p,client:v}))}/></Field>
          <Field label="Status"><Sel value={pd.status} onChange={v=>setPD(p=>({...p,status:v}))} options={["active","stalled","complete","on-hold"]}/></Field>
          <Field label="Priority"><Sel value={pd.priority} onChange={v=>setPD(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
          <Field label="Progress (%)"><Inp type="number" value={pd.progress} onChange={v=>setPD(p=>({...p,progress:v}))}/></Field>
          <Field label="Due Date"><Inp type="date" value={pd.dueDate} onChange={v=>setPD(p=>({...p,dueDate:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={pd.notes} onChange={v=>setPD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}

      {drawer?.type==="task"&&<Drawer title={`${drawer.mode==="add"?"New":"Edit"} Task`} onClose={()=>setDrawer(null)} onSave={()=>saveTask(td)} saveLabel={drawer.mode==="add"?"Add Task":"Save"}>
        <Field label="Task Title"><Inp value={td.title} onChange={v=>setTD(p=>({...p,title:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Project"><Sel value={td.projectId} onChange={v=>setTD(p=>({...p,projectId:v}))} options={[{value:"",label:"— none —"},...db.projects.map(x=>({value:String(x.id),label:x.name}))]}/></Field>
          <Field label="Priority"><Sel value={td.priority} onChange={v=>setTD(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
          <Field label="Due Date"><Inp type="date" value={td.due} onChange={v=>setTD(p=>({...p,due:v}))}/></Field>
          <Field label="Assigned To"><Inp value={td.assignedTo} onChange={v=>setTD(p=>({...p,assignedTo:v}))}/></Field>
        </div>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>confirm.type==="project"?delProject(confirm.id):delTask(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   BILLING — INVOICES
──────────────────────────────────────────────────────── */
const blankInvoice = () => ({ number:"", client:"", amount:0, status:"draft", issued:"", due:"", notes:"" });

const BillingView = ({ db, setDB }) => {
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankInvoice());

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
        <MetricCard icon={TrendingUp} label="ARR Run Rate" value="$444K" sub="toward $800K" color="--blue"/>
      </div>
      {overdue>0&&<div className="card" style={{ padding:16, borderLeft:"3px solid var(--red)" }}>
        <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:6 }}><AlertCircle size={14} color="var(--red)"/><span style={{ fontSize:12, fontWeight:700, color:"var(--red)" }}>BILLING AGENT ALERT</span></div>
        <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.5 }}>Rapid Medical: 2 invoices totaling {fmt(overdue)} overdue. Escalation call recommended before 3/20.</p>
      </div>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {db.invoices.map(inv=>(
          <div key={inv.id} className="card row-hover" style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{inv.number}</span>
                <span style={{ fontSize:13, fontWeight:600 }}>{inv.client}</span>
              </div>
              {inv.due&&<div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>Due: {inv.due}</div>}
              {inv.notes&&<div style={{ fontSize:11, color:"var(--text-sec)", marginTop:2 }}>{inv.notes}</div>}
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontFamily:"var(--font-d)", fontSize:15, fontWeight:700 }}>{fmt(inv.amount)}</div>
              <Tag label={inv.status}/>
            </div>
            <RowActions onEdit={()=>{setD({...inv,amount:String(inv.amount)});setDrawer("edit");}} onDelete={()=>setConfirm({id:inv.id,label:inv.number})}/>
          </div>
        ))}
      </div>
      {drawer&&<Drawer title={drawer==="add"?"New Invoice":"Edit Invoice"} onClose={()=>setDrawer(null)} onSave={save} saveLabel={drawer==="add"?"Create":"Save"}>
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
   ORCHESTRATOR
──────────────────────────────────────────────────────── */
const OrchestratorView = ({ db, setDB }) => {
  const [loading, setLoading] = useState(false);

  // ── All derived live from db on every render ──
  const openTasks      = db.tasks.filter(t => !t.done);
  const criticalTasks  = openTasks.filter(t => t.priority === "critical");
  const highTasks      = openTasks.filter(t => t.priority === "high");
  const overdueInv     = db.invoices.filter(i => i.status === "overdue");
  const pendingInv     = db.invoices.filter(i => i.status === "pending");
  const stalledProj    = db.projects.filter(p => p.status === "stalled");
  const activeProj     = db.projects.filter(p => p.status === "active");
  const activeDeals    = db.deals.filter(d => !["won","lost"].includes(d.stage));
  const atRiskC        = db.contacts.filter(c => c.status === "at-risk");
  const clients        = db.contacts.filter(c => c.status === "client" || c.status === "existing-customer");
  const leads          = db.contacts.filter(c => c.status === "lead" || c.status === "prospect");
  const paidYTD        = db.invoices.filter(i => i.status === "paid").reduce((a,i) => a+i.amount, 0);
  const overdueAR      = overdueInv.reduce((a,i) => a+i.amount, 0);
  const weightedPipe   = Math.round(db.deals.reduce((a,d) => a+d.value*(d.probability/100), 0));
  const totalPipe      = db.deals.reduce((a,d) => a+d.value, 0);
  const revenueGap     = Math.max(0, 800000 - paidYTD);
  const pipelineCoverage = totalPipe > 0 ? Math.round((weightedPipe / revenueGap) * 100) : 0;

  // ── Compute live alerts from actual db state ──
  const liveAlerts = [
    ...overdueInv.map(i => ({
      id:`ov-${i.id}`, agent:"Billing Agent", type:"alert", priority:"critical",
      message:`${i.number} — ${i.client} — ${fmt(i.amount)} OVERDUE (due ${i.due}). ${i.notes||"Immediate follow-up required."}`,
    })),
    ...atRiskC.map(c => ({
      id:`ar-${c.id}`, agent:"CRM Agent", type:"risk", priority:"critical",
      message:`${c.name} (${c.co}) is marked at-risk. Score: ${c.score}/100. Last touch: ${c.lastTouch}. Notes: ${c.notes||"No notes."}`,
    })),
    ...criticalTasks.map(t => ({
      id:`ct-${t.id}`, agent:"Ops Agent", type:"task", priority:"critical",
      message:`CRITICAL: "${t.title}" — due ${t.due}. Assigned: ${t.assignedTo||"unassigned"}.${t.notes?" Guidance: "+t.notes:""}`,
    })),
    ...stalledProj.map(p => ({
      id:`sp-${p.id}`, agent:"Ops Agent", type:"risk", priority:"high",
      message:`Project stalled: "${p.name}" (${p.client}) — ${p.progress}% complete, due ${p.dueDate}. ${p.notes||""}`,
    })),
    ...pendingInv.map(i => ({
      id:`pi-${i.id}`, agent:"Billing Agent", type:"invoice", priority:"medium",
      message:`${i.number} — ${i.client} — ${fmt(i.amount)} pending, due ${i.due}.`,
    })),
    ...highTasks.map(t => ({
      id:`ht-${t.id}`, agent:"CRM Agent", type:"task", priority:"high",
      message:`"${t.title}" — due ${t.due}. Assigned: ${t.assignedTo||"unassigned"}.`,
    })),
    ...(activeDeals.filter(d => d.probability >= 60).map(d => ({
      id:`deal-${d.id}`, agent:"CRM Agent", type:"opportunity", priority:"high",
      message:`${d.name} — ${fmt(d.value)} at ${d.probability}% probability. Close date: ${d.closeDate}. ${d.notes||""}`,
    }))),
    {
      id:"pipe-summary", agent:"Orchestrator", type:"synthesis", priority:"high",
      message:`Pipeline: ${fmt(totalPipe)} total, ${fmt(weightedPipe)} weighted. Revenue gap to $800K: ${fmt(revenueGap)}. Pipeline coverage: ${pipelineCoverage}% of gap. ${leads.length} leads, ${clients.length} active clients.`,
    },
  ].filter(Boolean);

  const agents = [
    { name:"Orchestrator",   color:"var(--purple)", stat:`${criticalTasks.length+stalledProj.length+atRiskC.length} critical`, detail:`${liveAlerts.length} live alerts` },
    { name:"CRM Agent",      color:"var(--blue)",   stat:`${db.contacts.length} contacts`, detail:`${atRiskC.length} at-risk · ${leads.length} leads` },
    { name:"Marketing Agent",color:"var(--amber)",  stat:`${db.campaigns.filter(c=>c.status==="active").length} campaigns`, detail:`${db.campaigns.reduce((a,c)=>a+c.leads,0)} leads` },
    { name:"Ops Agent",      color:"var(--green)",  stat:`${activeProj.length} active`, detail:`${stalledProj.length} stalled · ${openTasks.length} tasks` },
    { name:"Billing Agent",  color:"var(--red)",    stat:`${fmt(overdueAR)} overdue`, detail:`${overdueInv.length} invoices · ${pendingInv.length} pending` },
  ];

  const sweep = async () => {
    setLoading(true);
    try {
      const snap = {
        contacts: db.contacts.map(c=>({name:c.name, co:c.co, status:c.status, score:c.score, lastTouch:c.lastTouch, notes:c.notes})),
        deals: db.deals.map(d=>({name:d.name, value:d.value, stage:d.stage, probability:d.probability, closeDate:d.closeDate, notes:d.notes})),
        projects: db.projects.map(p=>({name:p.name, client:p.client, status:p.status, progress:p.progress, dueDate:p.dueDate, priority:p.priority})),
        tasks: openTasks.map(t=>({title:t.title, due:t.due, priority:t.priority, notes:t.notes||""})),
        invoices: db.invoices.filter(i=>i.status!=="paid").map(i=>({client:i.client, amount:i.amount, status:i.status, due:i.due, number:i.number})),
        metrics: { paidYTD, weightedPipeline:weightedPipe, totalPipeline:totalPipe, overdueAR, revenueGap, openTasks:openTasks.length, criticalTasks:criticalTasks.length, stalledProjects:stalledProj.length, atRisk:atRiskC.length, leads:leads.length, clients:clients.length },
      };
      const msg = await callClaude(
        `You are Mendy Ezagui's Orchestrator Agent. He's an independent AI ops consultant in LA, targeting property management/HOA. Revenue target $800K. Be specific — name names, cite numbers from the actual snapshot. One tight paragraph, max 4 sentences.`,
        `Live database snapshot — ${new Date().toLocaleDateString()}:\n${JSON.stringify(snap,null,2)}\n\nSurface the single most important thing Mendy needs to act on RIGHT NOW. Reference specific people, deals, or tasks by name. What's at stake and what exactly should he do today?`,
        500
      );
      const ts = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
      setDB(d=>({...d, agentLogs:[
        {id:nextId(d.agentLogs)+1, agent:"Orchestrator", type:"synthesis", message:msg, ts, priority:"high"},
        ...d.agentLogs,
      ]}));
    } catch {
      const ts = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
      setDB(d=>({...d, agentLogs:[{id:nextId(d.agentLogs), agent:"Orchestrator", type:"error", message:"Sweep failed. Check API connection.", ts, priority:"medium"}, ...d.agentLogs]}));
    }
    setLoading(false);
  };

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div className="display" style={{ fontSize:18, fontWeight:700 }}>Orchestrator</div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginTop:3 }}>
            Live · {db.contacts.length} contacts · {activeDeals.length} deals · {openTasks.length} open tasks · updated on every change
          </div>
        </div>
        <button className="btn btn-blue" onClick={sweep} disabled={loading} style={{ opacity:loading?0.6:1 }}>
          {loading?<><Loader size={13} className="spin"/>Running AI sweep…</>:<><Zap size={13}/>Run AI Insight Sweep</>}
        </button>
      </div>

      {/* Agent stat cards — live computed */}
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

      {/* Live metrics strip */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[
          { label:"YTD Collected",    val:fmt(paidYTD),         color:"var(--green)" },
          { label:"Wtd Pipeline",     val:fmt(weightedPipe),    color:"var(--blue)" },
          { label:"Pipeline Coverage",val:`${pipelineCoverage}%`, color:pipelineCoverage>=80?"var(--green)":pipelineCoverage>=40?"var(--amber)":"var(--red)" },
          { label:"Overdue A/R",      val:fmt(overdueAR),       color:"var(--red)" },
          { label:"Revenue Gap",      val:fmt(revenueGap),      color:"var(--amber)" },
          { label:"Critical Items",   val:criticalTasks.length + atRiskC.length + stalledProj.length, color:"var(--red)" },
        ].map(m=>(
          <div key={m.label} className="card-el" style={{ padding:"8px 14px", display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontFamily:"var(--font-d)", fontWeight:700, fontSize:15, color:m.color }}>{m.val}</span>
            <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* LIVE ALERTS — computed from db, always current */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>LIVE STATUS — {liveAlerts.length} alerts from current data</div>
          <span className="mono" style={{ fontSize:10, color:"var(--green)" }}>● auto-updates on every record change</span>
        </div>
        {liveAlerts.length === 0 ? (
          <div className="card-el" style={{ padding:20, textAlign:"center" }}>
            <CheckCircle size={22} style={{ color:"var(--green)", margin:"0 auto 8px" }}/>
            <p style={{ fontSize:13, color:"var(--text-sec)" }}>No critical alerts. All records look healthy.</p>
          </div>
        ) : liveAlerts.map(l=>(
          <div key={l.id} className="card-el" style={{ padding:"12px 14px", marginBottom:8, borderLeft:`2px solid ${sc(l.priority)}` }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
              <AgentBadge agent={l.agent}/>
              <Tag label={l.type} color={sc(l.priority)}/>
              <Tag label={l.priority}/>
            </div>
            <p style={{ fontSize:13, lineHeight:1.5 }}>{l.message}</p>
          </div>
        ))}
      </div>

      {/* AI Sweep log — historical, appended by sweep button */}
      {db.agentLogs.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:10 }}>AI SWEEP LOG — {db.agentLogs.length} entries</div>
          {db.agentLogs.map(l=>(
            <div key={l.id} className="card-el" style={{ padding:"12px 14px", marginBottom:8, borderLeft:`2px solid ${sc(l.priority)}`, opacity:0.85 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
                <AgentBadge agent={l.agent}/><Tag label={l.type} color={sc(l.priority)}/><span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>{l.ts}</span>
              </div>
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
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const recRef = useRef(null);
  const start = () => {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setTranscript("Speech recognition unavailable. Paste transcript below.");return;}
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=e=>{let t="";for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;setTranscript(t);};
    r.start();recRef.current=r;setRecording(true);
  };
  const stop = () => {recRef.current?.stop();setRecording(false);};
  const analyze = async () => {
    if(!transcript.trim())return;
    setLoading(true);
    try {
      const raw = await callClaude("You are Mendy Ezagui's Orchestrator Agent. Extract entities, actions, BD opportunities from voice notes. Respond JSON: {\"summary\":\"\",\"entities\":[],\"actions\":[],\"opportunities\":[],\"module\":\"\"}",`Voice note: "${transcript}"`,600);
      try{setAnalysis(JSON.parse(raw));}catch{setAnalysis({summary:raw,entities:[],actions:[],opportunities:[],module:"general"});}
      setDB(d=>({...d,voiceNotes:[{id:nextId(d.voiceNotes||[{id:0}]),transcript,ts:new Date().toLocaleTimeString()},...(d.voiceNotes||[])]}));
    } catch{setAnalysis({summary:"API error.",entities:[],actions:[],opportunities:[]});}
    setLoading(false);
  };
  return (
    <div style={{ padding:24, maxWidth:640, display:"flex", flexDirection:"column", gap:20 }}>
      <div className="display" style={{ fontSize:18, fontWeight:700 }}>Voice Lab</div>
      <div className="card" style={{ padding:24, textAlign:"center" }}>
        <div onClick={recording?stop:start} style={{ width:72, height:72, borderRadius:"50%", background:recording?"var(--red-dim)":"var(--blue-dim)", border:`2px solid ${recording?"var(--red)":"var(--blue)"}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", cursor:"pointer" }}>
          {recording?<MicOff size={26} color="var(--red)"/>:<Mic size={26} color="var(--blue)"/>}
        </div>
        <p style={{ fontSize:13, color:"var(--text-sec)", marginBottom:14 }}>{recording?"Recording… tap to stop":"Tap to start recording"}</p>
        <textarea className="input" placeholder="Or paste transcript here…" value={transcript} onChange={e=>setTranscript(e.target.value)} style={{ marginBottom:12 }}/>
        <button className="btn btn-blue" onClick={analyze} disabled={!transcript.trim()||loading} style={{ width:"100%", justifyContent:"center", opacity:(!transcript.trim()||loading)?0.5:1 }}>
          {loading?<><Loader size={13} className="spin"/>Analyzing…</>:<><Brain size={13}/>Analyze with AI</>}
        </button>
      </div>
      {analysis&&<div className="card slide-in" style={{ padding:20 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}><Brain size={14} color="var(--blue)"/><span style={{ fontSize:13, fontWeight:600, color:"var(--blue)" }}>Orchestrator Analysis</span></div>
        <p style={{ fontSize:13, lineHeight:1.6, marginBottom:14 }}>{analysis.summary}</p>
        {analysis.actions?.length>0&&<div style={{ marginBottom:12 }}>
          <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:7 }}>ACTIONS</div>
          {analysis.actions.map((a,i)=><div key={i} className="card-el" style={{ padding:"9px 12px", marginBottom:6, fontSize:13, display:"flex", gap:7 }}><Zap size={12} color="var(--amber)" style={{flexShrink:0,marginTop:1}}/>{a}</div>)}
        </div>}
        {analysis.opportunities?.length>0&&<div>
          <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:7 }}>BD OPPORTUNITIES</div>
          {analysis.opportunities.map((o,i)=><div key={i} className="card-el" style={{ padding:"9px 12px", marginBottom:6, fontSize:13, display:"flex", gap:7, borderLeft:"2px solid var(--green)" }}><Target size={12} color="var(--green)" style={{flexShrink:0,marginTop:1}}/>{o}</div>)}
        </div>}
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
      try{setResult(JSON.parse(raw));}catch{setResult({summary:raw,entities:{},actions:[],opportunities:[],sentiment:"neutral",urgency:"medium",module:"general"});}
    }catch{setResult({summary:"Error. Check connection.",entities:{},actions:[],opportunities:[]});}
    setLoading(false);
  };
  return (
    <div style={{ padding:24, maxWidth:640, display:"flex", flexDirection:"column", gap:20 }}>
      <div className="display" style={{ fontSize:18, fontWeight:700 }}>Email Lab</div>
      <div className="card" style={{ padding:20 }}>
        <p style={{ fontSize:13, color:"var(--text-sec)", marginBottom:12 }}>Paste an email — the AI agent extracts entities, routes to the right module, and surfaces BD opportunities.</p>
        <textarea className="input" placeholder="Paste email content here…" value={email} onChange={e=>setEmail(e.target.value)} style={{ minHeight:160, marginBottom:12 }}/>
        <button className="btn btn-blue" onClick={parse} disabled={!email.trim()||loading} style={{ width:"100%", justifyContent:"center", opacity:(!email.trim()||loading)?0.5:1 }}>
          {loading?<><Loader size={13} className="spin"/>Parsing…</>:<><Brain size={13}/>Parse & Extract Intelligence</>}
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
        {result.actions?.length>0&&<div style={{ marginBottom:12 }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:6 }}>ACTIONS</div>{result.actions.map((a,i)=><div key={i} className="card-el" style={{ padding:"9px 12px", marginBottom:6, fontSize:13, display:"flex", gap:7 }}><Zap size={12} color="var(--amber)" style={{flexShrink:0,marginTop:1}}/>{a}</div>)}</div>}
        {result.opportunities?.length>0&&<div style={{ marginBottom:12 }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:6 }}>BD OPPORTUNITIES</div>{result.opportunities.map((o,i)=><div key={i} className="card-el" style={{ padding:"9px 12px", marginBottom:6, fontSize:13, display:"flex", gap:7, borderLeft:"2px solid var(--green)" }}><Target size={12} color="var(--green)" style={{flexShrink:0,marginTop:1}}/>{o}</div>)}</div>}
        {result.suggestedResponse&&<div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:6 }}>SUGGESTED RESPONSE</div><div className="card-el" style={{ padding:13, fontSize:13, lineHeight:1.6, borderLeft:"2px solid var(--blue)" }}>{result.suggestedResponse}</div></div>}
      </div>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   APP ROOT
──────────────────────────────────────────────────────── */
export default function App() {
  const [session,   setSession]   = useState(undefined);
  const [db,        setDB]        = useState(null);
  const [view,      setView]      = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobile,    setMobile]    = useState(window.innerWidth < 768);
  const dbRef    = useRef(null);
  const syncLock = useRef(false);

  // ── Auth listener ──
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      if (!s) setDB(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load data when authenticated ──
  useEffect(() => {
    if (!supabase || !session) return;
    loadAllFromDB().then(data => { setDB(data); dbRef.current = data; });
  }, [session?.user?.id]);

  // ── Sync db changes to Supabase ──
  useEffect(() => {
    if (!db || !dbRef.current || syncLock.current) return;
    const prev = dbRef.current;
    if (prev === db) return;
    // Capture prev BEFORE updating ref, so concurrent renders don't clobber it
    dbRef.current = db;
    syncLock.current = true;
    syncToDB(prev, db)
      .catch(err => console.error("Supabase sync error:", err))
      .finally(() => { syncLock.current = false; });
  }, [db]);

  // ── Resize handler ──
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ── Auth / loading gates (ALL after hooks — React rules of hooks) ──
  if (!ENV_READY) return (
    <>
      <GlobalStyle/>
      <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
        <div className="card" style={{ width:"min(480px,92vw)", padding:36, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"var(--red-dim)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <AlertCircle size={22} color="var(--red)"/>
            </div>
            <div>
              <div className="display" style={{ fontSize:16, fontWeight:700 }}>Missing Environment Variables</div>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginTop:2 }}>App cannot start without Supabase credentials</div>
            </div>
          </div>
          <div style={{ background:"var(--bg-el)", borderRadius:8, padding:"14px 16px", display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { key:"VITE_SUPABASE_URL",      val:SUPA_URL,  ex:"https://xxxx.supabase.co" },
              { key:"VITE_SUPABASE_ANON_KEY", val:SUPA_KEY,  ex:"eyJ..." },
            ].map(({ key, val, ex }) => (
              <div key={key} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:val ? "var(--green)" : "var(--red)", flexShrink:0 }}/>
                <span className="mono" style={{ fontSize:11 }}>{key}</span>
                <span className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginLeft:"auto" }}>{val ? "✓ set" : `missing — e.g. ${ex}`}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12, color:"var(--text-sec)", lineHeight:1.7 }}>
            Go to <strong>Vercel → Project → Settings → Environment Variables</strong> and add the missing keys, then redeploy. Get values from <strong>Supabase → Settings → API</strong>.
          </p>
        </div>
      </div>
    </>
  );
  if (session === undefined) return <><GlobalStyle/><LoadingScreen msg="Checking auth…"/></>;
  if (!session)              return <LoginScreen/>;
  if (!db)                   return <><GlobalStyle/><LoadingScreen msg="Loading your data…"/></>;

  const alerts = (db.agentLogs||[]).filter(l => l.priority === "critical").length;
  const VIEWS = {
    dashboard:    <Dashboard db={db} setView={setView}/>,
    orchestrator: <OrchestratorView db={db} setDB={setDB}/>,
    crm:          <CRMView db={db} setDB={setDB}/>,
    deals:        <DealsView db={db} setDB={setDB}/>,
    marketing:    <MarketingView db={db} setDB={setDB}/>,
    operations:   <OperationsView db={db} setDB={setDB}/>,
    billing:      <BillingView db={db} setDB={setDB}/>,
    voice:        <VoiceView db={db} setDB={setDB}/>,
    email:        <EmailView db={db} setDB={setDB}/>,
  };

  return (
    <>
      <GlobalStyle/>
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)", overflow:"hidden" }}>
        {/* TOP BAR */}
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
            <button className="btn btn-ghost" style={{ padding:"4px 10px", fontSize:11 }}
              onClick={()=>supabase.auth.signOut()}>
              Sign out
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {!mobile && <Sidebar view={view} setView={setView} collapsed={collapsed} setCollapsed={setCollapsed} alerts={alerts}/>}
          <main style={{ flex:1, overflowY:"auto" }}>
            {VIEWS[view] || VIEWS.dashboard}
          </main>
        </div>

        {mobile && <BottomNav view={view} setView={setView}/>}
      </div>
    </>
  );
}
