-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  location TEXT,
  languages TEXT[] DEFAULT '{}',
  bio TEXT DEFAULT '',
  photo_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  coin_balance INTEGER DEFAULT 100,
  total_earnings INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  call_rates JSONB DEFAULT '{"video": 10, "audio": 5, "chat": 2}',
  stats JSONB DEFAULT '{"total_calls": 0, "total_minutes": 0, "total_gifts": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  category TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  features TEXT[] DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  online_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('earned', 'spent', 'purchased', 'withdrawn')) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants UUID[] NOT NULL,
  participant_names JSONB DEFAULT '{}',
  participant_photos JSONB DEFAULT '{}',
  last_message TEXT DEFAULT '',
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  last_message_sender UUID,
  unread_count JSONB DEFAULT '{}',
  type TEXT CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_photo TEXT,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('text', 'image', 'audio', 'video', 'file', 'gift')) DEFAULT 'text',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read_by UUID[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ
);

-- Insert sample groups
INSERT INTO groups (name, description, category, is_premium, features, member_count, online_count) VALUES
('VIP Language Exchange 🌍', 'Exclusive language practice with verified native speakers', 'Education', TRUE, '["HD Video Calls", "AI Translation", "Priority Support"]', 247, 89),
('Tech Innovators 💻', 'Premium tech discussions with industry leaders', 'Technology', TRUE, '["Expert Sessions", "Code Reviews", "Job Opportunities"]', 856, 134),
('Music Creators Studio 🎵', 'Collaborate with musicians and producers worldwide', 'Entertainment', FALSE, '["Music Sharing", "Live Jam Sessions", "Feedback Exchange"]', 1341, 256),
('Elite Fitness Club 💪', 'Premium fitness coaching and nutrition guidance', 'Health', TRUE, '["Personal Trainers", "Meal Plans", "Progress Tracking"]', 678, 123),
('Global Business Network 📈', 'Connect with entrepreneurs and business leaders', 'Business', TRUE, '["Networking Events", "Investment Opportunities", "Mentorship"]', 2341, 456),
('Art & Design Community 🎨', 'Share and discover amazing artwork and designs', 'Art', FALSE, '["Portfolio Sharing", "Design Challenges", "Critiques"]', 1567, 234);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view group memberships" ON group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view conversations they're part of" ON conversations FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND auth.uid() = ANY(conversations.participants)
  )
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
