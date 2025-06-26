import Hero from "../components/home/Hero";
import StartJourney from "../components/home/StartJourney";
import SafariCard from "../components/SafariCard";
import WhyExplore from "../components/home/WhyExplore";
import ExploreByCategory from "../components/home/ExploreByCategory";
import FinalBanner from "../components/home/FinalBanner";

// ⛔ TEMP — Mock data
import { safariCamps } from "../mock/safariCamps";
import { whyExploreItems } from "../mock/whyExplore";

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <Hero />
      <StartJourney />

      {/* Popular Safari Camps */}
      <section className="mt-10 px-4">
        <h2 className="text-2xl font-bold mb-4">Popular Safari Camps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {safariCamps.map((camp) => (
            <SafariCard key={camp.id} {...camp} />
          ))}
        </div>
      </section>

      {/* Why Explore Africa */}
      <section className="mt-16 px-4">
        <h2 className="text-2xl font-bold mb-4">Reasons to Explore</h2>
        <WhyExplore items={whyExploreItems} />
      </section>

      {/* Explore by Category */}
      <ExploreByCategory />

      {/* Final Banner: “Your Africa Wilderness Gateway” */}
      <FinalBanner />
    </div>
  );
};

export default Home;
