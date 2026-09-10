-- ============================================================
-- SoFa JCC ASSOCIATE — SUPABASE SCHEMA
-- The associate's own repository inside Second Brain.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- (repo convention prefers Supabase MCP apply_migration; this file is the
--  reviewable source of truth for what gets applied)
-- ============================================================

-- ------------------------------------------------------------
-- SPEAKERS — the roster. One row per person who has ever spoken.
-- research_status drives the "research it" step: 'pending' means the
-- associate has a name but has not yet enriched it.
-- ------------------------------------------------------------
create table if not exists sofa_speakers (
  id              serial primary key,
  name            text not null,
  title           text default '',
  org             text default '',
  topic           text default '',
  bio             text default '',
  short_bio       text default '',          -- <= 220 chars, what fits on a flyer
  headshot_url    text default '',
  links           jsonb default '[]'::jsonb, -- [{label,url}]
  research_notes  text default '',
  research_status text default 'pending',    -- pending | researched | confirmed | failed
  researched_at   timestamptz,
  source_urls     jsonb default '[]'::jsonb,
  created_at      timestamptz default now(),
  modified_by     text,
  modified_at     timestamptz default now()
);

-- ------------------------------------------------------------
-- EVENTS — weekly activities and holiday programs.
-- `kind` separates the recurring weekly rhythm from the Jewish calendar,
-- because they are drafted from different templates and on different clocks.
-- `hebcal_key` is the stable dedupe key for calendar-derived rows so the
-- daily scan is idempotent (title+date can be re-titled by hand).
-- ------------------------------------------------------------
create table if not exists sofa_events (
  id              serial primary key,
  title           text not null,
  kind            text default 'weekly',     -- weekly | holiday | speaker | special
  event_date      date not null,
  start_time      text default '',
  end_time        text default '',
  doors_time      text default '',
  location        text default '',
  address         text default '',
  description     text default '',
  audience        text default '',           -- e.g. "Men & Women", "Families"
  cost            text default '',
  rsvp_url        text default '',
  hebrew_date     text default '',
  hebcal_key      text unique,               -- e.g. "2026-09-12:rosh-hashana-5787"
  candle_lighting text default '',
  havdalah        text default '',
  speaker_id      int references sofa_speakers(id) on delete set null,
  status          text default 'draft',      -- draft | confirmed | published | cancelled | past
  notes           text default '',
  source          text default 'manual',     -- manual | agent:hebcal | agent:weekly
  created_at      timestamptz default now(),
  modified_by     text,
  modified_at     timestamptz default now()
);
create index if not exists sofa_events_date_idx on sofa_events (event_date);

-- ------------------------------------------------------------
-- FLYERS — every draft the associate has ever produced, versioned.
-- `missing` is the machine-computed gap list; it is what the push
-- notification reads out ("missing X, Y and Z"). `answers` is what Mendy
-- replied, so the next draft does not ask the same question twice.
-- ------------------------------------------------------------
create table if not exists sofa_flyers (
  id              serial primary key,
  event_id        int references sofa_events(id) on delete cascade,
  template        text default 'holiday',    -- weekly | holiday | speaker
  version         int default 1,
  status          text default 'draft',      -- draft | needs_input | ready | published | superseded
  headline        text default '',
  subhead         text default '',
  body            text default '',
  footer          text default '',
  html            text default '',           -- the rendered artboard
  png_path        text default '',           -- public/sofa-jcc/flyers/<slug>.png
  missing         jsonb default '[]'::jsonb, -- [{field,label,severity,question}]
  answers         jsonb default '{}'::jsonb, -- {field: "Mendy's answer"}
  created_at      timestamptz default now(),
  modified_by     text,
  modified_at     timestamptz default now()
);
create index if not exists sofa_flyers_event_idx on sofa_flyers (event_id);

-- ------------------------------------------------------------
-- NUDGES — the associate's outbound log. One row per thing it wanted to
-- tell Mendy. `dedupe_key` makes the daily scan safe to re-run: the same
-- nudge for the same event on the same lead-day is written once, ever.
-- ------------------------------------------------------------
create table if not exists sofa_nudges (
  id              serial primary key,
  kind            text default 'holiday_lead', -- holiday_lead | missing_input | weekly_draft | speaker_research
  title           text not null,
  body            text default '',
  url             text default '',
  event_id        int references sofa_events(id) on delete cascade,
  flyer_id        int references sofa_flyers(id) on delete set null,
  lead_days       int,                        -- days until the event when fired
  severity        text default 'normal',      -- normal | high
  dedupe_key      text unique,
  status          text default 'pending',     -- pending | sent | failed | acknowledged | dismissed
  channel         text default '',            -- webpush | none
  push_result     jsonb default '{}'::jsonb,
  sent_at         timestamptz,
  created_at      timestamptz default now(),
  modified_by     text,
  modified_at     timestamptz default now()
);

-- ------------------------------------------------------------
-- PUSH SUBSCRIPTIONS — Web Push (VAPID) endpoints, one per browser/device.
-- Not SoFa-specific: any Second Brain agent can send through these.
-- ------------------------------------------------------------
create table if not exists push_subscriptions (
  id              serial primary key,
  endpoint        text not null unique,
  p256dh          text not null,
  auth            text not null,
  user_id         uuid,
  label           text default '',            -- "Mendy iPhone"
  user_agent      text default '',
  failure_count   int default 0,
  last_success_at timestamptz,
  created_at      timestamptz default now()
);

-- ------------------------------------------------------------
-- RLS — matches the existing repo convention (authenticated = full access).
-- The cron/server paths use the service-role key and bypass RLS.
-- ------------------------------------------------------------
alter table sofa_speakers      enable row level security;
alter table sofa_events        enable row level security;
alter table sofa_flyers        enable row level security;
alter table sofa_nudges        enable row level security;
alter table push_subscriptions enable row level security;

drop policy if exists "auth_all" on sofa_speakers;
drop policy if exists "auth_all" on sofa_events;
drop policy if exists "auth_all" on sofa_flyers;
drop policy if exists "auth_all" on sofa_nudges;
drop policy if exists "auth_all" on push_subscriptions;

create policy "auth_all" on sofa_speakers      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all" on sofa_events        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all" on sofa_flyers        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all" on sofa_nudges        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all" on push_subscriptions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
