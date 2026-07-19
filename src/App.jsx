import { useEffect, useRef, useState } from "react";
import { AlertCircle, Brain, Mic, Zap } from "lucide-react";
import { MASTER_VIEW_FOR_TYPE } from "./lib/constants";
import { ENV_READY, loadAllFromDB, supabase, syncToDB } from "./lib/supabase";
import { callClaude, parseAppHash, recordPath, today } from "./lib/utils";
import { BottomNav, GlobalStyle, LoadingScreen, LoginScreen, Sidebar } from "./components/ui";
import { AdminView } from "./views/AdminView";
import { AIMemoriesView } from "./views/AIMemoriesView";
import { AssociatesView } from "./views/AssociatesView";
import { BillingView } from "./views/BillingView";
import { CompaniesView } from "./views/CompaniesView";
import { CRMView } from "./views/CRMView";
import { Dashboard } from "./views/Dashboard";
import { DealsView } from "./views/DealsView";
import { DocumentsView } from "./views/DocumentsView";
import { GoalsView } from "./views/GoalsView";
import { MarketingView } from "./views/MarketingView";
import { MultiLLMView } from "./views/MultiLLMView";
import { PaymentsView } from "./views/PaymentsView";
import { ProjectsView } from "./views/ProjectsView";
import { RCControlsView } from "./views/RCControlsView";
import { RecordDetailView } from "./views/RecordDetailView";
import { StrategiesView } from "./views/StrategiesView";
import { TasksView } from "./views/TasksView";
import { VoiceView } from "./views/VoiceView";
import { VoitraGateView } from "./views/VoitraGateView";
import SocialMediaView from "./views/SocialMediaView";
import { CadencesView } from "./views/CadencesView";
import { LoopsView } from "./views/LoopsView";
import { MorningBriefView } from "./views/MorningBriefView";
import { VantacaControlsView } from "./views/VantacaControlsView";
import { CometChatView } from "./views/CometChatView";

export default function App() {
  const VALID_VIEWS = ["dashboard","brief","associates","crm","companies","deals","marketing","social","cadences","loops","tasks","projects","documents","voice","invoices","payments","goals","strategies","ai_memories","multi_llm","voitra_gate","rc_controls","vantaca_controls","cometchat","cometchat_dev","cometchat_sandbox","cometchat_production","admin","record"];
  const VIEW_ALIASES = { mstack: "associates", orchestrator: "brief" };
  const routeFromHash = () => {
    const route = parseAppHash();
    const view = VIEW_ALIASES[route.view] || route.view;
    return VALID_VIEWS.includes(view) ? { ...route, view } : { view:"dashboard", record:null, focus:null };
  };
  const initialRoute = routeFromHash();
  const [session, setSession] = useState(undefined);
  const [db, setDB] = useState(null);
  const [view, setView] = useState(initialRoute.view);
  const [recordTarget, setRecordTarget] = useState(initialRoute.record);
  const [focus, setFocus] = useState(initialRoute.focus);
  const navigate = (targetView, focusTarget) => {
    if (targetView === "record" || focusTarget?.type) {
      const target = targetView === "record" ? focusTarget : { type:focusTarget.type, id:focusTarget.id };
      const masterView = MASTER_VIEW_FOR_TYPE[target.type];
      if (masterView) {
        setRecordTarget(null);
        setFocus(target);
        if (view !== masterView) setView(masterView);
        const hash = recordPath(target.type, target.id);
        if (window.location.hash !== hash) window.location.hash = hash;
        return;
      }
      setRecordTarget(target);
      setView("record");
      window.location.hash = recordPath(target.type, target.id);
      return;
    }
    setRecordTarget(null);
    setFocus(null);
    setView(targetView);
    const hash = "#/" + targetView;
    if (window.location.hash !== hash) window.location.hash = hash;
  };
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  const [autoRecord, setAutoRecord] = useState(false);
  const [showVoiceLab, setShowVoiceLab] = useState(false);
  const [sweepRunning, setSweepRunning] = useState(false);

  const runSweep = async () => {
    setSweepRunning(true);
    try {
      const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
      const snap = {
        projects: (db.projects||[]).map(p=>({name:p.name,client:p.client,type:p.type||"client",status:p.status,priority:p.priority||"medium",progress:p.progress})),
        deals: (db.deals||[]).map(d=>({name:d.name,value:d.value,stage:d.stage,probability:d.probability,closeDate:d.closeDate})),
        tasks: (db.tasks||[]).filter(t=>!t.done).map(t=>({title:t.title,due:t.due,priority:t.priority})),
        contacts: (db.contacts||[]).filter(c=>c.status==="at-risk"||c.score<30).map(c=>({name:c.name,co:c.co,status:c.status,score:c.score})),
        invoices: (db.invoices||[]).filter(i=>i.status!=="paid").map(i=>({client:i.client,amount:i.amount,status:i.status,due:i.due})),
      };
      const msg = await callClaude(
        "You are Mendy Ezagui's proactive daily strategist. Projects are typed client/strategic with priorities high/medium/low. Be specific with names, amounts, dates.",
        "Today is "+today+". Snapshot: "+JSON.stringify(snap)+"\nGenerate Daily Action Plan: TOP PRIORITIES (1-2 urgent items), DEAL MOVES (actions ranked by revenue+urgency), STRATEGIC PLAYS (advance high-priority strategic project), SMART NUDGES (follow-ups, cold relationships, deadlines, billing). Max 8 sentences.",
        800
      );
      const nextId = Math.max(0,...(db.agentlogs||[]).map(l=>l.id))+1;
      const ts = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
      setDB(p=>({...p, agentlogs:[...(p.agentlogs||[]),{id:nextId,agent:"Orchestrator",type:"sweep",message:msg,ts,priority:"high"}]}));
    } catch(e) { console.error("Sweep error:",e); }
    setSweepRunning(false);
  };

  useEffect(() => {
    const parsed = parseAppHash();
    if (parsed.view !== view) {
      const nextHash = view === "record" && recordTarget ? recordPath(recordTarget.type, recordTarget.id) : "#/" + view;
      if (window.location.hash !== nextHash) window.location.hash = nextHash;
    }
    if (view !== "voice") setAutoRecord(false);
  }, [view, recordTarget]);
  useEffect(() => {
    const onHash = () => { const r = routeFromHash(); setView(r.view); setRecordTarget(r.record); setFocus(r.focus); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const dbRef = useRef(null);
  const syncLock = useRef(false);
  const pendingSync = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      if (!s) setDB(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) return;
    loadAllFromDB().then(data => { setDB(data); dbRef.current = data; });
  }, [session?.user?.id]);

  useEffect(() => {
    if (!db || !dbRef.current) return;
    if (syncLock.current) { pendingSync.current = true; return; }
    const prev = dbRef.current;
    if (prev === db) return;
    dbRef.current = db;
    syncLock.current = true;
    syncToDB(prev, db)
      .catch(err => console.error("Supabase sync error:", err))
      .finally(() => {
        syncLock.current = false;
        if (pendingSync.current) {
          pendingSync.current = false;
          const latestPrev = dbRef.current;
          if (latestPrev !== db) {
            dbRef.current = db;
            syncLock.current = true;
            syncToDB(latestPrev, db)
              .catch(err => console.error("Supabase sync error:", err))
              .finally(() => { syncLock.current = false; });
          }
        }
      });
  }, [db]);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  if (!ENV_READY) return (
    <>
      <GlobalStyle/>
      <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
        <div className="card" style={{ width:"min(480px,92vw)", padding:36, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"var(--red-dim)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><AlertCircle size={22} color="var(--red)"/></div>
            <div><div className="display" style={{ fontSize:16, fontWeight:700 }}>Missing Environment Variables</div></div>
          </div>
          <p style={{ fontSize:12, color:"var(--text-sec)", lineHeight:1.7 }}>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel &rarr; Settings &rarr; Environment Variables.</p>
        </div>
      </div>
    </>
  );
  if (session === undefined) return <><GlobalStyle/><LoadingScreen msg="Checking auth..."/></>;
  if (!session) return <LoginScreen/>;
  if (!db) return <><GlobalStyle/><LoadingScreen msg="Loading your data..."/></>;

  const alerts = (() => {
    const openTasks = db.tasks.filter(t=>!t.done && t.status!=="done" && t.status!=="cancelled");
    const critTasks = openTasks.filter(t=>t.priority==="critical" || (t.due && t.due < today()));
    const overdueInv = db.invoices.filter(i=>i.status==="overdue");
    const atRisk = db.contacts.filter(c=>c.score && c.score < 40 && c.category && c.category.includes("customer"));
    return critTasks.length + overdueInv.length + atRisk.length;
  })();
  const VIEWS = {
    dashboard:    <Dashboard db={db} setDB={setDB} setView={setView} navigate={navigate} session={session} runSweep={runSweep} sweepRunning={sweepRunning} setShowVoiceLab={setShowVoiceLab} />,
    brief:        <MorningBriefView />,
    associates:   <AssociatesView db={db} setDB={setDB} navigate={navigate}/>,
    crm:          <CRMView db={db} setDB={setDB} setView={setView} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    companies:    <CompaniesView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    deals:        <DealsView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    marketing:    <MarketingView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    social:       <SocialMediaView />,
    cadences:     <CadencesView />,
    loops:        <LoopsView />,
    tasks:        <TasksView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    goals:        <GoalsView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    documents:   <DocumentsView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    record:      <RecordDetailView db={db} setDB={setDB} record={recordTarget} navigate={navigate} setFocus={setFocus}/>,
    ai_memories: <AIMemoriesView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    multi_llm:   <MultiLLMView session={session}/>,
    strategies:   <StrategiesView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    voitra_gate:  <VoitraGateView/>,
    rc_controls:  <RCControlsView/>,
    vantaca_controls: <VantacaControlsView/>,
    cometchat:    <CometChatView session={session} initialEnvironment="production" initialSection="logs" lockSection={true}/>,
    cometchat_dev: <CometChatView session={session} initialEnvironment="sandbox" initialSection="console" lockSection={true}/>,
    cometchat_sandbox: <CometChatView session={session} initialEnvironment="sandbox" initialSection="console" lockSection={true}/>,
    cometchat_production: <CometChatView session={session} initialEnvironment="production" initialSection="console" lockSection={true}/>,
    payments:      <PaymentsView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    projects:     <ProjectsView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    invoices:      <BillingView db={db} setDB={setDB} navigate={navigate} focus={focus} setFocus={setFocus}/>,
    voice:        <VoiceView db={db} setDB={setDB} autoRecord={autoRecord}/>,
    admin:        <AdminView session={session}/>,
  };

  return (
    <>
      <GlobalStyle/>
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)", overflow:"hidden" }}>
        <div style={{ height:46, background:"var(--bg-card)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", padding:"0 16px", gap:10, flexShrink:0, zIndex:10 }}>
          {mobile && <div style={{ width:28, height:28, borderRadius:7, background:"var(--blue-dim)", display:"flex", alignItems:"center", justifyContent:"center" }}><Brain size={14} color="var(--blue)"/></div>}
          <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", marginLeft:mobile?0:"auto" }}>
            <span style={{ color:"var(--green)" }}>&#9679;</span> LIVE &middot; {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            {alerts > 0 && (
              <div style={{ background:"var(--red-dim)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:6, padding:"3px 8px", fontSize:11, color:"var(--red)", fontFamily:"var(--font-m)", cursor:"pointer" }}
                onClick={()=>setView("dashboard")}>{alerts} CRITICAL</div>
            )}
            <div className="mono" style={{ fontSize:11, color:"var(--text-sec)", background:"var(--bg-el)", padding:"4px 10px", borderRadius:6 }}>
              {(session.user.user_metadata?.full_name || session.user.email?.split("@")[0])?.toUpperCase() || "ME"}
            </div>
            <button className="btn btn-ghost" style={{ padding:"4px 10px", fontSize:11 }} onClick={()=>supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {!mobile && <Sidebar view={view} setView={(v)=>navigate(v)} collapsed={collapsed} setCollapsed={setCollapsed} alerts={alerts} db={db}/>}
          <main style={{ flex:1, overflowY:"auto" }}>{VIEWS[view] || VIEWS.dashboard}</main>
        </div>
        {/* Voice Lab Overlay */}
      {showVoiceLab && <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9998,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setShowVoiceLab(false)}}>
        <div style={{background:"var(--card)",borderRadius:16,width:"90%",maxWidth:700,maxHeight:"85vh",overflow:"auto",position:"relative",padding:0}}>
          <button onClick={()=>setShowVoiceLab(false)} style={{position:"absolute",top:12,right:12,zIndex:10,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text)"}}>&times;</button>
          <VoiceView db={db} setDB={setDB} autoRecord={autoRecord}/>
        </div>
      </div>}
      {/* Floating Action Buttons */}
      <div className="fab-stack" style={{position:"fixed",bottom:24,right:24,zIndex:9990,display:"flex",flexDirection:"column",gap:12,alignItems:"flex-end"}}>
        <button title="AI Sweep" onClick={()=>{if(!sweepRunning){runSweep()}}} style={{width:52,height:52,borderRadius:"50%",background:sweepRunning?"var(--amber)":"linear-gradient(135deg,#667eea,#764ba2)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 15px rgba(0,0,0,0.3)",transition:"transform 0.2s",animation:sweepRunning?"pulse 1.5s infinite":"none"}}><Zap size={22} color="#fff"/></button>
        <button title="Voice Lab" onClick={()=>{setShowVoiceLab(v=>!v);setAutoRecord(true)}} style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#cc77ff,#aaafff)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 15px rgba(0,0,0,0.3)",animation:"pulse 2s infinite"}}><Mic size={24} color="#fff"/></button>
      </div>
        {mobile && <BottomNav view={view} setView={(v)=>navigate(v)}/>}
      </div>
    </>
  );
}
