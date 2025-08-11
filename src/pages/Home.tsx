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

const fallbackImage = "https://source.unsplash.com/featured/?safari,camp";

type SafariCamp = {
  accommodation_id: number;
  name: string;
  address: string;
  price_per_night: number;
  rating_avg: number;
  rating_count: number;
  accommodation_images: {
    url: string;
  }[];
};

const Home = () => {
  const [safariCamps, setSafariCamps] = useState<SafariCamp[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCamps = async () => {
      const { data, error } = await supabase.from("accommodations").select(`
          accommodation_id,
          name,
          address,
          price_per_night,
          rating_avg,
          rating_count,
          accommodation_images (
            url
          )
        `);

      if (error) {
        console.error("Supabase fetch error:", error.message);
      } else {
        setSafariCamps(data || []);
      }

      setLoading(false);
    };

    fetchCamps();
  }, []);

  return (
    <>
      <Hero />
      <div className="w-full py-10 px-8 space-y-12">
        <EnhancedSearch />
        <section>
          <h2 className="text-2xl font-bold mb-4">Popular Safari Camps</h2>
          {loading ? (
            <p>Loading...</p>
          ) : safariCamps.length === 0 ? (
            <p>No camps available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {safariCamps.map((camp) => (
                <SafariCard
                  key={camp.accommodation_id}
                  name={camp.name}
                  location={camp.address}
                  price={`$${camp.price_per_night}/night`}
                  rating={camp.rating_avg}
                  reviews={camp.rating_count}
                  imageUrl={
                    camp.accommodation_images?.[0]?.url || fallbackImage
                  }
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
};

export default Home;
