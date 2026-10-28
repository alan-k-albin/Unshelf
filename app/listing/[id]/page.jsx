'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, MessageCircle, Share2, Loader, Eye, Trash2, CheckSquare, Edit, RefreshCw, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import RatingModal from '@/components/RatingModal';
import ReviewCard from '@/components/ReviewCard';
import SellerRating from '@/components/SellerRating';
import ReportModal from '@/components/ReportModal';
import ChatButton from '@/components/ChatButton';
import ConditionLabel from '@/components/ConditionLabel';
import { Toast, useToast } from '@/components/Toast';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id;

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [soldLoading, setSoldLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => { initPage(); }, [listingId]);

  const initPage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
    if (session?.user?.id) setAuthUserId(session.user.id);
    await loadListing();
  };

  const loadListing = async () => {
    try {
      if (!listingId) { setNotFound(true); setLoading(false); return; }

      const { data: listingData, error: listingError } = await supabase
        .from('listings').select('*').eq('id', listingId).single();

      if (listingError || !listingData) { setNotFound(true); setLoading(false); return; }
      if (listingData.is_hidden) {
        setIsHidden(true);
        setLoading(false);
        return;
      }
      setListing(listingData);

      const { data: sellerRows, error: sellerError } = await supabase
        .rpc('get_user_public_profile', { user_id: listingData.user_id });

      if (sellerError || !sellerRows || sellerRows.length === 0) {
        setSeller({ full_name: 'Unknown Seller', department: '', semester: '', is_verified: false });
      } else {
        setSeller(sellerRows[0]);
      }

      const { data: reviewsData } = await supabase
        .from('reviews').select('*').eq('seller_id', listingData.user_id)
        .order('created_at', { ascending: false }).limit(5);

      setReviews(reviewsData || []);
    } catch (err) {
      console.error('Load listing error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadListing();
    setRefreshing(false);
    showToast('Refreshed!');
  };

  const handleDeleteListing = async () => {
    setDeleteLoading(true);
    try {
      const imagesToDelete = (listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0)
        ? listing.image_urls
        : (listing.image_url ? [listing.image_url] : []);
      const paths = imagesToDelete
        .map((url) => (url ? url.split('/listings/')[1] : null))
        .filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from('listings').remove(paths);
      }
      const { error: deleteError } = await supabase.from('listings').delete().eq('id', listing.id);
      if (deleteError) throw deleteError;
      router.push('/profile');
    } catch (err) {
      showToast('Failed to delete listing.', 'error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMarkAsSold = async () => {
    setSoldLoading(true);
    try {
      const { error } = await supabase.from('listings').update({ status: 'Sold' }).eq('id', listing.id);
      if (error) throw error;
      setListing((prev) => ({ ...prev, status: 'Sold' }));
      showToast('Listing marked as sold!');
      setShowSoldConfirm(false);
    } catch (err) {
      showToast('Failed to mark as sold.', 'error');
    } finally {
      setSoldLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: listing.title, url });
    } else {
      navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!');
    }
  };

  const isOwner = authUserId && listing && listing.user_id === authUserId;
  const isSold = listing?.status === 'Sold';
  const images = (listing?.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0)
    ? listing.image_urls
    : (listing?.image_url ? [listing.image_url] : []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] pb-20 font-body">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (isHidden) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] font-body">
        <div className="sticky top-0 bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] z-10 flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#F3EEDC] rounded-xl text-[#1B2A4A] transition"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-display font-bold flex-1 text-[#1B2A4A]">Item Details</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-[#B23A2E]" />
          </div>
          <h2 className="text-xl font-display font-bold mb-2 text-[#1B2A4A]">Post Unavailable</h2>
          <p className="text-sm text-[#8A8272] mb-6 max-w-xs">This post was removed.</p>
          <button onClick={() => router.push('/search')}
            className="px-6 py-3 rounded-xl font-semibold text-white text-base btn-action-green transition active:scale-[0.98]">Browse Listings</button>
        </div>
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] font-body">
        <div className="sticky top-0 bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] z-10 flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#F3EEDC] rounded-xl text-[#1B2A4A] transition"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-display font-bold flex-1 text-[#1B2A4A]">Item Details</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EDE6D6]/60 flex items-center justify-center text-3xl mb-4 text-[#8A8272]">📭</div>
          <h2 className="text-xl font-display font-bold mb-2 text-[#1B2A4A]">Listing not found</h2>
          <p className="text-sm text-[#8A8272] mb-6 max-w-xs">This listing may have been removed or is no longer available.</p>
          <button onClick={() => router.push('/search')}
            className="px-6 py-3 rounded-xl font-semibold text-white text-base btn-action-green transition active:scale-[0.98]">Browse Listings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F1] font-body pb-36">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Image Zoom Modal */}
      {showImageZoom && images.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 select-none"
          onClick={() => setShowImageZoom(false)}>
          <button
            onClick={() => setShowImageZoom(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition text-white z-10"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition text-white z-10"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
              <div className="absolute top-4 left-4 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {activeImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          <img
            src={images[activeImageIndex] || images[0]}
            alt={listing.title}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3.5">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold flex-1 text-[#1B2A4A]">Item Details</h1>
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
        {images.length > 0 && (
          <div className="space-y-3">
            <div
              className="w-full h-72 sm:h-80 bg-white/60 rounded-2xl overflow-hidden cursor-zoom-in relative border border-[#EDE6D6] shadow-xs"
              onClick={() => setShowImageZoom(true)}
            >
              <img
                src={images[activeImageIndex] || images[0]}
                alt={listing.title}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2.5 left-2.5 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                </>
              )}

              <div className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                Tap to zoom
              </div>

              {isSold && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-xs">
                  <span className="text-white text-2xl font-display font-bold bg-[#DC2626] px-6 py-2 rounded-xl rotate-[-12deg] shadow-lg">
                    SOLD
                  </span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                      activeImageIndex === idx
                        ? 'border-[#1B2A4A] ring-2 ring-[#EDE6D6]'
                        : 'border-[#EDE6D6] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-[#EDE6D6] shadow-xs space-y-4">
          <div className="flex items-start gap-2 justify-between">
            <h2 className="text-2xl sm:text-3xl font-display font-bold flex-1 text-[#1B2A4A] leading-tight">
              {listing.title}
            </h2>
            {isSold && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 uppercase tracking-wider">
                SOLD
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-[#EAE5D9] text-[#1B2A4A] font-medium">
              {listing.category}
            </span>
            <ConditionLabel condition={listing.condition} />
            {listing.semester && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-[#EAE5D9] text-[#1B2A4A] font-medium">
                {listing.semester}
              </span>
            )}
            {listing.department && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-[#EAE5D9] text-[#1B2A4A] font-medium">
                {listing.department}
              </span>
            )}
          </div>

          <div className="pt-2">
            {listing.is_free ? (
              <p className="text-3xl font-display font-bold text-[#27AE60]">Free</p>
            ) : (
              <p className="text-3xl font-display font-bold text-[#1B2A4A]">₹{listing.price?.toLocaleString()}</p>
            )}
          </div>

          {listing.subject && (
            <div className="pt-2 border-t border-[#EDE6D6]/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A8272] mb-1">Subject / Course</h3>
              <p className="text-sm font-medium text-[#1B2A4A]">{listing.subject}</p>
            </div>
          )}
        </div>

        {/* Seller Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#EDE6D6] shadow-xs">
          <h3 className="text-xs font-bold text-[#8A8272] uppercase tracking-wider mb-3">Listed by</h3>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0 bg-[#1B2A4A] shadow-xs">
                {seller?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-display font-semibold text-[#1B2A4A]">{seller?.full_name || 'Unknown Seller'}</h3>
                <p className="text-xs text-[#8A8272]">
                  {[seller?.department, seller?.semester].filter(Boolean).join(' • ') || 'SJCET Student'}
                </p>
              </div>
            </div>
            {seller?.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                <Check className="w-3 h-3" /> Verified
              </span>
            )}
          </div>

          {seller?.rating > 0 && (
            <div className="mb-3">
              <SellerRating rating={seller.rating} totalReviews={seller.total_reviews} />
            </div>
          )}

          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EDE6D6]/60">
            <span className="text-xs text-[#8A8272]">Member of college campus</span>
            {!isOwner && (
              <button
                onClick={() => setShowReportModal(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 p-1 rounded-md transition"
              >
                🚩 Report
              </button>
            )}
          </div>

          <div className="space-y-2">
            {isSold ? (
              <div className="w-full py-3 px-4 rounded-xl bg-red-50 border border-red-200 text-center">
                <p className="text-sm text-red-600 font-semibold">This item has been sold</p>
              </div>
            ) : (
              <ChatButton
                listingId={listing.id}
                posterId={listing.user_id}
                poster={seller}
                isOwner={isOwner}
                currentUser={currentUser}
                viewerLoading={loading}
                showToast={showToast}
                buttonText="Chat with Seller"
              />
            )}

            <button
              onClick={handleShare}
              className="w-full py-2.5 rounded-xl border border-[#EDE6D6] hover:bg-[#FAF6EE] font-semibold text-sm text-[#1B2A4A] transition"
            >
              <Share2 className="w-4 h-4 inline mr-2 text-[#8A8272]" /> Share Listing
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-[#1B2A4A]">Reviews</h3>
            {currentUser && !isOwner && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF6EE] border border-[#EDE6D6] text-[#1B2A4A] hover:bg-white transition"
              >
                + Review
              </button>
            )}
          </div>
          {reviews.length === 0 ? (
            <div className="text-center py-6 bg-white rounded-2xl border border-[#EDE6D6] p-6">
              <p className="text-[#8A8272] text-sm mb-2">No reviews yet for this student.</p>
              {currentUser && !isOwner && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="text-sm font-semibold text-[#1B2A4A] underline"
                >
                  Be the first to review
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  reviewer={review.reviewer_id === authUserId ? currentUser : { full_name: 'Student' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details Table */}
        <div className="bg-white rounded-2xl p-5 space-y-3 border border-[#EDE6D6] text-sm">
          <div className="flex justify-between py-1 border-b border-[#EDE6D6]/40">
            <span className="text-[#8A8272]">Category</span>
            <span className="font-semibold text-[#1B2A4A]">{listing.category}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#EDE6D6]/40">
            <span className="text-[#8A8272]">Condition</span>
            <span className="font-semibold text-[#1B2A4A]">{listing.condition}</span>
          </div>
          {listing.department && (
            <div className="flex justify-between py-1 border-b border-[#EDE6D6]/40">
              <span className="text-[#8A8272]">Department</span>
              <span className="font-semibold text-[#1B2A4A]">{listing.department}</span>
            </div>
          )}
          {listing.semester && (
            <div className="flex justify-between py-1 border-b border-[#EDE6D6]/40">
              <span className="text-[#8A8272]">Semester</span>
              <span className="font-semibold text-[#1B2A4A]">{listing.semester}</span>
            </div>
          )}
          <div className="flex justify-between py-1 border-b border-[#EDE6D6]/40">
            <span className="text-[#8A8272]">Status</span>
            <span className={`font-semibold ${isSold ? 'text-red-600' : 'text-[#27AE60]'}`}>{listing.status}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#8A8272]">Posted</span>
            <span className="font-semibold text-[#1B2A4A]">{new Date(listing.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Floating Owner Bar */}
      {isOwner && !isSold && (
        <div className="fixed bottom-20 left-0 right-0 z-20 px-4 pb-2">
          <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#EDE6D6] p-3 flex gap-3">
            <button
              onClick={() => router.push(`/edit-listing/${listing.id}`)}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-[#EDE6D6] bg-[#FAF6EE] text-[#1B2A4A] hover:bg-white transition active:scale-[0.98]"
            >
              <Edit className="w-4 h-4" />
              Edit Listing
            </button>
            <button
              onClick={() => setShowSoldConfirm(true)}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 btn-action-green transition active:scale-[0.98]"
            >
              <CheckSquare className="w-4 h-4" />
              Mark as Sold
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

      {showSoldConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end md:items-center justify-center px-4 pb-6">
          <div className="bg-[#FBF8F1] rounded-2xl border border-[#EDE6D6] p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-7 h-7 text-[#27AE60]" />
              </div>
              <h3 className="text-lg font-display font-bold mb-1 text-[#1B2A4A]">Mark as Sold?</h3>
              <p className="text-sm text-[#8A8272]">Buyers won't be able to contact you for this listing.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSoldConfirm(false)}
                disabled={soldLoading}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm border border-[#EDE6D6] hover:bg-[#F3EEDC] text-[#5B5647]"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsSold}
                disabled={soldLoading}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 btn-action-green"
              >
                {soldLoading ? <><Loader className="w-4 h-4 animate-spin" /> Updating...</> : 'Mark Sold'}
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
              <h3 className="text-lg font-display font-bold mb-1 text-[#1B2A4A]">Delete Listing?</h3>
              <p className="text-sm text-[#8A8272]">This will permanently remove "{listing.title}" and cannot be undone.</p>
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
                onClick={handleDeleteListing}
                disabled={deleteLoading}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 bg-[#DC2626] hover:bg-[#B91C1C]"
              >
                {deleteLoading ? <><Loader className="w-4 h-4 animate-spin" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && (
        <RatingModal sellerId={listing.user_id} listingId={listing.id}
          onClose={() => setShowRatingModal(false)} onSuccess={() => loadListing()} />
      )}
      {showReportModal && (
        <ReportModal listingId={listing.id} onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}
