-- Public J'y serai generations.
-- Visitors can submit their own generation; only explicitly linked admins
-- can read or delete the saved records.

create table if not exists participations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  organization text,
  message text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_participations_created_at
  on participations (created_at desc);

alter table participations enable row level security;

drop policy if exists "participations_public_insert" on participations;
create policy "participations_public_insert" on participations
  for insert to anon, authenticated with check (true);

drop policy if exists "participations_admin_read" on participations;
create policy "participations_admin_read" on participations
  for select to authenticated using (public.is_admin_user());

drop policy if exists "participations_admin_delete" on participations;
create policy "participations_admin_delete" on participations
  for delete to authenticated using (public.is_admin_user());

drop policy if exists "participations_admin_update" on participations;
create policy "participations_admin_update" on participations
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
