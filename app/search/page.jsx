'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Search, Filter, X, Plus, HelpCircle, BookOpen, Wrench, Briefcase } from 'lucide-react';
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
  const initialServiceType = searchParams.get('service_type') || 'all';

  const [activeType, setActiveType] = useState(initialType);
  const [serviceTypeFilter, setServiceTypeFilter] = useState(initialServiceType);
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
    const serviceTypeParam = searchParams.get('service_type') || 'all';
    setServiceTypeFilter(serviceTypeParam);
  }, [searchParams]);

  useEffect(() => {
    performSearch(searchInput, appliedFilters, activeType, serviceTypeFilter);
  }, [appliedFilters, activeType, serviceTypeFilter]);

  const performSearch = async (searchQuery, filters, type, serviceType) => {
    setLoading(true);
    try {
      if (type === 'requests') {
        let queryBuilder = supabase
          .from('requests')
          .select('*')
          .eq('status', 'open')
          .eq('is_hidden', false);

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
        let queryBuilder = supabase
          .from('services')
          .select('*')
          .eq('status', 'open')
          .eq('is_hidden', false);

        if (serviceType && serviceType !== 'all') {
          queryBuilder = queryBuilder.eq('service_type', serviceType);
        }

        if (searchQuery) {
          queryBuilder = queryBuilder.or(
            `title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,rate.ilike.%${searchQuery}%`
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
      } else {
        // Default: listings
        let queryBuilder = supabase
          .from('listings')
          .select('*')
          .eq('status', 'Active')
          .eq('is_hidden', false);

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
    performSearch(searchInput, appliedFilters, activeType, serviceTypeFilter);
  };

  const handleTabSwitch = (newType) => {
    setActiveType(newType);
    const newParams = new URLSearchParams(searchParams.toString());
    if (newType === 'listings') {
      newParams.delete('type');
      newParams.delete('service_type');
    } else if (newType === 'requests') {
      newParams.set('type', 'requests');
      newParams.delete('service_type');
    } else if (newType === 'services') {
      newParams.set('type', 'services');
    }
    router.replace(`/search?${newParams.toString()}`);
  };

  const handleServiceTypeChange = (st) => {
    setServiceTypeFilter(st);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('type', 'services');
    if (st === 'all') {
      newParams.delete('service_type');
    } else {
      newParams.set('service_type', st);
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
    <div className="min-h-screen bg-[#FBF8F1] pb-24 font-body">
      {/* Sticky Top Section */}
      <div className="sticky top-0 bg-[#FBF8F1]/95 backdrop-blur-md border-b border-[#EDE6D6] z-20 shadow-xs">
        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2 max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8272]" />
              <input
                type="text"
                placeholder={
                  activeType === 'requests'
                    ? 'Search material requests (e.g. Physics notes)...'
                    : activeType === 'services'
                    ? 'Search student services (e.g. Python tutoring, lab records)...'
                    : 'Search textbooks, notes, lab manuals...'
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 min-h-[44px] border-2 border-[#EDE6D6] rounded-xl text-sm focus:outline-none focus:border-[#1B2A4A] focus:ring-4 focus:ring-[#1B2A4A]/8 transition text-[#1B2A4A] bg-white placeholder-[#8A8272]"
              />
            </div>

            {activeType === 'listings' && (
              <button
                type="button"
                onClick={() => {
                  setPendingFilters({ ...appliedFilters });
                  setShowFilters(!showFilters);
                }}
                aria-label="Filter listings"
                className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl border-2 border-[#EDE6D6] bg-white hover:border-[#1B2A4A] hover:bg-[#F3EFE4] text-[#1B2A4A] relative transition flex items-center justify-center"
              >
                <Filter className="w-5 h-5 text-[#1B2A4A]" />
                {hasActiveFilters && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#27AE60]"
                  />
                )}
              </button>
            )}
          </form>
        </div>

        {/* Type Navigation Tabs */}
        <div className="flex px-4 border-t border-[#EDE6D6] overflow-x-auto gap-2 py-2 scrollbar-none max-w-7xl mx-auto">
          <button
            onClick={() => handleTabSwitch('listings')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition min-h-[36px] ${
              activeType === 'listings'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#5B5647] hover:bg-[#F3EFE4] hover:text-[#1B2A4A]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Items for Sale / Free
          </button>

          <button
            onClick={() => handleTabSwitch('requests')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition min-h-[36px] ${
              activeType === 'requests'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#5B5647] hover:bg-[#F3EFE4] hover:text-[#1B2A4A]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Material Requests
          </button>

          <button
            onClick={() => handleTabSwitch('services')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition min-h-[36px] ${
              activeType === 'services'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#5B5647] hover:bg-[#F3EFE4] hover:text-[#1B2A4A]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Student Services
          </button>
        </div>

        {/* Sub-tabs for Services (All / Offering / Seeking) */}
        {activeType === 'services' && (
          <div className="flex px-4 pb-2 pt-1 gap-2 border-t border-[#EDE6D6] max-w-7xl mx-auto">
            <button
              onClick={() => handleServiceTypeChange('all')}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border-2 transition ${
                serviceTypeFilter === 'all'
                  ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                  : 'bg-white text-[#1B2A4A] border-[#EDE6D6] hover:border-[#1B2A4A]'
              }`}
            >
              All Services
            </button>
            <button
              onClick={() => handleServiceTypeChange('offering')}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1 ${
                serviceTypeFilter === 'offering'
                  ? 'bg-[#15803D] text-white border-[#15803D]'
                  : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] hover:border-[#15803D]'
              }`}
            >
              <Briefcase className="w-3 h-3" />
              Offered by Peers
            </button>
            <button
              onClick={() => handleServiceTypeChange('seeking')}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1 ${
                serviceTypeFilter === 'seeking'
                  ? 'bg-[#B45309] text-white border-[#B45309]'
                  : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] hover:border-[#B45309]'
              }`}
            >
              <Wrench className="w-3 h-3" />
              Needed / Requests
            </button>
          </div>
        )}

        {/* Active filter chips for listings */}
        {hasActiveFilters && activeType === 'listings' && (
          <div className="flex gap-2 px-4 pb-2 flex-wrap max-w-7xl mx-auto">
            {appliedFilters.conditions.map((cond) => (
              <span
                key={cond}
                className="text-xs px-2.5 py-1 rounded-full bg-[#EAF1FB] text-[#2C5AA0] border border-[#D0E1F9] flex items-center gap-1 font-semibold"
              >
                {cond}
                <button onClick={() => removeCondition(cond)} aria-label={`Remove condition ${cond}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {appliedFilters.categories.map((cat) => (
              <span
                key={cat}
                className="text-xs px-2.5 py-1 rounded-full bg-[#FDECEA] text-[#B23A2E] border border-[#F8D1CC] flex items-center gap-1 font-semibold"
              >
                {cat}
                <button onClick={() => removeCategory(cat)} aria-label={`Remove category ${cat}`}>
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
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#EDE6D6]">
            <p className="text-sm font-semibold text-[#5B5647]">
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs transition hover:opacity-95"
                style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
              >
                <Plus className="w-4 h-4" />
                Request Material
              </Link>
            ) : activeType === 'services' ? (
              <Link
                href="/create-service"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs transition hover:opacity-95"
                style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
              >
                <Plus className="w-4 h-4" />
                Post Service
              </Link>
            ) : (
              <Link
                href="/create-listing"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs transition hover:opacity-95"
                style={{ background: 'linear-gradient(135deg, #27AE60, #1F9550)' }}
              >
                <Plus className="w-4 h-4" />
                Sell Item
              </Link>
            )}
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  ? 'No student services listed matching your criteria.'
                  : 'No listings found. Try adjusting your filters or search terms!'
              }
            />
          )}

          {/* SERVICE RESULTS */}
          {!loading && items.length > 0 && activeType === 'services' && (
            <div className="space-y-3.5">
              {items.map((srv) => {
                const isOff = srv.service_type === 'offering';
                return (
                  <div
                    key={srv.id}
                    onClick={() => router.push(`/service/${srv.id}`)}
                    className="group p-4 border-2 border-[#EDE6D6] rounded-2xl cursor-pointer hover:shadow-xl hover:border-[#1B2A4A] hover:-translate-y-0.5 transition-all duration-300 bg-white"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            isOff
                              ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                              : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                          }`}
                        >
                          {isOff ? <Briefcase className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                          {isOff ? 'Offering' : 'Seeking'}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3EFE4] text-[#1B2A4A] border border-[#EDE6D6] font-semibold">
                          {srv.category}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A] whitespace-nowrap">
                        {srv.rate || 'Negotiable'}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-base mb-1.5 text-[#1B2A4A]">
                      {srv.title}
                    </h3>

                    {srv.description && (
                      <p className="text-xs text-[#5B5647] line-clamp-2 mb-2.5 leading-relaxed">
                        {srv.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2.5 border-t border-[#EDE6D6] text-xs">
                      <div className="flex gap-2 text-[#8A8272] flex-wrap font-medium">
                        {srv.department && <span>{srv.department}</span>}
                        {srv.semester && <span>• {srv.semester}</span>}
                        <span>• {new Date(srv.created_at).toLocaleDateString()}</span>
                      </div>

                      <span className="font-semibold text-[#27AE60] group-hover:underline">
                        View Service →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* REQUEST RESULTS */}
          {!loading && items.length > 0 && activeType === 'requests' && (
            <div className="space-y-3.5">
              {items.map((req) => {
                const urg = URGENCY_BADGES[req.urgency] || URGENCY_BADGES.Medium;
                return (
                  <div
                    key={req.id}
                    onClick={() => router.push(`/request/${req.id}`)}
                    className="group p-4 border-2 border-[#EDE6D6] rounded-2xl cursor-pointer hover:shadow-xl hover:border-[#1B2A4A] hover:-translate-y-0.5 transition-all duration-300 bg-white"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-semibold">
                          Request
                        </span>
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full border font-semibold"
                          style={{ background: urg.bg, color: urg.text, borderColor: urg.border }}
                        >
                          {urg.label}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3EFE4] text-[#1B2A4A] border border-[#EDE6D6] font-semibold">
                          {req.category}
                        </span>
                      </div>
                      <span className="text-xs text-[#8A8272] whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-base mb-1.5 text-[#1B2A4A]">
                      {req.title}
                    </h3>

                    {req.description && (
                      <p className="text-xs text-[#5B5647] line-clamp-2 mb-2.5 leading-relaxed">
                        {req.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2.5 border-t border-[#EDE6D6] text-xs">
                      <div className="flex gap-2 text-[#8A8272] flex-wrap font-medium">
                        {req.department && <span>{req.department}</span>}
                        {req.semester && <span>• {req.semester}</span>}
                        {req.subject && <span>• {req.subject}</span>}
                      </div>

                      <span className="font-semibold text-[#1B2A4A] group-hover:text-[#27AE60] transition-colors">
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
            <div className="space-y-3.5">
              {items.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => router.push(`/listing/${listing.id}`)}
                  className="group p-4 border-2 border-[#EDE6D6] rounded-2xl cursor-pointer hover:shadow-xl hover:border-[#1B2A4A] hover:-translate-y-0.5 transition-all duration-300 bg-white"
                >
                  <div className="flex gap-4">
                    {(listing.image_urls?.[0] || listing.image_url) ? (
                      <div className="relative w-24 h-24 bg-[#F3EFE4] rounded-xl overflow-hidden flex-shrink-0 border border-[#EDE6D6]">
                        <img
                          src={listing.image_urls?.[0] || listing.image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {listing.image_urls?.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold backdrop-blur-xs">
                            +{listing.image_urls.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-[#F3EFE4] rounded-xl flex items-center justify-center flex-shrink-0 border border-[#EDE6D6]">
                        <BookOpen className="w-8 h-8 text-[#C9BFA8]" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3
                          className="font-display font-semibold text-sm mb-1.5 line-clamp-2 text-[#1B2A4A]"
                        >
                          {listing.title}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#1B2A4A]/15 text-[#1B2A4A]/70 font-medium">
                            {listing.category}
                          </span>
                          {listing.condition && (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                background:
                                  listing.condition === 'Like New' ? '#EAF3EC'
                                  : listing.condition === 'Good' ? '#EAF1FB'
                                  : listing.condition === 'Used' ? '#FBF0DC'
                                  : '#FDECEA',
                                color:
                                  listing.condition === 'Like New' ? '#1F7A44'
                                  : listing.condition === 'Good' ? '#2C5AA0'
                                  : listing.condition === 'Used' ? '#B8860B'
                                  : '#B23A2E',
                              }}
                            >
                              {listing.condition}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {listing.is_free ? (
                            <span className="font-display text-base font-bold text-[#27AE60]">Free</span>
                          ) : (
                            <span className="font-display text-base font-bold text-[#1B2A4A]">
                              ₹{listing.price?.toLocaleString()}
                            </span>
                          )}
                          <p className="text-[11px] text-[#8A8272] mt-0.5">
                            {new Date(listing.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {listing.semester && (
                          <span className="text-xs bg-[#F3EFE4] text-[#1B2A4A] border border-[#EDE6D6] px-2.5 py-0.5 rounded-full font-semibold">
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
