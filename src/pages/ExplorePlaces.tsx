import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExploreByCategory from "../components/home/ExploreByCategory";
import DestinationCard from "../components/destinations/DestinationCard";
import HorizontalScroller from "../components/common/HorizontalScroller";
import CountryCollage from "../components/destinations/CountryCollage";
import FadeInOnView from "../components/common/FadeInOnView";
import HeroAd from "../components/common/HeroAd";
import { supabase } from "../lib/supabaseClient";

type CountryRow = {
  country_id: number;
  name: string;
  image_url: string | null;
};

type DestinationRow = {
  destination_id: number;
  name: string;
  country_id: number;
  country: string; // still present in table
  description: string | null;
  image_url: string | null;
  active: boolean | null;
};

const fallbackFor = (key: string) =>
  `https://source.unsplash.com/1600x900/?${encodeURIComponent(
    key
  )},africa,travel`;

function clip(s?: string | null, n = 90) {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl overflow-hidden bg-white shadow">
      <div className="h-40 w-full bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function ExplorePlaces() {
  const navigate = useNavigate();

  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setErr(null);
      setLoading(true);

      const [{ data: cData, error: cErr }, { data: dData, error: dErr }] =
        await Promise.all([
          supabase
            .from("countries")
            .select("country_id,name,image_url")
            .order("name", { ascending: true }),
          supabase
            .from("destinations")
            .select(
              "destination_id,name,country_id,country,description,image_url,active"
            )
            .or("active.is.null,active.eq.true")
            .order("country_id", { ascending: true })
            .order("name", { ascending: true }),
        ]);

      if (!mounted) return;

      if (cErr || dErr) {
        setErr(cErr?.message || dErr?.message || "Failed to load data");
        setCountries([]);
        setDestinations([]);
      } else {
        setCountries((cData as CountryRow[]) || []);
        setDestinations((dData as DestinationRow[]) || []);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const destsByCountryId = useMemo(() => {
    const m = new Map<number, DestinationRow[]>();
    for (const d of destinations) {
      const arr = m.get(d.country_id) || [];
      arr.push(d);
      m.set(d.country_id, arr);
    }
    return m;
  }, [destinations]);

  const trending = useMemo(() => {
    const enriched = countries.map((c) => {
      const items = destsByCountryId.get(c.country_id) || [];
      const hero =
        c.image_url ||
        items.find((x) => x.image_url)?.image_url ||
        fallbackFor(c.name);
      return {
        country_id: c.country_id,
        country: c.name,
        count: items.length,
        image: hero,
      };
    });
    enriched.sort((a, b) => b.count - a.count);
    return enriched.slice(0, 6);
  }, [countries, destsByCountryId]);

  const ads = [
    {
      title: "Plan your Serengeti trip",
      subtitle: "Save up to 20% this season",
      image: fallbackFor("Serengeti savanna"),
      href: "/search?where=Serengeti",
    },
    {
      title: "Masai Mara escapes",
      subtitle: "Handpicked safari lodges",
      image: fallbackFor("Masai Mara Kenya"),
      href: "/search?where=Masai%20Mara",
    },
  ];

  return (
    <main className="w-full pt-8 pb-8 px-8 space-y-8">
      <div className="w-full space-y-12">
        <FadeInOnView>
          <HeroAd items={ads} />
        </FadeInOnView>

        <section className="space-y-2">
          <h1 className="text-2xl font-bold">Explore places</h1>
          <p className="text-sm text-gray-600">
            Find destinations and camps across Africa.
          </p>
        </section>

        <FadeInOnView>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Browse by category</h2>
            <ExploreByCategory />
          </section>
        </FadeInOnView>

        <FadeInOnView>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Trending countries</h2>
              <button
                className="text-sm text-orange-600 underline"
                onClick={() => navigate("/search")}
              >
                View all stays
              </button>
            </div>

            {err ? (
              <div className="text-red-600">{err}</div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse h-40 sm:h-48 bg-gray-200 rounded-2xl"
                  />
                ))}
              </div>
            ) : trending.length === 0 ? (
              <p>No destinations yet.</p>
            ) : (
              <CountryCollage
                items={trending.map((c) => ({
                  country: c.country,
                  count: c.count,
                  image: c.image,
                  onClick: () =>
                    navigate(
                      `/search?country=${encodeURIComponent(c.country)}`
                    ),
                }))}
              />
            )}
          </section>
        </FadeInOnView>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Destinations by country</h2>
            <button
              className="text-sm text-orange-600 underline"
              onClick={() => navigate("/search")}
            >
              View all stays
            </button>
          </div>

          {err ? (
            <div className="text-red-600">{err}</div>
          ) : loading ? (
            <div className="space-y-8">
              {Array.from({ length: 2 }).map((_, row) => (
                <div key={row} className="space-y-3">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            countries.map((c) => {
              const items = (destsByCountryId.get(c.country_id) || []).slice(
                0,
                10
              );
              if (items.length === 0) return null;
              const hasMore =
                (destsByCountryId.get(c.country_id)?.length || 0) > 10;

              return (
                <FadeInOnView key={c.country_id}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{c.name}</h3>
                      <button
                        className="text-sm text-orange-600 underline"
                        onClick={() =>
                          navigate(
                            `/search?country=${encodeURIComponent(c.name)}`
                          )
                        }
                      >
                        View stays in {c.name}
                      </button>
                    </div>

                    <HorizontalScroller>
                      {items.map((d) => (
                        <div
                          key={d.destination_id}
                          className="shrink-0 basis-full sm:basis-1/2 md:basis-1/4 pr-4"
                        >
                          <DestinationCard
                            title={d.name}
                            subtitle={clip(d.description)}
                            imageUrl={
                              d.image_url || fallbackFor(`${c.name} ${d.name}`)
                            }
                            onClick={() =>
                              navigate(
                                `/search?country=${encodeURIComponent(
                                  c.name
                                )}&destination=${encodeURIComponent(d.name)}`
                              )
                            }
                          />
                        </div>
                      ))}
                    </HorizontalScroller>

                    {hasMore && (
                      <div>
                        <button
                          className="text-sm text-orange-600 underline"
                          onClick={() =>
                            navigate(
                              `/search?country=${encodeURIComponent(c.name)}`
                            )
                          }
                        >
                          View all in {c.name}
                        </button>
                      </div>
                    )}
                  </div>
                </FadeInOnView>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
