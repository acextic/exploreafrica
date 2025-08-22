import React from "react";

type Props = {
  address?: string;
  lat?: number;
  lng?: number;
  label?: string;
  height?: number;
  zoom?: number;
  rounded?: boolean;
};

export default function MapBlock({
  address,
  lat,
  lng,
  label,
  height = 240,
  zoom = 13,
  rounded = true,
}: Props) {
  let src = "";
  if (lat !== undefined && lng !== undefined) {
    const q = `${lat},${lng}${label ? ` (${label})` : ""}`;
    src = `https://www.google.com/maps?q=${encodeURIComponent(
      q
    )}&z=${zoom}&output=embed`;
  } else if (address) {
    const q = label ? `${label}, ${address}` : address;
    src = `https://www.google.com/maps?q=${encodeURIComponent(
      q
    )}&z=${zoom}&output=embed`;
  }

  return (
    <div
      className={`relative w-full ${
        rounded ? "rounded-xl overflow-hidden" : ""
      }`}
      style={{ height }}
    >
      <iframe
        title="Map"
        src={src}
        loading="lazy"
        className="absolute inset-0 w-full h-full"
      />
      {label ? (
        <div className="pointer-events-none absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-md shadow text-sm font-medium text-gray-800">
          {label}
        </div>
      ) : null}
    </div>
  );
}
