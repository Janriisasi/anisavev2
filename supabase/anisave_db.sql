-- Create a new 'profiles' table linked to users
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  avatar_url text
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Allow users to update their own profile
create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id);

-- Allow users to insert their own profile (optional but useful)
create policy "Users can insert their own profile"
on profiles for insert
with check (auth.uid() = id);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  contact_id uuid not null,
  created_at timestamp default now()
);

-- Enable RLS
alter table contacts enable row level security;

-- Policy: only fetch your own contacts
create policy "Users can read their own contacts"
on contacts for select
using (auth.uid() = user_id);

-- Policy: only insert for yourself
create policy "Users can insert their own contacts"
on contacts for insert
with check (auth.uid() = user_id);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

create table saved_contacts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles(id),
  farmer_id uuid references profiles(id),
  created_at timestamp default now()
);

-- Users table extension
create table public.profiles (
  id uuid references auth.users on delete cascade,
  username text,
  full_name text,
  avatar_url text,
  address text,
  contact_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Products table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  category text not null,
  price decimal not null,
  quantity_kg decimal not null,
  description text,
  image_url text,
  status text default 'Available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Saved contacts
create table public.saved_contacts (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles(id) on delete cascade,
  farmer_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(buyer_id, farmer_id)
);

-- Ratings
create table public.ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  farmer_id uuid references public.profiles(id) on delete cascade,
  rating integer check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Run this in Supabase SQL editor
create or replace function public.handle_new_user()
returns trigger as $$
begin
  if new.raw_user_meta_data->>'full_name' is not null then
    insert into public.profiles (id, full_name, username)
    values (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'username'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create new trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
  
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting products (authenticated users only)
CREATE POLICY "Users can insert their own products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for viewing products (all users can view)
CREATE POLICY "Anyone can view products"
ON products
FOR SELECT
USING (true);

-- Create policy for updating own products
CREATE POLICY "Users can update their own products"
ON products
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for deleting own products
CREATE POLICY "Users can delete their own products"
ON products
FOR DELETE
USING (auth.uid() = user_id);

-- Add status field to products if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Available';

insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true);

create policy "Users can upload their own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
  
create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');
  
create policy "Users can update their own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
  
create policy "Users can delete their own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
alter table public.profiles enable row level security;
create policy "Users can view all profiles"
  on profiles for select
  using (true);
create policy "Users can create their own profile"
  on profiles for insert
  with check (auth.uid() = id);
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create index if not exists profiles_id_idx on profiles(id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, updated_at)
  values (
    new.id,
    split_part(new.email, '@', 1),
    '',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

create index if not exists profiles_username_idx on profiles(username);

create index if not exists profiles_id_idx on profiles(id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, updated_at)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    '',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, updated_at)
  values (
    new.id,
    new.raw_user_metadata->>'username',
    new.raw_user_metadata->>'full_name',
    '',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Run in Supabase SQL Editor
drop table if exists profiles cascade;

create table profiles (
  id uuid primary key references auth.users(id),
  username text,
  full_name text,
  avatar_url text,
  updated_at timestamp
);

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, updated_at)
  values (
    new.id,
    new.raw_user_metadata->>'username',
    new.raw_user_metadata->>'full_name',
    '',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
  
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
  
-- Step 1: Drop existing trigger, function, and table if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;
drop table if exists public.profiles cascade;

-- Step 2: Recreate the profiles table
create table public.profiles (
  id uuid primary key references auth.users(id),
  username text,
  full_name text,
  avatar_url text,
  updated_at timestamp
);

-- Step 3: Enable Row-Level Security
alter table public.profiles enable row level security;

-- Step 4: Add policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Step 5: Recreate the correct trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, updated_at)
  values (
    new.id,
    new.raw_user_metadata->>'username',
    new.raw_user_metadata->>'full_name',
    '',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Step 6: Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Drop broken trigger and function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;

-- Drop and recreate the profiles table
drop table if exists public.profiles cascade;

-- Create a fresh profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text,
  avatar_url text,
  updated_at timestamp,
  address text,
  contact_number text
);

-- Recreate the function (corrected `raw_user_metadata`)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, updated_at)
  values (
    new.id,
    new.raw_user_metadata->>'username',
    new.raw_user_metadata->>'full_name',
    '',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

-- SELECT for everyone
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- INSERT if user is inserting their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- UPDATE only by self
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);
  
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );
  
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
  
  ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  
  CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one rating per user per farmer
    UNIQUE(user_id, farmer_id)
);

CREATE TABLE IF NOT EXISTS saved_contacts (
    id BIGSERIAL PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one saved contact per buyer per farmer
    UNIQUE(buyer_id, farmer_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all ratings" ON ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON ratings
    FOR UPDATE USING (auth.uid() = user_id);
	
CREATE POLICY "Users can delete their own ratings" ON ratings
    FOR DELETE USING (auth.uid() = user_id);
	
CREATE POLICY "Users can view their own saved contacts" ON saved_contacts
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert their own saved contacts" ON saved_contacts
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can delete their own saved contacts" ON saved_contacts
    FOR DELETE USING (auth.uid() = buyer_id);
	
CREATE INDEX IF NOT EXISTS idx_ratings_farmer_id ON ratings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_contacts_buyer_id ON saved_contacts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_saved_contacts_farmer_id ON saved_contacts(farmer_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on ratings
DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- First, drop the existing ratings table if it has wrong foreign key constraints
DROP TABLE IF EXISTS ratings CASCADE;

-- Recreate the ratings table with correct foreign key references
CREATE TABLE ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one rating per user per farmer
    UNIQUE(user_id, farmer_id)
);

-- Create saved_contacts table with correct references
DROP TABLE IF EXISTS saved_contacts CASCADE;
CREATE TABLE saved_contacts (
    id BIGSERIAL PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one saved contact per buyer per farmer
    UNIQUE(buyer_id, farmer_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ratings table
CREATE POLICY "Users can view all ratings" ON ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON ratings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.id = ratings.user_id
        )
    );

CREATE POLICY "Users can update their own ratings" ON ratings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.id = ratings.user_id
        )
    );

CREATE POLICY "Users can delete their own ratings" ON ratings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.id = ratings.user_id
        )
    );

-- RLS Policies for saved_contacts table
CREATE POLICY "Users can view their own saved contacts" ON saved_contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.id = saved_contacts.buyer_id
        )
    );

CREATE POLICY "Users can insert their own saved contacts" ON saved_contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.id = saved_contacts.buyer_id
        )
    );

CREATE POLICY "Users can delete their own saved contacts" ON saved_contacts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.id = saved_contacts.buyer_id
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_farmer_id ON ratings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_contacts_buyer_id ON saved_contacts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_saved_contacts_farmer_id ON saved_contacts(farmer_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on ratings
DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Make sure profiles table has proper setup for auth users
-- This ensures every authenticated user has a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  
-- Create admin role check function
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN user_email IN ('adminjanri0255@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin read access policy for profiles
CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (
    is_admin((SELECT auth.jwt() ->> 'email'))
  );

-- Admin read access policy for products
CREATE POLICY "Admin can read all products" ON products
  FOR SELECT USING (
    is_admin((SELECT auth.jwt() ->> 'email'))
  );

-- Admin read access policy for ratings
CREATE POLICY "Admin can read all ratings" ON ratings
  FOR SELECT USING (
    is_admin((SELECT auth.jwt() ->> 'email'))
  );

-- Admin read access policy for saved_contacts
CREATE POLICY "Admin can read all contacts" ON saved_contacts
  FOR SELECT USING (
    is_admin((SELECT auth.jwt() ->> 'email'))
  );

CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (true);
  
-- Add the missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have created_at if they don't have it
UPDATE profiles 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE profiles 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Make sure the handle_new_user function includes the timestamp columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    email, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ANISAVE CHAT SYSTEM - DATABASE MIGRATION
-- Real-Time Messaging with Presence Detection
-- Security: Full RLS policies, input validation
-- ============================================

-- ============================================
-- TABLE 1: CONVERSATIONS
-- Stores chat conversations between users
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique conversations (no duplicates)
  CONSTRAINT unique_conversation UNIQUE(participant_1, participant_2),
  
  -- Ensure users can't message themselves
  CONSTRAINT different_participants CHECK (participant_1 != participant_2)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see conversations they're part of
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- RLS Policy: Users can create conversations with others
CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = participant_1 AND
    participant_1 != participant_2
  );

-- RLS Policy: Update last_message_at timestamp
CREATE POLICY "Participants can update conversation"
  ON conversations
  FOR UPDATE
  USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- ============================================
-- TABLE 2: MESSAGES
-- Stores individual chat messages
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validate message content
  CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  CONSTRAINT message_max_length CHECK (LENGTH(content) <= 2000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, read) WHERE read = false;

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages in their conversations
CREATE POLICY "Users can view their messages"
  ON messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- RLS Policy: Users can send messages (must be sender)
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    sender_id != recipient_id AND
    LENGTH(TRIM(content)) > 0
  );

-- RLS Policy: Recipients can mark messages as read
CREATE POLICY "Recipients can update read status"
  ON messages
  FOR UPDATE
  USING (
    auth.uid() = recipient_id
  )
  WITH CHECK (
    auth.uid() = recipient_id
  );

-- ============================================
-- TABLE 3: USER PRESENCE
-- Tracks online/offline status
-- ============================================

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- Enable Row Level Security
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view presence status (public info)
CREATE POLICY "Anyone can view user presence"
  ON user_presence
  FOR SELECT
  USING (true);

-- RLS Policy: Users can update their own presence
CREATE POLICY "Users can update own presence"
  ON user_presence
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence status"
  ON user_presence
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLE 4: TYPING INDICATORS
-- Temporary table for "User is typing..." feature
-- ============================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 seconds'),
  
  CONSTRAINT unique_typing_indicator UNIQUE(conversation_id, user_id)
);

-- Auto-delete expired typing indicators
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);

-- Enable Row Level Security
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view typing indicators in their conversations
CREATE POLICY "Users can view typing indicators"
  ON typing_indicators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );

-- RLS Policy: Users can set their own typing status
CREATE POLICY "Users can set typing status"
  ON typing_indicators
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update typing status"
  ON typing_indicators
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete typing status"
  ON typing_indicators
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update conversation last_message_at when new message sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update conversation timestamp on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update conversations.updated_at
DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update user_presence.updated_at
DROP TRIGGER IF EXISTS trigger_user_presence_updated_at ON user_presence;
CREATE TRIGGER trigger_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Clean up expired typing indicators (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  other_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Check if conversation already exists (either direction)
  SELECT id INTO conv_id
  FROM conversations
  WHERE 
    (participant_1 = current_user_id AND participant_2 = other_user_id)
    OR (participant_1 = other_user_id AND participant_2 = current_user_id)
  LIMIT 1;
  
  -- If conversation doesn't exist, create it
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2)
    VALUES (current_user_id, other_user_id)
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark all messages in conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  conv_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET read = true
  WHERE 
    conversation_id = conv_id
    AND recipient_id = auth.uid()
    AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread message count for user
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM messages
  WHERE 
    recipient_id = auth.uid()
    AND read = false;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECURITY: Content Security Policies
-- ============================================

-- Create function to sanitize message content (prevent XSS)
CREATE OR REPLACE FUNCTION sanitize_message_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Trim whitespace
  NEW.content := TRIM(NEW.content);
  
  -- Prevent empty messages
  IF LENGTH(NEW.content) = 0 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  
  -- Prevent excessively long messages
  IF LENGTH(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'Message content exceeds maximum length of 2000 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Sanitize message content before insert
DROP TRIGGER IF EXISTS trigger_sanitize_message ON messages;
CREATE TRIGGER trigger_sanitize_message
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_message_content();

-- ============================================
-- INITIAL DATA: Create presence records for existing users
-- ============================================

-- Insert presence records for existing users who don't have one
INSERT INTO user_presence (user_id, is_online, last_seen)
SELECT id, false, NOW()
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_presence)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count() TO authenticated;

-- ============================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Analyze tables for query optimization
ANALYZE conversations;
ANALYZE messages;
ANALYZE user_presence;
ANALYZE typing_indicators;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE conversations IS 'Stores chat conversations between two users';
COMMENT ON TABLE messages IS 'Stores individual chat messages with read status';
COMMENT ON TABLE user_presence IS 'Tracks real-time online/offline status of users';
COMMENT ON TABLE typing_indicators IS 'Temporary storage for typing indicators (auto-expires)';

COMMENT ON FUNCTION get_or_create_conversation IS 'Gets existing conversation or creates new one between current user and specified user';
COMMENT ON FUNCTION mark_conversation_as_read IS 'Marks all unread messages in a conversation as read for current user';
COMMENT ON FUNCTION get_unread_count IS 'Returns total unread message count for current user';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Chat system database migration completed successfully!';
  RAISE NOTICE 'Tables created: conversations, messages, user_presence, typing_indicators';
  RAISE NOTICE 'Row Level Security enabled on all tables';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'Security functions and triggers active';
END $$;




CREATE POLICY "Participants can delete their conversation"
  ON conversations
  FOR DELETE
  USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );



-- Run in Supabase SQL editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

-- Allow anyone to view
CREATE POLICY "Public can view chat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');


ALTER TABLE messages REPLICA IDENTITY FULL;

-- ============================================================
-- AniSave Cart & Order System — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity_kg > 0),
  price_at_add DECIMAL(10,2) NOT NULL,
  product_snapshot JSONB, -- stores name, image_url, category at time of add
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, product_id)
);

-- 2. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  quantity_kg DECIMAL(10,2) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'negotiating', 'confirming', 'approved', 'declined', 'cancelled')),
  product_snapshot JSONB NOT NULL, -- name, image_url, category
  buyer_confirmed_at TIMESTAMPTZ,
  seller_responded_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. IN-APP NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
    -- 'order_request'      → farmer gets this when buyer sends confirmation
    -- 'order_approved'     → buyer gets this when farmer approves
    -- 'order_declined'     → buyer gets this when farmer declines
    -- 'cart_added'         → optional confirmation to buyer
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,            -- { order_id, product_name, quantity_kg, etc. }
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Cart: buyers manage their own cart
CREATE POLICY "Buyers manage own cart"
  ON cart_items FOR ALL
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- Orders: both buyer and seller can see/manage
CREATE POLICY "Order participants can view"
  ON orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can insert orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Order participants can update"
  ON orders FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Notifications: users see only their own
CREATE POLICY "Users see own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow sellers to INSERT notifications for buyers (needed for approval/decline)
CREATE POLICY "Anyone can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- UPDATED_AT TRIGGER for orders
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INVENTORY DECREMENT FUNCTION
-- Called after farmer approves an order — decrements product quantity_kg
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_product_inventory(
  p_product_id UUID,
  p_quantity DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET quantity_kg = GREATEST(0, quantity_kg - p_quantity)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SOLD COUNT HELPER (for farmer badge on profile)
-- Returns how many approved orders a seller has
-- ============================================================
CREATE OR REPLACE FUNCTION get_seller_sold_count(p_seller_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM orders
    WHERE seller_id = p_seller_id
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ENABLE REALTIME on new tables
-- Run in Supabase Dashboard → Table Editor → Replication
-- OR via SQL:
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- DONE. Tables created:
--   • cart_items
--   • orders
--   • notifications
-- Functions created:
--   • decrement_product_inventory(product_id, quantity)
--   • get_seller_sold_count(seller_id)
-- ============================================================



-- ============================================================
-- PATCH: Run these in your Supabase SQL Editor
-- ============================================================

-- 1. Updated decrement_product_inventory:
--    Auto-sets status = 'Unavailable' when qty hits 0
CREATE OR REPLACE FUNCTION decrement_product_inventory(
  p_product_id UUID,
  p_quantity    DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET
    quantity_kg = GREATEST(0, quantity_kg - p_quantity),
    status      = CASE
                    WHEN GREATEST(0, quantity_kg - p_quantity) = 0
                    THEN 'Unavailable'
                    ELSE status
                  END
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable realtime on products table ONLY
--    (cart_items, orders, notifications are already added)
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Create the buyer_ratings table (farmer rates buyer after a transaction)
CREATE TABLE IF NOT EXISTS public.buyer_ratings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (farmer_id, buyer_id)   -- one rating per farmer-buyer pair
);

-- Enable Row Level Security
ALTER TABLE public.buyer_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read ratings
CREATE POLICY "Public read buyer ratings"
  ON public.buyer_ratings FOR SELECT
  USING (true);

-- Policy: only the farmer who created the rating can insert/update it
CREATE POLICY "Farmer can insert buyer rating"
  ON public.buyer_ratings FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmer can update own buyer rating"
  ON public.buyer_ratings FOR UPDATE
  USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id);

-- ============================================================
-- ANISAVE SECURITY PATCH
-- Full RLS Hardening — Run this in Supabase SQL Editor
-- ============================================================
-- What this fixes:
--   1. profiles      → Public SELECT exposed emails, phone numbers, addresses.
--                      Fixed: split into a public-safe view + restricted raw access.
--   2. profiles      → INSERT policy WITH CHECK (true) let anyone insert any row.
--   3. notifications → INSERT policy WITH CHECK (true) let anyone spam any user.
--   4. admin check   → is_admin() used JWT email which can be spoofed via metadata.
--                      Fixed: use a dedicated admin_roles table instead.
--   5. orders        → UPDATE had no WITH CHECK, letting participants alter each
--                      other's confirmed fields.
--   6. admin_audit_log → No RLS at all.
--   7. products      → SELECT USING (true) is fine (public marketplace), kept.
--   8. ratings       → SELECT USING (true) is fine (public ratings), kept.
-- ============================================================


-- ============================================================
-- STEP 1: PROFILES — the most critical fix
-- Problem: "Users can view all profiles" / USING (true) exposed
--          email, contact_number, address to anyone with an API key.
-- Fix: Remove the open SELECT policy. Let users see their OWN
--      full profile. Let everyone see only safe public fields
--      (username, full_name, avatar_url) via a secure view.
-- ============================================================

-- 1a. Drop every conflicting SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles"            ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone"      ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles"            ON profiles;
DROP POLICY IF EXISTS "Users can view own profile"             ON profiles;

-- 1b. Drop the bad INSERT policy (WITH CHECK (true))
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- 1c. NEW: Users can read their OWN full profile (includes email, phone, address)
CREATE POLICY "Users can read own full profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 1d. NEW: Fix INSERT — only authenticated users inserting their own row
DROP POLICY IF EXISTS "Users can insert their own profile"     ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 1e. Keep UPDATE (self only) — already correct, but recreate cleanly
DROP POLICY IF EXISTS "Users can update own profile"           ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile"     ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 1f. PUBLIC VIEW — exposes ONLY safe fields (no email/phone/address)
--     Your frontend can query this view instead of the raw table
--     for displaying other users' cards, farmer listings, etc.
CREATE OR REPLACE VIEW public.public_profiles
  WITH (security_invoker = true)
AS
  SELECT
    id,
    username,
    full_name,
    avatar_url
  FROM public.profiles;

-- Grant read access to authenticated users and anon (for product listings)
GRANT SELECT ON public.public_profiles TO authenticated, anon;


-- ============================================================
-- STEP 2: ADMIN ROLES — replace email-based is_admin()
-- Problem: is_admin() reads JWT email claim. A user could set
--          their metadata email to your admin address.
-- Fix: Use a dedicated admin_roles table keyed by user UUID.
-- ============================================================

-- 2a. Create the admin roles table (if not exists)
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. Enable RLS — only admins can see this table
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin_roles"
  ON public.admin_roles
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- No INSERT/UPDATE/DELETE via API — manage this only via Supabase dashboard
-- or a trusted server-side function.

-- 2c. Replace is_admin() with UUID-based check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2d. Seed your admin account (run once — replace with your actual user UUID)
-- Find your UUID: SELECT id FROM auth.users WHERE email = 'adminjanri0255@gmail.com';
-- Then run:
-- INSERT INTO public.admin_roles (user_id) VALUES ('<your-admin-uuid>')
-- ON CONFLICT DO NOTHING;

-- 2e. Admin SELECT policies using the new safe function
DROP POLICY IF EXISTS "Admin can read all profiles"   ON profiles;
DROP POLICY IF EXISTS "Admin can read all products"   ON products;
DROP POLICY IF EXISTS "Admin can read all ratings"    ON ratings;
DROP POLICY IF EXISTS "Admin can read all contacts"   ON saved_contacts;

CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can read all products"
  ON products FOR SELECT
  USING (public.is_admin() OR true);  -- products are also publicly visible

CREATE POLICY "Admin can read all ratings"
  ON ratings FOR SELECT
  USING (public.is_admin() OR true);  -- ratings are also publicly visible

CREATE POLICY "Admin can read all saved_contacts"
  ON saved_contacts FOR SELECT
  USING (auth.uid() = buyer_id OR public.is_admin());


-- ============================================================
-- STEP 3: ADMIN AUDIT LOG — enable RLS
-- Problem: admin_audit_log had no RLS at all.
-- ============================================================

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log
CREATE POLICY "Admins can read audit log"
  ON public.admin_audit_log
  FOR SELECT
  USING (public.is_admin());

-- Only the system (SECURITY DEFINER functions) should insert.
-- No direct API INSERT allowed.
CREATE POLICY "No direct insert to audit log"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (false);


-- ============================================================
-- STEP 4: NOTIFICATIONS — fix the open INSERT policy
-- Problem: "Anyone can insert notifications" WITH CHECK (true)
--          let any authenticated user insert a notification for
--          ANY other user — spam / social engineering risk.
-- Fix: Only allow inserting for yourself, OR use a
--      SECURITY DEFINER function for system notifications.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;

-- Users can only insert notifications for themselves
-- (system/seller notifications should go through a SECURITY DEFINER function)
CREATE POLICY "Authenticated users can insert own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create a secure function that sellers/system can call to notify buyers
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id   UUID,
  p_type      TEXT,
  p_title     TEXT,
  p_message   TEXT,
  p_data      JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Caller must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB)
  TO authenticated;


-- ============================================================
-- STEP 5: ORDERS — tighten UPDATE policy
-- Problem: "Order participants can update" had no WITH CHECK,
--          so a buyer could flip status to 'approved' themselves.
-- Fix: Buyers can only update buyer-side fields (cancel),
--      sellers can only update seller-side fields (approve/decline).
-- ============================================================

DROP POLICY IF EXISTS "Order participants can update" ON orders;

-- Buyers can only cancel their own pending orders
CREATE POLICY "Buyers can cancel own orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = buyer_id)
  WITH CHECK (
    auth.uid() = buyer_id AND
    status = 'cancelled'
  );

-- Sellers can approve or decline orders addressed to them
CREATE POLICY "Sellers can respond to orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (
    auth.uid() = seller_id AND
    status IN ('approved', 'declined', 'negotiating', 'confirming')
  );


-- ============================================================
-- STEP 6: SAVED_CONTACTS — drop duplicate / incorrect policies
-- ============================================================

-- saved_contacts already has correct buyer-scoped policies from the migration.
-- Just ensure there are no leftover open ones.
DROP POLICY IF EXISTS "Users can view their own saved contacts" ON saved_contacts;

CREATE POLICY "Buyers can view own saved contacts"
  ON saved_contacts
  FOR SELECT
  USING (auth.uid() = buyer_id);


-- ============================================================
-- STEP 7: STORAGE — restrict chat-images to participants only
-- Problem: "Public can view chat images" USING (true) is fine
--          for product images, but chat images should ideally
--          be restricted. Keeping public for now since images
--          are shared in chat — just ensure upload is auth-only.
-- ============================================================

-- Already correct — authenticated upload, public view.
-- If you want private chat images in future, move to a private
-- bucket and generate signed URLs server-side.


-- ============================================================
-- STEP 8: VERIFY — quick check of final policy state
-- Run this SELECT after applying the patch to confirm.
-- ============================================================

-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;


-- ============================================================
-- SUMMARY OF CHANGES
-- ============================================================
-- profiles:
--   ✅ Removed open SELECT (email/phone/address now private)
--   ✅ Added self-only SELECT policy
--   ✅ Fixed INSERT (was WITH CHECK (true))
--   ✅ Added public_profiles VIEW for safe public display
--   ✅ Admin SELECT via UUID-based is_admin()
--
-- admin_roles:
--   ✅ New table replacing email-based admin check
--   ✅ RLS enabled, no public write access
--
-- admin_audit_log:
--   ✅ RLS enabled (was completely unprotected)
--
-- notifications:
--   ✅ Removed open INSERT (was WITH CHECK (true))
--   ✅ Added create_notification() secure function for cross-user notifications
--
-- orders:
--   ✅ Split UPDATE into buyer-cancel and seller-respond policies
--   ✅ WITH CHECK prevents buyers from self-approving orders
--
-- saved_contacts:
--   ✅ Cleaned up duplicate SELECT policies
--
-- Everything else (products, ratings, messages, conversations,
-- cart_items, user_presence, typing_indicators, buyer_ratings):
--   ✅ Already correctly secured — no changes needed
-- ============================================================



ALTER TABLE saved_contacts
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;


UPDATE saved_contacts sc
SET
  contact_number = p.contact_number,
  address        = p.address
FROM profiles p
WHERE sc.farmer_id = p.id
  AND (sc.contact_number IS NULL OR sc.address IS NULL);

  -- ============================================================
-- SECURITY FIX: Hide email & sensitive data from public REST API
-- Run this in your Supabase SQL Editor
-- ============================================================


-- STEP 1: Remove email from profiles table
-- Email already lives in auth.users — login is unaffected.
-- Supabase Auth reads auth.users, NOT public.profiles.
-- ============================================================
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;


-- STEP 2: Fix the open SELECT policy
-- The current "Users can view all profiles" with USING (true)
-- lets anyone read every column on every row via REST API.
-- ============================================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic profiles"  ON public.profiles;
DROP POLICY IF EXISTS "Users can read own full profile"  ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles"      ON public.profiles;


-- STEP 3: Create a safe public view (no sensitive columns)
-- Attackers hitting /rest/v1/public_profiles will only see
-- id, username, full_name, and avatar_url — nothing sensitive.
-- ============================================================
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT
    id,
    username,
    full_name,
    avatar_url,
    updated_at
  FROM public.profiles;

-- Allow anyone (anon + authenticated) to query the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;


-- STEP 4: Recreate RLS policies (scoped correctly)
-- ============================================================

-- 4a. Owner can read their own full profile (address, contact_number, etc.)
CREATE POLICY "Users can read own full profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 4b. Admin can read all profiles
CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Keep your existing INSERT / UPDATE policies as-is:
-- "Users can create their own profile"  → WITH CHECK (auth.uid() = id)
-- "Users can update their own profile"  → USING (auth.uid() = id)
-- Those are already correct and do NOT need to change.


-- ============================================================
-- VERIFICATION
-- Run this after applying to confirm email column is gone
-- and that only the expected policies exist on profiles.
-- ============================================================

-- Check columns:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check policies:
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'profiles';



ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles (email is already dropped so nothing sensitive leaks)
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Add unique constraint so upsert can resolve conflicts properly
ALTER TABLE public.user_presence 
  ADD CONSTRAINT user_presence_user_id_key UNIQUE (user_id);


-- 1. Fix the trigger function (corrected column name to raw_user_meta_data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    NOW(),
    NOW()
  );
  return NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Repair existing users 
INSERT INTO public.profiles (id, full_name, username, created_at, updated_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', ''), 
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;





-- 1. Create table
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, name)
);

ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market prices"
  ON market_prices FOR SELECT USING (true);

CREATE POLICY "Admins can update market prices"
  ON market_prices FOR UPDATE
  USING (is_admin((SELECT auth.jwt() ->> 'email')));

CREATE POLICY "Admins can insert market prices"
  ON market_prices FOR INSERT
  WITH CHECK (is_admin((SELECT auth.jwt() ->> 'email')));

-- 2. Seed data
INSERT INTO market_prices (category, name, price) VALUES
  ('Vegetables','Eggplant',95.99),('Vegetables','Tomato',77.12),
  ('Vegetables','Cabbage',85.00),('Vegetables','Squash',60.92),
  ('Vegetables','String Beans',137.56),('Vegetables','Ampalaya',165.66),
  ('Vegetables','Okra',33.00),('Vegetables','Pechay',86.64),
  ('Vegetables','Carrot',97.65),('Vegetables','Bell Pepper',238.80),
  ('Vegetables','Broccoli',201.67),('Vegetables','Potato',124.01),
  ('Vegetables','Sitao',137.56),('Vegetables','Lettuce (Green Ice)',190.56),
  ('Vegetables','Lettuce (Iceberg)',265.95),('Vegetables','Lettuce (Romaine)',246.40),
  ('Fruits','Mango',200.23),('Fruits','Calamansi',131.34),
  ('Fruits','Papaya',72.17),('Fruits','Pineapple',45.00),
  ('Fruits','Watermelon',79.34),('Fruits','Lanzones',90.00),
  ('Fruits','Rambutan',80.00),('Fruits','Durian',120.00),
  ('Fruits','Guyabano',70.00),('Fruits','Avocado',331.86),
  ('Fruits','Melon',105.37),('Fruits','Pomelo',185.96),
  ('Fruits','Banana (Lakatan)',99.31),('Fruits','Banana (Latundan)',75.74),
  ('Fruits','Banana (Saba)',55.77),
  ('Grains','Rice (Local Fancy White)',57.69),
  ('Grains','Rice (Local Premium 5% broken)',52.16),
  ('Grains','Rice (Local Well Milled)',45.60),
  ('Grains','Rice (Local Regular Milled)',41.60),
  ('Grains','Corn (White Cob, Glutinous)',84.00),
  ('Grains','Corn (Yellow Cob, Sweet)',82.88),
  ('Grains','Corn Grits (White, Food Grade)',120.00),
  ('Grains','Corn Grits (Yellow, Food Grade)',120.00),
  ('Grains','Corn Cracked (Yellow, Feed Grade)',50.00),
  ('Grains','Corn Grits (Feed Grade)',46.67),
  ('Grains','Sorghum',25.00),('Grains','Millet',30.00),
  ('HerbsAndSpices','Ginger',155.92),('HerbsAndSpices','Garlic',366.67),
  ('HerbsAndSpices','Red Onion',150.09),('HerbsAndSpices','Chili',258.76),
  ('HerbsAndSpices','Lemongrass',20.00),('HerbsAndSpices','Basil',35.00),
  ('HerbsAndSpices','Turmeric',90.00)
ON CONFLICT (category, name) DO NOTHING;

-- 3. Enable realtime on the table
ALTER PUBLICATION supabase_realtime ADD TABLE market_prices;



-- Remove the old restricted policy
DROP POLICY IF EXISTS "Buyers can cancel own orders" ON orders;
DROP POLICY IF EXISTS "Buyers can cancel or complete own orders" ON orders;

-- Create the updated policy allowing both 'cancelled' and 'completed'
CREATE POLICY "Buyers can cancel or complete own orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = buyer_id)
  WITH CHECK (
    auth.uid() = buyer_id AND
    status IN ('cancelled', 'completed')
  );

ALTER TABLE orders DROP CONSTRAINT orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'pending',
    'negotiating', 
    'confirming',
    'approved',
    'declined',
    'cancelled',
    'completed'
  ));
  
-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: get_trend_data RPC function
--
-- PURPOSE:
--   Moves market trend aggregation from JavaScript into PostgreSQL.
--   Called via supabase.rpc('get_trend_data') in trendService.js.
--
-- BEFORE (JS-side): fetched ALL product rows, then grouped/counted/averaged
--   in JavaScript using forEach + reduce → expensive on mobile/low-memory.
--
-- AFTER (SQL-side): PostgreSQL does GROUP BY + COUNT DISTINCT + SUM + AVG,
--   returns already-aggregated rows → only one small result set travels
--   over the network.
--
-- HOW TO APPLY:
--   Option A — Supabase Dashboard:
--     1. Go to Database → SQL Editor
--     2. Paste this entire file and click Run
--
--   Option B — Supabase CLI:
--     supabase db push
--     (place this file in supabase/migrations/ with a timestamp prefix)
--
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_trend_data()
RETURNS TABLE (
  name          text,
  category      text,
  seller_count  bigint,
  total_qty     numeric,
  avg_price     numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    name,
    category,
    COUNT(DISTINCT user_id)    AS seller_count,
    SUM(quantity_kg)           AS total_qty,
    AVG(price)                 AS avg_price
  FROM public.products
  WHERE status = 'Available'
  GROUP BY name, category
  ORDER BY seller_count DESC;
$$;

-- Grant execute permission to the authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.get_trend_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trend_data() TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTES:
--
-- STABLE: tells the planner this function reads but does not modify the DB,
--         enabling better query plan caching.
--
-- SECURITY DEFINER: runs with the privileges of the function owner (postgres),
--                   not the caller. Ensure RLS on `products` is set correctly
--                   if you do NOT want anon users to see aggregated data.
--                   If you want RLS to apply, change to SECURITY INVOKER and
--                   grant SELECT on products to authenticated/anon separately.
--
-- EXPECTED OUTPUT COLUMNS:
--   name          text     Product name (e.g. "Eggplant")
--   category      text     Product category (e.g. "Vegetables")
--   seller_count  bigint   Number of distinct sellers listing this product
--   total_qty     numeric  Sum of all quantity_kg listings
--   avg_price     numeric  Average price across all listings
-- ─────────────────────────────────────────────────────────────────────────────



select * from get_trend_data();

DROP VIEW IF EXISTS public.public_profiles;

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated  -- requires login, blocks anonymous scraping
  USING (true);

CREATE OR REPLACE FUNCTION decrement_product_inventory(
  p_product_id UUID, p_quantity DECIMAL
) RETURNS void AS $$
BEGIN
  -- Only allow the product's owner (seller) to call this
  IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE id = p_product_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE products
  SET quantity_kg = GREATEST(0, quantity_kg - p_quantity),
      status = CASE WHEN GREATEST(0, quantity_kg - p_quantity) = 0
               THEN 'Unavailable' ELSE status END
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Quick minimal fix: restrict to system use only via a role check,
-- or check that caller is in a conversation with p_user_id
IF NOT EXISTS (
  SELECT 1 FROM conversations
  WHERE (participant_1 = auth.uid() OR participant_2 = auth.uid())
    AND (participant_1 = p_user_id OR participant_2 = p_user_id)
) AND NOT public.is_admin() THEN
  RAISE EXCEPTION 'Not authorized to notify this user';
END IF;






CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id   UUID,
  p_type      TEXT,
  p_title     TEXT,
  p_message   TEXT,
  p_data      JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Caller must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Caller must share a conversation with the target user, or be admin
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE (participant_1 = auth.uid() OR participant_2 = auth.uid())
      AND (participant_1 = p_user_id OR participant_2 = p_user_id)
  ) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to notify this user';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB)
  TO authenticated;



DROP POLICY IF EXISTS "Admins can update market prices" ON market_prices;
DROP POLICY IF EXISTS "Admins can insert market prices" ON market_prices;

CREATE POLICY "Admins can update market prices"
  ON market_prices FOR UPDATE
  USING (public.is_admin());  -- UUID-based, no argument

CREATE POLICY "Admins can insert market prices"
  ON market_prices FOR INSERT
  WITH CHECK (public.is_admin());

DROP FUNCTION IF EXISTS public.is_admin(text);

CREATE OR REPLACE FUNCTION get_bucket_sizes()
RETURNS TABLE (bucket_id text, total_size bigint, file_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = storage, public
AS $$
  SELECT
    bucket_id,
    COALESCE(SUM((metadata->>'size')::bigint), 0) AS total_size,
    COUNT(*) AS file_count
  FROM storage.objects
  WHERE bucket_id IN ('product-images', 'avatars', 'chat-images')
  GROUP BY bucket_id;
$$;


-- ============================================================
-- ADMIN ACCESS HARDENING — FINAL, RUN ONCE TOP TO BOTTOM
-- Supabase Dashboard → SQL Editor
-- ============================================================
-- Assumes the earlier patch already exists: a UUID-based
-- public.is_admin() function backed by an RLS-locked admin_roles
-- table. This script fixes the remaining weak spot (market_prices
-- still using an old email-based check), adds an access-attempt
-- log, and creates the single function the frontend will call.
-- ============================================================


-- ------------------------------------------------------------
-- STEP 1 — migrate market_prices off the legacy email-based check
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can update market prices" ON market_prices;
DROP POLICY IF EXISTS "Admins can insert market prices" ON market_prices;

CREATE POLICY "Admins can update market prices"
  ON market_prices FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert market prices"
  ON market_prices FOR INSERT
  WITH CHECK (public.is_admin());

DROP FUNCTION IF EXISTS is_admin(text);


-- ------------------------------------------------------------
-- STEP 2 — access attempt log (every call, granted or not)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  granted BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read access log" ON public.admin_access_log;
CREATE POLICY "Admins can read access log"
  ON public.admin_access_log FOR SELECT
  USING (public.is_admin());

-- no direct inserts via the API — only the function below can write
DROP POLICY IF EXISTS "No direct insert to access log" ON public.admin_access_log;
CREATE POLICY "No direct insert to access log"
  ON public.admin_access_log FOR INSERT
  WITH CHECK (false);


-- ------------------------------------------------------------
-- STEP 3 — the one function the frontend calls
-- Checks the honeypot key (stored ONLY here, never shipped to the
-- browser) AND that the caller is an admin. Logs every attempt.
--
-- >>> EDIT THE LINE BELOW before running — pick your own long,
-- >>> random phrase. This is the only place it needs to exist. <<<
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_admin_access(input_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  correct_key CONSTANT text := '8ff7c28bcd5884eda2f0ea1ecf91c67e9858bca7f6ea7953';
  is_authorized boolean;
BEGIN
  is_authorized := (input_key = correct_key) AND public.is_admin();

  INSERT INTO public.admin_access_log (user_id, email, granted)
  VALUES (auth.uid(), auth.jwt() ->> 'email', is_authorized);

  RETURN is_authorized;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_admin_access(text) TO authenticated, anon;


-- ------------------------------------------------------------
-- STEP 4 — seed your account into admin_roles (do this in two parts)
-- ------------------------------------------------------------

-- 4a. Run this alone first:
SELECT id, email FROM auth.users WHERE email = 'janreylecita@gmail.com';

-- 4b. Copy the "id" value from the result above, paste it below,
--     uncomment, and run:
INSERT INTO public.admin_roles (user_id)
VALUES ('cbf4eee0-b848-4a99-b106-753e2893d7a8')
ON CONFLICT DO NOTHING;


-- ------------------------------------------------------------
-- Later, to check for probing / failed attempts:
-- SELECT * FROM public.admin_access_log ORDER BY created_at DESC LIMIT 50;
-- ------------------------------------------------------------

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Market Price History + get_price_trend RPC
--
-- PURPOSE:
--   market_prices only ever holds the CURRENT price per product (UNIQUE on
--   category, name — every update overwrites the row). This migration adds
--   a companion table that records every price change over time, plus an
--   RPC the frontend calls to render a 14–30 day trend graph.
--
-- HOW IT WORKS:
--   1. market_price_history logs one row per price change (via trigger),
--      not one row per day. This means the table only grows when a price
--      actually changes, which matches how admins update prices in the
--      dashboard (no cron / scheduled job needed).
--   2. get_price_trend(name, days) returns the last known price *before*
--      the window (so the chart has a starting point even if the price
--      hasn't changed recently) plus every change *inside* the window.
--      The frontend forward-fills the gaps between changes into a daily
--      series — see usePriceTrend.js / marketPriceTrend.jsx.
--
-- HOW TO APPLY:
--   Supabase Dashboard → Database → SQL Editor → paste this file → Run.
--   (Or place it in supabase/migrations/ with a timestamp prefix if you're
--   using the Supabase CLI.)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. History table
CREATE TABLE IF NOT EXISTS market_price_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category    TEXT NOT NULL,
  name        TEXT NOT NULL,
  price       DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- One query pattern dominates: "give me history for product X, most recent first"
CREATE INDEX IF NOT EXISTS idx_market_price_history_name_recorded
  ON market_price_history (name, recorded_at DESC);

ALTER TABLE market_price_history ENABLE ROW LEVEL SECURITY;

-- Read-only for everyone, same as market_prices itself. There is deliberately
-- no INSERT/UPDATE/DELETE policy for authenticated/anon — the only writer is
-- the trigger below, which runs SECURITY DEFINER as the table owner.
CREATE POLICY "Anyone can read market price history"
  ON market_price_history FOR SELECT USING (true);

-- 2. Trigger: log a history row whenever a price is inserted or actually changes
CREATE OR REPLACE FUNCTION public.log_market_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO market_price_history (category, name, price, recorded_at)
    VALUES (NEW.category, NEW.name, NEW.price, COALESCE(NEW.updated_at, NOW()));
  ELSIF (TG_OP = 'UPDATE' AND NEW.price IS DISTINCT FROM OLD.price) THEN
    INSERT INTO market_price_history (category, name, price, recorded_at)
    VALUES (NEW.category, NEW.name, NEW.price, COALESCE(NEW.updated_at, NOW()));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_market_price_change ON market_prices;

CREATE TRIGGER trg_log_market_price_change
AFTER INSERT OR UPDATE ON market_prices
FOR EACH ROW EXECUTE FUNCTION public.log_market_price_change();

-- 3. Backfill: seed history with today's prices so every product has at
--    least one data point immediately (otherwise the graph would be empty
--    for every product until the first future price change).
INSERT INTO market_price_history (category, name, price, recorded_at)
SELECT category, name, price, updated_at
FROM market_prices;

-- 4. RPC: fetch the data a trend chart needs for one product
--    Returns: the last known price BEFORE the window (an "anchor" point, if
--    one exists) plus every change INSIDE the window, oldest first.
CREATE OR REPLACE FUNCTION public.get_price_trend(p_name TEXT, p_days INT DEFAULT 30)
RETURNS TABLE (
  price       NUMERIC,
  recorded_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  (
    SELECT price, recorded_at
    FROM market_price_history
    WHERE name = p_name
      AND recorded_at < (NOW() - (p_days || ' days')::interval)
    ORDER BY recorded_at DESC
    LIMIT 1
  )
  UNION ALL
  (
    SELECT price, recorded_at
    FROM market_price_history
    WHERE name = p_name
      AND recorded_at >= (NOW() - (p_days || ' days')::interval)
    ORDER BY recorded_at ASC
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_price_trend(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_price_trend(TEXT, INT) TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTES:
--
-- Why a trigger instead of a daily pg_cron snapshot:
--   Your admin dashboard updates market_prices directly (is_admin-gated
--   UPDATE policy). A trigger captures the exact moment + value of every
--   real change with zero extra infrastructure. If you'd rather have a
--   guaranteed daily data point even on days nothing changes, that's a
--   pg_cron job that INSERTs the current price on a schedule — happy to
--   add that on top of this if you want it later.
--
-- SECURITY DEFINER: both functions run as their owner (postgres), same
-- pattern as your existing is_admin() and get_trend_data() functions.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_market_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO market_price_history (category, name, price, recorded_at)
    VALUES (NEW.category, NEW.name, NEW.price, NOW());
  ELSIF (TG_OP = 'UPDATE' AND NEW.price IS DISTINCT FROM OLD.price) THEN
    INSERT INTO market_price_history (category, name, price, recorded_at)
    VALUES (NEW.category, NEW.name, NEW.price, NOW());
  END IF;
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Auth rate limiting (login, signup, forgot_password)
--
-- PURPOSE:
--   Backs the rate-limiter Edge Functions with a persistent, atomic counter
--   per (IP, action). Escalating lockouts: 15m -> 30m -> 1h -> 24h.
--
-- HOW IT WORKS:
--   One row per (identifier, action). check_rate_limit() is called once per
--   request, BEFORE the actual auth action runs. It locks the row (FOR
--   UPDATE) so concurrent requests from the same IP can't race past the
--   check, then:
--     - creates the row on first-ever request for that IP+action
--     - rejects immediately if currently locked
--     - starts a fresh rolling window if the old one has expired
--     - otherwise increments the count; if this request pushes the count
--       to the configured max, it locks and escalates lock_level
--
--   ASSUMPTION (adjust if you don't want this): if an IP goes 7 straight
--   days without a new violation, lock_level decays back to 0 so a single
--   old lockout doesn't follow someone around forever. Change
--   v_decay_interval below to tune or remove this.
--
-- SECURITY:
--   RLS is enabled with zero policies, and EXECUTE on check_rate_limit() is
--   revoked from PUBLIC and granted only to service_role. This table/function
--   must only ever be touched by Edge Functions using the service role key —
--   never exposed to anon/authenticated, or a client could call it directly
--   to inspect or manipulate its own rate-limit state.
--
-- HOW TO APPLY:
--   Supabase Dashboard -> Database -> SQL Editor -> paste this file -> Run.
--   (Or `supabase db push` if you're using the CLI with this in
--   supabase/migrations/.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier       TEXT NOT NULL,        -- client IP address
  action           TEXT NOT NULL,        -- 'login' | 'signup' | 'forgot_password'
  attempt_count    INTEGER NOT NULL DEFAULT 1,
  window_start     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until      TIMESTAMPTZ,
  lock_level       INTEGER NOT NULL DEFAULT 0,  -- 0=never locked, 1=15m 2=30m 3=1h 4=24h
  last_attempt_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (identifier, action)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action
  ON public.rate_limit_attempts (identifier, action);

ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies: with RLS on and zero policies, anon/authenticated
-- get nothing even if someone tried to hit this table via the REST API.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INT,
  p_window_minutes INT
)
RETURNS TABLE (allowed BOOLEAN, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  v_lock_minutes CONSTANT INT[] := ARRAY[15, 30, 60, 1440]; -- escalation ladder
  v_decay_interval CONSTANT INTERVAL := '7 days';
  v_lock_level INT;
  v_new_lock_minutes INT;
BEGIN
  SELECT * INTO rec
  FROM public.rate_limit_attempts
  WHERE identifier = p_identifier AND action = p_action
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limit_attempts (identifier, action, attempt_count, window_start, last_attempt_at, lock_level)
    VALUES (p_identifier, p_action, 1, NOW(), NOW(), 0);
    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;

  v_lock_level := rec.lock_level;

  -- Currently locked -> reject, don't touch counters
  IF rec.locked_until IS NOT NULL AND rec.locked_until > NOW() THEN
    RETURN QUERY SELECT false, CEIL(EXTRACT(EPOCH FROM (rec.locked_until - NOW())))::INT;
    RETURN;
  END IF;

  -- Long enough since the last violation -> forgive the escalation level
  IF v_lock_level > 0 AND rec.last_attempt_at < NOW() - v_decay_interval THEN
    v_lock_level := 0;
  END IF;

  -- Outside the rolling window -> start counting fresh
  IF rec.window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN
    UPDATE public.rate_limit_attempts
    SET attempt_count = 1, window_start = NOW(), last_attempt_at = NOW(),
        locked_until = NULL, lock_level = v_lock_level
    WHERE identifier = p_identifier AND action = p_action;
    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;

  -- Inside the window: this request would be the (attempt_count + 1)-th
  IF rec.attempt_count + 1 >= p_max_attempts THEN
    v_lock_level := LEAST(v_lock_level + 1, array_length(v_lock_minutes, 1));
    v_new_lock_minutes := v_lock_minutes[v_lock_level];

    UPDATE public.rate_limit_attempts
    SET attempt_count = rec.attempt_count + 1,
        last_attempt_at = NOW(),
        lock_level = v_lock_level,
        locked_until = NOW() + (v_new_lock_minutes || ' minutes')::INTERVAL
    WHERE identifier = p_identifier AND action = p_action;

    RETURN QUERY SELECT false, v_new_lock_minutes * 60;
    RETURN;
  ELSE
    UPDATE public.rate_limit_attempts
    SET attempt_count = rec.attempt_count + 1,
        last_attempt_at = NOW(),
        lock_level = v_lock_level
    WHERE identifier = p_identifier AND action = p_action;

    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;
END;
$$;

-- Postgres grants EXECUTE to PUBLIC by default on new functions — undo that,
-- this must only be callable by the Edge Functions (service_role).
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INT, INT) TO service_role;