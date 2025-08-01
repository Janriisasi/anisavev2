import { useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { Phone, MapPin, Copy, MessageCircle, Star, Trash2, User } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SavedContacts() {
  const { user } = useUser();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      //updates the query
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
        .eq('buyer_id', user.id);

      if (error) throw error;

      const contactsWithRatings = await Promise.all(
        data.map(async (contact) => {
          const { data: ratingsData } = await supabase
            .from('ratings')
            .select('rating')
            .eq('farmer_id', contact.farmer_id);

          let avgRating = 0;
          if (ratingsData && ratingsData.length > 0) {
            const total = ratingsData.reduce((sum, r) => sum + r.rating, 0);
            avgRating = (total / ratingsData.length).toFixed(1);
          }

          return {
            ...contact,
            farmer: contact.farmers,
            avgRating
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

  const copyToClipboard = async (text, type = 'contact') => {
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
      fetchContacts(); //refresh the list of contacts
    } catch (error) {
      console.error('Error removing contact:', error);
      toast.error('Failed to remove contact');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your saved contacts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800">
            Saved Contacts
          </h1>
        </div>

        {contacts.length === 0 ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No saved contacts yet</h3>
              <p className="text-gray-500 mb-6">
                Start exploring products and save contacts from farmers you'd like to connect with.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
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
                  {/* header with profile image and basic info */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={contact.farmer.avatar_url || '/default-avatar.png'}
                          alt="Farmer Avatar"
                          className="w-14 h-14 rounded-full object-cover border-2 border-green-200"
                        />
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {contact.farmer.full_name || contact.farmer.username}
                          </h3>
                          {contact.farmer.username && contact.farmer.full_name && (
                            <p className="text-sm text-gray-600">@{contact.farmer.username}</p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeContact(contact.id, contact.farmer.full_name || contact.farmer.username)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Remove contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* ratings */}
                    {contact.avgRating > 0 && (
                      <div className="flex items-center gap-1 mb-4">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-700">
                          {contact.avgRating} rating
                        </span>
                      </div>
                    )}

                    {/* contact details */}
                    <div className="space-y-3">
                      {contact.farmer.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{contact.farmer.address}</span>
                        </div>
                      )}
                      
                      {contact.farmer.contact_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1">
                            {contact.farmer.contact_number}
                          </span>
                          <button
                            onClick={() => copyToClipboard(contact.farmer.contact_number, 'Contact number')}
                            className="text-blue-500 hover:text-blue-600 transition-colors p-1"
                            title="Copy contact number"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* action buttons */}
                  <div className="px-6 pb-6">
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.location.href = `/farmer/${contact.farmer.id}`}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-all duration-200"
                      >
                        View Profile
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