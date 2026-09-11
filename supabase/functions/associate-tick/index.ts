// The associate runtime — one scheduler for every associate.
//
// Why this is an Edge Function and not a Vercel route: the Hobby plan caps
// Vercel crons at 2 and both are spent (/api/sweep, /api/content). Worse, the
// app is served from Cloudflare Pages, where Vercel-format api/*.js files do
// not run at all. Putting the tick here means the roster grows without ever
// touching that ceiling again — one pg_cron job fans out to N associates, and
// associate number 20 costs nothing but a row.
//
// The logic is NOT duplicated. These imports are the exact same modules the
// browser console runs, pinned to a commit so a deploy is reproducible and a
// later push to main cannot silently change what the cron executes. Bump the
// SHA deliberately, then redeploy.
//
//   GET                                   -> dry run of the whole tick, writes nothing
//   POST { action: "tick" }               -> run everyone who is due
//   POST { action: "run", slug, ... }     -> run one now (what the console calls)
//   POST { ..., dry_run: true }           -> plan only, no model call, no writes
//
// verify_jwt is ON. The console calls it with the signed-in user's JWT via
// supabase.functions.invoke; pg_cron calls it with the service-role key. An
// unauthenticated caller cannot spend model credits.
//
// Draft-and-hold, per docs/proactive-orchestrator-spec.md section 5: this
// function writes runs, drafts, memories and tasks. It has no send path —
// no email, no post, no outbound message of any kind.
//
// Deployed with: mcp Supabase deploy_edge_function (project xwacfwagyhgbbhefecdt)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Pinned deliberately. Bump both URLs together and redeploy when you want the
// cron to pick up new core logic; a push to main must never change what runs
// tonight on its own.
import { planTick, planAssociate, isoDate, missingSentence } from "https://raw.githubusercontent.com/mendyezagui/second-brain/aef7f0867257d5a1b2e4f580c0c4cda7babb9c30/src/lib/associates/core.js";
import { tablesFor } from "https://raw.githubusercontent.com/mendyezagui/second-brain/aef7f0867257d5a1b2e4f580c0c4cda7babb9c30/src/lib/associates/context.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

async function log(sb: any, type: string, message: string, priority = "medium") {
  try {
    await sb.from("agentlogs").insert({
      agent: "Associates",
      type,
      message,
      ts: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles" }),
      priority,
    });
  } catch (_) { /* logging must never fail a run */ }
}

/**
 * The model call. Kept here rather than behind /api/claude because that route
 * does not exist on the host the app is served from.
 *
 * A missing key is reported as a real error on the run row. Silently producing
 * nothing is how an agent rots for three months without anyone noticing.
 */
async function callClaude(system: string, user: string, model: string, maxTokens: number) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set on this function. Supabase → Edge Functions → associate-tick → Secrets.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  const d = await res.json().catch(() => null);
  if (!res.ok) throw new Error(d?.error?.message || `Anthropic HTTP ${res.status}`);
  const text = d?.content?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) throw new Error("Model returned an empty response.");
  return { text, tokens: d?.usage?.output_tokens ?? null };
}

/** Load only the tables the due associates actually declared. A quiet morning
 *  costs one query, not a full snapshot of the Second Brain. */
async function loadSources(sb: any, associates: any[], needLinked: boolean) {
  const names = new Set<string>();
  for (const a of associates) for (const t of tablesFor(a.inputs || {})) names.add(t);
  // A scoped run also reads the records it was pointed at, plus what hangs off them.
  if (needLinked) ["contacts", "companies", "deals", "projects", "documents", "ai_memories", "tasks"].forEach((t) => names.add(t));

  const list = [...names];
  const results = await Promise.all(list.map((t) => sb.from(t).select("*")));
  const sources: Record<string, any[]> = {};
  list.forEach((t, i) => { sources[t] = results[i].data || []; });
  return sources;
}

/**
 * Execute one planned associate. The plan is already decided — this only does
 * the IO, so a failure here cannot change what the associate intended to do.
 */
async function execute(sb: any, associate: any, plan: any, { dryRun = false } = {}) {
  const started = Date.now();
  const base = {
    associate_id: associate.id,
    slug: associate.slug,
    run_key: plan.run_key,
    trigger: plan.trigger,
    input_digest: plan.context.digest,
    gaps: plan.gaps,
    model: associate.model,
    modified_by: "agent:associate-tick",
  };

  // An associate with nothing to read records the fact and stops. This is a
  // successful outcome, not an error, and it costs no model call.
  if (plan.skip === "no_input") {
    if (dryRun) return { ...plan, wrote: null };
    const { data } = await sb.from("associate_runs")
      .insert({ ...base, status: "no_input", summary: plan.summary, finished_at: new Date().toISOString(), duration_ms: Date.now() - started })
      .select("id").maybeSingle();
    return { ...plan, run_id: data?.id ?? null, wrote: { run: 1 } };
  }

  if (dryRun) return { ...plan, wrote: null, system: plan.system, user_preview: plan.user.slice(0, 600) };

  let text = "", tokens: number | null = null, error = "";
  try {
    const out = await callClaude(plan.system, plan.user, associate.model || "claude-sonnet-4-6", associate.max_tokens || 2200);
    text = out.text; tokens = out.tokens;
  } catch (e) {
    error = String((e as Error)?.message || e);
  }

  const { data: run } = await sb.from("associate_runs").insert({
    ...base,
    status: error ? "error" : "ok",
    summary: error ? `${associate.label}: ${error}` : plan.summary,
    output: text,
    error,
    tokens_out: tokens,
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
  }).select("id").maybeSingle();

  if (error) return { ...plan, run_id: run?.id ?? null, status: "error", error, wrote: { run: 1 } };

  const rails = associate.rails || {};
  const wrote: Record<string, number> = { run: 1 };
  const now = new Date().toISOString();

  // 1. The draft. Versioned rather than overwritten: dedupe_key collides on a
  //    same-day re-run, and the update bumps the version so you can still see
  //    what it said before.
  if (rails.save_draft !== false) {
    const { data: prior } = await sb.from("associate_drafts")
      .select("id,version").eq("dedupe_key", plan.draft.dedupe_key).maybeSingle();
    const row = {
      associate_id: associate.id,
      run_id: run?.id ?? null,
      slug: associate.slug,
      kind: plan.draft.kind,
      title: plan.draft.title,
      body: text,
      status: plan.draft.status,
      gaps: plan.gaps,
      version: (prior?.version || 0) + 1,
      dedupe_key: plan.draft.dedupe_key,
      contactId: plan.draft.contactId,
      companyId: plan.draft.companyId,
      dealId: plan.draft.dealId,
      projectId: plan.draft.projectId,
      modified_by: "agent:associate-tick",
      modified_at: now,
    };
    if (prior) await sb.from("associate_drafts").update(row).eq("id", prior.id);
    else await sb.from("associate_drafts").insert(row);
    wrote.draft = 1;
  }

  // 2. Memory — so the next run of any associate can see what this one concluded.
  if (rails.save_memory) {
    await sb.from("ai_memories").insert({
      subject: plan.draft.title,
      ai_system: "claude",
      memory_summary: text,
      memory_type: "context",
      source_context: `associates/${associate.slug}`,
      contactId: plan.draft.contactId,
      companyId: plan.draft.companyId,
      dealId: plan.draft.dealId,
      projectId: plan.draft.projectId,
      modified_by: "agent:associate-tick",
    });
    wrote.memory = 1;
  }

  // 3. Document, for the artifacts worth filing (SOWs, proposals, specs).
  if (rails.save_document) {
    const associations = [
      plan.draft.contactId && { type: "contact", id: plan.draft.contactId },
      plan.draft.companyId && { type: "company", id: plan.draft.companyId },
      plan.draft.dealId && { type: "deal", id: plan.draft.dealId },
      plan.draft.projectId && { type: "project", id: plan.draft.projectId },
    ].filter(Boolean);
    await sb.from("documents").insert({
      title: plan.draft.title,
      description: text,
      kind: "generated",
      associations,
      created_at: now,
      modified_by: "agent:associate-tick",
    });
    wrote.document = 1;
  }

  // 4. A follow-up task. Deliberately last and deliberately optional — an
  //    associate that creates a task on every run just builds a second inbox.
  if (rails.create_task) {
    const missing = missingSentence(plan.gaps);
    await sb.from("tasks").insert({
      title: missing ? `${associate.label}: needs ${missing}` : `Review: ${plan.draft.title}`,
      due: plan.today,
      priority: missing ? "high" : "medium",
      status: "todo",
      category: "follow_up",
      source: `agent:${associate.slug}`,
      contactId: plan.draft.contactId,
      companyId: plan.draft.companyId,
      dealId: plan.draft.dealId,
      projectId: plan.draft.projectId,
      notes: `Created by the ${associate.label} run on ${plan.today}.`,
      modified_by: "agent:associate-tick",
    });
    wrote.task = 1;
  }

  await sb.from("associates").update({ last_run_at: now, modified_at: now }).eq("id", associate.id);

  return { ...plan, run_id: run?.id ?? null, status: "ok", wrote, output: text };
}

/** The whole tick: who is due, then run each one. */
async function runTick({ dryRun = false, now = new Date() } = {}) {
  const sb = admin();

  const { data: roster } = await sb.from("associates").select("*").eq("active", true).order("sort_order");
  const associates = roster || [];

  // Today's run keys, so a tick that fires twice is a no-op the second time.
  const { data: runsToday } = await sb.from("associate_runs")
    .select("run_key").gte("started_at", isoDate(now) + "T00:00:00Z");
  const alreadyRan = new Set((runsToday || []).map((r: any) => r.run_key));

  const plan = planTick(associates, { now, alreadyRan });
  if (plan.due.length === 0) {
    return { ...plan, dryRun, results: [], note: "nothing due" };
  }

  const dueAssociates = plan.due.map((d: any) => d.associate);
  const sources = await loadSources(sb, dueAssociates, false);

  // Run them concurrently, in bounded waves. A single associate takes ~45s
  // end to end, and the cron's pg_net call times out at 55s — sequential
  // execution would mean the second associate to come due on any given day
  // silently never finishes. Waves of 4 keep total wall time at roughly one
  // associate regardless of roster size, without opening 20 model calls at
  // once. Each run has its own unique run_key, so concurrency cannot make
  // two associates collide.
  const WAVE = 4;
  const results: any[] = [];
  for (let i = 0; i < dueAssociates.length; i += WAVE) {
    const wave = dueAssociates.slice(i, i + WAVE);
    results.push(...await Promise.all(wave.map((a: any) =>
      execute(sb, a, planAssociate(a, sources, { now, trigger: "cron" }), { dryRun })
        // One associate blowing up must not take the rest of the tick with it.
        .catch((e: any) => ({ slug: a.slug, status: "error", error: String(e?.message || e), wrote: null })),
    )));
  }

  if (!dryRun) {
    const ok = results.filter((r: any) => r.status === "ok").length;
    const errs = results.filter((r: any) => r.status === "error");
    await log(
      sb, "tick",
      `${plan.summary} · ${ok} ok, ${results.filter((r: any) => r.skip === "no_input").length} no-input, ${errs.length} error(s)` +
        (errs.length ? ` — ${errs.map((e: any) => `${e.slug}: ${e.error}`).join("; ")}` : ""),
      errs.length ? "high" : "medium",
    );
  }

  return { ...plan, dryRun, results };
}

/** One associate, on demand. This is what the console's Run button calls. */
async function runOne({ slug, instructions = "", link = {}, answers = {}, dryRun = false, now = new Date() }) {
  const sb = admin();
  const { data: associate } = await sb.from("associates").select("*").eq("slug", slug).maybeSingle();
  if (!associate) return { error: `No associate with slug '${slug}'.` };
  if (associate.runtime === "custom") {
    return { error: `'${slug}' has a custom runtime (${associate.console || "its own console"}) — run it there, not here.` };
  }

  const needLinked = (associate.inputs?.linked !== false);
  const sources = await loadSources(sb, [associate], needLinked);
  const plan = planAssociate(associate, sources, { now, trigger: "manual", link, instructions, answers });
  const result = await execute(sb, associate, plan, { dryRun });

  if (!dryRun) {
    await log(sb, "run", `${associate.label} (manual) — ${result.status === "error" ? result.error : plan.summary}`,
      result.status === "error" ? "high" : "low");
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  try {
    // The dry run writes nothing and calls no model, so it is the safe way to
    // see what tonight would do.
    if (req.method === "GET") return json(await runTick({ dryRun: true }));
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const body = await req.json().catch(() => ({}));
    const now = body.now ? new Date(body.now) : new Date();

    if (body.action === "run") {
      if (!body.slug) return json({ error: "action 'run' needs a slug" }, 400);
      return json(await runOne({
        slug: body.slug,
        instructions: body.instructions || "",
        link: body.link || {},
        answers: body.answers || {},
        dryRun: !!body.dry_run,
        now,
      }));
    }

    return json(await runTick({ dryRun: !!body.dry_run, now }));
  } catch (err) {
    console.error("associate-tick failed:", err);
    return json({ error: String(err) }, 500);
  }
});
