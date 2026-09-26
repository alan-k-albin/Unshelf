'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  Loader,
  Eye,
  Trash2,
  CheckCircle,
  RefreshCw,
  Clock,
  BookOpen,
  AlertCircle,
  Flag,
} from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ReportModal from '@/components/ReportModal';
import { Toast, useToast } from '@/components/Toast';

const URGENCY_STYLES = {
  High: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: '🔴', label: 'Urgent' },
  Medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', icon: '🟡', label: 'Medium Urgency' },
  Low: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', icon: '🟢', label: 'Low Urgency' },
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id;

  const [request, setRequest] = useState(null);
  const [requester, setRequester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFulfilledConfirm, setShowFulfilledConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fulfilledLoading, setFulfilledLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [whatsappRevealed, setWhatsappRevealed] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    initPage();
  }, [requestId]);

  const initPage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
    if (session?.user?.id) setAuthUserId(session.user.id);
    await loadRequest();
  };

  const loadRequest = async () => {
    try {
      if (!requestId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !requestData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRequest(requestData);

      const { data: userRows, error: userError } = await supabase
        .rpc('get_user_public_profile', { user_id: requestData.user_id });

      if (userError || !userRows || userRows.length === 0) {
        setRequester({ full_name: 'Campus Student', department: '', semester: '', is_verified: false });
      } else {
        setRequester(userRows[0]);
      }
    } catch (err) {
      console.error('Load request error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequest();
    setRefreshing(false);
    showToast('Refreshed!');
  };

  const handleRevealWhatsapp = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setRevealLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data: whatsapp, error: revealError } = await supabase
        .rpc('reveal_whatsapp', { target_user_id: request.user_id });

      if (revealError) {
        showToast(
          revealError.message.includes('verified')
            ? 'Contact reveal is available for verified accounts only.'
            : 'Could not retrieve contact info.',
          'error'
        );
        return;
      }
      if (!whatsapp) {
        showToast('Could not retrieve contact info.', 'error');
        return;
      }

      setWhatsappNumber(whatsapp);
      setWhatsappRevealed(true);

      await supabase.from('contacts').upsert(
        [
          {
            user_id: session.user.id,
            contact_user_id: request.user_id,
            contact_name: requester?.full_name || 'Requester',
            contact_whatsapp: whatsapp,
            contact_type: 'requester',
          },
        ],
        { onConflict: 'user_id,contact_user_id' }
      );
    } catch (err) {
      showToast('Error retrieving contact.', 'error');
    } finally {
      setRevealLoading(false);
    }
  };

  const handleContact = () => {
    if (!whatsappNumber) return;
    setContactLoading(true);
    try {
      const messageText = `Hi, I saw your material request for "${request.title}" on Unshelf!`;
      window.open(`https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
      router.push('/chats');
    } catch (err) {
      console.error('Contact error:', err);
    } finally {
      setContactLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    setDeleteLoading(true);
    try {
      const { error: deleteError } = await supabase.from('requests').delete().eq('id', request.id);
      if (deleteError) throw deleteError;
      showToast('Request deleted');
      router.push('/profile');
    } catch (err) {
      showToast('Failed to delete request.', 'error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMarkAsFulfilled = async () => {
    setFulfilledLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'fulfilled' })
        .eq('id', request.id);

      if (error) throw error;
      setRequest((prev) => ({ ...prev, status: 'fulfilled' }));
      showToast('Request marked as fulfilled!');
      setShowFulfilledConfirm(false);
    } catch (err) {
      showToast('Failed to update request.', 'error');
    } finally {
      setFulfilledLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Material Request: ${request.title}`, url });
    } else {
      navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!');
    }
  };

  const isOwner = authUserId && request && request.user_id === authUserId;
  const isFulfilled = request?.status === 'fulfilled';
  const urgencyConfig = URGENCY_STYLES[request?.urgency] || URGENCY_STYLES.Medium;

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-4 py-6">
          <LoadingSkeleton />
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (notFound || !request) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ color: '#1B2A4A' }}>
            Request Details
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-semibold mb-2" style={{ color: '#1B2A4A' }}>
            Request not found
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This material request may have been removed or fulfilled.
          </p>
          <button
            onClick={() => router.push('/search?type=requests')}
            className="px-6 py-3 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
          >
            Browse Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-36">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: '#1B2A4A' }}>
          Material Request
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition"
          style={{ color: '#1877F2' }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-xs">Refresh</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div
          className="rounded-2xl p-5 border relative overflow-hidden"
          style={{
            background: isFulfilled
              ? '#F3F4F6'
              : 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
            borderColor: isFulfilled ? '#E5E7EB' : '#BFDBFE',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{
                background: isFulfilled ? '#E5E7EB' : '#1877F2',
                color: isFulfilled ? '#6B7280' : '#FFFFFF',
              }}
            >
              {isFulfilled ? '✓ Fulfilled' : '📢 Looking For'}
            </span>

            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1"
              style={{
                background: urgencyConfig.bg,
                color: urgencyConfig.text,
                borderColor: urgencyConfig.border,
              }}
            >
              <span>{urgencyConfig.icon}</span>
              {urgencyConfig.label}
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-3" style={{ color: '#1B2A4A' }}>
            {request.title}
          </h2>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-white border border-gray-200 font-medium text-gray-700">
              📚 {request.category}
            </span>
            {request.department && (
              <span className="px-2.5 py-1 rounded-md bg-white border border-gray-200 font-medium text-purple-700">
                🏛️ {request.department}
              </span>
            )}
            {request.semester && (
              <span className="px-2.5 py-1 rounded-md bg-white border border-gray-200 font-medium text-blue-700">
                🎓 {request.semester}
              </span>
            )}
            {request.subject && (
              <span className="px-2.5 py-1 rounded-md bg-white border border-gray-200 font-medium text-amber-700">
                📖 {request.subject}
              </span>
            )}
          </div>
        </div>

        {request.description && (
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Requester Notes & Details
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {request.description}
            </p>
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Requested by
          </h3>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #1877F2, #4F46E5)' }}
              >
                {requester?.full_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <h3 className="font-semibold text-base" style={{ color: '#1B2A4A' }}>
                  {requester?.full_name || 'Campus Student'}
                </h3>
                <p className="text-xs text-gray-500">
                  {[requester?.department, requester?.semester].filter(Boolean).join(' • ') || 'SJCET Student'}
                </p>
              </div>
            </div>
            {requester?.is_verified && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                ✓ Verified
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 pb-4 border-b border-gray-200 text-xs text-gray-500">
            <span>Posted: {new Date(request.created_at).toLocaleDateString()}</span>
            {!isOwner && (
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
              >
                <Flag className="w-3.5 h-3.5" /> Report
              </button>
            )}
          </div>

          <div className="space-y-3 pt-4">
            {isFulfilled ? (
              <div className="w-full py-3 px-4 rounded-xl bg-gray-100 border border-gray-200 text-center">
                <p className="text-sm text-gray-500 font-semibold">
                  This request has been fulfilled
                </p>
              </div>
            ) : isOwner ? (
              <div className="w-full py-3 px-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <p className="text-sm text-blue-700 font-semibold">
                  This is your material request
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  Peers who have this material will contact you via WhatsApp.
                </p>
              </div>
            ) : !whatsappRevealed ? (
              <button
                onClick={handleRevealWhatsapp}
                disabled={revealLoading}
                className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50 active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
              >
                {revealLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Loading...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" /> I Have This Material — Contact Requester
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2.5">
                <div className="w-full py-3 px-4 rounded-xl border border-green-300 bg-green-50 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Requester WhatsApp</p>
                  <p className="font-bold text-green-700 text-base">+91 {whatsappNumber}</p>
                </div>
                <button
                  onClick={handleContact}
                  disabled={contactLoading}
                  className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)' }}
                >
                  {contactLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" /> Connecting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" /> Message on WhatsApp
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={handleShare}
              className="w-full py-2.5 rounded-xl border border-gray-300 font-semibold text-sm hover:bg-gray-50 transition"
              style={{ color: '#1877F2' }}
            >
              <Share2 className="w-4 h-4 inline mr-2" /> Share Request
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-200 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Category</span>
            <span className="font-semibold text-gray-900">{request.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Urgency</span>
            <span className="font-semibold" style={{ color: urgencyConfig.text }}>
              {urgencyConfig.label}
            </span>
          </div>
          {request.department && (
            <div className="flex justify-between">
              <span className="text-gray-600">Department</span>
              <span className="font-semibold text-gray-900">{request.department}</span>
            </div>
          )}
          {request.semester && (
            <div className="flex justify-between">
              <span className="text-gray-600">Semester</span>
              <span className="font-semibold text-gray-900">{request.semester}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className={`font-semibold ${isFulfilled ? 'text-gray-500' : 'text-green-600'}`}>
              {isFulfilled ? 'Fulfilled' : 'Active / Open'}
            </span>
          </div>
        </div>
      </div>

      {isOwner && !isFulfilled && (
        <div className="fixed bottom-20 left-0 right-0 z-20 px-4 pb-2">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-3 flex gap-3">
            <button
              onClick={() => setShowFulfilledConfirm(true)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)' }}
            >
              <CheckCircle className="w-4 h-4" />
              Mark Fulfilled
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center transition active:scale-95"
              style={{ background: '#FEE2E2', color: '#DC2626' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showFulfilledConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center px-4 pb-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1B2A4A' }}>
                Mark as Fulfilled?
              </h3>
              <p className="text-sm text-gray-500">
                This indicates you have received the requested study material.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFulfilledConfirm(false)}
                disabled={fulfilledLoading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsFulfilled}
                disabled={fulfilledLoading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)' }}
              >
                {fulfilledLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Yes, Fulfilled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center px-4 pb-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1B2A4A' }}>
                Delete Request?
              </h3>
              <p className="text-sm text-gray-500">
                This will permanently delete this material request.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequest}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)' }}
              >
                {deleteLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <ReportModal requestId={request.id} onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}
