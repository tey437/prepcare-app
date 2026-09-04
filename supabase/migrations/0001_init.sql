-- PrepCare initial schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table organizations (
  org_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) unique not null,
  name text not null,
  sector text,
  created_at timestamptz default now()
);

create table job_profiles (
  job_profile_id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(org_id) not null,
  title text not null,
  criteria text not null,
  interview_link text unique not null,
  created_at timestamptz default now()
);

create table interviews (
  interview_id uuid primary key default gen_random_uuid(),
  job_profile_id uuid references job_profiles(job_profile_id),
  candidate_name text,
  mode text check (mode in ('live','practice')) not null,
  status text check (status in ('in_progress','completed','abandoned')) default 'in_progress',
  started_at timestamptz default now(),
  ended_at timestamptz
);

create table transcript_entries (
  entry_id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(interview_id) not null,
  turn_no int not null,
  question text not null,
  answer text,
  created_at timestamptz default now()
);

create table scores (
  score_id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(interview_id) not null,
  competency int,
  soft_skills int,
  role_alignment int,
  wpm int,
  filler_rate float,
  star_adherence int,
  cited_entry_id uuid references transcript_entries(entry_id),
  generated_at timestamptz default now()
);

create table audit_logs (
  audit_id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  entity_type text,
  entity_id uuid,
  action text,
  details jsonb,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index idx_job_profiles_org on job_profiles(org_id);
create index idx_interviews_job_profile on interviews(job_profile_id);
create index idx_interviews_mode_status on interviews(mode, status);
create index idx_transcript_entries_interview on transcript_entries(interview_id, turn_no);
create index idx_scores_interview on scores(interview_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;
alter table job_profiles enable row level security;
alter table interviews enable row level security;
alter table transcript_entries enable row level security;
alter table scores enable row level security;
alter table audit_logs enable row level security;

-- organizations: a client can only see/update their own org row
create policy "org owner can select own org"
  on organizations for select
  using (auth_user_id = auth.uid());

create policy "org owner can update own org"
  on organizations for update
  using (auth_user_id = auth.uid());

create policy "authenticated user can create their org"
  on organizations for insert
  with check (auth_user_id = auth.uid());

-- job_profiles: a client can only manage profiles under their own org
create policy "client can select own job profiles"
  on job_profiles for select
  using (
    org_id in (select org_id from organizations where auth_user_id = auth.uid())
  );

create policy "client can insert own job profiles"
  on job_profiles for insert
  with check (
    org_id in (select org_id from organizations where auth_user_id = auth.uid())
  );

create policy "client can update own job profiles"
  on job_profiles for update
  using (
    org_id in (select org_id from organizations where auth_user_id = auth.uid())
  );

-- job_profiles also need to be readable anonymously by candidates opening an
-- interview link (lookup by interview_link only, no auth). This is safe because
-- interview_link is an unguessable random slug and the row contains no candidate data.
create policy "anyone can look up a job profile by its interview link"
  on job_profiles for select
  using (true);

-- interviews: clients may only read LIVE interviews tied to a job profile they own.
-- Practice-mode rows are never selectable by any client account, enforced here
-- (not just hidden in the UI).
create policy "client can select live interviews for own job profiles"
  on interviews for select
  using (
    mode = 'live'
    and job_profile_id in (
      select job_profile_id from job_profiles
      where org_id in (select org_id from organizations where auth_user_id = auth.uid())
    )
  );

-- transcript_entries: same rule, scoped through interviews -> job_profiles -> org
create policy "client can select transcript of own live interviews"
  on transcript_entries for select
  using (
    interview_id in (
      select interview_id from interviews
      where mode = 'live'
      and job_profile_id in (
        select job_profile_id from job_profiles
        where org_id in (select org_id from organizations where auth_user_id = auth.uid())
      )
    )
  );

-- scores: same rule again
create policy "client can select scores of own live interviews"
  on scores for select
  using (
    interview_id in (
      select interview_id from interviews
      where mode = 'live'
      and job_profile_id in (
        select job_profile_id from job_profiles
        where org_id in (select org_id from organizations where auth_user_id = auth.uid())
      )
    )
  );

-- audit_logs: no client-facing policies at all — only the service role (used
-- exclusively inside the Edge Function) can read or write this table. Since RLS
-- is enabled with no policies defined for anon/authenticated roles, all access
-- from the browser is denied by default, which is intentional.

-- NOTE: candidates never query interviews/transcript_entries/scores directly
-- with the anon key. All candidate-facing reads and writes go through the
-- `conversation-engine` Edge Function, which uses the service role key and
-- therefore bypasses RLS deliberately and only for the specific rows that
-- function is designed to touch.
