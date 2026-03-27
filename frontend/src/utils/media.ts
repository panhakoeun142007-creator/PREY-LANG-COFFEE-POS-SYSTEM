export function toSameOriginMediaUrl(url: string): string {
  const raw = (url || "").trim();
  if (!raw) return raw;

  // If the backend returns an absolute URL like:
  //   https://api.example.com/media/<path>
  // convert it to same-origin:
  //   /media/<path>
  // so Vercel can proxy it via `vercel.json` and avoid cross-origin edge cases.
  const mediaIndex = raw.indexOf("/media/");
  if (mediaIndex >= 0) {
    return raw.slice(mediaIndex);
  }

  return raw;
}

export function withCacheBuster(url: string, version?: string | number | null): string {
  const raw = (url || "").trim();
  if (!raw) return raw;
  const v = version ?? Date.now();

  const joiner = raw.includes("?") ? "&" : "?";
  return `${raw}${joiner}v=${encodeURIComponent(String(v))}`;
}

