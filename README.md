# Homework Planner

A phone-first homework assistant: it pulls your assignments from Canvas automatically,
schedules study blocks working backward from due dates, and shows a "Today" list you
just check off. Built to need almost no maintenance.

## How it works (high level)

- **Next.js app** (React) deployed free on **Vercel**. One command deploy, no server to
  manage.
- **Canvas feed proxy**: your Canvas `.ics` calendar URL is a secret (anyone with it can
  see your assignments), and Canvas blocks fetching it directly from a browser (CORS). So
  there's a tiny serverless function at `app/api/canvas/route.ts` that runs on Vercel,
  fetches the feed server-side using an environment variable (`CANVAS_ICS_URL`), and hands
  back plain JSON. Your Canvas link is never shipped to the browser or committed to git.
- **Parsing**: `lib/titleParser.ts` decodes the shorthand teachers cram into the Canvas
  event title (`AT`/`PP`, `(R)`/`(NR)`, `DD`/`DL` dates, in-class markers). `lib/estimator.ts`
  turns "what kind of assignment is this" into a time estimate using the defaults in
  `seed_data.json`.
- **Scheduling**: `lib/scheduler.ts` takes every assignment, splits big ones into 25-60
  minute blocks, and packs them into your available-time windows (Settings) working
  backward from each due date — big tasks get spread across several days, small easy-class
  items land on the due date itself. Nothing is ever silently dropped: anything that can't
  fit shows up in a "couldn't fit" list.
- **Learning**: after you check off a block, three buttons ask how the estimate did
  ("faster" / "about right" / "took longer"). That nudges a per-class-per-type multiplier
  ±15% (clamped 0.5×-2.5×) that's applied to future estimates for that same kind of work.
- **Storage**: everything (done history, learned estimates, settings) lives in the
  browser's `localStorage` — no account, no database, free. Since clearing your browser
  would erase that history, **Settings → Backup** lets you export/restore a JSON snapshot.
  If you outgrow this later, the natural free upgrade is Vercel KV (a few clicks in the
  Vercel dashboard) — the store is already isolated in `lib/store.ts` so swapping the
  persistence layer is a small, contained change.
- **PWA**: there's a manifest + a small service worker so you can add it to your phone's
  home screen and it opens instantly (cached app shell) even with a flaky connection.

## The two sources of assignment data

1. **Canvas** (automatic) — re-fetched on load and every ~2 hours via the API route above.
2. **`seed_data.json`** (manual, at the repo root) — everything Canvas doesn't have:
   the AP Calc BC schedule (transcribed from the teacher's PDF) and the AP World reading
   quiz calendar. When the Calc teacher hands out an updated PDF, send it back through
   Claude Code to re-transcribe the `calc_bc_schedule` section of this file and redeploy —
   that's the entire update process. Everything else (parsing rules, scheduling logic,
   estimates) reads from this same file, so it's the one place to edit for schedule
   changes, no-school days, or time estimate tuning.

## Deploying (free, on Vercel)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to [vercel.com](https://vercel.com), "Add New Project", import this repo.
3. In the project's Settings → Environment Variables, add:
   - `CANVAS_ICS_URL` = your Canvas calendar feed URL (the one from the brief).
4. Deploy. Vercel's free Hobby tier covers this with room to spare.
5. Open the deployed URL on your phone, then "Add to Home Screen" (Safari: Share → Add to
   Home Screen; Chrome: menu → Add to Home screen) so it behaves like an app.

For local development, copy `.env.example` to `.env.local` and fill in your feed URL, then:

```bash
npm install
npm run dev
```

## What's a heuristic, not gospel

This is a best-effort read of a messy, hand-written syllabus shorthand — a few things are
deliberately approximate and worth knowing about:

- The title parser handles every example format in the brief, but a teacher inventing a
  new shorthand next quarter may need a small regex tweak in `lib/titleParser.ts`.
- Multi-block spreading (e.g. "3 blocks over the unit" for a Physics practice set) uses an
  even-spacing heuristic, not a real optimizer — it's tuned to feel reasonable, not to be
  provably optimal.
- The Calc BC `"review"` and `"event"` rows (in-class review sessions, PSAT, etc.) are
  shown on their day but don't get their own study blocks, since the scheduler already
  generates its own review blocks ahead of each quiz/test deadline.
- AP Lang essay steps are scheduled individually as Canvas posts them; the app doesn't
  invent brainstorm/draft/peer-review steps on its own if Canvas only posts one combined
  essay assignment.

## Nice-to-haves not built yet

- Push notification at 3:45 PM with the day's plan (would need a paid push service or a
  scheduled Vercel Cron hitting a browser push endpoint — skipped to keep this free and
  zero-maintenance).
- Exporting the schedule as a subscribable `.ics` feed for Google Calendar.

## Don't

This app only plans. It never generates, edits, or summarizes assignment content — every
class here has a no-AI policy on submitted work, and the scheduler only ever sees titles,
categories, and dates.
