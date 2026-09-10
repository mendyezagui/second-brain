// Flyer templates — the reason week-to-week output stays on-brand.
//
// Consistency here is STRUCTURAL, not a prompt instruction. The layout,
// palette, type scale and crest positions are fixed in code; the model only
// ever supplies words, and those words land in slots. Two flyers six months
// apart are the same object with different text.
//
// Each template returns a complete standalone HTML document sized to a
// CANVAS. That document is what gets stored in sofa_flyers.html, previewed
// in an iframe in the console, and screenshotted to PNG.

import { BRAND, COLORS, FONTS, CANVAS, RULES, logoSvg } from "./brand.js";

/** Everything interpolated into the templates goes through this. Flyer copy
 *  can come from a model or from a speaker's own website — neither is trusted
 *  markup. */
export const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** "2026-09-12" -> "Saturday, September 12" (date-only; no timezone shift). */
export const longDate = (iso, { weekday = true } = {}) => {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    ...(weekday ? { weekday: "long" } : {}),
    month: "long", day: "numeric",
  });
};

/** Enforce RULES rather than trusting callers. Over-long copy silently
 *  breaks the layout, so we clip and flag instead. */
const clip = (s, max) => {
  const t = String(s ?? "").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
};

const shell = ({ w, h, title, body, extraCss = "" }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  @page { size: ${w}px ${h}px; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${w}px; height: ${h}px; }
  body {
    font-family: ${FONTS.sans};
    color: ${COLORS.ink};
    background: ${COLORS.cream};
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }
  .flyer { width: ${w}px; height: ${h}px; display: flex; flex-direction: column; position: relative; }
  .display { font-family: ${FONTS.display}; }
  .crest { display: flex; align-items: center; gap: 18px; }
  .crest svg { display: block; }
  .crest .wm { line-height: 1.05; }
  .crest .wm b { font-family: ${FONTS.display}; font-size: 40px; font-weight: 700; color: ${COLORS.white}; letter-spacing: .3px; display: block; }
  .crest .wm span { font-size: 13px; letter-spacing: 3.4px; text-transform: uppercase; color: ${COLORS.goldSoft}; font-weight: 600; display: block; margin-top: 5px; }
  .hero {
    background:
      radial-gradient(900px 420px at 82% -12%, rgba(201,154,63,.30), transparent 62%),
      linear-gradient(160deg, ${COLORS.navy} 0%, ${COLORS.navyDeep} 100%);
    color: ${COLORS.white};
    padding: 62px 68px 56px;
  }
  .eyebrow {
    display: inline-block; font-size: 15px; letter-spacing: 4.6px; text-transform: uppercase;
    color: ${COLORS.goldSoft}; font-weight: 700;
  }
  .rule { height: 3px; width: 92px; background: ${COLORS.gold}; border-radius: 2px; }
  .body { flex: 1; padding: 54px 68px 0; display: flex; flex-direction: column; }
  .meta { display: flex; flex-direction: column; gap: 22px; }
  .row { display: flex; align-items: baseline; gap: 20px; }
  .row .k {
    font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: ${COLORS.gold};
    font-weight: 700; width: 168px; flex: none;
  }
  .row .v { font-size: 30px; color: ${COLORS.ink}; font-weight: 600; line-height: 1.32; }
  .row .v small { display: block; font-size: 21px; font-weight: 500; color: ${COLORS.muted}; margin-top: 4px; }
  .badge {
    display: inline-flex; align-items: baseline; gap: 14px;
    background: ${COLORS.cream2}; border: 2px solid ${COLORS.line};
    border-radius: 18px; padding: 20px 28px;
  }
  .badge .k { font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: ${COLORS.gold}; font-weight: 700; }
  .badge .v { font-family: ${FONTS.display}; font-size: 34px; font-weight: 700; color: ${COLORS.navy}; }
  .foot {
    margin-top: auto; padding: 34px 68px; background: ${COLORS.navy}; color: ${COLORS.cream};
    display: flex; align-items: center; justify-content: space-between; gap: 24px;
    margin-left: -68px; margin-right: -68px;
  }
  .foot .site { font-family: ${FONTS.display}; font-size: 27px; font-weight: 700; color: ${COLORS.goldSoft}; letter-spacing: .4px; }
  .foot .tag { font-size: 16px; letter-spacing: 2.2px; text-transform: uppercase; color: rgba(250,246,238,.72); font-weight: 600; }
${extraCss}
</style></head>
<body><div class="flyer">${body}</div></body></html>`;

const footer = () => `
  <div class="foot">
    <span class="site">${esc(BRAND.site)}</span>
    <span class="tag">${esc(BRAND.tagline)}</span>
  </div>`;

const heroHead = (eyebrow) => `
  <div class="crest">
    ${logoSvg({ size: 88, plate: false })}
    <div class="wm"><b>${esc(BRAND.wordmark)}</b><span>${esc(BRAND.kicker)}</span></div>
  </div>
  ${eyebrow ? `<div style="margin-top:44px"><span class="eyebrow">${esc(eyebrow)}</span></div>` : ""}`;

const detailRows = (rows) => rows
  .filter((r) => r && r.v)
  .map((r) => `<div class="row"><span class="k">${esc(r.k)}</span><span class="v">${esc(r.v)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span></div>`)
  .join("\n");

// ------------------------------------------------------------------
// HOLIDAY — the High-Holiday / festival flyer.
// ------------------------------------------------------------------
export function holidayFlyer(ev = {}, { canvas = "portrait" } = {}) {
  const { w, h } = CANVAS[canvas] || CANVAS.portrait;
  const headline = clip(ev.headline || ev.title || "", RULES.maxHeadlineChars);
  const subhead = clip(ev.subhead || ev.hebrew_date || "", RULES.maxSubheadChars);
  const body = `
  <div class="hero">
    ${heroHead("You are invited")}
    <h1 class="display" style="font-size:96px;line-height:1.02;font-weight:700;margin-top:26px;letter-spacing:-1px">${esc(headline)}</h1>
    ${subhead ? `<p style="font-size:29px;color:${COLORS.goldSoft};margin-top:18px;font-weight:500">${esc(subhead)}</p>` : ""}
    <div class="rule" style="margin-top:34px"></div>
    <p style="font-size:32px;margin-top:26px;font-weight:600">${esc(longDate(ev.event_date))}</p>
  </div>
  <div class="body">
    <div class="meta">
      ${detailRows([
        { k: "Time",     v: ev.start_time, sub: ev.end_time ? `until ${ev.end_time}` : "" },
        { k: "Where",    v: ev.location,   sub: ev.address || "" },
        { k: "Who",      v: ev.audience },
        { k: "RSVP",     v: ev.rsvp_url },
      ])}
    </div>
    ${ev.description ? `<p style="font-size:25px;line-height:1.62;color:${COLORS.muted};margin-top:36px;max-width:840px">${esc(ev.description)}</p>` : ""}
    ${ev.candle_lighting ? `<div style="margin-top:40px"><div class="badge"><span class="k">Candle lighting</span><span class="v">${esc(ev.candle_lighting)}</span></div></div>` : ""}
    <div style="margin-top:auto"></div>
    ${footer()}
  </div>`;
  return shell({ w, h, title: `${BRAND.shortName} — ${headline}`, body });
}

// ------------------------------------------------------------------
// SPEAKER — every guest gets the identical frame. This is the template
// Mendy specifically asked to be consistent, so the headshot plate, the
// name scale and the "Guest Speaker" eyebrow are not parameterised.
// ------------------------------------------------------------------
export function speakerFlyer(ev = {}, speaker = {}, { canvas = "portrait" } = {}) {
  const { w, h } = CANVAS[canvas] || CANVAS.portrait;
  const topic = clip(ev.headline || speaker.topic || ev.title || "", 62);
  const extraCss = `
  .portrait {
    width: 268px; height: 268px; border-radius: 50%; flex: none; overflow: hidden;
    background: ${COLORS.cream2}; border: 6px solid ${COLORS.gold};
    display: flex; align-items: center; justify-content: center;
  }
  .portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }`;
  const headshot = speaker.headshot_url
    ? `<img src="${esc(speaker.headshot_url)}" alt="${esc(speaker.name)}">`
    : logoSvg({ size: 150, plate: false });
  const body = `
  <div class="hero" style="padding-bottom:48px">
    ${heroHead("Guest Speaker")}
    <div style="display:flex;align-items:center;gap:40px;margin-top:40px">
      <div class="portrait">${headshot}</div>
      <div style="min-width:0">
        <h1 class="display" style="font-size:70px;line-height:1.06;font-weight:700;letter-spacing:-.5px">${esc(speaker.name || "")}</h1>
        ${speaker.title || speaker.org ? `<p style="font-size:26px;color:${COLORS.goldSoft};margin-top:14px;font-weight:600">${esc([speaker.title, speaker.org].filter(Boolean).join(" · "))}</p>` : ""}
      </div>
    </div>
    <div class="rule" style="margin-top:38px"></div>
    <p class="display" style="font-size:44px;line-height:1.2;margin-top:26px;font-weight:700">${esc(topic)}</p>
  </div>
  <div class="body">
    ${speaker.short_bio ? `<p style="font-size:24px;line-height:1.66;color:${COLORS.muted};max-width:860px">${esc(speaker.short_bio)}</p>` : ""}
    <div class="meta" style="margin-top:${speaker.short_bio ? 40 : 0}px">
      ${detailRows([
        { k: "When",  v: longDate(ev.event_date), sub: ev.start_time || "" },
        { k: "Where", v: ev.location, sub: ev.address || "" },
        { k: "Who",   v: ev.audience },
        { k: "RSVP",  v: ev.rsvp_url },
      ])}
    </div>
    <div style="margin-top:auto"></div>
    ${footer()}
  </div>`;
  return shell({ w, h, title: `${BRAND.shortName} — ${speaker.name || "Guest Speaker"}`, body, extraCss });
}

// ------------------------------------------------------------------
// WEEKLY — the week-at-a-glance. Cream-led rather than navy-led so it
// reads as the routine rhythm, not an event.
// ------------------------------------------------------------------
export function weeklyFlyer(week = {}, { canvas = "portrait" } = {}) {
  const { w, h } = CANVAS[canvas] || CANVAS.portrait;
  const items = Array.isArray(week.items) ? week.items : [];
  const extraCss = `
  .item { display: flex; gap: 24px; padding: 26px 0; border-bottom: 2px solid ${COLORS.line}; }
  .item:last-child { border-bottom: 0; }
  .item .day {
    width: 156px; flex: none; font-size: 15px; letter-spacing: 3px; text-transform: uppercase;
    color: ${COLORS.gold}; font-weight: 700; padding-top: 8px;
  }
  .item .what { font-family: ${FONTS.display}; font-size: 33px; font-weight: 700; color: ${COLORS.navy}; line-height: 1.25; }
  .item .when { font-size: 21px; color: ${COLORS.muted}; margin-top: 6px; }`;
  const body = `
  <div class="hero" style="padding:52px 68px 46px">
    ${heroHead("")}
    <h1 class="display" style="font-size:74px;line-height:1.04;font-weight:700;margin-top:34px">${esc(week.headline || "This Week at SoFa")}</h1>
    <p style="font-size:26px;color:${COLORS.goldSoft};margin-top:16px;font-weight:500">${esc(week.subhead || "")}</p>
  </div>
  <div class="body" style="padding-top:34px">
    <div>
      ${items.length ? items.map((it) => `
      <div class="item">
        <div class="day">${esc(it.day || longDate(it.event_date, { weekday: true }).split(",")[0])}</div>
        <div>
          <div class="what">${esc(it.title || "")}</div>
          <div class="when">${esc([it.start_time, it.location].filter(Boolean).join(" · "))}</div>
        </div>
      </div>`).join("") : `<p style="font-size:24px;color:${COLORS.muted}">No programs scheduled yet this week.</p>`}
    </div>
    ${week.candle_lighting ? `<div style="margin-top:36px"><div class="badge"><span class="k">Shabbos candles</span><span class="v">${esc(week.candle_lighting)}</span></div></div>` : ""}
    <div style="margin-top:auto"></div>
    ${footer()}
  </div>`;
  return shell({ w, h, title: `${BRAND.shortName} — ${week.headline || "This Week"}`, body, extraCss });
}

export const TEMPLATES = { holiday: holidayFlyer, speaker: speakerFlyer, weekly: weeklyFlyer };

/** Single entry point used by the console and the server. */
export function renderFlyer(template, payload, opts = {}) {
  if (!RULES.allowedTemplates.includes(template)) throw new Error(`unknown template: ${template}`);
  if (template === "speaker") return speakerFlyer(payload.event || {}, payload.speaker || {}, opts);
  if (template === "weekly") return weeklyFlyer(payload.week || payload, opts);
  return holidayFlyer(payload.event || payload, opts);
}
