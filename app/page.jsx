'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  BookOpen, PenTool, BookMarked, Notebook, Beaker, Calculator, GraduationCap, MoreHorizontal, 
  Search as SearchIcon, ArrowRight, Shield, Zap, Users
} from 'lucide-react';
import { CATEGORIES } from './data';
import { supabase } from '@/lib/supabaseClient';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ConditionLabel from '@/components/ConditionLabel';

const CATEGORY_ICONS = {
  'Textbooks': { 
    icon: BookOpen, 
    lightBg: '#EEF2FF',
    darkBg: '#4F46E5',
    description: 'All semester textbooks'
  },
  'Handwritten Notes': { 
    icon: PenTool, 
    lightBg: '#F3E8FF',
    darkBg: '#9333EA',
    description: 'Study notes & summaries'
  },
  'Study Guides': { 
    icon: BookMarked, 
    lightBg: '#ECFDF5',
    darkBg: '#16A34A',
    description: 'Guides & solutions'
  },
  'Notebooks': { 
    icon: Notebook, 
    lightBg: '#F3E8FF',
    darkBg: '#9333EA',
    description: 'Notebooks & notepads'
  },
  'Lab Manuals': { 
    icon: Beaker, 
    lightBg: '#FFF7ED',
    darkBg: '#EA580C',
    description: 'Lab work manuals'
  },
  'Calculators/Tools': { 
    icon: Calculator, 
    lightBg: '#FEFCE8',
    darkBg: '#CA8A04',
    description: 'Scientific calculators'
  },
  'Coaching Materials': { 
    icon: GraduationCap, 
    lightBg: '#EEF2FF',
    darkBg: '#4F46E5',
    description: 'Coaching materials'
  },
  'Other': { 
    icon: MoreHorizontal, 
    lightBg: '#F5F5F5',
    darkBg: '#6B7280',
    description: 'Other resources'
  }
};

const ListingCard = ({ listing }) => {
  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="listing-card cursor-pointer group h-full">
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
          <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded ${
            listing.status === 'Active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
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
          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium">
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
            <p className="text-green-600 font-bold text-sm">📦 Free / Donation</p>
          ) : (
            <p className="text-primary font-bold text-base">₹{listing.price?.toLocaleString()}</p>
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchListings();
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserDept(userData.department || 'CS');
      setIsLoggedIn(true);
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
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleCreateListing = () => {
    window.location.href = isLoggedIn ? '/create-listing' : '/login';
  };

  const personalizedListings = listings.filter(l => l.department === userDept).slice(0, 5);
  const recentListings = listings.slice(0, 5);

  return (
    <div className="pb-20 md:pb-8 bg-gradient-to-b from-slate-50 via-blue-50 to-white min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 pt-8 pb-12 md:pt-16 md:pb-20 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-10 right-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Logo/Branding */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg mx-auto block">
            <BookOpen className="w-6 h-6 text-white" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: '#1B2A4A' }}>
            Welcome to Unshelf
          </h1>

          {/* Subheadline */}
          <p className="text-center text-gray-600 mb-6 max-w-2xl mx-auto">
            Buy, sell, or exchange textbooks, notes, and study materials with verified students from your college. Fair prices. Trusted community.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search textbooks, notes, materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-sm"
                style={{ color: '#1B2A4A' }}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-2 rounded-lg font-semibold text-white transition"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)' }}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/search"
              className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition text-center"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)' }}
            >
              Browse Resources
            </Link>

            {!isLoggedIn ? (
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl font-semibold text-sm transition border-2 border-gray-300 text-center"
                style={{ color: '#4F46E5' }}
              >
                Sign Up Free
              </Link>
            ) : (
              <button
                onClick={handleCreateListing}
                className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition text-center"
                style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)' }}
              >
                ✨ Sell Now
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="px-4 py-12 md:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#1B2A4A' }}>
            Browse by Category
          </h2>
          <p className="text-gray-600 text-sm">Find exactly what you need</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const categoryInfo = CATEGORY_ICONS[cat];
            const IconComponent = categoryInfo?.icon || MoreHorizontal;

            return (
              <Link key={cat} href={`/search?category=${cat}`}>
                <div 
                  className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer h-32 flex flex-col items-center justify-center"
                  style={{ background: categoryInfo?.lightBg }}
                >
                  {/* Gradient Overlay on Hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: categoryInfo?.darkBg }}
                  />

                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <div
                      className="w-10 h-10 rounded-lg mb-2 flex items-center justify-center mx-auto text-white transition-colors duration-300"
                      style={{ background: categoryInfo?.darkBg }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <p 
                      className="font-semibold text-sm transition-colors duration-300 group-hover:text-white"
                      style={{ color: categoryInfo?.darkBg }}
                    >
                      {cat}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Personalized Section */}
        {personalizedListings.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>
                📚 Relevant for Your Department ({userDept})
              </h2>
              <Link href={`/search?department=${userDept}`} className="text-sm font-medium transition" style={{ color: '#4F46E5' }}>
                View All →
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
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>
              Recent Listings
            </h2>
            <Link href="/search" className="text-sm font-medium transition" style={{ color: '#4F46E5' }}>
              View All →
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
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
              <p className="text-gray-600">No listings yet. Be the first to share! 📚</p>
            </div>
          )}
        </div>

        {/* Why Unshelf Section */}
        <section className="px-6 py-12 bg-gradient-to-r from-indigo-50 to-green-50 rounded-2xl mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: '#1B2A4A' }}>
            Why Choose Unshelf?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-indigo-100">
                <Shield className="w-7 h-7" style={{ color: '#4F46E5' }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1B2A4A' }}>
                Verified Community
              </h3>
              <p className="text-gray-600 text-sm">
                All users are verified college students. Trade with confidence.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-green-100">
                <Zap className="w-7 h-7" style={{ color: '#16A34A' }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1B2A4A' }}>
                Fair Prices
              </h3>
              <p className="text-gray-600 text-sm">
                Student-set prices. No middlemen. Direct peer-to-peer.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-yellow-100">
                <Users className="w-7 h-7" style={{ color: '#CA8A04' }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1B2A4A' }}>
                Easy to Use
              </h3>
              <p className="text-gray-600 text-sm">
                Simple interface designed for college students.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center mb-12 py-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#1B2A4A' }}>
            {isLoggedIn ? 'Ready to share your materials?' : 'Ready to get started?'}
          </h3>
          <p className="text-gray-600 mb-6">
            {isLoggedIn 
              ? 'List your academic materials and help other students.' 
              : 'Join thousands of students buying and selling on Unshelf.'}
          </p>
          <button 
            onClick={handleCreateListing}
            className="px-8 py-3 rounded-xl font-semibold text-white text-lg transition hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)' }}
          >
            {isLoggedIn ? '✨ Start Selling' : 'Create Free Account'} <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
    }
