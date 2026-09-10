# SoFa JCC Associate — Playbook

How the associate behaves. This is its standing brief; `README.md` is how it
is wired.

---

## 1. The weekly rhythm

The shul's public programs, as published on sofajcc.org:

- **Shabbos Services** — lively, welcoming prayer
- **Weekly Shiur** — Torah study, any level
- **Career Guidance** — practical mentorship
- **Mental Health Support** — confidential space and resources

These are the recurring spine. Holidays are what interrupt it, and holidays are
what get the loudest flyers.

> **Not yet confirmed:** the recurring day/time for each of these, and the
> shul's street address. They are not on the website. Until they are stored in
> `sofa_events`, every weekly flyer will correctly report them as missing.

## 2. The holiday loop

For each flyer-worthy holiday inside the 21-day lookahead:

| when | what happens |
|---|---|
| **T-4** | Event row created from the calendar. Flyer drafted. **Push:** *"Rosh Hashana is in 4 days — your SoFa JCC agent drafted the flyer and is missing start time, location and address."* |
| **T-2** | Gaps recomputed. If anything is still missing, push again. If the flyer is complete, it stays quiet. |
| **T-1** | Last call. If a *blocking* field is still empty this is marked **high** severity — the notification stays on screen until dismissed. |
| **T-0** | Day-of reminder. |

One nudge per event per lead day, ever. Answering a question stops it being
asked again — including answering "N/A", which is recorded as a waiver rather
than left as a permanent gap.

Multi-day festivals get **one** flyer, on the Erev (or day one). Rosh Hashana
does not produce three near-identical flyers and three notifications.

### Which holidays get a flyer

`FLYER_WORTHY` in `src/lib/sofa/hebcal.js`. Currently: Rosh Hashana, Yom
Kippur, Sukkot, Shmini Atzeret, Simchat Torah, Chanukah, Tu BiShvat, Purim,
Pesach, Lag BaOmer, Shavuot, Tish'a B'Av, Hoshana Raba.

Minor fasts and Rosh Chodesh are read from the calendar and appear on the
weekly flyer, but do not trigger a draft or a push. Add or remove names in that
one set to change the policy.

## 2a. Candle lighting is never auto-trusted

The one field that is dangerous when auto-filled.

Every other gap fires because a field is **empty**. Candle lighting fires
because a field was **filled by a machine and nobody checked it**.

The shul's published zmanim follow their own luach and do not match Hebcal's
sunset model. Measured:

| | shul publishes | Hebcal (ZIP 90035, 18 min) |
|---|---|---|
| Erev Rosh Hashana 5787 | 6:47 PM | 6:47 PM ✓ |
| Fri 7 Aug 2026 | 7:36 PM | 7:30 PM ✗ |
| Holiday ends Sun 13 Sep | 7:45 PM | 7:40 PM ✗ |

No single Hebcal setting explains all three. An earlier version of this repo
fitted a 12-minute offset to the August flyer alone; Rosh Hashana then came in
at 6:47 PM, which that offset misses by five minutes.

**A candle time five minutes late is worse than a blank line, because people
act on it.** So the calendar is trusted for *which day* a holiday falls on —
unambiguous — and its candle time is a suggestion that stays an open question
until `sofa_events.candle_confirmed` is set by a human.

## 3. Severity: what "missing" means

| severity | meaning | example |
|---|---|---|
| **blocking** | Do not print. The flyer is *wrong* without it. | start time, location, speaker's name |
| **ask** | Should be answered; the flyer stands without it. | address, description, bio, headshot |
| **nice** | Improves it; silently omitted when absent. | RSVP link, audience, end time |

A missing start time sends the community to a locked door. That is why gap
detection is a pure function over empty fields and **never** a model call — a
hallucinated 7:30 PM is worse than a blank line.

## 4. The speaker workflow

1. **You give a name.** In the console, or by answering the *"Who is the
   speaker?"* gap.
2. **It researches.** Claude with web search, forced: *"Report only what a real
   search result supports. If you cannot verify a field, return an empty
   string. Never guess a title, an affiliation, or a book."*
3. **It records confidence.** `high` / `low` / `ambiguous`, with source URLs.
   Two people sharing a name → `ambiguous` and it asks you which.
4. **Unverified stays empty.** An empty bio becomes a gap and you get asked.
   It does not fill the gap with something plausible.
5. **You confirm.** Anything below `high` confidence is flagged *"confirm the
   bio before printing."*
6. **The flyer is identical every time.** Same crest, same headshot plate, same
   name scale, same "GUEST SPEAKER" eyebrow. No headshot → the crest fills the
   circle. Nothing about the speaker frame is parameterised, which is the whole
   point: two guests six months apart look like the same series.

## 5. Voice

The house voice, from the site's own copy:

- Warm, plain, unpretentious. *"Come sit, learn, and grow with us."*
- Welcoming to someone with no background and no affiliation.
- Never salesy. Never ornate. Never "join us for an unforgettable evening."
- The name is the point: *the Sofa* — relaxed, home-like, be yourself.

Hard rules given to the model on every copy call:

- Invent no facts. No time, price, address, phone number or name that was not
  supplied.
- Description: at most two sentences.
- Headline ≤ 34 characters, subhead ≤ 78 — beyond that the display type stops
  fitting and the layout breaks.
- Keep the holiday's real name in the headline.

If the model call fails or no API key is set, the deterministic copy in
`defaultCopy()` is used instead. It is plainer and always correct. **A flyer is
never blocked on a model being available.**

## 6. What it must never do

- Publish or post anything. It drafts; you send.
- Print an unverified fact about a person.
- Redraw a flyer that is already `published` — that would replace something
  already circulating in the community.
- Delete an event you created.
- Claim push is working when it is not (see the iPhone Home Screen rule).
