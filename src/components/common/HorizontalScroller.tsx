import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  children: ReactNode;
  itemWidth?: number;
  auto?: boolean;
  className?: string;
  after?: ReactNode;
};

export default function HorizontalScroller({
  children,
  itemWidth = 320,
  auto = true,
  className,
  after,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);
  const [hover, setHover] = useState(false);

  const sync = () => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanL(scrollLeft > 0);
    setCanR(scrollLeft + clientWidth < scrollWidth - 1);
  };

  const by = (delta: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    const on = () => sync();
    el.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      el.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  useEffect(() => {
    if (!auto) return;
    let id: any;
    const tick = () => {
      const el = ref.current;
      if (!el || hover) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;
      el.scrollTo({
        left: atEnd ? 0 : scrollLeft + itemWidth,
        behavior: "smooth",
      });
    };
    id = setInterval(tick, 3500);
    return () => clearInterval(id);
  }, [hover, auto, itemWidth]);

  return (
    <div
      className={"relative " + (className || "")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        onClick={() => by(-itemWidth)}
        aria-label="Scroll left"
        disabled={!canL}
        className={
          "absolute -left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow p-1 transition opacity-90 hover:opacity-100 " +
          (canL ? "" : "opacity-40 cursor-not-allowed")
        }
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pr-2 pl-8 md:pl-0"
      >
        {children}
        {after}
      </div>

      <button
        onClick={() => by(itemWidth)}
        aria-label="Scroll right"
        disabled={!canR}
        className={
          "absolute -right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow p-1 transition opacity-90 hover:opacity-100 " +
          (canR ? "" : "opacity-40 cursor-not-allowed")
        }
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
