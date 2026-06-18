import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Loader, Pause, Play, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const STOP_STATUSES = ["TOKEN_BUDGET", "MAX_TURNS", "PAUSED", "NO_TOOLS", "TOOLS_FAIL"];

export function VantacaControlsView() {
  const [controls, setControls] = useState(null);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data: c } = await supabase.from("vantaca_controls").select("*").eq("id", 1).maybeSingle();
    const { data: a } = await supabase.from("vantaca_audit").select("*").order("ts", { ascending: false }).limit(60);
    setControls(c || null);
    if (c) setDraft({ max_turns: c.max_turns, token_budget: c.token_budget, tool_result_cap: c.tool_result_cap });
    setAudit(a || []);
    setLoading(false);
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

  return (
    <div style={{ padding: 28, maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Vantaca Controls</h2>
          <p className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>Scott Management &middot; Slack bot audit &amp; cost guardrails</p>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: "6px 10px" }} onClick={load} disabled={loading}>
          {loading ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />} Refresh
        </button>
      </div>

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)" }}>TODAY COST</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 800, color: "var(--blue)" }}>${todayCost.toFixed(2)}</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>{todayRows.length} requests</div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)" }}>RECENT (60)</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 800 }}>${recentCost.toFixed(2)}</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>{audit.length} requests</div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)" }}>STOPPED</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 800, color: "var(--amber)" }}>{stoppedCount}</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>over-budget / capped</div>
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

      <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent requests</div>
      <div className="card" style={{ padding: 8, maxHeight: 440, overflowY: "auto" }}>
        {audit.length === 0 && <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", padding: 10 }}>No activity yet.</div>}
        {audit.map((r) => {
          const stopped = STOP_STATUSES.includes(r.status);
          const wr = Array.isArray(r.writes) ? r.writes : [];
          return (
            <div key={r.id} className="card-el" style={{ padding: "10px 12px", marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.question || "(no text)"}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--blue)", flexShrink: 0 }}>${(Number(r.cost_usd) || 0).toFixed(3)}</span>
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span>{(r.ts || "").replace("T", " ").slice(0, 16)}</span>
                <span>{r.turns ?? "?"} steps</span>
                <span style={{ color: stopped ? "var(--amber)" : "var(--text-sec)" }}>{r.status}</span>
                {Array.isArray(r.tools) && r.tools.length > 0 && <span>tools: {r.tools.length}</span>}
                {r.source && <span>{r.source}</span>}
              </div>
              {wr.map((w, i) => (
                <div key={i} className="mono" style={{ fontSize: 10, marginTop: 4, display: "flex", alignItems: "center", gap: 6, color: w.verified === true ? "var(--green)" : "var(--red)" }}>
                  {w.verified === true ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {w.tool} &middot; {w.verified === true ? "verified" : "NOT verified"}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
