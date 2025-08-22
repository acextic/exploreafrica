// src/components/booking/RoomTypesPanel.tsx
import React from "react";

export type RoomType = {
  id: string | number;
  name: string;
  sleeps: number;
  bed_type: string;
  price_override: number;
  image_url: string;
};

export default function RoomTypesPanel({
  rooms,
  basePrice,
  onSelect,
}: {
  rooms: RoomType[];
  basePrice: number;
  onSelect?: (id: string | number) => void;
}) {
  if (!rooms?.length) return null;

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-xl font-semibold mb-4">Available room types</h2>
      <div className="space-y-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex flex-col sm:flex-row border rounded-xl overflow-hidden hover:shadow-md transition"
          >
            <img
              src={room.image_url}
              alt={room.name}
              className="w-full sm:w-40 h-40 object-cover"
              loading="lazy"
            />
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{room.name}</h3>
                <p className="text-sm text-gray-600">
                  Sleeps {room.sleeps} · {room.bed_type}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-orange-600 font-semibold">
                  ${room.price_override}/night
                </div>
                {onSelect && (
                  <button
                    onClick={() => onSelect(room.id)}
                    className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-sm"
                  >
                    Select
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
