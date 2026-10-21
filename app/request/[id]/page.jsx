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
  Check,
} from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ReportModal from '@/components/ReportModal';
import ChatButton from '@/components/ChatButton';
import { Toast, useToast } from '@/components/Toast';

const URGENCY_STYLES = {
  High: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Urgent' },
  Medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'Medium Urgency' },
  Low: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', label: 'Low Urgency' },
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
      <div className="min-h-screen bg-[#FBF8F1] pb-20 font-body">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <LoadingSkeleton />
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (notFound || !request) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] font-body">
        <div className="sticky top-0 bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] z-10">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-display font-bold flex-1 text-[#1B2A4A]">
              Request Details
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EDE6D6]/60 flex items-center justify-center text-3xl mb-4 text-[#8A8272]">🔍</div>
          <h2 className="text-xl font-display font-bold mb-2 text-[#1B2A4A]">
            Request not found
          </h2>
          <p className="text-sm text-[#8A8272] mb-6 max-w-xs">
            This material request may have been removed or fulfilled.
          </p>
          <button
            onClick={() => router.push('/search?type=requests')}
            className="px-6 py-3 rounded-xl font-semibold text-white text-base btn-action-green transition active:scale-[0.98]"
          >
            Browse Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F1] font-body pb-36">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="sticky top-0 bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3.5">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold flex-1 text-[#1B2A4A]">
            Material Request
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#EDE6D6] hover:bg-white text-[#1B2A4A] transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-[#EDE6D6] shadow-xs space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isFulfilled
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-[#1B2A4A] text-white'
              }`}
            >
              {isFulfilled ? '✓ Fulfilled' : 'Looking For'}
            </span>

            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5"
              style={{
                background: urgencyConfig.bg,
                color: urgencyConfig.text,
                borderColor: urgencyConfig.border,
              }}
            >
              <Clock className="w-3.5 h-3.5" />
              {urgencyConfig.label}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#1B2A4A] leading-tight">
            {request.title}
          </h2>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-[#EAE5D9] text-[#1B2A4A] font-medium">
              {request.category}
            </span>
            {request.department && (
              <span className="px-2.5 py-1 rounded-lg bg-[#EAE5D9] text-[#1B2A4A] font-medium">
                {request.department}
              </span>
            )}
            {request.semester && (
              <span className="px-2.5 py-1 rounded-lg bg-[#EAE5D9] text-[#1B2A4A] font-medium">
                {request.semester}
              </span>
            )}
            {request.subject && (
              <span className="px-2.5 py-1 rounded-lg bg-[#EAE5D9] text-[#1B2A4A] font-medium">
                {request.subject}
              </span>
            )}
          </div>
        </div>

        {request.description && (
          <div className="bg-white rounded-2xl p-5 border border-[#EDE6D6] shadow-xs">
            <h3 className="text-xs font-bold text-[#8A8272] uppercase tracking-wider mb-2">
              Requester Notes & Details
            </h3>
            <p className="text-sm text-[#3E3A30] whitespace-pre-wrap leading-relaxed">
              {request.description}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 border border-[#EDE6D6] shadow-xs">
          <h3 className="text-xs font-bold text-[#8A8272] uppercase tracking-wider mb-3">
            Requested by
          </h3>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0 bg-[#1B2A4A] shadow-xs"
              >
                {requester?.full_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <h3 className="font-display font-semibold text-[#1B2A4A]">
                  {requester?.full_name || 'Campus Student'}
                </h3>
                <p className="text-xs text-[#8A8272]">
                  {[requester?.department, requester?.semester].filter(Boolean).join(' • ') || 'SJCET Student'}
                </p>
              </div>
            </div>
            {requester?.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                <Check className="w-3 h-3" /> Verified
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 pb-3 border-b border-[#EDE6D6]/60 text-xs text-[#8A8272]">
            <span>Posted: {new Date(request.created_at).toLocaleDateString()}</span>
            {!isOwner && (
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <Flag className="w-3.5 h-3.5" /> Report
              </button>
            )}
          </div>

          <div className="space-y-3 pt-4">
            {isFulfilled ? (
              <div className="w-full py-3 px-4 rounded-xl bg-[#FAF6EE] border border-[#EDE6D6] text-center">
                <p className="text-sm text-[#8A8272] font-semibold">
                  This request has been fulfilled
                </p>
              </div>
            ) : isOwner ? (
              <div className="w-full py-3 px-4 rounded-xl bg-[#FAF6EE] border border-[#EDE6D6] text-center">
                <p className="text-sm text-[#1B2A4A] font-semibold">
                  This is your material request
                </p>
              </div>
            ) : (
              <ChatButton
                requestId={request.id}
                posterId={request.user_id}
                poster={requester}
                isOwner={isOwner}
                currentUser={currentUser}
                viewerLoading={loading}
                showToast={showToast}
                buttonText="Chat with Requester"
              />
            )}

            <button
              onClick={handleShare}
              className="w-full py-2.5 rounded-xl border border-[#EDE6D6] hover:bg-[#FAF6EE] font-semibold text-sm text-[#1B2A4A] transition"
            >
              <Share2 className="w-4 h-4 inline mr-2 text-[#8A8272]" /> Share Request
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 space-y-3 border border-[#EDE6D6] text-sm">
          <div className="flex justify-between py-1 border-b border-[#EDE6D6]/40">
            <span className="text-[#8A8272]">Category</span>
            <span className="font-semibold text-[#1B2A4A]">{request.category}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#EDE6D6]/40">
            <span className="text-[#8A8272]">Urgency</span>
            <span className="font-semibold" style={{ color: urgencyConfig.text }}>
              {urgencyConfig.label}
            </span>
          </div>
          {request.department && (
            <div className="flex justify-between py-1 border-b border-[#EDE6D6]/40">
              <span className="text-[#8A8272]">Department</span>
              <span className="font-semibold text-[#1B2A4A]">{request.department}</span>
            </div>
          )}
          {request.semester && (
            <div className="flex justify-between py-1 border-b border-[#EDE6D6]/40">
              <span className="text-[#8A8272]">Semester</span>
              <span className="font-semibold text-[#1B2A4A]">{request.semester}</span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-[#8A8272]">Status</span>
            <span className={`font-semibold ${isFulfilled ? 'text-[#8A8272]' : 'text-[#27AE60]'}`}>
              {isFulfilled ? 'Fulfilled' : 'Active / Open'}
            </span>
          </div>
        </div>
      </div>

      {isOwner && !isFulfilled && (
        <div className="fixed bottom-20 left-0 right-0 z-20 px-4 pb-2">
          <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#EDE6D6] p-3 flex gap-3">
            <button
              onClick={() => setShowFulfilledConfirm(true)}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 btn-action-green transition active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Fulfilled
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showFulfilledConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end md:items-center justify-center px-4 pb-6">
          <div className="bg-[#FBF8F1] rounded-2xl border border-[#EDE6D6] p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-[#27AE60]" />
              </div>
              <h3 className="text-lg font-display font-bold mb-1 text-[#1B2A4A]">
                Mark as Fulfilled?
              </h3>
              <p className="text-sm text-[#8A8272]">
                This indicates you have received the requested study material.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFulfilledConfirm(false)}
                disabled={fulfilledLoading}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm border border-[#EDE6D6] hover:bg-[#F3EEDC] text-[#5B5647]"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsFulfilled}
                disabled={fulfilledLoading}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 btn-action-green"
              >
                {fulfilledLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Yes, Fulfilled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end md:items-center justify-center px-4 pb-6">
          <div className="bg-[#FBF8F1] rounded-2xl border border-[#EDE6D6] p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-display font-bold mb-1 text-[#1B2A4A]">
                Delete Request?
              </h3>
              <p className="text-sm text-[#8A8272]">
                This will permanently delete this material request.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm border border-[#EDE6D6] hover:bg-[#F3EEDC] text-[#5B5647]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequest}
                disabled={deleteLoading}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 bg-[#DC2626] hover:bg-[#B91C1C]"
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
