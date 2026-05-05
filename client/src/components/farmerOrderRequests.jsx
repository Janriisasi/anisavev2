import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Package,
  DollarSign,
  Loader2,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import supabase from "../lib/supabase";
import { useAuth } from "../contexts/authContext";
import toast from "react-hot-toast";
import PostTransactionRatingModal from "./postTransactionRatingModal";

const STATUS_CONFIG = {
  confirming: { label: "Awaiting Review", color: "text-amber-700", bg: "bg-amber-100" },
  approved:   { label: "Approved", color: "text-green-700", bg: "bg-green-100" },
  completed:  { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-100" },
  declined:   { label: "Declined", color: "text-red-600", bg: "bg-red-100" },
  cancelled:  { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-100" },
};

function DeclineReasonModal({ onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[99999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-gray-800">Decline Order</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Optionally explain why you're declining:
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Stock no longer available, price changed..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            rows={3}
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={loading}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Decline
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function FarmerOrderRequests() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // order id being actioned
  const [declineModal, setDeclineModal] = useState(null); // order to decline
  const [filter, setFilter] = useState("confirming"); // 'confirming' | 'all'
  const [ratingModal, setRatingModal] = useState(null); // { buyerId, buyerName, buyerAvatar, orderSnapshot }

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          buyer:profiles!orders_buyer_id_fkey(id, full_name, username, avatar_url, contact_number),
          product:products(id, name, image_url, quantity_kg)
        `,
        )
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (filter === "confirming") {
        query = query.eq("status", "confirming");
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Farmer orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("farmer-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `seller_id=eq.${user.id}`,
        },
        () => fetchOrders(),
      )
      .subscribe();
    return () => ch.unsubscribe();
  }, [user, fetchOrders]);

  const handleApprove = async (order) => {
    setActionLoading(order.id);
    try {
      // 1. Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "approved",
          seller_responded_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      if (updateError) throw updateError;

      // 2. Decrement inventory and update status if out of stock
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('quantity_kg, status')
        .eq('id', order.product_id)
        .single();
      
      if (!productError && productData) {
        const currentQty = parseFloat(productData.quantity_kg) || 0;
        const newQuantity = Math.max(0, currentQty - order.quantity_kg);
        const newStatus = newQuantity === 0 ? 'Unavailable' : productData.status;

        const { error: invError } = await supabase
          .from('products')
          .update({
             quantity_kg: newQuantity,
             status: newStatus
          })
          .eq('id', order.product_id);
          
        if (invError) console.error("Inventory update error:", invError);
      } else {
        console.error("Could not fetch product for inventory update");
      }

      // 3. Notify the buyer
      await supabase.rpc("create_notification", {
        p_user_id: order.buyer_id,
        p_type: "order_approved",
        p_title: "🎉 Order Approved!",
        p_message: `Your order of ${order.quantity_kg} kg of ${order.product_snapshot?.name} has been approved by the farmer. Total: ₱${order.total_amount}.`,
        p_data: {
          order_id: order.id,
          product_name: order.product_snapshot?.name,
        },
      });

      // 4. Optimistically update local state — no fetchOrders() needed,
      //    the realtime sub will sync the rest.
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: "approved",
                seller_responded_at: new Date().toISOString(),
              }
            : o,
        ),
      );

      toast.success("Order approved! Inventory updated.");

      // Prompt farmer to rate the buyer
      setRatingModal({
        buyerId: order.buyer_id,
        buyerName: order.buyer?.full_name || order.buyer?.username,
        buyerAvatar: order.buyer?.avatar_url || null,
        orderSnapshot: {
          name: order.product_snapshot?.name,
          quantity_kg: order.quantity_kg,
          total_amount: order.total_amount,
        },
      });
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("Failed to approve order");
      fetchOrders(); // re-sync on failure
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (order, reason) => {
    setActionLoading(order.id);
    try {
      await supabase
        .from("orders")
        .update({
          status: "declined",
          decline_reason: reason || null,
          seller_responded_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      await supabase.rpc("create_notification", {
        p_user_id: order.buyer_id,
        p_type: "order_declined",
        p_title: "Order Declined",
        p_message: `Your order of ${order.quantity_kg} kg of ${order.product_snapshot?.name} was declined.${reason ? ` Reason: ${reason}` : ""}`,
        p_data: {
          order_id: order.id,
          product_name: order.product_snapshot?.name,
          reason,
        },
      });

      toast.success("Order declined.");
      setDeclineModal(null);
      fetchOrders();
    } catch (err) {
      console.error("Decline error:", err);
      toast.error("Failed to decline order");
    } finally {
      setActionLoading(null);
    }
  };

  const openBuyerChat = async (buyerId, order) => {
    const { data: convId } = await supabase.rpc("get_or_create_conversation", {
      other_user_id: buyerId,
    });
    if (!convId) return;
    const { data: conv } = await supabase
      .from("conversations")
      .select(
        `
      *,
      participant_1_profile:profiles!conversations_participant_1_fkey(id, username, full_name, avatar_url),
      participant_2_profile:profiles!conversations_participant_2_fkey(id, username, full_name, avatar_url)
    `,
      )
      .eq("id", convId)
      .single();
    if (!conv) return;
    const otherParticipant =
      conv.participant_1 === user.id
        ? conv.participant_2_profile
        : conv.participant_1_profile;
    window.dispatchEvent(
      new CustomEvent("openChat", {
        detail: {
          conversationData: {
            ...conv,
            otherParticipant,
            lastMessage: null,
            unreadCount: 0,
          },
          productContext: null,
        },
      }),
    );
  };

  const pendingCount = orders.filter((o) => o.status === "confirming").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-700" />
            Order Requests
          </h2>
          {pendingCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center"
            >
              {pendingCount}
            </motion.span>
          )}
        </div>
        {/* Filter toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setFilter("confirming")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "confirming"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "all"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-gray-100">
          <ShoppingBag className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === "confirming"
              ? "No pending requests"
              : "No order requests yet"}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {filter === "confirming"
              ? "All caught up!"
              : "Buyers will appear here when they request your products."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const snap = order.product_snapshot || {};
            const buyer = order.buyer;
            const isPending = order.status === "confirming";
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirming;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${
                  isPending ? "border-amber-200" : "border-gray-100"
                }`}
              >
                {isPending && (
                  <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                )}

                <div className="p-4">
                  {/* Product + status */}
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={snap.image_url || "/placeholder.jpg"}
                      alt={snap.name}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-gray-800 truncate">
                          {snap.name}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color} ${cfg.bg}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Package className="w-3.5 h-3.5" />
                          <span>{order.quantity_kg} kg</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>₱{order.price_per_kg}/kg</span>
                        </div>
                        <span className="font-bold text-green-700">
                          Total: ₱{order.total_amount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buyer info */}
                  <div className="flex items-center justify-between py-2.5 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          buyer?.avatar_url ||
                          `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${buyer?.username}`
                        }
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {buyer?.full_name || buyer?.username}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(order.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openBuyerChat(buyer?.id, order)}
                      className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat
                    </button>
                  </div>

                  {/* Action buttons — only for pending */}
                  {isPending && (
                    <div className="flex gap-2 mt-2">
                      <motion.button
                        onClick={() => handleApprove(order)}
                        disabled={actionLoading === order.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                      >
                        {actionLoading === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        onClick={() => setDeclineModal(order)}
                        disabled={actionLoading === order.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </motion.button>
                    </div>
                  )}

                  {order.decline_reason && (
                    <div className="mt-2 p-2.5 bg-red-50 rounded-xl text-xs text-red-600 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>Reason: {order.decline_reason}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Decline reason modal */}
      {declineModal && (
        <DeclineReasonModal
          onConfirm={(reason) => handleDecline(declineModal, reason)}
          onCancel={() => setDeclineModal(null)}
          loading={actionLoading === declineModal?.id}
        />
      )}

      {/* Post-transaction rating modal — farmer rates the buyer */}
      <PostTransactionRatingModal
        isOpen={!!ratingModal}
        onClose={() => setRatingModal(null)}
        mode="rate_buyer"
        targetId={ratingModal?.buyerId}
        targetName={ratingModal?.buyerName}
        targetAvatar={ratingModal?.buyerAvatar}
        orderSnapshot={ratingModal?.orderSnapshot}
      />
    </div>
  );
}
