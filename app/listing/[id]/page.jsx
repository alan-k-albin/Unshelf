'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, MessageCircle, Share2, Loader, Eye } from 'lucide-react';
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
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  // ✅ FIX 2: WhatsApp number hidden by default
  const [whatsappRevealed, setWhatsappRevealed] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealCount, setRevealCount] = useState(0);

  useEffect(() => {
    loadListing();
    loadCurrentUser();
  }, [listingId]);

  const loadCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  };

  const loadListing = async () => {
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError) throw listingError;
      setListing(listingData);

      // ✅ FIX 2: Fetch seller WITHOUT whatsapp_number
      const { data: sellerData } = await supabase
        .from('users')
        .select('id, full_name, department, semester, is_verified, rating, total_reviews, email')
        .eq('id', listingData.user_id)
        .single();

      setSeller(sellerData);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', listingData.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      setReviews(reviewsData || []);
    } catch (err) {
      console.error('Load listing error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX 2: Reveal WhatsApp only after explicit action + rate limit check
  const handleRevealWhatsapp = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Prevent more than 5 reveals per session (anti-scraping)
    if (revealCount >= 5) {
      alert('Too many contact requests. Please try again later.');
      return;
    }

    setRevealLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

      // Fetch WhatsApp number only at this point
      const { data: sellerContact, error } = await supabase
        .from('users')
        .select('whatsapp_number')
        .eq('id', listing.user_id)
        .single();

      if (error || !sellerContact?.whatsapp_number) {
        alert('Could not retrieve contact info. Please try again.');
        return;
      }

      setWhatsappNumber(sellerContact.whatsapp_number);
      setWhatsappRevealed(true);
      setRevealCount(prev => prev + 1);

      // Log contact to contacts table
      await supabase.from('contacts').upsert(
        [
          {
            user_id: authData.user.id,
            contact_user_id: listing.user_id,
            contact_name: seller.full_name,
            contact_whatsapp: sellerContact.whatsapp_number,
            contact_type: 'seller',
          },
        ],
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

  if (!listing || !seller) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Listing not found</p>
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
        <h1 className="text-lg font-bold flex-1" style={{ color: '#1B2A4A' }}>
          Item Details
        </h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Image */}
        {listing.image_url && (
          <div className="w-full h-64 bg-gray-200 rounded-xl overflow-hidden">
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title & Price */}
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1B2A4A' }}>
            {listing.title}
          </h2>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
              {listing.category}
            </span>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                background:
                  listing.condition === 'Like New' ? '#E0F2FE'
                  : listing.condition === 'Good' ? '#DCFCE7'
                  : listing.condition === 'Used' ? '#FEF3C7'
                  : '#FECACA',
                color:
                  listing.condition === 'Like New' ? '#0369A1'
                  : listing.condition === 'Good' ? '#166534'
                  : listing.condition === 'Used' ? '#92400E'
                  : '#DC2626',
              }}
            >
              {listing.condition}
            </span>
          </div>

          {listing.is_free ? (
            <p className="text-3xl font-bold text-green-600">Free</p>
          ) : (
            <p className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>
              ₹{listing.price?.toLocaleString()}
            </p>
          )}
        </div>

        {/* Description */}
        {listing.subject && (
          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#1B2A4A' }}>
              Subject/Topic
            </h3>
            <p className="text-gray-600">{listing.subject}</p>
          </div>
        )}

        {/* Seller Card */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold" style={{ color: '#1B2A4A' }}>
                {seller.full_name}
              </h3>
              <p className="text-sm text-gray-600">
                {seller.department} • {seller.semester}
              </p>
            </div>
            {seller.is_verified && (
              <span className="text-green-600">✓</span>
            )}
          </div>

          {/* Seller Rating */}
          {seller.rating > 0 && (
            <div className="mb-3">
              <SellerRating rating={seller.rating} totalReviews={seller.total_reviews} />
            </div>
          )}

          {/* Verification & Report */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
            {seller.is_verified && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-100">
                <span className="text-green-600">✓</span>
                <span className="text-xs font-semibold text-green-700">Verified</span>
              </div>
            )}
            <button
              onClick={() => setShowReportModal(true)}
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
              style={{ color: '#DC2626', background: '#FEE2E2' }}
            >
              🚩 Report
            </button>
          </div>

          {/* ✅ FIX 2: Contact Buttons — WhatsApp hidden until revealed */}
          <div className="space-y-2">
            {!whatsappRevealed ? (
              // Step 1: Show "Reveal Contact" button first
              <button
                onClick={handleRevealWhatsapp}
                disabled={revealLoading}
                className="w-full py-3 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
              >
                {revealLoading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Loading...</>
                ) : (
                  <><Eye className="w-4 h-4" /> Contact via WhatsApp</>
                )}
              </button>
            ) : (
              // Step 2: After reveal, show actual WhatsApp number + open button
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
                  {contactLoading ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Connecting...</>
                  ) : (
                    <><MessageCircle className="w-4 h-4" /> Open WhatsApp</>
                  )}
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

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>
              Reviews
            </h3>
            {currentUser && currentUser.email !== seller.email && (
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
              {currentUser && currentUser.email !== seller.email && (
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
                  reviewer={
                    review.reviewer_id === currentUser?.id
                      ? currentUser
                      : { full_name: 'User' }
                  }
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
          <div className="flex justify-between">
            <span className="text-gray-600">Posted</span>
            <span className="font-semibold">
              {new Date(listing.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

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
