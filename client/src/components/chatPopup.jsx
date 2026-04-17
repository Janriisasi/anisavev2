import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MessageCircle, ArrowLeft } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/authContext';
import ChatConversationList from './chatConversationList';
import ChatWindow from './chatWindow';

export default function ChatPopup({ isOpen, onClose, onUnreadChange, initialConversation = null, productContext = null }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(initialConversation);

  // Handle initial conversation from "Message" button
  useEffect(() => {
    if (initialConversation) {
      setSelectedConversation(initialConversation);
    }
  }, [initialConversation]);

  useEffect(() => {
    if (!isOpen || !user) return;

    fetchConversations();

    // Subscribe to conversation updates
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1=eq.${user.id},participant_2=eq.${user.id}`
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // Update conversation list when new message arrives
          if (payload.new.sender_id === user.id || payload.new.recipient_id === user.id) {
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isOpen, user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch conversations where user is participant
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1_profile:profiles!conversations_participant_1_fkey(
            id, username, full_name, avatar_url
          ),
          participant_2_profile:profiles!conversations_participant_2_fkey(
            id, username, full_name, avatar_url
          )
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get last message and unread count for each conversation
      const conversationsWithData = await Promise.all(
        (convos || []).map(async (conv) => {
          // Determine the other participant
          const otherParticipant = conv.participant_1 === user.id
            ? conv.participant_2_profile
            : conv.participant_1_profile;

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('recipient_id', user.id)
            .eq('read', false);

          return {
            ...conv,
            otherParticipant,
            lastMessage,
            unreadCount: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherParticipant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherParticipant?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    fetchConversations(); // Refresh to update unread counts
  };

  if (!isOpen) return null;

  // Use React Portal to render outside navbar
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bg-white shadow-2xl md:border border-gray-200 flex flex-col
          md:bottom-0 md:right-4 md:rounded-t-2xl md:w-96 md:max-w-[400px] md:z-[9999]
          max-md:inset-0 max-md:rounded-none max-md:w-full max-md:z-[50] max-md:pb-[4rem] max-md:pt-[calc(env(safe-area-inset-top)+4rem)]"
        style={{ 
          maxHeight: window.innerWidth < 768 ? '100vh' : '600px',
          height: window.innerWidth < 768 ? '100vh' : '80vh'
        }}
      >
        {!selectedConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white md:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-700" />
                  <h3 className="font-bold text-gray-800 text-xl">Chats</h3>
                </div>
              </div>
              <div className="hidden md:block">
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              <ChatConversationList
                conversations={filteredConversations}
                loading={loading}
                onSelectConversation={handleConversationSelect}
              />
            </div>
          </>
        ) : (
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBackToList}
            onUnreadChange={onUnreadChange}
            productContext={productContext}
          />
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}