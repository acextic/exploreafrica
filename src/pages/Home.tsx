import SafariCard from "../components/SafariCard";

const mockData = [
  {
    id: 1,
    name: "Tarangire Sopa Lodge",
    price: "$165 per person",
    rating: 8.8,
    reviews: 293,
    location: "Tarangire National Park, Tanzania",
    imageUrl: "https://source.unsplash.com/featured/?safari,lodge1",
  },
  {
    id: 2,
    name: "Escarpment Luxury Lodge",
    price: "$165 per person",
    rating: 7.8,
    reviews: 293,
    location: "Lake Manyara, Tanzania",
    imageUrl: "https://source.unsplash.com/featured/?safari,lodge2",
  },
  {
    id: 3,
    name: "Ang'ata Serengeti Camp",
    price: "$165 per person",
    rating: 6.2,
    reviews: 293,
    location: "Serengeti National Park, Tanzania",
    imageUrl: "https://source.unsplash.com/featured/?safari,lodge3",
  },
];

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Popular Safari Camps</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {mockData.map((camp) => (
          <SafariCard key={camp.id} {...camp} />
        ))}
      </div>
    </div>
  );
};

export default Home;
