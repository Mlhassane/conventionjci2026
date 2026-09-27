"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import { MAX_PHOTO_SIZE_BYTES } from "@/lib/canvas/loadImage";

export type AdminImageBucket =
  | "partners"
  | "speakers"
  | "branding"
  | "photos";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeExt(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "png" || ext === "webp" || ext === "jpg" || ext === "jpeg") {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return "jpg";
}

/**
 * Uploads an image to a Supabase Storage bucket and returns its public URL.
 * Pass a fixed `path` (with ext omitted or full) when you want upsert overwrite.
 * Returns null on failure (no client, missing file, storage error).
 */
export async function uploadAdminImage(
  bucket: AdminImageBucket,
  prefix: string,
  file: File,
  options?: { fixedName?: string }
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !file) return null;
  if (file.size > MAX_PHOTO_SIZE_BYTES) return null;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return null;

  const name =
    options?.fixedName ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt(file)}`;
  const path = options?.fixedName
    ? `${prefix}/${name}.${safeExt(file)}`
    : `${prefix}/${name}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) return null;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
