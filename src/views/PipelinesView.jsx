import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, Check, ChevronDown, ChevronRight, ExternalLink, FileText, Filter, Link2, Loader2, Mail, MessageSquare, Phone, Plus, RefreshCw, Search, Target, Trash2, X } from "lucide-react";
import { supabase } from "../lib/supabase";

/* ── Pipelines view ──
   Surfaces full marketing/outbound campaigns from `socialCampaigns` with all
   their activities from `contentCalendar` (filtered by campaign name match).
   Same list+detail pattern as SocialMediaView, but framed around the campaign
   as a pipeline of dated activities — not single posts.

   Reads & writes directly via the authenticated supabase client (not the
   db prop), because this view spans tables outside the App's hot-loaded
   set (socialCampaigns isn't in DB_TABLES). */

const CAMPAIGN_STATUSES = ["Planned", "Active", "Paused", "Complete", "Archived"];
const STATUS_OPTIONS    = ["Draft", "Ready", "Scheduled", "Sent", "Posted", "Done", "Skipped"];
const PLATFORMS         = ["LinkedIn", "Email", "Phone", "Internal", "X/Twitter", "Instagram", "Blog", "SalesforceDevops"];
const CONTENT_TYPES     = ["Cold Email Batch","Email Sequence","LinkedIn Engagement","Text Post","Image Post","Carousel","Video","Article","Phone Call","Prep Task","Deliverability Test","Reply Tracking","Retrospective"];

const STATUS_COLORS = {
  "Draft":"var(--text-sec)", "Ready":"var(--blue)", "Scheduled":"var(--amber)",
  "Sent":"var(--green)", "Posted":"var(--green)", "Done":"var(--green)", "Skipped":"var(--red)",
};
const PLATFORM_COLORS = {
  "LinkedIn":"var(--blue)", "Email":"var(--purple)", "Phone":"var(--amber)",
  "Internal":"var(--text-sec)", "X/Twitter":"var(--text)", "Instagram":"var(--red)",
  "Blog":"var(--green)", "SalesforceDevops":"var(--blue)",
};
const CAMPAIGN_STATUS_COLORS = {
  "Active":"var(--green)", "Planned":"var(--blue)", "Paused":"var(--amber)",
  "Complete":"var(--purple)", "Archived":"var(--text-sec)",
};

const PLATFORM_ICONS = { "LinkedIn":Target, "Email":Mail, "Phone":Phone, "Internal":FileText };

const Pill = ({ label, color, onClick, title }) => {
  if (!label) return null;
  const c = color || "var(--text-sec)";
  return (
    <span onClick={onClick} title={title} className="tag"
      style={{ background:`color-mix(in srgb, ${c} 12%, transparent)`, color:c,
        border:`1px solid color-mix(in srgb, ${c} 28%, transparent)`,
        cursor: onClick ? "pointer" : "default" }}>
      {label}
    </span>
  );
};

const StatusPicklist = ({ value, options, colorMap, onChange, placeholder, disabled }) => {
  const c = colorMap[value] || "var(--text-sec)";
  return (
    <select value={value || ""} disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      onClick={(e)=>e.stopPropagation()}
      style={{ appearance:"auto", padding:"3px 8px", fontSize:11, fontWeight:600,
        borderRadius:6, cursor:"pointer", color:c,
        background:`color-mix(in srgb, ${c} 12%, transparent)`,
        border:`1px solid color-mix(in srgb, ${c} 32%, transparent)`,
        fontFamily:"var(--font-m)" }}>
      <option value="" style={{ color:"var(--text)", background:"var(--bg-card)" }}>{placeholder || "—"}</option>
      {options.map(o => <option key={o} value={o} style={{ color:"var(--text)", background:"var(--bg-card)" }}>{o}</option>)}
    </select>
  );
};

/* Documents list. Renders [{url, label}] from the `documents` jsonb column.
   For http(s) URLs → opens in new tab. For file:// URLs → copy-to-clipboard
   (browsers block direct file:// navigation from web pages for security).
   When `edit` is true, shows inline editor with add/remove. */
function DocumentsList({ docs, onChange, edit }) {
  const list = Array.isArray(docs) ? docs : [];
  const [draft, setDraft] = useState({ label:"", url:"" });
  const [copied, setCopied] = useState(null);

  const openOrCopy = (doc, idx) => {
    if (!doc.url) return;
    if (/^https?:\/\//i.test(doc.url)) { window.open(doc.url, "_blank", "noopener"); return; }
    navigator.clipboard?.writeText(doc.url).then(() => { setCopied(idx); setTimeout(() => setCopied(null), 1400); });
  };

  if (!edit && list.length === 0) return null;

  return (
    <div style={{ marginTop:8 }}>
      {list.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {list.map((d, i) => {
            const isWeb = /^https?:\/\//i.test(d.url || "");
            return (
              <div key={i} className="card-el" style={{ padding:"6px 10px", display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
                {isWeb ? <ExternalLink size={11} color="var(--blue)"/> : <FileText size={11} color="var(--text-sec)"/>}
                <button onClick={() => openOrCopy(d, i)} title={isWeb ? d.url : `Copy: ${d.url}`}
                  style={{ flex:1, minWidth:0, textAlign:"left", background:"transparent", border:"none",
                    cursor:"pointer", color: isWeb ? "var(--blue)" : "var(--text)",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", padding:0, fontFamily:"inherit", fontSize:12 }}>
                  {d.label || d.url}
                </button>
                {copied === i && <span className="mono" style={{ fontSize:10, color:"var(--green)" }}><Check size={10}/> copied</span>}
                {edit && (
                  <button className="btn-icon" title="Remove" style={{ width:22, height:22 }}
                    onClick={(e) => { e.stopPropagation(); onChange(list.filter((_, j) => j !== i)); }}>
                    <X size={11} color="var(--text-sec)"/>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {edit && (
        <div style={{ display:"flex", gap:6, marginTop:6 }}>
          <input className="input" placeholder="Label" value={draft.label}
            onChange={(e) => setDraft(p => ({ ...p, label:e.target.value }))}
            style={{ fontSize:12, padding:"6px 9px", width:130 }}/>
          <input className="input" placeholder="https://… or file:///…" value={draft.url}
            onChange={(e) => setDraft(p => ({ ...p, url:e.target.value }))}
            style={{ fontSize:12, padding:"6px 9px", flex:1 }}/>
          <button className="btn btn-ghost" style={{ fontSize:11, padding:"4px 10px" }}
            disabled={!draft.url || !draft.label}
            onClick={() => { onChange([...list, draft]); setDraft({ label:"", url:"" }); }}>
            <Plus size={11}/> Add
          </button>
        </div>
      )}
    </div>
  );
}

export default function PipelinesView() {
  const [campaigns, setCampaigns] = useState(null);   // null = loading
  const [activities, setActivities] = useState([]);
  const [err, setErr] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [sel, setSel] = useState(null);               // selected campaign id
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(new Set());     // empty = show all
  const [platformFilter, setPlatformFilter] = useState(new Set()); // empty = show all
  const [filterOpen, setFilterOpen] = useState(false);

  const [expanded, setExpanded] = useState(null);     // activity id expanded inline
  const [editDocs, setEditDocs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCampaign, setNewCampaign] = useState(null);
  const [newActivity, setNewActivity] = useState(null);

  const ready = supabase != null;

  const load = async () => {
    if (!ready) { setErr("Supabase env not configured."); setCampaigns([]); return; }
    setRefreshing(true);
    const [{ data: cData, error: cErr }, { data: aData, error: aErr }] = await Promise.all([
      supabase.from("socialCampaigns").select("*").order("startDate", { ascending:false }),
      supabase.from("contentCalendar").select("*").order("postDate", { ascending:true }),
    ]);
    if (cErr || aErr) { setErr((cErr || aErr).message); setCampaigns([]); setActivities([]); }
    else { setErr(null); setCampaigns(cData || []); setActivities(aData || []); }
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);
  // Auto-select the first campaign once loaded
  useEffect(() => {
    if (campaigns && campaigns.length && sel == null) setSel(campaigns[0].id);
  }, [campaigns]);

  const campaign = useMemo(() => (campaigns || []).find(c => c.id === sel) || null, [campaigns, sel]);

  // Match activities to this campaign by the `campaign` column on contentCalendar.
  const campaignActivities = useMemo(() => {
    if (!campaign) return [];
    return activities
      .filter(a => (a.campaign || "").trim() === (campaign.name || "").trim())
      .sort((a, b) => {
        const da = a.postDate || "9999-12-31", db = b.postDate || "9999-12-31";
        if (da !== db) return da < db ? -1 : 1;
        return (a.id || 0) - (b.id || 0);
      });
  }, [activities, campaign]);

  const filteredActivities = useMemo(() => {
    return campaignActivities.filter(a => {
      if (statusFilter.size && !statusFilter.has(a.status)) return false;
      if (platformFilter.size && !platformFilter.has(a.platform)) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = [a.videoTitle, a.script, a.caption, a.stickyNote, a.engagementNotes].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [campaignActivities, statusFilter, platformFilter, query]);

  // Group filtered activities by ISO week start (Monday).
  const grouped = useMemo(() => {
    const groups = new Map();
    filteredActivities.forEach(a => {
      let weekKey = "Undated";
      if (a.postDate) {
        const d = new Date(a.postDate + "T00:00:00");
        const day = d.getDay(); // 0=Sun
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(d); monday.setDate(d.getDate() + diff);
        weekKey = monday.toISOString().slice(0, 10);
      }
      if (!groups.has(weekKey)) groups.set(weekKey, []);
      groups.get(weekKey).push(a);
    });
    return Array.from(groups.entries()).sort(([a],[b]) => a < b ? -1 : 1);
  }, [filteredActivities]);

  const metrics = useMemo(() => {
    const total = campaignActivities.length;
    const byStatus = {};
    const byPlatform = {};
    campaignActivities.forEach(a => {
      byStatus[a.status || "—"] = (byStatus[a.status || "—"] || 0) + 1;
      byPlatform[a.platform || "—"] = (byPlatform[a.platform || "—"] || 0) + 1;
    });
    const done = (byStatus["Sent"] || 0) + (byStatus["Posted"] || 0) + (byStatus["Done"] || 0);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, byStatus, byPlatform, done, pct };
  }, [campaignActivities]);

  /* ── Save helpers ── */
  const saveCampaignField = async (col, value) => {
    if (!campaign) return;
    setSaving(true);
    const v = value === "" ? null : value;
    const { error } = await supabase.from("socialCampaigns")
      .update({ [col]: v, updated_at: new Date().toISOString() }).eq("id", campaign.id);
    if (error) setErr(`Save failed (${col}): ${error.message}`);
    else { setErr(null); setCampaigns(rs => (rs || []).map(c => c.id === campaign.id ? { ...c, [col]: v } : c)); }
    setSaving(false);
  };

  const saveActivityField = async (id, col, value) => {
    setSaving(true);
    const v = value === "" ? null : value;
    const { error } = await supabase.from("contentCalendar")
      .update({ [col]: v, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) setErr(`Save failed (${col}): ${error.message}`);
    else { setErr(null); setActivities(rs => rs.map(r => r.id === id ? { ...r, [col]: v } : r)); }
    setSaving(false);
  };

  const createCampaign = async () => {
    if (!newCampaign?.name) return;
    setSaving(true);
    const payload = {
      name: newCampaign.name,
      description: newCampaign.description || null,
      startDate: newCampaign.startDate || null,
      endDate: newCampaign.endDate || null,
      status: newCampaign.status || "Planned",
      platform: newCampaign.platform || "Multi-channel",
      goals: newCampaign.goals || null,
    };
    const { data, error } = await supabase.from("socialCampaigns").insert(payload).select().single();
    if (error) setErr(`Create campaign failed: ${error.message}`);
    else { setCampaigns(rs => [data, ...(rs || [])]); setSel(data.id); setNewCampaign(null); }
    setSaving(false);
  };

  const createActivity = async () => {
    if (!campaign || !newActivity?.videoTitle) return;
    setSaving(true);
    const payload = {
      videoTitle: newActivity.videoTitle,
      campaign: campaign.name,
      platform: newActivity.platform || "Internal",
      status: newActivity.status || "Draft",
      contentType: newActivity.contentType || "Prep Task",
      postDate: newActivity.postDate || null,
      stickyNote: newActivity.stickyNote || null,
      documents: [],
    };
    const { data, error } = await supabase.from("contentCalendar").insert(payload).select().single();
    if (error) setErr(`Create activity failed: ${error.message}`);
    else { setActivities(rs => [...rs, data]); setNewActivity(null); }
    setSaving(false);
  };

  const deleteActivity = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    const { error } = await supabase.from("contentCalendar").delete().eq("id", id);
    if (error) setErr(`Delete failed: ${error.message}`);
    else setActivities(rs => rs.filter(r => r.id !== id));
  };

  /* ── Render ── */
  if (campaigns === null) {
    return (
      <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"var(--text-sec)" }}>
        <Loader2 size={18} className="spin"/> <span className="mono" style={{ fontSize:12 }}>Loading pipelines…</span>
      </div>
    );
  }

  const toggleSet = (setter, key) => setter(p => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });

  return (
    <div className={`view-shell${sel != null ? " has-selection" : ""}`}>
      {/* LEFT LIST — campaigns */}
      <div className="list-pane" style={{ width:320, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Target size={16} color="var(--blue)"/>
              <div className="display" style={{ fontSize:16, fontWeight:700 }}>Pipelines</div>
            </div>
            <div style={{ display:"flex", gap:4 }}>
              <button className="btn btn-ghost" title="Refresh" style={{ padding:"5px 9px" }} onClick={load} disabled={refreshing}>
                <RefreshCw size={12} className={refreshing ? "spin" : ""}/>
              </button>
              <button className="btn btn-blue" style={{ padding:"5px 9px", fontSize:11 }}
                onClick={() => setNewCampaign({ name:"", status:"Planned", startDate:new Date().toISOString().slice(0,10) })}>
                <Plus size={11}/> New
              </button>
            </div>
          </div>
          <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>
            {campaigns.length} {campaigns.length === 1 ? "pipeline" : "pipelines"}
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {err && (
            <div style={{ margin:14, padding:"10px 12px", display:"flex", gap:8, alignItems:"flex-start", background:"var(--red-dim)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:8 }}>
              <AlertCircle size={14} color="var(--red)" style={{ marginTop:2, flexShrink:0 }}/>
              <span style={{ fontSize:12, color:"var(--red)" }}>{err}</span>
            </div>
          )}
          {campaigns.length === 0 && !err && (
            <div style={{ padding:24, textAlign:"center", color:"var(--text-sec)", fontSize:12 }}>No pipelines yet. Click <b>New</b> to start.</div>
          )}
          {campaigns.map(c => {
            const acts = activities.filter(a => (a.campaign || "").trim() === (c.name || "").trim());
            const sent = acts.filter(a => ["Sent","Posted","Done"].includes(a.status)).length;
            return (
              <div key={c.id} className="row-hover" onClick={() => { setSel(c.id); setExpanded(null); }}
                style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background: sel === c.id ? "var(--bg-hover)" : "transparent" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                  <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", minWidth:0 }}>{c.name}</div>
                  <Pill label={c.status} color={CAMPAIGN_STATUS_COLORS[c.status] || "var(--text-sec)"}/>
                </div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:4, display:"flex", justifyContent:"space-between" }}>
                  <span>{c.startDate || "—"}{c.endDate ? ` → ${c.endDate}` : ""}</span>
                  <span>{sent}/{acts.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT DETAIL */}
      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {!campaign ? (
          <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, color:"var(--text-sec)" }}>
            <Target size={28} color="var(--text-dim)"/>
            <div style={{ fontSize:13 }}>Select a pipeline.</div>
          </div>
        ) : (
          <div className="slide-in" key={campaign.id}>
            <button className="mobile-back" onClick={() => setSel(null)}>
              <ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/> Back to pipelines
            </button>

            {/* Campaign header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:6, flexWrap:"wrap" }}>
              <div style={{ minWidth:0, flex:1 }}>
                <input className="input" value={campaign.name || ""}
                  onChange={(e) => setCampaigns(rs => rs.map(c => c.id === campaign.id ? { ...c, name:e.target.value } : c))}
                  onBlur={(e) => saveCampaignField("name", e.target.value)}
                  style={{ fontSize:22, fontWeight:800, padding:"6px 10px", fontFamily:"var(--font-d)", border:"1px solid transparent", background:"transparent" }}/>
                <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginTop:4, paddingLeft:11 }}>
                  {campaign.startDate || "—"}{campaign.endDate ? ` → ${campaign.endDate}` : ""} · {campaign.platform || "Multi-channel"}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <StatusPicklist value={campaign.status} options={CAMPAIGN_STATUSES} colorMap={CAMPAIGN_STATUS_COLORS}
                  onChange={(v) => saveCampaignField("status", v)} placeholder="status"/>
                {saving && <Loader2 size={12} className="spin" color="var(--text-sec)"/>}
              </div>
            </div>

            {/* Description */}
            <div className="card" style={{ padding:14, marginTop:14, marginBottom:14 }}>
              <textarea className="input" value={campaign.description || ""}
                onChange={(e) => setCampaigns(rs => rs.map(c => c.id === campaign.id ? { ...c, description:e.target.value } : c))}
                onBlur={(e) => saveCampaignField("description", e.target.value)}
                placeholder="What is this pipeline? Goals, target ICP, batch sizing, what 'done' looks like."
                style={{ minHeight:60, fontSize:13, lineHeight:1.6 }}/>
            </div>

            {/* Metrics */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10, marginBottom:18 }}>
              <div className="card-el" style={{ padding:"12px 14px" }}>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>TOTAL ACTIVITIES</div>
                <div style={{ fontFamily:"var(--font-d)", fontSize:22, fontWeight:800, color:"var(--text)" }}>{metrics.total}</div>
              </div>
              <div className="card-el" style={{ padding:"12px 14px" }}>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>COMPLETED</div>
                <div style={{ fontFamily:"var(--font-d)", fontSize:22, fontWeight:800, color:"var(--green)" }}>{metrics.done} <span style={{ fontSize:13, color:"var(--text-sec)" }}>({metrics.pct}%)</span></div>
              </div>
              <div className="card-el" style={{ padding:"12px 14px" }}>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>READY / SCHEDULED</div>
                <div style={{ fontFamily:"var(--font-d)", fontSize:22, fontWeight:800, color:"var(--blue)" }}>{(metrics.byStatus["Ready"]||0) + (metrics.byStatus["Scheduled"]||0)}</div>
              </div>
              <div className="card-el" style={{ padding:"12px 14px" }}>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>DRAFT</div>
                <div style={{ fontFamily:"var(--font-d)", fontSize:22, fontWeight:800, color:"var(--text-sec)" }}>{metrics.byStatus["Draft"]||0}</div>
              </div>
            </div>

            {/* Filters + add */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, gap:8, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:220 }}>
                <div style={{ position:"relative", flex:1, maxWidth:280 }}>
                  <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
                  <input className="input" placeholder="Search activities…" value={query}
                    onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
                </div>
                <button className="btn btn-ghost" style={{ padding:"5px 9px", position:"relative", color: (statusFilter.size + platformFilter.size) ? "var(--blue)" : undefined }}
                  onClick={() => setFilterOpen(o => !o)}>
                  <Filter size={12}/>
                  {(statusFilter.size + platformFilter.size) > 0 && (
                    <span style={{ position:"absolute", top:-4, right:-4, background:"var(--blue)", color:"#fff", borderRadius:8, fontSize:9, fontWeight:700, minWidth:14, height:14, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>{statusFilter.size + platformFilter.size}</span>
                  )}
                </button>
              </div>
              <button className="btn btn-blue" style={{ padding:"6px 12px", fontSize:12 }}
                onClick={() => setNewActivity({ videoTitle:"", platform:"Internal", status:"Draft", contentType:"Prep Task", postDate:new Date().toISOString().slice(0,10) })}>
                <Plus size={12}/> Add activity
              </button>
            </div>

            {/* Filter popover */}
            {filterOpen && (
              <div className="card" style={{ padding:12, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>FILTERS</div>
                  <button className="btn btn-ghost" style={{ padding:"3px 8px", fontSize:11 }}
                    onClick={() => { setStatusFilter(new Set()); setPlatformFilter(new Set()); }}>Clear all</button>
                </div>
                <div className="form-label" style={{ marginTop:6 }}>Status</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {STATUS_OPTIONS.map(s => {
                    const on = statusFilter.has(s);
                    const c = STATUS_COLORS[s];
                    return (
                      <button key={s} onClick={() => toggleSet(setStatusFilter, s)}
                        style={{ padding:"4px 9px", fontSize:11, borderRadius:6, cursor:"pointer",
                          color: on ? c : "var(--text-sec)",
                          background: on ? `color-mix(in srgb, ${c} 14%, transparent)` : "transparent",
                          border: `1px solid ${on ? `color-mix(in srgb, ${c} 38%, transparent)` : "var(--border)"}`,
                          fontWeight: on ? 600 : 400 }}>
                        {on ? "✓ " : ""}{s}
                      </button>
                    );
                  })}
                </div>
                <div className="form-label" style={{ marginTop:10 }}>Platform</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {PLATFORMS.map(p => {
                    const on = platformFilter.has(p);
                    const c = PLATFORM_COLORS[p];
                    return (
                      <button key={p} onClick={() => toggleSet(setPlatformFilter, p)}
                        style={{ padding:"4px 9px", fontSize:11, borderRadius:6, cursor:"pointer",
                          color: on ? c : "var(--text-sec)",
                          background: on ? `color-mix(in srgb, ${c} 14%, transparent)` : "transparent",
                          border: `1px solid ${on ? `color-mix(in srgb, ${c} 38%, transparent)` : "var(--border)"}`,
                          fontWeight: on ? 600 : 400 }}>
                        {on ? "✓ " : ""}{p}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activities, grouped by week */}
            {grouped.length === 0 && (
              <div style={{ padding:30, textAlign:"center", color:"var(--text-sec)", fontSize:13 }}>
                {campaignActivities.length === 0 ? "No activities yet. Click Add activity to start." : "No activities match these filters."}
              </div>
            )}
            {grouped.map(([weekKey, acts]) => (
              <div key={weekKey} style={{ marginBottom:18 }}>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:6, display:"flex", alignItems:"center", gap:6, textTransform:"uppercase", letterSpacing:".04em" }}>
                  <Calendar size={11}/>
                  {weekKey === "Undated" ? "Undated" : `Week of ${new Date(weekKey + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" })}`}
                  <span style={{ color:"var(--text-dim)" }}>· {acts.length}</span>
                </div>
                {acts.map(a => {
                  const isOpen = expanded === a.id;
                  const PIcon = PLATFORM_ICONS[a.platform] || MessageSquare;
                  return (
                    <div key={a.id} className="card" style={{ padding:0, marginBottom:6, overflow:"hidden" }}>
                      <div className="row-hover" onClick={() => setExpanded(isOpen ? null : a.id)}
                        style={{ padding:"10px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:28, color:"var(--text-sec)" }}>
                          <PIcon size={14} color={PLATFORM_COLORS[a.platform] || "var(--text-sec)"}/>
                        </div>
                        <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", width:62, flexShrink:0 }}>
                          {a.postDate ? new Date(a.postDate + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "—"}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.videoTitle || "Untitled"}</div>
                          <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2, display:"flex", gap:6 }}>
                            <span style={{ color: PLATFORM_COLORS[a.platform] || "var(--text-sec)" }}>{a.platform || "—"}</span>
                            <span>·</span>
                            <span>{a.contentType || "—"}</span>
                            {(a.documents || []).length > 0 && <><span>·</span><Link2 size={10}/> {a.documents.length}</>}
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <StatusPicklist value={a.status} options={STATUS_OPTIONS} colorMap={STATUS_COLORS}
                            onChange={(v) => saveActivityField(a.id, "status", v)} placeholder="set"/>
                          <ChevronDown size={14} color="var(--text-sec)" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition:"transform .15s" }}/>
                        </div>
                      </div>
                      {isOpen && (
                        <div style={{ padding:"12px 14px", borderTop:"1px solid var(--border)", background:"var(--bg-el)" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10, marginBottom:10 }}>
                            <div>
                              <div className="form-label">Date</div>
                              <input className="input" type="date" defaultValue={a.postDate || ""}
                                onBlur={(e) => saveActivityField(a.id, "postDate", e.target.value)} style={{ fontSize:12, padding:"6px 9px" }}/>
                            </div>
                            <div>
                              <div className="form-label">Platform</div>
                              <select className="input" defaultValue={a.platform || ""}
                                onChange={(e) => saveActivityField(a.id, "platform", e.target.value)} style={{ fontSize:12, padding:"6px 9px" }}>
                                <option value="">—</option>
                                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div>
                              <div className="form-label">Type</div>
                              <select className="input" defaultValue={a.contentType || ""}
                                onChange={(e) => saveActivityField(a.id, "contentType", e.target.value)} style={{ fontSize:12, padding:"6px 9px" }}>
                                <option value="">—</option>
                                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="form-label">Title</div>
                          <input className="input" defaultValue={a.videoTitle || ""}
                            onBlur={(e) => saveActivityField(a.id, "videoTitle", e.target.value)}
                            style={{ fontSize:13 }}/>

                          <div className="form-label" style={{ marginTop:10 }}>Note / point</div>
                          <textarea className="input" defaultValue={a.stickyNote || ""}
                            onBlur={(e) => saveActivityField(a.id, "stickyNote", e.target.value)}
                            placeholder="The point of this activity"
                            style={{ fontSize:12.5, minHeight:50, lineHeight:1.6 }}/>

                          {a.script && (
                            <>
                              <div className="form-label" style={{ marginTop:10 }}>Script</div>
                              <textarea className="input" defaultValue={a.script || ""}
                                onBlur={(e) => saveActivityField(a.id, "script", e.target.value)}
                                style={{ fontSize:12, fontFamily:"var(--font-m)", minHeight:80, lineHeight:1.6 }}/>
                            </>
                          )}
                          {a.caption && (
                            <>
                              <div className="form-label" style={{ marginTop:10 }}>Caption</div>
                              <textarea className="input" defaultValue={a.caption || ""}
                                onBlur={(e) => saveActivityField(a.id, "caption", e.target.value)}
                                style={{ fontSize:12, minHeight:60, lineHeight:1.6 }}/>
                            </>
                          )}

                          {/* Documents */}
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
                            <div className="form-label" style={{ marginBottom:0 }}>Documents & links</div>
                            <button className="btn btn-ghost" style={{ padding:"3px 8px", fontSize:11 }}
                              onClick={() => setEditDocs(d => !d)}>{editDocs ? "Done" : "Edit"}</button>
                          </div>
                          <DocumentsList docs={a.documents} edit={editDocs}
                            onChange={(next) => saveActivityField(a.id, "documents", next)}/>

                          <div style={{ marginTop:12, display:"flex", justifyContent:"flex-end" }}>
                            <button className="btn btn-danger" style={{ padding:"4px 10px", fontSize:11 }}
                              onClick={() => deleteActivity(a.id)}>
                              <Trash2 size={11}/> Delete activity
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New campaign drawer */}
      {newCampaign && (
        <>
          <div onClick={() => setNewCampaign(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:60 }}/>
          <div className="card" style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(440px, 92vw)", padding:20, zIndex:61 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>New Pipeline Campaign</div>
            <div className="form-label">Name</div>
            <input className="input" value={newCampaign.name} placeholder="e.g. Q3 Outbound — RevOps cohort"
              onChange={(e) => setNewCampaign(p => ({ ...p, name:e.target.value }))} style={{ fontSize:13 }}/>
            <div className="form-label" style={{ marginTop:10 }}>Description</div>
            <textarea className="input" value={newCampaign.description || ""} placeholder="What is this pipeline aiming to do?"
              onChange={(e) => setNewCampaign(p => ({ ...p, description:e.target.value }))} style={{ fontSize:13, minHeight:60 }}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
              <div>
                <div className="form-label">Start</div>
                <input className="input" type="date" value={newCampaign.startDate || ""}
                  onChange={(e) => setNewCampaign(p => ({ ...p, startDate:e.target.value }))}/>
              </div>
              <div>
                <div className="form-label">End</div>
                <input className="input" type="date" value={newCampaign.endDate || ""}
                  onChange={(e) => setNewCampaign(p => ({ ...p, endDate:e.target.value }))}/>
              </div>
              <div>
                <div className="form-label">Status</div>
                <select className="input" value={newCampaign.status}
                  onChange={(e) => setNewCampaign(p => ({ ...p, status:e.target.value }))}>
                  {CAMPAIGN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="form-label">Platform</div>
                <input className="input" value={newCampaign.platform || ""} placeholder="Multi-channel"
                  onChange={(e) => setNewCampaign(p => ({ ...p, platform:e.target.value }))}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:16, justifyContent:"flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setNewCampaign(null)}>Cancel</button>
              <button className="btn btn-blue" disabled={!newCampaign.name || saving} onClick={createCampaign}>
                {saving ? <Loader2 size={12} className="spin"/> : <Plus size={12}/>} Create pipeline
              </button>
            </div>
          </div>
        </>
      )}

      {/* New activity drawer */}
      {newActivity && (
        <>
          <div onClick={() => setNewActivity(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:60 }}/>
          <div className="card" style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(440px, 92vw)", padding:20, zIndex:61 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>New Activity</div>
            <div className="form-label">Title</div>
            <input className="input" value={newActivity.videoTitle} placeholder="e.g. Send Batch 5 — 6 emails"
              onChange={(e) => setNewActivity(p => ({ ...p, videoTitle:e.target.value }))} style={{ fontSize:13 }}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
              <div>
                <div className="form-label">Date</div>
                <input className="input" type="date" value={newActivity.postDate || ""}
                  onChange={(e) => setNewActivity(p => ({ ...p, postDate:e.target.value }))}/>
              </div>
              <div>
                <div className="form-label">Status</div>
                <select className="input" value={newActivity.status}
                  onChange={(e) => setNewActivity(p => ({ ...p, status:e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="form-label">Platform</div>
                <select className="input" value={newActivity.platform}
                  onChange={(e) => setNewActivity(p => ({ ...p, platform:e.target.value }))}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <div className="form-label">Type</div>
                <select className="input" value={newActivity.contentType}
                  onChange={(e) => setNewActivity(p => ({ ...p, contentType:e.target.value }))}>
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-label" style={{ marginTop:10 }}>Note</div>
            <textarea className="input" value={newActivity.stickyNote || ""} placeholder="The point of this activity"
              onChange={(e) => setNewActivity(p => ({ ...p, stickyNote:e.target.value }))} style={{ fontSize:13, minHeight:50 }}/>
            <div style={{ display:"flex", gap:8, marginTop:16, justifyContent:"flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setNewActivity(null)}>Cancel</button>
              <button className="btn btn-blue" disabled={!newActivity.videoTitle || saving} onClick={createActivity}>
                {saving ? <Loader2 size={12} className="spin"/> : <Plus size={12}/>} Add to pipeline
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
