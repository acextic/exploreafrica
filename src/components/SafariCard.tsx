import React from "react";

interface SafariCardProps {
  name: string;
  rating: number;
  location: string;
  imageUrl: string;
  price: string;
  reviews: number;
  onClick?: () => void;
}

const SafariCard: React.FC<SafariCardProps> = ({
  name,
  rating,
  location,
  imageUrl,
  price,
  reviews,
  onClick,
}) => {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
      onClick={onClick}
      tabIndex={0}
      role="button"
    >
      <img src={imageUrl} alt={name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
        <p className="text-sm text-gray-600">{location}</p>
        <div className="flex items-center text-sm mt-2 text-yellow-600">
          ⭐ {rating}
          <span className="ml-1 text-gray-500">({reviews} reviews)</span>
        </div>
        <p className="text-sm text-gray-800 mt-1">{price}</p>
      </div>
    </div>
  );
};

export default SafariCard;
