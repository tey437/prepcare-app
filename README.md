# PrepCare

A conversational-AI platform that automates first-round candidate screening for recruiters
("Clients") and doubles as a private mock-interview coach for job seekers ("Candidates").

**Stack:** React + Vite + TypeScript + Tailwind CSS + Framer Motion (frontend) · Supabase (Postgres, Auth, Row
Level Security, Edge Functions) · Anthropic API for the adaptive interview engine · browser Web
Speech API for voice mode.

**Design:** dark ink hero with an animated live-interview demo, warm paper body sections, a
pine-green/amber-gold accent pair, and motion throughout (page transitions, staggered list
reveals, animated score bars, a pulsing "listening" indicator for voice input). See
`src/components/LiveDemo.tsx` for the signature hero animation.

This project is fully scaffolded — every file already exists. You do **not** need to create any
files or folders yourself. You only need to install dependencies and fill in your own API keys.

---

## 1. Prerequisites

- [Node.js](https://nodejs.org) 18+ and npm
- A free [Supabase](https://supabase.com) account
- The [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- An [Anthropic API key](https://console.anthropic.com) (for the interview engine)

## 2. Create your Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Once it's created, open **Project Settings → API** and copy:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key (keep this one secret — it's only used server-side)

## 3. Apply the database schema

From this project's root folder:

```bash
supabase login
supabase link --project-ref <your-project-ref>   # found in your Supabase project URL
supabase db push
```

This runs `supabase/migrations/0001_init.sql`, which creates all tables and Row Level Security
policies described in the project's design chapters.

## 4. Deploy the Conversation Engine (Edge Function)

```bash
supabase functions deploy conversation-engine
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

The function also needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — Supabase sets these
automatically for deployed Edge Functions, so you don't need to configure them yourself.

### Running the function locally instead (optional)

```bash
cp supabase/.env.local.example supabase/.env.local   # fill in your keys
supabase functions serve conversation-engine --env-file supabase/.env.local
```

## 5. Configure the frontend

```bash
cp .env.example .env
```

Edit `.env` and paste in your `Project URL` and `anon` key:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 6. Install and run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## 7. Try the full flow

1. Go to `/register` and create a client account (this creates an `organizations` row).
2. From the dashboard, click **New job profile**, fill in a title and criteria, and save — this
   generates a shareable interview link.
3. Open that link in an incognito window (simulating a candidate), fill in a name, consent, and
   begin the interview. Answer a few turns by typing (or click 🎤 if your browser supports the
   Web Speech API — Chrome works best).
4. When the interview ends, you'll land on a scorecard. Go back to your client dashboard and open
   the job profile to see the candidate ranked, with a link into the full transcript.
5. Separately, try `/practice` to see the candidate-facing coaching flow — practice sessions are
   private and never show up on any client dashboard (enforced by Row Level Security, not just
   the UI).

## 8. Optional: seed demo data

See `supabase/seed.sql` for a script that adds one demo job profile and one completed sample
interview so your dashboard isn't empty on first run. It requires you to register a client
account first (Supabase Auth users can't be created via plain SQL).

## Project structure

```
/prepcare-app
  /src
    /pages          — one file per route (Dashboard, InterviewSession, Scorecard, ...)
    /components      — shared UI (Layout, ScoreBar, CitationCard, ...)
    /lib             — Supabase client, shared types, conversation-engine API wrapper
    /hooks           — useAuth
  /supabase
    /migrations      — schema.sql equivalent + RLS policies
    /functions
      /conversation-engine  — the adaptive interview logic (Deno Edge Function)
    seed.sql
  .env.example
  README.md (this file)
```

## Notes on the design

- **Transcript-cited scoring:** every score the Conversation Engine returns must reference a
  specific `transcript_entries.entry_id`. If the AI response doesn't include a valid citation,
  the Edge Function retries once, then marks the interview `abandoned` rather than saving an
  unsupported score.
- **Practice Mode privacy:** `interviews.mode = 'practice'` rows are excluded from every
  client-facing query at the Row Level Security layer, not just hidden in the UI, so a practice
  session can never leak into a recruiter's dashboard.
- **No exposed secrets:** the Anthropic API key and the Supabase service role key are only ever
  used inside the Edge Function. The browser only ever holds the `anon` key, and all client-side
  authorization is enforced by RLS.
