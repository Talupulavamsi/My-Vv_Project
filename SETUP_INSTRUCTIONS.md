# VoiceVibe Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Sign in with your email: **talupulavamsi49@gmail.com**
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: VoiceVibe
   - **Database Password**: vamsi@672
   - **Region**: Choose closest to your location
6. Click "Create new project"

## Step 2: Get Project Credentials

After project creation:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

## Step 3: Update Environment Variables

Create/update `.env.local` file in your project root:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

## Step 4: Run Database Setup

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `scripts/setup-supabase.sql`
3. Paste it in the SQL Editor
4. Click **Run** to execute

## Step 5: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`

### For Google OAuth (Optional):
1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials

## Step 6: Test Connection

1. Start your development server: `npm run dev`
2. Visit: `http://localhost:3000/test`
3. Check if connection is successful

## Step 7: Verify Setup

1. Try signing up with a new account
2. Check if user appears in **Authentication** → **Users**
3. Check if user profile is created in **Table Editor** → **users**
4. Verify groups are loaded in the app

## Troubleshooting

### Common Issues:

1. **Connection Failed**: Check if environment variables are correct
2. **RLS Errors**: Ensure Row Level Security policies are properly set
3. **Auth Errors**: Verify redirect URLs are configured correctly

### Database Access:
- **Host**: db.xxxxx.supabase.co
- **Database**: postgres
- **Username**: postgres
- **Password**: vamsi@672
- **Port**: 5432

## Security Notes

- Never commit `.env.local` to version control
- The anon key is safe to use in frontend (it's public)
- RLS policies protect your data even with public keys
- For production, add your domain to allowed origins

## Next Steps

After successful setup:
1. Deploy to Vercel
2. Update environment variables in Vercel dashboard
3. Update Site URL and Redirect URLs for production domain
