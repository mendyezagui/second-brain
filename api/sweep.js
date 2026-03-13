// api/sweep.js — Nightly Orchestrator Sweep
// Vercel cron: runs at 6:30 AM PST (14:30 UTC) every day
// Reads live Supabase data → calls Claude → writes insights back to agentlogs

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role — server-side only
);

async function callClaude(system, user, max = 600) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: max,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "";
}

export default async function handler(req, res) {
  // Protect: only allow Vercel cron or requests with CRON_SECRET header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers["authorization"] || "";
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    // ── Pull all live data from Supabase ──
    const [contacts, deals, tasks, projects, invoices, campaigns] = await Promise.all([
      supabase.from("contacts").select("*"),
      supabase.from("deals").select("*"),
      supabase.from("tasks").select("*").eq("done", false),
      supabase.from("projects").select("*"),
      supabase.from("invoices").select("*").neq("status", "paid"),
      supabase.from("campaigns").select("*"),
    ]);

    const db = {
      contacts:  contacts.data  || [],
      deals:     deals.data     || [],
      tasks:     tasks.data     || [],
      projects:  projects.data  || [],
      invoices:  invoices.data  || [],
      campaigns: campaigns.data || [],
    };

    // ── Compute key metrics ──
    const overdueInv     = db.invoices.filter(i => i.status === "overdue");
    const criticalTasks  = db.tasks.filter(t => t.priority === "critical");
    const atRiskContacts = db.contacts.filter(c => c.status === "at-risk");
    const stalledProj    = db.projects.filter(p => p.status === "stalled");
    const activeDeals    = db.deals.filter(d => !["won","lost"].includes(d.stage));
    const paidYTD        = 0; // invoices already filtered to unpaid above
    const weightedPipe   = Math.round(db.deals.reduce((a,d) => a + d.value * (d.probability/100), 0));
    const overdueAR      = overdueInv.reduce((a,i) => a + i.amount, 0);

    const snap = {
      contacts:  db.contacts.map(c => ({ name:c.name, co:c.co, status:c.status, score:c.score, lastTouch:c.lastTouch, notes:c.notes })),
      deals:     db.deals.map(d => ({ name:d.name, value:d.value, stage:d.stage, probability:d.probability, closeDate:d.closeDate, notes:d.notes })),
      tasks:     db.tasks.map(t => ({ title:t.title, due:t.due, priority:t.priority, notes:t.notes||"" })),
      projects:  db.projects.map(p => ({ name:p.name, client:p.client, status:p.status, progress:p.progress, dueDate:p.dueDate })),
      invoices:  db.invoices.map(i => ({ client:i.client, amount:i.amount, status:i.status, due:i.due, number:i.number })),
      metrics: {
        weightedPipeline: weightedPipe,
        overdueAR,
        openTasks: db.tasks.length,
        criticalTasks: criticalTasks.length,
        atRisk: atRiskContacts.length,
        stalledProjects: stalledProj.length,
        activeDeals: activeDeals.length,
      },
    };

    const today = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });

    // ── Run 3 agent analyses in parallel ──
    const [orchestratorMsg, billingMsg, crmMsg] = await Promise.all([

      callClaude(
        `You are Mendy Ezagui's Orchestrator Agent. He's an independent AI ops consultant in LA targeting property management/HOA companies. Revenue target: $800K/year. Anchor client: Scott Management. At-risk: Rapid Medical (payments behind). Be specific — name names and cite numbers. Max 3 sentences.`,
        `Good morning — today is ${today}. Live database snapshot:\n${JSON.stringify(snap, null, 2)}\n\nWhat is the single most important thing Mendy needs to do TODAY? Name specific people, deals, or tasks. What's at stake right now?`,
        400
      ),

      overdueAR > 0 ? callClaude(
        `You are a billing agent. Be direct and specific. One sentence max.`,
        `Overdue invoices: ${JSON.stringify(overdueInv.map(i=>({client:i.client, amount:i.amount, number:i.number, due:i.due})))}. What is the single most urgent collection action?`,
        150
      ) : Promise.resolve(null),

      atRiskContacts.length > 0 ? callClaude(
        `You are a CRM agent. Be direct and specific. One sentence max.`,
        `At-risk contacts: ${JSON.stringify(atRiskContacts.map(c=>({name:c.name, co:c.co, score:c.score, lastTouch:c.lastTouch, notes:c.notes})))}. What is the most important relationship action today?`,
        150
      ) : Promise.resolve(null),

    ]);

    // ── Write results back to Supabase agentlogs ──
    const ts = new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", timeZone:"America/Los_Angeles" });

    // Get current max ID
    const { data: lastLog } = await supabase
      .from("agentlogs")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    let nextId = (lastLog?.[0]?.id || 0) + 1;

    const logsToInsert = [
      { id: nextId++, agent:"Orchestrator", type:"morning-sweep", message: orchestratorMsg, ts, priority:"high" },
      billingMsg  ? { id: nextId++, agent:"Billing Agent",  type:"alert",       message: billingMsg,  ts, priority:"critical" } : null,
      crmMsg      ? { id: nextId++, agent:"CRM Agent",      type:"risk",        message: crmMsg,      ts, priority:"high" } : null,
      {
        id: nextId++,
        agent: "System",
        type: "sweep-summary",
        message: `Morning sweep complete — ${db.contacts.length} contacts, ${activeDeals.length} active deals, $${overdueAR.toLocaleString()} overdue A/R, ${criticalTasks.length} critical tasks, ${atRiskContacts.length} at-risk contacts. Weighted pipeline: $${weightedPipe.toLocaleString()}.`,
        ts,
        priority: "medium",
      },
    ].filter(Boolean);

    await supabase.from("agentlogs").insert(logsToInsert);

    return res.status(200).json({
      ok: true,
      swept: new Date().toISOString(),
      logsWritten: logsToInsert.length,
      metrics: snap.metrics,
    });

  } catch (err) {
    console.error("Sweep error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
