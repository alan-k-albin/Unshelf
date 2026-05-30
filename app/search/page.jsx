'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Search, Filter, X } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import FilterPanel from '@/components/FilterPanel';

const defaultFilters = {
  minPrice: 0,
  maxPrice: 100000,
  minPriceText: '',
  maxPriceText: '',
  conditions: [],   // array — multi-select
  categories: [],   // array — multi-select
  sortBy: 'newest',
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [showFilters, setShowFilters] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);

  useEffect(() => {
    performSearch(query, appliedFilters);
  }, [appliedFilters, query]);

  const performSearch = async (searchQuery, filters) => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('listings')
        .select('*')
        .eq('status', 'Active');

      if (searchQuery) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`
        );
      }

      if (filters.minPrice > 0) {
        queryBuilder = queryBuilder.gte('price', filters.minPrice);
      }
      if (filters.maxPrice < 100000) {
        queryBuilder = queryBuilder.lte('price', filters.maxPrice);
      }

      // Multi-select conditions: use .in() if any selected
      if (filters.conditions && filters.conditions.length > 0) {
        queryBuilder = queryBuilder.in('condition', filters.conditions);
      }

      // Multi-select categories: use .in() if any selected
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
      setListings(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchInput, appliedFilters);
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

  const removeCondition = (cond) => {
    setAppliedFilters((f) => ({
      ...f,
      conditions: f.conditions.filter((c) => c !== cond),
    }));
  };

  const removeCategory = (cat) => {
    setAppliedFilters((f) => ({
      ...f,
      categories: f.categories.filter((c) => c !== cat),
    }));
  };

  const hasActiveFilters =
    appliedFilters.conditions.length > 0 ||
    appliedFilters.categories.length > 0 ||
    appliedFilters.sortBy !== 'newest' ||
    appliedFilters.minPrice > 0 ||
    appliedFilters.maxPrice < 100000;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Search Bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-20 px-4 py-3">
        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search textbooks, notes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setPendingFilters({ ...appliedFilters });
              setShowFilters(!showFilters);
            }}
            className="p-2.5 rounded-lg hover:bg-gray-100 relative"
          >
            <Filter className="w-5 h-5" style={{ color: '#1877F2' }} />
            {hasActiveFilters && (
              <span
                className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{ background: '#27AE60' }}
              />
            )}
          </button>
        </form>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {appliedFilters.conditions.map((cond) => (
              <span
                key={cond}
                className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"
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
                className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1"
              >
                {cat}
                <button onClick={() => removeCategory(cat)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {appliedFilters.sortBy !== 'newest' && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                {appliedFilters.sortBy === 'price-low' ? 'Price ↑' : 'Price ↓'}
                <button
                  onClick={() => setAppliedFilters((f) => ({ ...f, sortBy: 'newest' }))}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(appliedFilters.minPrice > 0 || appliedFilters.maxPrice < 100000) && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                ₹{appliedFilters.minPrice} – {appliedFilters.maxPrice >= 100000 ? 'Any' : `₹${appliedFilters.maxPrice}`}
                <button
                  onClick={() =>
                    setAppliedFilters((f) => ({
                      ...f,
                      minPrice: 0,
                      maxPrice: 100000,
                      minPriceText: '',
                      maxPriceText: '',
                    }))
                  }
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel — Mobile Drawer */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end md:hidden">
          <div className="w-full">
            <FilterPanel
              filters={pendingFilters}
              setFilters={setPendingFilters}
              onClose={() => setShowFilters(false)}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-4 px-4 py-6">
        {/* Filter Panel — Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <FilterPanel
            filters={pendingFilters}
            setFilters={setPendingFilters}
            onClose={() => {}}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Listings */}
        <div className="flex-1">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {loading ? 'Searching...' : `${listings.length} results found`}
            </p>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && listings.length === 0 && (
            <EmptyState message="No listings found. Try different filters!" />
          )}

          {!loading && listings.length > 0 && (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => (window.location.href = `/listing/${listing.id}`)}
                  className="p-4 border border-gray-200 rounded-xl cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex gap-4">
                    {listing.image_url && (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={listing.image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
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
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          {listing.category}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded"
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
                            <span className="text-lg font-bold text-green-600">Free</span>
                          ) : (
                            <span className="text-lg font-bold" style={{ color: '#1B2A4A' }}>
                              ₹{listing.price?.toLocaleString()}
                            </span>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(listing.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {listing.semester && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
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
