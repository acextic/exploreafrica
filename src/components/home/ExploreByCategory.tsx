import React from "react";
import { exploreCategories } from "../../mock/exploreCategories";

const ExploreByCategory = () => {
  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-semibold mb-6">
        Explore by Category
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {exploreCategories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col items-center justify-center bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
          >
            <span className="text-4xl mb-2">{category.icon}</span>
            <p className="font-medium text-gray-800">{category.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExploreByCategory;
