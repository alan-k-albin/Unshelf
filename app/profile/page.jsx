'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Edit2, LogOut, Settings, ArrowLeft, RefreshCw, HelpCircle, BookOpen, Plus, Briefcase, Wrench, Check } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ConditionLabel from '@/components/ConditionLabel';
import { Toast, useToast } from '@/components/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'requests' | 'services'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({
    totalListings: 0,
    totalRequests: 0,
    totalServices: 0,
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
      if (!userStr) {
        router.push('/login');
        return;
      }

      const userData = JSON.parse(userStr);
      setUser(userData);

      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (dbUser) setUser((prev) => ({ ...prev, ...dbUser }));

      const [listingsRes, requestsRes, servicesRes, contactsRes] = await Promise.all([
        supabase
          .from('listings')
          .select('*')
          .eq('user_id', dbUser?.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('requests')
          .select('*')
          .eq('user_id', dbUser?.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('services')
          .select('*')
          .eq('user_id', dbUser?.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('contacts')
          .select('id')
          .eq('user_id', dbUser?.id),
      ]);

      const userListings = listingsRes.data || [];
      const userRequests = requestsRes.data || [];
      const userServices = servicesRes.data || [];
      const userContacts = contactsRes.data || [];

      setListings(userListings);
      setRequests(userRequests);
      setServices(userServices);

      setUserStats({
        totalListings: userListings.filter((l) => l.status === 'Active').length,
        totalRequests: userRequests.filter((r) => r.status === 'open').length,
        totalServices: userServices.filter((s) => s.status === 'open').length,
        totalContacts: userContacts.length,
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
      <div className="min-h-screen bg-[#FBF8F1] font-body pb-20 px-4 py-6 max-w-2xl mx-auto space-y-4">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!user) return null;

  const activeListings = listings.filter((l) => l.status === 'Active');
  const soldListings = listings.filter((l) => l.status === 'Sold');
  const openRequests = requests.filter((r) => r.status === 'open');
  const fulfilledRequests = requests.filter((r) => r.status === 'fulfilled');
  const openServices = services.filter((s) => s.status === 'open');
  const closedServices = services.filter((s) => s.status === 'closed');

  return (
    <div className="min-h-screen bg-[#FBF8F1] font-body pb-28">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="bg-[#FBF8F1]/90 backdrop-blur-md border-b border-[#EDE6D6] sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3.5 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-[#1B2A4A]" />
          </button>
          <h1 className="text-lg font-display font-bold flex-1 text-[#1B2A4A]">
            My Profile
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => router.push('/profile/settings')}
            className="p-2 hover:bg-[#F3EEDC] text-[#1B2A4A] rounded-xl transition"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xs p-6 mb-6 border border-[#EDE6D6]">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-display font-bold flex-shrink-0 bg-[#1B2A4A] shadow-xs"
            >
              {user.full_name?.charAt(0).toUpperCase() ||
                user.fullName?.charAt(0).toUpperCase() ||
                'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-display font-bold text-[#1B2A4A]">
                {user.full_name || user.fullName}
              </h2>
              <p className="text-sm text-[#8A8272] mt-0.5">
                {[user.department, user.semester].filter(Boolean).join(' • ')}
              </p>
              <p className="text-xs text-[#8A8272] mt-0.5 truncate">{user.email}</p>
            </div>
          </div>

          {/* Verification Badge */}
          {user.is_verified && (
            <div className="flex items-center gap-1.5 mb-5 pb-4 border-b border-[#EDE6D6]/60">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                <Check className="w-3 h-3" /> College Email Verified
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="text-center p-2.5 rounded-xl bg-[#FAF6EE] border border-[#EDE6D6]">
              <div className="text-xl font-display font-bold text-[#1B2A4A]">{userStats.totalListings}</div>
              <div className="text-[11px] text-[#8A8272] mt-0.5 font-medium">Listings</div>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-[#FAF6EE] border border-[#EDE6D6]">
              <div className="text-xl font-display font-bold text-[#1B2A4A]">{userStats.totalRequests}</div>
              <div className="text-[11px] text-[#8A8272] mt-0.5 font-medium">Requests</div>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-[#FAF6EE] border border-[#EDE6D6]">
              <div className="text-xl font-display font-bold text-[#1B2A4A]">{userStats.totalServices}</div>
              <div className="text-[11px] text-[#8A8272] mt-0.5 font-medium">Services</div>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-[#FAF6EE] border border-[#EDE6D6]">
              <div className="text-xl font-display font-bold text-[#1B2A4A]">{userStats.totalContacts}</div>
              <div className="text-[11px] text-[#8A8272] mt-0.5 font-medium">Contacts</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => router.push('/profile/edit')}
              className="w-full min-h-[44px] py-2.5 rounded-xl font-semibold text-white text-base flex items-center justify-center gap-2 btn-action-green transition active:scale-[0.98] shadow-xs"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full min-h-[44px] py-2.5 rounded-xl font-semibold text-sm border border-[#EDE6D6] flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex bg-[#FAF6EE] rounded-xl p-1 border border-[#EDE6D6] mb-6 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'listings'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#5B5647] hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Listings ({listings.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'requests'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#5B5647] hover:bg-white/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Requests ({requests.length})
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'services'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#5B5647] hover:bg-white/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Services ({services.length})
          </button>
        </div>

        {/* TAB 1: LISTINGS */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-[#1B2A4A]">
                Active Listings ({activeListings.length})
              </h3>
              <button
                onClick={() => router.push('/create-listing')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#EDE6D6] text-[#1B2A4A] hover:bg-[#FAF6EE] transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> + New Listing
              </button>
            </div>

            {activeListings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#EDE6D6]">
                <p className="text-[#8A8272] text-sm mb-3">No active listings currently</p>
                <button
                  onClick={() => router.push('/create-listing')}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white btn-action-green"
                >
                  Create Listing
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} router={router} />
                ))}
              </div>
            )}

            {soldListings.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-[#8A8272] mb-3 uppercase tracking-wider">
                  Sold Items ({soldListings.length})
                </h3>
                <div className="space-y-3">
                  {soldListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} router={router} sold />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATERIAL REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-[#1B2A4A]">
                Open Requests ({openRequests.length})
              </h3>
              <button
                onClick={() => router.push('/create-request')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#EDE6D6] text-[#1B2A4A] hover:bg-[#FAF6EE] transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> + New Request
              </button>
            </div>

            {openRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#EDE6D6]">
                <p className="text-[#8A8272] text-sm mb-3">No open material requests</p>
                <button
                  onClick={() => router.push('/create-request')}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white btn-action-green"
                >
                  Request Study Material
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {openRequests.map((req) => (
                  <RequestCard key={req.id} request={req} router={router} />
                ))}
              </div>
            )}

            {fulfilledRequests.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-[#8A8272] mb-3 uppercase tracking-wider">
                  Fulfilled Requests ({fulfilledRequests.length})
                </h3>
                <div className="space-y-3">
                  {fulfilledRequests.map((req) => (
                    <RequestCard key={req.id} request={req} router={router} fulfilled />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENT SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-[#1B2A4A]">
                Active Services ({openServices.length})
              </h3>
              <button
                onClick={() => router.push('/create-service')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#EDE6D6] text-[#1B2A4A] hover:bg-[#FAF6EE] transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> + New Service
              </button>
            </div>

            {openServices.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#EDE6D6]">
                <p className="text-[#8A8272] text-sm mb-3">No active services listed</p>
                <button
                  onClick={() => router.push('/create-service')}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white btn-action-green"
                >
                  Offer / Request Service
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {openServices.map((srv) => (
                  <ServiceCard key={srv.id} service={srv} router={router} />
                ))}
              </div>
            )}

            {closedServices.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-[#8A8272] mb-3 uppercase tracking-wider">
                  Closed Services ({closedServices.length})
                </h3>
                <div className="space-y-3">
                  {closedServices.map((srv) => (
                    <ServiceCard key={srv.id} service={srv} router={router} closed />
                  ))}
                </div>
              </div>
            )}
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
      className={`bg-white rounded-2xl p-4 cursor-pointer hover:shadow-sm hover:border-[#1B2A4A]/30 transition border ${
        sold ? 'border-[#EDE6D6] opacity-70' : 'border-[#EDE6D6]'
      }`}
    >
      <div className="flex gap-4">
        <div className="relative w-20 h-20 bg-[#FAF6EE] rounded-xl overflow-hidden flex-shrink-0 border border-[#EDE6D6]">
          {(listing.image_urls?.[0] || listing.image_url) && (
            <img
              src={listing.image_urls?.[0] || listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          )}
          {listing.image_urls?.length > 1 && (
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded font-medium">
              +{listing.image_urls.length - 1}
            </div>
          )}
          {sold && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SOLD</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm line-clamp-2 text-[#1B2A4A]">
            {listing.title}
          </h4>
          <div className="flex gap-2 mt-1.5 mb-2 flex-wrap items-center">
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#FAF6EE] border border-[#EDE6D6] text-[#1B2A4A] font-medium">
              {listing.category}
            </span>
            <ConditionLabel condition={listing.condition} />
            {sold && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 font-semibold">
                Sold
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              {listing.is_free ? (
                <span className="text-base font-bold text-[#27AE60]">Free</span>
              ) : (
                <span className="text-base font-bold text-[#1B2A4A]">
                  ₹{listing.price?.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-xs text-[#8A8272]">
              {new Date(listing.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request, router, fulfilled = false }) {
  return (
    <div
      onClick={() => router.push(`/request/${request.id}`)}
      className={`bg-white rounded-2xl p-4 cursor-pointer hover:shadow-sm hover:border-[#1B2A4A]/30 transition border ${
        fulfilled ? 'border-[#EDE6D6] opacity-70' : 'border-[#EDE6D6]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1B2A4A] text-white font-semibold">
            Request
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#FAF6EE] border border-[#EDE6D6] text-[#1B2A4A] font-medium">
            {request.category}
          </span>
          {fulfilled && (
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-semibold">
              ✓ Fulfilled
            </span>
          )}
        </div>
        <span className="text-xs text-[#8A8272] whitespace-nowrap">
          {new Date(request.created_at).toLocaleDateString()}
        </span>
      </div>

      <h4 className="font-semibold text-sm mb-1.5 text-[#1B2A4A]">
        {request.title}
      </h4>

      {request.description && (
        <p className="text-xs text-[#5B5647] line-clamp-1 mb-2">
          {request.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-[#8A8272] pt-2 border-t border-[#EDE6D6]/60">
        <div className="flex gap-2">
          {request.department && <span>{request.department}</span>}
          {request.semester && <span>• {request.semester}</span>}
        </div>
        <span className="text-[#1B2A4A] font-semibold">View Request →</span>
      </div>
    </div>
  );
}

function ServiceCard({ service, router, closed = false }) {
  const isOff = service.service_type === 'offering';
  return (
    <div
      onClick={() => router.push(`/service/${service.id}`)}
      className={`bg-white rounded-2xl p-4 cursor-pointer hover:shadow-sm hover:border-[#1B2A4A]/30 transition border ${
        closed ? 'border-[#EDE6D6] opacity-70' : 'border-[#EDE6D6]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              isOff
                ? 'bg-[#F0FDF4] text-[#1E7E45] border border-[#BBF7D0]'
                : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
            }`}
          >
            {isOff ? <Briefcase className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
            {isOff ? 'Offering' : 'Seeking'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#FAF6EE] border border-[#EDE6D6] text-[#1B2A4A] font-medium">
            {service.category}
          </span>
          {closed && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 font-semibold">
              Closed
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
          {service.rate || 'Negotiable'}
        </span>
      </div>

      <h4 className="font-semibold text-sm mb-1.5 text-[#1B2A4A]">
        {service.title}
      </h4>

      {service.description && (
        <p className="text-xs text-[#5B5647] line-clamp-1 mb-2">
          {service.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-[#8A8272] pt-2 border-t border-[#EDE6D6]/60">
        <div className="flex gap-2">
          {service.department && <span>{service.department}</span>}
          {service.semester && <span>• {service.semester}</span>}
        </div>
        <span className="text-[#1B2A4A] font-semibold">View Service →</span>
      </div>
    </div>
  );
}
