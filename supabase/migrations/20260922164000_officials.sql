-- Event officials (committee, patrons, authorities) shown on the /infos page.
-- Managed from Admin > Officiels.

create table if not exists officials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  organization text,
  photo_url text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_officials_visible_order
  on officials (is_visible, display_order);

alter table officials enable row level security;

-- Public read of visible rows, admin full access (same model as speakers).
create policy "officials_public_read" on officials
  for select using (is_visible = true);
create policy "officials_admin_read_all" on officials
  for select to authenticated using (true);
create policy "officials_admin_write" on officials
  for insert to authenticated with check (true);
create policy "officials_admin_update" on officials
  for update to authenticated using (true) with check (true);
create policy "officials_admin_delete" on officials
  for delete to authenticated using (true);
