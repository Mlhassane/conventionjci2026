# JCI Experience 2026

Plateforme digitale officielle de la **Convention JCI Niger 2026** (9–10 octobre, Maradi).

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, Storage) + Framer Motion.

---

## 1. Installation

```bash
npm install
cp .env.local.example .env.local
```

Fill `.env.local` with your Supabase project's URL and anon key (Project Settings → API).

The app **runs and renders without Supabase configured** — every page falls back to polished demo content (`src/lib/mockData.ts`) so you can preview the design immediately. Nothing will actually save (badges, analytics, admin login) until Supabase is connected.

```bash
npm run dev
```

---

## 2. Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply `supabase/schema.sql` **and then every file in `supabase/migrations/` in timestamp order**. `schema.sql` is the initial schema; later migrations add participant access, the admin link, officials and the restricted admin policies.
3. Open **Authentication → Users** and create the admin user whose email is linked to the admin participant row. Public sign-ups should be disabled or restricted.
4. Copy the Project URL and `anon` public key into `.env.local`.
5. Restart `npm run dev`. The homepage stats, program, speakers, partners, participants and admin dashboard will now read live data; `/admin` login will work.

### Storage buckets

The schema creates six public buckets: `photos`, `posters`, `badges`, `partners`, `speakers`, `branding`. Public users can upload participant photos to `photos`; authenticated linked admins can write to the content and branding buckets. The poster and badge generators currently keep the generated PNG client-side (canvas → downloadable PNG); persisting generated visuals in Storage is a follow-up.

---

## 3. Project structure

```
src/
  app/
    page.tsx                     Homepage
    visuel/                      Poster generator (/visuel)
    badge/                       Badge generator (/badge)
    badge/verify/[id]/           Public QR verification page
    programme/                   Program with category filters
    intervenants/                Speakers list + detail
    partenaires/                 Partners list + detail
    participants/                Participant directory (search/filter)
    infos/                       Practical information
    admin/                       Login (/admin) + protected dashboard
      (protected)/               Route group: dashboard, participants, badges,
                                  partners, speakers, officials, programme,
                                  infos, analytics, settings
    espace/                      Participant code login + participant space
  components/                    Nav, BottomNav, Footer, form fields, admin shell
  lib/
    canvas/                      Poster & badge PNG generation (Canvas API + QR)
    supabase/client.ts           Supabase client, safe when unconfigured
    data.ts                      Data-access layer (Supabase with mock fallback)
    mockData.ts                  Demo content used before Supabase is connected
    types.ts                     Shared TypeScript types matching the DB schema
    admin/useTable.ts            Generic CRUD hook used by every admin list page
supabase/
  schema.sql                     Full DB schema, RLS policies, storage, seed data
```

---

## 4. Design system

- **Colors**: official JCI palette — JCI Blue (`blue` `#0097D7`, primary brand colour), JCI Black (`ink` `#130F2D`), JCI White (`paper` `#FFFFFF`), plus secondary colours JCI Navy (`navy` `#1F4789`), JCI Yellow (`yellow` `#EFC40F`) and JCI Teal (`teal` `#57BCBC`). Accessible darker shades (`blue-dark`, `teal-dark`) are used for small text on white. Semantic tokens `danger` / `success` are reserved for form errors and success states (WhatsApp buttons stay green by convention).
- **Typography**: Fraunces (serif, headlines) + Manrope (sans, interface) via `next/font/google`.
- **Motion**: Framer Motion used sparingly — page/step transitions, the animated stat counters on the homepage. No decorative animation.

All of this is defined once in `tailwind.config.ts` and `src/app/globals.css` — change it there to re-theme the whole app. The poster/badge canvas generators (`src/lib/canvas/`) mirror the same palette in their local `COLORS` objects.

---

## 5. Editable content — nothing is hard-coded

Most event-specific content lives in Supabase and is editable from `/admin`. The generator templates and a few labels still contain fixed event branding and should be made fully dynamic before a future edition:

| What | Table | Admin page |
|---|---|---|
| Event name, dates, location, tagline, hashtag, hero text, logos, colors, socials | `event_settings` | `/admin/settings` |
| Partners | `partners` | `/admin/partners` |
| Speakers | `speakers` | `/admin/speakers` |
| Program sessions | `program_sessions` | `/admin/programme` |
| Practical information | `practical_information` | `/admin/infos` |
| Participants & badges | `participants`, `badges` | `/admin/participants`, `/admin/badges` |
| Event officials | `officials` | `/admin/officials` |

---

## 6. Poster & badge generation

Both `/visuel` and `/badge` are Canvas API generators that run in the browser. They require a participant session obtained from `/espace` with the convention code and full name:

- `/visuel` draws a 1080×1350 vertical poster with the participant's photo, name, city/organization, and a chosen or custom message, branded with the Convention identity and `#MaConventionJCI2026`.
- `/badge` draws a 1080×1600 badge with a unique code (`JCI-2026-XXXXXX`) and an embedded QR code linking to `/badge/verify/[code]`. The badge is linked to the authenticated participant record when Supabase is available.

The PNG generation itself is client-side and does not require a server round-trip. Analytics events are written to Supabase when the project is configured.

---

## 7. Deployment

Any Next.js host works (Vercel is the simplest). Set the two `NEXT_PUBLIC_SUPABASE_*` environment variables (and optionally `NEXT_PUBLIC_SITE_URL`) in your host's dashboard, then deploy. No server runtime secrets are required — everything uses the public anon key, protected by the Row Level Security policies in `supabase/schema.sql`.

---

## 8. What's intentionally out of scope for this MVP

Per the brief's own priorities, the following were deferred so the core experience (homepage, poster, badge, program, partners, speakers, practical info, admin) ships first and stays simple:

- Persisting generated poster/badge PNGs in Storage (the download/share flow works today)
- Drag-and-drop reordering in admin lists (display_order is editable, but not yet drag-and-drop)
- Social wall / advanced participant social features
- Automated transactional email/SMS and payment integration
