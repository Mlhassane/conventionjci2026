import { getSupabaseClient } from "./supabase/client";

export type JyseraiParticipationInput = {
  name: string;
  city: string;
  organization: string;
  message: string;
  imageBlob: Blob;
};

export type JyseraiSaveResult = {
  saved: boolean;
  imageUrl?: string;
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Saves a public J'y serai generation and its PNG in Supabase Storage.
 * Generation never fails because persistence is unavailable: the caller can
 * still show and download the image when the project is offline.
 */
export async function saveJyseraiParticipation(
  input: JyseraiParticipationInput
): Promise<JyseraiSaveResult> {
  const supabase = getSupabaseClient();
  if (!supabase || !input.imageBlob) return { saved: false };

  const id = makeId();
  const path = `j-y-seri/${new Date().toISOString().slice(0, 10)}/${id}.png`;

  const { error: uploadError } = await supabase.storage
    .from("posters")
    .upload(path, input.imageBlob, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) return { saved: false };

  const { data: urlData } = supabase.storage.from("posters").getPublicUrl(path);
  const imageUrl = urlData?.publicUrl ?? null;

  const { error: insertError } = await supabase.from("participations").insert({
    name: input.name.trim(),
    city: input.city.trim() || null,
    organization: input.organization.trim() || null,
    message: input.message.trim() || null,
    image_url: imageUrl,
  });

  if (insertError) {
    // Avoid leaving an orphaned file when the database insert fails.
    await supabase.storage.from("posters").remove([path]);
    return { saved: false };
  }

  return { saved: true, imageUrl: imageUrl ?? undefined };
}
