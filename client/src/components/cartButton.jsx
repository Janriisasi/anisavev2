import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/cartContext';
import { useAuth } from '../contexts/authContext';

export default function CartButton({ mobileMenu = false }) {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  if (!user) return null;

  if (mobileMenu) {
    return (
      <motion.button
        onClick={() => navigate('/cart')}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-between text-white hover:text-gray-300 py-3 font-medium text-lg transition-all duration-200 hover:translate-x-1 hover:drop-shadow-lg"
      >
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-5 h-5" />
          <span>My Cart</span>
        </div>
        {cartCount > 0 && (
          <span className="bg-yellow-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={() => navigate('/cart')}
      className="relative p-2 bg-green-800 hover:bg-green-700 rounded-full transition-all duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="My Cart"
    >
      <ShoppingCart className="w-5 h-5 text-white" />
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
          >
            {cartCount > 99 ? '99+' : cartCount}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}