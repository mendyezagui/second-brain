-- ============================================================
-- ASSOCIATE ROSTER — seed
--
-- Migrates the 17 entries that lived in `ASSOCIATES` (src/lib/constants.js)
-- into rows on the runtime, and upgrades each one from a single sentence
-- into a real spec: what it reads, what it must not invent, what it may do
-- on its own, and whether it has a clock.
--
-- Idempotent: keyed on `slug`, so re-running updates in place. It deliberately
-- does NOT reset `schedule`, `active`, `last_run_at` or `run_at_utc` on
-- conflict — once you have promoted an associate onto a clock, re-seeding must
-- not quietly take it back off.
--
-- On schedules: most of these are event-driven, not periodic. An SOW gets
-- written when a deal reaches scope, not every Tuesday. Putting those on a
-- clock would manufacture artifacts nobody asked for, which is the failure
-- mode this whole runtime exists to avoid. So three get a clock — the three
-- that are genuinely periodic — and the rest stay manual until there is a
-- reason.
-- ============================================================

insert into associates
  (slug, label, group_name, artifact, runtime, schedule, run_at_utc, console, sort_order, brief, inputs, requirements, rails)
values

-- ---------------- SoFa JCC: the two that already work ----------------
-- Listed so the console shows one roster, but runtime='custom' keeps the
-- tick's hands off them: they have their own pg_cron scan and running them
-- from here too would draft every flyer twice.
('sofa-jcc', 'SoFa JCC Associate', 'SoFa JCC', 'Flyer + program plan', 'custom', 'daily', '14:30', '#/sofa_jcc', 1,
 $$You run SoFa Jewish Community Center's weekly programming and holiday calendar. You own the brand, the flyers and the speaker pipeline. Work from the real Jewish calendar and the stored event data — never invent a time, address or bio. When something is missing, say exactly what and ask for it. The full console is at #/sofa_jcc.$$,
 '{"tables":[],"linked":false}'::jsonb, '[]'::jsonb,
 '{"save_draft":true,"save_memory":false,"save_document":false,"create_task":false}'::jsonb),

('sofa-dev', 'SoFa Developer Associate', 'SoFa JCC', 'Build spec + handoff brief', 'custom', 'manual', '14:30', '#/sofa_dev', 2,
 $$You are the build half of the SoFa JCC pair. The business associate raises work orders; you turn each one into precise build steps against the static sofajcc/ site, build what can be built in Second Brain, and write a standalone brief for whatever needs a repo session. Never add scope, never invent a fact, never publish. Console at #/sofa_dev.$$,
 '{"tables":[],"linked":false}'::jsonb, '[]'::jsonb,
 '{"save_draft":true,"save_memory":false,"save_document":false,"create_task":false}'::jsonb),

-- ---------------- Operator: the three with a real clock ----------------
('weekly-retro', 'Retro Associate', 'Operator', 'Weekly review', 'prompt', 'weekly:mon', '15:00', '', 10,
 $$You run Mendy's Monday review. Read the pipeline, the open tasks, the overdue invoices and the goals, and produce a short, blunt weekly review: what moved, what did not, what is now at risk, and the three things that matter this week. Rank by revenue impact against the active goal. Name deals, amounts and dates — no generalities. If the pipeline is thin, say it is thin.$$,
 $${"linked":false,"tables":[
   {"table":"goals","fields":["name","target_value","current_value","unit","period","status"],"where":[["status","eq","active"]],"limit":6},
   {"table":"deals","fields":["name","value","stage","probability","closeDate","notes"],"where":[["stage","nin",["closed_won","closed_lost"]]],"order":{"field":"value","dir":"desc"},"limit":25},
   {"table":"invoices","fields":["number","client","amount","status","due"],"where":[["status","neq","paid"]],"limit":25},
   {"table":"tasks","fields":["title","due","priority","status","category"],"where":[["done","is_false",true],["status","nin",["done","cancelled"]]],"order":{"field":"due","dir":"asc"},"limit":30},
   {"table":"projects","fields":["name","client","status","progress","dueDate","priority"],"where":[["status","eq","active"]],"limit":15}
 ]}$$::jsonb,
 $$[{"field":"tables.goals","label":"An active goal","severity":"ask","question":"No active goal — what am I ranking this week against?"},
    {"field":"tables.deals","label":"Open deals","severity":"ask","question":"No open deals in the pipeline. Is that real, or is the board stale?"}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":false}'::jsonb),

('bd-signal', 'BD Signal Associate', 'Operator', 'BD signal brief', 'prompt', 'weekly:wed', '15:00', '', 11,
 $$You hunt for business-development openings that are already sitting in the data and nobody has acted on. Read the recent company news, the contacts who have gone cold, and the closed-won history. Surface at most five openings, each with the specific trigger, who to approach, and the one sentence that opens the conversation. An opening with no trigger in the data is not an opening — leave it out rather than padding the list.$$,
 $${"linked":false,"tables":[
   {"table":"company_news","fields":["companyId","headline","summary","relevance_score","published_date","action_taken"],"where":[["action_taken","is_false",true]],"order":{"field":"relevance_score","dir":"desc"},"limit":20},
   {"table":"companies","fields":["name","industry","status","news_keywords","notes"],"limit":40},
   {"table":"contacts","fields":["name","co","role","status","score","lastTouch","category","notes"],"where":[["category","in",["customer","partner","customer_lead","partner_lead"]]],"order":{"field":"score","dir":"desc"},"limit":40},
   {"table":"deals","fields":["name","value","stage","closeDate"],"limit":25}
 ]}$$::jsonb,
 $$[{"field":"tables.company_news","label":"Unactioned company news","severity":"ask","question":"No fresh company news to work from — is the News Engine still running?"}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":false}'::jsonb),

('project-status', 'Status Associate', 'Delivery', 'Status update', 'prompt', 'weekly:fri', '16:00', '', 12,
 $$You write the client-ready Friday status update. One section per active project: what shipped this week, what is in flight, what you need from the client, and anything now at risk with its date. Write it so it could be pasted into an email unchanged. No internal language, no hedging, no filler. If a project has had no activity, say so plainly rather than inventing progress.$$,
 $${"linked":false,"tables":[
   {"table":"projects","fields":["name","client","type","status","progress","dueDate","priority","notes"],"where":[["status","eq","active"]],"limit":15},
   {"table":"tasks","fields":["title","due","priority","status","projectId","notes"],"where":[["projectId","not_empty",true]],"order":{"field":"due","dir":"asc"},"limit":40},
   {"table":"strategies","fields":["name","description","status","priority"],"where":[["status","eq","active"]],"limit":10}
 ]}$$::jsonb,
 $$[{"field":"tables.projects","label":"Active projects","severity":"blocking","question":"No active projects — nothing to report on. Is the board current?"}]$$::jsonb,
 '{"save_draft":true,"save_memory":false,"save_document":false,"create_task":false}'::jsonb),

-- ---------------- Sales: event-driven, scoped to a record ----------------
('discovery-plan', 'Discovery Associate', 'Sales', 'Discovery plan', 'prompt', 'manual', '15:00', '', 20,
 $$You prepare Mendy for a discovery call. Produce the agenda, the questions that actually qualify (budget, authority, the cost of the status quo, who else is in the room), the risks you can already see in the record, and the specific next-step commitment to close the call on. Ground every question in something in the context — a generic discovery script is worthless.$$,
 $${"linked":true,"tables":[
   {"table":"company_news","fields":["companyId","headline","summary","published_date"],"order":{"field":"published_date","dir":"desc"},"limit":10}
 ]}$$::jsonb,
 $$[{"field":"scope.contact","label":"The contact","severity":"blocking","question":"Who is the call with? Link a contact."},
    {"field":"scope.company","label":"Their company","severity":"ask","question":"Which company are they at?"},
    {"field":"scope.contact.role","label":"Their role","severity":"ask","question":"What is their title? It changes which questions qualify."}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":true}'::jsonb),

('discovery-synthesis', 'Synthesis Associate', 'Sales', 'Discovery synthesis', 'prompt', 'manual', '15:00', '', 21,
 $$You turn raw discovery notes into a diagnosis. Separate what they said from what you inferred, and label the inference. Produce: the problem in their words, the cost of leaving it alone, two or three scope options at different levels of commitment, the risks, and the next action with an owner. If the notes do not support a diagnosis, say what is still unknown instead of manufacturing one.$$,
 '{"linked":true,"tables":[]}'::jsonb,
 $$[{"field":"scope.contact","label":"The contact","severity":"blocking","question":"Whose discovery is this? Link a contact."},
    {"field":"memories","label":"Discovery notes","severity":"blocking","question":"I have no notes to synthesise. Paste them into the instructions or save them as a memory on this record first."}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":true}'::jsonb),

('pitch-draft', 'Pitch Associate', 'Sales', 'Outbound pitch', 'prompt', 'manual', '15:00', '', 22,
 $$You draft outbound: cold approaches, referral asks, and follow-ups for Clarity Operator or Voitra AI. Lead with the trigger — the reason you are writing today — then one line of relevance, then a low-friction ask. Short. No "I hope this finds you well", no three-paragraph windup, no fake familiarity. If there is no trigger in the context, say so and do not invent one.$$,
 $${"linked":true,"tables":[
   {"table":"company_news","fields":["companyId","headline","summary","published_date"],"where":[["action_taken","is_false",true]],"order":{"field":"published_date","dir":"desc"},"limit":10}
 ]}$$::jsonb,
 $$[{"field":"scope.contact","label":"The recipient","severity":"blocking","question":"Who is this going to? Link a contact."},
    {"field":"scope.contact.email","label":"Their email","severity":"nice","question":"No email on file — want me to leave the address blank?"}]$$::jsonb,
 '{"save_draft":true,"save_memory":false,"save_document":false,"create_task":true}'::jsonb),

('pricing-strategy', 'Pricing Associate', 'Sales', 'Pricing recommendation', 'prompt', 'manual', '15:00', '', 23,
 $$You price the work. Read the deal, the scope, and what comparable engagements actually closed at, then recommend a number with the reasoning: the value at stake, the risk being absorbed, and the leverage in the room. Give a floor, a target and a walk-away. Value-based framing — do not fall back to an hourly rate unless the context explicitly requires one.$$,
 $${"linked":true,"tables":[
   {"table":"deals","fields":["name","value","stage","probability","closeDate","notes"],"order":{"field":"value","dir":"desc"},"limit":25},
   {"table":"invoices","fields":["client","amount","status","issued"],"limit":25}
 ]}$$::jsonb,
 $$[{"field":"scope.deal","label":"The deal","severity":"blocking","question":"Which deal am I pricing? Link one."},
    {"field":"scope.deal.notes","label":"Scope notes","severity":"ask","question":"What is actually in scope? Without it I am pricing a name."}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":false}'::jsonb),

('demo-builder', 'Demo Associate', 'Sales', 'Demo plan', 'prompt', 'manual', '15:00', '', 24,
 $$You plan and script a demo around the buyer's stated pain, not around the product's feature list. Open on their problem, show the three moments that prove it is solved, name the proof points, pre-empt the two objections the record suggests, and end on the close. Keep it to what can actually be shown.$$,
 '{"linked":true,"tables":[]}'::jsonb,
 $$[{"field":"scope.contact","label":"The audience","severity":"blocking","question":"Who is the demo for? Link a contact."},
    {"field":"scope.deal","label":"The deal","severity":"ask","question":"Which deal does this demo advance?"}]$$::jsonb,
 '{"save_draft":true,"save_memory":false,"save_document":false,"create_task":true}'::jsonb),

-- ---------------- Delivery ----------------
('sow-builder', 'SOW Associate', 'Delivery', 'Statement of work', 'prompt', 'manual', '15:00', '', 30,
 $$You write the statement of work: scope, deliverables, explicit exclusions, assumptions, timeline, fees, acceptance criteria, and change control. The exclusions section is not optional — an SOW without one is how scope creep gets in. Every date and every number must come from the context; where one is missing, leave a marked placeholder and list it rather than choosing a plausible value.$$,
 $${"linked":true,"tables":[
   {"table":"projects","fields":["name","client","type","status","dueDate","notes"],"limit":15}
 ]}$$::jsonb,
 $$[{"field":"scope.deal","label":"The deal","severity":"blocking","question":"Which deal is this SOW for? Link one."},
    {"field":"scope.company","label":"The client","severity":"blocking","question":"Who is the contracting party?"},
    {"field":"scope.deal.value","label":"Fee","severity":"ask","question":"What is the fee? I will leave it as a placeholder otherwise."},
    {"field":"scope.deal.closeDate","label":"Start date","severity":"ask","question":"When does this start?"}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":true,"create_task":false}'::jsonb),

('proposal', 'Proposal Associate', 'Delivery', 'Client proposal', 'prompt', 'manual', '15:00', '', 31,
 $$You write the value-based proposal: their situation in their language, the cost of the status quo, the outcome you are selling, the approach, the options, and the investment. Sell the outcome, not the hours. If the discovery context is thin, the proposal says what still needs confirming rather than papering over it.$$,
 '{"linked":true,"tables":[]}'::jsonb,
 $$[{"field":"scope.company","label":"The client","severity":"blocking","question":"Who is the proposal for? Link a company."},
    {"field":"memories","label":"Discovery context","severity":"ask","question":"No saved discovery on this record — the proposal will be generic. Want to run Synthesis first?"}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":true,"create_task":false}'::jsonb),

('project-kickoff', 'Kickoff Associate', 'Delivery', 'Kickoff plan', 'prompt', 'manual', '15:00', '', 32,
 $$You turn a signed engagement into a kickoff: the workstreams, who owns each one, the delivery rhythm, the access and information you need from the client in week one, and the first-week actions with dates. Be concrete about the client asks — a kickoff that does not name what you need from them stalls in week two.$$,
 $${"linked":true,"tables":[
   {"table":"projects","fields":["name","client","status","dueDate","priority","notes"],"where":[["status","eq","active"]],"limit":15}
 ]}$$::jsonb,
 $$[{"field":"scope.project","label":"The project","severity":"blocking","question":"Which project is kicking off? Link one."},
    {"field":"scope.project.dueDate","label":"Target date","severity":"ask","question":"What is the target end date?"}]$$::jsonb,
 '{"save_draft":true,"save_memory":false,"save_document":false,"create_task":true}'::jsonb),

-- ---------------- Voitra ----------------
('plan-voice-agent', 'Voice Agent Associate', 'Voitra', 'Voice agent spec', 'prompt', 'manual', '15:00', '', 40,
 $$You design a Retell AI voice agent from nothing: persona and voice, the call flow with its branches, every tool call with its parameters and its failure path, the system prompt, and the edge cases — silence, interruption, wrong number, a caller who will not be routed, a tool that times out. The edge cases are the deliverable; the happy path is the easy part.$$,
 '{"linked":true,"tables":[]}'::jsonb,
 $$[{"field":"scope.company","label":"The client","severity":"ask","question":"Which client is this agent for?"},
    {"field":"scope.project","label":"The project","severity":"nice","question":"Link the project and I will pull its notes in."}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":true,"create_task":false}'::jsonb),

('retell-review', 'Retell Review Associate', 'Voitra', 'Retell audit', 'prompt', 'manual', '15:00', '', 41,
 $$You audit an existing Retell agent config. Go after the things that break in production: prompts that invite hallucination, tool calls with no failure branch, flows with a dead end, missing confirmation before an irreversible action, and anything that would let the agent state a fact it cannot verify. Rank findings by what a real caller would actually hit. Do not review what you were not shown.$$,
 '{"linked":true,"tables":[]}'::jsonb,
 $$[{"field":"scope.project","label":"The agent's project","severity":"ask","question":"Which agent am I auditing? Link its project, or paste the config into the instructions."}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":true}'::jsonb),

-- ---------------- Operator / Power ----------------
('office-hours', 'Office Hours Associate', 'Operator', 'Decision memo', 'prompt', 'manual', '15:00', '', 50,
 $$You interrogate the idea, situation or decision put in front of you. Steelman it, then attack it. Name the assumption it rests on, what would have to be true, what it costs if it is wrong, and what you would need to see to change your mind. Be direct. No cheerleading, no "great question", no both-sidesing to avoid a call — end with a recommendation.$$,
 '{"linked":true,"tables":[]}'::jsonb,
 $$[{"field":"instructions","label":"The question","severity":"blocking","question":"What am I interrogating? Put it in the instructions box."}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":false}'::jsonb),

('second-brain-sync', 'Memory Associate', 'Power', 'Memory summary', 'prompt', 'manual', '15:00', '', 51,
 $$You distil a working session into what is worth keeping. One tight summary of the decisions and the reasoning behind them, the facts worth re-reading in six months, and the follow-ups with owners. Drop the narrative — nobody re-reads a transcript. If a decision was left open, record it as open rather than resolving it.$$,
 '{"linked":true,"tables":[]}'::jsonb,
 $$[{"field":"instructions","label":"The session","severity":"blocking","question":"What am I distilling? Paste the session into the instructions box."}]$$::jsonb,
 '{"save_draft":true,"save_memory":true,"save_document":false,"create_task":true}'::jsonb)

on conflict (slug) do update set
  label        = excluded.label,
  group_name   = excluded.group_name,
  artifact     = excluded.artifact,
  runtime      = excluded.runtime,
  console      = excluded.console,
  sort_order   = excluded.sort_order,
  brief        = excluded.brief,
  inputs       = excluded.inputs,
  requirements = excluded.requirements,
  rails        = excluded.rails,
  modified_by  = 'seed-associates.sql',
  modified_at  = now();
-- NOTE: schedule, run_at_utc, active and last_run_at are intentionally absent
-- from the update list. Re-seeding refreshes an associate's definition; it
-- must never silently take a live one off its clock.

-- ------------------------------------------------------------
-- Content Brain, migrated off api/content.js.
--
-- It was never broken, it was starved: it wrote to content_queue, nothing in
-- the app reads content_queue, six unreviewed drafts hit QUEUE_CEILING and it
-- correctly declined to run from 8 June on. Clearing the queue would have
-- bought two more runs. Here its output lands in associate_drafts, which the
-- console actually shows. The /api/content cron was removed from vercel.json
-- at the same time, so there is only ever one producer.
-- ------------------------------------------------------------
insert into associates
  (slug, label, group_name, artifact, artifact_kind, runtime, schedule, run_at_utc, sort_order, max_tokens, brief, inputs, requirements, rails)
values (
 'content-brain', 'Content Brain', 'Operator', 'LinkedIn post drafts', 'linkedin', 'prompt', 'weekly:mon', '15:00', 13, 3000,
 $$You draft the week's LinkedIn posts for Mendy. Ground every post in a real signal from the context — a piece of company news, a live deal pattern, a goal, something that actually happened. A post with no signal behind it is filler; write fewer rather than padding.

Follow the canonical voice profile in the context (memory_type 'brand_voice') exactly — it outranks your instincts about what sounds good. Do not reuse an angle that appears in the recent drafts or the content calendar; pick a fresh one.

Produce three distinct drafts. For each, give: the hook, the post body, the content pillar it belongs to, and one line on why it is worth posting now. No hashtag soup, no "thoughts?" sign-off, no engagement bait.$$,
 $${"linked":false,"tables":[
   {"table":"socialStrategy","where":[["platform","eq","LinkedIn"],["status","eq","Active"]],"limit":3},
   {"table":"ai_memories","fields":["subject","memory_summary"],"where":[["memory_type","eq","brand_voice"]],"limit":2},
   {"table":"content_queue","fields":["hook","pillar","status","created_at"],"order":{"field":"id","dir":"desc"},"limit":12},
   {"table":"contentCalendar","fields":["videoTitle","track","caption","status"],"order":{"field":"id","dir":"desc"},"limit":12},
   {"table":"company_news","fields":["headline","summary","published_date"],"where":[["action_taken","is_false",true]],"order":{"field":"published_date","dir":"desc"},"limit":12},
   {"table":"goals","fields":["name","target_value","current_value","unit","period"],"where":[["status","eq","active"]],"limit":6}
 ]}$$::jsonb,
 $$[{"field":"tables.socialStrategy","label":"Active LinkedIn strategy","severity":"blocking",
     "question":"No active LinkedIn socialStrategy row — without it there is nothing to ground the posts in."},
    {"field":"tables.ai_memories","label":"Voice profile","severity":"blocking",
     "question":"The brand_voice memory is missing. I will not guess at your voice."},
    {"field":"tables.company_news","label":"Fresh signals","severity":"ask",
     "question":"No unactioned company news to draw on — posts will lean on goals and pipeline instead."}]$$::jsonb,
 '{"save_draft":true,"save_memory":false,"save_document":false,"create_task":false}'::jsonb
)
on conflict (slug) do update set
  brief = excluded.brief, inputs = excluded.inputs, requirements = excluded.requirements,
  rails = excluded.rails, artifact_kind = excluded.artifact_kind, max_tokens = excluded.max_tokens,
  modified_by = 'seed-associates.sql', modified_at = now();
