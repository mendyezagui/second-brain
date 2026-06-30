import { useEffect, useState, useRef } from "react";
import { Phone, RefreshCw, Loader, Calendar, Clock, Plus, Trash2, Power, Pencil, Check, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const API_BASE = "https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/rc-queue-toggle";

const authHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: "Bearer " + session.access_token } : {};
};

const LINE_NAMES = {
  "2148739036": { label: "IDEXX", onName: "AI Forward IDEXX", offName: "IDEXX" },
  "3174440036": { label: "LA County", onName: "AI Forward LA County", offName: "LA County" },
  "3154326036": { label: "Methodist", onName: "AI Forward Methodist", offName: "Nebraska Methodist" },
};
const ROUTE_NAMES = {
  "1011": "AI Forward IDEXX", "1012": "AI Forward LA County", "1016": "AI Forward Methodist",
  "1004": "IDEXX", "1010": "LA County", "1007": "Nebraska Methodist",
};

// ── Scheduler ─────────────────────────────────────────────────────────────
const LINES = [
  { id: "2148739036", label: "IDEXX" },
  { id: "3174440036", label: "LA County" },
  { id: "3154326036", label: "Methodist" },
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]; // index = 0..6 (Sun..Sat)

const blankRule = () => ({ id: null, label: "", days: [], time_on: "08:00", time_off: "17:00", phone_ids: [] });

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = parseInt(h, 10);
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${m} ${hh < 12 ? "AM" : "PM"}`;
};

const describeDays = (days) => {
  const s = [...(days || [])].sort((a, b) => a - b);
  if (s.length === 0) return "No days";
  if (s.length === 7) return "Every day";
  if (s.length === 5 && [1, 2, 3, 4, 5].every(d => s.includes(d))) return "Weekdays";
  if (s.length === 2 && s.includes(0) && s.includes(6)) return "Weekends";
  return s.map(d => DAY_LABELS[d]).join(" ");
};

const lineLabels = (ids) => {
  if ((ids || []).length === LINES.length) return "All lines";
  return LINES.filter(l => (ids || []).includes(l.id)).map(l => l.label).join(", ") || "No lines";
};

const blankTrig = () => ({ id: null, label: "", days: [], at_time: "20:00", action: "off", phone_ids: [] });

function RCScheduler() {
  const [schedules, setSchedules] = useState([]);
  const [masterOn, setMasterOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingMaster, setSavingMaster] = useState(false);
  const [editing, setEditing] = useState(null); // blankRule()-shaped object or null
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [triggers, setTriggers] = useState([]);
  const [editingTrig, setEditingTrig] = useState(null); // blankTrig()-shaped or null
  const [trigErr, setTrigErr] = useState("");
  const [savingTrig, setSavingTrig] = useState(false);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const [sch, set, os] = await Promise.all([
      supabase.from("rc_schedules").select("*").order("created_at"),
      supabase.from("rc_scheduler_settings").select("enabled").eq("id", 1).maybeSingle(),
      supabase.from("rc_triggers").select("*").order("created_at"),
    ]);
    setSchedules(sch.data || []);
    setMasterOn(!!set.data?.enabled);
    setTriggers(os.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMaster = async () => {
    if (!supabase || savingMaster) return;
    setSavingMaster(true);
    const next = !masterOn;
    setMasterOn(next);
    const { error } = await supabase.from("rc_scheduler_settings")
      .update({ enabled: next, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) setMasterOn(!next); // revert on failure
    setSavingMaster(false);
  };

  const toggleRuleEnabled = async (rule) => {
    if (!supabase) return;
    const next = !rule.enabled;
    setSchedules(rs => rs.map(r => r.id === rule.id ? { ...r, enabled: next } : r));
    await supabase.from("rc_schedules").update({ enabled: next, updated_at: new Date().toISOString() }).eq("id", rule.id);
  };

  const removeRule = async (rule) => {
    if (!supabase) return;
    setSchedules(rs => rs.filter(r => r.id !== rule.id));
    await supabase.from("rc_schedules").delete().eq("id", rule.id);
  };

  const toggleDay = (d) => setEditing(e => ({
    ...e, days: e.days.includes(d) ? e.days.filter(x => x !== d) : [...e.days, d].sort((a, b) => a - b),
  }));
  const toggleLine = (id) => setEditing(e => ({
    ...e, phone_ids: e.phone_ids.includes(id) ? e.phone_ids.filter(x => x !== id) : [...e.phone_ids, id],
  }));
  const allLinesSelected = editing && editing.phone_ids.length === LINES.length;
  const toggleAllLines = () => setEditing(e => ({ ...e, phone_ids: e.phone_ids.length === LINES.length ? [] : LINES.map(l => l.id) }));

  const saveRule = async () => {
    if (!supabase || !editing) return;
    if (editing.days.length === 0) return setFormErr("Pick at least one day.");
    if (editing.phone_ids.length === 0) return setFormErr("Pick at least one line.");
    if (!editing.time_on || !editing.time_off) return setFormErr("Set both times.");
    if (editing.time_on === editing.time_off) return setFormErr("On and off times must differ.");
    setFormErr("");
    setSaving(true);
    const payload = {
      label: editing.label?.trim() || null,
      days: editing.days,
      time_on: editing.time_on,
      time_off: editing.time_off,
      phone_ids: editing.phone_ids,
      updated_at: new Date().toISOString(),
    };
    if (editing.id) {
      const { data } = await supabase.from("rc_schedules").update(payload).eq("id", editing.id).select().single();
      if (data) setSchedules(rs => rs.map(r => r.id === data.id ? data : r));
    } else {
      const { data } = await supabase.from("rc_schedules").insert({ ...payload, enabled: true }).select().single();
      if (data) setSchedules(rs => [...rs, data]);
    }
    setSaving(false);
    setEditing(null);
  };

  // ── Fail-safe triggers (day-of-week + time + action) ─────────────────
  const toggleTrigDay = (d) => setEditingTrig(e => ({
    ...e, days: e.days.includes(d) ? e.days.filter(x => x !== d) : [...e.days, d].sort((a, b) => a - b),
  }));
  const toggleTrigLine = (id) => setEditingTrig(e => ({
    ...e, phone_ids: e.phone_ids.includes(id) ? e.phone_ids.filter(x => x !== id) : [...e.phone_ids, id],
  }));
  const allTrigLines = editingTrig && editingTrig.phone_ids.length === LINES.length;
  const toggleAllTrigLines = () => setEditingTrig(e => ({ ...e, phone_ids: e.phone_ids.length === LINES.length ? [] : LINES.map(l => l.id) }));

  const toggleTrigEnabled = async (trig) => {
    if (!supabase) return;
    const next = !trig.enabled;
    setTriggers(ts => ts.map(t => t.id === trig.id ? { ...t, enabled: next } : t));
    await supabase.from("rc_triggers").update({ enabled: next, updated_at: new Date().toISOString() }).eq("id", trig.id);
  };
  const removeTrig = async (trig) => {
    if (!supabase) return;
    setTriggers(ts => ts.filter(t => t.id !== trig.id));
    await supabase.from("rc_triggers").delete().eq("id", trig.id);
  };
  const saveTrig = async () => {
    if (!supabase || !editingTrig) return;
    if (editingTrig.days.length === 0) return setTrigErr("Pick at least one day.");
    if (!editingTrig.at_time) return setTrigErr("Pick a time.");
    if (editingTrig.phone_ids.length === 0) return setTrigErr("Pick at least one line.");
    setTrigErr("");
    setSavingTrig(true);
    const payload = {
      label: editingTrig.label?.trim() || null,
      days: editingTrig.days,
      at_time: editingTrig.at_time,
      action: editingTrig.action,
      phone_ids: editingTrig.phone_ids,
      updated_at: new Date().toISOString(),
    };
    if (editingTrig.id) {
      const { data } = await supabase.from("rc_triggers").update(payload).eq("id", editingTrig.id).select().single();
      if (data) setTriggers(ts => ts.map(t => t.id === data.id ? data : t));
    } else {
      const { data } = await supabase.from("rc_triggers").insert({ ...payload, enabled: true }).select().single();
      if (data) setTriggers(ts => [...ts, data]);
    }
    setSavingTrig(false);
    setEditingTrig(null);
  };

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={12} /> Schedule
        </div>
        {!editing && (
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => { setFormErr(""); setEditing(blankRule()); }}>
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {/* Master switch */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Power size={15} color={masterOn ? "var(--green)" : "var(--text-dim)"} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Automatic scheduler</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 2 }}>
              {masterOn ? "Lines follow the schedule below (PT)" : "Schedules saved but not enforced"}
            </div>
          </div>
        </div>
        <button
          onClick={toggleMaster}
          disabled={savingMaster}
          title={masterOn ? "Disable scheduler" : "Enable scheduler"}
          style={{
            width: 44, height: 24, borderRadius: 999, border: "none", cursor: savingMaster ? "default" : "pointer",
            background: masterOn ? "var(--green)" : "var(--border-hi)", position: "relative", transition: "background .15s", flexShrink: 0, opacity: savingMaster ? 0.6 : 1,
          }}
        >
          <span style={{ position: "absolute", top: 2, left: masterOn ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "left .15s" }} />
        </button>
      </div>

      {/* Edit / add form */}
      {editing && (
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Name (optional)</label>
            <input className="input" placeholder="e.g. Business hours" value={editing.label}
              onChange={e => setEditing({ ...editing, label: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Days</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DAY_LABELS.map((lbl, d) => (
                <button key={d} type="button" className={`filter-chip${editing.days.includes(d) ? " active" : ""}`}
                  style={{ minWidth: 36, justifyContent: "center" }} onClick={() => toggleDay(d)}>{lbl}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Time on (AI forward)</label>
              <input className="input" type="time" value={editing.time_on}
                onChange={e => setEditing({ ...editing, time_on: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Time off (normal)</label>
              <input className="input" type="time" value={editing.time_off}
                onChange={e => setEditing({ ...editing, time_off: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Lines</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" className={`filter-chip${allLinesSelected ? " active" : ""}`} onClick={toggleAllLines}>All</button>
              {LINES.map(l => (
                <button key={l.id} type="button" className={`filter-chip${editing.phone_ids.includes(l.id) ? " active" : ""}`}
                  onClick={() => toggleLine(l.id)}>{l.label}</button>
              ))}
            </div>
          </div>

          {formErr && <div className="mono" style={{ fontSize: 11, color: "var(--red)", marginBottom: 10 }}>{formErr}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setEditing(null); setFormErr(""); }}>
              <X size={13} /> Cancel
            </button>
            <button className="btn btn-blue" style={{ fontSize: 12 }} onClick={saveRule} disabled={saving}>
              {saving ? <Loader size={13} className="spin" /> : <Check size={13} />} Save
            </button>
          </div>
        </div>
      )}

      {/* Rule list */}
      {loading ? (
        <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", padding: "8px 2px" }}>Loading schedules…</div>
      ) : schedules.length === 0 && !editing ? (
        <div className="card-el" style={{ padding: "14px 16px" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>No schedules yet. Add one to automate AI forwarding.</div>
        </div>
      ) : schedules.map(rule => (
        <div key={rule.id} className="card" style={{ padding: "12px 16px", marginBottom: 8, opacity: rule.enabled ? 1 : 0.55 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                {rule.label || lineLabels(rule.phone_ids)}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span>{describeDays(rule.days)}</span>
                <span style={{ color: "var(--text-dim)" }}>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Clock size={10} /> {fmt12(rule.time_on)} → {fmt12(rule.time_off)}</span>
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {LINES.filter(l => (rule.phone_ids || []).includes(l.id)).map(l => (
                  <span key={l.id} className="tag" style={{ color: "var(--blue)", background: "var(--blue-dim)", border: "1px solid rgba(0,119,204,0.2)" }}>{l.label}</span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
              <button className="btn-icon" title={rule.enabled ? "Pause this schedule" : "Enable this schedule"} onClick={() => toggleRuleEnabled(rule)}>
                <Power size={14} color={rule.enabled ? "var(--green)" : "var(--text-dim)"} />
              </button>
              <button className="btn-icon" title="Edit" onClick={() => { setFormErr(""); setEditing({ id: rule.id, label: rule.label || "", days: rule.days || [], time_on: (rule.time_on || "08:00").slice(0, 5), time_off: (rule.time_off || "17:00").slice(0, 5), phone_ids: rule.phone_ids || [] }); }}>
                <Pencil size={13} />
              </button>
              <button className="btn-icon delete" title="Delete" onClick={() => removeRule(rule)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Fail-safe triggers */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 10 }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={12} /> Fail-safe triggers
        </div>
        {!editingTrig && (
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => { setTrigErr(""); setEditingTrig(blankTrig()); }}>
            <Plus size={12} /> Add
          </button>
        )}
      </div>
      <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 10, lineHeight: 1.5 }}>
        On the chosen day(s) at a set time, force a line On or Off — even while the automatic scheduler is off. A safety net (e.g. every night at 8:00 PM, make sure it's Off).
      </div>

      {editingTrig && (
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Name (optional)</label>
            <input className="input" placeholder="e.g. Nightly safety-off" value={editingTrig.label}
              onChange={e => setEditingTrig({ ...editingTrig, label: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Days</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DAY_LABELS.map((lbl, d) => (
                <button key={d} type="button" className={`filter-chip${editingTrig.days.includes(d) ? " active" : ""}`}
                  style={{ minWidth: 36, justifyContent: "center" }} onClick={() => toggleTrigDay(d)}>{lbl}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Time</label>
              <input className="input" type="time" value={editingTrig.at_time}
                onChange={e => setEditingTrig({ ...editingTrig, at_time: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Action</label>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className={`filter-chip${editingTrig.action === "off" ? " active" : ""}`}
                  onClick={() => setEditingTrig({ ...editingTrig, action: "off" })}>Off</button>
                <button type="button" className={`filter-chip${editingTrig.action === "on" ? " active" : ""}`}
                  onClick={() => setEditingTrig({ ...editingTrig, action: "on" })}>On</button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Lines</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" className={`filter-chip${allTrigLines ? " active" : ""}`} onClick={toggleAllTrigLines}>All</button>
              {LINES.map(l => (
                <button key={l.id} type="button" className={`filter-chip${editingTrig.phone_ids.includes(l.id) ? " active" : ""}`}
                  onClick={() => toggleTrigLine(l.id)}>{l.label}</button>
              ))}
            </div>
          </div>

          {trigErr && <div className="mono" style={{ fontSize: 11, color: "var(--red)", marginBottom: 10 }}>{trigErr}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setEditingTrig(null); setTrigErr(""); }}>
              <X size={13} /> Cancel
            </button>
            <button className="btn btn-blue" style={{ fontSize: 12 }} onClick={saveTrig} disabled={savingTrig}>
              {savingTrig ? <Loader size={13} className="spin" /> : <Check size={13} />} Save
            </button>
          </div>
        </div>
      )}

      {!loading && triggers.length === 0 && !editingTrig && (
        <div className="card-el" style={{ padding: "14px 16px" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>No fail-safe triggers set.</div>
        </div>
      )}
      {triggers.map(trig => {
        const actColor = trig.action === "on" ? "var(--green)" : "var(--text-sec)";
        return (
          <div key={trig.id} className="card" style={{ padding: "12px 16px", marginBottom: 8, opacity: trig.enabled ? 1 : 0.55 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span>{describeDays(trig.days)} · {fmt12((trig.at_time || "").slice(0, 5))}</span>
                  <span className="tag" style={{ color: actColor, background: `${actColor}18`, border: `1px solid ${actColor}30` }}>
                    {trig.action === "on" ? "Turn On" : "Turn Off"}
                  </span>
                </div>
                {trig.label && <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 4 }}>{trig.label}</div>}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                  {LINES.filter(l => (trig.phone_ids || []).includes(l.id)).map(l => (
                    <span key={l.id} className="tag" style={{ color: "var(--blue)", background: "var(--blue-dim)", border: "1px solid rgba(0,119,204,0.2)" }}>{l.label}</span>
                  ))}
                  {!trig.enabled && <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: 2 }}>Paused</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <button className="btn-icon" title={trig.enabled ? "Pause" : "Enable"} onClick={() => toggleTrigEnabled(trig)}>
                  <Power size={14} color={trig.enabled ? "var(--green)" : "var(--text-dim)"} />
                </button>
                <button className="btn-icon" title="Edit" onClick={() => { setTrigErr(""); setEditingTrig({ id: trig.id, label: trig.label || "", days: trig.days || [], at_time: (trig.at_time || "20:00").slice(0, 5), action: trig.action, phone_ids: trig.phone_ids || [] }); }}>
                  <Pencil size={13} />
                </button>
                <button className="btn-icon delete" title="Delete" onClick={() => removeTrig(trig)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RCControlsView() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [globalBusy, setGlobalBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Client-only transient note (e.g. a network error) shown at the top of the feed.
  const noteErr = (msg) => setHistory(prev => [
    { id: "e" + Date.now() + Math.random(), at: new Date().toISOString(), source: "error", result: "error", message: msg, _transient: true },
    ...prev,
  ]);

  // Persistent activity feed (manual + automatic switches), last 48h.
  const loadHistory = async () => {
    if (!supabase) return;
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const { data } = await supabase.from("rc_activity").select("*").gte("at", since).order("at", { ascending: false }).limit(300);
    if (mounted.current && data) setHistory(prev => [...prev.filter(r => r._transient), ...data]);
  };

  const fetchStatus = async () => {
    try {
      const resp = await fetch(`${API_BASE}?action=status`, { headers: await authHeaders() });
      const data = await resp.json();
      if (!mounted.current) return;
      if (data && data.state) setState(data);
      else if (data && data.error) noteErr(`Status error: ${data.error}`);
    } catch (e) {
      if (mounted.current) noteErr(`Error: ${e.message}`);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  // Refresh status + feed on mount, then poll every 60s (keeps the indicator
  // live as the scheduler flips lines, and surfaces automatic switches).
  useEffect(() => {
    fetchStatus();
    loadHistory();
    const id = setInterval(() => { fetchStatus(); loadHistory(); }, 60000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doLine = async (phoneId, action) => {
    if (busy[phoneId] || globalBusy) return;
    setBusy(b => ({ ...b, [phoneId]: true }));
    try {
      const resp = await fetch(`${API_BASE}?action=${action}&phoneId=${phoneId}`, { headers: await authHeaders() });
      const data = await resp.json();
      if (!mounted.current) return;
      if (data.error) noteErr(`Error: ${data.error}`);
      if (data.currentState) setState(data.currentState);
      await loadHistory();
    } catch (e) {
      if (mounted.current) { noteErr(`Error: ${e.message}`); await fetchStatus(); }
    } finally {
      if (mounted.current) setBusy(b => ({ ...b, [phoneId]: false }));
    }
  };

  const doAll = async (action) => {
    if (globalBusy) return;
    setGlobalBusy(true);
    try {
      const resp = await fetch(`${API_BASE}?action=${action}`, { headers: await authHeaders() });
      const data = await resp.json();
      if (!mounted.current) return;
      if (data.error) noteErr(`Error: ${data.error}`);
      if (data.currentState) setState(data.currentState);
      await loadHistory();
    } catch (e) {
      if (mounted.current) { noteErr(`Error: ${e.message}`); await fetchStatus(); }
    } finally {
      if (mounted.current) setGlobalBusy(false);
    }
  };

  const dotColor = !state ? "var(--blue)" : state.state === "on" ? "var(--green)" : state.state === "off" ? "var(--text-sec)" : "var(--amber)";
  const dotShadow = !state ? "" : state.state === "on" ? "0 0 8px rgba(5,150,105,0.4)" : state.state === "mixed" ? "0 0 8px rgba(217,119,6,0.4)" : "";
  const statusWord = loading ? "Checking…" : !state ? "—" : state.state === "on" ? "ON" : state.state === "off" ? "OFF" : "MIXED";
  const statusBg = !state || loading ? "var(--bg-card)" : state.state === "on" ? "var(--green-dim)" : state.state === "mixed" ? "var(--amber-dim)" : "var(--bg-el)";

  return (
    <div style={{ padding: 28, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>RC Controls</h2>
          <p className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>Rapid Medical â RingCentral AI Queue Router</p>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: "6px 10px" }} onClick={fetchStatus} disabled={loading}>
          {loading ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />} Refresh
        </button>
      </div>

      {/* Status bar */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, background: statusBg, borderLeft: `4px solid ${dotColor}` }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: dotColor, boxShadow: dotShadow, flexShrink: 0, animation: loading ? "blink 1.2s ease-in-out infinite" : "none" }} />
        <div style={{ flex: 1 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Forwarding is</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 800, color: dotColor, lineHeight: 1.15 }}>{statusWord}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 2 }}>
            {loading ? "Connecting to RingCentral" : state?.state === "on" ? "All calls routing to AI Forward queues" : state?.state === "off" ? "All calls routing to normal queues" : "Lines routed independently — see Per Line below"}
          </div>
        </div>
      </div>

      {/* All lines buttons */}
      <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Switch All Lines</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button className="btn btn-blue" style={{ flex: 1, justifyContent: "center", background: "var(--green)", fontSize: 13 }} onClick={() => doAll("on")} disabled={globalBusy || loading}>
          {globalBusy ? <Loader size={13} className="spin" /> : null} Turn All On
        </button>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 13 }} onClick={() => doAll("off")} disabled={globalBusy || loading}>
          {globalBusy ? <Loader size={13} className="spin" /> : null} Turn All Off
        </button>
      </div>

      {/* Per line */}
      <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Per Line</div>
      {(state?.details || []).map(d => {
        const phoneId = d.phoneId;
        if (!phoneId) return null;
        const info = LINE_NAMES[phoneId] || { label: d.phone || phoneId, onName: "AI Forward", offName: "Normal" };
        const routeName = ROUTE_NAMES[d.currentExt] || `Ext ${d.currentExt || "?"}`;
        const isBusy = busy[phoneId] || globalBusy;
        const statusColor = isBusy ? "var(--blue)" : d.status === "on" ? "var(--green)" : "var(--text-sec)";
        return (
          <div key={phoneId} className="card" style={{ padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Phone size={14} color="var(--text-sec)" />
                <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{d.phone}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {!isBusy && (
                  <span className="tag" style={{ fontWeight: 700, color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40` }}>
                    {d.status === "on" ? "ON" : d.status === "off" ? "OFF" : "?"}
                  </span>
                )}
                <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
                  {isBusy ? "Switching…" : routeName}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={`btn ${d.status === "on" && !isBusy ? "btn-blue" : "btn-ghost"}`}
                style={{ flex: 1, justifyContent: "center", fontSize: 11, padding: "7px 10px", background: d.status === "on" && !isBusy ? "var(--green)" : undefined }}
                onClick={() => doLine(phoneId, "on")}
                disabled={isBusy}
              >{info.onName}</button>
              <button
                className={`btn ${d.status === "off" && !isBusy ? "btn-blue" : "btn-ghost"}`}
                style={{ flex: 1, justifyContent: "center", fontSize: 11, padding: "7px 10px", background: d.status === "off" && !isBusy ? "var(--text-sec)" : undefined, color: d.status === "off" && !isBusy ? "#fff" : undefined }}
                onClick={() => doLine(phoneId, "off")}
                disabled={isBusy}
              >{info.offName}</button>
            </div>
          </div>
        );
      })}

      {/* Scheduler */}
      <RCScheduler />

      {/* Activity log (persistent, last 24h+) */}
      <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8, marginTop: 20, textTransform: "uppercase", letterSpacing: "0.5px" }}>Activity Log · last 48h</div>
      <div className="card-el" style={{ padding: "10px 14px", maxHeight: 240, overflowY: "auto" }}>
        {history.length === 0 && <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>No activity in the last 48 hours</div>}
        {history.map(l => {
          const time = new Date(l.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
          const bad = l.result === "error" || l.result === "failed";
          const color = bad ? "var(--red)" : l.result === "success" ? "var(--green)" : "var(--text-sec)";
          const srcTag = { manual: "Manual", recurring: "Schedule", trigger: "Fail-safe", auto: "Auto", error: "Error" }[l.source] || l.source || "";
          const body = l._transient
            ? l.message
            : `${srcTag ? srcTag + " · " : ""}${l.line || ""}${l.action ? " → " + l.action.toUpperCase() : ""}${l.actor && l.actor !== "scheduler" ? " · " + l.actor : ""}`;
          return (
            <div key={l.id} className="mono" style={{ fontSize: 11, lineHeight: 1.75, color }}>
              [{time}] {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
