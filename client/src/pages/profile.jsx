import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import ProductFormModal from "../components/productformModal";
import compressImage from "../utils/imageCompression";
import DeleteConfirmationModal from "../components/deleteConfirmation";
import FarmerOrderRequests from "../components/farmerOrderRequests";
import toast from "react-hot-toast";
import {
  Camera,
  Star,
  Package,
  Edit3,
  Trash2,
  Plus,
  MapPin,
  Phone,
  LogOut,
  Edit,
  ShoppingBag,
  Award,
  LayoutGrid,
  Users,
  Info,
} from "lucide-react";

const loadedImageCache = new Set();

const ProductImage = ({ src, alt }) => {
  const resolvedSrc = src || "/placeholder.jpg";
  const [imgLoaded, setImgLoaded] = useState(() =>
    loadedImageCache.has(resolvedSrc),
  );
  const handleLoad = useCallback(() => {
    loadedImageCache.add(resolvedSrc);
    setImgLoaded(true);
  }, [resolvedSrc]);
  return (
    <div className="relative h-48 w-full bg-gray-200">
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        className={`h-48 w-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [avgRating, setAvgRating] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState("products"); // 'products' | 'orders'
  const [formData, setFormData] = useState({
    full_name: "",
    address: "",
    contact_number: "",
  });
  const [tempFormData, setTempFormData] = useState({
    full_name: "",
    address: "",
    contact_number: "",
  });
  const [contactError, setContactError] = useState("");
  const [tempAvatarUrl, setTempAvatarUrl] = useState(null);

  const fetchAllUserData = useCallback(async (userId) => {
    try {
      setLoading(true);
      const [profileRes, productsRes, ratingsRes, soldRes] = await Promise.all([
        supabase.from("profiles")
        .select("id, username, full_name, avatar_url, address, contact_number, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle(),
        supabase
          .from("products")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase.from("ratings").select("rating").eq("farmer_id", userId),
        supabase.rpc("get_seller_sold_count", { p_seller_id: userId }),
      ]);

      if (!profileRes.error) setProfile(profileRes.data);
      if (!productsRes.error) setProducts(productsRes.data || []);
      if (!ratingsRes.error && ratingsRes.data?.length > 0) {
        const avg =
          ratingsRes.data.reduce((sum, r) => sum + r.rating, 0) /
          ratingsRes.data.length;
        setAvgRating(avg.toFixed(1));
      }
      if (!soldRes.error) setSoldCount(soldRes.data || 0);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback: If profile fetch fails, we still want to show metadata
      if (userId) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && currentUser.id === userId) {
          setProfile(prev => prev || {
            full_name: currentUser.user_metadata?.full_name || "",
            username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || "",
          });
        }
      }
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchAllUserData(data.user.id);
      }
    };
    getUser();
  }, [fetchAllUserData]);

  // Realtime: update sold count when an order changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("profile-orders-watch")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          supabase
            .rpc("get_seller_sold_count", { p_seller_id: user.id })
            .then(({ data }) => {
              if (data != null) setSoldCount(data);
            });
        },
      )
      .subscribe();
    return () => ch.unsubscribe();
  }, [user]);

  // Realtime: update product inventory live
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("profile-products-inventory-watch")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
        },
        (payload) => {
          if (payload.new.user_id !== user.id) return;
          setProducts((prev) =>
            prev.map((p) =>
              p.id === payload.new.id ? { ...p, ...payload.new } : p,
            ),
          );
        },
      )
      .subscribe();
    return () => ch.unsubscribe();
  }, [user]);

  const isProfileComplete = useMemo(
    () => profile?.address && profile?.contact_number,
    [profile?.address, profile?.contact_number],
  );

  const profileImageUrl = useMemo(() => {
    if (profile?.tempAvatarUrl) return profile.tempAvatarUrl;
    if (profile?.avatar_url) return profile.avatar_url;
    return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${profile?.full_name || "User"}&size=160`;
  }, [profile?.tempAvatarUrl, profile?.avatar_url, profile?.full_name]);

  const handleAddProductClick = useCallback(() => {
    setShowProductForm(true);
  }, []);

  const handleContactNumberChange = useCallback((e) => {
    let value = e.target.value;
    let numericValue = value.replace(/\D/g, "");
    if (numericValue.length < 2 || !numericValue.startsWith("09"))
      numericValue = "09" + numericValue.replace(/^09/, "");
    numericValue = numericValue.slice(0, 11);
    setFormData((prev) => ({ ...prev, contact_number: numericValue }));
    if (numericValue.length === 2)
      setContactError("Please enter the remaining 9 digits");
    else if (numericValue.length < 11)
      setContactError(
        `Contact number must be exactly 11 digits (${11 - numericValue.length} more digits needed)`,
      );
    else if (numericValue.length === 11) setContactError("");
  }, []);

  const handleUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setTempAvatarUrl(profile?.avatar_url);
      setUploading(true);
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      let fileToUpload = file;
      try {
        toast.loading("Uploading image", { id: "compress" });
        fileToUpload = await compressImage(file);
        toast.success("Image uploaded successfully!", { id: "compress" });
      } catch (compressionError) {
        console.error("Compression failed, using original:", compressionError);
        toast.error("Failed uploading. Please try again or refresh the page.");
        toast.dismiss("compress");
      }

      const fileExt = fileToUpload.name.split(".").pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, fileToUpload, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setProfile((prev) => ({ ...prev, tempAvatarUrl: publicUrl }));
      setTempFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (contactError) {
      toast.error("Please fix contact number errors first");
      return;
    }
    if (formData.contact_number.length !== 11) {
      toast.error("Contact number must be exactly 11 digits");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          address: formData.address,
          contact_number: formData.contact_number,
          avatar_url: tempFormData.avatar_url || profile?.avatar_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      if (error) throw error;
      setProfile((prev) => ({
        ...prev,
        ...formData,
        avatar_url: tempFormData.avatar_url || profile?.avatar_url,
      }));
      setIsEditing(false);
      setTempAvatarUrl(null);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancelEdit = () => {
    if (tempAvatarUrl)
      setProfile((prev) => ({ ...prev, avatar_url: tempAvatarUrl }));
    setFormData({
      full_name: profile?.full_name || "",
      address: profile?.address || "",
      contact_number: profile?.contact_number || "09",
    });
    setTempFormData({});
    setContactError("");
    setIsEditing(false);
    setTempAvatarUrl(null);
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const newStatus =
        currentStatus === "Available" ? "Unavailable" : "Available";
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", productId);
      if (error) throw error;
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)),
      );
      toast.success(`Product marked as ${newStatus}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update product status");
    }
  };

  const deleteProduct = async (productId) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeleteConfirm(null);
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Profile
          </h2>
        </div>
        <p className="text-center text-sm text-gray-500 mb-6">
            Manage your profile, products, and orders all in one place
        </p>

        {/* ── MOBILE QUICK-NAV ────────────────────────────────────────── */}
        <div className="md:hidden grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => navigate("/categories")}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm rounded-2xl px-4 py-3.5 hover:bg-green-50 hover:border-green-200 transition-all duration-200 active:scale-95"
          >
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-5 h-5 text-green-700" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 leading-none mb-0.5">Browse</p>
              <p className="text-sm font-semibold text-gray-800">Categories</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/contacts")}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm rounded-2xl px-4 py-3.5 hover:bg-green-50 hover:border-green-200 transition-all duration-200 active:scale-95"
          >
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-green-700" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 leading-none mb-0.5">Saved</p>
              <p className="text-sm font-semibold text-gray-800">Contacts</p>
            </div>
          </button>
        </div>

        {/* Profile card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-white/20 mb-8">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6 md:gap-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-all duration-200">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              <button
                onClick={() => {
                  setTempFormData({
                    full_name: profile?.full_name || "",
                    address: profile?.address || "",
                    contact_number: profile?.contact_number || "09",
                  });
                  setFormData({
                    full_name: profile?.full_name || "",
                    address: profile?.address || "",
                    contact_number: profile?.contact_number || "09",
                  });
                  setContactError("");
                  setIsEditing(true);
                }}
                className="md:hidden mt-4 w-full flex items-center justify-center gap-2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <Edit className="w-5 h-5" />
                <span className="font-medium">Edit Profile</span>
              </button>
            </div>

            {/* Profile info / edit form */}
            <div className="flex-1 w-full relative">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value.slice(0, 25) })}
                        maxLength={25}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                        placeholder="Enter your full name"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{formData.full_name.length}/25</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 35) })}
                        maxLength={35}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                        placeholder="Enter your address"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{formData.address.length}/35</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.contact_number}
                        onChange={handleContactNumberChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12 ${contactError ? "border-red-500" : "border-gray-300"}`}
                        placeholder="09XXXXXXXXX"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{formData.contact_number.length}/11</span>
                    </div>
                    {contactError && <p className="mt-1 text-sm text-red-600">{contactError}</p>}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleProfileUpdate} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200" disabled={!!contactError}>Save Changes</button>
                    <button onClick={handleCancelEdit} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setTempFormData({
                        full_name: profile?.full_name || "",
                        address: profile?.address || "",
                        contact_number: profile?.contact_number || "09",
                      });
                      setFormData({
                        full_name: profile?.full_name || "",
                        address: profile?.address || "",
                        contact_number: profile?.contact_number || "09",
                      });
                      setContactError("");
                      setIsEditing(true);
                    }}
                    className="hidden md:flex absolute top-0 right-0 items-center gap-2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Edit Profile"
                  >
                    <Edit className="w-5 h-5" />
                    <span className="font-medium">Edit Profile</span>
                  </button>
                  <div className="mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center md:text-left break-words pr-0 md:pr-28">
                      {profile?.full_name || user?.user_metadata?.full_name || "Loading your name"}
                    </h2>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">
                      @{profile?.username || user?.user_metadata?.username || "Loading your username"}
                    </p>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">{user?.email || "Loading your email"}</p>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4 justify-center md:justify-start text-xs sm:text-sm">
                      {profile?.address && (
                        <div className="bg-gray-100 px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                          <span className="truncate">{profile.address}</span>
                        </div>
                      )}
                      {profile?.contact_number && (
                        <div className="bg-gray-100 px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                          <span>{profile.contact_number}</span>
                        </div>
                      )}
                      <div className="bg-yellow-100 px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current flex-shrink-0" />
                        <span>{avgRating > 0 ? avgRating : "No ratings yet"}</span>
                      </div>
                      <div className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 ${soldCount > 0 ? "bg-green-100" : "bg-gray-100"}`}>
                        <Award className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${soldCount > 0 ? "text-green-600" : "text-gray-400"}`} />
                        <span className={soldCount > 0 ? "text-green-700 font-semibold" : "text-gray-500"}>
                          {soldCount > 0 ? `${soldCount} sold` : "No sales yet"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 hidden md:flex justify-end">
            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <button
            onClick={() => setActiveSection("products")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-semibold text-sm transition-colors border-b-2 ${activeSection === "products" ? "border-green-700 text-green-700 bg-green-50" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <Package className="w-4 h-4" /> Products
          </button>
          <button
            onClick={() => setActiveSection("orders")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-semibold text-sm transition-colors border-b-2 ${activeSection === "orders" ? "border-green-700 text-green-700 bg-green-50" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <ShoppingBag className="w-4 h-4" /> Order Requests
          </button>
        </div>

        {/* Products section */}
        {activeSection === "products" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" /> Products
              </h2>
              <button onClick={handleAddProductClick} className="px-2 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base flex-shrink-0 transition-all duration-200 bg-green-700 text-white hover:bg-green-800">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Add Product</span>
              </button>
            </div>

            {!isProfileComplete && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><Info className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-1">Improve Your Selling Experience</h4>
                    <p className="text-blue-700 text-sm">Adding your contact details helps buyers find you and trust your shop.</p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>
            ) : products.length === 0 ? (
              <div className="backdrop-blur-sm rounded-2xl p-12 text-center">
                <div className="text-gray-400 mb-4"><Package className="w-16 h-16 mx-auto" /></div>
                <p className="text-gray-500 text-lg">No products yet</p>
                <p className="text-gray-400">{isProfileComplete ? "Start selling by adding your first product!" : "Complete your profile to start adding products!"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                    <div className="relative">
                      <ProductImage src={product.image_url} alt={product.name} />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button onClick={() => setEditingProduct(product)} className="bg-white/90 backdrop-blur-sm text-blue-500 hover:text-blue-600 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(product)} className="bg-white/90 backdrop-blur-sm text-red-500 hover:text-red-600 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{product.name}</h3>
                        <p className="text-gray-600 text-sm">{product.category}</p>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-600 font-bold text-lg">₱{product.price}/kg</span>
                        <span className="text-gray-600 text-sm">{product.quantity_kg} kg available</span>
                      </div>
                      <button onClick={() => toggleProductStatus(product.id, product.status)} className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 text-sm ${product.status === "Available" ? "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800" : "bg-red-100 text-red-700 hover:bg-red-200 hover:bg-red-800"}`}>
                        {product.status || "Available"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order Requests section */}
        {activeSection === "orders" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-white/20">
            <FarmerOrderRequests />
          </div>
        )}
      </div>

      {(showProductForm || editingProduct) && (
        <ProductFormModal
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          onSuccess={() => { setShowProductForm(false); setEditingProduct(null); if (user?.id) fetchAllUserData(user.id); }}
          existingProduct={editingProduct}
          userProfile={profile}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteProduct(deleteConfirm.id)}
        productName={deleteConfirm?.name}
        isDeleting={isDeleting}
        type="product"
      />
    </div>
  );
}