'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Loader, AlertCircle, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ChatButton({
  listingId = null,
  requestId = null,
  serviceId = null,
  posterId = null,
  poster = null,
  isOwner = false,
  currentUser = null,
  viewerLoading = false,
  showToast,
  buttonText = 'Chat with Poster',
  className = '',
  style = {},
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  // 1. isOwner -> render "This is your post"
  if (isOwner) {
    return (
      <div className="w-full py-3 px-4 rounded-xl bg-gray-100 text-center border border-gray-200">
        <p className="text-sm text-gray-500 font-medium">This is your post</p>
      </div>
    );
  }

  // 2. Viewer state still loading -> render placeholder, NEVER login prompt
  if (viewerLoading || currentUser === undefined) {
    return (
      <div className="w-full py-3.5 px-4 rounded-xl bg-gray-100 animate-pulse text-center">
        <span className="text-xs text-gray-400 font-medium">Loading chat...</span>
      </div>
    );
  }

  const viewerLoggedIn = !!currentUser;
  const viewerVerified = currentUser?.is_verified === true;

  // 3. Viewer logged out OR viewerVerified is false -> login prompt
  if (!viewerLoggedIn || !viewerVerified || showVerificationPrompt) {
    return (
      <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center animate-fade-in shadow-sm">
        <div className="flex items-center justify-center gap-2 text-amber-800 font-semibold text-sm mb-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Log in with your college email to chat</span>
        </div>
        <p className="text-xs text-amber-700 mb-3">
          Only users with verified college emails can chat on Unshelf.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 shadow-sm transition hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
          >
            <LogIn className="w-3.5 h-3.5" />
            Go to Login
          </Link>
          {showVerificationPrompt && (
            <button
              onClick={() => setShowVerificationPrompt(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-amber-100/70 transition"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Poster profile LOADED and poster.is_verified === false -> disabled notice
  if (poster && poster.is_verified === false) {
    return (
      <div className="w-full py-3.5 px-4 rounded-xl bg-gray-100 border border-gray-200 text-center">
        <div className="flex items-center justify-center gap-1.5 text-gray-600 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>This user hasn&apos;t verified a college email yet, so chat isn&apos;t available.</span>
        </div>
      </div>
    );
  }

  // 5. Otherwise (poster verified, OR poster failed to load/null where RPC will verify) -> normal Chat button
  const handleChatClick = async () => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setShowVerificationPrompt(true);
        setLoading(false);
        return;
      }

      const { data: conversationId, error } = await supabase.rpc('start_conversation', {
        p_listing_id: listingId || null,
        p_request_id: requestId || null,
        p_service_id: serviceId || null,
      });

      if (error) {
        const errorMsg = error.message || '';
        // Check POSTER_NOT_VERIFIED FIRST
        if (errorMsg.includes('POSTER_NOT_VERIFIED')) {
          showToast?.(
            "This user hasn't verified a college email yet, so chat isn't available.",
            'error'
          );
        } else if (
          errorMsg.includes('NOT_LOGGED_IN') ||
          (/\bNOT_VERIFIED\b/.test(errorMsg) && !errorMsg.includes('POSTER_NOT_VERIFIED'))
        ) {
          setShowVerificationPrompt(true);
        } else if (errorMsg.includes('CANNOT_CHAT_SELF')) {
          showToast?.('You cannot chat with yourself.', 'error');
        } else if (errorMsg.includes('ITEM_NOT_FOUND') || errorMsg.includes('INVALID_ITEM')) {
          showToast?.('Item no longer available.', 'error');
        } else {
          showToast?.('Could not start conversation. Please try again.', 'error');
        }
        setLoading(false);
        return;
      }

      if (conversationId) {
        router.push(`/chats/${conversationId}`);
      } else {
        showToast?.('Could not open conversation.', 'error');
        setLoading(false);
      }
    } catch (err) {
      console.error('Start chat error:', err);
      showToast?.('An error occurred. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      <button
        onClick={handleChatClick}
        disabled={loading}
        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50 active:scale-[0.99] cursor-pointer ${className}`}
        style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)', ...style }}
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Opening Chat...
          </>
        ) : (
          <>
            <MessageCircle className="w-5 h-5" />
            {buttonText}
          </>
        )}
      </button>
    </div>
  );
}
