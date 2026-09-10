import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ClipboardCopy, Code2, Hammer, Loader, Plus, RefreshCw, Wand2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Field, Inp, Sel, Tex } from "../components/ui";
import { COLORS } from "../lib/sofa/brand";
import { queueSummary, WORK_KINDS } from "../lib/sofa/dev";

const STATUS_COLOR = {
  queued: "--text-sec", speccing: "--amber", ready: "--blue",
  in_progress: "--purple", done: "--green", blocked: "--red",
};

const Card = ({ children, style }) => <div className="card" style={{ padding: 18, ...style }}>{children}</div>;
const Mono = ({ children, style }) => <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", ...style }}>{children}</div>;

export const SofaDevView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [selId, setSelId] = useState(null);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState({ title: "", kind: "page", request: "", priority: "normal" });
  const [showNew, setShowNew] = useState(false);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 6000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("sofa_work_orders").select("*").order("id", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const post = async (body) => {
    const res = await fetch("/api/sofa-dev", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  };

  const selected = orders.find((o) => o.id === selId) || orders[0] || null;
  const summary = useMemo(() => queueSummary(orders), [orders]);

  const raise = async () => {
    if (!draft.title.trim() || !draft.request.trim()) return;
    setBusy("raise");
    try {
      const r = await post({ action: "raise", order: { ...draft, requested_by: "mendy" } });
      await load(); setSelId(r.order.id); setShowNew(false);
      setDraft({ title: "", kind: "page", request: "", priority: "normal" });
      say("Work order raised. Hit Spec it to turn it into build steps.");
    } catch (e) { say(e.message); }
    setBusy("");
  };

  const act = async (action) => {
    if (!selected) return;
    setBusy(action);
    try {
      const r = await post({ action, id: selected.id });
      await load();
      if (action === "spec") {
        say(r.blocked?.length
          ? `Blocked — it needs: ${r.blocked.join("; ")}`
          : "Spec written. Copy the brief into a Claude Code session, or Build it if it's buildable here.");
      } else if (action === "build") {
        say(r.ok ? "Built in-app. Preview below." : `Can't build here: ${r.reason}`);
      } else say("Brief regenerated.");
    } catch (e) { say(e.message); }
    setBusy("");
  };

  const setStatus = async (status) => {
    if (!selected) return;
    await post({ action: "status", id: selected.id, status }).catch(() => {});
    await load();
  };

  const copy = (text, what) => {
    navigator.clipboard.writeText(text).then(() => say(`${what} copied.`)).catch(() => say("Copy failed."));
  };

  if (loading) return <div style={{ padding: 40 }} className="mono">Loading work orders…</div>;

  const kind = selected ? (WORK_KINDS[selected.kind] || WORK_KINDS.other) : null;

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Code2 size={14} color={COLORS.gold} />
            <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>SOFA DEVELOPER ASSOCIATE</span>
          </div>
          <div className="display" style={{ fontSize: 26, fontWeight: 800 }}>SoFa Developer</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6, maxWidth: 720, lineHeight: 1.6 }}>
            The build half of the pair. The business associate raises work; this one specs it, builds what it
            can here, and writes a standalone brief for whatever has to happen in the repo.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={load}><RefreshCw size={13} />Refresh</button>
          <button className="btn btn-blue" onClick={() => setShowNew((v) => !v)}><Plus size={13} />New work order</button>
        </div>
      </div>

      {toast && <div className="card-el" style={{ padding: "10px 14px", fontSize: 12, borderLeft: `3px solid ${COLORS.gold}` }}>{toast}</div>}

      <Card style={{ padding: "12px 18px" }}><Mono>{summary}</Mono></Card>

      {showNew && (
        <Card>
          <div className="display" style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Raise a work order</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <Field label="Title"><Inp value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} placeholder="Add the Rosh Hashana flyer to the home page" /></Field>
            <Field label="Kind">
              <Sel value={draft.kind} onChange={(v) => setDraft({ ...draft, kind: v })}
                options={Object.entries(WORK_KINDS).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Field>
            <Field label="Priority"><Sel value={draft.priority} onChange={(v) => setDraft({ ...draft, priority: v })} options={["low", "normal", "high"]} /></Field>
          </div>
          <Mono style={{ marginBottom: 10 }}>{WORK_KINDS[draft.kind]?.blurb}{WORK_KINDS[draft.kind]?.buildable ? " · can be built here" : " · needs a repo session"}</Mono>
          <Field label="What do you want done?"><Tex value={draft.request} onChange={(v) => setDraft({ ...draft, request: v })} placeholder="Plain words. The associate turns this into build steps." /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-blue" onClick={raise} disabled={busy === "raise"}>
              {busy === "raise" ? <Loader size={13} className="spin" /> : <Plus size={13} />}Raise
            </button>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "330px minmax(0,1fr)", gap: 16, alignItems: "start" }}>

        <Card style={{ padding: 14 }}>
          <Mono style={{ marginBottom: 10 }}>QUEUE</Mono>
          {orders.length === 0 && <Mono>Nothing queued. The business associate raises work when a flyer is ready to go out.</Mono>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {orders.map((o) => {
              const active = selected?.id === o.id;
              return (
                <button key={o.id} onClick={() => setSelId(o.id)} className="row-hover"
                  style={{ textAlign: "left", cursor: "pointer", borderRadius: 8, padding: "10px 12px",
                    background: active ? "var(--blue-dim)" : "var(--bg-card)",
                    border: "1px solid " + (active ? "rgba(0,119,204,0.25)" : "var(--border)") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{o.title}</span>
                    <span className="mono" style={{ fontSize: 9, color: `var(${STATUS_COLOR[o.status] || "--text-sec"})` }}>{o.status}</span>
                  </div>
                  <Mono style={{ marginTop: 3 }}>
                    {WORK_KINDS[o.kind]?.label || o.kind} · {o.requested_by}{o.priority === "high" ? " · high" : ""}
                  </Mono>
                </button>
              );
            })}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!selected ? <Card><Mono>Nothing selected.</Mono></Card> : (
            <>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div className="display" style={{ fontSize: 17, fontWeight: 800 }}>{selected.title}</div>
                    <Mono style={{ marginTop: 3 }}>
                      {kind.label} · {selected.target_repo || "in-app"}{selected.target_path ? ` · ${selected.target_path}` : ""}
                    </Mono>
                  </div>
                  <Sel value={selected.status} onChange={setStatus}
                    options={["queued", "speccing", "ready", "in_progress", "done", "blocked"]} />
                </div>

                <Mono style={{ marginBottom: 6 }}>REQUEST</Mono>
                <div style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>{selected.request}</div>

                {selected.result && (
                  <div className="card-el" style={{ padding: "10px 12px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    {selected.status === "blocked"
                      ? <AlertTriangle size={13} color="var(--red)" style={{ marginTop: 2 }} />
                      : <CheckCircle2 size={13} color="var(--green)" style={{ marginTop: 2 }} />}
                    <div style={{ fontSize: 12 }}>{selected.result}</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-blue" onClick={() => act("spec")} disabled={busy === "spec"}>
                    {busy === "spec" ? <Loader size={13} className="spin" /> : <Wand2 size={13} />}Spec it
                  </button>
                  <button className="btn btn-ghost" onClick={() => act("build")} disabled={busy === "build" || !kind.buildable}
                    title={kind.buildable ? "" : "This kind needs a repo session"}>
                    {busy === "build" ? <Loader size={13} className="spin" /> : <Hammer size={13} />}Build here
                  </button>
                  <button className="btn btn-ghost" onClick={() => copy(selected.handoff_prompt || "", "Handoff brief")}>
                    <ClipboardCopy size={13} />Copy handoff brief
                  </button>
                </div>
              </Card>

              {selected.spec && (
                <Card>
                  <Mono style={{ marginBottom: 8 }}>BUILD SPEC</Mono>
                  <pre style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{selected.spec}</pre>
                  {(selected.acceptance || []).length > 0 && (
                    <>
                      <Mono style={{ margin: "14px 0 6px" }}>ACCEPTANCE</Mono>
                      <ul style={{ fontSize: 12, lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                        {selected.acceptance.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </>
                  )}
                </Card>
              )}

              {selected.artifact_html && (
                <Card style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Mono>BUILT ARTIFACT</Mono>
                    <button className="btn btn-ghost" style={{ padding: "3px 10px", fontSize: 11 }}
                      onClick={() => copy(selected.artifact_html, "Artifact")}><ClipboardCopy size={12} />Copy</button>
                  </div>
                  {selected.artifact_html.trim().startsWith("<!doctype")
                    ? <iframe title="artifact" srcDoc={selected.artifact_html} sandbox=""
                        style={{ width: "100%", aspectRatio: "1275 / 1650", border: "1px solid var(--border)", borderRadius: 10, background: "#fff", display: "block" }} />
                    : <pre style={{ fontSize: 12, lineHeight: 1.65, whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{selected.artifact_html}</pre>}
                </Card>
              )}

              {selected.handoff_prompt && (
                <Card>
                  <Mono style={{ marginBottom: 8 }}>HANDOFF BRIEF — paste into a Claude Code session on {selected.target_repo || "the repo"}</Mono>
                  <pre style={{ fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "var(--font-m)", margin: 0,
                    maxHeight: 380, overflow: "auto", background: "var(--bg-el)", padding: 12, borderRadius: 8 }}>{selected.handoff_prompt}</pre>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SofaDevView;
