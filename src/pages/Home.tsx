import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../components/home/Hero";
import EnhancedSearch from "../components/home/EnhancedSearch";
import SafariCard from "../components/SafariCard";
import WhyExplore from "../components/home/WhyExplore";
import ExploreByCategory from "../components/home/ExploreByCategory";
import FinalBanner from "../components/home/FinalBanner";
import { supabase } from "../lib/supabaseClient";
import { whyExploreItems } from "../mock/whyExplore";
import { primaryImageUrl } from "../utils/images";

const fallbackImage = "https://source.unsplash.com/featured/?safari,camp";

type SafariCamp = {
  accommodation_id: number;
  name: string;
  address: string;
  price_per_night: number;
  rating_avg: number | null;
  rating_count: number | null;
  accommodation_images: { image_id: number | null; url: string | null }[];
};

export default function Home() {
  const [popular, setPopular] = useState<SafariCamp[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
          accommodation_images ( image_id, url )
        `
        )
        .order("rating_avg", { ascending: false, nullsFirst: false })
        .order("rating_count", { ascending: false, nullsFirst: false })
        .order("image_id", {
          foreignTable: "accommodation_images",
          ascending: true,
        })
        .limit(3);
      if (!mounted) return;
      setPopular(error ? [] : data || []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Hero />
      <div className="w-full py-10 px-8 space-y-12">
        <EnhancedSearch />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Popular Safari Camps</h2>
            <button
              onClick={() => navigate("/search")}
              className="text-sm text-orange-600 hover:underline"
            >
              View all
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : popular.length === 0 ? (
            <p>No camps available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {popular.map((camp) => (
                <SafariCard
                  key={camp.accommodation_id}
                  name={camp.name}
                  location={camp.address}
                  price={`$${camp.price_per_night}/night`}
                  rating={camp.rating_avg ?? 0}
                  reviews={camp.rating_count ?? 0}
                  imageUrl={primaryImageUrl(
                    camp.accommodation_images,
                    fallbackImage
                  )}
                  onClick={() =>
                    navigate(`/accommodation/${camp.accommodation_id}`)
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Reasons to Explore</h2>
          <WhyExplore items={whyExploreItems} />
        </section>

        <ExploreByCategory />
      </div>
      <FinalBanner />
    </>
  );
}
