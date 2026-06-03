import { useEffect, useState, useRef } from "react";
import { Phone, RefreshCw, Loader } from "lucide-react";

const API_BASE = "https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/rc-queue-toggle";
const API_KEY = "rmc-toggle-2026-rapidmedical";

const LINE_NAMES = {
  "2148739036": { label: "IDEXX", onName: "AI Forward IDEXX", offName: "IDEXX" },
  "3174440036": { label: "LA County", onName: "AI Forward LA County", offName: "LA County" },
  "3154326036": { label: "Methodist", onName: "AI Forward Methodist", offName: "Nebraska Methodist" },
};
const ROUTE_NAMES = {
  "1011": "AI Forward IDEXX", "1012": "AI Forward LA County", "1016": "AI Forward Methodist",
  "1004": "IDEXX", "1010": "LA County", "1007": "Nebraska Methodist",
};

export function RCControlsView() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [globalBusy, setGlobalBusy] = useState(false);
  const [logs, setLogs] = useState([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const log = (msg, type) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ msg, type, time, id: Date.now() + Math.random() }, ...prev].slice(0, 50));
  };

  const fetchStatus = async () => {
    try {
      log("Checking current state...", "info");
      const resp = await fetch(`${API_BASE}?key=${API_KEY}&action=status`);
      const data = await resp.json();
      if (!mounted.current) return;
      if (data && data.state) {
        setState(data);
        log(`State: ${data.state.toUpperCase()}`, "success");
      } else if (data && data.error) {
        log(`API error: ${data.error}`, "error");
      } else {
        log("Unexpected response format", "error");
      }
    } catch (e) {
      if (mounted.current) log(`Error: ${e.message}`, "error");
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doLine = async (phoneId, action) => {
    if (busy[phoneId] || globalBusy) return;
    setBusy(b => ({ ...b, [phoneId]: true }));
    const info = LINE_NAMES[phoneId] || { label: phoneId };
    log(`${info.label} → switching ${action.toUpperCase()}...`, "info");
    try {
      const resp = await fetch(`${API_BASE}?key=${API_KEY}&action=${action}&phoneId=${phoneId}`);
      const data = await resp.json();
      if (!mounted.current) return;
      (data.results || []).forEach(r => log(`${r.phone} → ${r.target || "unknown"}: ${r.status}`, r.status === "success" ? "success" : "error"));
      if (data.currentState) setState(data.currentState);
    } catch (e) {
      if (mounted.current) {
        log(`Error: ${e.message}`, "error");
        await fetchStatus();
      }
    } finally {
      if (mounted.current) setBusy(b => ({ ...b, [phoneId]: false }));
    }
  };

  const doAll = async (action) => {
    if (globalBusy) return;
    setGlobalBusy(true);
    log(`Switching ALL to ${action.toUpperCase()}...`, "info");
    try {
      const resp = await fetch(`${API_BASE}?key=${API_KEY}&action=${action}`);
      const data = await resp.json();
      if (!mounted.current) return;
      (data.results || []).forEach(r => log(`${r.phone} → ${r.target || "unknown"}: ${r.status}`, r.status === "success" ? "success" : "error"));
      if (data.currentState) setState(data.currentState);
      const allOk = data.results?.every(r => r.status === "success");
      log(allOk ? `All lines switched to ${action.toUpperCase()}` : "Some lines failed — check log", allOk ? "success" : "error");
    } catch (e) {
      if (mounted.current) {
        log(`Error: ${e.message}`, "error");
        await fetchStatus();
      }
    } finally {
      if (mounted.current) setGlobalBusy(false);
    }
  };

  const dotColor = !state ? "var(--blue)" : state.state === "on" ? "var(--green)" : state.state === "off" ? "var(--text-dim)" : "var(--amber)";
  const dotShadow = !state ? "" : state.state === "on" ? "0 0 8px rgba(5,150,105,0.4)" : state.state === "mixed" ? "0 0 8px rgba(217,119,6,0.4)" : "";

  return (
    <div style={{ padding: 28, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>RC Controls</h2>
          <p className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>Rapid Medical — RingCentral AI Queue Router</p>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: "6px 10px" }} onClick={fetchStatus} disabled={loading}>
          {loading ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />} Refresh
        </button>
      </div>

      {/* Status bar */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: dotColor, boxShadow: dotShadow, flexShrink: 0, animation: loading ? "blink 1.2s ease-in-out infinite" : "none" }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {loading ? "Checking..." : state?.state === "on" ? "AI Forwarding is ON" : state?.state === "off" ? "AI Forwarding is OFF" : "Mixed State"}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 2 }}>
            {loading ? "Connecting to RingCentral" : state?.state === "on" ? "All calls routing to AI Forward queues" : state?.state === "off" ? "All calls routing to normal queues" : "Lines routed independently"}
          </div>
        </div>
      </div>

      {/* All lines buttons */}
      <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>All Lines</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button className="btn btn-blue" style={{ flex: 1, justifyContent: "center", background: "var(--green)", fontSize: 13 }} onClick={() => doAll("on")} disabled={globalBusy || loading}>
          {globalBusy ? <Loader size={13} className="spin" /> : null} All ON
        </button>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 13 }} onClick={() => doAll("off")} disabled={globalBusy || loading}>
          {globalBusy ? <Loader size={13} className="spin" /> : null} All OFF
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
              <span className="tag" style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
                {isBusy ? "Switching..." : routeName}
              </span>
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

      {/* Activity log */}
      <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8, marginTop: 20, textTransform: "uppercase", letterSpacing: "0.5px" }}>Activity Log</div>
      <div className="card-el" style={{ padding: "10px 14px", maxHeight: 140, overflowY: "auto" }}>
        {logs.length === 0 && <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>No activity yet</div>}
        {logs.map(l => (
          <div key={l.id} className="mono" style={{ fontSize: 11, lineHeight: 1.8, color: l.type === "success" ? "var(--green)" : l.type === "error" ? "var(--red)" : "var(--blue)" }}>
            [{l.time}] {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
