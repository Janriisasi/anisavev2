import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Package, DollarSign, MessageCircle } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/authContext';
import toast from 'react-hot-toast';

export default function TransactionConfirmModal({ cartItem, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const product = cartItem?.products || {};
  const seller = cartItem?.seller || {};
  const snapshot = {
    name: cartItem?.product_snapshot?.name || product.name,
    image_url: cartItem?.product_snapshot?.image_url || product.image_url,
    category: cartItem?.product_snapshot?.category || product.category,
  };

  const total = (cartItem?.quantity_kg * cartItem?.price_at_add).toFixed(2);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // 1. Get or create conversation with the seller
      const { data: conversationId, error: convError } = await supabase
        .rpc('get_or_create_conversation', { other_user_id: seller.id });
      if (convError) throw convError;

      // 2. Create the order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: seller.id,
          product_id: cartItem.product_id,
          conversation_id: conversationId,
          quantity_kg: cartItem.quantity_kg,
          price_per_kg: cartItem.price_at_add,
          status: 'confirming',
          product_snapshot: snapshot,
          buyer_confirmed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (orderError) throw orderError;

      // 3. Notify the farmer
      await supabase.from('notifications').insert({
        user_id: seller.id,
        type: 'order_request',
        title: `New Transaction Request`,
        message: `A buyer wants to purchase ${cartItem.quantity_kg} kg of ${snapshot.name} for ₱${total}. Please check your Order Requests.`,
        data: {
          order_id: order.id,
          product_name: snapshot.name,
          quantity_kg: cartItem.quantity_kg,
          total_amount: parseFloat(total),
        },
      });

      // 4. Send an automated chat message into the conversation
      const { data: conv } = await supabase
        .from('conversations')
        .select('participant_1, participant_2')
        .eq('id', conversationId)
        .single();

      const recipientId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
      const msgContent = `[ORDER_CONFIRM:${JSON.stringify({
        order_id: order.id,
        product_id: cartItem.product_id,
        product_name: snapshot.name,
        quantity_kg: cartItem.quantity_kg,
        price_per_kg: cartItem.price_at_add,
        total_amount: parseFloat(total),
        image_url: snapshot.image_url,
      })}]\nI'd like to confirm my order of ${cartItem.quantity_kg} kg of ${snapshot.name} at ₱${cartItem.price_at_add}/kg. Total: ₱${total}. Please review my transaction request!`;

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: recipientId,
        content: msgContent,
        read: false,
      });

      // 5. Remove from cart
      await supabase.from('cart_items').delete().eq('id', cartItem.id).eq('buyer_id', user.id);

      toast.success('Transaction request sent to farmer!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Transaction confirm error:', err);
      toast.error('Failed to send confirmation. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-800 to-green-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-white" />
              <span className="font-bold text-white">Send Transaction Request</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Info banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">How this works:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
                <li>Your request is sent to the farmer via chat.</li>
                <li>The farmer reviews and approves or declines.</li>
                <li>Once approved, you'll receive a notification and inventory updates automatically.</li>
              </ol>
            </div>

            {/* Product summary */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <img
                src={snapshot.image_url || '/placeholder.jpg'}
                alt={snapshot.name}
                className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                onError={e => { e.target.src = '/placeholder.jpg'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">{snapshot.name}</p>
                <p className="text-xs text-gray-500">{snapshot.category}</p>
                <div className="flex gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Package className="w-3 h-3" />
                    <span>{cartItem?.quantity_kg} kg</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <DollarSign className="w-3 h-3" />
                    <span>₱{cartItem?.price_at_add}/kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <img
                src={seller?.avatar_url || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seller?.username}`}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
              <span>Sending to <span className="font-semibold text-gray-800">{seller?.full_name || seller?.username}</span></span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
              <span className="font-semibold text-gray-700">Estimated Total</span>
              <span className="text-xl font-bold text-green-800">₱{total}</span>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Final amount may change after negotiation with the farmer.
            </p>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleConfirm}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Send Request
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