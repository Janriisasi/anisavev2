import { useEffect, useState, useNavigate } from 'react';
import supabase from '../lib/supabase';
import ProductFormModal from '../components/ProductFormModal';
import toast from 'react-hot-toast';
import { Camera, Star, Package, Edit3, Trash2, Plus, MapPin, Phone, LogOut, Edit } from 'lucide-react';

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
  const [contactError, setContactError] = useState('');

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

  //check if profile is complete
  const isProfileComplete = profile?.address && profile?.contact_number;

  //handle add product button
  const handleAddProductClick = () => {
    if (!isProfileComplete) {
      toast.warning('Please complete your profile with address and phone number before adding products.');
      //auto-open if profile is incomplete
      setFormData({
        full_name: profile?.full_name || '',
        address: profile?.address || '',
        contact_number: profile?.contact_number || '09'
      });
      setContactError('');
      setIsEditing(true);
      return;
    }
    setShowProductForm(true);
  };

  //contact number validation function
  const handleContactNumberChange = (e) => {
    let value = e.target.value;
    
    //remove all the non-numeric characters
    let numericValue = value.replace(/\D/g, '');
    
    //if user tries to delete the "09", restore it
    if (numericValue.length < 2 || !numericValue.startsWith('09')) {
      numericValue = '09' + numericValue.replace(/^09/, '');
    }
    
    //limit to 11 digits
    numericValue = numericValue.slice(0, 11);
    
    setFormData({ ...formData, contact_number: numericValue });
    
    //validates the contact number
    if (numericValue.length === 2) {
      setContactError('Please enter the remaining 9 digits');
    } else if (numericValue.length < 11) {
      setContactError(`Contact number must be exactly 11 digits (${11 - numericValue.length} more digits needed)`);
    } else if (numericValue.length === 11) {
      setContactError('');
    }
  };

  const handleUpload = async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;

    //validate the file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    //checks the user id
    console.log('User ID:', user.id, 'Type:', typeof user.id);
    
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log('Upload path:', filePath);

    //upload image to db
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful:', data);

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);

    //update profile in db
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    //update local state
    setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    toast.success('Profile picture updated!');

  } catch (error) {
    console.error('Error:', error);
    
    //error messages
    if (error.message?.includes('uuid')) {
      toast.error('Authentication error. Please try logging out and back in.');
    } else if (error.message?.includes('storage')) {
      toast.error('Storage error. Please try again.');
    } else {
      toast.error('Failed to update profile picture');
    }
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
    
    // Validate contact number before submission
    if (formData.contact_number && formData.contact_number.length !== 11) {
      toast.error('Contact number must be exactly 11 digits starting with 09');
      return;
    }
    
    if (formData.contact_number && !formData.contact_number.startsWith('09')) {
      toast.error('Contact number must start with 09');
      return;
    }
    
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
      setContactError('');
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-center text-4xl font-bold text-gray-800 mb-6">Profile</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => {
                  setFormData({
                    full_name: profile?.full_name || '',
                    address: profile?.address || '',
                    contact_number: profile?.contact_number || '09'
                  });
                  setContactError('');
                  setIsEditing(true);
                }}
                className="md:hidden p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Edit Profile"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {/* logout */}
            {user && (
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-10 py-2 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className='font-medium'>Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* profile section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-white/20 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  alt="Profile"
                />
              ) : (
                <label>
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-green-700 flex items-center justify-center border-4 border-white shadow-lg hover:bg-green-800 cursor-pointer transition-colors duration-200">
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
                </div>
                </label>
              )}
            </div>

            <div className="flex-1 text-center md:text-left w-full relative">
              {/* edit */}
              {!isEditing && (
                <button
                  onClick={() => {
                    setFormData({
                      full_name: profile?.full_name || '',
                      address: profile?.address || '',
                      contact_number: profile?.contact_number || '09'
                    });
                    setContactError('');
                    setIsEditing(true);
                  }}
                  className="hidden md:block absolute top-0 right-0 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Edit Profile"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}

              {isEditing ? (
                <div className="space-y-4 md:pr-12">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Edit Profile</h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all duration-200 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          placeholder="Enter your address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all duration-200 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Contact Number 
                          <span className="text-xs text-gray-500 ml-1">(11 digits required. Enter 9 more digits)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="09XXXXXXXXX"
                          value={formData.contact_number}
                          onChange={handleContactNumberChange}
                          onFocus={(e) => {
                            //09
                            if (!formData.contact_number) {
                              setFormData({ ...formData, contact_number: '09' });
                            }
                          }}
                          maxLength={11}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all duration-200 text-sm sm:text-base ${
                            contactError 
                              ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                              : 'border-gray-300 focus:ring-green-200 focus:border-green-500'
                          }`}
                        />
                        {contactError && (
                          <p className="text-red-500 text-xs mt-1">{contactError}</p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={contactError || (formData.contact_number && formData.contact_number.length !== 11)}
                          className={`flex-1 py-3 px-4 rounded-lg transition-colors font-medium text-sm sm:text-base ${
                            contactError || (formData.contact_number && formData.contact_number.length !== 11)
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-green-700 text-white hover:bg-green-800'
                          }`}
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setContactError('');
                          }}
                          className="px-8 py-3 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                </div>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 md:pr-12">
                    {profile?.full_name || 'Anonymous'}
                  </h2>
                  <p className="text-gray-600 mb-2 text-sm sm:text-base">@{profile?.username}</p>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">{user?.email}</p>
                  
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
                      <span>{avgRating > 0 ? avgRating : 'No ratings yet'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* products section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
              Products
            </h2>
            <button
              onClick={handleAddProductClick}
              className={`p-3 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base flex-shrink-0 transition-all duration-200 ${
                isProfileComplete 
                  ? 'bg-green-700 text-white hover:bg-green-800' 
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
              title={!isProfileComplete ? 'Complete profile to add products' : 'Add new product'}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">
                {isProfileComplete ? 'Add Product' : 'Complete Profile'}
              </span>
            </button>
          </div>

          {/* profile completion notice */}
          {!isProfileComplete && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 mb-2">Complete Your Profile to Add Products</h4>
                  <p className="text-yellow-700 text-sm mb-3">
                    To start selling, please add the following information to your profile:
                  </p>
                  <ul className="text-yellow-700 text-sm space-y-1 mb-3">
                    {!profile?.address && <li>• Your address (for delivery arrangements)</li>}
                    {!profile?.contact_number && <li>• Your phone number (for buyer communication)</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="backdrop-blur-sm rounded-2xl p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Package className="w-16 h-16 mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">No products yet</p>
              <p className="text-gray-400">
                {isProfileComplete 
                  ? 'Start selling by adding your first product!' 
                  : 'Complete your profile to start adding products!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                  <div className="relative">
                    <img 
                      src={product.image_url || '/placeholder.jpg'} 
                      alt={product.name}
                      className="h-48 w-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="bg-white/90 backdrop-blur-sm text-blue-500 hover:text-blue-600 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200"
                        title="Edit Product"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="bg-white/90 backdrop-blur-sm text-red-500 hover:text-red-600 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                    
                    <button
                      onClick={() => toggleProductStatus(product.id, product.status)}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 text-sm ${
                        product.status === 'Available'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800'
                          : 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800'
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

      {(showProductForm || editingProduct) && (
        <ProductFormModal
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setShowProductForm(false);
            setEditingProduct(null);
            fetchUserProducts(user.id);
          }}
          existingProduct={editingProduct}
          userProfile={profile}
        />
      )}
    </div>
  );
}