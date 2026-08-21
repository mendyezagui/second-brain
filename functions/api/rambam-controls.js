export async function onRequestGet({ request, env }) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return Response.json({ error:"Unauthorized" }, { status:401 });

  try {
    const authResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization:`Bearer ${bearer}`,
      },
    });
    if (!authResponse.ok) return Response.json({ error:"Invalid session" }, { status:401 });
    if (!env.CRON_SECRET) throw new Error("Rambam controls secret is not configured");

    const upstream = await fetch("https://rambam-leaderboard.mendy-ez.chatgpt.site/api/controls", {
      headers: { Authorization:`Bearer ${env.CRON_SECRET}` },
    });
    return new Response(upstream.body, {
      status:upstream.status,
      headers: {
        "content-type":upstream.headers.get("content-type") || "application/json",
        "cache-control":"private, no-store",
      },
    });
  } catch (error) {
    console.error("[rambam-controls] proxy failed", { error:String(error) });
    return Response.json({ error:error.message || "Could not load Rambam controls" }, { status:500 });
  }
}
