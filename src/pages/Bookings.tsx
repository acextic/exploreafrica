import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { toPublicUrl, primaryImageUrl } from "../utils/images";

const FALLBACK = "https://source.unsplash.com/featured/?safari,camp";

type ImgRow = { url: string | null; image_id: number | null };

type Accommodations = {
  accommodation_id: number;
  name: string | null;
  address: string | null;
  contact_info: string | null;
  website_url: string | null;
  price_per_night: number | null;
  accommodation_images?: ImgRow[] | null;
  destinations?: {
    destination_id: number | null;
    name: string | null;
    entry_fee: number | null;
    countries?: { name: string | null } | null;
  } | null;
} | null;

type ItineraryRow = {
  itinerary_id: number;
  day_number: number | null;
  activity_description: string | null;
  location: string | null;
};

type Packages = {
  package_id: number;
  package_name: string | null;
  price_per_person: number | null;
  duration_days: number | null;
  tour_companies?: { name: string | null } | null;
  package_images?: ImgRow[] | null;
  itineraries?: ItineraryRow[] | null;
} | null;

type BookingRow = {
  booking_id: number;
  booking_date: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  travel_date: string | null;
  booking_status: string | null;
  total_amount: number | null;
  nights: number | null;
  confirmation_number: string | null;
  num_of_guests: number | null;
  guest_phone: string | null;
  special_requests: string | null;
  accommodations: Accommodations;
  packages: Packages;
};

type PaymentRow = {
  payment_id: number;
  booking_id: number;
  amount_paid: number | null;
  payment_status: string | null;
  payment_method: string | null;
  payment_date: string | null;
  transaction_ref: string | null;
  currency: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dd = new Date(String(d));
  if (Number.isNaN(dd.getTime())) return "—";
  return dd.toLocaleDateString();
}

function fmtMoney(n?: number | null, cur = "USD") {
  if (n == null || isNaN(n as any)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
    }).format(Number(n));
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}

function statusTone(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (v === "confirmed" || v === "completed")
    return "bg-green-100 text-green-700";
  if (v === "cancelled" || v === "canceled") return "bg-red-100 text-red-700";
  if (v === "refunded") return "bg-blue-100 text-blue-700";
  return "bg-yellow-100 text-yellow-700"; // pending / default
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [payments, setPayments] = useState<Map<number, PaymentRow>>(new Map());
  const [openItin, setOpenItin] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!user) {
        setRows([]);
        setPayments(new Map());
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      // pull *both* stays and packages (with itinerary)
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          booking_id,
          booking_date,
          check_in_date,
          check_out_date,
          travel_date,
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
          ),
          packages:package_id (
            package_id,
            package_name,
            price_per_person,
            duration_days,
            tour_companies ( name ),
            package_images ( url, image_id ),
            itineraries ( itinerary_id, day_number, activity_description, location )
          )
        `
        )
        .eq("user_id", user.id)
        .order("booking_date", { ascending: false });

      if (!alive) return;

      if (error) {
        setError(error.message);
        setRows([]);
        setPayments(new Map());
        setLoading(false);
        return;
      }

      const safeRows: BookingRow[] = (data as any[]).map((x) => ({
        booking_id: Number(x.booking_id),
        booking_date: x.booking_date ?? null,
        check_in_date: x.check_in_date ?? null,
        check_out_date: x.check_out_date ?? null,
        travel_date: x.travel_date ?? null,
        booking_status: x.booking_status ?? null,
        total_amount: x.total_amount != null ? Number(x.total_amount) : null,
        nights: x.nights != null ? Number(x.nights) : null,
        confirmation_number: x.confirmation_number ?? null,
        num_of_guests: x.num_of_guests != null ? Number(x.num_of_guests) : null,
        guest_phone: x.guest_phone ?? null,
        special_requests: x.special_requests ?? null,
        accommodations: x.accommodations ?? null,
        packages: x.packages ?? null,
      }));

      setRows(safeRows);

      // read latest payment per booking (will be empty if RLS denies)
      try {
        const ids = safeRows.map((b) => b.booking_id);
        if (ids.length) {
          const { data: payRows } = await supabase
            .from("payments")
            .select(
              "payment_id, booking_id, amount_paid, payment_status, payment_method, payment_date, transaction_ref, currency"
            )
            .in("booking_id", ids)
            .order("payment_date", { ascending: false, nullsFirst: false });

          const latest = new Map<number, PaymentRow>();
          for (const p of payRows || []) {
            const bid = (p as any).booking_id as number;
            if (!latest.has(bid)) latest.set(bid, p as any);
          }
          setPayments(latest);
        } else {
          setPayments(new Map());
        }
      } catch {
        setPayments(new Map());
      }

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
          const isPkg = !!b.packages;
          const acc = b.accommodations;
          const pkg = b.packages;
          const guests = b.num_of_guests ?? 0;

          // hero image for either type
          const hero = isPkg
            ? (() => {
                const pics = (pkg?.package_images || [])
                  .slice()
                  .sort((a, z) => (a.image_id ?? 1e9) - (z.image_id ?? 1e9));
                const url = pics.length
                  ? toPublicUrl(pics[0]?.url ?? null)
                  : null;
                return url || FALLBACK;
              })()
            : primaryImageUrl(acc?.accommodation_images || [], FALLBACK);

          const title = isPkg
            ? pkg?.package_name || "Tour package"
            : acc?.name || "Accommodation";
          const where = isPkg
            ? pkg?.tour_companies?.name || "Operator TBA"
            : [
                acc?.destinations?.name || null,
                acc?.destinations?.countries?.name || null,
              ]
                .filter(Boolean)
                .join(", ") ||
              acc?.address ||
              "—";

          const status = b.booking_status || "pending";
          const nights = b.nights ?? 0;
          const parkFee = isPkg
            ? null
            : acc?.destinations?.entry_fee != null
            ? Number(acc.destinations.entry_fee)
            : null;

          const pay = payments.get(b.booking_id) || null;
          const open = !!openItin[b.booking_id];
          const itin = (pkg?.itineraries || [])
            .slice()
            .sort((a, z) => (a.day_number ?? 0) - (z.day_number ?? 0));
          const preview = itin.slice(0, 3);

          return (
            <div key={b.booking_id} className="rounded-xl bg-white shadow p-4">
              {/* Header card */}
              <div className="flex items-center gap-3">
                <img
                  src={hero}
                  alt={title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{title}</div>
                  <div className="text-xs text-gray-600 truncate">{where}</div>
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
                {isPkg ? (
                  <>
                    <div>
                      <div className="text-gray-500">Travel date</div>
                      <div className="font-medium">
                        {fmtDate(b.travel_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Duration</div>
                      <div className="font-medium">
                        {pkg?.duration_days != null
                          ? `${pkg.duration_days} night(s)`
                          : "—"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-gray-500">Check-in</div>
                      <div className="font-medium">
                        {fmtDate(b.check_in_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Check-out</div>
                      <div className="font-medium">
                        {fmtDate(b.check_out_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Nights</div>
                      <div className="font-medium">{nights || "—"}</div>
                    </div>
                  </>
                )}
                <div>
                  <div className="text-gray-500">Guests</div>
                  <div className="font-medium">{guests || "—"}</div>
                </div>
              </div>

              {/* Confirmation & totals */}
              <div className="mt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total amount</span>
                  <span className="font-semibold">
                    {fmtMoney(b.total_amount, "USD")}
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

              {/* Payment summary */}
              {pay ? (
                <div className="mt-3 rounded-lg border p-3 text-sm">
                  <div className="font-medium mb-1">Payment</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-gray-500">Amount</div>
                      <div className="font-medium">
                        {fmtMoney(pay.amount_paid, pay.currency || "USD")}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Status</div>
                      <div className="font-medium">
                        {pay.payment_status || "initiated"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Method</div>
                      <div className="font-medium">
                        {pay.payment_method || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Date</div>
                      <div className="font-medium">
                        {fmtDate(pay.payment_date)}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-500">Reference</div>
                      <div className="font-mono text-xs break-all">
                        {pay.transaction_ref || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Contact & notes for stays */}
              {!isPkg && (
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
              )}

              {/* Itinerary preview for packages */}
              {isPkg && (
                <div className="mt-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Itinerary</div>
                    {itin.length > 3 && (
                      <button
                        type="button"
                        className="text-xs text-orange-600 underline"
                        onClick={() =>
                          setOpenItin((m) => ({
                            ...m,
                            [b.booking_id]: !m[b.booking_id],
                          }))
                        }
                      >
                        {open ? "Hide details" : "Show full itinerary"}
                      </button>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {(open ? itin : preview).map((i) => (
                      <li
                        key={i.itinerary_id}
                        className="flex gap-2 items-start"
                      >
                        <span className="text-gray-500 w-12 shrink-0">
                          Day {i.day_number ?? "—"}:
                        </span>
                        <span className="flex-1">
                          {i.activity_description || "—"}
                          {i.location ? (
                            <span className="text-gray-500">
                              {" "}
                              — {i.location}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                    {itin.length === 0 && (
                      <li className="text-gray-500">No itinerary details.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [rows, loading, error, payments, openItin]);

  return (
    <main className="w-full min-h-screen bg-gray-50 pt-24 px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your bookings</h1>
        {content}
      </div>
    </main>
  );
}
