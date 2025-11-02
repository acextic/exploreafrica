import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { mapGalleryUrls, primaryImageUrl } from "../utils/images";
import LightboxGallery from "../components/common/LightboxGallery";
import StickyBookingPanel from "../components/booking/StickyBookingPanel";
import SimilarStays from "../components/booking/SimilarStays";
import MapBlock from "../components/common/MapBlock";
import RoomTypePanel from "../components/booking/RoomTypesPanel";
import Breadcrumbs from "../components/common/Breadcrumbs";
import type { RoomType } from "../components/booking/RoomTypesPanel";
import { formatAmenityKey, normalizeAmenities } from "../utils/amenities";
import AuthModal from "../components/auth/AuthModal";

type Row = {
  accommodation_id: number;
  name: string;
  address: string;
  price_per_night: number;
  rating_avg: number | null;
  rating_count: number | null;
  amenities: unknown | null;
  latitude: number | null;
  longitude: number | null;
  max_capacity: number | null;
  accommodation_type: string | null;
  accommodation_images: { image_id: number | null; url: string | null }[];
  destinations?: {
    destination_id: number;
    name: string;
    countries?: { country_id: number; name: string } | null;
  } | null;
};

const FALLBACK = "https://source.unsplash.com/featured/?safari,camp";

function isValidISO(d?: string) {
  return !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
}
function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function AccommodationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { user } = useAuth();

  const [data, setData] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<Row[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [adults, setAdults] = useState<number>(
    Math.max(1, parseInt(params.get("adults") || "2", 10))
  );
  const [children, setChildren] = useState<number>(
    Math.max(0, parseInt(params.get("children") || "0", 10))
  );
  const [rooms, setRooms] = useState<number>(
    Math.max(1, parseInt(params.get("rooms") || "1", 10))
  );

  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!authOpen || !user || !data) return;
    const qs = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
      price: String(data.price_per_night ?? 0),
    }).toString();
    navigate(`/checkout/${id}?${qs}`);
    setAuthOpen(false);
  }, [
    authOpen,
    user,
    data,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    id,
    navigate,
  ]);

  useEffect(() => {
    const min = todayISO();
    let start = params.get("startDate") || "";
    let end = params.get("endDate") || "";

    if (!(isValidISO(start) && start >= min)) start = "";
    if (!(isValidISO(end) && end > (start || min))) end = "";
    if (start && !end) end = addDaysISO(start, 1);

    setCheckIn(start);
    setCheckOut(end);
  }, [params]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("accommodations")
        .select(
          `
          accommodation_id,
          name,
          address,
          price_per_night,
          rating_avg,
          rating_count,
          amenities,
          latitude,
          longitude,
          max_capacity,
          accommodation_type,
          accommodation_images ( image_id, url ),
          destinations:destination_id (
            destination_id,
            name,
            countries:country_id (
              country_id,
              name
            )
          )
        `
        )
        .eq("accommodation_id", id)
        .order("image_id", {
          foreignTable: "accommodation_images",
          ascending: true,
        })
        .maybeSingle();

      if (!mounted) return;
      if (error || !data) {
        setData(null);
      } else {
        const rel = (data as any).destinations;
        const normalized = {
          ...(data as any),
          destinations: Array.isArray(rel) ? rel[0] ?? null : rel ?? null,
        } as Row;

        setData(normalized);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!data) return;
    let mounted = true;
    setLoadingSimilar(true);

    const token =
      data.address
        ?.split(",")
        .map((s) => s.trim())
        .slice(-1)[0] ?? "";

    (async () => {
      let q = supabase
        .from("accommodations")
        .select(
          `
          accommodation_id,
          name,
          address,
          price_per_night,
          rating_avg,
          rating_count,
          latitude,
          longitude,
          accommodation_type,
          accommodation_images ( image_id, url )
        `
        )
        .neq("accommodation_id", data.accommodation_id)
        .limit(6)
        .order("rating_avg", { ascending: false, nullsFirst: false });

      if (token) q = q.ilike("address", `%${token}%`);
      if (data.accommodation_type)
        q = q.eq("accommodation_type", data.accommodation_type);

      const { data: rows } = await q;
      if (!mounted) return;
      setSimilar((rows as Row[]) || []);
      setLoadingSimilar(false);
    })();

    return () => {
      mounted = false;
    };
  }, [data]);

  const gallery = useMemo(
    () => mapGalleryUrls(data?.accommodation_images || [], FALLBACK),
    [data]
  );
  const hero = useMemo(
    () => primaryImageUrl(data?.accommodation_images || [], FALLBACK),
    [data]
  );
  const amenityKeys = useMemo(
    () => normalizeAmenities(data?.amenities),
    [data]
  );

  const mockRooms: RoomType[] = useMemo(() => {
    if (!data) return [];
    const base = data.price_per_night || 0;
    return [
      {
        id: "std",
        name: "Standard Tent",
        sleeps: 2,
        bed_type: "Queen",
        price_override: Math.round(base * 1.0),
        image_url: hero,
      },
      {
        id: "dlx",
        name: "Deluxe Tent",
        sleeps: 3,
        bed_type: "King",
        price_override: Math.round(base * 1.25),
        image_url:
          gallery[1] ||
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
      },
      {
        id: "fam",
        name: "Family Suite",
        sleeps: 4,
        bed_type: "2× Queen",
        price_override: Math.round(base * 1.5),
        image_url:
          gallery[2] ||
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
      },
    ];
  }, [data, hero, gallery]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const a = new Date(checkIn).getTime();
    const b = new Date(checkOut).getTime();
    const d = Math.round((b - a) / 86400000);
    return Math.max(0, d);
  }, [checkIn, checkOut]);

  const total = useMemo(() => {
    if (!data) return 0;
    const pn = data.price_per_night || 0;
    return Math.max(0, nights * pn * Math.max(1, rooms));
  }, [nights, rooms, data]);

  if (loading) return <p className="text-center mt-10">Loading…</p>;
  if (!data)
    return <p className="text-center mt-10 text-red-500">Not found.</p>;

  const address = data.address || "";
  const rating = data.rating_avg ?? 0;
  const reviews = data.rating_count ?? 0;

  const lat = data.latitude != null ? Number(data.latitude) : undefined;
  const lng = data.longitude != null ? Number(data.longitude) : undefined;

  const countryName = data.destinations?.countries?.name || null;
  const destName = data.destinations?.name || null;

  return (
    <section className="w-full pt-0 pb-8 px-8 space-y-8">
      <LightboxGallery images={gallery.length ? gallery : [hero]} hero={hero} />

      <div className="space-y-1">
        <Breadcrumbs
          items={[
            ...(countryName
              ? [
                  {
                    label: countryName,
                    to: `/search?country=${encodeURIComponent(countryName)}`,
                  },
                ]
              : []),
            ...(destName
              ? [
                  {
                    label: destName,
                    to: `/search?destination=${encodeURIComponent(destName)}`,
                  },
                ]
              : []),
            { label: data.name },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
            {data.accommodation_type ? (
              <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {data.accommodation_type}
              </span>
            ) : null}
          </div>
          <p className="text-yellow-600 font-medium mt-2 sm:mt-0">
            ⭐ {rating}{" "}
            <span className="text-gray-500">({reviews} reviews)</span>
          </p>
        </div>
        <p className="text-gray-600">{address}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold mb-2">Overview</h2>
            <p className="text-gray-700">
              Nestled in the heart of Africa’s wilderness, {data.name} blends
              comfort and adventure. Enjoy guided game drives, stargazing
              nights, and cuisine inspired by local flavors.
            </p>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold mb-2">Amenities</h2>
            {normalizeAmenities(data?.amenities).length ? (
              <div className="flex flex-wrap gap-2">
                {normalizeAmenities(data?.amenities).map((k) => (
                  <span
                    key={k}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {formatAmenityKey(k)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No amenities listed.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold mb-3">Location</h2>
            <MapBlock
              lat={lat}
              lng={lng}
              address={address}
              label={data.name}
              height={256}
            />
          </div>

          <SimilarStays
            loading={loadingSimilar}
            items={similar.map((s) => ({
              id: s.accommodation_id,
              name: s.name,
              address: s.address,
              price: s.price_per_night,
              rating: s.rating_avg ?? 0,
              reviews: s.rating_count ?? 0,
              image: primaryImageUrl(s.accommodation_images, FALLBACK),
              onClick: () => navigate(`/accommodation/${s.accommodation_id}`),
            }))}
          />

          {/* View more similar stays CTA */}
          {similar.length > 0 && (
            <div className="mt-2">
              <button
                className="text-sm text-orange-600 underline"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("similarTo", String(data.accommodation_id));

                  if (countryName) params.set("country", countryName);
                  if (destName) params.set("destination", destName);
                  navigate(`/search?${params.toString()}`);
                }}
              >
                View more similar stays
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
          <div>
            <StickyBookingPanel
              mode="sticky"
              pricePerNight={data.price_per_night}
              checkIn={checkIn}
              checkOut={checkOut}
              adults={adults}
              children={children}
              rooms={rooms}
              maxCapacity={data.max_capacity ?? undefined}
              nights={nights}
              total={isFinite(total) ? total : 0}
              onChangeCheckIn={(v) => {
                const min = todayISO();
                if (!isValidISO(v) || v < min) return;
                setCheckIn(v);
                if (checkOut && checkOut <= v) setCheckOut(addDaysISO(v, 1));
              }}
              onChangeCheckOut={(v) => {
                if (!isValidISO(v)) return;
                if (checkIn && v <= checkIn) return;
                setCheckOut(v);
              }}
              onChangeAdults={(n) => setAdults(Math.max(1, n))}
              onChangeChildren={(n) => setChildren(Math.max(0, n))}
              onChangeRooms={(n) => setRooms(Math.max(1, n))}
              onBook={() => {
                if (!data) return;

                if (!user) {
                  setAuthOpen(true);
                  return;
                }

                // ✅ guard here too, just in case
                const hasDates =
                  !!checkIn &&
                  !!checkOut &&
                  /^\d{4}-\d{2}-\d{2}$/.test(checkIn) &&
                  /^\d{4}-\d{2}-\d{2}$/.test(checkOut);
                const validRange =
                  hasDates && new Date(checkOut) > new Date(checkIn);
                const validTotals =
                  rooms > 0 &&
                  adults + children > 0 &&
                  (data.price_per_night ?? 0) > 0;

                if (!hasDates || !validRange || !validTotals) {
                  // Optional: show a toast or scroll to date pickers
                  return;
                }

                const qs = new URLSearchParams({
                  checkIn,
                  checkOut,
                  adults: String(adults),
                  children: String(children),
                  rooms: String(rooms),
                  price: String(data.price_per_night ?? 0),
                }).toString();
                navigate(`/checkout/${id}?${qs}`);
              }}
            />

            {/* Small link below, only visible when logged out */}
            {!user && (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="mt-1 text-xs text-orange-600 underline"
              >
                Sign in to book
              </button>
            )}
          </div>

          <RoomTypePanel
            rooms={(() => {
              const base = data.price_per_night || 0;
              const gallery = mapGalleryUrls(
                data.accommodation_images || [],
                FALLBACK
              );
              const hero = primaryImageUrl(
                data.accommodation_images || [],
                FALLBACK
              );
              return [
                {
                  id: "std",
                  name: "Standard Tent",
                  sleeps: 2,
                  bed_type: "Queen",
                  price_override: Math.round(base * 1.0),
                  image_url: hero,
                },
                {
                  id: "dlx",
                  name: "Deluxe Tent",
                  sleeps: 3,
                  bed_type: "King",
                  price_override: Math.round(base * 1.25),
                  image_url:
                    gallery[1] ||
                    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
                },
                {
                  id: "fam",
                  name: "Family Suite",
                  sleeps: 4,
                  bed_type: "2× Queen",
                  price_override: Math.round(base * 1.5),
                  image_url:
                    gallery[2] ||
                    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
                },
              ] as RoomType[];
            })()}
            basePrice={data.price_per_night}
            onSelect={(roomId) => {
              console.log("selected room", roomId);
            }}
          />
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
}
