-- PrepCare demo seed data
--
-- Supabase Auth users can't be created via plain SQL (passwords need to go
-- through the Auth API), so seeding is a two-step process:
--
-- 1. Register a client account through the running app at /register
--    (e.g. "Demo Bank" / demo@prepcare.test / a password of your choice).
-- 2. Find that organization's org_id:
--      select org_id from organizations where name = 'Demo Bank';
--    Paste it in place of <ORG_ID> below, then run this file
--    (Supabase SQL editor, or `supabase db execute -f supabase/seed.sql`).

-- Replace <ORG_ID> before running:
insert into job_profiles (org_id, title, criteria, interview_link)
values (
  '<ORG_ID>',
  'Junior Accountant',
  'Basic reconciliation, attention to detail under deadline pressure, comfort with spreadsheets, clear written communication.',
  'demo-junior-accountant'
)
returning job_profile_id;

-- Copy the returned job_profile_id and use it below in place of <JOB_PROFILE_ID>:
with new_interview as (
  insert into interviews (job_profile_id, candidate_name, mode, status, started_at, ended_at)
  values ('<JOB_PROFILE_ID>', 'Aline Mballa', 'live', 'completed', now() - interval '1 day', now() - interval '1 day' + interval '12 minutes')
  returning interview_id
),
entry_1 as (
  insert into transcript_entries (interview_id, turn_no, question, answer)
  select interview_id, 1,
    'Tell me about a time you had to reconcile a discrepancy under a tight deadline.',
    'I found a ledger mismatch two hours before close, traced it to a duplicated entry, and flagged it to my supervisor before submitting the reconciled report.'
  from new_interview
  returning entry_id, interview_id
)
insert into scores (interview_id, competency, soft_skills, role_alignment, cited_entry_id)
select interview_id, 82, 76, 88, entry_id from entry_1;
