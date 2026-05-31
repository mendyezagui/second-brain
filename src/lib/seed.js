

export const initDB = () => ({
  contacts: [
    { id:1, name:"Dave Scott", co:"Scott Management", role:"CEO", email:"dave@scottmgmt.com", phone:"(310) 555-0121", status:"client", score:92, tags:["anchor"], lastTouch:"2026-03-10", notes:"Anchor client. Happy. Wants to expand AI ops to 3 more communities.", category:"customer", companyId:null },
    { id:2, name:"Rachel Kim", co:"Rapid Medical", role:"COO", email:"r.kim@rapidmed.com", phone:"(323) 555-0188", status:"at-risk", score:41, tags:["payments-behind"], lastTouch:"2026-02-28", notes:"Payments 30+ days behind. Engagement at risk.", category:"customer", companyId:null },
    { id:3, name:"Michael Torres", co:"Horizon HOA Group", role:"VP Operations", email:"m.torres@horizonhoa.com", phone:"(714) 555-0244", status:"prospect", score:78, tags:["warm"], lastTouch:"2026-03-05", notes:"Interested in Salesforce ops fix. $80K potential.", category:"customer_lead", companyId:null },
    { id:4, name:"Sandra Liu", co:"Westcoast Property Partners", role:"Director IT", email:"sliu@wcpp.com", phone:"(818) 555-0311", status:"prospect", score:65, tags:["cold"], lastTouch:"2026-02-15", notes:"Met at NAA conference.", category:"customer_lead", companyId:null },
    { id:5, name:"James Okafor", co:"SunRidge Communities", role:"CFO", email:"j.okafor@sunridge.com", phone:"(619) 555-0177", status:"prospect", score:55, tags:["new"], lastTouch:"2026-03-12", notes:"Referred by Dave Scott.", category:"customer_lead", companyId:null },
    { id:6, name:"Priya Mehta", co:"ClearPath HOA", role:"CEO", email:"priya@clearpathoa.com", phone:"(424) 555-0299", status:"prospect", score:48, tags:["cold"], lastTouch:"2026-01-20", notes:"Initial outreach via LinkedIn.", category:"customer_lead", companyId:null },
  ],
  deals: [
    { id:1, name:"Scott Mgmt — Phase 2 Expansion", contactId:1, companyId:null, value:120000, stage:"negotiation", probability:85, closeDate:"2026-04-30", notes:"Expanding to 3 more HOA communities." },
    { id:2, name:"Rapid Medical — AWS Bedrock POC", contactId:2, companyId:null, value:45000, stage:"at-risk", probability:25, closeDate:"2026-03-31", notes:"Invoice unpaid. POC stalled." },
    { id:3, name:"Horizon HOA — Salesforce Ops Fix", contactId:3, companyId:null, value:80000, stage:"proposal", probability:60, closeDate:"2026-05-15", notes:"Sent SOW draft." },
    { id:4, name:"SunRidge — AI Ops Pilot", contactId:5, companyId:null, value:35000, stage:"discovery", probability:40, closeDate:"2026-06-01", notes:"Intro call scheduled." },
    { id:5, name:"ClearPath HOA — Ops Audit", contactId:6, companyId:null, value:18000, stage:"outreach", probability:15, closeDate:"2026-07-01", notes:"Need to re-engage." },
  ],
  campaigns: [
    { id:1, name:"HOA Ops Intelligence Series", type:"Email", status:"active", leads:47, opens:38, conversions:4, startDate:"2026-02-01" },
    { id:2, name:"LinkedIn — AI Ops Positioning", type:"Social", status:"active", leads:23, opens:1800, conversions:2, startDate:"2026-01-15" },
    { id:3, name:"Scott Mgmt Referral Program", type:"Referral", status:"active", leads:3, opens:3, conversions:1, startDate:"2026-03-01" },
    { id:4, name:"Property Mgmt Pain-Point Outreach", type:"Email", status:"draft", leads:0, opens:0, conversions:0, startDate:"2026-04-01" },
  ],
  projects: [
    { id:1, name:"Scott Mgmt AI Ops Deployment", client:"Scott Management", companyId:null, type:"client", status:"active", progress:72, dueDate:"2026-04-15", priority:"high", notes:"" },
    { id:2, name:"Rapid Medical — Agentforce POC", client:"Rapid Medical", companyId:null, status:"stalled", progress:35, dueDate:"2026-03-31", priority:"critical", notes:"Stalled at 35%." },
    { id:3, name:"Horizon HOA SOW Finalization", client:"Horizon HOA", companyId:null, status:"active", progress:20, dueDate:"2026-03-20", priority:"high", notes:"" },
    { id:4, name:"BD Signal Tool — V2", client:"Internal", companyId:null, type:"strategic", status:"active", progress:55, dueDate:"2026-04-01", priority:"medium", notes:"" },
  ],
  tasks: [
    { id:1, title:"Follow up with Rachel Kim re: payment", projectId:2, contactId:2, companyId:null, dealId:2, due:"2026-03-14", done:false, priority:"critical", assignedTo:"Orchestrator", notes:"", status:"todo", category:"follow_up", source:"manual", recurrence:"none" },
    { id:2, title:"Send Phase 2 proposal to Dave Scott", projectId:1, contactId:1, companyId:null, dealId:1, due:"2026-03-16", done:false, priority:"high", assignedTo:"CRM Agent", notes:"", status:"todo", category:"deliverable", source:"manual", recurrence:"none" },
    { id:3, title:"SOW revision — Horizon HOA scope", projectId:3, contactId:3, companyId:null, dealId:3, due:"2026-03-18", done:false, priority:"high", assignedTo:"Ops Agent", notes:"", status:"in_progress", category:"deliverable", source:"manual", recurrence:"none" },
    { id:4, title:"Prep SunRidge intro call (3/18)", projectId:4, contactId:5, companyId:null, dealId:4, due:"2026-03-17", done:false, priority:"high", assignedTo:"CRM Agent", notes:"", status:"todo", category:"meeting_prep", source:"manual", recurrence:"none" },
    { id:5, title:"Publish LinkedIn post — AI Ops ROI", projectId:4, contactId:null, companyId:null, dealId:null, due:"2026-03-15", done:true, priority:"medium", assignedTo:"Marketing Agent", notes:"", status:"done", category:"outreach", source:"manual", recurrence:"none" },
  ],
  invoices: [
    { id:1, client:"Scott Management", amount:18500, status:"paid", issued:"2026-03-01", due:"2026-03-15", number:"INV-031", notes:"" },
    { id:2, client:"Scott Management", amount:18500, status:"pending", issued:"2026-03-15", due:"2026-04-01", number:"INV-032", notes:"" },
    { id:3, client:"Rapid Medical", amount:12500, status:"overdue", issued:"2026-02-01", due:"2026-02-28", number:"INV-029", notes:"13 days overdue." },
    { id:4, client:"Rapid Medical", amount:12500, status:"overdue", issued:"2026-02-15", due:"2026-03-01", number:"INV-030", notes:"12 days overdue." },
    { id:5, client:"Horizon HOA", amount:8000, status:"draft", issued:"", due:"", number:"INV-033", notes:"" },
  ],
  agentLogs: [
    { id:1, agent:"Billing Agent", type:"alert", message:"Rapid Medical: 2 invoices overdue ($25K). Recommend escalation call.", ts:"09:42", priority:"critical" },
    { id:2, agent:"CRM Agent", type:"opportunity", message:"SunRidge Communities (Scott referral) — $35K pilot. Intro call 3/18.", ts:"09:15", priority:"high" },
    { id:3, agent:"Marketing Agent", type:"insight", message:"3 SoCal HOA groups posted LinkedIn pain-points. BD Signal flagged.", ts:"08:50", priority:"medium" },
    { id:4, agent:"Ops Agent", type:"risk", message:"Rapid Medical POC stalled at 35% for 65 days.", ts:"08:30", priority:"critical" },
    { id:5, agent:"Orchestrator", type:"synthesis", message:"Revenue gap to $800K: $486K. Pipeline covers 58%. Need 2 new clients.", ts:"08:00", priority:"high" },
  ],
  voiceNotes: [],
  companies: [],
  companyNews: [],
  goals: [{ id:1, name:"Annual Revenue Target", target_value:800000, current_value:0, unit:"$", period:"annual", start_date:"2026-01-01", end_date:"2026-12-31", status:"active", notes:"" }],
  events: [],
  documents: [],
  ai_memories: [],
});
