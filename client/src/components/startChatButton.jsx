import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/authContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/**
 * StartChatButton - Reusable button to start chat with any user
 * Opens chat window directly with the conversation
 */
export default function StartChatButton({ 
  recipientId, 
  recipientName,
  recipientUsername,
  recipientAvatar,
  productContext = null, // { id, name, price, image_url, quantity_kg? }
  variant = 'default', // 'default' | 'small' | 'icon'
  className = ''
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async (e) => {
    e.stopPropagation(); // Prevent parent click events

    if (!user) {
      toast.error('Please login to send messages');
      navigate('/login');
      return;
    }

    if (user.id === recipientId) {
      toast.error('You cannot message yourself');
      return;
    }

    try {
      setLoading(true);

      // Get or create conversation
      const { data: conversationId, error: convError } = await supabase
        .rpc('get_or_create_conversation', {
          other_user_id: recipientId
        });

      if (convError) throw convError;

      // Fetch the full conversation details
      const { data: conversation, error: fetchError } = await supabase
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
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;

      // Determine the other participant
      const otherParticipant = conversation.participant_1 === user.id
        ? conversation.participant_2_profile
        : conversation.participant_1_profile;

      // Create conversation data for the chat popup
      const conversationData = {
        ...conversation,
        otherParticipant,
        lastMessage: null,
        unreadCount: 0
      };

      // Dispatch custom event to open chat with this conversation
      window.dispatchEvent(new CustomEvent('openChat', { 
        detail: { conversationData, productContext } 
      }));

      toast.success(`Opening chat with ${recipientName || 'farmer'}...`);
      
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  // Variant styles
  const getButtonStyles = () => {
    switch (variant) {
      case 'small':
        return 'px-3 py-1.5 text-sm';
      case 'icon':
        return 'p-2';
      default:
        return 'px-4 py-2';
    }
  };

  const buttonClasses = `
    flex items-center justify-center gap-2 
    bg-green-700 hover:bg-green-800 
    text-white font-medium rounded-lg 
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    ${getButtonStyles()}
    ${className}
  `;

  if (variant === 'icon') {
    return (
      <motion.button
        onClick={handleStartChat}
        disabled={loading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={buttonClasses}
        title={`Message ${recipientName}`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleStartChat}
      disabled={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={buttonClasses}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Opening...</span>
        </>
      ) : (
        <>
          <MessageCircle className="w-4 h-4" />
          <span>Chat</span>
        </>
      )}
    </motion.button>
  );
}