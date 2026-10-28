'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Loader,
  SlidersHorizontal,
  Mail,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { Toast, useToast } from '@/components/Toast';

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [search, setSearch] = useState(initialQuery);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  // Restriction state for currently open panel
  const [formRestrictions, setFormRestrictions] = useState({
    can_sell: true,
    can_request_material: true,
    can_offer_service: true,
    can_request_service: true,
    can_chat: true,
    is_banned: false,
  });

  const { toast, showToast, hideToast } = useToast();

  const loadUsers = async (searchQuery = search) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_users', {
        p_search: searchQuery.trim() || '',
      });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      showToast(err.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setSearch(initialQuery);
      loadUsers(initialQuery);
    } else {
      loadUsers('');
    }
  }, [initialQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(search);
  };

  const handleOpenPanel = (user) => {
    setSelectedUser(user);
    setFormRestrictions({
      can_sell: user.can_sell ?? true,
      can_request_material: user.can_request_material ?? true,
      can_offer_service: user.can_offer_service ?? true,
      can_request_service: user.can_request_service ?? true,
      can_chat: user.can_chat ?? true,
      is_banned: user.is_banned ?? false,
    });
    setShowSuspendConfirm(false);
  };

  const handleToggle = (key) => {
    if (key === 'is_banned') {
      const willBeBanned = !formRestrictions.is_banned;
      if (willBeBanned) {
        setShowSuspendConfirm(true);
      } else {
        setFormRestrictions((prev) => ({ ...prev, is_banned: false }));
      }
      return;
    }

    setFormRestrictions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirmSuspend = () => {
    setFormRestrictions((prev) => ({ ...prev, is_banned: true }));
    setShowSuspendConfirm(false);
  };

  const handleSaveRestrictions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_set_restrictions', {
        p_user: selectedUser.id,
        p_banned: formRestrictions.is_banned,
        p_can_sell: formRestrictions.can_sell,
        p_can_request_material: formRestrictions.can_request_material,
        p_can_offer_service: formRestrictions.can_offer_service,
        p_can_request_service: formRestrictions.can_request_service,
        p_can_chat: formRestrictions.can_chat,
      });

      if (error) throw error;

      showToast(`Permissions updated for ${selectedUser.full_name || 'user'}`);

      // Update in local users state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, ...formRestrictions } : u
        )
      );

      setSelectedUser(null);
    } catch (err) {
      console.error('Error saving restrictions:', err);
      showToast(err.message || 'Failed to update restrictions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isUserRestricted = (u) => {
    return (
      u.is_banned === true ||
      u.can_sell === false ||
      u.can_request_material === false ||
      u.can_offer_service === false ||
      u.can_request_service === false ||
      u.can_chat === false
    );
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE6D6]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1B2A4A]">
            User Moderation
          </h1>
          <p className="text-xs sm:text-sm text-[#5B5647] font-body mt-0.5">
            Manage permissions, restrictions, and account status across SJCET student profiles
          </p>
        </div>

        <button
          onClick={() => loadUsers(search)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#EDE6D6] hover:bg-[#F3EEDC] text-[#1B2A4A] transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="max-w-md flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8A8272] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, department..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs sm:text-sm border border-[#EDE6D6] bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] font-body shadow-2xs"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#1B2A4A] hover:bg-[#15213b] transition"
        >
          Search
        </button>
      </form>

      {/* User Table */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-[#1B2A4A] mb-3" />
          <p className="text-sm font-body text-[#8A8272]">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-[#EDE6D6] p-8 shadow-xs">
          <Users className="w-12 h-12 text-[#8A8272] mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-[#1B2A4A]">No users found</h3>
          <p className="text-xs sm:text-sm text-[#8A8272] font-body mt-1">
            {search ? `No user matched "${search}".` : 'No users currently registered.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EDE6D6] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm font-body">
              <thead className="bg-[#FAF6EE] border-b border-[#EDE6D6] text-[#1B2A4A] font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">College Info</th>
                  <th className="py-3 px-4">Status & Permissions</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE6D6]">
                {users.map((u) => {
                  const restricted = isUserRestricted(u);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-[#FBF8F1]/70 transition ${
                        u.is_banned ? 'bg-red-50/50' : restricted ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-display font-bold text-sm text-[#1B2A4A]">
                          {u.full_name || 'Unnamed Student'}
                        </div>
                        <div className="text-xs text-[#8A8272] flex items-center gap-1 mt-0.5 font-body">
                          <Mail className="w-3 h-3" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Department / Semester */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-[#1B2A4A]">
                          <GraduationCap className="w-3.5 h-3.5 text-[#5B5647]" />
                          <span>{u.department || 'Not set'}</span>
                        </div>
                        <div className="text-xs text-[#8A8272] mt-0.5">
                          {u.semester || 'Semester not set'}
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {u.is_banned ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#B23A2E] border border-[#FECACA] flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              Suspended
                            </span>
                          ) : restricted ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              Restricted
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#27AE60] border border-[#BBF7D0] flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Active
                            </span>
                          )}

                          {u.is_verified && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Verified Email
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenPanel(u)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#1B2A4A] bg-white border border-[#EDE6D6] hover:bg-[#F3EEDC] transition inline-flex items-center gap-1.5 active:scale-95 shadow-2xs"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#8A8272]" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Slide-over / Modal Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FBF8F1] w-full max-w-lg rounded-2xl border border-[#EDE6D6] shadow-xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            {/* Panel Header */}
            <div className="px-6 py-4 bg-white border-b border-[#EDE6D6] flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-[#1B2A4A]">
                  Manage User Permissions
                </h3>
                <p className="text-xs text-[#8A8272] font-body">
                  {selectedUser.full_name || 'Student'} • {selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-xl text-[#8A8272] hover:bg-[#F3EEDC] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Body: Toggles */}
            <div className="p-6 overflow-y-auto space-y-4 font-body">
              {/* Suspend Account Alert Switch */}
              <div
                className={`p-4 rounded-xl border transition ${
                  formRestrictions.is_banned
                    ? 'bg-[#FEF2F2] border-[#FECACA]'
                    : 'bg-white border-[#EDE6D6]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display font-bold text-sm text-[#B23A2E] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Suspend Account
                    </span>
                    <p className="text-xs text-[#5B5647] mt-0.5">
                      Block student from posting, requesting, chatting, and engaging on Unshelf
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formRestrictions.is_banned}
                      onChange={() => handleToggle('is_banned')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B23A2E]"></div>
                  </label>
                </div>
              </div>

              {/* Granular Feature Toggles */}
              <div className="bg-white rounded-xl border border-[#EDE6D6] divide-y divide-[#EDE6D6]">
                {/* 1. Can Sell */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-[#1B2A4A]">Can sell items</p>
                    <p className="text-[11px] text-[#8A8272]">
                      Allows publishing new textbook and material listings
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('can_sell')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      formRestrictions.can_sell ? 'bg-[#27AE60]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        formRestrictions.can_sell ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Can Request Material */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-[#1B2A4A]">
                      Can request material
                    </p>
                    <p className="text-[11px] text-[#8A8272]">
                      Allows posting campus textbook / note requests
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('can_request_material')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      formRestrictions.can_request_material ? 'bg-[#27AE60]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        formRestrictions.can_request_material ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Can Offer Services */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-[#1B2A4A]">
                      Can offer services
                    </p>
                    <p className="text-[11px] text-[#8A8272]">
                      Allows advertising tutoring, lab help, and student skills
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('can_offer_service')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      formRestrictions.can_offer_service ? 'bg-[#27AE60]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        formRestrictions.can_offer_service ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Can Request Services */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-[#1B2A4A]">
                      Can request services
                    </p>
                    <p className="text-[11px] text-[#8A8272]">
                      Allows requesting academic help or tutoring from peers
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('can_request_service')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      formRestrictions.can_request_service ? 'bg-[#27AE60]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        formRestrictions.can_request_service ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Can Chat */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-[#1B2A4A]">Can use chat</p>
                    <p className="text-[11px] text-[#8A8272]">
                      Allows direct messaging and contacting other campus students
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('can_chat')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      formRestrictions.can_chat ? 'bg-[#27AE60]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        formRestrictions.can_chat ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 bg-white border-t border-[#EDE6D6] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-xl border border-[#EDE6D6] text-xs sm:text-sm font-semibold text-[#5B5647] hover:bg-[#F3EEDC] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRestrictions}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#27AE60] hover:bg-[#1F9550] transition inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Permissions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Suspension Confirmation Dialog */}
      {showSuspendConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-red-200 p-6 max-w-sm w-full shadow-xl animate-fade-in font-body">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 text-[#B23A2E]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-center text-[#1B2A4A] mb-1.5">
              Confirm Account Suspension
            </h3>
            <p className="text-xs sm:text-sm text-[#5B5647] text-center mb-5 leading-relaxed">
              Are you sure you want to suspend this account? The student will immediately lose ability
              to create listings, request items, offer services, or chat on Unshelf.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSuspendConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#EDE6D6] text-xs font-semibold text-[#5B5647] hover:bg-[#F3EEDC] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                className="flex-1 py-2.5 rounded-xl bg-[#B23A2E] hover:bg-[#8F2D23] text-white text-xs font-semibold transition shadow-xs"
              >
                Yes, Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-[#1B2A4A] mb-3" />
          <p className="text-sm font-body text-[#8A8272]">Loading users...</p>
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
