// SoFa JCC associate — the decision core.
//
// Pure functions in, plain "intents" out. No Supabase, no fetch to Claude,
// no push. The Vercel function (api/sofa-jcc.js) and the browser console
// (SofaJCCView) both call these and then perform the IO themselves, so the
// cron and the UI can never disagree about what should happen.
//
// Everything an intent carries is either read from the calendar, read from
// the database, or computed. Nothing here invents a fact.

import { upcomingHolidays, actionable, nextShabbat, isoDate, addDays, daysBetween, slugify, NUDGE_LEAD_DAYS } from "./hebcal.js";
import { computeGaps, flyerStatus, missingSentence, blocking } from "./gaps.js";
import { renderFlyer, longDate } from "./templates.js";
import { BRAND } from "./brand.js";

/** Pick the template an event should be drawn with. */
export const templateFor = (ev) =>
  ev.speaker_id || ev.kind === "speaker" ? "speaker"
    : ev.kind === "weekly" ? "weekly"
    : "holiday";

/**
 * Turn a calendar holiday into the sofa_events row it should become.
 * `hebcal_key` is the idempotency key — re-running the scan updates the same
 * row rather than piling up duplicates.
 */
export function eventFromHoliday(h) {
  const name = h.baseTitle;
  return {
    hebcal_key: h.key,
    title: h.erev ? `${name} — Erev` : h.title,
    kind: "holiday",
    event_date: h.date,
    hebrew_date: h.hdate,
    candle_lighting: h.candleLighting || "",
    havdalah: h.havdalah || "",
    // Seed the eyebrow from the calendar so the flyer has its maroon lead-in
    // and the occasion gap starts answered.
    occasion: h.erev ? h.title : name,
    status: "draft",
    source: "agent:hebcal",
    notes: h.memo || "",
  };
}

/**
 * The full daily decision. Given the calendar and what is already stored,
 * returns every action the associate wants to take, with a reason attached.
 *
 * @returns {{ upserts, drafts, nudges, shabbat, summary }}
 */
export async function planDay({
  today = isoDate(),
  existingEvents = [],
  existingFlyers = [],
  sentNudgeKeys = [],
  speakersById = {},
  geonameid,
  fetchImpl,
} = {}) {
  const { holidays, location } = await upcomingHolidays({ from: today, geonameid, fetchImpl });
  const due = actionable(holidays, { leadDays: NUDGE_LEAD_DAYS });
  const shabbat = await nextShabbat({ from: today, geonameid, fetchImpl }).catch(() => null);

  const byKey = new Map(existingEvents.filter((e) => e.hebcal_key).map((e) => [e.hebcal_key, e]));
  const flyersByEvent = new Map();
  for (const f of existingFlyers) {
    const cur = flyersByEvent.get(f.event_id);
    if (!cur || (f.version || 1) >= (cur.version || 1)) flyersByEvent.set(f.event_id, f);
  }
  const sent = new Set(sentNudgeKeys);

  const upserts = [];
  const drafts = [];
  const nudges = [];

  for (const h of due) {
    const existing = byKey.get(h.key);

    // 1. Keep the event row in sync with the calendar. Calendar-owned fields
    //    (dates, candle times) are refreshed; anything Mendy typed is kept.
    const row = eventFromHoliday(h);
    if (!existing) {
      upserts.push({ ...row, reason: `${h.title} is ${h.leadDays} day(s) out and has no event row yet` });
    } else if (
      existing.candle_lighting !== row.candle_lighting ||
      existing.hebrew_date !== row.hebrew_date
    ) {
      upserts.push({ id: existing.id, hebcal_key: h.key, candle_lighting: row.candle_lighting, hebrew_date: row.hebrew_date, reason: "calendar fields drifted" });
    }

    // 2. Draft a flyer if there isn't one yet. A published flyer is never
    //    silently redrawn — that would replace something already circulating.
    const ev = existing ? { ...existing, ...row, id: existing.id } : row;
    const speaker = ev.speaker_id ? speakersById[ev.speaker_id] || null : null;
    const template = templateFor(ev);
    const prior = existing ? flyersByEvent.get(existing.id) : null;
    const answers = prior?.answers || {};
    const gaps = computeGaps(ev, { speaker, template, answers });
    const status = flyerStatus(gaps);

    if (!prior || prior.status === "superseded") {
      drafts.push({
        event_key: h.key,
        event_id: existing?.id ?? null,
        template,
        version: (prior?.version || 0) + 1,
        status,
        gaps,
        copy: defaultCopy(ev, h, speaker, template),
        reason: prior ? "previous draft was superseded" : `no flyer exists for ${h.title}`,
      });
    } else if (prior.status !== "published" && JSON.stringify(prior.missing || []) !== JSON.stringify(gaps)) {
      drafts.push({
        event_key: h.key,
        event_id: existing?.id ?? null,
        flyer_id: prior.id,
        template,
        version: prior.version || 1,
        status,
        gaps,
        copy: null,                       // copy already written; only gaps moved
        reason: "gap list changed since the last draft",
      });
    }

    // 3. Speak up — but only on a scheduled lead day, and only once per
    //    (event, lead day). dedupe_key is what makes that guarantee hold
    //    across re-runs and across both callers.
    if (!h.nudgeDue) continue;
    const dedupe_key = `${h.key}:t-${h.leadDays}`;
    if (sent.has(dedupe_key)) continue;

    const missing = missingSentence(gaps);
    const isBlocked = blocking(gaps).length > 0;
    const when = h.leadDays === 0 ? "today" : h.leadDays === 1 ? "tomorrow" : `in ${h.leadDays} days`;

    nudges.push({
      dedupe_key,
      kind: missing ? "missing_input" : "holiday_lead",
      event_key: h.key,
      event_id: existing?.id ?? null,
      lead_days: h.leadDays,
      severity: isBlocked && h.leadDays <= 2 ? "high" : "normal",
      title: `${h.baseTitle} is ${when}`,
      body: missing
        ? `Your SoFa JCC agent drafted the flyer and is missing ${missing}.`
        : `The ${h.baseTitle} flyer is drafted and ready to review.`,
      url: "/#/sofa_jcc",
      gaps,
      reason: `T-${h.leadDays} is a scheduled lead day`,
    });
  }

  return {
    today,
    location,
    shabbat,
    upserts,
    drafts,
    nudges,
    holidays: due,
    summary:
      `${due.length} holiday(s) in the ${Math.max(...NUDGE_LEAD_DAYS)}-day window · ` +
      `${upserts.length} event upsert(s) · ${drafts.length} draft(s) · ${nudges.length} nudge(s)`,
  };
}

/**
 * Deterministic flyer copy. This is the FALLBACK and the floor: it is always
 * correct, never invented, and works with no API key. api/sofa-jcc.js may
 * ask Claude to improve the description on top of this — but if that call
 * fails, the flyer still reads properly.
 */
export function defaultCopy(ev, holiday, speaker, template) {
  if (template === "speaker" && speaker) {
    return {
      headline: speaker.name || "",
      subhead: [speaker.title, speaker.org].filter(Boolean).join(", "),
      body: speaker.short_bio || "",
      occasion: ev.occasion || "",
      lede: ev.lede || "We have the honor of welcoming our guest speaker",
      footer: BRAND.site,
    };
  }
  if (template === "weekly") {
    return { headline: `This Week at ${BRAND.publicName.replace(" Jewish Community Center", "")}`, subhead: "", body: "", occasion: "This Week", lede: "", footer: BRAND.site };
  }
  const name = holiday?.baseTitle || ev.title || "";
  return {
    headline: name,
    subhead: ev.subhead || "",
    body: ev.description || holiday?.memo || "",
    // The house layout leads with a maroon eyebrow; Erev flyers say so.
    occasion: ev.occasion || (holiday?.erev ? "Erev " + name : ""),
    lede: ev.lede || "",
    footer: BRAND.site,
  };
}

/** Assemble the payload renderFlyer expects from DB rows. */
export function flyerPayload(ev, flyer = {}, speaker = null) {
  const merged = {
    ...ev,
    headline: flyer.headline || ev.title,
    subhead: flyer.subhead || "",
    description: flyer.body || ev.description || "",
    occasion: flyer.occasion || ev.occasion || "",
    lede: flyer.lede || ev.lede || "",
  };
  if (templateFor(ev) !== "speaker") return { event: merged };
  const sp = speaker || {};
  return {
    event: merged,
    speaker: {
      ...sp,
      // The template shows up to three short credential lines. A researched
      // one-line bio becomes the first of them.
      credentials: Array.isArray(sp.credentials) && sp.credentials.length
        ? sp.credentials
        : [sp.short_bio].filter(Boolean),
    },
  };
}

export function renderFor(ev, flyer, speaker, opts) {
  return renderFlyer(templateFor(ev), flyerPayload(ev, flyer, speaker), opts);
}

/** Build the week's items for the weekly flyer from stored events. */
export function weekPayload(events, { from = isoDate(), shabbat = null } = {}) {
  const to = addDays(from, 7);
  const items = events
    .filter((e) => e.event_date >= from && e.event_date < to && e.status !== "cancelled")
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .map((e) => ({
      day: longDate(e.event_date).split(",")[0],
      title: e.title,
      start_time: e.start_time,
      location: e.location,
      event_date: e.event_date,
    }));
  return {
    week: {
      headline: "This Week at SoFa",
      subhead: `${longDate(from, { weekday: false })} – ${longDate(addDays(from, 6), { weekday: false })}`,
      candle_lighting: shabbat?.candleLighting || "",
      items,
    },
  };
}

export { isoDate, addDays, daysBetween, slugify, computeGaps, flyerStatus, missingSentence };
