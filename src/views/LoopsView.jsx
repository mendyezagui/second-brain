import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, Clock, Loader, Play, Radio, RefreshCw, X } from "lucide-react";
import { supabase, SUPA_URL, SUPA_KEY } from "../lib/supabase";

// Loop-of-Loops control panel.
// Reads the loops / loop_runs / loop_actions / loop_signals tables that the
// `loops-dispatcher` Edge Function writes to. "Run now" invokes that function;
// the daily pg_cron schedule runs it unattended. Approvals are the
// human-in-the-loop boundary: nothing outbound happens until you approve here.

const statusColor = (s) =>
  ({ success: "var(--green)", running: "var(--amber)", error: "var(--red)", skipped: "var(--text-dim)" }[s] ||
    "var(--text-sec)");

const sevColor = (s) =>
  ({ high: "var(--amber)", critical: "var(--red)" }[s] || "var(--blue)");

const timeAgo = (ts) => {
  if (!ts) return "never";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

const Chip = ({ children, color = "var(--text-sec)" }) => (
  <span className="tag" style={{ color, background: `${color}14`, border: `1px solid ${color}30` }}>{children}</span>
);

export function LoopsView() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [running, setRunning] = useState({});
  const [busy, setBusy] = useState({});
  const [open, setOpen] = useState({});

  const load = async () => {
    try {
      const [loops, runs, actions, signals] = await Promise.all([
        supabase.from("loops").select("*").order("id", { ascending: true }),
        supabase.from("loop_runs").select("*").order("id", { ascending: false }).limit(20),
        supabase.from("loop_actions").select("*").order("id", { ascending: false }).limit(50),
        supabase.from("loop_signals").select("*").order("id", { ascending: false }).limit(30),
      ]);
      if (loops.error) throw loops.error;
      setD({
        loops: loops.data || [],
        runs: runs.data || [],
        actions: actions.data || [],
        signals: signals.data || [],
      });
    } catch (e) { setErr(e.message || String(e)); }
  };

  useEffect(() => { load(); }, []);

  const runNow = async (key) => {
    setRunning((r) => ({ ...r, [key]: true }));
    try {
      await fetch(`${SUPA_URL}/functions/v1/loops-dispatcher`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
        body: JSON.stringify({ loop_key: key }),
      });
    } catch (_e) { /* surfaced via the run log on reload */ }
    await load();
    setRunning((r) => ({ ...r, [key]: false }));
  };

  const toggleEnabled = async (loop) => {
    await supabase.from("loops").update({ enabled: !loop.enabled, modified_at: new Date().toISOString() }).eq("id", loop.id);
    load();
  };

  const decide = async (action, status) => {
    setBusy((b) => ({ ...b, [action.id]: true }));
    const who = (await supabase.auth.getSession())?.data?.session?.user;
    const by = who?.user_metadata?.full_name || who?.email || "user";
    await supabase.from("loop_actions").update({ status, decided_by: by, decided_at: new Date().toISOString() }).eq("id", action.id);
    if (status === "approved" && action.draft?.news_id) {
      await supabase.from("company_news").update({ action_taken: true }).eq("id", action.draft.news_id);
    }
    await load();
    setBusy((b) => ({ ...b, [action.id]: false }));
  };

  if (err) return <div style={{ padding: 24 }} className="mono">Could not load loops: {err}</div>;
  if (!d) return (
    <div style={{ padding: 24, display: "flex", alignItems: "center", gap: 8, color: "var(--text-sec)" }}>
      <Loader size={14} className="spin" color="var(--blue)" /><span className="mono">Loading loops…</span>
    </div>
  );

  const pending = d.actions.filter((a) => a.status === "pending_approval");
  const decided = d.actions.filter((a) => a.status !== "pending_approval").slice(0, 8);
  const lastRunFor = (key) => d.runs.find((r) => r.loop_key === key);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RefreshCw size={17} color="var(--blue)" />
        </div>
        <div className="display" style={{ fontSize: 22, fontWeight: 800 }}>Loops</div>
        {pending.length > 0 && <Chip color="var(--amber)">{pending.length} awaiting approval</Chip>}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 20 }}>
        Recurring jobs with memory that notice each other through signals and hand off work — drafting actions
        that wait for your approval. Each loop runs on a schedule (or on demand) without you driving it.
      </div>

      {/* Approvals inbox */}
      <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8 }}>APPROVALS INBOX</div>
      {pending.length === 0 ? (
        <div className="card" style={{ padding: 16, marginBottom: 22 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>Nothing waiting on you. Drafts from loops will land here for approval.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {pending.map((a) => (
            <div key={a.id} className="card" style={{ padding: 16, borderLeft: "3px solid var(--amber)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <Chip color="var(--amber)">{a.action_type}</Chip>
                <Chip color="var(--text-sec)">via {a.loop_key}</Chip>
                {a.draft?.relevance_score != null && <Chip color="var(--blue)">score {a.draft.relevance_score}/10</Chip>}
                <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-dim)" }}>{timeAgo(a.created_at)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{a.title}</div>
              {a.draft?.subject && (
                <div className="card-el" style={{ padding: 12, marginBottom: 10 }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 4 }}>
                    DRAFT {a.draft.channel === "email" ? "EMAIL" : "MESSAGE"} · NOT SENT
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{a.draft.subject}</div>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{a.draft.body}</div>
                  {a.draft.source_url && (
                    <a href={a.draft.source_url} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontSize: 10, color: "var(--blue)", display: "inline-block", marginTop: 8, textDecoration: "none" }}>
                      source ↗
                    </a>
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-blue" disabled={busy[a.id]} onClick={() => decide(a, "approved")} style={{ padding: "6px 14px", fontSize: 12 }}>
                  {busy[a.id] ? <Loader size={12} className="spin" /> : <Check size={13} />} Approve
                </button>
                <button className="btn btn-ghost" disabled={busy[a.id]} onClick={() => decide(a, "rejected")} style={{ padding: "6px 14px", fontSize: 12 }}>
                  <X size={13} /> Reject
                </button>
                {a.draft?.body && (
                  <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(`${a.draft.subject ? a.draft.subject + "\n\n" : ""}${a.draft.body}`)} style={{ padding: "6px 14px", fontSize: 12 }}>
                    Copy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loops */}
      <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8 }}>LOOPS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        {d.loops.map((loop) => {
          const run = lastRunFor(loop.key);
          const safe = Array.isArray(loop.safe_actions) ? loop.safe_actions : [];
          const pause = Array.isArray(loop.pause_conditions) ? loop.pause_conditions : [];
          return (
            <div key={loop.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: loop.enabled ? "var(--green)" : "var(--text-dim)", flexShrink: 0 }} />
                <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>{loop.name}</div>
                <Chip color={statusColor(loop.last_status)}>{loop.last_status || "never run"}</Chip>
                <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-sec)" }}>
                  <Clock size={10} style={{ verticalAlign: "-1px" }} /> {loop.schedule_cron || "manual"} · ran {timeAgo(loop.last_run_at)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.55, marginBottom: 10 }}>{loop.description}</div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {safe.map((s) => <Chip key={s} color="var(--green)">auto: {s}</Chip>)}
                {pause.map((p) => <Chip key={p} color="var(--amber)">asks: {p}</Chip>)}
              </div>

              {run?.summary && (
                <div className="card-el" style={{ padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "var(--text)", borderLeft: `2px solid ${statusColor(run.status)}` }}>
                  {run.summary}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn btn-blue" disabled={running[loop.key]} onClick={() => runNow(loop.key)} style={{ padding: "6px 14px", fontSize: 12 }}>
                  {running[loop.key] ? <><Loader size={12} className="spin" /> Running…</> : <><Play size={13} /> Run now</>}
                </button>
                <button className="btn btn-ghost" onClick={() => toggleEnabled(loop)} style={{ padding: "6px 14px", fontSize: 12 }}>
                  {loop.enabled ? "Disable" : "Enable"}
                </button>
                <button className="btn btn-ghost" onClick={load} title="Refresh" style={{ padding: "6px 12px", fontSize: 12 }}>
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {d.loops.length === 0 && <div className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>No loops defined yet.</div>}
      </div>

      {/* Signal bus */}
      <div
        className="mono"
        style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        onClick={() => setOpen((o) => ({ ...o, signals: !o.signals }))}
      >
        {open.signals ? <ChevronDown size={12} /> : <ChevronRight size={12} />} SIGNAL BUS ({d.signals.length})
      </div>
      {open.signals && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
          {d.signals.length === 0 && <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>No signals yet.</div>}
          {d.signals.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)" }}>
              <Radio size={12} color={sevColor(s.severity)} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {s.from_loop} → <span style={{ color: "var(--text-sec)", fontWeight: 400 }}>{s.signal_type}</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.payload?.companyName ? `${s.payload.companyName}: ` : ""}{s.payload?.headline || ""}
                </div>
              </div>
              <Chip color={sevColor(s.severity)}>{s.severity}</Chip>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>{timeAgo(s.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Decision history */}
      {decided.length > 0 && (
        <>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 8 }}>RECENT DECISIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {decided.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)" }}>
                <Chip color={a.status === "approved" ? "var(--green)" : a.status === "rejected" ? "var(--red)" : "var(--text-sec)"}>{a.status}</Chip>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>{a.decided_by || ""} · {timeAgo(a.decided_at)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LoopsView;
