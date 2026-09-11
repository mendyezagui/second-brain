// Tests for the associate decision core.
//
// The core is pure by design, which is the whole reason it can be tested at
// all — no Supabase, no model, no network. Run with `npm run test:associates`.
// Anything that changes the clock, the filters or the gap rules should fail
// here before it reaches a cron that runs unattended at 15:00 UTC.

import { planAssociate, planTick, isDue, parseSchedule, nextRunAt, computeGaps, draftStatus, runKey } from "./core.js";

let failures = 0;
const ok = (n, c) => { if (!c) failures++; console.log((c ? "PASS" : "FAIL") + "  " + n); };

// schedule vocabulary
ok("daily parses",        parseSchedule("daily").kind === "daily");
ok("weekly:fri parses",   parseSchedule("weekly:fri").day === "fri");
ok("monthly:15 parses",   parseSchedule("monthly:15").dom === 15);
ok("monthly:31 refused",  parseSchedule("monthly:31").kind === "manual");
ok("typo -> manual",      parseSchedule("weakly:mon").kind === "manual");

// the clock
const fri = new Date("2026-09-11T16:30:00Z");   // Friday
const A = { slug:"s", active:true, runtime:"prompt", schedule:"weekly:fri", run_at_utc:"16:00" };
ok("due on its day+time", isDue(A, { now: fri }).due === true);
ok("not before its time", isDue(A, { now: new Date("2026-09-11T15:59:00Z") }).due === false);
ok("not on wrong day",    isDue(A, { now: new Date("2026-09-10T18:00:00Z") }).due === false);
ok("already ran blocks",  isDue(A, { now: fri, alreadyRan: new Set(["s:2026-09-11"]) }).due === false);
ok("custom skipped",      isDue({ ...A, runtime:"custom" }, { now: fri }).due === false);
ok("retired skipped",     isDue({ ...A, active:false }, { now: fri }).due === false);
ok("run_key is per-day",  runKey("s", { now: fri }) === "s:2026-09-11");
ok("nextRunAt is a Fri",  nextRunAt(A, new Date("2026-09-12T00:00:00Z")).getUTCDay() === 5);

// gaps
const reqs = [
  { field:"scope.deal",       label:"Deal",  severity:"blocking" },
  { field:"scope.deal.value", label:"Fee",   severity:"ask" },
  { field:"tables.projects",  label:"Projects", severity:"nice" },
];
ok("all missing",     computeGaps(reqs, {}).length === 3);
ok("nested resolves", computeGaps(reqs, { scope:{ deal:{ value: 5000 } }, tables:{ projects:[1] } }).length === 0);
ok("empty array=gap", computeGaps(reqs, { scope:{ deal:{ value: 1 } }, tables:{ projects:[] } }).length === 1);
ok("answered stops",  computeGaps(reqs, {}, { "scope.deal":"x", "scope.deal.value":"y", "tables.projects":"z" }).length === 0);
ok("blocking status", draftStatus(computeGaps(reqs, {})) === "needs_input");
ok("ready status",    draftStatus([]) === "ready");

// the instructions-only associate — the bug just fixed
const inst = { id:1, slug:"office-hours", label:"Office Hours", artifact:"Decision memo",
  inputs:{ tables:[], linked:true },
  requirements:[{ field:"instructions", label:"The question", severity:"blocking" }] };
const empty  = planAssociate(inst, {}, { trigger:"manual" });
const typed  = planAssociate(inst, {}, { trigger:"manual", instructions:"Should I take the Qualiphy retainer?" });
ok("no instructions -> skip",   empty.skip === "no_input");
ok("no instructions -> gap",    empty.gaps.length === 1);
ok("instructions -> runs",      typed.skip === null);
ok("instructions -> no gap",    typed.gaps.length === 0);
ok("instructions in prompt",    typed.user.includes("Qualiphy retainer"));
ok("instructions not doubled",  typed.user.split("Qualiphy retainer").length - 1 === 1);
ok("instructions in digest",    typed.context.digest.instructions > 0);

// filters
const src = { deals: [
  { id:1, name:"A", value:100, stage:"discovery",   closeDate:"2026-09-20" },
  { id:2, name:"B", value:900, stage:"closed_lost", closeDate:"2026-09-20" },
  { id:3, name:"C", value:500, stage:"proposal",    closeDate:"2027-01-01" },
]};
const F = { id:2, slug:"f", label:"F", artifact:"x", inputs:{ linked:false, tables:[
  { table:"deals", fields:["name","value"], where:[["stage","nin",["closed_lost"]],["closeDate","before","today+60"]],
    order:{ field:"value", dir:"desc" }, limit:10 } ]}, requirements:[] };
const p = planAssociate(F, src, { now: fri, trigger:"cron" });
ok("where nin excludes",   !JSON.stringify(p.context.tables.deals).includes('"B"'));
ok("today+60 excludes C",  !JSON.stringify(p.context.tables.deals).includes('"C"'));
ok("fields projected",     Object.keys(p.context.tables.deals[0]).join() === "name,value");

// the tick
const tick = planTick([A, { ...A, slug:"t2", schedule:"manual" }], { now: fri });
ok("tick picks the due one", tick.due.length === 1 && tick.due[0].associate.slug === "s");

const failed = failures;
if (failed) { console.error(`\n${failed} test(s) failed.`); process.exit(1); }
console.log("\nAll core tests passed.");
