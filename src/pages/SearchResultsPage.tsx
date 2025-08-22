import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SafariCard from "../components/SafariCard";
import EnhancedSearch from "../components/home/EnhancedSearch";
import { primaryImageUrl } from "../utils/images";

const fallbackImage = "https://source.unsplash.com/featured/?safari,camp";

type AmenityFlags = Record<string, boolean>;

type ResultRow = {
  accommodation_id: number;
  name: string;
  address: string;
  accommodation_type: string | null;
  price_per_night: number;
  rating_avg: number | null;
  rating_count: number | null;
  amenities: AmenityFlags | null; // <-- include amenities for counts/disable
  accommodation_images: { image_id: number | null; url: string | null }[];
};

const AMENITIES_ALL = [
  "wifi",
  "pool",
  "spa",
  "bar",
  "restaurant",
  "game_drives",
  "conference",
  "airstrip",
  "crater_views",
] as const;
type AmenityKey = (typeof AMENITIES_ALL)[number];

const TYPES_ALL = ["lodge", "tent", "hotel"] as const;
type TypeKey = (typeof TYPES_ALL)[number];

function parseList(param?: string | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SearchResultsPage() {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const navigate = useNavigate();

  // ------- URL -> state -------
  const whereRaw =
    (
      params.get("where") ||
      params.get("q") ||
      params.get("destination") ||
      params.get("country") ||
      params.get("location") ||
      ""
    ).trim() || "";

  const typeFilter = (params.get("type") || "").trim(); // lodge | tent | hotel | ""
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const amenityList = parseList(params.get("amenities")).filter((a) =>
    AMENITIES_ALL.includes(a as AmenityKey)
  ) as AmenityKey[];

  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";
  const adults = parseInt(params.get("adults") || "1", 10);
  const children = parseInt(params.get("children") || "0", 10);
  const rooms = parseInt(params.get("rooms") || "1", 10);

  // ------- results -------
  const [results, setResults] = useState<ResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ------- local UI state for filters (mirrors URL) -------
  const [uiType, setUiType] = useState(typeFilter);
  const [uiMin, setUiMin] = useState(minPrice || "");
  const [uiMax, setUiMax] = useState(maxPrice || "");
  const [uiAmenities, setUiAmenities] = useState<Record<AmenityKey, boolean>>(
    AMENITIES_ALL.reduce((acc, k) => {
      acc[k] = amenityList.includes(k);
      return acc;
    }, {} as Record<AmenityKey, boolean>)
  );

  // keep local UI in sync when back/forward pressed
  useEffect(() => {
    setUiType(typeFilter);
    setUiMin(minPrice || "");
    setUiMax(maxPrice || "");
    setUiAmenities(
      AMENITIES_ALL.reduce((acc, k) => {
        acc[k] = amenityList.includes(k);
        return acc;
      }, {} as Record<AmenityKey, boolean>)
    );
  }, [typeFilter, minPrice, maxPrice, amenityList.join("|")]);

  // ------- fetch -------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      let q = supabase.from("accommodations").select(
        `
          accommodation_id,
          name,
          address,
          accommodation_type,
          price_per_night,
          rating_avg,
          rating_count,
          amenities,
          accommodation_images ( image_id, url )
        `
      );

      // sort images
      q = q.order("image_id", {
        foreignTable: "accommodation_images",
        ascending: true,
      });

      // text/location filters
      if (whereRaw) {
        const parts: string[] = whereRaw
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);

        if (parts.length >= 2) {
          q = q
            .ilike("address", `%${parts[0]}%`)
            .ilike("address", `%${parts.slice(1).join(" ")}%`);
        } else if (parts.length === 1) {
          const term = `%${parts[0]}%`;
          q = q.or(`name.ilike.${term},address.ilike.${term}`);
        }
      }

      // type filter
      if (typeFilter) {
        q = q.eq("accommodation_type", typeFilter);
      }

      // price filters (from URL)
      const min = Number(minPrice);
      const max = Number(maxPrice);
      if (!Number.isNaN(min) && min > 0) q = q.gte("price_per_night", min);
      if (!Number.isNaN(max) && max > 0) q = q.lte("price_per_night", max);

      // amenities (JSONB contains)
      if (amenityList.length > 0) {
        const containsObj: Record<string, boolean> = {};
        amenityList.forEach((k) => (containsObj[k] = true));
        q = q.contains("amenities", containsObj);
      }

      const { data, error } = await q;

      if (cancelled) return;
      if (error) {
        setError("Something went wrong while fetching data.");
        setResults([]);
      } else {
        setResults((data as ResultRow[]) || []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // re-run whenever URL changes
  }, [whereRaw, typeFilter, minPrice, maxPrice, amenityList.join(","), search]);

  // ------- availability for disabling options (based on current results) -------
  const { typeCounts, amenityCounts } = useMemo(() => {
    const tCounts: Record<string, number> = {};
    const aCounts: Record<AmenityKey, number> = AMENITIES_ALL.reduce(
      (acc, k) => ({ ...acc, [k]: 0 }),
      {} as Record<AmenityKey, number>
    );

    for (const r of results) {
      if (r.accommodation_type) {
        const key = r.accommodation_type.toLowerCase();
        tCounts[key] = (tCounts[key] || 0) + 1;
      }
      const flags = r.amenities || {};
      for (const k of AMENITIES_ALL) {
        if (flags[k] === true) aCounts[k] += 1;
      }
    }
    return { typeCounts: tCounts, amenityCounts: aCounts };
  }, [results]);

  // ------- build & navigate with filters -------
  function applyFilters() {
    const newParams = new URLSearchParams(search);

    // keep existing search context (where/dates/occupancy), only mutate filters
    if (uiType) newParams.set("type", uiType);
    else newParams.delete("type");

    if (uiMin) newParams.set("minPrice", uiMin);
    else newParams.delete("minPrice");

    if (uiMax) newParams.set("maxPrice", uiMax);
    else newParams.delete("maxPrice");

    const selectedAmenities = AMENITIES_ALL.filter((k) => uiAmenities[k]);
    if (selectedAmenities.length) {
      newParams.set("amenities", selectedAmenities.join(","));
    } else {
      newParams.delete("amenities");
    }

    navigate(`/search?${newParams.toString()}`);
  }

  function clearFilters() {
    const newParams = new URLSearchParams(search);
    newParams.delete("type");
    newParams.delete("minPrice");
    newParams.delete("maxPrice");
    newParams.delete("amenities");
    navigate(`/search?${newParams.toString()}`);
  }

  return (
    <main className="flex flex-col w-full min-h-screen pt-6 bg-gray-50">
      <div className="w-full px-8 mb-2">
        <EnhancedSearch showHero={false} compact />
      </div>

      <div className="flex w-full px-8 gap-5">
        {/* Sidebar Filters */}
        <aside className="hidden md:block md:w-1/5 lg:w-1/6 sticky top-16 h-fit">
          <div className="bg-white rounded-xl shadow p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-xs text-gray-600 underline"
              >
                Clear
              </button>
            </div>

            {/* Type */}
            <label className="block mb-2 text-sm font-medium">Type</label>
            <select
              value={uiType}
              onChange={(e) => setUiType(e.target.value)}
              className="w-full border rounded p-2 text-sm mb-4"
            >
              <option value="">All</option>
              {TYPES_ALL.map((t) => (
                <option key={t} value={t} disabled={!typeCounts[t]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}{" "}
                  {typeCounts[t] ? `(${typeCounts[t]})` : ""}
                </option>
              ))}
            </select>

            {/* Price */}
            <label className="block mb-2 text-sm font-medium">
              Price / night
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <input
                type="number"
                min={0}
                placeholder="Min"
                className="w-full border rounded p-2 text-sm"
                value={uiMin}
                onChange={(e) => setUiMin(e.target.value)}
              />
              <input
                type="number"
                min={0}
                placeholder="Max"
                className="w-full border rounded p-2 text-sm"
                value={uiMax}
                onChange={(e) => setUiMax(e.target.value)}
              />
            </div>

            {/* Amenities */}
            <label className="block mb-2 text-sm font-medium">Amenities</label>
            <div className="flex flex-col gap-1 mb-4 text-sm">
              {AMENITIES_ALL.map((k) => {
                const disabled = amenityCounts[k] === 0;
                return (
                  <label
                    key={k}
                    className={`flex items-center gap-2 ${
                      disabled ? "opacity-40" : ""
                    }`}
                    title={
                      disabled
                        ? "No results with this amenity in current search"
                        : ""
                    }
                  >
                    <input
                      type="checkbox"
                      checked={uiAmenities[k]}
                      disabled={disabled}
                      onChange={(e) =>
                        setUiAmenities((prev) => ({
                          ...prev,
                          [k]: e.target.checked,
                        }))
                      }
                    />
                    <span className="capitalize">
                      {k.replaceAll("_", " ")}{" "}
                      {amenityCounts[k] ? `(${amenityCounts[k]})` : ""}
                    </span>
                  </label>
                );
              })}
            </div>

            <button
              onClick={applyFilters}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded px-4 py-2 text-sm"
            >
              Apply filters
            </button>
          </div>
        </aside>

        {/* Results */}
        <section className="flex-1">
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <h1 className="text-xl font-bold mb-1">Search Results</h1>
            <p className="text-gray-700 text-sm">
              {whereRaw ? (
                <>
                  <strong>Where:</strong> {whereRaw} ·{" "}
                </>
              ) : null}
              <strong>Dates:</strong> {startDate || "—"}–{endDate || "—"} ·{" "}
              <strong>Occupancy:</strong> {adults} adults, {children} children,{" "}
              {rooms} room(s)
            </p>

            {/* Active filter chips */}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {typeFilter ? (
                <span className="px-2 py-1 bg-gray-100 rounded">
                  Type: {typeFilter}
                </span>
              ) : null}
              {minPrice ? (
                <span className="px-2 py-1 bg-gray-100 rounded">
                  Min ${minPrice}
                </span>
              ) : null}
              {maxPrice ? (
                <span className="px-2 py-1 bg-gray-100 rounded">
                  Max ${maxPrice}
                </span>
              ) : null}
              {amenityList.map((a) => (
                <span
                  key={a}
                  className="px-2 py-1 bg-gray-100 rounded capitalize"
                >
                  {a.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </div>

          {error ? (
            <p className="text-center text-red-500 font-semibold">{error}</p>
          ) : loading ? (
            <p className="text-center text-gray-500">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {results.length === 0 ? (
                <p className="col-span-full text-center text-gray-500">
                  No accommodations found.
                </p>
              ) : (
                results.map((acc) => (
                  <SafariCard
                    key={acc.accommodation_id}
                    name={acc.name}
                    location={acc.address}
                    price={`$${acc.price_per_night}/night`}
                    rating={acc.rating_avg ?? 0}
                    reviews={acc.rating_count ?? 0}
                    imageUrl={primaryImageUrl(
                      acc.accommodation_images,
                      fallbackImage
                    )}
                    onClick={() =>
                      navigate(`/accommodation/${acc.accommodation_id}`)
                    }
                  />
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
