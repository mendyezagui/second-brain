# SoFa JCC — Brand Contract

The associate owns the brand. This is the contract it enforces.

Every value below lives in exactly one place: **`src/lib/sofa/brand.js`**.
Change it there and every flyer changes. Do not hardcode a hex anywhere else.

The palette is **sampled directly from the shul's own logo artwork**
(`public/sofa-jcc/brand/logo-lockup-original.png`), not eyeballed. The layout
language is taken from the shul's real Friday-night speaker flyer.

## Identity

| | |
|---|---|
| Name | **Beis Chacham Yitzchak** · בית חכם יצחק |
| Known as | The SoFa Jewish Community Center |
| City | Los Angeles |
| On every flyer | ב"ה top right, logo lockup top left |

## Palette

Sampled from the logo. Do not eyeball replacements.

| token | hex | used for |
|---|---|---|
| `navy` | `#1c374a` | header rule, footer bar, body copy |
| `navyDeep` | `#16293d` | headings, the big display name |
| `navySoft` | `#293c4b` | the seated figures; secondary text |
| `gold` | `#b79549` | eyebrows, dividers, labels, the portrait frame |
| `goldLight` | `#dcb96d` | the dancer's disc; accents on navy |
| `olive` | `#8f8f5a` | the sofa's back panel; rare accent |
| `maroon` | `#8b2635` | section eyebrows, the emphasised organisation |
| `cream` | `#f5edda` | the parchment ground |
| `cream2` | `#efe4cc` | detail strip, placeholder plate |
| `line` | `#ddd0b4` | hairlines on cream |

## Type

- **Display** — `Georgia, "Times New Roman", serif`. Holiday names, speaker
  names, program titles, the footer URL.
- **Sans** — the system stack. Everything else.

Both are web-safe, because flyers render headless and a webfont that fails to
load is a flyer that ships in Times New Roman by accident.

## Logo files

| file | what |
|---|---|
| `logo-lockup.png` | Sofa + "THE SOFA / JEWISH COMMUNITY CENTER". Transparent, trimmed. **The header mark.** |
| `logo-mark.png` | Sofa only, no wordmark. Transparent. Used for the no-headshot placeholder. |
| `mark-dancer.png` | Dancing chassid on a gold disc. Secondary mark. |
| `*-original.png` | The untouched source artwork. Never delete these. |
| `sefarim-label-template.docx` | The shul's original Word label template, kept as the reference. |

The lockup appears on **every** flyer (`RULES.logoAlwaysPresent`), and ב"ה sits
top-right on every one (`RULES.bhAlwaysPresent`).

## Canvas sizes

| name | px | for |
|---|---|---|
| `portrait` | 1080 × 1350 | WhatsApp / Instagram feed — **the default** |
| `story` | 1080 × 1920 | status / reels |
| `print` | 1275 × 1650 | Letter @150dpi, bulletin board |

Every template renders at one of these, so the archive is dimensionally
consistent and a PNG drops straight into a group chat without re-cropping.

## The house layout

Held constant across every template:

1. Parchment ground — **never** a dark hero.
2. ב"ה top right, logo lockup top left, shul name in serif with the Hebrew name
   beneath it, then a 5px navy rule.
3. Everything centred.
4. Maroon uppercase eyebrows, gold uppercase labels.
5. Serif display voice; the Hebrew name set directly under the English.
6. A three-column detail strip separated by hairlines. Empty columns are
   dropped, so a flyer with two facts still reads as balanced.
7. A navy footer bar carrying the greeting (שבת שלום · GOOD SHABBOS).

## The four templates

**`speaker`** — the one that must be identical every time. Maroon occasion +
parsha eyebrows, an italic lede, a gold-framed 330×400 portrait plate, the
honorific in gold, the name at 92px with the Hebrew name under it, a gold
divider, then role with the **organisation emphasised in maroon**, up to three
credential lines, and the strip: DATE / CANDLE LIGHTING / WORDS OF INSPIRATION.
No headshot yet → the plate goes dashed with the sofa mark at low opacity: an
intentional placeholder, not a broken image.

**`holiday`** — the same frame with the festival name where the speaker's name
goes, and its Hebrew name beneath.

**`weekly`** — a day-ruled list where the display name would be. Strip carries
candle lighting / parsha / havdalah.

**`label`** — the 4-up sefarim dedication sheet, reproducing the shul's Word
template. The one template on a **white** ground, because labels print on
white stock and cream would print as a muddy box on every sticker.

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
