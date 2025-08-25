export const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi",
  pool: "Pool",
  spa: "Spa",
  bar: "Bar",
  restaurant: "Restaurant",
  game_drives: "Game drives",
  airstrip: "Airstrip",
  conference: "Conference",
  crater_views: "Crater views",
};

export function formatAmenityKey(key: string): string {
  return AMENITY_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeAmenities(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, any>)
      .filter(([, v]) => v === true || v === "true")
      .map(([k]) => k);
  }
  return [];
}

export const DEFAULT_AMENITIES_ORDER = Object.keys(AMENITY_LABELS);