import { useRef, useState } from "react";
import { Activity, AlertCircle, ArrowDown, ArrowUp, Award, BarChart2, BookOpen, Brain, Briefcase, Building2, CheckCircle, ChevronRight, CreditCard, DollarSign, ExternalLink, FileText, Loader, Megaphone, MessageSquare, Mic, MoreVertical, Paperclip, Pencil, Phone, Plus, RefreshCw, Save, Search, Settings, Shield, SlidersHorizontal, Sparkles, Target, Trash2, Upload, Users, X, Calendar, Glasses } from "lucide-react";
import { supabase } from "../lib/supabase";
import { blankDocument, buildDocOptions, docAssociationKey, docHasAssociation, formatDocSize, getDocEntityLabel, getDocKindLabel, nextId, normalizeDocId, recordPath, sc, uploadDocumentFile } from "../lib/utils";

export const GlobalStyle = () => (
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
    @keyframes pulse-voice{0%,100%{box-shadow:0 4px 16px rgba(0,119,204,0.4)}50%{box-shadow:0 4px 24px rgba(0,119,204,0.6),0 0 0 8px rgba(0,119,204,0.1)}}
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

    /* Mobile responsiveness (max-width: 768px) */
    .mobile-back{display:none;align-items:center;gap:6px;background:transparent;border:none;color:var(--blue);font-size:13px;cursor:pointer;padding:6px 0;margin-bottom:12px}
    .view-shell{display:flex;height:100%;overflow:hidden}
    .grid-resp-4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    @media (max-width:768px){
      .btn{padding:10px 16px;min-height:40px;font-size:13px}
      .btn-icon{width:36px;height:36px}
      .filter-chip{padding:6px 12px;font-size:12px}
      .input{padding:11px 13px;font-size:14px}
      .drawer{width:100vw}
      .confirm-box{width:min(340px,92vw);padding:22px}
      .card{border-radius:10px}
      .view-shell{flex-direction:column}
      .view-shell .list-pane{width:100%!important;border-right:none!important;border-bottom:1px solid var(--border);max-height:none}
      .view-shell .detail-pane{padding:16px!important}
      .view-shell.has-selection .list-pane{display:none}
      .view-shell:not(.has-selection) .detail-pane{display:none}
      .mobile-back{display:inline-flex}
      .grid-resp-4{grid-template-columns:repeat(2,1fr)}
      .fab-stack{bottom:calc(78px + env(safe-area-inset-bottom, 0px))!important;right:14px!important}
      main{padding-bottom:calc(64px + env(safe-area-inset-bottom, 0px))!important}
      .header-actions{flex-wrap:wrap!important;justify-content:flex-end!important}
    }
  `}</style>
);

export const Tag = ({ label, color }) => {
  const c = color || sc(label);
  return <span className="tag" style={{ color:c, background:`${c}18`, border:`1px solid ${c}30` }}>{label}</span>;
};

export const ScoreBadge = ({ score }) => {
  const c = score>=70?"var(--green)":score>=50?"var(--amber)":"var(--red)";
  return <span className="mono" style={{ fontSize:11, padding:"2px 7px", borderRadius:4, background:`${c}15`, color:c, border:`1px solid ${c}30` }}>{score}</span>;
};

export const MetricCard = ({ icon:Icon, label, value, sub, color="--blue", trend }) => (
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

export const AgentBadge = ({ agent }) => {
  const c = ({Orchestrator:"var(--purple)","CRM Agent":"var(--blue)","Marketing Agent":"var(--amber)","Billing Agent":"var(--red)","Ops Agent":"var(--green)","News Engine":"var(--blue)"}[agent])||"var(--text-sec)";
  return <span className="mono" style={{ fontSize:10, color:c, background:`${c}18`, padding:"1px 6px", borderRadius:3 }}>{agent}</span>;
};

export const ConfirmDelete = ({ label, onConfirm, onCancel }) => (
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

export const Drawer = ({ title, onClose, onSave, saveLabel="Save", children }) => (
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

export const Field = ({ label, children }) => (
  <div className="form-group"><label className="form-label">{label}</label>{children}</div>
);

export const Inp = ({ value, onChange, placeholder, type="text" }) => (
  <input className="input" type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />
);

export const Sel = ({ value, onChange, options }) => (
  <select className="input" value={value} onChange={e=>onChange(e.target.value)}>
    {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
  </select>
);

export const Tex = ({ value, onChange, placeholder }) => (
  <textarea className="input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />
);

const ENTITY_NAV = {
  contact: "crm", company: "companies", deal: "deals", document: "documents",
  project: "projects", task: "tasks", campaign: "marketing", invoice: "invoices",
  payment: "payments", strategy: "strategies", goal: "goals", ai_memory: "ai_memories",
};

export const SearchSelect = ({ value, onChange, options, placeholder, entityType, navigate }) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  const hasValue = !open && selected;
  const linkable = hasValue && entityType && navigate && ENTITY_NAV[entityType];
  return (
    <div style={{ position:"relative" }}>
      {linkable ? (
        <div className="input" style={{ fontSize:13, paddingRight:28, display:"flex", alignItems:"center", minHeight:36, cursor:"pointer" }}
             onClick={() => { setOpen(true); setQ(""); }}>
          <EntityLink type={entityType} id={value} navigate={navigate} style={{ fontSize:13, color:"var(--blue)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {selected.label}
          </EntityLink>
        </div>
      ) : (
        <input className="input" value={open ? q : (selected?.label || "")} placeholder={placeholder || "Search..."}
          onFocus={() => { setOpen(true); setQ(""); }}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          style={{ fontSize:13, paddingRight: hasValue ? 28 : undefined }}
        />
      )}
      {hasValue && (
        <button
          type="button"
          title="Clear"
          onMouseDown={e => e.preventDefault()}
          onClick={(e) => { e.stopPropagation(); onChange(""); setQ(""); setOpen(false); }}
          style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", width:18, height:18, borderRadius:4, border:"none", background:"transparent", cursor:"pointer", color:"var(--text-sec)", display:"flex", alignItems:"center", justifyContent:"center", padding:0, zIndex:2 }}
        ><X size={12}/></button>
      )}
      {open && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:998 }} onClick={() => setOpen(false)}/>
          <div style={{ position:"absolute", top:"100%", left:0, right:0, maxHeight:180, overflowY:"auto", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:999, marginTop:2 }}>
            <div style={{ padding:"6px 10px", fontSize:11, color:"var(--text-dim)", cursor:"pointer", borderBottom:"1px solid var(--border)" }} onClick={() => { onChange(""); setOpen(false); }}>&mdash; none &mdash;</div>
            {filtered.slice(0, 20).map(o => (
              <div key={o.value} style={{ padding:"7px 10px", fontSize:12, cursor:"pointer", background:String(o.value)===String(value)?"var(--blue-dim)":"transparent" }}
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(String(o.value)); setOpen(false); setQ(""); }}>
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding:"8px 10px", fontSize:11, color:"var(--text-dim)" }}>No results</div>}
          </div>
        </>
      )}
    </div>
  );
};

export const EntityLink = ({ type, id, navigate, children, className, style, title }) => {
  if (!id) return <span className={className} style={style}>{children}</span>;
  const openRecord = () => navigate ? navigate("record", { type, id }) : window.location.hash = recordPath(type, id);
  return (
    <span
      className={className}
      title={title || `Open ${type}`}
      onClick={(e) => { e.stopPropagation(); openRecord(); }}
      style={{ ...style, cursor:"pointer", textDecoration:"underline", textDecorationStyle:"dotted", textDecorationColor:"var(--border-hi)", textUnderlineOffset:2 }}
    >{children}</span>
  );
};

export const DocumentAssociationEditor = ({ db, value, onChange }) => {
  const options = buildDocOptions(db);
  const addAssociation = (type, id) => {
    if (!id) return;
    const next = [...(value || []), { type, id:normalizeDocId(id) }];
    const unique = Array.from(new Map(next.map(a => [docAssociationKey(a), a])).values());
    onChange(unique);
  };
  const removeAssociation = (assoc) => onChange((value || []).filter(a => docAssociationKey(a) !== docAssociationKey(assoc)));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {(value || []).map(a => (
          <span key={docAssociationKey(a)} className="tag" style={{ color:"var(--blue)", background:"var(--blue-dim)", border:"1px solid rgba(0,119,204,0.18)" }}>
            {getDocEntityLabel(db, a)}
            <button type="button" onClick={() => removeAssociation(a)} style={{ border:"none", background:"transparent", color:"inherit", cursor:"pointer", padding:0, display:"flex" }}><X size={11}/></button>
          </span>
        ))}
        {(value || []).length === 0 && <span className="mono" style={{ fontSize:11, color:"var(--text-dim)" }}>No associations yet</span>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {options.map(cfg => (
          <SearchSelect
            key={cfg.type}
            value=""
            onChange={id => addAssociation(cfg.type, id)}
            options={cfg.options}
            placeholder={`Add ${cfg.label.toLowerCase()}...`}
          />
        ))}
      </div>
    </div>
  );
};

export const AssociatedDocumentsPanel = ({ db, setDB, entityType, entityId, title="Documents" }) => {
  const [drawer, setDrawer] = useState(null);
  const [doc, setDoc] = useState(blankDocument([{ type:entityType, id:entityId }]));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const drawerFileInputRef = useRef(null);
  const docs = (db.documents || []).filter(d => docHasAssociation(d, entityType, entityId)).sort((a,b) => (b.id || 0) - (a.id || 0));
  const openNew = () => { setDoc(blankDocument([{ type:entityType, id:entityId }])); setDrawer("add"); };
  const openEdit = (d) => { setDoc({ ...d, associations:d.associations || [] }); setDrawer("edit"); };
  const saveDoc = () => {
    if (!doc.title && !doc.file_name && !doc.url) return;
    const rec = { ...doc, title:doc.title || doc.file_name || (doc.kind === "link" ? doc.url : "Untitled document"), associations:doc.associations || [] };
    setDB(prev => drawer === "add"
      ? { ...prev, documents:[{ ...rec, id:nextId(prev.documents || []) }, ...(prev.documents || [])] }
      : { ...prev, documents:(prev.documents || []).map(d => d.id === rec.id ? rec : d) }
    );
    setDrawer(null);
  };
  const uploadForEntity = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        try {
          uploaded.push({ ...blankDocument([{ type:entityType, id:entityId }]), id:0, ...(await uploadDocumentFile(file)) });
        } catch (error) { console.error("Upload error:", error); }
      }
      if (uploaded.length) {
        setDB(prev => {
          let id = nextId(prev.documents || []);
          return { ...prev, documents:[...uploaded.map(d => ({ ...d, id:id++ })), ...(prev.documents || [])] };
        });
      }
    } catch (err) { console.error("Document upload failed:", err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const attachFileToDraft = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadDocumentFile(file);
      setDoc(p => ({ ...p, ...uploaded, title:p.title || uploaded.title }));
    } catch (err) { console.error("Document upload failed:", err); }
    setUploading(false);
    if (drawerFileInputRef.current) drawerFileInputRef.current.value = "";
  };
  return (
    <div className="card-el" style={{ padding:14, marginTop:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{title.toUpperCase()} ({docs.length})</div>
        <div style={{ display:"flex", gap:6 }}>
          <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={uploadForEntity}/>
          <button className="btn btn-ghost" style={{ fontSize:11, padding:"4px 8px" }} disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <><Loader size={11} className="spin"/>Uploading</> : <><Upload size={11}/>Add File</>}
          </button>
          <button className="btn btn-blue" style={{ fontSize:11, padding:"4px 8px" }} onClick={openNew}><Plus size={11}/>New Document</button>
        </div>
      </div>
      {docs.length === 0 ? <div className="mono" style={{ fontSize:11, color:"var(--text-dim)" }}>No documents linked yet.</div> : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {docs.map(d => (
            <div key={d.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, background:"var(--bg)" }}>
              {(d.file_name || d.storage_path) ? <Paperclip size={13} color="var(--blue)"/> : <ExternalLink size={13} color="var(--blue)"/>}
              <div style={{ flex:1, minWidth:0 }}>
                <a href={d.url || "#"} target={d.url ? "_blank" : undefined} rel="noopener noreferrer" style={{ fontSize:12, fontWeight:600, color:d.url ? "var(--blue)" : "var(--text)", textDecoration:"none" }}>{d.title || d.file_name || "Untitled document"}</a>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{getDocKindLabel(d)} &middot; {(d.associations || []).length} association{(d.associations || []).length === 1 ? "" : "s"}{d.file_size ? ` - ${formatDocSize(d.file_size)}` : ""}</div>
              </div>
              <button className="btn-icon" title="Edit associations" onClick={() => openEdit(d)}><Pencil size={13}/></button>
            </div>
          ))}
        </div>
      )}
      {drawer && <Drawer title={drawer === "add" ? "New Document" : "Edit Document"} onClose={() => setDrawer(null)} onSave={saveDoc}>
        <Field label="Title"><Inp value={doc.title || ""} onChange={v => setDoc(p => ({ ...p, title:v }))} placeholder="Document title"/></Field>
        <Field label="Description"><Tex value={doc.description || ""} onChange={v => setDoc(p => ({ ...p, description:v }))} placeholder="What this document is for"/></Field>
        <Field label="Attachment">
          <input ref={drawerFileInputRef} type="file" style={{ display:"none" }} onChange={attachFileToDraft}/>
          <button type="button" className="btn btn-ghost" disabled={uploading} onClick={() => drawerFileInputRef.current?.click()}>
            {uploading ? <><Loader size={13} className="spin"/>Uploading...</> : <><Paperclip size={13}/>Upload attachment</>}
          </button>
          <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginTop:6 }}>PDF, image, markdown, HTML, ZIP, Office files, text, CSV, and other file types.</div>
          {doc.file_name && <div className="card-el" style={{ padding:"8px 10px", marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
            <Paperclip size={13} color="var(--blue)"/>
            <span style={{ flex:1, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.file_name}</span>
            <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{formatDocSize(doc.file_size)}</span>
          </div>}
        </Field>
        <Field label="Link"><Inp value={doc.kind === "link" || !doc.file_name ? (doc.url || "") : ""} onChange={v => setDoc(p => ({ ...p, url:v, kind:v ? "link" : p.kind, file_name:v ? "" : p.file_name, file_type:v ? "" : p.file_type, file_size:v ? 0 : p.file_size, storage_path:v ? "" : p.storage_path }))} placeholder="https://..."/></Field>
        <Field label="Associations"><DocumentAssociationEditor db={db} value={doc.associations || []} onChange={v => setDoc(p => ({ ...p, associations:v }))}/></Field>
      </Drawer>}
    </div>
  );
};

export const RowActions = ({ onEdit, onDelete }) => (
  <div className="row-actions" style={{ display:"flex", gap:2, opacity:0, transition:"opacity .15s" }}>
    <button className="btn-icon" title="Edit" onClick={e=>{e.stopPropagation();onEdit();}}><Pencil size={13} color="var(--text-sec)"/></button>
    <button className="btn-icon delete" title="Delete" onClick={e=>{e.stopPropagation();onDelete();}}><Trash2 size={13} color="var(--text-sec)"/></button>
  </div>
);

export const ActivityTimeline = ({ events, entityType, entityId }) => {
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
            <div className="mono" style={{ fontSize:9, color:"var(--text-dim)", marginTop:2 }}>{e.ts ? new Date(e.ts).toLocaleDateString() : ""} &middot; {e.source}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const LoadingScreen = ({ msg="Loading..." }) => (
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

export const LoginScreen = () => {
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
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>Life Operating System &middot; Private Access</div>
        </div>
        {error && <div style={{ background:"var(--red-dim)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:8, padding:"10px 14px", fontSize:12, color:"var(--red)", display:"flex", gap:7 }}><AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }}/>{error}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Field label="Email"><input className="input" type="email" value={email} placeholder="you@example.com" onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&signIn()}/></Field>
          <Field label="Password"><input className="input" type="password" value={password} placeholder="********" onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&signIn()}/></Field>
        </div>
        <button className="btn btn-blue" onClick={signIn} disabled={loading} style={{ justifyContent:"center", opacity:loading?0.6:1, height:42, fontSize:14 }}>
          {loading ? <><Loader size={14} className="spin"/>Signing in...</> : <><Shield size={14}/>Sign In</>}
        </button>
      </div>
    </div>
  );
};

export const NAV = [
  {id:"dashboard",icon:BarChart2,label:"Dashboard"},
  {id:"brief",icon:Sparkles,label:"Morning Brief"},
  {id:"loops",icon:RefreshCw,label:"Loops"},
  {id:"associates",icon:BookOpen,label:"Associates"},
  {id:"tasks",icon:CheckCircle,label:"Tasks"},
  {divider:true},
  {id:"crm",icon:Users,label:"Contacts"},
  {id:"companies",icon:Building2,label:"Companies"},
    {id:"marketing",icon:Megaphone,label:"Marketing"},
    {id:"social",icon:Calendar,label:"Social Media"},
    {id:"cadences",icon:Activity,label:"Cadences"},
  {id:"projects",icon:Briefcase,label:"Projects"},
  {id:"documents",icon:FileText,label:"Documents"},
    {id:"_fin",icon:DollarSign,label:"Financials",group:true,children:["deals","invoices","payments"]},
  {id:"deals",icon:Target,label:"Deals",parent:"_fin"},
  {id:"invoices",icon:FileText,label:"Invoices",parent:"_fin"},
  {id:"payments",icon:CreditCard,label:"Payments",parent:"_fin"},
  {divider:true},
  {divider:true},
  {id:"ai_memories",icon:Sparkles,label:"AI Memories"},
  {id:"multi_llm",icon:MessageSquare,label:"AI Playground"},
  {id:"strategies",icon:Target,label:"Strategies"},
  {id:"goals",icon:Award,label:"Goals"},
  {id:"_ai_controls",icon:Settings,label:"AI Controls",group:true,children:["voitra_gate","rc_controls","vantaca_controls","cometchat","cometchat_dev"]},
  {id:"voitra_gate",icon:Mic,label:"Voitra Agent Control",parent:"_ai_controls"},
  {id:"rc_controls",icon:Phone,label:"RC Controls",parent:"_ai_controls"},
  {id:"vantaca_controls",icon:Building2,label:"Vantaca Controls",parent:"_ai_controls"},
  {id:"cometchat",icon:MessageSquare,label:"CometChat Logs",parent:"_ai_controls"},
  {id:"cometchat_dev",icon:MessageSquare,label:"CometChat Dev",parent:"_ai_controls"},
  {id:"spectari",icon:Glasses,label:"Spectari"},
  {id:"admin",icon:Shield,label:"Admin"},
];

export const Sidebar = ({ view, setView, collapsed, setCollapsed, alerts, db }) => {
  const [collGroups, setCollGroups] = useState({ _fin: true, _ai_controls: false });
  return (<div style={{ width:collapsed?60:210, height:"100%", minHeight:0, background:"var(--bg-card)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", padding:"14px 8px", gap:2, transition:"width .25s", flexShrink:0, overflow:"hidden" }}>
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 6px 18px", cursor:"pointer", flexShrink:0 }} onClick={()=>setCollapsed(!collapsed)}>
      <div style={{ width:32, height:32, borderRadius:8, background:"var(--blue-dim)", border:"1px solid rgba(0,119,204,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Brain size={16} color="var(--blue)"/>
      </div>
      {!collapsed && <div><div className="display" style={{ fontSize:13, fontWeight:700 }}>Second Brain</div><div className="mono" style={{ fontSize:9, color:"var(--text-sec)" }}>Life OS</div></div>}
    </div>
    <div style={{ flex:1, minHeight:0, overflowY:"auto", overflowX:"hidden", paddingRight:2 }}>
    {NAV.map((n,i)=>{
              if(!n.id) return <div key={i} style={{marginTop:8,marginBottom:8,borderTop:"1px solid var(--border)"}} />;
              if(n.group) { const childActive=n.children&&n.children.includes(view); const open=childActive || !collGroups[n.id]; return <div key={i}>
                <button onClick={()=>setCollGroups(g=>({...g,[n.id]:!g[n.id]}))} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 12px",border:"none",background:childActive?"var(--active-bg,rgba(59,130,246,0.08))":"transparent",color:childActive?"var(--accent)":"var(--text-sec)",cursor:"pointer",borderRadius:8,fontSize:"0.85rem"}}>
                  <n.icon size={16}/><span style={{flex:1,textAlign:"left"}}>{n.label}</span><ChevronRight size={14} style={{transform:open?"rotate(90deg)":"none",transition:"transform 0.2s"}}/>
                </button>
                {open&&<div style={{marginLeft:12}}>
                  {NAV.filter(c=>c.parent===n.id).map(c=>{const act=view===c.id;return <button key={c.id} onClick={()=>setView(c.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"5px 12px",border:"none",background:act?"var(--active-bg,rgba(59,130,246,0.08))":"transparent",color:act?"var(--accent)":"var(--text-sec)",cursor:"pointer",borderRadius:8,fontSize:"0.82rem"}}><c.icon size={14}/>{c.label}</button>})}
                </div>}
              </div>; }
              if(n.parent) return null;
              const act=view===n.id;
              return <button key={i} onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 12px",border:"none",background:act?"var(--active-bg,rgba(59,130,246,0.08))":"transparent",color:act?"var(--accent)":"var(--text-sec)",cursor:"pointer",borderRadius:8,fontSize:"0.85rem"}}><n.icon size={16}/>{n.label}</button>;
            })}
    </div>
    <div style={{ flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 6px" }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", flexShrink:0 }} className="blink"/>
        {!collapsed && <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>6 agents live</span>}
      </div>
    </div>
  </div>
)}

export const BottomNav = ({ view, setView }) => {
  const [showMore, setShowMore] = useState(false);
  const primary = [{id:"dashboard",icon:BarChart2,label:"Home"},{id:"brief",icon:Sparkles,label:"Brief"},{id:"multi_llm",icon:MessageSquare,label:"AI"},{id:"crm",icon:Users,label:"Contacts"},{id:"tasks",icon:CheckCircle,label:"Tasks"}];
  const secondary = [{id:"loops",icon:RefreshCw,label:"Loops"},{id:"cadences",icon:Activity,label:"Cadences"},{id:"deals",icon:Target,label:"Deals"},{id:"projects",icon:Briefcase,label:"Projects"},{id:"documents",icon:FileText,label:"Docs"},{id:"companies",icon:Building2,label:"Companies"},{id:"invoices",icon:DollarSign,label:"Billing"},{id:"payments",icon:CreditCard,label:"Payments"},{id:"ai_memories",icon:Sparkles,label:"Memories"},{id:"strategies",icon:Target,label:"Strategies"},{id:"goals",icon:Award,label:"Goals"},{id:"voitra_gate",icon:Mic,label:"Voitra"},{id:"rc_controls",icon:Phone,label:"RC Controls"},{id:"vantaca_controls",icon:Building2,label:"Vantaca"},{id:"cometchat",icon:MessageSquare,label:"Comet Logs"},{id:"cometchat_dev",icon:MessageSquare,label:"Comet Dev"},{id:"spectari",icon:Glasses,label:"Spectari"},{id:"admin",icon:Shield,label:"Admin"}];
  const isSecondaryActive = secondary.some(n=>n.id===view);
  return (
    <>
      {showMore && <div style={{ position:"fixed", inset:0, zIndex:998 }} onClick={()=>setShowMore(false)}/>}
      {showMore && (
        <div style={{ position:"fixed", bottom:"calc(56px + env(safe-area-inset-bottom, 0px))", left:0, right:0, background:"var(--bg-card)", borderTop:"1px solid var(--border)", padding:"8px 6px", display:"flex", flexWrap:"wrap", gap:4, zIndex:999, boxShadow:"0 -4px 20px rgba(0,0,0,0.15)" }}>
          {secondary.map(n=>(
            <button key={n.id} onClick={()=>{setView(n.id);setShowMore(false);}} style={{ flex:"1 1 30%", display:"flex", alignItems:"center", gap:6, background:view===n.id?"var(--blue-dim)":"transparent", border:view===n.id?"1px solid rgba(0,119,204,0.2)":"1px solid transparent", borderRadius:8, cursor:"pointer", padding:"8px 10px" }}>
              <n.icon size={15} color={view===n.id?"var(--blue)":"var(--text-sec)"}/>
              <span style={{ fontSize:12, color:view===n.id?"var(--blue)":"var(--text-sec)" }}>{n.label}</span>
            </button>
          ))}
        </div>
      )}
      <div style={{ position:"fixed", left:0, right:0, bottom:0, display:"flex", background:"var(--bg-card)", borderTop:"1px solid var(--border)", padding:"6px 0 calc(10px + env(safe-area-inset-bottom, 0px))", flexShrink:0, zIndex:997, boxShadow:"0 -2px 12px rgba(0,0,0,0.08)" }}>
        {primary.map(n=>(
          <button key={n.id} onClick={()=>{setView(n.id);setShowMore(false);}} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"transparent", border:"none", cursor:"pointer", padding:"4px 0" }}>
            <n.icon size={17} color={view===n.id?"var(--blue)":"var(--text-sec)"}/>
            <span style={{ fontSize:9, color:view===n.id?"var(--blue)":"var(--text-sec)" }}>{n.label}</span>
          </button>
        ))}
        <button onClick={()=>setShowMore(!showMore)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"transparent", border:"none", cursor:"pointer", padding:"4px 0" }}>
          <MoreVertical size={17} color={showMore||isSecondaryActive?"var(--blue)":"var(--text-sec)"}/>
          <span style={{ fontSize:9, color:showMore||isSecondaryActive?"var(--blue)":"var(--text-sec)" }}>More</span>
        </button>
      </div>
    </>
  );
};

// --- Unified Filter + Sort ("funnel") used across every list view ---
const _flGet = (row, field) => (typeof field === "function" ? field(row) : row?.[field]);
const _flOptVal = (o) => (o && typeof o === "object" ? o.value : o);
const _flPretty = (s) => (s === "all" ? "All" : String(s).replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
const _flOptLabel = (o) => (o && typeof o === "object" ? (o.label ?? _flPretty(o.value)) : _flPretty(o));

export const FilterSort = ({ search, query, setQuery, facets, facetState, setFacet, sorts, sortKey, setSortKey, sortDir, setSortDir, activeCount, clearAll }) => {
  const [open, setOpen] = useState(false);
  const activePills = [
    ...facets.filter((f) => (facetState[f.key] ?? "all") !== "all").map((f) => {
      const v = facetState[f.key];
      const opt = (f.options || []).find((o) => _flOptVal(o) === v);
      return { key: "f:" + f.key, label: `${f.label}: ${opt ? _flOptLabel(opt) : _flPretty(v)}`, clear: () => setFacet(f.key, "all") };
    }),
    ...(query ? [{ key: "q", label: `"${query}"`, clear: () => setQuery("") }] : []),
  ];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {search && (
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <Search size={13} color="var(--text-sec)" style={{ position: "absolute", left: 10, top: 10, pointerEvents: "none" }} />
          <input className="input" placeholder={search.placeholder || "Search..."} value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 30, fontSize: 13 }} />
        </div>
      )}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)}
          style={{ padding: "7px 11px", fontSize: 12, gap: 6, ...(activeCount > 0 ? { color: "var(--blue)", borderColor: "var(--blue)", background: "var(--blue-dim)" } : {}) }}>
          <SlidersHorizontal size={14} /> Filters
          {activeCount > 0 && <span className="mono" style={{ background: "var(--blue)", color: "#fff", borderRadius: 9, fontSize: 10, padding: "1px 6px" }}>{activeCount}</span>}
        </button>
        {open && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />
            <div className="card" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 300, maxHeight: 440, overflowY: "auto", zIndex: 999, boxShadow: "var(--shadow-lg)" }}>
              {activePills.length > 0 && (
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg-el)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="mono" style={{ fontSize: 10, color: "var(--text-sec)", letterSpacing: ".04em" }}>ACTIVE</span>
                    <span style={{ fontSize: 11, color: "var(--blue)", cursor: "pointer" }} onClick={clearAll}>Clear all</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {activePills.map((p) => (
                      <span key={p.key} className="filter-chip active" style={{ cursor: "default" }}>
                        {p.label}<X size={11} style={{ cursor: "pointer" }} onClick={p.clear} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {facets.map((f) => (
                <div key={f.key} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", letterSpacing: ".04em", marginBottom: 8 }}>{f.label.toUpperCase()}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[{ value: "all", label: "All" }, ...(f.options || [])].map((o) => {
                      const v = _flOptVal(o);
                      const active = (facetState[f.key] ?? "all") === v;
                      return <button key={String(v)} className={`filter-chip${active ? " active" : ""}`} onClick={() => setFacet(f.key, v)}>{_flOptLabel(o)}</button>;
                    })}
                  </div>
                </div>
              ))}
              {sorts && sorts.length > 0 && (
                <div style={{ padding: "12px 14px" }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", letterSpacing: ".04em", marginBottom: 8 }}>SORT BY</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select className="input" value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={{ flex: 1, fontSize: 12, padding: "7px 10px" }}>
                      {sorts.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <div style={{ display: "flex", border: "1px solid var(--border-hi)", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <button title="Ascending" onClick={() => setSortDir("asc")} style={{ padding: "7px 9px", border: "none", cursor: "pointer", background: sortDir === "asc" ? "var(--blue-dim)" : "#fff", color: sortDir === "asc" ? "var(--blue)" : "var(--text-sec)", display: "flex" }}><ArrowUp size={14} /></button>
                      <button title="Descending" onClick={() => setSortDir("desc")} style={{ padding: "7px 9px", border: "none", borderLeft: "1px solid var(--border-hi)", cursor: "pointer", background: sortDir === "desc" ? "var(--blue-dim)" : "#fff", color: sortDir === "desc" ? "var(--blue)" : "var(--text-sec)", display: "flex" }}><ArrowDown size={14} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const useListControls = (rows, config) => {
  const { facets = [], sorts = [], defaultSort, search } = config;
  const searchKeys = search?.keys || [];
  const [query, setQuery] = useState("");
  const [facetState, setFacetState] = useState(() => Object.fromEntries(facets.map((f) => [f.key, f.default ?? "all"])));
  const [sortKey, setSortKey] = useState(defaultSort?.key ?? sorts[0]?.key ?? "");
  const [sortDir, setSortDir] = useState(defaultSort?.dir ?? "asc");

  const matchFacet = (f, row) => {
    const v = facetState[f.key] ?? "all";
    if (v === "all") return true;
    const opt = (f.options || []).find((o) => _flOptVal(o) === v);
    if (opt && typeof opt.test === "function") return opt.test(row);
    return String(_flGet(row, f.field ?? f.key) ?? "") === String(v);
  };

  let out = (rows || []).filter((r) => {
    if (query && searchKeys.length) {
      const hay = searchKeys.map((k) => String(_flGet(r, k) ?? "")).join(" ").toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return facets.every((f) => matchFacet(f, r));
  });

  const sortCfg = sorts.find((s) => s.key === sortKey);
  if (sortCfg) {
    out = [...out].sort((a, b) => {
      const av = _flGet(a, sortCfg.field ?? sortCfg.key);
      const bv = _flGet(b, sortCfg.field ?? sortCfg.key);
      const ae = av === null || av === undefined || av === "";
      const be = bv === null || bv === undefined || bv === "";
      if (ae && be) return 0;
      if (ae) return 1;
      if (be) return -1;
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const setFacet = (key, val) => setFacetState((s) => ({ ...s, [key]: val }));
  const clearAll = () => { setFacetState(Object.fromEntries(facets.map((f) => [f.key, "all"]))); setQuery(""); };
  const activeCount = facets.filter((f) => (facetState[f.key] ?? "all") !== "all").length + (query ? 1 : 0);

  const controls = (
    <FilterSort search={search} query={query} setQuery={setQuery} facets={facets} facetState={facetState} setFacet={setFacet}
      sorts={sorts} sortKey={sortKey} setSortKey={setSortKey} sortDir={sortDir} setSortDir={setSortDir} activeCount={activeCount} clearAll={clearAll} />
  );
  return { rows: out, controls };
};
