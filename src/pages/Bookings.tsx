import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK = "https://source.unsplash.com/featured/?safari,camp";

type BookingRow = {
  booking_id: number;
  booking_date: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  booking_status: string | null;
  total_amount: number | null;
  nights: number | null;
  confirmation_number: string | null;
  num_of_guests: number | null;
  guest_phone: string | null;
  special_requests: string | null;
  accommodations: {
    accommodation_id: number;
    name: string | null;
    address: string | null;
    contact_info: string | null;
    website_url: string | null;
    price_per_night: number | null;
    accommodation_images?:
      | { url: string | null; image_id: number | null }[]
      | null;
    destinations?: {
      destination_id: number | null;
      name: string | null;
      entry_fee: number | null;
      countries?: { name: string | null } | null;
    } | null;
  } | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dd = new Date(String(d));
  if (Number.isNaN(dd.getTime())) return "—";
  return dd.toLocaleDateString();
}

function statusTone(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (v === "confirmed" || v === "completed")
    return "bg-green-100 text-green-700";
  if (v === "cancelled") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700"; // pending / default
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BookingRow[]>([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!user) {
        setRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
        booking_id,
        booking_date,
        check_in_date,
        check_out_date,
        booking_status,
        total_amount,
        nights,
        confirmation_number,
        num_of_guests,
        guest_phone,
        special_requests,
        accommodations:accommodation_id (
          accommodation_id,
          name,
          address,
          contact_info,
          website_url,
          price_per_night,
          accommodation_images ( url, image_id ),
          destinations:destination_id (
            destination_id,
            name,
            entry_fee,
            countries:country_id ( name )
          )
        )
      `
        )
        .eq("user_id", user.id)
        .order("booking_date", { ascending: false });

      if (!alive) return;

      if (error) {
        setError(error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      const normalize = (x: any): BookingRow => {
        const acc = x?.accommodations ?? null;

        const imgs = Array.isArray(acc?.accommodation_images)
          ? acc.accommodation_images.map((i: any) => ({
              url: i?.url ?? null,
              image_id: i?.image_id ?? null,
            }))
          : [];

        const dest = acc?.destinations ?? null;
        const destCountry = dest?.countries ?? null;

        return {
          booking_id: Number(x.booking_id),
          booking_date: x.booking_date ?? null,
          check_in_date: x.check_in_date ?? null,
          check_out_date: x.check_out_date ?? null,
          booking_status: x.booking_status ?? null,
          total_amount: x.total_amount != null ? Number(x.total_amount) : null,
          nights: x.nights != null ? Number(x.nights) : null,
          confirmation_number: x.confirmation_number ?? null,
          num_of_guests:
            x.num_of_guests != null ? Number(x.num_of_guests) : null,
          guest_phone: x.guest_phone ?? null,
          special_requests: x.special_requests ?? null,
          accommodations: acc
            ? {
                accommodation_id:
                  acc.accommodation_id != null
                    ? Number(acc.accommodation_id)
                    : 0,
                name: acc.name ?? null,
                address: acc.address ?? null,
                contact_info: acc.contact_info ?? null,
                website_url: acc.website_url ?? null,
                price_per_night:
                  acc.price_per_night != null
                    ? Number(acc.price_per_night)
                    : null,
                accommodation_images: imgs,
                destinations: dest
                  ? {
                      destination_id:
                        dest.destination_id != null
                          ? Number(dest.destination_id)
                          : null,
                      name: dest.name ?? null,
                      entry_fee:
                        dest.entry_fee != null ? Number(dest.entry_fee) : null,
                      countries: destCountry
                        ? {
                            name: destCountry.name ?? null,
                          }
                        : null,
                    }
                  : null,
              }
            : null,
        };
      };

      const safeRows: BookingRow[] = Array.isArray(data)
        ? (data as any[]).map(normalize)
        : [];

      setRows(safeRows);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [user]);

  const content = useMemo(() => {
    if (loading) {
      return <div className="rounded-xl bg-white shadow p-6">Loading…</div>;
    }
    if (error) {
      return (
        <div className="rounded-xl bg-white shadow p-6 text-red-600">
          {error}
        </div>
      );
    }
    if (!rows.length) {
      return (
        <div className="rounded-xl bg-white shadow p-8 text-center text-gray-600">
          You don’t have any bookings yet.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((b) => {
          const acc = b.accommodations;
          const hero =
            (acc?.accommodation_images || []).sort(
              (a, z) => (a.image_id ?? 0) - (z.image_id ?? 0)
            )[0]?.url || FALLBACK;

          const destName = acc?.destinations?.name || null;
          const countryName = acc?.destinations?.countries?.name || null;
          const where = [destName, countryName].filter(Boolean).join(", ");

          const nights = b.nights ?? 0;
          const guests = b.num_of_guests ?? null;
          const status = b.booking_status || "pending";
          const parkFee =
            acc?.destinations?.entry_fee != null
              ? Number(acc.destinations.entry_fee)
              : null;

          return (
            <div key={b.booking_id} className="rounded-xl bg-white shadow p-4">
              {/* Header card */}
              <div className="flex items-center gap-3">
                <img
                  src={hero}
                  alt={acc?.name || "Accommodation"}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {acc?.name || "Accommodation"}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {where || acc?.address || "—"}
                  </div>
                </div>
                <span
                  className={`ml-auto text-xs px-2 py-1 rounded-full ${statusTone(
                    status
                  )}`}
                >
                  {status[0]?.toUpperCase() + status.slice(1)}
                </span>
              </div>

              {/* Dates / totals */}
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Check-in</div>
                  <div className="font-medium">{fmtDate(b.check_in_date)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Check-out</div>
                  <div className="font-medium">{fmtDate(b.check_out_date)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Nights</div>
                  <div className="font-medium">{nights || "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Guests</div>
                  <div className="font-medium">{guests ?? "—"}</div>
                </div>
              </div>

              {/* Confirmation & totals */}
              <div className="mt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total amount</span>
                  <span className="font-semibold">
                    {typeof b.total_amount === "number"
                      ? `$${b.total_amount.toFixed(2)}`
                      : "—"}
                  </span>
                </div>
                {parkFee != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Est. park fee</span>
                    <span className="font-medium">${parkFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Confirmation</span>
                  <span className="font-mono text-xs">
                    {b.confirmation_number || "—"}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Booked: {fmtDate(b.booking_date)}
                </div>
              </div>

              {/* Contact & notes */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="font-medium mb-1">Property contact</div>
                  <div className="text-gray-700">
                    {acc?.contact_info ||
                      "Contact details will be shared after confirmation."}
                  </div>
                  {acc?.website_url && (
                    <a
                      href={acc.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-600 underline text-xs mt-1 inline-block"
                    >
                      Visit website
                    </a>
                  )}
                  {acc?.address && (
                    <div className="text-xs text-gray-500 mt-1">
                      {acc.address}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border p-3">
                  <div className="font-medium mb-1">Your notes</div>
                  <div className="text-gray-700">
                    {b.special_requests ? b.special_requests : "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Phone: {b.guest_phone ? b.guest_phone : "—"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [rows, loading, error]);

  return (
    <main className="w-full min-h-screen bg-gray-50 pt-24 px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your bookings</h1>
        {content}
      </div>
    </main>
  );
}
