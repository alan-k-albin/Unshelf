'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  BookOpen, PenTool, BookMarked, Notebook, Beaker, Calculator, GraduationCap,
  Search as SearchIcon, ArrowRight, Shield, Zap, Users
} from 'lucide-react';
import { CATEGORIES } from './data';
import { supabase } from '@/lib/supabaseClient';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ConditionLabel from '@/components/ConditionLabel';

const CATEGORY_ICONS = {
  'Textbooks': { icon: BookOpen, lightBg: '#EEF2FF', darkBg: '#4F46E5' },
  'Handwritten Notes': { icon: PenTool, lightBg: '#F3E8FF', darkBg: '#9333EA' },
  'Study Guides': { icon: BookMarked, lightBg: '#ECFDF5', darkBg: '#16A34A' },
  'Notebooks': { icon: Notebook, lightBg: '#F3E8FF', darkBg: '#9333EA' },
  'Lab Manuals': { icon: Beaker, lightBg: '#FFF7ED', darkBg: '#EA580C' },
  'Calculators/Tools': { icon: Calculator, lightBg: '#FEFCE8', darkBg: '#CA8A04' },
  'Coaching Materials': { icon: GraduationCap, lightBg: '#EEF2FF', darkBg: '#4F46E5' },
  'Other': { icon: BookOpen, lightBg: '#F5F5F5', darkBg: '#6B7280' }
};

const ListingCard = ({ listing }) => {
  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="group cursor-pointer h-full rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
        <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-gray-300" />
            </div>
          )}
          <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${
            listing.status === 'Active' ? 'bg-green-100/80 text-green-700' : 'bg-gray-100/80 text-gray-700'
          }`}>
            {listing.status === 'Active' ? '●' : '✓'} {listing.status}
          </div>
          {listing.featured && (
            <div className="absolute top-3 left-3 bg-yellow-400/90 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
              ⭐
            </div>
          )}
        </div>

        <div className="p-3.5">
          <h3 className="font-semibold text-sm line-clamp-2 mb-2" style={{ color: '#1B2A4A' }}>
            {listing.title}
          </h3>
          <div className="mb-2.5">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
              {listing.category}
            </span>
          </div>
          <div className="flex gap-1.5 mb-2.5 text-xs">
            <span className="bg-gray-50 text-gray-600 px-2 py-1 rounded-full">{listing.department}</span>
            <span className="bg-gray-50 text-gray-600 px-2 py-1 rounded-full">{listing.semester}</span>
          </div>
          {listing.condition && <div className="mb-2.5"><ConditionLabel condition={listing.condition} /></div>}
          <div className="font-bold text-sm" style={{ color: listing.is_free ? '#16A34A' : '#1B2A4A' }}>
            {listing.is_free ? '📦 Free' : `₹${listing.price?.toLocaleString()}`}
          </div>
        </div>
      </div>
    </Link>
  );
};

const CategoryCard = ({ name, categoryInfo }) => {
  const IconComponent = categoryInfo?.icon || BookOpen;
  return (
    <Link href={`/search?category=${name}`}>
      <div
        className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-xl cursor-pointer h-32 flex flex-col items-center justify-center active:scale-95"
        style={{ background: categoryInfo?.lightBg }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: categoryInfo?.darkBg }} />
        <div className="relative z-10 text-center">
          <div
            className="w-12 h-12 rounded-xl mb-2.5 flex items-center justify-center mx-auto text-white transition-all duration-300 group-hover:scale-110"
            style={{ background: categoryInfo?.darkBg }}
          >
            <IconComponent className="w-6 h-6" />
          </div>
          <p className="font-semibold text-sm transition-colors duration-300 group-hover:text-white line-clamp-2"
            style={{ color: categoryInfo?.darkBg }}>
            {name}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default function HomePage() {
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

  const personalizedListings = listings.filter(l => l.department === userDept).slice(0, 4);
  const recentListings = listings.slice(0, 4);

  return (
    <div className="bg-gradient-to-b from-slate-50 via-blue-50 to-white min-h-screen">

      {/* ===== HERO SECTION ===== */}
      <section className="relative px-4 pt-6 pb-8 md:pt-12 md:pb-12 overflow-hidden">
        <div className="absolute top-5 right-0 w-56 h-56 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse" />
        <div className="absolute -bottom-10 left-10 w-56 h-56 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">

          {/* ✅ LOGO - Replaces BookOpen icon */}
          <img
            src="/logo.png"
            alt="Unshelf"
            className="h-28 w-auto mx-auto mb-4 object-contain"
          />

          <h1 className="text-3xl md:text-4xl font-bold mb-2.5 tracking-tight" style={{ color: '#1B2A4A' }}>
            Your College Marketplace
          </h1>
          <p className="text-gray-600 mb-6 text-sm max-w-2xl mx-auto leading-relaxed">
            Find textbooks, notes & materials from students like you. Fair prices. Verified community.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-5">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition" />
              <input
                type="text"
                placeholder="Search textbooks, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-2xl border-2 border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition bg-white/80 backdrop-blur"
                style={{ color: '#1B2A4A' }}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 p-2 rounded-xl font-semibold text-white transition hover:shadow-lg active:scale-95"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)' }}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* CTA */}
          <button
            onClick={handleCreateListing}
            className="px-8 py-3 rounded-2xl font-semibold text-white text-sm transition hover:shadow-xl active:scale-95 inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)' }}
          >
            {isLoggedIn ? '✨ Start Selling' : '📚 Browse Now'}
            <ArrowRight className="w-4 h-4" />
          </button>
          {!isLoggedIn && (
            <p className="text-xs text-gray-500 mt-2">Sign up free • No payment needed</p>
          )}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="px-4 py-6 md:py-10 max-w-7xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-3.5 text-center" style={{ color: '#1B2A4A' }}>
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat} name={cat} categoryInfo={CATEGORY_ICONS[cat]} />
          ))}
        </div>
      </section>

      {/* ===== PERSONALIZED LISTINGS ===== */}
      {personalizedListings.length > 0 && (
        <section className="px-4 py-6 md:py-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold" style={{ color: '#1B2A4A' }}>
              For {userDept}
            </h2>
            <Link href={`/search?department=${userDept}`} className="text-sm font-semibold" style={{ color: '#4F46E5' }}>
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {isLoading
              ? [1, 2, 3, 4].map(i => <LoadingSkeleton key={i} />)
              : personalizedListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
          </div>
        </section>
      )}

      {/* ===== RECENT LISTINGS ===== */}
      <section className="px-4 py-6 md:py-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold" style={{ color: '#1B2A4A' }}>
            Latest Listings
          </h2>
          <Link href="/search" className="text-sm font-semibold" style={{ color: '#4F46E5' }}>
            Explore →
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} />)}
          </div>
        ) : recentListings.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <p className="text-gray-600 text-sm">No listings yet. Be first! 📚</p>
          </div>
        )}
      </section>

      {/* ===== WHY UNSHELF ===== */}
      <section className="px-4 py-8 md:py-12 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#1B2A4A' }}>
          Why Unshelf?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl p-5 border border-indigo-200 bg-indigo-50/50 hover:shadow-lg transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-200 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-indigo-700" />
            </div>
            <h3 className="font-bold text-sm mb-1.5" style={{ color: '#1B2A4A' }}>Verified Students</h3>
            <p className="text-xs text-gray-600 leading-snug">College email verified. Trade safely.</p>
          </div>
          <div className="rounded-2xl p-5 border border-green-200 bg-green-50/50 hover:shadow-lg transition">
            <div className="w-10 h-10 rounded-xl bg-green-200 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-green-700" />
            </div>
            <h3 className="font-bold text-sm mb-1.5" style={{ color: '#1B2A4A' }}>Fair Prices</h3>
            <p className="text-xs text-gray-600 leading-snug">No middlemen. Student-set rates.</p>
          </div>
          <div className="rounded-2xl p-5 border border-yellow-200 bg-yellow-50/50 hover:shadow-lg transition">
            <div className="w-10 h-10 rounded-xl bg-yellow-200 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-yellow-700" />
            </div>
            <h3 className="font-bold text-sm mb-1.5" style={{ color: '#1B2A4A' }}>Easy & Quick</h3>
            <p className="text-xs text-gray-600 leading-snug">Simple interface. Minutes to buy/sell.</p>
          </div>
        </div>
      </section>

    </div>
  );
                        }
