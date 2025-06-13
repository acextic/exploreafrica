import { FaBell, FaUser } from "react-icons/fa";

function Header() {
  return (
    <header className="w-full bg-white shadow-sm px-4 py-3 sticky top-0 z-50">
      <div className="flex justify-between items-center w-full">
        {/* Left - Logo */}
        <div className="flex items-center space-x-2">
          <img src="/vite.svg" alt="Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold italic">ExploreAfrica</h1>
        </div>

        {/* Center - Nav */}
        <nav className="flex space-x-6">
          <a href="#" className="text-orange-500 font-medium">
            Home
          </a>
          <a href="#">Country</a>
          <a href="#">Explore Places</a>
          <a href="#">Tours</a>
        </nav>

        {/* Right - Buttons & Icons */}
        <div className="flex items-center space-x-3">
          <button className="border px-3 py-1 rounded">Things to do</button>
          <button className="border px-3 py-1 rounded">Trip Planner</button>
          <button className="border px-3 py-1 rounded">Sign in</button>
          <FaBell className="text-xl" />
          <FaUser className="text-xl" />
        </div>
      </div>
    </header>
  );
}

export default Header;
