import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageSquare, Edit3, Trash2, Check, XCircle, Users, Leaf } from 'lucide-react';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────
// Star row (read-only display)
// ─────────────────────────────────────────────────
function StarDisplay({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${
            n <= value ? 'text-yellow-400 fill-current' : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Star row (interactive — for inline edit)
// ─────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
          type="button"
        >
          <Star
            className={`w-5 h-5 ${
              n <= (hovered || value) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            } transition-colors duration-150`}
          />
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Single review card
// ─────────────────────────────────────────────────
function ReviewCard({ review, isOwn, onEdit, onDelete, onClose, currentUserId }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editText, setEditText] = useState(review.review || '');
  const [saving, setSaving] = useState(false);

  const reviewerId = review.reviewer_id || review.reviewer?.id;
  const avatarSeed = review.reviewer?.username || review.reviewer?.full_name || reviewerId;
  const avatarSrc =
    review.reviewer?.avatar_url ||
    `https://api.dicebear.com/9.x/dylan/svg?seed=${avatarSeed}`;
  const displayName =
    review.reviewer?.full_name || review.reviewer?.username || 'Unknown User';
  const username = review.reviewer?.username;

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (!reviewerId) return;
    if (onClose) onClose();
    if (currentUserId && reviewerId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/farmer/${reviewerId}`);
    }
  };

  const handleSave = async () => {
    if (editRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setSaving(true);
    try {
      await onEdit(review.id, editRating, editText.trim() || null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditRating(review.rating);
    setEditText(review.review || '');
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <button
          type="button"
          onClick={handleProfileClick}
          className="focus:outline-none transition-transform hover:scale-105 active:scale-95 flex-shrink-0 cursor-pointer"
          title={`View ${displayName}'s profile`}
        >
          <img
            src={avatarSrc}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/9.x/dylan/svg?seed=${avatarSeed}`;
            }}
          />
        </button>

        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={handleProfileClick}
              className="text-left group focus:outline-none cursor-pointer min-w-0"
              title={`View ${displayName}'s profile`}
            >
              <p className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-green-700 transition-colors truncate">
                {displayName}
              </p>
              {username && (
                <p className="text-gray-400 text-xs group-hover:text-green-600 transition-colors truncate">
                  @{username}
                </p>
              )}
            </button>

            {/* Edit / Delete — only owner sees these */}
            {isOwn && !editing && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditing(true)}
                  title="Edit review"
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(review.id)}
                  title="Delete review"
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Stars */}
          <div className="mt-1 mb-2">
            {editing ? (
              <StarPicker value={editRating} onChange={setEditRating} />
            ) : (
              <StarDisplay value={review.rating} />
            )}
          </div>

          {/* Review text */}
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Write a review... (optional)"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{editText.length}/500</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className={`text-sm leading-relaxed ${review.review ? 'text-gray-700' : 'text-gray-400 italic'}`}>
              {review.review || 'No written review'}
            </p>
          )}

          {/* Date */}
          <p className="text-xs text-gray-400 mt-2">
            {new Date(review.created_at).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────
// Main ReviewsModal
// ─────────────────────────────────────────────────

/**
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - targetId: uuid — the farmer or buyer being viewed
 *  - targetName: string — for the modal title
 *  - mode: 'farmer' | 'buyer' | 'both'
 *    - 'farmer' → show reviews from ratings table (buyers rated this farmer)
 *    - 'buyer'  → show reviews from buyer_ratings table (farmers rated this buyer)
 *    - 'both'   → two-tab layout (own profile)
 *  - currentUserId: uuid | null — logged-in user
 */
export default function ReviewsModal({
  isOpen,
  onClose,
  targetId,
  targetName,
  mode = 'farmer',
  currentUserId = null,
}) {
  const [activeTab, setActiveTab] = useState(mode === 'both' ? 'farmer' : mode);
  const [farmerReviews, setFarmerReviews] = useState([]);
  const [buyerReviews, setBuyerReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!targetId || !isOpen) return;
    setLoading(true);
    try {
      if (mode === 'farmer' || mode === 'both') {
        const { data, error } = await supabase
          .from('ratings')
          .select(`
            id,
            rating,
            review,
            created_at,
            user_id,
            reviewer:profiles!ratings_user_id_fkey(
              id, full_name, username, avatar_url
            )
          `)
          .eq('farmer_id', targetId)
          .order('created_at', { ascending: false });

        if (!error) {
          // Normalise: attach reviewer_id for ownership check
          setFarmerReviews(
            (data || []).map((r) => ({ ...r, reviewer_id: r.user_id }))
          );
        }
      }

      if (mode === 'buyer' || mode === 'both') {
        const { data, error } = await supabase
          .from('buyer_ratings')
          .select(`
            id,
            rating,
            review,
            created_at,
            farmer_id,
            reviewer:profiles!buyer_ratings_farmer_id_fkey(
              id, full_name, username, avatar_url
            )
          `)
          .eq('buyer_id', targetId)
          .order('created_at', { ascending: false });

        if (!error) {
          setBuyerReviews(
            (data || []).map((r) => ({ ...r, reviewer_id: r.farmer_id }))
          );
        }
      }
    } catch (err) {
      console.error('ReviewsModal fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [targetId, isOpen, mode]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Reset tab when mode changes
  useEffect(() => {
    setActiveTab(mode === 'both' ? 'farmer' : mode);
  }, [mode]);

  const handleEdit = async (reviewId, newRating, newReview) => {
    const table = activeTab === 'farmer' ? 'ratings' : 'buyer_ratings';
    const { error } = await supabase
      .from(table)
      .update({ rating: newRating, review: newReview, updated_at: new Date().toISOString() })
      .eq('id', reviewId);

    if (error) {
      toast.error('Failed to update review');
      throw error;
    }
    toast.success('Review updated!');
    fetchReviews();
  };

  const handleDelete = async (reviewId) => {
    const table = activeTab === 'farmer' ? 'ratings' : 'buyer_ratings';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', reviewId);

    if (error) {
      toast.error('Failed to delete review');
      return;
    }
    toast.success('Review deleted');
    fetchReviews();
  };

  const reviews = activeTab === 'farmer' ? farmerReviews : buyerReviews;

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gray-50 rounded-xl sm:rounded-2xl w-full max-w-[95%] sm:max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[78vh] sm:max-h-[85vh]"
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="bg-green-800 p-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-white/80" />
                  <div>
                    <p className="text-white/70 text-xs">Reviews for</p>
                    <p className="text-white font-bold text-base leading-tight">{targetName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Average rating pill */}
              {avgRating && (
                <div className="mt-3 flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 w-fit">
                  <Star className="w-4 h-4 text-yellow-300 fill-current" />
                  <span className="text-white font-bold text-sm">{avgRating}</span>
                  <span className="text-white/70 text-xs">
                    ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>

            {/* ── Tabs (only for 'both' mode) ── */}
            {mode === 'both' && (
              <div className="flex bg-white border-b border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('farmer')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === 'farmer'
                      ? 'border-green-600 text-green-700 bg-green-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5" />
                  As Farmer
                  {farmerReviews.length > 0 && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {farmerReviews.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('buyer')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === 'buyer'
                      ? 'border-blue-600 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  As Buyer
                  {buyerReviews.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {buyerReviews.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* ── Review list ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No reviews yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Be the first to leave a review!
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isOwn={currentUserId && review.reviewer_id === currentUserId}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onClose={onClose}
                      currentUserId={currentUserId}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
