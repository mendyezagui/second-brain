import { Fragment, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDown, CheckCircle, Inbox, Loader, RefreshCw, Send, Shield, Sparkles, Trash2, X } from "lucide-react";
import { SUPA_KEY, SUPA_URL, supabase } from "../lib/supabase";

export const INBOX_ACCOUNT_COLORS = ["var(--blue)","var(--purple)","var(--green)","var(--amber)","var(--red)"];

export const INBOX_REPLY_PROVIDERS = [
  { id: "google",    label: "Gemini" },
  { id: "anthropic", label: "Claude" },
  { id: "openai",    label: "ChatGPT" },
];

export function inboxStripImages(html) {
  if (!html) return { html: "", imgCount: 0 };
  let imgCount = 0;
  let out = html.replace(/<img\b[^>]*>/gi, () => { imgCount++; return ""; });
  // Neutralize CSS background-image URLs too
  out = out.replace(/background(-image)?:\s*url\([^)]*\)/gi, "background:none");
  return { html: out, imgCount };
}

export const InboxView = ({ session }) => {
  const [accounts, setAccounts] = useState([]);
  const [acctColors, setAcctColors] = useState({});
  const [selectedAcct, setSelectedAcct] = useState(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [emails, setEmails] = useState([]); // lightweight list rows
  const [selectedThread, setSelectedThread] = useState(null); // { key, thread_id, account_id, emails: [full] }
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showHtml, setShowHtml] = useState(true);
  const [error, setError] = useState(null);
  const [showImagesFor, setShowImagesFor] = useState({});
  const [expandedMessages, setExpandedMessages] = useState({});

  // Reply composer state
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyProvider, setReplyProvider] = useState("google");
  const [replyFromAccount, setReplyFromAccount] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const loadAccounts = async () => {
    if (!supabase) return;
    const { data, error: e } = await supabase
      .from("email_accounts")
      .select("id, address, display_name, provider, is_active")
      .eq("is_active", true)
      .order("address");
    if (e) { setError(e.message); return; }
    const list = data || [];
    setAccounts(list);
    const colors = {};
    list.forEach((a, i) => { colors[a.id] = INBOX_ACCOUNT_COLORS[i % INBOX_ACCOUNT_COLORS.length]; });
    setAcctColors(colors);
  };

  const loadEmails = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    let q = supabase
      .from("emails")
      .select("id, account_id, provider_thread_id, from_addr, from_name, subject, snippet, received_at, is_read, direction, is_archived")
      .or("is_archived.is.null,is_archived.eq.false")
      .order("received_at", { ascending: false })
      .limit(400);
    if (selectedAcct) q = q.eq("account_id", selectedAcct);
    if (unreadOnly) q = q.eq("is_read", false);
    if (debounced.trim()) {
      const s = debounced.trim().replace(/[%_\\]/g, m => "\\" + m);
      q = q.or(`subject.ilike.%${s}%,from_addr.ilike.%${s}%,from_name.ilike.%${s}%,snippet.ilike.%${s}%`);
    }
    const { data, error: e } = await q;
    if (e) { setError(e.message); setLoading(false); return; }
    setEmails(data || []);
    setLoading(false);
  };

  // Group flat emails into threads by provider_thread_id
  const threads = useMemo(() => {
    const map = new Map();
    for (const e of emails) {
      const key = e.provider_thread_id ? `t:${e.account_id}:${e.provider_thread_id}` : `m:${e.id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          thread_id: e.provider_thread_id || null,
          account_id: e.account_id,
          emails: [],
          subject: e.subject,
          latest_at: e.received_at,
          latest_from_name: e.from_name,
          latest_from_addr: e.from_addr,
          latest_snippet: e.snippet,
          unread_count: 0,
        });
      }
      const t = map.get(key);
      t.emails.push(e);
      if (new Date(e.received_at) >= new Date(t.latest_at)) {
        t.latest_at = e.received_at;
        t.subject = e.subject;
        t.latest_from_name = e.from_name;
        t.latest_from_addr = e.from_addr;
        t.latest_snippet = e.snippet;
      }
      if (!e.is_read) t.unread_count++;
    }
    return [...map.values()].sort((a, b) => new Date(b.latest_at) - new Date(a.latest_at));
  }, [emails]);

  const openThread = async (thread) => {
    if (!supabase) return;
    setReplyOpen(false);
    setReplyBody("");
    setActionMsg(null);

    let fullEmails = [];
    if (thread.thread_id) {
      const { data, error: e } = await supabase
        .from("emails")
        .select("*")
        .eq("account_id", thread.account_id)
        .eq("provider_thread_id", thread.thread_id)
        .order("received_at", { ascending: true });
      if (e) { setError(e.message); return; }
      fullEmails = data || [];
    } else {
      const { data, error: e } = await supabase
        .from("emails")
        .select("*")
        .eq("id", thread.emails[0].id)
        .maybeSingle();
      if (e) { setError(e.message); return; }
      fullEmails = data ? [data] : [];
    }

    setSelectedThread({
      key: thread.key,
      thread_id: thread.thread_id,
      account_id: thread.account_id,
      emails: fullEmails,
    });

    // Default expanded: only the latest message (last in array since asc order)
    const expanded = {};
    if (fullEmails.length > 0) expanded[fullEmails[fullEmails.length - 1].id] = true;
    setExpandedMessages(expanded);

    const latest = fullEmails[fullEmails.length - 1];
    if (latest) {
      setReplyTo(latest.from_addr || "");
      const subj = (latest.subject || "").trim();
      setReplySubject(/^re:/i.test(subj) ? subj : (subj ? `Re: ${subj}` : "Re:"));
      setReplyFromAccount(latest.account_id || "");
    }

    // Mark unread messages in the thread as read
    const unreadIds = thread.emails.filter(e => !e.is_read).map(e => e.id);
    if (unreadIds.length > 0) {
      setEmails(es => es.map(e => unreadIds.includes(e.id) ? { ...e, is_read: true } : e));
      supabase.from("emails").update({ is_read: true }).in("id", unreadIds).then(() => {});
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" };
      await Promise.all([
        fetch(`${SUPA_URL}/functions/v1/email-sync`, { method: "POST", headers }),
        fetch(`${SUPA_URL}/functions/v1/calendar-sync?primary_only=true`, { method: "POST", headers }),
      ]);
    } catch (e) { setError(String(e)); }
    await loadAccounts();
    await loadEmails();
    setSyncing(false);
  };

  const callEmailAction = async (payload) => {
    const r = await fetch(`${SUPA_URL}/functions/v1/email-action`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
    return j;
  };

  // Archive/trash operate on a whole thread (Gmail semantics)
  const handleArchiveThread = async (thread) => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setError(null);
    try {
      const ids = thread.emails.map(e => e.id);
      for (const id of ids) {
        await callEmailAction({ action: "archive", message_id: id });
      }
      setEmails(es => es.filter(e => !ids.includes(e.id)));
      if (selectedThread?.key === thread.key) setSelectedThread(null);
      setActionMsg(ids.length > 1 ? `Archived ${ids.length} messages.` : "Archived.");
    } catch (e) { setError(String(e.message || e)); }
    setActionInProgress(false);
  };

  const handleTrashThread = async (thread) => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setError(null);
    try {
      const ids = thread.emails.map(e => e.id);
      for (const id of ids) {
        await callEmailAction({ action: "trash", message_id: id });
      }
      setEmails(es => es.filter(e => !ids.includes(e.id)));
      if (selectedThread?.key === thread.key) setSelectedThread(null);
      setActionMsg(ids.length > 1 ? `Moved ${ids.length} messages to Trash.` : "Moved to Trash.");
    } catch (e) { setError(String(e.message || e)); }
    setActionInProgress(false);
  };

  const generateReply = async () => {
    if (!selectedThread || !selectedThread.emails.length || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const latest = selectedThread.emails[selectedThread.emails.length - 1];
      const orig = (latest.body_text || latest.snippet || "").slice(0, 6000);
      const r = await fetch(`${SUPA_URL}/functions/v1/llm-proxy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: replyProvider,
          system: "You are drafting an email reply on behalf of the user. Write a concise, natural, professional response. Plain text only — no markdown, no salutation if obvious from context, no signature. Match the tone of the original.",
          messages: [{
            role: "user",
            content: `Original email:\nFrom: ${latest.from_name || ""} <${latest.from_addr || ""}>\nSubject: ${latest.subject || ""}\n\n${orig}\n\n---\nDraft a short reply:`,
          }],
          maxTokens: 600,
        }),
      });
      const j = await r.json();
      if (j.text) setReplyBody(j.text.trim());
      else if (j.error) setError(`AI: ${j.error}`);
    } catch (e) { setError(`AI: ${String(e.message || e)}`); }
    setGenerating(false);
  };

  const sendReply = async () => {
    if (!selectedThread || !selectedThread.emails.length || !replyBody.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const latest = selectedThread.emails[selectedThread.emails.length - 1];
      const sentFrom = accounts.find(a => a.id === replyFromAccount)?.address;
      await callEmailAction({
        action: "send",
        message_id: latest.id,
        to: replyTo,
        subject: replySubject,
        body: replyBody,
        from_account_id: replyFromAccount || undefined,
      });
      setActionMsg(`Reply sent${sentFrom ? ` from ${sentFrom}` : ""}.`);
      setReplyOpen(false);
      setReplyBody("");
    } catch (e) { setError(`Send failed: ${String(e.message || e)}`); }
    setSending(false);
  };

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { loadEmails(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedAcct, unreadOnly, debounced]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { triggerSync(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: "short", day: "numeric" });
    return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  };

  const fmtAddrs = (a) => Array.isArray(a) && a.length > 0
    ? a.map(x => x.name ? `${x.name} <${x.addr}>` : x.addr).join(", ")
    : null;

  // Render the From line in thread message header — robust against missing name/addr
  const renderFromLine = (from_name, from_addr) => {
    if (!from_name && !from_addr) return <em style={{ color: "var(--text-dim)" }}>(no sender)</em>;
    if (from_name && from_addr) return (<><strong>{from_name}</strong> <span style={{ color: "var(--text-sec)" }}>&lt;{from_addr}&gt;</span></>);
    if (from_name) return <strong>{from_name}</strong>;
    return <span>{from_addr}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", flexWrap: "wrap" }}>
        <div className="display" style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <Inbox size={18} color="var(--blue)" /> Inbox
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setSelectedAcct(null)} className="filter-chip"
            style={selectedAcct === null ? { background: "var(--blue-dim)", color: "var(--blue)", borderColor: "var(--blue)" } : {}}>
            All
          </button>
          {accounts.map(a => {
            const color = acctColors[a.id];
            const active = selectedAcct === a.id;
            return (
              <button key={a.id} onClick={() => setSelectedAcct(a.id)} className="filter-chip"
                style={{ background: active ? color : "var(--bg-card)", color: active ? "#fff" : "var(--text-sec)", borderColor: active ? color : "var(--border)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#fff" : color }} />
                {a.address}
              </button>
            );
          })}
        </div>
        <input className="input" placeholder="Search subject, sender, snippet…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 320, marginLeft: "auto" }} />
        <button className="btn btn-ghost" onClick={() => setUnreadOnly(u => !u)}
          style={unreadOnly ? { background: "var(--blue-dim)", color: "var(--blue)", borderColor: "var(--blue)" } : {}}>
          Unread
        </button>
        <button className="btn btn-blue" onClick={triggerSync} disabled={syncing}>
          {syncing ? <><Loader size={13} className="spin" /> Syncing…</> : <><RefreshCw size={13} /> Sync now</>}
        </button>
      </div>

      {error && (
        <div style={{ padding: "8px 24px", background: "var(--red-dim)", color: "var(--red)", fontSize: 12, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={13} /> {error}
          <button className="btn-icon" onClick={() => setError(null)} style={{ marginLeft: "auto" }}><X size={13} /></button>
        </div>
      )}
      {actionMsg && !error && (
        <div style={{ padding: "6px 24px", background: "var(--green-dim)", color: "var(--green)", fontSize: 12, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={13} /> {actionMsg}
          <button className="btn-icon" onClick={() => setActionMsg(null)} style={{ marginLeft: "auto" }}><X size={13} /></button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 460px) 1fr", flex: 1, overflow: "hidden" }}>
        {/* THREAD LIST */}
        <div style={{ borderRight: "1px solid var(--border)", overflowY: "auto", background: "var(--bg)" }}>
          {loading && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-sec)", fontSize: 13 }}>
              <Loader size={16} className="spin" /> Loading…
            </div>
          )}
          {!loading && threads.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-sec)", fontSize: 13 }}>No messages.</div>
          )}
          {!loading && threads.map(thread => {
            const color = acctColors[thread.account_id] || "var(--text-sec)";
            const isSel = selectedThread?.key === thread.key;
            const fromDisplay = thread.latest_from_name || thread.latest_from_addr || "(no sender)";
            const messageCount = thread.emails.length;
            const isUnread = thread.unread_count > 0;
            return (
              <div key={thread.key} className="row-hover" onClick={() => openThread(thread)}
                style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: isSel ? "var(--bg-card)" : "transparent", borderLeft: isSel ? `3px solid ${color}` : "3px solid transparent", transition: "background 0.1s", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: isUnread ? 700 : 500, color: isUnread ? "var(--text)" : "var(--text-sec)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    {fromDisplay}
                    {messageCount > 1 && (
                      <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 400, flexShrink: 0 }}>· {messageCount}</span>
                    )}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0 }}>{fmtTime(thread.latest_at)}</span>
                </div>
                <div style={{ fontSize: 13, marginTop: 3, color: isUnread ? "var(--text)" : "var(--text-sec)", fontWeight: isUnread ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {thread.subject || "(no subject)"}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 3 }}>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {thread.latest_snippet || ""}
                  </div>
                  <span className="row-actions" style={{ display: "flex", gap: 2, opacity: 0, transition: "opacity 0.15s", flexShrink: 0 }}>
                    <button className="btn-icon" title="Archive" disabled={actionInProgress}
                      onClick={(e) => { e.stopPropagation(); handleArchiveThread(thread); }}
                      style={{ width: 24, height: 24 }}>
                      <ArrowDown size={13} color="var(--text-sec)" />
                    </button>
                    <button className="btn-icon delete" title="Trash" disabled={actionInProgress}
                      onClick={(e) => { e.stopPropagation(); handleTrashThread(thread); }}
                      style={{ width: 24, height: 24 }}>
                      <Trash2 size={13} color="var(--text-sec)" />
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* DETAIL */}
        <div style={{ overflowY: "auto", padding: "20px 32px 32px", background: "var(--bg-card)" }}>
          {!selectedThread && (
            <div style={{ color: "var(--text-dim)", textAlign: "center", marginTop: "30vh", fontSize: 14 }}>
              Select a message to read
            </div>
          )}
          {selectedThread && selectedThread.emails.length > 0 && (() => {
            const acct = accounts.find(a => a.id === selectedThread.account_id);
            const acctLabel = acct ? acct.address : "?";
            const latestSubject = selectedThread.emails[selectedThread.emails.length - 1].subject || "(no subject)";
            const anyHasHtml = selectedThread.emails.some(e => e.body_html);
            return (
              <Fragment>
                {/* TOP ACTION BAR — Reply only (archive/trash live in the list) */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
                  <button className="btn btn-blue" onClick={() => setReplyOpen(o => !o)} disabled={actionInProgress}>
                    <Send size={13} /> Reply
                  </button>
                  {anyHasHtml && (
                    <button className="btn btn-ghost" style={{ marginLeft: "auto", fontSize: 11, padding: "4px 10px" }}
                      onClick={() => setShowHtml(h => !h)}>
                      {showHtml ? "Plain text" : "HTML"}
                    </button>
                  )}
                </div>

                {/* REPLY COMPOSER — AT THE TOP */}
                {replyOpen && (
                  <div className="card slide-in" style={{ marginBottom: 20, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <Send size={14} color="var(--blue)" />
                      <strong style={{ fontSize: 14 }}>Reply</strong>
                      <select className="filter-select" value={replyProvider} onChange={e => setReplyProvider(e.target.value)} style={{ marginLeft: "auto" }}>
                        {INBOX_REPLY_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                      <button className="btn btn-ghost" onClick={generateReply} disabled={generating}>
                        {generating ? <><Loader size={12} className="spin" /> Generating…</> : <><Sparkles size={12} /> Draft with AI</>}
                      </button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">From {accounts.length > 1 && <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>· {accounts.length} accounts</span>}</label>
                      {accounts.length === 0 ? (
                        <div className="input" style={{ color: "var(--text-dim)" }}>Loading accounts…</div>
                      ) : (
                        <select className="input" value={replyFromAccount || ""}
                          onChange={e => setReplyFromAccount(e.target.value)}
                          style={{ cursor: "pointer", appearance: "auto" }}>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.display_name ? `${a.display_name} (${a.address})` : a.address}
                            </option>
                          ))}
                        </select>
                      )}
                      {replyFromAccount && replyFromAccount !== selectedThread.account_id && (
                        <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 4 }}>
                          Sending from a different account — won&apos;t thread with the original conversation.
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">To</label>
                      <input className="input" value={replyTo} onChange={e => setReplyTo(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input className="input" value={replySubject} onChange={e => setReplySubject(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message</label>
                      <textarea className="input" value={replyBody} onChange={e => setReplyBody(e.target.value)} style={{ minHeight: 180, fontFamily: "var(--font-b)" }} placeholder="Type your reply, or click Draft with AI…" />
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost" onClick={() => { setReplyOpen(false); setReplyBody(""); }}>
                        Cancel
                      </button>
                      <button className="btn btn-blue" onClick={sendReply} disabled={sending || !replyBody.trim()}>
                        {sending ? <><Loader size={13} className="spin" /> Sending…</> : <><Send size={13} /> Send</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBJECT + thread meta */}
                <h2 style={{ fontSize: 20, color: "var(--text)", lineHeight: 1.3, fontWeight: 700, marginBottom: 8 }}>
                  {latestSubject}
                </h2>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                  In: {acctLabel}
                  {selectedThread.emails.length > 1 && ` · ${selectedThread.emails.length} messages in thread`}
                </div>

                {/* MESSAGES */}
                {selectedThread.emails.map((email, idx) => {
                  const isExpanded = !!expandedMessages[email.id];
                  const showImg = !!showImagesFor[email.id];
                  const stripped = email.body_html ? inboxStripImages(email.body_html) : { html: "", imgCount: 0 };
                  const dt = email.received_at ? new Date(email.received_at).toLocaleString() : "";
                  const toLine = fmtAddrs(email.to_addrs);
                  const ccLine = fmtAddrs(email.cc_addrs);
                  return (
                    <div key={email.id} className="card" style={{ marginBottom: 10, overflow: "hidden" }}>
                      {/* HEADER (always visible, clickable to toggle) */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", cursor: "pointer", background: isExpanded ? "var(--bg)" : "transparent" }}
                        onClick={() => setExpandedMessages(s => ({ ...s, [email.id]: !s[email.id] }))}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13 }}>
                            {renderFromLine(email.from_name, email.from_addr)}
                          </div>
                          {!isExpanded && email.snippet && (
                            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {email.snippet}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0, textAlign: "right" }}>
                          {dt}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "0 16px 16px" }}>
                          <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                            <div><span style={{ color: "var(--text-dim)" }}>To:</span> {toLine || acctLabel}</div>
                            {ccLine && <div style={{ marginTop: 3 }}><span style={{ color: "var(--text-dim)" }}>Cc:</span> {ccLine}</div>}
                          </div>

                          {showHtml && email.body_html && stripped.imgCount > 0 && !showImg && (
                            <div style={{ background: "var(--amber-dim)", border: "1px solid rgba(217,119,6,0.35)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 10 }}>
                              <Shield size={16} color="var(--amber)" />
                              <span style={{ flex: 1 }}>
                                <strong>{stripped.imgCount}</strong> image{stripped.imgCount > 1 ? "s" : ""} hidden. Loading them tells the sender you opened this email and may track you.
                              </span>
                              <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() => setShowImagesFor(s => ({ ...s, [email.id]: true }))}>
                                Display images
                              </button>
                            </div>
                          )}

                          <div style={{ color: "var(--text)", lineHeight: 1.7, fontSize: 14 }}>
                            {showHtml && email.body_html ? (
                              <iframe sandbox="allow-same-origin" srcDoc={showImg ? email.body_html : stripped.html}
                                style={{ width: "100%", minHeight: 400, border: "1px solid var(--border)", background: "#fff", borderRadius: 6 }} />
                            ) : (
                              <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", fontFamily: "var(--font-b)", fontSize: 14 }}>
                                {email.body_text || "(no plain text)"}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
