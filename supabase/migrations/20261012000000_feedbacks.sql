-- Avis / retours des participants sur la Convention.
-- Soumission publique sans compte (modération : seuls les avis approuvés
-- sont lisibles publiquement) ; gestion complète côté admin.

create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  organization text,
  message text not null,
  rating smallint check (rating is null or (rating >= 1 and rating <= 5)),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedbacks_created_at
  on feedbacks (created_at desc);

create index if not exists idx_feedbacks_approved
  on feedbacks (is_approved, created_at desc);

alter table feedbacks enable row level security;

drop policy if exists "feedbacks_public_insert" on feedbacks;
create policy "feedbacks_public_insert" on feedbacks
  for insert to anon, authenticated with check (true);

drop policy if exists "feedbacks_public_read" on feedbacks;
create policy "feedbacks_public_read" on feedbacks
  for select to anon, authenticated using (is_approved = true);

drop policy if exists "feedbacks_admin_read" on feedbacks;
create policy "feedbacks_admin_read" on feedbacks
  for select to authenticated using (public.is_admin_user());

drop policy if exists "feedbacks_admin_update" on feedbacks;
create policy "feedbacks_admin_update" on feedbacks
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "feedbacks_admin_delete" on feedbacks;
create policy "feedbacks_admin_delete" on feedbacks
  for delete to authenticated using (public.is_admin_user());
