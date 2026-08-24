-- Manager Task Dashboard schema
-- Run in Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  team_id uuid references teams(id) on delete set null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  team_id uuid references teams(id) on delete set null,
  owner_id uuid references members(id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'blocked')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  due_date date,
  progress smallint not null default 0 check (progress between 0 and 100),
  effort_days numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_team_id_idx on tasks(team_id);
create index if not exists tasks_owner_id_idx on tasks(owner_id);
create index if not exists tasks_status_idx on tasks(status);

-- optional cache of the latest AI-generated workload summary so the
-- dashboard can show a summary without re-calling the AI endpoint on every load
create table if not exists ai_summaries (
  id uuid primary key default gen_random_uuid(),
  summary text not null,
  generated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- Row Level Security: enabled, but scoped to `anon` as well as `authenticated`.
-- The app has no login screen yet and connects with the public anon key, so
-- `to authenticated`-only policies would silently return zero rows to everyone.
-- This means anyone holding the anon key (it ships in the JS bundle — it is
-- not a secret) can read/write every row. That's an acceptable tradeoff for an
-- internal tool behind a private network, but NOT for a public deployment.
-- Once you add Supabase Auth, drop the `anon` grants below and scope policies
-- to `auth.uid()` / an org-membership table instead.
alter table teams enable row level security;
alter table members enable row level security;
alter table tasks enable row level security;
alter table ai_summaries enable row level security;

create policy "anon read teams" on teams for select to anon, authenticated using (true);
create policy "anon write teams" on teams for insert to anon, authenticated with check (true);
create policy "anon update teams" on teams for update to anon, authenticated using (true);
create policy "anon delete teams" on teams for delete to anon, authenticated using (true);

create policy "anon read members" on members for select to anon, authenticated using (true);
create policy "anon write members" on members for insert to anon, authenticated with check (true);
create policy "anon update members" on members for update to anon, authenticated using (true);
create policy "anon delete members" on members for delete to anon, authenticated using (true);

create policy "anon read tasks" on tasks for select to anon, authenticated using (true);
create policy "anon write tasks" on tasks for insert to anon, authenticated with check (true);
create policy "anon update tasks" on tasks for update to anon, authenticated using (true);
create policy "anon delete tasks" on tasks for delete to anon, authenticated using (true);

create policy "anon read ai_summaries" on ai_summaries for select to anon, authenticated using (true);
create policy "anon write ai_summaries" on ai_summaries for insert to anon, authenticated with check (true);

-- Realtime: lets the dashboard live-update when rows change from anywhere
-- (another tab, the SQL editor, a script) instead of only on page load.
-- Wrapped in existence checks so re-running this file is always safe.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table teams;
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'members'
  ) then
    alter publication supabase_realtime add table members;
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table tasks;
  end if;
end $$;
