// SoFa JCC brand — the single locked source of truth for anything the
// associate draws. Values are lifted verbatim from the live site's
// assets/styles.css (aventary repo, sofajcc/) so a flyer and sofajcc.org
// can never drift apart. Change them HERE, nowhere else.

export const BRAND = {
  name: "SoFa Jewish Community Center",
  shortName: "SoFa JCC",
  wordmark: "SoFa",
  kicker: "Chabad Jewish Community Center",
  tagline: "Pray  ·  Celebrate  ·  Love  ·  Friendship",
  site: "www.sofajcc.org",
  url: "https://www.sofajcc.org",
  region: "South Florida",
};

// Palette — same hexes as sofajcc/assets/styles.css :root
export const COLORS = {
  navy: "#17335c",
  navyDeep: "#0f2542",
  gold: "#c99a3f",
  goldSoft: "#e6cd93",
  cream: "#faf6ee",
  cream2: "#f3ecdd",
  ink: "#23272e",
  muted: "#5c6470",
  line: "#e7ddc8",
  white: "#ffffff",
};

// Type — the site pairs a serif display with a system sans for everything
// else. Flyers are rendered headless, so both stacks stay web-safe.
export const FONTS = {
  display: `"Georgia", "Times New Roman", serif`,
  sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
};

// The sofa mark, inline. Identical geometry to assets/favicon.svg.
// `size` scales it; `plate` draws the rounded navy tile behind it.
export const logoSvg = ({ size = 96, plate = true } = {}) => `
<svg viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${BRAND.shortName}">
  ${plate ? `<rect width="64" height="64" rx="14" fill="${COLORS.navy}"/>` : ""}
  <g fill="none" stroke="${COLORS.goldSoft}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 34v-4a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v4"/>
    <path d="M13 34a3 3 0 0 1 3 3v6h32v-6a3 3 0 0 1 6 0v9a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-9a3 3 0 0 1 3-3z" fill="${COLORS.gold}" stroke="${COLORS.gold}"/>
    <path d="M20 45v3M44 45v3" stroke="${COLORS.navyDeep}"/>
  </g>
</svg>`;

// Flyer canvas sizes. Every template renders at one of these, so the
// archive is dimensionally consistent and PNGs drop straight into
// WhatsApp / print without re-cropping.
export const CANVAS = {
  portrait: { w: 1080, h: 1350, label: "Portrait 4:5 — WhatsApp / Instagram feed" },
  story:    { w: 1080, h: 1920, label: "Story 9:16 — status / reels" },
  print:    { w: 1275, h: 1650, label: "Letter @150dpi — print / bulletin board" },
};

// Locked rules the associate is not allowed to improvise around. These are
// asserted in templates.js, not just documented.
export const RULES = {
  logoAlwaysPresent: true,
  maxHeadlineChars: 34,     // beyond this the display type stops fitting one line
  maxSubheadChars: 78,
  requireSiteFooter: true,
  allowedTemplates: ["weekly", "holiday", "speaker"],
};
