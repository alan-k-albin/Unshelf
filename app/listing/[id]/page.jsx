'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MessageCircle, ArrowLeft, Check, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ConditionLabel from '@/components/ConditionLabel';

export default function ListingDetail() {
  const params = useParams();
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single();

      if (fetchError) throw fetchError;
      setListing(data);
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Listing not found');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Loading listing...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">{error || 'Listing not found'}</p>
        <Link href="/" className="btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    );
  }

  const whatsappNumber = '919876543210';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center gap-2 text-accent hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Listings
      </Link>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Image Section */}
        <div className="bg-gray-200 rounded-lg overflow-hidden h-80">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-500 text-4xl">
              📚
            </div>
          )}
        </div>

        {/* Details Section */}
        <div>
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            {listing.title}
          </h1>

          {/* Status Badge */}
          <div className="mb-4">
            <span className={`badge-status ${listing.status === 'Active' ? 'badge-status-active' : 'badge-status-exchanged'}`}>
              {listing.status === 'Active' ? '🟢 Active' : '✓ Exchanged'}
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            {listing.is_free ? (
              <div className="text-3xl font-bold text-accent">📦 Free / Donation</div>
            ) : (
              <div className="text-3xl font-bold text-primary">₹{listing.price}</div>
            )}
          </div>

          {/* Details Grid */}
          <div className="bg-light rounded-lg p-4 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium text-primary">{listing.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Department:</span>
              <span className="font-medium text-primary">{listing.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Semester:</span>
              <span className="font-medium text-primary">{listing.semester}</span>
            </div>
            {listing.subject && (
              <div className="flex justify-between">
                <span className="text-gray-600">Subject:</span>
                <span className="font-medium text-primary">{listing.subject}</span>
              </div>
            )}
            {listing.condition && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Condition:</span>
                <ConditionLabel condition={listing.condition} />
              </div>
            )}
          </div>

          {/* Contact Buttons */}
          <div className="space-y-3">
            <a
              href={`https://wa.me/${whatsappNumber}?text=Hi! I'm interested in your ${listing.title}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Contact on WhatsApp
            </a>
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Phone (if WhatsApp unavailable):</p>
              <p className="font-mono font-medium text-primary">+91 98765 43210</p>
            </div>
            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Listing
            </button>
          </div>
        </div>
      </div>

      {/* Description Section */}
      {listing.description && (
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-primary mb-3">About This Item</h2>
          <p className="text-gray-600 leading-relaxed">
            {listing.description}
          </p>
        </div>
      )}

      {/* Seller Info */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-bold text-primary mb-4">Seller Information</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-bold text-lg">
            V
          </div>
          <div>
            <h3 className="font-medium text-primary text-lg">Verified Student</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{listing.department} • {listing.semester}</span>
              <span className="flex items-center gap-1 text-xs text-accent font-medium">
                <Check className="w-3 h-3" />
                Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
            }
