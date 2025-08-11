import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Accommodation = {
  accommodation_id: number;
  name: string;
  address: string;
  price_per_night: number;
  rating_avg: number;
  rating_count: number;
  amenities: string[] | null;
  accommodation_images: {
    url: string;
  }[];
};

const fallbackImage = "https://source.unsplash.com/featured/?safari,camp";

const AccommodationDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
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
          accommodation_images (
            url
          )
        `
        )
        .eq("accommodation_id", id)
        .single();

      if (error) console.error("Error fetching accommodation:", error);
      else setData(data);

      setLoading(false);
    };

    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <p className="text-center mt-10">Loading accommodation details...</p>
    );
  }

  if (!data) {
    return (
      <p className="text-center text-red-500 mt-10">Accommodation not found.</p>
    );
  }

  const images = data.accommodation_images || [];

  return (
    <section className="w-full py-12 px-8 space-y-16">
      {/* Hero Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {images.length > 0 ? (
          images.map((img, index) => (
            <img
              key={index}
              src={`https://fukaqrrfwdglqbbxprdj.supabase.co/storage/v1/object/public/accomodation-images/${img.url}`}
              alt={`Image ${index + 1}`}
              className="w-full h-64 object-cover rounded-xl"
            />
          ))
        ) : (
          <img
            src={fallbackImage}
            alt="Fallback"
            className="w-full h-96 object-cover rounded-xl col-span-full"
          />
        )}
      </div>

      {/* Basic Info */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{data.name}</h1>
          <p className="text-gray-600">{data.address}</p>
          <p className="text-yellow-500 font-medium">
            ⭐ {data.rating_avg ?? "N/A"} ({data.rating_count} reviews)
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-orange-600">
            ${data.price_per_night}/night
          </p>
          <button className="mt-2 bg-orange-500 text-white px-5 py-2 rounded hover:bg-orange-600">
            Book Now
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p className="text-gray-700">
          This stunning accommodation offers a unique blend of luxury and
          adventure in the heart of nature.
        </p>
      </div>

      {/* Amenities */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Amenities</h2>
        <div className="flex flex-wrap gap-2">
          {data.amenities && data.amenities.length > 0 ? (
            data.amenities.map((amenity, idx) => (
              <span
                key={idx}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                {amenity}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-500">No amenities listed.</p>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div>
        <h2 className="text-xl font-semibold mb-2">More Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Overview</h3>
            <p className="text-sm text-gray-600">Coming soon...</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Availability</h3>
            <p className="text-sm text-gray-600">Coming soon...</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Location</h3>
            <p className="text-sm text-gray-600">{data.address}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccommodationDetail;
