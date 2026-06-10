import { useEffect, useState } from "react";
import { ChevronRight, DollarSign, Plus, Save, Search, Trash2 } from "lucide-react";
import { fmt, nextId } from "../lib/utils";
import { AssociatedDocumentsPanel, ConfirmDelete, Drawer, Field, Inp, Sel, Tag, Tex } from "../components/ui";

export const blankInvoice = () => ({ number:"", client:"", amount:0, status:"draft", issued:"", due:"", notes:"" });

const money = (n) => "$" + Number(n || 0).toLocaleString();

export const BillingView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [d, setD] = useState(blankInvoice());
  const [editInv, setEditInv] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if(focus?.type==="invoice" && focus.id) { setSel(focus.id); } else setSel(null);
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const inv = db.invoices.find(x => x.id === sel);
      if (inv) setEditInv({...inv, amount: String(inv.amount)});
    } else setEditInv(null);
  }, [sel, db.invoices]);

  const filtered = db.invoices.filter(inv => {
    if (query && !(`${inv.number} ${inv.client}`.toLowerCase().includes(query.toLowerCase()))) return false;
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    return true;
  });
  const invoice = sel ? db.invoices.find(x => x.id === sel) : null;
  // Paid + Outstanding are maintained by DB triggers off payment_allocations.
  // Fall back to a local compute for an invoice created this session but not yet reloaded.
  const paidAmt = invoice ? (invoice.amount_paid || 0) : 0;
  const outstandingAmt = invoice ? (invoice.outstanding ?? ((invoice.amount || 0) - paidAmt)) : 0;
  const invAllocs = invoice ? (db.payment_allocations || []).filter(a => a.invoice_id === invoice.id) : [];

  const saveInline = () => {
    if (!editInv) return;
    const rec = {...editInv, amount: parseFloat(editInv.amount)||0};
    setDB(d => ({...d, invoices: d.invoices.map(x => x.id === rec.id ? rec : x)}));
  };
  const save = () => {
    const rec = {...d, amount:parseFloat(d.amount)||0};
    setDB(db => ({...db, invoices:[...db.invoices, {...rec, id:nextId(db.invoices)}]}));
    setDrawer(null);
  };
  const del = (id) => { setDB(db=>({...db,invoices:db.invoices.filter(x=>x.id!==id)})); if (sel === id) setSel(null); setConfirm(null); };
  const paid = db.invoices.filter(i=>i.status==="paid").reduce((a,i)=>a+i.amount,0);
  const overdue = db.invoices.filter(i=>i.status==="overdue").reduce((a,i)=>a+i.amount,0);

  return (
    <div className={`view-shell${sel ? " has-selection" : ""}`}>
      <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div className="display" style={{ fontSize:16, fontWeight:700 }}>Invoices</div>
            <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setD(blankInvoice());setDrawer("add");}}><Plus size={12}/>Add</button>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
            {["all","draft","pending","paid","overdue","void"].map(s=>(
              <button key={s} className={`filter-chip${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <Search size={13} color="var(--text-sec)" style={{ position:"absolute", left:10, top:10, pointerEvents:"none" }}/>
            <input className="input" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}/>
          </div>
          {overdue>0 && <div className="mono" style={{ fontSize:10, color:"var(--red)", marginTop:6 }}>{db.invoices.filter(i=>i.status==="overdue").length} overdue · {fmt(overdue)}</div>}
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(inv => (
            <div key={inv.id} className="row-hover" onClick={()=>navigate("record",{type:"invoice",id:inv.id})}
              style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===inv.id?"var(--bg-hover)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
              <div style={{ minWidth:0 }}>
                <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{inv.number}</div>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{inv.client}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
                <div className="mono" style={{ fontSize:11, fontWeight:600 }}>{fmt(inv.amount)}</div>
                {(inv.outstanding ?? 1) !== 0 && (inv.amount_paid || 0) > 0
                  ? <div className="mono" style={{ fontSize:9, color:"var(--amber)" }}>{money(inv.outstanding)} due</div>
                  : null}
                <Tag label={inv.status}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
        {(invoice && editInv) ? (
          <div className="slide-in">
            <button className="mobile-back" onClick={()=>{setSel(null);navigate("invoices");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to invoices</button>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div className="display" style={{ fontSize:20, fontWeight:800 }}>{invoice.number || `Invoice #${invoice.id}`}</div>
                <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{invoice.client}</div>
              </div>
              <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <Tag label={invoice.status}/>
                <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
                <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm({id:invoice.id,label:invoice.number})}><Trash2 size={12}/></button>
              </div>
            </div>

            <div className="grid-resp-4" style={{ marginBottom:20 }}>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--blue)" }}>{money(invoice.amount)}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Total</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color:"var(--green)" }}>{money(paidAmt)}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Paid</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, fontFamily:"var(--font-d)", color: outstandingAmt > 0 ? "var(--red)" : "var(--green)" }}>{money(outstandingAmt)}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Outstanding</div></div>
              <div className="card-el" style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:13, fontWeight:600 }}>{invoice.status}</div><div style={{ fontSize:11, color:"var(--text-sec)" }}>Status</div></div>
            </div>

            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Invoice #"><Inp value={editInv.number||""} onChange={v=>setEditInv(p=>({...p,number:v}))}/></Field>
                <Field label="Client"><Inp value={editInv.client||""} onChange={v=>setEditInv(p=>({...p,client:v}))}/></Field>
                <Field label="Amount ($)"><Inp type="number" value={editInv.amount} onChange={v=>setEditInv(p=>({...p,amount:v}))}/></Field>
                <Field label="Status"><Sel value={editInv.status} onChange={v=>setEditInv(p=>({...p,status:v}))} options={["draft","pending","paid","overdue","void"]}/></Field>
                <Field label="Issued"><Inp type="date" value={editInv.issued||""} onChange={v=>setEditInv(p=>({...p,issued:v}))}/></Field>
                <Field label="Due Date"><Inp type="date" value={editInv.due||""} onChange={v=>setEditInv(p=>({...p,due:v}))}/></Field>
              </div>
              <Field label="Notes"><Tex value={editInv.notes||""} onChange={v=>setEditInv(p=>({...p,notes:v}))}/></Field>
            </div>

            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:13, fontWeight:700 }}>Payments Applied</span>
                <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{money(paidAmt)} of {money(invoice.amount)}</span>
              </div>
              {invAllocs.length === 0 ? (
                <div style={{ fontSize:12, color:"var(--text-sec)" }}>No payments applied yet. Apply one from the Payments view.</div>
              ) : invAllocs.map(a => {
                const pay = (db.payments || []).find(p => p.id === a.payment_id);
                return (
                  <div key={a.id} className="row-hover" onClick={()=>{ if (pay) navigate("record",{type:"payment",id:pay.id}); }}
                    style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 6px", borderTop:"1px solid var(--border)", cursor: pay ? "pointer" : "default" }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{pay ? pay.payer : "Payment #" + a.payment_id}</div>
                      <div className="mono" style={{ fontSize:10, color:"var(--text-sec)" }}>{pay ? `${pay.date || ""}${pay.method ? " · " + pay.method : ""}` : ""}</div>
                    </div>
                    <div className="mono" style={{ fontSize:12, fontWeight:600, color:"var(--green)" }}>{money(a.amount)}</div>
                  </div>
                );
              })}
            </div>

            <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="invoice" entityId={invoice.id}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
            <DollarSign size={44} style={{ opacity:.15, marginBottom:14 }}/>
            <p style={{ fontSize:14 }}>Select an invoice</p>
          </div>
        )}
      </div>

      {drawer==="add" && <Drawer title="New Invoice" onClose={()=>setDrawer(null)} onSave={save}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Invoice #"><Inp value={d.number} onChange={v=>setD(p=>({...p,number:v}))}/></Field>
          <Field label="Client"><Inp value={d.client} onChange={v=>setD(p=>({...p,client:v}))}/></Field>
          <Field label="Amount ($)"><Inp type="number" value={d.amount} onChange={v=>setD(p=>({...p,amount:v}))}/></Field>
          <Field label="Status"><Sel value={d.status} onChange={v=>setD(p=>({...p,status:v}))} options={["draft","pending","paid","overdue","void"]}/></Field>
          <Field label="Issued"><Inp type="date" value={d.issued} onChange={v=>setD(p=>({...p,issued:v}))}/></Field>
          <Field label="Due Date"><Inp type="date" value={d.due} onChange={v=>setD(p=>({...p,due:v}))}/></Field>
        </div>
        <Field label="Notes"><Tex value={d.notes} onChange={v=>setD(p=>({...p,notes:v}))}/></Field>
      </Drawer>}
      {confirm&&<ConfirmDelete label={confirm.label} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};
