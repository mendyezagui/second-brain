# Encore — Event Coordination Platform

**Status:** MVP Built · In Active Development  
**Last Updated:** May 28, 2026  
**Owner:** Mendy Ezagui / Aventary  
**First Customer:** Simcha Peer Siev — Lark LA (larkla.com)  
**Pricing:** $149/event flat

---

## Concept

Encore is a real-time event coordination SaaS for weddings, bar mitzvahs, and corporate events. It solves a specific operational problem: on the day of a high-stakes event, 5–15 vendors and 50–500 guests are operating off separate phones with no unified layer.

**Two audiences, two separate apps:**

| Audience | App | URL |
|---|---|---|
| Coordinators, staff, vendors | Admin | https://encore-demo-nu.vercel.app |
| Guests | Guest view | https://encore-guest.vercel.app |

---

## Problem It Solves

- Planners run events from a group chat and spreadsheet
- Guests text the lead coordinator directly for parking, seat info, schedule
- Vendors have no shared runsheet or status feed
- There is no tool purpose-built for day-of event coordination

Encore makes the day itself run. It is not a planning tool or a CRM. It is an operator console for the 6–12 hours the event is actually happening.

---

## Architecture

### Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Fast, two separate builds (admin + guest) |
| Hosting | Vercel (2 projects) | Separate domains per audience |
| Database | Supabase | Postgres + Realtime + RLS in one |
| Schema | `encore` schema inside Second Brain project | Hit 2-project free limit; fully isolated |
| SMS | Telnyx (planned) | 30–70% cheaper than Twilio, same API |
| AI | Anthropic Claude | Haiku for concierge chat, Haiku for OCR/voice extraction |

### Supabase Project
- **Project ID:** `xwacfwagyhgbbhefecdt` (Second Brain project)
- **Schema:** `encore` (all Encore tables isolated here)
- **Dashboard:** https://supabase.com/dashboard/project/xwacfwagyhgbbhefecdt

### Database Tables (13)

```
encore.events             — Event metadata, venue info, client info, status
encore.guest_tiers        — Tier definitions per event (color-coded)
encore.guests             — Guests with phone, seat info, check-in status
encore.guest_tokens       — Magic link tokens (passwordless guest access)
encore.timeline_items     — Runsheet items with scheduled timestamps
encore.staff              — Staff/vendor roster per event
encore.channels           — Team messaging channels (All Staff, Catering, etc.)
encore.channel_messages   — Staff channel messages
encore.conversations      — One conversation per guest (guest ↔ coordinator)
encore.messages           — Individual chat messages (guest/coordinator/AI)
encore.announcements      — Broadcast messages to guests by tier
encore.seating_tables     — Table definitions (type, seats, section)
encore.seat_assignments   — Guest-to-seat mappings
```

**Realtime enabled on:** `messages`, `channel_messages`, `conversations`, `timeline_items`

### Source Code
- **Repo:** Push tarball to GitHub (downloaded May 14, 2026 — `encore-demo.tar.gz`)
- **Key files:**
  ```
  src/App.jsx              Admin coordinator app (command center, team chat, blast)
  src/GuestApp.jsx         Standalone guest app
  src/EventCreator.jsx     6-step event creator with voice input
  src/SeatingManager.jsx   Floor plan, seating, check-in, walk-in mode
  src/supabase.js          DB client + Realtime helpers
  vite.admin.config.js     Admin build → dist-admin/
  vite.guest.config.js     Guest build → dist-guest/
  ```

---

## Features

### Admin App

**Command Center**
- Live timeline with auto-advancing status (in_progress → complete)
- "Happening Now" hero card + one-tap Done button
- Progress bar across all timeline items
- Up Next queue (next 3 items)
- Full collapsible runsheet
- Live guest conversation feed (in-app chat)

**Event Creator (6 steps)**
1. Event type + basics (name, date, times, guest count)
2. Venue (name, address, parking, shuttle, dress code)
3. Client / host (name, role, phone, email)
4. Team & staff (name, role, phone — 18 role types)
5. Guest tiers (pre-loaded by event type, color-coded, editable)
6. Timeline (template auto-loaded, toggle items, edit times)

Each step 1–5 has a **voice input pill** — tap, speak, Claude Haiku extracts structured data and auto-fills all fields. Works on Chrome/Safari.

**Camera Scan**
- 📷 button → opens camera
- Claude Vision reads names from any image (place cards, RSVPs, printed lists)
- Extracted names appear for review → assign tier → add as guests

**Team Chat**
- Channels: All Staff + team-specific (Catering, Photography, Bar, etc.) — loaded from DB
- Direct messages to individual staff
- Supabase Realtime — messages appear instantly without polling
- Grouped messages, online/offline indicators

**Guest Broadcast**
- Tier-targeted announcements
- Quick templates + freeform
- Saves to `encore.announcements`

**Seating Manager** (full-screen overlay, not a persistent tab)
- Setup: Room shape → Sections → Elements → Tables
- Room shapes: Wide Hall, Tall Hall, Square
- Sections: 4 Quarters, 6 Zones, Front/Back, 3 Columns (all renameable)
- Elements: Head Table, Band/Stage, Dance Floor, Podium, Bar, Photo Booth, Custom (freely named)
- Tables: auto-distributes seats evenly from total capacity
- Manage view: floor plan with section zones and table dots
- Check-in tracking per seat: pending / checked in / no show (tap to cycle)
- Walk-in mode: open seats sorted by availability
- Guest search: name → table + seat + check-in status
- Table notes
- Tier-filtered assignment: assigned guests disappear from list

### Guest App (Champagne & Stone design — light)

Loads via magic link token (no account required) or demo mode.

- **My Info** — seat card with table/seat/section, event details
- **Schedule** — gold vertical timeline, live "Now" indicator
- **Updates** — announcements from coordinator, chronological
- **Chat** — real-time in-app chat with AI concierge (Claude Haiku)
  - Conversations persist in `encore.messages`
  - Realtime: coordinator replies appear instantly
  - AI handles: seat lookup, parking, shuttle, dress code, schedule, general

---

## Design Systems

### Admin: Midnight & Champagne (dark)
```
Background:   #131315
Surface:      #201f22
Gold primary: #e6c364
Champagne:    #c9a84c
Emerald:      #4edea3
Font:         DM Sans
```
Rationale: coordinators work in dim ballrooms. Dark UI = no glare, no distraction.

### Guest: Champagne & Stone (light)
```
Background:   #fbf9f4  (warm ivory)
Surface:      #ffffff
Gold primary: #c9a84c
Dark gold:    #755b00  (legible on light bg)
Outline:      #d0c5b2
Font:         Inter (body) + Playfair Display (headlines)
```
Rationale: guests are at a celebration. No shadows, no glass — quiet luxury editorial aesthetic. 1px gold hairline dividers throughout.

---

## Key Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Database | Supabase | Auth + Realtime + RLS built in |
| Schema isolation | `encore` inside Second Brain project | Hit 2-project free limit |
| SMS provider | Telnyx (planned) | 30–70% cheaper than Twilio, same API |
| Guest auth | Magic link, no account | Zero friction for guests |
| Token lifecycle | Rotate on every resend | Security, invalidates old links |
| AI chat | In-app first, SMS later | Supabase Realtime works without a phone number |
| Deployments | Two separate Vercel projects | Different audiences, different design systems, different domains |
| Seating placement | Full-screen overlay, not a nav tab | Set up once, access day-of; shouldn't compete with live ops |
| AI API | Client-side (temp) | ⚠️ Must move to Edge Function before production |
| Event types | 6 types with unique defaults | Each type loads different tiers + timeline template automatically |

---

## Event Type Templates

Each event type auto-loads:
- **Guest tiers** — appropriate to that event (Wedding = Immediate Family, Extended Family, Close Friends, Extended Friends)
- **Timeline template** — 7-item template per type
- **Staff role suggestions**

Types: Wedding, Bar/Bat Mitzvah, Corporate, Birthday, Anniversary, Custom

---

## Open Items

| Priority | Item |
|---|---|
| 🔴 | Move AI API calls to Edge Function proxy (key currently client-side) |
| 🔴 | Tighten RLS to auth-only before real event data |
| 🔴 | Push source to GitHub (tarball downloaded May 14) |
| 🟡 | CSV guest import UI |
| 🟡 | Onboarding: create event → import guests → send magic links |
| 🟡 | Telnyx SMS integration (send magic links + day-of broadcasts) |
| 🟡 | "Powered by Encore" viral CTA on guest view |
| 🟡 | Calendar block: Mon June 2 10–10:30 AM PST (dev session) |
| 🟢 | Voitra voice AI for inbound guest calls |
| 🟢 | WhatsApp as SMS alternative |
| 🟢 | Printed seating chart / PDF export |
| 🟢 | Meal preference per seat |
| 🟢 | pg_cron server-side auto-advance (currently client-side) |

---

## Next Milestone

**Simcha pilot** — Lark LA, 8834 W Pico Blvd, Los Angeles · info@larkla.com  
Find a June or July event. Run Encore live on it.

Pre-pilot checklist:
1. Push source to GitHub
2. Edge Function proxy for AI
3. Lock down RLS
4. Build magic link send flow so guests actually receive their link
5. CSV guest import

---

## Chat History

Full build session (naming → architecture → deployment → seating → voice → real DB):  
`https://claude.ai/chat/[PASTE-CONVERSATION-ID]`  
*(Open the Encore build chat in your browser and paste the URL here)*

Transcript on disk: `2026-05-14-15-39-58-encore-event-platform-build.txt`
