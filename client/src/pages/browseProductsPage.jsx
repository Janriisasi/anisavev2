import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import supabase from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import AddToCartModal from "../components/addToCartModal";
import { useCart } from "../contexts/cartContext";
import { Package, ShoppingCart, Search, X, Users, MapPinHouse } from "lucide-react";
import SellerDetailsPopup from "../components/sellerDetailsPopup";
import usePullToRefresh from "../hooks/usePullToRefresh";
import PullToRefreshIndicator from "../components/pullToRefreshIndicator";

// Category → badge color mapping
const CATEGORY_BADGE_STYLES = {
  Fruits: { label: "Fruits", classes: "bg-orange-100 text-orange-700" },
  Vegetables: { label: "Vegetables", classes: "bg-green-100 text-green-700" },
  Grains: { label: "Grains", classes: "bg-yellow-100 text-yellow-700" },
  HerbsAndSpices: {
    label: "Herbs & Spices",
    classes: "bg-violet-100 text-violet-700",
  },
};

const getCategoryBadge = (category) =>
  CATEGORY_BADGE_STYLES[category] || {
    label: category,
    classes: "bg-gray-100 text-gray-600",
  };

const productImages = {
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
  Habichuelas: "/images/habichuelas.webp",
  Celery: "/images/celery.webp",
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
  "Rice (Local Fancy White)": "/images/rice_fancywhite.webp",
  "Rice (Local Premium 5% broken)": "/images/rice_premium.webp",
  "Rice (Local Well Milled)": "/images/will_milled_rice.webp",
  "Rice (Local Regular Milled)": "/images/rice_wellmilled.webp",
  "Corn (White Cob, Glutinous)": "/images/white_cob_corn.webp",
  "Corn (Yellow Cob, Sweet)": "/images/yellowcob_cornsweet.webp",
  "Corn Grits (White, Food Grade)": "/images/whitecorn_grits_foodgrade.webp",
  "Corn Grits (Yellow, Food Grade)": "/images/yellowcorn_grits_foodgrade.webp",
  "Corn Cracked (Yellow, Feed Grade)": "/images/yellowcob_corn_feedgrade.webp",
  "Corn Grits (Feed Grade)": "/images/corngrits.webp",
  Sorghum: "/images/sorghum.webp",
  Millet: "/images/millet.webp",
  Mungbean: "/images/mungbean.webp",
  Ginger: "/images/ginger.webp",
  Garlic: "/images/garlic.webp",
  "Red Onion": "/images/onion.webp",
  "White Onion": "/images/white_onion.webp",
  Chili: "/images/chili.webp",
  Lemongrass: "/images/lemongrass.webp",
  Basil: "/images/basil.webp",
  Turmeric: "/images/turmeric.webp",
};

// Module-level cache so revisiting the page doesn't re-trigger the full spinner
let browseDataCache = null;

export default function BrowseProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isInCart, ensureCartLoaded } = useCart();

  const [farmerProducts, setFarmerProducts] = useState(
    browseDataCache?.farmerProducts || []
  );
  // All farmers (even those without products)
  const [allFarmers, setAllFarmers] = useState(
    browseDataCache?.allFarmers || []
  );
  const [loading, setLoading] = useState(!browseDataCache);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartModalData, setCartModalData] = useState(null);

  // Active view: "products" | "farmers"
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    ensureCartLoaded?.();
  }, [ensureCartLoaded]);

  const loadBrowseData = useCallback(async () => {
    if (!user) return;
    try {
      if (!browseDataCache) setLoading(true);

      // Fetch products from other farmers (joined with their profiles)
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
          "*, profiles(id, username, full_name, avatar_url, address, contact_number)"
        )
        .neq("user_id", user.id);

      if (productsError) throw productsError;

      // Derive farmers from product listings — deduplicate by profile id.
      // This avoids a separate query and works without a role column.
      // Any user who has posted at least one product appears in the Farmers tab.
      const farmerMap = new Map();
      (products || []).forEach((p) => {
        if (p.profiles && !farmerMap.has(p.profiles.id)) {
          farmerMap.set(p.profiles.id, p.profiles);
        }
      });
      const farmers = Array.from(farmerMap.values());

      setFarmerProducts(products || []);
      setAllFarmers(farmers);
      browseDataCache = {
        farmerProducts: products || [],
        allFarmers: farmers,
      };
    } catch (err) {
      console.error("Error loading browse data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBrowseData();
  }, [loadBrowseData]);

  const { pullDistance, refreshing, threshold } = usePullToRefresh({
    onRefresh: loadBrowseData,
  });

  // Real-time product updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("browse-products-watch")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          if (payload.new.user_id !== user.id) {
            setFarmerProducts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id
                  ? { ...p, ...payload.new, profiles: p.profiles }
                  : p
              )
            );
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user]);

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
      unit: product.unit || "kg",
      harvest_date: product.harvest_date,
      location: product.location,
      min_order: product.min_order,
      negotiable: product.negotiable,
    };
    setCartModalData({ product: productData, seller: product.profiles });
  };

  const q = search.toLowerCase();

  // Filter available products — also match farmer name
  const filteredProducts = farmerProducts.filter((p) => {
    const isAvailable =
      (p.status || "Available").toLowerCase() === "available" &&
      Number(p.quantity_kg) > 0;
    if (!isAvailable) return false;
    if (!q) return true;
    const matchesProduct = p.name.toLowerCase().includes(q);
    const matchesFarmer =
      p.profiles?.full_name?.toLowerCase().includes(q) ||
      p.profiles?.username?.toLowerCase().includes(q);
    return matchesProduct || matchesFarmer;
  });

  // Filter farmers — show farmers that match the query (regardless of products)
  const filteredFarmers = allFarmers.filter((f) => {
    if (!q) return true;
    return (
      f.full_name?.toLowerCase().includes(q) ||
      f.username?.toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#f9fafb]"
    >
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        refreshing={refreshing}
        threshold={threshold}
      />

      {/* Title header (matches ChatPage's mobile header) */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          Browse Products
        </h1>
      </div>

      {/* Sticky Search + Tabs header */}
      <div className="sticky top-[var(--nav-height,56px)] z-30 bg-[#f9fafb] border-b border-gray-200 px-4 pt-4 pb-0">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or farmers..."
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700/30 focus:border-green-700 transition-all duration-200 placeholder-gray-400 text-gray-700"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Products | Farmers tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("products")}
            className={`relative flex-1 pb-3 pt-1 text-sm font-semibold transition-colors ${
              activeTab === "products"
                ? "text-green-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Products
            {activeTab === "products" && (
              <motion.div
                layoutId="browseTabIndicator"
                className="absolute left-0 right-0 -bottom-[1px] h-[3px] bg-green-800 rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("farmers")}
            className={`relative flex-1 pb-3 pt-1 text-sm font-semibold transition-colors ${
              activeTab === "farmers"
                ? "text-green-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Users
            {activeTab === "farmers" && (
              <motion.div
                layoutId="browseTabIndicator"
                className="absolute left-0 right-0 -bottom-[1px] h-[3px] bg-green-800 rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="text-center py-16">
            <motion.div
              className="inline-block"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Package className="w-8 h-8 text-green-600" />
            </motion.div>
            <p className="mt-4 text-gray-600">Loading farmers and products…</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── PRODUCTS TAB ── */}
            {activeTab === "products" && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {search
                        ? `No products found for "${search}".`
                        : "No products from farmers yet."}
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="mt-2 text-sm text-green-700 hover:text-green-800 underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <motion.div
                    key={search}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { staggerChildren: 0 } },
                    }}
                    initial="hidden"
                    animate="show"
                  >
                    {filteredProducts.map((product) => (
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
                              <span
                                className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1 ${
                                  getCategoryBadge(product.category).classes
                                }`}
                              >
                                {getCategoryBadge(product.category).label}
                              </span>
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
            )}

            {/* ── FARMERS TAB ── */}
            {activeTab === "farmers" && (
              <motion.div
                key="farmers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {filteredFarmers.length === 0 ? (
                  <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {search
                        ? `No farmers found for "${search}".`
                        : "No farmers found."}
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="mt-2 text-sm text-green-700 hover:text-green-800 underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredFarmers.map((farmer) => (
                      <motion.button
                        key={farmer.id}
                        onClick={() => navigate(`/farmer/${farmer.id}`)}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 text-left hover:shadow-md transition-all duration-200 w-full"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img
                          src={
                            farmer.avatar_url ||
                            `https://api.dicebear.com/9.x/dylan/svg?seed=${
                              farmer.username || farmer.id
                            }`
                          }
                          alt={farmer.full_name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-green-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">
                            {farmer.full_name || farmer.username || "Farmer"}
                          </p>
                          {farmer.username && (
                            <p className="text-xs text-gray-400 truncate">
                              @{farmer.username}
                            </p>
                          )}
                          {farmer.address && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                              <MapPinHouse className="w-3 h-3 flex-shrink-0 text-green-800" />
                              {farmer.address}
                            </p>
                          )}
                        </div>
                        <div className="text-green-700 flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

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
}