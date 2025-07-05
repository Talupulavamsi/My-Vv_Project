-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  category TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  features TEXT[] DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  online_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('earned', 'spent', 'purchased', 'withdrawn')) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Create call_sessions table
CREATE TABLE IF NOT EXISTS public.call_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  caller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('video', 'audio')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'ended', 'missed', 'declined')) DEFAULT 'pending',
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration INTEGER DEFAULT 0,
  cost INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample groups
INSERT INTO public.groups (name, description, category, is_premium, features, member_count, online_count) VALUES
('VIP Language Exchange 🌍', 'Exclusive language practice with verified native speakers', 'Education', TRUE, '["HD Video Calls", "AI Translation", "Priority Support"]', 247, 89),
('Tech Innovators 💻', 'Premium tech discussions with industry leaders', 'Technology', TRUE, '["Expert Sessions", "Code Reviews", "Job Opportunities"]', 856, 134),
('Music Creators Studio 🎵', 'Collaborate with musicians and producers worldwide', 'Entertainment', FALSE, '["Music Sharing", "Live Jam Sessions", "Feedback Exchange"]', 1341, 256),
('Elite Fitness Club 💪', 'Premium fitness coaching and nutrition guidance', 'Health', TRUE, '["Personal Trainers", "Meal Plans", "Progress Tracking"]', 678, 123),
('Global Business Network 📈', 'Connect with entrepreneurs and business leaders', 'Business', TRUE, '["Networking Events", "Investment Opportunities", "Mentorship"]', 2341, 456),
('Art & Design Community 🎨', 'Share and discover amazing artwork and designs', 'Art', FALSE, '["Portfolio Sharing", "Design Challenges", "Critiques"]', 1567, 234);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups policies
CREATE POLICY "Anyone can view groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group creators can update their groups" ON public.groups FOR UPDATE USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Users can view group memberships" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.group_members FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view conversations they're part of" ON public.conversations FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participants));
CREATE POLICY "Users can update conversations they're part of" ON public.conversations FOR UPDATE USING (auth.uid() = ANY(participants));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND auth.uid() = ANY(conversations.participants)
  )
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);

-- Call sessions policies
CREATE POLICY "Users can view their call sessions" ON public.call_sessions FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create call sessions" ON public.call_sessions FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Users can update their call sessions" ON public.call_sessions FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Create functions for automatic user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update member count when someone joins/leaves a group
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE public.groups 
    SET member_count = member_count + 1 
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
    UPDATE public.groups 
    SET member_count = member_count + 1 
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.groups 
    SET member_count = member_count - 1 
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE public.groups 
    SET member_count = member_count - 1 
    WHERE id = OLD.group_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for group member count updates
CREATE OR REPLACE TRIGGER on_group_member_change
  AFTER INSERT OR UPDATE OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- Create function to update conversation last message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    last_message = NEW.content,
    last_message_time = NEW.timestamp,
    last_message_sender = NEW.sender_id,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for conversation updates
CREATE OR REPLACE TRIGGER on_message_sent
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();
