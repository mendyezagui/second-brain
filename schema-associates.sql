-- ============================================================
-- ASSOCIATE RUNTIME — SUPABASE SCHEMA
--
-- The generic spine behind every associate. Until now an associate was a
-- string in `ASSOCIATES` (src/lib/constants.js) with no storage, no
-- schedule and no history — it existed only while the Associates tab was
-- open. The SoFa JCC pair proved the shape a real associate needs: its own
-- rows, its own clock, a deterministic gap list, and draft-and-hold rails.
-- This schema is that shape, generalised, so a new associate is a ROW and
-- not a codebase.
--
-- Run in: Supabase Dashboard -> SQL Editor -> New query
-- (repo convention prefers Supabase MCP apply_migration; this file is the
--  reviewable source of truth for what gets applied)
-- ============================================================

-- ------------------------------------------------------------
-- ASSOCIATES — the registry. One row per associate.
--
-- `runtime` is the important column:
--   'prompt' — the generic runtime owns it end to end. Reads the context its
--              `inputs` spec describes, calls the model, stages a draft.
--   'custom' — the associate has hand-written code and its own scan (the
--              SoFa pair). Listed here so the console shows one roster, but
--              the tick does NOT run it; that would double-run their cron.
--
-- `schedule` is deliberately a small vocabulary, not cron syntax. A daily
-- LLM run costs money and attention, so the default for everything is
-- 'manual' and promoting an associate to a clock is an explicit act.
-- ------------------------------------------------------------
create table if not exists associates (
  id              serial primary key,
  slug            text unique not null,       -- 'discovery-plan' — stable, matches the old constants.js ids
  label           text not null,
  group_name      text default '',            -- Sales | Delivery | Voitra | Operator | Power | SoFa JCC
  artifact        text default '',            -- what it produces, one noun phrase
  brief           text default '',            -- the role prompt: who it is and what it owns
  runtime         text default 'prompt',      -- prompt | custom
  active          bool default true,          -- false = retired, keeps its history

  -- clock
  schedule        text default 'manual',      -- manual | daily | weekly:mon..sun | monthly:<1-28>
  run_at_utc      text default '14:30',       -- HH:MM. The tick fires at or after this.
  last_run_at     timestamptz,
  next_run_at     timestamptz,

  -- what it reads. See src/lib/associates/context.js for the supported shape.
  --   { "tables": [ { "table":"deals", "fields":[...], "where":[["stage","neq","closed_lost"]],
  --                   "order":{"field":"value","dir":"desc"}, "limit":25 } ],
  --     "linked": true }
  inputs          jsonb default '{"tables":[],"linked":true}'::jsonb,

  -- deterministic "what's missing". Same contract as the SoFa gap list:
  -- severity blocking | ask | nice. Computed from empty fields, never from a
  -- model's opinion, because a model that invents a missing input produces a
  -- confident artifact built on a guess.
  --   [ { "field":"deal.value", "label":"Deal value", "severity":"blocking",
  --       "question":"What's the deal worth?" } ]
  requirements    jsonb default '[]'::jsonb,

  -- draft-and-hold rails (docs/proactive-orchestrator-spec.md section 5).
  -- There is no 'send' key and the runtime has no send path.
  rails           jsonb default '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":false}'::jsonb,

  model           text default 'claude-sonnet-4-6',
  max_tokens      int  default 2200,
  console         text default '',            -- optional hash route for custom associates
  sort_order      int  default 100,
  notes           text default '',
  created_at      timestamptz default now(),
  modified_by     text,
  modified_at     timestamptz default now()
);
create index if not exists associates_active_idx on associates (active, schedule);

-- ------------------------------------------------------------
-- RUNS — every execution, successful or not.
--
-- `run_key` is the idempotency guarantee and it is UNIQUE: it is
-- '<slug>:<period bucket>' for scheduled runs, so a tick that fires twice in
-- the same day writes one run, and '<slug>:manual:<timestamp>' for a run you
-- asked for by hand. Without this a retried cron silently doubles every
-- artifact, which is how the SoFa scan would have sent the same notification
-- every morning.
--
-- Errors are rows too. An associate that has been failing for a month should
-- be visible as failing, not just silent.
-- ------------------------------------------------------------
create table if not exists associate_runs (
  id              serial primary key,
  associate_id    int references associates(id) on delete cascade,
  slug            text default '',            -- denormalised so a run survives a deleted associate in the log
  run_key         text unique,
  trigger         text default 'cron',        -- cron | manual | chained
  status          text default 'ok',          -- ok | error | skipped | no_input
  summary         text default '',
  input_digest    jsonb default '{}'::jsonb,  -- counts per source, so you can see what it actually read
  gaps            jsonb default '[]'::jsonb,
  output          text default '',
  error           text default '',
  model           text default '',
  tokens_out      int,
  duration_ms     int,
  started_at      timestamptz default now(),
  finished_at     timestamptz,
  modified_by     text,
  modified_at     timestamptz default now()
);
create index if not exists associate_runs_assoc_idx on associate_runs (associate_id, started_at desc);

-- ------------------------------------------------------------
-- DRAFTS — the artifact, held for review.
--
-- Nothing here is ever sent, posted or emailed; the runtime has no such
-- path. `status` moves staged -> ready -> archived by a human, or
-- -> dismissed. `gaps` is the machine-computed missing-input list that the
-- console reads out, exactly as sofa_flyers.missing does.
--
-- Versioned rather than overwritten: a redraft supersedes, so you can always
-- see what the associate said last week.
-- ------------------------------------------------------------
create table if not exists associate_drafts (
  id              serial primary key,
  associate_id    int references associates(id) on delete cascade,
  run_id          int references associate_runs(id) on delete set null,
  slug            text default '',
  kind            text default 'document',    -- document | email | linkedin | memo | spec | other
  title           text default '',
  body            text default '',
  status          text default 'staged',      -- staged | needs_input | ready | dismissed | archived
  gaps            jsonb default '[]'::jsonb,
  answers         jsonb default '{}'::jsonb,  -- what you replied, so the next draft stops asking
  version         int default 1,
  dedupe_key      text unique,

  -- links back into the Second Brain, same column names the app already uses
  "contactId"     int4,
  "companyId"     int4,
  "dealId"        int4,
  "projectId"     int4,

  source          text default 'agent:associate',
  created_at      timestamptz default now(),
  modified_by     text,
  modified_at     timestamptz default now()
);
create index if not exists associate_drafts_assoc_idx on associate_drafts (associate_id, created_at desc);
create index if not exists associate_drafts_status_idx on associate_drafts (status);

-- ------------------------------------------------------------
-- RLS — matches the existing repo convention (authenticated = full access).
-- The tick runs with the service-role key and bypasses RLS.
-- ------------------------------------------------------------
alter table associates       enable row level security;
alter table associate_runs   enable row level security;
alter table associate_drafts enable row level security;

drop policy if exists "auth_all" on associates;
drop policy if exists "auth_all" on associate_runs;
drop policy if exists "auth_all" on associate_drafts;

create policy "auth_all" on associates       for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all" on associate_runs   for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all" on associate_drafts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
