'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, MessageCircle, Share2, Loader, Eye, Trash2 } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import RatingModal from '@/components/RatingModal';
import ReviewCard from '@/components/ReviewCard';
import SellerRating from '@/components/SellerRating';
import ReportModal from '@/components/ReportModal';

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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [whatsappRevealed, setWhatsappRevealed] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealCount, setRevealCount] = useState(0);

  useEffect(() => {
    initPage();
  }, [listingId]);

  const initPage = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    if (session?.user?.id) setAuthUserId(session.user.id);

    await loadListing();
  };

  const loadListing = async () => {
    try {
      if (!listingId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError || !listingData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setListing(listingData);

      // ✅ FIX: Use RPC function (SECURITY DEFINER bypasses RLS)
      const { data: sellerRows, error: sellerError } = await supabase
        .rpc('get_user_public_profile', { user_id: listingData.user_id });

      if (sellerError || !sellerRows || sellerRows.length === 0) {
        setSeller({ full_name: 'Unknown Seller', department: '', semester: '', is_verified: false, rating: 0, total_reviews: 0 });
      } else {
        setSeller(sellerRows[0]);
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', listingData.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      setReviews(reviewsData || []);
    } catch (err) {
      console.error('Load listing error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealWhatsapp = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (revealCount >= 5) {
      alert('Too many contact requests. Please try again later.');
      return;
    }

    setRevealLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      // ✅ Use RPC to get whatsapp too (bypasses RLS)
      const { data: contactRows, error } = await supabase
        .rpc('get_user_public_profile', { user_id: listing.user_id });

      // Fallback: try direct query for whatsapp
      const { data: whatsappData } = await supabase
        .from('users')
        .select('whatsapp_number')
        .eq('id', listing.user_id)
        .single();

      const whatsapp = whatsappData?.whatsapp_number;

      if (!whatsapp) {
        alert('Could not retrieve contact info. Please try again.');
        return;
      }

      setWhatsappNumber(whatsapp);
      setWhatsappRevealed(true);
      setRevealCount((prev) => prev + 1);

      await supabase.from('contacts').upsert(
        [{
          user_id: session.user.id,
          contact_user_id: listing.user_id,
          contact_name: seller?.full_name || 'Seller',
          contact_whatsapp: whatsapp,
          contact_type: 'seller',
        }],
        { onConflict: 'user_id,contact_user_id' }
      );
    } catch (err) {
      console.error('Reveal error:', err);
      alert('Error retrieving contact. Please try again.');
    } finally {
      setRevealLoading(false);
    }
  };

  const handleContact = async () => {
    if (!whatsappNumber) return;
    setContactLoading(true);
    try {
      window.open(`https://wa.me/91${whatsappNumber}`, '_blank');
      router.push('/chats');
    } catch (err) {
      console.error('Contact error:', err);
    } finally {
      setContactLoading(false);
    }
  };

  const handleDeleteListing = async () => {
    setDeleteLoading(true);
    try {
      if (listing.image_url) {
        const path = listing.image_url.split('/listings/')[1];
        if (path) await supabase.storage.from('listings').remove([path]);
      }

      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (deleteError) throw deleteError;

      router.push('/profile');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const isOwner = authUserId && listing && listing.user_id === authUserId;

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-4 py-6">
          <LoadingSkeleton />
          <LoadingSkeleton />
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ color: '#1B2A4A' }}>Item Details</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg font-semibold mb-2" style={{ color: '#1B2A4A' }}>Listing not found</p>
          <p className="text-sm text-gray-500 mb-6">This listing may have been removed or is no longer available.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
          >
            Browse Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: '#1B2A4A' }}>Item Details</h1>
        {isOwner && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-lg hover:bg-red-50 transition"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        )}
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Image */}
        {listing.image_url && (
          <div className="w-full h-64 bg-gray-200 rounded-xl overflow-hidden">
            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Title & Price */}
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1B2A4A' }}>{listing.title}</h2>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{listing.category}</span>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                background: listing.condition === 'Like New' ? '#E0F2FE' : listing.condition === 'Good' ? '#DCFCE7' : listing.condition === 'Used' ? '#FEF3C7' : '#FECACA',
                color: listing.condition === 'Like New' ? '#0369A1' : listing.condition === 'Good' ? '#166534' : listing.condition === 'Used' ? '#92400E' : '#DC2626',
              }}
            >
              {listing.condition}
            </span>
            {listing.semester && <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{listing.semester}</span>}
            {listing.department && <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">{listing.department}</span>}
          </div>
          {listing.is_free ? (
            <p className="text-3xl font-bold text-green-600">Free</p>
          ) : (
            <p className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>₹{listing.price?.toLocaleString()}</p>
          )}
        </div>

        {/* Subject */}
        {listing.subject && (
          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#1B2A4A' }}>Subject/Topic</h3>
            <p className="text-gray-600">{listing.subject}</p>
          </div>
        )}

        {/* Seller Card */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Listed by</h3>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1877F2, #27AE60)' }}
              >
                {seller?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: '#1B2A4A' }}>{seller?.full_name || 'Unknown Seller'}</h3>
                <p className="text-sm text-gray-500">
                  {[seller?.department, seller?.semester].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
            {seller?.is_verified && <span className="text-green-600 text-lg">✓</span>}
          </div>

          {seller?.rating > 0 && (
            <div className="mb-3">
              <SellerRating rating={seller.rating} totalReviews={seller.total_reviews} />
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
            {seller?.is_verified && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-100">
                <span className="text-green-600">✓</span>
                <span className="text-xs font-semibold text-green-700">Verified</span>
              </div>
            )}
            {!isOwner && (
              <button
                onClick={() => setShowReportModal(true)}
                className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
                style={{ color: '#DC2626', background: '#FEE2E2' }}
              >
                🚩 Report
              </button>
            )}
          </div>

          {/* Contact Buttons */}
          <div className="space-y-2">
            {isOwner ? (
              <div className="w-full py-3 px-4 rounded-lg bg-gray-100 text-center">
                <p className="text-sm text-gray-500 font-medium">This is your listing</p>
              </div>
            ) : !whatsappRevealed ? (
              <button
                onClick={handleRevealWhatsapp}
                disabled={revealLoading}
                className="w-full py-3 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
              >
                {revealLoading ? <><Loader className="w-4 h-4 animate-spin" /> Loading...</> : <><Eye className="w-4 h-4" /> Contact via WhatsApp</>}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="w-full py-2.5 px-4 rounded-lg border border-green-300 bg-green-50 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">WhatsApp Number</p>
                  <p className="font-bold text-green-700">+91 {whatsappNumber}</p>
                </div>
                <button
                  onClick={handleContact}
                  disabled={contactLoading}
                  className="w-full py-3 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)' }}
                >
                  {contactLoading ? <><Loader className="w-4 h-4 animate-spin" /> Connecting...</> : <><MessageCircle className="w-4 h-4" /> Open WhatsApp</>}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: listing.title, url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert('Link copied!');
                }
              }}
              className="w-full py-2.5 rounded-lg border border-gray-300 font-semibold text-sm"
              style={{ color: '#1877F2' }}
            >
              <Share2 className="w-4 h-4 inline mr-2" /> Share Listing
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>Reviews</h3>
            {/* ✅ FIX: Use isOwner instead of email comparison */}
            {currentUser && !isOwner && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: '#EFF6FF', color: '#1877F2' }}
              >
                + Review
              </button>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-2">No reviews yet</p>
              {currentUser && !isOwner && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="text-sm font-semibold"
                  style={{ color: '#1877F2' }}
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
                  reviewer={review.reviewer_id === authUserId ? currentUser : { full_name: 'User' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* More Info */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Category</span>
            <span className="font-semibold">{listing.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Condition</span>
            <span className="font-semibold">{listing.condition}</span>
          </div>
          {listing.department && (
            <div className="flex justify-between">
              <span className="text-gray-600">Department</span>
              <span className="font-semibold">{listing.department}</span>
            </div>
          )}
          {listing.semester && (
            <div className="flex justify-between">
              <span className="text-gray-600">Semester</span>
              <span className="font-semibold">{listing.semester}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Posted</span>
            <span className="font-semibold">{new Date(listing.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center px-4 pb-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1B2A4A' }}>Delete Listing?</h3>
              <p className="text-sm text-gray-500">This will permanently remove "{listing.title}" and cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200"
                style={{ color: '#6B7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteListing}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)' }}
              >
                {deleteLoading ? <><Loader className="w-4 h-4 animate-spin" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          sellerId={listing.user_id}
          listingId={listing.id}
          onClose={() => setShowRatingModal(false)}
          onSuccess={() => loadListing()}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          listingId={listing.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
