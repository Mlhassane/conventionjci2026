-- Admin access by convention code (e.g. Hassane / JCI-2026-ADMIN).
-- The /admin login form accepts the admin's full name + convention code,
-- verifies is_admin server-side, then opens a real Supabase Auth session
-- (via the linked auth_email account) so RLS write policies keep working.

alter table participants add column if not exists is_admin boolean not null default false;
alter table participants add column if not exists auth_email text;

create unique index if not exists idx_participants_auth_email
  on participants (auth_email) where auth_email is not null;

-- Never leak the admin linkage through the public API.
-- (The security-definer RPCs below can still return these fields.)
revoke select (is_admin, auth_email) on participants from anon;

-- Same login-by-name as before, now also returning is_admin + auth_email.
create or replace function participant_login_by_name(p_name text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text := unaccent(lower(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')));
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  v_p participants%rowtype;
  v_b badges%rowtype;
begin
  select * into v_p from participants
    where member_code is not null
      and upper(member_code) = v_code
      and unaccent(lower(regexp_replace(name, '\s+', ' ', 'g'))) = v_name
    limit 1;

  if not found then
    return null;
  end if;

  select * into v_b from badges
    where participant_id = v_p.id
    order by created_at desc
    limit 1;

  return jsonb_build_object(
    'id', v_p.id,
    'name', v_p.name,
    'city', v_p.city,
    'organization', v_p.organization,
    'role', v_p.role,
    'photo_url', v_p.photo_url,
    'is_public', v_p.is_public,
    'is_admin', v_p.is_admin,
    'auth_email', v_p.auth_email,
    'member_code', v_p.member_code,
    'badge', case
      when v_b.id is null then null
      else jsonb_build_object(
        'id', v_b.id,
        'unique_code', v_b.unique_code,
        'status', v_b.status,
        'badge_url', v_b.badge_url
      )
    end
  );
end;
$$;

grant execute on function participant_login_by_name(text, text) to anon, authenticated;

-- Seed the admin participant (hidden from the public annuaire).
-- The linked Supabase Auth account is created via the Auth Admin API.
insert into participants (name, member_code, is_admin, auth_email, role, city, is_public)
select 'Hassane', 'JCI-2026-ADMIN', true, 'hassane@jci-niger.org', 'Administrateur', 'Niamey', false
where not exists (select 1 from participants where member_code = 'JCI-2026-ADMIN');
