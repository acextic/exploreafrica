import { Bell, User } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white border-b shadow-sm px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/vite.svg" alt="Logo" className="h-6 w-6" />
          <span className="font-bold text-xl">ExploreAfrica</span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a href="#" className="text-orange-500 underline">
            Home
          </a>
          <a href="#">Country</a>
          <a href="#">Explore Places</a>
          <a href="#">Tours</a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="border px-3 py-1 rounded">Things to do</button>
          <button className="border px-3 py-1 rounded">Trip Planner</button>
          <button className="border px-3 py-1 rounded">Sign in</button>
          <Bell className="h-5 w-5" />
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
};

export default Header;
