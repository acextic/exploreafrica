import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SafariCard from "../components/SafariCard";
import { listPackages, packageHeroImage } from "../lib/api/packages";
import type { PackageListRow } from "../lib/api/packages";

const FALLBACK = "https://source.unsplash.com/featured/?africa,safari";

export default function PackagesPage() {
  const [rows, setRows] = useState<PackageListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listPackages();
        if (alive) setRows(data);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load packages");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 xl:px-8 py-6">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Tour Packages</h1>
      </div>

      {loading && <p className="text-gray-600">Loading packages…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((p) => {
            const imageUrl = packageHeroImage(p, FALLBACK);
            const rating = p.tour_companies?.rating_avg ?? 4.5;
            const reviews = p.tour_companies?.rating_count ?? 0;
            const location = [p.destinations?.name, p.destinations?.country]
              .filter(Boolean)
              .join(", ");
            const price = `From $${Number(
              p.price_per_person
            ).toLocaleString()} per person • ${p.duration_days} days`;

            return (
              <button
                key={p.package_id}
                onClick={() => navigate(`/package/${p.package_id}`)}
                className="text-left"
                aria-label={`Open package ${p.package_name}`}
                title={p.package_name}
              >
                <SafariCard
                  name={p.package_name}
                  rating={Number(rating)}
                  location={location || "—"}
                  imageUrl={imageUrl}
                  price={price}
                  reviews={Number(reviews)}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
