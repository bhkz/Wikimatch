-- PR04 - Minimal Live Contract Alignment
-- Add group_label to matches, add languages and source_count to published_stories,
-- and update public view v_public_stories.

-- 1. Add group_label to public.matches
alter table public.matches
  add column if not exists group_label text;

-- 2. Add languages and source_count to public.published_stories
alter table public.published_stories
  add column if not exists languages text[] not null default '{}'::text[],
  add column if not exists source_count integer not null default 0;

-- 3. Add source_count check constraint idempotently
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_published_stories_source_count'
  ) then
    alter table public.published_stories
      add constraint chk_published_stories_source_count check (source_count >= 0);
  end if;
end $$;

-- 4. Update the public view public.v_public_stories to include these new columns
create or replace view public.v_public_stories
with (security_invoker = true)
as
select
  id,
  slug,
  story_type,
  title,
  excerpt,
  observation_text,
  interpretation_text,
  limitation_text,
  entity_id,
  match_id,
  published_at,
  corrected_at,
  methodology_version,
  share_image_url,
  languages,
  source_count
from public.published_stories
where publication_status in ('published', 'corrected')
  and retracted_at is null;
