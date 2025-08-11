import React from "react";

interface WhyExploreItem {
  title: string;
  description: string;
  icon: string;
}

interface WhyExploreProps {
  items: WhyExploreItem[];
}

const WhyExplore: React.FC<WhyExploreProps> = ({ items }) => {
  return (
    <section className="py-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
          >
            <div className="text-4xl mb-3">{item.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyExplore;
