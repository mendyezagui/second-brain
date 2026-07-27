import { useEffect, useMemo, useState } from "react";
import { Boxes, Calendar, Inbox, ClipboardList, Plus, Trash2, Pencil, Check, X, ChevronLeft, ChevronRight, Loader, Glasses, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabase";

/* ── date helpers ─────────────────────────────────────────── */
const iso = (d) => {
  const z = new Date(d);
  return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`;
};
const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const daysInclusive = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000) + 1;
const todayISO = () => iso(new Date());
const prettyDate = (s) => s ? parseISO(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const prettyShort = (s) => s ? parseISO(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

/* every 4th day free */
const quote = (rate, start, end) => {
  if (!rate || !start || !end) return { days: 0, free: 0, charge: 0, total: 0 };
  const days = daysInclusive(start, end);
  const free = Math.floor(days / 4);
  const charge = days - free;
  return { days, free, charge, total: charge * Number(rate) };
};

const KIND_COLOR = { booked: "--blue", blocked: "--red", maintenance: "--amber", transit: "--purple" };
const KIND_LABEL = { booked: "Booked", blocked: "Blocked", maintenance: "Maintenance", transit: "Turnaround" };
const STATUS_COLOR = { available: "--green", maintenance: "--amber", retired: "--text-dim", lost: "--red" };
const BOOK_STATUS_COLOR = { pending: "--amber", confirmed: "--blue", out: "--purple", returned: "--green", cancelled: "--text-dim" };
const LEAD_STATUS_COLOR = { new: "--blue", contacted: "--amber", booked: "--green", archived: "--text-dim" };

const cvar = (v) => `var(${v})`;
const Pill = ({ label, color }) => (
  <span className="tag" style={{ color: cvar(color), background: `color-mix(in srgb, ${cvar(color)} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${cvar(color)} 30%, transparent)` }}>{label}</span>
);

export function SpectariInventoryView() {
  const [tab, setTab] = useState("inventory");
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [items, setItems] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [toast, setToast] = useState(null);
  const [leadDays, setLeadDays] = useState(7);
  const [savingLead, setSavingLead] = useState(false);

  const flash = (msg, bad = false) => { setToast({ msg, bad }); setTimeout(() => setToast(null), 3200); };

  const reload = async () => {
    setLoading(true);
    const [m, i, b, bk, r, s] = await Promise.all([
      supabase.from("spectari_models").select("*").order("sort"),
      supabase.from("spectari_items").select("*").order("created_at"),
      supabase.from("spectari_blocks").select("*").order("start_date"),
      supabase.from("spectari_bookings").select("*").order("start_date", { ascending: false }),
      supabase.from("spectari_reservations").select("*").order("created_at", { ascending: false }),
      supabase.from("spectari_settings").select("lead_days").eq("id", 1).maybeSingle(),
    ]);
    setModels(m.data || []); setItems(i.data || []); setBlocks(b.data || []);
    setBookings(bk.data || []); setLeads(r.data || []);
    if (s.data && s.data.lead_days != null) setLeadDays(s.data.lead_days);
    setLoading(false);
  };

  const saveLead = async () => {
    setSavingLead(true);
    const n = Math.max(0, parseInt(leadDays, 10) || 0);
    const q = await supabase.from("spectari_settings").upsert({ id: 1, lead_days: n, updated_at: new Date().toISOString() });
    setSavingLead(false);
    if (q.error) { flash(q.error.message, true); return; }
    setLeadDays(n);
    flash(n === 0 ? "Lead-time window turned off" : `Lead time set to ${n} days`);
  };
  useEffect(() => { reload(); }, []);

  const modelById = useMemo(() => Object.fromEntries(models.map(m => [m.id, m])), [models]);
  const itemById = useMemo(() => Object.fromEntries(items.map(i => [i.id, i])), [items]);
  const modelLabel = (id) => { const m = modelById[id]; return m ? `${m.brand} ${m.name}` : id; };
  const itemLabel = (id) => { const it = itemById[id]; return it ? `${it.label} · ${modelLabel(it.model_id)}` : "—"; };

  const TABS = [
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "calendar", label: "Availability", icon: Calendar },
    { id: "leads", label: "Leads", icon: Inbox, badge: leads.filter(l => l.status === "new").length },
    { id: "bookings", label: "Bookings", icon: ClipboardList },
  ];

  return (
    <div style={{ padding: "22px 26px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}><Glasses size={20} color="var(--blue)" /></div>
        <div>
          <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>Spectari Inventory</div>
          <div style={{ fontSize: 12.5, color: "var(--text-sec)" }}>Manage units, availability, leads and bookings for spectari.app</div>
        </div>
        <button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={reload}><RefreshCw size={14} /> Refresh</button>
      </div>

      {!loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: leadDays > 0 ? "var(--amber-dim)" : "var(--bg-el)", border: "1px solid " + (leadDays > 0 ? "rgba(217,119,6,0.25)" : "var(--border)"), borderRadius: 10, padding: "10px 14px", margin: "14px 0 4px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>Booking lead time</span>
          <input className="input" type="number" min="0" style={{ width: 66 }} value={leadDays} onChange={e => setLeadDays(e.target.value)} />
          <span style={{ fontSize: 12.5, color: "var(--text-sec)", flex: 1, minWidth: 220 }}>
            rolling days from today that <b>no pair can be booked</b> (sourcing + checkout time). <b>0 = off.</b>
            {leadDays > 0 && <> Earliest bookable date is always {Number(leadDays)} days out.</>}
          </span>
          <button className="btn btn-blue" onClick={saveLead} disabled={savingLead}>{savingLead ? "Saving…" : "Save"}</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border)", margin: "14px 0 20px", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer",
            color: tab === t.id ? "var(--blue)" : "var(--text-sec)", fontWeight: 600, fontSize: 13.5, borderBottom: tab === t.id ? "2px solid var(--blue)" : "2px solid transparent", marginBottom: -1,
          }}>
            <t.icon size={15} /> {t.label}
            {t.badge > 0 && <span className="mono" style={{ fontSize: 10.5, background: "var(--blue)", color: "#fff", borderRadius: 20, padding: "1px 6px" }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-sec)", padding: 40 }}><Loader size={16} className="spin" /> Loading inventory…</div>
      ) : (
        <>
          {tab === "inventory" && <InventoryTab {...{ models, items, modelById, blocks, reload, flash }} />}
          {tab === "calendar" && <CalendarTab {...{ items, blocks, modelLabel, reload, flash }} />}
          {tab === "leads" && <LeadsTab {...{ leads, reload, flash, openBookingFromLead: (lead) => { setTab("bookings"); window.__spectariLead = lead; } }} />}
          {tab === "bookings" && <BookingsTab {...{ bookings, items, models, modelById, itemById, blocks, modelLabel, itemLabel, reload, flash }} />}
        </>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: toast.bad ? "var(--red)" : "var(--text)", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: 8 }}>
          {toast.bad && <AlertTriangle size={15} />} {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Inventory tab ────────────────────────────────────────── */
function InventoryTab({ models, items, modelById, blocks, reload, flash }) {
  const [editing, setEditing] = useState(null); // item obj or {} for new
  const blank = { model_id: models[0]?.id || "", label: "", serial: "", status: "available", daily_rate: "", notes: "" };
  const blocksToday = (itemId) => blocks.some(b => b.item_id === itemId && todayISO() >= b.start_date && todayISO() <= b.end_date);

  const save = async () => {
    const e = editing;
    if (!e.model_id || !e.label.trim()) { flash("Model and label are required", true); return; }
    const payload = { model_id: e.model_id, label: e.label.trim(), serial: e.serial?.trim() || null, status: e.status, daily_rate: e.daily_rate === "" ? null : Number(e.daily_rate), notes: e.notes?.trim() || null };
    const q = e.id ? await supabase.from("spectari_items").update(payload).eq("id", e.id) : await supabase.from("spectari_items").insert(payload);
    if (q.error) { flash(q.error.message, true); return; }
    setEditing(null); flash(e.id ? "Unit updated" : "Unit added"); reload();
  };
  const del = async (it) => {
    if (!confirm(`Delete unit "${it.label}"? This also removes its blocks.`)) return;
    const q = await supabase.from("spectari_items").delete().eq("id", it.id);
    if (q.error) { flash(q.error.message, true); return; }
    flash("Unit deleted"); reload();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--text-sec)" }}>{items.length} physical unit{items.length !== 1 ? "s" : ""} across {new Set(items.map(i => i.model_id)).size} model{new Set(items.map(i => i.model_id)).size !== 1 ? "s" : ""}</div>
        <button className="btn btn-blue" style={{ marginLeft: "auto" }} onClick={() => setEditing(blank)}><Plus size={15} /> Add unit</button>
      </div>

      {models.map(m => {
        const list = items.filter(i => i.model_id === m.id);
        return (
          <div key={m.id} className="card" style={{ padding: 0, marginBottom: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: list.length ? "1px solid var(--border)" : "none", background: "var(--bg-el)" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{m.brand} <span style={{ color: "var(--text-sec)", fontWeight: 500 }}>{m.name}</span></div>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>${Number(m.daily_rate)}/day</span>
              <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-sec)" }}>{list.length} unit{list.length !== 1 ? "s" : ""}</span>
            </div>
            {list.map(it => (
              <div key={it.id} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, minWidth: 90 }}>{it.label}</div>
                <Pill label={it.status} color={STATUS_COLOR[it.status]} />
                {blocksToday(it.id) ? <Pill label="Unavailable today" color="--red" /> : <Pill label="Available today" color="--green" />}
                {it.serial && <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>#{it.serial}</span>}
                {it.daily_rate != null && <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>${Number(it.daily_rate)}/day</span>}
                <div className="row-actions" style={{ marginLeft: "auto", display: "flex", gap: 4, opacity: 0, transition: "opacity .15s" }}>
                  <button className="btn-icon" onClick={() => setEditing(it)}><Pencil size={14} /></button>
                  <button className="btn-icon delete" onClick={() => del(it)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {list.length === 0 && <div style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-dim)" }}>No units yet.</div>}
          </div>
        );
      })}

      {editing && (
        <Drawer title={editing.id ? "Edit unit" : "Add unit"} onClose={() => setEditing(null)} onSave={save}>
          <Field label="Model"><select className="input" value={editing.model_id} onChange={e => setEditing({ ...editing, model_id: e.target.value })}>{models.map(m => <option key={m.id} value={m.id}>{m.brand} {m.name}</option>)}</select></Field>
          <Field label="Label / asset tag"><input className="input" placeholder="e.g. RBM-01" value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} /></Field>
          <Field label="Serial (optional)"><input className="input" value={editing.serial || ""} onChange={e => setEditing({ ...editing, serial: e.target.value })} /></Field>
          <Field label="Status"><select className="input" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}>{["available", "maintenance", "retired", "lost"].map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Daily rate override (optional)"><input className="input" type="number" placeholder="model default" value={editing.daily_rate} onChange={e => setEditing({ ...editing, daily_rate: e.target.value })} /></Field>
          <Field label="Notes"><textarea className="input" value={editing.notes || ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></Field>
        </Drawer>
      )}
    </div>
  );
}

/* ── Availability / calendar tab ──────────────────────────── */
function CalendarTab({ items, blocks, modelLabel, reload, flash }) {
  const [itemId, setItemId] = useState(items[0]?.id || "");
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [range, setRange] = useState({ start: "", end: "", kind: "blocked", note: "" });

  useEffect(() => { if (!itemId && items[0]) setItemId(items[0].id); }, [items]);

  const itemBlocks = blocks.filter(b => b.item_id === itemId);
  const blockOn = (dayISO) => itemBlocks.find(b => dayISO >= b.start_date && dayISO <= b.end_date);

  const monthName = new Date(cursor.y, cursor.m, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const nDays = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: nDays }, (_, i) => i + 1)];
  const shift = (delta) => { let m = cursor.m + delta, y = cursor.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } setCursor({ y, m }); };

  const toggleDay = async (day) => {
    if (!itemId) return;
    const dayISO = iso(new Date(cursor.y, cursor.m, day));
    const existing = blockOn(dayISO);
    if (existing) {
      if (existing.booking_id) { flash("This day is held by a booking — manage it in Bookings", true); return; }
      if (existing.start_date === existing.end_date) {
        const q = await supabase.from("spectari_blocks").delete().eq("id", existing.id);
        if (q.error) { flash(q.error.message, true); return; }
        flash("Day freed"); reload();
      } else { flash("Part of a multi-day block — remove it from the list below", true); }
      return;
    }
    const q = await supabase.from("spectari_blocks").insert({ item_id: itemId, start_date: dayISO, end_date: dayISO, kind: "blocked" });
    if (q.error) { flash(q.error.message, true); return; }
    reload();
  };

  const addRange = async () => {
    if (!itemId || !range.start || !range.end) { flash("Pick a unit and both dates", true); return; }
    if (range.end < range.start) { flash("End date is before start date", true); return; }
    const q = await supabase.from("spectari_blocks").insert({ item_id: itemId, start_date: range.start, end_date: range.end, kind: range.kind, note: range.note || null });
    if (q.error) { flash(/exclusion|overlap|conflict/i.test(q.error.message) ? "Those dates overlap an existing block/booking" : q.error.message, true); return; }
    setRange({ start: "", end: "", kind: "blocked", note: "" }); flash("Dates blocked"); reload();
  };
  const delBlock = async (b) => {
    if (b.booking_id) { flash("Held by a booking — cancel it in Bookings", true); return; }
    const q = await supabase.from("spectari_blocks").delete().eq("id", b.id);
    if (q.error) { flash(q.error.message, true); return; }
    flash("Block removed"); reload();
  };

  if (items.length === 0) return <Empty msg="Add a unit first, then you can block its dates here." />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 18, alignItems: "start" }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <select className="input" style={{ width: "auto", flex: 1, minWidth: 200 }} value={itemId} onChange={e => setItemId(e.target.value)}>
            {items.map(it => <option key={it.id} value={it.id}>{it.label} — {modelLabel(it.model_id)}</option>)}
          </select>
          <button className="btn-icon" onClick={() => shift(-1)}><ChevronLeft size={16} /></button>
          <div style={{ fontWeight: 700, minWidth: 130, textAlign: "center" }}>{monthName}</div>
          <button className="btn-icon" onClick={() => shift(1)}><ChevronRight size={16} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10.5, color: "var(--text-dim)", fontWeight: 600, padding: "2px 0" }}>{d}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dayISO = iso(new Date(cursor.y, cursor.m, day));
            const b = blockOn(dayISO);
            const isToday = dayISO === todayISO();
            const col = b ? KIND_COLOR[b.kind] : null;
            return (
              <button key={i} onClick={() => toggleDay(day)} title={b ? KIND_LABEL[b.kind] : "Available — click to block"} style={{
                aspectRatio: "1", border: isToday ? "2px solid var(--blue)" : "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                background: b ? `color-mix(in srgb, ${cvar(col)} 16%, transparent)` : "var(--bg-card)", color: b ? cvar(col) : "var(--text)", position: "relative",
              }}>{day}</button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14, fontSize: 11, color: "var(--text-sec)" }}>
          {Object.entries(KIND_LABEL).map(([k, l]) => <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: `color-mix(in srgb, ${cvar(KIND_COLOR[k])} 30%, transparent)`, border: `1px solid ${cvar(KIND_COLOR[k])}` }} /> {l}</span>)}
          <span style={{ color: "var(--text-dim)" }}>Click an empty day to block it, a single blocked day to free it.</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Block a date range</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Field label="From" tight><input className="input" type="date" value={range.start} onChange={e => setRange({ ...range, start: e.target.value })} /></Field>
            <Field label="To" tight><input className="input" type="date" value={range.end} onChange={e => setRange({ ...range, end: e.target.value })} /></Field>
          </div>
          <Field label="Reason" tight><select className="input" value={range.kind} onChange={e => setRange({ ...range, kind: e.target.value })}>{["blocked", "maintenance", "transit"].map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></Field>
          <Field label="Note (optional)" tight><input className="input" value={range.note} onChange={e => setRange({ ...range, note: e.target.value })} /></Field>
          <button className="btn btn-blue" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={addRange}><Plus size={15} /> Block dates</button>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Current blocks</div>
          {itemBlocks.length === 0 && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>None — this unit is fully available.</div>}
          {itemBlocks.map(b => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <Pill label={KIND_LABEL[b.kind]} color={KIND_COLOR[b.kind]} />
              <span style={{ fontSize: 12.5 }}>{prettyShort(b.start_date)}{b.end_date !== b.start_date ? ` – ${prettyShort(b.end_date)}` : ""}</span>
              {!b.booking_id && <button className="btn-icon delete" style={{ marginLeft: "auto" }} onClick={() => delBlock(b)}><X size={14} /></button>}
              {b.booking_id && <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-dim)" }}>booking</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Leads tab (waitlist inbox) ───────────────────────────── */
function LeadsTab({ leads, reload, flash, openBookingFromLead }) {
  const setStatus = async (lead, status) => {
    const q = await supabase.from("spectari_reservations").update({ status }).eq("id", lead.id);
    if (q.error) { flash(q.error.message, true); return; }
    reload();
  };
  if (leads.length === 0) return <Empty msg="No reservation leads yet. They arrive here when someone submits the reserve form on spectari.app." />;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {leads.map(l => (
        <div key={l.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{l.full_name}</span>
              <Pill label={l.status} color={LEAD_STATUS_COLOR[l.status]} />
              {l.wants_ugc_promo && <Pill label="15% share" color="--purple" />}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-sec)", marginTop: 3 }}>
              <a href={`mailto:${l.email}`} style={{ color: "var(--blue)" }}>{l.email}</a>
              {l.product && <> · {l.product}</>}
              {(l.date_start || l.date_end) && <> · {prettyShort(l.date_start)}{l.date_end ? ` – ${prettyShort(l.date_end)}` : ""}</>}
              {l.city && <> · {l.city}</>}
              {l.party_size && <> · {l.party_size} traveler{l.party_size > 1 ? "s" : ""}</>}
            </div>
            {l.notes && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, fontStyle: "italic" }}>"{l.notes}"</div>}
            <div className="mono" style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 4 }}>{new Date(l.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <button className="btn btn-blue" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => openBookingFromLead(l)}>→ Booking</button>
            <select className="filter-select" value={l.status} onChange={e => setStatus(l, e.target.value)}>{["new", "contacted", "booked", "archived"].map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Bookings tab ─────────────────────────────────────────── */
function BookingsTab({ bookings, items, models, modelById, itemById, blocks, modelLabel, itemLabel, reload, flash }) {
  const [editing, setEditing] = useState(null);
  const [buffer, setBuffer] = useState(1);

  useEffect(() => {
    const lead = window.__spectariLead;
    if (lead) {
      window.__spectariLead = null;
      const wantModel = models.find(m => lead.product && lead.product.includes(m.name))?.id;
      const firstItem = items.find(i => (!wantModel || i.model_id === wantModel));
      setEditing({ item_id: firstItem?.id || items[0]?.id || "", reservation_id: lead.id, customer_name: lead.full_name, customer_email: lead.email, city: lead.city || "", start_date: lead.date_start || "", end_date: lead.date_end || "", status: "confirmed", daily_rate: "", notes: lead.notes || "" });
    }
  }, []);

  const rateFor = (itemId) => { const it = itemById[itemId]; if (!it) return 0; return it.daily_rate ?? modelById[it.model_id]?.daily_rate ?? 0; };
  const blank = () => ({ item_id: items[0]?.id || "", reservation_id: null, customer_name: "", customer_email: "", city: "", start_date: "", end_date: "", status: "confirmed", daily_rate: "", notes: "" });

  const reconcileBlocks = async (bookingId, b) => {
    await supabase.from("spectari_blocks").delete().eq("booking_id", bookingId);
    if (!["confirmed", "out"].includes(b.status)) return null;
    const rows = [{ item_id: b.item_id, start_date: b.start_date, end_date: b.end_date, kind: "booked", booking_id: bookingId, note: b.customer_name || null }];
    const buf = Number(buffer) || 0;
    if (buf > 0) {
      rows.push({ item_id: b.item_id, start_date: addDays(b.start_date, -buf), end_date: addDays(b.start_date, -1), kind: "transit", booking_id: bookingId, note: "turnaround" });
      rows.push({ item_id: b.item_id, start_date: addDays(b.end_date, 1), end_date: addDays(b.end_date, buf), kind: "transit", booking_id: bookingId, note: "turnaround" });
    }
    const q = await supabase.from("spectari_blocks").insert(rows);
    return q.error;
  };

  const save = async () => {
    const b = editing;
    if (!b.item_id || !b.start_date || !b.end_date) { flash("Unit and both dates are required", true); return; }
    if (b.end_date < b.start_date) { flash("End date is before start date", true); return; }
    const rate = b.daily_rate === "" ? rateFor(b.item_id) : Number(b.daily_rate);
    const payload = { item_id: b.item_id, reservation_id: b.reservation_id || null, customer_name: b.customer_name?.trim() || null, customer_email: b.customer_email?.trim() || null, city: b.city?.trim() || null, start_date: b.start_date, end_date: b.end_date, status: b.status, daily_rate: rate, notes: b.notes?.trim() || null };
    let bookingId = b.id;
    if (b.id) { const q = await supabase.from("spectari_bookings").update(payload).eq("id", b.id); if (q.error) { flash(q.error.message, true); return; } }
    else { const q = await supabase.from("spectari_bookings").insert(payload).select().single(); if (q.error) { flash(q.error.message, true); return; } bookingId = q.data.id; }
    const blockErr = await reconcileBlocks(bookingId, payload);
    if (blockErr) {
      if (!b.id) await supabase.from("spectari_bookings").delete().eq("id", bookingId);
      flash(/exclusion|overlap|conflict/i.test(blockErr.message) ? "Those dates conflict with another booking/block on this unit" : blockErr.message, true);
      return;
    }
    if (b.reservation_id) await supabase.from("spectari_reservations").update({ status: "booked" }).eq("id", b.reservation_id);
    setEditing(null); flash(b.id ? "Booking updated" : "Booking created"); reload();
  };
  const del = async (bk) => {
    if (!confirm("Delete this booking and free its dates?")) return;
    await supabase.from("spectari_blocks").delete().eq("booking_id", bk.id);
    const q = await supabase.from("spectari_bookings").delete().eq("id", bk.id);
    if (q.error) { flash(q.error.message, true); return; }
    flash("Booking deleted"); reload();
  };

  const liveRate = editing ? (editing.daily_rate === "" ? rateFor(editing.item_id) : Number(editing.daily_rate)) : 0;
  const qt = editing ? quote(liveRate, editing.start_date, editing.end_date) : null;

  if (items.length === 0) return <Empty msg="Add units first, then you can book them here." />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--text-sec)" }}>{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</div>
        <button className="btn btn-blue" style={{ marginLeft: "auto" }} onClick={() => setEditing(blank())}><Plus size={15} /> New booking</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {bookings.length === 0 && <div style={{ padding: 16, fontSize: 12.5, color: "var(--text-dim)" }}>No bookings yet.</div>}
        {bookings.map(bk => {
          const q = quote(bk.daily_rate, bk.start_date, bk.end_date);
          return (
            <div key={bk.id} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{bk.customer_name || "—"}</span>
                  <Pill label={bk.status} color={BOOK_STATUS_COLOR[bk.status]} />
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-sec)", marginTop: 2 }}>{itemLabel(bk.item_id)} · {prettyShort(bk.start_date)} – {prettyShort(bk.end_date)} · {q.days}d {q.free > 0 && <span style={{ color: "var(--green)" }}>({q.free} free)</span>}</div>
              </div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>${q.total}</div>
              <div className="row-actions" style={{ display: "flex", gap: 4, opacity: 0, transition: "opacity .15s" }}>
                <button className="btn-icon" onClick={() => setEditing({ ...bk, daily_rate: bk.daily_rate ?? "" })}><Pencil size={14} /></button>
                <button className="btn-icon delete" onClick={() => del(bk)}><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Drawer title={editing.id ? "Edit booking" : "New booking"} onClose={() => setEditing(null)} onSave={save}>
          <Field label="Unit"><select className="input" value={editing.item_id} onChange={e => setEditing({ ...editing, item_id: e.target.value })}>{items.map(it => <option key={it.id} value={it.id}>{it.label} — {modelLabel(it.model_id)}</option>)}</select></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Field label="From" tight><input className="input" type="date" value={editing.start_date} onChange={e => setEditing({ ...editing, start_date: e.target.value })} /></Field>
            <Field label="To" tight><input className="input" type="date" value={editing.end_date} onChange={e => setEditing({ ...editing, end_date: e.target.value })} /></Field>
          </div>
          <Field label="Customer name"><input className="input" value={editing.customer_name || ""} onChange={e => setEditing({ ...editing, customer_name: e.target.value })} /></Field>
          <Field label="Customer email"><input className="input" value={editing.customer_email || ""} onChange={e => setEditing({ ...editing, customer_email: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Field label="Daily rate" tight><input className="input" type="number" placeholder={`${rateFor(editing.item_id)}`} value={editing.daily_rate} onChange={e => setEditing({ ...editing, daily_rate: e.target.value })} /></Field>
            <Field label="Turnaround buffer (days)" tight><input className="input" type="number" min="0" value={buffer} onChange={e => setBuffer(e.target.value)} /></Field>
          </div>
          <Field label="Status"><select className="input" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}>{["pending", "confirmed", "out", "returned", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Notes"><textarea className="input" value={editing.notes || ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></Field>
          {qt && qt.days > 0 && (
            <div className="card-el" style={{ padding: "12px 14px", fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{qt.days} days × ${liveRate}/day</span><span className="mono">${qt.days * liveRate}</span></div>
              {qt.free > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "var(--green)" }}><span>Every 4th day free ({qt.free})</span><span className="mono">−${qt.free * liveRate}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--border)" }}><span>Total</span><span className="mono">${qt.total}</span></div>
              <div style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 4 }}>Confirmed/out bookings block these dates{Number(buffer) > 0 ? ` plus ${buffer}-day turnaround` : ""}, and can't overlap another booking on this unit.</div>
            </div>
          )}
        </Drawer>
      )}
    </div>
  );
}

/* ── shared bits ──────────────────────────────────────────── */
function Field({ label, children, tight }) {
  return <div className="form-group" style={tight ? { flex: 1, marginBottom: 10 } : {}}><label className="form-label">{label}</label>{children}</div>;
}
function Empty({ msg }) {
  return <div className="card" style={{ padding: 36, textAlign: "center", color: "var(--text-sec)", fontSize: 13.5 }}>{msg}</div>;
}
function Drawer({ title, children, onClose, onSave }) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="display" style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <button className="btn-icon" style={{ marginLeft: "auto" }} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div>
        <div style={{ display: "flex", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Cancel</button>
          <button className="btn btn-blue" style={{ flex: 1, justifyContent: "center" }} onClick={onSave}><Check size={15} /> Save</button>
        </div>
      </div>
    </>
  );
}
