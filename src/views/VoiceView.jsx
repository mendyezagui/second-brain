import { useEffect, useRef, useState } from "react";
import { AlertCircle, Briefcase, Check, CheckCircle, FileText, Loader, Mic, MicOff, Sparkles, Target, Users, Zap } from "lucide-react";
import { callClaude, nextId, today } from "../lib/utils";

export const VoiceView = ({ db, setDB, autoRecord }) => {
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
