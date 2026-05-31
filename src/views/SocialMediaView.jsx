import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Calendar, Search, ExternalLink, RefreshCw, Loader2, ChevronRight, AlertCircle, Copy, Check, Filter, BookOpen, Save, X } from "lucide-react";

/* ── Standalone Supabase client ──
   contentCalendar is NOT part of the central DB_TABLES / loadAllFromDB pipeline,
   so this view reads + writes the table directly. It deliberately does not
   touch the global db/setDB sync engine. Second Brain is the source of truth. */
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SB_READY = SUPA_URL.startsWith("https://") && SUPA_KEY.length > 10;
const sb = SB_READY ? createClient(SUPA_URL, SUPA_KEY) : null;

const STATUS_OPTIONS = ["Draft", "Script Ready", "Scheduled", "Posted"];
const TYPE_OPTIONS = ["Video", "Text Post", "Article", "Carousel"];
const ACCOUNT_OPTIONS = ["Personal", "Voitra", "Aventary"];
const DEFAULT_STATUS = STATUS_OPTIONS.filter(s => s !== "Posted"); // "upcoming" = everything not posted

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

/* content fields edited via the Save bar (attributes save instantly, separately) */
const CONTENT_KEYS = ["videoTitle", "postDate", "postTime", "postingDay", "week", "videoNumber",
  "stickyNote", "screenshotLine", "script", "caption", "engagementNotes", "dailyEngagement",
  "preRecordChecklist", "postRecordChecklist", "campaign", "track", "creditTo"];

const Pill = ({ label, color }) => {
  if (!label) return null;
  return (
    <span className="tag" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
      {label}
    </span>
  );
};

const FieldLabel = ({ children }) => (
  <div className="form-label" style={{ marginBottom: 4 }}>{children}</div>
);

const TextField = ({ value, onChange, onBlur, placeholder, mono }) => (
  <input className="input" value={value ?? ""} placeholder={placeholder || ""}
    onChange={e => onChange(e.target.value)} onBlur={onBlur}
    style={{ fontSize: 13, fontFamily: mono ? "var(--font-m)" : "inherit" }} />
);

const AreaField = ({ value, onChange, rows, mono }) => (
  <textarea className="input" value={value ?? ""} rows={rows || 4}
    onChange={e => onChange(e.target.value)}
    style={{ fontSize: 13, lineHeight: 1.6, resize: "vertical", whiteSpace: "pre-wrap",
      fontFamily: mono ? "var(--font-m)" : "inherit" }} />
);

const ColoredSelect = ({ value, options, onChange, colorMap, placeholder, disabled }) => {
  const c = colorFor(colorMap, value);
  return (
    <select value={value || ""} disabled={disabled} onChange={e => onChange(e.target.value || null)}
      style={{ appearance: "auto", padding: "4px 8px", fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: "pointer",
        color: value ? c : "var(--text-sec)", fontFamily: "var(--font-m)",
        background: value ? `color-mix(in srgb, ${c} 12%, transparent)` : "transparent",
        border: `1px solid ${value ? `color-mix(in srgb, ${c} 32%, transparent)` : "var(--border)"}` }}>
      <option value="">{placeholder || "—"}</option>
      {options.map(o => <option key={o} value={o} style={{ color: "var(--text)", background: "var(--bg-card)" }}>{o}</option>)}
      {value && !options.includes(value) && <option value={value} style={{ color: "var(--text)", background: "var(--bg-card)" }}>{value}</option>}
    </select>
  );
};

function FilterGroup({ title, options, selected, onToggle, colorMap }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel>{title}</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map(o => {
          const on = selected.includes(o);
          const c = colorFor(colorMap, o);
          return (
            <button key={o} onClick={() => onToggle(o)} style={{ display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 10px", fontSize: 12, borderRadius: 6, cursor: "pointer", fontWeight: on ? 600 : 500,
              border: `1px solid ${on ? `color-mix(in srgb, ${c} 50%, transparent)` : "var(--border)"}`,
              background: on ? `color-mix(in srgb, ${c} 14%, transparent)` : "transparent",
              color: on ? c : "var(--text-sec)" }}>
              {on && <Check size={12} />} {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SocialMediaView() {
  const [rows, setRows] = useState(null);     // null = loading
  const [err, setErr] = useState(null);
  const [sel, setSel] = useState(null);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(null);

  // filters
  const [statusSel, setStatusSel] = useState(DEFAULT_STATUS); // default: hide Posted
  const [typeSel, setTypeSel] = useState([]);
  const [accountSel, setAccountSel] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // editing
  const [form, setForm] = useState(null);
  const [orig, setOrig] = useState(null);
  const [saving, setSaving] = useState(null);     // tag of field currently saving
  const [savedFlash, setSavedFlash] = useState(null);

  // reference drawer (ICP + voice from ai_memories)
  const [refOpen, setRefOpen] = useState(false);
  const [refData, setRefData] = useState(null);

  const load = async () => {
    if (!sb) { setErr("Supabase env not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)."); setRows([]); return; }
    setRefreshing(true);
    const { data, error } = await sb.from("contentCalendar").select("*");
    if (error) { setErr(error.message); setRows([]); }
    else { setErr(null); setRows(data || []); }
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  // init the editable form whenever selection changes
  useEffect(() => {
    if (sel == null) { setForm(null); setOrig(null); return; }
    const row = (rows || []).find(r => r.id === sel);
    if (row) { setForm({ ...row }); setOrig({ ...row }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const loadRef = async () => {
    if (refData || !sb) return;
    const { data } = await sb.from("ai_memories").select("id,memory_type,subject,memory_summary").in("memory_type", ["brand_voice", "icp"]);
    setRefData(data || []);
  };

  const types = useMemo(() => Array.from(new Set((rows || []).map(r => r.contentType).filter(Boolean))), [rows]);

  const filtered = useMemo(() => {
    const list = (rows || []).filter(r => {
      if (statusSel.length && !statusSel.includes(r.status)) return false;
      if (typeSel.length && !typeSel.includes(r.contentType)) return false;
      if (accountSel.length && !accountSel.includes(r.account)) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = [r.videoTitle, r.screenshotLine, r.caption, r.campaign, r.stickyNote, r.script].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      const ad = a.postDate || "", bd = b.postDate || "";
      if (ad && bd) return ad < bd ? -1 : ad > bd ? 1 : a.id - b.id; // earliest upcoming first
      if (ad && !bd) return -1;
      if (!ad && bd) return 1;
      return a.id - b.id;
    });
    return list;
  }, [rows, statusSel, typeSel, accountSel, query]);

  const selected = sel != null ? (rows || []).find(r => r.id === sel) : null;
  const postedHidden = !statusSel.includes("Posted");
  const activeCount = statusSel.length + typeSel.length + accountSel.length;

  const toggleIn = (setter) => (val) => setter(arr => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  const resetUpcoming = () => { setStatusSel(DEFAULT_STATUS); setTypeSel([]); setAccountSel([]); };
  const showEverything = () => { setStatusSel([]); setTypeSel([]); setAccountSel([]); };

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1400); });
  };

  // single write path for everything
  const saveRow = async (id, patch, tag) => {
    if (!sb) return;
    setSaving(tag || "row");
    const { error } = await sb.from("contentCalendar").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { setErr(`Save failed: ${error.message}`); }
    else {
      setErr(null);
      setRows(rs => (rs || []).map(r => r.id === id ? { ...r, ...patch } : r));
      setOrig(o => (o && o.id === id) ? { ...o, ...patch } : o);
      setForm(f => (f && f.id === id) ? { ...f, ...patch } : f);
      setSavedFlash(tag || "row"); setTimeout(() => setSavedFlash(null), 1500);
    }
    setSaving(null);
  };

  // instant-save attribute (status / account / type / linkedin)
  const setAttr = (key, val, tag) => { setForm(f => ({ ...f, [key]: val })); saveRow(form.id, { [key]: val }, tag || key); };
  const blurSave = (key, tag) => () => {
    if (!form || !orig) return;
    if ((form[key] ?? "") !== (orig[key] ?? "")) saveRow(form.id, { [key]: form[key] === "" ? null : form[key] }, tag || key);
  };

  const setField = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const contentDirty = form && orig && CONTENT_KEYS.some(k => (form[k] ?? "") !== (orig[k] ?? ""));
  const saveContent = async () => {
    const patch = {};
    CONTENT_KEYS.forEach(k => { if ((form[k] ?? "") !== (orig[k] ?? "")) patch[k] = form[k] === "" ? null : form[k]; });
    if ("videoNumber" in patch) { const n = parseInt(patch.videoNumber, 10); patch.videoNumber = Number.isFinite(n) ? n : null; }
    await saveRow(form.id, patch, "content");
  };
  const discardContent = () => setForm({ ...orig });

  /* ── Loading state ── */
  if (rows === null) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-sec)" }}>
        <Loader2 size={18} className="spin" /> <span className="mono" style={{ fontSize: 12 }}>Loading content calendar…</span>
      </div>
    );
  }

  return (
    <div className={`view-shell${sel != null ? " has-selection" : ""}`} style={{ position: "relative" }}>
      {/* LEFT LIST */}
      <div className="list-pane" style={{ width: 340, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg-card)" }}>
        <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid var(--border)", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={16} color="var(--blue)" />
              <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>Social Media</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} title="ICP & Voice reference"
                onClick={() => { setRefOpen(true); loadRef(); }}>
                <BookOpen size={13} /> Reference
              </button>
              <button className="btn btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={load} disabled={refreshing} title="Refresh">
                <RefreshCw size={12} className={refreshing ? "spin" : ""} />
              </button>
            </div>
          </div>

          {/* Search + filter button */}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={13} color="var(--text-sec)" style={{ position: "absolute", left: 10, top: 10, pointerEvents: "none" }} />
              <input className="input" placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 30, fontSize: 13 }} />
            </div>
            <button className="btn btn-ghost" onClick={() => setShowFilters(s => !s)} title="Filters"
              style={{ padding: "0 10px", fontSize: 12, position: "relative", border: activeCount ? "1px solid color-mix(in srgb, var(--blue) 45%, transparent)" : undefined, color: activeCount ? "var(--blue)" : undefined }}>
              <Filter size={14} />
              {activeCount > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "var(--blue)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeCount}</span>
              )}
            </button>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
              {statusSel.map(s => <FilterTag key={"s" + s} label={s} color={colorFor(STATUS_COLORS, s)} onClear={() => toggleIn(setStatusSel)(s)} />)}
              {typeSel.map(t => <FilterTag key={"t" + t} label={t} color={colorFor(TYPE_COLORS, t)} onClear={() => toggleIn(setTypeSel)(t)} />)}
              {accountSel.map(a => <FilterTag key={"a" + a} label={a} color={colorFor(ACCOUNT_COLORS, a)} onClear={() => toggleIn(setAccountSel)(a)} />)}
            </div>
          )}

          <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 8, display: "flex", justifyContent: "space-between" }}>
            <span>{filtered.length} shown · {rows.length} total</span>
            {postedHidden && (
              <button onClick={() => toggleIn(setStatusSel)("Posted")} style={{ background: "none", border: "none", color: "var(--blue)", fontSize: 10, cursor: "pointer", padding: 0, fontFamily: "var(--font-m)" }}>+ show posted</button>
            )}
          </div>

          {/* Filter popover */}
          {showFilters && (
            <>
              <div onClick={() => setShowFilters(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div className="card" style={{ position: "absolute", top: "100%", left: 14, right: 14, zIndex: 41, marginTop: 6, padding: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.28)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div className="display" style={{ fontSize: 13, fontWeight: 700 }}>Filters</div>
                  <button onClick={() => setShowFilters(false)} className="btn btn-ghost" style={{ padding: 4 }}><X size={14} /></button>
                </div>
                <FilterGroup title="Status" options={STATUS_OPTIONS} selected={statusSel} onToggle={toggleIn(setStatusSel)} colorMap={STATUS_COLORS} />
                <FilterGroup title="Account" options={ACCOUNT_OPTIONS} selected={accountSel} onToggle={toggleIn(setAccountSel)} colorMap={ACCOUNT_COLORS} />
                <FilterGroup title="Type" options={TYPE_OPTIONS} selected={typeSel} onToggle={toggleIn(setTypeSel)} colorMap={TYPE_COLORS} />
                <div style={{ display: "flex", gap: 8, marginTop: 6, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }} onClick={resetUpcoming}>Upcoming only</button>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }} onClick={showEverything}>Show everything</button>
                </div>
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
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-sec)", fontSize: 12 }}>Nothing matches these filters.</div>
          )}
          {filtered.map(r => (
            <div key={r.id} className="row-hover" onClick={() => setSel(r.id)}
              style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: sel === r.id ? "var(--bg-hover)" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{r.videoTitle || "Untitled"}</div>
                <Pill label={r.status} color={colorFor(STATUS_COLORS, r.status)} />
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ color: colorFor(ACCOUNT_COLORS, r.account) }}>{r.account || "—"}</span>
                <span>·</span>
                <span style={{ color: colorFor(TYPE_COLORS, r.contentType) }}>{r.contentType || "—"}</span>
                <span>·</span>
                <span>{r.postDate || "unscheduled"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT DETAIL / EDITOR */}
      <div className="detail-pane" style={{ flex: 1, overflowY: "auto", padding: 24, background: "var(--bg)" }}>
        {!selected || !form ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-sec)" }}>
            <Calendar size={28} color="var(--text-dim)" />
            <div style={{ fontSize: 13 }}>Select a post to view and edit it.</div>
          </div>
        ) : (
          <div className="slide-in" style={{ maxWidth: 760, paddingBottom: contentDirty ? 70 : 0 }}>
            <button className="mobile-back" onClick={() => setSel(null)}>
              <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to posts
            </button>

            {/* Title (editable) */}
            <input className="input" value={form.videoTitle ?? ""} onChange={e => setField("videoTitle")(e.target.value)}
              placeholder="Untitled"
              style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, border: "1px solid transparent", background: "transparent", padding: "4px 6px", marginLeft: -6, width: "100%" }} />

            {/* Quick attributes (instant save) */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
              <ColoredSelect value={form.status} options={STATUS_OPTIONS} colorMap={STATUS_COLORS} placeholder="— status —" disabled={saving === "status"} onChange={v => setAttr("status", v, "status")} />
              <ColoredSelect value={form.account} options={ACCOUNT_OPTIONS} colorMap={ACCOUNT_COLORS} placeholder="— account —" disabled={saving === "account"} onChange={v => setAttr("account", v, "account")} />
              <ColoredSelect value={form.contentType} options={TYPE_OPTIONS} colorMap={TYPE_COLORS} placeholder="— type —" disabled={saving === "contentType"} onChange={v => setAttr("contentType", v, "contentType")} />
              {(saving === "status" || saving === "account" || saving === "contentType") && <Loader2 size={13} className="spin" color="var(--text-sec)" />}
              {(savedFlash === "status" || savedFlash === "account" || savedFlash === "contentType" || savedFlash === "linkedinUrl") && <span style={{ fontSize: 11, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 3 }}><Check size={12} /> saved</span>}
            </div>

            {/* LinkedIn link (save on blur) */}
            <div style={{ marginTop: 14 }}>
              <FieldLabel>LinkedIn link {form.status === "Posted" && <span style={{ color: "var(--amber)" }}>· add this once posted</span>}</FieldLabel>
              <div style={{ display: "flex", gap: 6 }}>
                <input className="input" value={form.linkedinUrl ?? ""} placeholder="https://www.linkedin.com/posts/…"
                  onChange={e => setField("linkedinUrl")(e.target.value)} onBlur={blurSave("linkedinUrl", "linkedinUrl")}
                  style={{ fontSize: 13, flex: 1 }} />
                {form.linkedinUrl && (
                  <a className="btn btn-ghost" href={form.linkedinUrl} target="_blank" rel="noreferrer" style={{ padding: "6px 12px", fontSize: 12, textDecoration: "none", whiteSpace: "nowrap" }}>
                    <ExternalLink size={13} /> Open
                  </a>
                )}
                {saving === "linkedinUrl" && <Loader2 size={14} className="spin" color="var(--text-sec)" style={{ alignSelf: "center" }} />}
              </div>
            </div>

            {/* Scheduling meta (editable) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div><FieldLabel>Post date</FieldLabel><input type="date" className="input" value={form.postDate || ""} onChange={e => setField("postDate")(e.target.value)} style={{ fontSize: 13 }} /></div>
              <div><FieldLabel>Time</FieldLabel><TextField value={form.postTime} onChange={setField("postTime")} placeholder="9:00 AM PT" /></div>
              <div><FieldLabel>Day</FieldLabel><TextField value={form.postingDay} onChange={setField("postingDay")} /></div>
              <div><FieldLabel>Week</FieldLabel><TextField value={form.week} onChange={setField("week")} /></div>
              <div><FieldLabel>Video #</FieldLabel><TextField value={form.videoNumber} onChange={setField("videoNumber")} /></div>
              <div><FieldLabel>Campaign</FieldLabel><TextField value={form.campaign} onChange={setField("campaign")} /></div>
              <div><FieldLabel>Track</FieldLabel><TextField value={form.track} onChange={setField("track")} /></div>
              <div><FieldLabel>Credit to</FieldLabel><TextField value={form.creditTo} onChange={setField("creditTo")} /></div>
            </div>

            {/* Content (editable, Save bar) */}
            <div style={{ marginTop: 18 }}><FieldLabel>Screenshot line</FieldLabel><TextField value={form.screenshotLine} onChange={setField("screenshotLine")} /></div>
            <div style={{ marginTop: 14 }}><FieldLabel>Sticky note (the point of this post)</FieldLabel><AreaField value={form.stickyNote} onChange={setField("stickyNote")} rows={2} /></div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <FieldLabel>Script</FieldLabel>
                <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => copy(form.script, "script")}>{copied === "script" ? <Check size={11} color="var(--green)" /> : <Copy size={11} />} {copied === "script" ? "Copied" : "Copy"}</button>
              </div>
              <AreaField value={form.script} onChange={setField("script")} rows={10} mono />
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <FieldLabel>Caption</FieldLabel>
                <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => copy(form.caption, "caption")}>{copied === "caption" ? <Check size={11} color="var(--green)" /> : <Copy size={11} />} {copied === "caption" ? "Copied" : "Copy"}</button>
              </div>
              <AreaField value={form.caption} onChange={setField("caption")} rows={8} />
            </div>

            <div style={{ marginTop: 14 }}><FieldLabel>Engagement notes</FieldLabel><AreaField value={form.engagementNotes} onChange={setField("engagementNotes")} rows={3} /></div>
            <div style={{ marginTop: 14 }}><FieldLabel>Pre-record checklist</FieldLabel><AreaField value={form.preRecordChecklist} onChange={setField("preRecordChecklist")} rows={5} /></div>
            <div style={{ marginTop: 14 }}><FieldLabel>Post-record checklist</FieldLabel><AreaField value={form.postRecordChecklist} onChange={setField("postRecordChecklist")} rows={5} /></div>

            {/* Sticky Save bar */}
            {contentDirty && (
              <div style={{ position: "sticky", bottom: 0, marginTop: 18, padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -6px 20px rgba(0,0,0,0.18)" }}>
                <span style={{ fontSize: 12, color: "var(--text-sec)" }}>Unsaved content changes</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={discardContent} disabled={saving === "content"}>Discard</button>
                  <button className="btn" style={{ fontSize: 12, background: "var(--blue)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={saveContent} disabled={saving === "content"}>
                    {saving === "content" ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Save changes
                  </button>
                </div>
              </div>
            )}
            {savedFlash === "content" && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={13} /> Saved</div>
            )}
          </div>
        )}
      </div>

      {/* REFERENCE DRAWER (ICP + Voice) */}
      {refOpen && (
        <>
          <div onClick={() => setRefOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50 }} />
          <div className="card" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(560px, 92%)", zIndex: 51, padding: 20, overflowY: "auto", borderRadius: 0, boxShadow: "-12px 0 32px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={16} color="var(--blue)" />
                <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>ICP & Voice reference</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setRefOpen(false)}><X size={16} /></button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 16 }}>Pulled live from Second Brain · ai_memories. Use these to reprioritize your content.</div>
            {refData === null ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-sec)" }}><Loader2 size={15} className="spin" /> <span style={{ fontSize: 12 }}>Loading…</span></div>
            ) : (
              <>
                {refData.length === 0 && <div style={{ fontSize: 13, color: "var(--text-sec)" }}>No voice or ICP memories found.</div>}
                {refData.map(m => (
                  <div key={m.id} style={{ marginBottom: 20 }}>
                    <Pill label={m.memory_type === "brand_voice" ? "Voice" : m.memory_type === "icp" ? "ICP" : m.memory_type} color={m.memory_type === "icp" ? "var(--green)" : "var(--purple)"} />
                    <div className="display" style={{ fontSize: 14, fontWeight: 700, margin: "8px 0" }}>{m.subject}</div>
                    <div className="card-el" style={{ padding: "12px 14px", fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 420, overflowY: "auto" }}>{m.memory_summary}</div>
                  </div>
                ))}
                {!refData.some(m => m.memory_type === "icp") && (
                  <div style={{ fontSize: 12, color: "var(--text-sec)", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    No <span className="mono">icp</span> memory exists yet. Add one to ai_memories with <span className="mono">memory_type = 'icp'</span> and it will appear here automatically.
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FilterTag({ label, color, onClear }) {
  return (
    <span className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `color-mix(in srgb, ${color} 12%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
      {label}
      <button onClick={onClear} style={{ background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", color, display: "inline-flex" }}><X size={11} /></button>
    </span>
  );
}
