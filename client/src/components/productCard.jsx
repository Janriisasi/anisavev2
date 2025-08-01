// components/ProductCard.jsx (Enhanced version)
import { Star, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import productPrices from '../data/productPrices.json';

export default function ProductCard({ product, onSaveContact, showSaveButton = true }) {
  const navigate = useNavigate();
  const { name, category, image_url, price, profiles } = product;

  //get market price from productPrices.json
  let marketPrice = price;
  Object.entries(productPrices).forEach(([items]) => {
    if (items[name]) {
      marketPrice = items[name];
    }
  });

  const handleViewSellers = () => {
    navigate(`/product/${encodeURIComponent(name)}/sellers`, {
      state: { product }
    });
  };

  const savings = marketPrice - price;
  const savingsPercent = savings > 0 ? ((savings / marketPrice) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-2xl border border-green overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={image_url || 'https://via.placeholder.com/300x200?text=Product'}
          alt={name}
          className="h-48 w-full object-cover"
        />
        {savings > 0 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            Save ₱{savings} ({savingsPercent}%)
          </div>
        )}
        <button
          onClick={handleViewSellers}
          className="absolute text-green-800 top-3 right-3 hover:underline px-3 py-1 rounded-full text-sm font-medium transition-all duration-200"
        >
          View Sellers
        </button>
      </div>

      <div className="p-5 space-y-3">
        <div className="">
          <div className="text-sm font-medium text-gray-500">
            {category === 'HerbsAndSpices' ? 'Herbs & Spices' : category}
          </div>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">{name}</h2>
            <div className="text-right ml-4">
              <p className="text-2xl font-bold text-green-800">₱{price}/kg</p>
              {marketPrice > price && (
                <p className="text-sm text-gray-500 line-through">₱{marketPrice}/kg</p>
              )}
            </div>
          </div>
        </div>

        {profiles && (
          <div className="flex items-center gap-3">
            <img
              src={profiles.avatar_url || '/default-avatar.png'}
              alt="Farmer"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-700">
              {profiles.username || profiles.full_name}
            </span>
          </div>
        )}

        {showSaveButton && onSaveContact && profiles && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSaveContact(profiles.id);
            }}
            className="w-full mt-2 flex items-center justify-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors py-2 border border-blue-600 rounded-lg hover:bg-blue-50"
          >
            <Bookmark className="w-4 h-4" />
            Save Contact
          </button>
        )}
      </div>
    </div>
  );
}