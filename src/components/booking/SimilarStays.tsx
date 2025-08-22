// src/components/booking/SimilarStays.tsx
import React from "react";

type Item = {
  id: number | string;
  name: string;
  address: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  onClick?: () => void;
};

export default function SimilarStays({
  loading,
  items,
  title = "Similar stays",
}: {
  loading?: boolean;
  items: Item[];
  title?: string;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl overflow-hidden bg-white border"
            >
              <div className="h-36 w-full bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items?.length) return null;

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={it.onClick}
            onMouseEnter={() => {
              const img = new Image();
              img.src = it.image;
            }}
            className="text-left bg-white rounded-2xl overflow-hidden border hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <img
              src={it.image}
              alt={it.name}
              className="w-full h-40 object-cover"
              loading="lazy"
            />
            <div className="p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 line-clamp-1">
                  {it.name}
                </h3>
                <div className="text-sm text-orange-600 font-semibold whitespace-nowrap ml-2">
                  ${it.price}/night
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-1">{it.address}</p>
              <div className="text-sm text-yellow-600 mt-1">
                ⭐ {Number.isFinite(it.rating) ? it.rating.toFixed(1) : "—"}
                <span className="text-gray-500"> ({it.reviews} reviews)</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
