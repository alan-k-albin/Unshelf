'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Search, Filter, X } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import FilterPanel from '@/components/FilterPanel';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 100000,
    condition: '',
    category: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    performSearch();
  }, [filters, query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('listings')
        .select('*')
        .eq('status', 'Active');

      if (query) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,category.ilike.%${query}%,subject.ilike.%${query}%`
        );
      }

      if (filters.minPrice > 0) {
        queryBuilder = queryBuilder.gte('price', filters.minPrice);
      }
      if (filters.maxPrice < 100000) {
        queryBuilder = queryBuilder.lte('price', filters.maxPrice);
      }

      if (filters.condition) {
        queryBuilder = queryBuilder.eq('condition', filters.condition);
      }

      if (filters.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
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

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    await performSearch();
  };

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
            onClick={() => setShowFilters(!showFilters)}
            className="p-2.5 rounded-lg hover:bg-gray-100 relative"
          >
            <Filter className="w-5 h-5" style={{ color: '#1877F2' }} />
            {(filters.condition ||
              filters.category ||
              filters.sortBy !== 'newest' ||
              filters.minPrice > 0 ||
              filters.maxPrice < 100000) && (
              <span
                className="absolute top-0 right-0 w-2 h-2 rounded-full"
                style={{ background: '#27AE60' }}
              />
            )}
          </button>
        </form>
      </div>

      {/* Filter Panel - Mobile */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end md:hidden">
          <div className="w-full max-h-[80vh] rounded-t-2xl overflow-hidden">
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-4 px-4 py-6">
        {/* Filter Panel - Desktop */}
        <div className="hidden md:block w-64">
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            onClose={() => {}}
          />
        </div>

        {/* Listings Grid */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {loading ? 'Searching...' : `${listings.length} results found`}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && listings.length === 0 && (
            <EmptyState message="No listings found. Try different filters!" />
          )}

          {/* Listings */}
          {!loading && listings.length > 0 && (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => (window.location.href = `/listing/${listing.id}`)}
                  className="p-4 border border-gray-200 rounded-xl cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    {listing.image_url && (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={listing.image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
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
                              listing.condition === 'Like New'
                                ? '#E0F2FE'
                                : listing.condition === 'Good'
                                ? '#DCFCE7'
                                : listing.condition === 'Used'
                                ? '#FEF3C7'
                                : '#FECACA',
                            color:
                              listing.condition === 'Like New'
                                ? '#0369A1'
                                : listing.condition === 'Good'
                                ? '#166534'
                                : listing.condition === 'Used'
                                ? '#92400E'
                                : '#DC2626',
                          }}
                        >
                          {listing.condition}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {listing.is_free ? (
                            <span className="text-lg font-bold text-green-600">
                              Free
                            </span>
                          ) : (
                            <span className="text-lg font-bold" style={{ color: '#1B2A4A' }}>
                              ₹{listing.price?.toLocaleString()}
                            </span>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(listing.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {listing.semester}
                        </span>
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
