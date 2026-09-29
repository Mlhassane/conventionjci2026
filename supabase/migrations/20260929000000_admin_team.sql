-- Gestion de l'équipe d'administration depuis la console.
--
-- 1) Un administrateur = participants.is_admin + auth_email lié + admin_active.
-- 2) Fermeture de l'auto-attribution d'accès : l'insertion publique dans
--    participants/badges permettait à un visiteur de créer sa propre ligne
--    is_admin = true. Ces flux n'existent plus côté public (les visuels J'y serai
--    écrivent dans `participations`), on les réserve donc aux admins.

alter table participants
  add column if not exists admin_role text,
  add column if not exists admin_active boolean not null default true,
  add column if not exists admin_added_by text,
  add column if not exists last_login_at timestamptz;

update participants
set admin_role = coalesce(admin_role, 'Super admin')
where is_admin = true;

-- L'accès est révocable sans supprimer l'historique du participant.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.participants p
    where p.is_admin = true
      and coalesce(p.admin_active, true) = true
      and lower(coalesce(p.auth_email, '')) =
          lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

-- Nombre d'administrateurs actifs : garde-fou côté API (jamais 0).
create or replace function public.admin_active_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.participants
  where is_admin = true and coalesce(admin_active, true) = true;
$$;

revoke all on function public.admin_active_count() from public;
grant execute on function public.admin_active_count() to authenticated;

-- Aucun self-service d'insertion côté public.
drop policy if exists "participants_public_insert" on participants;
create policy "participants_admin_insert" on participants
  for insert to authenticated with check (public.is_admin_user());

drop policy if exists "badges_public_insert" on badges;
create policy "badges_admin_insert" on badges
  for insert to authenticated with check (public.is_admin_user());
