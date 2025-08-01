import { useEffect, useState, useNavigate } from 'react';
import supabase from '../lib/supabase';
import ProductFormModal from '../components/ProductFormModal';
import { toast } from 'react-toastify';
import { Camera, Star, Package, Edit3, Trash2, Plus, MapPin, Phone } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    address: '',
    contact_number: ''
  });

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      fetchProfile(data.user.id);
      fetchUserProducts(data.user.id);
      fetchUserRating(data.user.id);
    }
  };

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error) setProfile(data);
  };

  const fetchUserProducts = async (userId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setProducts(data);
    setLoading(false);
  };

  const fetchUserRating = async (userId) => {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('farmer_id', userId);

    if (!error && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setAvgRating(avg.toFixed(1));
    }
  };

  const handleUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }

      setUploading(true);

      //create file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      //upload image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      //update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Profile picture updated!');

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast.error('Error deleting product');
    } else {
      toast.success('Product deleted');
      fetchUserProducts(user.id);
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'Available' ? 'Sold Out' : 'Available';
    
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', productId);

    if (error) {
      toast.error('Error updating product status');
    } else {
      toast.success('Product status updated');
      fetchUserProducts(user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          address: formData.address,
          contact_number: formData.contact_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        full_name: formData.full_name,
        address: formData.address,
        contact_number: formData.contact_number
      }));
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-8">
          My Profile
        </h1>

        {/* profile section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  alt="Profile"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-200 to-blue-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <Camera className="w-8 h-8 text-gray-500" />
                </div>
              )}

              <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Contact Number"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-4 py-2 rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {profile?.full_name || 'Anonymous'}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setFormData({
                            full_name: profile?.full_name || '',
                            address: profile?.address || '',
                            contact_number: profile?.contact_number || ''
                          });
                          setIsEditing(true);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Edit Profile
                      </button>
                      {user && (
                        <button
                          onClick={handleLogout}
                          className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm"
                        >
                          Logout
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">@{profile?.username}</p>
                  <p className="text-gray-600 mb-4">{user?.email}</p>
                  
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                    {profile?.address && (
                      <div className="bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        {profile.address}
                      </div>
                    )}
                    {profile?.contact_number && (
                      <div className="bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        {profile.contact_number}
                      </div>
                    )}
                    <div className="bg-yellow-100 px-4 py-2 rounded-lg flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      {avgRating > 0 ? avgRating : 'No ratings yet'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {/* products section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-green-600" />
              My Products ({products.length})
            </h2>
            <button
              onClick={() => setShowProductForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products yet</p>
              <p className="text-gray-400">Start selling by adding your first product!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                  <img 
                    src={product.image_url || '/placeholder.jpg'} 
                    alt={product.name}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{product.name}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-500 hover:text-blue-600 p-1"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <p className="font-bold text-green-600 mb-2">₱{product.price}/kg</p>
                    <p className="text-sm text-gray-600 mb-3">{product.quantity_kg} kg available</p>
                    
                    <button
                      onClick={() => toggleProductStatus(product.id, product.status)}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        product.status === 'Available'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {product.status || 'Available'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showProductForm && (
        <ProductFormModal
          onClose={() => setShowProductForm(false)}
          onSuccess={() => {
            setShowProductForm(false);
            fetchUserProducts(user.id);
          }}
        />
      )
      }
    </div>
  );
}