-- Disable historical demo/public fake content without deleting audit history.
-- This is intentionally non-destructive: rows remain inspectable via service
-- role, but public APIs must not surface them.

update public.published_stories
set
  publication_status = 'retracted',
  retracted_at = coalesce(retracted_at, now()),
  retracted_reason = coalesce(retracted_reason, 'Demo seed disabled: live public site must not expose fictive stories.')
where slug like 'demo-%'
  and publication_status <> 'retracted';

update public.public_page_snapshots
set
  publication_status = 'retracted',
  updated_at = now()
where generated_from = 'demo-fixtures'
   or page_key in (
    'home',
    'stories',
    'matches',
    'explorer',
    'observatory',
    'methodology',
    'search',
    'story:demo-divergence',
    'match:demo-france-belgique',
    'entity:demo-japan-goalkeeper'
  );

