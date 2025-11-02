import { supabase } from "../supabaseClient";
import { toPublicUrl } from "../../utils/images";

export type PackageListRow = {
  package_id: number;
  package_name: string;
  price_per_person: number;
  duration_days: number;
  highlights: string | null;
  destinations?: { name?: string | null; country?: string | null } | null;
  tour_companies?: {
    name?: string | null;
    rating_avg?: number | null;
    rating_count?: number | null;
  } | null;
  package_images?: { url: string | null; image_id: number | null }[] | null;
};

export async function listPackages(): Promise<PackageListRow[]> {
  const { data, error } = await supabase
    .from("packages")
    .select(`
      package_id, package_name, price_per_person, duration_days, highlights,
      destinations ( name, country ),
      tour_companies ( name, rating_avg, rating_count ),
      package_images ( url, image_id )
    `)
    .eq("active", true);

  if (error) throw error;
  return (data || []) as unknown as PackageListRow[];
}

export type PackageDetail = PackageListRow & {
  itineraries?: {
    itinerary_id: number;
    day_number: number | null;
    activity_description: string | null;
    location: string | null;
  }[] | null;
};

export async function fetchPackageById(
  id: number
): Promise<PackageDetail | null> {
  const { data, error } = await supabase
    .from("packages")
    .select(`
      package_id, package_name, price_per_person, duration_days, highlights,
      destinations ( name, country ),
      tour_companies ( name, rating_avg, rating_count ),
      package_images ( url, image_id ),
      itineraries ( itinerary_id, day_number, activity_description, location )
    `)
    .eq("package_id", id)
    .single();

  if (error) throw error;
  return (data || null) as unknown as PackageDetail | null;
}

export function packageHeroImage(row: PackageListRow, fallback: string): string {
  const pics = (row.package_images || [])
    .slice()
    .sort((a, b) => (a.image_id ?? 1e9) - (b.image_id ?? 1e9));
  const url = pics.length ? toPublicUrl(pics[0]?.url ?? null) : null;
  return url || fallback;
}