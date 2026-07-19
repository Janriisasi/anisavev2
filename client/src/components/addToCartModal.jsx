import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import { useCart } from '../contexts/cartContext';
import toast from 'react-hot-toast';

export default function AddToCartModal({ product, seller, onClose }) {
  const { addToCart, isInCart } = useCart();
  // Kept as a string while the person is typing so the field can be
  // cleared/edited normally instead of snapping back on every keystroke.
  const [quantityInput, setQuantityInput] = useState('1');
  const [loading, setLoading] = useState(false);

  const maxQty = product?.quantity_kg || 999;
  const alreadyInCart = isInCart(product?.id);
  const quantity = parseFloat(quantityInput) || 0;

  // Allow free typing (including a fully empty field) while blocking any
  // value that would exceed the seller's available stock.
  const handleQuantityTyping = (e) => {
    const val = e.target.value;

    // Only allow digits and a single decimal point while typing
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;

    const num = parseFloat(val);
    if (!isNaN(num) && num > maxQty) {
      toast.error(`Only ${maxQty} kg available`);
      return; // reject the keystroke, field stays at its last valid value
    }

    setQuantityInput(val);
  };

  // Once the person is done typing, snap back to a valid value
  const handleQuantityBlur = () => {
    const num = parseFloat(quantityInput);
    if (isNaN(num) || num < 0.5) {
      setQuantityInput('0.5');
    } else if (num > maxQty) {
      setQuantityInput(String(maxQty));
    } else {
      setQuantityInput(String(num));
    }
  };

  const adjustQuantity = (delta) => {
    const current = parseFloat(quantityInput) || 0;
    const next = Math.min(maxQty, Math.max(0.5, Number((current + delta).toFixed(1))));
    setQuantityInput(String(next));
  };

  const handleAdd = async () => {
    const num = parseFloat(quantityInput);
    if (isNaN(num) || num < 0.5) { toast.error('Enter a valid quantity'); return; }
    if (num > maxQty) { toast.error(`Only ${maxQty} kg available`); return; }

    setLoading(true);
    const { error } = await addToCart({ product, seller, quantityKg: num });
    setLoading(false);

    if (error) {
      toast.error('Failed to add to cart');
    } else {
      toast.success(`${product.name} added to cart!`);
      onClose();
    }
  };

  const totalPrice = parseFloat((quantity * (product?.price || 0)).toFixed(2));

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
          className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Product image */}
          <div className="relative">
            <img
              src={product?.image_url || '/placeholder.jpg'}
              alt={product?.name}
              className="w-full h-56 object-cover"
              onError={e => { e.target.src = '/placeholder.jpg'; }}
            />
          </div>

          <div className="p-5">
            {/* Product name + price */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-gray-900 text-2xl truncate">{product?.name}</h3>
              <p className="text-green-700 font-extrabold text-2xl whitespace-nowrap">
                ₱{product?.price}/kg
              </p>
            </div>

            {/* Farmer info + quantity */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={seller?.avatar_url || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seller?.username}`}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-200"
                />
                <span className="text-sm text-gray-600 font-medium truncate">
                  {seller?.full_name || seller?.username}
                </span>
              </div>
              <p className="text-gray-400 text-xs whitespace-nowrap flex-shrink-0">
                {maxQty} kg available
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Quantity</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => adjustQuantity(-0.5)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-200" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantityInput}
                  onChange={handleQuantityTyping}
                  onBlur={handleQuantityBlur}
                  className="w-12 text-center font-bold text-gray-800 focus:outline-none"
                />
                <div className="w-px h-6 bg-gray-200" />
                <button
                  onClick={() => adjustQuantity(0.5)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-right mb-5">kg (minimum 0.5 kg)</p>

            {/* Total */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-700 font-semibold">Estimated total:</span>
              <span className="text-green-700 font-extrabold text-xl">₱{totalPrice}</span>
            </div>

            {/* Note */}
            <p className="text-xs text-gray-400 text-center mb-5">
              Final price is negotiated with the farmer. This is just an estimate.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
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
                  alreadyInCart ? 'Update Cart' : 'Add to Cart'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}