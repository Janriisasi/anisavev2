import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Package, Minus, Plus } from 'lucide-react';
import { useCart } from '../contexts/cartContext';
import toast from 'react-hot-toast';

export default function AddToCartModal({ product, seller, onClose }) {
  const { addToCart, isInCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const maxQty = product?.quantity_kg || 999;
  const alreadyInCart = isInCart(product?.id);

  const handleQuantityChange = (val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0.5) return;
    if (num > maxQty) { toast.error(`Only ${maxQty} kg available`); return; }
    setQuantity(num);
  };

  const handleAdd = async () => {
    if (quantity <= 0) { toast.error('Enter a valid quantity'); return; }
    if (quantity > maxQty) { toast.error(`Only ${maxQty} kg available`); return; }

    setLoading(true);
    const { error } = await addToCart({ product, seller, quantityKg: quantity });
    setLoading(false);

    if (error) {
      toast.error('Failed to add to cart');
    } else {
      toast.success(`${product.name} added to cart!`);
      onClose();
    }
  };

  const totalPrice = (quantity * (product?.price || 0)).toFixed(2);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-800 to-green-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="font-bold text-white">Add to Cart</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="p-5">
            {/* Product info */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
              <img
                src={product?.image_url || '/placeholder.jpg'}
                alt={product?.name}
                className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                onError={e => { e.target.src = '/placeholder.jpg'; }}
              />
              <div className="min-w-0">
                <p className="font-bold text-gray-800 truncate">{product?.name}</p>
                <p className="text-green-700 font-semibold text-sm">₱{product?.price}/kg</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <Package className="w-3 h-3" />
                  <span>{maxQty} kg available</span>
                </div>
              </div>
            </div>

            {/* Seller */}
            <div className="flex items-center gap-2 mb-5 text-sm text-gray-600">
              <img
                src={seller?.avatar_url || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seller?.username}`}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
              <span>Sold by <span className="font-semibold text-gray-800">{seller?.full_name || seller?.username}</span></span>
            </div>

            {/* Quantity input */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How many kilograms do you want? <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(Math.max(0.5, quantity - 0.5))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => handleQuantityChange(e.target.value)}
                  min={0.5}
                  max={maxQty}
                  step={0.5}
                  className="flex-1 text-center border-2 border-gray-200 focus:border-green-500 rounded-xl py-2.5 font-bold text-lg focus:outline-none transition-colors"
                />
                <button
                  onClick={() => handleQuantityChange(Math.min(maxQty, quantity + 0.5))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-1.5">kg (minimum 0.5 kg)</p>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl mb-5 border border-green-100">
              <span className="text-sm text-gray-600 font-medium">Estimated total</span>
              <span className="text-lg font-bold text-green-800">₱{totalPrice}</span>
            </div>

            {/* Note */}
            <p className="text-xs text-gray-400 text-center mb-4">
              Final price is negotiated with the farmer. This is just an estimate.
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleAdd}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    {alreadyInCart ? 'Update Cart' : 'Add to Cart'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}