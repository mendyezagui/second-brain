import { useEffect, useRef, useState } from "react";
import { Brain, Check, ChevronRight, Copy, FileText, Loader, Paperclip, Plus, Save, Search, Trash2, Upload, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { AssociatedDocumentsPanel, ConfirmDelete, Drawer, Field, Inp, Sel, Tag, Tex } from "../components/ui";

export const MEMORY_TYPES = ["general","preference","feedback","context","decision","relationship","insight"];

export const AI_SYSTEMS = ["claude","chatgpt","gemini","copilot","other"];

export const blankMemory = () => ({ subject:"", ai_system:"claude", memory_summary:"", memory_type:"general", source_context:"", companyId:"", contactId:"", dealId:"", projectId:"", strategyId:"" });

export const AIMemoriesView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [md, setMd] = useState({});
  const [editMem, setEditMem] = useState(null);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSystem, setFilterSystem] = useState("all");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const AI_SYSTEMS = ["claude","chatgpt","gemini","copilot","other"];
  const MEMORY_TYPES = ["general","preference","feedback","context","decision","relationship","insight"];
  const typeColors = { general:"var(--blue)", preference:"var(--purple)", feedback:"var(--amber)", context:"var(--green)", decision:"var(--red)", relationship:"var(--purple)", insight:"var(--blue)" };
  const systemIcons = { claude:"\u2728", chatgpt:"\ud83e\udd16", gemini:"\ud83d\udc8e", copilot:"\u2708\ufe0f", other:"\ud83d\udccc" };

  useEffect(() => {
    if (focus?.type === "ai_memory" && focus.id) { setFilterType("all"); setSel(focus.id); } else setSel(null);
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const m = (db.ai_memories||[]).find(x => x.id === sel);
      if (m) setEditMem({...m, contactId: m.contactId||"", companyId: m.companyId||"", dealId: m.dealId||"", projectId: m.projectId||"", strategyId: m.strategyId||"", files: m.files||[]});
    } else setEditMem(null);
  }, [sel, db.ai_memories]);

  const filtered = (db.ai_memories||[]).filter(m => {
    if (filterType !== "all" && m.memory_type !== filterType) return false;
    if (filterSystem !== "all" && m.ai_system !== filterSystem) return false;
    if (query) {
      const s = query.toLowerCase();
      if (!(m.subject||"").toLowerCase().includes(s) && !(m.memory_summary||"").toLowerCase().includes(s)) return false;
    }
    return true;
  }).sort((a,b) => (b.id||0)-(a.id||0));
  const memory = sel ? (db.ai_memories||[]).find(m => m.id === sel) : null;

  const saveInline = () => {
    if (!editMem) return;
    const rec = {...editMem, contactId: parseInt(editMem.contactId)||null, companyId: parseInt(editMem.companyId)||null, dealId: parseInt(editMem.dealId)||null, projectId: parseInt(editMem.projectId)||null, strategyId: parseInt(editMem.strategyId)||null};
    setDB(d => ({...d, ai_memories: (d.ai_memories||[]).map(m => m.id === rec.id ? rec : m)}));
  };

  const save = () => {
    if (!md.subject) return;
    setDB(prev => {
      const mem = prev.ai_memories || [];
      const id = Math.max(0, ...mem.map(x => x.id||0)) + 1;
      return {...prev, ai_memories: [{...md, id, created_at: new Date().toISOString(), files: md.files||[]}, ...mem]};
    });
    setDrawer(null);
  };

  const del = (id) => { setDB(d => ({...d, ai_memories: (d.ai_memories||[]).filter(m => m.id !== id)})); if (sel === id) setSel(null); setConfirm(null); };

  const inlineFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        const { error } = await supabase.storage.from('memory-files').upload(path, file);
        if (error) continue;
        const { data: urlData } = supabase.storage.from('memory-files').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size, path });
      }
      setEditMem(p => ({...p, files: [...(p.files||[]), ...uploaded]}));
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };
  const removeInlineFile = async (f) => {
    if (f.path) await supabase.storage.from('memory-files').remove([f.path]);
    setEditMem(p => ({...p, files: (p.files||[]).filter(x => x.path !== f.path)}));
  };
  const copyMemory = () => { navigator.clipboard.writeText(memory?.memory_summary||""); setCopied(true); setTimeout(()=>setCopied(false), 2000); };
  const formatSize = (bytes) => { if (!bytes) return ''; if (bytes < 1024) return bytes + ' B'; if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB'; return (bytes/1048576).toFixed(1) + ' MB'; };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>AI Memories</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setMd({subject:"",memory_summary:"",ai_system:"claude",memory_type:"general",source_context:"",files:[]});setDrawer("add");}}><Plus size={12}/>Add</button>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
            {["all",...MEMORY_TYPES].map(t=>(
              <button key={t} className={`filter-chip${filterType===t?" active":""}`} onClick={()=>setFilterType(t)}>{t}</button>
            ))}
          </div>
          <select className="filter-select" value={filterSystem} onChange={e=>setFilterSystem(e.target.value)} style={{ marginBottom:8, width:"100%" }}>
            <option value="all">All Systems</option>
            {AI_SYSTEMS.map(s=><option key={s} value={s}>{systemIcons[s]} {s}</option>)}
          </select>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search memories…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(m=>(
            <div key={m.id} className="row-hover" onClick={()=>navigate("record",{type:"ai_memory",id:m.id})}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===m.id?"var(--bg-hover)":"transparent" }}>
              <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.subject || "Untitled"}</div>
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2, display:"flex", gap:4, alignItems:"center" }}>
                <span style={{ color:typeColors[m.memory_type]||"var(--text-sec)" }}>{m.memory_type}</span>
                <span>· {systemIcons[m.ai_system]} {m.ai_system}</span>
                {(m.files||[]).length > 0 && <><span>· <Paperclip size={9}/> {(m.files||[]).length}</span></>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(memory && editMem) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("ai_memories");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to memories</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{memory.subject}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{systemIcons[memory.ai_system]} {memory.ai_system} · ID {memory.id}</div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={memory.memory_type}/>
                <button className="btn btn-ghost" style={{ padding:"5px 10px", fontSize:12 }} onClick={copyMemory}>{copied ? <Check size={12}/> : <Copy size={12}/>}{copied?"Copied":"Copy"}</button>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:memory.id,label:memory.subject})}><Trash2 size={12}/></button>
              </div>
            </div>

            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Subject"><Inp value={editMem.subject||""} onChange={v=>setEditMem(p=>({...p,subject:v}))}/></Field>
              <Field label="Memory Summary / Prompt"><Tex value={editMem.memory_summary||""} onChange={v=>setEditMem(p=>({...p,memory_summary:v}))} placeholder="The detail, prompt, or context…"/></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="AI System"><Sel value={editMem.ai_system} onChange={v=>setEditMem(p=>({...p,ai_system:v}))} options={AI_SYSTEMS}/></Field>
                <Field label="Memory Type"><Sel value={editMem.memory_type} onChange={v=>setEditMem(p=>({...p,memory_type:v}))} options={MEMORY_TYPES}/></Field>
              </div>
              <Field label="Source / Context"><Inp value={editMem.source_context||""} onChange={v=>setEditMem(p=>({...p,source_context:v}))} placeholder="Where this memory came from"/></Field>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Contact"><Sel value={editMem.contactId} onChange={v=>setEditMem(p=>({...p,contactId:v}))} options={[{value:"",label:"None"},...(db.contacts||[]).map(c=>({value:String(c.id),label:c.name}))]}/></Field>
                <Field label="Company"><Sel value={editMem.companyId} onChange={v=>setEditMem(p=>({...p,companyId:v}))} options={[{value:"",label:"None"},...(db.companies||[]).map(c=>({value:String(c.id),label:c.name}))]}/></Field>
                <Field label="Deal"><Sel value={editMem.dealId} onChange={v=>setEditMem(p=>({...p,dealId:v}))} options={[{value:"",label:"None"},...(db.deals||[]).map(c=>({value:String(c.id),label:c.name}))]}/></Field>
                <Field label="Project"><Sel value={editMem.projectId} onChange={v=>setEditMem(p=>({...p,projectId:v}))} options={[{value:"",label:"None"},...(db.projects||[]).map(c=>({value:String(c.id),label:c.name}))]}/></Field>
                <Field label="Strategy"><Sel value={editMem.strategyId} onChange={v=>setEditMem(p=>({...p,strategyId:v}))} options={[{value:"",label:"None"},...(db.strategies||[]).map(s=>({value:String(s.id),label:s.name}))]}/></Field>
              </div>

              <div style={{ marginTop:14, borderTop:"1px solid var(--border)", paddingTop:14 }}>
                <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>ATTACHED FILES</div>
                {(editMem.files||[]).map((f,fi)=>(
                  <div key={fi} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:6, background:"var(--bg-el)", border:"1px solid var(--border)", marginBottom:4 }}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--blue)", textDecoration:"none", overflow:"hidden" }}>
                      <FileText size={13}/><span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{f.name}</span>
                      <span className="mono" style={{ fontSize:10, color:"var(--text-dim)" }}>{f.size?'('+formatSize(f.size)+')':''}</span>
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

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="ai_memory" entityId={memory.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Brain size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a memory</p>
          </div>
        )}
      </div>

      {drawer==="add" && <Drawer title="New AI Memory" onClose={()=>setDrawer(null)} onSave={save}>
        <Field label="Subject"><Inp value={md.subject||""} onChange={v=>setMd(p=>({...p,subject:v}))}/></Field>
        <Field label="Memory Summary"><Tex value={md.memory_summary||""} onChange={v=>setMd(p=>({...p,memory_summary:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="AI System"><Sel value={md.ai_system||"claude"} onChange={v=>setMd(p=>({...p,ai_system:v}))} options={AI_SYSTEMS}/></Field>
          <Field label="Memory Type"><Sel value={md.memory_type||"general"} onChange={v=>setMd(p=>({...p,memory_type:v}))} options={MEMORY_TYPES}/></Field>
        </div>
        <Field label="Source / Context"><Inp value={md.source_context||""} onChange={v=>setMd(p=>({...p,source_context:v}))}/></Field>
      </Drawer>}
      {confirm && <ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};
