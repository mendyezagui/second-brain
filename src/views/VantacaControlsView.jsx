import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Loader, Pause, Play, CheckCircle, XCircle, ChevronRight, ChevronDown, Server, Database, BookOpen, BarChart2, Users, Zap, Bell, ExternalLink } from "lucide-react";
import { supabase } from "../lib/supabase";

const STOP_STATUSES = ["TOKEN_BUDGET", "MAX_TURNS", "PAUSED", "NO_TOOLS", "TOOLS_FAIL"];
const DD_COLORS = { OK: "var(--green)", Alert: "var(--red)", Warn: "var(--amber)", "No Data": "var(--text-dim)", Skipped: "var(--text-dim)", Unknown: "var(--text-dim)" };

function Collapsible({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        {Icon && <Icon size={15} color="var(--blue)" />}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{title}</span>
        {open ? <ChevronDown size={15} color="var(--text-sec)" /> : <ChevronRight size={15} color="var(--text-sec)" />}
      </button>
      {open && <div style={{ padding: "0 14px 14px", fontSize: 12, color: "var(--text-sec)", lineHeight: 1.65 }}>{children}</div>}
    </div>
  );
}

const Pill = ({ kind }) => {
  const c = kind === "READ" ? "var(--green)" : kind === "WRITE" ? "var(--amber)" : "var(--red)";
  return <span className="mono" style={{ fontSize: 9, color: c, background: `${c}18`, border: `1px solid ${c}30`, borderRadius: 4, padding: "1px 5px", marginRight: 6 }}>{kind}</span>;
};

const EP = ({ kind, name, desc }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 5 }}>
    <Pill kind={kind} />
    <span style={{ fontSize: 11.5 }}><span className="mono" style={{ color: "var(--text)" }}>{name}</span>{desc ? <span style={{ color: "var(--text-dim)" }}> &mdash; {desc}</span> : null}</span>
  </div>
);

const Stat = ({ label, value, sub, color }) => (
  <div className="card-el" style={{ padding: "8px 10px" }}>
    <div className="mono" style={{ fontSize: 9, color: "var(--text-sec)" }}>{label}</div>
    <div style={{ fontSize: 16, fontWeight: 800, color: color || "var(--text)" }}>{value}</div>
    {sub != null && <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)" }}>{sub}</div>}
  </div>
);

const MiniBars = ({ series, max, color }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56 }}>
    {series.map((d, i) => (
      <div key={i} title={d.title} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ height: `${Math.round((d.v / max) * 100)}%`, minHeight: d.v > 0 ? 3 : 0, background: color, borderRadius: "2px 2px 0 0", transition: "height .2s" }} />
      </div>
    ))}
  </div>
);

function MonitorsPanel({ data }) {
  const alerting = data && data.ok && (data.monitors || []).filter((m) => m.status === "Alert" || m.status === "Warn");
  return (
    <div className="card" style={{ padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Bell size={15} color={alerting && alerting.length ? "var(--red)" : "var(--blue)"} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>Monitors &amp; alerts</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: "auto" }}>Datadog{data && data.site ? " · " + data.site : ""}</span>
      </div>
      {!data ? (
        <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>Loading…</div>
      ) : data.configured === false ? (
        <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", lineHeight: 1.6 }}>Datadog isn't connected yet. Add <span style={{ color: "var(--text)" }}>DD_API_KEY</span> and <span style={{ color: "var(--text)" }}>DD_APP_KEY</span> to the Vercel project env, then redeploy.</div>
      ) : data.ok === false ? (
        <div className="mono" style={{ fontSize: 11, color: "var(--red)" }}>Datadog error: {data.error}</div>
      ) : (data.monitors || []).length === 0 ? (
        <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>No Vantaca monitors found yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.monitors.map((m) => {
            const c = DD_COLORS[m.status] || "var(--text-dim)";
            return (
              <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, textDecoration: "none", color: "inherit", background: "var(--bg)" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}66`, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  {m.message && <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.message}</div>}
                </div>
                <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: c, flexShrink: 0 }}>{String(m.status).toUpperCase()}</span>
                <ExternalLink size={12} color="var(--text-dim)" style={{ flexShrink: 0 }} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function VantacaControlsView() {
  const [controls, setControls] = useState(null);
  const [audit, setAudit] = useState([]);
  const [stats, setStats] = useState([]);
  const [monitors, setMonitors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({});
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: c } = await supabase.from("vantaca_controls").select("*").eq("id", 1).maybeSingle();
    const { data: a } = await supabase.from("vantaca_audit").select("*").order("ts", { ascending: false }).limit(80);
    const { data: big } = await supabase.from("vantaca_audit").select("ts,slack_user,source,status,cost_usd,turns,in_tok,out_tok,tools,writes").order("ts", { ascending: false }).limit(1000);
    setControls(c || null);
    if (c) setDraft({ max_turns: c.max_turns, token_budget: c.token_budget, tool_result_cap: c.tool_result_cap });
    setAudit(a || []);
    setStats(big || []);
    setLoading(false);
    // DataDog monitor status (via the server-side proxy) — never blocks the page.
    try {
      const dd = await fetch("/api/datadog").then((r) => r.json());
      setMonitors(dd);
    } catch {
      setMonitors({ ok: false, configured: false, error: "unreachable" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setPaused = async (v) => {
    setSaving(true);
    await supabase.from("vantaca_controls").update({ paused: v, updated_at: new Date().toISOString(), updated_by: "second-brain" }).eq("id", 1);
    await load();
    setSaving(false);
  };

  const saveBudgets = async () => {
    setSaving(true);
    await supabase.from("vantaca_controls").update({
      max_turns: Number(draft.max_turns) || 10,
      token_budget: Number(draft.token_budget) || 150000,
      tool_result_cap: Number(draft.tool_result_cap) || 24000,
      updated_at: new Date().toISOString(),
      updated_by: "second-brain",
    }).eq("id", 1);
    await load();
    setSaving(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayRows = audit.filter((r) => (r.ts || "").slice(0, 10) === today);
  const todayCost = todayRows.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
  const recentCost = audit.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
  const stoppedCount = audit.filter((r) => STOP_STATUSES.includes(r.status)).length;
  const paused = !!controls?.paused;

  // ---- analytics over the wider window (up to 1000 requests) ----
  const big = stats;
  const dayKeys = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10); });
  const byDay = Object.fromEntries(dayKeys.map((d) => [d, { cost: 0, n: 0 }]));
  big.forEach((r) => { const d = (r.ts || "").slice(0, 10); if (byDay[d]) { byDay[d].cost += Number(r.cost_usd) || 0; byDay[d].n += 1; } });
  const maxDayCost = Math.max(...dayKeys.map((d) => byDay[d].cost), 0.0001);
  const maxDayN = Math.max(...dayKeys.map((d) => byDay[d].n), 1);

  const people = {};
  big.forEach((r) => { const k = r.slack_user || "(unknown)"; const p = people[k] || (people[k] = { n: 0, cost: 0, writes: 0, wok: 0 }); p.n += 1; p.cost += Number(r.cost_usd) || 0; const wr = Array.isArray(r.writes) ? r.writes : []; p.writes += wr.length; p.wok += wr.filter((w) => w.verified === true).length; });
  const peopleArr = Object.entries(people).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.cost - a.cost);

  const sources = {};
  big.forEach((r) => { const k = r.source || "?"; sources[k] = (sources[k] || 0) + 1; });
  const sourceArr = Object.entries(sources).sort((a, b) => b[1] - a[1]);

  const toolCount = {};
  big.forEach((r) => { (Array.isArray(r.tools) ? r.tools : []).forEach((t) => { toolCount[t] = (toolCount[t] || 0) + 1; }); });
  const topTools = Object.entries(toolCount).sort((a, b) => b[1] - a[1]).slice(0, 12);

  const okN = big.filter((r) => r.status === "ok").length;
  const stoppedN = big.filter((r) => STOP_STATUSES.includes(r.status)).length;
  const errN = big.length - okN - stoppedN;
  const totalWrites = big.reduce((s, r) => s + (Array.isArray(r.writes) ? r.writes.length : 0), 0);
  const okWrites = big.reduce((s, r) => s + (Array.isArray(r.writes) ? r.writes.filter((w) => w.verified === true).length : 0), 0);
  const writeRate = totalWrites ? Math.round((okWrites / totalWrites) * 100) : null;
  const totalCost = big.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
  const avgCost = big.length ? totalCost / big.length : 0;
  const avgTurns = big.length ? big.reduce((s, r) => s + (Number(r.turns) || 0), 0) / big.length : 0;
  const maxTurns = big.reduce((m, r) => Math.max(m, Number(r.turns) || 0), 0);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Vantaca Controls</h2>
          <p className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>Scott Management &middot; Slack bot audit &amp; cost guardrails</p>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: "6px 10px" }} onClick={load} disabled={loading}>
          {loading ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />} Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* LEFT: live control + audit */}
        <div style={{ flex: "1 1 520px", minWidth: 0 }}>
          <div className="card" style={{ padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: paused ? "var(--red)" : "var(--green)", boxShadow: paused ? "0 0 8px rgba(220,38,38,0.4)" : "0 0 8px rgba(5,150,105,0.4)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{loading ? "Loading..." : paused ? "Bot is PAUSED" : "Bot is LIVE"}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 2 }}>{paused ? "New Slack requests are refused" : "Answering Slack requests normally"}</div>
            </div>
            {paused ? (
              <button className="btn btn-blue" style={{ background: "var(--green)" }} onClick={() => setPaused(false)} disabled={saving}>
                {saving ? <Loader size={13} className="spin" /> : <Play size={13} />} Resume
              </button>
            ) : (
              <button className="btn btn-danger" onClick={() => setPaused(true)} disabled={saving}>
                {saving ? <Loader size={13} className="spin" /> : <Pause size={13} />} Pause
              </button>
            )}
          </div>

          <MonitorsPanel data={monitors} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
            <div className="card" style={{ padding: "14px 16px" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)" }}>TODAY COST</div>
              <div className="display" style={{ fontSize: 24, fontWeight: 800, color: "var(--blue)" }}>${todayCost.toFixed(2)}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>{todayRows.length} requests</div>
            </div>
            <div className="card" style={{ padding: "14px 16px" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)" }}>RECENT (80)</div>
              <div className="display" style={{ fontSize: 24, fontWeight: 800 }}>${recentCost.toFixed(2)}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>{audit.length} requests</div>
            </div>
            <div className="card" style={{ padding: "14px 16px" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)" }}>STOPPED</div>
              <div className="display" style={{ fontSize: 24, fontWeight: 800, color: "var(--amber)" }}>{stoppedCount}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>over-budget / capped</div>
            </div>
          </div>

          {/* USAGE DASHBOARD */}
          <div className="card" style={{ padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <BarChart2 size={15} color="var(--blue)" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Usage dashboard</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: "auto" }}>last {big.length} requests</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "12px 0" }}>
              <Stat label="TOTAL COST" value={"$" + totalCost.toFixed(2)} />
              <Stat label="AVG / REQ" value={"$" + avgCost.toFixed(3)} />
              <Stat label="AVG STEPS" value={avgTurns.toFixed(1)} sub={"max " + maxTurns} color={maxTurns >= (controls?.max_turns || 10) ? "var(--amber)" : undefined} />
              <Stat label="WRITE OK" value={writeRate == null ? "--" : writeRate + "%"} sub={okWrites + "/" + totalWrites} color={writeRate != null && writeRate < 100 ? "var(--red)" : "var(--green)"} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 6 }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 6 }}>COST / DAY (14d)</div>
                <MiniBars series={dayKeys.map((d) => ({ v: byDay[d].cost, title: d + ": $" + byDay[d].cost.toFixed(3) }))} max={maxDayCost} color="var(--blue)" />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 6 }}>REQUESTS / DAY (14d)</div>
                <MiniBars series={dayKeys.map((d) => ({ v: byDay[d].n, title: d + ": " + byDay[d].n + " req" }))} max={maxDayN} color="var(--purple)" />
              </div>
            </div>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, display: "flex", justifyContent: "space-between" }}><span>{dayKeys[0]}</span><span>{dayKeys[dayKeys.length - 1]}</span></div>

            <div style={{ marginTop: 16 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><Users size={11} /> WHO'S USING IT</div>
              {peopleArr.length === 0 ? <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>No data yet.</div> :
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {peopleArr.slice(0, 8).map((p) => {
                    const pct = Math.round((p.cost / (totalCost || 1)) * 100);
                    return (
                      <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                        <span style={{ flex: "0 0 130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{p.name}</span>
                        <div style={{ flex: 1, height: 8, background: "var(--bg-el)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: pct + "%", height: "100%", background: "var(--blue)" }} />
                        </div>
                        <span className="mono" style={{ flex: "0 0 120px", textAlign: "right", color: "var(--text-sec)" }}>{p.n} req &middot; ${p.cost.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 6 }}>BY SOURCE</div>
                {sourceArr.length === 0 ? <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>none</div> :
                  sourceArr.map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ textTransform: "capitalize" }}>{k}</span><span className="mono" style={{ color: "var(--text-sec)" }}>{v}</span>
                    </div>
                  ))}
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 6 }}>OUTCOMES</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}><span style={{ color: "var(--green)" }}>OK</span><span className="mono">{okN}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}><span style={{ color: "var(--amber)" }}>Stopped (guardrail)</span><span className="mono">{stoppedN}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: "var(--red)" }}>Errors</span><span className="mono">{errN}</span></div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><Zap size={11} /> TOP TOOLS</div>
              {topTools.length === 0 ? <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>none</div> :
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {topTools.map(([t, n]) => <span key={t} className="mono" style={{ fontSize: 10, background: "var(--bg-el)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>{t} <span style={{ color: "var(--blue)" }}>{n}</span></span>)}
                </div>}
            </div>
          </div>

          <div className="card" style={{ padding: "16px 20px", marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Limits (per request)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              <label className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>Max steps
                <input className="input" type="number" value={draft.max_turns ?? ""} onChange={(e) => setDraft((d) => ({ ...d, max_turns: e.target.value }))} style={{ marginTop: 4 }} />
              </label>
              <label className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>Token budget
                <input className="input" type="number" value={draft.token_budget ?? ""} onChange={(e) => setDraft((d) => ({ ...d, token_budget: e.target.value }))} style={{ marginTop: 4 }} />
              </label>
              <label className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>Tool-result cap
                <input className="input" type="number" value={draft.tool_result_cap ?? ""} onChange={(e) => setDraft((d) => ({ ...d, tool_result_cap: e.target.value }))} style={{ marginTop: 4 }} />
              </label>
            </div>
            <button className="btn btn-blue" style={{ marginTop: 12 }} onClick={saveBudgets} disabled={saving}>
              {saving ? <Loader size={13} className="spin" /> : <CheckCircle size={13} />} Save limits
            </button>
            {controls?.updated_at && <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8 }}>updated {new Date(controls.updated_at).toLocaleString()} {controls.updated_by ? "by " + controls.updated_by : ""}</div>}
          </div>

          <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent requests &middot; click to expand</div>
          <div className="card" style={{ padding: 8 }}>
            {audit.length === 0 && <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", padding: 10 }}>No activity yet.</div>}
            {audit.map((r) => {
              const stopped = STOP_STATUSES.includes(r.status);
              const wr = Array.isArray(r.writes) ? r.writes : [];
              const tools = Array.isArray(r.tools) ? r.tools : [];
              const isOpen = expanded === r.id;
              const failedWrite = wr.some((w) => w.verified !== true || w.isError);
              const dot = r.status === "ok" && !failedWrite ? "var(--green)" : stopped ? "var(--amber)" : "var(--red)";
              return (
                <div key={r.id} className="card-el" style={{ padding: 0, marginBottom: 6, overflow: "hidden" }}>
                  <button onClick={() => setExpanded(isOpen ? null : r.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.question || "(no text)"}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--blue)", flexShrink: 0 }}>${(Number(r.cost_usd) || 0).toFixed(3)}</span>
                    {isOpen ? <ChevronDown size={14} color="var(--text-sec)" /> : <ChevronRight size={14} color="var(--text-sec)" />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: "4px 14px 14px", borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "4px 16px", fontSize: 11, marginTop: 10 }}>
                        <div><span className="mono" style={{ color: "var(--text-dim)" }}>Who: </span>{r.slack_user || "(unknown)"}</div>
                        <div><span className="mono" style={{ color: "var(--text-dim)" }}>When: </span>{r.ts ? new Date(r.ts).toLocaleString() : "?"}</div>
                        <div><span className="mono" style={{ color: "var(--text-dim)" }}>Source: </span>{r.source || "?"}</div>
                        <div><span className="mono" style={{ color: "var(--text-dim)" }}>Status: </span><span style={{ color: stopped ? "var(--amber)" : (r.status === "ok" ? "var(--green)" : "var(--red)"), fontWeight: 600 }}>{r.status}</span></div>
                        <div><span className="mono" style={{ color: "var(--text-dim)" }}>Steps: </span>{r.turns ?? "?"}</div>
                        <div><span className="mono" style={{ color: "var(--text-dim)" }}>Duration: </span>{r.ms != null ? (r.ms / 1000).toFixed(1) + "s" : "?"}</div>
                        <div><span className="mono" style={{ color: "var(--text-dim)" }}>Tokens: </span>in {r.in_tok ?? 0} / out {r.out_tok ?? 0} / cache {r.cache_r ?? 0}</div>
                        <div><span className="mono" style={{ color: "var(--text-dim)" }}>Cost: </span>${(Number(r.cost_usd) || 0).toFixed(4)}</div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 4 }}>TOOLS CALLED ({tools.length})</div>
                        {tools.length === 0 ? <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>none</div> :
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{tools.map((t, i) => <span key={i} className="mono" style={{ fontSize: 10, background: "var(--bg-el)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px" }}>{t}</span>)}</div>}
                      </div>

                      {wr.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 4 }}>WRITES ({wr.length})</div>
                          {wr.map((w, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, marginBottom: 4, color: w.verified === true ? "var(--green)" : "var(--red)" }}>
                              {w.verified === true ? <CheckCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} />}
                              <span><span className="mono">{w.tool}</span> &middot; {w.verified === true ? "verified" : (w.isError ? "FAILED (error)" : "NOT verified")}{w.args ? <span style={{ color: "var(--text-dim)" }}> &middot; {JSON.stringify(w.args).slice(0, 120)}</span> : null}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: 10 }}>
                        <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 4 }}>AI RESPONSE / ASSUMPTIONS</div>
                        <div style={{ fontSize: 11, color: "var(--text)", whiteSpace: "pre-wrap", background: "var(--bg-el)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", maxHeight: 200, overflowY: "auto" }}>{r.answer || "(not captured for this request)"}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: reference panels (all collapsed by default) */}
        <div style={{ flex: "0 1 340px", minWidth: 280 }}>
          <Collapsible icon={Server} title="Where this lives &amp; how it's built">
            <p><b>Slack bot</b> (Socket Mode) runs as <span className="mono">vantaca-slack</span> on a DigitalOcean VPS (134.209.126.217), alongside the <span className="mono">vantaca-mcp</span> server (:8787) + a cloudflared tunnel at <span className="mono">vantaca.aventary.com</span>.</p>
            <p style={{ marginTop: 8 }}><b>Brain:</b> <span className="mono">slack-bot/vantaca-claude.mjs</span> runs Claude (claude-sonnet-4-6) in an in-process tool loop &mdash; it calls the MCP server directly on localhost (no hosted connector), which talks to the <b>Vantaca Standard API v3.7.0</b>.</p>
            <p style={{ marginTop: 8 }}><b>This page</b> reads/writes two Supabase tables in the Second Brain project: <span className="mono">vantaca_controls</span> (pause + budgets) and <span className="mono">vantaca_audit</span> (every request). The bot reads controls before each request and writes an audit row after &mdash; that's what powers the Usage dashboard &amp; Recent requests.</p>

            <p style={{ marginTop: 12, color: "var(--text)", fontWeight: 600 }}>Datadog monitoring (site: us5)</p>
            <p style={{ marginTop: 4 }}>Three layers, so a runaway/expensive request can't go unnoticed:</p>
            <ol style={{ margin: "6px 0 0 16px", padding: 0 }}>
              <li style={{ marginBottom: 6 }}><b>Collect</b> &mdash; the Datadog Agent on the VPS tails the <span className="mono">vantaca-slack</span> + <span className="mono">vantaca-mcp</span> journald logs. Every request prints an <span className="mono">AUDIT</span> line (cost, steps, tools, who); a log pipeline parses that JSON into fields like <span className="mono">@costUSD</span> and <span className="mono">@turns</span>.</li>
              <li style={{ marginBottom: 6 }}><b>Alert</b> &mdash; Datadog monitors watch those logs and notify on a runaway loop / budget stop (<span className="mono">MAX_TURNS</span>, <span className="mono">TOKEN_BUDGET</span>, <span className="mono">TOOLS_FAIL</span>) and on a single-request cost spike (&gt; $0.50).</li>
              <li><b>Show</b> &mdash; the <b>Monitors &amp; alerts</b> panel on the left reads live monitor status through the <span className="mono">/api/datadog</span> serverless proxy. The Datadog keys live only in Vercel env (server-side) &mdash; never in the browser.</li>
            </ol>
            <p style={{ marginTop: 8 }}><b>Why two data sources:</b> usage &amp; cost come from Supabase (instant, no keys client-side); live alert state + log history + VPS host metrics come from Datadog.</p>

            <p style={{ marginTop: 12 }}><b>Code &amp; deploy:</b> <span className="mono">mendyezagui/vantaca-mcp</span> (bot + MCP) &mdash; deploy = edit on the VPS + restart the service. <span className="mono">mendyezagui/second-brain</span> (this page + <span className="mono">/api/datadog</span>) &mdash; deploy = push to main &rarr; Vercel.</p>
          </Collapsible>

          <Collapsible icon={Database} title="Endpoints (read / write)">
            <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", margin: "2px 0 6px" }}>READS</div>
            <EP kind="READ" name="managerQueue" desc="prioritized queue for a manager" />
            <EP kind="READ" name="agedWorkOrders" desc="open WOs older than N days + owner" />
            <EP kind="READ" name="getWorkOrderList / getViolationList / ARCList" />
            <EP kind="READ" name="getActionItem" desc="single item + notes" />
            <EP kind="READ" name="actionTypeSteps / getActionTypeList" desc="step IDs" />
            <EP kind="READ" name="getHomeownerAccountInfo / getHomeownerTransactions / homeownerAssessment" />
            <EP kind="READ" name="associationList / getAssociationDetails / getProviderList" />
            <EP kind="READ" name="searchHomeowners / getDocument / attachmentList / getCommPreference" />
            <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", margin: "10px 0 6px" }}>WRITES</div>
            <EP kind="WRITE" name="stepItem" desc="step + add note, re-reads to verify" />
            <EP kind="WRITE" name="createWorkOrder / violationCreate / createARC" />
            <EP kind="WRITE" name="createStandardActionItem / updateHomeowner" />
            <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", margin: "10px 0 6px" }}>NOT AVAILABLE</div>
            <EP kind="NONE" name="AP / invoices" desc="403 &mdash; API user lacks scope" />
            <EP kind="NONE" name="follow-up / due date edits" desc="no update endpoint in the API" />
          </Collapsible>

          <Collapsible icon={BookOpen} title="Knowledge base (answer rules)">
            <p>The bot answers under a strict system prompt:</p>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li style={{ marginBottom: 6 }}><b>Real data only.</b> Never invent an XN, name, balance, vendor, or status &mdash; if no tool was called, it has no data.</li>
              <li style={{ marginBottom: 6 }}><b>Writes are grounded.</b> It must look an item up first, and after any write it re-reads to confirm before saying "done" (verified flag).</li>
              <li style={{ marginBottom: 6 }}><b>Lists don't fan out.</b> Portfolio work-order questions use <span className="mono">agedWorkOrders</span> (one call), not per-association loops.</li>
              <li style={{ marginBottom: 6 }}><b>Steps/notes</b> go through <span className="mono">stepItem</span> (verified), never the raw endpoint.</li>
              <li style={{ marginBottom: 6 }}><b>Managers</b> map to associations via <span className="mono">managerQueue</span> (the API has no manager field).</li>
              <li style={{ marginBottom: 6 }}><b>Honest limits.</b> AP/invoices and follow-up-date edits aren't possible via the API &mdash; it says so instead of pretending.</li>
              <li><b>Format</b> for Slack, lead with the answer, ask when ambiguous.</li>
            </ul>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
