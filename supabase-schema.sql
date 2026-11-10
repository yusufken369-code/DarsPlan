-- DarsPlan Supabase Database Schema with Row Level Security (RLS)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/gmgnblddnboqdrpoqjtf/sql

-- 1. Lessons table
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  class_name text not null,
  schedule_type text default 'weekly' check (schedule_type in ('weekly', 'date')),
  day integer check (day between 0 and 6),
  specific_date date,
  start_time text not null,
  end_time text not null,
  color text default 'navy',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lessons enable row level security;

create policy "Users can view their own lessons"
  on public.lessons for select
  using (auth.uid() = user_id);

create policy "Users can insert their own lessons"
  on public.lessons for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own lessons"
  on public.lessons for update
  using (auth.uid() = user_id);

create policy "Users can delete their own lessons"
  on public.lessons for delete
  using (auth.uid() = user_id);

-- 2. Classes table
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  student_count integer default 0,
  room text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.classes enable row level security;

create policy "Users can view their own classes"
  on public.classes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own classes"
  on public.classes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own classes"
  on public.classes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own classes"
  on public.classes for delete
  using (auth.uid() = user_id);

-- 3. Materials table
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  title text not null,
  type text default 'PDF',
  file_url text,
  date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.materials enable row level security;

create policy "Users can view their own materials"
  on public.materials for select
  using (auth.uid() = user_id);

create policy "Users can insert their own materials"
  on public.materials for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own materials"
  on public.materials for update
  using (auth.uid() = user_id);

create policy "Users can delete their own materials"
  on public.materials for delete
  using (auth.uid() = user_id);

-- 4. Assignments table
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  title text not null,
  type text default 'test',
  due_date text not null,
  due_time text default '12:00',
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.assignments enable row level security;

create policy "Users can view their own assignments"
  on public.assignments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own assignments"
  on public.assignments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own assignments"
  on public.assignments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own assignments"
  on public.assignments for delete
  using (auth.uid() = user_id);


-- 5. Students table
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id text not null,
  group_name text,
  name text not null,
  phone text,
  parent_phone text,
  note text,
  fee numeric default 0,
  paid boolean default false,
  grade integer check (grade between 2 and 5),
  grades jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.students enable row level security;

create policy "Users can view their own students"
  on public.students for select
  using (auth.uid() = user_id);

create policy "Users can insert their own students"
  on public.students for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own students"
  on public.students for update
  using (auth.uid() = user_id);

create policy "Users can delete their own students"
  on public.students for delete
  using (auth.uid() = user_id);

-- 6. Attendance table
create table if not exists public.attendance (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id text not null,
  class_name text,
  date text not null,
  records jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attendance enable row level security;

create policy "Users can view their own attendance"
  on public.attendance for select
  using (auth.uid() = user_id);

create policy "Users can insert their own attendance"
  on public.attendance for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own attendance"
  on public.attendance for update
  using (auth.uid() = user_id);

create policy "Users can delete their own attendance"
  on public.attendance for delete
  using (auth.uid() = user_id);
