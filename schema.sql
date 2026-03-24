-- ============================================================
-- SECOND BRAIN — SUPABASE SCHEMA (v2 — Life Operating System)
-- Run in: Supabase Dashboard → SQL Editor → New query
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
  notes         text default '',
  linkedin_url  text default '',
  headline      text default '',
  connected_date text default '',
  messaging_activity text default '',
  priority      text default 'Medium',
  follow_up     text default '',
  "companyId"   int4,
  category      text default 'customer_lead',
  source        text default '',
  "referredBy"  int4,
  "campaignId"  int4
);

-- COMPANIES (NEW)
create table if not exists companies (
  id            int4 primary key,
  name          text not null,
  industry      text default '',
  website       text default '',
  linkedin_url  text default '',
  news_keywords text default '',
  status        text default 'prospect',
  notes         text default '',
  created_at    text default ''
);

-- DEALS
create table if not exists deals (
  id            int4 primary key,
  name          text not null,
  "contactId"   int4,
  "companyId"   int4,
  value         int4 default 0,
  stage         text default 'discovery',
  probability   int4 default 50,
  "closeDate"   text default '',
  notes         text default ''
);

-- TASKS (enhanced with relations)
create table if not exists tasks (
  id            int4 primary key,
  title         text not null,
  due           text default '',
  priority      text default 'medium',
  done          bool default false,
  "assignedTo"  text default '',
  notes         text default '',
  "projectId"   int4,
  "contactId"   int4,
  "companyId"   int4,
  "dealId"      int4,
  status        text default 'todo',
  category      text default 'follow_up',
  source        text default 'manual',
  recurrence    text default 'none'
);

-- PROJECTS
create table if not exists projects (
  id            int4 primary key,
  name          text not null,
  client        text default '',
  type          text default 'client',
  "companyId"   int4,
  status        text default 'active',
  progress      int4 default 0,
  "dueDate"     text default '',
  priority      text default 'medium',
  notes         text default '',
  "strategyId"  int4,
  links         jsonb default '[]'::jsonb
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

-- COMPANY NEWS (NEW)
create table if not exists company_news (
  id            int4 primary key,
  "companyId"   int4,
  headline      text default '',
  source_url    text default '',
  summary       text default '',
  relevance_score int4 default 0,
  published_date text default '',
  action_taken  bool default false,
  "taskId"      int4,
  created_at    text default ''
);

-- GOALS (NEW)
create table if not exists goals (
  id            int4 primary key,
  name          text not null,
  target_value  int4 default 0,
  current_value int4 default 0,
  unit          text default '$',
  period        text default 'annual',
  start_date    text default '',
  end_date      text default '',
  status        text default 'active',
  notes         text default ''
);

-- EVENTS / ACTIVITY TIMELINE (NEW)
create table if not exists events (
  id            int4 primary key,
  entity_type   text default '',
  entity_id     int4,
  event_type    text default '',
  description   text default '',
  metadata      text default '{}',
  ts            text default '',
  source        text default 'manual'
);

-- ============================================================

-- INSTRUCTIONS
create table if not exists instructions (
  id            serial primary key,
  title         text not null default '',
  body          text not null default '',
  active        boolean not null default true,
  sort_order    integer not null default 0,
  modified_by   text,
  modified_at   timestamptz default now()
);

-- PAYMENTS
create table if not exists payments (
  id            int4 primary key,
  "invoiceId"   int4,
  amount        int4 default 0,
  date          text default '',
  method        text default '',
  notes         text default '',
  modified_by   text,
  modified_at   timestamptz default now()
);

-- PAYMENT ALLOCATIONS
create table if not exists payment_allocations (
  id            int4 primary key,
  "paymentId"   int4,
  "invoiceId"   int4,
  amount        int4 default 0,
  modified_by   text,
  modified_at   timestamptz default now()
);

-- ROW LEVEL SECURITY
-- ============================================================
alter table contacts     enable row level security;
alter table companies    enable row level security;
alter table deals        enable row level security;
alter table tasks        enable row level security;
alter table projects     enable row level security;
alter table campaigns    enable row level security;
alter table invoices     enable row level security;
alter table agentlogs    enable row level security;
alter table voicenotes   enable row level security;
alter table company_news enable row level security;
alter table goals        enable row level security;
alter table events       enable row level security;

alter table instructions enable row level security;
alter table payments enable row level security;
alter table payment_allocations enable row level security;

create policy "auth_all" on contacts     for all using (auth.role() = 'authenticated');
create policy "auth_all" on companies    for all using (auth.role() = 'authenticated');
create policy "auth_all" on deals        for all using (auth.role() = 'authenticated');
create policy "auth_all" on tasks        for all using (auth.role() = 'authenticated');
create policy "auth_all" on projects     for all using (auth.role() = 'authenticated');
create policy "auth_all" on campaigns    for all using (auth.role() = 'authenticated');
create policy "auth_all" on invoices     for all using (auth.role() = 'authenticated');
create policy "auth_all" on agentlogs   for all using (auth.role() = 'authenticated');
create policy "auth_all" on voicenotes   for all using (auth.role() = 'authenticated');
create policy "auth_all" on company_news for all using (auth.role() = 'authenticated');
create policy "auth_all" on goals        for all using (auth.role() = 'authenticated');
create policy "auth_all" on events       for all using (auth.role() = 'authenticated');
create policy "auth_all" on instructions for all using (auth.role() = 'authenticated');
create policy "auth_all" on payments for all using (auth.role() = 'authenticated');
create policy "auth_all" on payment_allocations for all using (auth.role() = 'authenticated');


-- STRATEGIES
create table if not exists strategies (
  id            serial primary key,
  name          text not null default '',
  description   text default '',
  "goalId"      int4,
  status        text default 'active',
  priority      text default 'high',
  links         jsonb default '[]'::jsonb,
  notes         text default '',
  modified_by   text,
  modified_at   timestamptz default now()
);
alter table strategies enable row level security;
create policy "Auth users full access" on strategies for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
