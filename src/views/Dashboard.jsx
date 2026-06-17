import { AlertCircle, Award, Calendar, CheckCircle, ChevronRight, Clock, Loader, Mic, RefreshCw, Target, TrendingUp, Users, Zap } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { daysBetween, fmt, sc, today } from "../lib/utils";
import { AgentBadge, MetricCard, Tag } from "../components/ui";

export const Dashboard = ({ db, setDB, setView, navigate, session , runSweep, sweepRunning, setShowVoiceLab}) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userName = session?.user?.user_metadata?.full_name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "there";
  const paid = db.invoices.filter(i=>i.status==="paid").reduce((a,i)=>a+i.amount,0);
  const pipeline = db.deals.reduce((a,d)=>a+d.value*d.probability/100,0);
  const overdue = db.invoices.filter(i=>i.status==="overdue").reduce((a,i)=>a+i.amount,0);
  const goal = db.goals.find(g=>g.status==="active") || { target_value:800000 };
  const goalPct = Math.round((paid / goal.target_value) * 100);
  const openTasks = db.tasks.filter(t=>!t.done && t.status !== "done" && t.status !== "cancelled");
  const dueTodayOrOverdue = openTasks.filter(t => t.due && t.due <= today());
  const criticalItems = openTasks.filter(t=>t.priority==="critical");
  const decayedContacts = db.contacts.filter(c => c.lastTouch && c.score >= 60 && daysBetween(c.lastTouch, today()) > 14);
  const todayEvents = (db.events||[]).filter(e=>e.date===today()).sort((a,b)=>(a.start_time||"").localeCompare(b.start_time||""));

  // Real revenue trend: paid invoices bucketed into the trailing 6 months.
  const revSeries = (() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: d.getFullYear() + "-" + d.getMonth(), m: d.toLocaleDateString("en-US", { month: "short" }), rev: 0 });
    }
    const idx = {};
    buckets.forEach((b, n) => { idx[b.key] = n; });
    (db.invoices || []).filter(i => i.status === "paid" && i.issued).forEach(i => {
      const d = new Date(i.issued);
      if (isNaN(d.getTime())) return;
      const k = d.getFullYear() + "-" + d.getMonth();
      if (k in idx) buckets[idx[k]].rev += (i.amount || 0);
    });
    return buckets;
  })();
  const agentCount = new Set((db.agentLogs || []).map(l => l.agent).filter(Boolean)).size;

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:22 }}>
      {/* Morning Brief */}
      <div className="card" style={{ padding:20, borderLeft:"4px solid var(--purple)", background:"linear-gradient(135deg, rgba(124,58,237,0.03), transparent)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div className="display" style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>{greeting}, {userName}.</div>
            <div className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>
              {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} Â· {agentCount} agents active
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><button className="btn btn-sm" style={{display:"flex",alignItems:"center",gap:4,fontSize:11,padding:"4px 10px"}} onClick={()=>{if(!sweepRunning)runSweep()}}>{sweepRunning?<Loader size={13} className="spin"/>:<Zap size={13}/>} {sweepRunning?"Running...":"AI Sweep"}</button><button className="btn btn-sm" style={{display:"flex",alignItems:"center",gap:4,fontSize:11,padding:"4px 10px"}} onClick={()=>{setShowVoiceLab(true)}}><Mic size={13}/> Voice</button></div>
        </div>
        {(dueTodayOrOverdue.length > 0 || criticalItems.length > 0 || decayedContacts.length > 0 || todayEvents.length > 0) && (
          <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:6 }}>
            <div className="mono" style={{ fontSize:10, color:"var(--purple)" }}>TODAY'S PRIORITIES</div>
            {criticalItems.slice(0,3).map(t => (
              <div key={t.id} onClick={()=>navigate("tasks",{type:"task",id:t.id})} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"var(--red-dim)", borderRadius:6, cursor:"pointer", transition:"filter .15s" }} onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
                <AlertCircle size={12} color="var(--red)"/>
                <span style={{ fontWeight:600, color:"var(--red)" }}>CRITICAL:</span>
                <span>{t.title}</span>
                {t.due && <span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>Due {t.due}</span>}
                <ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0}}/>
              </div>
            ))}
            {dueTodayOrOverdue.filter(t=>t.priority!=="critical").slice(0,4).map(t => (
              <div key={t.id} onClick={()=>navigate("tasks",{type:"task",id:t.id})} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"var(--amber-dim)", borderRadius:6, cursor:"pointer", transition:"filter .15s" }} onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
                <Clock size={12} color="var(--amber)"/>
                <span>{t.title}</span>
                <Tag label={t.priority}/>
                {t.due && <span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>{t.due}</span>}
                <ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0}}/>
              </div>
            ))}
            {decayedContacts.slice(0,2).map(c => (
              <div key={c.id} onClick={()=>navigate("crm",{type:"contact",id:c.id})} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"var(--blue-dim)", borderRadius:6, cursor:"pointer", transition:"filter .15s" }} onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"} onMouseLeave={e=>e.currentTarget.style.filter=""}>
                <Users size={12} color="var(--blue)"/>
                <span>Reconnect with <strong>{c.name}</strong> ({c.co}) â {daysBetween(c.lastTouch, today())} days since last touch</span>
                <ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0}}/>
              </div>
            ))}
            {todayEvents.length > 0 && <>
              <div className="mono" style={{ fontSize:10, color:"var(--blue)", marginTop:6 }}>TODAY'S SCHEDULE</div>
              {todayEvents.slice(0,4).map(evt => (
                <div key={evt.id} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, padding:"6px 10px", background:"rgba(0,119,204,0.06)", borderRadius:6, borderLeft:`3px solid ${({meeting:"var(--blue)",call:"var(--purple)",reminder:"var(--amber)",event:"var(--green)"}[evt.type]||"var(--blue)")}` }}>
                  <Calendar size={12} color="var(--blue)"/>
                  <span className="mono" style={{ fontSize:11, color:"var(--text-sec)", flexShrink:0 }}>{evt.start_time}</span>
                  <span style={{ fontWeight:500 }}>{evt.title}</span>
                  {evt.location&&<span className="mono" style={{ fontSize:10, color:"var(--text-dim)" }}>ð {evt.location}</span>}
                </div>
              ))}
            </>}
          </div>
        )}
      </div>

      {/* AI Nudges â latest orchestrator sweep */}
      {(()=>{
        const latestSweep = (db.agentLogs||[]).find(l=>l.agent==="Orchestrator"&&l.type==="sweep");
        if(!latestSweep) return null;
        const lines = latestSweep.message.split(/\n+/).filter(l=>l.trim());
        return (
          <div className="card" style={{ padding:20, borderLeft:"4px solid var(--amber)", background:"linear-gradient(135deg, rgba(245,158,11,0.04), transparent)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Zap size={14} color="var(--amber)"/>
                <span style={{ fontFamily:"var(--font-d)", fontSize:14, fontWeight:700 }}>Today's AI Nudges</span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{latestSweep.ts}</span>
                <button className="btn btn-sm" style={{ fontSize:10, padding:"3px 8px" }} onClick={()=>{if(!sweepRunning)runSweep()}}>{sweepRunning?<Loader size={11} className="spin"/>:<RefreshCw size={11}/>}</button>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {lines.map((line,i)=>{
                const isBold = /^(\d+\.|TOP|DEAL|STRATEGIC|SMART|NUDGE|PRIORITY)/i.test(line.trim());
                return <div key={i} style={{ fontSize:13, lineHeight:1.6, fontWeight:isBold?600:400, color:isBold?"var(--text)":"var(--text-sec)", paddingLeft:isBold?0:8 }}>{line}</div>;
              })}
            </div>
          </div>
        );
      })()}

      {/* Metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12 }}>
        <MetricCard icon={TrendingUp} label="YTD Revenue" value={fmt(paid)} sub={`${fmt(goal.target_value)} target Â· ${goalPct}%`} color="--blue" trend={12}/>
        <MetricCard icon={Target} label="Wtd Pipeline" value={fmt(Math.round(pipeline))} sub={`${db.deals.length} deals`} color="--amber" trend={8}/>
        <MetricCard icon={AlertCircle} label="Overdue A/R" value={fmt(overdue)} color="--red"/>
        <MetricCard icon={CheckCircle} label="Tasks Due" value={dueTodayOrOverdue.length} sub={`${openTasks.length} total open`} color="--green"/>
      </div>

      {/* Goal Progress Bar */}
      <div className="card" style={{ padding:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <Award size={14} color="var(--purple)"/>
            <span style={{ fontFamily:"var(--font-d)", fontSize:14, fontWeight:700 }}>{goal.name || "Revenue Goal"}</span>
          </div>
          <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{fmt(paid)} / {fmt(goal.target_value)}</span>
        </div>
        <div style={{ height:8, background:"var(--bg-el)", borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.min(goalPct,100)}%`, background:goalPct>=80?"var(--green)":goalPct>=40?"var(--amber)":"var(--red)", borderRadius:4, transition:"width .5s" }}/>
        </div>
        <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:6 }}>
          {goalPct}% of target Â· {fmt(goal.target_value - paid)} remaining Â· Pipeline coverage: {Math.round((pipeline/(goal.target_value-paid))*100)}%
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="card" style={{ padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700 }}>Revenue Trend</div>
          <span className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{revSeries[0].m} - {revSeries[revSeries.length-1].m}</span>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={revSeries}>
            <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0077cc" stopOpacity={.15}/><stop offset="95%" stopColor="#0077cc" stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="m" tick={{fill:"var(--text-sec)",fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"var(--text-sec)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}K`}/>
            <Tooltip contentStyle={{background:"#fff",border:"1px solid var(--border)",borderRadius:8,fontSize:12}} formatter={v=>[`$${v.toLocaleString()}`,"Revenue"]}/>
            <Area type="monotone" dataKey="rev" stroke="#0077cc" strokeWidth={2} fill="url(#bg)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Feed */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontFamily:"var(--font-d)", fontSize:16, fontWeight:700 }}>Agent Feed</div>
          <button className="btn btn-ghost" style={{ fontSize:12, padding:"5px 10px" }} onClick={()=>{}}>All <ChevronRight size={12}/></button>
        </div>
        {db.agentLogs.slice(0,4).map(l=>(
          <div key={l.id} className="card-el slide-in" style={{ padding:"12px 14px", marginBottom:8, borderLeft:`2px solid ${sc(l.priority)}` }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
              <AgentBadge agent={l.agent}/><Tag label={l.type} color={sc(l.priority)}/>
              <span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>{l.ts}</span>
            </div>
            <p style={{ fontSize:13, lineHeight:1.5 }}>{l.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
