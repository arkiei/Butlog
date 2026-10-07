-- Lecture / Laboratory grading + categories. Backward compatible; safe to run more than once.
-- Run in Supabase: SQL Editor > New query > paste > Run.
-- Run 002_lecture_lab_units.sql first if you have not already.

-- Subject-level final weighting (percent). NULL = not set (subjects with one section do not need it).
alter table subjects add column if not exists lecture_weight numeric;
alter table subjects add column if not exists laboratory_weight numeric;

-- Each grading component is now a CATEGORY (Exams, Quizzes...) belonging to the lecture or the laboratory section.
-- Existing rows become lecture categories, which is how old subjects keep working.
alter table grading_components add column if not exists type text not null default 'lecture';
alter table grading_components add column if not exists custom_split boolean not null default false;

-- Each assessment (Quiz 1, Exam 1...) can carry a custom percentage; NULL = equal split of its category.
alter table assessments add column if not exists weight numeric;
alter table assessments add column if not exists position int default 0;

-- Sanity limits.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'grading_components_type_check') then
    alter table grading_components add constraint grading_components_type_check check (type in ('lecture', 'laboratory'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subjects_final_weights_check') then
    alter table subjects add constraint subjects_final_weights_check check (
      (lecture_weight is null or lecture_weight between 0 and 100) and (laboratory_weight is null or laboratory_weight between 0 and 100));
  end if;
end $$;

-- No RLS changes are needed: the new columns live on the same tables, so your existing ownership policies already cover them.
