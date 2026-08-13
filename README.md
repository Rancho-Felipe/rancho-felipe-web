# Rancho Felipe — booking website

A booking site for a private farm resort in Teresa, Rizal. Two units — the Casita
and the Gazebo — each with its own pool and its own calendar, sold as day tours,
night tours, or 22-hour stays.

If you just want to run the resort day to day, you want **[OWNERS-GUIDE.md](OWNERS-GUIDE.md)**,
not this file. This one is for whoever sets the site up or changes it.

---

## Running it on your own computer

You need [Node.js 20.9 or newer](https://nodejs.org). Nothing else — no Docker,
no database to install.

```bash
npm install
cp .env.example .env
```

Open `.env` and set `ADMIN_PASSWORD`. Everything else can stay as it is for now.
The admin username defaults to `vanzdix` and is set by `ADMIN_USERNAME`; signing
in accepts either that or the email address.

Then, in **two separate terminal windows**:

```bash
npm run db:dev
```

```bash
npm run db:deploy && npm run db:seed && npm run dev
```

The first window runs a real PostgreSQL 18 that ships inside the project. Leave
it open. The second sets up the tables, fills in the resort's rates and reviews,
and starts the website at **http://localhost:3007**.

Sign in to the admin at `/admin` with the username and password from your `.env`.

To change the password later, put a new one in `ADMIN_PASSWORD` and run
`npm run db:seed` again — it updates the existing account rather than adding a
second one.

> If anything in the database goes strange, delete the `.pgdata` folder and run
> those commands again. Nothing important lives there — it is a scratch copy.

## The commands

| Command | What it does |
|---|---|
| `npm run dev` | The website, at http://localhost:3007 |
| `npm run db:dev` | The local database. Leave it running in its own window. |
| `npm run db:deploy` | Creates or updates the tables |
| `npm run db:seed` | Fills in units, rates, add-ons, reviews and the admin account |
| `npm run db:studio` | A spreadsheet-like view of the raw data |
| `npm test` | Runs the tests (needs the database running) |
| `npm run typecheck` | Checks the code for mistakes |
| `npm run build` | Builds the production version |

## Settings in `.env`

Only two matter on day one.

| Setting | What happens without it |
|---|---|
| `DATABASE_URL` | Nothing works. Already filled in for local use. |
| `ADMIN_PASSWORD` | No admin account is created by the seed. |
| `RESEND_API_KEY` | **Bookings still work, but no emails are sent.** Receipts are written to the terminal instead. |
| `AUTH_SECRET` | Sign-in breaks in production. Any long random string. |
| `CRON_SECRET` | The scheduled jobs refuse to run. Any long random string. |
| `PAYMONGO_*` | Card payments stay off. GCash, Maya and BPI still work through receipt upload. |

### Turning on email

Receipts need an account at [resend.com](https://resend.com).

1. Sign up and create an API key. Paste it into `RESEND_API_KEY`.
2. Until you verify a domain there, Resend only delivers to **your own** email
   address. Guests will not receive anything. This is Resend's rule, not a bug.
3. To email real guests, add `ranchofelipe.ph` (or whatever domain you use) in
   Resend, follow their DNS steps, then set `EMAIL_FROM` to an address at that
   domain.

Until then the site works completely — it just doesn't send mail, and says so on
the admin settings page.

---

## Putting it on the internet

### 1. A real database

Sign up at [Neon](https://neon.tech) or [Supabase](https://supabase.com) — both
have free tiers. Create a Postgres database and copy its connection string.

**It has to be PostgreSQL.** The rule that stops two guests booking the same
dates is a Postgres feature (an exclusion constraint) and does not exist in
MySQL or SQLite. It also has to be **UTF-8**, which every hosted Postgres is by
default — otherwise the peso sign cannot be stored.

### 2. Deploy

Push this folder to GitHub, then import it at [vercel.com](https://vercel.com).
Add every value from your `.env` in Vercel's *Environment Variables* screen, with
`DATABASE_URL` pointing at the hosted database and `NEXT_PUBLIC_SITE_URL` at your
real address.

After the first deploy, run the setup against the live database from your own
computer:

```bash
DATABASE_URL="<the hosted connection string>" npm run db:deploy
DATABASE_URL="<the hosted connection string>" ADMIN_PASSWORD="<a strong one>" npm run db:seed
```

### 3. Scheduled jobs

`vercel.json` already schedules `/api/cron` twice an hour. It releases expired
holds and pulls the Airbnb calendars. Vercel picks it up automatically; just make
sure `CRON_SECRET` is set.

---

## How it is built

Next.js 16 (App Router), TypeScript, Tailwind v4, Prisma 7 on PostgreSQL,
Auth.js for the single admin login, Resend for email.

Read `AGENTS.md` before changing anything: this is Next.js **16**, and several
things moved from the version most guides describe — `middleware` is now
`proxy.ts`, `params` is awaited, and Turbopack is the default.

### The parts worth understanding

**Bookings are timestamps, not dates.** The resort sells three overlapping
windows — 07:00–17:00, 20:00–06:00, and 14:00–12:00 the next day. Storing dates
could not express "the night tour ends at 6am, so the day tour can still run".

**Double-booking is prevented by the database, not by code.** A Postgres
exclusion constraint (`prisma/migrations/…_booking_overlap_guard`) refuses any
booking whose held window overlaps a live one on the same unit. Two guests
pressing Book at the same instant means one succeeds and one gets a clear
message. There are tests for exactly this.

**Turnover is added to both ends of a booking**, so 30 minutes means an hour
between groups. It cannot go above 30 — that would eat the whole gap between a
night tour ending at 06:00 and a day tour starting at 07:00, and silently make
that pair unsellable. The settings page enforces it.

**Prices are never trusted from the browser.** The booking form shows a quote,
and the server recomputes every peso from the database before saving. The price a
guest was shown is frozen onto their booking, so changing a rate later never
rewrites an old booking.

**A failed Airbnb import does not clear its blocks.** If the feed can't be read,
the previously imported dates stay blocked and the admin dashboard shouts about
it. Stale blocks are far safer than absent ones.

**Photos are pre-built.** Every image was converted to AVIF and WebP at fixed
widths during setup and is served with a plain `<picture>` — the Next image
optimiser never touches them, which is faster and costs nothing on Vercel.
`content/manifest.json` maps every file. To add photos, put them through the same
process and add them to the manifest.

### Where things live

```
content/          manifest.json (every photo, rate, review) and policy.json (the rules)
prisma/           schema, migrations, seed
scripts/dev-db.mjs  the local PostgreSQL
src/app/          pages and API routes
src/lib/booking/  pricing, schedule, availability, overlap, calendar sync
src/lib/email/    templates and sending
src/lib/admin/    the owner's actions
public/media/     the processed photos and videos
```

`content/policy.json` is the source of truth for the resort's rules. If a price
or a rule looks wrong, start there — and note that anything the owner has since
edited in admin lives in the database and wins.

## Tests

```bash
npm test
```

52 tests. The pricing and schedule ones run anywhere; the booking ones need the
database running, because they test a database guarantee. Mocking it would prove
nothing.

## Still to do

- **PayMongo** for card and e-wallet payments. The toggle exists in admin and is
  off; the manual GCash/Maya/BPI flow is complete and is how the resort already
  operates, so the site launches without a merchant account.
- A few open questions in [CONTENT-GAPS.md](CONTENT-GAPS.md) — mostly small
  facts nobody has written down yet.
