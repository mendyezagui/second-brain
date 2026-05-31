import { useEffect, useState } from "react";
import { Award, ChevronRight, Plus, Save, Search, Trash2 } from "lucide-react";
import { nextId, today } from "../lib/utils";
import { ConfirmDelete, Drawer, EntityLink, Field, Inp, RowActions, Sel, Tag, Tex } from "../components/ui";

export const GOAL_STATUSES = ["active","completed","paused","cancelled"];

export const GOAL_CATEGORIES = ["professional","personal"];

export const blankGoal = () => ({ name:"", description:"", category:"professional", status:"active", target_value:0, current_value:0, unit:"", period:"annual", start_date:today(), end_date:"", priority_order:0, notes:"" });

export const GoalsView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [gd, setGD] = useState(blankGoal());
  const [editGoal, setEditGoal] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    if (focus?.type === "goal" && focus.id) { setStatusFilter("all"); setSel(focus.id); } else setSel(null);
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
