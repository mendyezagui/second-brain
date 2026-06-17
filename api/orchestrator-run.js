// api/orchestrator-run.js â on-demand, STREAMING orchestrator (quick run, no news).
// Triggered by a logged-in app user from the Morning Brief. Streams Server-Sent
// Events so the UI can show exactly what it's doing, phase by phase, then writes
// the results to agentlogs (type "midday-sweep") just like the nightly api/sweep.js.

import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 60 };

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const fmt = (n) => "$" + Math.round(Number(n) || 0).toLocaleString();

async function callClaude(system, user, max = 600) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: max,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error?.message || "Claude API error");
  return d.content?.[0]?.text || "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // Auth: require a valid logged-in Supabase user (their session access token).
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing token" });
  const { data: who, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !who?.user) return res.status(401).json({ error: "Unauthorized" });

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (obj) => { try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch { /* client gone */ } };

  try {
    // ââ 1) Pull live data ââââââââââââââââââââââââââââââââââââââââââââââ
    send({ key: "data", state: "run", label: "Pulling live data from Second Brainâ¦" });
    const [contacts, deals, tasks, projects, invoices, allInvoices, goals, instructions] = await Promise.all([
      admin.from("contacts").select("*"),
      admin.from("deals").select("*"),
      admin.from("tasks").select("*").eq("done", false),
      admin.from("projects").select("*"),
      admin.from("invoices").select("*").neq("status", "paid"),
      admin.from("invoices").select("amount, amount_paid, status"),
      admin.from("goals").select("*").eq("status", "active"),
      admin.from("instructions").select("*").eq("active", true),
    ]);
    const db = {
      contacts: contacts.data || [], deals: deals.data || [], tasks: tasks.data || [],
      projects: projects.data || [], invoices: invoices.data || [],
      goals: goals.data || [], instructions: instructions.data || [],
    };
    const allInv = allInvoices.data || [];
    send({ key: "data", state: "ok", label: "Pulled live data", detail: `${db.contacts.length} contacts Â· ${db.deals.length} deals Â· ${db.tasks.length} open tasks Â· ${db.projects.length} projects Â· ${db.invoices.length} unpaid invoices` });

    // ââ 2) Compute metrics âââââââââââââââââââââââââââââââââââââââââââââ
    send({ key: "metrics", state: "run", label: "Computing metricsâ¦" });
    const overdueInv = db.invoices.filter((i) => i.status === "overdue");
    const criticalTasks = db.tasks.filter((t) => t.priority === "critical");
    const atRiskContacts = db.contacts.filter((c) => c.status === "at-risk");
    const stalledProj = db.projects.filter((p) => p.status === "stalled");
    const activeDeals = db.deals.filter((d) => !["won", "lost"].includes(d.stage));
    const weightedPipe = Math.round(db.deals.reduce((a, d) => a + (d.value || 0) * ((d.probability || 0) / 100), 0));
    const overdueAR = overdueInv.reduce((a, i) => a + (i.amount || 0), 0);
    const collectedRevenue = allInv.reduce((a, i) => a + (i.amount_paid || 0), 0);
    const revenueGoal = db.goals.filter((g) => g.unit === "$" && g.period === "annual").sort((a, b) => (b.target_value || 0) - (a.target_value || 0))[0] || { target_value: 800000 };
    const revenueTarget = revenueGoal.target_value || 800000;
    const revenueGap = Math.max(0, revenueTarget - collectedRevenue);
    const pipelineCoverage = revenueGap > 0 ? Math.round((weightedPipe / revenueGap) * 100) : 100;
    const goalsBlock = db.goals.length
      ? db.goals.slice().sort((a, b) => (a.priority_order ?? 99) - (b.priority_order ?? 99)).map((g) => `- [${g.category || "general"}] ${g.name}: ${g.current_value ?? 0}/${g.target_value} ${g.unit || ""} (${g.period || ""})`).join("\n")
      : "(no active goals defined)";
    send({ key: "metrics", state: "ok", label: "Computed metrics", detail: `weighted pipeline ${fmt(weightedPipe)} Â· revenue gap ${fmt(revenueGap)} (${pipelineCoverage}% coverage) Â· overdue A/R ${fmt(overdueAR)} Â· ${criticalTasks.length} critical tasks Â· ${atRiskContacts.length} at-risk` });

    const snap = {
      goals: db.goals.map((g) => ({ name: g.name, target: g.target_value, current: g.current_value, unit: g.unit, period: g.period, category: g.category, priority_order: g.priority_order })),
      contacts: db.contacts.map((c) => ({ name: c.name, co: c.co, status: c.status, score: c.score, lastTouch: c.lastTouch, notes: c.notes })),
      deals: db.deals.map((d) => ({ name: d.name, value: d.value, stage: d.stage, probability: d.probability, closeDate: d.closeDate, notes: d.notes })),
      tasks: db.tasks.map((t) => ({ title: t.title, due: t.due, priority: t.priority, notes: t.notes || "" })),
      projects: db.projects.map((p) => ({ name: p.name, client: p.client, type: p.type || "client", status: p.status, progress: p.progress, priority: p.priority || "medium", dueDate: p.dueDate })),
      instructions: db.instructions.map((i) => ({ title: i.title, body: i.body })),
      invoices: db.invoices.map((i) => ({ client: i.client, amount: i.amount, status: i.status, due: i.due, number: i.number })),
      metrics: { weightedPipeline: weightedPipe, collectedRevenue, revenueTarget, revenueGap, pipelineCoverage, overdueAR, openTasks: db.tasks.length, criticalTasks: criticalTasks.length, atRisk: atRiskContacts.length, stalledProjects: stalledProj.length, activeDeals: activeDeals.length },
    };
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    // ââ 3) Orchestrator action plan ââââââââââââââââââââââââââââââââââââ
    send({ key: "plan", state: "run", label: "Drafting daily action plan (Orchestrator agent)â¦" });
    const orchestratorMsg = await callClaude(
      `You are Mendy Ezagui's Orchestrator Agent â his proactive daily strategist. He's an independent AI ops consultant in LA targeting property management/HOA companies. His active goals (with live progress) are in the snapshot under "goals" â weigh every recommendation against them, prioritizing the lowest priority_order (most important) first. His primary revenue goal is ${fmt(revenueTarget)}/year; he has collected ${fmt(collectedRevenue)} so far (gap ${fmt(revenueGap)}, weighted pipeline ${fmt(weightedPipe)} = ${pipelineCoverage}% coverage). Projects are typed "client" or "strategic" with priorities (high/medium/low); high-priority strategic projects should drive weekly focus. The snapshot's "instructions" array holds Mendy's standing orders â follow them and let them override default behavior. It is mid-day â focus on what's still actionable before end of day. Be specific â name names, cite dollar amounts, reference deadlines.`,
      `Mid-day check-in â today is ${today}.\n\nYOUR GOALS (most important first):\n${goalsBlock}\n\nREVENUE: collected ${fmt(collectedRevenue)} of ${fmt(revenueTarget)} target â gap ${fmt(revenueGap)}; weighted pipeline ${fmt(weightedPipe)} (${pipelineCoverage}% coverage).\n\nLive database snapshot:\n${JSON.stringify(snap, null, 2)}\n\nGenerate Mendy's Action Plan for the rest of today:\n\nTOP PRIORITIES â The 1-2 most urgent items still open, tied to the goals they advance.\n\nDEAL MOVES â Specific next actions on active deals, ranked by revenue potential and urgency. Flag stale deals (no activity >7 days).\n\nSTRATEGIC PLAYS â One move to advance a high-priority strategic project before EOD.\n\nSMART NUDGES â Follow-ups due, relationships going cold, deadlines, billing issues.\n\nBe direct. Name people, amounts, dates. Max 8 sentences total.`,
      800
    );
    send({ key: "plan", state: "ok", label: "Daily action plan ready", detail: orchestratorMsg.slice(0, 96).replace(/\n/g, " ") + (orchestratorMsg.length > 96 ? "â¦" : "") });

    // ââ 4) Billing agent (only if overdue) âââââââââââââââââââââââââââââ
    let billingMsg = null;
    if (overdueAR > 0) {
      send({ key: "billing", state: "run", label: "Billing agent â overdue A/Râ¦" });
      billingMsg = await callClaude(`You are a billing agent. Be direct and specific. One sentence max.`, `Overdue invoices: ${JSON.stringify(overdueInv.map((i) => ({ client: i.client, amount: i.amount, number: i.number, due: i.due })))}. What is the single most urgent collection action?`, 150);
      send({ key: "billing", state: "ok", label: "Billing agent", detail: billingMsg });
    } else {
      send({ key: "billing", state: "skip", label: "Billing agent", detail: "No overdue invoices â skipped" });
    }

    // ââ 5) CRM agent (only if at-risk contacts) ââââââââââââââââââââââââ
    let crmMsg = null;
    if (atRiskContacts.length > 0) {
      send({ key: "crm", state: "run", label: "CRM agent â at-risk relationshipsâ¦" });
      crmMsg = await callClaude(`You are a CRM agent. Be direct and specific. One sentence max.`, `At-risk contacts: ${JSON.stringify(atRiskContacts.map((c) => ({ name: c.name, co: c.co, score: c.score, lastTouch: c.lastTouch, notes: c.notes })))}. What is the most important relationship action today?`, 150);
      send({ key: "crm", state: "ok", label: "CRM agent", detail: crmMsg });
    } else {
      send({ key: "crm", state: "skip", label: "CRM agent", detail: "No at-risk contacts â skipped" });
    }

    // ââ 6) Write to agentlogs ââââââââââââââââââââââââââââââââââââââââââ
    send({ key: "write", state: "run", label: "Writing results to agentlogsâ¦" });
    const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles" });
    const nowIso = new Date().toISOString();
    const { data: lastLog } = await admin.from("agentlogs").select("id").order("id", { ascending: false }).limit(1);
    let nextId = (lastLog?.[0]?.id || 0) + 1;
    const logs = [
      { id: nextId++, agent: "Orchestrator", type: "midday-sweep", message: orchestratorMsg, ts, priority: "high", modified_by: "orchestrator-manual", modified_at: nowIso },
      billingMsg ? { id: nextId++, agent: "Billing Agent", type: "alert", message: billingMsg, ts, priority: "critical", modified_by: "orchestrator-manual", modified_at: nowIso } : null,
      crmMsg ? { id: nextId++, agent: "CRM Agent", type: "risk", message: crmMsg, ts, priority: "high", modified_by: "orchestrator-manual", modified_at: nowIso } : null,
      { id: nextId++, agent: "System", type: "sweep-summary", message: `Mid-day sweep â ${db.contacts.length} contacts, ${activeDeals.length} active deals, ${fmt(overdueAR)} overdue A/R, ${criticalTasks.length} critical tasks, ${atRiskContacts.length} at-risk. Collected ${fmt(collectedRevenue)} of ${fmt(revenueTarget)} (${pipelineCoverage}% coverage).`, ts, priority: "medium", modified_by: "orchestrator-manual", modified_at: nowIso },
    ].filter(Boolean);
    const { error: insErr } = await admin.from("agentlogs").insert(logs);
    if (insErr) throw new Error("Failed to write agentlogs: " + insErr.message);
    send({ key: "write", state: "ok", label: `Wrote ${logs.length} entries to agentlogs` });

    // ââ Done âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
    send({ done: true, plan: orchestratorMsg, billing: billingMsg, crm: crmMsg, logs: logs.length, ts });
    res.end();
  } catch (err) {
    send({ error: String(err?.message || err) });
    res.end();
  }
}
