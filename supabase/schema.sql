create extension if not exists pgcrypto;

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  content_type text not null,
  sub_type text,
  item_class text,
  galaxy text default 'Euclid',
  system_name text,
  planet_name text,
  portal_glyphs text,
  coordinates text,
  game_mode text default 'Normal',
  platform text,
  game_version text,
  notes text,
  source_type text default 'reddit',
  source_url text,
  source_author text,
  screenshot_url text,
  date_posted timestamptz,
  last_confirmed_at timestamptz,
  is_active boolean default true
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'feedback_type') then
    create type feedback_type as enum ('still_here', 'gone', 'wrong_info', 'note');
  end if;
end $$;

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  location_id uuid references locations(id) on delete cascade,
  feedback_type feedback_type not null,
  note text,
  fingerprint text
);

create or replace view location_confidence as
select
  location_id,
  count(*) filter (where feedback_type = 'still_here') as confirmed_count,
  count(*) filter (where feedback_type = 'gone') as gone_count,
  count(*) as total_votes,
  round(
    count(*) filter (where feedback_type = 'still_here')::numeric
    / nullif(count(*), 0) * 100
  ) as confidence_pct
from feedback
group by location_id;

alter table locations enable row level security;
alter table feedback enable row level security;

create policy "public read locations"
on locations for select
using (true);

create policy "public update locations"
on locations for update
using (true)
with check (true);

create policy "public read feedback"
on feedback for select
using (true);

create policy "public insert feedback"
on feedback for insert
with check (true);
