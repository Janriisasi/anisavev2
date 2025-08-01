// components/RateFarmer.jsx
import { useState } from 'react';
import supabase from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { Star } from 'lucide-react';

export default function RateFarmer({ farmerId, onRatingSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();

  const submit = async () => {
    if (!user) {
      alert('Login to rate');
      return;
    }

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('ratings').insert({
      user_id: user.id,
      farmer_id: farmerId,
      rating,
    });

    if (error) {
      if (error.code === '23505') {
        alert('You have already rated this farmer');
      } else {
        alert('Error rating farmer');
      }
    } else {
      alert('Thanks for your rating!');
      onRatingSubmitted && onRatingSubmitted();
      setRating(0);
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
      <h4 className="font-semibold text-gray-800 mb-3">Rate this farmer</h4>
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoveredRating(n)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-colors duration-200"
          >
            <Star
              className={`w-6 h-6 ${
                n <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-gray-600 ml-2">
            {rating} star{rating > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <button
        onClick={submit}
        disabled={submitting || rating === 0}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  );
}