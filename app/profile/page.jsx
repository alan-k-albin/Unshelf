'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Edit2, LogOut, Settings, ArrowLeft } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalListings: 0,
    totalContacts: 0,
    rating: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get current user
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }

      const userData = JSON.parse(userStr);
      setUser(userData);

      // Get user data from database
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (dbUser) {
        setUser((prev) => ({ ...prev, ...dbUser }));
      }

      // Get user's listings
      const { data: userListings } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', dbUser?.id)
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      setListings(userListings || []);

      // Get contacts count
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', dbUser?.id);

      // Calculate stats
      setUserStats({
        totalListings: userListings?.length || 0,
        totalContacts: contacts?.length || 0,
        rating: dbUser?.rating || 0,
        totalReviews: dbUser?.total_reviews || 0,
      });
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-20 px-4 py-6">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ color: '#1B2A4A' }}>
            My Profile
          </h1>
          <button onClick={() => router.push('/profile/edit')} className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" style={{ color: '#1877F2' }} />
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Avatar & Name */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1877F2, #27AE60)' }}
            >
              {user.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold" style={{ color: '#1B2A4A' }}>
                {user.fullName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {user.department} • {user.semester}
              </p>
              <p className="text-xs text-gray-400 mt-1">{user.email}</p>
            </div>
          </div>

          {/* Rating & Status */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            {user.is_verified && (
              <div className="flex items-center gap-1">
                <span className="text-green-600">✓</span>
                <span className="text-xs text-green-600 font-semibold">Verified</span>
              </div>
            )}
            {userStats.rating > 0 && (
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span className="text-xs font-semibold">
                  {userStats.rating.toFixed(1)} ({userStats.totalReviews})
                </span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 rounded-lg" style={{ background: '#EFF6FF' }}>
              <div className="text-2xl font-bold" style={{ color: '#1877F2' }}>
                {userStats.totalListings}
              </div>
              <div className="text-xs text-gray-600 mt-1">Listings</div>
            </div>

            <div className="text-center p-3 rounded-lg" style={{ background: '#F0FDF4' }}>
              <div className="text-2xl font-bold" style={{ color: '#27AE60' }}>
                {userStats.totalContacts}
              </div>
              <div className="text-xs text-gray-600 mt-1">Contacts</div>
            </div>

            <div className="text-center p-3 rounded-lg" style={{ background: '#FEF3C7' }}>
              <div className="text-2xl font-bold" style={{ color: '#D97706' }}>
                Member
              </div>
              <div className="text-xs text-gray-600 mt-1">Since 2024</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleEditProfile}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl font-semibold text-sm border border-gray-300 flex items-center justify-center gap-2"
              style={{ color: '#DC2626' }}
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* My Listings Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>
              My Listings
            </h3>
            <button
              onClick={() => router.push('/create-listing')}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{ background: '#EFF6FF', color: '#1877F2' }}
            >
              + New
            </button>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm mb-4">No listings yet</p>
              <button
                onClick={() => router.push('/create-listing')}
                className="inline-block px-4 py-2 rounded-lg font-semibold text-sm"
                style={{ background: '#1877F2', color: 'white' }}
              >
                Create Your First Listing
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => router.push(`/listing/${listing.id}`)}
                  className="bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition border border-gray-200"
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
                      <h4 className="font-semibold text-sm line-clamp-2" style={{ color: '#1B2A4A' }}>
                        {listing.title}
                      </h4>

                      <div className="flex gap-2 mt-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {listing.category}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background:
                              listing.condition === 'Like New'
                                ? '#E0F2FE'
                                : listing.condition === 'Good'
                                ? '#DCFCE7'
                                : '#FEF3C7',
                            color:
                              listing.condition === 'Like New'
                                ? '#0369A1'
                                : listing.condition === 'Good'
                                ? '#166534'
                                : '#92400E',
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
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(listing.created_at).toLocaleDateString()}
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
