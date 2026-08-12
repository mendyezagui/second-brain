// useObject — CRUD for any object, derived from its metadata.
// Replaces the per-view blank*/save/del boilerplate.
import { nextId } from "../lib/utils";

export const blankRecord = (object) => {
  const out = {};
  for (const [key, f] of Object.entries(object.fields)) {
    out[key] = typeof f.default === "function" ? f.default() : (f.default ?? defaultFor(f));
  }
  return out;
};

const defaultFor = (f) => {
  switch (f.type) {
    case "currency": case "number": case "percent": return 0;
    case "score": return 50;
    case "checkbox": return false;
    case "tags": return [];
    case "picklist": return f.options?.[0] ?? "";
    default: return "";
  }
};

export const useObject = (object, db, setDB) => {
  const collection = object.collection;
  const rows = db[collection] || [];

  const create = (data) =>
    setDB((d) => ({ ...d, [collection]: [...(d[collection] || []), { ...data, id: nextId(d[collection] || []) }] }));

  const update = (rec) =>
    setDB((d) => ({ ...d, [collection]: (d[collection] || []).map((r) => (r.id === rec.id ? rec : r)) }));

  const remove = (id) =>
    setDB((d) => ({ ...d, [collection]: (d[collection] || []).filter((r) => r.id !== id) }));

  return { rows, create, update, remove, blank: () => blankRecord(object) };
};
