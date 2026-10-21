'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Flag,
  UserX,
  Package,
  FileQuestion,
  Wrench,
  AlertCircle,
  Loader,
  Check,
  CheckCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ReportModal from '@/components/ReportModal';
import { Toast, useToast } from '@/components/Toast';

const MAX_MESSAGE_LENGTH = 1000;

function formatMessageTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id;

  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { toast, showToast, hideToast } = useToast();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Close header menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch related item
  const fetchItem = useCallback(async (conv) => {
    if (!conv) return { title: 'Item no longer available', type: 'none', url: null };
    try {
      if (conv.listing_id) {
        const { data } = await supabase
          .from('listings')
          .select('id, title, status, price')
          .eq('id', conv.listing_id)
          .single();
        return data
          ? {
              title: data.title,
              type: 'listing',
              url: `/listing/${data.id}`,
              status: data.status,
              price: data.price,
            }
          : { title: 'Item no longer available', type: 'listing', url: null };
      }
      if (conv.request_id) {
        const { data } = await supabase
          .from('requests')
          .select('id, title, status')
          .eq('id', conv.request_id)
          .single();
        return data
          ? {
              title: data.title,
              type: 'request',
              url: `/request/${data.id}`,
              status: data.status,
            }
          : { title: 'Item no longer available', type: 'request', url: null };
      }
      if (conv.service_id) {
        const { data } = await supabase
          .from('services')
          .select('id, title, status, service_type')
          .eq('id', conv.service_id)
          .single();
        return data
          ? {
              title: data.title,
              type: 'service',
              url: `/service/${data.id}`,
              status: data.status,
            }
          : { title: 'Item no longer available', type: 'service', url: null };
      }
    } catch (e) {
      return { title: 'Item no longer available', type: 'none', url: null };
    }
    return { title: 'Item no longer available', type: 'none', url: null };
  }, []);

  // Fetch other user profile via get_user_public_profile RPC
  const fetchOtherUserProfile = useCallback(async (otherId) => {
    if (!otherId) return { full_name: 'Campus Student', is_verified: false };
    try {
      const { data, error } = await supabase.rpc('get_user_public_profile', {
        user_id: otherId,
      });
      if (error || !data || data.length === 0) {
        return { full_name: 'Campus Student', is_verified: false };
      }
      return Array.isArray(data) ? data[0] : data;
    } catch (e) {
      return { full_name: 'Campus Student', is_verified: false };
    }
  }, []);

  // Mark conversation read
  const markAsRead = useCallback(async (convId) => {
    try {
      await supabase.rpc('mark_conversation_read', {
        p_conversation_id: convId,
      });
    } catch (err) {
      console.error('Error marking conversation read:', err);
    }
  }, []);

  // Initialize conversation and realtime subscription
  useEffect(() => {
    let messageChannel = null;

    const initThread = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/login');
          return;
        }

        const uid = session.user.id;
        setAuthUserId(uid);

        // Fetch conversation row
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (convError || !convData) {
          showToast('Conversation not found.', 'error');
          setTimeout(() => router.push('/chats'), 1500);
          return;
        }

        // Verify current user is part of the conversation
        if (convData.buyer_id !== uid && convData.seller_id !== uid) {
          showToast('You do not have access to this conversation.', 'error');
          setTimeout(() => router.push('/chats'), 1500);
          return;
        }

        setConversation(convData);

        const otherId = convData.buyer_id === uid ? convData.seller_id : convData.buyer_id;

        // Concurrently fetch profile, item, and messages
        const [profile, itemDetails, messagesRes] = await Promise.all([
          fetchOtherUserProfile(otherId),
          fetchItem(convData),
          supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true }),
        ]);

        setOtherUser(profile);
        setItem(itemDetails);
        setMessages(messagesRes.data || []);
        setLoading(false);

        // Mark as read immediately on open
        await markAsRead(conversationId);
        setTimeout(() => scrollToBottom('auto'), 100);

        // Realtime subscription for incoming messages
        messageChannel = supabase
          .channel(`messages:${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              const incoming = payload.new;
              setMessages((prev) => {
                // Deduplicate by message id
                const alreadyExists = prev.some((m) => m.id === incoming.id);
                if (alreadyExists) return prev;

                // If this is an echo of an optimistic message sent by me, replace the temp one
                const tempIndex = prev.findIndex(
                  (m) =>
                    typeof m.id === 'string' &&
                    m.id.startsWith('temp-') &&
                    m.body === incoming.body &&
                    m.sender_id === incoming.sender_id
                );
                if (tempIndex !== -1) {
                  const updated = [...prev];
                  updated[tempIndex] = incoming;
                  return updated;
                }

                return [...prev, incoming];
              });

              // Mark read if incoming from the other person
              if (incoming.sender_id !== uid) {
                markAsRead(conversationId);
              }

              setTimeout(() => scrollToBottom('smooth'), 50);
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Thread init error:', err);
        setLoading(false);
      }
    };

    initThread();

    return () => {
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
    };
  }, [conversationId, fetchItem, fetchOtherUserProfile, markAsRead, router, scrollToBottom, showToast]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || sending || !authUserId) return;

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      showToast(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`, 'error');
      return;
    }

    setSending(true);

    // Optimistic append
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: authUserId,
      body: trimmed,
      created_at: new Date().toISOString(),
      read_at: null,
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: authUserId,
            body: trimmed,
          },
        ])
        .select()
        .single();

      if (insertError) {
        // Revert optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setNewMessage(trimmed); // Restore message text so user doesn't lose it

        const errorMsg = insertError.message || '';
        if (errorMsg.includes('RATE_LIMIT')) {
          showToast("Slow down, you're sending messages too fast", 'error');
        } else {
          showToast('Failed to send message. Please try again.', 'error');
        }
        return;
      }

      // Replace optimistic message with actual DB row
      if (inserted) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? inserted : m))
        );
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(trimmed);
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const charactersRemaining = MAX_MESSAGE_LENGTH - newMessage.length;
  const isNearLimit = newMessage.length > 850;

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] md:h-[calc(100vh-70px)] max-w-3xl mx-auto bg-[#FBF8F1] font-body border-x border-[#EDE6D6]">
      {/* Thread Header */}
      <header className="sticky top-0 z-30 bg-[#FBF8F1]/95 backdrop-blur-md border-b border-[#EDE6D6] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/chats"
            className="p-1.5 -ml-1.5 rounded-xl hover:bg-[#F3EEDC] text-[#1B2A4A] transition"
            aria-label="Back to chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Other User Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-display font-bold text-sm bg-[#1B2A4A] shadow-xs"
            >
              {otherUser?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {otherUser?.is_verified && (
              <div
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#27AE60] text-white flex items-center justify-center text-[9px] font-bold border-2 border-white"
                title="Verified student"
              >
                ✓
              </div>
            )}
          </div>

          {/* User & Related Item info */}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-display font-bold text-[#1B2A4A] truncate">
              {otherUser?.full_name || 'Campus Student'}
            </h2>

            {/* Related Item Link */}
            {item?.url ? (
              <Link
                href={item.url}
                className="inline-flex items-center gap-1 text-xs text-[#5B5647] hover:text-[#1B2A4A] font-medium truncate max-w-full hover:underline"
              >
                {item.type === 'listing' ? (
                  <Package className="w-3 h-3 flex-shrink-0 text-[#1B2A4A]" />
                ) : item.type === 'request' ? (
                  <FileQuestion className="w-3 h-3 flex-shrink-0 text-[#1B2A4A]" />
                ) : (
                  <Wrench className="w-3 h-3 flex-shrink-0 text-[#1B2A4A]" />
                )}
                <span className="truncate">{item.title}</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-[#8A8272] italic truncate">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{item?.title || 'Item no longer available'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Header Actions Menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-2 rounded-xl text-[#5B5647] hover:text-[#1B2A4A] hover:bg-[#F3EEDC] transition cursor-pointer"
            aria-label="Thread options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-[#EDE6D6] py-1.5 z-40 text-sm">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 font-medium flex items-center gap-2.5 transition"
              >
                <Flag className="w-4 h-4" />
                Report Conversation
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  // TODO: Block user feature (v2)
                  showToast('User blocking will be available in an upcoming update.', 'error');
                }}
                className="w-full text-left px-4 py-2.5 text-[#5B5647] hover:bg-[#FAF6EE] font-medium flex items-center gap-2.5 transition"
              >
                <UserX className="w-4 h-4" />
                Block Student
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Item Context Banner */}
      {item && item.url && (
        <div className="bg-[#FAF6EE] border-b border-[#EDE6D6] px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-[#5B5647] truncate flex items-center gap-1.5">
            <span className="font-semibold text-[#1B2A4A]">Regarding:</span>
            <span className="truncate text-[#3E3A30]">{item.title}</span>
          </span>
          <Link
            href={item.url}
            className="font-semibold text-[#1B2A4A] hover:underline flex-shrink-0 ml-2"
          >
            View Post →
          </Link>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader className="w-6 h-6 animate-spin text-[#1B2A4A] mx-auto mb-2" />
              <p className="text-xs text-[#8A8272] font-medium">Loading chat...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-[#FAF6EE] border border-[#EDE6D6]"
            >
              <Send className="w-6 h-6 text-[#1B2A4A]" />
            </div>
            <h4 className="text-sm font-display font-bold mb-1 text-[#1B2A4A]">
              Start the conversation
            </h4>
            <p className="text-xs text-[#8A8272] max-w-xs">
              Say hello, discuss material availability, handover spot on campus, or pricing!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === authUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm break-words shadow-xs ${
                    isMe
                      ? 'bg-[#1B2A4A] text-white rounded-br-xs'
                      : 'bg-white text-[#1B2A4A] border border-[#EDE6D6] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-white/70' : 'text-[#8A8272]'
                    }`}
                  >
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {isMe && (
                      <span>
                        {msg.isOptimistic ? (
                          <Loader className="w-2.5 h-2.5 animate-spin inline" />
                        ) : msg.read_at ? (
                          <CheckCheck className="w-3 h-3 text-[#27AE60] inline" />
                        ) : (
                          <Check className="w-3 h-3 text-white/60 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area */}
      <footer className="sticky bottom-0 bg-[#FBF8F1]/95 backdrop-blur-md border-t border-[#EDE6D6] p-3 sm:p-4">
        <form onSubmit={handleSendMessage} className="space-y-1.5">
          <div className="flex items-end gap-2 bg-white border border-[#EDE6D6] rounded-2xl px-3 py-2 focus-within:border-[#1B2A4A] focus-within:ring-1 focus-within:ring-[#1B2A4A] transition">
            <textarea
              ref={textareaRef}
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message (Enter to send, Shift+Enter for newline)..."
              disabled={sending}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-32 min-h-[24px] py-1 text-[#1B2A4A] placeholder:text-[#8A8272]"
              style={{ maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2.5 rounded-xl text-white font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 shadow-xs active:scale-95 btn-action-green"
              aria-label="Send message"
            >
              {sending ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Character counter (visible as you approach limit) */}
          <div className="flex items-center justify-between px-1 text-[11px] text-[#8A8272]">
            <span>Press Enter to send</span>
            <span
              className={`font-mono transition ${
                isNearLimit ? 'text-amber-600 font-semibold' : ''
              } ${charactersRemaining <= 0 ? 'text-red-600 font-bold' : ''}`}
            >
              {newMessage.length} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </form>
      </footer>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          conversationId={conversationId}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
