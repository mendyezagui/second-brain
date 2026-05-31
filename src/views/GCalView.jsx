import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle, Loader, Mic, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { SUPA_KEY, SUPA_URL, supabase } from "../lib/supabase";
import { today } from "../lib/utils";
import { ConfirmDelete, Drawer, Field, Inp, SearchSelect, Tex } from "../components/ui";

export const GCAL_ACCOUNT_COLORS = ["var(--blue)","var(--purple)","var(--green)","var(--amber)","var(--red)"];

export const gcalIsoToLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const gcalLocalToIsoOrDate = (localStr, allDay) => {
  if (!localStr) return null;
  if (allDay) return localStr.slice(0, 10);
  return new Date(localStr).toISOString();
};

export const blankGCalEvent = (defaults = {}) => {
  const baseDate = defaults.date || today();
  const start = new Date(`${baseDate}T09:00:00`);
  const end   = new Date(`${baseDate}T10:00:00`);
  return {
    id:              null,
    account_id:      defaults.account_id || "",
    calendar_id:     defaults.calendar_id || null,
    summary:         "",
    description:     "",
    location:        "",
    all_day:         false,
    start_time:      gcalIsoToLocalInput(start.toISOString()),
    end_time:        gcalIsoToLocalInput(end.toISOString()),
    google_event_id: null,
    contactId:       "",
    companyId:       "",
    projectId:       "",
    dealId:          "",
    invoiceId:       "",
  };
};

export const gcalDaysInWeek = (anchorYmd, mode = "week") => {
  // mode: "week" (Sun-Sat, 7 days), "workWeek" (Mon-Fri, 5 days), "day" (1 day)
  if (mode === "day") return [anchorYmd];
  const d = new Date(anchorYmd + "T12:00:00");
  const day = d.getDay();
  const start = new Date(d);
  if (mode === "workWeek") {
    // Anchor to Monday: if Sunday, jump forward to Mon; else back to Mon
    const offset = day === 0 ? 1 : 1 - day;
    start.setDate(d.getDate() + offset);
    return Array.from({ length: 5 }, (_, i) => {
      const x = new Date(start); x.setDate(start.getDate() + i);
      return x.toISOString().split("T")[0];
    });
  }
  // Full week — Sun to Sat
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start); x.setDate(start.getDate() + i);
    return x.toISOString().split("T")[0];
  });
};

export const gcalDayKey = (iso) => {
  // Convert ISO timestamp to local YYYY-MM-DD for bucket matching
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const GCalView = ({ session, db, setDB }) => {
  const [accounts, setAccounts] = useState([]);
  const [acctColors, setAcctColors] = useState({});
  const [selectedAcct, setSelectedAcct] = useState(null);
  const [mode, setMode] = useState("day");           // "day" | "workWeek" | "week"
  const [date, setDate] = useState(today());          // YYYY-MM-DD anchor
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState(blankGCalEvent());
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const visibleDays = useMemo(() => gcalDaysInWeek(date, mode), [mode, date]);

  const loadAccounts = async () => {
    if (!supabase) return;
    const { data, error: e } = await supabase
      .from("email_accounts")
      .select("id, address, display_name, provider, is_active")
      .eq("is_active", true)
      .order("address");
    if (e) { setError(e.message); return; }
    const list = data || [];
    setAccounts(list);
    const colors = {};
    list.forEach((a, i) => { colors[a.id] = GCAL_ACCOUNT_COLORS[i % GCAL_ACCOUNT_COLORS.length]; });
    setAcctColors(colors);
  };

  const loadEvents = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const rangeStart = `${visibleDays[0]}T00:00:00`;
    const rangeEnd   = `${visibleDays[visibleDays.length - 1]}T23:59:59`;
    let q = supabase
      .from("calendar_events")
      .select("*")
      .gte("start_time", new Date(rangeStart).toISOString())
      .lte("start_time", new Date(rangeEnd).toISOString())
      .order("start_time", { ascending: true })
      .limit(500);
    if (selectedAcct) q = q.eq("account_id", selectedAcct);
    const { data, error: e } = await q;
    if (e) { setError(e.message); setLoading(false); return; }
    setEvents(data || []);
    setLoading(false);
  };

  const triggerSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await fetch(`${SUPA_URL}/functions/v1/calendar-sync?primary_only=true`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
      });
    } catch (e) { setError(String(e)); }
    await loadEvents();
    setSyncing(false);
  };

  const openEvent = (ev) => {
    setSelected(ev);
    setCreatingNew(false);
    setEditing(false);
    setDrawerOpen(true);
    setForm({
      id:              ev.id,
      account_id:      ev.account_id,
      calendar_id:     ev.calendar_id,
      summary:         ev.summary || "",
      description:     ev.description || "",
      location:        ev.location || "",
      all_day:         !!ev.all_day,
      start_time:      gcalIsoToLocalInput(ev.start_time),
      end_time:        gcalIsoToLocalInput(ev.end_time),
      google_event_id: ev.google_event_id,
      contactId:       ev.contact_id ? String(ev.contact_id) : "",
      companyId:       ev.company_id ? String(ev.company_id) : "",
      projectId:       ev.project_id ? String(ev.project_id) : "",
      dealId:          ev.deal_id ? String(ev.deal_id) : "",
      invoiceId:       ev.invoice_id ? String(ev.invoice_id) : "",
    });
  };

  const openNew = (dayStr) => {
    if (accounts.length === 0) { setError("No accounts connected."); return; }
    const defaultAcct = selectedAcct || accounts[0]?.id;
    const acct = accounts.find(a => a.id === defaultAcct) || accounts[0];
    setSelected(null);
    setCreatingNew(true);
    setEditing(true);
    setDrawerOpen(true);
    setForm(blankGCalEvent({ account_id: acct.id, calendar_id: acct.address, date: dayStr || date }));
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(false);
    setCreatingNew(false);
    setSelected(null);
  };

  const callCalendarAction = async (payload) => {
    const r = await fetch(`${SUPA_URL}/functions/v1/calendar-action`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
    return j;
  };

  // Persist CRM-link fields directly to the local row (Google has no equivalent)
  const persistCrmLinks = async (localId, links) => {
    if (!supabase) return;
    const update = {
      contact_id: links.contactId  ? Number(links.contactId)  : null,
      company_id: links.companyId  ? Number(links.companyId)  : null,
      project_id: links.projectId  ? Number(links.projectId)  : null,
      deal_id:    links.dealId     ? Number(links.dealId)     : null,
      invoice_id: links.invoiceId  ? Number(links.invoiceId)  : null,
    };
    await supabase.from("calendar_events").update(update).eq("id", localId);
  };

  const handleSave = async () => {
    if (!form.summary.trim()) { setError("Title is required."); return; }
    if (!form.start_time)     { setError("Start time is required."); return; }
    if (!form.end_time)       { setError("End time is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        action:      creatingNew ? "create" : "update",
        summary:     form.summary,
        description: form.description,
        location:    form.location,
        all_day:     form.all_day,
        start:       gcalLocalToIsoOrDate(form.start_time, form.all_day),
        end:         gcalLocalToIsoOrDate(form.end_time,   form.all_day),
        timeZone:    Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (creatingNew) {
        payload.account_id  = form.account_id;
        payload.calendar_id = form.calendar_id || (accounts.find(a => a.id === form.account_id)?.address);
      } else {
        payload.local_id = form.id;
      }
      const j = await callCalendarAction(payload);
      const updatedEvent = j.event;
      // Persist CRM links separately (Google doesn't store them)
      if (updatedEvent?.id) {
        await persistCrmLinks(updatedEvent.id, form);
        // Reflect into local copy
        updatedEvent.contact_id = form.contactId ? Number(form.contactId) : null;
        updatedEvent.company_id = form.companyId ? Number(form.companyId) : null;
        updatedEvent.project_id = form.projectId ? Number(form.projectId) : null;
        updatedEvent.deal_id    = form.dealId    ? Number(form.dealId)    : null;
        updatedEvent.invoice_id = form.invoiceId ? Number(form.invoiceId) : null;
      }
      setEvents(es => {
        if (creatingNew) return [updatedEvent, ...es].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        return es.map(e => e.id === updatedEvent.id ? updatedEvent : e);
      });
      setActionMsg(creatingNew ? "Event created in Google Calendar." : "Event updated in Google Calendar.");
      closeDrawer();
    } catch (e) { setError(`Save failed: ${String(e.message || e)}`); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!form.id) return;
    setDeleting(true);
    setError(null);
    try {
      await callCalendarAction({ action: "delete", local_id: form.id });
      setEvents(es => es.filter(e => e.id !== form.id));
      setActionMsg("Event deleted from Google Calendar.");
      closeDrawer();
    } catch (e) { setError(`Delete failed: ${String(e.message || e)}`); }
    setDeleting(false);
    setConfirm(null);
  };

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { loadEvents(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedAcct, date, mode]);
  // Auto-sync once when this view mounts
  useEffect(() => { triggerSync(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const eventsByDay = useMemo(() => {
    const buckets = {};
    for (const day of visibleDays) buckets[day] = [];
    for (const ev of events) {
      const k = gcalDayKey(ev.start_time);
      if (buckets[k]) buckets[k].push(ev);
    }
    return buckets;
  }, [events, visibleDays]);

  const todayCount = useMemo(() => events.filter(e => gcalDayKey(e.start_time) === today()).length, [events]);

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18, height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Calendar size={20} color="var(--blue)" />
          <div className="display" style={{ fontSize: 18, fontWeight: 700 }}>Google Calendar</div>
          {todayCount > 0 && <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>{todayCount} today</span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "var(--bg-el)", borderRadius: 8, padding: 3 }}>
            {[["day","Day"],["workWeek","Work week"],["week","Week"]].map(([v,lbl]) => (
              <button key={v} onClick={() => setMode(v)}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", background: mode === v ? "#fff" : "transparent", color: mode === v ? "var(--text)" : "var(--text-sec)", boxShadow: mode === v ? "var(--shadow)" : "none" }}>
                {lbl}
              </button>
            ))}
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" style={{ padding: "5px 8px", fontSize: 12, width: "auto" }} />
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setDate(today())}>Today</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={triggerSync} disabled={syncing}>
            {syncing ? <><Loader size={12} className="spin" /> Syncing…</> : <><RefreshCw size={12} /> Sync</>}
          </button>
          <button className="btn btn-blue" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => openNew(date)}><Plus size={12} /> Event</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setSelectedAcct(null)} className="filter-chip"
          style={selectedAcct === null ? { background: "var(--blue-dim)", color: "var(--blue)", borderColor: "var(--blue)" } : {}}>
          All
        </button>
        {accounts.map(a => {
          const color = acctColors[a.id];
          const active = selectedAcct === a.id;
          return (
            <button key={a.id} onClick={() => setSelectedAcct(a.id)} className="filter-chip"
              style={{ background: active ? color : "var(--bg-card)", color: active ? "#fff" : "var(--text-sec)", borderColor: active ? color : "var(--border)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#fff" : color }} />
              {a.address}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: "8px 14px", background: "var(--red-dim)", color: "var(--red)", fontSize: 12, borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={13} /> {error}
          <button className="btn-icon" onClick={() => setError(null)} style={{ marginLeft: "auto" }}><X size={13} /></button>
        </div>
      )}
      {actionMsg && !error && (
        <div style={{ padding: "6px 14px", background: "var(--green-dim)", color: "var(--green)", fontSize: 12, borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={13} /> {actionMsg}
          <button className="btn-icon" onClick={() => setActionMsg(null)} style={{ marginLeft: "auto" }}><X size={13} /></button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)`, gap: 10 }}>
          {visibleDays.map(dayStr => {
            const evts = eventsByDay[dayStr] || [];
            const d = new Date(dayStr + "T12:00:00");
            const isToday = dayStr === today();
            return (
              <div key={dayStr} className="card"
                style={{ padding: 14, minHeight: mode === "day" ? 500 : 340, display: "flex", flexDirection: "column", background: isToday ? "rgba(0,119,204,0.03)" : "var(--bg-card)", borderTop: isToday ? "3px solid var(--blue)" : "none" }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: isToday ? "var(--blue)" : "var(--text)", marginBottom: 10 }}>
                  {d.toLocaleDateString("en-US", { weekday: "short" })} {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  {loading && evts.length === 0 ? null : (
                    evts.length > 0 ? evts.map(ev => {
                      const color = acctColors[ev.account_id] || "var(--text-sec)";
                      return (
                        <div key={ev.id} className="card-el" style={{ padding: 8, borderLeft: `3px solid ${color}`, cursor: "pointer" }} onClick={() => openEvent(ev)}>
                          <div className="mono" style={{ fontSize: 10, fontWeight: 600, color }}>
                            {ev.all_day ? "All day" : `${fmtTime(ev.start_time)}–${fmtTime(ev.end_time)}`}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ev.summary || "(no title)"}
                          </div>
                          {ev.location && <div className="mono" style={{ fontSize: 9, color: "var(--text-sec)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {ev.location}</div>}
                          {ev.conference_link && <div className="mono" style={{ fontSize: 9, color: "var(--blue)", marginTop: 2 }}>🎥 join</div>}
                        </div>
                      );
                    }) : <div style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", marginTop: 40 }}>No events</div>
                  )}
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 10, width: "100%", marginTop: 8, justifyContent: "center" }} onClick={() => openNew(dayStr)}>+ Add</button>
              </div>
            );
          })}
        </div>
      </div>

      {drawerOpen && (
        <Drawer
          title={creatingNew ? "New Event" : (editing ? "Edit Event" : (form.summary || "(no title)"))}
          onClose={closeDrawer}
          onSave={editing ? handleSave : null}>
          {!editing && !creatingNew && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button className="btn btn-ghost" onClick={() => setEditing(true)}><Pencil size={13} /> Edit</button>
              <button className="btn btn-danger" onClick={() => setConfirm({ id: form.id, label: form.summary || "(no title)" })}><Trash2 size={13} /> Delete</button>
              {selected?.conference_link && (
                <a href={selected.conference_link} target="_blank" rel="noreferrer"
                  className="btn btn-blue" style={{ marginLeft: "auto", textDecoration: "none" }}>
                  <Mic size={13} /> Join
                </a>
              )}
            </div>
          )}
          {creatingNew && (
            <Field label="Account">
              <select className="input" value={form.account_id}
                onChange={e => {
                  const acct = accounts.find(a => a.id === e.target.value);
                  setForm(f => ({ ...f, account_id: e.target.value, calendar_id: acct?.address || null }));
                }}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.address}</option>)}
              </select>
            </Field>
          )}
          <Field label="Title">
            {editing ? (
              <Inp value={form.summary} onChange={v => setForm(f => ({ ...f, summary: v }))} />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{form.summary || "(no title)"}</div>
            )}
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label={`Start${form.all_day ? " (date)" : ""}`}>
              {editing ? (
                <Inp type={form.all_day ? "date" : "datetime-local"}
                  value={form.all_day ? form.start_time.slice(0, 10) : form.start_time}
                  onChange={v => setForm(f => ({ ...f, start_time: v }))} />
              ) : (
                <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                  {form.all_day ? form.start_time.slice(0, 10) : new Date(form.start_time).toLocaleString()}
                </div>
              )}
            </Field>
            <Field label={`End${form.all_day ? " (date)" : ""}`}>
              {editing ? (
                <Inp type={form.all_day ? "date" : "datetime-local"}
                  value={form.all_day ? form.end_time.slice(0, 10) : form.end_time}
                  onChange={v => setForm(f => ({ ...f, end_time: v }))} />
              ) : (
                <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                  {form.all_day ? form.end_time.slice(0, 10) : new Date(form.end_time).toLocaleString()}
                </div>
              )}
            </Field>
          </div>
          <Field label="All day">
            <input type="checkbox" checked={form.all_day} disabled={!editing}
              onChange={e => setForm(f => ({ ...f, all_day: e.target.checked }))}
              style={{ width: 16, height: 16 }} />
          </Field>
          <Field label="Location">
            {editing ? (
              <Inp value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-sec)" }}>{form.location || "—"}</div>
            )}
          </Field>
          <Field label="Description">
            {editing ? (
              <Tex value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-sec)", whiteSpace: "pre-wrap" }}>{form.description || "—"}</div>
            )}
          </Field>
          {db && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Person">
                <SearchSelect value={form.contactId} onChange={v => setForm(f => ({ ...f, contactId: v }))}
                  options={(db.contacts || []).map(c => ({ value: String(c.id), label: c.name }))}
                  placeholder="Search contacts…" />
              </Field>
              <Field label="Company">
                <SearchSelect value={form.companyId} onChange={v => setForm(f => ({ ...f, companyId: v }))}
                  options={(db.companies || []).map(c => ({ value: String(c.id), label: c.name }))}
                  placeholder="Search companies…" />
              </Field>
              <Field label="Project">
                <SearchSelect value={form.projectId} onChange={v => setForm(f => ({ ...f, projectId: v }))}
                  options={(db.projects || []).map(p => ({ value: String(p.id), label: p.name }))}
                  placeholder="Search projects…" />
              </Field>
              <Field label="Deal">
                <SearchSelect value={form.dealId} onChange={v => setForm(f => ({ ...f, dealId: v }))}
                  options={(db.deals || []).map(d => ({ value: String(d.id), label: d.name }))}
                  placeholder="Search deals…" />
              </Field>
              <Field label="Invoice">
                <SearchSelect value={form.invoiceId} onChange={v => setForm(f => ({ ...f, invoiceId: v }))}
                  options={(db.invoices || []).map(i => ({ value: String(i.id), label: `${i.number} — ${i.client}` }))}
                  placeholder="Search invoices…" />
              </Field>
            </div>
          )}
          {!creatingNew && selected?.conference_link && (
            <Field label="Conference link">
              <a href={selected.conference_link} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: "var(--blue)", wordBreak: "break-all" }}>
                {selected.conference_link}
              </a>
            </Field>
          )}
          {!creatingNew && Array.isArray(selected?.attendees) && selected.attendees.length > 0 && (
            <Field label="Attendees">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {selected.attendees.map((att, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--text-sec)" }}>
                    {att.email}{att.responseStatus ? ` · ${att.responseStatus}` : ""}
                  </div>
                ))}
              </div>
            </Field>
          )}
          {!editing && !creatingNew && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-m)" }}>
              Account: {accounts.find(a => a.id === form.account_id)?.address || "?"}
              {form.calendar_id && form.calendar_id !== accounts.find(a => a.id === form.account_id)?.address && ` · Calendar: ${form.calendar_id}`}
            </div>
          )}
        </Drawer>
      )}
      {confirm && <ConfirmDelete label={confirm.label} onConfirm={handleDelete} onCancel={() => setConfirm(null)} />}
      {(saving || deleting) && (
        <div className="confirm-overlay" style={{ background: "rgba(0,0,0,0.15)" }}>
          <div className="confirm-box" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Loader size={16} className="spin" /> {saving ? "Saving to Google…" : "Deleting…"}
          </div>
        </div>
      )}
    </div>
  );
};
