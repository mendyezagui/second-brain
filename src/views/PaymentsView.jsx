import { useEffect, useMemo, useState } from "react";
import { ChevronRight, CreditCard, Plus, Save, Search, Trash2, X } from "lucide-react";
import { nextId, today } from "../lib/utils";
import { AssociatedDocumentsPanel, ConfirmDelete, Drawer, Field, Inp, Sel, Tex, useListControls } from "../components/ui";

export const PAYMENT_METHODS = ["check","wire","ach","card","cash","other"];

export const blankPayment = () => ({ amount:0, date:today(), payer:"", payer_type:"company", method:"check", reference:"", notes:"", allocations:[] });

export const PaymentsView = ({ db, setDB, navigate, focus, setFocus }) => {
  const [sel, setSel] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pd, setPD] = useState(blankPayment());
  const [editPay, setEditPay] = useState(null);

  useEffect(() => {
    if (focus?.type === "payment" && focus.id) { setSel(focus.id); } else setSel(null);
  }, [focus]);

  useEffect(() => {
    if (sel) {
      const p = (db.payments||[]).find(x => x.id === sel);
      if (p) {
        const allocs = (db.payment_allocations||[]).filter(a => a.payment_id === p.id).map(a => ({invoice_id: a.invoice_id, amount: a.amount}));
        setEditPay({...p, amount: String(p.amount), allocations: allocs});
      }
    } else setEditPay(null);
  }, [sel, db.payments, db.payment_allocations]);

  const { rows: payments, controls } = useListControls(db.payments || [], {
    search: { keys: ["payer", "reference"], placeholder: "Search payments…" },
    facets: [
      { key: "method", label: "Method", field: "method", options: PAYMENT_METHODS },
    ],
    sorts: [
      { key: "date", label: "Date", field: "date" },
      { key: "amount", label: "Amount", field: (p) => p.amount || 0 },
      { key: "payer", label: "Payer", field: "payer" },
    ],
    defaultSort: { key: "date", dir: "desc" },
  });
  const invoices = db.invoices || [];
  const totalReceived = (db.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
  const totalAllocated = (db.payment_allocations || []).reduce((s, a) => s + (a.amount || 0), 0);
  const unallocated = totalReceived - totalAllocated;
  const payment = sel ? (db.payments||[]).find(p => p.id === sel) : null;

  const saveInline = () => {
    if (!editPay) return;
    const rec = {...editPay, amount: parseInt(editPay.amount)||0};
    const allocs = (rec.allocations || []).filter(a => a.amount > 0);
    delete rec.allocations;
    setDB(d => {
      const cleaned = (d.payment_allocations || []).filter(a => a.payment_id !== rec.id);
      let nextAllocId = nextId(cleaned);
      const newAllocs = allocs.map(a => ({id: nextAllocId++, payment_id: rec.id, invoice_id: parseInt(a.invoice_id), amount: parseInt(a.amount)||0}));
      return {...d, payments: d.payments.map(x => x.id === rec.id ? rec : x), payment_allocations: [...cleaned, ...newAllocs]};
    });
  };
  const savePayment = (d) => {
    const rec = { ...d, amount: parseInt(d.amount) || 0 };
    const allocs = rec.allocations || [];
    delete rec.allocations;
    const newId = nextId(db.payments || []);
    setDB(db => {
      const newAllocs = allocs.filter(a => a.amount > 0).map((a,i) => ({ id: nextId(db.payment_allocations || [])+i, payment_id: newId, invoice_id: parseInt(a.invoice_id), amount: parseInt(a.amount)||0 }));
      return { ...db, payments: [...(db.payments || []), { ...rec, id: newId }], payment_allocations: [...(db.payment_allocations || []), ...newAllocs] };
    });
    setDrawer(null);
  };
  const delPayment = (id) => { setDB(db => ({ ...db, payments: (db.payments || []).filter(x => x.id !== id), payment_allocations: (db.payment_allocations || []).filter(a => a.payment_id !== id) })); if (sel === id) setSel(null); setConfirm(null); };
  const getAllocs = (pid) => (db.payment_allocations || []).filter(a => a.payment_id === pid);
  const getInvLabel = (iid) => { const inv = invoices.find(x => x.id === iid); return inv ? inv.number + " - " + inv.client : "Invoice #" + iid; };
  return (<div className={`view-shell${sel ? " has-selection" : ""}`}>
    <div className="list-pane" style={{ width:300, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg-card)" }}>
      <div style={{ padding:"16px 14px 10px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div className="display" style={{ fontSize:16, fontWeight:700 }}>Payments</div>
          <button className="btn btn-blue" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{setPD(blankPayment());setDrawer({mode:"add"});}}><Plus size={12}/>Add</button>
        </div>
        <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginBottom:8 }}>{"$"+(totalReceived/100).toLocaleString()} received · {"$"+(unallocated/100).toLocaleString()} unallocated</div>
        {controls}
      </div>
      <div style={{ overflowY:"auto", flex:1 }}>
        {payments.map(p=>(
          <div key={p.id} className="row-hover" onClick={()=>navigate("record",{type:"payment",id:p.id})}
            style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", background:sel===p.id?"var(--bg-hover)":"transparent" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{p.payer}</div>
              <div className="mono" style={{ fontSize:11, fontWeight:600, color:"var(--green)" }}>${(p.amount/100).toLocaleString()}</div>
            </div>
            <div className="mono" style={{ fontSize:10, color:"var(--text-sec)", marginTop:2 }}>{p.date} · {p.method}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="detail-pane" style={{ flex:1, overflowY:"auto", padding:24, background:"var(--bg)" }}>
      {(payment && editPay) ? (
        <div className="slide-in">
          <button className="mobile-back" onClick={()=>{setSel(null);navigate("payments");}}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }}/>Back to payments</button>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
            <div style={{ minWidth:0 }}>
              <div className="display" style={{ fontSize:20, fontWeight:800 }}>${(payment.amount/100).toLocaleString()} from {payment.payer}</div>
              <div style={{ color:"var(--text-sec)", fontSize:13, marginTop:2 }}>{payment.date} · {payment.method}</div>
            </div>
            <div className="header-actions" style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              <button className="btn btn-blue" style={{ padding:"5px 12px", fontSize:12 }} onClick={saveInline}><Save size={12}/>Save</button>
              <button className="btn btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setConfirm(payment)}><Trash2 size={12}/></button>
            </div>
          </div>

          <div className="card" style={{ padding:20, marginBottom:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Field label="Amount (cents)"><Inp type="number" value={editPay.amount} onChange={v=>setEditPay(p=>({...p,amount:v}))}/></Field>
              <Field label="Date"><Inp type="date" value={editPay.date||""} onChange={v=>setEditPay(p=>({...p,date:v}))}/></Field>
              <Field label="Payer"><Inp value={editPay.payer||""} onChange={v=>setEditPay(p=>({...p,payer:v}))}/></Field>
              <Field label="Method"><Sel value={editPay.method} onChange={v=>setEditPay(p=>({...p,method:v}))} options={PAYMENT_METHODS}/></Field>
            </div>
            <Field label="Reference #"><Inp value={editPay.reference||""} onChange={v=>setEditPay(p=>({...p,reference:v}))}/></Field>
            <Field label="Notes"><Tex value={editPay.notes||""} onChange={v=>setEditPay(p=>({...p,notes:v}))}/></Field>

            <div style={{ borderTop:"1px solid var(--border)", paddingTop:14, marginTop:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--text-sec)" }}>Apply to Invoices</span>
                <button type="button" className="btn btn-ghost" style={{ fontSize:11, padding:"3px 8px" }} onClick={()=>setEditPay(p=>({...p, allocations:[...(p.allocations||[]),{invoice_id:invoices[0]?.id||0,amount:0}]}))}>+ Add</button>
              </div>
              {(editPay.allocations||[]).map((a,ai)=>(
                <div key={ai} style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6 }}>
                  <select className="input" value={a.invoice_id} onChange={e=>{const all=[...editPay.allocations];all[ai]={...all[ai],invoice_id:parseInt(e.target.value)};setEditPay(p=>({...p,allocations:all}));}} style={{ flex:2, fontSize:12 }}>
                    <option value={0}>Select invoice…</option>
                    {invoices.map(inv=><option key={inv.id} value={inv.id}>{inv.number} — {inv.client}</option>)}
                  </select>
                  <input className="input" type="number" placeholder="Amount" value={a.amount} onChange={e=>{const all=[...editPay.allocations];all[ai]={...all[ai],amount:parseInt(e.target.value)||0};setEditPay(p=>({...p,allocations:all}));}} style={{ flex:1, fontSize:12 }}/>
                  <button onClick={()=>setEditPay(p=>({...p,allocations:p.allocations.filter((_,i)=>i!==ai)}))} style={{ background:"none", border:"none", color:"var(--red)", cursor:"pointer" }}><X size={14}/></button>
                </div>
              ))}
            </div>
          </div>

          <AssociatedDocumentsPanel db={db} setDB={setDB} entityType="payment" entityId={payment.id}/>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--text-sec)" }}>
          <CreditCard size={44} style={{ opacity:.15, marginBottom:14 }}/>
          <p style={{ fontSize:14 }}>Select a payment</p>
        </div>
      )}
    </div>

    {drawer?.mode==="add" && <Drawer title="Record Payment" onClose={()=>setDrawer(null)} onSave={()=>savePayment(pd)}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Field label="Amount (cents)"><Inp type="number" value={pd.amount} onChange={v=>setPD(p=>({...p,amount:v}))}/></Field>
        <Field label="Date"><Inp type="date" value={pd.date||""} onChange={v=>setPD(p=>({...p,date:v}))}/></Field>
        <Field label="Payer"><Inp value={pd.payer} onChange={v=>setPD(p=>({...p,payer:v}))}/></Field>
        <Field label="Method"><Sel value={pd.method} onChange={v=>setPD(p=>({...p,method:v}))} options={PAYMENT_METHODS}/></Field>
      </div>
      <Field label="Reference #"><Inp value={pd.reference} onChange={v=>setPD(p=>({...p,reference:v}))}/></Field>
      <Field label="Notes"><Tex value={pd.notes} onChange={v=>setPD(p=>({...p,notes:v}))}/></Field>
    </Drawer>}
    {confirm && <ConfirmDelete label={`Payment $${(confirm.amount/100).toLocaleString()} from ${confirm.payer}`} onConfirm={()=>delPayment(confirm.id)} onCancel={()=>setConfirm(null)}/>}
  </div>);
};
