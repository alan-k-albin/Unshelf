'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Search, Filter, X, Plus, HelpCircle, BookOpen, Wrench, AlertCircle } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import FilterPanel from '@/components/FilterPanel';

const defaultFilters = {
  minPrice: 0,
  maxPrice: 100000,
  minPriceText: '',
  maxPriceText: '',
  conditions: [], // array — multi-select
  categories: [], // array — multi-select
  sortBy: 'newest',
};

const URGENCY_BADGES = {
  High: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: '🔴 Urgent' },
  Medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: '🟡 Medium' },
  Low: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', label: '🟢 Low' },
};

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'listings';
  const initialCategory = searchParams.get('category') || '';
  const initialDepartment = searchParams.get('department') || '';

  const [activeType, setActiveType] = useState(initialType);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    ...defaultFilters,
    categories: initialCategory ? [initialCategory] : [],
  });
  const [pendingFilters, setPendingFilters] = useState({
    ...defaultFilters,
    categories: initialCategory ? [initialCategory] : [],
  });

  useEffect(() => {
    const typeParam = searchParams.get('type') || 'listings';
    setActiveType(typeParam);
  }, [searchParams]);

  useEffect(() => {
    performSearch(searchInput, appliedFilters, activeType);
  }, [appliedFilters, activeType]);

  const performSearch = async (searchQuery, filters, type) => {
    setLoading(true);
    try {
      if (type === 'requests') {
        let queryBuilder = supabase
          .from('requests')
          .select('*')
          .eq('status', 'open');

        if (searchQuery) {
          queryBuilder = queryBuilder.or(
            `title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
          );
        }

        if (initialDepartment) {
          queryBuilder = queryBuilder.eq('department', initialDepartment);
        }

        if (filters.categories && filters.categories.length > 0) {
          queryBuilder = queryBuilder.in('category', filters.categories);
        }

        queryBuilder = queryBuilder.order('created_at', { ascending: false });

        const { data, error } = await queryBuilder;
        if (error) throw error;
        setItems(data || []);
      } else if (type === 'services') {
        // Will be wired to services table in Feature 3
        setItems([]);
      } else {
        // Default: listings
        let queryBuilder = supabase
          .from('listings')
          .select('*')
          .eq('status', 'Active');

        if (searchQuery) {
          queryBuilder = queryBuilder.or(
            `title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`
          );
        }

        if (initialDepartment) {
          queryBuilder = queryBuilder.eq('department', initialDepartment);
        }

        if (filters.minPrice > 0) {
          queryBuilder = queryBuilder.gte('price', filters.minPrice);
        }
        if (filters.maxPrice < 100000) {
          queryBuilder = queryBuilder.lte('price', filters.maxPrice);
        }

        if (filters.conditions && filters.conditions.length > 0) {
          queryBuilder = queryBuilder.in('condition', filters.conditions);
        }

        if (filters.categories && filters.categories.length > 0) {
          queryBuilder = queryBuilder.in('category', filters.categories);
        }

        if (filters.sortBy === 'newest') {
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
        } else if (filters.sortBy === 'price-low') {
          queryBuilder = queryBuilder.order('price', { ascending: true });
        } else if (filters.sortBy === 'price-high') {
          queryBuilder = queryBuilder.order('price', { ascending: false });
        }

        const { data, error } = await queryBuilder;
        if (error) throw error;
        setItems(data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchInput, appliedFilters, activeType);
  };

  const handleTabSwitch = (newType) => {
    setActiveType(newType);
    const newParams = new URLSearchParams(searchParams.toString());
    if (newType === 'listings') {
      newParams.delete('type');
    } else {
      newParams.set('type', newType);
    }
    router.replace(`/search?${newParams.toString()}`);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...pendingFilters });
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setPendingFilters({ ...defaultFilters });
    setAppliedFilters({ ...defaultFilters });
    setShowFilters(false);
  };

  const removeCategory = (cat) => {
    setAppliedFilters((f) => ({
      ...f,
      categories: f.categories.filter((c) => c !== cat),
    }));
  };

  const removeCondition = (cond) => {
    setAppliedFilters((f) => ({
      ...f,
      conditions: f.conditions.filter((c) => c !== cond),
    }));
  };

  const hasActiveFilters =
    appliedFilters.conditions.length > 0 ||
    appliedFilters.categories.length > 0 ||
    appliedFilters.sortBy !== 'newest' ||
    appliedFilters.minPrice > 0 ||
    appliedFilters.maxPrice < 100000;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Sticky Top Section */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-xs">
        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2">
          <form onSubmit={handleSearch} className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeType === 'requests'
                    ? 'Search material requests (e.g. Physics notes)...'
                    : activeType === 'services'
                    ? 'Search student services...'
                    : 'Search textbooks, notes, lab manuals...'
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {activeType === 'listings' && (
              <button
                type="button"
                onClick={() => {
                  setPendingFilters({ ...appliedFilters });
                  setShowFilters(!showFilters);
                }}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 relative"
              >
                <Filter className="w-5 h-5" style={{ color: '#1877F2' }} />
                {hasActiveFilters && (
                  <span
                    className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: '#27AE60' }}
                  />
                )}
              </button>
            )}
          </form>
        </div>

        {/* Type Navigation Tabs */}
        <div className="flex px-4 border-t border-gray-100 overflow-x-auto gap-2 py-1.5 scrollbar-none">
          <button
            onClick={() => handleTabSwitch('listings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              activeType === 'listings'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Items for Sale / Free
          </button>

          <button
            onClick={() => handleTabSwitch('requests')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              activeType === 'requests'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Material Requests
          </button>

          <button
            onClick={() => handleTabSwitch('services')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              activeType === 'services'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Student Services
          </button>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && activeType === 'listings' && (
          <div className="flex gap-2 px-4 pb-2 flex-wrap">
            {appliedFilters.conditions.map((cond) => (
              <span
                key={cond}
                className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"
              >
                {cond}
                <button onClick={() => removeCondition(cond)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {appliedFilters.categories.map((cat) => (
              <span
                key={cat}
                className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1"
              >
                {cat}
                <button onClick={() => removeCategory(cat)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex gap-6">
        {/* Desktop Filter Sidebar for Listings */}
        {activeType === 'listings' && (
          <div className="hidden lg:block w-72 flex-shrink-0">
            <FilterPanel
              isOpen={true}
              isDesktop={true}
              filters={pendingFilters}
              setFilters={setPendingFilters}
              onClose={() => {}}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>
        )}

        {/* Mobile Filter Modal */}
        {showFilters && activeType === 'listings' && (
          <FilterPanel
            isOpen={showFilters}
            isDesktop={false}
            filters={pendingFilters}
            setFilters={setPendingFilters}
            onClose={() => setShowFilters(false)}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        )}

        {/* Results Area */}
        <div className="flex-1 min-w-0">
          {/* Section Header & Create Action */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-600">
              {loading
                ? 'Searching...'
                : `${items.length} ${
                    activeType === 'requests'
                      ? 'material requests'
                      : activeType === 'services'
                      ? 'services'
                      : 'listings'
                  } found`}
            </p>

            {activeType === 'requests' ? (
              <Link
                href="/create-request"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Request Material
              </Link>
            ) : activeType === 'services' ? (
              <Link
                href="/create-service"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Offer / Request Service
              </Link>
            ) : (
              <Link
                href="/create-listing"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1B2A4A] hover:bg-[#2A3F6D] text-white text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                + Sell Item
              </Link>
            )}
          </div>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <EmptyState
              message={
                activeType === 'requests'
                  ? 'No material requests found. Be the first to ask your campus peers!'
                  : activeType === 'services'
                  ? 'No services listed yet.'
                  : 'No listings found. Try adjusting your filters or search terms!'
              }
            />
          )}

          {/* REQUEST RESULTS */}
          {!loading && items.length > 0 && activeType === 'requests' && (
            <div className="space-y-3">
              {items.map((req) => {
                const urg = URGENCY_BADGES[req.urgency] || URGENCY_BADGES.Medium;
                return (
                  <div
                    key={req.id}
                    onClick={() => router.push(`/request/${req.id}`)}
                    className="p-4 border border-gray-200 rounded-2xl cursor-pointer hover:shadow-md hover:border-blue-300 transition bg-white"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                          📢 Request
                        </span>
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full border font-semibold"
                          style={{ background: urg.bg, color: urg.text, borderColor: urg.border }}
                        >
                          {urg.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {req.category}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-semibold text-base mb-1.5" style={{ color: '#1B2A4A' }}>
                      {req.title}
                    </h3>

                    {req.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2.5">
                        {req.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <div className="flex gap-2 text-gray-500">
                        {req.department && <span>🏛️ {req.department}</span>}
                        {req.semester && <span>🎓 {req.semester}</span>}
                        {req.subject && <span>📖 {req.subject}</span>}
                      </div>

                      <span className="font-semibold text-blue-600 hover:underline">
                        I Have This →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LISTINGS RESULTS */}
          {!loading && items.length > 0 && activeType === 'listings' && (
            <div className="space-y-3">
              {items.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => router.push(`/listing/${listing.id}`)}
                  className="p-4 border border-gray-200 rounded-2xl cursor-pointer hover:shadow-md transition bg-white"
                >
                  <div className="flex gap-4">
                    {(listing.image_urls?.[0] || listing.image_url) && (
                      <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                        <img
                          src={listing.image_urls?.[0] || listing.image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                        {listing.image_urls?.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded font-medium">
                            +{listing.image_urls.length - 1}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-sm mb-1 line-clamp-2"
                        style={{ color: '#1B2A4A' }}
                      >
                        {listing.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                          {listing.category}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded font-medium"
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
                      <div className="flex items-center justify-between">
                        <div>
                          {listing.is_free ? (
                            <span className="text-base font-bold text-green-600">Free</span>
                          ) : (
                            <span className="text-base font-bold" style={{ color: '#1B2A4A' }}>
                              ₹{listing.price?.toLocaleString()}
                            </span>
                          )}
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(listing.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {listing.semester && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                            {listing.semester}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-500">Loading search...</p>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
