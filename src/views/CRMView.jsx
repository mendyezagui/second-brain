import { useEffect, useState } from "react";
import { ArrowRightCircle, Building2, ChevronRight, Globe, Linkedin, Mail, Phone, Plus, Save, Search, Star, Trash2, Users } from "lucide-react";
import { CONTACT_CATEGORIES } from "../lib/constants";
import { fmt, logEvent, nextId, sc, today } from "../lib/utils";
import { ActivityTimeline, AssociatedDocumentsPanel, ConfirmDelete, Drawer, EntityLink, Field, Inp, RowActions, ScoreBadge, SearchSelect, Sel, Tag, Tex } from "../components/ui";

export const blankContact = () => ({ name:"", co:"", role:"", email:"", phone:"", status:"prospect", score:50, notes:"", lastTouch:today(), tags:[], linkedin_url:"", headline:"", connected_date:"", messaging_activity:"", priority:"Medium", follow_up:"", category:"customer_lead", companyId:"", source:"", referredBy:"", campaignId:"" });

export const ContactForm = ({ data, onChange, companies, contacts, campaigns, setDB, db }) => {
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

export const CRMView = ({ db, setDB, setView, navigate, focus, setFocus }) => {
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
    if(focus?.type==="contact" && focus.id) { setCatFilter("all"); setSel(focus.id); } else setSel(null);
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
