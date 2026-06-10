import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle, ChevronRight, Plus, Save, Search, Trash2 } from "lucide-react";
import { TASK_CATEGORIES, TASK_STATUSES } from "../lib/constants";
import { nextId, today } from "../lib/utils";
import { AssociatedDocumentsPanel, ConfirmDelete, Drawer, EntityLink, Field, Inp, SearchSelect, Sel, Tag, Tex, useListControls } from "../components/ui";

export const blankTask = () => ({ title:"", projectId:"", contactId:"", companyId:"", dealId:"", due:"", done:false, priority:"medium", assignedTo:"", notes:"", status:"todo", category:"follow_up", source:"manual", recurrence:"none", reschedule_count:0 });

export const TasksView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [td, setTD] = useState(blankTask());
  const [editTask, setEditTask] = useState(null);


  useEffect(() => {
    if(focus?.type==="task" && focus.id) { setSel(focus.id); } else setSel(null);
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const t = db.tasks.find(x => x.id === sel);
      if (t) setEditTask({...t, projectId: String(t.projectId||""), contactId: String(t.contactId||""), companyId: String(t.companyId||""), dealId: String(t.dealId||"")});
    } else setEditTask(null);
  }, [sel, db.tasks]);

  const { rows: filteredTasks, controls } = useListControls(db.tasks, {
    search: {
      keys: ["title", "notes",
        (t) => db.contacts.find((c) => c.id === t.contactId)?.name,
        (t) => db.companies.find((c) => c.id === t.companyId)?.name,
        (t) => db.projects.find((p) => p.id === t.projectId)?.name],
      placeholder: "Search tasks…",
    },
    facets: [
      { key: "status", label: "Status", field: "status", default: "open", options: [
        { value: "open", label: "Open", test: (t) => !t.done && t.status !== "done" && t.status !== "cancelled" },
        ...TASK_STATUSES,
      ] },
      { key: "priority", label: "Priority", field: "priority", options: ["critical", "high", "medium", "low"] },
      { key: "category", label: "Category", field: "category", options: TASK_CATEGORIES },
      { key: "source", label: "Source", options: [
        { value: "mine", label: "Mine", test: (t) => !(t.source || "").startsWith("agent:") },
        { value: "agent", label: "Agent", test: (t) => (t.source || "").startsWith("agent:") },
      ] },
    ],
    sorts: [
      { key: "due", label: "Due date", field: (t) => t.due || "9999" },
      { key: "priority", label: "Urgency", field: (t) => ({ critical: 0, high: 1, medium: 2, low: 3 }[t.priority] ?? 9) },
      { key: "created", label: "Recently added", field: (t) => t.id || 0 },
    ],
    defaultSort: { key: "due", dir: "asc" },
  });

  const saveInline = () => {
    if (!editTask) return;
    const rec = {...editTask, projectId: parseInt(editTask.projectId)||null, contactId: parseInt(editTask.contactId)||null, companyId: parseInt(editTask.companyId)||null, dealId: parseInt(editTask.dealId)||null};
    setDB(db => {
      const old = db.tasks.find(x => x.id === rec.id);
      let updated = {...rec};
      if (old && old.due !== rec.due && rec.due) {
        updated.reschedule_count = (old.reschedule_count||0) + 1;
        if (updated.reschedule_count >= 3) {
          updated.priority = "low";
          updated.notes = (updated.notes ? updated.notes+"\n" : "") + "Auto-downgraded: due date changed "+updated.reschedule_count+" times.";
        }
      }
      return {...db, tasks: db.tasks.map(x => x.id === rec.id ? updated : x)};
    });
  };
  const saveTask = (d) => {
    const rec = {...d, projectId:parseInt(d.projectId)||null, contactId:parseInt(d.contactId)||null, companyId:parseInt(d.companyId)||null, dealId:parseInt(d.dealId)||null};
    setDB(db=>({...db,tasks:[...db.tasks,{...rec,id:nextId(db.tasks)}]}));
    setDrawer(null);
  };
  const delTask = (id) => { setDB(db=>({...db,tasks:db.tasks.filter(x=>x.id!==id)})); if (sel === id) setSel(null); setConfirm(null); };
  const toggleTask = (id) => setDB(db=>({...db,tasks:db.tasks.map(t=>t.id===id?{...t,done:!t.done,status:t.done?"todo":"done"}:t)}));

  const task = sel ? db.tasks.find(t => t.id === sel) : null;
  const taskContact = task && task.contactId ? db.contacts.find(c => c.id === task.contactId) : null;
  const taskCompany = task && task.companyId ? db.companies.find(c => c.id === task.companyId) : null;
  const taskProject = task && task.projectId ? db.projects.find(p => p.id === task.projectId) : null;

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Tasks</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setTD(blankTask());setDrawer({mode:"add",type:"task"});}}><Plus size={12}/>Add</button>
          </div>
          {controls}
          <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:6 }}>{filteredTasks.length} task{filteredTasks.length!==1?"s":""}</div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filteredTasks.map(t => {
            const isOverdue = t.due && t.due < today() && !t.done;
            return (
              <div key={t.id} className="row-hover" onClick={()=>navigate("record",{type:"task",id:t.id})}
                style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===t.id?"var(--bg-hover)":"transparent", opacity:t.done?0.55:1, display:"flex", gap:8, alignItems:"flex-start", borderLeft:isOverdue?"3px solid var(--red)":t.priority==="critical"?"3px solid var(--red)":undefined }}>
                <button onClick={(e)=>{e.stopPropagation();toggleTask(t.id);}} style={{ width:16, height:16, borderRadius:3, border:`2px solid ${t.done?"var(--green)":"var(--border-hi)"}`, background:t.done?"var(--green)":"transparent", cursor:"pointer", flexShrink:0, marginTop:2 }}>{t.done&&<Check size={9} color="#fff"/>}</button>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, textDecoration:t.done?"line-through":"none" }}>{t.title}</div>
                  <div className="mono" style={{ fontSize:10, color:isOverdue?"var(--red)":"var(--text-sec)", marginTop:2 }}>{t.due ? (isOverdue?"OVERDUE ":"Due ")+t.due : t.category}</div>
                </div>
                <Tag label={t.priority}/>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(task && editTask) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("tasks");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to tasks</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0, display:"flex", alignItems:"flex-start", gap:10 }}>
                <button onClick={()=>toggleTask(task.id)} style={{ width:22, height:22, borderRadius:5, border:`2px solid ${task.done?"var(--green)":"var(--border-hi)"}`, background:task.done?"var(--green)":"transparent", cursor:"pointer", flexShrink:0, marginTop:6 }}>{task.done&&<Check size={13} color="#fff"/>}</button>
                <div>
                  <div className="display" style={{ fontSize:20, fontWeight:800, textDecoration:task.done?"line-through":"none" }}>{task.title}</div>
                  <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{task.due ? `Due ${task.due}` : ""}{task.assignedTo?` · ${task.assignedTo}`:""}</div>
                </div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={task.priority}/>
                <Tag label={task.status?.replace(/_/g," ")||"todo"}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:task.id,label:task.title})}><Trash2 size={12}/></button>
              </div>
            </div>

            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Task Title"><Inp value={editTask.title} onChange={v=>setEditTask(p=>({...p,title:v}))}/></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Status"><Sel value={editTask.status} onChange={v=>setEditTask(p=>({...p,status:v}))} options={TASK_STATUSES.map(s=>({value:s,label:s.replace(/_/g," ")}))}/></Field>
                <Field label="Priority"><Sel value={editTask.priority} onChange={v=>setEditTask(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
                <Field label="Category"><Sel value={editTask.category} onChange={v=>setEditTask(p=>({...p,category:v}))} options={TASK_CATEGORIES.map(c=>({value:c,label:c.replace(/_/g," ")}))}/></Field>
                <Field label="Due Date"><Inp type="date" value={editTask.due||""} onChange={v=>setEditTask(p=>({...p,due:v}))}/></Field>
                <Field label="Person"><SearchSelect value={editTask.contactId} onChange={v=>setEditTask(p=>({...p,contactId:v}))} options={db.contacts.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search..." entityType="contact" navigate={navigate}/></Field>
                <Field label="Company"><SearchSelect value={editTask.companyId} onChange={v=>setEditTask(p=>({...p,companyId:v}))} options={db.companies.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search..." entityType="company" navigate={navigate}/></Field>
                <Field label="Project"><SearchSelect value={editTask.projectId} onChange={v=>setEditTask(p=>({...p,projectId:v}))} options={db.projects.map(x=>({value:String(x.id),label:x.name}))} placeholder="Search..." entityType="project" navigate={navigate}/></Field>
                <Field label="Deal"><SearchSelect value={editTask.dealId} onChange={v=>setEditTask(p=>({...p,dealId:v}))} options={db.deals.map(x=>({value:String(x.id),label:x.name}))} placeholder="Search..." entityType="deal" navigate={navigate}/></Field>
                <Field label="Assigned To"><Inp value={editTask.assignedTo||""} onChange={v=>setEditTask(p=>({...p,assignedTo:v}))}/></Field>
                <Field label="Source"><Sel value={editTask.source} onChange={v=>setEditTask(p=>({...p,source:v}))} options={["manual","user:voice","agent:orchestrator","agent:news_engine","agent:gmail_scan","agent:ai_sweep","agent:signal-engine","agent:claude_assist"]}/></Field>
              </div>
              <Field label="Notes"><Tex value={editTask.notes||""} onChange={v=>setEditTask(p=>({...p,notes:v}))}/></Field>
            </div>

            {(taskContact||taskCompany||taskProject) && <div className="card-el" style={{ padding:14, marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>LINKED RECORDS</div>
              <div style={{ display:"flex", gap:14, flexWrap:"wrap", fontSize:12 }}>
                {taskContact && <span>Contact: <EntityLink type="contact" id={taskContact.id} navigate={navigate}>{taskContact.name}</EntityLink></span>}
                {taskCompany && <span>Company: <EntityLink type="company" id={taskCompany.id} navigate={navigate}>{taskCompany.name}</EntityLink></span>}
                {taskProject && <span>Project: <EntityLink type="project" id={taskProject.id} navigate={navigate}>{taskProject.name}</EntityLink></span>}
              </div>
            </div>}

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="task" entityId={task.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <CheckCircle size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a task</p>
          </div>
        )}
      </div>

      {drawer?.type==="task"&&drawer.mode==="add"&&<Drawer title="New Task" onClose={()=>setDrawer(null)} onSave={()=>saveTask(td)}>
        <Field label="Task Title"><Inp value={td.title} onChange={v=>setTD(p=>({...p,title:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Status"><Sel value={td.status} onChange={v=>setTD(p=>({...p,status:v}))} options={TASK_STATUSES.map(s=>({value:s,label:s.replace(/_/g," ")}))}/></Field>
          <Field label="Priority"><Sel value={td.priority} onChange={v=>setTD(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
          <Field label="Category"><Sel value={td.category} onChange={v=>setTD(p=>({...p,category:v}))} options={TASK_CATEGORIES.map(c=>({value:c,label:c.replace(/_/g," ")}))}/></Field>
          <Field label="Due Date"><Inp type="date" value={td.due} onChange={v=>setTD(p=>({...p,due:v}))}/></Field>
          <Field label="Person"><SearchSelect value={td.contactId} onChange={v=>setTD(p=>({...p,contactId:v}))} options={db.contacts.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search..." entityType="contact" navigate={navigate}/></Field>
          <Field label="Company"><SearchSelect value={td.companyId} onChange={v=>setTD(p=>({...p,companyId:v}))} options={db.companies.map(c=>({value:String(c.id),label:c.name}))} placeholder="Search..." entityType="company" navigate={navigate}/></Field>
          <Field label="Project"><SearchSelect value={td.projectId} onChange={v=>setTD(p=>({...p,projectId:v}))} options={db.projects.map(x=>({value:String(x.id),label:x.name}))} placeholder="Search..." entityType="project" navigate={navigate}/></Field>
          <Field label="Deal"><SearchSelect value={td.dealId} onChange={v=>setTD(p=>({...p,dealId:v}))} options={db.deals.map(x=>({value:String(x.id),label:x.name}))} placeholder="Search..." entityType="deal" navigate={navigate}/></Field>
        </div>
        <Field label="Notes"><Tex value={td.notes} onChange={v=>setTD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>delTask(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};
