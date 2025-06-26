import React from "react";
import Header from "./components/Header";
import Home from "./pages/Home";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow px-4 py-6">
        <Home />
      </main>
    </div>
  );
}

export default App;
