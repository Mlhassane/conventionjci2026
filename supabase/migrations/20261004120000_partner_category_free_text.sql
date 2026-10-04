/*
 * Type de partenariat libre.
 *
 * La colonne est déjà du texte ; seule la contrainte CHECK qui la limitait
 * à six valeurs est retirée. L'admin peut ainsi proposer ces six valeurs
 * tout en acceptant n'importe quelle autre formulation.
 */
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'partners'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%category%'
  loop
    execute format('alter table partners drop constraint %I', constraint_name);
  end loop;
end $$;

comment on column partners.category is
  'Type de partenariat : valeur libre, les types usuels sont proposés en suggestion dans l''admin.';