import { useEffect, useState } from "react";
import { Activity, Loader } from "lucide-react";
import { supabase } from "../lib/supabase";

const CH = {
  email:    { c: "var(--blue)",   bg: "var(--blue-dim)" },
  linkedin: { c: "var(--purple)", bg: "var(--purple-dim)" },
  phone:    { c: "var(--amber)",  bg: "var(--amber-dim)" },
  manual:   { c: "var(--text-sec)", bg: "var(--bg-el)" },
};
const chStyle = (ch) => CH[ch] || CH.manual;

export function CadencesView() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [cad, steps, active, enr] = await Promise.all([
          supabase.from("cadences").select("*").order("id", { ascending: true }),
          supabase.from("cadence_steps").select("*").order("cadence_id", { ascending: true }).order("step_no", { ascending: true }),
          supabase.from("cadence_next_actions").select("*"),
          supabase.from("cadence_enrollments").select("cadence_id,status"),
        ]);
        if (cad.error) throw cad.error;
        setD({ cadences: cad.data || [], steps: steps.data || [], active: active.data || [], enr: enr.data || [] });
      } catch (e) { setErr(e.message || String(e)); }
    })();
  }, []);

  if (err) return <div style={{ padding: 24 }} className="mono">Could not load cadences: {err}</div>;
  if (!d) return (
    <div style={{ padding: 24, display: "flex", alignItems: "center", gap: 8, color: "var(--text-sec)" }}>
      <Loader size={14} className="spin" color="var(--blue)" /><span className="mono">Loading cadences…</span>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Activity size={17} color="var(--blue)" />
        </div>
        <div className="display" style={{ fontSize: 22, fontWeight: 800 }}>Cadences</div>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 20 }}>
        How outreach is sequenced by entry type, the strategy behind each track, and who is enrolled right now.
      </div>

      {d.cadences.map((c) => {
        const steps = d.steps.filter((s) => s.cadence_id === c.id);
        const people = d.active.filter((a) => a.entry_type === c.entry_type);
        const counts = d.enr.filter((e) => e.cadence_id === c.id);
        const replied = counts.filter((e) => e.status === "replied").length;
        const completed = counts.filter((e) => e.status === "completed").length;
        return (
          <div key={c.id} className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</div>
              <span className="tag" style={{ color: "var(--blue)", background: "var(--blue-dim)", border: "1px solid rgba(0,119,204,0.18)" }}>{c.entry_type}</span>
              <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-sec)" }}>
                {people.length} active · {replied} replied · {completed} done
              </span>
            </div>

            <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--text)", background: "var(--blue-dim)", borderLeft: "3px solid var(--blue)", padding: "9px 13px", borderRadius: 6, marginBottom: 16 }}>
              {c.strategy || c.description}
            </div>

            <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8 }}>SEQUENCE</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {steps.map((s) => {
                const cs = chStyle(s.channel);
                return (
                  <div key={s.id} className="card-el" style={{ padding: "9px 11px", flex: "1 1 170px", minWidth: 160 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>STEP {s.step_no} · DAY {s.day_offset}</span>
                      <span className="tag" style={{ color: cs.c, background: cs.bg, border: `1px solid ${cs.c}30` }}>{s.channel}</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.45 }}>{s.action}</div>
                  </div>
                );
              })}
            </div>

            <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8 }}>ENROLLED ({people.length})</div>
            {people.length === 0 ? (
              <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>No active enrollments.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {people.map((p) => (
                  <div key={p.enrollment_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {p.name} <span style={{ color: "var(--text-sec)", fontWeight: 400 }}>· {p.co}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 2 }}>
                        step {p.current_step} → next: {p.next_action || "complete"}{p.next_channel ? ` (${p.next_channel})` : ""}
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)", flexShrink: 0 }}>{p.next_action_at || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CadencesView;
