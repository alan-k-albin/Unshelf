'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { CATEGORIES } from './data';
import { supabase } from '@/lib/supabaseClient';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ConditionLabel from '@/components/ConditionLabel';

const ListingCard = ({ listing }) => {
  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="listing-card cursor-pointer group">
        <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden mb-3">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-500">
              📚 No Image
            </div>
          )}
          <div className={`absolute top-2 right-2 badge-status ${listing.status === 'Active' ? 'badge-status-active' : 'badge-status-exchanged'}`}>
            {listing.status === 'Active' ? '🟢 Active' : '✓ Exchanged'}
          </div>
          {listing.featured && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
              ⭐ Featured
            </div>
          )}
        </div>

        <h3 className="font-semibold text-sm text-primary line-clamp-2 mb-2">
          {listing.title}
        </h3>

        <div className="mb-2">
          <span className="inline-block bg-accent/10 text-accent text-xs px-2 py-1 rounded font-medium">
            {listing.category}
          </span>
        </div>

        <div className="flex gap-2 mb-2 text-xs text-gray-600">
          <span className="bg-gray-100 px-2 py-1 rounded">
            {listing.department}
          </span>
          <span className="bg-gray-100 px-2 py-1 rounded">
            {listing.semester}
          </span>
        </div>

        <div className="mb-2">
          {listing.condition && <ConditionLabel condition={listing.condition} />}
        </div>

        <div className="mb-3">
          {listing.is_free ? (
            <p className="text-accent font-bold text-sm">📦 Free / Donation</p>
          ) : (
            <p className="text-primary font-bold text-base">₹{listing.price}</p>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Recently listed
        </p>
      </div>
    </Link>
  );
};

export default function Home() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userDept, setUserDept] = useState('CS');

  useEffect(() => {
    fetchListings();
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserDept(userData.department || 'CS');
    }
  }, []);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const featuredListings = listings.filter(l => l.featured).slice(0, 5);
  const personalizedListings = listings.filter(l => l.department === userDept).slice(0, 5);
  const recentListings = listings.slice(0, 5);

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
              <Link key={cat} href={`/search?category=${cat}`}>
                <button className="w-full p-3 bg-white rounded-lg border border-gray-200 hover:border-accent hover:bg-accent/5 transition-colors text-center">
                  <p className="text-sm font-medium text-primary">{cat}</p>
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* Personalized Section */}
        {personalizedListings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-primary">
                📚 Relevant for Your Department ({userDept})
              </h2>
              <Link href={`/search?department=${userDept}`} className="text-accent text-sm font-medium hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {isLoading
                ? [1, 2, 3, 4, 5].map(i => <LoadingSkeleton key={i} />)
                : personalizedListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
            </div>
          </div>
        )}

        {/* Featured Listings */}
        {featuredListings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-primary">
                ⭐ Featured Listings
              </h2>
              <Link href="/search" className="text-accent text-sm font-medium hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Listings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-primary">
              Recent Listings
            </h2>
            <Link href="/search" className="text-accent text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => <LoadingSkeleton key={i} />)}
            </div>
          ) : recentListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-600">No listings yet. Be the first to share! 📚</p>
            </div>
          )}
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
