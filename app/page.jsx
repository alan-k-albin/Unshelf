'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { BookOpen, PenTool, BookMarked, Notebook, Beaker, Calculator, GraduationCap, MoreHorizontal, Search as SearchIcon } from 'lucide-react';
import { CATEGORIES } from './data';
import { supabase } from '@/lib/supabaseClient';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ConditionLabel from '@/components/ConditionLabel';

const CATEGORY_ICONS = {
  'Textbooks': { icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
  'Handwritten Notes': { icon: PenTool, color: 'bg-purple-100 text-purple-600' },
  'Study Guides': { icon: BookMarked, color: 'bg-green-100 text-green-600' },
  'Notebooks': { icon: Notebook, color: 'bg-pink-100 text-pink-600' },
  'Lab Manuals': { icon: Beaker, color: 'bg-orange-100 text-orange-600' },
  'Calculators/Tools': { icon: Calculator, color: 'bg-yellow-100 text-yellow-600' },
  'Coaching Materials': { icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600' },
  'Other': { icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600' }
};

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
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const personalizedListings = listings.filter(l => l.department === userDept).slice(0, 5);
  const recentListings = listings.slice(0, 5);

  return (
    <div className="pb-20 md:pb-8">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 py-6 md:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
              Welcome to Unshelf
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Buy, sell, or exchange academic resources with verified students from your college
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search textbooks, notes, materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-4 pr-12 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="absolute right-3 top-3 text-gray-400 hover:text-accent"
              >
                <SearchIcon className="w-6 h-6" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Categories Section */}
        <div className="mb-8">
          <h2 className="text-lg md:text-xl font-bold text-primary mb-4">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const categoryInfo = CATEGORY_ICONS[cat];
              const IconComponent = categoryInfo?.icon || MoreHorizontal;
              const colorClass = categoryInfo?.color || 'bg-gray-100 text-gray-600';

              return (
                <Link key={cat} href={`/search?category=${cat}`}>
                  <div className="group cursor-pointer">
                    <div className={`${colorClass} rounded-lg p-4 flex flex-col items-center justify-center h-28 mb-2 group-hover:shadow-md transition-all`}>
                      <IconComponent className="w-10 h-10 mb-2" />
                      <p className="text-sm font-semibold text-center line-clamp-2">
                        {cat}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
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
