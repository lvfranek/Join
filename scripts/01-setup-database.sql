-- Create users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text default 'user', -- 'admin', 'user'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text default 'todo', -- 'todo', 'in-progress', 'await-feedback', 'done'
  priority text default 'medium', -- 'low', 'medium', 'high'
  due_date date,
  category text default 'Technical Task',
  assignees jsonb default '[]'::jsonb,
  subtasks jsonb default '[]'::jsonb,
  assigned_to uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists category text default 'Technical Task';
alter table public.tasks add column if not exists assignees jsonb default '[]'::jsonb;
alter table public.tasks add column if not exists subtasks jsonb default '[]'::jsonb;

-- Create contacts table
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text,
  phone text,
  message text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Enable RLS (Row Level Security)
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.contacts enable row level security;

-- Users can read their own data
create policy "users_read_own" on public.users
  for select using (auth.uid() = id);

-- Users can update their own data
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Tasks - users can read tasks assigned to them or created by them
create policy "tasks_read" on public.tasks
  for select using (
    auth.uid() = assigned_to or auth.uid() = created_by
  );

-- Tasks - users can create tasks
create policy "tasks_create" on public.tasks
  for insert with check (auth.uid() = created_by);

-- Tasks - users can update tasks assigned to them
create policy "tasks_update" on public.tasks
  for update using (auth.uid() = assigned_to or auth.uid() = created_by);

-- Contacts - anyone can create
create policy "contacts_create" on public.contacts
  for insert with check (true);

-- Contacts - only creator can read/update
create policy "contacts_read" on public.contacts
  for select using (auth.uid() = created_by);

create policy "contacts_update" on public.contacts
  for update using (auth.uid() = created_by);

-- Create index for faster queries
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_created_by on public.tasks(created_by);
create index if not exists idx_tasks_status on public.tasks(status);
