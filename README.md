# べんきょうさぎ (benkyousagi)

A study-timer app for two, where your focus time keeps a hand-drawn rabbit companion happy.

Built as a private gift project for exactly two people (fixed accounts, PIN login, no
sign-up flow) — not a general-purpose SaaS. This repo is shared as a portfolio piece:
the code and the ~1,300-line requirements doc are public, but the live deployment is
intentionally kept private and isn't linked from here.

|                             |                             |                            |
| --------------------------- | --------------------------- | --------------------------- |
| ![login](docs/screenshots/login.png) | ![home](docs/screenshots/home.png) | ![timer setup](docs/screenshots/timer-setup.png) |
| ![shop](docs/screenshots/shop.png)   | ![compare](docs/screenshots/compare.png) | |

*(screenshots use placeholder names/data, not the real accounts)*

## What it does

- **Three timer modes** — count-up, count-down, and Pomodoro (with skippable breaks),
  plus a manual-entry fallback for a session you forgot to time.
- **A rabbit that reacts to real effort.** Energy rises while you study and decays if
  you go quiet for a while, driving six expression stages — not a punishing "streak"
  mechanic, just a companion that visibly misses you.
- **Anti-cheating guardrails** baked into the timer state machine: server-issued
  timestamps, inactivity auto-stop, and crash/close recovery so a closed tab can't be
  used to fake study time.
- **A shared "how's the other person doing" view** — a always-visible comparison widget
  plus a detail screen with daily/weekly/tag-based breakdowns for both accounts.
- **A small coin economy** earned by studying and spent in a shop: cosmetic accessories,
  outfits, room furniture, and a few just-for-fun consumables — deliberately kept
  separate from the rabbit's energy system so coins can never be "farmed" by spamming
  sessions.
- Every screen is designed mobile-first in soft, hand-drawn SVG (no icon font, no
  illustration library) and works equally as a PC layout.

## Tech stack

- **Next.js 16** (App Router, Turbopack, Server Actions) + **React 19**
- **Prisma 7** with the new driver-adapter model — same schema runs against a local
  SQLite file in dev and [Turso](https://turso.tech) (libSQL) in production, both on
  free tiers
- **Tailwind CSS 4** + **Framer Motion** for the rabbit's idle/react animations
- **Recharts** for the study-time breakdown charts
- Auth is a from-scratch PIN + signed-cookie session (no external identity provider —
  overkill for two fixed accounts)

## A few things worth pointing at

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — the full requirements spec this was
  built against, written and iterated on *before* implementation: functional spec,
  explicit non-goals, data model, and a running decision log. Development followed a
  two-role split (a "requirements/creative direction" pass and a separate
  "implementation" pass), which is why the spec reads like a real handoff document
  rather than after-the-fact documentation.
- [`src/app/timer/run/[sessionId]/_lib/engine.ts`](src/app/timer/run/[sessionId]/_lib/engine.ts) —
  the timer is modeled as a pure, testable state machine (not scattered `useState`
  calls), which is what makes the pause/resume/inactivity-recovery edge cases
  tractable.
- [`src/lib/rabbit-status.ts`](src/lib/rabbit-status.ts) — the energy/decay math is a
  pure function of "last session end time," recomputed at read time rather than
  stored/ticked, so it's correct regardless of how long the app was closed.
- [`src/app/apple-icon.tsx`](src/app/apple-icon.tsx) — the iOS home-screen icon is
  generated at build time from the same hand-authored rabbit SVG parts used everywhere
  else in the app, via `next/og`'s `ImageResponse`, instead of a separately exported
  static asset.
- [`DEPLOY.md`](DEPLOY.md) — the free-tier Vercel + Turso deployment path, including
  the workaround needed because `prisma migrate deploy` doesn't recognize Turso's
  `libsql://` connection scheme.

## Running it yourself

This is not set up for multi-tenant/public use — there's no sign-up, and the shop's
catalog is hardcoded (see the comment in `src/lib/shop.ts` for why). But the local dev
loop is a normal Next.js + Prisma setup:

```bash
npm install
npm run db:migrate      # applies migrations to a local prisma/dev.db
npm run db:seed         # creates the two fixed accounts (env vars override the names/PINs)
npm run dev
```

See [`DEPLOY.md`](DEPLOY.md) if you want to point it at your own free-tier Turso +
Vercel setup instead.
