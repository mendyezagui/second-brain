import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageSquare, Paperclip, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import { SUPA_KEY, SUPA_URL, supabase } from "../lib/supabase";

export const LLM_PROXY_URL   = `${SUPA_URL}/functions/v1/llm-proxy`;

export const LLM_PROVIDERS   = [
  { id:"anthropic", label:"Claude",  color:"var(--purple)" },
  { id:"openai",    label:"ChatGPT", color:"var(--green)"  },
  { id:"google",    label:"Gemini",  color:"var(--blue)"   },
];

export const JUDGE_OPTIONS = [
  { value:"anthropic",  label:"Claude judges"    },
  { value:"openai",     label:"ChatGPT judges"   },
  { value:"google",     label:"Gemini judges"    },
  { value:"synthesize", label:"Claude synthesizes (merged answer)" },
  { value:"none",       label:"No judge (side-by-side only)" },
];

export const JUDGE_SYSTEM_COMPARE = `You are a careful judge. Three AI assistants have answered the user's question independently. Your job:
1. In one paragraph, state which answer is strongest overall and why.
2. List each assistant's key strengths and any mistakes/weaknesses.
Keep it tight — no preamble, no conclusion.`;

export const JUDGE_SYSTEM_SYNTH = `You are synthesizing the best single answer from three AI candidates. Take the strongest points from each, fix mistakes, and produce ONE clean answer to the user's prompt. Do not mention the candidates — just give the merged answer.`;

export async function callLLMProxy({ provider, messages, system, model }) {
  // Always use the public anon key for the edge function call so a stale user
  // JWT can never cause a gateway 401. Provider keys live in function secrets.
  const started = Date.now();
  try {
    const r = await fetch(LLM_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${SUPA_KEY}`,
        "apikey":        SUPA_KEY,
      },
      body: JSON.stringify({ provider, messages, system, model }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d?.error || d?.message || `${provider} ${r.status}`);
    return { text: d.text || "", elapsed_ms: d.elapsed_ms ?? (Date.now() - started), error: null };
  } catch (e) {
    return { text: "", elapsed_ms: Date.now() - started, error: e.message || String(e) };
  }
}

export function buildHistory(messages, provider) {
  const out = [];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content, attachments: m.attachments_inline || [] });
    } else if (m.role === "assistant" && m.provider === provider) {
      out.push({ role: "assistant", content: m.content });
    }
  }
  return out;
}

export function fileToInline(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload  = () => {
      const res = fr.result || "";
      const b64 = typeof res === "string" ? (res.split(",")[1] || "") : "";
      resolve({ name: file.name, type: file.type || "application/octet-stream", dataB64: b64 });
    };
    fr.readAsDataURL(file);
  });
}

export const MultiLLMView = ({ session }) => {
  const [conversations, setConversations] = useState([]);
  const [activeId,      setActiveId]      = useState(null);
  const [messages,      setMessages]      = useState([]);   // turn-ordered; each has attachments_inline for the current session only
  const [prompt,        setPrompt]        = useState("");
  const [pendingFiles,  setPendingFiles]  = useState([]);   // File[] queued for the next send
  const [judge,         setJudge]         = useState("anthropic");
  const [busy,          setBusy]          = useState(false);
  const [renaming,      setRenaming]      = useState(null); // { id, title }
  const fileRef = useRef(null);
  const endRef  = useRef(null);

  // ── Load threads on mount
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from("llm_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      setConversations(data || []);
      if (data?.length && !activeId) setActiveId(data[0].id);
    })();
    // eslint-disable-next-line
  }, []);

  // ── Load messages when thread changes
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase
        .from("llm_messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("id", { ascending: true });
      setMessages((data || []).map(m => ({ ...m, attachments_inline: [] })));
    })();
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const newThread = async () => {
    const { data, error } = await supabase
      .from("llm_conversations")
      .insert({ title: "New conversation", judge })
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setConversations(c => [data, ...c]);
    setActiveId(data.id);
    setMessages([]);
  };

  const deleteThread = async (id) => {
    if (!window.confirm("Delete this conversation?")) return;
    await supabase.from("llm_conversations").delete().eq("id", id);
    setConversations(c => c.filter(x => x.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  };

  const renameThread = async (id, title) => {
    await supabase.from("llm_conversations").update({ title }).eq("id", id);
    setConversations(c => c.map(x => x.id === id ? { ...x, title } : x));
    setRenaming(null);
  };

  const send = async () => {
    if (busy) return;
    const text = prompt.trim();
    if (!text && pendingFiles.length === 0) return;

    // Ensure a thread exists
    let convId = activeId;
    if (!convId) {
      const { data } = await supabase
        .from("llm_conversations")
        .insert({ title: text.slice(0, 60) || "New conversation", judge })
        .select().single();
      convId = data.id;
      setConversations(c => [data, ...c]);
      setActiveId(convId);
    }

    // Convert attachments once, up-front
    const inline = [];
    for (const f of pendingFiles) { try { inline.push(await fileToInline(f)); } catch {} }

    const turn = (messages.at(-1)?.turn_index ?? 0) + 1;

    // Persist the user message
    const userRow = {
      conversation_id: convId, turn_index: turn, role: "user",
      provider: null, content: text,
      attachments: inline.map(a => ({ name: a.name, type: a.type })),
    };
    const { data: userSaved } = await supabase
      .from("llm_messages").insert(userRow).select().single();

    const optimistic = [...messages, { ...userSaved, attachments_inline: inline }];
    setMessages(optimistic);
    setPrompt("");
    setPendingFiles([]);
    setBusy(true);

    // Auto-title thread on first turn
    if (turn === 1 && text) {
      const title = text.slice(0, 60);
      await supabase.from("llm_conversations").update({ title }).eq("id", convId);
      setConversations(c => c.map(x => x.id === convId ? { ...x, title } : x));
    }

    // Fan out to all three providers in parallel
    const fanouts = await Promise.all(LLM_PROVIDERS.map(async (p) => {
      const history = buildHistory(optimistic, p.id);
      const res = await callLLMProxy({ provider: p.id, messages: history });
      const row = {
        conversation_id: convId, turn_index: turn, role: "assistant",
        provider: p.id, content: res.text,
        elapsed_ms: res.elapsed_ms, error: res.error,
      };
      const { data: saved } = await supabase
        .from("llm_messages").insert(row).select().single();
      return { ...saved, attachments_inline: [] };
    }));

    let updatedMessages = [...optimistic, ...fanouts];
    setMessages(updatedMessages);

    // Judge / Synthesize step
    if (judge !== "none") {
      const judgePrompt = [
        `User's question:\n${text}`,
        `\n\n--- Claude (anthropic) ---\n${fanouts.find(x=>x.provider==="anthropic")?.content || "(no response)"}`,
        `\n\n--- ChatGPT (openai) ---\n${fanouts.find(x=>x.provider==="openai")?.content || "(no response)"}`,
        `\n\n--- Gemini (google) ---\n${fanouts.find(x=>x.provider==="google")?.content || "(no response)"}`,
      ].join("");
      const judgeProvider = judge === "synthesize" ? "anthropic" : judge;
      const judgeSystem   = judge === "synthesize" ? JUDGE_SYSTEM_SYNTH : JUDGE_SYSTEM_COMPARE;
      const res = await callLLMProxy({
        provider: judgeProvider,
        messages: [{ role: "user", content: judgePrompt }],
        system: judgeSystem,
      });
      const row = {
        conversation_id: convId, turn_index: turn, role: "assistant",
        provider: "judge", model: `${judgeProvider}:${judge}`,
        content: res.text, elapsed_ms: res.elapsed_ms, error: res.error,
      };
      const { data: saved } = await supabase.from("llm_messages").insert(row).select().single();
      updatedMessages = [...updatedMessages, { ...saved, attachments_inline: [] }];
      setMessages(updatedMessages);
    }

    setBusy(false);
  };

  // ── Group messages by turn for rendering
  const turns = useMemo(() => {
    const groups = new Map();
    for (const m of messages) {
      if (!groups.has(m.turn_index)) groups.set(m.turn_index, { user: null, providers: {}, judge: null });
      const g = groups.get(m.turn_index);
      if (m.role === "user") g.user = m;
      else if (m.provider === "judge") g.judge = m;
      else g.providers[m.provider] = m;
    }
    return [...groups.entries()].sort((a,b) => a[0] - b[0]).map(([,g]) => g);
  }, [messages]);

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* ── Thread sidebar ── */}
      <div style={{ width:240, borderRight:"1px solid var(--border)", background:"var(--bg-card)", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)" }}>
          <button className="btn btn-blue" onClick={newThread} style={{ width:"100%", justifyContent:"center" }}>
            <Plus size={13}/> New conversation
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"6px" }}>
          {conversations.length === 0 && (
            <div style={{ padding:"14px 8px", fontSize:12, color:"var(--text-dim)" }}>No threads yet.</div>
          )}
          {conversations.map(c => (
            <div key={c.id}
              onClick={() => setActiveId(c.id)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 10px", borderRadius:7, cursor:"pointer",
                background: c.id === activeId ? "var(--blue-dim)" : "transparent",
                border:     c.id === activeId ? "1px solid rgba(0,119,204,0.2)" : "1px solid transparent",
                marginBottom:3,
              }}>
              <MessageSquare size={13} color={c.id === activeId ? "var(--blue)" : "var(--text-sec)"}/>
              {renaming?.id === c.id ? (
                <input className="input" value={renaming.title} autoFocus
                  onClick={e=>e.stopPropagation()}
                  onChange={e=>setRenaming({ ...renaming, title:e.target.value })}
                  onBlur={() => renameThread(c.id, renaming.title || c.title)}
                  onKeyDown={e=> e.key === "Enter" && renameThread(c.id, renaming.title || c.title)}
                  style={{ fontSize:12, padding:"2px 6px", flex:1 }}/>
              ) : (
                <span onDoubleClick={e=>{ e.stopPropagation(); setRenaming({ id:c.id, title:c.title });}}
                  style={{ flex:1, fontSize:12, color: c.id === activeId ? "var(--blue)" : "var(--text-sec)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {c.title}
                </span>
              )}
              <button className="btn-icon" title="Delete" onClick={e=>{ e.stopPropagation(); deleteThread(c.id); }}>
                <Trash2 size={11} color="var(--text-dim)"/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Conversation pane ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Scrollable transcript */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", background:"var(--bg)" }}>
          {turns.length === 0 && !busy && (
            <div style={{ textAlign:"center", marginTop:60, color:"var(--text-dim)" }}>
              <Sparkles size={32} style={{ opacity:0.4 }}/>
              <div style={{ fontFamily:"var(--font-d)", fontSize:17, marginTop:12, color:"var(--text-sec)" }}>
                Ask one prompt — get three answers.
              </div>
              <div style={{ fontSize:12, marginTop:6 }}>
                Each response is rendered side-by-side. A judge model picks the best or synthesizes.
              </div>
            </div>
          )}

          {turns.map((g, i) => (
            <div key={i} style={{ marginBottom:28 }}>
              {/* User bubble */}
              {g.user && (
                <div style={{
                  background:"var(--bg-card)", border:"1px solid var(--border)",
                  padding:"12px 14px", borderRadius:10, marginBottom:12, whiteSpace:"pre-wrap",
                  fontSize:13, lineHeight:1.55,
                }}>
                  <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginBottom:6 }}>YOU</div>
                  {g.user.content}
                  {(g.user.attachments || []).length > 0 && (
                    <div style={{ marginTop:8, display:"flex", gap:6, flexWrap:"wrap" }}>
                      {g.user.attachments.map((a,ai) => (
                        <span key={ai} className="mono" style={{ fontSize:10, background:"var(--bg-el)", padding:"2px 6px", borderRadius:4 }}>
                          📎 {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Provider column grid */}
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",
                gap:12,
              }}>
                {LLM_PROVIDERS.map(p => {
                  const m = g.providers[p.id];
                  return (
                    <div key={p.id} style={{
                      background:"var(--bg-card)", border:`1px solid ${p.color}33`,
                      borderRadius:10, padding:"12px 14px", fontSize:13, lineHeight:1.5,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <span className="mono" style={{ fontSize:10, color:p.color, fontWeight:600 }}>{p.label}</span>
                        {m?.elapsed_ms != null && (
                          <span className="mono" style={{ fontSize:9, color:"var(--text-dim)" }}>
                            {(m.elapsed_ms/1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      {m ? (
                        m.error
                          ? <div style={{ color:"var(--red)", fontSize:12 }}>⚠ {m.error}</div>
                          : <div style={{ whiteSpace:"pre-wrap" }}>{m.content || <em style={{ color:"var(--text-dim)" }}>(empty)</em>}</div>
                      ) : busy ? (
                        <div style={{ display:"flex", gap:6, alignItems:"center", color:"var(--text-dim)", fontSize:12 }}>
                          <Loader2 size={12} className="spin"/> thinking…
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Judge / synthesis */}
              {g.judge && (
                <div style={{
                  marginTop:12, background:"linear-gradient(135deg, var(--bg-card), rgba(124,58,237,0.04))",
                  border:"1px solid rgba(124,58,237,0.25)", borderRadius:10, padding:"12px 14px",
                  fontSize:13, lineHeight:1.55,
                }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <span className="mono" style={{ fontSize:10, color:"var(--purple)", fontWeight:600 }}>
                      ⚖ JUDGE · {g.judge.model || judge}
                    </span>
                    {g.judge.elapsed_ms != null && (
                      <span className="mono" style={{ fontSize:9, color:"var(--text-dim)" }}>
                        {(g.judge.elapsed_ms/1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  {g.judge.error
                    ? <div style={{ color:"var(--red)", fontSize:12 }}>⚠ {g.judge.error}</div>
                    : <div style={{ whiteSpace:"pre-wrap" }}>{g.judge.content}</div>}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef}/>
        </div>

        {/* ── Composer ── */}
        <div style={{ borderTop:"1px solid var(--border)", padding:"12px 16px", background:"var(--bg-card)" }}>
          {pendingFiles.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
              {pendingFiles.map((f, i) => (
                <span key={i} className="mono" style={{
                  fontSize:10, background:"var(--bg-el)", padding:"3px 8px", borderRadius:4,
                  display:"inline-flex", alignItems:"center", gap:6,
                }}>
                  📎 {f.name}
                  <button className="btn-icon" style={{ padding:0 }}
                    onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))}>
                    <X size={11} color="var(--text-dim)"/>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
            <input ref={fileRef} type="file" multiple style={{ display:"none" }}
              onChange={e => {
                const files = Array.from(e.target.files || []);
                setPendingFiles(p => [...p, ...files]);
                e.target.value = "";
              }}/>
            <button className="btn btn-ghost" title="Attach files" onClick={() => fileRef.current?.click()}
              style={{ padding:"8px 10px" }}>
              <Paperclip size={14}/>
            </button>
            <select className="input" value={judge} onChange={e=>setJudge(e.target.value)}
              style={{ width:180, fontSize:12 }}>
              {JUDGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <textarea
              className="input"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
              }}
              placeholder="Ask all three models…  (⌘+Enter to send)"
              style={{ flex:1, resize:"vertical", minHeight:42, maxHeight:220, fontSize:13, lineHeight:1.45 }}
            />
            <button className="btn btn-blue" onClick={send} disabled={busy}
              style={{ padding:"9px 14px" }}>
              {busy ? <Loader2 size={13} className="spin"/> : <Send size={13}/>}
              {busy ? "Running…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
