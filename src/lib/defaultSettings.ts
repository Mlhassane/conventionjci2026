import { EventSettings } from "./types";

/**
 * Valeurs de repli utilisées uniquement si Supabase est injoignable.
 * Elles ne servent qu'à garder le site lisible : tout le contenu éditorial
 * (programme, intervenants, partenaires, infos) provient de la base.
 */
export const defaultEventSettings: EventSettings = {
  id: "default",
  event_name: "JCI Experience 2026",
  tagline: "Votre Convention. Votre expérience. Votre réseau.",
  hashtag: "",
  start_date: "",
  end_date: "",
  location: "",
  hero_text: "",
  logo_url: null,
  secondary_logo_url: null,
  color_primary: "#130F2D",
  color_accent: "#0097D7",
  social_facebook: null,
  social_instagram: null,
  social_linkedin: null,
  social_whatsapp: null,
  contact_email: null,
  contact_phone: null,
  seo_description: null,
};
