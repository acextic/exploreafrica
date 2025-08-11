import React from "react";

const FinalBanner = () => {
  return (
    <section className="relative w-full mt-16">
      <img
        src="/src/assets/giraffe-banner.jpg"
        alt="African Wilderness"
        className="w-full h-80 md:h-[400px] object-cover"
      />

      <div className="absolute top-6 left-6 md:top-10 md:left-10 bg-orange-400 bg-opacity-90 text-white p-6 rounded-xl shadow-lg max-w-sm">
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          Your <span className="italic">Africa</span> Wilderness Gateway
        </h2>
        <p className="text-sm md:text-base mb-4">
          To endless adventures filled with unforgettable moments and lifetime
          memories
        </p>
        <button className="bg-white text-orange-500 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition">
          Explore our packages
        </button>
      </div>
    </section>
  );
};

export default FinalBanner;
