import { useState, useEffect } from "react";
import { Bell, User } from "lucide-react";
import AuthModal from "./auth/AuthModal";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Header = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setAuthTab(detail.tab === "signup" ? "signup" : "signin");
      setAuthOpen(true);
    };
    window.addEventListener("auth:open", onOpen as EventListener);
    return () =>
      window.removeEventListener("auth:open", onOpen as EventListener);
  }, []);

  return (
    <>
      <header className="w-full border-b bg-white shadow-sm fixed top-0 left-0 z-50">
        <div className="w-full px-8">
          <div className="flex items-center justify-between py-4">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <img
                src="/src/assets/EA_Logo.png"
                alt="Logo"
                className="h-12 w-12"
              />
              <span className="font-bold text-xl">ExploreAfrica</span>
            </div>

            {/* Center: Navigation (kept as-is) */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="/" className="text-orange-500 underline">
                Home
              </a>
              <a href="#">Country</a>
              <a href="#">Explore Places</a>
              <a href="#">Tours</a>
            </nav>

            {/* Right: Actions (kept styling) */}
            <div className="flex items-center gap-3">
              <button className="border px-3 py-1 rounded">Things to do</button>
              <button className="border px-3 py-1 rounded">Trip Planner</button>

              {!user ? (
                // Open the modal for both sign in & sign up (tabs inside)
                <button
                  className="border px-3 py-1 rounded"
                  onClick={() => {
                    setAuthTab("signin");
                    setAuthOpen(true);
                  }}
                >
                  Sign in
                </button>
              ) : (
                <>
                  <Link to="/profile" className="border px-3 py-1 rounded">
                    Profile
                  </Link>
                  <button
                    onClick={signOut}
                    className="border px-3 py-1 rounded"
                  >
                    Sign out
                  </button>
                </>
              )}

              <Bell className="h-5 w-5" />
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>
      </header>

      {/* Auth modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
};

export default Header;
