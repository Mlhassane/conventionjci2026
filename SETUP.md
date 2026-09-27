# Migration vers une nouvelle machine

Guide pour relancer **JCI Experience 2026** sur un autre ordinateur.

> **Sécurité** : `.env.local` est **gitignoré** et ne doit **jamais** être commité.
> **Ne colle jamais ces clés dans un chat, un ticket ou un commit.** Si une clé a été partagée, considère-la compromise et régénère-la depuis Supabase avant le déploiement.

---

## 1. Prérequis

| Outil | Version recommandée |
|---|---|
| Node.js | 18+ (20 LTS idéal) |
| npm | fourni avec Node |
| Git |any |
| Supabase CLI | optionnel pour les migrations |
| Docker ou Podman | requis uniquement pour Supabase local |

---

## 2. Installer le projet

```bash
git clone https://github.com/Mlhassane/conventionjci2026.git
cd conventionjci2026
npm install
```

Puis recréer le fichier d’environnement à la racine :

```bash
cp .env.local.example .env.local
```

Remplir `.env.local` avec **tes vraies valeurs** (voir §3).

```bash
npm run dev
# → http://localhost:3000
```

Scripts utiles :

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build production |
| `npm run start` | serveur production |
| `npm run lint` | lint ESLint |

---

## 3. Variables d’environnement (`.env.local`)

Fichier **local uniquement** (ignoré par Git). Template : `.env.local.example`.

### Obligatoires

| Variable | À quoi ça sert | Où la trouver |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (lectures publiques + admin) | Supabase → **Project Settings → API** → *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique `anon` (RLS protège les données) | Supabase → **Project Settings → API** → *anon public* |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé **service_role** — uniquement côté serveur (`/api/admin/code-login`). **Ne jamais exposer côté client.** | Supabase → **Project Settings → API** → *service_role* |
| `ADMIN_HASSANE_PASSWORD` | Mot de passe du compte admin Supabase Auth utilisé par le login par code (`/admin`) | Mot de passe que **toi-même** as défini pour l’admin (Auth → Users), ou que tu choisis en le changeant |

### Optionnelles

| Variable | Défaut | À quoi ça sert |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `window.location` dans le navigateur | Base URL des liens QR badge (`/badge/verify/...`) — mettre l’URL publique en prod, `http://localhost:3000` en dev |

### Exemple de `.env.local` (structure — remplace les valeurs)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE-ANON-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=VOTRE-SERVICE-ROLE-KEY
ADMIN_HASSANE_PASSWORD=VOTRE-MOT-DE-PASSE-ADMIN-AUTH
```

### Comment récupérer les clés Supabase

1. Ouvre [supabase.com](https://supabase.com) → ton projet.
2. **Project Settings → API**.
3. Copie :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ secret
4. **Authentication → Users** : le compte admin (email) doit exister ; son mot de passe = `ADMIN_HASSANE_PASSWORD`.

### À ne pas faire

- ❌ Ne pas committer `.env.local` ni coller ces clés dans un README public.
- ❌ Ne pas mettre `SUPABASE_SERVICE_ROLE_KEY` dans une variable `NEXT_PUBLIC_*`.
- ✅ En prod (Vercel…) : renseigner les mêmes variables dans le dashboard d’hébergement.

---

## 4. Base de données Supabase

Le projet Supabase (tables, données, storage) **reste sur le cloud** : sur une nouvelle machine, tu n’as **pas** à recréer la DB si tu utilises le même projet.

Si tu dois **recréer** un projet vierge :

1. SQL Editor → exécuter `supabase/schema.sql`, puis **chaque fichier** de `supabase/migrations/*.sql` dans l’ordre alphabétique / horodatage. La migration `20260925000000_secure_admin_access.sql` doit être appliquée après la migration de liaison admin.
2. Vérifier que le projet lié par la CLI correspond exactement à celui de `.env.local` avant toute commande `db push`.
3. Recréer l’utilisateur admin dans **Authentication → Users** et vérifier que son email est lié à la ligne participant `is_admin = true`.
4. Mettre à jour `.env.local` avec la nouvelle URL / clés.

Les mots de passe Auth ne sont pas exportables via l’API : le compte administrateur est recréé automatiquement, mais tout autre compte Auth doit être recréé ou réinitialisé manuellement dans le nouveau projet.

Buckets Storage déjà prévus : `photos`, `posters`, `badges`, `partners`, `speakers`, `branding`.

---

## 5. Checklist migration

- [ ] `git clone` + `npm install`
- [ ] Copier / recréer `.env.local` (5 variables, hors Git)
- [ ] Appliquer `schema.sql` + toutes les migrations dans le bon projet
- [ ] Vérifier que le lien CLI correspond au projet de `.env.local`
- [ ] Vérifier que le projet Supabase est joignable
- [ ] `npm run dev` → homepage 200
- [ ] `/admin` : login code ou email fonctionne
- [ ] Une modification admin apparaît sur le site public (force-dynamic)
- [ ] Upload logo/photo admin OK (buckets)
- [ ] Les secrets partagés ont été rotatés avant la production

---

## 6. Après la migration

Quand l’ancien machine est nettoyée :

- Supprimer le clone local si besoin.
- Sur GitHub : le repo ne contient **pas** les secrets (`.env.local` ignoré).
- Si une clé a **pu** fuiter (mauvais commit, screenshot…) : ** régénérer les clés ** dans Supabase → Project Settings → API et mettre à jour `.env.local` + hébergeur.

---

## 7. Raccourcis

| Ressource | Lien / chemin |
|---|---|
| Repo | https://github.com/Mlhassane/conventionjci2026 |
| Admin | `http://localhost:3000/admin` |
| Template env | `.env.local.example` |
| Schema DB | `supabase/schema.sql` |
| Migrations | `supabase/migrations/` |
| README projet | `README.md` |
