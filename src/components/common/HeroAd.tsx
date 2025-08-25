import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

type AdItem = {
  title: string;
  subtitle?: string;
  image: string;
  href: string;
};

export default function HeroAd({
  items,
  intervalMs = 4500,
}: {
  items: AdItem[];
  intervalMs?: number;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(
      () => setI((n) => (n + 1) % items.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [items, intervalMs]);

  const next = () => setI((n) => (n + 1) % items.length);
  const prev = () => setI((n) => (n - 1 + items.length) % items.length);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow bg-gray-200 h-44 sm:h-56 md:h-64 lg:h-72">
      {items.map((ad, idx) => (
        <Link
          key={idx}
          to={ad.href}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === i ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <img
            src={ad.image}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div className="absolute left-5 right-5 bottom-5 text-white">
            <div className="text-lg sm:text-xl font-semibold">{ad.title}</div>
            {ad.subtitle ? (
              <div className="text-sm sm:text-base opacity-90">
                {ad.subtitle}
              </div>
            ) : null}
          </div>
        </Link>
      ))}

      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow p-1 hover:bg-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow p-1 hover:bg-white"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
