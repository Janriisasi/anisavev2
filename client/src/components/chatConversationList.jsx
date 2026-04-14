import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState, useRef } from "react";
import supabase from "../lib/supabase";
import { useAuth } from "../contexts/authContext";

const STALE_THRESHOLD_MS = 2 * 60 * 1000; // must match usePresence.js

function isPresenceOnline(presence) {
  if (!presence?.is_online) return false;
  if (!presence?.last_activity) return false;
  return Date.now() - new Date(presence.last_activity).getTime() < STALE_THRESHOLD_MS;
}

export default function ChatConversationList({
  conversations,
  loading,
  onSelectConversation,
}) {
  const { user } = useAuth();
  const [presenceMap, setPresenceMap] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutsRef = useRef({});

  useEffect(() => {
    if (conversations.length === 0) return;

    // Fetch presence for all users in conversations
    const userIds = conversations
      .map((c) => c.otherParticipant?.id)
      .filter(Boolean);

    fetchPresence(userIds);

    // Subscribe to presence changes
    const channel = supabase
      .channel("presence-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_presence",
        },
        (payload) => {
          setPresenceMap((prev) => ({
            ...prev,
            [payload.new.user_id]: {
              is_online: payload.new.is_online,
              last_seen: payload.new.last_seen,
              last_activity: payload.new.last_activity,
            },
          }));
        },
      )
      .subscribe();

    // Subscribe to typing broadcasts
    const typingChannels = conversations.map((conv) => {
      const typingChannel = supabase.channel(`typing:${conv.id}`, {
        config: { broadcast: { ack: false } }
      });
      
      typingChannel.on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          if (payload.payload?.user_id && payload.payload.user_id !== user?.id) {
            setTypingUsers((prev) => ({
              ...prev,
              [conv.id]: payload.payload.is_typing,
            }));

            if (payload.payload.is_typing) {
              if (typingTimeoutsRef.current[conv.id]) {
                clearTimeout(typingTimeoutsRef.current[conv.id]);
              }
              typingTimeoutsRef.current[conv.id] = setTimeout(() => {
                setTypingUsers((prev) => ({ ...prev, [conv.id]: false }));
              }, 3000);
            }
          }
        }
      ).subscribe();
      
      return typingChannel;
    });

    return () => {
      channel.unsubscribe();
      typingChannels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [conversations, user?.id]);

  const fetchPresence = async (userIds) => {
    if (userIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("user_presence")
        .select("*")
        .in("user_id", userIds);

      if (error) throw error;

      const map = {};
      data?.forEach((p) => {
        map[p.user_id] = {
          is_online: p.is_online,
          last_seen: p.last_seen,
          last_activity: p.last_activity,
        };
      });
      setPresenceMap(map);
    } catch (error) {
      console.error("Error fetching presence:", error);
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Offline";

    try {
      return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
    } catch {
      return "Offline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h4 className="text-gray-600 font-medium mb-2">No conversations yet</h4>
        <p className="text-gray-500 text-sm">
          Start chatting with farmers and buyers!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conversation, index) => {
        const otherUser = conversation.otherParticipant;
        const lastMessage = conversation.lastMessage;
        const unreadCount = conversation.unreadCount;
        const presence = presenceMap[otherUser?.id];
        const isOnline = isPresenceOnline(presence);

        return (
          <motion.button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-3"
          >
            {/* Avatar with online indicator */}
            <div className="relative flex-shrink-0">
              <img
                src={
                  otherUser?.avatar_url ||
                  `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${otherUser?.username || "user"}`
                }
                alt={otherUser?.full_name || otherUser?.username}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
              {/* Online indicator */}
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900 truncate text-sm">
                  {otherUser?.full_name || otherUser?.username}
                </h4>
                {lastMessage && (
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(lastMessage.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p
                  className={`text-sm truncate ${unreadCount > 0 && !typingUsers[conversation.id] ? "font-semibold text-gray-900" : "text-gray-600"}`}
                >
                  {typingUsers[conversation.id] ? (
                    <span className="text-green-600 italic font-medium animate-pulse">Typing...</span>
                  ) : lastMessage ? (
                    lastMessage.content.startsWith('[PRODUCT_CONTEXT:') 
                      ? (() => {
                          try {
                            const jsonStr = lastMessage.content.split(']\n')[0].replace('[PRODUCT_CONTEXT:', '');
                            const product = JSON.parse(jsonStr);
                            return `🛍️ Product Inquiry: ${product.name}`;
                          } catch (e) {
                            return "New message";
                          }
                        })()
                      : lastMessage.content.startsWith('[ORDER_CONFIRM:')
                        ? (() => {
                            try {
                              const jsonStr = lastMessage.content.split(']\n')[0].replace('[ORDER_CONFIRM:', '');
                              const order = JSON.parse(jsonStr);
                              return `Transaction Request: ${order.product_name}`;
                            } catch (e) {
                              return 'Transaction Request';
                            }
                          })()
                      : lastMessage.content.includes('[IMAGE:')
                        ? (() => {
                            const caption = lastMessage.content.replace(/\[IMAGE:.*?\]\n?/, '').trim();
                            return caption ? `${caption}` : 'Sent an image';
                          })()
                      : lastMessage.content
                  ) : (
                    "No messages yet"
                  )}
                </p>
                {unreadCount > 0 && !typingUsers[conversation.id] && (
                  <span className="flex-shrink-0 ml-2 bg-green-700 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

              {/* Online status text */}
              {!isOnline && presence && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatLastSeen(presence.last_seen)}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}