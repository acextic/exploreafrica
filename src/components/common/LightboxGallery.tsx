import React, { useMemo, useState } from "react";

type Props = {
  images: string[];
  hero: string;
};

export default function LightboxGallery({ images, hero }: Props) {
  const all = useMemo(() => {
    const arr = [hero, ...images];
    const seen = new Set<string>();
    return arr.filter((u) => {
      if (!u || seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  }, [images, hero]);

  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  const openAt = (idx: number) => {
    setI(idx);
    setOpen(true);
  };

  const t0 = all[0];
  const t1 = all[1] ?? all[0];
  const t2 = all[2] ?? all[0];
  const t3 = all[3] ?? all[0];

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {all.slice(0, 4).map((src, idx) => (
          <button
            key={src + idx}
            className="relative overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            onClick={() => openAt(idx)}
            aria-label="Open photo"
          >
            <img src={src} alt="" className="w-full h-64 object-cover" />
          </button>
        ))}
        {all.length > 4 && (
          <button
            className="rounded-xl border py-2 text-sm font-medium"
            onClick={() => openAt(0)}
          >
            View all photos ({all.length})
          </button>
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-3 md:grid-rows-3 gap-4">
        <button
          className="relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          onClick={() => openAt(0)}
          aria-label="Open photo"
        >
          <img
            src={t0}
            alt=""
            className="w-full h-[420px] lg:h-[520px] object-cover"
          />
        </button>

        <button
          className="relative overflow-hidden rounded-2xl md:col-span-1 md:row-span-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
          onClick={() => openAt(1)}
          aria-label="Open photo"
        >
          <img src={t1} alt="" className="w-full h-[160px] object-cover" />
        </button>

        <button
          className="relative overflow-hidden rounded-2xl md:col-span-1 md:row-span-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
          onClick={() => openAt(2)}
          aria-label="Open photo"
        >
          <img src={t2} alt="" className="w-full h-[160px] object-cover" />
        </button>

        <button
          className="relative overflow-hidden rounded-2xl md:col-span-1 md:row-span-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
          onClick={() => openAt(3)}
          aria-label="Open photo"
        >
          <img src={t3} alt="" className="w-full h-[160px] object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-md bg-black/40 text-white text-sm font-medium">
              View all photos ({all.length})
            </span>
          </div>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setI((prev) => (prev - 1 + all.length) % all.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl leading-none"
            aria-label="Previous"
          >
            ‹
          </button>

          <img
            src={all[i]}
            alt=""
            className="max-h-[85vh] max-w-[92vw] object-contain rounded-md"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setI((prev) => (prev + 1) % all.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl leading-none"
            aria-label="Next"
          >
            ›
          </button>

          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
