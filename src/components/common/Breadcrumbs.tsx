import React from "react";
import { Link } from "react-router-dom";

type Crumb = { label: string; to?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items?.length) return null;
  return (
    <nav className="text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            {c.to ? (
              <Link to={c.to} className="hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className="text-gray-800">{c.label}</span>
            )}
            {i < items.length - 1 ? (
              <span className="text-gray-400">›</span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
