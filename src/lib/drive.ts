/**
 * Support des images hébergées sur Google Drive.
 *
 * Collez simplement le lien de partage Drive (« Toute personne disposant
 * du lien ») dans les champs logo/photo : il est converti vers l'URL
 * d'affichage directe de Google. Les autres URLs sont renvoyées telles quelles.
 */
export function extractDriveId(url: string): string | null {
  const value = (url || "").trim();
  if (!value) return null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/thumbnail\?[^#]*\bid=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/uc\?[^#]*\bid=([a-zA-Z0-9_-]+)/,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** URL d'affichage directe (1600px) pour un fichier Drive partagé publiquement. */
export function driveDirectUrl(id: string, width = 1600): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
}

/** Normalise une URL d'image : lien Drive → URL directe, sinon inchangée. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const id = extractDriveId(url);
  return id ? driveDirectUrl(id) : url;
}
