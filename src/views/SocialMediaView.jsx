import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Calendar, Search, ExternalLink, RefreshCw, Loader2, ChevronRight, AlertCircle, Copy, Check } from "lucide-react";

/* ── Standalone Supabase client ──
   contentCalendar is NOT part of the central DB_TABLES / loadAllFromDB pipeline,
   so this view reads the table directly (read-only). It deliberately does not
   touch the global db/setDB sync engine.
   NOTE: this duplicates App.jsx's client init from env. When App.jsx is later
   refactored, both should import a single shared client from src/lib/. */
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SB_READY = SUPA_URL.startsWith("https://") && SUPA_KEY.length > 10;
const sb = SB_READY ? createClient(SUPA_URL, SUPA_KEY) : null;

const STATUS_COLORS = {
  "Draft": "var(--text-sec)",
  "Script Ready": "var(--blue)",
  "Scheduled": "var(--amber)",
  "Ready": "var(--amber)",
  "Posted": "var(--green)",
  "Published": "var(--green)",
};
// Canonical status pipeline (editable picklist). Second Brain is the source of truth.
const STATUS_OPTIONS = ["Draft", "Script Ready", "Scheduled", "Posted"];

const TYPE_COLORS = {
  "Video": "var(--purple)",
  "Carousel": "var(--amber)",
  "Text Post": "var(--blue)",
  "Article": "var(--green)",
};
const colorFor = (map, k) => map[k] || "var(--text-sec)";

const Pill = ({ label, color }) => {
  if (!label) return null;
  return (
    <span className="tag" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
      {label}
    </span>
  );
};

const Meta = ({ label, value }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span className="form-label" style={{ marginBottom: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text)" }}>{value}</span>
    </div>
  );
};

const Block = ({ label, value, mono }) => {
  if (!value) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div className="form-label">{label}</div>
      <div className="card-el" style={{ padding: "12px 14px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: mono ? "var(--font-m)" : "var(--font-b)", color: "var(--text)" }}>
        {value}
      </div>
    </div>
  );
};

export default function SocialMediaView() {
  const [rows, setRows] = useState(null);     // null = loading
  const [err, setErr] = useState(null);
  const [sel, setSel] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = async () => {
    if (!sb) { setErr("Supabase env not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)."); setRows([]); return; }
    setRefreshing(true);
    const { data, error } = await sb
      .from("contentCalendar")
      .select("*")
      .order("postDate", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });
    if (error) { setErr(error.message); setRows([]); }
    else { setErr(null); setRows(data || []); }
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const statuses = useMemo(() => Array.from(new Set((rows || []).map(r => r.status).filter(Boolean))), [rows]);
  const allStatuses = useMemo(() => { const set = new Set(STATUS_OPTIONS); (rows || []).forEach(r => r.status && set.add(r.status)); return Array.from(set); }, [rows]);
  const types = useMemo(() => Array.from(new Set((rows || []).map(r => r.contentType).filter(Boolean))), [rows]);

  const filtered = useMemo(() => (rows || []).filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.contentType !== typeFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = [r.videoTitle, r.screenshotLine, r.caption, r.campaign, r.stickyNote].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [rows, statusFilter, typeFilter, query]);

  const selected = sel != null ? (rows || []).find(r => r.id === sel) : null;

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1400); });
  };

  const updateStatus = async (id, status) => {
    if (!sb) return;
    setSavingStatus(true);
    const { error } = await sb.from("contentCalendar").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) setErr(`Status update failed: ${error.message}`);
    else { setErr(null); setRows(rs => (rs || []).map(r => r.id === id ? { ...r, status } : r)); }
    setSavingStatus(false);
  };

  /* ── Loading / error / empty states ── */
  if (rows === null) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-sec)" }}>
        <Loader2 size={18} className="spin" /> <span className="mono" style={{ fontSize: 12 }}>Loading content calendar…</span>
      </div>
    );
  }

  return (
    <div className={`view-shell${sel != null ? " has-selection" : ""}`}>
      {/* LEFT LIST */}
      <div className="list-pane" style={{ width: 320, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg-card)" }}>
        <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={16} color="var(--blue)" />
              <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>Social Media</div>
            </div>
            <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={load} disabled={refreshing}>
              <RefreshCw size={12} className={refreshing ? "spin" : ""} /> Refresh
            </button>
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8 }}>
            {filtered.length} of {rows.length} posts · contentCalendar
          </div>
          {/* Status filters */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            {["all", ...allStatuses].map(s => (
              <button key={s} className={`filter-chip${statusFilter === s ? " active" : ""}`} onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          {/* Type filters */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {["all", ...types].map(t => (
              <button key={t} className={`filter-chip${typeFilter === t ? " active" : ""}`} onClick={() => setTypeFilter(t)}>{t}</button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position: "absolute", left: 10, top: 10, pointerEvents: "none" }} />
            <input className="input" placeholder="Search posts…" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 30, fontSize: 13 }} />
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {err && (
            <div style={{ margin: 14, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start", background: "var(--red-dim)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 8 }}>
              <AlertCircle size={14} color="var(--red)" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--red)" }}>{err}</span>
            </div>
          )}
          {!err && filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-sec)", fontSize: 12 }}>No posts match these filters.</div>
          )}
          {filtered.map(r => (
            <div key={r.id} className="row-hover" onClick={() => setSel(r.id)}
              style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: sel === r.id ? "var(--bg-hover)" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{r.videoTitle || "Untitled"}</div>
                <Pill label={r.status} color={colorFor(STATUS_COLORS, r.status)} />
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ color: colorFor(TYPE_COLORS, r.contentType) }}>{r.contentType || "—"}</span>
                <span>·</span>
                <span>{r.postDate || "unscheduled"}</span>
                {r.postingDay && <><span>·</span><span>{r.postingDay}</span></>}
                {r.campaign && <><span>·</span><span style={{ color: "var(--purple)" }}>{r.campaign}</span></>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT DETAIL */}
      <div className="detail-pane" style={{ flex: 1, overflowY: "auto", padding: 24, background: "var(--bg)" }}>
        {!selected ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-sec)" }}>
            <Calendar size={28} color="var(--text-dim)" />
            <div style={{ fontSize: 13 }}>Select a post to view its script, caption, and notes.</div>
          </div>
        ) : (
          <div className="slide-in">
            <button className="mobile-back" onClick={() => setSel(null)}>
              <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to posts
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div className="display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>{selected.videoTitle || "Untitled"}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <select
                      value={selected.status || ""}
                      onChange={e => updateStatus(selected.id, e.target.value)}
                      disabled={savingStatus}
                      title="Set status"
                      style={{ appearance: "auto", padding: "3px 8px", fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: "pointer", color: colorFor(STATUS_COLORS, selected.status), background: `color-mix(in srgb, ${colorFor(STATUS_COLORS, selected.status)} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${colorFor(STATUS_COLORS, selected.status)} 32%, transparent)`, fontFamily: "var(--font-m)" }}
                    >
                      {!selected.status && <option value="">— set status —</option>}
                      {(STATUS_OPTIONS.includes(selected.status) || !selected.status ? STATUS_OPTIONS : [...STATUS_OPTIONS, selected.status]).map(s => (
                        <option key={s} value={s} style={{ color: "var(--text)", background: "var(--bg-card)" }}>{s}</option>
                      ))}
                    </select>
                    {savingStatus && <Loader2 size={12} className="spin" color="var(--text-sec)" />}
                  </span>
                  <Pill label={selected.contentType} color={colorFor(TYPE_COLORS, selected.contentType)} />
                  {selected.track && <Pill label={selected.track} color="var(--blue)" />}
                  {selected.platform && <Pill label={selected.platform} color="var(--text-sec)" />}
                </div>
              </div>
              {selected.linkedinUrl && (
                <a className="btn btn-ghost" href={selected.linkedinUrl} target="_blank" rel="noreferrer" style={{ padding: "6px 12px", fontSize: 12, textDecoration: "none" }}>
                  <ExternalLink size={13} /> Open post
                </a>
              )}
            </div>

            {selected.screenshotLine && (
              <div className="card" style={{ padding: "14px 16px", marginBottom: 16, borderLeft: "3px solid var(--blue)" }}>
                <div className="form-label" style={{ marginBottom: 4 }}>Screenshot line</div>
                <div className="display" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{selected.screenshotLine}</div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <Meta label="Post date" value={selected.postDate} />
              <Meta label="Time" value={selected.postTime} />
              <Meta label="Day" value={selected.postingDay} />
              <Meta label="Week" value={selected.week} />
              <Meta label="Video #" value={selected.videoNumber} />
              <Meta label="Campaign" value={selected.campaign} />
              <Meta label="Credit to" value={selected.creditTo} />
              <Meta label="Last edited by" value={selected.modified_by} />
            </div>

            <Block label="Sticky note (the point of this post)" value={selected.stickyNote} />
            <Block label="Script" value={selected.script} mono />

            {selected.caption && (
              <div style={{ marginTop: 16 }}>
                <div className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Caption</span>
                  <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => copy(selected.caption, "caption")}>
                    {copied === "caption" ? <Check size={11} color="var(--green)" /> : <Copy size={11} />} {copied === "caption" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="card-el" style={{ padding: "12px 14px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selected.caption}</div>
              </div>
            )}

            <Block label="Engagement notes" value={selected.engagementNotes} />
            <Block label="Daily engagement" value={selected.dailyEngagement} />
            <Block label="Pre-record checklist" value={selected.preRecordChecklist} />
            <Block label="Post-record checklist" value={selected.postRecordChecklist} />

            {Array.isArray(selected.tags) && selected.tags.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="form-label">Tags</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selected.tags.map((t, i) => <Pill key={i} label={t} color="var(--text-sec)" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
