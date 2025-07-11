import React from "react";
import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Home from "./pages/Home";
import TestFetch from "./pages/TestFetch";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/test-fetch" element={<TestFetch />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
