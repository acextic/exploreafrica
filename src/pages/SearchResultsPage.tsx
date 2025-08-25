import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SafariCard from "../components/SafariCard";
import EnhancedSearch from "../components/home/EnhancedSearch";
import { primaryImageUrl } from "../utils/images";
import { DEFAULT_AMENITIES_ORDER, formatAmenityKey } from "../utils/amenities";

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
  amenities: AmenityFlags | null;
  accommodation_images: { image_id: number | null; url: string | null }[];
};

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

  // ---------- URL → state ----------
  const whereRaw =
    (
      params.get("where") ||
      params.get("q") ||
      params.get("destination") ||
      params.get("country") ||
      params.get("location") ||
      ""
    ).trim() || "";

  const typeFilter = (params.get("type") || "").trim();
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const amenityList = parseList(params.get("amenities")).filter((a) =>
    /^[a-z0-9_]+$/i.test(a)
  );

  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";
  const adults = parseInt(params.get("adults") || "1", 10);
  const children = parseInt(params.get("children") || "0", 10);
  const rooms = parseInt(params.get("rooms") || "1", 10);

  // ---------- results ----------
  const [results, setResults] = useState<ResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { KNOWN_AMENITIES, EXTRA_AMENITIES, ALL_AMENITIES } = useMemo(() => {
    const fromResults = new Set<string>();
    for (const r of results) {
      const flags = (r.amenities || {}) as Record<string, any>;
      for (const [k, v] of Object.entries(flags)) {
        if (v === true || v === "true") fromResults.add(k);
      }
    }
    const known = DEFAULT_AMENITIES_ORDER.filter((k) => fromResults.has(k));
    const extras = Array.from(fromResults).filter(
      (k) => !DEFAULT_AMENITIES_ORDER.includes(k)
    );
    extras.sort();
    const all =
      known.length || extras.length
        ? [...known, ...extras]
        : [...DEFAULT_AMENITIES_ORDER];
    return {
      KNOWN_AMENITIES: known.length ? known : [...DEFAULT_AMENITIES_ORDER],
      EXTRA_AMENITIES: extras,
      ALL_AMENITIES: all,
    };
  }, [results]);

  const [uiType, setUiType] = useState(typeFilter);
  const [uiMin, setUiMin] = useState(minPrice || "");
  const [uiMax, setUiMax] = useState(maxPrice || "");
  const [uiAmenities, setUiAmenities] = useState<Record<string, boolean>>({});

  const [amenitiesOpen, setAmenitiesOpen] = useState(true);

  const selectedAmenityCount = useMemo(
    () => Object.values(uiAmenities).filter(Boolean).length,
    [uiAmenities]
  );

  useEffect(() => {
    setUiAmenities((prev) => {
      const next: Record<string, boolean> = {};
      for (const k of ALL_AMENITIES) {
        next[k] = amenityList.includes(k) || prev[k] === true;
      }
      return next;
    });
  }, [ALL_AMENITIES.join("|"), amenityList.join("|")]);

  const syncingRef = useRef(false);
  useEffect(() => {
    syncingRef.current = true;
    setUiType(typeFilter);
    setUiMin(minPrice || "");
    setUiMax(maxPrice || "");
    const t = setTimeout(() => {
      syncingRef.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, [typeFilter, minPrice, maxPrice, amenityList.join("|")]);

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
      if (typeFilter) q = q.eq("accommodation_type", typeFilter);

      // price filters
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
  }, [whereRaw, typeFilter, minPrice, maxPrice, amenityList.join(","), search]);

  const { typeCounts, amenityCounts } = useMemo(() => {
    const tCounts: Record<string, number> = {};
    const aCounts: Record<string, number> = ALL_AMENITIES.reduce(
      (acc, k) => ((acc[k] = 0), acc),
      {} as Record<string, number>
    );

    for (const r of results) {
      if (r.accommodation_type) {
        const key = r.accommodation_type.toLowerCase();
        tCounts[key] = (tCounts[key] || 0) + 1;
      }
      const flags = (r.amenities || {}) as Record<string, any>;
      for (const k of ALL_AMENITIES) {
        if (flags[k] === true || flags[k] === "true") aCounts[k] += 1;
      }
    }
    return { typeCounts: tCounts, amenityCounts: aCounts };
  }, [results, ALL_AMENITIES]);

  function buildParamsFromUI(base: URLSearchParams) {
    const newParams = new URLSearchParams(base);

    if (uiType) newParams.set("type", uiType);
    else newParams.delete("type");

    if (uiMin) newParams.set("minPrice", uiMin);
    else newParams.delete("minPrice");

    if (uiMax) newParams.set("maxPrice", uiMax);
    else newParams.delete("maxPrice");

    const selectedAmenities = Object.keys(uiAmenities).filter(
      (k) => uiAmenities[k]
    );
    if (selectedAmenities.length) {
      newParams.set("amenities", selectedAmenities.join(","));
    } else {
      newParams.delete("amenities");
    }

    return newParams;
  }

  function applyFilters(pushHistory = false) {
    const newParams = buildParamsFromUI(new URLSearchParams(search));
    navigate(`/search?${newParams.toString()}`, { replace: !pushHistory });
  }

  function clearFilters() {
    setUiType("");
    setUiMin("");
    setUiMax("");
    setUiAmenities({});
    const newParams = new URLSearchParams(search);
    newParams.delete("type");
    newParams.delete("minPrice");
    newParams.delete("maxPrice");
    newParams.delete("amenities");
    navigate(`/search?${newParams.toString()}`, { replace: true });
  }

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      return;
    }
    if (syncingRef.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      applyFilters(false);
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [uiType, uiMin, uiMax, JSON.stringify(uiAmenities)]);

  return (
    <main className="flex flex-col w-full min-h-screen pt-6 bg-gray-50">
      <div className="w-full px-8 mb-2">
        <EnhancedSearch showHero={false} compact />
      </div>

      <div className="flex w-full px-8 gap-5">
        {/* Sidebar Filters */}
        <aside className="hidden md:block md:w-1/5 lg:w-1/6 sticky top-16 h-fit">
          <div className="bg-white rounded-xl shadow">
            <div className="sticky top-16 z-10 bg-white border-b px-3 pt-3 pb-2 flex items-center justify-between rounded-t-xl">
              <h2 className="text-base font-semibold">Filters</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-600 underline"
                >
                  Clear
                </button>
                <button
                  onClick={() => applyFilters(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded px-3 py-1 text-xs"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="p-3">
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

              {/* Amenities (collapsible) */}
              <section className="border-t pt-3 mt-3">
                <button
                  type="button"
                  onClick={() => setAmenitiesOpen((s) => !s)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={amenitiesOpen}
                >
                  <span className="text-sm font-medium">Amenities</span>
                  <span className="flex items-center gap-2">
                    {selectedAmenityCount > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100">
                        {selectedAmenityCount} selected
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        amenitiesOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                    </svg>
                  </span>
                </button>

                {amenitiesOpen && (
                  <div className="mt-3 space-y-3">
                    {/* Popular dropdown */}
                    <details className="group" open>
                      <summary className="flex items-center justify-between cursor-pointer list-none">
                        <span className="text-xs font-medium text-gray-700">
                          Popular
                        </span>
                        <svg
                          className="w-4 h-4 transition-transform group-open:rotate-180"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                        </svg>
                      </summary>
                      <div className="mt-2 flex flex-col gap-1 text-sm">
                        {KNOWN_AMENITIES.map((k) => {
                          const disabled = amenityCounts[k] === 0;
                          return (
                            <label
                              key={`popular-${k}`}
                              className={`flex items-center gap-2 ${
                                disabled ? "opacity-40" : ""
                              }`}
                              title={
                                disabled ? "No results with this amenity" : ""
                              }
                            >
                              <input
                                type="checkbox"
                                checked={!!uiAmenities[k]}
                                disabled={disabled}
                                onChange={(e) =>
                                  setUiAmenities((prev) => ({
                                    ...prev,
                                    [k]: e.target.checked,
                                  }))
                                }
                              />
                              <span className="capitalize">
                                {formatAmenityKey(k)}{" "}
                                {amenityCounts[k]
                                  ? `(${amenityCounts[k]})`
                                  : ""}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </details>

                    {/* More dropdown */}
                    {EXTRA_AMENITIES.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center justify-between cursor-pointer list-none">
                          <span className="text-xs font-medium text-gray-700">
                            More
                          </span>
                          <svg
                            className="w-4 h-4 transition-transform group-open:rotate-180"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                          </svg>
                        </summary>
                        <div className="mt-2 flex flex-col gap-1 text-sm">
                          {EXTRA_AMENITIES.map((k) => {
                            const disabled = amenityCounts[k] === 0;
                            return (
                              <label
                                key={`extra-${k}`}
                                className={`flex items-center gap-2 ${
                                  disabled ? "opacity-40" : ""
                                }`}
                                title={
                                  disabled ? "No results with this amenity" : ""
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={!!uiAmenities[k]}
                                  disabled={disabled}
                                  onChange={(e) =>
                                    setUiAmenities((prev) => ({
                                      ...prev,
                                      [k]: e.target.checked,
                                    }))
                                  }
                                />
                                <span className="capitalize">
                                  {formatAmenityKey(k)}{" "}
                                  {amenityCounts[k]
                                    ? `(${amenityCounts[k]})`
                                    : ""}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </section>
            </div>
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

            {/* Active chips */}
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
                  {formatAmenityKey(a)}
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
