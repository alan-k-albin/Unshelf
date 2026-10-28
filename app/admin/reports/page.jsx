'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  User,
  EyeOff,
  Clock,
  Loader,
  Search,
  MessageSquare,
  Package,
  HelpCircle,
  Briefcase,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Toast, useToast } from '@/components/Toast';

export default function AdminReportsPage() {
  const [filter, setFilter] = useState('open'); // 'open' | 'actioned' | 'dismissed'
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [notes, setNotes] = useState({}); // { [reportId]: noteText }
  const { toast, showToast, hideToast } = useToast();

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_reports', {
        p_filter: filter,
      });
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      showToast(err.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filter]);

  const handleNoteChange = (id, text) => {
    setNotes((prev) => ({ ...prev, [id]: text }));
  };

  const handleHideAndResolve = async (report) => {
    setProcessingId(report.id);
    const note = notes[report.id] || '';
    try {
      // 1. Hide item (if not conversation)
      if (report.kind && report.item_id && report.kind !== 'conversation') {
        const { error: hideError } = await supabase.rpc('admin_set_hidden', {
          p_kind: report.kind,
          p_id: report.item_id,
          p_hidden: true,
        });
        if (hideError) throw hideError;
      }

      // 2. Resolve report as actioned
      const { error: resolveError } = await supabase.rpc('admin_resolve_report', {
        p_id: report.id,
        p_status: 'actioned',
        p_note: note || null,
      });
      if (resolveError) throw resolveError;

      showToast('Item hidden and report marked as actioned');
      // Refresh list
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      console.error('Error in hide + resolve:', err);
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveOnly = async (report, status) => {
    setProcessingId(report.id);
    const note = notes[report.id] || '';
    try {
      const { error } = await supabase.rpc('admin_resolve_report', {
        p_id: report.id,
        p_status: status,
        p_note: note || null,
      });
      if (error) throw error;

      showToast(status === 'dismissed' ? 'Report dismissed' : 'Report resolved');
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      console.error('Error resolving report:', err);
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const getItemLink = (kind, itemId) => {
    if (!itemId) return null;
    if (kind === 'listing') return `/listing/${itemId}`;
    if (kind === 'request') return `/request/${itemId}`;
    if (kind === 'service') return `/service/${itemId}`;
    return null;
  };

  const getKindIcon = (kind) => {
    if (kind === 'listing') return <Package className="w-3.5 h-3.5 text-[#27AE60]" />;
    if (kind === 'request') return <HelpCircle className="w-3.5 h-3.5 text-[#0284C7]" />;
    if (kind === 'service') return <Briefcase className="w-3.5 h-3.5 text-[#7C3AED]" />;
    return <MessageSquare className="w-3.5 h-3.5 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE6D6]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1B2A4A]">
            Student Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#5B5647] font-body mt-0.5">
            Review reported items, enforce community rules, and resolve disputes
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#EDE6D6] self-start sm:self-auto shadow-2xs">
          {[
            { id: 'open', label: 'Open', color: 'text-[#B23A2E]' },
            { id: 'actioned', label: 'Actioned', color: 'text-[#27AE60]' },
            { id: 'dismissed', label: 'Dismissed', color: 'text-[#5B5647]' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition ${
                filter === tab.id
                  ? 'bg-[#1B2A4A] text-white shadow-xs'
                  : 'text-[#5B5647] hover:bg-[#F3EEDC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-[#1B2A4A] mb-3" />
          <p className="text-sm font-body text-[#8A8272]">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-[#EDE6D6] p-8 shadow-xs">
          <ShieldCheck className="w-12 h-12 text-[#27AE60] mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-[#1B2A4A]">
            No {filter} reports
          </h3>
          <p className="text-xs sm:text-sm text-[#8A8272] font-body mt-1 max-w-sm mx-auto">
            {filter === 'open'
              ? 'Great news! All student reports have been reviewed and resolved.'
              : `There are currently no reports marked as ${filter}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isProcessing = processingId === report.id;
            const itemUrl = getItemLink(report.kind, report.item_id);
            const isConversation = report.kind === 'conversation';

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-[#EDE6D6] p-5 sm:p-6 shadow-xs hover:border-[#1B2A4A]/20 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Report Details */}
                  <div className="flex-1 space-y-3">
                    {/* Reason badge & date */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FEF2F2] text-[#B23A2E] border border-[#FECACA]">
                        {report.reason || 'Reported'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F8FAFC] text-[#5B5647] border border-[#E2E8F0]">
                        {getKindIcon(report.kind)}
                        <span className="capitalize">{report.kind || 'Item'}</span>
                      </span>
                      <span className="text-xs text-[#8A8272] flex items-center gap-1 font-body">
                        <Clock className="w-3.5 h-3.5" />
                        {report.created_at
                          ? new Date(report.created_at).toLocaleString()
                          : 'Recently'}
                      </span>
                    </div>

                    {/* Reported Item / Conversation */}
                    <div>
                      <div className="text-sm font-semibold text-[#1B2A4A] flex items-center gap-2">
                        <span>Reported Subject:</span>
                        {itemUrl ? (
                          <Link
                            href={itemUrl}
                            target="_blank"
                            className="text-[#1B2A4A] hover:text-[#27AE60] underline underline-offset-2 inline-flex items-center gap-1 font-display font-bold"
                          >
                            <span>{report.item_title || 'View Item'}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </Link>
                        ) : (
                          <span className="font-semibold text-[#5B5647]">
                            {isConversation ? 'Chat Conversation' : report.item_title || 'Item'}
                          </span>
                        )}
                      </div>

                      {report.description && (
                        <div className="mt-2 p-3 rounded-xl bg-[#FAF6EE] border border-[#EDE6D6] text-xs sm:text-sm text-[#1B2A4A] font-body leading-relaxed">
                          <span className="font-bold text-[#5B5647] block mb-1">
                            Reporter Comment:
                          </span>
                          "{report.description}"
                        </div>
                      )}
                    </div>

                    {/* Reporter & Owner Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-body pt-1">
                      <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#EDE6D6]">
                        <span className="text-[#8A8272] block text-[11px] font-medium">
                          Reported By:
                        </span>
                        <span className="font-semibold text-[#1B2A4A]">
                          {report.reporter_name || report.reporter_email || 'Student'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#EDE6D6] flex items-center justify-between">
                        <div>
                          <span className="text-[#8A8272] block text-[11px] font-medium">
                            Item Owner:
                          </span>
                          <span className="font-semibold text-[#1B2A4A]">
                            {report.owner_name || report.owner_email || 'Unknown'}
                          </span>
                        </div>

                        {/* Open user in Users tab */}
                        <Link
                          href={`/admin/users?q=${encodeURIComponent(
                            report.owner_name || report.owner_email || ''
                          )}`}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#1B2A4A] hover:bg-white border border-transparent hover:border-[#EDE6D6] transition inline-flex items-center gap-1"
                        >
                          <User className="w-3 h-3" />
                          <span>Open user</span>
                        </Link>
                      </div>
                    </div>

                    {/* Existing Admin Note (if any) */}
                    {report.admin_note && (
                      <p className="text-xs text-[#5B5647] bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                        <strong className="text-[#1B2A4A]">Admin Note:</strong> {report.admin_note}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Actions (for Open reports) */}
                  {filter === 'open' && (
                    <div className="w-full lg:w-72 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-5 border-[#EDE6D6] flex flex-col justify-between space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1B2A4A] mb-1.5 font-body">
                          Admin Resolution Note:
                        </label>
                        <input
                          type="text"
                          value={notes[report.id] || ''}
                          onChange={(e) => handleNoteChange(report.id, e.target.value)}
                          placeholder="Optional note for resolution..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#EDE6D6] bg-white focus:outline-none focus:border-[#1B2A4A] font-body"
                        />
                      </div>

                      <div className="space-y-2 pt-1">
                        {!isConversation && (
                          <button
                            onClick={() => handleHideAndResolve(report)}
                            disabled={isProcessing}
                            className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#B23A2E] hover:bg-[#8F2D23] transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                            <span>Hide item + resolve</span>
                          </button>
                        )}

                        {isConversation && (
                          <button
                            onClick={() => handleResolveOnly(report, 'actioned')}
                            disabled={isProcessing}
                            className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#27AE60] hover:bg-[#1F9550] transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Resolve Conversation</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleResolveOnly(report, 'dismissed')}
                          disabled={isProcessing}
                          className="w-full min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold text-[#5B5647] bg-white border border-[#EDE6D6] hover:bg-[#F3EEDC] transition flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Dismiss</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
