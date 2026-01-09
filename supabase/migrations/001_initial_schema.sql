-- Stager Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company_name text,
  credits_remaining integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Properties table
create table if not exists public.properties (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  address text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Staging jobs table
create table if not exists public.staging_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  property_id uuid references public.properties on delete set null,
  original_image_url text not null,
  staged_image_url text,
  room_type text not null,
  style text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  credits_used integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.staging_jobs enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Properties policies
create policy "Users can view own properties"
  on public.properties for select
  using (auth.uid() = user_id);

create policy "Users can insert own properties"
  on public.properties for insert
  with check (auth.uid() = user_id);

create policy "Users can update own properties"
  on public.properties for update
  using (auth.uid() = user_id);

create policy "Users can delete own properties"
  on public.properties for delete
  using (auth.uid() = user_id);

-- Staging jobs policies
create policy "Users can view own staging jobs"
  on public.staging_jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert own staging jobs"
  on public.staging_jobs for insert
  with check (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create storage bucket for images
insert into storage.buckets (id, name, public)
values ('staging-images', 'staging-images', true)
on conflict (id) do nothing;

-- Storage policies for staging images
create policy "Users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'staging-images' and auth.role() = 'authenticated');

create policy "Users can view own images"
  on storage.objects for select
  using (bucket_id = 'staging-images');

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'staging-images' and auth.uid()::text = (storage.foldername(name))[1]);
