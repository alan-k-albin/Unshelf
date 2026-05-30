'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Edit2, LogOut, Settings, ArrowLeft, RefreshCw } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Toast, useToast } from '@/components/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({
    totalListings: 0,
    totalContacts: 0,
    memberSince: new Date().getFullYear(),
  });
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) { router.push('/login'); return; }

      const userData = JSON.parse(userStr);
      setUser(userData);

      const { data: dbUser } = await supabase
        .from('users').select('*').eq('email', userData.email).single();

      if (dbUser) setUser((prev) => ({ ...prev, ...dbUser }));

      // Fetch ALL listings (active + sold) for profile
      const { data: userListings } = await supabase
        .from('listings').select('*').eq('user_id', dbUser?.id)
        .order('created_at', { ascending: false });

      setListings(userListings || []);

      const { data: contacts } = await supabase
        .from('contacts').select('id').eq('user_id', dbUser?.id);

      setUserStats({
        totalListings: userListings?.filter(l => l.status === 'Active')?.length || 0,
        totalContacts: contacts?.length || 0,
        memberSince: dbUser?.created_at
          ? new Date(dbUser.created_at).getFullYear()
          : new Date().getFullYear(),
      });
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // #9: Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
    showToast('Profile refreshed!');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-20 px-4 py-6">
        <LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton />
      </div>
    );
  }

  if (!user) return null;

  const activeListings = listings.filter(l => l.status === 'Active');
  const soldListings = listings.filter(l => l.status === 'Sold');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ color: '#1B2A4A' }}>My Profile</h1>
          {/* #9: Refresh button */}
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#1877F2' }} />
          </button>
          <button onClick={() => router.push('/profile/settings')} className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" style={{ color: '#1877F2' }} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Avatar & Name */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1877F2, #27AE60)' }}>
              {user.full_name?.charAt(0).toUpperCase() || user.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold" style={{ color: '#1B2A4A' }}>
                {user.full_name || user.fullName}
              </h2>
              {/* FIX #3: Department shown */}
              <p className="text-sm text-gray-500 mt-1">
                {[user.department, user.semester].filter(Boolean).join(' • ')}
              </p>
              <p className="text-xs text-gray-400 mt-1">{user.email}</p>
            </div>
          </div>

          {/* Verified */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            {user.is_verified && (
              <div className="flex items-center gap-1">
                <span className="text-green-600">✓</span>
                <span className="text-xs text-green-600 font-semibold">Verified</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 rounded-lg" style={{ background: '#EFF6FF' }}>
              <div className="text-2xl font-bold" style={{ color: '#1877F2' }}>{userStats.totalListings}</div>
              <div className="text-xs text-gray-600 mt-1">Active</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: '#F0FDF4' }}>
              <div className="text-2xl font-bold" style={{ color: '#27AE60' }}>{userStats.totalContacts}</div>
              <div className="text-xs text-gray-600 mt-1">Contacts</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: '#FEF3C7' }}>
              <div className="text-xl font-bold" style={{ color: '#D97706' }}>Member</div>
              <div className="text-xs text-gray-600 mt-1">Since {userStats.memberSince}</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <button onClick={() => router.push('/profile/edit')}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}>
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
            <button onClick={handleLogout}
              className="w-full py-2.5 rounded-xl font-semibold text-sm border border-gray-300 flex items-center justify-center gap-2"
              style={{ color: '#DC2626' }}>
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Active Listings */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>
              My Listings {activeListings.length > 0 && <span className="text-sm text-gray-400">({activeListings.length})</span>}
            </h3>
            <button onClick={() => router.push('/create-listing')}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{ background: '#EFF6FF', color: '#1877F2' }}>+ New</button>
          </div>

          {activeListings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm mb-4">No active listings yet</p>
              <button onClick={() => router.push('/create-listing')}
                className="inline-block px-4 py-2 rounded-lg font-semibold text-sm"
                style={{ background: '#1877F2', color: 'white' }}>Create Your First Listing</button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} router={router} />
              ))}
            </div>
          )}
        </div>

        {/* #4: Sold Listings section */}
        {soldListings.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1B2A4A' }}>
              Sold <span className="text-sm text-gray-400">({soldListings.length})</span>
            </h3>
            <div className="space-y-3">
              {soldListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} router={router} sold />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing, router, sold = false }) {
  return (
    <div
      onClick={() => router.push(`/listing/${listing.id}`)}
      className={`bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition border ${sold ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}
    >
      <div className="flex gap-4">
        <div className="relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          {listing.image_url && (
            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
          )}
          {sold && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SOLD</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm line-clamp-2" style={{ color: '#1B2A4A' }}>
            {listing.title}
          </h4>
          <div className="flex gap-2 mt-2 mb-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{listing.category}</span>
            <span className="text-xs px-2 py-0.5 rounded"
              style={{
                background: listing.condition === 'Like New' ? '#E0F2FE' : listing.condition === 'Good' ? '#DCFCE7' : '#FEF3C7',
                color: listing.condition === 'Like New' ? '#0369A1' : listing.condition === 'Good' ? '#166534' : '#92400E',
              }}>
              {listing.condition}
            </span>
            {sold && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 font-semibold">Sold</span>}
          </div>
          <div className="flex items-center justify-between">
            <div>
              {listing.is_free
                ? <span className="text-lg font-bold text-green-600">Free</span>
                : <span className="text-lg font-bold" style={{ color: '#1B2A4A' }}>₹{listing.price?.toLocaleString()}</span>}
            </div>
            <span className="text-xs text-gray-500">{new Date(listing.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
