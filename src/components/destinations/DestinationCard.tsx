import { useState } from "react";
import type { MouseEvent } from "react";
import { motion } from "framer-motion";

type Props = {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

export default function DestinationCard({
  title,
  subtitle,
  imageUrl,
  onClick,
  className,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const src =
    imageUrl ||
    "https://images.unsplash.com/photo-1544989164-31dc3c645987?q=80&w=1200&auto=format&fit=crop";

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onClick={onClick}
      className={
        "relative w-full h-48 rounded-2xl overflow-hidden text-left bg-white shadow ring-1 ring-black/5 " +
        (className || "")
      }
    >
      <img
        src={src}
        alt={title}
        onLoad={() => setLoaded(true)}
        className={
          "absolute inset-0 w-full h-full object-cover transition-all duration-500 " +
          (loaded ? "blur-0 scale-100" : "blur-sm scale-105")
        }
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 p-3"
      >
        <div className="text-white font-semibold text-lg truncate drop-shadow">
          {title}
        </div>
        {subtitle ? (
          <div className="text-white/90 text-xs line-clamp-2 drop-shadow">
            {subtitle}
          </div>
        ) : null}
      </motion.div>
    </motion.button>
  );
}
