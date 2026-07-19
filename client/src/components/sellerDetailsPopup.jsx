import { MapPin, Phone, Package, ShoppingCart, Star, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import supabase from "../lib/supabase";
import StartChatButton from "./startChatButton";
import AddToCartModal from "./addToCartModal";

export default function SellerDetailsPopup({ seller, product, onClose }) {
  const [saving, setSaving] = useState(false);
  const [isContactSaved, setIsContactSaved] = useState(false);
  const [user, setUser] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("saved_contacts")
          .select()
          .eq("buyer_id", user.id)
          .eq("farmer_id", seller.profiles.id)
          .single();
        setIsContactSaved(!!data);
      }
    };
    getUser();
  }, [seller.profiles.id]);

  useEffect(() => {
    const fetchRatings = async () => {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select("rating")
        .eq("farmer_id", seller.profiles.id);

      if (ratingsError) {
        console.error("Error fetching ratings:", ratingsError);
        return;
      }

      if (ratingsData && ratingsData.length > 0) {
        const totalRating = ratingsData.reduce((sum, r) => sum + r.rating, 0);
        const average = (totalRating / ratingsData.length).toFixed(1);
        setAvgRating(parseFloat(average));
        setTotalRatings(ratingsData.length);
      } else {
        setAvgRating(0);
        setTotalRatings(0);
      }
    };
    fetchRatings();
  }, [seller.profiles.id]);

  const handleSaveContact = async () => {
    if (!user) { toast.error("Please login to save contacts"); return; }
    setSaving(true);
    try {
      if (isContactSaved) {
        const { error } = await supabase.from("saved_contacts").delete().eq("buyer_id", user.id).eq("farmer_id", seller.profiles.id);
        if (error) throw error;
        setIsContactSaved(false);
        toast.success("Contact removed from saved contacts");
      } else {
        const { error } = await supabase.from("saved_contacts").insert({ buyer_id: user.id, farmer_id: seller.profiles.id });
        if (error) {
          if (error.code === "23505") { toast.info("Contact already saved"); setIsContactSaved(true); }
          else throw error;
        } else {
          setIsContactSaved(true);
          toast.success("Contact saved successfully!");
        }
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  // Build product data compatible with AddToCartModal
  const cartProduct = {
    id: seller.id,
    name: product.name,
    category: product.category,
    image_url: seller.image_url || product.image_url,
    price: seller.price,
    quantity_kg: seller.quantity_kg,
    user_id: seller.user_id,
  };

  const categoryLabel =
    product.category === "HerbsAndSpices" ? "Herbs & Spices" : product.category;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-xl"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col sm:flex-row">
              {/* Left: Product Image */}
              <div className="sm:w-[42%] flex-shrink-0">
                <motion.img
                  src={seller.image_url || product.image_url || "/placeholder.jpg"}
                  alt={product.name}
                  className="w-full h-56 sm:h-full object-cover sm:rounded-l-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.jpg"; }}
                />
              </div>

              {/* Right: Details */}
              <motion.div
                className="flex-1 p-6 sm:p-8 flex flex-col justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-gray-400 text-sm font-medium mb-1">
                  {categoryLabel}
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-green-800 mb-2 leading-tight">
                  {product.name}
                </h2>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-500 text-sm">
                    by {seller.profiles.full_name || seller.profiles.username}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(avgRating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {totalRatings > 0 && (
                      <span className="text-xs text-gray-400">
                        {totalRatings} rating/s
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-2xl sm:text-3xl font-extrabold text-green-700 mb-4">
                  ₱{seller.price}/kg
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-600 text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 flex-shrink-0" />
                    <span>{seller.quantity_kg} kg available</span>
                  </div>
                  {seller.profiles.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{seller.profiles.address}</span>
                    </div>
                  )}
                </div>
                {seller.profiles.contact_number && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm mb-5">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{seller.profiles.contact_number}</span>
                  </div>
                )}

                {/* Message + Save Contact */}
                <div className="flex gap-3 mb-3">
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
                    className="flex-1 !rounded-xl"
                  />
                  <motion.button
                    onClick={handleSaveContact}
                    disabled={saving}
                    className={`flex-1 ${
                      isContactSaved
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    } py-2.5 px-4 rounded-xl transition-colors font-medium text-sm`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {saving
                      ? "Processing..."
                      : isContactSaved
                        ? "Remove Contact"
                        : "Save Contact"}
                  </motion.button>
                </div>

                {/* Add to Cart */}
                <motion.button
                  onClick={() => setShowCartModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showCartModal && (
        <AddToCartModal
          product={cartProduct}
          seller={seller.profiles}
          onClose={() => setShowCartModal(false)}
        />
      )}
    </>
  );
}