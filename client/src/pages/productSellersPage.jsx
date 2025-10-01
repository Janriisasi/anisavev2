import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import productPrices from '../data/productPrices.json';
import { ArrowLeft, Star, MapPin, Phone } from 'lucide-react';
import SellerDetailsPopup from '../components/sellerDetailsPopup';

export default function ProductSellersPage() {
  const { productName } = useParams();
  const [product, setProduct] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const navigate = useNavigate();

  const productImages = {
    //vegetables
    "Eggplant": "/images/eggplant.png",
    "Tomato": "/images/tomato.png",
    "Cabbage": "/images/cabbage.png",
    "Carrot": "/images/carrots.png",
    "Potato": "/images/potato.png",
    "Squash": "/images/squash.png",
    "String Beans": "/images/54EDF324AD7242CA.png!c750x0.jpeg",
    "Ampalaya": "/images/107992536.webp",
    "Okra": "/images/okra.webp",
    "Pechay": "/images/pechay.webp",
    "Bell Pepper": "/images/bellpepper.png",
    "Broccoli" : "/images/broccoli.jpg",
    "Lettuce (Green Ice)": "/images/lettuce_green.png",
    "Lettuce (Iceberg)": "/images/lettuce_iceberg.jpg",
    "Lettuce (Romaine)": "/images/lettuce_romaine.jpg",
    "Sitao": "/images/sitao.jpg",

    //fruits
    "Mango": "/images/mango.png",
    "Banana (Lakatan)": "",
    "Banana (Latundan)": "",
    "Banana (Saba)": "",
    "Calamansi": "/images/calamansi.jpg",
    "Papaya": "/images/papaya.jpg",
    "Pineapple": "/images/pineapple.avif",
    "Watermelon": "/images/watermelon.jpg",
    "Lanzones": "/images/lanzones.jpg",
    "Rambutan": "/images/rambutan.webp",
    "Durian": "/images/durian.png",
    "Guyabano": "/images/guyabano.avif",
    "Avocado": "/images/avocado.jpg",
    "Melon": "",
    "Pomelo": "",
    //grains
    "Rice (Local Fancy White)": "",
    "Rice (Local Premium 5% broken)": "",
    "Rice (Local Well Milled)": "",
    "Rice (Local Regular Milled)": "",
    "Corn (White Cob, Glutinous)": "",
    "Corn (Yellow Cob, Sweet)": "",
    "Corn Grits (White, Food Grade)": "",
    "Corn Grits (Yellow, Food Grade)": "",
    "Corn Cracked (Yellow, Feed Grade)": "",
    "Corn Grits (Feed Grade)": "",
    "Sorghum": "/images/sorghum.jpg",
    "Millet": "/images/millet.avif",
    //herbs & spices
    "Ginger": "/images/ginger.jpg",
    "Garlic": "/images/garlic.jpg",
    "Onion": "/images/onion.avif",
    "Chili": "/images/chili.png",
    "Lemongrass": "/images/lemongrass.webp",
    "Basil": "/images/basil.webp",
    "Turmeric": "/images/turmeric.webp"
  };

  useEffect(() => {
    if (productName) {
      generateProductAndSellers();
    }
  }, [productName]);

  const generateProductAndSellers = async () => {
    setLoading(true);

    //fetch products from db
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles(id, username, full_name, avatar_url, address, contact_number)
      `)
      .ilike('name', productName)
      .eq('status', 'Available');

    if (!error && dbProducts && dbProducts.length > 0) {
      //use the first product's details but keep all sellers
      const firstProduct = dbProducts[0];
      setProduct({
        name: firstProduct.name,
        category: firstProduct.category,
        price: firstProduct.price,
        image_url: productImages[name] || `https://via.placeholder.com/300x300?text=${encodeURIComponent(name)}`,
        description: `Fresh ${name.toLowerCase()} available for purchase`,
      });

      //set all sellers
      setSellers(dbProducts);
    } else {
      let foundProduct = null;
      let categoryFound = null;

      Object.entries(productPrices).forEach(([category, items]) => {
        if (items[productName]) {
          foundProduct = {
            name: productName,
            category: category,
            price: items[productName],
            image_url: productImages[name] || `https://via.placeholder.com/300x300?text=${encodeURIComponent(name)}`,
            description: `Fresh ${name.toLowerCase()} available for purchase`,
          };
          categoryFound = category;
        }
      });

      if (foundProduct) {
        setProduct(foundProduct);
        setSellers([]);
      }
    }

    setLoading(false);
  };

  const handleSaveContact = async (farmerId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please login to save contacts');
      return;
    }

    const { error } = await supabase.from('saved_contacts').insert({
      buyer_id: user.id,
      farmer_id: farmerId,
    });

    if (error) {
      if (error.code === '23505') {
        alert('Contact already saved!');
      } else {
        alert('Error saving contact');
        console.error('Save contact error:', error);
      }
    } else {
      alert('Contact saved successfully!');
    }
  };

  useEffect(() => {
    const fetchSellers = async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            address,
            contact_number,
            ratings (
              rating
            )
          )
        `)
        .eq('name', productName)
        .eq('status', 'Available');

      if (error) {
        console.error('Error fetching sellers:', error);
        return;
      }

      setSellers(data);
    };

    if (productName) {
      fetchSellers();
    }
  }, [productName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading sellers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Product not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* product details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 h-fit sticky top-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Details</h2>
            <div className="flex justify-center mb-4">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-56 h-56 object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {product.category}
              </span>
              <span className="text-2xl font-bold text-green-600">
                ₱{product.price}/kg
              </span>
            </div>
            <p className="text-gray-700">{product.description}</p>
            
            <div className="mt-6 p-4 bg-green-50 rounded-xl">
              <h4 className="font-semibold text-green-800 mb-2">Market Information</h4>
              <p className="text-sm text-green-700">
                Average market price: ₱{product.price}/kg<br/>
                {sellers.length} sellers available in your area
              </p>
            </div>
          </div>

          {/* sellers list */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            {/* Fixed mobile-responsive header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Available Sellers</h2>
              <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit">
                {sellers.length} seller{sellers.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {sellers.map((seller) => (
                <div
                  key={seller.id}
                  onClick={() => setSelectedSeller(seller)}
                  className="bg-white rounded-xl p-4 sm:p-5 shadow border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* seller header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <img
                        src={seller.profiles.avatar_url || '/default-avatar.png'}
                        alt="Seller"
                        className="w-12 sm:w-14 h-12 sm:h-14 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-800 text-base sm:text-lg truncate">
                          {seller.profiles.full_name || seller.profiles.username}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">@{seller.profiles.username}</p>
                        {seller.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-400 fill-current" />
                            <span className="text-xs sm:text-sm font-medium">{seller.rating}</span>
                            <span className="text-xs text-gray-500">({seller.totalSales || 0} sales)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-lg sm:text-2xl font-bold text-green-600">₱{seller.price}/kg</div>
                      <div className="text-xs sm:text-sm text-gray-500">{seller.quantity_kg} kg available</div>
                    </div>
                  </div>

                  {/* seller details */}
                  <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-4">
                    {seller.profiles.address && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{seller.profiles.address}</span>
                      </div>
                    )}
                    
                    {seller.profiles.contact_number && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Phone className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                        <span>{seller.profiles.contact_number}</span>
                      </div>
                    )}
                  </div>

                  {/* price comparison */}
                  {seller.price !== product.price && (
                    <div className="mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs sm:text-sm">
                        {seller.price < product.price ? (
                          <span className="text-green-600 font-medium">
                            ₱{product.price - seller.price} below market price
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium">
                            ₱{seller.price - product.price} above market price
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleContactSeller(seller.profiles.id)}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm sm:text-base"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {sellers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Star className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg">No sellers found for this product</p>
                <p className="text-gray-400 text-sm mt-2">Check back later or try searching for similar products</p>
              </div>
            )}
          </div>
        </div>

        {/* popup */}
        {selectedSeller && (
          <SellerDetailsPopup
            seller={selectedSeller}
            product={product}
            onClose={() => setSelectedSeller(null)}
          />
        )}
      </div>
    </div>
  );
}