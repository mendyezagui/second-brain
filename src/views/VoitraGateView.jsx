import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

export const VOITRA_GATE_URL = "https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/voitra-gate";

export const VOITRA_ADMIN_URL = "https://xwacfwagyhgbbhefecdt.supabase.co/functions/v1/voitra-admin";

export const VoitraGateView = () => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [err, setErr] = useState(null);

  const refresh = async () => {
    try {
      setErr(null);
      const r = await fetch(VOITRA_GATE_URL + "?_=" + Date.now());
      const d = await r.json();
      setState(d);
    } catch (e) {
      setErr("Couldn't reach gate: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  const act = async (action) => {
    setPending(action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(VOITRA_ADMIN_URL + "?do=" + action, {
        headers: session ? { Authorization: "Bearer " + session.access_token } : {},
      });
      await refresh();
    } catch (e) {
      setErr("Action failed: " + (e?.message || e));
    }
    setPending(null);
  };

  const fmtTime = (iso) => iso ? new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "America/Los_Angeles"
  }) + " PT" : null;

  const fmtHour = (h) => {
    const h12 = ((h + 11) % 12) + 1;
    return h12 + (h < 12 ? "am" : "pm");
  };

  const reasonLabel = {
    auto_open: "Open â following the schedule",
    auto_nightly: "Closed for the nightly window (11pmâ6am PT)",
    auto_shabbat: "Closed for Shabbat",
    manual_on: "Forced ON (manual override)",
    manual_off: "Paused manually",
  };

  const enabled = state?.enabled;
  const statusColor = enabled ? "var(--green)" : "var(--red)";
  const statusBg = enabled ? "var(--green-dim)" : "var(--red-dim)";

  const pauseActions = [
    { do: "pause-30",      label: "Pause 30 minutes" },
    { do: "pause-60",      label: "Pause 1 hour" },
    { do: "pause-240",     label: "Pause 4 hours" },
    { do: "pause-morning", label: "Pause until 6am tomorrow" },
  ];
  const resumeActions = [
    { do: "resume",   label: "Resume auto schedule",            flavor: "go" },
    { do: "force-on", label: "Force ON (override Shabbat too)", flavor: "go-muted" },
  ];

  const buttonStyle = (flavor) => ({
    display: "block", width: "100%", textAlign: "left",
    padding: "12px 16px", marginBottom: 8,
    border: "1px solid",
    borderColor: flavor === "go"       ? "rgba(5,150,105,0.4)"
              : flavor === "go-muted"  ? "rgba(5,150,105,0.25)"
              :                          "rgba(220,38,38,0.4)",
    background:  flavor === "go"       ? "rgba(5,150,105,0.08)"
              : flavor === "go-muted"  ? "rgba(5,150,105,0.05)"
              :                          "rgba(220,38,38,0.08)",
    color: "var(--text)",
    borderRadius: 8,
    fontSize: 14, fontWeight: 600,
    cursor: pending ? "default" : "pointer",
    opacity: pending ? 0.55 : 1,
    transition: "background 0.15s",
  });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Voitra Agent Control</h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: 13 }}>
            Pause or resume the demo agents on voitra.ai/verticals
          </p>
        </div>
        <button onClick={refresh} disabled={loading}
          style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "var(--text-sec)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14}/>{loading ? "Loadingâ¦" : "Refresh"}
        </button>
      </div>

      {err && <div style={{ background: "var(--red-dim)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: 12, marginBottom: 16, color: "var(--red)", fontSize: 13 }}>
        {err}
      </div>}

      {!state ? <div style={{ color: "var(--text-dim)", fontSize: 13, padding: 32, textAlign: "center" }}>Loading statusâ¦</div> :
        <div style={{ padding: 22, borderRadius: 12, background: statusBg, border: "1px solid " + statusColor, marginBottom: 22 }}>
          <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 999, background: statusColor, color: "#fff", fontWeight: 700, fontSize: 11, letterSpacing: ".04em" }}>
            {enabled ? "AGENTS LIVE" : "AGENTS OFF"}
          </div>
          <div style={{ marginTop: 10, fontSize: 17, fontWeight: 600, color: "var(--text)" }}>
            {reasonLabel[state.reason] || state.reason}
          </div>
          {state.until && <div style={{ marginTop: 6, color: "var(--text-sec)", fontSize: 13 }}>
            Until: {fmtTime(state.until)}
          </div>}
        </div>
      }

      {state && <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-sec)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Automated schedule
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: 13.5, color: "var(--text)", alignItems: "baseline" }}>
          <div style={{ color: "var(--text-sec)" }}>This Shabbat</div>
          <div>
            {state.shabbat?.start && state.shabbat?.end ? (
              <>
                <span style={{ fontWeight: 600 }}>{fmtTime(state.shabbat.start)}</span>
                <span style={{ color: "var(--text-sec)" }}> â </span>
                <span style={{ fontWeight: 600 }}>{fmtTime(state.shabbat.end)}</span>
              </>
            ) : <span style={{ color: "var(--text-dim)" }}>(times unavailable â Hebcal unreachable)</span>}
          </div>
          <div style={{ color: "var(--text-sec)" }}>Every night</div>
          <div>
            <span style={{ fontWeight: 600 }}>{fmtHour(state.nightly?.start_hour ?? 23)}</span>
            <span style={{ color: "var(--text-sec)" }}> â </span>
            <span style={{ fontWeight: 600 }}>{fmtHour(state.nightly?.end_hour ?? 6)} next day</span>
          </div>
          <div style={{ color: "var(--text-sec)" }}>Timezone</div>
          <div style={{ fontWeight: 600 }}>{state.tz || "America/Los_Angeles"}</div>
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", color: "var(--text-dim)", fontSize: 12, lineHeight: 1.55 }}>
          Shabbat times pull live from Hebcal each week (Los Angeles, geonameid 5368361, candle-lighting 18 min before sunset, default Havdalah). Once Saturday's Havdalah passes, the schedule rolls forward to next Friday automatically â no manual update needed. Cached up to 6 hours.
        </div>
      </div>}

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-sec)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Pause for a while
        </h3>
        {pauseActions.map(a => (
          <button key={a.do} onClick={() => act(a.do)} disabled={!!pending} style={buttonStyle("pause")}>
            {pending === a.do ? "Savingâ¦" : a.label}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-sec)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Resume
        </h3>
        {resumeActions.map(a => (
          <button key={a.do} onClick={() => act(a.do)} disabled={!!pending} style={buttonStyle(a.flavor)}>
            {pending === a.do ? "Savingâ¦" : a.label}
          </button>
        ))}
      </div>

    </div>
  );
};
