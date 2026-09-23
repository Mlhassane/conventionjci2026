-- Participant login by convention code + full name (no phone needed).
-- Flow: participant clicks "Participer", enters the convention ID received
-- after payment (member_code like JCI-2026-A7X2) + their full name, lands on
-- their espace, then generates the poster with their photo and picks the
-- photo used on their badge.
-- Name comparison is accent- and case-insensitive ("Aïcha" = "aicha").

create extension if not exists unaccent with schema extensions;

-- Login RPC: convention code + name -> profile + latest badge (security
-- definer so it can read the credential columns that anon cannot select).
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

-- Self-service profile update (visibility + photo), guarded by code + name.
create or replace function participant_update_profile_by_name(
  p_name text,
  p_code text,
  p_is_public boolean default null,
  p_photo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text := unaccent(lower(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')));
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  v_p participants%rowtype;
begin
  update participants
    set is_public = coalesce(p_is_public, is_public),
        photo_url = coalesce(p_photo_url, photo_url)
    where member_code is not null
      and upper(member_code) = v_code
      and unaccent(lower(regexp_replace(name, '\s+', ' ', 'g'))) = v_name
    returning * into v_p;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_p.id,
    'is_public', v_p.is_public,
    'photo_url', v_p.photo_url
  );
end;
$$;

grant execute on function participant_update_profile_by_name(text, text, boolean, text)
  to anon, authenticated;
