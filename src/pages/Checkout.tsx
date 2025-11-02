// src/pages/Checkout.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createBooking,
  computeTotal,
  createPackageBooking,
  recordPayment,
} from "../lib/api/bookings";
import PaymentPlaceholder from "../components/booking/PaymentPlaceholder";
import { supabase } from "../lib/supabaseClient";

function emailToName(email?: string | null) {
  if (!email) return "";
  const local = email.split("@")[0] || "";
  return local.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type StayCtx = {
  accommodation_name: string | null;
  hero_image: string | null;
  destination_name: string | null;
  country_name: string | null;
  park_fee_estimate: number | null;
};

type PackageCtx = {
  package_name: string | null;
  hero_image: string | null;
  operator_name: string | null;
  duration_days: number | null;
  price_per_person: number | null;
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { id } = useParams(); // accommodation id for stays
  const [qs] = useSearchParams();

  // ----- detect mode
  const packageId = Number(qs.get("packageId") || "0");
  const pkgGuests = Number(qs.get("guests") || "1");
  const pkgDate = qs.get("date") || "";
  const mode: "stay" | "package" = packageId > 0 ? "package" : "stay";

  // ----- parsed (stay)
  const parsed = useMemo(() => {
    const check_in_date = qs.get("checkIn") || "";
    const check_out_date = qs.get("checkOut") || "";
    const adults = Number(qs.get("adults") || "1");
    const children = Number(qs.get("children") || "0");
    const rooms = Number(qs.get("rooms") || "1");
    const nightly_price = Number(qs.get("price") || "0");
    const accommodation_id = Number(id || "0");
    return {
      accommodation_id,
      check_in_date,
      check_out_date,
      adults,
      children,
      rooms,
      nightly_price,
    };
  }, [qs, id]);

  // ----- price math
  const money = useMemo(
    () =>
      mode === "stay"
        ? computeTotal(parsed)
        : { nights: 0, guests: pkgGuests, total: 0 },
    [mode, parsed, pkgGuests]
  );
  const TAX_RATE = 0.12;
  const [parkFee, setParkFee] = useState(0);
  const estTaxes = useMemo(
    () => (mode === "stay" ? money.total * TAX_RATE : 0),
    [mode, money.total]
  );
  const grandTotal = useMemo(
    () => (mode === "stay" ? money.total + estTaxes + parkFee : 0),
    [mode, money.total, estTaxes, parkFee]
  );

  // ----- guest/contact
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [paid, setPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- header card context (right side)
  const [stayCtx, setStayCtx] = useState<StayCtx | null>(null);
  const [pkgCtx, setPkgCtx] = useState<PackageCtx | null>(null);

  useEffect(() => {
    let alive = true;

    const quick =
      user?.user_metadata?.full_name || emailToName(user?.email) || "";
    setFullName((prev) => prev || quick);

    (async () => {
      try {
        // profile prefill
        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("first_name,last_name,phone_number")
            .eq("user_id", user.id)
            .maybeSingle();

          if (alive && profile) {
            const name = [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ")
              .trim();
            if (name) setFullName(name);
            if (profile.phone_number) setPhone(String(profile.phone_number));
          }
        }

        if (mode === "stay") {
          if (!parsed.accommodation_id) return;

          // base row
          const { data: acc } = await supabase
            .from("accommodations")
            .select("name, destination_id")
            .eq("accommodation_id", parsed.accommodation_id)
            .maybeSingle();
          if (!alive || !acc) return;

          // hero
          const { data: heroRows } = await supabase
            .from("accommodation_images")
            .select("url, image_id")
            .eq("accommodation_id", parsed.accommodation_id)
            .order("image_id", { ascending: true })
            .limit(1);
          const hero_image =
            (heroRows && heroRows.length ? heroRows[0].url : null) || null;

          // destination/country/park fee
          let destination_name: string | null = null;
          let country_name: string | null = null;
          let park_fee_estimate: number | null = null;

          if (acc.destination_id != null) {
            const { data: dest } = await supabase
              .from("destinations")
              .select("name, country_id, entry_fee")
              .eq("destination_id", acc.destination_id)
              .maybeSingle();

            if (dest) {
              destination_name = dest.name ?? null;
              park_fee_estimate =
                dest.entry_fee != null ? Number(dest.entry_fee) : null;

              if (dest.country_id != null) {
                const { data: cty } = await supabase
                  .from("countries")
                  .select("name")
                  .eq("country_id", dest.country_id)
                  .maybeSingle();
                if (cty) country_name = cty.name ?? null;
              }
            }
          }

          if (!alive) return;
          setStayCtx({
            accommodation_name: acc.name ?? null,
            hero_image,
            destination_name,
            country_name,
            park_fee_estimate,
          });

          setParkFee(Number(park_fee_estimate ?? 0) || 0);
        } else {
          // package header card info
          const { data: pkg } = await supabase
            .from("packages")
            .select(
              `
              package_name, price_per_person, duration_days,
              tour_companies ( name ),
              package_images ( url, image_id )
            `
            )
            .eq("package_id", packageId)
            .maybeSingle();

          if (!alive || !pkg) return;

          const pics = (pkg.package_images || [])
            .slice()
            .sort(
              (a: any, b: any) => (a.image_id ?? 1e9) - (b.image_id ?? 1e9)
            );
          const hero_image = pics.length ? pics[0]?.url ?? null : null;

          // Supabase can return an array for a 1-1 relation; pick first if so.
          const companyRel = (pkg as any).tour_companies;
          const company = Array.isArray(companyRel)
            ? companyRel[0]
            : companyRel;

          setPkgCtx({
            package_name: pkg.package_name ?? null,
            hero_image,
            operator_name: company?.name ?? null,
            duration_days: pkg.duration_days ?? null,
            price_per_person: pkg.price_per_person ?? null,
          });
        }
      } catch {
        // silent – we still allow checkout even if side info failed to load
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, parsed.accommodation_id, mode, packageId]);

  // ----- submission guard
  const canSubmit =
    !!user &&
    !submitting &&
    (mode === "stay"
      ? parsed.accommodation_id > 0 &&
        !!parsed.check_in_date &&
        !!parsed.check_out_date &&
        money.nights > 0 &&
        parsed.nightly_price > 0 &&
        !!fullName.trim() &&
        paid
      : packageId > 0 &&
        !!pkgDate &&
        pkgGuests > 0 &&
        !!fullName.trim() &&
        paid);

  // ----- submit
  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "stay") {
        const booking = await createBooking({
          ...parsed,
          guest_phone: phone || null,
          special_requests: note || null,
        });

        // simulate a successful payment – DB trigger sets amount from booking
        await recordPayment({
          booking_id: booking.booking_id,
          method: "card",
          status: "paid",
          transaction_ref: booking.confirmation_number,
        });
      } else {
        const booking = await createPackageBooking({
          package_id: packageId,
          travel_date: pkgDate,
          guests: pkgGuests,
          guest_phone: phone || null,
          special_requests: note || null,
        });

        await recordPayment({
          booking_id: booking.booking_id,
          method: "card",
          status: "paid",
          transaction_ref: booking.confirmation_number,
        });
      }

      nav("/bookings");
    } catch (e: any) {
      setError(e?.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- UI
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold">Checkout</h1>

      {!user ? (
        <div className="mt-4 rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
          Please sign in to complete your booking.
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: guest/contact + requests */}
        <section className="lg:col-span-2 rounded-xl bg-white shadow p-5">
          <h2 className="text-xl font-semibold">Guest details</h2>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Email</label>
              <input
                value={user?.email || ""}
                readOnly
                className="mt-1 w-full border rounded px-3 py-2 bg-gray-50 text-gray-800"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">
                Phone (optional)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="+1 555 555 5555"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">
                Special requests (optional)
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g., Dietary needs"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={submit}
              disabled={!canSubmit}
              className={
                "rounded px-4 py-2 text-white " +
                (canSubmit
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-gray-400 cursor-not-allowed")
              }
            >
              Confirm booking
            </button>
            <button
              onClick={() => nav(-1)}
              className="rounded px-4 py-2 border"
            >
              Back
            </button>
          </div>

          {error ? (
            <div className="mt-3 text-sm text-red-600">{error}</div>
          ) : null}
        </section>

        {/* RIGHT: property/package card + summary + payment + policies */}
        <aside className="rounded-xl bg-white shadow p-5 space-y-5">
          {/* Card header */}
          {mode === "stay" && stayCtx && (
            <div className="flex items-center gap-3">
              <img
                src={
                  stayCtx.hero_image ||
                  "https://source.unsplash.com/featured/?safari,camp"
                }
                alt={stayCtx.accommodation_name || "Accommodation"}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {stayCtx.accommodation_name || "Accommodation"}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {[stayCtx.destination_name, stayCtx.country_name]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}

          {mode === "package" && pkgCtx && (
            <div className="flex items-center gap-3">
              <img
                src={
                  pkgCtx.hero_image ||
                  "https://source.unsplash.com/featured/?safari,travel"
                }
                alt={pkgCtx.package_name || "Package"}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {pkgCtx.package_name || "Tour package"}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {pkgCtx.operator_name || "Operator"}
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div>
            <h3 className="text-lg font-semibold">Summary</h3>
            {mode === "stay" ? (
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                <div>
                  Check-in: <b>{parsed.check_in_date || "—"}</b>
                </div>
                <div>
                  Check-out: <b>{parsed.check_out_date || "—"}</b>
                </div>
                <div>
                  Guests:{" "}
                  <b>
                    {parsed.adults} adult(s)
                    {parsed.children ? `, ${parsed.children} child` : ""}
                  </b>
                </div>
                <div>
                  Rooms: <b>{parsed.rooms}</b>
                </div>
                <div>
                  Nightly price: <b>${parsed.nightly_price.toFixed(2)}</b>
                </div>
                <div>
                  Nights: <b>{money.nights}</b>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                <div>
                  Travel date: <b>{pkgDate || "—"}</b>
                </div>
                <div>
                  Guests: <b>{pkgGuests}</b>
                </div>
                <div>
                  Price per person:{" "}
                  <b>${(pkgCtx?.price_per_person ?? 0).toFixed(2)}</b>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>
                    $
                    {(
                      (pkgCtx?.price_per_person ?? 0) * Math.max(1, pkgGuests)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Price breakdown (stays only) */}
          {mode === "stay" && (
            <div>
              <h4 className="text-base font-semibold">Price breakdown</h4>
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span>
                    {parsed.rooms} room(s) × {money.nights} night(s) × $
                    {parsed.nightly_price.toFixed(2)}
                  </span>
                  <span>${money.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated taxes ({Math.round(TAX_RATE * 100)}%)</span>
                  <span>${estTaxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated park fees</span>
                  <span>${parkFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Taxes/fees are estimates and may vary by destination or
                  property rules.
                </p>
              </div>
            </div>
          )}

          {/* Payment */}
          <div>
            <h4 className="text-base font-semibold">Payment</h4>
            <PaymentPlaceholder onPaidChange={setPaid} />
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-base font-semibold">Policies</h4>
            <ul className="mt-2 text-xs text-gray-600 list-disc pl-5 space-y-1">
              <li>
                Free cancellation up to 48 hours before start (operator/property
                rules may vary).
              </li>
              <li>Government-issued ID may be required.</li>
              <li>
                All guests must follow local park and wildlife regulations.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
