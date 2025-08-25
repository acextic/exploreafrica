const SB_URL =
  (import.meta as any)?.env?.VITE_SUPABASE_URL?.toString().replace(/\/+$/, "") ||
  "";
const PUBLIC_BUCKET =
  (import.meta as any)?.env?.VITE_PUBLIC_BUCKET || "accomodation-images";

const isHttp = (u: string) => /^https?:\/\//i.test(u);

/**
 * Turn any stored value into a browser-usable URL.
 * - Absolute URLs: returned as-is
 * - Values starting with "/storage/...": prefixed with VITE_SUPABASE_URL
 * - Bare filenames like "photo.jpg": expanded to your public bucket URL
 */
export function toPublicUrl(input?: string | null): string | null {
  if (!input) return null;
  const url = input.trim();
  if (!url) return null;

  if (isHttp(url)) return url;

  if (url.startsWith("/")) {
    return SB_URL ? `${SB_URL}${url}` : url;
  }

  return SB_URL
    ? `${SB_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${url}`
    : url;
}


export function primaryImageUrl(
  images:
    | Array<{ url?: string | null; image_id?: number | null }>
    | null
    | undefined,
  fallback: string
): string {
  if (!images?.length) return fallback;

  const first = [...images]
    .sort(
      (a, b) =>
        (a.image_id ?? Number.MAX_SAFE_INTEGER) -
        (b.image_id ?? Number.MAX_SAFE_INTEGER)
    )
    .map((x) => toPublicUrl(x.url ?? null))
    .find((u): u is string => !!u);

  return first || fallback;
}

export function mapGalleryUrls(
  images:
    | Array<{ url?: string | null; image_id?: number | null }>
    | null
    | undefined,
  fallback: string
): string[] {
  if (!images?.length) return [fallback];

  const list = [...images]
    .sort(
      (a, b) =>
        (a.image_id ?? Number.MAX_SAFE_INTEGER) -
        (b.image_id ?? Number.MAX_SAFE_INTEGER)
    )
    .map((x) => toPublicUrl(x.url ?? null))
    .filter((u): u is string => !!u);

  return list.length ? list : [fallback];
}