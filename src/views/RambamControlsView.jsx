import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpenCheck, CalendarDays, CheckCircle2, ChevronRight, Loader, RefreshCw, Search, Users, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const API_URL = "/api/rambam-controls";

const fmtDate = (value, opts = {}) => {
  if (!value) return "—";
  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "short", day: "numeric", ...opts,
  });
};

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const pct = (done, total) => total ? Math.round((done / total) * 100) : 0;

const Pill = ({ children, tone = "blue" }) => {
  const colors = {
    blue: ["var(--blue-dim)", "var(--blue)"],
    green: ["var(--green-dim)", "var(--green)"],
    amber: ["var(--amber-dim)", "var(--amber)"],
    gray: ["var(--bg-el)", "var(--text-sec)"],
  };
  const [background, color] = colors[tone] || colors.blue;
  return <span className="mono" style={{ display:"inline-flex", alignItems:"center", padding:"3px 7px", borderRadius:999, background, color, fontSize:9, whiteSpace:"nowrap" }}>{children}</span>;
};

const Stat = ({ label, value, sub, tone = "blue" }) => (
  <div className="card" style={{ padding:"13px 15px", minWidth:150 }}>
    <div className="mono" style={{ fontSize:9, color:"var(--text-sec)", textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
    <div className="display" style={{ fontSize:21, fontWeight:800, marginTop:4, color:`var(--${tone})` }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{sub}</div>}
  </div>
);

export function RambamControlsView() {
  const [payload, setPayload] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("members");
  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [dayFilter, setDayFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const [apiResponse, contactsResponse] = await Promise.all([
        fetch(API_URL, { cache:"no-store", headers:session ? { Authorization:`Bearer ${session.access_token}` } : {} }),
        supabase ? supabase.from("contacts").select("id,name,phone,email,tags,source,notes") : Promise.resolve({ data:[] }),
      ]);
      if (!apiResponse.ok) throw new Error(`Rambam ledger returned ${apiResponse.status}`);
      const next = await apiResponse.json();
      setPayload(next);
      setContacts(contactsResponse.data || []);
      setSelectedDate((current) => current || next.run?.windowEnd || "");
    } catch (err) {
      setError(err.message || "Could not load Rambam controls.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const members = useMemo(() => (payload?.members || []).map((member) => {
    const contact = contacts.find((item) => normalize(item.name) === normalize(member.displayName));
    return {
      ...member,
      contactId: contact?.id || null,
      phone: contact?.phone || member.phone || "",
      email: contact?.email || "",
      contactTags: contact?.tags || [],
      contactSource: contact?.source || "WhatsApp",
    };
  }), [payload, contacts]);

  const filteredMembers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => !needle || [member.displayName, member.phone, member.track, ...(member.groupTags || [])].join(" ").toLowerCase().includes(needle));
  }, [members, query]);

  const dayRows = useMemo(() => (payload?.dailyRecords || [])
    .filter((row) => row.date === selectedDate)
    .filter((row) => dayFilter === "all" || row.status === dayFilter)
    .filter((row) => !query.trim() || row.member.toLowerCase().includes(query.trim().toLowerCase())), [payload, selectedDate, dayFilter, query]);

  const completedToday = (payload?.dailyRecords || []).filter((row) => row.date === selectedDate && row.status === "completed").length;
  const selected = selectedMember ? members.find((member) => member.id === selectedMember) : null;
  const selectedDays = selected ? (payload?.dailyRecords || []).filter((row) => row.personId === selected.id) : [];

  if (loading) return <div style={{ minHeight:"70vh", display:"grid", placeItems:"center" }}><div style={{ textAlign:"center" }}><Loader className="spin" size={24} color="var(--blue)"/><div className="mono" style={{ marginTop:10, color:"var(--text-sec)" }}>Loading evidence ledger…</div></div></div>;

  return (
    <div style={{ padding:"22px clamp(14px,3vw,34px) 48px", maxWidth:1500, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div>
          <div style={{ display:"flex", gap:9, alignItems:"center" }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"var(--blue-dim)", display:"grid", placeItems:"center" }}><BookOpenCheck size={19} color="var(--blue)"/></div>
            <div>
              <h2 className="display" style={{ fontSize:21, fontWeight:800, margin:0 }}>Rambam Controls</h2>
              <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:3 }}>CONTACTS · DAILY EVIDENCE · MISSING CIVIL DATES</div>
            </div>
          </div>
          {payload?.run && <div style={{ marginTop:9, fontSize:11, color:"var(--text-sec)" }}>Snapshot completed {new Date(payload.run.completedAt).toLocaleString()} · Evidence window {fmtDate(payload.run.windowStart)}–{fmtDate(payload.run.windowEnd)}</div>}
        </div>
        <button className="btn btn-ghost" onClick={load}><RefreshCw size={13}/> Refresh</button>
      </div>

      {error && <div style={{ marginTop:18, padding:14, borderRadius:10, background:"var(--red-dim)", color:"var(--red)", display:"flex", gap:9 }}><AlertCircle size={17}/>{error}</div>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginTop:18 }}>
        <Stat label="Group members" value={members.length} sub="Active in the ledger"/>
        <Stat label="Linked contacts" value={members.filter((member) => member.contactId).length} sub="Matched to personal Contacts" tone="green"/>
        <Stat label="Completed on date" value={`${completedToday}/${members.length}`} sub={fmtDate(selectedDate, { year:"numeric" })} tone="green"/>
        <Stat label="Needs verification" value={members.reduce((sum, member) => sum + Math.max(0, Number(member.publishedCompletedDays || 0) - Number(member.recordedRolling30?.completedDays || 0)), 0)} sub="Published totals without dated evidence" tone="amber"/>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:18, flexWrap:"wrap" }}>
        <div style={{ display:"flex", padding:3, borderRadius:9, background:"var(--bg-el)", border:"1px solid var(--border)" }}>
          {[{id:"members",label:"Members",icon:Users},{id:"days",label:"Daily ledger",icon:CalendarDays}].map((item) => <button key={item.id} onClick={()=>setTab(item.id)} style={{ border:0, borderRadius:7, padding:"7px 11px", display:"flex", alignItems:"center", gap:6, background:tab===item.id?"var(--bg-card)":"transparent", color:tab===item.id?"var(--text)":"var(--text-sec)", cursor:"pointer", boxShadow:tab===item.id?"0 1px 4px rgba(0,0,0,.12)":"none" }}><item.icon size={13}/>{item.label}</button>)}
        </div>
        <label style={{ flex:"1 1 260px", maxWidth:390, position:"relative" }}><Search size={13} style={{ position:"absolute", left:10, top:10, color:"var(--text-sec)" }}/><input className="input" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder={tab==="members"?"Search members, phone, group or track…":"Search this day…"} style={{ paddingLeft:31 }}/></label>
      </div>

      {tab === "members" && <div className="card" style={{ marginTop:12, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1040 }}>
            <thead><tr>{["Member","Phone","WhatsApp groups","Track","This week (Fri–Fri)","Rolling 30 days","No recorded check","Published rank",""].map((heading) => <th key={heading} style={{ position:"sticky", top:0, zIndex:2, background:"var(--bg-card)", padding:"11px 12px", borderBottom:"1px solid var(--border)", textAlign:"left", fontSize:9, color:"var(--text-sec)", letterSpacing:.8, textTransform:"uppercase", whiteSpace:"nowrap" }}>{heading}</th>)}</tr></thead>
            <tbody>{filteredMembers.map((member) => {
              const rolling = member.recordedRolling30 || {};
              const week = member.recordedWeek || {};
              const publishedDiffers = Number(member.publishedCompletedDays) !== Number(rolling.completedDays);
              return <tr key={member.id} onClick={()=>setSelectedMember(member.id)} style={{ cursor:"pointer", borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:12 }}><div style={{ fontWeight:700, fontSize:13 }}>{member.displayName}</div><div className="mono" style={{ fontSize:9, color:member.contactId?"var(--green)":"var(--amber)", marginTop:3 }}>{member.contactId?`CONTACT #${member.contactId}`:"NOT YET LINKED"}</div></td>
                <td style={{ padding:12, fontSize:11, color:member.phone?"var(--text)":"var(--text-sec)" }}>{member.phone || "Not recorded"}</td>
                <td style={{ padding:12 }}>{(member.groupTags || []).map((tag) => <Pill key={tag}>{tag}</Pill>)}</td>
                <td style={{ padding:12 }}><Pill tone={member.chaptersPerDay===3?"amber":"gray"}>{member.track}</Pill></td>
                <td style={{ padding:12 }}><div style={{ fontWeight:750 }}>{week.completedDays}/{week.eligibleDays} <span style={{ color:"var(--text-sec)", fontWeight:500 }}>({pct(week.completedDays,week.eligibleDays)}%)</span></div><div style={{ fontSize:9, color:"var(--text-sec)", marginTop:3 }}>{fmtDate(week.start)}–{fmtDate(week.end)}</div></td>
                <td style={{ padding:12 }}><div style={{ fontWeight:750 }}>{rolling.completedDays}/{rolling.eligibleDays} <span style={{ color:"var(--text-sec)", fontWeight:500 }}>({pct(rolling.completedDays,rolling.eligibleDays)}%)</span></div>{publishedDiffers && <div className="mono" style={{ fontSize:8, color:"var(--amber)", marginTop:3 }}>PUBLISHED: {member.publishedCompletedDays}/{rolling.eligibleDays}</div>}</td>
                <td style={{ padding:12, maxWidth:280 }}><div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>{(rolling.missingDates || []).slice(0,6).map((date) => <Pill key={date} tone="amber">{fmtDate(date)}</Pill>)}{rolling.missingDates?.length > 6 && <Pill tone="gray">+{rolling.missingDates.length-6}</Pill>}{!rolling.missingDates?.length && <Pill tone="green">None</Pill>}</div></td>
                <td style={{ padding:12 }}><strong>#{member.rank || "—"}</strong>{member.movementDirection && <div className="mono" style={{ fontSize:9, color:member.movementDirection==="up"?"var(--green)":member.movementDirection==="down"?"var(--red)":"var(--text-sec)" }}>{member.movementDirection.toUpperCase()} {member.movementPlaces || 0}</div>}</td>
                <td style={{ padding:12 }}><ChevronRight size={15} color="var(--text-sec)"/></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </div>}

      {tab === "days" && <div style={{ marginTop:12 }}>
        <div className="card" style={{ padding:12, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <label><span className="mono" style={{ fontSize:9, color:"var(--text-sec)", marginRight:7 }}>CIVIL DATE</span><input className="input" type="date" min={payload?.run?.windowStart} max={payload?.run?.windowEnd} value={selectedDate} onChange={(event)=>setSelectedDate(event.target.value)} style={{ width:155 }}/></label>
          <div style={{ display:"flex", gap:5 }}>{[{id:"all",label:"All"},{id:"completed",label:"Completed"},{id:"no_recorded_check",label:"No check recorded"}].map((item) => <button key={item.id} className="btn btn-ghost" onClick={()=>setDayFilter(item.id)} style={{ background:dayFilter===item.id?"var(--blue-dim)":"transparent", color:dayFilter===item.id?"var(--blue)":"var(--text-sec)" }}>{item.label}</button>)}</div>
          <div className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>{completedToday} COMPLETED · {members.length-completedToday} WITHOUT RECORDED CHECK</div>
        </div>
        <div className="card" style={{ marginTop:10, overflow:"hidden" }}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:850 }}>
          <thead><tr>{["Member","Status","Recorded / required","Source posted","Allocation / evidence"].map((heading) => <th key={heading} style={{ padding:"11px 12px", borderBottom:"1px solid var(--border)", textAlign:"left", fontSize:9, color:"var(--text-sec)", letterSpacing:.8, textTransform:"uppercase" }}>{heading}</th>)}</tr></thead>
          <tbody>{dayRows.map((row) => <tr key={`${row.date}-${row.personId}`} onClick={()=>setSelectedMember(row.personId)} style={{ cursor:"pointer", borderBottom:"1px solid var(--border)" }}>
            <td style={{ padding:12, fontWeight:700 }}>{row.member}</td>
            <td style={{ padding:12 }}>{row.status==="completed"?<Pill tone="green"><CheckCircle2 size={10} style={{marginRight:4}}/>Completed</Pill>:<Pill tone="amber"><XCircle size={10} style={{marginRight:4}}/>No recorded check</Pill>}</td>
            <td style={{ padding:12 }}><strong>{row.chaptersRecorded}/{row.chaptersRequired}</strong> chapters</td>
            <td style={{ padding:12, fontSize:10, color:"var(--text-sec)" }}>{(row.sourcePostedAt || []).map((value) => new Date(value).toLocaleString()).join(" · ") || "—"}</td>
            <td style={{ padding:12, fontSize:10, color:"var(--text-sec)", maxWidth:420 }}>{(row.evidence || []).map((item) => `${item.ruleApplied}: ${item.sourceEvidence || item.sourceType}`).join(" · ") || "No accepted evidence allocated to this date"}</td>
          </tr>)}</tbody>
        </table></div></div>
      </div>}

      <div style={{ marginTop:12, padding:"10px 12px", borderRadius:9, background:"var(--amber-dim)", color:"var(--text-sec)", fontSize:10, lineHeight:1.55 }}><strong style={{ color:"var(--amber)" }}>Verification rule:</strong> “No recorded check” means no accepted check evidence is assigned to that civil date. It is not proof that the person did not learn. Published leaderboard totals remain visible when they differ from the dated evidence ledger.</div>

      {selected && <div style={{ position:"fixed", inset:0, zIndex:1200, background:"rgba(0,0,0,.42)", display:"flex", justifyContent:"flex-end" }} onClick={(event)=>{if(event.target===event.currentTarget)setSelectedMember(null)}}>
        <div style={{ width:"min(580px,96vw)", height:"100%", background:"var(--bg-card)", borderLeft:"1px solid var(--border)", padding:20, overflowY:"auto", boxShadow:"-12px 0 35px rgba(0,0,0,.18)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}><div><h3 className="display" style={{ margin:0, fontSize:19 }}>{selected.displayName}</h3><div style={{ marginTop:6, display:"flex", gap:5, flexWrap:"wrap" }}><Pill tone={selected.chaptersPerDay===3?"amber":"gray"}>{selected.track}</Pill>{selected.groupTags.map((tag)=><Pill key={tag}>{tag}</Pill>)}</div></div><button className="btn btn-ghost" onClick={()=>setSelectedMember(null)}><XCircle size={15}/></button></div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:8, marginTop:16 }}><Stat label="This week" value={`${selected.recordedWeek.completedDays}/${selected.recordedWeek.eligibleDays}`} sub={`${selected.recordedWeek.missingDays} dates without checks`} tone="green"/><Stat label="Rolling 30" value={`${selected.recordedRolling30.completedDays}/${selected.recordedRolling30.eligibleDays}`} sub={`${selected.recordedRolling30.missingDays} dates without checks`}/></div>
          <div style={{ marginTop:18 }}><div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:8 }}>30-DAY CIVIL DATE AUDIT</div><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(92px,1fr))", gap:6 }}>{selectedDays.map((row) => <button key={row.date} onClick={()=>{setSelectedDate(row.date);setTab("days");setSelectedMember(null)}} style={{ textAlign:"left", border:`1px solid ${row.status==="completed"?"rgba(22,163,74,.25)":"rgba(217,119,6,.25)"}`, background:row.status==="completed"?"var(--green-dim)":"var(--amber-dim)", borderRadius:8, padding:"8px 9px", cursor:"pointer", color:"var(--text)" }}><div className="mono" style={{ fontSize:9 }}>{fmtDate(row.date)}</div><div style={{ fontSize:10, marginTop:4, color:row.status==="completed"?"var(--green)":"var(--amber)" }}>{row.status==="completed"?"Completed":"No check"}</div></button>)}</div></div>
        </div>
      </div>}
    </div>
  );
}
