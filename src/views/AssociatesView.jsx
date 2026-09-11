import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Check, Clock, FileText, Loader, Play, RefreshCw, Save, Sparkles, X, Zap } from "lucide-react";
import { supabase } from "../lib/supabase";
import { askable, blocking, missingSentence, nextRunAt, parseSchedule } from "../lib/associates/core";
import { tablesFor } from "../lib/associates/context";
import { Field, Inp, SearchSelect, Sel, Tex } from "../components/ui";

// The Associates console.
//
// This used to be a picker over a hard-coded array: choose a prompt, click
// Run, read the answer, and everything about the associate vanished the
// moment you closed the tab. Every associate now lives in the `associates`
// table with a schedule, a declared set of inputs, a deterministic gap list
// and a history — so this view shows what an associate IS and what it has
// actually DONE, not just a box to run it from.
//
// Runs go through the `associate-tick` Edge Function rather than /api, because
// /api does not exist on the host this app is served from (Cloudflare Pages
// returns 405 there). functions.invoke carries the signed-in JWT, so the same
// call works in dev and in production.

const SCHEDULES = ["manual", "daily", "weekly:mon", "weekly:tue", "weekly:wed", "weekly:thu", "weekly:fri", "weekly:sat", "weekly:sun"];

const STATUS_COLOR = {
  ok: "var(--green)", error: "var(--red)", no_input: "var(--amber)", skipped: "var(--text-dim)",
  ready: "var(--green)", staged: "var(--blue)", needs_input: "var(--amber)", dismissed: "var(--text-dim)", archived: "var(--text-dim)",
};

const when = (ts) => {
  if (!ts) return "never";
  const d = new Date(ts);
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const scheduleLabel = (a) => {
  const s = parseSchedule(a.schedule);
  if (s.kind === "manual") return "manual";
  if (s.kind === "daily") return `daily ${a.run_at_utc} UTC`;
  if (s.kind === "weekly") return `${s.day} ${a.run_at_utc} UTC`;
  return `${a.schedule} ${a.run_at_utc} UTC`;
};

export const AssociatesView = ({ db, navigate }) => {
  const [roster, setRoster] = useState([]);
  const [runs, setRuns] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState(null);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");

  // the run form
  const [instructions, setInstructions] = useState("");
  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [dealId, setDealId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [answers, setAnswers] = useState({});

  const load = useCallback(async () => {
    if (!supabase) return;
    const [a, r, d] = await Promise.all([
      supabase.from("associates").select("*").order("sort_order"),
      supabase.from("associate_runs").select("*").order("started_at", { ascending: false }).limit(60),
      supabase.from("associate_drafts").select("*").order("created_at", { ascending: false }).limit(60),
    ]);
    setRoster(a.data || []);
    setRuns(r.data || []);
    setDrafts(d.data || []);
    setSlug((cur) => cur || a.data?.[0]?.slug || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const associate = useMemo(() => roster.find((x) => x.slug === slug) || roster[0] || null, [roster, slug]);
  const myRuns = useMemo(() => runs.filter((r) => r.slug === associate?.slug), [runs, associate]);
  const myDrafts = useMemo(() => drafts.filter((d) => d.slug === associate?.slug), [drafts, associate]);
  const latestDraft = myDrafts[0] || null;

  // Everything staged across the whole roster — the review queue, which is the
  // point of draft-and-hold. Without somewhere that shows the backlog, output
  // piles up unseen; that is exactly how the Content Brain quietly stopped.
  const inbox = useMemo(
    () => drafts.filter((d) => d.status === "staged" || d.status === "needs_input"),
    [drafts],
  );

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 6000); };

  const invoke = async (body) => {
    const { data, error } = await supabase.functions.invoke("associate-tick", { body });
    if (error) throw new Error(error.message || String(error));
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const runNow = async ({ dry = false } = {}) => {
    if (!associate) return;
    setBusy(dry ? "preview" : "run");
    try {
      const res = await invoke({
        action: "run",
        slug: associate.slug,
        instructions,
        answers,
        link: { contactId: contactId || null, companyId: companyId || null, dealId: dealId || null, projectId: projectId || null },
        dry_run: dry,
      });
      if (dry) {
        flash(res.skip === "no_input"
          ? "Dry run: this associate's inputs matched 0 rows — it would not run."
          : `Dry run: ${Object.entries(res.context?.digest || {}).map(([k, v]) => `${v} ${k}`).join(", ") || "no context"} · ${res.gaps?.length || 0} gap(s). Nothing written.`);
      } else {
        flash(res.status === "error" ? `Run failed: ${res.error}` : `Run complete — wrote ${Object.keys(res.wrote || {}).join(", ")}.`);
        await load();
      }
    } catch (e) {
      flash(`Run failed: ${e.message}`);
    }
    setBusy("");
  };

  const previewTick = async () => {
    setBusy("tick");
    try {
      const res = await invoke({ dry_run: true });
      flash(res.due?.length
        ? `Due now: ${res.due.map((d) => d.associate.label).join(", ")}`
        : "Nothing is due right now.");
    } catch (e) { flash(`Preview failed: ${e.message}`); }
    setBusy("");
  };

  const setSchedule = async (value) => {
    if (!associate) return;
    await supabase.from("associates")
      .update({ schedule: value, modified_at: new Date().toISOString() })
      .eq("id", associate.id);
    flash(value === "manual" ? `${associate.label} is now manual-only.` : `${associate.label} runs ${value}.`);
    load();
  };

  const setDraftStatus = async (draft, status) => {
    await supabase.from("associate_drafts")
      .update({ status, modified_at: new Date().toISOString() })
      .eq("id", draft.id);
    load();
  };

  const saveAnswers = async (draft) => {
    const merged = { ...(draft.answers || {}), ...answers };
    await supabase.from("associate_drafts")
      .update({ answers: merged, modified_at: new Date().toISOString() })
      .eq("id", draft.id);
    flash("Answers saved — the next run will not ask again.");
    load();
  };

  if (loading) return <div style={{ padding: 24 }} className="mono">Loading associates…</div>;
  if (!associate) return <div style={{ padding: 24 }} className="mono">No associates on the roster. Apply seed-associates.sql.</div>;

  const reads = tablesFor(associate.inputs || {});
  const rails = associate.rails || {};
  const next = nextRunAt(associate);
  const grouped = roster.reduce((acc, a) => { (acc[a.group_name || "Other"] ||= []).push(a); return acc; }, {});

  return (
    <div style={{ padding: 24, maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <BookOpen size={18} color="var(--blue)" />
            <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>AI ASSOCIATES</span>
          </div>
          <div className="display" style={{ fontSize: 26, fontWeight: 800 }}>Associates</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6, maxWidth: 680, lineHeight: 1.6 }}>
            Each associate reads what its spec declares, works on its own clock, and stages the result for review. Nothing is ever sent.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={previewTick} disabled={!!busy}>
            {busy === "tick" ? <Loader size={13} className="spin" /> : <Clock size={13} />}What&apos;s due
          </button>
          <button className="btn btn-ghost" onClick={load}><RefreshCw size={13} />Refresh</button>
        </div>
      </div>

      {toast && (
        <div className="card-el" style={{ padding: "10px 14px", fontSize: 12, borderLeft: "3px solid var(--blue)", lineHeight: 1.6 }}>{toast}</div>
      )}

      {inbox.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 10 }}>
            REVIEW QUEUE — {inbox.length} DRAFT(S) WAITING
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {inbox.slice(0, 8).map((d) => (
              <div key={d.id} className="card-el" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[d.status], flex: "none" }} />
                <button onClick={() => { setSlug(d.slug); setAnswers({}); }}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, textAlign: "left", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.title}
                </button>
                {(d.gaps || []).length > 0 && (
                  <span className="mono" style={{ fontSize: 10, color: "var(--amber)", flexShrink: 0 }}>needs {missingSentence(d.gaps)}</span>
                )}
                <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>{when(d.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 18 }}>
        {/* ---------------- the roster ---------------- */}
        <div className="card" style={{ padding: 14, alignSelf: "start" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 10 }}>ROSTER · {roster.length}</div>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 12 }}>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5 }}>{group.toUpperCase()}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((a) => {
                  const on = a.slug === associate.slug;
                  const scheduled = parseSchedule(a.schedule).kind !== "manual";
                  const last = runs.find((r) => r.slug === a.slug);
                  return (
                    <button key={a.slug} onClick={() => { setSlug(a.slug); setAnswers({}); }} className="row-hover"
                      style={{ textAlign: "left", border: "1px solid " + (on ? "rgba(0,119,204,0.25)" : "var(--border)"), background: on ? "var(--blue-dim)" : "var(--bg-card)", borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          {scheduled && <span className="blink" title={scheduleLabel(a)} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", flex: "none" }} />}
                          <span style={{ fontSize: 13, fontWeight: 700, color: on ? "var(--blue)" : "var(--text)" }}>{a.label}</span>
                        </span>
                        {last && <span title={`last run: ${last.status}`} style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[last.status] || "var(--text-dim)", flex: "none" }} />}
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>
                        {a.artifact} · {scheduleLabel(a)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ---------------- the associate ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div className="display" style={{ fontSize: 17, fontWeight: 800 }}>{associate.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.55, marginTop: 5 }}>{associate.brief}</div>
              </div>
              {associate.console && (
                <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => { window.location.hash = associate.console; }}>Open console</button>
              )}
            </div>

            {/* The spec — what this associate IS, read straight off its row. */}
            <div className="card-el" style={{ padding: 12, marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, fontSize: 12 }}>
              <div>
                <strong>Schedule</strong>
                <div style={{ marginTop: 4 }}>
                  {associate.runtime === "custom"
                    ? <span className="mono" style={{ fontSize: 10, color: "var(--text-sec)" }}>own scan</span>
                    : <Sel value={associate.schedule} onChange={setSchedule} options={SCHEDULES.map((s) => ({ value: s, label: s }))} />}
                </div>
                <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4 }}>
                  {next ? `next ${next.toLocaleString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" })}` : "on demand only"}
                </div>
              </div>
              <div>
                <strong>Reads</strong>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 4, lineHeight: 1.6 }}>
                  {[reads.join(", "), associate.inputs?.linked !== false ? "linked record" : ""].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div>
                <strong>Will ask for</strong>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 4, lineHeight: 1.6 }}>
                  {(associate.requirements || []).length ? (associate.requirements || []).map((r) => r.label).join(", ") : "nothing"}
                </div>
              </div>
              <div>
                <strong>May</strong>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 4, lineHeight: 1.6 }}>
                  {Object.entries(rails).filter(([, v]) => v).map(([k]) => k.replace(/_/g, " ")).join(", ") || "—"}
                  <div style={{ color: "var(--text-dim)" }}>never sends</div>
                </div>
              </div>
            </div>

            {associate.runtime === "custom" ? (
              <div className="card-el" style={{ padding: 12, fontSize: 12, color: "var(--text-sec)", lineHeight: 1.6 }}>
                This associate has its own hand-built runtime and its own scan. The generic tick deliberately leaves it alone —
                running it from here as well would duplicate everything it produces. Use {associate.console || "its console"}.
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
                  <Field label="Contact"><SearchSelect value={contactId} onChange={setContactId} options={(db?.contacts || []).map((c) => ({ value: c.id, label: c.name }))} placeholder="Link contact..." /></Field>
                  <Field label="Company"><SearchSelect value={companyId} onChange={setCompanyId} options={(db?.companies || []).map((c) => ({ value: c.id, label: c.name }))} placeholder="Link company..." /></Field>
                  <Field label="Deal"><SearchSelect value={dealId} onChange={setDealId} options={(db?.deals || []).map((d) => ({ value: d.id, label: d.name }))} placeholder="Link deal..." /></Field>
                  <Field label="Project"><SearchSelect value={projectId} onChange={setProjectId} options={(db?.projects || []).map((p) => ({ value: p.id, label: p.name }))} placeholder="Link project..." /></Field>
                </div>
                <Field label="Additional Instructions">
                  <Tex value={instructions} onChange={setInstructions} placeholder="Anything not already in Second Brain: constraints, tone, deadlines, what to leave out." />
                </Field>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={() => runNow({ dry: true })} disabled={!!busy}>
                    {busy === "preview" ? <Loader size={13} className="spin" /> : <Play size={13} />}Dry run
                  </button>
                  <button className="btn btn-blue" onClick={() => runNow()} disabled={!!busy}>
                    {busy === "run" ? <><Loader size={13} className="spin" />Running</> : <><Zap size={13} />Run now</>}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ---------------- the latest draft ---------------- */}
          {latestDraft && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="display" style={{ fontSize: 15, fontWeight: 800 }}>{latestDraft.title}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 3 }}>
                    v{latestDraft.version} · {latestDraft.status} · {when(latestDraft.created_at)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-ghost" onClick={() => setDraftStatus(latestDraft, "dismissed")}><X size={13} />Dismiss</button>
                  <button className="btn btn-blue" onClick={() => setDraftStatus(latestDraft, "ready")}><Check size={13} />Mark ready</button>
                </div>
              </div>

              {askable(latestDraft.gaps || []).length > 0 && (
                <div className="card-el" style={{ padding: 12, marginBottom: 12, borderLeft: `3px solid ${blocking(latestDraft.gaps).length ? "var(--red)" : "var(--amber)"}` }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={12} color="var(--amber)" />NEEDS FROM YOU — {askable(latestDraft.gaps).length} ITEM(S)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {askable(latestDraft.gaps).map((g) => (
                      <div key={g.field} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 200px", gap: 10, alignItems: "center" }}>
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                          <span style={{ color: g.severity === "blocking" ? "var(--red)" : "var(--amber)", fontWeight: 700 }}>{g.label}</span>
                          <span style={{ color: "var(--text-sec)" }}> — {g.question}</span>
                        </div>
                        <Inp value={answers[g.field] ?? latestDraft.answers?.[g.field] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [g.field]: v }))} placeholder="Answer…" />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <button className="btn btn-ghost" onClick={() => saveAnswers(latestDraft)}><Save size={13} />Save answers</button>
                  </div>
                </div>
              )}

              <textarea className="input" rows={16} readOnly value={latestDraft.body || ""}
                style={{ width: "100%", resize: "vertical", fontFamily: "inherit", fontSize: 13, lineHeight: 1.65 }} />
            </div>
          )}

          {/* ---------------- history ---------------- */}
          <div className="card" style={{ padding: 18 }}>
            <div className="display" style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Run history</div>
            {myRuns.length === 0 ? (
              <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>This associate has never run.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {myRuns.slice(0, 10).map((r) => (
                  <div key={r.id} className="card-el" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[r.status] || "var(--text-dim)", flex: "none" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.error || r.summary}</div>
                      <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2 }}>
                        {r.trigger} · {Object.entries(r.input_digest || {}).map(([k, v]) => `${v} ${k}`).join(", ") || "no context"}
                        {r.duration_ms ? ` · ${Math.round(r.duration_ms / 100) / 10}s` : ""}
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>{when(r.started_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="display" style={{ fontSize: 15, fontWeight: 800 }}>Past drafts</div>
              <button className="btn btn-ghost" onClick={() => navigate?.("ai_memories")}><Sparkles size={13} />AI Memories</button>
            </div>
            {myDrafts.length <= 1 ? (
              <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>Nothing earlier.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {myDrafts.slice(1, 10).map((d) => (
                  <div key={d.id} className="card-el" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <FileText size={13} color="var(--text-sec)" />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                    <span className="mono" style={{ fontSize: 9, color: STATUS_COLOR[d.status] || "var(--text-dim)", flexShrink: 0 }}>{d.status}</span>
                    <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>{when(d.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
