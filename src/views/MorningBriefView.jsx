import { useEffect, useState } from "react";
import { Sparkles, Loader, AlertCircle, Mail, Phone, Linkedin, Activity, Target, Calendar, ChevronRight, Copy, Check, User, Building2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { recordPath } from "../lib/utils";

const fmt$ = (n) => (n == null ? "" : "$" + Number(n).toLocaleString());
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysUntil = (d) => {
  if (!d) return null;
  const ms = new Date(d + "T00:00:00").getTime() - new Date(todayStr() + "T00:00:00").getTime();
  return Math.round(ms / 86400000);
};
const openRecord = (type, id) => { if (id) window.location.hash = recordPath(type, id); };

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  if (!text) return null;
  return (
    <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }}
      onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      {done ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy</>}
    </button>
  );
}

function ContactActions({ c }) {
  if (!c) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
      {c.email && <a className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }} href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()}><Mail size={12} />{c.email}</a>}
      {c.phone && <a className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }} href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()}><Phone size={12} />{c.phone}</a>}
      {c.linkedin_url && <a className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }} href={c.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><Linkedin size={12} />LinkedIn</a>}
      <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); openRecord("contact", c.id); }}><User size={12} />Open contact</button>
      {c.companyId && <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); openRecord("company", c.companyId); }}><Building2 size={12} />Open company</button>}
    </div>
  );
}

function DraftBlock({ subject, draft, email }) {
  if (!draft) return null;
  const mailto = email ? `mailto:${email}?subject=${encodeURIComponent(subject || "")}&body=${encodeURIComponent(draft)}` : null;
  return (
    <div className="card-el" style={{ padding: 11, marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-sec)" }}>READY TO SEND</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {mailto && <a className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }} href={mailto} onClick={(e) => e.stopPropagation()}><Mail size={12} />Open in email</a>}
          <CopyBtn text={subject ? `Subject: ${subject}\n\n${draft}` : draft} />
        </div>
      </div>
      {subject && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Subject: {subject}</div>}
      <div style={{ fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-wrap", color: "var(--text)" }}>{draft}</div>
    </div>
  );
}

function Row({ open, onToggle, left, title, sub, children }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", marginBottom: 6, overflow: "hidden" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", cursor: "pointer" }}>
        {left}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
          {sub && <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 2 }}>{sub}</div>}
        </div>
        <ChevronRight size={15} color="var(--text-dim)" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />
      </div>
      {open && <div style={{ padding: "0 11px 12px 11px" }}>{children}</div>}
    </div>
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="card" style={{ padding: 18, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon size={15} color="var(--blue)" />
        <div className="display" style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        {count != null && <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginLeft: "auto" }}>{count}</span>}
      </div>
      {children}
    </div>
  );
}

export function MorningBriefView() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));

  useEffect(() => {
    (async () => {
      try {
        const t = todayStr();
        const [cadence, tasks, deals, replies] = await Promise.all([
          supabase.from("cadence_next_actions").select("*").lte("next_action_at", t),
          supabase.from("task_priority_scores").select("*").limit(12),
          supabase.from("deals").select("id,name,value,stage,probability,closeDate").not("stage", "in", '("won","lost","closed_lost")').order("value", { ascending: false }),
          supabase.from("events").select("*").eq("event_type", "reply_received").order("date", { ascending: false }).limit(8),
        ]);
        if (tasks.error) throw tasks.error;
        const cad = cadence.data || [], tsk = tasks.data || [], dls = deals.data || [], rep = replies.data || [];
        const cIds = [...new Set([...cad.map((c) => c.contact_id), ...tsk.map((x) => x.contactId)].filter(Boolean))];
        const taskIds = tsk.map((x) => x.id);
        const [contactsRes, notesRes] = await Promise.all([
          cIds.length ? supabase.from("contacts").select("id,name,co,email,phone,linkedin_url,companyId").in("id", cIds) : Promise.resolve({ data: [] }),
          taskIds.length ? supabase.from("tasks").select("id,notes").in("id", taskIds) : Promise.resolve({ data: [] }),
        ]);
        const contacts = contactsRes.data || [];
        const compIds = [...new Set(contacts.map((c) => c.companyId).filter(Boolean))];
        const compsRes = compIds.length ? await supabase.from("companies").select("id,name").in("id", compIds) : { data: [] };
        const contactById = Object.fromEntries(contacts.map((c) => [c.id, c]));
        const companyById = Object.fromEntries((compsRes.data || []).map((c) => [c.id, c.name]));
        const notesById = Object.fromEntries((notesRes.data || []).map((n) => [n.id, n.notes]));
        setD({ cadence: cad, tasks: tsk, deals: dls, replies: rep, contactById, companyById, notesById });
      } catch (e) { setErr(e.message || String(e)); }
    })();
  }, []);

  if (err) return <div style={{ padding: 24 }} className="mono">Could not load brief: {err}</div>;
  if (!d) return (
    <div style={{ padding: 24, display: "flex", alignItems: "center", gap: 8, color: "var(--text-sec)" }}>
      <Loader size={14} className="spin" color="var(--blue)" /><span className="mono">Building today's brief…</span>
    </div>
  );

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const closingSoon = d.deals.filter((x) => { const n = daysUntil(x.closeDate); return n != null && n >= 0 && n <= 14; });
  const italyDays = daysUntil("2026-07-05");
  const chColor = { email: "var(--blue)", linkedin: "var(--purple)", phone: "var(--amber)", manual: "var(--text-sec)" };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={17} color="var(--blue)" />
        </div>
        <div className="display" style={{ fontSize: 22, fontWeight: 800 }}>Morning Brief</div>
        <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-sec)" }}>{dateLabel} · revenue-weighted</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 18 }}>Click any line to expand the exact next move, the ready text, and the contact's details.</div>

      <Section icon={Mail} title="Replies to handle first (4h SLA)" count={d.replies.length || "none"}>
        {d.replies.length === 0 ? (
          <div className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>None logged. The orchestrator records replies here when it runs against Gmail.</div>
        ) : d.replies.map((r) => (
          <div key={"r" + r.id} style={{ padding: "8px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--red-dim)", marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.title}</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 2 }}>{r.date} · {r.description}</div>
            {r.contactId && d.contactById[r.contactId] && <ContactActions c={d.contactById[r.contactId]} />}
          </div>
        ))}
      </Section>

      <Section icon={Activity} title="Cadence due today" count={d.cadence.length}>
        {d.cadence.length === 0 ? <div className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>Nothing due.</div> :
          d.cadence.map((c) => {
            const id = "c" + c.enrollment_id;
            const contact = d.contactById[c.contact_id];
            const v = c.variables || {};
            return (
              <Row key={id} open={openId === id} onToggle={() => toggle(id)}
                left={<span className="tag" style={{ color: chColor[c.next_channel] || "var(--text-sec)", background: "var(--bg-el)", border: "1px solid var(--border)" }}>{c.next_channel}</span>}
                title={<>{c.name} <span style={{ color: "var(--text-sec)", fontWeight: 400 }}>· {c.co}</span></>}
                sub={`${c.entry_type} · ${c.next_action}`}>
                <div style={{ fontSize: 12.5, color: "var(--text)", marginBottom: 2 }}><b>What to do:</b> {c.next_action}</div>
                <DraftBlock subject={v.subject} draft={v.draft} email={contact?.email} />
                <ContactActions c={contact} />
              </Row>
            );
          })}
      </Section>

      <Section icon={Target} title="Do today (by score)" count={d.tasks.length}>
        {d.tasks.map((t) => {
          const id = "t" + t.id;
          const contact = t.contactId ? d.contactById[t.contactId] : null;
          const notes = d.notesById[t.id];
          return (
            <Row key={id} open={openId === id} onToggle={() => toggle(id)}
              left={<span className="mono" style={{ fontSize: 10, color: "var(--blue)", minWidth: 58 }}>{Number(t.score).toLocaleString()}</span>}
              title={t.title}
              sub={`${t.category || "task"}${t.dealId ? " · deal" : ""}`}>
              {notes ? <div style={{ fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}><b>What to do:</b> {notes}</div>
                : <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>No detail on this task.</div>}
              {contact ? <ContactActions c={contact} />
                : t.dealId ? <div style={{ marginTop: 8 }}><button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); openRecord("deal", t.dealId); }}><Target size={12} />Open deal</button></div> : null}
            </Row>
          );
        })}
        <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8 }}>Old overdue items score high too — triage stale ones so they stop topping the list.</div>
      </Section>

      <Section icon={Target} title="Pipeline" count={d.deals.length}>
        {d.deals.map((x) => (
          <div key={"d" + x.id} onClick={() => openRecord("deal", x.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", marginBottom: 5, cursor: "pointer" }}>
            <span className="mono" style={{ fontSize: 12, color: "var(--green)", minWidth: 70 }}>{fmt$(x.value)}</span>
            <div style={{ flex: 1, fontSize: 13 }}>{x.name}</div>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>{x.stage} · {x.probability}%</span>
          </div>
        ))}
      </Section>

      <Section icon={Calendar} title="Heads-up">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {closingSoon.map((x) => (
            <div key={"h" + x.id} className="mono" style={{ fontSize: 12, color: "var(--amber)", display: "flex", gap: 6, alignItems: "center" }}>
              <AlertCircle size={12} /> {x.name} closes {x.closeDate} ({daysUntil(x.closeDate)}d)
            </div>
          ))}
          {italyDays > 0 && italyDays <= 30 && (
            <div className="mono" style={{ fontSize: 12, color: "var(--amber)", display: "flex", gap: 6, alignItems: "center" }}>
              <AlertCircle size={12} /> Italy OOO 7/5–7/12 in {italyDays} days — close what you can before you fly.
            </div>
          )}
          {closingSoon.length === 0 && !(italyDays > 0 && italyDays <= 30) && (
            <div className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>Nothing time-critical.</div>
          )}
        </div>
      </Section>
    </div>
  );
}

export default MorningBriefView;
