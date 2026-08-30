/**
 * Requests a display-sized derivative for Cloudinary media while leaving every
 * non-Cloudinary URL untouched. Originals remain the source of truth.
 */
export function optimizedImageUrl(url: string | null | undefined, width: number) {
  if (!url || !/^https?:\/\/res\.cloudinary\.com\//i.test(url)) return url ?? "";
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},dpr_auto/`);
}

/** A real first-frame derivative for Cloudinary videos; no placeholder asset. */
export function videoPosterUrl(url: string | null | undefined) {
  if (!url || !/^https?:\/\/res\.cloudinary\.com\//i.test(url)) return undefined;
  return url.replace("/video/upload/", "/video/upload/so_0,f_jpg,q_auto/");
}
