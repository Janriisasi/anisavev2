import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import supabase from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/productCard";
import StartChatButton from "../components/startChatButton";
import { useMarketPrices } from "../contexts/marketPricesContext";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Star,
  ChevronUp,
  Sprout,
} from "lucide-react";
import SellerDetailsPopup from "../components/sellerDetailsPopup";
import AiAdvisor from "../components/aiAdvisor";

const Home = () => {
  const { prices } = useMarketPrices();
  const [user, setUser] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [farmerProducts, setFarmerProducts] = useState([]); // Products posted by other farmers
  const [search, setSearch] = useState("");
  const [myRating, setMyRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
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
      behavior: "smooth",
    });
  };

  const productImages = {
    // vegetables
    Eggplant: "/images/eggplant.webp",
    Tomato: "/images/tomato.webp",
    Cabbage: "/images/cabbage.webp",
    Carrot: "/images/carrots.webp",
    Potato: "/images/potato.webp",
    Squash: "/images/squash.webp",
    "String Beans": "/images/54EDF324AD7242CA.png!c750x0.webp",
    Ampalaya: "/images/107992536.webp",
    Okra: "/images/okra.webp",
    Pechay: "/images/pechay.webp",
    "Bell Pepper": "/images/bellpepper.webp",
    Broccoli: "/images/broccoli.webp",
    "Lettuce (Green Ice)": "/images/lettuce_green.webp",
    "Lettuce (Iceberg)": "/images/lettuce_iceberg.webp",
    "Lettuce (Romaine)": "/images/lettuce_romaine.webp",
    Sitao: "/images/sitao.webp",

    // fruits
    Mango: "/images/mango.webp",
    "Banana (Lakatan)": "/images/lakatan.webp",
    "Banana (Latundan)": "/images/latundan.webp",
    "Banana (Saba)": "/images/saba.webp",
    Calamansi: "/images/calamansi.webp",
    Papaya: "/images/papaya.webp",
    Pineapple: "/images/pineapple.webp",
    Watermelon: "/images/watermelon.webp",
    Lanzones: "/images/lanzones.webp",
    Rambutan: "/images/rambutan.webp",
    Durian: "/images/durian.webp",
    Guyabano: "/images/guyabano.webp",
    Avocado: "/images/avocado.webp",
    Melon: "/images/melon.webp",
    Pomelo: "/images/pomelo.webp",

    // grains
    "Rice (Local Fancy White)": "/images/rice_fancywhite.webp",
    "Rice (Local Premium 5% broken)": "/images/rice_premium.webp",
    "Rice (Local Well Milled)": "/images/will_milled_rice.webp",
    "Rice (Local Regular Milled)": "/images/rice_wellmilled.webp",
    "Corn (White Cob, Glutinous)": "/images/white_cob_corn.webp",
    "Corn (Yellow Cob, Sweet)": "/images/yellowcob_cornsweet.webp",
    "Corn Grits (White, Food Grade)": "/images/whitecorn_grits_foodgrade.webp",
    "Corn Grits (Yellow, Food Grade)":
      "/images/yellowcorn_grits_foodgrade.webp",
    "Corn Cracked (Yellow, Feed Grade)":
      "/images/yellowcob_corn_feedgrade.webp",
    "Corn Grits (Feed Grade)": "/images/corngrits.webp",
    Sorghum: "/images/sorghum.webp",
    Millet: "/images/millet.webp",

    // herbs & spices
    Ginger: "/images/ginger.webp",
    Garlic: "/images/garlic.webp",
    "Red Onion": "/images/onion.webp",
    Chili: "/images/chili.webp",
    Lemongrass: "/images/lemongrass.webp",
    Basil: "/images/basil.webp",
    Turmeric: "/images/turmeric.webp",
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/");
        } else {
          setUser(user);
          await fetchMyProducts(user.id);
          await fetchMyRating(user.id);
          await fetchFarmerProducts(user.id); // Fetch products posted by other farmers
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  // Real-time listener for product updates (inventory changes)
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("home-products-inventory-watch")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
        },
        (payload) => {
          // Update myProducts if it belongs to me (Dashboard updates)
          if (payload.new.user_id === user.id) {
            setMyProducts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? { ...p, ...payload.new } : p,
              ),
            );
          } else {
            // Update farmerProducts if it belongs to someone else (Browse section updates)
            setFarmerProducts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id
                  ? { ...p, ...payload.new, profiles: p.profiles }
                  : p,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const fetchMyProducts = async (userId) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId);

    if (!error) setMyProducts(data);
    else console.error("Error fetching your products:", error.message);
  };

  // Fetch products posted by other farmers (with their profile info)
  const fetchFarmerProducts = async (currentUserId) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "*, profiles(id, username, full_name, avatar_url, address, contact_number)",
        )
        .neq("user_id", currentUserId); // Exclude current user's products

      if (error) throw error;
      setFarmerProducts(data || []);
    } catch (error) {
      console.error("Error fetching farmer products:", error.message);
    }
  };

  const fetchMyRating = async (userId) => {
    try {
      //fetch rating of farmer
      const { data: ratingsData, error } = await supabase
        .from("ratings")
        .select("rating")
        .eq("farmer_id", userId);

      if (error) {
        console.error("Error fetching ratings:", error);
        return;
      }

      if (ratingsData && ratingsData.length > 0) {
        const total = ratingsData.reduce((sum, r) => sum + r.rating, 0);
        const average = total / ratingsData.length;
        setMyRating(parseFloat(average.toFixed(1)));
        setTotalRatings(ratingsData.length);
      } else {
        setMyRating(0);
        setTotalRatings(0);
      }
    } catch (error) {
      console.error("Error fetching rating:", error);
    }
  };

  //generate products from dynamic prices context with real images
  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      const products = [];
      let productId = 1;

      Object.entries(prices).forEach(([category, items]) => {
        Object.entries(items).forEach(([name, priceData]) => {
          // Check if priceData is an object and has a price property
          const price = typeof priceData === "object" ? priceData.price : priceData;

          products.push({
            id: productId++,
            name: name,
            category: category,
            price: price,
            quantity_kg: Math.floor(Math.random() * 100) + 10,
            image_url: productImages[name] || `/images/placeholder.jpg`,
            description: `Fresh ${name.toLowerCase()} available for purchase`,
            profiles: null,
          });
        });
      });

      setAllProducts(products);
    }
  }, [prices]);

  const handleSaveContact = async (farmerId) => {
    if (!user) {
      alert("Please login to save contacts");
      return;
    }

    const { error } = await supabase.from("saved_contacts").insert({
      buyer_id: user.id,
      farmer_id: farmerId,
    });

    if (error) {
      if (error.code === "23505") {
        alert("Contact already saved!");
      } else {
        alert("Error saving contact");
      }
    } else {
      alert("Contact saved successfully!");
    }
  };

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalSales = myProducts.reduce(
    (acc, product) => acc + product.price * 10,
    0,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Title */}
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            Dashboard
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            Monitor your sales and best selling products here
          </p>

          {/* dashboard cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Best Seller Card */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-4 sm:p-6 border hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Best Seller
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                    {myProducts[0]?.name || "No products yet"}
                  </h2>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
              </div>
            </motion.div>

            {/* Sales Summary Card */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-4 sm:p-6 border hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Sales Summary
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                    ₱{totalSales.toLocaleString()}
                  </h2>
                </div>
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
            </motion.div>

            {/* Rating Card */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-4 sm:p-6 border hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Your Rating
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                      {myRating > 0 ? myRating : "No ratings yet"}
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
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
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
            </motion.div>

            {/* Products Card */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-4 sm:p-6 border hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Your Products
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                    {myProducts.length}
                  </h2>
                </div>
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
              </div>
            </motion.div>
          </motion.div>

          {/* AI Farming Advisor */}
          <AiAdvisor myProducts={myProducts} />

          {loading ? (
            <div className="text-center py-12">
              <motion.div
                className="inline-block"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Package className="w-8 h-8 text-green-600" />
              </motion.div>
              <p className="mt-4 text-gray-600">
                Finding products and farmers!
              </p>
            </div>
          ) : (
            <>
              {/* Explore Products Title */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
                  Prices of Goods
                </h2>
                <p className="text-center text-sm text-gray-500">
                  Based from Department of Agriculture
                </p>
              </motion.div>

              {/* Products Grid */}
              <motion.div
                className="mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {filteredProducts.length === 0 ? (
                  <motion.div
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20 text-center"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-gray-400 mb-4">
                      <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                    </div>
                    <p className="text-gray-500 text-base sm:text-lg">
                      {search
                        ? "No products found matching your search."
                        : "No products found."}
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="mt-2 text-blue-500 hover:text-blue-600 underline"
                      >
                        Clear search
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0, // No stagger
                        },
                      },
                    }}
                  >
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        className="relative"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        }}
                      >
                        <ProductCard
                          product={product}
                          onSaveContact={() =>
                            handleSaveContact(product.profiles?.id)
                          }
                          showSaveButton={false}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>

              {/* Browse Products Section */}
              <motion.div
                className="mb-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 flex items-center justify-center gap-3">
                  Browse Products
                </h2>
                <p className="text-center text-sm text-gray-500 mb-6">
                  Browse fresh products from farmers
                </p>

                {farmerProducts.length === 0 ? (
                  <div className="text-center py-8 bg-white/60 backdrop-blur-sm rounded-2xl">
                    <p className="text-gray-500">
                      No products from other farmers yet.
                    </p>
                  </div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={{
                      show: {
                        transition: { staggerChildren: 0 },
                      },
                    }}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                  >
                    {farmerProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-grey/20 hover:shadow-xl transition-all duration-300 group"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        }}
                        whileHover={{ scale: 1.02 }}
                      >
                        {/* Product Image */}
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={
                              product.image_url ||
                              productImages[product.name] ||
                              "/images/placeholder.jpg"
                            }
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-green-600/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                            {product.category === "HerbsAndSpices"
                              ? "Herbs & Spices"
                              : product.category}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800 truncate flex-1 text-base">
                              {product.name}
                            </h3>
                            <p className="text-green-800 font-bold text-base ml-2 whitespace-nowrap">
                              ₱{product.price}/kg
                            </p>
                          </div>

                          {/* Farmer info */}
                          {product.profiles && (
                            <div
                              className="flex items-center gap-2 cursor-pointer group/farmer"
                              onClick={() =>
                                navigate(`/farmer/${product.profiles.id}`)
                              }
                            >
                              <img
                                src={
                                  product.profiles.avatar_url ||
                                  `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${product.profiles.username || product.profiles.id}`
                                }
                                alt={product.profiles.full_name}
                                className="w-7 h-7 rounded-full object-cover border border-green-200"
                              />
                              <span className="text-sm text-gray-500 group-hover/farmer:text-green-700 transition-colors truncate">
                                {product.profiles.full_name ||
                                  product.profiles.username ||
                                  "Unknown Farmer"}
                              </span>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="flex-1 bg-green-800 text-white py-2 px-3 rounded-xl hover:bg-green-700 transition-all duration-300 text-sm font-medium"
                            >
                              View Details
                            </button>
                            <StartChatButton
                              recipientId={product.profiles?.id}
                              recipientName={product.profiles?.full_name}
                              recipientUsername={product.profiles?.username}
                              className="flex-1 !rounded-xl !py-2 !text-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-8 right-4 sm:right-6 md:right-8 lg:right-32 bg-green-800 hover:bg-green-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
            aria-label="Scroll to top"
            title="Scroll to top"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {selectedProduct && (
        <SellerDetailsPopup
          seller={selectedProduct}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </motion.div>
  );
};

export default Home;
