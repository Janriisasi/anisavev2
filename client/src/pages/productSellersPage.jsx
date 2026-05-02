import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import { useMarketPrices } from "../contexts/marketPricesContext";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  ChevronDown,
  ShoppingCart,
} from "lucide-react";
import SellerDetailsPopup from "../components/sellerDetailsPopup";
import StartChatButton from "../components/startChatButton";
import AddToCartModal from "../components/addToCartModal";
import { useAuth } from "../contexts/authContext";
import { useCart } from "../contexts/cartContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ProductSellersPage() {
  const { productName } = useParams();
  const [product, setProduct] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [cartModalData, setCartModalData] = useState(null);
  const [sortOrder, setSortOrder] = useState("lowest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isInCart } = useCart();
  const { prices } = useMarketPrices();

  const productImages = {
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
    "Corn Grits (Yellow, Food Grade)":
      "/images/yellowcorn_grits_foodgrade.webp",
    "Corn Cracked (Yellow, Feed Grade)":
      "/images/yellowcob_corn_feedgrade.webp",
    "Corn Grits (Feed Grade)": "/images/corngrits.webp",
    Sorghum: "/images/sorghum.webp",
    Millet: "/images/millet.webp",
    Ginger: "/images/ginger.webp",
    Garlic: "/images/garlic.webp",
    "Red Onion": "/images/onion.webp",
    Chili: "/images/chili.webp",
    Lemongrass: "/images/lemongrass.webp",
    Basil: "/images/basil.webp",
    Turmeric: "/images/turmeric.webp",
  };

  useEffect(() => {
    if (productName && Object.keys(prices).length > 0)
      generateProductAndSellers();
  }, [productName, prices]);

  const generateProductAndSellers = async () => {
    setLoading(true);
    let defaultPrice = null;
    let defaultCategory = null;

    Object.entries(prices).forEach(([category, items]) => {
      if (items[productName]) {
        defaultPrice = items[productName];
        defaultCategory = category;
      }
    });

    const { data: dbProducts, error } = await supabase
      .from("products")
      .select(
        "*, profiles(id, username, full_name, avatar_url, address, contact_number)",
      )
      .ilike("name", productName)
      .eq("status", "Available");

    if (!error && dbProducts && dbProducts.length > 0) {
      const firstProduct = dbProducts[0];
      setProduct({
        name: firstProduct.name,
        category: firstProduct.category,
        price: defaultPrice || firstProduct.price,
        image_url: firstProduct.image_url || productImages[firstProduct.name],
        description: `Fresh and available for purchase`,
      });
      setSellers(dbProducts);
    } else if (defaultPrice) {
      setProduct({
        name: productName,
        category: defaultCategory,
        price: defaultPrice,
        image_url: productImages[productName],
        description: `Fresh ${productName.toLowerCase()} available for purchase`,
      });
      setSellers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchSellers = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `*, profiles!products_user_id_fkey(id, username, full_name, avatar_url, address, contact_number, ratings(rating))`,
        )
        .eq("name", productName)
        .eq("status", "Available");
      if (error) {
        console.error("Error fetching sellers:", error);
        return;
      }
      setSellers(data);
    };
    if (productName) fetchSellers();
  }, [productName]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!productName) return;
    const ch = supabase
      .channel(`product-sellers-inventory-${productName}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          if (payload.new.name !== productName) return;
          setSellers((prev) =>
            prev.map((s) =>
              s.id === payload.new.id ? { ...s, ...payload.new } : s,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [productName]);

  const handleClosePopup = () => setSelectedSeller(null);

  const sortedSellers = [...sellers].sort((a, b) =>
    sortOrder === "lowest" ? a.price - b.price : b.price - a.price,
  );

  const openCartModal = (seller) => {
    if (!product) return;
    const productData = {
      id: seller.id,
      name: product.name,
      category: product.category,
      image_url: seller.image_url || product.image_url,
      price: seller.price,
      quantity_kg: seller.quantity_kg,
      user_id: seller.user_id,
    };
    setCartModalData({ product: productData, seller: seller.profiles });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f7f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-green-200 border-t-[#1a5c2a] rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading sellers...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f0f7f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Product not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-[#1a5c2a] hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const categoryLabel =
    product.category === "HerbsAndSpices" ? "Herbs & Spices" : product.category;

  return (
    <div className="min-h-screen bg-[#f0f7f0]">
      <div className="px-4">
      <div className="max-w-7xl mx-auto py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#1a5c2a] hover:text-[#0f3d1a] mb-5 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Products</span>
        </button>

        {/*
          Layout:
          - Mobile: stacked (product card on top, sellers below)
          - Desktop (lg+): side-by-side (product card left, sellers right)
        */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* ── LEFT: Product Details Card ── */}
          <div className="w-full lg:w-[380px] lg:flex-shrink-0 lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Product image */}
              <div className="bg-white flex items-center justify-center p-8 h-56 sm:h-64 lg:h-72">
                <img
                  src={
                    productImages[product.name] ||
                    product.image_url ||
                    "/placeholder.jpg"
                  }
                  alt={product.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>

              {/* Product info */}
              <div className="p-5">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>

                {/* Category badge + price */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                    {categoryLabel}
                  </span>
                  <span className="text-[#1a5c2a] font-bold text-lg">
                    ₱{product.price}/kg
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-500 text-sm mb-4">
                  {product.description}
                </p>

                {/* Market info box */}
                <div className="bg-[#e8f5e9] rounded-xl p-4">
                  <p className="text-[#1a5c2a] font-bold text-sm mb-1">
                    Market Information
                  </p>
                  <p className="text-gray-700 text-sm">
                    Market Price: ₱{product.price}/kg
                  </p>
                  <p className="text-gray-700 text-sm">
                    {sellers.length > 0
                      ? `${sellers.length} seller${sellers.length !== 1 ? "s" : ""} found in your area`
                      : "No sellers found in this product yet. Be the first to sell your harvest and set the price!"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Available Sellers ── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Sellers header */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Available Sellers
                    </h2>
                    <span className="text-sm text-[#1a5c2a] font-medium">
                      {sellers.length} sellers found
                    </span>
                  </div>

                  {/* Sort dropdown */}
                  <div ref={sortRef}>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSortOpen(!sortOpen)}
                        className={`min-w-[180px] px-4 py-2.5 text-left text-sm bg-white border rounded-lg shadow-sm transition-all duration-200 hover:border-[#1a5c2a] focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-200 cursor-pointer ${sortOpen ? "border-[#1a5c2a] ring-2 ring-green-200 shadow-lg" : "border-gray-300"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-900">
                            {sortOrder === "lowest"
                              ? "Price: Low to High"
                              : "Price: High to Low"}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>
                      <div
                        className={`absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 origin-top ${sortOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
                      >
                        <div className="py-1">
                          {["lowest", "highest"].map((order) => (
                            <button
                              key={order}
                              type="button"
                              onClick={() => {
                                setSortOrder(order);
                                setSortOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 hover:text-[#1a5c2a] transition-colors ${sortOrder === order ? "bg-green-100 text-[#1a5c2a] font-medium" : "text-gray-900"}`}
                            >
                              {order === "lowest"
                                ? "Price: Low to High"
                                : "Price: High to Low"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller list */}
              <div className="divide-y divide-gray-100">
                {sortedSellers.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      No sellers found for this product
                    </p>
                  </div>
                ) : (
                  sortedSellers.map((seller) => {
                    const inCart = isInCart(seller.id);
                    return (
                      <div
                        key={seller.id}
                        className="p-4 sm:p-5 hover:bg-gray-50/60 transition-colors"
                      >
                        {/* Seller row: avatar + name + price */}
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={
                                seller.profiles.avatar_url ||
                                `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seller.profiles.username}`
                              }
                              alt="Seller"
                              className="w-11 h-11 rounded-full object-cover border-2 border-[#e8f5e9] flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 text-sm sm:text-base truncate">
                                {seller.profiles.full_name ||
                                  seller.profiles.username}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                @{seller.profiles.username}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base sm:text-xl font-bold text-[#1a5c2a]">
                              ₱{seller.price}/kg
                            </p>
                            <p className="text-xs text-gray-400">
                              {seller.quantity_kg}kg available
                            </p>
                          </div>
                        </div>

                        {/* Seller meta: address / phone */}
                        {(seller.profiles.address ||
                          seller.profiles.contact_number) && (
                          <div className="flex flex-col gap-1 mb-3">
                            {seller.profiles.address && (
                              <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">
                                  {seller.profiles.address}
                                </span>
                              </div>
                            )}
                            {seller.profiles.contact_number && (
                              <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{seller.profiles.contact_number}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Price comparison badge */}
                        {seller.price !== product.price && (
                          <div className="mb-3">
                            {seller.price < product.price ? (
                              <span className="inline-block text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                                ₱{product.price - seller.price} below market
                              </span>
                            ) : (
                              <span className="inline-block text-xs font-medium bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">
                                ₱{seller.price - product.price} above market
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        {seller.user_id !== currentUser?.id ? (
                          <div className="flex gap-2">
                            <StartChatButton
                              recipientId={seller.profiles.id}
                              recipientName={seller.profiles.full_name}
                              productContext={{
                                id: seller.id,
                                name: product.name,
                                price: seller.price,
                                image_url:
                                  seller.image_url || product.image_url,
                                quantity_kg: seller.quantity_kg,
                              }}
                              className="flex-1 !rounded-xl !py-2.5 !text-sm"
                            />
                            <button
                              onClick={() => setSelectedSeller(seller)}
                              className="flex-1 bg-[#1a5c2a] text-white py-2.5 px-3 rounded-xl hover:bg-[#154d23] transition-colors font-semibold text-sm"
                            >
                              View Details
                            </button>
                            <motion.button
                              onClick={() => openCartModal(seller)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title={
                                inCart
                                  ? "Already in cart (update)"
                                  : "Add to cart"
                              }
                              className={`px-3 py-2.5 rounded-xl flex items-center justify-center transition-all border ${
                                inCart
                                  ? "bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200"
                                  : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-[#1a5c2a]"
                              }`}
                            >
                              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.button>
                          </div>
                        ) : (
                          <div className="py-2.5 px-3 text-center text-gray-500 bg-gray-100 rounded-xl text-sm">
                            Your Listing
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {selectedSeller && (
        <SellerDetailsPopup
          seller={selectedSeller}
          product={product}
          onClose={handleClosePopup}
        />
      )}

      {cartModalData && (
        <AddToCartModal
          product={cartModalData.product}
          seller={cartModalData.seller}
          onClose={() => setCartModalData(null)}
        />
      )}
    </div>
  );
}