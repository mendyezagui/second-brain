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

const fmt = (n) => "$" + Math.round(Number(n) || 0).toLocaleString();

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
    // `invoices` is unpaid-only (drives overdue logic); `allInvoices` is every
    // invoice so we can compute collected revenue from amount_paid. `goals` and
    // `instructions` feed the orchestrator its real north star + standing orders.
    const [contacts, deals, tasks, projects, invoices, allInvoices, campaigns, goals, instructions] = await Promise.all([
      supabase.from("contacts").select("*"),
      supabase.from("deals").select("*"),
      supabase.from("tasks").select("*").eq("done", false),
      supabase.from("projects").select("*"),
      supabase.from("invoices").select("*").neq("status", "paid"),
      supabase.from("invoices").select("amount, amount_paid, status"),
      supabase.from("campaigns").select("*"),
      supabase.from("goals").select("*").eq("status", "active"),
      supabase.from("instructions").select("*").eq("active", true),
    ]);

    const db = {
      contacts:  contacts.data  || [],
      deals:     deals.data     || [],
      tasks:     tasks.data     || [],
      projects:  projects.data  || [],
      invoices:  invoices.data  || [],
      campaigns: campaigns.data || [],
      goals:     goals.data     || [],
      instructions: instructions.data || [],
    };
    const allInv = allInvoices.data || [];

    // ── Compute key metrics ──
    const overdueInv     = db.invoices.filter(i => i.status === "overdue");
    const criticalTasks  = db.tasks.filter(t => t.priority === "critical");
    const atRiskContacts = db.contacts.filter(c => c.status === "at-risk");
    const stalledProj    = db.projects.filter(p => p.status === "stalled");
    const activeDeals    = db.deals.filter(d => !["won","lost"].includes(d.stage));
    const weightedPipe   = Math.round(db.deals.reduce((a,d) => a + (d.value||0) * ((d.probability||0)/100), 0));
    const overdueAR      = overdueInv.reduce((a,i) => a + (i.amount||0), 0);

    // Revenue collected = sum of amount_paid across every invoice (partials count).
    const collectedRevenue = allInv.reduce((a,i) => a + (i.amount_paid || 0), 0);

    // Primary revenue goal pulled from the goals table (was hardcoded $800K).
    const revenueGoal = db.goals
      .filter(g => g.unit === "$" && g.period === "annual")
      .sort((a,b) => (b.target_value||0) - (a.target_value||0))[0]
      || { name: "Annual Revenue Target", target_value: 800000 };
    const revenueTarget = revenueGoal.target_value || 800000;
    const revenueGap     = Math.max(0, revenueTarget - collectedRevenue);
    const pipelineCoverage = revenueGap > 0 ? Math.round((weightedPipe / revenueGap) * 100) : 100;

    // Human-readable goals list, highest priority_order first, for prompt salience.
    const goalsBlock = db.goals.length
      ? db.goals
          .slice()
          .sort((a,b) => (a.priority_order ?? 99) - (b.priority_order ?? 99))
          .map(g => `- [${g.category||"general"}] ${g.name}: ${g.current_value ?? 0}/${g.target_value} ${g.unit||""} (${g.period||""})`)
          .join("\n")
      : "(no active goals defined)";

    const snap = {
      goals:     db.goals.map(g => ({ name:g.name, target:g.target_value, current:g.current_value, unit:g.unit, period:g.period, category:g.category, priority_order:g.priority_order })),
      contacts:  db.contacts.map(c => ({ name:c.name, co:c.co, status:c.status, score:c.score, lastTouch:c.lastTouch, notes:c.notes })),
      deals:     db.deals.map(d => ({ name:d.name, value:d.value, stage:d.stage, probability:d.probability, closeDate:d.closeDate, notes:d.notes })),
      tasks:     db.tasks.map(t => ({ title:t.title, due:t.due, priority:t.priority, notes:t.notes||"" })),
      projects:  db.projects.map(p => ({ name:p.name, client:p.client, type:p.type||"client", status:p.status, progress:p.progress, priority:p.priority||"medium", dueDate:p.dueDate })),
      instructions: db.instructions.map(i => ({ title:i.title, body:i.body })),
      invoices:  db.invoices.map(i => ({ client:i.client, amount:i.amount, status:i.status, due:i.due, number:i.number })),
      metrics: {
        weightedPipeline: weightedPipe,
        collectedRevenue,
        revenueTarget,
        revenueGap,
        pipelineCoverage,
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
        `You are Mendy Ezagui's Orchestrator Agent — his proactive daily strategist. He's an independent AI ops consultant in LA targeting property management/HOA companies. His active goals (with live progress) are in the snapshot under "goals" — weigh every recommendation against them, prioritizing the lowest priority_order (most important) first. His primary revenue goal is ${fmt(revenueTarget)}/year; he has collected ${fmt(collectedRevenue)} so far (gap ${fmt(revenueGap)}, weighted pipeline ${fmt(weightedPipe)} = ${pipelineCoverage}% coverage). Projects are typed "client" or "strategic" with priorities (high/medium/low); high-priority strategic projects should drive weekly focus. The snapshot's "instructions" array holds Mendy's standing orders — follow them and let them override default behavior. Be specific — name names, cite dollar amounts, reference deadlines.`,
        `Good morning — today is ${today}.\n\nYOUR GOALS (most important first):\n${goalsBlock}\n\nREVENUE: collected ${fmt(collectedRevenue)} of ${fmt(revenueTarget)} target — gap ${fmt(revenueGap)}; weighted pipeline ${fmt(weightedPipe)} (${pipelineCoverage}% coverage).\n\nLive database snapshot:\n${JSON.stringify(snap, null, 2)}\n\nGenerate Mendy's Daily Action Plan:\n\nTOP PRIORITIES — The 1-2 most urgent items from critical tasks, high-priority strategic projects, and approaching deadlines, tied to the goals they advance.\n\nDEAL MOVES — Specific next actions on active deals, ranked by revenue potential and urgency. Flag stale deals (no activity >7 days).\n\nSTRATEGIC PLAYS — One move to advance a high-priority strategic project today.\n\nSMART NUDGES — Follow-ups due, relationships going cold, upcoming deadlines, billing issues.\n\nBe direct. Name people, amounts, dates. Max 8 sentences total.`,
        800
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
        message: `Morning sweep complete — ${db.contacts.length} contacts, ${activeDeals.length} active deals, ${fmt(overdueAR)} overdue A/R, ${criticalTasks.length} critical tasks, ${atRiskContacts.length} at-risk contacts. Collected ${fmt(collectedRevenue)} of ${fmt(revenueTarget)} (${pipelineCoverage}% pipeline coverage). ${db.instructions.length} standing instructions, ${db.goals.length} active goals.`,
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
