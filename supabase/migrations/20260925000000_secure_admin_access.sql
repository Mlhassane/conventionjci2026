-- Restrict administrative writes to explicitly linked admin accounts.
-- Run after 20260922162500_admin_code_access.sql.
-- The function is security-definer so RLS does not hide the linked row from
-- the policy check; it is executable only by authenticated sessions.

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
      and lower(coalesce(p.auth_email, '')) =
          lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

-- event_settings
 drop policy if exists "event_settings_admin_write" on event_settings;
 drop policy if exists "event_settings_admin_update" on event_settings;
 drop policy if exists "event_settings_admin_delete" on event_settings;
create policy "event_settings_admin_write" on event_settings
  for insert to authenticated with check (public.is_admin_user());
create policy "event_settings_admin_update" on event_settings
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy "event_settings_admin_delete" on event_settings
  for delete to authenticated using (public.is_admin_user());

-- participants
 drop policy if exists "participants_admin_read_all" on participants;
 drop policy if exists "participants_admin_update" on participants;
 drop policy if exists "participants_admin_delete" on participants;
create policy "participants_admin_read_all" on participants
  for select to authenticated using (public.is_admin_user());
create policy "participants_admin_update" on participants
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy "participants_admin_delete" on participants
  for delete to authenticated using (public.is_admin_user());

-- badges
 drop policy if exists "badges_admin_update" on badges;
 drop policy if exists "badges_admin_delete" on badges;
create policy "badges_admin_update" on badges
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy "badges_admin_delete" on badges
  for delete to authenticated using (public.is_admin_user());

-- partners
 drop policy if exists "partners_admin_read_all" on partners;
 drop policy if exists "partners_admin_write" on partners;
 drop policy if exists "partners_admin_update" on partners;
 drop policy if exists "partners_admin_delete" on partners;
create policy "partners_admin_read_all" on partners
  for select to authenticated using (public.is_admin_user());
create policy "partners_admin_write" on partners
  for insert to authenticated with check (public.is_admin_user());
create policy "partners_admin_update" on partners
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy "partners_admin_delete" on partners
  for delete to authenticated using (public.is_admin_user());

-- speakers
 drop policy if exists "speakers_admin_read_all" on speakers;
 drop policy if exists "speakers_admin_write" on speakers;
 drop policy if exists "speakers_admin_update" on speakers;
 drop policy if exists "speakers_admin_delete" on speakers;
create policy "speakers_admin_read_all" on speakers
  for select to authenticated using (public.is_admin_user());
create policy "speakers_admin_write" on speakers
  for insert to authenticated with check (public.is_admin_user());
create policy "speakers_admin_update" on speakers
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy "speakers_admin_delete" on speakers
  for delete to authenticated using (public.is_admin_user());

-- program_sessions
 drop policy if exists "program_sessions_admin_read_all" on program_sessions;
 drop policy if exists "program_sessions_admin_write" on program_sessions;
 drop policy if exists "program_sessions_admin_update" on program_sessions;
 drop policy if exists "program_sessions_admin_delete" on program_sessions;
create policy "program_sessions_admin_read_all" on program_sessions
  for select to authenticated using (public.is_admin_user());
create policy "program_sessions_admin_write" on program_sessions
  for insert to authenticated with check (public.is_admin_user());
create policy "program_sessions_admin_update" on program_sessions
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy "program_sessions_admin_delete" on program_sessions
  for delete to authenticated using (public.is_admin_user());

-- practical_information
 drop policy if exists "practical_information_admin_read_all" on practical_information;
 drop policy if exists "practical_information_admin_write" on practical_information;
 drop policy if exists "practical_information_admin_update" on practical_information;
 drop policy if exists "practical_information_admin_delete" on practical_information;
create policy "practical_information_admin_read_all" on practical_information
  for select to authenticated using (public.is_admin_user());
create policy "practical_information_admin_write" on practical_information
  for insert to authenticated with check (public.is_admin_user());
create policy "practical_information_admin_update" on practical_information
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy "practical_information_admin_delete" on practical_information
  for delete to authenticated using (public.is_admin_user());

-- officials
 drop policy if exists "officials_admin_read_all" on officials;
 drop policy if exists "officials_admin_write" on officials;
 drop policy if exists "officials_admin_update" on officials;
 drop policy if exists "officials_admin_delete" on officials;
create policy "officials_admin_read_all" on officials
  for select to authenticated using (public.is_admin_user());
create policy "officials_admin_write" on officials
  for insert to authenticated with check (public.is_admin_user());
create policy "officials_admin_update" on officials
  for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create policy "officials_admin_delete" on officials
  for delete to authenticated using (public.is_admin_user());

-- analytics
 drop policy if exists "analytics_events_admin_read" on analytics_events;
create policy "analytics_events_admin_read" on analytics_events
  for select to authenticated using (public.is_admin_user());

-- storage: keep public reads, restrict privileged writes to linked admins.
 drop policy if exists "admin_write_partners" on storage.objects;
 drop policy if exists "admin_update_partners" on storage.objects;
 drop policy if exists "admin_delete_partners" on storage.objects;
create policy "admin_write_partners" on storage.objects
  for insert to authenticated with check (bucket_id = 'partners' and public.is_admin_user());
create policy "admin_update_partners" on storage.objects
  for update to authenticated using (bucket_id = 'partners' and public.is_admin_user()) with check (bucket_id = 'partners' and public.is_admin_user());
create policy "admin_delete_partners" on storage.objects
  for delete to authenticated using (bucket_id = 'partners' and public.is_admin_user());

 drop policy if exists "admin_write_speakers" on storage.objects;
 drop policy if exists "admin_update_speakers" on storage.objects;
 drop policy if exists "admin_delete_speakers" on storage.objects;
create policy "admin_write_speakers" on storage.objects
  for insert to authenticated with check (bucket_id = 'speakers' and public.is_admin_user());
create policy "admin_update_speakers" on storage.objects
  for update to authenticated using (bucket_id = 'speakers' and public.is_admin_user()) with check (bucket_id = 'speakers' and public.is_admin_user());
create policy "admin_delete_speakers" on storage.objects
  for delete to authenticated using (bucket_id = 'speakers' and public.is_admin_user());

 drop policy if exists "admin_write_branding" on storage.objects;
 drop policy if exists "admin_update_branding" on storage.objects;
 drop policy if exists "admin_delete_branding" on storage.objects;
create policy "admin_write_branding" on storage.objects
  for insert to authenticated with check (bucket_id = 'branding' and public.is_admin_user());
create policy "admin_update_branding" on storage.objects
  for update to authenticated using (bucket_id = 'branding' and public.is_admin_user()) with check (bucket_id = 'branding' and public.is_admin_user());
create policy "admin_delete_branding" on storage.objects
  for delete to authenticated using (bucket_id = 'branding' and public.is_admin_user());

 drop policy if exists "admin_update_photos" on storage.objects;
 drop policy if exists "admin_delete_photos" on storage.objects;
 drop policy if exists "admin_update_posters" on storage.objects;
 drop policy if exists "admin_delete_posters" on storage.objects;
 drop policy if exists "admin_update_badges" on storage.objects;
 drop policy if exists "admin_delete_badges" on storage.objects;
create policy "admin_update_photos" on storage.objects
  for update to authenticated using (bucket_id = 'photos' and public.is_admin_user()) with check (bucket_id = 'photos' and public.is_admin_user());
create policy "admin_delete_photos" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and public.is_admin_user());
create policy "admin_update_posters" on storage.objects
  for update to authenticated using (bucket_id = 'posters' and public.is_admin_user()) with check (bucket_id = 'posters' and public.is_admin_user());
create policy "admin_delete_posters" on storage.objects
  for delete to authenticated using (bucket_id = 'posters' and public.is_admin_user());
create policy "admin_update_badges" on storage.objects
  for update to authenticated using (bucket_id = 'badges' and public.is_admin_user()) with check (bucket_id = 'badges' and public.is_admin_user());
create policy "admin_delete_badges" on storage.objects
  for delete to authenticated using (bucket_id = 'badges' and public.is_admin_user());
