import { createClient } from "@supabase/supabase-js";

// Hard-deletes a user: base_users row, its residents row and the auth login.
// Body: { base_user_id: number }. Caller needs the DELETE_USERS permission.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized - no authorization header" }, 401);
  }

  // Client with the caller's auth to check permissions (respects RLS)
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: allowed, error: permissionError } = await supabaseUser
    .rpc("current_user_has_permission", { permission_name: "DELETE_USERS" });
  if (permissionError) {
    console.error("Error checking permission:", permissionError);
    return json({ error: "Internal server error" }, 500);
  }
  if (!allowed) {
    return json({ error: "Insufficient permissions" }, 403);
  }

  const { base_user_id } = await req.json();
  if (typeof base_user_id !== "number") {
    return json({ error: "base_user_id is required" }, 400);
  }

  const { data: callerId } = await supabaseUser.rpc("get_current_base_user_id");
  if (callerId === base_user_id) {
    return json({ error: "Ne moreš izbrisati samega sebe." }, 400);
  }

  // admins are reserved for developers: only other admins may delete them
  const [{ data: targetIsAdmin, error: targetError }, { data: callerIsAdmin, error: callerError }] =
    await Promise.all([
      supabaseUser.rpc("is_admin_user", { p_base_user_id: base_user_id }),
      supabaseUser.rpc("is_admin_user", { p_base_user_id: callerId }),
    ]);
  if (targetError || callerError) {
    console.error("Error checking admin group:", targetError ?? callerError);
    return json({ error: "Internal server error" }, 500);
  }
  if (targetIsAdmin && !callerIsAdmin) {
    return json({ error: "Administratorja lahko izbriše samo administrator." }, 403);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: baseUser, error: fetchError } = await supabaseAdmin
    .from("base_users")
    .select("id, auth, resident")
    .eq("id", base_user_id)
    .maybeSingle();
  if (fetchError) {
    console.error("Error fetching base_user:", fetchError);
    return json({ error: "Internal server error" }, 500);
  }
  if (!baseUser) {
    return json({ error: "User not found" }, 404);
  }

  // base_users first: its FK to auth.users has no ON DELETE, and this is the
  // step that fails if the user still has transactions/reservations/events.
  const { error: deleteError } = await supabaseAdmin
    .from("base_users")
    .delete()
    .eq("id", base_user_id);
  if (deleteError) {
    console.error("Error deleting base_user:", deleteError);
    if (deleteError.code === "23503") {
      return json({
        error:
          "Uporabnika ni mogoče izbrisati, ker ima povezane podatke (transakcije, rezervacije ali dogodke).",
        details: deleteError.details,
      }, 409);
    }
    return json({ error: "Failed to delete user", details: deleteError.message }, 500);
  }

  if (baseUser.resident) {
    const { error } = await supabaseAdmin
      .from("residents")
      .delete()
      .eq("id", baseUser.resident);
    if (error) console.error("Error deleting resident:", error);
  }

  if (baseUser.auth) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(baseUser.auth);
    if (error) {
      console.error("Error deleting auth user:", error);
      return json({
        error: "Uporabnik izbrisan, prijave pa ni bilo mogoče izbrisati.",
        details: error.message,
      }, 500);
    }
  }

  return json({ message: "User deleted", base_user_id });
});
