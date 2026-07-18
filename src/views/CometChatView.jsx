import { useEffect, useRef, useState } from "react";
import { BarChart3, Calendar, Hash, Loader, MessageSquare, RefreshCw, Search, Send, Users } from "lucide-react";
import { Field, Tag } from "../components/ui";

const DEFAULT_SETTINGS = {
  sandbox: {
    dispatchUid: "user_005tr000007l9ztyaa",
    driverUid: "user_005cw00000katszqan",
    groupGuid: "alex-voice-ai-group",
    groupName: "Alex Voice AI",
  },
  production: {
    dispatchUid: "alex-voice-ai",
    driverUid: "rapid-ai-test-driver",
    groupGuid: "rapid-ai-voice-test-group",
    groupName: "Rapid AI Voice Test Group",
  },
};

const DEFAULT_SEARCHES = {
  sandbox: {
    users: "TEST DRIVER_4",
    groups: "Alex Voice AI",
  },
  production: {
    users: "Rapid AI Test Driver",
    groups: "Rapid AI Voice Test Group",
  },
};

const PAGE_COPY = {
  sandbox: {
    title: "Sandbox Comet Chat",
    eyebrow: "Sandbox",
    description: "Test sandbox user and group conversations as Dispatch or as the driver sandbox.",
    driverLabel: "TEST DRIVER_4",
    driverButton: "Test Driver",
  },
  production: {
    title: "Production Comet Chat",
    eyebrow: "Production",
    description: "Test production VoiceAI messages as Alex Voice AI into a dedicated production test group.",
    dispatchLabel: "Alex Voice AI",
    dispatchButton: "Alex Voice AI",
    dispatchNote: "Reusable VoiceAI sender across CometChat",
    driverLabel: "Rapid AI Test Driver",
    driverButton: "Test Driver",
  },
};

const actorLabel = (uid, settings, copy) => {
  if (uid === settings.dispatchUid) return copy.dispatchLabel || "Dispatch / RM Chat";
  if (uid === settings.driverUid) return copy.driverLabel;
  if (uid === "alex-voice-ai") return "Alex Voice AI";
  return uid || "Unknown";
};

const getMessageText = (message) => message?.data?.text || message?.data?.message || message?.text || "";
const getMessageTime = (message) => {
  const stamp = message?.sentAt || message?.updatedAt || message?.deliveredAt;
  return stamp ? new Date(Number(stamp) * 1000).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "";
};
const getMessageDateTime = (stamp) => stamp ? new Date(Number(stamp) * 1000).toLocaleString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "";
const todayPacific = () => new Intl.DateTimeFormat("en-CA", { timeZone:"America/Los_Angeles", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
const SOURCE_LABELS = ["Retell call-end", "RingCentral SMS redirect", "Manual Second Brain test", "Unknown app_system", "Other"];

const sourceTypeFromMessage = (message = {}) => {
  if (message.sourceType) return message.sourceType;
  const meta = message.metadata || message.data?.metadata || {};
  const tags = Array.isArray(message.tags) ? message.tags.map(tag => String(tag).toLowerCase()) : [];
  const source = String(meta.source || "").toLowerCase();
  const eventType = String(meta.event_type || "").toLowerCase();
  if (source === "ringcentral_sms_to_cometchat" || tags.includes("ringcentral-sms") || eventType === "ringcentral_sms_bridge") return "RingCentral SMS redirect";
  if (source === "retell_via_n8n" || source === "retell_n8n" || eventType === "call_end_followup" || tags.includes("call-end-followup")) return "Retell call-end";
  if (source === "second_brain" || source === "second-brain-cometchat-console" || tags.some(tag => tag.includes("second-brain"))) return "Manual Second Brain test";
  if (message.sender === "app_system" && message.receiverType === "group") return "Unknown app_system";
  return "Other";
};

const sourceBreakdownFrom = (messages = []) => messages.reduce((acc, message) => {
  const key = sourceTypeFromMessage(message);
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const groupReviewFlags = (group = {}) => {
  if (Array.isArray(group.reviewFlags) && group.reviewFlags.length) return group.reviewFlags;
  const sourceTypes = new Set((group.systemMessages || []).map(sourceTypeFromMessage));
  const counts = group.confidence?.counts || {};
  const flags = [];
  if (sourceTypes.has("Unknown app_system")) flags.push("Unknown app_system source");
  if (sourceTypes.has("RingCentral SMS redirect") && !counts.postDayNonSystemMessages) flags.push("SMS redirect, no app reply");
  if ((group.confidence?.score || 0) >= 65) flags.push("Likely influenced");
  if ((counts.postDayNonSystemMessages || 0) > 0 && !(counts.post30MinuteNonSystemMessages || 0)) flags.push("Late same-day reply");
  if ((counts.priorHourNonSystemMessages || 0) > 0) flags.push("Prior-hour activity");
  if ((group.allMessages || []).length === (group.systemMessages || []).length) flags.push("No human conversation");
  return flags;
};

const snapshotRollup = (snapshot = {}) => {
  const groups = snapshot.groups || [];
  const systemMessages = groups.flatMap(group => group.systemMessages || []);
  const sourceBreakdown = snapshot.summary?.sourceBreakdown || sourceBreakdownFrom(systemMessages);
  const needsReview = snapshot.summary?.needsReviewGroups ?? groups.filter(group => groupReviewFlags(group).some(flag => flag !== "Likely influenced")).length;
  return {
    sourceBreakdown,
    needsReview,
    confirmed: snapshot.summary?.explicitlyTaggedN8nMessages || systemMessages.filter(msg => !(msg.sourceHint || "").startsWith("inferred:")).length,
    inferred: snapshot.summary?.inferredSystemGroupMessages || systemMessages.filter(msg => (msg.sourceHint || "").startsWith("inferred:")).length,
  };
};

export function CometChatView({ session, initialEnvironment = "sandbox" }) {
  const [environment, setEnvironment] = useState(initialEnvironment);
  const [section, setSection] = useState("console");
  const copy = PAGE_COPY[environment] || PAGE_COPY.sandbox;
  const [environmentSettings, setEnvironmentSettings] = useState({
    sandbox: DEFAULT_SETTINGS.sandbox,
    production: DEFAULT_SETTINGS.production,
  });
  const [mode, setMode] = useState("user");
  const [viewer, setViewer] = useState("dispatch");
  const [sender, setSender] = useState("dispatch");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditSnapshots, setAuditSnapshots] = useState([]);
  const [selectedAuditPath, setSelectedAuditPath] = useState("");
  const [auditSnapshot, setAuditSnapshot] = useState(null);
  const [auditDate, setAuditDate] = useState(todayPacific());
  const [auditNotice, setAuditNotice] = useState("");
  const [openAuditGroupId, setOpenAuditGroupId] = useState("");
  const transcriptRef = useRef(null);
  const settings = environmentSettings[environment] || DEFAULT_SETTINGS.sandbox;
  const setSettings = (updater) => {
    setEnvironmentSettings(current => ({
      ...current,
      [environment]: typeof updater === "function" ? updater(current[environment] || DEFAULT_SETTINGS[environment]) : updater,
    }));
  };

  const apiCall = async (body) => {
    const resp = await fetch("/api/cometchat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ environment, ...body }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "CometChat request failed");
    return data;
  };

  const auditCall = async (body) => {
    if (!session?.access_token) throw new Error("You need to be signed in before running CometChat audit pulls.");
    const resp = await fetch("/api/cometchat-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "CometChat audit request failed");
    return data;
  };

  const viewerUid = viewer === "driver" ? settings.driverUid : settings.dispatchUid;
  const senderUid = sender === "driver" ? settings.driverUid : settings.dispatchUid;
  const receiver = mode === "group" ? settings.groupGuid : (sender === "driver" ? settings.dispatchUid : settings.driverUid);

  const loadMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const body = mode === "group"
        ? { action:"getGroupMessages", guid:settings.groupGuid, onBehalfOf:viewerUid, perPage:75 }
        : { action:"getUserMessages", uid:settings.driverUid, onBehalfOf:settings.dispatchUid, perPage:75 };
      const data = await apiCall(body);
      const rows = Array.isArray(data.data) ? data.data : [];
      setMessages(rows.sort((a, b) => Number(a.sentAt || 0) - Number(b.sentAt || 0)));
    } catch (e) {
      setError(e.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      setStatus(await apiCall({ action:"status" }));
    } catch (e) {
      setStatus({ error:e.message });
    }
  };

  const searchUsers = async () => {
    setError("");
    try {
      const data = await apiCall({ action:"listUsers", searchKey:userSearch, perPage:20 });
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const searchGroups = async () => {
    setError("");
    try {
      const data = await apiCall({ action:"listGroups", searchKey:groupSearch, onBehalfOf:settings.dispatchUid, perPage:20 });
      setGroups(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const sendMessage = async () => {
    if (!draft.trim()) return;
    setSending(true);
    setError("");
    try {
      if (mode === "group") {
        await apiCall({ action:"ensureGroupMember", guid:settings.groupGuid, uid:senderUid, scope:sender === "dispatch" ? "admins" : "participants" });
      }
      await apiCall({
        action: "sendMessage",
        senderUid,
        receiver,
        receiverType: mode === "group" ? "group" : "user",
        text: draft,
        metadata: { viewer, mode },
      });
      setDraft("");
      await loadMessages();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const ensureProductionSetup = async () => {
    setSettingUp(true);
    setError("");
    try {
      const data = await apiCall({ action:"ensureProductionTestSetup" });
      setSettings({
        dispatchUid: data.setup.alexUid,
        driverUid: data.setup.driverUid,
        groupGuid: data.setup.groupGuid,
        groupName: data.setup.groupName,
      });
      setMode("group");
      setSender("dispatch");
      setViewer("dispatch");
      await loadMessages();
    } catch (e) {
      setError(e.message);
    } finally {
      setSettingUp(false);
    }
  };

  const loadAuditSnapshots = async () => {
    setAuditLoading(true);
    setError("");
    try {
      const data = await auditCall({ action:"listSnapshots" });
      const rows = Array.isArray(data.snapshots) ? data.snapshots : [];
      setAuditSnapshots(rows);
      if (!selectedAuditPath && rows[0]?.path) {
        setSelectedAuditPath(rows[0].path);
        await loadAuditSnapshot(rows[0].path);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadAuditSnapshot = async (path) => {
    if (!path) return;
    setAuditLoading(true);
    setError("");
    setAuditNotice("");
    try {
      const data = await auditCall({ action:"getSnapshot", path });
      setAuditSnapshot(data);
      setSelectedAuditPath(path);
      setOpenAuditGroupId("");
    } catch (e) {
      setError(e.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const runAuditNow = async () => {
    setAuditRunning(true);
    setError("");
    setAuditNotice("");
    try {
      const data = await auditCall({ action:"runDailyAudit", date:auditDate, force:true });
      const snapshot = data.snapshot;
      if (!snapshot) throw new Error("CometChat audit completed but did not return a snapshot.");
      setAuditSnapshot(snapshot);
      setSelectedAuditPath(snapshot.storagePath || "");
      setOpenAuditGroupId("");
      await loadAuditSnapshots();
      const sends = snapshot.summary?.n8nGroupMessages || 0;
      const groups = snapshot.summary?.uniqueGroups || 0;
      setAuditNotice(`Pull complete for ${snapshot.date}. Saved ${snapshot.storagePath}. Found ${sends} n8n group send${sends === 1 ? "" : "s"} across ${groups} group${groups === 1 ? "" : "s"}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setAuditRunning(false);
    }
  };

  useEffect(() => { setEnvironment(initialEnvironment); }, [initialEnvironment]);
  useEffect(() => {
    setUserSearch(DEFAULT_SEARCHES[environment]?.users || "");
    setGroupSearch(DEFAULT_SEARCHES[environment]?.groups || "");
  }, [environment]);
  useEffect(() => { loadStatus(); }, [environment]);
  useEffect(() => { loadMessages(); }, [environment, mode, viewer, settings.dispatchUid, settings.driverUid, settings.groupGuid]);
  useEffect(() => { if (section === "logs") loadAuditSnapshots(); }, [section]);
  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [messages]);

  const actors = [
    { id:"dispatch", label:copy.dispatchButton || "Dispatch / RM Chat", uid:settings.dispatchUid, note:copy.dispatchNote || "Application-side dispatcher sender" },
    { id:"driver", label:copy.driverButton, uid:settings.driverUid, note:environment === "sandbox" ? "Driver/test user" : "Production user" },
  ];
  const currentRollup = auditSnapshot ? snapshotRollup(auditSnapshot) : null;
  const auditGroups = auditSnapshot?.groups || [];
  const reviewGroups = auditGroups.filter(group => groupReviewFlags(group).some(flag => flag !== "Likely influenced"));
  const confirmedGroups = auditGroups.filter(group => !groupReviewFlags(group).some(flag => flag !== "Likely influenced"));
  const renderAuditGroupDetail = (group) => (
    <div style={{ marginTop:12, display:"grid", gap:10 }}>
      <div style={{ fontSize:12, color:"var(--text-sec)", lineHeight:1.6 }}>
        {(group.confidence?.reasons || []).join(" ")}
        {group.confidence?.counts && (
          <span> Prior hour: {group.confidence.counts.priorHourNonSystemMessages || 0}. 30m replies: {group.confidence.counts.post30MinuteNonSystemMessages || 0}. 2h replies: {group.confidence.counts.post2HourNonSystemMessages || 0}. Human senders: {group.confidence.counts.uniquePostSendHumanSenders || 0}.</span>
        )}
      </div>
      {(group.allMessages || []).map(message => {
        const isSystem = (group.systemMessages || []).some(system => system.id === message.id);
        return (
          <div key={message.id} style={{ border:"1px solid var(--border)", borderRadius:8, padding:"9px 10px", background:isSystem ? "var(--blue-dim)" : "#fff" }}>
            <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ fontSize:12, fontWeight:800 }}>{isSystem ? "Original n8n message" : (message.senderName || message.sender)}</div>
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{getMessageDateTime(message.sentAt)} · #{message.id}</div>
            </div>
            <div style={{ fontSize:13, lineHeight:1.45, whiteSpace:"pre-wrap", overflowWrap:"anywhere", marginTop:5 }}>{message.text || "(no text)"}</div>
            <div className="mono" style={{ fontSize:9, color:"var(--text-sec)", marginTop:6 }}>{message.sender} → {message.receiver}</div>
            {isSystem && <div className="mono" style={{ fontSize:9, color:"var(--text-sec)", marginTop:4 }}>type: {sourceTypeFromMessage(message)}</div>}
            {message.sourceHint && <div className="mono" style={{ fontSize:9, color:"var(--text-sec)", marginTop:4 }}>source: {message.sourceHint}</div>}
          </div>
        );
      })}
    </div>
  );
  const renderAuditGroupRow = (group, tone = "normal") => {
    const flags = groupReviewFlags(group);
    const isOpen = openAuditGroupId === group.identifier;
    return (
      <div key={group.identifier} className="card-el" style={{ border:"1px solid var(--border)", padding:0, background:tone === "review" ? "#fff" : "var(--bg-el)", overflow:"hidden" }}>
        <button onClick={()=>setOpenAuditGroupId(isOpen ? "" : group.identifier)} style={{ width:"100%", border:0, background:"transparent", padding:12, cursor:"pointer", textAlign:"left" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:850, overflowWrap:"anywhere" }}>{group.groupName || group.groupGuid}</div>
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:3 }}>{group.identifier}</div>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
              <Tag label={isOpen ? "Open" : "Closed"}/>
              <Tag label={`${group.confidence?.score || 0}/100`}/>
              <Tag label={`${group.systemMessages?.length || 0} sends`}/>
              <Tag label={`${group.allMessages?.length || 0} messages`}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:9 }}>
            {Object.entries(group.sourceTypes || sourceBreakdownFrom(group.systemMessages || [])).map(([label, count]) => <Tag key={label} label={`${label}: ${count}`}/>)}
            {flags.map(flag => <Tag key={flag} label={flag}/>)}
          </div>
        </button>
        {isOpen && <div style={{ padding:"0 12px 12px" }}>{renderAuditGroupDetail(group)}</div>}
      </div>
    );
  };

  return (
    <div style={{ padding:24, maxWidth:1280, margin:"0 auto" }}>
      <div style={{ display:"flex", gap:8, marginBottom:18, borderBottom:"1px solid var(--border)", paddingBottom:10, flexWrap:"wrap" }}>
        {["sandbox", "production"].map(env => {
          const active = environment === env;
          const envCopy = PAGE_COPY[env];
          return (
            <button key={env} className={`btn ${active ? "btn-blue" : "btn-ghost"}`} onClick={()=>setEnvironment(env)}>
              {envCopy.eyebrow}
            </button>
          );
        })}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:18, flexWrap:"wrap" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <MessageSquare size={20} color="var(--blue)"/>
            <Tag label="AI Controls"/>
            <Tag label={copy.eyebrow}/>
          </div>
          <div className="display" style={{ fontSize:28, fontWeight:800 }}>{copy.title}</div>
          <div style={{ fontSize:13, color:"var(--text-sec)", marginTop:6 }}>{copy.description}</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end" }}>
          {status?.ok && <Tag label={`App ${status.appId} / ${status.region.toUpperCase()}`}/>}
          {status?.error && <Tag label="API key missing" color="var(--red)"/>}
          {environment === "production" && <button className="btn btn-blue" onClick={ensureProductionSetup} disabled={settingUp}>{settingUp ? <Loader size={13} className="spin"/> : null}Ensure Test Setup</button>}
          <button className="btn btn-ghost" onClick={loadMessages} disabled={loading}><RefreshCw size={13} className={loading ? "spin" : ""}/>Refresh</button>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
        <button className={`btn ${section === "console" ? "btn-blue" : "btn-ghost"}`} onClick={()=>setSection("console")}><MessageSquare size={13}/>Chat Console</button>
        <button className={`btn ${section === "logs" ? "btn-blue" : "btn-ghost"}`} onClick={()=>setSection("logs")}><BarChart3 size={13}/>n8n Group Logs</button>
      </div>

      {error && <div className="card-el" style={{ padding:"10px 14px", borderColor:"rgba(220,38,38,0.35)", background:"var(--red-dim)", color:"var(--red)", fontSize:13, marginBottom:14 }}>{error}</div>}

      {section === "logs" ? (
        <div style={{ display:"grid", gridTemplateColumns:"minmax(280px,360px) minmax(0,1fr)", gap:16 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div className="card" style={{ padding:16 }}>
              <div className="display" style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Daily Pull</div>
              <Field label="Pacific date">
                <input className="input" type="date" value={auditDate} onChange={e=>setAuditDate(e.target.value)} />
              </Field>
              <button className="btn btn-blue" onClick={runAuditNow} disabled={auditRunning} style={{ width:"100%", justifyContent:"center" }}>
                {auditRunning ? <Loader size={13} className="spin"/> : <Calendar size={13}/>}Pull Day Now
              </button>
              {auditNotice && (
                <div style={{ marginTop:10, padding:"9px 10px", borderRadius:8, background:"var(--green-dim)", color:"var(--green)", fontSize:12, lineHeight:1.45, overflowWrap:"anywhere" }}>
                  {auditNotice}
                </div>
              )}
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", lineHeight:1.6, marginTop:10 }}>
                Daily schedule target: 4:45 PM America/Los_Angeles. Historical snapshot files are append-only.
              </div>
            </div>

            <div className="card" style={{ padding:16 }}>
              <div className="display" style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Daily Rollup</div>
              {auditSnapshots.length === 0 ? (
                <div style={{ fontSize:12, color:"var(--text-sec)" }}>Pull a day to start the ongoing log.</div>
              ) : (
                <div style={{ display:"grid", gap:8 }}>
                  {auditSnapshots.slice(0, 7).map(item => (
                    <button key={`rollup-${item.path}`} className="card-el" onClick={()=>loadAuditSnapshot(item.path)} style={{ border:"1px solid var(--border)", padding:"9px 10px", background:selectedAuditPath === item.path ? "var(--blue-dim)" : "var(--bg-el)", cursor:"pointer", textAlign:"left" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"center" }}>
                        <div style={{ fontSize:12, fontWeight:800 }}>{item.date}</div>
                        <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{item.summary?.dailyConfidenceScore || 0}/100</div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginTop:7 }}>
                        <Tag label={`${item.summary?.n8nGroupMessages || 0} sends`}/>
                        <Tag label={`${item.summary?.uniqueGroups || 0} groups`}/>
                        <Tag label={`${item.summary?.needsReviewGroups ?? 0} review`}/>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, marginBottom:12 }}>
                <div className="display" style={{ fontSize:15, fontWeight:700 }}>Snapshots</div>
                <button className="btn btn-ghost" onClick={loadAuditSnapshots} disabled={auditLoading}><RefreshCw size={13} className={auditLoading ? "spin" : ""}/></button>
              </div>
              {auditSnapshots.length === 0 ? (
                <div style={{ fontSize:12, color:"var(--text-sec)" }}>No n8n group-log snapshots yet.</div>
              ) : auditSnapshots.map(item => (
                <button key={item.path} className="card-el" onClick={()=>loadAuditSnapshot(item.path)} style={{ width:"100%", border:"1px solid var(--border)", padding:"9px 10px", marginBottom:8, textAlign:"left", cursor:"pointer", background:selectedAuditPath === item.path ? "var(--blue-dim)" : "var(--bg-el)" }}>
                  <div style={{ fontSize:12, fontWeight:800 }}>{item.date}</div>
                  <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{new Date(item.generatedAt).toLocaleString()}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
                    <Tag label={`${item.summary?.n8nGroupMessages || 0} sends`}/>
                    {(item.summary?.explicitlyTaggedN8nMessages || 0) > 0 && <Tag label={`${item.summary.explicitlyTaggedN8nMessages} confirmed`}/>}
                    {(item.summary?.inferredSystemGroupMessages || 0) > 0 && <Tag label={`${item.summary.inferredSystemGroupMessages} inferred`}/>}
                    <Tag label={`${item.summary?.uniqueGroups || 0} groups`}/>
                    <Tag label={`${item.summary?.dailyConfidenceScore || 0}/100`}/>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding:0, overflow:"hidden", minWidth:0 }}>
            {!auditSnapshot ? (
              <div style={{ padding:24, color:"var(--text-sec)", fontSize:13 }}>{auditLoading ? "Loading audit..." : "Select a snapshot or pull a day."}</div>
            ) : (
              <>
                <div style={{ padding:16, borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                  <div>
                    <div className="display" style={{ fontSize:20, fontWeight:800 }}>{auditSnapshot.date} n8n Group Impact</div>
                    <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:4 }}>Generated {new Date(auditSnapshot.generatedAt).toLocaleString()} · {auditSnapshot.timezone}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
                    <Tag label={`${auditSnapshot.summary?.n8nGroupMessages || 0} n8n sends`}/>
                    {(auditSnapshot.summary?.explicitlyTaggedN8nMessages || 0) > 0 && <Tag label={`${auditSnapshot.summary.explicitlyTaggedN8nMessages} confirmed n8n`}/>}
                    {(auditSnapshot.summary?.inferredSystemGroupMessages || 0) > 0 && <Tag label={`${auditSnapshot.summary.inferredSystemGroupMessages} inferred app_system`}/>}
                    <Tag label={`${auditSnapshot.summary?.uniqueGroups || 0} groups`}/>
                    <Tag label={`${auditSnapshot.summary?.likelyInfluencedGroups || 0} likely`}/>
                    <Tag label={`${currentRollup?.needsReview || 0} review`}/>
                    <Tag label={`${auditSnapshot.summary?.dailyConfidenceScore || 0}/100 confidence`}/>
                  </div>
                  <div style={{ flexBasis:"100%", fontSize:11, color:"var(--text-sec)", lineHeight:1.45 }}>
                    Confirmed n8n messages have source/tags from the workflow. Inferred messages are app_system group messages with no explicit n8n marker.
                  </div>
                </div>
                <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12, maxHeight:"72vh", overflowY:"auto" }}>
                  {(auditSnapshot.groups || []).length === 0 ? (
                    <div style={{ color:"var(--text-sec)", fontSize:13 }}>No app_system/n8n group sends found for this day.</div>
                  ) : (
                  <>
                    <div className="card-el" style={{ border:"1px solid var(--border)", padding:14, background:"#fff" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:10 }}>
                        <div style={{ fontSize:14, fontWeight:800 }}>Source Mix</div>
                        <Tag label={`${currentRollup?.confirmed || 0} confirmed / ${currentRollup?.inferred || 0} inferred`}/>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8 }}>
                        {SOURCE_LABELS.map(label => (
                          <div key={label} style={{ border:"1px solid var(--border)", borderRadius:8, padding:"9px 10px", background:"var(--bg-el)" }}>
                            <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{label}</div>
                            <div style={{ fontSize:20, fontWeight:850, marginTop:3 }}>{currentRollup?.sourceBreakdown?.[label] || 0}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card-el" style={{ border:"1px solid var(--border)", padding:14, background:"#fff" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:10 }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:800 }}>Needs Review</div>
                          <div style={{ fontSize:11, color:"var(--text-sec)", marginTop:3 }}>Collapsed by default. Open one group at a time.</div>
                        </div>
                        <Tag label={`${reviewGroups.length} groups`}/>
                      </div>
                      {reviewGroups.length === 0 ? (
                        <div style={{ fontSize:12, color:"var(--text-sec)" }}>No review flags beyond normal influence scoring.</div>
                      ) : (
                        <div style={{ display:"grid", gap:8 }}>
                          {reviewGroups.map(group => renderAuditGroupRow(group, "review"))}
                        </div>
                      )}
                    </div>

                    <div className="card-el" style={{ border:"1px solid var(--border)", padding:14, background:"#fff" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:10 }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:800 }}>Confirmed</div>
                          <div style={{ fontSize:11, color:"var(--text-sec)", marginTop:3 }}>Groups without extra review flags.</div>
                        </div>
                        <Tag label={`${confirmedGroups.length} groups`}/>
                      </div>
                      {confirmedGroups.length === 0 ? (
                        <div style={{ fontSize:12, color:"var(--text-sec)" }}>No confirmed groups in this snapshot.</div>
                      ) : (
                        <div style={{ display:"grid", gap:8 }}>
                          {confirmedGroups.map(group => renderAuditGroupRow(group, "confirmed"))}
                        </div>
                      )}
                    </div>
                  </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
      <div style={{ display:"grid", gridTemplateColumns:"minmax(260px,320px) minmax(0,1fr)", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div className="card" style={{ padding:16 }}>
            <div className="display" style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Defaults</div>
            <Field label={environment === "production" ? "Alex sender UID" : "Dispatch UID"}><input className="input" value={settings.dispatchUid} onChange={e=>setSettings(s=>({...s, dispatchUid:e.target.value.trim()}))}/></Field>
            <Field label="Driver UID"><input className="input" value={settings.driverUid} onChange={e=>setSettings(s=>({...s, driverUid:e.target.value.trim()}))}/></Field>
            <Field label="Group GUID"><input className="input" value={settings.groupGuid} onChange={e=>setSettings(s=>({...s, groupGuid:e.target.value.trim()}))}/></Field>
            <button className="btn btn-ghost" style={{ width:"100%", justifyContent:"center" }} onClick={()=>setSettings(DEFAULT_SETTINGS[environment])}>Restore test defaults</button>
          </div>

          <div className="card" style={{ padding:16 }}>
            <div className="display" style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Search</div>
            <Field label="Users">
              <div style={{ display:"flex", gap:6 }}>
                <input className="input" value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search users"/>
                <button className="btn btn-ghost" onClick={searchUsers}><Search size={13}/></button>
              </div>
            </Field>
            {users.slice(0, 5).map(u => (
              <button key={u.uid} className="card-el" onClick={()=>setSettings(s=>({...s, driverUid:u.uid}))} style={{ width:"100%", border:"1px solid var(--border)", padding:"8px 10px", marginBottom:6, textAlign:"left", cursor:"pointer", background:"var(--bg-el)" }}>
                <div style={{ fontSize:12, fontWeight:700 }}>{u.name || u.uid}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{u.uid}</div>
              </button>
            ))}
            <Field label="Groups">
              <div style={{ display:"flex", gap:6 }}>
                <input className="input" value={groupSearch} onChange={e=>setGroupSearch(e.target.value)} placeholder="Search groups"/>
                <button className="btn btn-ghost" onClick={searchGroups}><Search size={13}/></button>
              </div>
            </Field>
            {groups.slice(0, 5).map(g => (
              <button key={g.guid} className="card-el" onClick={()=>setSettings(s=>({...s, groupGuid:g.guid, groupName:g.name || g.guid}))} style={{ width:"100%", border:"1px solid var(--border)", padding:"8px 10px", marginBottom:6, textAlign:"left", cursor:"pointer", background:"var(--bg-el)" }}>
                <div style={{ fontSize:12, fontWeight:700 }}>{g.name || g.guid}</div>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{g.guid}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding:0, overflow:"hidden", minWidth:0 }}>
          <div style={{ padding:14, borderBottom:"1px solid var(--border)", display:"flex", gap:10, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button className={`btn ${mode === "user" ? "btn-blue" : "btn-ghost"}`} onClick={()=>setMode("user")}><Users size={13}/>Individual</button>
              <button className={`btn ${mode === "group" ? "btn-blue" : "btn-ghost"}`} onClick={()=>setMode("group")}><Hash size={13}/>Group</button>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>VIEW AS</span>
              {actors.map(a => <button key={a.id} className={`btn ${viewer === a.id ? "btn-blue" : "btn-ghost"}`} onClick={()=>setViewer(a.id)}>{a.label}</button>)}
            </div>
          </div>

          <div style={{ padding:16, borderBottom:"1px solid var(--border)", display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:12 }}>
            {actors.map(a => (
              <div key={a.id} className="card-el" style={{ padding:"10px 12px", borderColor:sender === a.id ? "rgba(0,119,204,0.45)" : "var(--border)", background:sender === a.id ? "var(--blue-dim)" : "var(--bg-el)" }}>
                <label style={{ display:"flex", gap:8, alignItems:"flex-start", cursor:"pointer" }}>
                  <input type="radio" checked={sender === a.id} onChange={()=>setSender(a.id)} style={{ marginTop:3 }}/>
                  <span>
                    <span style={{ display:"block", fontSize:13, fontWeight:800 }}>{a.label} sends</span>
                    <span className="mono" style={{ display:"block", fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{a.uid}</span>
                    <span style={{ display:"block", fontSize:11, color:"var(--text-sec)", marginTop:4 }}>{a.note}</span>
                  </span>
                </label>
              </div>
            ))}
          </div>

          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <Tag label={mode === "group" ? "Group thread" : "User thread"}/>
            <span style={{ fontSize:13, color:"var(--text-sec)" }}>
              {mode === "group" ? `${settings.groupName || "Group"} (${settings.groupGuid})` : `${actorLabel(settings.dispatchUid, settings, copy)} <-> ${actorLabel(settings.driverUid, settings, copy)}`}
            </span>
          </div>

          <div ref={transcriptRef} style={{ height:560, maxHeight:"60vh", overflowY:"auto", padding:16, background:"linear-gradient(180deg,#f8fafc,#eef2f7)" }}>
            {loading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)", gap:8 }}><Loader size={16} className="spin"/>Loading conversation...</div>
            ) : messages.length === 0 ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)", fontSize:13 }}>No messages found for this thread yet.</div>
            ) : messages.map(m => {
              const mine = m.sender === viewerUid;
              return (
                <div key={m.id || `${m.sender}-${m.sentAt}`} style={{ display:"flex", justifyContent:mine ? "flex-end" : "flex-start", marginBottom:10 }}>
                  <div style={{ maxWidth:"72%", minWidth:180, background:mine ? "var(--blue)" : "#fff", color:mine ? "#fff" : "var(--text)", border:"1px solid var(--border)", borderRadius:8, padding:"9px 11px", boxShadow:"0 1px 4px rgba(15,23,42,0.08)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:800 }}>{actorLabel(m.sender, settings, copy)}</span>
                      <span className="mono" style={{ fontSize:10, opacity:0.75 }}>{getMessageTime(m)}</span>
                    </div>
                    <div style={{ fontSize:13, lineHeight:1.45, whiteSpace:"pre-wrap", overflowWrap:"anywhere" }}>{getMessageText(m)}</div>
                    <div className="mono" style={{ fontSize:9, opacity:0.65, marginTop:6 }}>#{m.id} to {m.receiverType}:{m.receiver}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding:14, borderTop:"1px solid var(--border)", display:"flex", gap:10, alignItems:"flex-end" }}>
            <textarea className="input" rows={2} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage(); }} placeholder={`Message ${mode === "group" ? settings.groupName : actorLabel(receiver, settings, copy)}`}/>
            <button className="btn btn-blue" onClick={sendMessage} disabled={sending || !draft.trim()} style={{ height:42, opacity:sending || !draft.trim() ? 0.6 : 1 }}>
              {sending ? <Loader size={14} className="spin"/> : <Send size={14}/>}Send
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
