import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Shield,
  Layers,
  Sparkles,
  Users,
  Compass,
  FileCheck,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  UserCheck
} from 'lucide-react';

export const AdminWorkspace = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Quote Generation Modal
  const [quoteModalRequest, setQuoteModalRequest] = useState(null);
  const [quoteScope, setQuoteScope] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('');
  const [quoteDeliverables, setQuoteDeliverables] = useState('');
  const [quoteExclusions, setQuoteExclusions] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);

  // Milestone Modal
  const [milestoneModalReq, setMilestoneModalReq] = useState(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [savingMilestone, setSavingMilestone] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, queueRes, logsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminServiceQueue({ status: selectedStatus }),
        api.getAdminAuditLogs()
      ]);
      setStats(statsRes.stats);
      setRequests(queueRes.requests || []);
      setAuditLogs(logsRes.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [selectedStatus]);

  const handleOpenQuoteModal = (req) => {
    setQuoteModalRequest(req);
    setQuoteScope(req.quote?.scope || `Custom delivery package for ${req.service_type}`);
    setQuotePrice(req.quote?.price || '');
    setQuoteTimeline(req.quote?.timeline || 'Execution as per agreed client dates');
    setQuoteDeliverables(req.quote?.deliverables?.join('\n') || 'Dedicated on-site lead\nDeliverables review & reporting\nQuality assurance signoff');
    setQuoteExclusions(req.quote?.exclusions || 'External venue security charges; unapproved travel outside standard scope');
  };

  const handleSendQuote = async (e) => {
    e.preventDefault();
    if (!quoteModalRequest || !quotePrice) return;

    setSendingQuote(true);
    try {
      await api.createServiceQuote(quoteModalRequest.id, {
        scope: quoteScope,
        price: quotePrice,
        timeline: quoteTimeline,
        deliverables: quoteDeliverables.split('\n').filter(d => d.trim()),
        exclusions: quoteExclusions
      });
      await fetchAdminData();
      setQuoteModalRequest(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingQuote(false);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneModalReq || !milestoneTitle) return;

    setSavingMilestone(true);
    try {
      await api.addServiceMilestone(milestoneModalReq.id, {
        title: milestoneTitle,
        description: milestoneDesc,
        due_date: milestoneDueDate
      });
      await fetchAdminData();
      setMilestoneModalReq(null);
      setMilestoneTitle('');
      setMilestoneDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleStatusChange = async (reqId, newStatus) => {
    try {
      await api.updateServiceRequestStatus(reqId, { status: newStatus });
      await fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="border-b border-[#2E2E2E] pb-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#D8FF45] font-semibold">
          Platform Operations
        </span>
        <h1 className="text-3xl font-semibold text-white tracking-tight mt-1">
          Administration & Services Management
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1">
          Review incoming turnkey service briefs, generate quotations, track milestone progress, and inspect system audit records.
        </p>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#242424] p-4 rounded-xl border border-[#333333]">
            <span className="text-[10px] text-[#71717A] uppercase font-mono block">Total Accounts</span>
            <span className="text-xl font-semibold text-white font-mono">{stats.total_users}</span>
          </div>
          <div className="bg-[#242424] p-4 rounded-xl border border-[#333333]">
            <span className="text-[10px] text-[#71717A] uppercase font-mono block">Opportunities</span>
            <span className="text-xl font-semibold text-[#D8FF45] font-mono">{stats.total_opportunities}</span>
          </div>
          <div className="bg-[#242424] p-4 rounded-xl border border-[#333333]">
            <span className="text-[10px] text-[#71717A] uppercase font-mono block">Sealed Proposals</span>
            <span className="text-xl font-semibold text-white font-mono">{stats.total_proposals}</span>
          </div>
          <div className="bg-[#242424] p-4 rounded-xl border border-[#333333]">
            <span className="text-[10px] text-[#71717A] uppercase font-mono block">Turnkey Requests</span>
            <span className="text-xl font-semibold text-[#D8FF45] font-mono">{stats.total_service_requests}</span>
          </div>
          <div className="bg-[#242424] p-4 rounded-xl border border-[#333333]">
            <span className="text-[10px] text-[#71717A] uppercase font-mono block">Suppliers</span>
            <span className="text-xl font-semibold text-[#4ADE80] font-mono">{stats.total_vendors}</span>
          </div>
        </div>
      )}

      {/* Service Request Queue */}
      <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Turnkey Service Queue ({requests.length})
            </h2>
            <p className="text-xs text-[#A1A1AA]">Paid Promotion, Video Production, and On-Site Event Execution requests</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs border border-[#383838] rounded-lg px-3 py-2 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none"
            >
              <option value="all">All Request Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="quote_sent">Quote Sent</option>
              <option value="accepted">Accepted / Confirmed</option>
              <option value="scheduled">Scheduled / In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#71717A] font-mono">
              No service requests match the selected status.
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="p-5 rounded-xl border border-[#333333] bg-[#1D1D1D] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#D8FF45]">
                      {req.service_type}
                    </span>
                    <h3 className="font-semibold text-sm text-white">
                      Customer: {req.customer_name} ({req.customer_email})
                    </h3>
                    <div className="text-xs text-[#71717A] font-mono mt-0.5">
                      Dates: {req.preferred_dates || 'Flexible'} • Location: {req.location || 'Delhi NCR'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={req.status}
                      onChange={(e) => handleStatusChange(req.id, e.target.value)}
                      className="text-xs font-mono font-medium px-3 py-1.5 rounded-lg border border-[#383838] bg-[#1A1A1A] text-white focus:border-[#D8FF45]"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="more_info_needed">More Info Needed</option>
                      <option value="quote_sent">Quote Sent</option>
                      <option value="accepted">Accepted / Confirmed</option>
                      <option value="scheduled">Scheduled / In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                </div>

                {/* Brief */}
                <div className="text-xs text-[#D4D4D8] bg-[#181818] p-3.5 rounded-lg border border-[#2E2E2E]">
                  <span className="font-medium text-white block mb-1">Customer Brief:</span>
                  <p className="leading-relaxed">{req.brief_details}</p>
                  {req.assets_link && (
                    <div className="mt-2 text-[#D8FF45] text-[11px] font-mono">
                      <a href={req.assets_link} target="_blank" rel="noreferrer" className="underline">
                        Customer Assets Link
                      </a>
                    </div>
                  )}
                </div>

                {/* Quote details if prepared */}
                {req.quote && (
                  <div className="p-3.5 rounded-lg bg-[#242219] border border-[#52451C] text-xs text-[#EAB308] space-y-1">
                    <div className="flex justify-between font-mono font-medium">
                      <span>Issued Quote: ₹{req.quote.price.toLocaleString()}</span>
                      <span className="uppercase text-[10px]">{req.quote.status}</span>
                    </div>
                    <p className="text-[11px] text-[#D4D4D8]">{req.quote.scope}</p>
                  </div>
                )}

                {/* Milestones count */}
                {req.milestones && req.milestones.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-[#A1A1AA] font-mono">
                    <Layers className="w-4 h-4 text-[#71717A]" />
                    <span>
                      Milestones ({req.milestones.length}): {req.milestones.filter(m => m.status === 'completed').length} completed
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#2E2E2E]">
                  <button
                    onClick={() => handleOpenQuoteModal(req)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-[#121212]" />
                    <span>{req.quote ? 'Update / Resend Quote' : 'Prepare Official Quote'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setMilestoneModalReq(req);
                      setMilestoneTitle('');
                      setMilestoneDesc('');
                      setMilestoneDueDate('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#2E2E2E] hover:bg-[#383838] text-white border border-[#3E3E3E] font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D8FF45]" />
                    <span>Add Milestone</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-semibold text-white">System Audit Trail</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {auditLogs.map(log => (
            <div key={log.id} className="p-2.5 rounded-lg bg-[#1D1D1D] border border-[#2E2E2E] text-xs flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{log.action}</span>
                <span className="text-[#A1A1AA]">by {log.actor_name}</span>
              </div>
              <span className="text-[10px] text-[#71717A]">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quote Generation Modal */}
      {quoteModalRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
              <h3 className="text-base font-semibold text-white">
                Official Quotation for {quoteModalRequest.service_type}
              </h3>
              <button onClick={() => setQuoteModalRequest(null)} className="text-[#71717A] hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSendQuote} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Total Quoted Fee (INR ₹) *</label>
                <input
                  type="number"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  placeholder="e.g. 48000"
                  required
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Scope Description *</label>
                <textarea
                  rows={3}
                  value={quoteScope}
                  onChange={(e) => setQuoteScope(e.target.value)}
                  required
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Itemized Deliverables (one per line)
                </label>
                <textarea
                  rows={4}
                  value={quoteDeliverables}
                  onChange={(e) => setQuoteDeliverables(e.target.value)}
                  placeholder="e.g.&#10;4x Co-branded Reels across verified campus creator handles&#10;12x Physical posters on approved noticeboards&#10;1x Weekly campus digest highlight"
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:border-[#D8FF45] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Exclusions & Notes</label>
                <input
                  type="text"
                  value={quoteExclusions}
                  onChange={(e) => setQuoteExclusions(e.target.value)}
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setQuoteModalRequest(null)}
                  className="px-4 py-2 rounded-lg text-[#A1A1AA] hover:text-white border border-[#383838] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingQuote}
                  className="px-5 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {sendingQuote ? 'Issuing...' : 'Issue Official Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {milestoneModalReq && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
              <h3 className="text-base font-semibold text-white">Add Delivery Milestone</h3>
              <button onClick={() => setMilestoneModalReq(null)} className="text-[#71717A] hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Milestone Title *</label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="e.g. Stage Soundcheck & Generator ATS Switchover Test"
                  required
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                  placeholder="Scope of work and signoff criteria..."
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate(e.target.value)}
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setMilestoneModalReq(null)}
                  className="px-4 py-2 rounded-lg text-[#A1A1AA] hover:text-white border border-[#383838] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMilestone}
                  className="px-5 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingMilestone ? 'Adding...' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
