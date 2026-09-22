-- Seed: partners, program sessions, participants (demo content from mockData)

insert into partners (name, category, description, website, whatsapp, offer, display_order)
select * from (values
  ('Air Niger International', 'Partenaire officiel', 'Partenaire aérien officiel de la Convention JCI Niger 2026.', 'https://example.com', null, '-15% sur les vols vers Maradi pour les participants.', 1),
  ('Banque Sahel Finance', 'Partenaire principal', 'Partenaire financier principal de la Convention.', 'https://example.com', null, null, 2),
  ('Radio Ténéré', 'Partenaire média', 'Couverture média officielle de l''événement.', null, '+22790000000', null, 3)
) as v(name, category, description, website, whatsapp, offer, display_order)
where not exists (select 1 from partners);

insert into program_sessions (date, start_time, end_time, title, description, location, category, speaker_id, display_order)
select v.date::date, v.start_time, v.end_time, v.title, v.description, v.location, v.category, sp.id, v.display_order
from (values
  ('2026-10-09','08:00','09:00','Accueil & enregistrement','Retrait des badges et installation des participants.','Hall principal','Cérémonie',null::text,1),
  ('2026-10-09','09:00','10:30','Cérémonie d''ouverture','Ouverture officielle de la Convention JCI Niger 2026.','Salle des Congrès','Cérémonie','Aïcha Moussa',2),
  ('2026-10-09','10:30','12:30','Panel : Leadership et entrepreneuriat au Sahel','Échanges avec des leaders nigériens sur l''entrepreneuriat.','Salle des Congrès','Panel','Ibrahim Saley',3),
  ('2026-10-09','12:30','14:00','Pause déjeuner',null::text,'Espace restauration','Pause',null::text,4),
  ('2026-10-09','14:00','16:00','Formation : Prise de parole en public',null::text,'Salle B','Formation','Fatouma Idé',5),
  ('2026-10-09','16:00','18:00','Networking','Moment d''échange entre participants et partenaires.','Jardin extérieur','Networking',null::text,6),
  ('2026-10-10','09:00','12:00','Assemblée statutaire','Temps statutaire réservé aux membres JCI.','Salle des Congrès','Statutaire',null::text,7),
  ('2026-10-10','20:00','23:00','Soirée de clôture','Gala de clôture de la Convention.','Esplanade centrale','Soirée',null::text,8)
) as v(date, start_time, end_time, title, description, location, category, speaker_name, display_order)
left join speakers sp on sp.name = v.speaker_name
where not exists (select 1 from program_sessions);

insert into participants (name, city, organization, role, is_public)
select * from (values
  ('Mariama Souley','Niamey','JCI Niamey','Déléguée', true),
  ('Abdoul Kader Issa','Zinder','JCI Zinder','Membre JCI', true),
  ('Halima Boubacar','Maradi','JCI Maradi','Organisatrice', true)
) as v(name, city, organization, role, is_public)
where not exists (select 1 from participants);
