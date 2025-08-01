// components/FarmerCard.jsx
import { useState } from 'react';
import supabase from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { Star, MapPin, Phone, User } from 'lucide-react';

export default function FarmerCard({ farmer, onSave }) {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      alert('Log in to save contacts');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('saved_contacts').insert({
      buyer_id: user.id,
      farmer_id: farmer.id,
    });

    if (error) {
      if (error.code === '23505') {
        alert('Contact already saved!');
      } else {
        alert('Error saving contact');
      }
    } else {
      alert('Contact saved successfully!');
      onSave && onSave();
    }
    setSaving(false);
  };

  const copyContact = () => {
    if (farmer.contact_number) {
      navigator.clipboard.writeText(farmer.contact_number);
      alert('Contact number copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={farmer.avatar_url || '/default-avatar.png'}
          alt="avatar"
          className="w-16 h-16 rounded-full object-cover border-2 border-green-200"
        />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">{farmer.username || farmer.full_name}</h3>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm text-gray-600">4.5 (12 reviews)</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {farmer.address && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{farmer.address}</span>
          </div>
        )}
        {farmer.contact_number && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            <span className="text-sm">{farmer.contact_number}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Contact'}
        </button>
        {farmer.contact_number && (
          <button
            onClick={copyContact}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}