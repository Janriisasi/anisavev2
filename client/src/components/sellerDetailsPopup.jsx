import { MapPin, Phone, Package, DollarSign, ShoppingCart } from "lucide-react";
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
            className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <motion.img
                src={seller.image_url || "/placeholder.jpg"}
                alt={product.name}
                className="w-full h-48 object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.jpg"; }}
              />
            </div>

            <motion.div className="p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              {/* Seller info */}
              <motion.div className="flex items-center gap-4 mb-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <img
                  src={seller.profiles.avatar_url || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seller.profiles.username || seller.profiles.id}`}
                  alt="Seller"
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-200"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{seller.profiles.full_name || seller.profiles.username}</h3>
                  <p className="text-sm text-gray-500">@{seller.profiles.username}</p>
                </div>
              </motion.div>

              {/* Product details */}
              <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <h4 className="font-semibold text-gray-800 mb-4">{product.name}</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span>{seller.quantity_kg} kg available</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      <span>₱{seller.price}/kg</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {seller.profiles.address && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{seller.profiles.address}</span>
                      </div>
                    )}
                    {seller.profiles.contact_number && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{seller.profiles.contact_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div className="flex gap-3 flex-wrap" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
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
                  className="flex-1 !rounded-lg"
                />
                {/* Add to Cart button */}
                <motion.button
                  onClick={() => setShowCartModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </motion.button>
                <motion.button
                  onClick={handleSaveContact}
                  disabled={saving}
                  className={`flex-1 ${isContactSaved ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'} py-2 px-4 rounded-lg transition-colors font-medium`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? "Processing..." : isContactSaved ? "Remove Contact" : "Save Contact"}
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
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