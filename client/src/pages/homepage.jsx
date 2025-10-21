import { useEffect, useState, useRef } from 'react';
import supabase from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/productCard';
import productPrices from '../data/productPrices.json';
import { TrendingUp, Package, ShoppingCart, Star, ChevronUp } from 'lucide-react';

const Home = () => {
  const [user, setUser] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [myRating, setMyRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();
  const contentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
    "Banana (Lakatan)": "/images/lakatan.png",
    "Banana (Latundan)": "/images/latundan.png",
    "Banana (Saba)": "/images/saba.jpg",
    "Calamansi": "/images/calamansi.jpg",
    "Papaya": "/images/papaya.jpg",
    "Pineapple": "/images/pineapple.avif",
    "Watermelon": "/images/watermelon.jpg",
    "Lanzones": "/images/lanzones.jpg",
    "Rambutan": "/images/rambutan.webp",
    "Durian": "/images/durian.png",
    "Guyabano": "/images/guyabano.avif",
    "Avocado": "/images/avocado.jpg",
    "Melon": "/images/melon.jpg",
    "Pomelo": "/images/pomelo.jpg",
    //grains
    "Rice (Local Fancy White)": "/images/rice_fancywhite.jpg",
    "Rice (Local Premium 5% broken)": "/images/rice_premium.jpg",
    "Rice (Local Well Milled)": "/images/will_milled_rice.jpg",
    "Rice (Local Regular Milled)": "/images/rice_wellmilled.jpg",
    "Corn (White Cob, Glutinous)": "/images/white_cob_corn.jpg",
    "Corn (Yellow Cob, Sweet)": "/images/yellowcob_cornsweet.jpg",
    "Corn Grits (White, Food Grade)": "/images/whitecorn_grits_foodgrade.jpg",
    "Corn Grits (Yellow, Food Grade)": "/images/yellowcorn_grits_foodgrade.jpg",
    "Corn Cracked (Yellow, Feed Grade)": "/images/yellowcob_corn_feedgrade.jpg",
    "Corn Grits (Feed Grade)": "/images/corngrits.jpg",
    "Sorghum": "/images/sorghum.jpg",
    "Millet": "/images/millet.avif",
    //herbs & spices
    "Ginger": "/images/ginger.jpg",
    "Garlic": "/images/garlic.jpg",
    "Red Onion": "/images/onion.avif",
    "Chili": "/images/chili.png",
    "Lemongrass": "/images/lemongrass.webp",
    "Basil": "/images/basil.webp",
    "Turmeric": "/images/turmeric.webp"
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      } else {
        setUser(user);
        fetchMyProducts(user.id);
        fetchMyRating(user.id);
        generateProductsFromPrices();
      }
    };

    getUser();
  }, []);

  const fetchMyProducts = async (userId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);

    if (!error) setMyProducts(data);
    else console.error('Error fetching your products:', error.message);
  };

  const fetchMyRating = async (userId) => {
    try {
      //fetch rating of farmer
      const { data: ratingsData, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('farmer_id', userId);

      if (error) {
        console.error('Error fetching ratings:', error);
        return;
      }

      if (ratingsData && ratingsData.length > 0) {
        const total = ratingsData.reduce((sum, r) => sum + r.rating, 0);
        const average = (total / ratingsData.length);
        setMyRating(parseFloat(average.toFixed(1)));
        setTotalRatings(ratingsData.length);
      } else {
        setMyRating(0);
        setTotalRatings(0);
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };

  //generate products from productPrices.json with real images
  const generateProductsFromPrices = () => {
    const products = [];
    let productId = 1;

    Object.entries(productPrices).forEach(([category, items]) => {
      Object.entries(items).forEach(([name, price]) => {
        products.push({
          id: productId++,
          name: name,
          category: category,
          price: price,
          quantity_kg: Math.floor(Math.random() * 100) + 10,
          image_url: productImages[name] || `https://via.placeholder.com/300x300?text=${encodeURIComponent(name)}`,
          description: `Fresh ${name.toLowerCase()} available for purchase`,
          profiles: null
        });
      });
    });

    setAllProducts(products);
  };

  const handleSaveContact = async (farmerId) => {
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
      }
    } else {
      alert('Contact saved successfully!');
    }
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSales = myProducts.reduce((acc, product) => acc + (product.price * 10), 0);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Title */}
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Dashboard
          </h2>
          
          {/* dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-4 sm:p-6 border hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Best Seller</p>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                    {myProducts[0]?.name || 'No products yet'}
                  </h2>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-4 sm:p-6 border hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Sales Summary</p>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                    ₱{totalSales.toLocaleString()}
                  </h2>
                </div>
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-4 sm:p-6 border hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Your Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                      {myRating > 0 ? myRating : 'No ratings yet'}
                    </h2>
                    {myRating > 0 && (
                      <>
                        <span className="text-gray-500">/5</span>
                        <div className="flex ml-2">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                index < Math.floor(myRating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-4 sm:p-6 border hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Your Products</p>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-1">{myProducts.length}</h2>
                </div>
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* explore products */}
          <div className="mb-6">
            <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Explore Products
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20 text-center">
              <div className="text-gray-400 mb-4">
                <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              </div>
              <p className="text-gray-500 text-base sm:text-lg">
                {search ? 'No products found matching your search.' : 'No products found.'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-2 text-blue-500 hover:text-blue-600 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard
                    product={product}
                    onSaveContact={() => handleSaveContact(product.profiles?.id)}
                    showSaveButton={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-4 sm:right-6 md:right-8 lg:right-32 bg-green-800 hover:bg-green-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </>
  );
};

export default Home;