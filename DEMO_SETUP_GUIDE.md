# 🚀 VoiceVibe - Demo Mode & Supabase Setup

## 🎯 Current Status: Demo Mode Active

The app is currently running in **Demo Mode** with mock data. This allows you to explore all features without a database connection.

### ✨ Demo Features Available:
- ✅ User authentication (simulated)
- ✅ Browse groups and users
- ✅ Coin transactions
- ✅ Profile management
- ✅ All UI components and interactions

---

## 🔧 Setting Up Real Supabase Database

To enable full functionality with real data persistence:

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up with: `talupulavamsi49@gmail.com`
3. Password: `vamsi@672`
4. Create new project: "VoiceVibe"

### Step 2: Get Credentials
1. Go to **Settings** → **API**
2. Copy:
   - Project URL
   - Anon public key

### Step 3: Update Environment
Create `.env.local`:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

### Step 4: Run Database Setup
1. Go to **SQL Editor** in Supabase
2. Run the script from `scripts/setup-supabase.sql`

### Step 5: Deploy
- The app will automatically switch from demo mode to real database mode
- All features will work with persistent data

---

## 🎮 Demo Mode Features

### Authentication
- Sign up/Sign in works with any email/password
- Google OAuth simulated
- User profiles created instantly

### Groups
- 6 sample groups with different categories
- Premium/Free group types
- Join requests simulated

### Wallet System
- Coin transactions tracked
- Purchase/withdrawal simulated
- Transaction history maintained

### User Discovery
- Sample users with profiles
- Online status indicators
- Call rate information

---

## 🔄 Switching Modes

The app automatically detects:
- **Demo Mode**: When Supabase credentials are missing
- **Live Mode**: When proper credentials are configured

No code changes needed - just environment variables!

---

## 📱 Try It Now

1. **Sign Up**: Use any email/password
2. **Explore Groups**: Browse and join communities
3. **Check Wallet**: View transactions and balance
4. **Discover Users**: See online users and profiles
5. **Update Profile**: Edit your information

Everything works seamlessly in demo mode! 🎉
