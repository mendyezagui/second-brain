import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Bell, BellOff, CalendarDays, CheckCircle2, Download, Loader,
  RefreshCw, Search, Send, Sparkles, User,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Field, Inp, Sel, Tex } from "../components/ui";
import { BRAND, COLORS } from "../lib/sofa/brand";
import { planDay, renderFor, templateFor, weekPayload } from "../lib/sofa/agent";
import { computeGaps, flyerStatus, missingSentence } from "../lib/sofa/gaps";
import { renderFlyer } from "../lib/sofa/templates";
import { isoDate } from "../lib/sofa/hebcal";
import { currentSubscription, pushSupport, subscribeToPush, unsubscribeFromPush } from "../lib/push";

const STATUS_COLOR = { needs_input: "--red", draft: "--amber", ready: "--green", published: "--blue", superseded: "--text-dim" };
const sev = (s) => (s === "blocking" ? "--red" : s === "ask" ? "--amber" : "--text-sec");

const Card = ({ children, style }) => <div className="card" style={{ padding: 18, ...style }}>{children}</div>;
const Mono = ({ children, style }) => <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", ...style }}>{children}</div>;

export const SofaJCCView = () => {
  const [events, setEvents] = useState([]);
  const [flyers, setFlyers] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [nudges, setNudges] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [push, setPush] = useState({ support: null, sub: null });
  const [speakerName, setSpeakerName] = useState("");
  const [speakerHint, setSpeakerHint] = useState("");
  const [toast, setToast] = useState("");

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 5000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [e, f, s, n] = await Promise.all([
      supabase.from("sofa_events").select("*").order("event_date"),
      supabase.from("sofa_flyers").select("*").order("version", { ascending: false }),
      supabase.from("sofa_speakers").select("*").order("name"),
      supabase.from("sofa_nudges").select("*").order("id", { ascending: false }).limit(25),
    ]);
    setEvents(e.data || []); setFlyers(f.data || []); setSpeakers(s.data || []); setNudges(n.data || []);
    setLoading(false);
    return e.data || [];
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setPush((p) => ({ ...p, support: pushSupport() }));
    currentSubscription().then((sub) => setPush((p) => ({ ...p, sub }))).catch(() => {});
  }, []);

  // Dry-run the same core the cron runs, so the console shows exactly what
  // tomorrow morning's scan is going to do.
  const preview = async () => {
    setBusy("preview");
    try {
      const p = await planDay({
        today: isoDate(),
        existingEvents: events,
        existingFlyers: flyers,
        sentNudgeKeys: nudges.map((n) => n.dedupe_key).filter(Boolean),
        speakersById: Object.fromEntries(speakers.map((s) => [s.id, s])),
      });
      setPlan(p);
      say(p.summary);
    } catch (err) { say(`Calendar read failed: ${err.message}`); }
    setBusy("");
  };
  useEffect(() => { if (!loading && !plan) preview(); }, [loading]); // eslint-disable-line

  const post = async (body) => {
    const res = await fetch("/api/sofa-jcc", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  };

  const runScan = async () => {
    setBusy("scan");
    try { const r = await post({ action: "scan" }); await load(); await preview();
      say(`Scan done — ${r.applied.events} event(s), ${r.applied.flyers} flyer(s), ${r.applied.nudges} nudge(s), ${r.applied.pushed} push(es).`);
    } catch (err) { say(`Scan failed: ${err.message}`); }
    setBusy("");
  };

  const speakersById = useMemo(() => Object.fromEntries(speakers.map((s) => [s.id, s])), [speakers]);
  const flyerFor = useCallback((id) => flyers.find((f) => f.event_id === id) || null, [flyers]);
  const upcoming = useMemo(
    () => events.filter((e) => e.event_date >= isoDate()).sort((a, b) => a.event_date.localeCompare(b.event_date)),
    [events]
  );
  const selected = upcoming.find((e) => e.id === selectedId) || upcoming[0] || null;
  const selFlyer = selected ? flyerFor(selected.id) : null;
  const selSpeaker = selected?.speaker_id ? speakersById[selected.speaker_id] : null;
  const selGaps = selected
    ? computeGaps(selected, { speaker: selSpeaker, template: templateFor(selected), answers: selFlyer?.answers || {} })
    : [];

  // Preview is rendered from live state, not from the stored html, so editing
  // a field updates the artboard immediately.
  const previewHtml = useMemo(() => {
    if (!selected) return "";
    try { return renderFor(selected, selFlyer || {}, selSpeaker); } catch { return ""; }
  }, [selected, selFlyer, selSpeaker]);

  const patchEvent = async (patch) => {
    if (!selected) return;
    const next = { ...selected, ...patch };
    setEvents((prev) => prev.map((e) => (e.id === selected.id ? next : e)));
    await supabase.from("sofa_events").update({ ...patch, modified_at: new Date().toISOString() }).eq("id", selected.id);
    // Re-derive status from the new gaps so the badge never goes stale.
    const gaps = computeGaps(next, { speaker: selSpeaker, template: templateFor(next), answers: selFlyer?.answers || {} });
    if (selFlyer) {
      const status = flyerStatus(gaps);
      setFlyers((prev) => prev.map((f) => (f.id === selFlyer.id ? { ...f, missing: gaps, status } : f)));
      await supabase.from("sofa_flyers").update({ missing: gaps, status }).eq("id", selFlyer.id);
    }
  };

  /** Answer a gap without filling the field — "no RSVP link", "use the crest". */
  const waiveGap = async (field) => {
    if (!selFlyer) return;
    const answers = { ...(selFlyer.answers || {}), [field]: "waived" };
    setFlyers((prev) => prev.map((f) => (f.id === selFlyer.id ? { ...f, answers } : f)));
    await supabase.from("sofa_flyers").update({ answers }).eq("id", selFlyer.id);
  };

  const researchSpeaker = async () => {
    if (!speakerName.trim()) return;
    setBusy("research");
    try {
      const r = await post({ action: "research_speaker", name: speakerName.trim(), hint: speakerHint });
      await load();
      say(r.ok
        ? `Researched ${r.speaker.name} — confidence ${r.confidence}.${r.needsConfirmation ? " Confirm the bio before printing." : ""}`
        : `Research failed: ${r.reason}`);
      if (r.ok) { setSpeakerName(""); setSpeakerHint(""); }
    } catch (err) { say(`Research failed: ${err.message}`); }
    setBusy("");
  };

  const attachSpeaker = async (speakerId) => {
    if (!selected) return;
    await patchEvent({ speaker_id: speakerId ? Number(speakerId) : null, kind: speakerId ? "speaker" : selected.kind });
  };

  const downloadHtml = () => {
    if (!previewHtml || !selected) return;
    const blob = new Blob([previewHtml], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sofa-${selected.event_date}-${(selected.title || "flyer").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const enablePush = async () => {
    setBusy("push");
    try { await subscribeToPush(); setPush({ support: pushSupport(), sub: await currentSubscription() }); say("Notifications on for this device."); }
    catch (err) { say(err.message); }
    setBusy("");
  };
  const disablePush = async () => { await unsubscribeFromPush(); setPush({ support: pushSupport(), sub: null }); say("Notifications off for this device."); };
  const testPush = async () => {
    setBusy("testpush");
    try {
      const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test" }) });
      const j = await res.json(); say(j.ok ? `Test sent to ${j.sent} device(s).` : `Test failed: ${j.reason || (j.errors || []).join("; ")}`);
    } catch (err) { say(`Test failed: ${err.message}`); }
    setBusy("");
  };

  const weekly = useMemo(() => {
    try { return renderFlyer("weekly", weekPayload(events, { shabbat: plan?.shabbat })); } catch { return ""; }
  }, [events, plan]);

  if (loading) return <div style={{ padding: 40 }} className="mono">Loading SoFa JCC…</div>;

  const pushOn = !!push.sub;

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.gold, display: "inline-block" }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--text-sec)" }}>SOFA JCC ASSOCIATE</span>
          </div>
          <div className="display" style={{ fontSize: 26, fontWeight: 800 }}>{BRAND.shortName}</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6, maxWidth: 700, lineHeight: 1.6 }}>
            Owns the weekly calendar, the Jewish holidays, the flyers and the brand. It drafts ahead of every
            holiday and tells you what it still needs.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={preview} disabled={busy === "preview"}>
            {busy === "preview" ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />}Preview plan
          </button>
          <button className="btn btn-blue" onClick={runScan} disabled={busy === "scan"}>
            {busy === "scan" ? <><Loader size={13} className="spin" />Scanning</> : <><Sparkles size={13} />Run scan now</>}
          </button>
        </div>
      </div>

      {toast && <div className="card-el" style={{ padding: "10px 14px", fontSize: 12, borderLeft: `3px solid ${COLORS.gold}` }}>{toast}</div>}

      {/* notifications */}
      <Card style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {pushOn ? <Bell size={16} color="var(--green)" /> : <BellOff size={16} color="var(--text-sec)" />}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Push notifications {pushOn ? "on for this device" : "off"}</div>
          <Mono style={{ marginTop: 3 }}>
            {pushOn ? "Holiday lead-ups and missing-input nudges arrive on this device."
              : push.support?.reason || "Turn on to get nudges on your phone."}
          </Mono>
        </div>
        {push.support?.needsHomeScreen && (
          <div style={{ fontSize: 11, color: "var(--amber)", maxWidth: 300, lineHeight: 1.5 }}>
            <AlertTriangle size={12} style={{ verticalAlign: -2 }} /> iPhone: Share → Add to Home Screen, then open it from that icon.
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          {pushOn
            ? <button className="btn btn-ghost" onClick={disablePush}>Turn off</button>
            : <button className="btn btn-blue" onClick={enablePush} disabled={busy === "push" || !push.support?.ok}>Turn on</button>}
          <button className="btn btn-ghost" onClick={testPush} disabled={busy === "testpush"}><Send size={13} />Test</button>
        </div>
      </Card>

      {/* what the scan will do */}
      {plan && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="display" style={{ fontSize: 15, fontWeight: 800 }}>Next scan will do</div>
            <Mono>{plan.location?.title} · {plan.summary}</Mono>
          </div>
          {plan.nudges.length === 0 && plan.drafts.length === 0 && plan.upserts.length === 0
            ? <Mono>Nothing due. Nearest holiday is outside the 4-day window.</Mono>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.nudges.map((n) => (
                  <div key={n.dedupe_key} className="card-el" style={{ padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Bell size={13} color={n.severity === "high" ? "var(--red)" : "var(--amber)"} style={{ marginTop: 3 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2 }}>{n.body}</div>
                      <Mono style={{ marginTop: 4 }}>T-{n.lead_days} · {n.reason}</Mono>
                    </div>
                  </div>
                ))}
                {plan.drafts.map((d) => (
                  <div key={d.event_key + d.version} className="card-el" style={{ padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                    <Sparkles size={13} color="var(--purple)" />
                    <div style={{ flex: 1, fontSize: 12 }}>
                      Draft <b>{d.template}</b> flyer v{d.version} — <span style={{ color: `var(${STATUS_COLOR[d.status]})` }}>{d.status.replace("_", " ")}</span>
                      <Mono style={{ marginTop: 2 }}>{d.reason}</Mono>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr) 400px", gap: 16, alignItems: "start" }}>

        {/* calendar */}
        <Card style={{ padding: 14 }}>
          <Mono style={{ marginBottom: 10 }}>UPCOMING</Mono>
          {upcoming.length === 0 && <Mono>No events yet. Run a scan.</Mono>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {upcoming.slice(0, 20).map((e) => {
              const f = flyerFor(e.id);
              const active = selected?.id === e.id;
              return (
                <button key={e.id} onClick={() => setSelectedId(e.id)} className="row-hover"
                  style={{ textAlign: "left", cursor: "pointer", borderRadius: 8, padding: "10px 12px",
                    background: active ? "var(--blue-dim)" : "var(--bg-card)",
                    border: "1px solid " + (active ? "rgba(0,119,204,0.25)" : "var(--border)") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{e.title}</span>
                    {f && <span className="mono" style={{ fontSize: 9, color: `var(${STATUS_COLOR[f.status] || "--text-sec"})` }}>{(f.status || "").replace("_", " ")}</span>}
                  </div>
                  <Mono style={{ marginTop: 3 }}>
                    {e.event_date}{e.hebrew_date ? ` · ${e.hebrew_date}` : ""}{e.candle_lighting ? ` · 🕯 ${e.candle_lighting}` : ""}
                  </Mono>
                </button>
              );
            })}
          </div>
        </Card>

        {/* editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!selected ? <Card><Mono>Select an event.</Mono></Card> : (
            <>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div className="display" style={{ fontSize: 17, fontWeight: 800 }}>{selected.title}</div>
                    <Mono style={{ marginTop: 3 }}>{templateFor(selected)} template · {selected.event_date}</Mono>
                  </div>
                  <span className="mono" style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6,
                    background: "var(--bg-el)", color: `var(${STATUS_COLOR[flyerStatus(selGaps)]})` }}>
                    {flyerStatus(selGaps).replace("_", " ")}
                  </span>
                </div>

                {selGaps.length > 0 && (
                  <div className="card-el" style={{ padding: 12, marginBottom: 14 }}>
                    <Mono style={{ marginBottom: 8 }}>THE AGENT IS MISSING — {missingSentence(selGaps)}</Mono>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {selGaps.map((g) => (
                        <div key={g.field} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: `var(${sev(g.severity)})`, flex: "none" }} />
                          <span style={{ flex: 1 }}>{g.question}</span>
                          <button className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => waiveGap(g.field)}>N/A</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Start time"><Inp value={selected.start_time || ""} onChange={(v) => patchEvent({ start_time: v })} placeholder="7:30 PM" /></Field>
                  <Field label="End time"><Inp value={selected.end_time || ""} onChange={(v) => patchEvent({ end_time: v })} placeholder="9:00 PM" /></Field>
                  <Field label="Location"><Inp value={selected.location || ""} onChange={(v) => patchEvent({ location: v })} placeholder="SoFa Jewish Community Center" /></Field>
                  <Field label="Address"><Inp value={selected.address || ""} onChange={(v) => patchEvent({ address: v })} placeholder="Street, city" /></Field>
                  <Field label="Audience"><Inp value={selected.audience || ""} onChange={(v) => patchEvent({ audience: v })} placeholder="Everyone welcome" /></Field>
                  <Field label="RSVP"><Inp value={selected.rsvp_url || ""} onChange={(v) => patchEvent({ rsvp_url: v })} placeholder="sofajcc.org/rsvp" /></Field>
                  <Field label="Speaker">
                    <Sel value={selected.speaker_id || ""} onChange={attachSpeaker}
                      options={[{ value: "", label: "— none —" }, ...speakers.map((s) => ({ value: s.id, label: s.name }))]} />
                  </Field>
                  <Field label="Status">
                    <Sel value={selected.status || "draft"} onChange={(v) => patchEvent({ status: v })}
                      options={["draft", "confirmed", "published", "cancelled"]} />
                  </Field>
                </div>
                <Field label="Description"><Tex value={selected.description || ""} onChange={(v) => patchEvent({ description: v })} placeholder="One line about the event." /></Field>
              </Card>

              {/* speaker research */}
              <Card>
                <div className="display" style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Speaker</div>
                <Mono style={{ marginBottom: 12 }}>Give a name. It searches the web, fills the bio, and flags anything it could not verify.</Mono>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                  <Field label="Name"><Inp value={speakerName} onChange={setSpeakerName} placeholder="Rabbi Yosef Cohen" /></Field>
                  <Field label="Hint (optional)"><Inp value={speakerHint} onChange={setSpeakerHint} placeholder="from Crown Heights, writes on Chassidus" /></Field>
                  <button className="btn btn-blue" style={{ marginBottom: 14 }} onClick={researchSpeaker} disabled={busy === "research" || !speakerName.trim()}>
                    {busy === "research" ? <Loader size={13} className="spin" /> : <Search size={13} />}Research
                  </button>
                </div>
                {speakers.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    {speakers.slice(0, 6).map((s) => (
                      <div key={s.id} className="card-el" style={{ padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                        <User size={13} color="var(--blue)" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                          <Mono style={{ marginTop: 2 }}>{[s.title, s.org].filter(Boolean).join(" · ") || "no title yet"}</Mono>
                        </div>
                        {s.research_status === "researched"
                          ? <CheckCircle2 size={13} color="var(--green)" />
                          : <AlertTriangle size={13} color="var(--amber)" />}
                        <button className="btn btn-ghost" style={{ padding: "3px 10px", fontSize: 11 }} onClick={() => attachSpeaker(s.id)}>Attach</button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>

        {/* preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 12 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Mono>FLYER PREVIEW</Mono>
              <button className="btn btn-ghost" style={{ padding: "3px 10px", fontSize: 11 }} onClick={downloadHtml} disabled={!previewHtml}>
                <Download size={12} />HTML
              </button>
            </div>
            {previewHtml
              ? <iframe title="flyer" srcDoc={previewHtml} sandbox=""
                  style={{ width: "100%", aspectRatio: "1080 / 1350", border: "1px solid var(--border)", borderRadius: 10, background: "#fff", display: "block" }} />
              : <Mono>Nothing to preview.</Mono>}
            <Mono style={{ marginTop: 8 }}>1080 × 1350 · brand-locked · edits above update this live</Mono>
          </Card>

          <Card style={{ padding: 14 }}>
            <Mono style={{ marginBottom: 10 }}>THIS WEEK</Mono>
            {weekly
              ? <iframe title="weekly" srcDoc={weekly} sandbox=""
                  style={{ width: "100%", aspectRatio: "1080 / 1350", border: "1px solid var(--border)", borderRadius: 10, background: "#fff", display: "block" }} />
              : <Mono>No events this week.</Mono>}
          </Card>

          <Card style={{ padding: 14 }}>
            <Mono style={{ marginBottom: 10 }}>RECENT NUDGES</Mono>
            {nudges.length === 0 ? <Mono>Nothing sent yet.</Mono> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {nudges.slice(0, 8).map((n) => (
                  <div key={n.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
                    <CalendarDays size={12} color="var(--text-sec)" style={{ marginTop: 3, flex: "none" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{n.title}</div>
                      <Mono style={{ marginTop: 2 }}>{n.status} · T-{n.lead_days} · {n.channel || "no channel"}</Mono>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SofaJCCView;
