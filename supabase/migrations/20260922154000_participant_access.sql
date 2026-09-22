-- Participant access for Niger: phone-number login + unique member code (no email).
-- Flow: admin registers a participant after payment (phone + photo), assigns a
-- unique code. The participant logs in with phone + code to access their space.

alter table participants add column if not exists phone text;
alter table participants add column if not exists member_code text;

create unique index if not exists idx_participants_member_code
  on participants (member_code);

create index if not exists idx_participants_phone
  on participants (phone);

-- Backfill unique member codes for existing rows
do $$
declare
  r record;
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  i int;
begin
  for r in select id from participants where member_code is null loop
    loop
      v_code := 'JCI-2026-';
      for i in 1..4 loop
        v_code := v_code || substr(v_alphabet, (floor(random() * 31) + 1)::int, 1);
      end loop;
      begin
        update participants set member_code = v_code where id = r.id;
        exit;
      exception when unique_violation then
        -- regenerate on (extremely unlikely) collision
      end;
    end loop;
  end loop;
end $$;

-- Demo phones on the seeded participants so login can be tried end-to-end
-- (the admin can change them from the dashboard).
update participants set phone = '+22790000001' where name = 'Mariama Souley' and phone is null;
update participants set phone = '+22790000002' where name = 'Abdoul Kader Issa' and phone is null;
update participants set phone = '+22790000003' where name = 'Halima Boubacar' and phone is null;

-- Credentials must never leak through the public API
revoke select (phone, member_code) on participants from anon;

-- Login RPC: phone + member code -> profile + latest badge (security definer
-- so it can read the credential columns that anon cannot select directly).
create or replace function participant_login(p_phone text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  v_p participants%rowtype;
  v_b badges%rowtype;
begin
  -- normalize Niger numbers: 8 digits -> +227 prefix
  if v_phone ~ '^[0-9]{8}$' then v_phone := '+227' || v_phone; end if;
  if v_phone ~ '^227[0-9]{8}$' then v_phone := '+' || v_phone; end if;

  select * into v_p from participants
    where phone is not null
      and regexp_replace(phone, '[^0-9+]', '', 'g') = v_phone
      and upper(member_code) = v_code
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

grant execute on function participant_login(text, text) to anon, authenticated;

-- Self-service profile update (visibility + photo), guarded by phone + code.
create or replace function participant_update_profile(
  p_phone text,
  p_code text,
  p_is_public boolean default null,
  p_photo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  v_p participants%rowtype;
begin
  if v_phone ~ '^[0-9]{8}$' then v_phone := '+227' || v_phone; end if;
  if v_phone ~ '^227[0-9]{8}$' then v_phone := '+' || v_phone; end if;

  update participants
    set is_public = coalesce(p_is_public, is_public),
        photo_url = coalesce(p_photo_url, photo_url)
    where phone is not null
      and regexp_replace(phone, '[^0-9+]', '', 'g') = v_phone
      and upper(member_code) = v_code
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

grant execute on function participant_update_profile(text, text, boolean, text)
  to anon, authenticated;
