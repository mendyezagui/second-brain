import { useEffect, useRef, useState } from "react";
import { ChevronRight, ExternalLink, FileText, Loader, Paperclip, Plus, Save, Search, Trash2, Upload } from "lucide-react";
import { DOCUMENT_ENTITY_TYPES } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { blankDocument, formatDocSize, getDocKindLabel, nextId, uploadDocumentFile } from "../lib/utils";
import { ConfirmDelete, DocumentAssociationEditor, Drawer, Field, Inp } from "../components/ui";

export const DocumentsView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [doc, setDoc] = useState(blankDocument());
  const [editDoc, setEditDoc] = useState(null);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const drawerFileInputRef = useRef(null);
  const inlineFileInputRef = useRef(null);

  useEffect(() => {
    if (focus?.type === "document" && focus.id) { setFilterType("all"); setSel(focus.id); } else setSel(null);
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const d = (db.documents||[]).find(x => x.id === sel);
      if (d) setEditDoc({...d, associations: d.associations || []});
    } else setEditDoc(null);
  }, [sel, db.documents]);

  const docs = (db.documents || []).filter(d => {
    const q = query.toLowerCase();
    const matchesSearch = !q || [d.title, d.file_name, d.description, d.url].some(v => (v || "").toLowerCase().includes(q));
    const matchesType = filterType === "all" || (d.associations || []).some(a => a.type === filterType);
    return matchesSearch && matchesType;
  }).sort((a,b) => (b.id || 0) - (a.id || 0));
  const selDoc = sel ? (db.documents||[]).find(d => d.id === sel) : null;

  const saveInline = () => {
    if (!editDoc) return;
    const rec = {...editDoc, associations: editDoc.associations || []};
    setDB(prev => ({...prev, documents: (prev.documents||[]).map(d => d.id === rec.id ? rec : d)}));
  };

  const saveDoc = () => {
    if (!doc.title && !doc.file_name && !doc.url) return;
    const rec = { ...doc, title:doc.title || doc.file_name || (doc.kind === "link" ? doc.url : "Untitled document"), associations:doc.associations || [] };
    setDB(prev => ({ ...prev, documents:[{ ...rec, id:nextId(prev.documents || []) }, ...(prev.documents || [])] }));
    setDrawer(null);
  };
  const delDoc = async (d) => {
    if (d.storage_path) await supabase.storage.from("memory-files").remove([d.storage_path]);
    setDB(prev => ({ ...prev, documents:(prev.documents || []).filter(x => x.id !== d.id) }));
    if (sel === d.id) setSel(null);
    setConfirm(null);
  };
  const uploadDocs = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        try { uploaded.push({ ...blankDocument(), ...(await uploadDocumentFile(file)) }); } catch {}
      }
      if (uploaded.length) setDB(prev => { let id = nextId(prev.documents || []); return { ...prev, documents:[...uploaded.map(d => ({ ...d, id:id++ })), ...(prev.documents || [])] }; });
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };
  const attachFileToDraft = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const u = await uploadDocumentFile(file); setDoc(p => ({ ...p, ...u, title:p.title || u.title })); }
    finally { setUploading(false); if (drawerFileInputRef.current) drawerFileInputRef.current.value = ""; }
  };
  const attachToExisting = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const u = await uploadDocumentFile(file); setEditDoc(p => ({...p, ...u, title:p.title || u.title})); }
    finally { setUploading(false); if (inlineFileInputRef.current) inlineFileInputRef.current.value = ""; }
  };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Documents</div>
            <div style={{ display:"flex", gap:4 }}>
              <input ref={fileInputRef} type="file" multiple style={{display:"none"}} onChange={uploadDocs}/>
              <button className="btn btn-ghost" style={{ padding:"5px 8px", fontSize:11 }} disabled={uploading} onClick={()=>fileInputRef.current?.click()} title="Quick upload"><Upload size={11}/></button>
              <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setDoc(blankDocument());setDrawer("add");}}><Plus size={12}/>Add</button>
            </div>
          </div>
          <select className="filter-select" value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ width:"100%", marginBottom:8 }}>
            <option value="all">All associations</option>
            {DOCUMENT_ENTITY_TYPES.map(t=><option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search documents…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {docs.map(d => (
            <div key={d.id} className="row-hover" onClick={()=>navigate("record",{type:"document",id:d.id})}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===d.id?"var(--bg-hover)":"transparent" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {(d.file_name || d.storage_path) ? <Paperclip size={12} color="var(--blue)"/> : <ExternalLink size={12} color="var(--blue)"/>}
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", flex:1 }}>{d.title || d.file_name || "Untitled"}</div>
              </div>
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{getDocKindLabel(d)}{d.file_size?` · ${formatDocSize(d.file_size)}`:""}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(selDoc && editDoc) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("documents");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to documents</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{selDoc.title || "Untitled"}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{getDocKindLabel(selDoc)} · ID {selDoc.id}</div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:selDoc.id,label:selDoc.title})}><Trash2 size={12}/></button>
              </div>
            </div>

            {selDoc.url && <div className="card-el" style={{ padding:"10px 14px", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
              {selDoc.file_name ? <Paperclip size={13} color="var(--blue)"/> : <ExternalLink size={13} color="var(--blue)"/>}
              <a href={selDoc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:13, color:"var(--blue)", overflow:"hidden", textOverflow:"ellipsis" }}>{selDoc.file_name || selDoc.url}</a>
              {selDoc.file_size>0 && <span className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginLeft:"auto" }}>{formatDocSize(selDoc.file_size)}</span>}
            </div>}

            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Title"><Inp value={editDoc.title||""} onChange={v=>setEditDoc(p=>({...p,title:v}))}/></Field>
              <Field label="Description (keep short — long content belongs in an attachment)"><Inp value={editDoc.description||""} onChange={v=>setEditDoc(p=>({...p,description:v}))} placeholder="One-liner: what this is and why it matters"/></Field>
              <Field label="Link"><Inp value={editDoc.kind === "link" || !editDoc.file_name ? (editDoc.url||"") : ""} onChange={v=>setEditDoc(p=>({...p,url:v,kind:v?"link":p.kind}))} placeholder="https://..."/></Field>
              <Field label="Attachment">
                <input ref={inlineFileInputRef} type="file" style={{display:"none"}} onChange={attachToExisting}/>
                <button type="button" className="btn btn-ghost" disabled={uploading} onClick={()=>inlineFileInputRef.current?.click()}>
                  {uploading ? <><Loader size={13} className="spin"/>Uploading…</> : <><Paperclip size={13}/>Upload attachment</>}
                </button>
                {editDoc.file_name && <div className="card-el" style={{ padding:"8px 10px", marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                  <Paperclip size={13} color="var(--blue)"/>
                  <span style={{ flex:1, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{editDoc.file_name}</span>
                  <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{formatDocSize(editDoc.file_size)}</span>
                </div>}
              </Field>
              <Field label="Associations"><DocumentAssociationEditor db={db} value={editDoc.associations||[]} onChange={v=>setEditDoc(p=>({...p,associations:v}))}/></Field>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <FileText size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a document</p>
          </div>
        )}
      </div>

      {drawer==="add" && <Drawer title="New Document" onClose={()=>setDrawer(null)} onSave={saveDoc}>
        <Field label="Title"><Inp value={doc.title||""} onChange={v=>setDoc(p=>({...p,title:v}))}/></Field>
        <Field label="Description (short)"><Inp value={doc.description||""} onChange={v=>setDoc(p=>({...p,description:v}))} placeholder="What this is, in one line"/></Field>
        <Field label="Attachment">
          <input ref={drawerFileInputRef} type="file" style={{display:"none"}} onChange={attachFileToDraft}/>
          <button type="button" className="btn btn-ghost" disabled={uploading} onClick={()=>drawerFileInputRef.current?.click()}>
            {uploading ? <><Loader size={13} className="spin"/>Uploading…</> : <><Paperclip size={13}/>Upload attachment</>}
          </button>
          {doc.file_name && <div className="card-el" style={{ padding:"8px 10px", marginTop:8 }}><Paperclip size={13} color="var(--blue)"/><span style={{ marginLeft:8, fontSize:12 }}>{doc.file_name}</span></div>}
        </Field>
        <Field label="Or Link"><Inp value={doc.kind==="link"||!doc.file_name?(doc.url||""):""} onChange={v=>setDoc(p=>({...p,url:v,kind:v?"link":p.kind}))} placeholder="https://..."/></Field>
        <Field label="Associations"><DocumentAssociationEditor db={db} value={doc.associations||[]} onChange={v=>setDoc(p=>({...p,associations:v}))}/></Field>
      </Drawer>}
      {confirm && <ConfirmDelete label={confirm.label} onConfirm={()=>delDoc(selDoc)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};
