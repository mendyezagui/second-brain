# SoFa Developer Associate

The build half of the pair. Console: `#/sofa_dev`.

The two associates split by **question**, not by subject:

| | asks | owns |
|---|---|---|
| **SoFa JCC** (`sofa-jcc`) | *What does the community need this week?* | Calendar, holidays, flyers, speakers, brand, nudges |
| **SoFa Developer** (`sofa-dev`) | *What has to be built, and is it built yet?* | Work orders, build specs, in-app artifacts, repo handoffs |

They talk through exactly one object: a **work order** (`sofa_work_orders`).

## The loop

```
business associate            work order              developer associate
──────────────────            ──────────              ───────────────────
flyer reaches "ready"   ──►   raised (deduped)   ──►  spec it
                                                        │
Mendy raises one by hand ─►                             ├─ buildable here?
                                                        │    └─ build → artifact stored
                                                        └─ needs the repo?
                                                             └─ handoff brief → Claude Code
```

A work order is auto-raised **only when a flyer has no gaps left**. A
half-finished flyer is the business associate's problem, not the developer's —
otherwise the queue fills with things nobody can act on.

## What it can finish here vs. hand off

| kind | buildable in-app | why |
|---|---|---|
| `flyer_publish` | ✅ | Renders the approved flyer from the locked template |
| `asset` | ✅ | Resize/crop/re-export against the brand |
| `content` | ✅ | Drafts copy in the house voice; you apply it |
| `label_sheet` | ✅ | Generates the 4-up sefarim dedication sheet |
| `page` | ❌ | Touching `sofajcc/*.html` is repo work |
| `fix` | ❌ | Same |

## The handoff brief

For anything it can't finish, it writes a **standalone** brief — the receiving
session has none of this context, so the brief carries: the repo and path, the
request, the build spec, the shul's real identity and brand sources, testable
acceptance criteria, and the standing rules (invent nothing, publish nothing,
branch don't push to main).

Copy it into a Claude Code session on `mendyezagui/aventary` and it runs
unattended.

## Blunt limitation

**It does not push to sofajcc.org.** It holds no GitHub credential, by design.

Full autonomy would need, in order:

1. A fine-grained GitHub token scoped to `mendyezagui/aventary`, contents:write
   — stored as a Vercel env var, never in the repo.
2. A commit path in `api/sofa-dev.js` that writes a branch and opens a PR
   (never commits to `main`).
3. A rail saying it may open a PR but never merge one.

That is a deliberate decision to make, not a default to drift into. Say the
word and it's maybe an hour of work.

## Spec rules

The `spec` action is told, hard:

- Do not add scope.
- Do not invent facts, times, addresses or names.
- If something needed is missing, list it under `BLOCKED` instead of guessing.

**Blocked beats ready.** An order missing a fact is marked `blocked` with the
missing items named, so it never *looks* runnable when it isn't.
