const LOCAL_FAVORITES_KEY = "camgl_local_favorites";
export const LOCAL_FAVORITES_EVENT = "camgl-local-favorites-changed";

export function getLocalFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.map((x) => String(x).trim()).filter(Boolean)));
  } catch {
    return [];
  }
}

export function setLocalFavorites(slugs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unique = Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean)));
    window.localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(unique));
    window.dispatchEvent(new Event(LOCAL_FAVORITES_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function toggleLocalFavorite(slug: string): { favorited: boolean; slugs: string[] } {
  const current = getLocalFavorites();
  const exists = current.includes(slug);
  const next = exists ? current.filter((s) => s !== slug) : [slug, ...current];
  setLocalFavorites(next);
  return { favorited: !exists, slugs: next };
}

export function clearLocalFavorites(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_FAVORITES_KEY);
    window.dispatchEvent(new Event(LOCAL_FAVORITES_EVENT));
  } catch {
    // ignore storage errors
  }
}
