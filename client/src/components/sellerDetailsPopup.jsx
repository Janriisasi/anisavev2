import { X, MapPin, Phone, Package, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import supabase from '../lib/supabase';

export default function SellerDetailsPopup({ seller, product, onClose }) {
  const [saving, setSaving] = useState(false);
  const [isContactSaved, setIsContactSaved] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    //check if user is logged in
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      //check if contact is already saved
      if (user) {
        const { data } = await supabase
          .from('saved_contacts')
          .select()
          .eq('buyer_id', user.id)
          .eq('farmer_id', seller.profiles.id)
          .single();

        setIsContactSaved(!!data);
      }
    };

    getUser();
  }, [seller.profiles.id]);

  const handleSaveContact = async () => {
    if (!user) {
      toast.error('Please login to save contacts');
      return;
    }

    setSaving(true);
    try {
      if (isContactSaved) {
        //remove contact
        const { error } = await supabase
          .from('saved_contacts')
          .delete()
          .eq('buyer_id', user.id)
          .eq('farmer_id', seller.profiles.id);

        if (error) throw error;
        
        setIsContactSaved(false);
        toast.success('Contact removed from saved contacts');
      } else {
        //save contact
        const { error } = await supabase
          .from('saved_contacts')
          .insert({
            buyer_id: user.id,
            farmer_id: seller.profiles.id
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
        <div className="relative">
          <img
            src={seller.image_url || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder.jpg';
            }}
          />
        </div>

        <div className="p-6">
          {/* seller info */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src={seller.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.profiles.username || seller.profiles.farmer.id}`}
              alt="Seller"
              className="w-16 h-16 rounded-full object-cover border-2 border-green-200"
            />
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {seller.profiles.full_name || seller.profiles.username}
              </h3>
              <p className="text-sm text-gray-500">@{seller.profiles.username}</p>
            </div>
          </div>

          {/* products details */}
          <div className="mb-6">
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
          </div>

          {/* action button */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveContact}
              disabled={saving}
              className={`flex-1 ${
                isContactSaved 
                  ? 'bg-red-800 hover:bg-red-900' 
                  : 'bg-green-800 hover:bg-green-900'
              } text-white py-2 px-4 rounded-lg transition-colors font-medium`}
            >
              {saving ? 'Processing...' : isContactSaved ? 'Remove Contact' : 'Save Contact'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}