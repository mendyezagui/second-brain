# SoFa JCC — Brand Contract

The associate owns the brand. This is the contract it enforces.

Every value below lives in exactly one place: **`src/lib/sofa/brand.js`**.
Change it there and every flyer changes. Do not hardcode a hex anywhere else.

These values are lifted verbatim from the live site's
`assets/styles.css` (the `sofajcc/` static site), so a flyer and sofajcc.org
can never drift apart.

## Palette

| token | hex | used for |
|---|---|---|
| `navy` | `#17335c` | hero ground, footer, headings on cream |
| `navyDeep` | `#0f2542` | hero gradient end |
| `gold` | `#c99a3f` | rules, labels, the sofa cushion, badge numerals |
| `goldSoft` | `#e6cd93` | eyebrow text and subheads on navy |
| `cream` | `#faf6ee` | body ground |
| `cream2` | `#f3ecdd` | badge fill, headshot plate |
| `ink` | `#23272e` | body text |
| `muted` | `#5c6470` | secondary text |
| `line` | `#e7ddc8` | dividers, badge border |

## Type

- **Display** — `Georgia, "Times New Roman", serif`. Holiday names, speaker
  names, program titles, the footer URL.
- **Sans** — the system stack. Everything else.

Both are web-safe, because flyers render headless and a webfont that fails to
load is a flyer that ships in Times New Roman by accident.

## The crest

The sofa mark, inline SVG, identical geometry to `assets/favicon.svg`.
`logoSvg({ size, plate })` — `plate: true` draws the rounded navy tile,
`plate: false` gives the bare mark for use on navy.

**It appears on every flyer.** `RULES.logoAlwaysPresent`.

## Canvas sizes

| name | px | for |
|---|---|---|
| `portrait` | 1080 × 1350 | WhatsApp / Instagram feed — **the default** |
| `story` | 1080 × 1920 | status / reels |
| `print` | 1275 × 1650 | Letter @150dpi, bulletin board |

Every template renders at one of these, so the archive is dimensionally
consistent and a PNG drops straight into a group chat without re-cropping.

## The three templates

**`holiday`** — navy hero, holiday name at 96px display, Hebrew date as
subhead, gold rule, long-form date. Cream body with a labelled detail grid
(TIME / WHERE / WHO / RSVP), the description, and a candle-lighting badge.

**`speaker`** — navy hero carrying a 268px circular headshot in a gold ring
beside the name at 70px. Title · org in gold-soft. Gold rule, then the talk
title at 44px display. Cream body: bio, then the same detail grid. No headshot
→ the crest fills the circle.

**`weekly`** — cream-led rather than navy-led, so it reads as the routine
rhythm and not an event. Compact navy hero, then a day-ruled list. Shabbos
candle badge at the foot.

All three close with the same navy footer: `www.sofajcc.org` in display gold
on the left, `PRAY · CELEBRATE · LOVE · FRIENDSHIP` on the right.

## Why the layout is code, not a prompt

Consistency is **structural**. The layout, palette, type scale and crest
position are fixed in `templates.js`; a model only ever supplies words, and
those words land in slots. Two flyers six months apart are the same object with
different text.

Ask a model to "design a flyer in our brand" every week and you get eleven
different flyers. This produces one flyer with eleven sets of words.

## Enforced limits

`RULES` in `brand.js`, asserted in `templates.js` — over-long copy is clipped
with an ellipsis rather than allowed to break the layout silently.

| rule | value |
|---|---|
| `maxHeadlineChars` | 34 |
| `maxSubheadChars` | 78 |
| `logoAlwaysPresent` | true |
| `requireSiteFooter` | true |
| `allowedTemplates` | holiday, speaker, weekly |

## Escaping

Everything interpolated into a template goes through `esc()`. Flyer copy can
come from a model or from a speaker's own website; neither is trusted markup.
