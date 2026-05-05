import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle } from 'lucide-react';
import RateFarmer from './rateFarmer';
import RateBuyer from './rateBuyer';

/**
 * PostTransactionRatingModal
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - mode: 'rate_farmer' | 'rate_buyer'
 *  - targetId: string  – farmerId when mode='rate_farmer', buyerId when mode='rate_buyer'
 *  - targetName: string – display name of the person being rated
 *  - targetAvatar: string | null
 *  - orderSnapshot: { name, quantity_kg, total_amount } – optional product info
 */
export default function PostTransactionRatingModal({
  isOpen,
  onClose,
  mode,
  targetId,
  targetName,
  targetAvatar,
  orderSnapshot,
}) {
  if (!isOpen) return null;

  const isFarmerMode = mode === 'rate_farmer';
  const title = isFarmerMode ? 'Rate your Farmer' : 'Rate your Buyer';
  const subtitle = isFarmerMode
    ? 'How was your experience with this farmer?'
    : 'How was this buyer to work with?';
  const avatarSeed = targetName?.replace(/\s+/g, '') || 'user';
  const avatarSrc = targetAvatar || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${avatarSeed}`;

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
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-green-800 to-green-600 p-5 relative">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={avatarSrc}
                    alt={targetName}
                    className="w-14 h-14 rounded-full object-cover border-3 border-white/40 shadow-lg"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${avatarSeed}`;
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-400 rounded-full p-0.5 border-2 border-white">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium mb-0.5">{title}</p>
                  <p className="text-white font-bold text-lg leading-tight">
                    {targetName || (isFarmerMode ? 'the Farmer' : 'the Buyer')}
                  </p>
                </div>
              </div>

              {/* Transaction summary */}
              {orderSnapshot && (
                <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 text-xs text-white/90 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-yellow-300 fill-current flex-shrink-0" />
                  <span>
                    Transaction for <strong>{orderSnapshot.name}</strong>
                    {orderSnapshot.quantity_kg ? ` · ${orderSnapshot.quantity_kg} kg` : ''}
                    {orderSnapshot.total_amount ? ` · ₱${orderSnapshot.total_amount}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* ── Body ── */}
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-4 text-center">{subtitle}</p>

              {isFarmerMode ? (
                <RateFarmer
                  farmerId={targetId}
                  onRatingSubmitted={onClose}
                  standalone={false}
                />
              ) : (
                <RateBuyer
                  buyerId={targetId}
                  onRatingSubmitted={onClose}
                  standalone={false}
                />
              )}

              <button
                onClick={onClose}
                className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
