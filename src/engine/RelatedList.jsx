// RelatedList — a modular related-list card, driven by a relation config on the
// object metadata: { object, label, filter, columns?, limit? }.
// Rendered inside a responsive grid so lists pack side-by-side on wide screens.
import { EntityLink, Tag, AssociatedDocumentsPanel, ActivityTimeline } from "../components/ui";
import { objectFor } from "../objects";
import { FieldModule } from "./FieldModule";

export const RelatedList = ({ relation, record, db, navigate, limit = 12 }) => {
  const items = relation.filter(record, db);
  if (!items.length) return null;
  const ro = objectFor(relation.object);
  const cols = relation.columns; // optional: extra fields to show per row

  return (
    <div className="card" style={{ padding: 16, minWidth: 0 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--text-sec)", marginBottom: 10 }}>
        {relation.label.toUpperCase()} ({items.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.slice(0, relation.limit || limit).map((it) => (
          <div key={it.id} className="card-el" style={{ padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, minWidth: 0, fontSize: 13 }}>
            <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 500 }}>
              <EntityLink type={relation.object} id={it.id} navigate={navigate}>{ro ? ro.title(it) : (it.name || it.title)}</EntityLink>
              {cols && ro && (
                <span className="mono" style={{ fontSize: 10, color: "var(--text-sec)", marginLeft: 8 }}>
                  {cols.map((c) => <FieldModule key={c} object={ro} name={c} record={it} mode="view" db={db} bare />)}
                </span>
              )}
            </div>
            {ro?.badge && it[ro.badge] ? <Tag label={String(it[ro.badge])} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

// Responsive grid of ALL related lists (metadata relations + Documents + Activity
// Timeline). auto-fit makes cards expand to fill into real columns when wide,
// and collapse to a single column when narrow.
export const RelatedLists = ({ object, record, db, setDB, navigate }) => {
  const rels = (object.related || []).filter((rl) => rl.filter(record, db).length);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 16, alignItems: "start" }}>
      {rels.map((rl) => <RelatedList key={rl.label} relation={rl} record={record} db={db} navigate={navigate} />)}
      <div style={{ minWidth: 0 }}><AssociatedDocumentsPanel db={db} setDB={setDB} entityType={object.name} entityId={record.id} /></div>
      <div style={{ minWidth: 0 }}><ActivityTimeline events={db.events || []} entityType={object.name} entityId={record.id} /></div>
    </div>
  );
};
