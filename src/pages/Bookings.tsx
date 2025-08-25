import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

type Booking = {
  id: string;
  created_at?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  status?: string | null;
  total_price?: number | null;
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!user) {
        setLoading(false);
        setBookings([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("id, created_at, check_in, check_out, status, total_price")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!alive) return;

        if (error) {
          const msg = (error.message || "").toLowerCase();
          const schemaMissing =
            msg.includes("does not exist") ||
            msg.includes("undefined table") ||
            msg.includes("column") ||
            error.code === "42703";

          if (schemaMissing) {
            setBookings([]);
            setError(null);
          } else {
            setError(error.message);
          }
        } else {
          setBookings((data as Booking[]) || []);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Something went wrong.");
        setBookings([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [user]);

  return (
    <main className="w-full min-h-screen bg-gray-50 pt-24 px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your bookings</h1>

        {loading ? (
          <div className="rounded-xl bg-white shadow p-6">Loading…</div>
        ) : error ? (
          <div className="rounded-xl bg-white shadow p-6 text-red-600">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl bg-white shadow p-8 text-center text-gray-600">
            You don’t have any bookings yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => {
              const dates = [b.check_in, b.check_out]
                .filter(Boolean)
                .map((d) => new Date(String(d)).toLocaleDateString())
                .join(" → ");
              return (
                <div key={b.id} className="rounded-xl bg-white shadow p-4">
                  <div className="text-sm text-gray-500">
                    {new Date(String(b.created_at)).toLocaleString()}
                  </div>
                  <div className="mt-1 font-semibold">
                    {dates || "Dates to be confirmed"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {b.status ? `Status: ${b.status}` : "Status: —"}
                  </div>
                  {typeof b.total_price === "number" && (
                    <div className="text-sm text-gray-600">
                      Total: ${b.total_price.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
