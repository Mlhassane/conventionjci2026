export type EventSettings = {
  id: string;
  event_name: string;
  tagline: string;
  hashtag: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  location: string;
  hero_text: string;
  logo_url: string | null;
  secondary_logo_url: string | null;
  color_primary: string;
  color_accent: string;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_whatsapp: string | null;
  /** Contact affiché dans le pied de page du site public. */
  contact_email: string | null;
  contact_phone: string | null;
  /** Description utilisée pour le SEO (balise meta + Open Graph). */
  seo_description: string | null;
  updated_at?: string;
};

export type Participation = {
  id: string;
  name: string;
  city: string | null;
  organization: string | null;
  message: string | null;
  image_url: string | null;
  created_at: string;
};

export type Participant = {
  id: string;
  name: string;
  city: string | null;
  organization: string | null;
  role: string | null;
  photo_url: string | null;
  is_public: boolean;
  /** Phone number used by the organization (never exposed to anon). */
  phone: string | null;
  /** Unique convention code assigned by the admin. */
  member_code: string | null;
  /** True only for the explicitly linked administrator account. */
  is_admin?: boolean;
  auth_email?: string | null;
  created_at: string;
};

export type BadgeStatus = "active" | "revoked";

export type Badge = {
  id: string;
  participant_id: string | null;
  full_name: string;
  role: string;
  organization: string | null;
  city: string | null;
  photo_url: string | null;
  unique_code: string;
  status: BadgeStatus;
  badge_url: string | null;
  created_at: string;
};

/**
 * Types de partenariat proposés en suggestion dans l'admin.
 * Le champ reste libre : n'importe quelle autre formulation est acceptée.
 */
export const PARTNER_CATEGORIES = [
  "Partenaire officiel",
  "Partenaire principal",
  "Sponsor",
  "Partenaire média",
  "Partenaire institutionnel",
  "Partenaire technique",
] as const;

/** Type de partenariat saisi : une valeur libre. */
export type PartnerCategory = string;

export type Partner = {
  id: string;
  name: string;
  logo_url: string | null;
  category: PartnerCategory;
  description: string | null;
  website: string | null;
  whatsapp: string | null;
  offer: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
};

export type Speaker = {
  id: string;
  name: string;
  photo_url: string | null;
  position: string | null;
  organization: string | null;
  bio: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
};

export type Official = {
  id: string;
  name: string;
  title: string | null;
  organization: string | null;
  photo_url: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
};

export type SessionCategory =
  | "Cérémonie"
  | "Formation"
  | "Panel"
  | "Networking"
  | "Pause"
  | "Soirée"
  | "Statutaire";

export type ProgramSession = {
  id: string;
  date: string; // ISO date, e.g. 2026-10-09
  start_time: string; // HH:mm
  end_time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  category: SessionCategory;
  speaker_id: string | null;
  display_order: number;
  is_visible: boolean;
};

export type PracticalInfoSection =
  | "Lieu"
  | "Localisation"
  | "Hébergement"
  | "Transport"
  | "Restauration"
  | "Contacts utiles"
  | "Informations importantes";

export type PracticalInfo = {
  id: string;
  section: PracticalInfoSection;
  title: string;
  content: string;
  map_url: string | null;
  display_order: number;
  is_visible: boolean;
};

export type AnalyticsEventName =
  | "poster_generated"
  | "poster_downloaded"
  | "poster_shared"
  | "whatsapp_share_clicked"
  | "badge_generated"
  | "badge_downloaded"
  | "partner_viewed"
  | "speaker_viewed"
  | "program_viewed";

export type AnalyticsEvent = {
  id: string;
  event_name: AnalyticsEventName;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
