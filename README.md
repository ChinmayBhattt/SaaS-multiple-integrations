# DMVIron — Gym Management SaaS 

A full-featured gym management platform built for **DMVIron** with Next.js 16, Supabase, and Claude AI.

![DMVIron](public/assets/logo.svg)

## Features

### Member Management
- Add, edit, and archive member profiles (name, contact, photo, membership type)
- Status tracking: active, expired, paused, cancelled
- Join date, renewal date, and payment history
- Staff notes per member

### Membership Plans
- Create monthly, quarterly, and annual plan tiers
- Set pricing per plan
- Assign and switch members between plans

### Payments & Billing
- Log payments manually or simulate Stripe integration
- Flag overdue/failed payments
- Generate invoices per member (`GET /api/invoices?member_id=...`)

### Automated Reminders (Zapier)
- Auto email members 7 days before renewal (`POST /api/cron/reminders`)
- Payment failure notification emails
- Welcome email on signup

### Attendance Tracking
- Manual check-in or QR code scan
- Attendance history per member
- Daily/weekly gym traffic overview

### Claude AI Features
- Flag at-risk members based on attendance drop-off
- Generate personalized retention email drafts
- Monthly engagement summary report
- Suggest promotions based on membership trends

### Dashboard & Analytics
- Active members count, growth chart, churn rate
- Weekly traffic visualization

### Staff & Access
- Admin and staff roles with different permissions
- Activity log showing who did what
- Supabase Auth login system

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
3. Enable Email auth in Authentication → Providers

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` (optional — AI features use fallback text without it)
- `ZAPIER_WEBHOOK_URL` (optional — for automated emails)
- `CRON_SECRET` (for renewal reminder cron)

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create your admin account on first visit.

### 4. Cron (Renewal Reminders)

Schedule a daily cron (e.g. Vercel Cron):

```
POST /api/cron/reminders
Authorization: Bearer YOUR_CRON_SECRET
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **UI:** Tailwind CSS, Radix UI, Recharts
- **AI:** Anthropic Claude API
- **QR:** html5-qrcode

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected staff pages
│   ├── login/           # Auth
│   ├── check-in/[qr]/   # Public member check-in
│   └── api/             # AI, cron, webhooks, invoices
├── components/          # UI components
└── lib/                 # Supabase, actions, AI, email
```

## Logo

Place your DMVIron logo at `public/assets/logo.svg` (a placeholder is included).
# SaaS-multiple-integrations
