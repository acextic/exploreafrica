import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { supabase } from "../../lib/supabaseClient";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

type EnhancedSearchProps = {
  showHero?: boolean;
  compact?: boolean;
};

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function EnhancedSearch({
  showHero = true,
  compact = false,
}: EnhancedSearchProps) {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  // ---- init from URL if available ----
  const initWhere = (params.get("where") || params.get("q") || "").trim();
  const initAdults = Math.max(1, parseInt(params.get("adults") || "2", 10));
  const initChildren = Math.max(0, parseInt(params.get("children") || "0", 10));
  const initRooms = Math.max(1, parseInt(params.get("rooms") || "1", 10));

  const urlStart = params.get("startDate");
  const urlEnd = params.get("endDate");
  const start = urlStart ? new Date(urlStart) : today();
  const end = urlEnd ? new Date(urlEnd) : today();

  const [location, setLocation] = useState(initWhere);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showDate, setShowDate] = useState(false);
  const [dateRange, setDateRange] = useState([
    { startDate: start, endDate: end, key: "selection" as const },
  ]);

  const [showGroup, setShowGroup] = useState(false);
  const [adults, setAdults] = useState(initAdults);
  const [children, setChildren] = useState(initChildren);
  const [rooms, setRooms] = useState(initRooms);

  // keep minDate to "today"
  useEffect(() => {
    if (dateRange[0].startDate! < today()) {
      setDateRange([{ ...dateRange[0], startDate: today() }]);
    }
  }, []); // run once

  // address suggestions
  useEffect(() => {
    let active = true;
    (async () => {
      const q = location.trim();
      if (q.length < 2) {
        if (active) setShowSuggestions(false);
        return;
      }
      const { data } = await supabase
        .from("accommodations")
        .select("address")
        .ilike("address", `%${q}%`)
        .limit(20);

      if (!active) return;
      const unique = Array.from(
        new Set((data || []).map((d: any) => d.address))
      ).slice(0, 8);
      setSuggestions(unique);
      setShowSuggestions(unique.length > 0);
    })();
    return () => {
      active = false;
    };
  }, [location]);

  // Build next URL, preserving any existing filters (type/price/amenities etc.)
  const handleSearch = () => {
    const next = new URLSearchParams(params.toString());

    if (location.trim()) next.set("where", location.trim());
    else next.delete("where");

    next.set("startDate", format(dateRange[0].startDate!, "yyyy-MM-dd"));
    next.set("endDate", format(dateRange[0].endDate!, "yyyy-MM-dd"));
    next.set("adults", String(adults));
    next.set("children", String(children));
    next.set("rooms", String(rooms));

    // We purposely DO NOT touch: type, minPrice, maxPrice, amenities
    // so they remain applied when a user refines their search here.

    window.location.href = `/search?${next.toString()}`;
  };

  return (
    <section className={`bg-white ${compact ? "py-3" : "py-10"} px-4`}>
      <div className="max-w-[1440px] mx-auto text-center">
        {showHero && (
          <>
            <h2 className="text-2xl md:text-3xl font-semibold italic mb-2">
              Start Your Journey
            </h2>
            <p className="text-gray-600 mb-6">
              From affordable accommodations to luxury camping experiences
            </p>
          </>
        )}

        <div className="flex flex-col md:flex-row gap-4 justify-center relative">
          {/* Where */}
          <div className="relative w-full md:w-auto">
            <div className="flex items-center border rounded px-4 py-2">
              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
              <input
                type="text"
                placeholder="Where To"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="outline-none w-full"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 bg-white border mt-1 rounded shadow max-h-72 overflow-auto">
                {suggestions.map((sug) => (
                  <div
                    key={sug}
                    onClick={() => {
                      setLocation(sug);
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-left"
                  >
                    {sug}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="relative w-full md:w-auto">
            <div
              className="flex items-center border rounded px-4 py-2 cursor-pointer"
              onClick={() => setShowDate((s) => !s)}
            >
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-gray-700">
                {format(dateRange[0].startDate!, "MMM d")} –{" "}
                {format(dateRange[0].endDate!, "MMM d")}
              </span>
            </div>
            {showDate && (
              <div className="absolute z-50 top-14 left-0 bg-white rounded shadow">
                <DateRange
                  ranges={dateRange}
                  onChange={(item) => {
                    if (item.selection?.startDate && item.selection?.endDate) {
                      const s = new Date(item.selection.startDate);
                      const e = new Date(item.selection.endDate);
                      // guard: no past dates, end > start
                      const min = today();
                      if (s < min) s.setTime(min.getTime());
                      if (e <= s) {
                        e.setDate(s.getDate() + 1);
                      }
                      setDateRange([
                        { startDate: s, endDate: e, key: "selection" },
                      ]);
                    }
                  }}
                  minDate={today()}
                />
              </div>
            )}
          </div>

          {/* Group */}
          <div className="relative w-full md:w-auto">
            <div
              className="flex items-center border rounded px-4 py-2 cursor-pointer"
              onClick={() => setShowGroup((s) => !s)}
            >
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              <span>
                {adults} adults, {children} children, {rooms} room
                {rooms > 1 ? "s" : ""}
              </span>
            </div>
            {showGroup && (
              <div className="absolute z-50 bg-white border rounded shadow w-64 mt-2 p-4 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span>Adults</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAdults(Math.max(1, adults - 1))}>
                      -
                    </button>
                    <span>{adults}</span>
                    <button onClick={() => setAdults(adults + 1)}>+</button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Children</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChildren(Math.max(0, children - 1))}
                    >
                      -
                    </button>
                    <span>{children}</span>
                    <button onClick={() => setChildren(children + 1)}>+</button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>Rooms</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRooms(Math.max(1, rooms - 1))}>
                      -
                    </button>
                    <span>{rooms}</span>
                    <button onClick={() => setRooms(rooms + 1)}>+</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>
    </section>
  );
}
