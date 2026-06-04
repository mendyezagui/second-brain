import { useEffect, useState } from "react";
import { Building2, ChevronRight, Globe, Linkedin, Newspaper, Plus, Save, Search, Trash2 } from "lucide-react";
import { fmt, nextId, today } from "../lib/utils";
import { ActivityTimeline, AssociatedDocumentsPanel, ConfirmDelete, Drawer, EntityLink, Field, Inp, RowActions, ScoreBadge, Sel, Tag, Tex } from "../components/ui";

export const blankCompany = () => ({ name:"", industry:"", website:"", linkedin_url:"", news_keywords:"", status:"prospect", notes:"", created_at:today() });

export const CompaniesView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editCompany, setEditCompany] = useState(null);

  useEffect(() => {
    if(focus?.type==="company" && focus.id) { setSel(focus.id); } else setSel(null);
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
