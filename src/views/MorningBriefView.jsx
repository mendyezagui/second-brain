import { useEffect, useState } from "react";
import { Sparkles, Loader, AlertCircle, Mail, Activity, Target, Calendar } from "lucide-react";
import { supabase } from "../lib/supabase";

const fmt$ = (n) => (n == null ? "" : "$" + Number(n).toLocaleString());
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysUntil = (d) => {
  if (!d) return null;
  const ms = new Date(d + "T00:00:00").getTime() - new Date(todayStr() + "T00:00:00").getTime();
  return Math.round(ms / 86400000);
};

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

  useEffect(() => {
    (async () => {
      try {
        const t = todayStr();
        const [tasks, cadence, deals, replies] = await Promise.all([
          supabase.from("task_priority_scores").select("*").limit(12),
          supabase.from("cadence_next_actions").select("*").lte("next_action_at", t),
          supabase.from("deals").select('id,name,value,stage,probability,closeDate').not("stage", "in", '("won","lost","closed_lost")').order("value", { ascending: false }),
          supabase.from("events").select("*").eq("event_type", "reply_received").order("date", { ascending: false }).limit(8),
        ]);
        if (tasks.error) throw tasks.error;
        setD({ tasks: tasks.data || [], cadence: cadence.data || [], deals: deals.data || [], replies: replies.data || [] });
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

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={17} color="var(--blue)" />
        </div>
        <div className="display" style={{ fontSize: 22, fontWeight: 800 }}>Morning Brief</div>
        <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-sec)" }}>{dateLabel} · revenue-weighted</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 18 }}>
        Live from Second Brain. Reply detection and drafting run in the orchestrator (Gmail); this view shows everything Second Brain knows.
      </div>

      <Section icon={Mail} title="Replies to handle first (4h SLA)" count={d.replies.length || "none"}>
        {d.replies.length === 0 ? (
          <div className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>None logged. The orchestrator records replies here when it runs against Gmail.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {d.replies.map((r) => (
              <div key={r.id} style={{ padding: "8px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--red-dim)" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.title}</div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 2 }}>{r.date} · {r.description}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Activity} title="Cadence due today" count={d.cadence.length}>
        {d.cadence.length === 0 ? <div className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>Nothing due.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {d.cadence.map((c) => (
              <div key={c.enrollment_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)" }}>
                <span className="tag" style={{ color: "var(--purple)", background: "var(--purple-dim)", border: "1px solid rgba(124,58,237,0.2)" }}>{c.entry_type}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name} <span style={{ color: "var(--text-sec)", fontWeight: 400 }}>· {c.co}</span></div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 2 }}>{c.next_channel} · {c.next_action}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Target} title="Do today (by score)" count={d.tasks.length}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {d.tasks.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)" }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--blue)", minWidth: 64 }}>{Number(t.score).toLocaleString()}</span>
              <div style={{ flex: 1, fontSize: 13 }}>{t.title}</div>
              {t.dealId && <span className="tag" style={{ color: "var(--green)", background: "var(--green-dim)", border: "1px solid rgba(5,150,105,0.2)" }}>deal</span>}
            </div>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8 }}>Old overdue items score high too — triage stale ones so they stop topping the list.</div>
      </Section>

      <Section icon={Target} title="Pipeline" count={d.deals.length}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {d.deals.map((x) => (
            <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)" }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--green)", minWidth: 70 }}>{fmt$(x.value)}</span>
              <div style={{ flex: 1, fontSize: 13 }}>{x.name}</div>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>{x.stage} · {x.probability}%</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Calendar} title="Heads-up">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {closingSoon.map((x) => (
            <div key={x.id} className="mono" style={{ fontSize: 12, color: "var(--amber)", display: "flex", gap: 6, alignItems: "center" }}>
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
