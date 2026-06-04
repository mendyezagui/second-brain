import { useEffect, useState } from "react";
import { ChevronRight, Plus, Save, Search, Target, Trash2 } from "lucide-react";
import { fmt, nextId, today } from "../lib/utils";
import { ActivityTimeline, AssociatedDocumentsPanel, ConfirmDelete, Drawer, EntityLink, Field, Inp, RowActions, SearchSelect, Sel, Tag, Tex } from "../components/ui";

export const blankDeal = () => ({ name:"", contactId:"", companyId:"", value:0, stage:"discovery", probability:50, closeDate:"", notes:"" });

export const DealsView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankDeal());
  const [editDeal, setEditDeal] = useState(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  useEffect(() => {
    if(focus?.type==="deal" && focus.id) { setSel(focus.id); } else setSel(null);
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
