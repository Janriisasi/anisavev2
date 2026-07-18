import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import ChatConversationList from "../components/chatConversationList";
import ChatWindow from "../components/chatWindow";

/**
 * ChatPage — full-page chat experience, shown on mobile (< md).
 *
 * Reuses ChatConversationList + ChatWindow unchanged. Supports opening
 * a specific conversation directly via React Router location state:
 *   navigate('/chat', { state: { conversationData, productContext } })
 */
export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const didApplyRouteState = useRef(false);

  const {
    filteredConversations,
    loading,
    searchQuery,
    setSearchQuery,
    selectedConversation,
    setSelectedConversation,
    handleConversationSelect,
    handleBackToList,
  } = useChat({ isActive: true });

  // ── Apply route state on first mount (from "Message Seller") ────────────────
  useEffect(() => {
    if (didApplyRouteState.current) return;
    if (location.state?.conversationData) {
      setSelectedConversation(location.state.conversationData);
      didApplyRouteState.current = true;
      // Clear state so back-navigation doesn't re-apply it
      window.history.replaceState({}, "");
    }
  }, [location.state, setSelectedConversation]);

  // Keep the page itself from scrolling so the chat pane can manage its own
  // internal scrolling without the browser viewport fighting it.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    
    // Save original overflow styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    
    // Disable scrolling on body and html
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      // Restore original overflow styles on unmount
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
    };
  }, []);

  if (!user) return null;

  const productContext = location.state?.productContext ?? null;

  return (
    <div
      className="fixed inset-x-0 z-[55] flex flex-col bg-white overflow-hidden"
      style={{
        top: "var(--nav-height, 4rem)",
        height:
          "calc(100dvh - var(--nav-height, 4rem) - var(--tabbar-height, 4rem))",
      }}
    >
      <AnimatePresence mode="wait">
        {!selectedConversation ? (
          <motion.div
            key="conversation-list"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col h-full min-h-0"
          >
            {/* Header */}
            <div className="flex items-center justify-center px-4 py-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center">
                <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
                  Chats
                </h2>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 min-h-0">
              <ChatConversationList
                conversations={filteredConversations}
                loading={loading}
                onSelectConversation={handleConversationSelect}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`chat-window-${selectedConversation.id}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col h-full min-h-0"
          >
            <ChatWindow
              conversation={selectedConversation}
              onBack={handleBackToList}
              onUnreadChange={() => {
                /* Unread count is managed by ChatButton's own realtime subscription */
              }}
              productContext={productContext}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
