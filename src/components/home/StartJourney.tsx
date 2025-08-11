import { Calendar, MapPin, Users } from "lucide-react";
import { startJourneyPlaceholders } from "../../constants/startJourneyPlaceholders";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const StartJourney = () => {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [dates, setDates] = useState("");
  const [group, setGroup] = useState("");

  const handleSearch = () => {
    const queryParams = new URLSearchParams({
      location,
      dates,
      group,
    });
    navigate(`/search?${queryParams.toString()}`);
  };

  return (
    <section className="bg-white py-10">
      <div className="max-w-[1440px] mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold italic mb-2">
          Start Your Journey
        </h2>
        <p className="text-gray-600 mb-6">
          From affordable accommodations to luxury camping experiences
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <div className="flex items-center border rounded px-4 py-2 w-full md:w-auto">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={startJourneyPlaceholders.location}
              className="outline-none w-full"
            />
          </div>

          <div className="flex items-center border rounded px-4 py-2 w-full md:w-auto">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder={startJourneyPlaceholders.dates}
              className="outline-none w-full"
            />
          </div>

          <div className="flex items-center border rounded px-4 py-2 w-full md:w-auto">
            <Users className="w-4 h-4 mr-2 text-gray-500" />
            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder={startJourneyPlaceholders.group}
              className="outline-none w-full"
            />
          </div>

          <button
            onClick={handleSearch}
            className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition"
          >
            Search
          </button>
        </div>
      </div>
    </section>
  );
};

export default StartJourney;
