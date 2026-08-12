// Field-type registry — the Salesforce "field component" layer.
// Each type defines how a field renders in VIEW mode and EDIT mode.
// Change a type here once and every field of that type updates everywhere.
// A single field can override via its `render` key (see FieldModule).
import { Inp, Sel, Tex, Tag, ScoreBadge, SearchSelect, EntityLink } from "../components/ui";
import { fmt } from "../lib/utils";

const dash = (v) => (v === null || v === undefined || v === "" ? "—" : v);
const href = (u) => (String(u).startsWith("http") ? u : `https://${u}`);

// lookup helpers: resolve a foreign-key value to the referenced object's row label
const refRow = (db, ref, val) => {
  const col = REF_COLLECTION[ref];
  return col ? (db[col] || []).find((r) => String(r.id) === String(val)) : null;
};
const REF_COLLECTION = {
  contact: "contacts", company: "companies", deal: "deals", project: "projects",
  task: "tasks", campaign: "campaigns", invoice: "invoices", payment: "payments",
  strategy: "strategies", goal: "goals",
};

export const FIELD_TYPES = {
  text: {
    view: ({ value }) => <span>{dash(value)}</span>,
    edit: ({ value, onChange, field }) => <Inp value={value || ""} onChange={onChange} placeholder={field.placeholder || ""} />,
  },
  textarea: {
    view: ({ value }) => <span style={{ whiteSpace: "pre-wrap" }}>{dash(value)}</span>,
    edit: ({ value, onChange, field }) => <Tex value={value || ""} onChange={onChange} placeholder={field.placeholder || ""} />,
  },
  email: {
    view: ({ value }) => (value ? <a href={`mailto:${value}`} style={{ color: "var(--blue)" }}>{value}</a> : <span>—</span>),
    edit: ({ value, onChange }) => <Inp value={value || ""} onChange={onChange} placeholder="name@example.com" />,
  },
  url: {
    view: ({ value }) => (value ? <a href={href(value)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>{value}</a> : <span>—</span>),
    edit: ({ value, onChange, field }) => <Inp value={value || ""} onChange={onChange} placeholder={field.placeholder || "https://…"} />,
  },
  picklist: {
    view: ({ value }) => (value ? <Tag label={String(value)} /> : <span>—</span>),
    edit: ({ value, onChange, field }) => <Sel value={value ?? ""} onChange={onChange} options={field.options || []} />,
  },
  currency: {
    view: ({ value }) => <span style={{ fontFamily: "var(--font-d)", fontWeight: 700 }}>{fmt(Number(value) || 0)}</span>,
    edit: ({ value, onChange }) => <Inp value={value ?? 0} onChange={(v) => onChange(Number(v) || 0)} />,
  },
  number: {
    view: ({ value }) => <span>{dash(value)}</span>,
    edit: ({ value, onChange }) => <Inp value={value ?? 0} onChange={(v) => onChange(Number(v) || 0)} />,
  },
  percent: {
    view: ({ value }) => <span>{value == null || value === "" ? "—" : `${value}%`}</span>,
    edit: ({ value, onChange }) => <Inp value={value ?? 0} onChange={(v) => onChange(Number(v) || 0)} />,
  },
  score: {
    view: ({ value }) => (value == null ? <span>—</span> : <ScoreBadge score={value} />),
    edit: ({ value, onChange }) => <Inp value={value ?? 50} onChange={(v) => onChange(Number(v) || 0)} />,
  },
  date: {
    view: ({ value }) => <span>{dash(value)}</span>,
    edit: ({ value, onChange }) => <Inp value={value || ""} onChange={onChange} placeholder="YYYY-MM-DD" />,
  },
  tags: {
    view: ({ value }) => (Array.isArray(value) && value.length ? (
      <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>{value.map((t) => <Tag key={t} label={t} />)}</span>
    ) : <span>—</span>),
    edit: ({ value, onChange }) => (
      <Inp value={Array.isArray(value) ? value.join(", ") : value || ""} onChange={(v) => onChange(v.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="comma, separated" />
    ),
  },
  checkbox: {
    view: ({ value }) => <span>{value ? "✓ Yes" : "—"}</span>,
    edit: ({ value, onChange }) => (
      <button type="button" className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={() => onChange(!value)}>{value ? "✓ Done" : "Mark done"}</button>
    ),
  },
  lookup: {
    view: ({ value, field, db, navigate }) => {
      if (!value) return <span>—</span>;
      const row = refRow(db, field.ref, value);
      return navigate ? <EntityLink type={field.ref} id={value} navigate={navigate}>{row ? (row.name || row.title || row.number || `#${value}`) : `#${value}`}</EntityLink> : <span>{row ? (row.name || row.title) : `#${value}`}</span>;
    },
    edit: ({ value, onChange, field, db }) => {
      const col = REF_COLLECTION[field.ref] || "";
      const opts = (db[col] || []).map((r) => ({ value: String(r.id), label: r.name || r.title || r.number || `#${r.id}` }));
      return <SearchSelect value={value != null ? String(value) : ""} onChange={onChange} options={opts} placeholder={`Search ${field.ref}…`} />;
    },
  },
};

// per-field render overrides (field.render = "<name>")
export const FIELD_RENDERS = {
  linkedin: {
    view: ({ value }) => (value ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "#0A66C2" }}>LinkedIn ↗</a> : <span>—</span>),
    edit: FIELD_TYPES.url.edit,
  },
};

export const resolveField = (field) => {
  if (field.render && FIELD_RENDERS[field.render]) return { ...FIELD_TYPES[field.type], ...FIELD_RENDERS[field.render] };
  return FIELD_TYPES[field.type] || FIELD_TYPES.text;
};
