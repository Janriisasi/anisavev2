import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';
import ChatPopup from './chatPopup';

/**
 * ChatButton — renders the chat action in three variants:
 *
 * • Default (no props) — desktop icon + popup, unchanged.
 * • mobileTab          — bottom-bar tab; navigates to /chat on mobile,
 *                        opens the popup on desktop (edge-case safety).
 * • mobileMenu         — hamburger-menu row; navigates on mobile.
 *
 * IMPORTANT: all three variants can be mounted in the DOM at the same
 * time (toggled with responsive Tailwind classes rather than a JS
 * conditional). Because of that, this component must NEVER open its own
 * realtime subscription for unread counts / notification toasts — doing
 * so means every mounted variant opens a duplicate subscription to the
 * same `user-chat:${user.id}` broadcast topic, which is exactly what was
 * causing the "new message" popup to fire inconsistently (worked on one
 * window/session, not another, only fired once, etc).
 *
 * The single subscription now lives in `useChatNotifications`, mounted
 * ONCE near the app root (e.g. in your Navbar/Layout). That hook owns
 * fetching the unread count and showing the toast; it hands the count
 * down here as the `unreadCount` prop.
 *
 * The `openChat` custom event (fired by StartChatButton) is still
 * handled per-instance below, because which instance should react to it
 * (navigate vs. open popup) genuinely depends on which variant this is —
 * that part is unrelated to the notification bug and is unchanged.
 */
export default function ChatButton({
  mobileMenu = false,
  mobileTab = false,
  isActive = false,
  showIndicator = false,
  indicatorLayoutId = 'tab-indicator',
  unreadCount = 0, // ← now supplied by the parent via useChatNotifications
  onOpen,
}) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [initialConversation, setInitialConversation] = useState(null);
  const [productContext, setProductContext] = useState(null);

  // Local copy of the badge count so the desktop popup can push instant
  // updates (e.g. right after marking messages as read) without waiting
  // for the next global refetch. Always re-syncs to the prop whenever it
  // changes, so this never drifts from the single source of truth.
  const [displayUnreadCount, setDisplayUnreadCount] = useState(unreadCount);
  useEffect(() => {
    console.log('[ChatButton] unreadCount prop is now:', unreadCount); // ← temp
    setDisplayUnreadCount(unreadCount);
  }, [unreadCount]);

  const setOpenState = (val) => {
    setIsOpen(val);
    onOpen?.(val);
  };

  // Close popup on route change
  useEffect(() => {
    setOpenState(false);
  }, [location.pathname]);

  // Close on global overlay-close event (desktop only, harmless on mobile)
  useEffect(() => {
    const handleClose = () => setOpenState(false);
    window.addEventListener('closeOverlays', handleClose);
    return () => window.removeEventListener('closeOverlays', handleClose);
  }, []);

  // openChat event — dispatched by StartChatButton.
  useEffect(() => {
    if (!user) return;

    /**
     * We only allow ONE instance to handle this at a time:
     *   • On mobile  → the mobileTab instance navigates to /chat
     *   • On desktop → the default instance opens the popup
     * The mobileMenu-only variant is skipped in all cases.
     */
    const handleOpenChat = (event) => {
      // Skip pure hamburger-menu variant (mobileMenu=true, mobileTab=false)
      if (mobileMenu && !mobileTab) return;
      // On mobile:  only the tab instance should act
      if (isMobile && !mobileTab) return;
      // On desktop: only the default instance (no mobileTab) should act
      if (!isMobile && mobileTab) return;

      const { conversationData, productContext: pc } = event.detail;

      if (isMobile) {
        navigate('/chat', { state: { conversationData, productContext: pc } });
      } else {
        setInitialConversation(conversationData);
        setProductContext(pc || null);
        setOpenState(true);
      }
    };

    window.addEventListener('openChat', handleOpenChat);

    return () => {
      window.removeEventListener('openChat', handleOpenChat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isMobile, mobileTab, mobileMenu]);

  /** Main click handler — navigate on mobile, toggle popup on desktop */
  const toggleChat = () => {
    if (isMobile) {
      navigate('/chat');
      return;
    }
    if (!isOpen) {
      setInitialConversation(null);
      setProductContext(null);
    }
    setOpenState(!isOpen);
  };

  const handleClose = () => {
    setOpenState(false);
    setInitialConversation(null);
    setProductContext(null);
  };

  if (!user) return null;

  // ── Mobile bottom-tab variant ─────────────────────────────────────────────
  if (mobileTab) {
    return (
      <button
        onClick={toggleChat}
        data-tutorial="mobile-tab-chat"
        className={`relative flex flex-col items-center justify-center py-2 flex-1 min-w-0 transition-colors hover:bg-green-700/50 ${
          isActive ? 'text-white' : 'text-green-100/70 hover:text-white'
        }`}
      >
        <div
          className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}
        >
          <MessageCircle className="w-6 h-6" />
          <AnimatePresence>
            {displayUnreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-sm"
              >
                {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[10px] mt-1 font-medium">Chat</span>
        {isActive && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-t-full" />
        )}
      </button>
      // No ChatPopup here — mobile navigates to /chat page
    );
  }

  // ── Mobile hamburger-menu variant ─────────────────────────────────────────
  if (mobileMenu) {
    return (
      <motion.button
        onClick={toggleChat}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-between text-white hover:text-gray-300 py-3 font-medium text-lg transition-all duration-200 hover:translate-x-1 hover:drop-shadow-lg"
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5" />
          <span>Messages</span>
        </div>
        {displayUnreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">
            {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
          </span>
        )}
      </motion.button>
    );
  }

  // ── Desktop icon variant (default) — popup behavior unchanged ─────────────
  return (
    <>
      <motion.button
        onClick={toggleChat}
        className="relative p-2 bg-green-800 hover:bg-green-700 rounded-full transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Messages"
      >
        <MessageCircle className="w-5 h-5 text-white" />

        <AnimatePresence>
          {displayUnreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            >
              {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Desktop popup — only rendered in this default variant */}
      <ChatPopup
        isOpen={isOpen}
        onClose={handleClose}
        onUnreadChange={setDisplayUnreadCount}
        initialConversation={initialConversation}
        productContext={productContext}
      />
    </>
  );
}