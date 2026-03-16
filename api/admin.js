// api/admin.js — Vercel Serverless Function
// Admin user management via Supabase service_role key
// Supports: list users, create user, update user, reset password, delete user

import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Verify the caller is authenticated by checking their token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  try {
    const admin = getAdminClient();

    // Verify the calling user's token is valid
    const { data: { user: caller }, error: authErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !caller) return res.status(401).json({ error: "Invalid session" });

    const { action, ...params } = req.body;

    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ users: data.users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        full_name: u.user_metadata?.full_name || "",
        role: u.user_metadata?.role || "",
        phone: u.phone || "",
      }))});
    }

    if (action === "create") {
      const { email, password, full_name, role } = params;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || "", role: role || "" },
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ user: { id: data.user.id, email: data.user.email, full_name: full_name || "", role: role || "" } });
    }

    if (action === "update") {
      const { userId, email, full_name, role } = params;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      const updates = {};
      if (email) updates.email = email;
      updates.user_metadata = { full_name: full_name || "", role: role || "" };
      const { data, error } = await admin.auth.admin.updateUserById(userId, updates);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ user: { id: data.user.id, email: data.user.email, full_name: full_name || "", role: role || "" } });
    }

    if (action === "reset_password") {
      const { userId, new_password } = params;
      if (!userId || !new_password) return res.status(400).json({ error: "userId and new_password are required" });
      if (new_password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
      const { error } = await admin.auth.admin.updateUserById(userId, { password: new_password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === "delete") {
      const { userId } = params;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      if (userId === caller.id) return res.status(400).json({ error: "Cannot delete your own account" });
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("Admin API error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
