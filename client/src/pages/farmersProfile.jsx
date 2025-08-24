import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import RateFarmer from '../components/rateFarmer';
import { Star, MapPin, Phone, Package } from 'lucide-react';
import { toast } from 'react-toastify';

export default function FarmerProfile() {
  const { id } = useParams();
  const { user } = useUser();
  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [isContactSaved, setIsContactSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFarmerData();
    if (user) {
      checkIfContactSaved();
    }
  }, [id, user]);

  const fetchFarmerData = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      setFarmer(profile);
      
      //fetch the products of farmers
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', id)
        .eq('status', 'Available');

      if (productsError) throw productsError;
      setProducts(products || []);

      //fetch the ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('farmer_id', id);

      if (ratingsError) {
        console.error('Error fetching ratings:', ratingsError);
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
      console.error('Error:', error);
      toast.error('Failed to load farmer profile');
    }
  };

  const checkIfContactSaved = async () => {
    try {
      //verify user profile exists first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setIsContactSaved(false);
        return;
      }

      const { data } = await supabase
        .from('saved_contacts')
        .select('id')
        .eq('buyer_id', profileData.id)
        .eq('farmer_id', id)
        .single();

      setIsContactSaved(!!data);
    } catch (error) {
      setIsContactSaved(false);
    }
  };

  const handleSaveContact = async () => {
    if (!user) {
      toast.error('Please login to save contacts');
      return;
    }

    setSaving(true);
    try {
      //verify user profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        toast.error('User profile not found. Please complete your profile setup.');
        setSaving(false);
        return;
      }

      if (isContactSaved) {
        //remove the contact
        const { error } = await supabase
          .from('saved_contacts')
          .delete()
          .eq('buyer_id', profileData.id)
          .eq('farmer_id', id);

        if (error) throw error;
        
        setIsContactSaved(false);
        toast.success('Contact removed from saved contacts');
      } else {
        //save the contact
        const { error } = await supabase
          .from('saved_contacts')
          .insert({
            buyer_id: profileData.id,
            farmer_id: id
          });

        if (error) {
          if (error.code === '23505') {
            toast.info('Contact already saved');
            setIsContactSaved(true);
          } else {
            throw error;
          }
        } else {
          setIsContactSaved(true);
          toast.success('Contact saved successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const copyContact = async () => {
    if (farmer.contact_number) {
      try {
        await navigator.clipboard.writeText(farmer.contact_number);
        toast.success('Contact number copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy contact number');
      }
    }
  };

  if (!farmer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farmer profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* farmer profile */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <img
              src={farmer.avatar_url || '/default-avatar.png'}
              alt="Farmer Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-green-200"
            />
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {farmer.full_name || farmer.username}
                  </h1>
                  {farmer.username && farmer.full_name && (
                    <p className="text-gray-600">@{farmer.username}</p>
                  )}
                  
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-medium text-gray-700">
                      {avgRating > 0 ? avgRating : 'No ratings yet'}
                    </span>
                    {totalRatings > 0 && (
                      <span className="text-gray-500 text-sm">
                        ({totalRatings} rating{totalRatings > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>

                {user && user.id !== farmer.id && (
                  <button
                    onClick={handleSaveContact}
                    disabled={saving}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isContactSaved
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } disabled:opacity-50`}
                  >
                    {saving ? 'Processing...' : isContactSaved ? 'Remove Contact' : 'Save Contact'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {farmer.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{farmer.address}</span>
                  </div>
                )}
                
                {farmer.contact_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 flex-1">{farmer.contact_number}</span>
                    <button
                      onClick={copyContact}
                      className="text-blue-500 hover:text-blue-600 transition-colors text-xs"
                    >
                      Copy
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                  <img 
                    src={product.image_url || '/placeholder.jpg'} 
                    alt={product.name}
                    className="w-full h-40 object-cover" 
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-green-600">₱{product.price}/kg</span>
                      <span className="text-sm text-gray-500">{product.quantity_kg} kg</span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-700">{product.description}</p>
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
      </div>
    </div>
  );
}