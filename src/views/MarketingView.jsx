import { useEffect, useState } from "react";
import { ChevronRight, Megaphone, Plus, Save, Search, Target, Trash2 } from "lucide-react";
import { fmt, nextId } from "../lib/utils";
import { ActivityTimeline, AssociatedDocumentsPanel, ConfirmDelete, Drawer, EntityLink, Field, Inp, RowActions, ScoreBadge, Sel, Tag, Tex, useListControls } from "../components/ui";
import PipelinesView from "./PipelinesView";

export const blankCampaign = () => ({ name:"", type:"Email", status:"draft", leads:0, opens:0, conversions:0, startDate:"" });

const TABS = [
  { id:"pipelines", label:"Pipelines", icon:Target, description:"Campaign pipelines with full activity timelines" },
  { id:"campaigns", label:"Campaigns", icon:Megaphone, description:"Legacy campaigns CRM with leads, opens & conversions" },
];

/* Marketing shell with tabs.
   Default tab is Pipelines (the new socialCampaigns + contentCalendar
   surface — full marketing/outbound campaigns with day-by-day activities
   and document links). Second tab keeps the legacy db.campaigns CRUD
   intact for the older metrics-style campaigns. */
export const MarketingView = (props) => {
  const [tab, setTab] = useState(() => {
    if (typeof window === "undefined") return "pipelines";
    try { return window.localStorage.getItem("marketingTab") || "pipelines"; } catch { return "pipelines"; }
  });
  useEffect(() => { try { window.localStorage.setItem("marketingTab", tab); } catch {} }, [tab]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ borderBottom:"1px solid var(--border)", background:"var(--bg-card)", padding:"0 16px", display:"flex", gap:0, flexShrink:0 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              title={t.description}
              style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"12px 16px",
                background:"transparent", border:"none", cursor:"pointer",
                color: active ? "var(--blue)" : "var(--text-sec)",
                fontWeight: active ? 600 : 500, fontSize:13,
                borderBottom: active ? "2px solid var(--blue)" : "2px solid transparent",
                marginBottom:-1, fontFamily:"var(--font-b)" }}>
              <Icon size={14}/>{t.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex:1, overflow:"hidden", minHeight:0 }}>
        {tab === "pipelines" ? <PipelinesView/> : <LegacyCampaignsView {...props}/>}
      </div>
    </div>
  );
};

/* Legacy campaigns CRUD (kept intact, originally MarketingView) */
const LegacyCampaignsView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankCampaign());
  const [editCampaign, setEditCampaign] = useState(null);

  useEffect(() => {
    if(focus?.type==="campaign" && focus.id) { setSel(focus.id); } else setSel(null);
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const c = db.campaigns.find(c => c.id === sel);
      if (c) setEditCampaign({...c, leads:String(c.leads), opens:String(c.opens), conversions:String(c.conversions)});
    } else setEditCampaign(null);
  }, [sel, db.campaigns]);

  const { rows: filtered, controls } = useListControls(db.campaigns || [], {
    search: { keys: ["name"], placeholder: "Search campaigns…" },
    facets: [
      { key: "status", label: "Status", field: "status", default: "active", options: ["draft", "active", "paused", "complete"] },
      { key: "type", label: "Type", field: "type", options: ["Email", "Social", "Referral", "Paid", "Event", "Other"] },
    ],
    sorts: [
      { key: "name", label: "Name", field: "name" },
      { key: "startDate", label: "Start date", field: "startDate" },
      { key: "leads", label: "Leads", field: (c) => c.leads || 0 },
    ],
    defaultSort: { key: "name", dir: "asc" },
  });

  const campaign = sel ? db.campaigns.find(c=>c.id===sel) : null;
  const campaignLeads = campaign ? (db.contacts||[]).filter(c=>c.campaignId===campaign.id) : [];
  const campaignDeals = campaign ? (db.deals||[]).filter(deal=>campaignLeads.some(l=>l.id===deal.contactId)) : [];

  const save = () => {
    const rec = { ...d, leads:parseInt(d.leads)||0, opens:parseInt(d.opens)||0, conversions:parseInt(d.conversions)||0 };
    if (drawer==="add") setDB(db=>({...db,campaigns:[...db.campaigns,{...rec,id:nextId(db.campaigns)}]}));
    else setDB(db=>({...db,campaigns:db.campaigns.map(x=>x.id===rec.id?rec:x)}));
    setDrawer(null);
  };
  const del = (id) => { setDB(db=>({...db,campaigns:db.campaigns.filter(x=>x.id!==id)})); if(sel===id) setSel(null); setConfirm(null); };

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      {/* LEFT LIST */}
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Campaigns</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setD(blankCampaign());setDrawer("add");}}><Plus size={12}/>Add</button>
          </div>
          {controls}
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(c=>(
            <div key={c.id} className="row-hover" onClick={()=>navigate("record",{type:"campaign",id:c.id})}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===c.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{c.type} · {c.startDate||"—"}</div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <Tag label={c.status}/>
                <RowActions onEdit={()=>navigate("record",{type:"campaign",id:c.id})} onDelete={()=>setConfirm({id:c.id,label:c.name})}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT DETAIL */}
      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(campaign && editCampaign) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("marketing");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to marketing</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{campaign.name}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{campaign.type} · Started {campaign.startDate || "—"}</div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={campaign.status}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={()=>{
                  const rec = {...editCampaign, leads:parseInt(editCampaign.leads)||0, opens:parseInt(editCampaign.opens)||0, conversions:parseInt(editCampaign.conversions)||0};
                  setDB(d=>({...d,campaigns:d.campaigns.map(x=>x.id===rec.id?rec:x)}));
                }}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:campaign.id,label:campaign.name})}><Trash2 size={12}/></button>
              </div>
            </div>

            <div className="grid-resp-4" style={{ marginBottom:20 }}>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--blue)" }}>{(campaign.leads||0).toLocaleString()}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Leads</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--amber)" }}>{(campaign.opens||0).toLocaleString()}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Impressions</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--green)" }}>{(campaign.conversions||0).toLocaleString()}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Conversions</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--purple)" }}>{campaign.leads>0?Math.round((campaign.conversions/campaign.leads)*100):0}%</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Conv. Rate</div></div>
            </div>

            {/* Inline editable form */}
            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <Field label="Campaign Name"><Inp value={editCampaign.name} onChange={v=>setEditCampaign(p=>({...p,name:v}))}/></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Type"><Sel value={editCampaign.type} onChange={v=>setEditCampaign(p=>({...p,type:v}))} options={["Email","Social","Referral","Paid","Event","Other"]}/></Field>
                <Field label="Status"><Sel value={editCampaign.status} onChange={v=>setEditCampaign(p=>({...p,status:v}))} options={["draft","active","paused","complete"]}/></Field>
                <Field label="Start Date"><Inp type="date" value={editCampaign.startDate||""} onChange={v=>setEditCampaign(p=>({...p,startDate:v}))}/></Field>
                <Field label="Leads"><Inp type="number" value={editCampaign.leads} onChange={v=>setEditCampaign(p=>({...p,leads:v}))}/></Field>
                <Field label="Impressions"><Inp type="number" value={editCampaign.opens} onChange={v=>setEditCampaign(p=>({...p,opens:v}))}/></Field>
                <Field label="Conversions"><Inp type="number" value={editCampaign.conversions} onChange={v=>setEditCampaign(p=>({...p,conversions:v}))}/></Field>
              </div>
              <Field label="Notes"><Tex value={editCampaign.notes||""} onChange={v=>setEditCampaign(p=>({...p,notes:v}))}/></Field>
            </div>

            {campaignLeads.length>0 && <div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>ASSOCIATED LEADS ({campaignLeads.length})</div>
              {campaignLeads.map(c=>(
                <div key={c.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}><EntityLink type="contact" id={c.id} navigate={navigate}>{c.name}</EntityLink></div>
                    <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{c.co}{c.role?` · ${c.role}`:""}</div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <Tag label={c.status}/>
                    <ScoreBadge score={c.score}/>
                  </div>
                </div>
              ))}
            </div>}

            {campaignDeals.length>0 && <div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:8 }}>DEALS FROM THIS CAMPAIGN ({campaignDeals.length})</div>
              {campaignDeals.map(deal=>(
                <div key={deal.id} className="card-el" style={{ padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                  <div><div style={{ fontSize:13, fontWeight:500 }}><EntityLink type="deal" id={deal.id} navigate={navigate}>{deal.name}</EntityLink></div><div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{deal.probability}% · Close {deal.closeDate}</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ fontFamily:"var(--font-d)", fontWeight:700, color:"var(--blue)" }}>{fmt(deal.value)}</div><Tag label={deal.stage}/></div>
                </div>
              ))}
            </div>}

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="campaign" entityId={campaign.id}/>
            <ActivityTimeline events={db.events} entityType="campaign" entityId={campaign.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <Megaphone size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select a campaign</p>
          </div>
        )}
      </div>

      {drawer==="add"&&<Drawer title="New Campaign" onClose={()=>setDrawer(null)} onSave={save}>
        <Field label="Campaign Name"><Inp value={d.name} onChange={v=>setD(p=>({...p,name:v}))}/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Type"><Sel value={d.type} onChange={v=>setD(p=>({...p,type:v}))} options={["Email","Social","Referral","Paid","Event","Other"]}/></Field>
          <Field label="Status"><Sel value={d.status} onChange={v=>setD(p=>({...p,status:v}))} options={["draft","active","paused","complete"]}/></Field>
          <Field label="Start Date"><Inp type="date" value={d.startDate} onChange={v=>setD(p=>({...p,startDate:v}))}/></Field>
          <Field label="Leads"><Inp type="number" value={d.leads} onChange={v=>setD(p=>({...p,leads:v}))}/></Field>
          <Field label="Impressions"><Inp type="number" value={d.opens} onChange={v=>setD(p=>({...p,opens:v}))}/></Field>
          <Field label="Conversions"><Inp type="number" value={d.conversions} onChange={v=>setD(p=>({...p,conversions:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={d.notes||""} onChange={v=>setD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};
