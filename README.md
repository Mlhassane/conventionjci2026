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
2. Open **SQL Editor**, paste the entire contents of `supabase/schema.sql`, and run it. This creates every table, Row Level Security policy, storage bucket, and seeds `event_settings` + starter speakers/practical info.
3. Open **Authentication → Users** and create at least one admin user (email + password). Anyone who can log in is treated as an administrator — there's no separate roles table in this MVP, so only create accounts for trusted organizers.
4. Copy the Project URL and `anon` public key into `.env.local`.
5. Restart `npm run dev`. The homepage stats, program, speakers, partners, participants and admin dashboard will now read live data; `/admin` login will work.

### Storage buckets

The schema creates six public buckets: `photos`, `posters`, `badges`, `partners`, `speakers`, `branding`. Public users can upload to `photos`/`posters`/`badges` (poster & badge generation flows); only authenticated admins can write to `partners`, `speakers`, and `branding` (logos). The current poster/badge generators keep everything client-side (canvas → downloadable PNG) and don't upload to Storage by default — the buckets and policies are ready if you want to persist generated visuals server-side or let admins upload partner/speaker photos and branding assets from the dashboard.

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
      (protected)/               Route group: dashboard, partners, speakers,
                                  programme, infos, settings, analytics
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

Every piece of event-specific content lives in Supabase and is editable from `/admin`:

| What | Table | Admin page |
|---|---|---|
| Event name, dates, location, tagline, hashtag, hero text, logos, colors, socials | `event_settings` | `/admin/settings` |
| Partners | `partners` | `/admin/partners` |
| Speakers | `speakers` | `/admin/speakers` |
| Program sessions | `program_sessions` | `/admin/programme` |
| Practical information | `practical_information` | `/admin/infos` |
| Participants & badges | `participants`, `badges` | created by the public flows; visibility/status manageable via Supabase Table Editor (dedicated UI can be added later) |

---

## 6. Poster & badge generation

Both `/visuel` and `/badge` are fully client-side Canvas API generators (no server round-trip needed to produce the PNG), so they work well on low-bandwidth mobile connections and finish in a few seconds:

- `/visuel` draws a 1080×1350 vertical poster with the participant's photo, name, city/organization, and a chosen or custom message, branded with the Convention identity and `#MaConventionJCI2026`.
- `/badge` draws a 1080×1600 badge with a unique code (`JCI-2026-XXXXXX`) and an embedded QR code linking to `/badge/verify/[code]`. When Supabase is connected, generating a badge also creates a `participants` row and a `badges` row so the QR code resolves to real, verifiable public data (name, role, organization, city — no private contact info is ever exposed).

Both flows track `*_generated`, `*_downloaded`, `whatsapp_share_clicked`, and `poster_shared` events to `analytics_events`, visible in `/admin/analytics`.

---

## 7. Deployment

Any Next.js host works (Vercel is the simplest). Set the two `NEXT_PUBLIC_SUPABASE_*` environment variables (and optionally `NEXT_PUBLIC_SITE_URL`) in your host's dashboard, then deploy. No server runtime secrets are required — everything uses the public anon key, protected by the Row Level Security policies in `supabase/schema.sql`.

---

## 8. What's intentionally out of scope for this MVP

Per the brief's own priorities, the following were deferred so the core experience (homepage, poster, badge, program, partners, speakers, practical info, admin) ships first and stays simple:

- Photo/logo upload directly to Supabase Storage from the admin UI (buckets & policies are ready; wiring the upload widgets is a follow-up)
- Drag-and-drop reordering in admin lists (display_order is editable via the field, not yet drag-and-drop)
- A dedicated admin UI for participants/badges (manageable via Supabase Table Editor today)
- Social wall / advanced participant social features
