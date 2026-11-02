// Module entitlements. Core modules are always on; optional modules are toggled
// per tenant via tenants.modules (jsonb). Loaded once at login into a singleton
// so nav + feature gates can read it without threading props everywhere.

// nav id (or feature key) -> module key. Anything not listed here is CORE (always on):
// dashboard, brief, tasks, crm, companies, projects, goals, strategies, ai_memories, documents.
export const NAV_MODULE = {
  deals: "financials", invoices: "financials", payments: "financials", _fin: "financials",
  associates: "associates",
  marketing: "marketing", social: "marketing",
  cadences: "cadences",
  loops: "loops",
  _ai_controls: "controls", voitra_gate: "controls", rc_controls: "controls", rambam_controls: "controls",
  vantaca_controls: "controls", cometchat: "controls", cometchat_dev: "controls",
  spectari: "spectari",
  multi_llm: "ai_playground",
  admin: "admin",
};

// The full set of optional modules (used for the "owner / all-on" default).
export const OPTIONAL_MODULES = [
  "financials", "associates", "marketing", "cadences", "loops", "controls", "admin", "spectari", "ai_playground",
];

// Runtime singleton: null = owner / no tenant record => everything on.
let _mods = null;
export const setModules = (m) => { _mods = m || null; };
export const getModules = () => _mods;

// Is an optional module enabled for the current tenant?
export const featureOn = (key) => (_mods === null ? true : _mods[key] === true);

// Should a nav item show? (core items have no module => always on)
export const navEnabled = (id) => {
  const m = NAV_MODULE[id];
  return !m || featureOn(m);
};
