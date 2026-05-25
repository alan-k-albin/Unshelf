'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, LogOut, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { logoutUser } from '@/lib/auth';
import ConditionLabel from '@/components/ConditionLabel';

const ListingCard = ({ listing }) => {
  return (
    <Link href={`/listing/${listing.id}`}>
      <div className="listing-card cursor-pointer group">
        <div className="relative w-full h-40 bg-gray-200 rounded-lg overflow-hidden mb-2">
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
          <div className={`absolute top-1 right-1 text-xs px-2 py-1 rounded badge-status ${listing.status === 'Active' ? 'badge-status-active' : 'badge-status-exchanged'}`}>
            {listing.status === 'Active' ? '🟢' : '✓'}
          </div>
        </div>
        <h3 className="font-semibold text-xs text-primary line-clamp-1">{listing.title}</h3>
        <p className="text-xs text-gray-600">{listing.category}</p>
        {listing.is_free ? (
          <p className="text-accent font-bold text-xs mt-1">Free</p>
        ) : (
          <p className="text-primary font-bold text-sm">₹{listing.price}</p>
        )}
      </div>
    </Link>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchUserListings();
  }, [router]);

  const fetchUserListings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const success = await logoutUser();
    if (success) {
      router.push('/login');
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  const activeListings = userListings.filter(l => l.status === 'Active');
  const exchangedListings = userListings.filter(l => l.status === 'Exchanged');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-accent hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg p-6 md:p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-3xl font-bold">
            {user.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">{user.fullName}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex gap-2 mt-2 text-sm">
              <span className="bg-accent/10 text-accent px-2 py-1 rounded">
                {user.department}
              </span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {user.semester}
              </span>
            </div>
          </div>
          <button className="ml-auto p-2 hover:bg-gray-100 rounded-lg">
            <Edit2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-2">Contact</p>
          <p className="font-mono text-primary">{user.whatsapp}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-accent">{activeListings.length}</p>
          <p className="text-sm text-gray-600">Active Listings</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary">{exchangedListings.length}</p>
          <p className="text-sm text-gray-600">Exchanged</p>
        </div>
      </div>

      {/* Create Listing Button */}
      <Link href="/create-listing" className="btn-primary w-full flex items-center justify-center gap-2 mb-8">
        <Plus className="w-5 h-5" />
        Create New Listing
      </Link>

      {/* Active Listings */}
      {activeListings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-primary mb-4">
            🟢 Active Listings ({activeListings.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activeListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Exchanged Listings */}
      {exchangedListings.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-primary mb-4">
            ✓ Exchanged ({exchangedListings.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {exchangedListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {userListings.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No listings yet</p>
          <Link href="/create-listing" className="btn-primary inline-block">
            Create Your First Listing
          </Link>
        </div>
      )}
    </div>
  );
          }
