// What an associate is allowed to read — declared as data, not written as code.
//
// The old Associates tab handed the model whatever the four dropdowns happened
// to point at. That works when a human is sitting there choosing; it is useless
// on a schedule, because nobody is there to choose. So each associate declares
// its own inputs as a spec on its row, and the same spec drives both the
// browser console and the nightly tick.
//
// Everything here is PURE: rows in, shaped rows out. No Supabase, no fetch.
// The caller does the IO — `tablesFor()` tells it which tables to load — so
// the cron and the console can never disagree about what the associate saw.

/** Supported comparisons. Kept small on purpose: a spec you cannot read at a
 *  glance is a spec nobody will maintain. String dates compare correctly as
 *  long as they are ISO, which is the convention everywhere in this schema. */
const OPS = {
  eq:        (v, t) => String(v ?? "") === String(t),
  neq:       (v, t) => String(v ?? "") !== String(t),
  in:        (v, t) => Array.isArray(t) && t.map(String).includes(String(v ?? "")),
  nin:       (v, t) => Array.isArray(t) && !t.map(String).includes(String(v ?? "")),
  gt:        (v, t) => Number(v) > Number(t),
  gte:       (v, t) => Number(v) >= Number(t),
  lt:        (v, t) => Number(v) < Number(t),
  lte:       (v, t) => Number(v) <= Number(t),
  before:    (v, t) => !!v && String(v) < String(t),
  after:     (v, t) => !!v && String(v) > String(t),
  contains:  (v, t) => String(v ?? "").toLowerCase().includes(String(t).toLowerCase()),
  empty:     (v) => v == null || String(v).trim() === "" || (Array.isArray(v) && v.length === 0),
  not_empty: (v) => !(v == null || String(v).trim() === "" || (Array.isArray(v) && v.length === 0)),
  is_true:   (v) => v === true,
  is_false:  (v) => v !== true,
};

/** "today" and "today-14" resolve against the run date so a spec can say
 *  "invoices due before today" without being rewritten every morning. */
export const resolveToken = (t, today) => {
  if (typeof t !== "string") return t;
  const m = /^today(?:\s*([+-])\s*(\d+))?$/.exec(t.trim());
  if (!m) return t;
  if (!m[1]) return today;
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + (m[1] === "-" ? -1 : 1) * Number(m[2]));
  return d.toISOString().slice(0, 10);
};

const matches = (row, where, today) =>
  (where || []).every(([field, op, target]) => {
    const fn = OPS[op];
    if (!fn) return true;                       // unknown op never silently excludes rows
    return fn(row?.[field], resolveToken(target, today));
  });

const pick = (row, fields) => {
  if (!Array.isArray(fields) || fields.length === 0) return row;
  const out = {};
  for (const f of fields) if (row?.[f] !== undefined) out[f] = row[f];
  return out;
};

/** Which tables the caller has to load for this spec. */
export const tablesFor = (inputs) => {
  const named = (inputs?.tables || []).map((t) => t.table).filter(Boolean);
  return [...new Set(named)];
};

/**
 * Apply one table spec to its rows.
 * A `limit` is always applied — an associate that reads 400 contacts into a
 * prompt is an associate that reads none of them well.
 */
export const applySpec = (rows, spec, today) => {
  let out = (rows || []).filter((r) => matches(r, spec.where, today));
  if (spec.order?.field) {
    const { field, dir } = spec.order;
    const sign = dir === "desc" ? -1 : 1;
    out = [...out].sort((a, b) => {
      const av = a?.[field], bv = b?.[field];
      const bothNum = !isNaN(Number(av)) && !isNaN(Number(bv)) && av !== "" && bv !== "";
      if (bothNum) return sign * (Number(av) - Number(bv));
      return sign * String(av ?? "").localeCompare(String(bv ?? ""));
    });
  }
  return out.slice(0, spec.limit ?? 25).map((r) => pick(r, spec.fields));
};

/** The records a manual run was scoped to, in the app's own association shape. */
export const selectedAssociations = ({ contactId, companyId, dealId, projectId } = {}) => [
  contactId && { type: "contact", id: Number(contactId) || contactId },
  companyId && { type: "company", id: Number(companyId) || companyId },
  dealId && { type: "deal", id: Number(dealId) || dealId },
  projectId && { type: "project", id: Number(projectId) || projectId },
].filter(Boolean);

const find = (rows, id) => (id ? (rows || []).find((x) => String(x.id) === String(id)) || null : null);

/**
 * Everything the associate reads, in one object.
 *
 * @param sources  { deals:[...], contacts:[...] } — raw rows, already loaded
 * @param inputs   the associate's `inputs` jsonb
 * @param link     optional { contactId, companyId, dealId, projectId } for a scoped run
 * @returns        { scope, tables, documents, memories, tasks, digest }
 */
export function buildContext(sources = {}, inputs = {}, link = {}, today = new Date().toISOString().slice(0, 10)) {
  const tables = {};
  for (const spec of inputs?.tables || []) {
    if (!spec?.table) continue;
    tables[spec.table] = applySpec(sources[spec.table], spec, today);
  }

  // The scoped half: when a run is pointed at a specific record, pull that
  // record plus the documents, memories and tasks already hanging off it.
  // This is the behaviour the old console had, kept intact.
  const scope = { contact: null, company: null, deal: null, project: null };
  let documents = [], memories = [], tasks = [];
  const associations = selectedAssociations(link);

  if (inputs?.linked !== false && associations.length) {
    scope.contact = find(sources.contacts, link.contactId);
    scope.company = find(sources.companies, link.companyId);
    scope.deal    = find(sources.deals,    link.dealId);
    scope.project = find(sources.projects, link.projectId);

    const hits = (r) =>
      (link.contactId && String(r.contactId) === String(link.contactId)) ||
      (link.companyId && String(r.companyId) === String(link.companyId)) ||
      (link.dealId    && String(r.dealId)    === String(link.dealId)) ||
      (link.projectId && String(r.projectId) === String(link.projectId));

    documents = (sources.documents || [])
      .filter((d) => (d.associations || []).some((a) => associations.some((s) => s.type === a.type && String(s.id) === String(a.id))))
      .slice(0, 12)
      .map((d) => ({ id: d.id, title: d.title || d.file_name, description: d.description, kind: d.kind, url: d.url }));
    memories = (sources.ai_memories || []).filter(hits).slice(0, 12)
      .map((m) => ({ id: m.id, subject: m.subject, memory_type: m.memory_type, summary: m.memory_summary }));
    tasks = (sources.tasks || []).filter(hits).slice(0, 16)
      .map((t) => ({ id: t.id, title: t.title, status: t.status, due: t.due, priority: t.priority }));
  }

  // The digest is what gets stored on the run, so a month later you can see
  // whether an associate produced a thin artifact because it reasoned badly
  // or because it was handed nothing to reason about.
  const digest = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length]));
  if (documents.length) digest.documents = documents.length;
  if (memories.length)  digest.memories  = memories.length;
  if (tasks.length)     digest.tasks     = tasks.length;
  const scoped = Object.values(scope).filter(Boolean).length;
  if (scoped) digest.scope = scoped;

  return { scope, tables, documents, memories, tasks, digest };
}

/** Total rows handed to the model. Zero means the run should not happen. */
export const contextSize = (ctx) =>
  Object.values(ctx?.tables || {}).reduce((n, rows) => n + rows.length, 0) +
  (ctx?.documents?.length || 0) + (ctx?.memories?.length || 0) + (ctx?.tasks?.length || 0) +
  Object.values(ctx?.scope || {}).filter(Boolean).length;
