'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Package,
  HelpCircle,
  Briefcase,
  Search,
  EyeOff,
  Eye,
  ExternalLink,
  Loader,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Toast, useToast } from '@/components/Toast';

const CONTENT_TABS = [
  { id: 'listing', label: 'Listings', icon: Package },
  { id: 'request', label: 'Requests', icon: HelpCircle },
  { id: 'service', label: 'Services', icon: Briefcase },
];

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState('listing'); // 'listing' | 'request' | 'service'
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const loadContent = async (isManual = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_content', {
        p_kind: activeTab,
        p_search: search.trim() || '',
      });
      if (error) throw error;
      setItems(data || []);
      if (isManual) showToast('Content list refreshed');
    } catch (err) {
      console.error('Error fetching admin content:', err);
      showToast(err.message || 'Failed to load content', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadContent();
  };

  const handleToggleHidden = async (item) => {
    setProcessingId(item.id);
    const newHiddenState = !item.is_hidden;
    try {
      const { error } = await supabase.rpc('admin_set_hidden', {
        p_kind: activeTab,
        p_id: item.id,
        p_hidden: newHiddenState,
      });
      if (error) throw error;

      showToast(newHiddenState ? 'Item is now hidden from public feeds' : 'Item restored to public feeds');
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_hidden: newHiddenState } : i))
      );
    } catch (err) {
      console.error('Error toggling hidden state:', err);
      showToast(err.message || 'Failed to update visibility', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const getItemLink = (kind, id) => {
    if (kind === 'listing') return `/listing/${id}`;
    if (kind === 'request') return `/request/${id}`;
    if (kind === 'service') return `/service/${id}`;
    return null;
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE6D6]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1B2A4A]">
            Campus Content
          </h1>
          <p className="text-xs sm:text-sm text-[#5B5647] font-body mt-0.5">
            Search, moderate, and toggle visibility across all posts on SJCET Unshelf
          </p>
        </div>

        <button
          onClick={() => loadContent(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#EDE6D6] hover:bg-[#F3EEDC] text-[#1B2A4A] transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Controls: Tabs & Search Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#EDE6D6] self-start shadow-2xs">
          {CONTENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch('');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold font-body transition ${
                  isActive
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#5B5647] hover:bg-[#F3EEDC]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A8272] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}s by title, subject, user...`}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border border-[#EDE6D6] bg-white text-[#1B2A4A] placeholder-[#8A8272] focus:outline-none focus:border-[#1B2A4A] font-body"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#1B2A4A] hover:bg-[#15213b] transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-[#1B2A4A] mb-3" />
          <p className="text-sm font-body text-[#8A8272]">Loading {activeTab}s...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-[#EDE6D6] p-8 shadow-xs">
          <AlertCircle className="w-12 h-12 text-[#8A8272] mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-[#1B2A4A]">No {activeTab}s found</h3>
          <p className="text-xs sm:text-sm text-[#8A8272] font-body mt-1">
            {search ? `No items matched "${search}".` : `No ${activeTab} items posted yet.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EDE6D6] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm font-body">
              <thead className="bg-[#FAF6EE] border-b border-[#EDE6D6] text-[#1B2A4A] font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE6D6]">
                {items.map((item) => {
                  const isProcessing = processingId === item.id;
                  const itemUrl = getItemLink(activeTab, item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#FBF8F1]/60 transition ${
                        item.is_hidden ? 'bg-red-50/40' : ''
                      }`}
                    >
                      {/* Title & Link */}
                      <td className="py-3.5 px-4 align-top max-w-xs sm:max-w-sm">
                        <Link
                          href={itemUrl || '#'}
                          target="_blank"
                          className="font-display font-bold text-sm text-[#1B2A4A] hover:text-[#27AE60] inline-flex items-center gap-1 transition"
                        >
                          <span>{item.title || 'Untitled'}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#8A8272]" />
                        </Link>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4 align-top">
                        <Link
                          href={`/admin/users?q=${encodeURIComponent(
                            item.owner_name || ''
                          )}`}
                          className="font-semibold text-[#1B2A4A] hover:underline flex items-center gap-1"
                        >
                          <User className="w-3 h-3 text-[#8A8272]" />
                          <span>{item.owner_name || 'Student'}</span>
                        </Link>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs text-[#8A8272]">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : 'Recently'}
                      </td>

                      {/* Visibility Status */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {item.is_hidden ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#B23A2E] border border-[#FECACA]">
                            <EyeOff className="w-3 h-3" />
                            Hidden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#27AE60] border border-[#BBF7D0]">
                            <Eye className="w-3 h-3" />
                            Visible
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          onClick={() => handleToggleHidden(item)}
                          disabled={isProcessing}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${
                            item.is_hidden
                              ? 'bg-[#27AE60] hover:bg-[#1F9550] text-white shadow-2xs'
                              : 'bg-white hover:bg-[#FEF2F2] text-[#B23A2E] border border-[#FECACA]'
                          }`}
                        >
                          {isProcessing ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : item.is_hidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hide</span>
                            </>
                          )}
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
    </div>
  );
}
