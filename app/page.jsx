'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  BookOpen, Pencil, ScrollText, StickyNote, FlaskConical, Calculator, GraduationCap,
  Search as SearchIcon, ArrowRight, Shield, Zap, Users, Sparkles, HelpCircle, Wrench, Briefcase
} from 'lucide-react';
import { CATEGORIES } from './data';
import { supabase } from '@/lib/supabaseClient';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ConditionLabel from '@/components/ConditionLabel';
import { Toast, useToast } from '@/components/Toast';

const CATEGORY_STYLE = {
  'Textbooks':          { icon: BookOpen,      paper: '#FDECEA', ink: '#B23A2E', rotate: '-rotate-2' },
  'Handwritten Notes':  { icon: Pencil,        paper: '#EAF1FB', ink: '#2C5AA0', rotate: 'rotate-2' },
  'Study Guides':       { icon: ScrollText,    paper: '#EAF6EE', ink: '#227A4B', rotate: 'rotate-1' },
  'Notebooks':          { icon: StickyNote,    paper: '#FBF0DC', ink: '#B8860B', rotate: '-rotate-1' },
  'Lab Manuals':        { icon: FlaskConical,  paper: '#F3EAFB', ink: '#7B3FA0', rotate: 'rotate-2' },
  'Calculators/Tools':  { icon: Calculator,    paper: '#EAF6F4', ink: '#1D7A6E', rotate: '-rotate-2' },
  'Coaching Materials': { icon: GraduationCap, paper: '#FCEFF6', ink: '#B0396F', rotate: 'rotate-1' },
  'Other':              { icon: BookOpen,      paper: '#F1EFEA', ink: '#5B5647', rotate: '-rotate-1' },
};

const ACTION_TILES = [
  { name: 'Request Material', href: '/search?type=requests', icon: HelpCircle, paper: '#EFF6FF', ink: '#1D4ED8', rotate: 'rotate-1' },
  { name: 'Request Service', href: '/search?type=services&service_type=seeking', icon: Wrench, paper: '#FFFBEB', ink: '#B45309', rotate: '-rotate-2' },
  { name: 'Offer Service', href: '/search?type=services&service_type=offering', icon: Briefcase, paper: '#F0FDF4', ink: '#15803D', rotate: 'rotate-2' },
];

const ListingCard = ({ listing }) => {
  const displayImage = (listing.image_urls && listing.image_urls.length > 0)
    ? listing.image_urls[0]
    : listing.image_url;
  const hasMultipleImages = listing.image_urls && listing.image_urls.length > 1;

  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="group cursor-pointer h-full rounded-2xl overflow-hidden bg-white border-2 border-[#EDE6D6] hover:border-[#1B2A4A] hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
        <div className="relative w-full h-40 bg-[#F3EFE4] overflow-hidden">
          {displayImage ? (
            <img src={displayImage} alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-[#C9BFA8]" strokeWidth={1.5} />
            </div>
          )}
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
              <span>📷 {listing.image_urls.length}</span>
            </div>
          )}
          <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm ${
            listing.status === 'Active' ? 'bg-[#EAF3EC]/90 text-[#1F7A44]' : 'bg-white/85 text-gray-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${listing.status === 'Active' ? 'bg-[#27AE60]' : 'bg-gray-400'}`} />
            {listing.status}
          </div>
          {listing.featured && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#1B2A4A] text-[#F4C95D] text-[10px] font-bold tracking-wide px-2 py-1 rounded-full uppercase shadow">
              <Sparkles className="w-2.5 h-2.5" />
              Featured
            </div>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 mb-2" style={{ color: '#1B2A4A' }}>{listing.title}</h3>
          <div className="mb-2.5">
            <span className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium border border-[#1B2A4A]/15 text-[#1B2A4A]/70">{listing.category}</span>
          </div>
          <div className="flex gap-1.5 mb-2.5 text-[11px] text-[#8A8272]">
            {listing.department && <span>{listing.department}</span>}
            {listing.department && listing.semester && <span>·</span>}
            {listing.semester && <span>{listing.semester}</span>}
          </div>
          {listing.condition && <div className="mb-2.5"><ConditionLabel condition={listing.condition} /></div>}
          <div className="font-display font-bold text-base" style={{ color: listing.is_free ? '#27AE60' : '#1B2A4A' }}>
            {listing.is_free ? 'Free' : `₹${listing.price?.toLocaleString()}`}
          </div>
        </div>
      </div>
    </Link>
  );
};

const RequestFeedCard = ({ request }) => {
  const urgencyColors = {
    High: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    Medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    Low: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  };
  const urg = urgencyColors[request.urgency] || urgencyColors.Medium;

  return (
    <Link href={`/request/${request.id}`}>
      <div className="group cursor-pointer h-full rounded-2xl overflow-hidden bg-white border-2 border-[#E0E7FF] hover:border-[#1877F2] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className="relative w-full h-40 bg-gradient-to-br from-[#EFF6FF] to-[#E0E7FF] p-4 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between gap-1 z-10">
              <span className="bg-[#1877F2] text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase shadow-sm">
                📢 Needed
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs"
                style={{ background: urg.bg, color: urg.text, borderColor: urg.border }}
              >
                {request.urgency || 'Medium'}
              </span>
            </div>

            <div className="my-auto z-10">
              <HelpCircle className="w-8 h-8 text-[#1877F2]/60 mb-1" strokeWidth={1.75} />
              <p className="text-xs font-semibold text-[#1B2A4A] line-clamp-1">
                Student Material Request
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#1B2A4A]/70 z-10">
              <span className="font-medium truncate max-w-[120px]">{request.category}</span>
              <span>{new Date(request.created_at).toLocaleDateString()}</span>
            </div>

            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/40 pointer-events-none" />
          </div>

          <div className="p-3.5">
            <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 mb-2" style={{ color: '#1B2A4A' }}>
              {request.title}
            </h3>
            <div className="flex gap-1.5 mb-2.5 text-[11px] text-[#8A8272]">
              {request.department && <span>{request.department}</span>}
              {request.department && request.semester && <span>·</span>}
              {request.semester && <span>{request.semester}</span>}
            </div>
            {request.subject && (
              <p className="text-[11px] text-[#1B2A4A]/70 line-clamp-1 mb-2">
                📖 {request.subject}
              </p>
            )}
          </div>
        </div>

        <div className="p-3.5 pt-0">
          <div className="w-full py-1.5 px-3 rounded-lg bg-blue-50 text-[#1877F2] text-xs font-semibold text-center group-hover:bg-[#1877F2] group-hover:text-white transition">
            I Have This →
          </div>
        </div>
      </div>
    </Link>
  );
};

const CategoryCard = ({ name, style, href }) => {
  const IconComponent = style?.icon || BookOpen;
  const targetHref = href || `/search?category=${encodeURIComponent(name)}`;

  return (
    <Link href={targetHref}>
      <div
        className={`group relative rounded-2xl p-3.5 h-24 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${style?.rotate} hover:rotate-0 hover:scale-[1.04] hover:shadow-xl active:scale-95`}
        style={{ background: style?.paper, boxShadow: '0 2px 0 rgba(27,42,74,0.06)' }}
      >
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 rounded-sm bg-white/70 border border-black/5 rotate-1" />
        <IconComponent className="w-6 h-6 mb-1.5" style={{ color: style?.ink }} strokeWidth={1.5} />
        <p className="font-medium text-[13px] leading-tight text-center line-clamp-2" style={{ color: style?.ink }}>{name}</p>
      </div>
    </Link>
  );
};

export default function HomePage() {
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userDept, setUserDept] = useState('CS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchFeed();
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserDept(userData.department || 'CS');
      setIsLoggedIn(true);
    }
  }, []);

  const fetchFeed = async () => {
    try {
      setIsLoading(true);

      const [listingsRes, requestsRes] = await Promise.all([
        supabase
          .from('listings')
          .select('*')
          .eq('status', 'Active')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('requests')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const taggedListings = (listingsRes.data || []).map((item) => ({
        ...item,
        _type: 'listing',
      }));

      const taggedRequests = (requestsRes.data || []).map((item) => ({
        ...item,
        _type: 'request',
      }));

      const merged = [...taggedListings, ...taggedRequests]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20);

      setFeedItems(merged);
    } catch (error) {
      console.error('Error fetching feed:', error);
      setFeedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const personalizedItems = feedItems.filter((l) => l.department === userDept).slice(0, 4);
  const recentItems = feedItems.slice(0, 8);

  return (
    <div className="bg-[#FBF8F1] min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .font-body { font-family: 'Inter', -apple-system, sans-serif; }
        @keyframes float-slow { 0%, 100% { transform: translateY(0px) rotate(-4deg); } 50% { transform: translateY(-8px) rotate(-2deg); } }
        @keyframes float-slow-2 { 0%, 100% { transform: translateY(0px) rotate(5deg); } 50% { transform: translateY(-10px) rotate(7deg); } }
        .float-1 { animation: float-slow 6s ease-in-out infinite; }
        .float-2 { animation: float-slow-2 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .float-1, .float-2 { animation: none; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* HERO SECTION */}
      <section className="relative px-4 pt-6 pb-7 md:pt-10 md:pb-9 overflow-hidden">
        {/* corkboard texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: '#F1E8D8',
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(27,42,74,0.10) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 60%, #FBF8F1 100%)' }} />

        {/* floating decorative "pinned" scraps */}
        <div className="hidden lg:block absolute top-6 left-[6%] w-16 h-20 bg-white rounded-sm shadow-lg border border-black/5 float-1 opacity-90">
          <div className="w-full h-full p-2 flex flex-col gap-1">
            <div className="h-1.5 w-full bg-[#E5DCC6] rounded-full" />
            <div className="h-1.5 w-3/4 bg-[#E5DCC6] rounded-full" />
            <BookOpen className="w-4 h-4 mt-auto ml-auto text-[#B23A2E]" strokeWidth={1.5} />
          </div>
        </div>
        <div className="hidden lg:flex absolute top-10 right-[8%] w-14 h-14 bg-[#F4C95D] rounded-full shadow-lg items-center justify-center float-2 opacity-90">
          <Calculator className="w-5 h-5 text-[#1B2A4A]" strokeWidth={1.75} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#1B2A4A]/10 mb-3 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60]" />
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase font-body" style={{ color: '#1B2A4A' }}>
              The campus exchange
            </p>
          </div>

          <h1 className="font-display text-3xl leading-[1.1] md:text-5xl font-semibold mb-2.5 tracking-tight" style={{ color: '#1B2A4A' }}>
            Every book has <span className="italic" style={{ color: '#B23A2E' }}>another</span> reader
          </h1>
          <p className="font-body text-[#5B5647] mb-5 text-[13px] md:text-sm max-w-md mx-auto leading-relaxed hidden sm:block">
            Textbooks, notes and lab manuals, passed on by students who've already used them.
          </p>

          {/* #6: Search bar properly navigates to search page */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-4 mt-4 sm:mt-0">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-[#8A8272] group-focus-within:text-[#1B2A4A] transition" />
              <input
                type="text"
                placeholder="Search textbooks, notes, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="font-body w-full pl-11 pr-12 py-3 rounded-full border-2 border-[#1B2A4A]/10 text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition bg-white shadow-md shadow-[#1B2A4A]/5"
                style={{ color: '#1B2A4A' }}
              />
              <button type="submit"
                aria-label="Search"
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-full font-semibold text-white transition hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center"
                style={{ background: '#1B2A4A' }}>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <button onClick={handleCreateListing}
            className="font-body px-6 py-2.5 rounded-full font-semibold text-white text-sm transition hover:shadow-xl hover:-translate-y-0.5 active:scale-95 inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}>
            {isLoggedIn ? 'Start Selling' : 'Browse Listings'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* CATEGORIES & QUICK ACTIONS */}
      <section className="px-4 pt-5 pb-8 md:pt-8 md:pb-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat} name={cat} style={CATEGORY_STYLE[cat]} />
          ))}
          {ACTION_TILES.map((tile) => (
            <CategoryCard key={tile.name} name={tile.name} style={tile} href={tile.href} />
          ))}
        </div>
      </section>

      {/* PERSONALIZED FEED */}
      {personalizedItems.length > 0 && (
        <section className="px-4 py-8 md:py-12 max-w-7xl mx-auto">
          <div className="flex items-baseline justify-between gap-2.5 mb-4">
            <h2 className="font-display text-xl md:text-2xl font-semibold" style={{ color: '#1B2A4A' }}>For {userDept}</h2>
            <Link href={`/search?department=${userDept}`} className="font-body text-xs font-semibold shrink-0" style={{ color: '#27AE60' }}>
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {isLoading
              ? [1,2,3,4].map(i => <LoadingSkeleton key={i} />)
              : personalizedItems.map(item =>
                  item._type === 'request' ? (
                    <RequestFeedCard key={item.id} request={item} />
                  ) : (
                    <ListingCard key={item.id} listing={item} />
                  )
                )}
          </div>
        </section>
      )}

      {/* RECENT FEED */}
      <section className="px-4 py-8 md:py-12 max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between gap-2.5 mb-4">
          <h2 className="font-display text-xl md:text-2xl font-semibold" style={{ color: '#1B2A4A' }}>Latest Listings & Requests</h2>
          <Link href="/search" className="font-body text-xs font-semibold shrink-0" style={{ color: '#27AE60' }}>Explore all →</Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1,2,3,4].map(i => <LoadingSkeleton key={i} />)}
          </div>
        ) : recentItems.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {recentItems.map(item =>
              item._type === 'request' ? (
                <RequestFeedCard key={item.id} request={item} />
              ) : (
                <ListingCard key={item.id} listing={item} />
              )
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-[#E7E0D2]">
            <p className="font-body text-[#5B5647] text-sm mb-4">No listings or requests yet. Be the first to share.</p>
            <button onClick={handleCreateListing}
              className="font-body px-6 py-2.5 rounded-full font-semibold text-white text-sm transition hover:shadow-md active:scale-95 inline-flex items-center gap-2"
              style={{ background: '#1B2A4A' }}>
              Create First Listing <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* WHY UNSHELF */}
      <section className="px-4 py-12 md:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-9">
          <p className="font-body text-[11px] font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: '#27AE60' }}>Why students choose Unshelf</p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: '#1B2A4A' }}>Built for the campus, not the market</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl p-6 bg-[#FDECEA] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
              <Shield className="w-5 h-5" style={{ color: '#B23A2E' }} strokeWidth={1.75} />
            </div>
            <h3 className="font-display font-semibold text-base mb-1.5" style={{ color: '#1B2A4A' }}>Verified Students</h3>
            <p className="font-body text-xs text-[#5B5647] leading-relaxed">College email verified. Trade safely with people from your campus.</p>
          </div>
          <div className="rounded-2xl p-6 bg-[#FBF0DC] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
              <Zap className="w-5 h-5" style={{ color: '#B8860B' }} strokeWidth={1.75} />
            </div>
            <h3 className="font-display font-semibold text-base mb-1.5" style={{ color: '#1B2A4A' }}>Fair Prices</h3>
            <p className="font-body text-xs text-[#5B5647] leading-relaxed">No middlemen, no markup. Students set their own rates.</p>
          </div>
          <div className="rounded-2xl p-6 bg-[#EAF1FB] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
              <Users className="w-5 h-5" style={{ color: '#2C5AA0' }} strokeWidth={1.75} />
            </div>
            <h3 className="font-display font-semibold text-base mb-1.5" style={{ color: '#1B2A4A' }}>Easy & Quick</h3>
            <p className="font-body text-xs text-[#5B5647] leading-relaxed">A simple interface built for busy semesters. Minutes to buy or sell.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
