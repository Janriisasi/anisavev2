import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RateFarmer({ farmerId, onRatingSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [existingRating, setExistingRating] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    if (user && farmerId) {
      checkExistingRating();
    }
  }, [user, farmerId]);

  const checkExistingRating = async () => {
    try {
      //get the user profile ID first
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
        .from('ratings')
        .select('rating')
        .eq('user_id', profileData.id)
        .eq('farmer_id', farmerId)
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
      toast.error('Please login to rate this farmer');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    
    try {
      //verifies user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        toast.error('User profile not found. Please complete your profile setup.');
        return;
      }

      //verifies farmer profile exists
      const { data: farmerData, error: farmerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', farmerId)
        .single();

      if (farmerError) {
        console.error('Farmer error:', farmerError);
        toast.error('Farmer profile not found.');
        return;
      }

      if (hasRated) {
        //updates existing rating
        const { error } = await supabase
          .from('ratings')
          .update({ 
            rating,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', profileData.id)
          .eq('farmer_id', farmerId);

        if (error) {
          throw error;
        }
        
        toast.success('Rating updated successfully!');
      } else {
        const { error } = await supabase
          .from('ratings')
          .insert({
            user_id: profileData.id,
            farmer_id: farmerId,
            rating,
          });

        if (error) {
          throw error;
        }
        toast.success('Thank you for your rating!');
        setHasRated(true);
      }

      setExistingRating(rating);
      onRatingSubmitted && onRatingSubmitted();
      
    } catch (error) {
      console.error('Error submitting rating:', error);
      
      if (error.code === '23505') {
        toast.error('You have already rated this farmer');
      } else if (error.code === '23503') {
        toast.error('Invalid user or farmer ID. Please try refreshing the page.');
      } else {
        toast.error('Failed to submit rating. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <h4 className="font-semibold text-gray-800 mb-3 text-lg">
        {hasRated ? 'Update your rating' : 'Rate this farmer'}
      </h4>
      
      {hasRated && (
        <p className="text-sm text-gray-600 mb-3">
          You previously rated this farmer {existingRating} star{existingRating > 1 ? 's' : ''}
        </p>
      )}
      
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoveredRating(n)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-all duration-200 hover:scale-110"
            disabled={submitting}
          >
            <Star
              className={`w-8 h-8 ${
                n <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-200'
              } transition-colors duration-200`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-gray-600 ml-2 font-medium">
            {rating} star{rating > 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      <button
        onClick={submit}
        disabled={submitting || rating === 0}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {submitting ? 'Submitting...' : hasRated ? 'Update Rating' : 'Submit Rating'}
      </button>
    </div>
  );
}