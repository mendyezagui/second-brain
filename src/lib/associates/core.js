// The associate runtime — the decision core.
//
// Same contract as src/lib/sofa/agent.js, which is the pattern this
// generalises: pure functions in, plain intents out. No Supabase, no fetch,
// no model call. The Edge Function (supabase/functions/associate-tick) and
// the browser console both call these and then perform the IO themselves, so
// a scheduled run and a run you click can never disagree.
//
// The three things that make an associate real rather than a prompt:
//   1. a clock          -> isDue / runKey
//   2. a gap list       -> computeGaps, computed from empty fields
//   3. draft-and-hold   -> intents describe a draft; nothing here sends
//
// Nothing in this file invents a fact.

import { buildContext, contextSize } from "./context.js";

export const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// ------------------------------------------------------------------
// The clock
// ------------------------------------------------------------------

/** Parse the small schedule vocabulary. Anything unrecognised is manual —
 *  a typo must never turn into an unscheduled agent nobody knows is running. */
export function parseSchedule(schedule) {
  const s = String(schedule || "manual").trim().toLowerCase();
  if (s === "daily") return { kind: "daily" };
  const w = /^weekly:(sun|mon|tue|wed|thu|fri|sat)$/.exec(s);
  if (w) return { kind: "weekly", day: w[1] };
  const m = /^monthly:(\d{1,2})$/.exec(s);
  if (m) {
    const dom = Number(m[1]);
    // 29-31 do not exist in every month; refusing them beats an associate
    // that silently skips February.
    if (dom >= 1 && dom <= 28) return { kind: "monthly", dom };
  }
  return { kind: "manual" };
}

/**
 * The idempotency key. '<slug>:<date>' for anything on a clock — a schedule
 * fires at most once per calendar day, so the date is the bucket and a tick
 * that runs twice writes one run. Manual runs carry a timestamp because
 * asking for a second one by hand is a deliberate act.
 */
export const runKey = (slug, { trigger = "cron", now = new Date() } = {}) =>
  trigger === "cron" ? `${slug}:${isoDate(now)}` : `${slug}:${trigger}:${now.toISOString()}`;

/** Minutes past midnight UTC, from "HH:MM". Defaults to the SoFa/sweep slot. */
const minutesOf = (hhmm, fallback = 870) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || "").trim());
  if (!m) return fallback;
  return Number(m[1]) * 60 + Number(m[2]);
};

/**
 * Should this associate run right now?
 *
 * `alreadyRan` is the caller's set of run_keys, so "due" already accounts for
 * a run that happened earlier today — including one that errored. A failing
 * associate is not retried in a loop by the tick; it is visible as a failed
 * run and rerun deliberately.
 */
export function isDue(associate, { now = new Date(), alreadyRan = new Set() } = {}) {
  const key = runKey(associate.slug, { now });
  if (associate.active === false)      return { due: false, key, reason: "retired" };
  if (associate.runtime === "custom")  return { due: false, key, reason: "custom runtime — has its own scan" };

  const sched = parseSchedule(associate.schedule);
  if (sched.kind === "manual")         return { due: false, key, reason: "manual only" };
  if (alreadyRan.has(key))             return { due: false, key, reason: "already ran today" };

  if (sched.kind === "weekly" && DAYS[now.getUTCDay()] !== sched.day) {
    return { due: false, key, reason: `weekly:${sched.day}, today is ${DAYS[now.getUTCDay()]}` };
  }
  if (sched.kind === "monthly" && now.getUTCDate() !== sched.dom) {
    return { due: false, key, reason: `monthly on the ${sched.dom}` };
  }

  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const atMin = minutesOf(associate.run_at_utc);
  if (nowMin < atMin) return { due: false, key, reason: `not until ${associate.run_at_utc} UTC` };

  return { due: true, key, reason: `${associate.schedule} at ${associate.run_at_utc} UTC` };
}

/** Next fire time, for display. Null for manual. */
export function nextRunAt(associate, now = new Date()) {
  const sched = parseSchedule(associate.schedule);
  if (sched.kind === "manual") return null;
  const at = minutesOf(associate.run_at_utc);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), Math.floor(at / 60), at % 60));
  const bump = () => d.setUTCDate(d.getUTCDate() + 1);
  if (d <= now) bump();
  // At most ~13 months of hops; monthly:1-28 always lands inside that.
  for (let i = 0; i < 400; i++) {
    if (sched.kind === "daily") break;
    if (sched.kind === "weekly" && DAYS[d.getUTCDay()] === sched.day) break;
    if (sched.kind === "monthly" && d.getUTCDate() === sched.dom) break;
    bump();
  }
  return d;
}

// ------------------------------------------------------------------
// The gap list — deterministic, never a model's opinion
// ------------------------------------------------------------------

const has = (v) =>
  Array.isArray(v) ? v.length > 0
    : typeof v === "string" ? v.trim().length > 0
    : v != null && v !== "";

/** Read "scope.deal.value" or "tables.invoices" out of the context pack. */
export const readPath = (obj, path) =>
  String(path || "").split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

/**
 * What the associate is missing, computed from the context it actually got.
 *
 * The severities are the SoFa ones and mean the same things:
 *   blocking — the artifact is wrong without it; hold the draft for input
 *   ask      — you should answer, but the draft stands
 *   nice     — improves it; silently omitted when absent
 *
 * `answers` is what you already replied on a previous draft, so an associate
 * never asks the same question twice.
 */
export function computeGaps(requirements = [], context = {}, answers = {}) {
  return (requirements || [])
    .filter((r) => r?.field && !has(readPath(context, r.field)) && !has(answers[r.field]))
    .map((r) => ({
      field: r.field,
      label: r.label || r.field,
      severity: r.severity || "ask",
      question: r.question || `Missing: ${r.label || r.field}`,
    }));
}

export const blocking = (gaps) => (gaps || []).filter((g) => g.severity === "blocking");
export const askable  = (gaps) => (gaps || []).filter((g) => g.severity !== "nice");

/** staged -> needs_input -> ready. Purely a function of the gaps. */
export function draftStatus(gaps) {
  if (blocking(gaps).length > 0) return "needs_input";
  if (askable(gaps).length > 0) return "staged";
  return "ready";
}

/** "start time, location and address" — capped, because a notification that
 *  lists eight fields is a wall of text nobody reads. */
export function missingSentence(gaps, { max = 3 } = {}) {
  const items = askable(gaps).map((g) => (g.label || "").toLowerCase()).filter(Boolean);
  if (!items.length) return "";
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  const list = shown.length === 1 ? shown[0] : `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
  return rest > 0 ? `${list}, +${rest} more` : list;
}

// ------------------------------------------------------------------
// The prompt
// ------------------------------------------------------------------

/** House rules every associate inherits. Lifted verbatim from the behaviour
 *  the Associates tab already had, so promoting an associate onto the runtime
 *  does not change its voice. */
export const HOUSE_RULES = [
  "You are an AI associate working for Mendy Ezagui, independent AI operations and Salesforce consultant.",
  "Brand context: Clarity Operator for consulting, Voitra AI for voice AI.",
  "Be direct, useful, and outcome-focused. No filler. Do not invent facts not in the context.",
  "Use value-based framing. Avoid hourly pricing unless explicitly required.",
  "If the output is client-facing, make it polished but not corporate. Never say 'I hope this finds you well.'",
];

export function buildPrompt(associate, context, { instructions = "", gaps = [], today = isoDate() } = {}) {
  const system = [
    ...HOUSE_RULES,
    `Associate role: ${associate.label}. Required artifact: ${associate.artifact}.`,
    associate.brief || "",
    // The gaps are handed over so the model writes AROUND a missing input
    // instead of inventing one to fill the hole.
    gaps.length
      ? `The following inputs are missing and you must NOT invent them. Leave a clearly marked placeholder and list them under "Needs from Mendy": ${gaps.map((g) => g.label).join(", ")}.`
      : "",
  ].filter(Boolean).join("\n");

  const user = [
    `TODAY: ${today}`,
    `ASSOCIATE: ${associate.label}`,
    `ARTIFACT: ${associate.artifact}`,
    `SECOND BRAIN CONTEXT:\n${JSON.stringify(context, null, 2)}`,
    `ADDITIONAL INSTRUCTIONS FROM MENDY:\n${instructions || "None."}`,
    "Return a complete, usable artifact. Include assumptions, risks, and next actions when relevant. End with a short \"Needs from Mendy\" list if anything is missing; omit that section entirely if nothing is.",
  ].join("\n\n");

  return { system, user };
}

// ------------------------------------------------------------------
// The plan
// ------------------------------------------------------------------

/**
 * One associate's full decision, ready for the caller to execute.
 * Returns an intent, never a side effect.
 */
export function planAssociate(associate, sources, {
  now = new Date(), trigger = "cron", link = {}, instructions = "", answers = {},
} = {}) {
  const today = isoDate(now);
  const context = buildContext(sources, associate.inputs || {}, link, today);
  const gaps = computeGaps(associate.requirements, context, answers);
  const size = contextSize(context);

  // An associate handed nothing to read should say so, not spend a model call
  // writing a confident artifact out of thin air. This is the single most
  // common way a scheduled agent becomes noise.
  if (size === 0) {
    return {
      slug: associate.slug,
      run_key: runKey(associate.slug, { trigger, now }),
      trigger, context, gaps, today,
      skip: "no_input",
      summary: `${associate.label}: nothing to read — its inputs matched 0 rows.`,
    };
  }

  const { system, user } = buildPrompt(associate, context, { instructions, gaps, today });
  return {
    slug: associate.slug,
    run_key: runKey(associate.slug, { trigger, now }),
    trigger, context, gaps, today, system, user,
    skip: null,
    draft: {
      kind: associate.artifact_kind || "document",
      title: `${associate.artifact}${link.title ? ` — ${link.title}` : ""} · ${today}`,
      status: draftStatus(gaps),
      dedupe_key: `${associate.slug}:${today}`,
      contactId: link.contactId || null,
      companyId: link.companyId || null,
      dealId: link.dealId || null,
      projectId: link.projectId || null,
    },
    summary: `${associate.label}: ${size} row(s) of context, ${gaps.length} gap(s)`,
  };
}

/**
 * The whole tick. Given the roster and what has already run, decide who goes.
 * The caller loads sources only for the associates that are actually due —
 * `tablesFor` on the due set — so a quiet morning costs one query.
 */
export function planTick(associates = [], { now = new Date(), alreadyRan = new Set() } = {}) {
  const due = [], held = [];
  for (const a of associates) {
    const verdict = isDue(a, { now, alreadyRan });
    (verdict.due ? due : held).push({ associate: a, ...verdict });
  }
  return {
    now: now.toISOString(),
    due,
    held,
    summary: `${due.length} associate(s) due of ${associates.length} on the roster`,
  };
}

export { buildContext, contextSize };
