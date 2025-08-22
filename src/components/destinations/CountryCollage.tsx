import type { MouseEvent } from "react";

type CountryItem = {
  country: string;
  count: number;
  image: string | null;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

function Tile({
  title,
  subtitle,
  image,
  className,
  onClick,
}: {
  title: string;
  subtitle?: string;
  image?: string | null;
  className?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const src =
    image ||
    "https://images.unsplash.com/photo-1544989164-31dc3c645987?q=80&w=1200&auto=format&fit=crop";
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 ${className}`}
    >
      <img
        src={src}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="text-white font-semibold text-lg drop-shadow">
          {title}
        </div>
        {subtitle ? (
          <div className="text-white/90 text-xs drop-shadow">{subtitle}</div>
        ) : null}
      </div>
    </button>
  );
}

export default function CountryCollage({ items }: { items: CountryItem[] }) {
  const top = items.slice(0, 6);
  const a = top[0];
  const b = top[1];
  const c = top[2];
  const d = top[3];
  const e = top[4];
  const f = top[5];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 auto-rows-[140px] sm:auto-rows-[160px]">
      {a && (
        <Tile
          title={a.country}
          subtitle={`${a.count} destinations`}
          image={a.image}
          onClick={a.onClick}
          className="sm:col-span-3 sm:row-span-2 h-[260px] sm:h-auto"
        />
      )}
      {b && (
        <Tile
          title={b.country}
          subtitle={`${b.count} destinations`}
          image={b.image}
          onClick={b.onClick}
          className="sm:col-span-3 sm:row-span-2 h-[260px] sm:h-auto"
        />
      )}
      {c && (
        <Tile
          title={c.country}
          subtitle={`${c.count} destinations`}
          image={c.image}
          onClick={c.onClick}
          className="sm:col-span-2 sm:row-span-1"
        />
      )}
      {d && (
        <Tile
          title={d.country}
          subtitle={`${d.count} destinations`}
          image={d.image}
          onClick={d.onClick}
          className="sm:col-span-2 sm:row-span-1"
        />
      )}
      {e && (
        <Tile
          title={e.country}
          subtitle={`${e.count} destinations`}
          image={e.image}
          onClick={e.onClick}
          className="sm:col-span-2 sm:row-span-1"
        />
      )}
      {f && (
        <Tile
          title={f.country}
          subtitle={`${f.count} destinations`}
          image={f.image}
          onClick={f.onClick}
          className="sm:col-span-2 sm:row-span-1"
        />
      )}
    </div>
  );
}
