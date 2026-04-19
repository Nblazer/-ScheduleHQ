# ScheduleHQ

Free, professional shift scheduling for teams. Built with Next.js, Prisma, and Tailwind. Deploys to Vercel at zero cost.

## What's inside

- **Multi-tenant workspaces** — one owner per org, invite teammates by email
- **Role hierarchy** — Owner → Admin → Manager → Employee, with proper gating
- **Schedule** — week view, shift assignment, per-day notes ("milk machine cleaning day", "inspection day")
- **Announcements** — company-wide posts, pin to top, optional email blast
- **Reports** — employees file issues, managers triage and respond
- **Team management** — invite, promote, demote, deactivate
- **Theme customization** — 4 presets × 6 accents, per-user or workspace default
- **Email verification** — every new account confirmed via emailed link
- **Session auth** — HTTP-only cookies, bcrypt-hashed passwords, secure-flag in prod

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
RESEND_API_KEY=re_xxx       # optional in dev — emails are logged to the console if missing
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
3. Copy the **connection string** (make sure it ends with `?sslmode=require`)
4. Paste it into `.env` as `DATABASE_URL`
5. Run `npx prisma db push` to create the tables

Alternatives: **Supabase**, **Railway**, **Aiven**, or a self-hosted Postgres. Any standard Postgres works.

## Set up email (free)

1. Go to https://resend.com → sign up
2. **API Keys** → create a key → copy into `.env` as `RESEND_API_KEY`
3. **Domains** → add your domain and verify DNS (recommended), **or** skip this and use `onboarding@resend.dev` in `EMAIL_FROM` for early testing
4. Resend's free tier gives you 3,000 emails/month — plenty for early customers

> If you run without `RESEND_API_KEY`, the app still works — outbound email is just logged to the server console. Useful for local development.

## Deploy to Vercel (free)

1. Push this repo to GitHub (private is fine)
2. Go to https://vercel.com → **Add New → Project** → import the repo
3. In **Environment Variables** add:
   - `DATABASE_URL` (from Neon)
   - `SESSION_SECRET` (generate: `openssl rand -base64 32` or any long random string)
   - `RESEND_API_KEY`, `EMAIL_FROM` (optional for first deploy)
   - `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. `https://schedulehq.vercel.app`)
4. Click **Deploy**

The build runs `prisma generate && next build` automatically.

After the first deploy, run the schema push from your machine (one time):

```bash
DATABASE_URL="<prod url>" npx prisma db push
```

Or add a small deploy hook — see Prisma docs.

## Role model

| Role     | Can do                                                                 |
| -------- | ---------------------------------------------------------------------- |
| Owner    | Everything. One per workspace (the signup account).                   |
| Admin    | Manage managers/employees, workspace theme & settings.                 |
| Manager  | Build schedules, post announcements, handle reports, invite employees. |
| Employee | View schedule & announcements, file reports.                           |

Admins cannot demote/remove Owners. Each role can only invite roles below it.

## Architecture notes

- **`/src/app`** — Next.js App Router pages
  - `(auth)/` — login, signup, verify, invite accept
  - `(app)/` — authenticated app (dashboard, schedule, etc.)
- **`/src/lib`** — db client, session, auth helpers, email, validation, theme
- **`/src/components`** — UI primitives (`ui/`) and shared widgets
- **`/prisma/schema.prisma`** — data model (Postgres)

Server Actions handle all mutations (no REST boilerplate). Session is a DB-backed cookie (`shq_session`) tied to a `Session` row — logout invalidates it server-side.

## Mobile app (roadmap)

The codebase is structured so the same server actions and Prisma layer back a mobile client later. Most likely path: **Expo / React Native** sharing the Zod schemas in `src/lib/validation.ts` and hitting `/api/*` route handlers added for mobile. The existing web app stays the source of truth.

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
