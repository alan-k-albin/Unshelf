'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, ArrowLeft, Check, Share2 } from 'lucide-react';
import { LISTINGS } from '@/app/data';

export default function ListingDetail() {
  const params = useParams();
  const listing = LISTINGS.find(l => l.id === parseInt(params.id));

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Listing not found</p>
        <Link href="/" className="btn-primary inline-block mt-4">
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
          <img
            src={listing.image}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
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
            {listing.isFree ? (
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
            <div className="flex justify-between">
              <span className="text-gray-600">Subject:</span>
              <span className="font-medium text-primary">{listing.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Condition:</span>
              <span className="font-medium text-primary">{listing.condition}</span>
            </div>
          </div>

          {/* Verified Badge */}
          {listing.isVerified && (
            <div className="mb-6 p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-accent">Verified Student Seller</span>
            </div>
          )}

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
      <div className="bg-white rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-primary mb-3">About This Item</h2>
        <p className="text-gray-600 leading-relaxed">
          This is a high-quality {listing.category.toLowerCase()} for {listing.subject}. 
          The condition is {listing.condition.toLowerCase()} and is perfect for students studying {listing.department}. 
          This material was used by a verified student from our college community and is now available for purchase.
        </p>
      </div>

      {/* Seller Info */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-bold text-primary mb-4">Seller Information</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-bold text-lg">
            {listing.seller.charAt(0)}
          </div>
          <div>
            <h3 className="font-medium text-primary text-lg">{listing.seller}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{listing.department} • {listing.semester}</span>
              {listing.isVerified && (
                <span className="flex items-center gap-1 text-xs text-accent font-medium">
                  <Check className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
                }
