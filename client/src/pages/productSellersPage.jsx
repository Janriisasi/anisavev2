import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import { useMarketPrices } from "../contexts/marketPricesContext";
import { ArrowLeft, Star, MapPin, Phone, ChevronDown, ShoppingCart } from "lucide-react";
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
  const [cartModalData, setCartModalData] = useState(null); // { product, seller }
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
    "Corn Grits (Yellow, Food Grade)": "/images/yellowcorn_grits_foodgrade.webp",
    "Corn Cracked (Yellow, Feed Grade)": "/images/yellowcob_corn_feedgrade.webp",
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
    if (productName && Object.keys(prices).length > 0) generateProductAndSellers();
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
      .select("*, profiles(id, username, full_name, avatar_url, address, contact_number)")
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
        description: `Fresh ${productName.toLowerCase()} available for purchase`
      });
      setSellers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchSellers = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, profiles!products_user_id_fkey(id, username, full_name, avatar_url, address, contact_number, ratings(rating))`)
        .eq("name", productName)
        .eq("status", "Available");
      if (error) { console.error("Error fetching sellers:", error); return; }
      setSellers(data);
    };
    if (productName) fetchSellers();
  }, [productName]);

  useEffect(() => {
    const handleClickOutside = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time listener for product updates (inventory changes)
  useEffect(() => {
    if (!productName) return;
    const ch = supabase.channel(`product-sellers-inventory-${productName}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
      }, (payload) => {
        if (payload.new.name !== productName) return;
        setSellers((prev) =>
          prev.map((s) =>
            s.id === payload.new.id ? { ...s, ...payload.new } : s
          )
        );
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [productName]);

  const handleClosePopup = () => setSelectedSeller(null);

  const sortedSellers = [...sellers].sort((a, b) =>
    sortOrder === "lowest" ? a.price - b.price : b.price - a.price
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
    const sellerData = seller.profiles;
    setCartModalData({ product: productData, seller: sellerData });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading sellers...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Product not found</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-green-700 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back</span>
        </button>

        {/* Product header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="relative h-48 sm:h-64 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
            <img src={product.image_url || "/placeholder.jpg"} alt={product.name} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">{product.category === 'HerbsAndSpices' ? 'Herbs & Spices' : product.category}</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{product.name}</h1>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Market price</p>
                <p className="text-xl font-bold text-green-700">₱{product.price}/kg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sellers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Available Sellers</h2>
                <span className="text-sm text-gray-500">{sellers.length} found</span>
              </div>
              <div className="self-end sm:self-auto" ref={sortRef}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortOpen(!sortOpen)}
                    className={`w-full sm:w-auto min-w-[180px] px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm bg-white border rounded-lg shadow-sm transition-all duration-200 hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 cursor-pointer ${sortOpen ? "border-green-500 ring-2 ring-green-200 shadow-lg" : "border-gray-300"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">{sortOrder === "lowest" ? "Price: Low to High" : "Price: High to Low"}</span>
                      <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${sortOpen ? "transform rotate-180" : ""}`} />
                    </div>
                  </button>
                  <div className={`absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 origin-top ${sortOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
                    <div className="py-1">
                      {["lowest", "highest"].map(order => (
                        <button key={order} type="button" onClick={() => { setSortOrder(order); setSortOpen(false); }}
                          className={`w-full px-4 py-2 sm:py-3 text-left text-sm hover:bg-green-50 hover:text-green-700 transition-colors duration-150 ${sortOrder === order ? "bg-green-100 text-green-700 font-medium" : "text-gray-900"}`}>
                          {order === "lowest" ? "Price: Low to High" : "Price: High to Low"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-4 p-4 sm:p-6 max-h-[600px] overflow-y-auto">
            {sortedSellers.map((seller) => {
              const inCart = isInCart(seller.id);
              return (
                <div key={seller.id} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                  {/* Seller header */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <img
                        src={seller.profiles.avatar_url || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seller.profiles.username}`}
                        alt="Seller" className="w-10 sm:w-14 h-10 sm:h-14 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-800 text-sm sm:text-lg truncate">{seller.profiles.full_name || seller.profiles.username}</h4>
                        <p className="text-xs text-gray-500 truncate">@{seller.profiles.username}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base sm:text-2xl font-bold text-green-600">₱{seller.price}/kg</div>
                      <div className="text-xs text-gray-500">{seller.quantity_kg} kg</div>
                    </div>
                  </div>

                  {/* Seller details */}
                  <div className="grid grid-cols-1 gap-1 sm:gap-3 mb-3 text-xs sm:text-sm">
                    {seller.profiles.address && (
                      <div className="flex items-center gap-2 text-gray-600 truncate">
                        <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{seller.profiles.address}</span>
                      </div>
                    )}
                    {seller.profiles.contact_number && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                        <span>{seller.profiles.contact_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Price comparison */}
                  {seller.price !== product.price && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs">
                        {seller.price < product.price ? (
                          <span className="text-green-600 font-medium">₱{product.price - seller.price} below market</span>
                        ) : (
                          <span className="text-orange-600 font-medium">₱{seller.price - product.price} above market</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {seller.user_id !== currentUser?.id ? (
                      <div className="flex gap-2 flex-1">
                        <button
                          onClick={() => setSelectedSeller(seller)}
                          className="flex-1 bg-green-100 text-green-800 py-2 px-3 rounded-lg hover:bg-green-200 transition-colors font-medium text-xs sm:text-base border border-green-200"
                        >
                          View Details
                        </button>
                        <StartChatButton
                          recipientId={seller.profiles.id}
                          recipientName={seller.profiles.full_name}
                          productContext={{
                            id: seller.id,
                            name: product.name,
                            price: seller.price,
                            image_url: seller.image_url || product.image_url,
                            quantity_kg: seller.quantity_kg,
                          }}
                          className="flex-1 !rounded-lg !py-2 !text-xs sm:!text-base"
                        />
                        {/* Add to Cart icon button */}
                        <motion.button
                          onClick={() => openCartModal(seller)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title={inCart ? "Already in cart (update)" : "Add to cart"}
                          className={`px-3 py-2 rounded-lg flex items-center justify-center transition-all border ${
                            inCart
                              ? 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex-1 py-2 px-3 text-center text-gray-500 bg-gray-100 rounded-lg text-xs sm:text-base">
                        Your Listing
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {sellers.length === 0 && (
            <div className="text-center py-8 px-4">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No sellers found</p>
            </div>
          )}
        </div>
      </div>

      {selectedSeller && (
        <SellerDetailsPopup seller={selectedSeller} product={product} onClose={handleClosePopup} />
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