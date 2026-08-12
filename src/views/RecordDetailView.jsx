import { DOCUMENT_ENTITY_TYPES } from "../lib/constants";
import { docAssociationKey, docHasAssociation, fmt, getDocEntityLabel, recordPath } from "../lib/utils";
import { ActivityTimeline, AssociatedDocumentsPanel, EntityLink, Tag } from "../components/ui";
import { DocumentsView } from "./DocumentsView";
import { OBJECTS } from "../objects";
import { ObjectView } from "../engine/ObjectView";

export const recordListViewFor = (type) => ({
  contact:"crm", company:"companies", deal:"deals", document:"documents", project:"projects",
  task:"tasks", campaign:"marketing", invoice:"invoices", payment:"payments", strategy:"strategies",
  goal:"goals", ai_memory:"ai_memories"
}[type] || "dashboard");

export const recordLink = (type, id, db, navigate) => {
  const cfg = DOCUMENT_ENTITY_TYPES.find(c => c.type === type);
  const rec = cfg ? (db[cfg.key] || []).find(r => String(r.id) === String(id)) : null;
  if (!rec) return null;
  return <EntityLink type={type} id={id} navigate={navigate}>{cfg.name(rec) || `${cfg.label} #${id}`}</EntityLink>;
};

export const RecordDetailView = ({ db, setDB, record, navigate, setFocus }) => {
  const type = record?.type;
  // For types that have a master+detail view, render that view with focus pre-set.
  // This keeps the left selector list visible while showing the record's detail,
  // and uses the master view's inline-editable form instead of the read-only generic view.
  if (type === "document") return <DocumentsView db={db} setDB={setDB} navigate={navigate} focus={record} setFocus={setFocus}/>;
  if (OBJECTS[type]) return <ObjectView object={type} db={db} setDB={setDB} navigate={navigate} focus={record}/>;

  const id = record?.id;
  const cfg = DOCUMENT_ENTITY_TYPES.find(c => c.type === type);
  const rec = cfg ? (db[cfg.key] || []).find(r => String(r.id) === String(id)) : null;

  if (!cfg || !rec) {
    return (
      <div style={{ padding:32 }}>
        <div className="card" style={{ padding:28, maxWidth:720 }}>
          <div className="display" style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Record not found</div>
          <p style={{ fontSize:13, color:"var(--text-sec)", lineHeight:1.6, marginBottom:16 }}>No record exists for `{type || "unknown"}` with ID `{id || "unknown"}`.</p>
          <button className="btn btn-blue" onClick={()=>navigate(recordListViewFor(type))}>Back</button>
        </div>
      </div>
    );
  }

  const title = cfg.name(rec) || `${cfg.label} #${rec.id}`;
  const scalarEntries = Object.entries(rec).filter(([,v]) => v == null || ["string","number","boolean"].includes(typeof v));
  const relatedDocs = (db.documents || []).filter(d => docHasAssociation(d, type, rec.id));
  const relatedTasks = (db.tasks || []).filter(t =>
    (type === "contact" && String(t.contactId) === String(rec.id)) ||
    (type === "company" && String(t.companyId) === String(rec.id)) ||
    (type === "deal" && String(t.dealId) === String(rec.id)) ||
    (type === "project" && String(t.projectId) === String(rec.id))
  );
  const relatedDeals = type === "contact"
    ? (db.deals || []).filter(d => String(d.contactId) === String(rec.id))
    : type === "company"
      ? (db.deals || []).filter(d => String(d.companyId) === String(rec.id) || (db.contacts || []).some(c => String(c.companyId) === String(rec.id) && String(c.id) === String(d.contactId)))
      : [];
  const relatedContacts = type === "company" ? (db.contacts || []).filter(c => String(c.companyId) === String(rec.id) || c.co === rec.name) : [];
  const associatedRecords = type === "document" ? (rec.associations || []) : [];
  const sourceUrl = recordPath(type, rec.id);
  const copyUrl = () => navigator.clipboard?.writeText(window.location.origin + window.location.pathname + sourceUrl);

  return (
    <div style={{ padding:24, maxWidth:1180, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:18 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <Tag label={cfg.label}/>
            <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>ID {rec.id}</span>
          </div>
          <div className="display" style={{ fontSize:26, fontWeight:800, lineHeight:1.15 }}>{title}</div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
          <button className="btn btn-ghost" onClick={()=>navigate(recordListViewFor(type))}>← Back to {cfg.label}s</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 340px", gap:18 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="card" style={{ padding:18 }}>
            <div className="display" style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
              {scalarEntries.map(([k,v]) => (
                <div key={k} className="card-el" style={{ padding:"10px 12px", minWidth:0 }}>
                  <div className="mono" style={{ fontSize:10, color:"var(--text-dim)", textTransform:"uppercase", marginBottom:4 }}>{k}</div>
                  <div style={{ fontSize:13, lineHeight:1.5, overflowWrap:"anywhere" }}>{v == null || v === "" ? "—" : String(v)}</div>
                </div>
              ))}
            </div>
          </div>

          {associatedRecords.length > 0 && (
            <div className="card" style={{ padding:18 }}>
              <div className="display" style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Associated Records</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {associatedRecords.map(a => (
                  <div key={docAssociationKey(a)} className="card-el" style={{ padding:"10px 12px" }}>
                    {recordLink(a.type, a.id, db, navigate) || getDocEntityLabel(db, a)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {type !== "document" && <AssociatedDocumentsPanel db={db} setDB={setDB} entityType={type} entityId={rec.id}/>}
          <ActivityTimeline events={db.events || []} entityType={type} entityId={rec.id}/>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {["contactId","companyId","dealId","projectId","invoice_id","payment_id","strategyId"].some(k => rec[k]) && (
            <div className="card" style={{ padding:16 }}>
              <div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Linked Records</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:13 }}>
                {rec.contactId && <div>Contact: {recordLink("contact", rec.contactId, db, navigate) || rec.contactId}</div>}
                {rec.companyId && <div>Company: {recordLink("company", rec.companyId, db, navigate) || rec.companyId}</div>}
                {rec.dealId && <div>Deal: {recordLink("deal", rec.dealId, db, navigate) || rec.dealId}</div>}
                {rec.projectId && <div>Project: {recordLink("project", rec.projectId, db, navigate) || rec.projectId}</div>}
                {rec.invoice_id && <div>Invoice: {recordLink("invoice", rec.invoice_id, db, navigate) || rec.invoice_id}</div>}
                {rec.payment_id && <div>Payment: {recordLink("payment", rec.payment_id, db, navigate) || rec.payment_id}</div>}
                {rec.strategyId && <div>Strategy: {recordLink("strategy", rec.strategyId, db, navigate) || rec.strategyId}</div>}
              </div>
            </div>
          )}

          {relatedContacts.length > 0 && <div className="card" style={{ padding:16 }}><div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Contacts</div>{relatedContacts.slice(0,8).map(c => <div key={c.id} className="card-el" style={{ padding:10, marginBottom:6 }}>{recordLink("contact", c.id, db, navigate)}</div>)}</div>}
          {relatedDeals.length > 0 && <div className="card" style={{ padding:16 }}><div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Deals</div>{relatedDeals.slice(0,8).map(d => <div key={d.id} className="card-el" style={{ padding:10, marginBottom:6 }}>{recordLink("deal", d.id, db, navigate)} <span className="mono" style={{ color:"var(--text-sec)", fontSize:10 }}>· {fmt(d.value || 0)}</span></div>)}</div>}
          {relatedTasks.length > 0 && <div className="card" style={{ padding:16 }}><div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Tasks</div>{relatedTasks.slice(0,10).map(t => <div key={t.id} className="card-el" style={{ padding:10, marginBottom:6 }}>{recordLink("task", t.id, db, navigate)} <Tag label={t.priority || "medium"}/></div>)}</div>}
          {relatedDocs.length > 0 && <div className="card" style={{ padding:16 }}><div className="display" style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Documents</div>{relatedDocs.slice(0,8).map(d => <div key={d.id} className="card-el" style={{ padding:10, marginBottom:6 }}>{recordLink("document", d.id, db, navigate)}</div>)}</div>}
        </div>
      </div>
    </div>
  );
};
