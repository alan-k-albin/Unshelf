'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORIES, DEPARTMENTS } from '@/app/data';
import EmptyState from '@/components/EmptyState';
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
              📚
            </div>
          )}
          <div className={`absolute top-2 right-2 badge-status ${listing.status === 'Active' ? 'badge-status-active' : 'badge-status-exchanged'}`}>
            {listing.status === 'Active' ? '🟢 Active' : '✓ Exchanged'}
          </div>
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

        {listing.condition && (
          <div className="mb-2">
            <ConditionLabel condition={listing.condition} />
          </div>
        )}

        <div className="mb-3">
          {listing.is_free ? (
            <p className="text-accent font-bold text-sm">📦 Free / Donation</p>
          ) : (
            <p className="text-primary font-bold text-base">₹{listing.price}</p>
          )}
        </div>

        <p className="text-xs text-gray-500">
          by Verified Student
        </p>
      </div>
    </Link>
  );
};

export default function SearchPage() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    department: '',
    semester: '',
    status: 'all',
  });

  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('listings')
        .select('*');

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.semester) {
        query = query.eq('semester', filters.semester);
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'Active');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, search: value }));
  };

  return (
    <div className="pb-20 md:pb-8">
      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search by title, subject..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg text-sm focus:outline-none focus:bg-white"
            />
            <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 text-primary font-medium text-sm"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block md:col-span-1`}>
            <div className="bg-white rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-primary">Filters</h3>

              <div>
                <label className="text-sm font-medium text-primary block mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-primary block mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={filters.department}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-primary block mb-2">
                  Semester
                </label>
                <select
                  name="semester"
                  value={filters.semester}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={`S${s}`}>S{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-primary block mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-accent"
                >
                  <option value="all">All</option>
                  <option value="Active">Active Only</option>
                  <option value="Exchanged">Exchanged</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="md:col-span-3">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {isLoading ? 'Searching...' : `Found ${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No listings found" 
                description="Try adjusting your filters or search terms"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
          }
