'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  Loader,
  Trash2,
  CheckCircle,
  RefreshCw,
  Clock,
  Briefcase,
  Wrench,
  AlertCircle,
  Flag,
  Sparkles,
  User,
  ShieldCheck,
} from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ReportModal from '@/components/ReportModal';
import { Toast, useToast } from '@/components/Toast';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id;

  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
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
  }, [serviceId]);

  const initPage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
    if (session?.user?.id) setAuthUserId(session.user.id);
    await loadService();
  };

  const loadService = async () => {
    try {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (serviceError || !serviceData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setService(serviceData);

      const { data: userRows, error: userError } = await supabase
        .rpc('get_user_public_profile', { user_id: serviceData.user_id });

      if (userError || !userRows || userRows.length === 0) {
        setProvider({ full_name: 'Campus Student', department: '', semester: '', is_verified: false });
      } else {
        setProvider(userRows[0]);
      }
    } catch (err) {
      console.error('Load service error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadService();
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

      const { data: userData } = await supabase
        .from('users')
        .select('whatsapp_number')
        .eq('id', service.user_id)
        .single();

      const whatsapp = userData?.whatsapp_number;
      if (!whatsapp) {
        showToast('Could not retrieve contact info.', 'error');
        return;
      }

      setWhatsappNumber(whatsapp);
      setWhatsappRevealed(true);

      // Save to contacts as service provider/seeker
      await supabase.from('contacts').upsert(
        [
          {
            user_id: session.user.id,
            contact_user_id: service.user_id,
            contact_name: provider?.full_name || 'Service Contact',
            contact_whatsapp: whatsapp,
            contact_type: 'service',
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
      const isOffering = service.service_type === 'offering';
      const messageText = isOffering
        ? `Hi, I saw your service "${service.title}" on Unshelf and would like to know more!`
        : `Hi, I saw your request for "${service.title}" on Unshelf and can help you with this!`;
      window.open(`https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
      router.push('/chats');
    } catch (err) {
      console.error('Contact error:', err);
    } finally {
      setContactLoading(false);
    }
  };

  const handleDeleteService = async () => {
    setDeleteLoading(true);
    try {
      const { error: deleteError } = await supabase.from('services').delete().eq('id', service.id);
      if (deleteError) throw deleteError;
      showToast('Service deleted successfully');
      router.push('/profile');
    } catch (err) {
      showToast('Failed to delete service.', 'error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleStatus = async () => {
    setStatusLoading(true);
    try {
      const nextStatus = service.status === 'open' ? 'closed' : 'open';
      const { error } = await supabase
        .from('services')
        .update({ status: nextStatus })
        .eq('id', service.id);

      if (error) throw error;
      setService((prev) => ({ ...prev, status: nextStatus }));
      showToast(nextStatus === 'closed' ? 'Service marked as closed.' : 'Service reopened!');
      setShowStatusConfirm(false);
    } catch (err) {
      showToast('Failed to update status.', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${service.title} - Unshelf Services`,
          text: `Check out this student service on Unshelf: ${service.title}`,
          url,
        });
      } catch (err) {
        // Share dismissed
      }
    } else {
      navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] p-4 max-w-2xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-[#8A8272] mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold text-[#1B2A4A] mb-2">Service Not Found</h2>
          <p className="text-sm text-[#5B5647] mb-6">This service might have been deleted or closed.</p>
          <button
            onClick={() => router.push('/search?type=services')}
            className="px-6 py-2.5 rounded-full font-semibold text-white text-sm bg-[#1B2A4A] hover:shadow-lg transition"
          >
            Browse Student Services
          </button>
        </div>
      </div>
    );
  }

  const isOwner = authUserId && authUserId === service.user_id;
  const isOffering = service.service_type === 'offering';
  const isOpen = service.status === 'open';

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <Toast toast={toast} onClose={hideToast} />

      {/* TOP NAVIGATION BAR */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#EDE6D6] z-20">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-2 hover:bg-gray-100 rounded-full transition text-[#1B2A4A]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              aria-label="Refresh page"
              className="p-2 hover:bg-gray-100 rounded-full transition text-[#1B2A4A]"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              aria-label="Share service"
              className="p-2 hover:bg-gray-100 rounded-full transition text-[#1B2A4A]"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {!isOwner && (
              <button
                onClick={() => setShowReportModal(true)}
                aria-label="Report service"
                className="p-2 hover:bg-red-50 rounded-full transition text-red-500"
              >
                <Flag className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* HERO BANNER */}
        <div
          className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg"
          style={{
            background: isOffering
              ? 'linear-gradient(135deg, #15803D, #166534)'
              : 'linear-gradient(135deg, #B45309, #78350F)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {isOffering ? <Briefcase className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                {isOffering ? 'Service Offered' : 'Service Needed'}
              </span>
              <span className="bg-white/15 px-3 py-1 rounded-full text-xs font-semibold">
                {service.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isOpen ? 'bg-emerald-400/30 text-emerald-100 border border-emerald-300/40' : 'bg-gray-800/50 text-gray-200'
                }`}
              >
                {isOpen ? '● Active' : '● Closed'}
              </span>
            </div>
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold leading-snug mb-3 relative z-10">
            {service.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-white/85 relative z-10">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 opacity-80" />
              <span>Posted {new Date(service.created_at).toLocaleDateString()}</span>
            </div>
            {service.department && (
              <span>• Dept: <strong>{service.department}</strong></span>
            )}
            {service.semester && (
              <span>• Sem: <strong>{service.semester}</strong></span>
            )}
          </div>

          {/* Rate Box in Hero */}
          <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">Pricing / Rate</p>
              <p className="text-xl md:text-2xl font-bold font-display text-amber-200">{service.rate || 'Negotiable'}</p>
            </div>
            {isOpen && !isOwner && (
              <span className="text-xs bg-white text-[#1B2A4A] font-bold px-3.5 py-1.5 rounded-full shadow-sm">
                Available on Campus
              </span>
            )}
          </div>

          {/* Background decorative blob */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* STATUS ALERT IF CLOSED */}
        {!isOpen && (
          <div className="p-4 rounded-2xl bg-gray-100 border border-gray-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-gray-600 shrink-0" />
            <div className="text-xs text-gray-700">
              <strong>This service is currently closed.</strong> The creator is no longer accepting new requests or offers for this listing.
            </div>
          </div>
        )}

        {/* SERVICE DESCRIPTION & DETAILS */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#EDE6D6] shadow-xs space-y-4">
          <h2 className="text-base font-display font-bold text-[#1B2A4A] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#27AE60]" />
            About This Service
          </h2>

          <div className="text-sm text-[#3E3A30] leading-relaxed whitespace-pre-wrap">
            {service.description || 'No additional description provided by the student.'}
          </div>

          <div className="pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#F9F7F1] p-3 rounded-xl">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Category</span>
              <span className="font-semibold text-[#1B2A4A]">{service.category}</span>
            </div>
            <div className="bg-[#F9F7F1] p-3 rounded-xl">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Rate</span>
              <span className="font-semibold text-[#1B2A4A]">{service.rate || 'Negotiable'}</span>
            </div>
            <div className="bg-[#F9F7F1] p-3 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Campus Branch</span>
              <span className="font-semibold text-[#1B2A4A]">
                {service.department || 'Any Branch'} {service.semester ? `(${service.semester})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* POSTER PROFILE CARD */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#EDE6D6] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-bold text-[#1B2A4A] flex items-center gap-2">
              <User className="w-4 h-4 text-[#1B2A4A]" />
              {isOffering ? 'Service Provider' : 'Requested By'}
            </h2>
            {provider?.is_verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Student
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center font-display font-bold text-lg shadow-sm">
              {provider?.full_name ? provider.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="font-bold text-sm text-[#1B2A4A]">{provider?.full_name || 'Campus Student'}</p>
              <p className="text-xs text-[#8A8272]">
                {provider?.department ? `${provider.department} Dept` : 'College Student'}
                {provider?.semester ? ` • Semester ${provider.semester}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* OWNER CONTROLS (IF CURRENT USER IS OWNER) */}
        {isOwner && (
          <div className="bg-[#FFFDF9] rounded-3xl p-6 border-2 border-[#E5DCC6] shadow-xs space-y-4">
            <h3 className="text-sm font-display font-bold text-[#1B2A4A]">Manage Your Service</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowStatusConfirm(true)}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
                  isOpen
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {isOpen ? 'Mark Service as Closed' : 'Reopen Service'}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-red-100 text-red-700 hover:bg-red-200 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Service
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTACT BAR FOR VIEWERS */}
      {!isOwner && isOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#EDE6D6] p-4 z-30 shadow-xl">
          <div className="max-w-md mx-auto flex items-center gap-3">
            {!whatsappRevealed ? (
              <button
                onClick={handleRevealWhatsapp}
                disabled={revealLoading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-white text-sm transition hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
              >
                {revealLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Connect on WhatsApp
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleContact}
                disabled={contactLoading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-white text-sm transition hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer bg-[#25D366] hover:bg-[#20bd5a]"
              >
                <MessageCircle className="w-5 h-5" />
                Open WhatsApp Chat (+91 {whatsappNumber})
              </button>
            )}
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReportModal && (
        <ReportModal
          serviceId={service.id}
          serviceTitle={service.title}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* STATUS TOGGLE CONFIRM MODAL */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-[#1B2A4A]">
              {isOpen ? 'Close this service?' : 'Reopen this service?'}
            </h3>
            <p className="text-xs text-[#5B5647] leading-relaxed">
              {isOpen
                ? 'Closing this service will mark it as inactive and hide the contact button from other students.'
                : 'Reopening will make this service active again and visible to all students on campus.'}
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowStatusConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={statusLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1B2A4A] hover:bg-black transition flex items-center gap-1.5"
              >
                {statusLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Service?
            </h3>
            <p className="text-xs text-[#5B5647] leading-relaxed">
              Are you sure you want to delete <strong>"{service.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-1.5"
              >
                {deleteLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
