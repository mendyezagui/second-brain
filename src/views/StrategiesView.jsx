import { useEffect, useRef, useState } from "react";
import { Briefcase, ChevronRight, FileText, Loader, Plus, Save, Search, Target, Trash2, Upload, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { nextId } from "../lib/utils";
import { AssociatedDocumentsPanel, ConfirmDelete, Drawer, EntityLink, Field, Inp, RowActions, Sel, Tag, Tex, useListControls } from "../components/ui";

export const blankStrategy = () => ({ name:"", description:"", goalId:"", status:"active", priority:"medium", notes:"", links:[], files:[] });

const asArray = (v) => Array.isArray(v) ? v : (v && typeof v === "object") ? Object.entries(v).map(([label, url]) => ({ label, url: String(url) })) : [];

export const StrategiesView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [sd, setSD] = useState(blankStrategy());
  const [editStrategy, setEditStrategy] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const strategies = (db.strategies || []);
  const goals = (db.goals || []);

  useEffect(() => {
    if (focus?.type === "strategy" && focus.id) { setSel(focus.id); } else setSel(null);
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const s = strategies.find(x => x.id === sel);
      if (s) setEditStrategy({...s, goalId: String(s.goalId || ""), links: asArray(s.links), files: asArray(s.files)});
    } else setEditStrategy(null);
  }, [sel, db.strategies]);

  const { rows: filtered, controls } = useListControls(strategies, {
    search: { keys: ["name"], placeholder: "Search strategies…" },
    facets: [
      { key: "status", label: "Status", field: "status", default: "active", options: ["active", "completed", "paused", "cancelled"] },
      { key: "priority", label: "Priority", field: "priority", options: ["critical", "high", "medium", "low"] },
    ],
    sorts: [
      { key: "name", label: "Name", field: "name" },
      { key: "priority", label: "Priority", field: (s) => ({ critical: 0, high: 1, medium: 2, low: 3 }[s.priority] ?? 9) },
    ],
    defaultSort: { key: "name", dir: "asc" },
  });
  const strategy = sel ? strategies.find(x => x.id === sel) : null;
  const strategyGoal = strategy && strategy.goalId ? goals.find(g => g.id === strategy.goalId) : null;
  const linkedProjects = strategy ? (db.projects || []).filter(p => p.strategyId === strategy.id) : [];

  const saveInline = () => {
    if (!editStrategy) return;
    const rec = {...editStrategy, goalId: parseInt(editStrategy.goalId) || null, links: editStrategy.links || [], files: editStrategy.files || []};
    setDB(d => ({...d, strategies: d.strategies.map(x => x.id === rec.id ? rec : x)}));
  };

  const inlineFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = 'strategies/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        const { error } = await supabase.storage.from('memory-files').upload(path, file);
        if (error) continue;
        const { data: urlData } = supabase.storage.from('memory-files').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size, path });
      }
      setEditStrategy(p => ({ ...p, files: [...(p.files||[]), ...uploaded] }));
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };
  const removeInlineFile = async (fileObj) => {
    if (fileObj.path) await supabase.storage.from('memory-files').remove([fileObj.path]);
    setEditStrategy(p => ({ ...p, files: (p.files||[]).filter(f => f.path !== fileObj.path) }));
  };

  const saveStrategy = (d) => {
    const rec = { ...d, goalId: parseInt(d.goalId) || null, links: d.links || [], files: d.files || [] };
    if (drawer.mode === "add") setDB(db => ({ ...db, strategies: [...(db.strategies || []), { ...rec, id: nextId(db.strategies || []) }] }));
    else setDB(db => ({ ...db, strategies: (db.strategies || []).map(x => x.id === rec.id ? rec : x) }));
    setDrawer(null);
  };
  const delStrategy = (id) => { setDB(db => ({ ...db, strategies: (db.strategies || []).filter(x => x.id !== id) })); setConfirm(null); };

  const handleStrategyFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = 'strategies/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        const { error } = await supabase.storage.from('memory-files').upload(path, file);
        if (error) { console.error('Upload error:', error); continue; }
        const { data: urlData } = supabase.storage.from('memory-files').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size, path });
      }
      setSD(p => ({ ...p, files: [...(p.files||[]), ...uploaded] }));
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeStrategyFile = async (fileObj) => {
    if (fileObj.path) await supabase.storage.from('memory-files').remove([fileObj.path]);
    setSD(p => ({ ...p, files: (p.files||[]).filter(f => f.path !== fileObj.path) }));
  };

  const formatStrategyFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1048576).toFixed(1) + ' MB';
  };

  const statusColor = (s) => ({ active: "var(--green)", completed: "var(--blue)", paused: "var(--amber)", cancelled: "var(--text-dim)" }[s] || "var(--text-sec)");
  const formatStrategyFileSizeOld = (bytes) => { if (!bytes) return ''; if (bytes < 1024) return bytes + ' B'; if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB'; return (bytes/1048576).toFixed(1) + ' MB'; };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Strategies</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setSD(blankStrategy());setDrawer({mode:"add"});}}><Plus size={12}/>Add</button>
          </div>
          {controls}
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(s=>(
            <div key={s.id} className="row-hover" onClick={()=>navigate("record",{type:"strategy",id:s.id})}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===s.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{s.priority}</div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                <Tag label={s.status}/>
                <RowActions onEdit={()=>navigate("record",{type:"strategy",id:s.id})} onDelete={()=>setConfirm({id:s.id,label:s.name})}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(strategy && editStrategy) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("strategies");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to strategies</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{strategy.name}</div>
                {strategyGoal && <div style={{ color:"var(--purple)", fontSize:12, marginTop:2 }}>Goal: <EntityLink type="goal" id={strategyGoal.id} navigate={navigate}>{strategyGoal.name}</EntityLink></div>}
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={strategy.priority}/><Tag label={strategy.status}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:strategy.id,label:strategy.name})}><Trash2 size={12}/></button>
              </div>
            </div>

            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Strategy Name"><Inp value={editStrategy.name} onChange={v=>setEditStrategy(p=>({...p,name:v}))}/></Field>
              <Field label="Description"><Tex value={editStrategy.description||""} onChange={v=>setEditStrategy(p=>({...p,description:v}))}/></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Goal"><Sel value={editStrategy.goalId||""} onChange={v=>setEditStrategy(p=>({...p,goalId:v}))} options={[{value:"",label:"None"}, ...goals.map(g=>({value:String(g.id),label:g.name}))]}/></Field>
                <Field label="Status"><Sel value={editStrategy.status} onChange={v=>setEditStrategy(p=>({...p,status:v}))} options={["active","completed","paused","cancelled"]}/></Field>
                <Field label="Priority"><Sel value={editStrategy.priority} onChange={v=>setEditStrategy(p=>({...p,priority:v}))} options={["critical","high","medium","low"]}/></Field>
              </div>
              <Field label="Notes"><Tex value={editStrategy.notes||""} onChange={v=>setEditStrategy(p=>({...p,notes:v}))}/></Field>

              {/* Links */}
              <div style={{ marginTop:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--text-sec)" }}>Links</span>
                  <button type="button" className="btn btn-ghost" style={{ fontSize:11, padding:"3px 8px" }} onClick={()=>setEditStrategy(p=>({...p,links:[...(p.links||[]),{url:"",label:"",desc:""}]}))}>+ Add Link</button>
                </div>
                {(editStrategy.links||[]).map((lnk, li) => (<div key={li} style={{ display:"flex", gap:6, marginBottom:8 }}>
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                    <input className="input" placeholder="Label" value={lnk.label||""} onChange={e=>{const links=[...editStrategy.links];links[li]={...links[li],label:e.target.value};setEditStrategy(p=>({...p,links}));}} style={{ padding:"6px 8px", fontSize:12 }}/>
                    <input className="input" placeholder="https://..." value={lnk.url||""} onChange={e=>{const links=[...editStrategy.links];links[li]={...links[li],url:e.target.value};setEditStrategy(p=>({...p,links}));}} style={{ padding:"6px 8px", fontSize:12 }}/>
                  </div>
                  <button type="button" onClick={()=>setEditStrategy(p=>({...p,links:p.links.filter((_,i)=>i!==li)}))} style={{ background:"none", border:"none", color:"var(--red)", cursor:"pointer" }}><X size={14}/></button>
                </div>))}
              </div>

              {/* Files */}
              <div style={{ marginTop:14, borderTop:"1px solid var(--border)", paddingTop:14 }}>
                <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>ATTACHED FILES</div>
                {(editStrategy.files||[]).map((f, fi) => (
                  <div key={fi} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:6, background:"var(--bg-el)", border:"1px solid var(--border)", marginBottom:4 }}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--blue)", textDecoration:"none", overflow:"hidden" }}>
                      <FileText size={13}/><span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                      <span className="mono" style={{ fontSize:10, color:"var(--text-dim)" }}>{f.size?'('+formatStrategyFileSizeOld(f.size)+')':''}</span>
                    </a>
                    <button onClick={()=>removeInlineFile(f)} style={{ background:"none", border:"none", color:"var(--red)", cursor:"pointer" }}><X size={12}/></button>
                  </div>
                ))}
                <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={inlineFileUpload}/>
                <button className="btn btn-ghost" onClick={()=>fileInputRef.current?.click()} disabled={uploading} style={{ fontSize:12, marginTop:6 }}>
                  {uploading ? <><Loader size={12} className="spin"/>Uploading…</> : <><Upload size={12}/>Upload Files</>}
                </button>
              </div>
            </div>

            {/* Linked Projects */}
            <div className="card-el" style={{ padding:14, marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>LINKED PROJECTS ({linkedProjects.length})</div>
              {linkedProjects.length > 0 ? linkedProjects.map(p=>(
                <div key={p.id} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                  <Briefcase size={12} color="var(--text-sec)"/>
                  <span style={{ fontSize:12, flex:1 }}><EntityLink type="project" id={p.id} navigate={navigate}>{p.name}</EntityLink></span>
                  <Tag label={p.status}/>
                  <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{p.progress}%</span>
                </div>
              )) : <div style={{ fontSize:12, color:"var(--text-dim)" }}>No projects linked. Link via project edit form.</div>}
            </div>

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="strategy" entityId={strategy.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Target size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a strategy</p>
          </div>
        )}
      </div>

      {drawer?.mode==="add" && <Drawer title="New Strategy" onClose={() => setDrawer(null)} onSave={() => saveStrategy(sd)}>
        <Field label="Strategy Name"><Inp value={sd.name} onChange={v => setSD(p => ({ ...p, name: v }))} /></Field>
        <Field label="Description"><Tex value={sd.description} onChange={v => setSD(p => ({ ...p, description: v }))} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Goal"><Sel value={sd.goalId || ""} onChange={v => setSD(p => ({ ...p, goalId: v }))} options={[{ value: "", label: "None" }, ...goals.map(g => ({ value: String(g.id), label: g.name }))]} /></Field>
          <Field label="Status"><Sel value={sd.status} onChange={v => setSD(p => ({ ...p, status: v }))} options={["active", "completed", "paused", "cancelled"]} /></Field>
          <Field label="Priority"><Sel value={sd.priority} onChange={v => setSD(p => ({ ...p, priority: v }))} options={["critical", "high", "medium", "low"]} /></Field>
        </div>
        <Field label="Notes"><Tex value={sd.notes} onChange={v => setSD(p => ({ ...p, notes: v }))} /></Field>
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-sec)" }}>Links</span>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => setSD(p => ({ ...p, links: [...(p.links || []), { url: "", label: "", desc: "" }] }))}>+ Add Link</button>
          </div>
          {(sd.links || []).map((lnk, li) => (<div key={li} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <input className="input" placeholder="Label" value={lnk.label} onChange={e => { const links = [...(sd.links || [])]; links[li] = { ...links[li], label: e.target.value }; setSD(p => ({ ...p, links })); }} style={{ padding: "6px 8px", fontSize: 12 }} />
              <input className="input" placeholder="https://..." value={lnk.url} onChange={e => { const links = [...(sd.links || [])]; links[li] = { ...links[li], url: e.target.value }; setSD(p => ({ ...p, links })); }} style={{ padding: "6px 8px", fontSize: 12 }} />
              <input className="input" placeholder="Short description" value={lnk.desc || ""} onChange={e => { const links = [...(sd.links || [])]; links[li] = { ...links[li], desc: e.target.value }; setSD(p => ({ ...p, links })); }} style={{ padding: "6px 8px", fontSize: 12 }} />
            </div>
            <button type="button" onClick={() => setSD(p => ({ ...p, links: (p.links || []).filter((_, i) => i !== li) }))} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: 4, marginTop: 2 }}><X size={14} /></button>
          </div>))}
        </div>
        <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase" }}>Attached Files</div>
          {(sd.files || []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {(sd.files || []).map((f, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6, background: "var(--bg-sec)", border: "1px solid var(--border)" }}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--blue)", textDecoration: "none", overflow: "hidden" }}>
                    <FileText size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>{f.size ? '(' + formatStrategyFileSize(f.size) + ')' : ''}</span>
                  </a>
                  <button className="btn btn-sm" style={{ padding: "2px 6px", color: "var(--red)" }} onClick={() => removeStrategyFile(f)} title="Remove file"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleStrategyFileUpload} />
          <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ fontSize: 12, gap: 6 }}>
            {uploading ? <><Loader size={12} className="spin" /> Uploading...</> : <><Upload size={12} /> Upload Files</>}
          </button>
        </div>
      </Drawer>}
      {confirm && <ConfirmDelete label={confirm.label} onConfirm={() => delStrategy(confirm.id)} onCancel={() => setConfirm(null)} />}
    </div>
  );
};
