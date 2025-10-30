import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // Get the Authorization header
  const authHeader = req.headers.get('Authorization')!;
  
  // Initialize Supabase client with service role key (for admin access)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get user from JWT
  const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
  
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if the user has the ENROLL permission by calling the SQL function
  const { data: permissionCheck, error: permissionError } = await supabase
    .rpc('current_user_has_permission', { permission_name: 'ENROLL' });

  if (permissionError) {
    console.error('Error checking permission:', permissionError);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!permissionCheck || permissionCheck.length === 0 || !permissionCheck[0]) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Parse the request body to get the email, name, and surname
  const { email, name, surname } = await req.json();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email format' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Send a magic link to the provided email with user metadata
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        name: name,
        surname: surname
      }
    });
    
    if (inviteError) {
      console.error('Error sending magic link:', inviteError);
      return new Response(JSON.stringify({ error: 'Failed to send invitation', details: inviteError.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Invitation sent successfully',
      email: email 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
