import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Calendar, Search, ExternalLink, RefreshCw, Loader2, ChevronRight, AlertCircle, Copy, Check, Filter, BookOpen, X, Link2 } from "lucide-react";

/* ── Social Media view ──
   Reads/writes contentCalendar directly via the shared (authenticated) client.
   Using the shared client (not a separate anon client) means RLS-protected
   tables like ai_memories are readable as the logged-in user.
   Defaults to "upcoming" (everything not Posted), sorted next-up first.
   Detail pane is fully editable inline; edits persist to Supabase on blur/change. */

const STATUS_OPTIONS  = ["Draft", "Script Ready", "Scheduled", "Posted"];
const TYPE_OPTIONS    = ["Video", "Carousel", "Text Post", "Article"];
const ACCOUNT_OPTIONS = ["Personal", "Voitra", "Aventary"];

const STATUS_COLORS = {
  "Draft": "var(--text-sec)",
  "Script Ready": "var(--blue)",
  "Scheduled": "var(--amber)",
  "Posted": "var(--green)",
};
const TYPE_COLORS = {
  "Video": "var(--purple)",
  "Carousel": "var(--amber)",
  "Text Post": "var(--blue)",
  "Article": "var(--green)",
};
const ACCOUNT_COLORS = {
  "Personal": "var(--blue)",
  "Voitra": "var(--purple)",
  "Aventary": "var(--amber)",
};
const colorFor = (map, k) => map[k] || "var(--text-sec)";
const uniq = (arr) => Array.from(new Set(arr));
const NONE = "—";

const Pill = ({ label, color }) => {
  if (!label) return null;
  return (
    <span className="tag" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
      {label}
    </span>
  );
};

/* Inline editable single-line input. Commits on blur / Enter if changed. */
function EditableText({ value, onCommit, placeholder, type = "text", mono, style }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => { setV(value ?? ""); }, [value]);
  return (
    <input
      className="input"
      type={type === "number" ? "number" : type === "date" ? "date" : "text"}
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (String(value ?? "") !== String(v)) onCommit(v); }}
      onKeyDown={(e) => { if (e.key === "Enter" && type !== "textarea") e.currentTarget.blur(); }}
      style={{ fontSize: 13, fontFamily: mono ? "var(--font-m)" : "inherit", ...style }}
    />
  );
}

/* Inline editable multi-line textarea with auto-grow. */
function EditableArea({ value, onCommit, placeholder, mono }) {
  const [v, setV] = useState(value ?? "");
  const ref = useRef(null);
  const grow = (el) => { if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 640) + "px"; } };
  useEffect(() => { setV(value ?? ""); }, [value]);
  useEffect(() => { grow(ref.current); }, [v]);
  return (
    <textarea
      ref={ref}
      className="input"
      value={v}
      placeholder={placeholder}
      onChange={(e) => { setV(e.target.value); grow(e.target); }}
      onBlur={() => { if ((value ?? "") !== v) onCommit(v); }}
      style={{ width: "100%", resize: "vertical", minHeight: 84, lineHeight: 1.6, fontSize: 13, whiteSpace: "pre-wrap", fontFamily: mono ? "var(--font-m)" : "inherit", padding: "10px 12px" }}
    />
  );
}

/* Colored inline picklist (status / type / account). */
function Picklist({ value, options, colorMap, onChange, disabled, placeholder }) {
  const color = colorFor(colorMap, value);
  return (
    <select
      value={value || ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      style={{ appearance: "auto", padding: "3px 8px", fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: "pointer", color, background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`, fontFamily: "var(--font-m)" }}
    >
      <option value="" style={{ color: "var(--text)", background: "var(--bg-card)" }}>{placeholder || NONE}</option>
      {options.map((o) => <option key={o} value={o} style={{ color: "var(--text)", background: "var(--bg-card)" }}>{o}</option>)}
      {value && !options.includes(value) && <option value={value} style={{ color: "var(--text)", background: "var(--bg-card)" }}>{value}</option>}
    </select>
  );
}

const EditRow = ({ label, children }) => (
  <div style={{ marginTop: 16 }}>
    <div className="form-label">{label}</div>
    {children}
  </div>
);

export default function SocialMediaView() {
  const [rows, setRows] = useState(null);     // null = loading
  const [err, setErr] = useState(null);
  const [sel, setSel] = useState(null);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(0);

  // Filters (multi-select). null until seeded from data on first load.
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusSel, setStatusSel] = useState(null);
  const [typeSel, setTypeSel] = useState(null);
  const [accountSel, setAccountSel] = useState(null);

  // Reference drawer (ICP + voice from ai_memories)
  const [refOpen, setRefOpen] = useState(false);
  const [refMem, setRefMem] = useState(null);
  const [refErr, setRefErr] = useState(null);

  const ready = supabase != null;

  const load = async () => {
    if (!ready) { setErr("Supabase env not configured."); setRows([]); return; }
    setRefreshing(true);
    const { data, error } = await supabase.from("contentCalendar").select("*").order("id", { ascending: true });
    if (error) { setErr(error.message); setRows([]); }
    else { setErr(null); setRows(data || []); }
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  // Seed filter selections once data arrives: all options selected EXCEPT "Posted".
  useEffect(() => {
    if (rows && statusSel === null) {
      const sU = uniq([...STATUS_OPTIONS, ...rows.map((r) => r.status || NONE)]);
      const tU = uniq([...TYPE_OPTIONS, ...rows.map((r) => r.contentType || NONE)]);
      const aU = uniq([...ACCOUNT_OPTIONS, ...rows.map((r) => r.account || NONE)]);
      setStatusSel(new Set(sU.filter((s) => s !== "Posted")));
      setTypeSel(new Set(tU));
      setAccountSel(new Set(aU));
    }
  }, [rows, statusSel]);

  const statusUniv  = useMemo(() => uniq([...STATUS_OPTIONS, ...(rows || []).map((r) => r.status || NONE)]), [rows]);
  const typeUniv    = useMemo(() => uniq([...TYPE_OPTIONS, ...(rows || []).map((r) => r.contentType || NONE)]), [rows]);
  const accountUniv = useMemo(() => uniq([...ACCOUNT_OPTIONS, ...(rows || []).map((r) => r.account || NONE)]), [rows]);

  const toggle = (setter, key) => setter((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const resetUpcoming = () => {
    setStatusSel(new Set(statusUniv.filter((s) => s !== "Posted")));
    setTypeSel(new Set(typeUniv));
    setAccountSel(new Set(accountUniv));
  };

  const activeFilterCount =
    (statusSel ? statusUniv.filter((s) => !statusSel.has(s)).length : 0) +
    (typeSel ? typeUniv.filter((t) => !typeSel.has(t)).length : 0) +
    (accountSel ? accountUniv.filter((a) => !accountSel.has(a)).length : 0);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const out = rows.filter((r) => {
      if (statusSel && !statusSel.has(r.status || NONE)) return false;
      if (typeSel && !typeSel.has(r.contentType || NONE)) return false;
      if (accountSel && !accountSel.has(r.account || NONE)) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = [r.videoTitle, r.screenshotLine, r.caption, r.campaign, r.stickyNote, r.script].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Sort: next-up first — dated rows ascending, undated last.
    const FAR = "9999-12-31";
    return out.sort((a, b) => {
      const da = a.postDate || FAR, db = b.postDate || FAR;
      if (da !== db) return da < db ? -1 : 1;
      return (a.videoNumber ?? 1e9) - (b.videoNumber ?? 1e9) || a.id - b.id;
    });
  }, [rows, statusSel, typeSel, accountSel, query]);

  const selected = sel != null ? (rows || []).find((r) => r.id === sel) : null;

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1400); });
  };

  // Persist a single field edit.
  const save = async (id, col, value) => {
    if (!ready) return;
    setSaving(true);
    const v = value === "" ? null : value;
    const { error } = await supabase.from("contentCalendar").update({ [col]: v, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { setErr(`Save failed (${col}): ${error.message}`); }
    else { setErr(null); setRows((rs) => (rs || []).map((r) => (r.id === id ? { ...r, [col]: v } : r))); setJustSaved(Date.now()); }
    setSaving(false);
  };

  const loadRef = async () => {
    if (refMem || !ready) return;
    const { data, error } = await supabase
      .from("ai_memories")
      .select("id,subject,memory_type,memory_summary")
      .or("memory_type.eq.brand_voice,memory_type.eq.icp,subject.ilike.%ICP%,subject.ilike.%ideal customer%,subject.ilike.%voice%")
      .order("id");
    if (error) { setRefErr(error.message); setRefMem([]); }
    else { setRefErr(null); setRefMem(data || []); }
  };
  const openRef = () => { setRefOpen(true); loadRef(); };

  if (rows === null) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-sec)" }}>
        <Loader2 size={18} className="spin" /> <span className="mono" style={{ fontSize: 12 }}>Loading content calendar…</span>
      </div>
    );
  }

  const FilterGroup = ({ title, options, sel, setter, colorMap }) => (
    <div style={{ marginBottom: 12 }}>
      <div className="form-label" style={{ marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((o) => {
          const on = sel?.has(o);
          const c = colorFor(colorMap, o);
          return (
            <button key={o} onClick={() => toggle(setter, o)}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", fontSize: 12, borderRadius: 6, cursor: "pointer",
                color: on ? c : "var(--text-sec)",
                background: on ? `color-mix(in srgb, ${c} 14%, transparent)` : "transparent",
                border: `1px solid ${on ? `color-mix(in srgb, ${c} 38%, transparent)` : "var(--border)"}`, fontWeight: on ? 600 : 400 }}>
              {on ? <Check size={11} /> : null}{o}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`view-shell${sel != null ? " has-selection" : ""}`}>
      {/* LEFT LIST */}
      <div className="list-pane" style={{ width: 340, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg-card)" }}>
        <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid var(--border)", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={16} color="var(--blue)" />
              <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>Social Media</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-ghost" title="ICP & Voice reference" style={{ padding: "5px 9px", fontSize: 12 }} onClick={openRef}>
                <BookOpen size={13} />
              </button>
              <button className="btn btn-ghost" title="Filters" style={{ padding: "5px 9px", fontSize: 12, position: "relative", color: activeFilterCount ? "var(--blue)" : undefined }} onClick={() => setFilterOpen((o) => !o)}>
                <Filter size={13} />
                {activeFilterCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, background: "var(--blue)", color: "#fff", borderRadius: 8, fontSize: 9, fontWeight: 700, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{activeFilterCount}</span>
                )}
              </button>
              <button className="btn btn-ghost" title="Refresh" style={{ padding: "5px 9px", fontSize: 12 }} onClick={load} disabled={refreshing}>
                <RefreshCw size={12} className={refreshing ? "spin" : ""} />
              </button>
            </div>
          </div>

          <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8 }}>
            {filtered.length} of {rows.length} · next up first{activeFilterCount ? " · filtered" : " · upcoming only"}
          </div>

          <div style={{ position: "relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position: "absolute", left: 10, top: 10, pointerEvents: "none" }} />
            <input className="input" placeholder="Search posts…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 30, fontSize: 13 }} />
          </div>

          {/* Filter popover */}
          {filterOpen && (
            <>
              <div onClick={() => setFilterOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div style={{ position: "absolute", top: 46, right: 14, zIndex: 41, width: 290, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,0.35)", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div className="display" style={{ fontSize: 13, fontWeight: 700 }}>Filters</div>
                  <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={resetUpcoming}>Reset to upcoming</button>
                </div>
                <FilterGroup title="Status" options={statusUniv} sel={statusSel} setter={setStatusSel} colorMap={STATUS_COLORS} />
                <FilterGroup title="Type" options={typeUniv} sel={typeSel} setter={setTypeSel} colorMap={TYPE_COLORS} />
                <FilterGroup title="Account" options={accountUniv} sel={accountSel} setter={setAccountSel} colorMap={ACCOUNT_COLORS} />
                <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 4, fontSize: 12 }} onClick={() => setFilterOpen(false)}>Done</button>
              </div>
            </>
          )}
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
          {filtered.map((r) => (
            <div key={r.id} className="row-hover" onClick={() => setSel(r.id)}
              style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: sel === r.id ? "var(--bg-hover)" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{r.videoTitle || "Untitled"}</div>
                <Pill label={r.status} color={colorFor(STATUS_COLORS, r.status)} />
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ color: colorFor(ACCOUNT_COLORS, r.account) }}>{r.account || "Personal"}</span>
                <span>·</span>
                <span style={{ color: colorFor(TYPE_COLORS, r.contentType) }}>{r.contentType || NONE}</span>
                <span>·</span>
                <span style={{ fontWeight: r.postDate ? 600 : 400, color: r.postDate ? "var(--text)" : "var(--text-sec)" }}>{r.postDate || "unscheduled"}</span>
                {r.linkedinUrl && <><span>·</span><Link2 size={10} color="var(--green)" /></>}
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
            <div style={{ fontSize: 13 }}>Select a post to view and edit its script, caption, and notes.</div>
          </div>
        ) : (
          <div className="slide-in" key={selected.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button className="mobile-back" onClick={() => setSel(null)}>
                <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to posts
              </button>
              <span className="mono" style={{ fontSize: 11, color: justSaved && Date.now() - justSaved < 2000 ? "var(--green)" : "var(--text-sec)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                {saving ? <><Loader2 size={11} className="spin" /> Saving…</> : (justSaved && Date.now() - justSaved < 2000 ? <><Check size={11} /> Saved</> : "Edits save automatically")}
              </span>
            </div>

            {/* Title (editable) */}
            <EditableText value={selected.videoTitle} onCommit={(v) => save(selected.id, "videoTitle", v)} placeholder="Untitled post"
              style={{ fontSize: 19, fontWeight: 700, padding: "8px 10px", width: "100%" }} />

            {/* Picklists */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
              <Picklist value={selected.status} options={STATUS_OPTIONS} colorMap={STATUS_COLORS} placeholder="set status" onChange={(v) => save(selected.id, "status", v)} />
              <Picklist value={selected.contentType} options={TYPE_OPTIONS} colorMap={TYPE_COLORS} placeholder="set type" onChange={(v) => save(selected.id, "contentType", v)} />
              <Picklist value={selected.account} options={ACCOUNT_OPTIONS} colorMap={ACCOUNT_COLORS} placeholder="set account" onChange={(v) => save(selected.id, "account", v)} />
            </div>

            {/* LinkedIn link capture */}
            <div style={{ marginTop: 16, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 8, background: selected.status === "Posted" ? "color-mix(in srgb, var(--green) 7%, transparent)" : "transparent" }}>
              <div className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Link2 size={12} /> LinkedIn post URL{selected.status === "Posted" && !selected.linkedinUrl ? " — add the live link" : ""}</span>
                {selected.linkedinUrl && (
                  <a className="btn btn-ghost" href={selected.linkedinUrl} target="_blank" rel="noreferrer" style={{ padding: "3px 8px", fontSize: 11, textDecoration: "none" }}>
                    <ExternalLink size={11} /> Open
                  </a>
                )}
              </div>
              <EditableText value={selected.linkedinUrl} onCommit={(v) => save(selected.id, "linkedinUrl", v)} placeholder="https://www.linkedin.com/posts/…" type="text" mono style={{ width: "100%" }} />
            </div>

            {/* Scheduling grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 16 }}>
              <div><div className="form-label">Post date</div><EditableText value={selected.postDate} type="date" onCommit={(v) => save(selected.id, "postDate", v)} style={{ width: "100%" }} /></div>
              <div><div className="form-label">Time</div><EditableText value={selected.postTime} onCommit={(v) => save(selected.id, "postTime", v)} placeholder="e.g. 9:00 AM PT" style={{ width: "100%" }} /></div>
              <div><div className="form-label">Posting day</div><EditableText value={selected.postingDay} onCommit={(v) => save(selected.id, "postingDay", v)} placeholder="e.g. Tuesday" style={{ width: "100%" }} /></div>
              <div><div className="form-label">Week</div><EditableText value={selected.week} onCommit={(v) => save(selected.id, "week", v)} placeholder="e.g. Week 1" style={{ width: "100%" }} /></div>
              <div><div className="form-label">Video #</div><EditableText value={selected.videoNumber} type="number" onCommit={(v) => save(selected.id, "videoNumber", v === "" ? null : Number(v))} style={{ width: "100%" }} /></div>
              <div><div className="form-label">Track</div><EditableText value={selected.track} onCommit={(v) => save(selected.id, "track", v)} placeholder="e.g. AI in Sales Ops" style={{ width: "100%" }} /></div>
              <div><div className="form-label">Campaign</div><EditableText value={selected.campaign} onCommit={(v) => save(selected.id, "campaign", v)} style={{ width: "100%" }} /></div>
              <div><div className="form-label">Platform</div><EditableText value={selected.platform} onCommit={(v) => save(selected.id, "platform", v)} placeholder="LinkedIn" style={{ width: "100%" }} /></div>
            </div>

            <EditRow label="Screenshot line"><EditableText value={selected.screenshotLine} onCommit={(v) => save(selected.id, "screenshotLine", v)} placeholder="The on-screen hook line" style={{ width: "100%" }} /></EditRow>
            <EditRow label="Sticky note (the point of this post)"><EditableArea value={selected.stickyNote} onCommit={(v) => save(selected.id, "stickyNote", v)} placeholder="One-line point of the post" /></EditRow>
            <EditRow label="Script"><EditableArea value={selected.script} onCommit={(v) => save(selected.id, "script", v)} placeholder="HOOK / PROBLEM / SOLUTION / PAYOFF…" mono /></EditRow>

            <div style={{ marginTop: 16 }}>
              <div className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Caption</span>
                <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => copy(selected.caption, "caption")}>
                  {copied === "caption" ? <Check size={11} color="var(--green)" /> : <Copy size={11} />} {copied === "caption" ? "Copied" : "Copy"}
                </button>
              </div>
              <EditableArea value={selected.caption} onCommit={(v) => save(selected.id, "caption", v)} placeholder="LinkedIn caption" />
            </div>

            <EditRow label="Engagement notes"><EditableArea value={selected.engagementNotes} onCommit={(v) => save(selected.id, "engagementNotes", v)} /></EditRow>
            <EditRow label="Daily engagement"><EditableArea value={selected.dailyEngagement} onCommit={(v) => save(selected.id, "dailyEngagement", v)} /></EditRow>
            <EditRow label="Pre-record checklist"><EditableArea value={selected.preRecordChecklist} onCommit={(v) => save(selected.id, "preRecordChecklist", v)} /></EditRow>
            <EditRow label="Post-record checklist"><EditableArea value={selected.postRecordChecklist} onCommit={(v) => save(selected.id, "postRecordChecklist", v)} /></EditRow>
          </div>
        )}
      </div>

      {/* REFERENCE DRAWER — ICP & Voice */}
      {refOpen && (
        <>
          <div onClick={() => setRefOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(560px, 92vw)", background: "var(--bg-card)", borderLeft: "1px solid var(--border)", zIndex: 61, display: "flex", flexDirection: "column", boxShadow: "-12px 0 40px rgba(0,0,0,0.35)" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={16} color="var(--blue)" />
                <div className="display" style={{ fontSize: 15, fontWeight: 700 }}>ICP &amp; Voice — reference</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => setRefOpen(false)}><X size={14} /></button>
            </div>
            <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 14 }}>Pulled live from Second Brain · ai_memories. Use these to reprioritize content.</div>
              {refMem === null && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-sec)", fontSize: 13 }}><Loader2 size={14} className="spin" /> Loading…</div>
              )}
              {refErr && <div style={{ color: "var(--red)", fontSize: 12 }}>Couldn't load memories: {refErr}</div>}
              {refMem && refMem.length === 0 && !refErr && <div style={{ color: "var(--text-sec)", fontSize: 13 }}>No matching memories found.</div>}
              {refMem && refMem.length > 0 && !refMem.some((m) => (m.memory_type || "") === "icp" || (m.subject || "").toLowerCase().includes("icp") || (m.subject || "").toLowerCase().includes("ideal customer")) && (
                <div style={{ marginBottom: 16, padding: "10px 12px", border: "1px dashed var(--amber)", borderRadius: 8, fontSize: 12, color: "var(--text-sec)", background: "color-mix(in srgb, var(--amber) 7%, transparent)" }}>
                  No dedicated <b>ICP</b> memory exists yet — only the voice profile below. Ask Claude to draft one into ai_memories.
                </div>
              )}
              {(refMem || []).map((m) => (
                <div key={m.id} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div className="display" style={{ fontSize: 14, fontWeight: 700 }}>{m.subject}</div>
                    <Pill label={m.memory_type} color="var(--blue)" />
                  </div>
                  <div className="card-el" style={{ padding: "12px 14px", fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 420, overflowY: "auto" }}>{m.memory_summary}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
