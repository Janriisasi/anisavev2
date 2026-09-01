import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  MessageCircle,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  Loader2,
  MessageSquare,
  Send,
  Plus,
  Minus,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import supabase from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/cartContext";
import OrderConfirmModal from "../components/transactionConfirmModal";
import PostTransactionRatingModal from "../components/postTransactionRatingModal";
import toast from "react-hot-toast";
import usePullToRefresh from "../hooks/usePullToRefresh";
import PullToRefreshIndicator from "../components/pullToRefreshIndicator";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-gray-600",
    bg: "bg-gray-100",
    icon: <Clock className="w-4 h-4" />,
  },
  negotiating: {
    label: "Negotiating",
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: <MessageCircle className="w-4 h-4" />,
  },
  confirming: {
    label: "Sent to Farmer",
    color: "text-amber-600",
    bg: "bg-amber-100",
    icon: <Clock className="w-4 h-4" />,
  },
  approved: {
    label: "Approved",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  declined: {
    label: "Declined",
    color: "text-red-600",
    bg: "bg-red-100",
    icon: <XCircle className="w-4 h-4" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-500",
    bg: "bg-gray-100",
    icon: <XCircle className="w-4 h-4" />,
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
        {icon}
      </div>
      <h3 className="text-gray-600 font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      {action}
    </motion.div>
  );
}

function CartItemQuantityControl({ item, unit, updateQuantity }) {
  const isDiscreteUnit = ['piece', 'sack', 'tray', 'crate'].includes(unit);
  const step = isDiscreteUnit ? 1 : 0.5;
  const minQty = item.product_snapshot?.min_order
    ? Number(item.product_snapshot.min_order)
    : (item.products?.min_order ? Number(item.products.min_order) : step);
  const maxQty = item.products?.quantity_kg || 999;
  
  const [quantityInput, setQuantityInput] = useState(String(item.quantity_kg));
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setQuantityInput(String(item.quantity_kg));
  }, [item.quantity_kg]);

  const handleApply = async (num) => {
    if (num === item.quantity_kg) return;
    setIsUpdating(true);
    await updateQuantity(item.id, num);
    setIsUpdating(false);
  };

  const adjustQuantity = (delta) => {
    const current = parseFloat(quantityInput) || 0;
    if (delta < 0 && (current <= minQty || Number((current + delta).toFixed(1)) < minQty)) {
      toast.error(`Minimum order is ${minQty} ${unit}`, { id: `min-order-${item.id}` });
      setQuantityInput(String(minQty));
      handleApply(minQty);
      return;
    }
    if (delta > 0 && (current >= maxQty || Number((current + delta).toFixed(1)) > maxQty)) {
      toast.error(`Only ${maxQty} ${unit} available`, { id: `max-order-${item.id}` });
      setQuantityInput(String(maxQty));
      handleApply(maxQty);
      return;
    }
    const next = Math.min(maxQty, Math.max(minQty, Number((current + delta).toFixed(1))));
    setQuantityInput(String(next));
    handleApply(next);
  };

  const handleTyping = (e) => {
    const val = e.target.value;
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
    const num = parseFloat(val);
    if (!isNaN(num) && num > maxQty) {
      toast.error(`Only ${maxQty} ${unit} available`, { id: `max-order-${item.id}` });
      return;
    }
    setQuantityInput(val);
  };

  const handleBlur = () => {
    const num = parseFloat(quantityInput);
    let next = num;
    if (isNaN(num) || num < minQty) {
      toast.error(`Minimum order is ${minQty} ${unit}`, { id: `min-order-${item.id}` });
      next = minQty;
    } else if (num > maxQty) {
      toast.error(`Only ${maxQty} ${unit} available`, { id: `max-order-${item.id}` });
      next = maxQty;
    }
    setQuantityInput(String(next));
    handleApply(next);
  };

  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm mt-0.5">
      <button
        onClick={() => adjustQuantity(-step)}
        disabled={isUpdating}
        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Minus className="w-3 h-3" />
      </button>
      <div className="w-px h-4 bg-gray-200" />
      <input
        type="text"
        inputMode="decimal"
        value={quantityInput}
        onChange={handleTyping}
        onBlur={handleBlur}
        disabled={isUpdating}
        className="w-10 text-center text-xs font-bold text-gray-800 focus:outline-none disabled:bg-gray-50"
      />
      <div className="w-px h-4 bg-gray-200" />
      <button
        onClick={() => adjustQuantity(step)}
        disabled={isUpdating}
        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function CartPage() {
  const { user } = useAuth();
  const {
    cartItems,
    loading: cartLoading,
    removeFromCart,
    fetchCart,
    ensureCartLoaded,
    updateQuantity,
  } = useCart();
  const navigate = useNavigate();

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "cart",
  );
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [ratingModal, setRatingModal] = useState(null); // { farmerId, farmerName, farmerAvatar, orderId, orderSnapshot }
  const [actionLoading, setActionLoading] = useState(null);

  // Load cart data when page mounts
  useEffect(() => {
    ensureCartLoaded?.();
  }, [ensureCartLoaded]);

  const goToSellerProfile = (sellerId) => {
    if (sellerId) {
      navigate(`/farmer/${sellerId}`);
    }
  };

  const goToProductSellers = (productName) => {
    if (productName) {
      navigate(`/product/${encodeURIComponent(productName)}/sellers`);
    }
  };

  const handleOrderReceived = async (order) => {
    setActionLoading(order.id);
    try {
      // Guard enforced in the DB (not just here client-side): only
      // completes if still 'approved'. Without this, a stale re-approval
      // (e.g. clicking Approve again from the chat card) can flip a
      // completed order back to 'approved' and let this button reappear —
      // this makes a second "Order Received" a no-op instead of
      // re-completing and re-notifying the farmer.
      const { data, error } = await supabase.rpc("mark_order_received", {
        p_order_id: order.id,
      });

      if (error) {
        if (error.message?.includes("not currently approved")) {
          toast.error("This order has already been marked received.");
          fetchOrders();
          return;
        }
        throw error;
      }

      // Notify the farmer that the buyer received the order
      await supabase.rpc("create_notification", {
        p_user_id: order.seller_id,
        p_type: "order_received",
        p_title: "Order Received by Buyer",
        p_message: `${user.user_metadata?.full_name || "The buyer"} has confirmed receiving ${order.quantity_kg} ${order.product_snapshot?.unit || 'kg'} of ${order.product_snapshot?.name}. The order is now complete!`,
        p_data: {
          order_id: order.id,
          product_name: order.product_snapshot?.name,
          quantity_kg: order.quantity_kg,
          total_amount: order.total_amount,
        },
      });

      toast.success("Order completed successfully!");

      // Prompt buyer to rate the farmer
      setRatingModal({
        farmerId: order.seller_id,
        farmerName: order.seller?.full_name || order.seller?.username,
        farmerAvatar: order.seller?.avatar_url || null,
        orderId: order.id,
        orderSnapshot: {
          name: order.product_snapshot?.name,
          quantity_kg: order.quantity_kg,
          total_amount: order.total_amount,
        },
      });
      fetchOrders();
    } catch (err) {
      console.error("Order received error:", err);
      toast.error("Failed to update order status");
    } finally {
      setActionLoading(null);
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          seller:profiles!orders_seller_id_fkey(id, full_name, username, avatar_url, contact_number),
          product:products(id, name, image_url, category, unit)
        `,
        )
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Orders fetch error:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab !== "cart") fetchOrders();
  }, [activeTab, fetchOrders]);

  // Pulling down refreshes whichever tab is currently showing — the cart
  // itself, or the order history list.
  const { pullDistance, refreshing, threshold } = usePullToRefresh({
    onRefresh: () => (activeTab === "cart" ? fetchCart?.() : fetchOrders()),
  });

  // Realtime for orders
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("buyer-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `buyer_id=eq.${user.id}`,
        },
        () => fetchOrders(),
      )
      .subscribe();
    return () => channel.unsubscribe();
  }, [user, fetchOrders]);

  const handleRemove = async (itemId) => {
    setRemovingId(itemId);
    const { error } = await removeFromCart(itemId);
    setRemovingId(null);
    if (error) toast.error("Failed to remove item");
    else toast.success("Item removed from cart");
  };

  const openChat = (seller, product) => {
    supabase
      .rpc("get_or_create_conversation", { other_user_id: seller.id })
      .then(({ data: convId }) => {
        if (!convId) return;
        supabase
          .from("conversations")
          .select(
            `
        *,
        participant_1_profile:profiles!conversations_participant_1_fkey(id, username, full_name, avatar_url),
        participant_2_profile:profiles!conversations_participant_2_fkey(id, username, full_name, avatar_url)
      `,
          )
          .eq("id", convId)
          .single()
          .then(({ data: conv }) => {
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
          });
      });
  };

  const recentOrders = orders.filter((o) =>
    ["confirming", "negotiating", "pending"].includes(o.status),
  );
  const historyOrders = orders.filter((o) =>
    ["approved", "completed", "declined", "cancelled"].includes(o.status),
  );

  const tabs = [
    {
      key: "cart",
      label: "Cart",
      icon: <ShoppingCart className="w-4 h-4" />,
      count: cartItems.length,
    },
    {
      key: "orders",
      label: "Orders",
      icon: <Clock className="w-4 h-4" />,
      count: recentOrders.length,
    },
    {
      key: "history",
      label: "History",
      icon: <Package className="w-4 h-4" />,
      count: null,
    },
  ];

  // Group cart by seller
  const cartBySeller = cartItems.reduce((acc, item) => {
    const sid = item.seller_id;
    if (!acc[sid]) acc[sid] = { seller: item.seller, items: [] };
    acc[sid].items.push(item);
    return acc;
  }, {});

  /**
   * Renders the action area for a single cart item.
   * "Send Request" button + secondary chat option.
   */
  const renderItemActions = (item) => {
    const availableQty = item.products?.quantity_kg || 0;
    const isAvailable = item.products?.status === 'Available' && availableQty >= item.quantity_kg;
    const isSoldOut = item.products?.status !== 'Available' || availableQty <= 0;

    return (
      <div className="space-y-2 mt-2">
        {isSoldOut ? (
          <div className="w-full text-center text-red-600 font-bold bg-red-50 py-2.5 rounded-xl text-sm border border-red-100 uppercase tracking-wide">
            Sold Out
          </div>
        ) : !isAvailable ? (
          <div className="w-full text-center text-amber-600 font-bold bg-amber-50 py-2.5 rounded-xl text-sm border border-amber-100">
            Not enough stock (Only {availableQty} left)
          </div>
        ) : (
          <motion.button
            onClick={() => setConfirmItem(item)}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
            Send Order Request
          </motion.button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        refreshing={refreshing}
        threshold={threshold}
      />
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center md:justify-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
              My Cart & Orders
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? "border-green-700 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${
                      activeTab === tab.key
                        ? "bg-green-700 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div data-tutorial="cart-main" className="max-w-7xl mx-auto px-4 py-6 flex-1 flex flex-col w-full">
        <AnimatePresence mode="wait">
          {/* ── CART TAB ── */}
          {activeTab === "cart" && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {cartLoading && cartItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              ) : cartItems.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart className="w-10 h-10" />}
                  title="Your cart is empty"
                  description="Browse products and add items to your cart."
                  action={
                    <button
                      onClick={() => navigate("/categories")}
                      className="bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-800 transition-colors"
                    >
                      Browse Products
                    </button>
                  }
                />
              ) : (
                <div className="space-y-6">
                  {Object.values(cartBySeller).map(({ seller, items }) => {
                    const groupTotal = items.reduce((s, i) => {
                      const availableQty = i.products?.quantity_kg || 0;
                      const isSoldOut =
                        i.products?.status !== "Available" || availableQty <= 0;
                      if (isSoldOut) return s;
                      return s + i.quantity_kg * i.price_at_add;
                    }, 0);
                    return (
                      <motion.div
                        key={seller?.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        {/* Seller header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <div
                            onClick={() => goToSellerProfile(seller?.id)}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
                          >
                            <img
                              src={
                                seller?.avatar_url ||
                                `https://api.dicebear.com/9.x/dylan/svg?seed=${seller?.username}`
                              }
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border-2 border-green-100 group-hover:border-green-300 transition-colors"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate group-hover:text-green-700 transition-colors">
                                {seller?.full_name || seller?.username}
                              </p>
                              <p className="text-xs text-gray-500 group-hover:text-green-600 transition-colors">
                                @{seller?.username}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => openChat(seller, items[0])}
                            className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Chat
                          </button>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-gray-50">
                          {items.map((item) => {
                            const snap = item.product_snapshot || {};
                            const unit = snap.unit || item.products?.unit || 'kg';
                            const prodName = snap.name || item.products?.name;
                            const itemTotal = (
                              item.quantity_kg * item.price_at_add
                            ).toFixed(2);
                            return (
                              <div key={item.id} className="px-4 py-4">
                                {/* Product row */}
                                <div className="flex items-center gap-3 mb-3">
                                  <img
                                    src={
                                      snap.image_url ||
                                      item.products?.image_url ||
                                      "/placeholder.jpg"
                                    }
                                    alt={prodName}
                                    onClick={() => goToProductSellers(prodName)}
                                    className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                                    onError={(e) => {
                                      e.target.src = "/placeholder.jpg";
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      onClick={() => goToProductSellers(prodName)}
                                      className="font-semibold text-gray-800 truncate cursor-pointer hover:text-green-700 transition-colors"
                                    >
                                      {prodName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {snap.category}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-green-700 font-bold">
                                          ₱{item.price_at_add}/{unit}
                                        </span>
                                        <div className="flex items-center gap-1.5 ml-1">
                                          <CartItemQuantityControl item={item} unit={unit} updateQuantity={updateQuantity} />
                                          <span className="text-xs text-gray-500">{unit}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <p className="font-bold text-gray-800">
                                      ₱{itemTotal}
                                    </p>
                                    <button
                                      onClick={() => handleRemove(item.id)}
                                      disabled={removingId === item.id}
                                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      {removingId === item.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Action area per item */}
                                {renderItemActions(item)}
                              </div>
                            );
                          })}
                        </div>

                        {/* Group subtotal footer */}
                        <div className="flex items-center justify-between px-4 py-3 bg-green-50 border-t border-green-100">
                          <div>
                            <p className="text-xs text-gray-500">
                              Estimated subtotal
                            </p>
                            <p className="font-bold text-green-800 text-lg">
                              ₱{groupTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  <p className="text-xs text-center text-gray-400 pb-4">
                    Prices are estimates. Final amount is agreed upon with the
                    farmer.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {ordersLoading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              ) : recentOrders.length === 0 ? (
                <EmptyState
                  icon={<Clock className="w-10 h-10" />}
                  title="No active orders"
                  description="Checkout items from your cart to start an order."
                  action={
                    <button
                      onClick={() => setActiveTab("cart")}
                      className="text-green-700 font-semibold text-sm hover:underline"
                    >
                      Go to Cart
                    </button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order, i) => {
                    const snap = order.product_snapshot || {};
                    const seller = order.seller;
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <img
                              src={snap.image_url || "/placeholder.jpg"}
                              alt={snap.name || order.product?.name}
                              onClick={() => goToProductSellers(snap.name || order.product?.name)}
                              className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                              onError={(e) => {
                                e.target.src = "/placeholder.jpg";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p
                                    onClick={() => goToProductSellers(snap.name || order.product?.name)}
                                    className="font-bold text-gray-800 cursor-pointer hover:text-green-700 transition-colors"
                                  >
                                    {snap.name || order.product?.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {snap.category}
                                  </p>
                                </div>
                                <StatusBadge status={order.status} />
                              </div>
                              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                                <span className="text-gray-600">
                                  {order.quantity_kg} {snap.unit || 'kg'}
                                </span>
                                <span className="text-gray-400">·</span>
                                <span className="text-green-700 font-semibold">
                                  ₱{order.total_amount}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Seller + timestamp */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                            <div
                              onClick={() => goToSellerProfile(seller?.id || order.seller_id)}
                              className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-green-700 transition-colors group"
                            >
                              <img
                                src={
                                  seller?.avatar_url ||
                                  `https://api.dicebear.com/9.x/dylan/svg?seed=${seller?.username}`
                                }
                                alt=""
                                className="w-5 h-5 rounded-full object-cover group-hover:opacity-85 transition-opacity"
                              />
                              <span className="group-hover:underline">
                                {seller?.full_name || seller?.username}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(
                                  new Date(order.created_at),
                                  { addSuffix: true },
                                )}
                              </span>
                              <button
                                onClick={() => openChat(seller, order)}
                                className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium bg-green-50 px-2 py-1 rounded-lg"
                              >
                                <MessageCircle className="w-3 h-3" />
                                Chat
                              </button>
                            </div>
                          </div>
                        </div>

                        {order.status === "confirming" && (
                          <div className="px-4 pb-3">
                            <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg text-xs text-amber-700">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              Waiting for farmer to review your request.
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {ordersLoading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              ) : historyOrders.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-10 h-10" />}
                  title="No order history yet"
                  description="Your completed and declined orders will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {historyOrders.map((order, i) => {
                    const snap = order.product_snapshot || {};
                    const seller = order.seller;
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
                          order.status === "approved"
                            ? "border-green-100"
                            : "border-gray-100"
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <img
                              src={snap.image_url || "/placeholder.jpg"}
                              alt={snap.name || order.product?.name}
                              onClick={() => goToProductSellers(snap.name || order.product?.name)}
                              className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                              onError={(e) => {
                                e.target.src = "/placeholder.jpg";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p
                                    onClick={() => goToProductSellers(snap.name || order.product?.name)}
                                    className="font-bold text-gray-800 cursor-pointer hover:text-green-700 transition-colors"
                                  >
                                    {snap.name || order.product?.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {snap.category}
                                  </p>
                                </div>
                                <StatusBadge status={order.status} />
                              </div>
                              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                                <span className="text-gray-600">
                                  {order.quantity_kg} {snap.unit || 'kg'}
                                </span>
                                <span className="text-gray-400">·</span>
                                <span
                                  className={`font-semibold ${order.status === "approved" ? "text-green-700" : "text-gray-600"}`}
                                >
                                  ₱{order.total_amount}
                                </span>
                              </div>
                              {order.decline_reason && (
                                <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                                  Reason: {order.decline_reason}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                            <div
                              onClick={() => goToSellerProfile(seller?.id || order.seller_id)}
                              className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-green-700 transition-colors group"
                            >
                              <img
                                src={
                                  seller?.avatar_url ||
                                  `https://api.dicebear.com/9.x/dylan/svg?seed=${seller?.username}`
                                }
                                alt=""
                                className="w-5 h-5 rounded-full object-cover group-hover:opacity-85 transition-opacity"
                              />
                              <span className="group-hover:underline">
                                {seller?.full_name || seller?.username}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">
                                {format(
                                  new Date(
                                    order.updated_at || order.created_at,
                                  ),
                                  "MMM d, yyyy",
                                )}
                              </span>
                              {order.status === "approved" && (
                                <button
                                  onClick={() => handleOrderReceived(order)}
                                  disabled={actionLoading === order.id}
                                  className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 font-medium transition-colors disabled:opacity-60"
                                >
                                  {actionLoading === order.id
                                    ? "Loading..."
                                    : "Order Received"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Confirm Modal */}
      {confirmItem && (
        <OrderConfirmModal
          cartItem={confirmItem}
          onClose={() => setConfirmItem(null)}
          onSuccess={() => {
            fetchCart();
            setActiveTab("orders");
          }}
        />
      )}

      {/* Post-transaction rating modal — buyer rates the farmer */}
      <PostTransactionRatingModal
        isOpen={!!ratingModal}
        onClose={() => setRatingModal(null)}
        mode="rate_farmer"
        targetId={ratingModal?.farmerId}
        targetName={ratingModal?.farmerName}
        targetAvatar={ratingModal?.farmerAvatar}
        orderId={ratingModal?.orderId}
        orderSnapshot={ratingModal?.orderSnapshot}
      />
    </div>
  );
}