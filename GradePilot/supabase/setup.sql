-- Butlog database setup. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Safe to run more than once.

-- 1. Columns the app needs
alter table subjects add column if not exists instructor text;
alter table subjects add column if not exists target text default '3.00';
alter table subjects add column if not exists grading_system text default 'msu';
alter table subjects add column if not exists conversion jsonb default '{}'::jsonb;
alter table subjects add column if not exists custom_scale jsonb;
alter table subjects add column if not exists position int default 0;
alter table grading_components add column if not exists position int default 0;

-- 2. Numeric types so decimals save correctly
alter table subjects alter column units type numeric;
alter table grading_components alter column weight type numeric;
alter table assessments alter column score type numeric;
alter table assessments alter column max_score type numeric;

-- 3. Per-user settings (prior units and GPA)
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prior_units numeric, prior_gpa numeric, updated_at timestamptz default now()
);
alter table profiles enable row level security;
drop policy if exists "profiles: own row" on profiles;
create policy "profiles: own row" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. REFERENCE ONLY: ownership policies for the other tables, checked through the parent chain.
-- Compare with the policies you already created. Only run these if yours are missing.
-- create policy "semesters: own" on semesters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "subjects: own" on subjects for all
--   using (exists (select 1 from semesters s where s.id = subjects.semester_id and s.user_id = auth.uid()))
--   with check (exists (select 1 from semesters s where s.id = subjects.semester_id and s.user_id = auth.uid()));
-- create policy "components: own" on grading_components for all
--   using (exists (select 1 from subjects b join semesters s on s.id = b.semester_id where b.id = grading_components.subject_id and s.user_id = auth.uid()))
--   with check (exists (select 1 from subjects b join semesters s on s.id = b.semester_id where b.id = grading_components.subject_id and s.user_id = auth.uid()));
-- create policy "assessments: own" on assessments for all
--   using (exists (select 1 from grading_components c join subjects b on b.id = c.subject_id join semesters s on s.id = b.semester_id where c.id = assessments.component_id and s.user_id = auth.uid()))
--   with check (exists (select 1 from grading_components c join subjects b on b.id = c.subject_id join semesters s on s.id = b.semester_id where c.id = assessments.component_id and s.user_id = auth.uid()));
