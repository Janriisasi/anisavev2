import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * useChat — shared data hook for the Chat feature.
 *
 * Encapsulates the Supabase queries + realtime subscriptions that were
 * previously duplicated between ChatButton and ChatPopup. Used by both
 * ChatPopup (desktop) and ChatPage (mobile full-page).
 *
 * @param {object} options
 * @param {boolean} options.isActive  When false the hook fetches nothing and
 *                                    holds no subscriptions (use for lazy/popup).
 */
export function useChat({ isActive = true } = {}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const channelRef = useRef(null);

  // ─── Fetch all conversations with last-message + unread counts ──────────────
  const fetchConversations = useCallback(async (isInitial = false) => {
    if (!user) return;

    try {
      if (isInitial) {
        setLoading(true);
      }

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

      const conversationsWithData = await Promise.all(
        (convos || []).map(async (conv) => {
          const otherParticipant =
            conv.participant_1 === user.id
              ? conv.participant_2_profile
              : conv.participant_1_profile;

          const { data: lastMessages, error: lastMessageError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (lastMessageError) {
            console.error('useChat — error fetching last message:', lastMessageError);
          }

          const lastMessage = lastMessages?.[0] ?? null;

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
            unreadCount: unreadCount || 0,
          };
        })
      );

      setConversations(conversationsWithData);
    } catch (err) {
      console.error('useChat — error fetching conversations:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, [user]);

  // ─── Realtime subscription (only when active) ────────────────────────────────
  useEffect(() => {
    if (!isActive || !user) return;

    fetchConversations(true);

    // NOTE: no `user-chat:${user.id}` broadcast subscription here anymore.
    // useChatNotifications (mounted once in Navbar) owns that topic and
    // dispatches the `chatUnreadChanged` DOM event whenever a message
    // comes in — a second subscription to the same topic here caused the
    // exact "works until you open/close chat once" flakiness we chased
    // in ChatPopup.

    // Database changes on conversations and messages
    const dbChannel = supabase
      .channel(`use-chat-db:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations(false)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (
            payload.new?.sender_id === user.id ||
            payload.new?.recipient_id === user.id
          ) {
            fetchConversations(false);
          }
        }
      )
      .subscribe();

    // Auto-refresh when tab becomes visible (silent background update)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchConversations(false);
      }
    };

    // Custom event from local actions
    const handleUnreadChanged = () => {
      fetchConversations(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('chatUnreadChanged', handleUnreadChanged);

    return () => {
      supabase.removeChannel(dbChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('chatUnreadChanged', handleUnreadChanged);
    };
  }, [isActive, user?.id, fetchConversations]);

  // ─── Derived state ───────────────────────────────────────────────────────────
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.otherParticipant?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.otherParticipant?.username
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleConversationSelect = useCallback((conversation) => {
    setSelectedConversation(conversation);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedConversation(null);
    fetchConversations(false); // Silent refresh unread counts after exiting a chat
  }, [fetchConversations]);

  return {
    conversations,
    filteredConversations,
    loading,
    searchQuery,
    setSearchQuery,
    selectedConversation,
    setSelectedConversation,
    handleConversationSelect,
    handleBackToList,
    fetchConversations,
  };
}