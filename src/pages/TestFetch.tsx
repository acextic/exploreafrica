import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Property = {
  id: number;
  name: string;
  location: string;
};

export default function TestFetch() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from("properties").select("*");

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setProperties(data as Property[]);
      }

      setLoading(false);
    };

    fetchProperties();
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Properties</h2>
      <ul className="space-y-2">
        {properties.map((p) => (
          <li key={p.id} className="p-2 rounded border">
            {p.name} – {p.location}
          </li>
        ))}
      </ul>
    </div>
  );
}
