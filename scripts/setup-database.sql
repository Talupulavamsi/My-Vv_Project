-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('earned', 'spent', 'purchased', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE group_member_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    age INTEGER,
    gender user_gender,
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
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    call_rates JSONB DEFAULT '{"video": 10, "audio": 5, "chat": 2}',
    stats JSONB DEFAULT '{"total_calls": 0, "total_minutes": 0, "total_gifts": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    member_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role group_member_role DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view other profiles" ON public.users;

DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group owners can update groups" ON public.groups;

DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;

-- Create RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view other profiles" ON public.users
    FOR SELECT USING (true);

-- Create RLS Policies for groups table
CREATE POLICY "Users can view groups they belong to" ON public.groups
    FOR SELECT USING (
        id IN (
            SELECT group_id FROM public.group_members 
            WHERE user_id = auth.uid()
        ) OR NOT is_private
    );

CREATE POLICY "Users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group owners can update groups" ON public.groups
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        auth.uid() IN (
            SELECT user_id FROM public.group_members 
            WHERE group_id = id AND role IN ('owner', 'admin')
        )
    );

-- Create RLS Policies for group_members table
CREATE POLICY "Users can view group memberships" ON public.group_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        group_id IN (
            SELECT group_id FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups" ON public.group_members
    FOR DELETE USING (
        user_id = auth.uid() OR 
        auth.uid() IN (
            SELECT user_id FROM public.group_members 
            WHERE group_id = group_members.group_id AND role IN ('owner', 'admin')
        )
    );

-- Create RLS Policies for transactions table
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        INSERT INTO public.users (
            id,
            email,
            display_name,
            coin_balance,
            is_online,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
            100,
            true,
            NOW(),
            NOW()
        );

        -- Add welcome bonus transaction
        INSERT INTO public.transactions (
            user_id,
            type,
            amount,
            description,
            created_at
        ) VALUES (
            NEW.id,
            'purchased',
            100,
            'Welcome bonus',
            NOW()
        );

    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update group member count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.groups 
        SET member_count = member_count + 1,
            updated_at = NOW()
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.groups 
        SET member_count = member_count - 1,
            updated_at = NOW()
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for group member count
DROP TRIGGER IF EXISTS update_group_member_count_on_insert ON public.group_members;
CREATE TRIGGER update_group_member_count_on_insert
    AFTER INSERT ON public.group_members
    FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

DROP TRIGGER IF EXISTS update_group_member_count_on_delete ON public.group_members;
CREATE TRIGGER update_group_member_count_on_delete
    AFTER DELETE ON public.group_members
    FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- Insert some sample data for demo purposes
INSERT INTO public.users (
    id,
    email,
    display_name,
    age,
    gender,
    location,
    languages,
    bio,
    photo_url,
    is_premium,
    coin_balance,
    rating,
    total_ratings,
    is_online,
    call_rates,
    stats
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'alice@example.com',
    'Alice Johnson',
    25,
    'female',
    'New York, USA',
    ARRAY['English', 'Spanish'],
    'Love connecting with people from around the world! 🌍',
    '/placeholder.svg?height=100&width=100',
    true,
    250,
    4.8,
    127,
    true,
    '{"video": 15, "audio": 8, "chat": 3}',
    '{"total_calls": 89, "total_minutes": 1240, "total_gifts": 23}'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'bob@example.com',
    'Bob Smith',
    30,
    'male',
    'London, UK',
    ARRAY['English', 'French'],
    'Professional voice coach and language enthusiast 🎤',
    '/placeholder.svg?height=100&width=100',
    false,
    180,
    4.9,
    203,
    false,
    '{"video": 12, "audio": 6, "chat": 2}',
    '{"total_calls": 156, "total_minutes": 2100, "total_gifts": 45}'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'carol@example.com',
    'Carol Davis',
    28,
    'female',
    'Tokyo, Japan',
    ARRAY['Japanese', 'English', 'Korean'],
    'Anime lover and cultural exchange enthusiast! ✨',
    '/placeholder.svg?height=100&width=100',
    true,
    320,
    4.7,
    89,
    true,
    '{"video": 18, "audio": 10, "chat": 4}',
    '{"total_calls": 67, "total_minutes": 890, "total_gifts": 12}'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample groups
INSERT INTO public.groups (
    id,
    name,
    description,
    photo_url,
    is_private,
    member_count,
    created_by
) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440001',
    'Language Exchange',
    'Practice languages with native speakers from around the world',
    '/placeholder.svg?height=100&width=100',
    false,
    3,
    '550e8400-e29b-41d4-a716-446655440001'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    'Voice Coaching',
    'Professional voice training and improvement sessions',
    '/placeholder.svg?height=100&width=100',
    false,
    2,
    '550e8400-e29b-41d4-a716-446655440002'
),
(
    '660e8400-e29b-41d4-a716-446655440003',
    'Anime & Culture',
    'Discuss anime, manga, and Japanese culture',
    '/placeholder.svg?height=100&width=100',
    true,
    1,
    '550e8400-e29b-41d4-a716-446655440003'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample group memberships
INSERT INTO public.group_members (group_id, user_id, role) VALUES 
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'owner'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'member'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'member'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'owner'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'member'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'owner')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Insert sample transactions
INSERT INTO public.transactions (user_id, type, amount, description) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'purchased', 100, 'Welcome bonus'),
('550e8400-e29b-41d4-a716-446655440001', 'earned', 50, 'Voice call completed'),
('550e8400-e29b-41d4-a716-446655440001', 'purchased', 200, 'Coin purchase'),
('550e8400-e29b-41d4-a716-446655440002', 'purchased', 100, 'Welcome bonus'),
('550e8400-e29b-41d4-a716-446655440002', 'earned', 80, 'Coaching session'),
('550e8400-e29b-41d4-a716-446655440003', 'purchased', 100, 'Welcome bonus'),
('550e8400-e29b-41d4-a716-446655440003', 'earned', 120, 'Premium call session')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, groups, group_members, transactions';
    RAISE NOTICE 'RLS policies enabled and configured';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'You can now use the VoiceVibe app with Supabase!';
END $$;
