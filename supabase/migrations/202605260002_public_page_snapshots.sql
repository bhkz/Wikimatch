-- Public page snapshots bridge the rich V2 frontend page contracts with the
-- normalized editorial schema. They are generated from reviewed/published data
-- by seeds now, and later by the Desk publication workflow.

create table if not exists public.public_page_snapshots (
  page_key text primary key,
  payload jsonb not null,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'corrected', 'retracted')),
  generated_from text not null default 'manual',
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists public_page_snapshots_set_updated_at on public.public_page_snapshots;
create trigger public_page_snapshots_set_updated_at
before update on public.public_page_snapshots
for each row execute function public.set_updated_at();

alter table public.public_page_snapshots enable row level security;

drop policy if exists public_read_published_page_snapshots on public.public_page_snapshots;
create policy public_read_published_page_snapshots
on public.public_page_snapshots
for select
to anon
using (publication_status in ('published', 'corrected'));
