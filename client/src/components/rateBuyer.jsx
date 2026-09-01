import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RateBuyer({ buyerId, orderId = null, onRatingSubmitted, standalone = true }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState(null);
  const [existingRating, setExistingRating] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    if (user && buyerId) {
      checkExistingRating();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, buyerId, orderId]);

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

      // Scope to this specific order when we have one, otherwise fall back
      // to the general, order-less review (no standalone buyer widget exists
      // today, but this keeps the component consistent with RateFarmer).
      let query = supabase
        .from('buyer_ratings')
        .select('id, rating, review')
        .eq('farmer_id', profileData.id)
        .eq('buyer_id', buyerId);

      query = orderId ? query.eq('order_id', orderId) : query.is('order_id', null);

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('Error checking existing rating:', error);
        return;
      }

      const existing = data?.[0];
      if (existing) {
        setHasRated(true);
        setExistingRatingId(existing.id);
        setExistingRating(existing.rating);
        setRating(existing.rating);
        setReview(existing.review || '');
      } else {
        setHasRated(false);
        setExistingRatingId(null);
        setExistingRating(0);
        setRating(0);
        setReview('');
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

      const trimmedReview = review.trim() || null;

      if (hasRated && existingRatingId) {
        const { error } = await supabase
          .from('buyer_ratings')
          .update({
            rating,
            review: trimmedReview,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRatingId);

        if (error) throw error;
        toast.success('Rating updated successfully!');
      } else {
        const { data: inserted, error } = await supabase
          .from('buyer_ratings')
          .insert({
            farmer_id: profileData.id,
            buyer_id: buyerId,
            rating,
            review: trimmedReview,
            order_id: orderId || null,
          })
          .select('id')
          .single();

        if (error) throw error;
        toast.success('Thank you for your rating!');
        setHasRated(true);
        setExistingRatingId(inserted?.id ?? null);
      }

      setExistingRating(rating);
      onRatingSubmitted && onRatingSubmitted();
    } catch (error) {
      console.error('Error submitting rating:', error);
      if (error.code === '23505') {
        toast.error(orderId ? 'You have already rated this order' : 'You have already rated this buyer');
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
          {orderId
            ? `You already rated this transaction ${existingRating} star${existingRating > 1 ? 's' : ''}`
            : `You previously rated this buyer ${existingRating} star${existingRating > 1 ? 's' : ''}`}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 mb-4">
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

      {/* Review textarea */}
      <div className="w-full mb-5">
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value.slice(0, 500))}
          disabled={submitting}
          rows={3}
          placeholder="Write a review... (optional)"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
        />
        <p className="text-right text-xs text-gray-400 mt-1">{review.length}/500</p>
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