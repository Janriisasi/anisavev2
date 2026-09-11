import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import supabase from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

/**
 * useChatNotifications — the SINGLE source of truth for:
 *   - unread message count
 *   - the "new message" toast popup
 *
 * Mount this ONCE, near the root of the app (e.g. in your Navbar/Layout
 * component — wherever all the <ChatButton /> variants get rendered
 * together), and pass the resulting count down to each <ChatButton />.
 *
 * Do NOT call this from inside ChatButton itself. ChatButton is rendered
 * in up to three variants (mobileTab / mobileMenu / default) that can all
 * be mounted in the DOM at once. If each variant subscribed to its own
 * realtime channel with the same topic name (`user-chat:${user.id}`),
 * you'd get duplicate/racy subscriptions to the identical topic — which
 * is what caused the popup to work on one window/monitor and not
 * another, and to only reliably fire the first time.
 *
 * Usage:
 *   const [unreadCount, setUnreadCount] = useState(0);
 *   useChatNotifications({ onUnreadChange: setUnreadCount });
 *   ...
 *   <ChatButton mobileTab unreadCount={unreadCount} />
 *   <ChatButton mobileMenu unreadCount={unreadCount} />
 *   <ChatButton unreadCount={unreadCount} />
 *
 * Clicking the toast re-uses the existing `openChat` custom event (the
 * same one StartChatButton dispatches) instead of taking an onOpenChat
 * callback — ChatButton's own listener already knows how to route it
 * correctly per viewport (navigate to /chat on mobile, open the popup on
 * desktop), so there's no need to duplicate that logic here.
 */
// ─── Shared channel registry (module scope, not inside the hook) ────────────
// This exists specifically to survive React StrictMode's dev-only double-
// invoke of effects (mount → cleanup → mount again, on the same instance).
// Supabase's .subscribe() is callback-based rather than promise-based, so if
// a channel is torn down before its "joined" handshake finishes, the leave
// can lose that race — leaving a zombie channel still bound to the topic,
// on top of the second, real channel StrictMode's second mount creates.
// Result: every broadcast fires twice (dev only; production never
// double-invokes, so this doesn't affect real users).
//
// Fix: reference-count each topic, and delay actually removing a channel
// until a tick after the last release. If the same topic is re-acquired
// within that tick — exactly what StrictMode's phantom mount→cleanup→mount
// does — the pending removal is cancelled and the original channel is
// reused instead of a second one being created.
const channelRegistry = new Map(); // topic -> { channel, refCount, removeTimer }

function acquireChannel(topic, createChannel) {
  let entry = channelRegistry.get(topic);
  if (!entry) {
    entry = { channel: createChannel(), refCount: 0, removeTimer: null };
    channelRegistry.set(topic, entry);
  }
  if (entry.removeTimer) {
    clearTimeout(entry.removeTimer);
    entry.removeTimer = null;
  }
  entry.refCount += 1;
  return entry.channel;
}

function releaseChannel(topic) {
  const entry = channelRegistry.get(topic);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount <= 0 && !entry.removeTimer) {
    entry.removeTimer = setTimeout(() => {
      const current = channelRegistry.get(topic);
      if (current && current.refCount <= 0) {
        supabase.removeChannel(current.channel);
        channelRegistry.delete(topic);
      }
    }, 0);
  }
}

export function useChatNotifications({ onUnreadChange } = {}) {
  const { user } = useAuth();
  const mounted = useRef(false);

  useEffect(() => {
    if (!user) return;

    if (mounted.current) {
      // If you ever see this warning, something is mounting the hook more
      // than once — that's the exact bug this refactor fixes, so it
      // shouldn't happen, but it's a cheap early-warning signal if it does.
      console.warn(
        '[useChatNotifications] mounted more than once — this will cause duplicate/flaky toasts.'
      );
    }
    mounted.current = true;

    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase.rpc('get_unread_count');
        if (error) throw error;
        onUnreadChange?.(data || 0);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();

    const userChatTopic = `user-chat:${user.id}`;
    const dbTopic = `messages-updates:${user.id}`;

    // 1. Instant notification broadcast on user-chat channel
    acquireChannel(userChatTopic, () =>
      supabase
        .channel(userChatTopic, {
          config: { broadcast: { ack: false } },
        })
        .on('broadcast', { event: 'incoming_message' }, ({ payload }) => {
        fetchUnreadCount();

        // Let any other part of the app that cares about conversation data
        // (ChatPopup's list, useChat.js on the mobile /chat page) know a
        // message came in, WITHOUT them opening their own subscription to
        // this same `user-chat:${user.id}` topic. Multiple simultaneous
        // subscriptions to the identical topic is what was breaking the
        // popup after it had been opened and closed once — this hook is
        // now the only thing that ever subscribes to that topic.
        window.dispatchEvent(new CustomEvent('chatUnreadChanged'));

        // If user is not currently inside this conversation, pop up an in-app notification toast
        if (
          payload &&
          payload.conversation_id &&
          window.__currentActiveConversationId !== payload.conversation_id
        ) {
          const rawContent = payload.message?.content || '';
          const preview =
            rawContent
              .replace(/\[IMAGE:.*?\]/g, '📷 Image')
              .replace(/\[PRODUCT_CONTEXT:.*?\]/g, '')
              .replace(/\[ORDER_CONFIRM:.*?\]/g, '📦 Order')
              .trim() || 'Sent an attachment';

          toast(
            (t) => (
              <div
                className="flex items-center gap-3 cursor-pointer py-0.5"
                onClick={() => {
                  toast.dismiss(t.id);
                  window.dispatchEvent(new CustomEvent('openChat', { detail: {} }));
                }}
              >
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700 font-bold">
                  💬
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {payload.sender_name || 'New Message'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{preview}</p>
                </div>
              </div>
            ),
            {
              // Fixed id (not per-message) — react-hot-toast treats a
              // toast() call with an id that matches an existing toast as
              // an update to that same toast rather than a new one, so a
              // second incoming message while one is still showing
              // replaces it instead of stacking underneath it.
              id: 'chat-notification',
              duration: 4500,
              position: 'top-right',
            }
          );
        }
      })
      .subscribe()
    );

    // 2. Database changes on messages
    acquireChannel(dbTopic, () =>
      supabase
        .channel(dbTopic)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            if (payload.new?.recipient_id === user.id) fetchUnreadCount();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload) => {
            if (payload.new?.recipient_id === user.id) fetchUnreadCount();
          }
        )
        .subscribe()
    );

    // 3. Auto-refresh when tab/phone becomes active (mobile screen unlock / app switch)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    };
    const handleUnreadChanged = () => fetchUnreadCount();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('chatUnreadChanged', handleUnreadChanged);

    return () => {
      mounted.current = false;
      releaseChannel(userChatTopic);
      releaseChannel(dbTopic);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('chatUnreadChanged', handleUnreadChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
}