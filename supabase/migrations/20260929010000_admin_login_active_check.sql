-- Le login par code doit respecter la suspension d'accès décidée dans
-- l'écran « Équipe admin » : la RPC renvoie désormais le statut d'activité.

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
    'admin_active', coalesce(v_p.admin_active, true),
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
