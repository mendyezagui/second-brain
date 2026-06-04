import { useEffect, useRef, useState } from "react";
import { Briefcase, Check, ChevronRight, FileText, Loader, Plus, Save, Search, Sparkles, Target, Trash2, Upload, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { callClaude, nextId, sc, today } from "../lib/utils";
import { AssociatedDocumentsPanel, ConfirmDelete, Drawer, EntityLink, Field, Inp, SearchSelect, Sel, Tag, Tex } from "../components/ui";
import { blankTask } from "./TasksView";

export const blankProject = () => ({ name:"", client:"", companyId:"", type:"client", status:"active", progress:0, dueDate:"", priority:"medium", notes:"", links:[], files:[], strategyId:"" });

export const ProjectsView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pd, setPD] = useState(blankProject());
  const [editProject, setEditProject] = useState(null);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProposals, setAiProposals] = useState(null);
  const [selectedProposals, setSelectedProposals] = useState({});
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileInputRef = useRef(null);
  const inlineFileInputRef = useRef(null);

  useEffect(() => {
    if(focus?.type==="project" && focus.id) { setSel(focus.id); } else setSel(null);
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const p = db.projects.find(x => x.id === sel);
      if (p) setEditProject({...p, progress:String(p.progress), companyId:String(p.companyId||""), strategyId:String(p.strategyId||""), links:p.links||[], files:p.files||[]});
    } else setEditProject(null);
  }, [sel, db.projects]);

  const filtered = db.projects.filter(p => {
    if (query && !`${p.name} ${p.client||""}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });
  const project = sel ? db.projects.find(p => p.id === sel) : null;
  const projectTasks = project ? db.tasks.filter(t => t.projectId === project.id) : [];
  const projectCompany = project && project.companyId ? db.companies.find(c => c.id === project.companyId) : null;
  const projectStrategy = project && project.strategyId ? (db.strategies||[]).find(s => s.id === project.strategyId) : null;

  const saveInline = () => {
    if (!editProject) return;
    const rec = {...editProject, progress:parseInt(editProject.progress)||0, companyId:parseInt(editProject.companyId)||null, strategyId:parseInt(editProject.strategyId)||null, links:editProject.links||[], files:editProject.files||[]};
    setDB(d => ({...d, projects: d.projects.map(p => p.id === rec.id ? rec : p)}));
  };
  const saveProject = (d) => {
    const rec = {...d, progress:parseInt(d.progress)||0, companyId:parseInt(d.companyId)||null, strategyId:parseInt(d.strategyId)||null, links:d.links||[], files:d.files||[]};
    setDB(db=>({...db,projects:[...db.projects,{...rec,id:nextId(db.projects)}]}));
    setDrawer(null);
  };

  const inlineFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = 'projects/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        const { error } = await supabase.storage.from('memory-files').upload(path, file);
        if (error) continue;
        const { data: urlData } = supabase.storage.from('memory-files').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size, path });
      }
      setEditProject(p => ({ ...p, files: [...(p.files||[]), ...uploaded] }));
    } finally { setUploading(false); if (inlineFileInputRef.current) inlineFileInputRef.current.value = ''; }
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
        if (error) continue;
        const { data: urlData } = supabase.storage.from('memory-files').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size, path });
      }
      setPD(p => ({ ...p, files: [...(p.files||[]), ...uploaded] }));
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };
  const removeInlineFile = async (f) => {
    if (f.path) await supabase.storage.from('memory-files').remove([f.path]);
    setEditProject(p => ({...p, files:(p.files||[]).filter(x => x.path !== f.path)}));
  };
  const formatFileSize = (bytes) => { if (!bytes) return ''; if (bytes < 1024) return bytes + ' B'; if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB'; return (bytes/1048576).toFixed(1) + ' MB'; };
  const delProject = (id) => { setDB(db=>({...db,projects:db.projects.filter(x=>x.id!==id)})); if (sel === id) setSel(null); setConfirm(null); };
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
      const seln = {}; tasks.forEach((_,i) => seln[i]=true);
      setSelectedProposals(seln);
    } catch(e) { setAiProposals([]); }
    setAiLoading(false);
  };

  const commitProposals = () => {
    const toAdd = (aiProposals||[]).filter((_,i) => selectedProposals[i]);
    if(toAdd.length > 0) {
      const companyId = project?.companyId || null;
      setDB(db => {
        let id = nextId(db.tasks);
        return {...db, tasks:[...db.tasks, ...toAdd.map(t => ({...blankTask(), ...t, id:id++, projectId:project.id, companyId, source:"agent:ai_sweep"}))]};
      });
    }
    setAiProposals(null); setAiInput(""); setSelectedProposals({});
  };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Projects</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setPD(blankProject());setDrawer({mode:"add",type:"project"});}}><Plus size={12}/>Add</button>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
            {["all","active","stalled","complete","on-hold"].map(s=>(
              <button key={s} className={`filter-chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search..." value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(p => {
            const open = db.tasks.filter(t => t.projectId === p.id && !t.done && t.status !== "done").length;
            return (
              <div key={p.id} className="row-hover" onClick={()=>navigate("record",{type:"project",id:p.id})}
                style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===p.id?"var(--bg-hover)":"transparent", borderLeft:`3px solid ${sc(p.status)}` }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{p.client||""} · {open} open</div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                  <div style={{ flex:1, height:4, background:"var(--bg-el)", borderRadius:2 }}><div style={{ height:"100%", width:`${p.progress||0}%`, background:p.progress<40?"var(--red)":p.progress<70?"var(--amber)":"var(--green)", borderRadius:2 }}/></div>
                  <span className="mono" style={{ fontSize:9, color:"var(--text-sec)" }}>{p.progress||0}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(project && editProject) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("projects");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to projects</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{project.name}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>
                  {projectCompany ? <EntityLink type="company" id={projectCompany.id} navigate={navigate}>{projectCompany.name}</EntityLink> : project.client||""}
                  {project.dueDate && ` · Due ${project.dueDate}`}
                </div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={project.priority}/><Tag label={project.status}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:project.id,label:project.name})}><Trash2 size={12}/></button>
              </div>
            </div>

            <div className="grid-resp-4" style={{ marginBottom:16 }}>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--blue)" }}>{project.progress||0}%</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Progress</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--green)" }}>{projectTasks.filter(t=>t.done).length}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Done</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--amber)" }}>{projectTasks.filter(t=>!t.done).length}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Open</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:13, fontWeight:600 }}>{(project.type||"client").toUpperCase()}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Type</div></div>
            </div>

            {projectStrategy && <div className="card-el" style={{ padding:"10px 14px", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
              <Target size={13} color="var(--purple)"/>
              <span style={{ fontSize:12 }}>Strategy: <EntityLink type="strategy" id={projectStrategy.id} navigate={navigate}>{projectStrategy.name}</EntityLink></span>
            </div>}

            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Project Name"><Inp value={editProject.name} onChange={v=>setEditProject(p=>({...p,name:v}))}/></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Client"><Inp value={editProject.client||""} onChange={v=>setEditProject(p=>({...p,client:v}))}/></Field>
                <Field label="Company"><SearchSelect value={editProject.companyId} onChange={v=>setEditProject(p=>({...p,companyId:v}))} options={db.companies.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search..."/></Field>
                <Field label="Status"><Sel value={editProject.status} onChange={v=>setEditProject(p=>({...p,status:v}))} options={["active","stalled","complete","on-hold"]}/></Field>
                <Field label="Type"><Sel value={editProject.type||"client"} onChange={v=>setEditProject(p=>({...p,type:v}))} options={["client","strategic"]}/></Field>
                <Field label="Priority"><Sel value={editProject.priority} onChange={v=>setEditProject(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
                <Field label="Progress (%)"><Inp type="number" value={editProject.progress} onChange={v=>setEditProject(p=>({...p,progress:v}))}/></Field>
                <Field label="Due Date"><Inp type="date" value={editProject.dueDate||""} onChange={v=>setEditProject(p=>({...p,dueDate:v}))}/></Field>
                <Field label="Strategy"><Sel value={editProject.strategyId||""} onChange={v=>setEditProject(p=>({...p,strategyId:v}))} options={[{value:"",label:"None"},...(db.strategies||[]).map(s=>({value:String(s.id),label:s.name}))]}/></Field>
              </div>
              <Field label="Notes"><Tex value={editProject.notes||""} onChange={v=>setEditProject(p=>({...p,notes:v}))}/></Field>

              {/* Links */}
              <div style={{ marginTop:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--text-sec)" }}>Links</span>
                  <button type="button" className="btn btn-ghost" style={{ fontSize:11, padding:"3px 8px" }} onClick={()=>setEditProject(p=>({...p,links:[...(p.links||[]),{url:"",label:""}]}))}>+ Add Link</button>
                </div>
                {(editProject.links||[]).map((lnk,li)=>(
                  <div key={li} style={{ display:"flex", gap:6, marginBottom:8 }}>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                      <input className="input" placeholder="Label" value={lnk.label||""} onChange={e=>{const links=[...editProject.links];links[li]={...links[li],label:e.target.value};setEditProject(p=>({...p,links}));}} style={{ padding:"6px 8px", fontSize:12 }}/>
                      <input className="input" placeholder="https://..." value={lnk.url||""} onChange={e=>{const links=[...editProject.links];links[li]={...links[li],url:e.target.value};setEditProject(p=>({...p,links}));}} style={{ padding:"6px 8px", fontSize:12 }}/>
                    </div>
                    <button onClick={()=>setEditProject(p=>({...p,links:p.links.filter((_,i)=>i!==li)}))} style={{ background:"none", border:"none", color:"var(--red)", cursor:"pointer" }}><X size={14}/></button>
                  </div>
                ))}
              </div>

              {/* Files */}
              <div style={{ marginTop:14, borderTop:"1px solid var(--border)", paddingTop:14 }}>
                <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>ATTACHED FILES</div>
                {(editProject.files||[]).map((f,fi)=>(
                  <div key={fi} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:6, background:"var(--bg-el)", border:"1px solid var(--border)", marginBottom:4 }}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--blue)", textDecoration:"none", overflow:"hidden" }}>
                      <FileText size={13}/><span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{f.name}</span>
                      <span className="mono" style={{ fontSize:10, color:"var(--text-dim)" }}>{f.size?'('+formatFileSize(f.size)+')':''}</span>
                    </a>
                    <button onClick={()=>removeInlineFile(f)} style={{ background:"none", border:"none", color:"var(--red)", cursor:"pointer" }}><X size={12}/></button>
                  </div>
                ))}
                <input ref={inlineFileInputRef} type="file" multiple style={{ display:"none" }} onChange={inlineFileUpload}/>
                <button className="btn btn-ghost" onClick={()=>inlineFileInputRef.current?.click()} disabled={uploading} style={{ fontSize:12, marginTop:6 }}>
                  {uploading ? <><Loader size={12} className="spin"/>Uploading...</> : <><Upload size={12}/>Upload Files</>}
                </button>
              </div>
            </div>

            {/* Project tasks */}
            <div className="card-el" style={{ padding:14, marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>PROJECT TASKS ({projectTasks.length})</div>
              {projectTasks.length > 0 ? projectTasks.map(t=>(
                <div key={t.id} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                  <button onClick={()=>toggleTask(t.id)} style={{ width:16, height:16, borderRadius:3, border:`2px solid ${t.done?"var(--green)":"var(--border-hi)"}`, background:t.done?"var(--green)":"transparent", cursor:"pointer", flexShrink:0 }}>{t.done&&<Check size={9} color="#fff"/>}</button>
                  <span style={{ fontSize:12, flex:1, textDecoration:t.done?"line-through":"none", opacity:t.done?0.5:1 }}><EntityLink type="task" id={t.id} navigate={navigate}>{t.title}</EntityLink></span>
                  <Tag label={t.priority}/>
                  <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{t.due||""}</span>
                </div>
              )) : <div style={{ fontSize:12, color:"var(--text-dim)" }}>No tasks yet. Use the AI agent below to generate some.</div>}
            </div>

            {/* AI agent */}
            <div className="card" style={{ padding:14, marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}><Sparkles size={13} color="var(--blue)"/><span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>AI TASK AGENT</span></div>
              <textarea className="input" value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder="Describe what needs to happen..." style={{ marginBottom:8 }}/>
              <button className="btn btn-blue" onClick={()=>handleAIGenerate(project.id)} disabled={aiLoading||!aiInput.trim()} style={{ fontSize:12 }}>
                {aiLoading ? <><Loader size={12} className="spin"/>Thinking...</> : <><Sparkles size={12}/>Generate Tasks</>}
              </button>
              {aiProposals && aiProposals.length > 0 && (
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
                        <div style={{ display:"flex", gap:4, marginTop:3 }}><Tag label={t.priority}/>{t.due&&<span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>Due {t.due}</span>}</div>
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

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="project" entityId={project.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Briefcase size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a project</p>
          </div>
        )}
      </div>

      {drawer?.type==="project"&&drawer.mode==="add"&&<Drawer title="New Project" onClose={()=>setDrawer(null)} onSave={()=>saveProject(pd)}>
        <Field label="Project Name"><Inp value={pd.name} onChange={v=>setPD(p=>({...p,name:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Client"><Inp value={pd.client} onChange={v=>setPD(p=>({...p,client:v}))}/></Field>
          <Field label="Company"><SearchSelect value={pd.companyId||""} onChange={v=>setPD(p=>({...p,companyId:v}))} options={db.companies.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search..."/></Field>
          <Field label="Status"><Sel value={pd.status} onChange={v=>setPD(p=>({...p,status:v}))} options={["active","stalled","complete","on-hold"]}/></Field>
          <Field label="Type"><Sel value={pd.type||"client"} onChange={v=>setPD(p=>({...p,type:v}))} options={["client","strategic"]}/></Field>
          <Field label="Priority"><Sel value={pd.priority} onChange={v=>setPD(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
          <Field label="Due Date"><Inp type="date" value={pd.dueDate} onChange={v=>setPD(p=>({...p,dueDate:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={pd.notes} onChange={v=>setPD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>delProject(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};
