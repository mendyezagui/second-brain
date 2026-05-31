import { useEffect, useState } from "react";
import { Loader, Pencil, Plus, RefreshCw, Shield, Trash2 } from "lucide-react";

export const AdminView = ({ session }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drawer, setDrawer] = useState(null); // null | "create" | {mode:"edit", user} | {mode:"reset", user}
  const [form, setForm] = useState({ email:"", password:"", full_name:"", role:"" });
  const [resetPw, setResetPw] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const apiCall = async (body) => {
    const resp = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    return resp.json();
  };

  const loadUsers = async () => {
    setLoading(true); setError("");
    const res = await apiCall({ action: "list" });
    if (res.error) setError(res.error);
    else setUsers(res.users || []);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleCreate = async () => {
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    setError("");
    const res = await apiCall({ action: "create", ...form });
    if (res.error) { setError(res.error); return; }
    flash("User created successfully");
    setDrawer(null); setForm({ email:"", password:"", full_name:"", role:"" });
    loadUsers();
  };

  const handleUpdate = async () => {
    if (!drawer?.user?.id) return;
    setError("");
    const res = await apiCall({ action: "update", userId: drawer.user.id, email: form.email, full_name: form.full_name, role: form.role });
    if (res.error) { setError(res.error); return; }
    flash("User updated successfully");
    setDrawer(null); loadUsers();
  };

  const handleResetPassword = async () => {
    if (!drawer?.user?.id || !resetPw) return;
    if (resetPw.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    const res = await apiCall({ action: "reset_password", userId: drawer.user.id, new_password: resetPw });
    if (res.error) { setError(res.error); return; }
    flash("Password reset successfully");
    setResetPw(""); setDrawer(null);
  };

  const handleDelete = async (userId) => {
    setError("");
    const res = await apiCall({ action: "delete", userId });
    if (res.error) { setError(res.error); return; }
    flash("User deleted");
    setConfirmDelete(null); loadUsers();
  };

  const openEdit = (u) => {
    setForm({ email: u.email, password: "", full_name: u.full_name, role: u.role });
    setDrawer({ mode: "edit", user: u });
    setError("");
  };

  const openReset = (u) => {
    setResetPw("");
    setDrawer({ mode: "reset", user: u });
    setError("");
  };

  const openCreate = () => {
    setForm({ email: "", password: "", full_name: "", role: "" });
    setDrawer("create");
    setError("");
  };

  const inputStyle = { width:"100%", padding:"9px 12px", background:"var(--bg-main)", border:"1px solid var(--border)", borderRadius:6, color:"var(--text)", fontSize:13, outline:"none", boxSizing:"border-box" };
  const labelStyle = { fontSize:11, color:"var(--text-sec)", marginBottom:4, display:"block" };
  const btnPrimary = { padding:"9px 18px", background:"var(--blue)", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600 };
  const btnDanger = { padding:"7px 14px", background:"var(--red-dim)", color:"var(--red)", border:"1px solid var(--red)", borderRadius:6, cursor:"pointer", fontSize:12 };
  const btnGhost = { padding:"7px 14px", background:"transparent", color:"var(--text-sec)", border:"1px solid var(--border)", borderRadius:6, cursor:"pointer", fontSize:12 };

  return (
    <div style={{ padding:24, maxWidth:900, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Shield size={20} color="var(--blue)"/>
          <h2 style={{ margin:0, fontSize:18 }}>User Management</h2>
          <span className="mono" style={{ fontSize:11, color:"var(--text-sec)" }}>{users.length} users</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={loadUsers} style={btnGhost}><RefreshCw size={12}/> Refresh</button>
          <button onClick={openCreate} style={btnPrimary}><Plus size={12}/> Add User</button>
        </div>
      </div>

      {error && <div style={{ padding:"10px 14px", background:"var(--red-dim)", border:"1px solid var(--red)", borderRadius:6, color:"var(--red)", fontSize:13, marginBottom:14 }}>{error}</div>}
      {success && <div style={{ padding:"10px 14px", background:"var(--green-dim)", border:"1px solid var(--green)", borderRadius:6, color:"var(--green)", fontSize:13, marginBottom:14 }}>{success}</div>}

      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"var(--text-sec)" }}><Loader size={20} className="spin"/> Loading users...</div>
      ) : (
        <div className="card-el" style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"var(--bg-main)", borderBottom:"1px solid var(--border)" }}>
                <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>NAME</th>
                <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>EMAIL</th>
                <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>ROLE</th>
                <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>LAST SIGN IN</th>
                <th style={{ padding:"10px 14px", textAlign:"right", fontSize:11, color:"var(--text-sec)", fontWeight:600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="row-hover" style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ fontWeight:600 }}>{u.full_name || "—"}</div>
                    {u.id === session.user.id && <span style={{ fontSize:10, color:"var(--blue)", background:"var(--blue-dim)", padding:"1px 6px", borderRadius:4 }}>You</span>}
                  </td>
                  <td style={{ padding:"10px 14px", color:"var(--text-sec)" }}>{u.email}</td>
                  <td style={{ padding:"10px 14px" }}>
                    {u.role ? <span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:"var(--amber-dim)", color:"var(--amber)" }}>{u.role}</span> : <span style={{ color:"var(--text-sec)" }}>—</span>}
                  </td>
                  <td style={{ padding:"10px 14px", color:"var(--text-sec)", fontSize:12 }}>
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}>
                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                      <button onClick={() => openEdit(u)} title="Edit profile" style={{ ...btnGhost, padding:"5px 8px" }}><Pencil size={12}/></button>
                      <button onClick={() => openReset(u)} title="Reset password" style={{ ...btnGhost, padding:"5px 8px" }}><Shield size={12}/></button>
                      {u.id !== session.user.id && (
                        <button onClick={() => setConfirmDelete(u)} title="Delete user" style={{ ...btnGhost, padding:"5px 8px", color:"var(--red)" }}><Trash2 size={12}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit / Reset Drawer ── */}
      {drawer && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }} onClick={() => setDrawer(null)}>
          <div className="card-el" style={{ width:420, padding:24, maxHeight:"80vh", overflow:"auto" }} onClick={e => e.stopPropagation()}>
            {drawer === "create" && <>
              <h3 style={{ margin:"0 0 16px", fontSize:16, display:"flex", alignItems:"center", gap:8 }}><Plus size={16} color="var(--blue)"/> Create New User</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({...f, full_name:e.target.value}))} placeholder="John Smith"/></div>
                <div><label style={labelStyle}>Email *</label><input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} placeholder="user@example.com"/></div>
                <div><label style={labelStyle}>Password *</label><input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} placeholder="Min 6 characters"/></div>
                <div><label style={labelStyle}>Role</label><input style={inputStyle} value={form.role} onChange={e => setForm(f => ({...f, role:e.target.value}))} placeholder="e.g. Admin, Manager, Viewer"/></div>
              </div>
              {error && <div style={{ color:"var(--red)", fontSize:12, marginTop:8 }}>{error}</div>}
              <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
                <button onClick={() => setDrawer(null)} style={btnGhost}>Cancel</button>
                <button onClick={handleCreate} style={btnPrimary}>Create User</button>
              </div>
            </>}

            {drawer?.mode === "edit" && <>
              <h3 style={{ margin:"0 0 16px", fontSize:16, display:"flex", alignItems:"center", gap:8 }}><Pencil size={16} color="var(--blue)"/> Edit User Profile</h3>
              <div style={{ fontSize:12, color:"var(--text-sec)", marginBottom:14 }}>Editing: {drawer.user.email}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({...f, full_name:e.target.value}))} /></div>
                <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} /></div>
                <div><label style={labelStyle}>Role</label><input style={inputStyle} value={form.role} onChange={e => setForm(f => ({...f, role:e.target.value}))} placeholder="e.g. Admin, Manager, Viewer"/></div>
              </div>
              {error && <div style={{ color:"var(--red)", fontSize:12, marginTop:8 }}>{error}</div>}
              <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
                <button onClick={() => setDrawer(null)} style={btnGhost}>Cancel</button>
                <button onClick={handleUpdate} style={btnPrimary}>Save Changes</button>
              </div>
            </>}

            {drawer?.mode === "reset" && <>
              <h3 style={{ margin:"0 0 16px", fontSize:16, display:"flex", alignItems:"center", gap:8 }}><Shield size={16} color="var(--amber)"/> Reset Password</h3>
              <div style={{ fontSize:12, color:"var(--text-sec)", marginBottom:14 }}>Resetting password for: {drawer.user.email}</div>
              <div><label style={labelStyle}>New Password</label><input style={inputStyle} type="password" value={resetPw} onChange={e => setResetPw(e.target.value)} placeholder="Min 6 characters"/></div>
              {error && <div style={{ color:"var(--red)", fontSize:12, marginTop:8 }}>{error}</div>}
              <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
                <button onClick={() => setDrawer(null)} style={btnGhost}>Cancel</button>
                <button onClick={handleResetPassword} style={btnPrimary}>Reset Password</button>
              </div>
            </>}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {confirmDelete && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={() => setConfirmDelete(null)}>
          <div className="card-el" style={{ width:380, padding:24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin:"0 0 10px", fontSize:16, color:"var(--red)" }}>Delete User</h3>
            <p style={{ fontSize:13, color:"var(--text-sec)", margin:"0 0 6px" }}>Are you sure you want to delete this user?</p>
            <p style={{ fontSize:13, fontWeight:600, margin:"0 0 18px" }}>{confirmDelete.full_name || confirmDelete.email}</p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={btnGhost}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} style={btnDanger}>Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
