-- Lecture / laboratory units. Backward compatible and safe to run more than once.
-- Run in Supabase: SQL Editor > New query > paste > Run.

alter table subjects add column if not exists lecture_units numeric;
alter table subjects add column if not exists laboratory_units numeric;

-- Existing subjects keep their single `units` value: it becomes their lecture units.
update subjects set lecture_units = units, laboratory_units = 0
where lecture_units is null and laboratory_units is null and units is not null;

-- Keep `units` (the total) equal to lecture + laboratory automatically.
create or replace function sync_subject_units() returns trigger language plpgsql as $$
begin
  if new.lecture_units is not null or new.laboratory_units is not null then
    new.units := coalesce(new.lecture_units, 0) + coalesce(new.laboratory_units, 0);
  end if;
  return new;
end $$;
drop trigger if exists subjects_sync_units on subjects;
create trigger subjects_sync_units before insert or update on subjects for each row execute function sync_subject_units();
