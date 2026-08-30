import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import supabase from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import ProductCard from "../components/productCard";
import AddToCartModal from "../components/addToCartModal";
import { useCart } from "../contexts/cartContext";
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
import MarketPriceTrend from "../components/marketPriceTrend";
import usePullToRefresh from "../hooks/usePullToRefresh";
import PullToRefreshIndicator from "../components/pullToRefreshIndicator";

// Module-level cache: lives outside the component, so it survives the
// Home page unmounting when you navigate away and remounting when you
// come back. Without this, every return trip started from empty state
// and re-showed the full-page "Finding products and farmers!" spinner
// even though we'd just fetched the same data moments earlier.
let homeDataCache = null;

const Home = () => {
  const { prices } = useMarketPrices();
  const { user } = useAuth();
  const [myProducts, setMyProducts] = useState(homeDataCache?.myProducts || []);
  const [allProducts, setAllProducts] = useState([]);
  const [farmerProducts, setFarmerProducts] = useState(homeDataCache?.farmerProducts || []); // Products posted by other farmers
  const [completedOrders, setCompletedOrders] = useState(homeDataCache?.completedOrders || []);
  const [search, setSearch] = useState("");
  const [farmerSearch, setFarmerSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [myRating, setMyRating] = useState(homeDataCache?.myRating || 0);
  const [totalRatings, setTotalRatings] = useState(homeDataCache?.totalRatings || 0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Only show the big spinner on the very first load. On repeat visits
  // we already have cached data to show instantly.
  const [loading, setLoading] = useState(!homeDataCache);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartModalData, setCartModalData] = useState(null);
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const { isInCart, ensureCartLoaded } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cart data is lazy-loaded in cartContext, so a fresh session doesn't
  // pay for a cart fetch until something needs it. Homepage never asked
  // for it, so isInCart() only ever returned real answers after some
  // *other* action happened to load the cart (e.g. adding a different
  // item, which triggers a fetch as a side effect). That's why, on a
  // fresh refresh, items already in the cart still showed "Add to Cart"
  // until you added something else. Explicitly ensuring it's loaded on
  // mount (same as cartPage.jsx already does) fixes that.
  useEffect(() => {
    ensureCartLoaded?.();
  }, [ensureCartLoaded]);

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
    "String Beans": "/images/stringbeans.webp",
    Ampalaya: "/images/ampalaya.webp",
    Okra: "/images/okra.webp",
    Pechay: "/images/pechay.webp",
    "Bell Pepper": "/images/bellpepper.webp",
    Broccoli: "/images/broccoli.webp",
    "Lettuce (Green Ice)": "/images/lettuce_green.webp",
    "Lettuce (Iceberg)": "/images/lettuce_iceberg.webp",
    "Lettuce (Romaine)": "/images/lettuce_romaine.webp",
    Sitao: "/images/sitao.webp",
    Cauliflower: "/images/cauliflower.webp",
    "Chayote (Sayote)": "/images/chayote.webp",
    "Habichuelas": "/images/habichuelas.webp",
    Celery: "/images/celery.webp",

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
    Mungbean: "/images/mungbean.webp",

    // herbs & spices
    Ginger: "/images/ginger.webp",
    Garlic: "/images/garlic.webp",
    "Red Onion": "/images/onion.webp",
    "White Onion": "/images/white_onion.webp",
    Chili: "/images/chili.webp",
    Lemongrass: "/images/lemongrass.webp",
    Basil: "/images/basil.webp",
    Turmeric: "/images/turmeric.webp",
  };

  const categoryOrder = ["Vegetables", "Fruits", "Grains", "HerbsAndSpices"];
  const categoryLabels = { HerbsAndSpices: "Herbs & Spices" };

  // Extracted into its own callback (rather than declared inline inside the
  // effect below) so pull-to-refresh can re-trigger the exact same load,
  // not just on first mount.
  const loadHomeData = useCallback(async () => {
    if (!user) return;
    try {
      if (!homeDataCache) setLoading(true);
      await fetchMyProducts(user.id);
      await fetchMyRating(user.id);
      await fetchFarmerProducts(user.id); // Fetch products posted by other farmers
      await fetchCompletedOrders(user.id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // No auth check here on purpose — ProtectedRoute already guarantees
    // `user` is a real, verified session by the time Homepage renders.
    // This used to run its own separate supabase.auth.getUser() call
    // (a live network round-trip, unlike getSession()) and navigate("/")
    // if it came back null. Right after an OAuth redirect there's a brief
    // window where that independent check could resolve null before the
    // session had fully landed — racing against AuthContext and kicking
    // people back to landing a moment after they'd already been let in.
    loadHomeData();
  }, [loadHomeData]);

  const { pullDistance, refreshing, threshold } = usePullToRefresh({
    onRefresh: loadHomeData,
  });

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

  // Real-time listener for order updates to refresh completed orders
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("home-orders-watch")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          fetchCompletedOrders(user.id);
        }
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

    if (!error) {
      setMyProducts(data);
      homeDataCache = { ...homeDataCache, myProducts: data };
    } else console.error("Error fetching your products:", error.message);
  };

  const fetchCompletedOrders = async (userId) => {
    const { data, error } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("seller_id", userId)
      .eq("status", "completed");

    if (!error) {
      setCompletedOrders(data || []);
      homeDataCache = { ...homeDataCache, completedOrders: data || [] };
    } else console.error("Error fetching completed orders:", error.message);
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
      homeDataCache = { ...homeDataCache, farmerProducts: data || [] };
    } catch (error) {
      console.error("Error fetching farmer products:", error.message);
    }
  };

  const fetchMyRating = async (userId) => {
    try {
      const [ratingsRes, buyerRatingsRes] = await Promise.all([
        supabase.from("ratings").select("rating").eq("farmer_id", userId),
        supabase.from("buyer_ratings").select("rating").eq("buyer_id", userId),
      ]);

      if (ratingsRes.error) {
        console.error("Error fetching ratings:", ratingsRes.error);
        return;
      }

      const allRatings = [];
      if (ratingsRes.data) allRatings.push(...ratingsRes.data);
      if (!buyerRatingsRes.error && buyerRatingsRes.data)
        allRatings.push(...buyerRatingsRes.data);

      if (allRatings.length > 0) {
        const average =
          allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
        const roundedAverage = parseFloat(average.toFixed(1));
        setMyRating(roundedAverage);
        setTotalRatings(allRatings.length);
        homeDataCache = {
          ...homeDataCache,
          myRating: roundedAverage,
          totalRatings: allRatings.length,
        };
      } else {
        setMyRating(0);
        setTotalRatings(0);
        homeDataCache = { ...homeDataCache, myRating: 0, totalRatings: 0 };
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
          const price =
            typeof priceData === "object" ? priceData.price : priceData;

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

  const openCartModal = (product) => {
    const productData = {
      id: product.id,
      name: product.name,
      category: product.category,
      image_url:
        product.image_url ||
        productImages[product.name] ||
        "/images/placeholder.jpg",
      price: product.price,
      quantity_kg: product.quantity_kg,
      user_id: product.user_id,
      unit: product.unit || 'kg',
      harvest_date: product.harvest_date,
      location: product.location,
      min_order: product.min_order,
      negotiable: product.negotiable,
    };
    setCartModalData({ product: productData, seller: product.profiles });
  };

  const priceCategories = useMemo(() => {
    const liveKeys = Object.keys(prices);
    const ordered = categoryOrder.filter((c) => liveKeys.includes(c));
    const extras = liveKeys.filter((c) => !categoryOrder.includes(c));
    return ["All", ...ordered, ...extras];
  }, [prices]);

  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFarmerProducts = farmerProducts.filter((p) => {
    // Buyers should never see sold-out / unavailable listings here — the
    // seller-profile page already filters on .eq('status','Available'),
    // but Browse Products was fetching every other farmer's product with
    // no status/stock check at all, so 0kg "Unavailable" items still
    // showed up (with whatever stale quantity_kg they last had before
    // going out of stock). Checking it client-side (rather than only at
    // fetch time) also means the card correctly disappears/reappears
    // live as the realtime UPDATE subscription above flips a product's
    // status, without needing a refetch.
    const isAvailable =
      (p.status || "Available").toLowerCase() === "available" &&
      Number(p.quantity_kg) > 0;
    if (!isAvailable) return false;

    const q = farmerSearch.toLowerCase();
    const matchesProduct = p.name.toLowerCase().includes(q);
    const matchesFarmer =
      p.profiles?.full_name?.toLowerCase().includes(q) ||
      p.profiles?.username?.toLowerCase().includes(q);
    return matchesProduct || matchesFarmer;
  });

  const totalSales = useMemo(() => {
    return completedOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  }, [completedOrders]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-[#f9fafb] p-6">
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          refreshing={refreshing}
          threshold={threshold}
        />
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
            data-tutorial="dashboard-stats"
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
                    {loading ? "Calculating..." : `₱${totalSales.toLocaleString()}`}
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
          <div data-tutorial="ai-advisor">
            <AiAdvisor myProducts={myProducts} />
          </div>

          {/* Market Price Trend Graph */}
          <MarketPriceTrend />

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

              {/* Category Filter Tabs (mobile only) */}
              <div
                className="flex sm:hidden items-center gap-6 overflow-x-auto border-b border-gray-200 mb-6 px-1 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {priceCategories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  const label = categoryLabels[cat] || cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`relative whitespace-nowrap pb-3 pt-1 text-sm font-semibold transition-colors flex-shrink-0 ${
                        isActive
                          ? "text-green-800"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {label}
                      {isActive && (
                        <motion.div
                          layoutId="priceCategoryTabIndicator"
                          className="absolute left-0 right-0 -bottom-[1px] h-[3px] bg-green-800 rounded-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar (mobile only) */}
              <div className="sm:hidden mb-4">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700/30 focus:border-green-700 transition-all duration-200 placeholder-gray-400 text-gray-700"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Products Grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory + search}
                  className="mb-16"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
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
                          : selectedCategory !== "All"
                            ? "No products found in this category."
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
                      {!search && selectedCategory !== "All" && (
                        <button
                          onClick={() => setSelectedCategory("All")}
                          className="mt-2 text-blue-500 hover:text-blue-600 underline"
                        >
                          Show all categories
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <div
                      data-tutorial="product-cards"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                    >
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="relative"
                        >
                          <ProductCard
                            product={product}
                            onSaveContact={() =>
                              handleSaveContact(product.profiles?.id)
                            }
                            showSaveButton={false}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

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
                <p className="text-center text-sm text-gray-500 mb-4">
                  Browse fresh products from farmers
                </p>

                {/* Browse Search Bar */}
                <div className="relative mb-6 max-w-7xl mx-auto">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    value={farmerSearch}
                    onChange={(e) => setFarmerSearch(e.target.value)}
                    placeholder="Search product or farmer..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-200 placeholder-gray-400 text-gray-700"
                  />
                  {farmerSearch && (
                    <button
                      onClick={() => setFarmerSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {farmerProducts.length === 0 ? (
                  <div className="text-center py-8 bg-white/60 backdrop-blur-sm rounded-2xl">
                    <p className="text-gray-500">
                      No products from other farmers yet.
                    </p>
                  </div>
                ) : filteredFarmerProducts.length === 0 ? (
                  <div className="text-center py-8 bg-white/60 backdrop-blur-sm rounded-2xl">
                    <p className="text-gray-500">No results for &ldquo;{farmerSearch}&rdquo;.</p>
                    <button
                      onClick={() => setFarmerSearch("")}
                      className="mt-2 text-sm text-green-700 hover:text-green-800 underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <motion.div
                    key={farmerSearch}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { staggerChildren: 0 } },
                    }}
                    initial="hidden"
                    animate="show"
                  >
                    {filteredFarmerProducts.map((product, index) => (
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
                        </div>

                        {/* Product Info */}
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-400 font-medium mb-0.5">
                                {product.category === "HerbsAndSpices"
                                  ? "Herbs & Spices"
                                  : product.category}
                              </p>
                              <h3 className="font-bold text-gray-800 truncate text-base">
                                {product.name}
                              </h3>
                            </div>
                            <p className="text-green-800 font-bold text-base ml-2 mt-4 whitespace-nowrap">
                              ₱{product.price}/{product.unit || 'kg'}
                            </p>
                          </div>

                          {/* Farmer info */}
                          {product.profiles && (
                            <div
                              className="flex items-center gap-2 cursor-pointer group/farmer"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/farmer/${product.profiles.id}`);
                              }}
                            >
                              <img
                                src={
                                  product.profiles.avatar_url ||
                                  `https://api.dicebear.com/9.x/dylan/svg?seed=${product.profiles.username || product.profiles.id}`
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
                          <div className="pt-1 flex gap-2">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 bg-[#1a5c2a] text-white py-2.5 px-3 rounded-xl hover:bg-[#154d23] transition-colors font-semibold text-sm"
                            >
                              View Details
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCartModal(product);
                              }}
                              title={
                                isInCart(product.id)
                                  ? "Already in cart (update)"
                                  : "Add to cart"
                              }
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`px-3 py-2.5 rounded-xl flex items-center justify-center transition-all border ${
                                isInCart(product.id)
                                  ? "bg-yellow-400 border-yellow-500 text-white hover:bg-yellow-500"
                                  : "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                              }`}
                            >
                              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.button>
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
            className="fixed bottom-24 md:bottom-8 right-4 sm:right-6 md:right-8 lg:right-32 bg-green-800 hover:bg-green-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
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

      {cartModalData && (
        <AddToCartModal
          product={cartModalData.product}
          seller={cartModalData.seller}
          onClose={() => setCartModalData(null)}
        />
      )}
    </motion.div>
  );
};

export default Home;