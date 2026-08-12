'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  BookOpen, PenTool, BookMarked, StickyNote, Beaker, Calculator, GraduationCap,
  Search as SearchIcon, ArrowRight, Shield, Zap, Users
} from 'lucide-react';
import { CATEGORIES } from './data';
import { supabase } from '@/lib/supabaseClient';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ConditionLabel from '@/components/ConditionLabel';
import { Toast, useToast } from '@/components/Toast';

const CATEGORY_ICONS = {
  'Textbooks':          { icon: BookOpen },
  'Handwritten Notes':  { icon: PenTool },
  'Study Guides':       { icon: BookMarked },
  'Notebooks':          { icon: StickyNote },
  'Lab Manuals':        { icon: Beaker },
  'Calculators/Tools':  { icon: Calculator },
  'Coaching Materials': { icon: GraduationCap },
  'Other':              { icon: BookOpen },
};

const ListingCard = ({ listing }) => (
  <Link href={`/listing/${listing.id}`}>
    <div className="group cursor-pointer h-full rounded-xl overflow-hidden bg-white border border-[#E7E0D2] hover:border-[#C9A227]/50 hover:shadow-md transition-all duration-300">
      <div className="relative w-full h-40 bg-[#F3EFE4] overflow-hidden">
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-[#C9BFA8]" strokeWidth={1.5} />
          </div>
        )}
        <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm ${
          listing.status === 'Active' ? 'bg-[#EAF3EC]/90 text-[#1F7A44]' : 'bg-white/85 text-gray-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${listing.status === 'Active' ? 'bg-[#27AE60]' : 'bg-gray-400'}`} />
          {listing.status}
        </div>
        {listing.featured && (
          <div className="absolute top-2.5 left-2.5 bg-[#1B2A4A] text-[#EFC94C] text-[10px] font-bold tracking-wide px-2 py-1 rounded-full uppercase">
            Featured
          </div>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="font-serif font-semibold text-sm leading-snug line-clamp-2 mb-2" style={{ color: '#1B2A4A' }}>{listing.title}</h3>
        <div className="mb-2.5">
          <span className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium border border-[#1B2A4A]/15 text-[#1B2A4A]/70">{listing.category}</span>
        </div>
        <div className="flex gap-1.5 mb-2.5 text-[11px] text-[#8A8272]">
          {listing.department && <span>{listing.department}</span>}
          {listing.department && listing.semester && <span>·</span>}
          {listing.semester && <span>{listing.semester}</span>}
        </div>
        {listing.condition && <div className="mb-2.5"><ConditionLabel condition={listing.condition} /></div>}
        <div className="font-serif font-bold text-base" style={{ color: listing.is_free ? '#27AE60' : '#1B2A4A' }}>
          {listing.is_free ? 'Free' : `₹${listing.price?.toLocaleString()}`}
        </div>
      </div>
    </div>
  </Link>
);

const CategoryCard = ({ name, categoryInfo }) => {
  const IconComponent = categoryInfo?.icon || BookOpen;
  return (
    <Link href={`/search?category=${name}`}>
      <div className="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:border-[#1B2A4A]/25 cursor-pointer h-28 flex flex-col items-center justify-center active:scale-95 bg-white border border-[#E7E0D2]">
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 rounded-full mb-2 flex items-center justify-center mx-auto transition-all duration-300 group-hover:bg-[#1B2A4A] border border-[#1B2A4A]/15 group-hover:border-[#1B2A4A]"
            style={{ color: '#1B2A4A' }}>
            <IconComponent className="w-[18px] h-[18px] group-hover:text-white transition-colors duration-300" strokeWidth={1.75} />
          </div>
          <p className="font-medium text-[13px] leading-tight line-clamp-2" style={{ color: '#1B2A4A' }}>{name}</p>
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
  const { toast, showToast, hideToast } = useToast();

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
        .from('listings').select('*').eq('status', 'Active')
        .order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // #9: Pull to refresh

  // #6: Search navigates to search page with query
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    } else {
      window.location.href = '/search';
    }
  };

  const handleCreateListing = () => {
    window.location.href = isLoggedIn ? '/create-listing' : '/login';
  };

  const personalizedListings = listings.filter(l => l.department === userDept).slice(0, 4);
  const recentListings = listings.slice(0, 4);

  return (
    <div className="bg-[#FAF8F3] min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* HERO SECTION */}
      <section className="relative px-4 pt-8 pb-9 md:pt-14 md:pb-14 overflow-hidden border-b border-[#E7E0D2]">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #1B2A4A 1px, transparent 0)',
            backgroundSize: '28px 28px',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <img src="/logo.png" alt="Unshelf" className="h-24 w-auto mx-auto mb-5 object-contain" />

          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: '#27AE60' }}>
            The campus exchange
          </p>
          <h1 className="font-serif text-3xl md:text-[2.75rem] font-bold mb-3 tracking-tight leading-[1.1]" style={{ color: '#1B2A4A' }}>
            Every book has<br className="md:hidden" /> another reader
          </h1>
          <p className="text-[#5B5647] mb-7 text-sm max-w-md mx-auto leading-relaxed">
            Textbooks, notes and lab manuals, passed on by students who've already used them. Fair prices, verified by college email.
          </p>

          {/* #6: Search bar properly navigates to search page */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-5">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8A8272] group-focus-within:text-[#1B2A4A] transition" />
              <input
                type="text"
                placeholder="Search textbooks, notes, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 rounded-full border border-[#D9D0BC] text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/5 transition bg-white shadow-sm"
                style={{ color: '#1B2A4A' }}
              />
              <button type="submit"
                aria-label="Search"
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-full font-semibold text-white transition hover:shadow-md active:scale-95 flex items-center justify-center"
                style={{ background: '#1B2A4A' }}>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <button onClick={handleCreateListing}
            className="px-7 py-3 rounded-full font-semibold text-white text-sm transition hover:shadow-lg active:scale-95 inline-flex items-center gap-2"
            style={{ background: '#27AE60' }}>
            {isLoggedIn ? 'Start Selling' : 'Browse Listings'}
            <ArrowRight className="w-4 h-4" />
          </button>
          {!isLoggedIn && <p className="text-xs text-[#8A8272] mt-3">Sign up free — no payment needed</p>}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-4 py-8 md:py-12 max-w-7xl mx-auto">
        <div className="flex items-baseline gap-2.5 mb-4">
          <h2 className="font-serif text-lg md:text-xl font-bold" style={{ color: '#1B2A4A' }}>
            Browse by Category
          </h2>
          <div className="h-px flex-1 bg-[#E7E0D2]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat} name={cat} categoryInfo={CATEGORY_ICONS[cat]} />
          ))}
        </div>
      </section>

      {/* PERSONALIZED LISTINGS */}
      {personalizedListings.length > 0 && (
        <section className="px-4 py-8 md:py-12 max-w-7xl mx-auto">
          <div className="flex items-baseline justify-between gap-2.5 mb-4">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-serif text-lg md:text-xl font-bold" style={{ color: '#1B2A4A' }}>For {userDept}</h2>
              <div className="h-px w-8 bg-[#E7E0D2] hidden md:block" />
            </div>
            <Link href={`/search?department=${userDept}`} className="text-xs font-semibold shrink-0" style={{ color: '#27AE60' }}>
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {isLoading
              ? [1,2,3,4].map(i => <LoadingSkeleton key={i} />)
              : personalizedListings.map(listing => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        </section>
      )}

      {/* RECENT LISTINGS */}
      <section className="px-4 py-8 md:py-12 max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between gap-2.5 mb-4">
          <h2 className="font-serif text-lg md:text-xl font-bold" style={{ color: '#1B2A4A' }}>Latest Listings</h2>
          <Link href="/search" className="text-xs font-semibold shrink-0" style={{ color: '#27AE60' }}>Explore all →</Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <LoadingSkeleton key={i} />)}
          </div>
        ) : recentListings.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {recentListings.map(listing => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-10 text-center border border-[#E7E0D2]">
            <p className="text-[#5B5647] text-sm mb-4">No listings yet. Be the first to share.</p>
            <button onClick={handleCreateListing}
              className="px-6 py-2.5 rounded-full font-semibold text-white text-sm transition hover:shadow-md active:scale-95 inline-flex items-center gap-2"
              style={{ background: '#1B2A4A' }}>
              Create First Listing <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* WHY UNSHELF */}
      <section className="px-4 py-10 md:py-14 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: '#27AE60' }}>Why students choose Unshelf</p>
          <h2 className="font-serif text-2xl font-bold" style={{ color: '#1B2A4A' }}>Built for the campus, not the market</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-5 border border-[#E7E0D2] bg-white hover:shadow-md transition">
            <div className="w-10 h-10 rounded-full bg-[#EAF3EC] flex items-center justify-center mb-3.5">
              <Shield className="w-[18px] h-[18px]" style={{ color: '#27AE60' }} strokeWidth={1.75} />
            </div>
            <h3 className="font-serif font-bold text-sm mb-1.5" style={{ color: '#1B2A4A' }}>Verified Students</h3>
            <p className="text-xs text-[#8A8272] leading-relaxed">College email verified. Trade safely with people from your campus.</p>
          </div>
          <div className="rounded-xl p-5 border border-[#E7E0D2] bg-white hover:shadow-md transition">
            <div className="w-10 h-10 rounded-full bg-[#FBF3DC] flex items-center justify-center mb-3.5">
              <Zap className="w-[18px] h-[18px]" style={{ color: '#C9A227' }} strokeWidth={1.75} />
            </div>
            <h3 className="font-serif font-bold text-sm mb-1.5" style={{ color: '#1B2A4A' }}>Fair Prices</h3>
            <p className="text-xs text-[#8A8272] leading-relaxed">No middlemen, no markup. Students set their own rates.</p>
          </div>
          <div className="rounded-xl p-5 border border-[#E7E0D2] bg-white hover:shadow-md transition">
            <div className="w-10 h-10 rounded-full bg-[#EAECF3] flex items-center justify-center mb-3.5">
              <Users className="w-[18px] h-[18px]" style={{ color: '#1B2A4A' }} strokeWidth={1.75} />
            </div>
            <h3 className="font-serif font-bold text-sm mb-1.5" style={{ color: '#1B2A4A' }}>Easy & Quick</h3>
            <p className="text-xs text-[#8A8272] leading-relaxed">A simple interface built for busy semesters. Minutes to buy or sell.</p>
          </div>
        </div>
      </section>
    </div>
  );
    }
