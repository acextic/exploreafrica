import { useEffect, useState } from "react";
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

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  showHero = true,
  compact = false,
}) => {
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showDate, setShowDate] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [showGroup, setShowGroup] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  useEffect(() => {
    if (location.trim().length > 1) {
      supabase
        .from("accommodations")
        .select("address")
        .ilike("address", `%${location}%`)
        .then(({ data }) => {
          const unique = Array.from(new Set(data?.map((d) => d.address)));
          setSuggestions(unique);
          setShowSuggestions(true);
        });
    } else {
      setShowSuggestions(false);
    }
  }, [location]);

  const handleSearch = () => {
    const query = new URLSearchParams({
      location,
      startDate: format(dateRange[0].startDate, "yyyy-MM-dd"),
      endDate: format(dateRange[0].endDate, "yyyy-MM-dd"),
      adults: adults.toString(),
      children: children.toString(),
      rooms: rooms.toString(),
    }).toString();

    window.location.href = `/search?${query}`;
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
          {/* Location Input */}
          <div className="relative w-full md:w-auto">
            <div className="flex items-center border rounded px-4 py-2">
              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
              <input
                type="text"
                placeholder="Where To"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="outline-none w-full"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 bg-white border mt-1 rounded shadow">
                {suggestions.map((sug, i) => (
                  <div
                    key={i}
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

          {/* Date Picker */}
          <div className="relative w-full md:w-auto">
            <div
              className="flex items-center border rounded px-4 py-2 cursor-pointer"
              onClick={() => setShowDate(!showDate)}
            >
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-gray-700">
                {format(dateRange[0].startDate, "MMM d")} -{" "}
                {format(dateRange[0].endDate, "MMM d")}
              </span>
            </div>
            {showDate && (
              <div className="absolute z-50 top-14 left-0">
                <DateRange
                  ranges={dateRange}
                  onChange={(item) => {
                    if (item.selection?.startDate && item.selection?.endDate) {
                      setDateRange([
                        {
                          startDate: new Date(item.selection.startDate),
                          endDate: new Date(item.selection.endDate),
                          key: "selection",
                        },
                      ]);
                    }
                  }}
                  minDate={new Date()}
                />
              </div>
            )}
          </div>

          {/* Group Selector */}
          <div className="relative w-full md:w-auto">
            <div
              className="flex items-center border rounded px-4 py-2 cursor-pointer"
              onClick={() => setShowGroup(!showGroup)}
            >
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              <span>
                {adults} adults, {children} children
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

          {/* Search Button */}
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
};

export default EnhancedSearch;
