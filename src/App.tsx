import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import SearchResultsPage from "./pages/SearchResultsPage";
import AccommodationDetail from "./pages/AccommodationDetail";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import RequireAuth from "./components/auth/RequireAuth";
import EnsureProfile from "./features/auth/EnsureProfile";
import Bookings from "./pages/Bookings";
import ExplorePlaces from "./pages/ExplorePlaces";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* runs once, keeps public.users in sync */}
      <EnsureProfile />

      <Header />
      <main className="flex-grow pt-20 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/accommodation/:id" element={<AccommodationDetail />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/explore" element={<ExplorePlaces />} />
        </Routes>
      </main>
    </div>
  );
}
