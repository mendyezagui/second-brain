import { useState } from "react";
import { AlertCircle, ChevronRight, Loader, Newspaper, Star, Zap } from "lucide-react";
import { callClaude, daysBetween, fmt, nextId, sc, today } from "../lib/utils";
import { AgentBadge, Tag } from "../components/ui";

export const OrchestratorView = ({ db, setDB, navigate }) => {
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [dismissed, setDismissed] = useState({});
  const [snoozing, setSnoozing] = useState(null); // key of item being snoozed

  const openTasks = db.tasks.filter(t => !t.done && t.status !== "done" && t.status !== "cancelled");
  const criticalTasks = openTasks.filter(t => t.priority === "critical");
  const highTasks = openTasks.filter(t => t.priority === "high");
  const overdueInv = db.invoices.filter(i => i.status === "overdue");
  const pendingInv = db.invoices.filter(i => i.status === "pending");
  const stalledProj = db.projects.filter(p => p.status === "stalled");
  const activeProj = db.projects.filter(p => p.status === "active");
  const activeDeals = db.deals.filter(d => !["won","lost"].includes(d.stage));
  const atRiskC = db.contacts.filter(c => c.status === "at-risk");
  const clients = db.contacts.filter(c => c.category === "customer" || c.status === "client");
  const leads = db.contacts.filter(c => c.category === "customer_lead" || c.category === "partner_lead" || c.status === "prospect");
  const paidYTD = db.invoices.filter(i => i.status === "paid").reduce((a,i) => a+i.amount, 0);
  const overdueAR = overdueInv.reduce((a,i) => a+i.amount, 0);
  const weightedPipe = Math.round(db.deals.reduce((a,d) => a+d.value*(d.probability/100), 0));
  const totalPipe = db.deals.reduce((a,d) => a+d.value, 0);
  const goal = db.goals.find(g=>g.status==="active") || { target_value:800000 };
  const revenueGap = Math.max(0, goal.target_value - paidYTD);
  const pipelineCoverage = revenueGap > 0 ? Math.round((weightedPipe / revenueGap) * 100) : 100;

  // Relationship decay detection
  const decayedContacts = db.contacts.filter(c => c.lastTouch && c.score >= 50 && daysBetween(c.lastTouch, today()) > 14);

  // Engagement recommendations from across platform
  const engagementRecs = [];
  db.contacts.filter(c=>c.follow_up).forEach(c => engagementRecs.push({ type:"follow_up", source:"CRM", message:`${c.name}: ${c.follow_up}`, priority:c.priority==="High"?"high":"medium", contactId:c.id }));
  db.deals.filter(d=>d.notes && d.probability>=50 && !["won","lost"].includes(d.stage)).forEach(d => {
    const contact = db.contacts.find(c=>c.id===d.contactId);
    engagementRecs.push({ type:"deal_action", source:"Deals", message:`${d.name} (${d.probability}%): ${d.notes}`, priority:d.probability>=70?"high":"medium", contactId:d.contactId });
  });

  // Build daily priorities (with navigation targets)
  const allPriorities = [
    ...criticalTasks.map(t => ({ key:`task-${t.id}`, isTask:true, icon:"🔴", label:t.title, detail:`Due ${t.due} · Critical`, priority:"critical", nav:{view:"tasks",focus:{type:"task",id:t.id}} })),
    ...overdueInv.map(i => ({ key:`inv-${i.id}`, isTask:false, icon:"💰", label:`${i.number} — ${i.client} — ${fmt(i.amount)} OVERDUE`, detail:`Due ${i.due}`, priority:"critical", nav:{view:"invoices",focus:{type:"invoice",id:i.id}}, taskTitle:`Follow up on overdue invoice ${i.number} — ${i.client} (${fmt(i.amount)})`, taskPriority:"critical", contactId:null, companyId:null })),
    ...atRiskC.map(c => ({ key:`risk-${c.id}`, isTask:false, icon:"⚠️", label:`${c.name} (${c.co}) is at-risk`, detail:`Score: ${c.score}. Last touch: ${c.lastTouch}`, priority:"critical", nav:{view:"crm",focus:{type:"contact",id:c.id}}, taskTitle:`Re-engage at-risk contact: ${c.name} (${c.co})`, taskPriority:"high", contactId:c.id, companyId:c.companyId||null })),
    ...highTasks.filter(t=>t.due && t.due <= today()).map(t => ({ key:`task-${t.id}`, isTask:true, icon:"🟡", label:t.title, detail:`Due today or overdue`, priority:"high", nav:{view:"tasks",focus:{type:"task",id:t.id}} })),
    ...decayedContacts.slice(0,3).map(c => ({ key:`decay-${c.id}`, isTask:false, icon:"📞", label:`Reconnect: ${c.name} (${c.co})`, detail:`${daysBetween(c.lastTouch, today())} days since last touch. Score: ${c.score}`, priority:"medium", nav:{view:"crm",focus:{type:"contact",id:c.id}}, taskTitle:`Reconnect with ${c.name} (${c.co})`, taskPriority:"medium", contactId:c.id, companyId:c.companyId||null })),
    ...engagementRecs.slice(0,3).map((r,i) => ({ key:`eng-${i}`, isTask:false, icon:"💡", label:r.message, detail:`Source: ${r.source}`, priority:r.priority, nav:r.contactId?{view:"crm",focus:{type:"contact",id:r.contactId}}:null, taskTitle:r.message.substring(0,120), taskPriority:r.priority==="high"?"high":"medium", contactId:r.contactId||null, companyId:null })),
      ...(db.projects||[]).filter(p=>p.type==="strategic"&&(p.priority==="high"||p.priority==="critical")&&p.status==="active").map(p=>({ key:"strat-"+p.id, icon:Star, color:"var(--purple)", label:p.name, sub:"Strategic priority — "+p.priority, taskTitle:"Advance "+p.name, taskPriority:p.priority, companyId:p.companyId||null })),
    ...(db.deals||[]).filter(d=>d.stage!=="closed_won"&&d.stage!=="closed_lost"&&d.lastActivity&&daysBetween(d.lastActivity,today())>7).map(d=>({ key:"stale-deal-"+d.id, icon:AlertCircle, color:"var(--amber)", label:d.name+" (⚠ stale)", sub:"No activity in "+daysBetween(d.lastActivity,today())+" days — $"+fmt(d.value), taskTitle:"Follow up on "+d.name, taskPriority:"high", dealId:d.id, companyId:d.companyId||null })),
  ];
  const dailyPriorities = allPriorities.filter(p => !dismissed[p.key]);

  const convertToTask = (p) => {
    const newTask = { id:nextId(db.tasks), title:p.taskTitle, due:today(), done:false, priority:p.taskPriority||"medium", status:"done", category:"follow_up", contactId:p.contactId||null, companyId:p.companyId||null, dealId:null, projectId:null, assignedTo:"", notes:`Completed from Orchestrator priority on ${today()}.`, source:"agent:orchestrator", recurrence:"none" };
    setDB(d=>({...d, tasks:[...d.tasks, newTask]}));
    setDismissed(d=>({...d,[p.key]:true}));
  };
  const snoozeItem = (p, newDate) => {
    const newTask = { id:nextId(db.tasks), title:p.taskTitle||p.label, due:newDate, done:false, priority:p.taskPriority||"medium", status:"todo", category:"follow_up", contactId:p.contactId||null, companyId:p.companyId||null, dealId:null, projectId:null, assignedTo:"", notes:`Snoozed from Orchestrator priority. Original: ${p.label}`, source:"agent:orchestrator", recurrence:"none" };
    setDB(d=>({...d, tasks:[...d.tasks, newTask]}));
    setDismissed(d=>({...d,[p.key]:true}));
    setSnoozing(null);
  };
  const dismissItem = (p) => setDismissed(d=>({...d,[p.key]:true}));

  const liveAlerts = [
    ...overdueInv.map(i => ({ id:`ov-${i.id}`, agent:"Billing Agent", type:"alert", priority:"critical", message:`${i.number} — ${i.client} — ${fmt(i.amount)} OVERDUE (due ${i.due}).`, nav:{view:"invoices",focus:{type:"invoice",id:i.id}} })),
    ...atRiskC.map(c => ({ id:`ar-${c.id}`, agent:"CRM Agent", type:"risk", priority:"critical", message:`${c.name} (${c.co}) at-risk. Score: ${c.score}/100. Last touch: ${c.lastTouch}.`, nav:{view:"crm",focus:{type:"contact",id:c.id}} })),
    ...criticalTasks.map(t => ({ id:`ct-${t.id}`, agent:"Ops Agent", type:"task", priority:"critical", message:`CRITICAL: "${t.title}" — due ${t.due}.`, nav:{view:"tasks",focus:{type:"task",id:t.id}} })),
    ...stalledProj.map(p => ({ id:`sp-${p.id}`, agent:"Ops Agent", type:"risk", priority:"high", message:`Project stalled: "${p.name}" (${p.client}) — ${p.progress}%.`, nav:{view:"projects",focus:{type:"project",id:p.id}} })),
    ...decayedContacts.map(c => ({ id:`decay-${c.id}`, agent:"CRM Agent", type:"alert", priority:"medium", message:`Relationship decay: ${c.name} (${c.co}) — ${daysBetween(c.lastTouch, today())} days since last contact.`, nav:{view:"crm",focus:{type:"contact",id:c.id}} })),
    ...activeDeals.filter(d=>d.probability>=60).map(d => ({ id:`deal-${d.id}`, agent:"CRM Agent", type:"opportunity", priority:"high", message:`${d.name} — ${fmt(d.value)} at ${d.probability}%.`, nav:{view:"deals",focus:{type:"deal",id:d.id}} })),
    { id:"pipe-summary", agent:"Orchestrator", type:"synthesis", priority:"high", message:`Pipeline: ${fmt(totalPipe)} total, ${fmt(weightedPipe)} weighted. Gap to ${fmt(goal.target_value)}: ${fmt(revenueGap)}. Coverage: ${pipelineCoverage}%.`, nav:null },
  ];

  const agents = [
    { name:"Orchestrator", color:"var(--purple)", stat:`${dailyPriorities.length} priorities`, detail:`${liveAlerts.length} alerts` },
    { name:"CRM Agent", color:"var(--blue)", stat:`${db.contacts.length} contacts`, detail:`${atRiskC.length} at-risk · ${leads.length} leads` },
    { name:"Marketing Agent", color:"var(--amber)", stat:`${db.campaigns.filter(c=>c.status==="active").length} campaigns`, detail:`${db.campaigns.reduce((a,c)=>a+c.leads,0)} leads` },
    { name:"Ops Agent", color:"var(--green)", stat:`${activeProj.length} active`, detail:`${stalledProj.length} stalled · ${openTasks.length} tasks` },
    { name:"Billing Agent", color:"var(--red)", stat:`${fmt(overdueAR)} overdue`, detail:`${overdueInv.length} invoices` },
    { name:"News Engine", color:"var(--blue)", stat:`${db.companyNews.length} articles`, detail:`${db.companies.length} companies tracked` },
  ];

  const sweep = async () => {
    setLoading(true);
    try {
      const snap = {
        contacts: db.contacts.filter(c=>{const comp=(db.companies||[]).find(co=>co.name===c.co);return !comp||comp.status!=="parked"}).map(c=>({name:c.name,co:c.co,status:c.status,category:c.category,score:c.score,lastTouch:c.lastTouch,follow_up:c.follow_up})),
        deals: db.deals.map(d=>({name:d.name,value:d.value,stage:d.stage,probability:d.probability,closeDate:d.closeDate,notes:d.notes})),
        projects: db.projects.map(p=>({name:p.name,client:p.client,type:p.type||"client",status:p.status,progress:p.progress,priority:p.priority,dueDate:p.dueDate})),
        tasks: openTasks.map(t=>({title:t.title,due:t.due,priority:t.priority,category:t.category,contactId:t.contactId})),
        invoices: db.invoices.filter(i=>i.status!=="paid").map(i=>({client:i.client,amount:i.amount,status:i.status,due:i.due})),
        metrics: { paidYTD, weightedPipeline:weightedPipe, totalPipeline:totalPipe, overdueAR, revenueGap, pipelineCoverage, openTasks:openTasks.length, decayedContacts:decayedContacts.length }};
      const msg = await callClaude(
        `You are Mendy Ezagui's Orchestrator Agent. He's an independent AI ops consultant targeting property management/HOA. Revenue target: ${fmt(goal.target_value)}. Projects have a "type" field: "client" (revenue-generating work) or "strategic" (partnerships, marketing, internal tools). Strategic projects have priority levels (critical/high/medium/low). HIGH-PRIORITY STRATEGIC projects should be weighted alongside client deliverables when generating priorities. Use goals and strategic project priorities to shape your daily recommendations. Be specific — name names and cite numbers.`,
        `Live snapshot \u2014 ${today()}:\n${JSON.stringify(snap,null,2)}\n\nGenerate a DAILY ACTION PLAN with these sections:\n1. TOP PRIORITY: The single most critical action today (revenue, deadline, or relationship at stake)\n2. DEAL MOVES: Specific next steps for deals closest to closing or with highest revenue potential\n3. STRATEGIC PLAYS: Actions to advance high-priority strategic projects and partnerships\n4. SMART NUDGES: Flag any stale deals (no activity 7+ days), contacts not touched in 14+ days, upcoming deadlines this week, or at-risk relationships\n\nBe specific \u2014 name people, dollar amounts, and exact actions. Max 8 sentences total.`,
        500
      );
      setDB(d=>({...d, agentLogs:[{id:nextId(d.agentLogs)+1, agent:"Orchestrator", type:"synthesis", message:msg, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:"high"}, ...d.agentLogs]}));
    } catch {
      setDB(d=>({...d, agentLogs:[{id:nextId(d.agentLogs), agent:"Orchestrator", type:"error", message:"Sweep failed.", ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:"medium"}, ...d.agentLogs]}));
    }
    setLoading(false);
  };

  const runNewsEngine = async () => {
    setNewsLoading(true);
    try {
      const companiesWithKeywords = db.companies.filter(c => c.name && c.status !== "parked");
      if (companiesWithKeywords.length === 0) { setNewsLoading(false); return; }

      const companyList = companiesWithKeywords.map(c => `${c.name}${c.news_keywords ? ` (keywords: ${c.news_keywords})` : ""}`).join(", ");
      const contactContext = db.contacts.filter(c=>c.companyId).map(c => `${c.name} at company ID ${c.companyId}`).join(", ");

      const raw = await callClaude(
        `You are a News Intelligence Agent. Search for recent news about these companies and return actionable intelligence. Return ONLY a JSON array.`,
        `Companies to monitor: ${companyList}\n\nContacts: ${contactContext}\n\nFor each company, find 1-2 recent news items (funding, partnerships, leadership changes, product launches, industry trends). Return JSON array: [{"companyName":"","companyId":null,"headline":"","summary":"","relevance_score":1-10,"published_date":"","suggested_action":"","suggested_contact":"","action_priority":"high|medium|low"}]`,
        2000
      );

      let newsItems = [];
      try { const m = raw.match(/\[[\s\S]*\]/); if (m) newsItems = JSON.parse(m[0]); } catch { newsItems = []; }

      if (newsItems.length > 0) {
        const newNews = [];
        const newTasks = [];
        const newLogs = [];

        newsItems.forEach(item => {
          const company = db.companies.find(c => c.name === item.companyName) || (item.companyId ? db.companies.find(c=>c.id===item.companyId) : null);
          if (!company) return;

          const newsId = nextId([...db.companyNews, ...newNews]);
          newNews.push({ id:newsId, companyId:company.id, headline:item.headline||"", source_url:"", summary:item.summary||"", relevance_score:item.relevance_score||5, published_date:item.published_date||today(), action_taken:false, taskId:null, created_at:today() });

          if (item.relevance_score >= 7 && item.suggested_action) {
            const contact = db.contacts.find(c => c.companyId === company.id || c.co === company.name);
            const taskId = nextId([...db.tasks, ...newTasks]);
            newTasks.push({ id:taskId, title:`News: ${item.suggested_action.substring(0,80)}`, projectId:null, contactId:contact?.id||null, companyId:company.id, dealId:null, due:new Date(Date.now()+3*86400000).toISOString().split("T")[0], done:false, priority:item.action_priority||"medium", assignedTo:"CRM Agent", notes:`News: "${item.headline}"\n${item.summary}\n\nSuggested action: ${item.suggested_action}`, status:"todo", category:"outreach", source:"agent:news_engine", recurrence:"none" });
          }
        });

        newLogs.push({ id:nextId(db.agentLogs), agent:"News Engine", type:"insight", message:`Found ${newNews.length} news items across ${[...new Set(newNews.map(n=>n.companyId))].length} companies. Created ${newTasks.length} action tasks.`, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:newTasks.length>0?"high":"medium" });

        setDB(d => ({...d,
          companyNews: [...newNews, ...d.companyNews],
          tasks: [...d.tasks, ...newTasks],
          agentLogs: [...newLogs, ...d.agentLogs],
        }));
      }
    } catch(e) {
      console.error("News engine error:", e);
      setDB(d=>({...d, agentLogs:[{id:nextId(d.agentLogs), agent:"News Engine", type:"error", message:"News scan failed.", ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), priority:"medium"}, ...d.agentLogs]}));
    }
    setNewsLoading(false);
  };

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div className="display" style={{ fontSize:18, fontWeight:700 }}>Orchestrator</div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginTop:3 }}>
            Live · {db.contacts.length} contacts · {activeDeals.length} deals · {openTasks.length} tasks
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-ghost" onClick={runNewsEngine} disabled={newsLoading} style={{ fontSize:12, opacity:newsLoading?0.6:1 }}>
            {newsLoading?<><Loader size={12} className="spin"/>Scanning news…</>:<><Newspaper size={12}/>Scan Company News</>}
          </button>
          <button className="btn btn-blue" onClick={sweep} disabled={loading} style={{ opacity:loading?0.6:1 }}>
            {loading?<><Loader size={13} className="spin"/>Running…</>:<><Zap size={13}/>AI Insight Sweep</>}
          </button>
        </div>
      </div>


      {/* Agent stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10 }}>
        {agents.map(a=>(
          <div key={a.name} className="card" style={{ padding:14, borderTop:`3px solid ${a.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:11, fontWeight:600, color:a.color }}>{a.name}</span>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)" }} className="blink"/>
            </div>
            <div style={{ fontSize:15, fontWeight:700, fontFamily:"var(--font-d)", marginBottom:2 }}>{a.stat}</div>
            <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{a.detail}</div>
          </div>
        ))}
      </div>


      {/* Live Alerts */}
      <div>
        <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:10 }}>LIVE STATUS — {liveAlerts.length} alerts</div>
        {liveAlerts.map(l=>(
          <div key={l.id} onClick={()=>l.nav&&navigate(l.nav.view,l.nav.focus)} className="card-el" style={{ padding:"12px 14px", marginBottom:8, borderLeft:`2px solid ${sc(l.priority)}`, cursor:l.nav?"pointer":"default", transition:"background .15s" }} onMouseEnter={e=>{if(l.nav)e.currentTarget.style.background="var(--bg-hover)"}} onMouseLeave={e=>e.currentTarget.style.background=""}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}><AgentBadge agent={l.agent}/><Tag label={l.type} color={sc(l.priority)}/><Tag label={l.priority}/>{l.nav&&<ChevronRight size={12} color="var(--text-dim)" style={{marginLeft:"auto",flexShrink:0}}/>}</div>
            <p style={{ fontSize:13, lineHeight:1.5 }}>{l.message}</p>
          </div>
        ))}
      </div>

      {/* Recent News */}
      {db.companyNews.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:10 }}><Newspaper size={11}/> RECENT COMPANY NEWS — {db.companyNews.length} articles</div>
          {db.companyNews.slice(0,6).map(n=>{
            const company = db.companies.find(c=>c.id===n.companyId);
            return (
              <div key={n.id} onClick={()=>company&&navigate("companies",{type:"company",id:company.id})} className="card-el" style={{ padding:"12px 14px", marginBottom:8, borderLeft:"2px solid var(--blue)", cursor:company?"pointer":"default", transition:"background .15s" }} onMouseEnter={e=>{if(company)e.currentTarget.style.background="var(--bg-hover)"}} onMouseLeave={e=>e.currentTarget.style.background=""}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{n.headline}</span>
                  {company&&<><span className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginLeft:"auto" }}>{company.name}</span><ChevronRight size={12} color="var(--text-dim)" style={{flexShrink:0}}/></>}
                </div>
                <p style={{ fontSize:12, color:"var(--text-sec)", lineHeight:1.5 }}>{n.summary}</p>
                <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", marginTop:4 }}>Relevance: {n.relevance_score}/10 · {n.published_date}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Sweep log */}
      {db.agentLogs.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginBottom:10 }}>AI SWEEP LOG — {db.agentLogs.length} entries</div>
          {db.agentLogs.slice(0,10).map(l=>(
            <div key={l.id} className="card-el" style={{ padding:"12px 14px", marginBottom:8, borderLeft:`2px solid ${sc(l.priority)}`, opacity:0.85 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}><AgentBadge agent={l.agent}/><Tag label={l.type} color={sc(l.priority)}/><span className="mono" style={{ marginLeft:"auto", fontSize:10, color:"var(--text-sec)" }}>{l.ts}</span></div>
              <p style={{ fontSize:13, lineHeight:1.5 }}>{l.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
