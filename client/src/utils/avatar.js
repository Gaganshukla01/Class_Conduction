// Avatar URLs. The server already sends ready-made thumbnails (…/upload/w_160,h_160,c_fill,…/…).
// Raw Cloudinary URLs (e.g. from the user list) get the same square crop here.
export function avatarSrc(src, size = 96) {
  const url = typeof src === "string" ? src : src?.url;
  if (!url) return null;
  if (!url.includes("/upload/") || /\/upload\/[a-z]_/.test(url)) return url;
  return url.replace("/upload/", `/upload/w_${size * 2},h_${size * 2},c_fill,g_auto,q_auto,f_auto/`);
}
