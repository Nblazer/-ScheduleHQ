# ScheduleHQ

Free, professional shift scheduling for teams. Built with Next.js, Prisma, and Tailwind. Deploys to Vercel at zero cost.

## What's inside

- **Multi-workspace memberships** — any user can belong to many organizations, with different roles in each
- **Role hierarchy** — Owner → Admin → Manager → Employee, with proper gating
- **Schedule** — week view, shift assignment, per-day notes ("milk machine cleaning day", "inspection day")
- **Announcements** — company-wide posts, pin to top, optional email blast
- **Reports** — employees file issues, managers triage and respond
- **Team management** — invite by email or add existing ScheduleHQ users directly; copy-paste invite links for when email isn't set up
- **Theme customization** — 4 presets × 6 accents, per-user or workspace default
- **Email verification** — every new account confirmed via emailed link
- **Account deletion** — users can permanently delete themselves (blocked if you're the sole Owner of a workspace; authored records are reassigned to the remaining Owner)
- **Session auth** — HTTP-only cookies, bcrypt-hashed passwords, secure-flag in prod

## Upgrading an existing deployment

If you already have ScheduleHQ deployed from before the multi-workspace change, pull the new code, then run once:

```bash
# Apply schema changes (adds Membership table, Session.activeOrganizationId).
# Non-destructive — no data loss.
DATABASE_URL="<your prod Neon URL>" npx prisma db push

# Backfill: create a Membership for every existing user, copied from their
# previous single-org assignment. Safe to run more than once.
DATABASE_URL="<your prod Neon URL>" node scripts/backfill-memberships.mjs
```

Then redeploy on Vercel (git push triggers auto-deploy). Your existing accounts and data are preserved.

## Getting started locally

### 1. Prereqs

- Node.js 18.17+ or 20+
- A free PostgreSQL database (see "Set up a database" below)
- Optional: a free Resend account for transactional email

### 2. Install

```bash
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```
DATABASE_URL=postgresql://...
SESSION_SECRET=<random 32+ bytes>
RESEND_API_KEY=re_xxx       # optional in dev — emails log to console if missing
EMAIL_FROM="ScheduleHQ <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Push the schema

```bash
npx prisma db push
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 and click **Create workspace** — that first account becomes the Owner.

## Set up a database (free)

We recommend **Neon** (serverless Postgres, generous free tier):

1. Go to https://neon.tech → sign up
2. Create a new project → name it `schedulehq`
3. Copy the **connection string** (it should end with `?sslmode=require`)
4. Paste it into `.env` as `DATABASE_URL`
5. Run `npx prisma db push` to create the tables

Alternatives: **Supabase**, **Railway**, **Aiven**, or self-hosted Postgres.

## Set up email (Resend)

**Invite links work without email.** If Resend isn't configured, the Team page gives you a link to copy-paste — useful for texting/Slacking invites to teammates. Verification emails log to the server console in dev.

When you're ready to send real email:

### Option A: Use Resend's shared sender (testing only)

Fastest path. No DNS setup.

1. Go to https://resend.com → sign up → create an API key
2. Vercel → **Settings → Environment Variables**:
   - `RESEND_API_KEY` = your key
   - `EMAIL_FROM` = `ScheduleHQ <onboarding@resend.dev>`
3. Redeploy

**Limitation:** `onboarding@resend.dev` can only deliver to the email address that owns the Resend account. Fine for testing yourself, but your teammates won't receive anything. You'll need Option B for real use.

### Option B: Verify your own domain (for real use)

1. Buy a domain if you don't have one (Namecheap, Cloudflare Registrar — ~$10/yr)
2. Resend → **Domains → Add Domain**
3. Copy the DNS records Resend gives you (usually 3-4: DKIM, SPF, optionally DMARC/MX)
4. Paste those into your DNS provider. Wait ~5 min.
5. Click **Verify** in Resend
6. Set `EMAIL_FROM` = `ScheduleHQ <noreply@yourdomain.com>` (or any address at your verified domain)
7. Redeploy

Resend free tier: 3,000 emails/month, 100/day. Plenty for most small teams.

## Deploy to Vercel (free)

1. Push this repo to GitHub
2. https://vercel.com → **Add New → Project** → import the repo
3. **Environment Variables** — add:
   - `DATABASE_URL` (from Neon)
   - `SESSION_SECRET` (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
   - `RESEND_API_KEY`, `EMAIL_FROM` (optional — app works without)
   - `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. `https://schedulehq.vercel.app`)
4. Click **Deploy**

First deploy after Neon setup, run once from your machine:

```bash
DATABASE_URL="<prod url>" npx prisma db push
```

## Role model

| Role     | Can do                                                                 |
| -------- | ---------------------------------------------------------------------- |
| Owner    | Everything. At least one per workspace.                               |
| Admin    | Manage managers/employees, workspace theme & settings.                 |
| Manager  | Build schedules, post announcements, handle reports, invite employees. |
| Employee | View schedule & announcements, file reports.                           |

Roles are **per-workspace** — you might be Owner of your own business and Employee at a friend's. Each role can only invite roles below it.

## Architecture notes

- **`/src/app`** — Next.js App Router pages
  - `(auth)/` — login, signup, verify, invite accept
  - `(app)/` — authenticated app (dashboard, schedule, etc.)
- **`/src/lib`** — db client, session, auth helpers, email, validation, theme
- **`/src/components`** — UI primitives (`ui/`) and shared widgets
- **`/prisma/schema.prisma`** — data model (Postgres)
- **`/scripts/`** — one-off migration scripts

Server Actions handle all mutations. Session is a DB-backed cookie (`shq_session`) tied to a `Session` row with the user's current active org — logout invalidates it server-side.

## Mobile app (roadmap)

The codebase is structured so the same server actions and Prisma layer back a mobile client later. Most likely path: **Expo / React Native** hitting `/api/*` route handlers added for mobile. Shared Zod schemas in `src/lib/validation.ts`. The existing web app stays the source of truth.

## Scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Next.js dev server                        |
| `npm run build`     | `prisma generate` + Next build (for prod) |
| `npm run start`     | Start production server                   |
| `npm run db:push`   | Sync Prisma schema to the database        |
| `npm run db:studio` | Open Prisma Studio (visual DB browser)    |

## License

MIT — use it, fork it, make it your own.
