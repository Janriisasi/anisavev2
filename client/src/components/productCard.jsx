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
    <div className="bg-white rounded-2xl border border-green overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 max-w-63 mx-auto">
      <div className="relative h-48 flex justify-center items-center">
        <img
          src={image_url || 'https://via.placeholder.com/200x200?text=Product'}
          alt={name}
          className="h-32 w-32 mx-auto object-cover rounded-lg"
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
            <h2 className="text-xl font-bold text-gray-800 truncate flex-1">{name}</h2>
            <div className="text-right ml-4">
              <p className="text-2xl font-bold text-green-800">₱{price}/kg</p>
              {marketPrice > price && (
                <p className="text-sm text-gray-500 line-through">₱{marketPrice}/kg</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}