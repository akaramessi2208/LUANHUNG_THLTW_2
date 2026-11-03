export function assetUrl(path) {
  if (!path) return '/images/mecha-model-photo.jpg';
  if (/^https?:\/\//i.test(path)) return path;
  return `/${path.replace(/^\/+/, '')}`;
}
