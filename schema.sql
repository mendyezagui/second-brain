-- ============================================================
-- SECOND BRAIN — SUPABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- CONTACTS
create table if not exists contacts (
  id            int4 primary key,
  name          text not null,
  co            text default '',
  role          text default '',
  email         text default '',
  phone         text default '',
  status        text default 'prospect',
  score         int4 default 50,
  tags          text[] default '{}',
  "lastTouch"   text default '',
  notes         text default ''
);

-- DEALS
create table if not exists deals (
  id            int4 primary key,
  name          text not null,
  "contactId"   int4,
  value         int4 default 0,
  stage         text default 'discovery',
  probability   int4 default 50,
  "closeDate"   text default '',
  notes         text default ''
);

-- TASKS
create table if not exists tasks (
  id            int4 primary key,
  title         text not null,
  due           text default '',
  priority      text default 'medium',
  done          bool default false,
  "assignedTo"  text default '',
  notes         text default '',
  "projectId"   int4
);

-- PROJECTS
create table if not exists projects (
  id            int4 primary key,
  name          text not null,
  client        text default '',
  status        text default 'active',
  progress      int4 default 0,
  "dueDate"     text default '',
  priority      text default 'medium',
  notes         text default ''
);

-- CAMPAIGNS
create table if not exists campaigns (
  id            int4 primary key,
  name          text not null,
  status        text default 'draft',
  budget        int4 default 0,
  spend         int4 default 0,
  leads         int4 default 0,
  conversions   int4 default 0,
  channel       text default '',
  notes         text default ''
);

-- INVOICES
create table if not exists invoices (
  id            int4 primary key,
  number        text default '',
  client        text default '',
  "contactId"   int4,
  amount        int4 default 0,
  status        text default 'draft',
  issued        text default '',
  due           text default '',
  notes         text default ''
);

-- AGENT LOGS
create table if not exists agentlogs (
  id            int4 primary key,
  agent         text default '',
  type          text default '',
  message       text default '',
  ts            text default '',
  priority      text default 'medium'
);

-- VOICE NOTES
create table if not exists voicenotes (
  id            int4 primary key,
  transcript    text default '',
  ts            text default ''
);

-- ============================================================
-- ROW LEVEL SECURITY — authenticated users only
-- ============================================================

alter table contacts   enable row level security;
alter table deals      enable row level security;
alter table tasks      enable row level security;
alter table projects   enable row level security;
alter table campaigns  enable row level security;
alter table invoices   enable row level security;
alter table agentlogs  enable row level security;
alter table voicenotes enable row level security;

-- Policy: any authenticated user can read/write all rows
-- (single-user app — Mendy only)

create policy "auth_all" on contacts   for all using (auth.role() = 'authenticated');
create policy "auth_all" on deals      for all using (auth.role() = 'authenticated');
create policy "auth_all" on tasks      for all using (auth.role() = 'authenticated');
create policy "auth_all" on projects   for all using (auth.role() = 'authenticated');
create policy "auth_all" on campaigns  for all using (auth.role() = 'authenticated');
create policy "auth_all" on invoices   for all using (auth.role() = 'authenticated');
create policy "auth_all" on agentlogs  for all using (auth.role() = 'authenticated');
create policy "auth_all" on voicenotes for all using (auth.role() = 'authenticated');
