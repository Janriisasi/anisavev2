import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import RateFarmer from "../components/rateFarmer";
import StartChatButton from "../components/startChatButton";
import { Star, MapPin, Phone, Package, ArrowLeft, Copy, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../contexts/cartContext";
import { motion } from "framer-motion";
import AddToCartModal from "../components/addToCartModal";

export default function FarmerProfile() {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [isContactSaved, setIsContactSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartModalData, setCartModalData] = useState(null);
  const { isInCart } = useCart();

  useEffect(() => {
    fetchFarmerData();
    if (user) {
      checkIfContactSaved();
    }

    // Real-time listener for product updates
    const ch = supabase.channel(`farmer-profile-inventory-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
      }, (payload) => {
        if (payload.new.user_id !== id) return;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === payload.new.id ? { ...p, ...payload.new } : p
          )
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, user]);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;

      setFarmer(profile);

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", id)
        .eq("status", "Available");

      if (productsError) throw productsError;
      setProducts(products || []);

      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select("rating")
        .eq("farmer_id", id);

      if (ratingsError) {
        console.error("Error fetching ratings:", ratingsError);
      } else if (ratingsData && ratingsData.length > 0) {
        const totalRating = ratingsData.reduce((sum, r) => sum + r.rating, 0);
        const average = (totalRating / ratingsData.length).toFixed(1);
        setAvgRating(parseFloat(average));
        setTotalRatings(ratingsData.length);
      } else {
        setAvgRating(0);
        setTotalRatings(0);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load farmer profile");
    } finally {
      setLoading(false);
    }
  };

  const checkIfContactSaved = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setIsContactSaved(false);
        return;
      }

      const { data } = await supabase
        .from("saved_contacts")
        .select("id")
        .eq("buyer_id", profileData.id)
        .eq("farmer_id", id)
        .single();

      setIsContactSaved(!!data);
    } catch (error) {
      setIsContactSaved(false);
    }
  };

  const handleSaveContact = async () => {
    if (!user) {
      toast.error("Please login to save contacts");
      return;
    }

    if (!farmer.contact_number || !farmer.address) {
      toast.error(
        "Cannot save contact. This user has not provided contact information.",
      );
      return;
    }

    setSaving(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        toast.error(
          "User profile not found. Please complete your profile setup.",
        );
        setSaving(false);
        return;
      }

      if (isContactSaved) {
        const { error } = await supabase
          .from("saved_contacts")
          .delete()
          .eq("buyer_id", profileData.id)
          .eq("farmer_id", id);

        if (error) throw error;

        setIsContactSaved(false);
        toast.success("Contact removed from saved contacts");
      } else {
        const { error } = await supabase.from("saved_contacts").insert({
          buyer_id: profileData.id,
          farmer_id: id,
        });

        if (error) {
          if (error.code === "23505") {
            toast.info("Contact already saved");
            setIsContactSaved(true);
          } else {
            throw error;
          }
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

  const copyContact = async () => {
    if (farmer?.contact_number) {
      try {
        await navigator.clipboard.writeText(farmer.contact_number);
        toast.success("Contact number copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy contact number");
      }
    }
  };

  const openCartModal = (product) => {
    setCartModalData({ product, seller: farmer });
  };

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Skeleton Components
  const ProfileSkeleton = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse"></div>

        <div className="flex-1 w-full space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-40"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-36"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-28"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductSkeleton = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 overflow-hidden">
      <div className="h-48 bg-gray-200 animate-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        <div className="flex justify-between">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
        <div className="h-9 bg-gray-200 rounded-lg animate-pulse w-full"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-20 mb-4"></div>

          <ProfileSkeleton />

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Farmer not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={handleBackNavigation}
          className="flex items-center text-green-800 font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>

        {/* farmer profile */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative w-32 h-32">
              <img
                src={
                  farmer.avatar_url ||
                  `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${farmer.username || farmer.id}`
                }
                alt={farmer.full_name || "Farmer Profile"}
                className="w-full h-full rounded-full object-cover border-4 border-green-200"
                loading="lazy"
              />
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="w-full sm:w-auto">
                  <h1 className="text-3xl font-bold text-gray-800 break-words max-w-full">
                    {farmer.full_name || farmer.username}
                  </h1>
                  {farmer.username && farmer.full_name && (
                    <p className="text-gray-600">@{farmer.username}</p>
                  )}
                </div>

                {user && user.id !== farmer.id && (
                  <div className="hidden sm:flex flex-col gap-2 w-full sm:w-auto">
                    <StartChatButton
                      recipientId={id}
                      recipientName={farmer.full_name}
                      className="w-full !rounded-xl"
                    />
                    <button
                      onClick={handleSaveContact}
                      disabled={saving}
                      className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 w-full ${
                        isContactSaved
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      } disabled:opacity-50`}
                    >
                      {saving
                        ? "Processing..."
                        : isContactSaved
                          ? "Remove Contact"
                          : "Save Contact"}
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4 text-xs sm:text-sm">
                  {farmer.address && (
                    <div className="bg-gray-100 px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 max-w-full overflow-hidden">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                      <span className="truncate max-w-xs sm:max-w-sm">{farmer.address}</span>
                    </div>
                  )}
                  {farmer.contact_number && (
                    <div className="bg-gray-100 px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                      <span>{farmer.contact_number}</span>
                      <button
                        onClick={copyContact}
                        className="ml-2 p-1 text-green-800 hover:text-green-900 hover:bg-green-50 rounded transition-all duration-200"
                        title="Copy contact number"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  )}
                  <div className="bg-yellow-100 px-2 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      {avgRating > 0 ? avgRating : "No ratings"}
                      {totalRatings > 0 && (
                        <span className="text-gray-500 ml-1 whitespace-nowrap">
                          ({totalRatings})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {user && user.id !== farmer.id && (
                  <div className="sm:hidden flex flex-col gap-2 mt-4">
                    <StartChatButton
                      recipientId={id}
                      recipientName={farmer.full_name}
                      className="w-full !rounded-xl"
                    />
                    <button
                      onClick={handleSaveContact}
                      disabled={saving}
                      className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 w-full ${
                        isContactSaved
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      } disabled:opacity-50`}
                    >
                      {saving
                        ? "Processing..."
                        : isContactSaved
                          ? "Remove Contact"
                          : "Save Contact"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* product section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-green-600" />
            Products ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={product.image_url || "/placeholder.jpg"}
                      alt={product.name}
                      className="h-48 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <div className="mb-2">
                      <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {product.category}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                      <span className="text-green-600 font-bold text-lg">
                        ₱{Number(product.price).toFixed(2)}/kg
                      </span>
                      <span className="text-gray-600 text-sm truncate">
                        {Number(product.quantity_kg).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg available
                      </span>
                    </div>

                    {user && user.id !== farmer.id && (
                      <div className="flex gap-2 mt-3">
                        <StartChatButton
                          recipientId={farmer.id}
                          recipientName={farmer.full_name}
                          productContext={{
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image_url: product.image_url,
                            quantity_kg: product.quantity_kg,
                          }}
                          className="flex-1 !rounded-lg !py-2 !text-sm"
                        />
                        <motion.button
                          onClick={() => openCartModal(product)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title={isInCart(product.id) ? "Already in cart (update)" : "Add to cart"}
                          className={`px-3 py-2 rounded-lg flex items-center justify-center transition-all border ${
                            isInCart(product.id)
                              ? 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* rating */}
        {user && user.id !== farmer.id && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <RateFarmer
              farmerId={farmer.id}
              onRatingSubmitted={fetchFarmerData}
            />
          </div>
        )}
 
        {cartModalData && (
          <AddToCartModal
            product={cartModalData.product}
            seller={cartModalData.seller}
            onClose={() => setCartModalData(null)}
          />
        )}
      </div>
    </div>
  );
}