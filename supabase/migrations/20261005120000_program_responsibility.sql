/*
 * Agenda provisoire de la Convention.
 *
 * Deux ajustements :
 *
 * 1. Ajout de la colonne « responsibility » : l'agenda distingue le lieu
 *    et la commission responsable de chaque activité.
 *
 * 2. L'heure de début devient facultative : l'agenda étant provisoire,
 *    certaines activités n'ont pas encore d'horaire arrêté.
 */
alter table program_sessions
  add column if not exists responsibility text;

alter table program_sessions
  alter column start_time drop not null;

comment on column program_sessions.responsibility is
  'Commission ou structure responsable de l''activité.';
comment on column program_sessions.start_time is
  'Heure de début au format HH:mm. Vide tant que l''horaire n''est pas arrêté.';