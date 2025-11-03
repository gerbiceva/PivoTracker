import { createClient } from '@supabase/supabase-js';

// Get environment variables
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createUser() {
  // Get user details from command line arguments or prompt for input
  const email = Deno.args[0];
  const password = Deno.args[1];
  const firstName = Deno.args[2] || null;
  const lastName = Deno.args[3] || null;
  
  if (!email || !password) {
    console.log('Usage: deno run -A create-user.ts <email> <password> [first_name] [last_name]');
    console.log('Example: deno run -A create-user.ts test@example.com password123 John Doe');
    Deno.exit(1);
  }

  try {
    console.log(`Creating user with email: ${email}`);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm the email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (error) {
      console.error('Error creating user:', error.message);
      Deno.exit(1);
    }

    console.log('User created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Created at:', data.user.created_at);
  } catch (err) {
    console.error('Unexpected error:', err);
    Deno.exit(1);
  }
}

// Run the function
createUser();
