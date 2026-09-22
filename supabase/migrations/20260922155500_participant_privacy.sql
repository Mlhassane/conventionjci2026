-- Fix credential leak: PostgreSQL column-level REVOKE cannot override an
-- existing table-level SELECT grant, so revoke table SELECT from anon and
-- re-grant only the public directory columns. Authenticated (admin) keeps
-- full access. The participant_login RPC (security definer) is unaffected.

revoke select on participants from anon;

grant select (
  id,
  name,
  city,
  organization,
  role,
  photo_url,
  is_public,
  created_at
) on participants to anon;
