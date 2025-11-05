import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  // Define CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Get the Authorization header
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized - no authorization header" }), {
      status: 401,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  // Create a client with the anon key and user's auth header to check permissions (respects RLS)
 const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  // Check if the user has the ENROLL permission by calling the SQL function with user context
  const { data: permissionCheck, error: permissionError } = await supabaseUser
    .rpc("current_user_has_permission", { permission_name: "ENROLL" });

  if (permissionError) {
    console.error("Error checking permission:", permissionError);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  if (!permissionCheck) {
    return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
      status: 403,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  // Parse the request body to get the email, name, surname, room, phone_number, date_of_birth, and redirectTo
  const { email, name, surname, room, phone_number, date_of_birth, redirectTo } = await req.json();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email format" }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  // Get the base_user id of the inviting user
  const { data: inviterBaseUserId, error: inviterError } = await supabaseUser
    .rpc("get_current_base_user_id");

  if (inviterError) {
    console.error("Error getting inviter base_user id:", inviterError);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  if (!inviterBaseUserId) {
    return new Response(JSON.stringify({ error: "Inviter base_user id not found" }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  // Create a client with the service role key to perform the admin action (sending invitation)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Send a magic link to the provided email with user metadata
  const { data: userData, error: inviteError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    email_confirm: true
  });

  if (inviteError) {
    console.error("Error sending magic link:", inviteError);
    return new Response(
      JSON.stringify({
        error: "Failed to send invitation",
        details: inviteError.message,
      }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }

  // Create a base_user for the invited user
  let createdBaseUserId: number | null = null;
  if (userData && userData.user) {
    const { data: baseUserData, error: baseUserError } = await supabaseAdmin
      .from('base_users')
      .insert({
        name: name || email.split('@')[0], // Use email prefix as name if not provided
        surname: surname || null,
        auth: userData.user.id,
        invited_by: inviterBaseUserId // Set the inviter's base_user id
      })
      .select('id')
      .single();

    if (baseUserError) {
      console.error("Error creating base_user:", baseUserError);
      // We don't return an error here because the invitation was already sent
      // The base_user can potentially be created later
    } else {
      createdBaseUserId = baseUserData?.id;
      
      // Create a resident record if room number, phone number, or date of birth is provided
      if (
        (room !== undefined && room !== null && room !== "") ||
        (phone_number !== undefined && phone_number !== null && phone_number !== "") ||
        (date_of_birth !== undefined && date_of_birth !== null && date_of_birth !== "")
      ) {
        const { data: residentData, error: residentError } = await supabaseAdmin
          .from('residents')
          .insert({
            ...(room !== undefined && room !== null && room !== "" && { room: room }),
            ...(phone_number !== undefined && phone_number !== null && phone_number !== "" && { phone_number: phone_number }),
            ...(date_of_birth !== undefined && date_of_birth !== null && date_of_birth !== "" && { date_of_birth: date_of_birth }),
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (residentError) {
          console.error("Error creating resident:", residentError);
          // We don't return an error here because the base_user was already created
        } else {
          // Update the base_user with the resident reference
          const residentId = residentData?.id;
          const { error: updateBaseUserError } = await supabaseAdmin
            .from('base_users')
            .update({ resident: residentId })
            .eq('id', createdBaseUserId);
            
          if (updateBaseUserError) {
            console.error("Error updating base_user with resident ID:", updateBaseUserError);
          }
        }
      }
    }
  }

  return new Response(
    JSON.stringify({
      message: "Invitation sent successfully",
      email: email,
    }),
    {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    },
  );
});
