-- ============================================================================
-- JCI Experience 2026 — Supabase schema
-- Convention JCI Niger 2026 · 9-10 octobre · Maradi
--
-- Run this whole file once in the Supabase SQL editor (Project > SQL Editor)
-- on a fresh project. It creates every table, enables Row Level Security,
-- defines public/admin access policies, sets up storage buckets, and seeds
-- the event_settings singleton row.
--
-- After running this file:
--   1. Go to Authentication > Users and create your admin user(s) manually
--      (email + password). Anyone with a Supabase Auth account can access
--      /admin — there is no separate "admin" role table in this MVP, so
--      only create accounts for people who should have full write access.
--   2. Copy Project Settings > API > Project URL and anon public key into
--      your .env.local (see .env.local.example).
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Central, single-row configuration for all event branding & copy.
create table if not exists event_settings (
  id uuid primary key default gen_random_uuid(),
  event_name text not null default 'Convention JCI Niger 2026',
  tagline text not null default 'Votre Convention. Votre expérience. Votre réseau.',
  hashtag text not null default '#MaConventionJCI2026',
  start_date date not null default '2026-10-09',
  end_date date not null default '2026-10-10',
  location text not null default 'Maradi, Niger',
  hero_text text not null default 'Retrouvez tout ce dont vous avez besoin pour vivre pleinement la Convention JCI Niger 2026.',
  logo_url text,
  secondary_logo_url text,
  color_primary text not null default '#130F2D',
  color_accent text not null default '#0097D7',
  social_facebook text,
  social_instagram text,
  social_linkedin text,
  social_whatsapp text,
  updated_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  organization text,
  role text,
  photo_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete set null,
  unique_code text not null unique,
  full_name text not null,
  role text not null,
  organization text,
  city text,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'revoked')),
  badge_url text,
  created_at timestamptz not null default now()
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  category text not null check (category in (
    'Partenaire officiel', 'Partenaire principal', 'Sponsor',
    'Partenaire média', 'Partenaire institutionnel', 'Partenaire technique'
  )),
  description text,
  website text,
  whatsapp text,
  offer text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists speakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  position text,
  organization text,
  bio text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists program_sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time text not null,
  end_time text,
  title text not null,
  description text,
  location text,
  category text not null check (category in (
    'Cérémonie', 'Formation', 'Panel', 'Networking', 'Pause', 'Soirée', 'Statutaire'
  )),
  speaker_id uuid references speakers(id) on delete set null,
  display_order integer not null default 0,
  is_visible boolean not null default true
);

create table if not exists practical_information (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in (
    'Lieu', 'Localisation', 'Hébergement', 'Transport',
    'Restauration', 'Contacts utiles', 'Informations importantes'
  )),
  title text not null,
  content text not null,
  map_url text,
  display_order integer not null default 0,
  is_visible boolean not null default true
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in (
    'poster_generated', 'poster_downloaded', 'poster_shared', 'whatsapp_share_clicked',
    'badge_generated', 'badge_downloaded',
    'partner_viewed', 'speaker_viewed', 'program_viewed'
  )),
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Helpful indexes --------------------------------------------------------
create index if not exists idx_badges_unique_code on badges (unique_code);
create index if not exists idx_program_sessions_date on program_sessions (date);
create index if not exists idx_partners_visible_order on partners (is_visible, display_order);
create index if not exists idx_speakers_visible_order on speakers (is_visible, display_order);
create index if not exists idx_analytics_event_name on analytics_events (event_name);

-- ============================================================================
-- ROW LEVEL SECURITY
--
-- Model: public visitors use the anon key and never log in (per MVP spec —
-- no account required to generate a poster or badge). They may READ
-- published content and INSERT the specific rows the public flows need
-- (a participant + badge when generating a badge, analytics events).
-- Anyone authenticated via Supabase Auth is treated as an admin and gets
-- full read/write access — create your admin accounts carefully.
-- ============================================================================

alter table event_settings enable row level security;
alter table participants enable row level security;
alter table badges enable row level security;
alter table partners enable row level security;
alter table speakers enable row level security;
alter table program_sessions enable row level security;
alter table practical_information enable row level security;
alter table analytics_events enable row level security;

-- event_settings: public read, admin write
create policy "event_settings_public_read" on event_settings
  for select using (true);
create policy "event_settings_admin_write" on event_settings
  for insert to authenticated with check (true);
create policy "event_settings_admin_update" on event_settings
  for update to authenticated using (true) with check (true);
create policy "event_settings_admin_delete" on event_settings
  for delete to authenticated using (true);

-- participants: public read of public profiles, public insert (badge/poster flow), admin full access
create policy "participants_public_read" on participants
  for select using (is_public = true);
create policy "participants_admin_read_all" on participants
  for select to authenticated using (true);
create policy "participants_public_insert" on participants
  for insert to anon, authenticated with check (true);
create policy "participants_admin_update" on participants
  for update to authenticated using (true) with check (true);
create policy "participants_admin_delete" on participants
  for delete to authenticated using (true);

-- badges: public read (QR verification needs to resolve any unique_code),
-- public insert (badge generator), admin update/delete (revoke, etc.)
create policy "badges_public_read" on badges
  for select using (true);
create policy "badges_public_insert" on badges
  for insert to anon, authenticated with check (true);
create policy "badges_admin_update" on badges
  for update to authenticated using (true) with check (true);
create policy "badges_admin_delete" on badges
  for delete to authenticated using (true);

-- partners: public read of visible rows, admin full access
create policy "partners_public_read" on partners
  for select using (is_visible = true);
create policy "partners_admin_read_all" on partners
  for select to authenticated using (true);
create policy "partners_admin_write" on partners
  for insert to authenticated with check (true);
create policy "partners_admin_update" on partners
  for update to authenticated using (true) with check (true);
create policy "partners_admin_delete" on partners
  for delete to authenticated using (true);

-- speakers: public read of visible rows, admin full access
create policy "speakers_public_read" on speakers
  for select using (is_visible = true);
create policy "speakers_admin_read_all" on speakers
  for select to authenticated using (true);
create policy "speakers_admin_write" on speakers
  for insert to authenticated with check (true);
create policy "speakers_admin_update" on speakers
  for update to authenticated using (true) with check (true);
create policy "speakers_admin_delete" on speakers
  for delete to authenticated using (true);

-- program_sessions: public read of visible rows, admin full access
create policy "program_sessions_public_read" on program_sessions
  for select using (is_visible = true);
create policy "program_sessions_admin_read_all" on program_sessions
  for select to authenticated using (true);
create policy "program_sessions_admin_write" on program_sessions
  for insert to authenticated with check (true);
create policy "program_sessions_admin_update" on program_sessions
  for update to authenticated using (true) with check (true);
create policy "program_sessions_admin_delete" on program_sessions
  for delete to authenticated using (true);

-- practical_information: public read of visible rows, admin full access
create policy "practical_information_public_read" on practical_information
  for select using (is_visible = true);
create policy "practical_information_admin_read_all" on practical_information
  for select to authenticated using (true);
create policy "practical_information_admin_write" on practical_information
  for insert to authenticated with check (true);
create policy "practical_information_admin_update" on practical_information
  for update to authenticated using (true) with check (true);
create policy "practical_information_admin_delete" on practical_information
  for delete to authenticated using (true);

-- analytics_events: public insert only (tracking beacons), admin read
create policy "analytics_events_public_insert" on analytics_events
  for insert to anon, authenticated with check (true);
create policy "analytics_events_admin_read" on analytics_events
  for select to authenticated using (true);

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('photos', 'photos', true),
  ('posters', 'posters', true),
  ('badges', 'badges', true),
  ('partners', 'partners', true),
  ('speakers', 'speakers', true),
  ('branding', 'branding', true)
on conflict (id) do nothing;

-- Public read on every bucket (all generated/branding assets are meant to be shareable)
create policy "public_read_photos" on storage.objects for select using (bucket_id = 'photos');
create policy "public_read_posters" on storage.objects for select using (bucket_id = 'posters');
create policy "public_read_badges" on storage.objects for select using (bucket_id = 'badges');
create policy "public_read_partners" on storage.objects for select using (bucket_id = 'partners');
create policy "public_read_speakers" on storage.objects for select using (bucket_id = 'speakers');
create policy "public_read_branding" on storage.objects for select using (bucket_id = 'branding');

-- Public upload for user-generated content buckets (poster/badge photo + exports),
-- so the no-account poster/badge flow can store assets if you choose to upload
-- generated PNGs to Storage instead of keeping them client-side only.
create policy "public_upload_photos" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'photos');
create policy "public_upload_posters" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'posters');
create policy "public_upload_badges" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'badges');

-- Admin-only management (upload/update/delete) for branding & content buckets
create policy "admin_write_partners" on storage.objects
  for insert to authenticated with check (bucket_id = 'partners');
create policy "admin_update_partners" on storage.objects
  for update to authenticated using (bucket_id = 'partners');
create policy "admin_delete_partners" on storage.objects
  for delete to authenticated using (bucket_id = 'partners');

create policy "admin_write_speakers" on storage.objects
  for insert to authenticated with check (bucket_id = 'speakers');
create policy "admin_update_speakers" on storage.objects
  for update to authenticated using (bucket_id = 'speakers');
create policy "admin_delete_speakers" on storage.objects
  for delete to authenticated using (bucket_id = 'speakers');

create policy "admin_write_branding" on storage.objects
  for insert to authenticated with check (bucket_id = 'branding');
create policy "admin_update_branding" on storage.objects
  for update to authenticated using (bucket_id = 'branding');
create policy "admin_delete_branding" on storage.objects
  for delete to authenticated using (bucket_id = 'branding');

-- Admins can also manage (update/delete) their own generated-content buckets
create policy "admin_update_photos" on storage.objects for update to authenticated using (bucket_id = 'photos');
create policy "admin_delete_photos" on storage.objects for delete to authenticated using (bucket_id = 'photos');
create policy "admin_update_posters" on storage.objects for update to authenticated using (bucket_id = 'posters');
create policy "admin_delete_posters" on storage.objects for delete to authenticated using (bucket_id = 'posters');
create policy "admin_update_badges" on storage.objects for update to authenticated using (bucket_id = 'badges');
create policy "admin_delete_badges" on storage.objects for delete to authenticated using (bucket_id = 'badges');

-- ============================================================================
-- SEED DATA
-- ============================================================================

insert into event_settings (event_name, tagline, hashtag, start_date, end_date, location, hero_text)
select
  'Convention JCI Niger 2026',
  'Votre Convention. Votre expérience. Votre réseau.',
  '#MaConventionJCI2026',
  '2026-10-09',
  '2026-10-10',
  'Maradi, Niger',
  'Retrouvez tout ce dont vous avez besoin pour vivre pleinement la Convention JCI Niger 2026.'
where not exists (select 1 from event_settings);

-- Optional starter content — safe to delete from the admin dashboard.
insert into speakers (name, position, organization, bio, display_order)
select * from (values
  ('Aïcha Moussa', 'Présidente Nationale', 'JCI Niger',
   'Aïcha porte la vision nationale de JCI Niger et accompagne les Locaux dans le développement du leadership des jeunes à travers le pays.', 1),
  ('Ibrahim Saley', 'Entrepreneur & Consultant', 'Sahel Ventures',
   'Ibrahim accompagne les jeunes entrepreneurs nigériens depuis plus de dix ans, avec un focus sur l''agro-industrie et le financement des PME.', 2),
  ('Fatouma Idé', 'Directrice Exécutive', 'Fondation Jeunesse Sahel',
   'Fatouma travaille sur l''engagement civique des jeunes et le renforcement des compétences de leadership communautaire au Niger.', 3)
) as v(name, position, organization, bio, display_order)
where not exists (select 1 from speakers);

insert into practical_information (section, title, content, map_url, display_order)
select * from (values
  ('Lieu', 'Lieu de la Convention', 'Palais des Congrès de Maradi, Niger.', 'https://maps.google.com/?q=Maradi+Niger', 1),
  ('Hébergement', 'Où loger à Maradi', 'Une liste d''hôtels partenaires proposant des tarifs préférentiels sera communiquée aux participants inscrits.', null, 2),
  ('Transport', 'Se déplacer à Maradi', 'Des navettes seront organisées entre les points d''hébergement principaux et le lieu de la Convention.', null, 3),
  ('Restauration', 'Repas', 'Les pauses café et déjeuners sont inclus pour les participants inscrits les deux jours.', null, 4),
  ('Contacts utiles', 'Contacts de l''organisation', 'Comité d''organisation : contact@jci-niger.org · +227 90 00 00 00', null, 5),
  ('Informations importantes', 'À prévoir', 'Pensez à apporter une pièce d''identité pour le retrait de votre badge sur place.', null, 6)
) as v(section, title, content, map_url, display_order)
where not exists (select 1 from practical_information);

-- ============================================================================
-- End of schema
-- ============================================================================
