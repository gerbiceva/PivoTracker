# Create User Script

This script allows you to create a new user in Supabase using the admin API. This is useful for development purposes when you need to quickly add test users.

## Prerequisites

1. Make sure your local Supabase instance is running:
   ```bash
   npx supabase start
   ```

2. Get your Service Role Key from your Supabase project:
   - Go to your Supabase Dashboard
   - Navigate to Project Settings > API
   - Copy the "Service role key" (Secret)

3. Add the service role key to your environment:
   - Open `env/.env.local`
   - Replace `your_service_role_key_here` with your actual service role key:
     ```
     SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
     ```

## Usage

Run the script with Deno:

```bash
deno run -A scripts/create-user.ts <email> <password> [first_name] [last_name]
```

### Examples:

```bash
# Create a user with just email and password
deno run -A scripts/create-user.ts test@example.com password123

# Create a user with first and last name
deno run -A scripts/create-user.ts john.doe@example.com password123 John Doe
```

## Notes

- The `-A` flag gives the script all permissions needed to run
- The email will be automatically confirmed (no email verification required)
- The service role key has elevated privileges, so keep it secure and never commit it to git
- This script uses the local Supabase instance by default (http://127.0.0.1:54321)
