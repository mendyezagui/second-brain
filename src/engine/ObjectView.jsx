// ObjectView — one generic component that renders any object's list + record page
// entirely from its metadata. Replaces the ~12 bespoke <XView> components.
import { useEffect, useState } from "react";
import { Plus, Save, Trash2, ChevronRight } from "lucide-react";
import {
  ActivityTimeline, AssociatedDocumentsPanel, ConfirmDelete, Drawer,
  EntityLink, RowActions, Tag, useListControls,
} from "../components/ui";
import { objectFor } from "../objects";
import { useObject } from "./useObject";
import { FieldModule, FieldSection } from "./FieldModule";
import { RelatedLists } from "./RelatedList";

export const ObjectView = ({ object: objectProp, db, setDB, navigate, focus }) => {
  const object = typeof objectProp === "string" ? objectFor(objectProp) : objectProp;
  const { rows, create, update, remove, blank } = useObject(object, db, setDB);

  const [sel, setSel] = useState(null);
  const [edit, setEdit] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { setSel(focus?.type === object.name && focus.id ? focus.id : null); }, [focus, object.name]);
  useEffect(() => {
    const r = sel != null ? rows.find((x) => String(x.id) === String(sel)) : null;
    setEdit(r ? { ...r } : null);
  }, [sel, db[object.collection]]);

  const rec = sel != null ? rows.find((x) => String(x.id) === String(sel)) : null;

  const listCfg = {
    search: object.list.search ? { keys: object.list.search, placeholder: `Search ${object.plural.toLowerCase()}…` } : undefined,
    facets: (object.list.facets || []).map((k) => ({ key: k, label: object.fields[k]?.label || k, field: k, options: object.fields[k]?.options || [] })),
    sorts: (object.list.sorts || []).map((k) => ({ key: k, label: object.fields[k]?.label || k, field: k })),
    defaultSort: object.list.sorts?.[0] ? { key: object.list.sorts[0], dir: "asc" } : undefined,
  };
  const { rows: filtered, controls } = useListControls(rows, listCfg);

  const onField = (name, val) => setEdit((e) => ({ ...e, [name]: val }));
  const saveEdit = () => update(edit);
  const del = (id) => { remove(id); if (String(sel) === String(id)) setSel(null); setConfirm(null); };
  const saveNew = () => { create(drawer.data); setDrawer(null); };

  const Icon = object.icon;
  const stats = rec && object.stats ? object.stats(rec, db) : [];

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      {/* LIST PANE */}
      <div className="list-pane" style={{ width: 300, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg-card)" }}>
        <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>{object.plural}</div>
            <button className="btn btn-blue" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setDrawer({ data: blank() })}><Plus size={12} />Add</button>
          </div>
          {controls}
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.map((r) => (
            <div key={r.id} className="row-hover" onClick={() => navigate("record", { type: object.name, id: r.id })}
              style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: String(sel) === String(r.id) ? "var(--bg-hover)" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{object.title(r)}</div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{object.subtitle?.(r) || "—"}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                {object.badge && r[object.badge] ? <Tag label={String(r[object.badge])} /> : null}
                <RowActions onEdit={() => navigate("record", { type: object.name, id: r.id })} onDelete={() => setConfirm({ id: r.id, label: object.title(r) })} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="mono" style={{ padding: 16, fontSize: 12, color: "var(--text-dim)" }}>No {object.plural.toLowerCase()} yet.</div>}
        </div>
      </div>

      {/* DETAIL PANE */}
      <div className="detail-pane" style={{ flex: 1, overflowY: "auto", padding: 24, background: "var(--bg)" }}>
        {rec && edit ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={() => { setSel(null); navigate(object.route); }}><ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />Back to {object.plural.toLowerCase()}</button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div className="display" style={{ fontSize: 20, fontWeight: 800 }}>{object.title(rec)}</div>
                <div style={{ color: "var(--text-sec)", fontSize: 13, marginTop: 2 }}>{object.subtitle?.(rec)}</div>
              </div>
              <div className="header-actions" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                {object.badge && rec[object.badge] ? <Tag label={String(rec[object.badge])} /> : null}
                <button className="btn btn-blue" style={{ padding: "5px 12px", fontSize: 12 }} onClick={saveEdit}><Save size={12} />Save</button>
                <button className="btn btn-danger" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setConfirm({ id: rec.id, label: object.title(rec) })}><Trash2 size={12} /></button>
              </div>
            </div>

            {stats.length > 0 && (
              <div className="grid-resp-4" style={{ marginBottom: 20 }}>
                {stats.map((s) => (
                  <div key={s.label} className="card-el" style={{ padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-d)", color: `var(${s.color || "--blue"})` }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "var(--text-sec)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {object.layout.sections.map((sec) => (
              <div key={sec.title} className="card" style={{ padding: 20, marginBottom: 16 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".04em" }}>{sec.title}</div>
                <FieldSection object={object} fields={sec.fields} cols={sec.cols || 2} record={edit} mode="edit" onChange={onField} db={db} navigate={navigate} />
              </div>
            ))}

            <RelatedLists object={object} record={rec} db={db} navigate={navigate} />

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType={object.name} entityId={rec.id} />
            <ActivityTimeline events={db.events || []} entityType={object.name} entityId={rec.id} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-sec)" }}>
            {Icon ? <Icon size={44} style={{ opacity: 0.15, marginBottom: 14 }} /> : null}
            <p style={{ fontSize: 14 }}>Select a {object.label.toLowerCase()}</p>
          </div>
        )}
      </div>

      {drawer && (
        <Drawer title={`New ${object.label}`} onClose={() => setDrawer(null)} onSave={saveNew}>
          {object.layout.sections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: 8 }}>
              <FieldSection object={object} fields={sec.fields} cols={sec.cols || 1} record={drawer.data} mode="edit" onChange={(name, val) => setDrawer((d) => ({ ...d, data: { ...d.data, [name]: val } }))} db={db} navigate={null} />
            </div>
          ))}
        </Drawer>
      )}
      {confirm && <ConfirmDelete label={confirm.label} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}
    </div>
  );
};
