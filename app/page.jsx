'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Check } from 'lucide-react';
import { CATEGORIES, LISTINGS } from './data';

const ListingCard = ({ listing }) => {
  const statusBgClass = listing.status === 'Active' ? 'bg-blue-50' : 'bg-gray-100';
  const statusTextClass = listing.status === 'Active' ? 'text-blue-700' : 'text-gray-600';

  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="listing-card cursor-pointer group">
        {/* Image Container */}
        <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden mb-3">
          <img
            src={listing.image}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          {/* Status Badge */}
          <div className={`absolute top-2 right-2 badge-status ${listing.status === 'Active' ? 'badge-status-active' : 'badge-status-exchanged'}`}>
            {listing.status === 'Active' ? '🟢 Active' : '✓ Exchanged'}
          </div>
          {listing.featured && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
              ⭐ Featured
            </div>
          )}
        </div>

        {/* Content */}
        <h3 className="font-semibold text-sm text-primary line-clamp-2 mb-2">
          {listing.title}
        </h3>

        {/* Category Tag */}
        <div className="mb-2">
          <span className="inline-block bg-accent/10 text-accent text-xs px-2 py-1 rounded font-medium">
            {listing.category}
          </span>
        </div>

        {/* Department & Semester */}
        <div className="flex gap-2 mb-2 text-xs text-gray-600">
          <span className="bg-gray-100 px-2 py-1 rounded">
            {listing.department}
          </span>
          <span className="bg-gray-100 px-2 py-1 rounded">
            {listing.semester}
          </span>
        </div>

        {/* Verified Badge & Seller */}
        <div className="flex items-center gap-1 mb-2">
          {listing.isVerified && (
            <div className="badge-verified">
              <Check className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-3">
          {listing.isFree ? (
            <p className="text-accent font-bold text-sm">📦 Free / Donation</p>
          ) : (
            <p className="text-primary font-bold text-base">₹{listing.price}</p>
          )}
        </div>

        {/* Condition */}
        <p className="text-xs text-gray-600 mb-2">
          Condition: <span className="font-medium">{listing.condition}</span>
        </p>

        {/* Seller */}
        <p className="text-xs text-gray-500">
          by <span className="font-medium text-gray-700">{listing.seller}</span>
        </p>
      </div>
    </Link>
  );
};

export default function Home() {
  const featuredListings = LISTINGS.filter(l => l.featured).slice(0, 5);
  const recentListings = LISTINGS.slice(0, 5);

  return (
    <div className="pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 py-6 md:py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            Welcome to Unshelf
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Buy, sell, or exchange academic resources with verified students from your college
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Categories Section */}
        <div className="mb-8">
          <h2 className="text-lg md:text-xl font-bold text-primary mb-4">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className="p-3 bg-white rounded-lg border border-gray-200 hover:border-accent hover:bg-accent/5 transition-colors text-center"
              >
                <p className="text-sm font-medium text-primary">{cat}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Listings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-primary">
              ⭐ Featured Listings
            </h2>
            <Link href="/featured" className="text-accent text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>

        {/* Recent Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-primary">
              Recent Listings
            </h2>
            <Link href="/search" className="text-accent text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-accent/10 rounded-lg p-6 md:p-8 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">
            Have materials to share?
          </h3>
          <p className="text-gray-600 mb-4">
            List your academic materials and help other students while recovering value
          </p>
          <Link href="/create-listing" className="btn-primary inline-block">
            Create Your First Listing
          </Link>
        </div>
      </div>
    </div>
  );
            }
