import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import Loader from '../components/loader';
import { useUser } from '../hooks/useUser';
import { Copy, Star, Trash2, User, Eye } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SavedContacts() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      //verify user profile exists first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        toast.error('User profile not found.');
        setLoading(false);
        return;
      }

      //updated the query
      const { data, error } = await supabase
        .from('saved_contacts')
        .select(`
          id,
          farmer_id,
          farmers:profiles!saved_contacts_farmer_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            address,
            contact_number
          )
        `)
        .eq('buyer_id', profileData.id);

      if (error) throw error;

      const contactsWithRatings = await Promise.all(
        data.map(async (contact) => {
          //fetch ratings for this farmer
          const { data: ratingsData, error: ratingsError } = await supabase
            .from('ratings')
            .select('rating')
            .eq('farmer_id', contact.farmer_id);

          let avgRating = 0;
          let totalRatings = 0;
          
          if (!ratingsError && ratingsData && ratingsData.length > 0) {
            const total = ratingsData.reduce((sum, r) => sum + r.rating, 0);
            avgRating = (total / ratingsData.length);
            totalRatings = ratingsData.length;
          }

          return {
            ...contact,
            farmer: contact.farmers,
            avgRating: avgRating > 0 ? parseFloat(avgRating.toFixed(1)) : 0,
            totalRatings
          };
        })
      );

      setContacts(contactsWithRatings);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type = 'Contact number') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(`${type} copied to clipboard!`);
    }
  };

  const removeContact = async (contactId, farmerName) => {
    if (!confirm(`Are you sure you want to remove ${farmerName} from your contacts?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast.success('Contact removed successfully');
      fetchContacts(); //refresh the contacts
    } catch (error) {
      console.error('Error removing contact:', error);
      toast.error('Failed to remove contact');
    }
  };

  const viewFarmerProfile = (farmerId) => {
    navigate(`/farmer/${farmerId}`);
  };

  const renderStars = (rating, totalRatings) => {
    if (rating === 0) {
      return (
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Star className="w-4 h-4" />
          <span>No ratings yet</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, index) => {
            const isFilled = index < Math.floor(rating);
            const isHalfFilled = index < rating && index >= Math.floor(rating);
            
            return (
              <Star
                key={index}
                className={`w-4 h-4 ${
                  isFilled ? 'text-yellow-400 fill-yellow-400' : isHalfFilled ? 'text-yellow-400 fill-yellow-200' : 'text-gray-300'
                }`}
              />
            );
          })}
        </div>
        <span className="text-sm text-gray-600 ml-1">
          {rating} ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <Loader className="w-15 h-15 text-gray-500 mb-5" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-center text-4xl font-bold text-gray-800 mb-6">Saved Contacts</h2>
        </div>

        {contacts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No saved contacts yet</h3>
              <p className="text-gray-500 mb-6">
                Start exploring products and save contacts from farmers you'd like to connect with.
              </p>
              <button
                onClick={() => navigate('/home')}
                className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition-colors"
              >
                Explore Products
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-700">
                <span className="font-semibold">{contacts.length}</span> saved contact{contacts.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* header */}
                  <div className="p-6 pb-4 relative">
                    <div className="flex items-start gap-4 mb-4">
                      {/* profile */}
                      <div className="flex-shrink-0">
                        <img
                          src={contact.farmer.avatar_url || '/default-avatar.png'}
                          alt="Farmer Avatar"
                          className="w-20 h-20 rounded-full object-cover border-2 border-green-200"
                        />
                      </div>
                      
                      {/* cinfo */}
                      <div className="flex-1 min-w-0">
                        {/* rating*/}
                        <div className="mb-2">
                          {renderStars(contact.avgRating, contact.totalRatings)}
                        </div>
                        
                        {/* name */}
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {contact.farmer.full_name || contact.farmer.username}
                        </h3>
                        
                        {/* username if diff to full name */}
                        {contact.farmer.username && contact.farmer.full_name && (
                          <p className="text-sm text-gray-600 mb-1">@{contact.farmer.username}</p>
                        )}
                        
                        {/* address */}
                        {contact.farmer.address && (
                          <p className="text-gray-500 text-sm mb-1 line-clamp-2">
                            {contact.farmer.address}
                          </p>
                        )}
                        
                        {/* phone number */}
                        {contact.farmer.contact_number && (
                          <p className="text-gray-500 text-sm">
                            {contact.farmer.contact_number}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* buttons */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                      <div className="flex gap-8">
                        {/* view profile button */}
                        <button
                          onClick={() => viewFarmerProfile(contact.farmer.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                          title="View profile"
                        >
                          <Eye className="w-4 h-4" />
                          View Profile
                        </button>

                        {/* copy button */}
                        {contact.farmer.contact_number && (
                          <button
                            onClick={() => copyToClipboard(contact.farmer.contact_number)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                            title="Copy contact number"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </button>
                        )}
                      </div>

                      {/* remove button */}
                      <button
                        onClick={() => removeContact(contact.id, contact.farmer.full_name || contact.farmer.username)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                        title="Remove contact"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}