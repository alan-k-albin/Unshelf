'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageCircle,
  Package,
  FileQuestion,
  Wrench,
  ChevronRight,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import LoadingSkeleton from '@/components/LoadingSkeleton';

function formatChatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ChatsInboxPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const userProfilesCache = useRef(new Map());
  const itemCache = useRef(new Map());

  // Helper to fetch other user's public profile via RPC
  const getOtherUserProfile = useCallback(async (userId) => {
    if (!userId) return { full_name: 'Campus Student', is_verified: false };
    if (userProfilesCache.current.has(userId)) {
      return userProfilesCache.current.get(userId);
    }
    try {
      const { data, error } = await supabase.rpc('get_user_public_profile', {
        user_id: userId,
      });
      if (error || !data || data.length === 0) {
        const fallback = { full_name: 'Campus Student', is_verified: false };
        userProfilesCache.current.set(userId, fallback);
        return fallback;
      }
      const profile = Array.isArray(data) ? data[0] : data;
      userProfilesCache.current.set(userId, profile);
      return profile;
    } catch (e) {
      return { full_name: 'Campus Student', is_verified: false };
    }
  }, []);

  // Helper to fetch item details
  const getItemDetails = useCallback(async (conv) => {
    const key = conv.listing_id
      ? `listing:${conv.listing_id}`
      : conv.request_id
      ? `request:${conv.request_id}`
      : conv.service_id
      ? `service:${conv.service_id}`
      : 'none';

    if (key === 'none') {
      return { title: 'Item no longer available', type: 'none', url: null };
    }

    if (itemCache.current.has(key)) {
      return itemCache.current.get(key);
    }

    try {
      if (conv.listing_id) {
        const { data } = await supabase
          .from('listings')
          .select('id, title, status')
          .eq('id', conv.listing_id)
          .single();
        const res = data
          ? { title: data.title, type: 'listing', url: `/listing/${data.id}`, status: data.status }
          : { title: 'Item no longer available', type: 'listing', url: null };
        itemCache.current.set(key, res);
        return res;
      }

      if (conv.request_id) {
        const { data } = await supabase
          .from('requests')
          .select('id, title, status')
          .eq('id', conv.request_id)
          .single();
        const res = data
          ? { title: data.title, type: 'request', url: `/request/${data.id}`, status: data.status }
          : { title: 'Item no longer available', type: 'request', url: null };
        itemCache.current.set(key, res);
        return res;
      }

      if (conv.service_id) {
        const { data } = await supabase
          .from('services')
          .select('id, title, status')
          .eq('id', conv.service_id)
          .single();
        const res = data
          ? { title: data.title, type: 'service', url: `/service/${data.id}`, status: data.status }
          : { title: 'Item no longer available', type: 'service', url: null };
        itemCache.current.set(key, res);
        return res;
      }
    } catch (e) {
      const res = { title: 'Item no longer available', type: 'none', url: null };
      itemCache.current.set(key, res);
      return res;
    }

    return { title: 'Item no longer available', type: 'none', url: null };
  }, []);

  const loadConversations = useCallback(
    async (userId) => {
      try {
        const { data: convRows, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (convError) throw convError;

        if (!convRows || convRows.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // Enrich conversations with other user profile, item title, last message & unread state
        const enriched = await Promise.all(
          convRows.map(async (conv) => {
            const otherUserId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
            const [otherUser, item, lastMsgRes] = await Promise.all([
              getOtherUserProfile(otherUserId),
              getItemDetails(conv),
              supabase
                .from('messages')
                .select('id, body, created_at, sender_id, read_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            ]);

            const lastMessage = lastMsgRes.data || null;
            const hasUnread =
              !!lastMessage &&
              lastMessage.sender_id !== userId &&
              lastMessage.read_at === null;

            return {
              ...conv,
              otherUserId,
              otherUser,
              item,
              lastMessage,
              hasUnread,
              displayTime: conv.last_message_at || conv.created_at,
            };
          })
        );

        // Sort descending by displayTime
        enriched.sort(
          (a, b) => new Date(b.displayTime || 0) - new Date(a.displayTime || 0)
        );

        setConversations(enriched);
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    },
    [getOtherUserProfile, getItemDetails]
  );

  useEffect(() => {
    let channel = null;

    const init = async () => {
      const userStr = localStorage.getItem('user');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      const uid = session.user.id;
      setAuthUserId(uid);
      if (userStr) setCurrentUser(JSON.parse(userStr));

      await loadConversations(uid);

      // Subscribe to realtime changes:
      // 1. messages INSERT (new message arrived)
      // 2. conversations UPDATE (last_message_at updated)
      // 3. conversations INSERT (new conversation started)
      channel = supabase
        .channel(`inbox-realtime:${uid}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          () => {
            loadConversations(uid);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'conversations' },
          () => {
            loadConversations(uid);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'conversations' },
          () => {
            loadConversations(uid);
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadConversations, router]);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const otherName = conv.otherUser?.full_name?.toLowerCase() || '';
    const itemTitle = conv.item?.title?.toLowerCase() || '';
    const msgBody = conv.lastMessage?.body?.toLowerCase() || '';
    return otherName.includes(q) || itemTitle.includes(q) || msgBody.includes(q);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1B2A4A' }}>
            Messages
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Campus conversations with verified students
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}</span>
        </div>
      </div>

      {/* Search Input */}
      {conversations.length > 0 && (
        <div className="relative mb-5">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student or item title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton count={4} />
        </div>
      ) : conversations.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-sm mt-4">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}
          >
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ color: '#1B2A4A' }}>
            No conversations yet
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Find items, requests, or services on Unshelf and tap &ldquo;Chat with Poster&rdquo; to start talking directly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/search"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition"
              style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 text-gray-500 text-sm">
          No conversations match &ldquo;{searchQuery}&rdquo;
        </div>
      ) : (
        /* Conversations List */
        <div className="space-y-2.5">
          {filteredConversations.map((conv) => {
            const initial = conv.otherUser?.full_name?.charAt(0).toUpperCase() || 'U';
            return (
              <div
                key={conv.id}
                onClick={() => router.push(`/chats/${conv.id}`)}
                className={`group relative p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center gap-3.5 ${
                  conv.hasUnread
                    ? 'bg-blue-50/50 border-blue-200 shadow-xs hover:border-blue-300'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                }`}
              >
                {/* Avatar with initial */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-base shadow-xs"
                    style={{
                      background: 'linear-gradient(135deg, #1B2A4A, #2C3E6B)',
                    }}
                  >
                    {initial}
                  </div>
                  {conv.otherUser?.is_verified && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white"
                      title="Verified student"
                    >
                      ✓
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3
                      className={`text-sm truncate ${
                        conv.hasUnread
                          ? 'font-bold text-gray-900'
                          : 'font-semibold text-gray-800'
                      }`}
                    >
                      {conv.otherUser?.full_name || 'Campus Student'}
                    </h3>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatChatTime(conv.displayTime)}
                    </span>
                  </div>

                  {/* Related Item Badge */}
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-1 truncate">
                    {conv.item?.type === 'listing' ? (
                      <Package className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : conv.item?.type === 'request' ? (
                      <FileQuestion className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : conv.item?.type === 'service' ? (
                      <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    )}
                    <span
                      className={`truncate font-medium ${
                        conv.item?.type === 'none' || conv.item?.title === 'Item no longer available'
                          ? 'text-gray-400 italic'
                          : 'text-blue-700'
                      }`}
                    >
                      {conv.item?.title || 'Item no longer available'}
                    </span>
                  </div>

                  {/* Message Preview */}
                  <p
                    className={`text-xs truncate ${
                      conv.hasUnread
                        ? 'font-semibold text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {conv.lastMessage?.sender_id === authUserId && (
                      <span className="text-gray-400 font-normal">You: </span>
                    )}
                    {conv.lastMessage?.body || 'No messages yet'}
                  </p>
                </div>

                {/* Unread Dot & Arrow */}
                <div className="flex items-center gap-2 flex-shrink-0 pl-1">
                  {conv.hasUnread && (
                    <div
                      className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"
                      title="Unread messages"
                    />
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
