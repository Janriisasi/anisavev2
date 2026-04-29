import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Circle, ShoppingBag, X, MoreVertical, UserPlus, UserMinus, Trash2, ImageIcon, Star } from 'lucide-react';
import { compressImage } from '../utils/imageCompression';

import { formatDistanceToNow } from 'date-fns';
import supabase from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from './deleteConfirmation';
import PostTransactionRatingModal from './postTransactionRatingModal';


// How old last_activity can be before we treat the user as offline (must match usePresence.js)
const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

function isPresenceOnline(presence) {
  if (!presence?.is_online) return false;
  if (!presence?.last_activity) return false;
  const age = Date.now() - new Date(presence.last_activity).getTime();
  return age < STALE_THRESHOLD_MS;
}

export default function ChatWindow({ conversation, onBack, onUnreadChange, productContext = null }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [presenceData, setPresenceData] = useState(null); // full presence row
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const otherTypingTimeoutRef = useRef(null);
  const typingChannelRef = useRef(null);
  const inputRef = useRef(null);
  const channelsRef = useRef([]);
  // Product context card — shown at top of chat when opened from a product
  const [shownProductContext, setShownProductContext] = useState(productContext);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null); // { file, previewUrl }
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);


  // Keep context in sync if the prop changes (e.g. user opens another product chat)
  useEffect(() => {
    setShownProductContext(productContext);
  }, [productContext]);

  const otherUser = conversation.otherParticipant;
  const isOnline = isPresenceOnline(presenceData);

  // ─── Cleanup helper ──────────────────────────────────────────────────────────
  const cleanupChannels = useCallback(() => {
    channelsRef.current.forEach(ch => ch.unsubscribe());
    channelsRef.current = [];
  }, []);

  // ─── Main setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversation || !user) return;

    fetchMessages();
    markAsRead();
    fetchPresence();
    checkIfSaved();

    // Close menu when clicking outside
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // ── 1. Real-time messages ─────────────────────────────────────────────────
    // IMPORTANT: We intentionally omit the `filter` from postgres_changes.
    // Supabase row-level filters on realtime require the filtered column to be
    // part of the table's REPLICA IDENTITY — if it isn't, the subscription
    // silently receives nothing. By listening to ALL inserts on the messages
    // table and filtering in JS, we guarantee delivery regardless of DB config.

    const msgChannel = supabase
      .channel(`chat-messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // NO filter here — we filter in the callback instead
        },
        (payload) => {
          const incoming = payload.new;

          // JS-side filter: only messages for this conversation
          if (incoming.conversation_id !== conversation.id) return;

          // Skip own messages — already added optimistically in sendMessage
          if (incoming.sender_id === user.id) return;

          setMessages(prev => {
            if (prev.find(m => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });

          markAsRead();
          scrollToBottom();
        }
      )
      .subscribe((status) => {
        console.log('Chat realtime status:', status);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime channel failed — starting polling fallback');
          startPollingFallback();
        }
      });

    channelsRef.current.push(msgChannel);

    // Always-on polling safety net (every 4 s) — catches any messages that
    // slip through if realtime is flaky. Deduplication prevents duplicates.
    startPollingFallback();

    // ── 2. Presence updates ───────────────────────────────────────────────────
    const presenceChannel = supabase
      .channel(`presence-watch:${otherUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${otherUser.id}`,
        },
        (payload) => {
          setPresenceData(payload.new);
        }
      )
      .subscribe();

    channelsRef.current.push(presenceChannel);

    // ── 3. Typing indicators ──────────────────────────────────────────────────
    const typingChannel = supabase.channel(`typing:${conversation.id}`, {
      config: {
        broadcast: { ack: false }
      }
    });

    typingChannelRef.current = typingChannel;

    typingChannel
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          if (payload.payload?.user_id && payload.payload.user_id !== user.id) {
            setOtherUserTyping(payload.payload.is_typing);
            if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
            if (payload.payload.is_typing) {
              otherTypingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
            }
          }
        }
      )
      .subscribe();

    channelsRef.current.push(typingChannel);

    // ── 4. Refresh presence every 30 s to catch stale records ─────────────────
    const presenceTimer = setInterval(fetchPresence, 30_000);

    return () => {
      cleanupChannels();
      clearInterval(presenceTimer);
      stopPollingFallback();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [conversation.id, user?.id]); // stable deps — avoids re-subscribing on every render


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── Polling fallback (used only if realtime subscription errors) ────────────
  const pollIntervalRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const startPollingFallback = () => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });
        if (!data) return;
        // Merge: add any messages not already in state (dedup by id)
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newOnes = data.filter(m => !existingIds.has(m.id));
          if (newOnes.length === 0) return prev;
          // scroll only when there are actually new messages
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
          return [...prev, ...newOnes];
        });
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 4000); // every 4 s
  };

  const stopPollingFallback = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // ─── Data fetchers ────────────────────────────────────────────────────────────
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Hydrate actedOrders from DB so approve/decline state survives refresh.
      // Collect all order_ids referenced in ORDER_CONFIRM messages in this chat.
      const orderIds = [];
      for (const msg of data || []) {
        if (msg.content.startsWith('[ORDER_CONFIRM:')) {
          try {
            const jsonStr = msg.content.split(']\n')[0].replace('[ORDER_CONFIRM:', '');
            const parsed = JSON.parse(jsonStr);
            if (parsed.order_id) orderIds.push(parsed.order_id);
          } catch {}
        }
      }
      if (orderIds.length > 0) {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status')
          .in('id', orderIds);
        if (orders) {
          const map = {};
          for (const o of orders) {
            if (o.status === 'approved' || o.status === 'declined') {
              map[o.id] = o.status;
            }
          }
          setActedOrders(map);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchPresence = async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', otherUser.id)
        .single();

      if (error) {
        setPresenceData(null);
        return;
      }
      setPresenceData(data);
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  };

  const checkIfSaved = async () => {
    if (!user || !otherUser) return;
    try {
      const { data } = await supabase
        .from('saved_contacts')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('farmer_id', otherUser.id)
        .maybeSingle();
      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking contact status:', error);
    }
  };

  const handleSaveContact = async () => {
    if (!user || !otherUser) return;
    if (actionLoading) return;

    try {
      setActionLoading(true);
      if (isSaved) {
        const { error } = await supabase
          .from('saved_contacts')
          .delete()
          .eq('buyer_id', user.id)
          .eq('farmer_id', otherUser.id);
        
        if (error) throw error;
        setIsSaved(false);
        toast.success('Contact removed');
      } else {
        // ✅ Fetch other user's contact info first, then store snapshot
        const { data: farmerProfile } = await supabase
          .from('profiles')
          .select('contact_number, address')
          .eq('id', otherUser.id)
          .single();

        const { error } = await supabase
          .from('saved_contacts')
          .insert({
            buyer_id: user.id,
            farmer_id: otherUser.id,
            contact_number: farmerProfile?.contact_number || null,
            address: farmerProfile?.address || null,
          });
        
        if (error) throw error;
        setIsSaved(true);
        toast.success('Contact saved');
      }
    } catch (error) {
      console.error('Error toggling contact save:', error);
      toast.error('Failed to update contact');
    } finally {
      setActionLoading(false);
      setShowMenu(false);
    }
  };

  const handleDeleteChat = async () => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation.id);

      if (error) throw error;
      
      toast.success('Chat deleted');
      onBack();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete chat');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
      setShowMenu(false);
    }
  };


  const markAsRead = async () => {

    try {
      await supabase.rpc('mark_conversation_as_read', { conv_id: conversation.id });
      const { data } = await supabase.rpc('get_unread_count');
      if (onUnreadChange) onUnreadChange(data || 0);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // ─── Typing ───────────────────────────────────────────────────────────────────
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingIndicator(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingIndicator(false);
    }, 3000);
  };

  const updateTypingIndicator = async (typing) => {
    try {
      if (typingChannelRef.current) {
        await typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: user.id, is_typing: typing },
        });
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  // ─── Image handling ───────────────────────────────────────────────────────────
  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow image types
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreview({ file, previewUrl });

    // Reset file input so the same file can be re-selected
    e.target.value = '';
  };

  const cancelImagePreview = () => {
    if (imagePreview?.previewUrl) URL.revokeObjectURL(imagePreview.previewUrl);
    setImagePreview(null);
  };

  const uploadImage = async (file) => {
    setUploadingImage(true);
    try {
      const compressed = await compressImage(file);
      const ext = compressed.type.split('/')[1] || 'jpg';
      const path = `chat-images/${conversation.id}/${Date.now()}-${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(path, compressed, { contentType: compressed.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(path);

      return urlData.publicUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  // ─── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    const sanitizedMessage = newMessage.trim();
    if (!sanitizedMessage && !imagePreview) return;
    if (sanitizedMessage.length > 2000) {
      toast.error('Message too long (max 2000 characters)');
      return;
    }

    try {
      setSending(true);

      let imageUrl = null;
      if (imagePreview) {
        try {
          imageUrl = await uploadImage(imagePreview.file);
        } catch (err) {
          console.error('Image upload failed:', err);
          toast.error('Failed to upload image');
          setSending(false);
          return;
        }
        cancelImagePreview();
      }

      // Build content — image tag, text, or both
      let finalContent = '';
      if (imageUrl) finalContent += `[IMAGE:${imageUrl}]`;
      if (sanitizedMessage) finalContent += (imageUrl ? '\n' : '') + sanitizedMessage;

      if (shownProductContext) {
        const contextData = {
          name: shownProductContext.name,
          price: shownProductContext.price,
          image_url: shownProductContext.image_url,
          quantity_kg: shownProductContext.quantity_kg,
          id: shownProductContext.id
        };
        finalContent = `[PRODUCT_CONTEXT:${JSON.stringify(contextData)}]\n${finalContent || sanitizedMessage}`;
        setShownProductContext(null);
      }

      setNewMessage('');
      setIsTyping(false);
      updateTypingIndicator(false);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          recipient_id: otherUser.id,
          content: finalContent,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });

      inputRef.current?.focus();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(newMessage);
    } finally {
      setSending(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Offline';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Offline';
    }
  };


  // ─── Order approve / decline from chat ───────────────────────────────────────
  const [orderActionLoading, setOrderActionLoading] = useState(null);
  const [actedOrders, setActedOrders] = useState({});
  const [ratingPrompt, setRatingPrompt] = useState(null); // { farmerId, farmerName, farmerAvatar, orderSnapshot }

  const handleOrderAction = async (order, action) => {
    const orderId = order.order_id;
    setOrderActionLoading(orderId);
    // Optimistically mark as acted so buttons disappear immediately
    setActedOrders(prev => ({ ...prev, [orderId]: action }));
    try {
      if (action === 'approved') {
        const { error: updateErr } = await supabase
          .from('orders')
          .update({ status: 'approved', seller_responded_at: new Date().toISOString() })
          .eq('id', orderId);
        if (updateErr) throw updateErr;

        await supabase.rpc('decrement_product_inventory', {
          p_product_id: order.product_id || null,
          p_quantity: order.quantity_kg,
        });

        await supabase.from('notifications').insert({
          user_id: conversation.otherParticipant.id,
          type: 'order_approved',
          title: '🎉 Order Approved!',
          message: `Your order of ${order.quantity_kg} kg of ${order.product_name} has been approved. Total: ₱${order.total_amount}.`,
          data: { order_id: orderId, product_name: order.product_name },
        });

        toast.success('Order approved! Inventory updated.');
      } else {
        const { error: updateErr } = await supabase
          .from('orders')
          .update({ status: 'declined', seller_responded_at: new Date().toISOString() })
          .eq('id', orderId);
        if (updateErr) throw updateErr;

        await supabase.from('notifications').insert({
          user_id: conversation.otherParticipant.id,
          type: 'order_declined',
          title: 'Order Declined',
          message: `Your order of ${order.quantity_kg} kg of ${order.product_name} was declined.`,
          data: { order_id: orderId, product_name: order.product_name },
        });

        toast.success('Order declined.');
      }
      setActedOrders(prev => ({ ...prev, [orderId]: action }));
    } catch (err) {
      console.error('Order action error:', err);
      toast.error(`Failed to ${action === 'approved' ? 'approve' : 'decline'} order`);
      // Revert optimistic update on failure
      setActedOrders(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } finally {
      setOrderActionLoading(null);
    }
  };

  const renderMessageContent = (content, isOwn) => {
    // ── ORDER_CONFIRM card ─────────────────────────────────────────────────
    if (content.startsWith('[ORDER_CONFIRM:')) {
      try {
        const jsonStr = content.split(']\n')[0].replace('[ORDER_CONFIRM:', '');
        const order = JSON.parse(jsonStr);
        const orderId = order.order_id;
        const alreadyActed = actedOrders[orderId];
        const isLoading = orderActionLoading === orderId;
        const canAct = !isOwn; // only the farmer (recipient) sees action buttons

        return (
          <div className="flex flex-col gap-2 min-w-[220px]">
            <div className={`rounded-2xl overflow-hidden border shadow-sm ${isOwn ? 'border-green-500/40' : 'border-gray-200'}`}>
              {/* Product header */}
              <div className={`flex items-center gap-3 p-3 ${isOwn ? 'bg-green-600' : 'bg-gray-50'}`}>
                {order.image_url && (
                  <img
                    src={order.image_url}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white/20"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isOwn ? 'text-green-100/70' : 'text-amber-600'}`}>
                    Transaction Request
                  </p>
                  <p className={`font-bold text-sm truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                    {order.product_name}
                  </p>
                  <div className={`flex gap-3 mt-1 text-xs ${isOwn ? 'text-green-100' : 'text-gray-600'}`}>
                    <span>{order.quantity_kg} kg</span>
                    <span>·</span>
                    <span>₱{order.price_per_kg}/kg</span>
                  </div>
                </div>
              </div>

              {/* Total row */}
              <div className={`flex items-center justify-between px-3 py-2 border-t ${isOwn ? 'bg-green-700/50 border-green-500/30' : 'bg-white border-gray-100'}`}>
                <span className={`text-xs font-medium ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>Estimated Total</span>
                <span className={`font-bold text-sm ${isOwn ? 'text-white' : 'text-green-700'}`}>₱{order.total_amount}</span>
              </div>

              {/* Farmer action buttons */}
              {canAct && (
                <div className="px-3 pb-3 pt-2 bg-white border-t border-gray-100">
                  {alreadyActed ? (
                    <div className={`text-center py-2 rounded-xl text-xs font-bold ${
                      alreadyActed === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {alreadyActed === 'approved' ? '\u2713 You approved this order' : '\u2717 You declined this order'}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrderAction(order, 'approved')}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
                      >
                        {isLoading
                          ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : '\u2713 Approve'}
                      </button>
                      <button
                        onClick={() => handleOrderAction(order, 'declined')}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
                      >
                        {isLoading
                          ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : '\u2717 Decline'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Buyer sees status + rate button */}
              {isOwn && (
                <div className={`px-3 pb-2 pt-1 ${isOwn ? 'bg-green-700/40' : 'bg-white'}`}>
                  {alreadyActed ? (
                    <div className="flex flex-col gap-1.5">
                      <p className={`text-center text-[10px] font-bold ${alreadyActed === 'approved' ? 'text-green-200' : 'text-red-300'}`}>
                        {alreadyActed === 'approved' ? '✓ Approved' : '✗ Declined'}
                      </p>
                      {alreadyActed === 'approved' && (
                        <button
                          onClick={() =>
                            setRatingPrompt({
                              farmerId: otherUser.id,
                              farmerName: otherUser.full_name || otherUser.username,
                              farmerAvatar: otherUser.avatar_url || null,
                              orderSnapshot: {
                                name: order.product_name,
                                quantity_kg: order.quantity_kg,
                                total_amount: order.total_amount,
                              },
                            })
                          }
                          className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-yellow-400/90 hover:bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-xl transition-colors"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          Rate Farmer
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-[10px] text-green-100/80">Waiting for farmer to respond…</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      } catch (e) {
        console.error('Failed to parse ORDER_CONFIRM', e);
      }
    }

    if (content.startsWith('[PRODUCT_CONTEXT:')) {
      const parts = content.split(']\n');
      if (parts.length >= 1) {
        try {
          const jsonStr = parts[0].replace('[PRODUCT_CONTEXT:', '');
          const product = JSON.parse(jsonStr);
          const userMessage = parts.slice(1).join(']\n');

          return (
            <div className="flex flex-col gap-2">
              <div className={`rounded-xl overflow-hidden border ${isOwn ? 'bg-green-600 border-green-500' : 'bg-gray-50 border-gray-200'} mb-1`}>
                <div className="flex items-center gap-3 p-2">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <p className={`text-[10px] font-bold uppercase tracking-tight ${isOwn ? 'text-green-100/80' : 'text-gray-500'}`}>Product Inquiry</p>
                    <p className={`font-bold text-xs truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>{product.name}</p>
                    <p className={`text-[11px] font-semibold ${isOwn ? 'text-green-100' : 'text-green-700'}`}>₱{product.price}/kg</p>
                  </div>
                </div>
              </div>
              {userMessage && (
                <p className="text-sm break-words whitespace-pre-wrap">{userMessage}</p>
              )}
            </div>
          );
        } catch (e) {
          console.error("Failed to parse product context", e);
        }
      }
    }

    // Handle image messages (with optional caption)
    if (content.includes('[IMAGE:')) {
      const imageMatch = content.match(/\[IMAGE:(.*?)\]/);
      if (imageMatch) {
        const url = imageMatch[1];
        const caption = content.replace(/\[IMAGE:.*?\]\n?/, '').trim();
        return (
          <div className="flex flex-col gap-1.5">
            <img
              src={url}
              alt="Sent image"
              className="rounded-2xl max-w-[220px] w-full object-cover cursor-pointer shadow-md hover:opacity-90 transition-opacity"
              onClick={() => setLightboxUrl(url)}
            />
            {caption && (
              <div className={`px-3 py-1.5 rounded-xl text-sm break-words whitespace-pre-wrap ${
                isOwn
                  ? 'bg-green-700 text-white self-end'
                  : 'bg-white text-gray-900 border border-gray-200 self-start'
              }`}>
                {caption}
              </div>
            )}
          </div>
        );
      }
    }

    return <p className="text-sm break-words whitespace-pre-wrap">{content}</p>;
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-100 bg-white md:rounded-t-2xl">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-shrink-0">
          <img
            src={
              otherUser?.avatar_url ||
              `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${otherUser?.username}`
            }
            alt={otherUser?.full_name}
            className="w-10 h-10 rounded-full object-cover border-2 border-green-50"
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-800 truncate text-sm">
            {otherUser?.full_name || otherUser?.username}
          </h4>
          <p className="text-[10px] font-medium">
            {isOnline ? (
              <span className="text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                Active now
              </span>
            ) : (
              <span className="text-gray-500">{formatLastSeen(presenceData?.last_seen)}</span>
            )}
          </p>
        </div>

        {/* More Options Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden"
              >
                <button
                  onClick={handleSaveContact}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  {isSaved ? (
                    <>
                      <UserMinus className="w-4 h-4 text-red-500" />
                      <span>Remove Contact</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-blue-500" />
                      <span>Save Contact</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-100"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Chat</span>
                </button>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No messages yet. Say hi!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user.id;
              const showAvatar =
                index === 0 || messages[index - 1].sender_id !== message.sender_id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && showAvatar && (
                    <img
                      src={
                        otherUser?.avatar_url ||
                        `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${otherUser?.username}`
                      }
                      alt=""
                      className="w-6 h-6 rounded-full flex-shrink-0"
                    />
                  )}
                  {!isOwn && !showAvatar && <div className="w-6" />}

                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {(() => {
                      const isImageMsg = message.content.includes('[IMAGE:') || message.content.startsWith('[ORDER_CONFIRM:');
                      return (
                        <div
                          className={isImageMsg ? '' : `px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-green-700 text-white rounded-br-sm shadow-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-sm'
                          }`}
                        >
                          {renderMessageContent(message.content, isOwn)}
                        </div>
                      );
                    })()}
                    <span className="text-xs text-gray-500 mt-1 px-1">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {/* Typing indicator */}
            <AnimatePresence>
              {otherUserTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <img
                    src={
                      otherUser?.avatar_url ||
                      `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${otherUser?.username}`
                    }
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Product Context Card (Above Input) */}
      <AnimatePresence>
        {shownProductContext && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-3 mb-2 bg-amber-50/95 backdrop-blur-sm border border-amber-200 rounded-xl p-2 flex items-center gap-3 shadow-lg z-10"
          >
            {shownProductContext.image_url && (
              <img
                src={shownProductContext.image_url}
                alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-amber-100"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <ShoppingBag className="w-2.5 h-2.5 text-amber-600 flex-shrink-0" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Inquiry</span>
              </div>
              <p className="font-bold text-gray-800 text-xs truncate leading-tight">{shownProductContext.name}</p>
              <p className="text-green-700 font-bold text-[11px] leading-tight">₱{shownProductContext.price}/kg</p>
            </div>
            
            <button
              onClick={() => {
                setNewMessage(`Is the ${shownProductContext.name} still available?`);
                inputRef.current?.focus();
              }}
              className="px-2.5 py-1 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Ask status
            </button>

            <button
              onClick={() => setShownProductContext(null)}
              className="p-1 rounded-full hover:bg-amber-200/50 transition-colors flex-shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview strip */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mx-3 mb-2 flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl p-2"
          >
            <img
              src={imagePreview.previewUrl}
              alt="Preview"
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{imagePreview.file.name}</p>
              <p className="text-xs text-gray-400">{(imagePreview.file.size / 1024).toFixed(0)} KB → will be compressed</p>
            </div>
            <button
              onClick={cancelImagePreview}
              className="p-1.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 bg-white md:rounded-b-2xl">
        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
          />

          {/* Image pick button */}
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingImage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            title="Send image"
          >
            <ImageIcon className="w-5 h-5" />
          </motion.button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={imagePreview ? 'Add a caption...' : 'Type a message...'}
            maxLength={2000}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            disabled={sending}
          />
          <motion.button
            type="submit"
            disabled={(!newMessage.trim() && !imagePreview) || sending || uploadingImage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-700"
          >
            {sending || uploadingImage ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </form>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxUrl}
              alt="Full image"
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteChat}
        isDeleting={actionLoading}
        productName={otherUser?.full_name || otherUser?.username}
        type="chat"
      />

      {/* Post-transaction rating modal — buyer rates the farmer */}
      <PostTransactionRatingModal
        isOpen={!!ratingPrompt}
        onClose={() => setRatingPrompt(null)}
        mode="rate_farmer"
        targetId={ratingPrompt?.farmerId}
        targetName={ratingPrompt?.farmerName}
        targetAvatar={ratingPrompt?.farmerAvatar}
        orderSnapshot={ratingPrompt?.orderSnapshot}
      />
    </div>
  );
}