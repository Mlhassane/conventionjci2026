-- Rend toutes les informations d'identité de l'événement pilotables depuis l'admin.
-- Ces champs alimentent le pied de page, les en-têtes de pages et le SEO du site public.

alter table event_settings
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists seo_description text;

update event_settings
set
  contact_email = coalesce(contact_email, 'contact@jci-niger.org'),
  contact_phone = coalesce(contact_phone, ''),
  seo_description = coalesce(
    seo_description,
    'Découvrez la Convention JCI Niger 2026 : programme, intervenants, partenaires, infos pratiques et expérience digitale.'
  )
where true;

-- Garde-fou : le site public ne doit jamais afficher de données de démo.
-- Ces tables restent alimentées uniquement via la console d'administration.
