import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, LogOut, User as UserIcon, Clock, Settings } from "lucide-react";
import AuthModal from "./auth/AuthModal";
import { useAuth } from "../context/AuthContext";
import MenuItem from "./common/MenuItem";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const openAuth = () => setAuthOpen(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (!menuOpen) return;
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClickAway);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onClickAway);
      window.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const first = meta.firstName || "";
  const last = meta.lastName || "";
  const displayName =
    [first, last].filter(Boolean).join(" ") || user?.email || "Account";
  const initials =
    (first?.[0] || user?.email?.[0] || "?").toUpperCase() +
    (last?.[0]?.toUpperCase() || "");

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <>
      <header className="w-full border-b bg-white shadow-sm fixed top-0 left-0 z-50">
        <div className="w-full px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <img
                src="/src/assets/EA_Logo.png"
                alt="Logo"
                className="h-12 w-12"
              />
              <span className="font-bold text-xl">ExploreAfrica</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  classNames(isActive ? "text-orange-500 underline" : "")
                }
              >
                Home
              </NavLink>

              <a href="#">Country</a>

              <NavLink
                to="/explore"
                className={({ isActive }) =>
                  classNames(isActive ? "text-orange-500 underline" : "")
                }
              >
                Explore Places
              </NavLink>

              <NavLink
                to="/packages"
                className={({ isActive }) =>
                  classNames(
                    "hover:underline",
                    isActive ? "text-orange-600 font-semibold" : "text-gray-700"
                  )
                }
              >
                Tours
              </NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <button className="border px-3 py-1 rounded">Things to do</button>
              <button
                className="border px-3 py-1 rounded text-orange-600 hover:bg-orange-50"
                onClick={() => navigate("/trip-planner")}
              >
                Trip Planner
              </button>

              <button
                className="relative rounded p-2 hover:bg-gray-100"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>

              {!user ? (
                <button
                  onClick={openAuth}
                  className="flex items-center gap-2 border px-3 py-1 rounded hover:bg-gray-50"
                  aria-label="Sign in"
                  title="Sign in"
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Sign in</span>
                </button>
              ) : (
                <div className="relative" ref={menuRef}>
                  <button
                    ref={btnRef}
                    onClick={() => setMenuOpen((s) => !s)}
                    className={classNames(
                      "flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100",
                      menuOpen && "bg-gray-100"
                    )}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="Open account menu"
                    title="Account"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white text-sm font-semibold">
                      {initials}
                    </span>
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      aria-label="Account menu"
                      className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-2"
                    >
                      <div className="px-2 py-2">
                        <p className="text-sm font-semibold">{displayName}</p>
                        {user?.email && (
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                      <div className="my-2 h-px bg-gray-100" />

                      <MenuItem
                        icon={<UserIcon className="h-4 w-4" />}
                        label="Profile"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/profile");
                        }}
                      />
                      <MenuItem
                        icon={<Clock className="h-4 w-4" />}
                        label="Bookings"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/bookings");
                        }}
                      />
                      <MenuItem
                        icon={<Settings className="h-4 w-4" />}
                        label="Settings"
                        disabled
                        hint="Coming soon"
                        onClick={() => {}}
                      />

                      <div className="my-2 h-px bg-gray-100" />
                      <MenuItem
                        icon={<LogOut className="h-4 w-4" />}
                        label="Sign out"
                        destructive
                        onClick={handleSignOut}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Header;
