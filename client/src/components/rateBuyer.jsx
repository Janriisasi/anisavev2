import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RateBuyer({ buyerId, onRatingSubmitted, standalone = true }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [existingRating, setExistingRating] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    if (user && buyerId) {
      checkExistingRating();
    }
  }, [user, buyerId]);

  const checkExistingRating = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      const { data, error } = await supabase
        .from('buyer_ratings')
        .select('rating')
        .eq('farmer_id', profileData.id)
        .eq('buyer_id', buyerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing rating:', error);
        return;
      }

      if (data) {
        setHasRated(true);
        setExistingRating(data.rating);
        setRating(data.rating);
      }
    } catch (error) {
      console.error('Error checking existing rating:', error);
    }
  };

  const submit = async () => {
    if (!user) {
      toast.error('Please login to rate this buyer');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        toast.error('User profile not found. Please complete your profile setup.');
        return;
      }

      const { data: buyerData, error: buyerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', buyerId)
        .single();

      if (buyerError) {
        toast.error('Buyer profile not found.');
        return;
      }

      if (hasRated) {
        const { error } = await supabase
          .from('buyer_ratings')
          .update({
            rating,
            updated_at: new Date().toISOString(),
          })
          .eq('farmer_id', profileData.id)
          .eq('buyer_id', buyerId);

        if (error) throw error;
        toast.success('Rating updated successfully!');
      } else {
        const { error } = await supabase
          .from('buyer_ratings')
          .insert({
            farmer_id: profileData.id,
            buyer_id: buyerId,
            rating,
          });

        if (error) throw error;
        toast.success('Thank you for your rating!');
        setHasRated(true);
      }

      setExistingRating(rating);
      onRatingSubmitted && onRatingSubmitted();
    } catch (error) {
      console.error('Error submitting rating:', error);
      if (error.code === '23505') {
        toast.error('You have already rated this buyer');
      } else if (error.code === '23503') {
        toast.error('Invalid user or buyer ID. Please try refreshing the page.');
      } else {
        toast.error('Failed to submit rating. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const containerClass = standalone
    ? "bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    : "w-full flex flex-col items-center justify-center";

  return (
    <div className={containerClass}>
      {standalone && (
        <h4 className="font-semibold text-gray-800 mb-3 text-lg text-center">
          {hasRated ? 'Update your rating' : 'Rate this buyer'}
        </h4>
      )}

      {hasRated && (
        <p className="text-sm text-gray-600 mb-3 text-center">
          You previously rated this buyer {existingRating} star{existingRating > 1 ? 's' : ''}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoveredRating(n)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-all duration-200 hover:scale-110 focus:outline-none"
            disabled={submitting}
          >
            <Star
              className={`w-9 h-9 sm:w-10 sm:h-10 ${
                n <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-current drop-shadow-sm'
                  : 'text-gray-200 hover:text-yellow-200'
              } transition-colors duration-200`}
            />
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={submitting || rating === 0}
        className="w-full bg-green-700 hover:bg-green-800 text-white py-3.5 px-4 rounded-xl font-bold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform"
      >
        {submitting ? 'Submitting...' : hasRated ? 'Update Rating' : 'Submit Rating'}
      </button>
    </div>
  );
}
