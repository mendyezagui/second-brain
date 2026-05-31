import { useMemo, useState } from "react";
import { BookOpen, FileText, Loader, Save, Sparkles, X, Zap } from "lucide-react";
import { ASSOCIATES } from "../lib/constants";
import { blankDocument, callClaude, nextId, today } from "../lib/utils";
import { Field, Inp, SearchSelect, Tex } from "../components/ui";
import { recordLink } from "./RecordDetailView";
import { blankTask } from "./TasksView";

export const selectedAssociations = ({ contactId, companyId, dealId, projectId }) => [
  contactId && { type:"contact", id:Number(contactId) || contactId },
  companyId && { type:"company", id:Number(companyId) || companyId },
  dealId && { type:"deal", id:Number(dealId) || dealId },
  projectId && { type:"project", id:Number(projectId) || projectId },
].filter(Boolean);

export const collectAssociateContext = (db, ids) => {
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

export const AssociatesView = ({ db, setDB, navigate }) => {
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
