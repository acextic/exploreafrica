import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPackageById, packageHeroImage } from "../lib/api/packages";
import type { PackageDetail as PackageDetailType } from "../lib/api/packages";
import { toPublicUrl } from "../utils/images";
import PackageBookingPanel from "../components/booking/PackageBookingPanel";

const FALLBACK = "https://source.unsplash.com/featured/?africa,wildlife";

export default function PackageDetailPage() {
  const { id } = useParams();
  const pkgId = Number(id);
  const [row, setRow] = useState<PackageDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchPackageById(pkgId);
        if (alive) setRow(data);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load package");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pkgId]);

  if (loading)
    return (
      <div className="container mx-auto px-4 md:px-6 xl:px-8 py-6">
        Loading…
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto px-4 md:px-6 xl:px-8 py-6 text-red-600">
        {error}
      </div>
    );
  if (!row)
    return (
      <div className="container mx-auto px-4 md:px-6 xl:px-8 py-6">
        Not found.
      </div>
    );

  const hero = packageHeroImage(row, FALLBACK);
  const where = [row.destinations?.name, row.destinations?.country]
    .filter(Boolean)
    .join(", ");
  const companyName = row.tour_companies?.name || "Partner Tour Company";

  return (
    <div className="container mx-auto px-4 md:px-6 xl:px-8 py-6">
      {/* Hero */}
      <div className="relative w-full h-56 md:h-80 rounded-2xl overflow-hidden shadow">
        <img
          src={hero}
          alt={row.package_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">{row.package_name}</h1>
          <p className="text-sm opacity-90">{where}</p>
        </div>
      </div>

      {/* Main */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-2">Overview</h2>
            {!!row.highlights && (
              <p className="text-gray-700 whitespace-pre-wrap mb-4">
                {row.highlights}
              </p>
            )}
            <ul className="text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <li>
                <strong>Duration:</strong> {row.duration_days} days
              </li>
              <li>
                <strong>From:</strong> $
                {Number(row.price_per_person).toLocaleString()} per person
              </li>
              <li>
                <strong>Operator:</strong> {companyName}
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 md:p-6 mt-6">
            <h3 className="text-lg font-semibold mb-3">Itinerary</h3>
            {!row.itineraries?.length && (
              <p className="text-gray-600">Itinerary will be provided.</p>
            )}
            <ol className="space-y-3">
              {row.itineraries
                ?.slice()
                .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
                .map((d) => (
                  <li key={d.itinerary_id} className="border rounded-xl p-3">
                    <div className="font-medium">Day {d.day_number ?? "—"}</div>
                    {d.location && (
                      <div className="text-sm text-gray-600">{d.location}</div>
                    )}
                    {d.activity_description && (
                      <p className="text-sm mt-1">{d.activity_description}</p>
                    )}
                  </li>
                ))}
            </ol>
          </div>
        </div>

        {/* Booking sidebar — reuses StickyBookingPanel via wrapper */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20">
            <PackageBookingPanel
              pricePerPerson={Number(row.price_per_person) || 0}
              durationDays={Number(row.duration_days) || 0}
            />
          </div>

          {/* Gallery */}
          <div className="bg-white rounded-2xl shadow p-4 md:p-6 mt-6">
            <h4 className="font-semibold mb-2">Photos</h4>
            <div className="grid grid-cols-3 gap-2">
              {(row.package_images || []).slice(0, 6).map((im, i) => {
                const u = toPublicUrl(im?.url || null) || FALLBACK;
                return (
                  <img
                    key={i}
                    src={u}
                    alt=""
                    className="w-full h-24 object-cover rounded-lg"
                  />
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
