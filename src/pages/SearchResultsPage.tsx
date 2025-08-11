import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SafariCard from "../components/SafariCard";
import EnhancedSearch from "../components/home/EnhancedSearch";

const fallbackImage = "https://source.unsplash.com/featured/?safari,camp";

const SearchResultsPage = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const location = params.get("location") || "";
  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";
  const adults = parseInt(params.get("adults") || "1");
  const children = parseInt(params.get("children") || "0");
  const rooms = parseInt(params.get("rooms") || "1");

  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
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
          accommodation_images ( url )
        `
        )
        .ilike("address", `%${decodeURIComponent(location).trim()}%`);

      if (error) {
        console.error("Fetch error:", error.message);
        setError(true);
      } else {
        setResults(data || []);
      }
    };

    fetchResults();
  }, [location]);

  return (
    <main className="flex flex-col w-full min-h-screen pt-6 bg-gray-50">
      <div className="w-full px-8 mb-2">
        <EnhancedSearch showHero={false} compact />
      </div>
      <div className="flex w-full px-8 gap-5">
        <aside className="hidden md:block md:w-1/5 lg:w-1/6 sticky top-16 h-fit">
          <div className="bg-white rounded-xl shadow p-3">
            <h2 className="text-base font-semibold mb-3">Filters</h2>
            <label className="block mb-2 text-sm font-medium">
              Price Range
            </label>
            <input type="range" min="50" max="1000" className="w-full mb-3" />
            <label className="block mb-2 text-sm font-medium">Amenities</label>
            <div className="flex flex-col gap-1 mb-3 text-sm">
              <label>
                <input type="checkbox" className="mr-2" />
                Wi-Fi
              </label>
              <label>
                <input type="checkbox" className="mr-2" />
                Pool
              </label>
              <label>
                <input type="checkbox" className="mr-2" />
                Breakfast
              </label>
            </div>
            <label className="block mb-2 text-sm font-medium">Category</label>
            <select className="w-full border rounded p-2 text-sm">
              <option>All</option>
              <option>Lodge</option>
              <option>Camp</option>
              <option>Hotel</option>
            </select>
          </div>
        </aside>

        {/* Main Results */}
        <section className="flex-1">
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <h1 className="text-xl font-bold mb-1">Search Results</h1>
            <p className="text-gray-700 text-sm">
              <strong>Location:</strong> {location} · <strong>Dates:</strong>{" "}
              {startDate}–{endDate} · <strong>Occupancy:</strong> {adults}{" "}
              adults, {children} children, {rooms} room(s)
            </p>
          </div>

          {error ? (
            <p className="text-center text-red-500 font-semibold">
              Something went wrong while fetching data.
            </p>
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
                    rating={acc.rating_avg}
                    reviews={acc.rating_count}
                    imageUrl={
                      acc.accommodation_images?.[0]?.url || fallbackImage
                    }
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
};

export default SearchResultsPage;
