import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Clock,
  Building2,
  MapPin,
  Calendar,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Send,
  Download,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  DollarSign,
  ChevronRight,
  MessageSquare,
  Lock
} from 'lucide-react';

export const OpportunityDetail = ({ opportunityId, onBack, onNavigate }) => {
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'readiness' | 'submit' | 'invitations'

  // Proposal Form State
  const [quoteAmount, setQuoteAmount] = useState('');
  const [deliveryTimeline, setDeliveryTimeline] = useState('');
  const [proposalSummary, setProposalSummary] = useState('');
  const [breakdownItems, setBreakdownItems] = useState([
    { item: 'Equipment Rigging & Transport', amount: '' },
    { item: 'Certified Technical Crew & Operation', amount: '' },
    { item: 'Power Backup & Cable Distribution', amount: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  // Invitations State (for Institution)
  const [inviteVendorEmail, setInviteVendorEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState('');

  // Clarification reply state if submitted
  const [clarificationReply, setClarificationReply] = useState('');

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      const res = await api.getOpportunity(opportunityId);
      setOpportunity(res.opportunity);

      if (user?.role === 'vendor') {
        const readinessRes = await api.getReadiness(opportunityId);
        setReadiness(readinessRes.assessment);
      }
    } catch (err) {
      console.error(err);
      if (err.status === 403 || err.message?.includes('Access denied') || err.message?.includes('private tender')) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [opportunityId]);

  const toggleSave = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }
    try {
      if (opportunity.is_saved) {
        await api.unsaveOpportunity(opportunity.id);
        setOpportunity({ ...opportunity, is_saved: false });
      } else {
        await api.saveOpportunity(opportunity.id);
        setOpportunity({ ...opportunity, is_saved: true });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (reqId, newStatus) => {
    try {
      const res = await api.updateReadinessItem(opportunity.id, reqId, newStatus);
      setReadiness(res.assessment);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBreakdownChange = (index, field, value) => {
    const next = [...breakdownItems];
    next[index][field] = value;
    setBreakdownItems(next);
  };

  const addBreakdownRow = () => {
    setBreakdownItems([...breakdownItems, { item: '', amount: '' }]);
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }

    if (!quoteAmount || !deliveryTimeline || !proposalSummary) {
      setErrorMessage('Please fill in all mandatory bid submission fields.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.submitProposal(opportunity.id, {
        quote_amount: quoteAmount,
        delivery_timeline: deliveryTimeline,
        proposal_summary: proposalSummary,
        breakdown: breakdownItems.filter(b => b.item && b.amount),
        readiness_score: readiness?.overall_readiness_pct || 90
      });

      setSubmitSuccess(true);
      await fetchDetail();
      setActiveTab('overview');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendClarificationReply = async (proposalId) => {
    if (!clarificationReply.trim()) return;
    try {
      await api.sendClarification(proposalId, clarificationReply);
      setClarificationReply('');
      await fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteVendor = async (e) => {
    e.preventDefault();
    if (!inviteVendorEmail.trim()) return;
    setInviting(true);
    setInvitationMessage('');
    try {
      await api.inviteVendorToTender(opportunity.id, { vendor_email: inviteVendorEmail });
      setInvitationMessage('Vendor successfully invited to this tender.');
      setInviteVendorEmail('');
      await fetchDetail();
    } catch (err) {
      setInvitationMessage(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvitation = async (invId) => {
    if (!window.confirm('Are you sure you want to revoke this vendor invitation?')) return;
    try {
      await api.revokeTenderInvitation(opportunity.id, invId);
      await fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  if (accessDenied) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 bg-[#1F1F1F]">
        <div className="bg-[#242424] border border-[#333333] rounded-xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#2E2817] border border-[#52451C] text-[#EAB308] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-white">Private Tender — Access Restricted</h2>
          <p className="text-xs text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
            This procurement opportunity is private and strictly accessible by direct invitation. If your organisation has been invited, please ensure you are signed in with the authorized vendor account.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg bg-[#2E2E2E] hover:bg-[#383838] border border-[#3E3E3E] text-white text-xs font-medium cursor-pointer"
            >
              Back to Marketplace
            </button>
            {!user && (
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] text-xs font-semibold cursor-pointer"
              >
                Sign In to Vendor Account
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading || !opportunity) {
    return <div className="max-w-5xl mx-auto py-20 text-center text-xs text-[#71717A] font-mono bg-[#1F1F1F]">Loading opportunity specifications...</div>;
  }

  const isOwnerInstitution = user?.role === 'institution' && user?.organisation_id === opportunity.organisation_id;
  const deadline = new Date(opportunity.submission_deadline);
  const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
  const myProposal = opportunity.my_proposal;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      {/* Top Back & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwnerInstitution && (
            <button
              onClick={() => onNavigate('institution-workspace')}
              className="px-3.5 py-1.5 rounded-lg bg-[#2E2E2E] hover:bg-[#383838] border border-[#3E3E3E] text-white font-medium text-xs"
            >
              Open Submissions Inbox ({opportunity.proposals_count} bids)
            </button>
          )}

          <button
            onClick={toggleSave}
            className={`p-2 rounded-lg border transition-colors ${
              opportunity.is_saved
                ? 'bg-[#2E3516] border-[#515C1E] text-[#D8FF45]'
                : 'bg-[#1A1A1A] border-[#383838] text-[#71717A] hover:text-white'
            }`}
          >
            {opportunity.is_saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#1A1A1A] text-[#D4D4D8] border border-[#3A3A3A]">
            {opportunity.type}
          </span>
          {opportunity.visibility === 'PRIVATE' ? (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#2D2817] text-[#EAB308] border border-[#52451C] flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private Tender
            </span>
          ) : (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#1C2E21] text-[#4ADE80] border border-[#28492F]">
              Public Tender
            </span>
          )}
          <span className="text-[10px] font-medium text-[#A1A1AA] bg-[#1F1F1F] px-2.5 py-0.5 rounded border border-[#2F2F2F]">
            {opportunity.category}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#1A1A1A] text-[#A1A1AA] border border-[#333333]">
            {opportunity.status}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
          {opportunity.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-xs text-[#A1A1AA] pt-3 border-t border-[#2E2E2E]">
          <div className="flex items-center gap-1.5 font-medium">
            <Building2 className="w-4 h-4 text-[#71717A]" />
            <span className="text-white">{opportunity.organisation_name}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <MapPin className="w-4 h-4 text-[#71717A]" />
            <span>{opportunity.location}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-4 h-4 text-[#71717A]" />
            <span className={daysLeft <= 5 && daysLeft > 0 ? 'text-[#EF4444] font-medium' : ''}>
              Due: {deadline.toLocaleDateString()} ({daysLeft > 0 ? `${daysLeft} days remaining` : 'Closed'})
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <DollarSign className="w-4 h-4 text-[#71717A]" />
            <span className="font-semibold text-white">
              {opportunity.is_budget_disclosed
                ? `₹${opportunity.budget_min.toLocaleString()} - ₹${opportunity.budget_max.toLocaleString()}`
                : 'Budget Undisclosed'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center border-b border-[#2E2E2E] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#D8FF45] text-[#D8FF45]'
              : 'border-transparent text-[#A1A1AA] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Scope & Specifications</span>
        </button>

        {user?.role === 'vendor' && (
          <button
            onClick={() => setActiveTab('readiness')}
            className={`py-3 px-4 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'readiness'
                ? 'border-[#D8FF45] text-[#D8FF45]'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Tender Readiness Checklist ({readiness?.overall_readiness_pct || 0}%)</span>
          </button>
        )}

        {user?.role === 'vendor' && (
          <button
            onClick={() => setActiveTab('submit')}
            className={`py-3 px-4 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'submit'
                ? 'border-[#D8FF45] text-[#D8FF45]'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{myProposal ? 'My Bid Submission' : 'Prepare & Submit Bid'}</span>
          </button>
        )}

        {(isOwnerInstitution || user?.role === 'admin') && (
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-3 px-4 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'invitations'
                ? 'border-[#D8FF45] text-[#D8FF45]'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Invited Vendors ({opportunity.invitations?.length || 0})</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & SPECIFICATIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Private Tender Notice Banner */}
          {opportunity.visibility === 'PRIVATE' && (
            <div className="p-4 rounded-xl bg-[#242219] border border-[#52451C] flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2E2817] text-[#EAB308] flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Private Tender — Confidential Access</h4>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5 leading-relaxed">
                    This opportunity is restricted to authorized vendors invited by {opportunity.organisation_name}. Submissions and inquiries remain strictly confidential.
                  </p>
                  {opportunity.my_invitation && (
                    <div className="mt-2 text-[11px] font-medium text-[#4ADE80] bg-[#1C2E21] border border-[#28492F] px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Your organisation is an authorized invited bidder</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#2E2817] text-[#EAB308] border border-[#52451C] shrink-0">
                Private
              </span>
            </div>
          )}

          {/* Detailed Scope */}
          <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
              Detailed Scope of Work
            </h3>
            <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed whitespace-pre-line">
              {opportunity.scope}
            </p>
          </div>

          {/* Quantities & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                Quantities & Deliverables
              </h3>
              <p className="text-xs text-[#D4D4D8] leading-relaxed whitespace-pre-line">
                {opportunity.quantities || 'Standard festival rider quantities'}
              </p>
            </div>

            <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                Event Dates & Location
              </h3>
              <p className="text-xs text-[#D4D4D8]">
                <strong className="text-[#A1A1AA] font-normal">Schedule:</strong> {opportunity.event_date || 'To be aligned with organizers'}
              </p>
              <p className="text-xs text-[#D4D4D8]">
                <strong className="text-[#A1A1AA] font-normal">Venue:</strong> {opportunity.location}
              </p>
              <p className="text-xs text-[#D4D4D8]">
                <strong className="text-[#A1A1AA] font-normal">Contact:</strong> {opportunity.contact_details}
              </p>
            </div>
          </div>

          {/* Official Rider Attachments */}
          <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
              Official Rider & Attachments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {opportunity.attachments?.map((att, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[#383838] bg-[#1A1A1A] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-[#D8FF45] shrink-0" />
                    <span className="font-medium text-white truncate">{att.name}</span>
                  </div>
                  <span className="text-[10px] text-[#71717A] font-mono shrink-0">{att.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stated Requirements Summary */}
          <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
              Stated Criteria & Mandatory Requirements
            </h3>
            <div className="space-y-2">
              {opportunity.requirements?.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#D4D4D8]">
                  <span className="w-5 h-5 rounded-full bg-[#1A1A1A] border border-[#383838] text-white font-mono flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-normal">{req.title}</span>
                    {req.mandatory && (
                      <span className="ml-2 text-[10px] text-[#F87171] bg-[#2D1B1B] border border-[#642B2B] px-1.5 py-0.2 rounded font-mono">
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TENDER READINESS CHECKLIST */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#D8FF45]">
                Tender Readiness Assessment
              </span>
              <h2 className="text-xl font-semibold text-white">Requirement Readiness: {readiness?.overall_readiness_pct || 0}%</h2>
              <p className="text-xs text-[#A1A1AA]">
                Compare your business qualifications against the buyer's criteria before submitting.
              </p>
            </div>

            <div className="w-20 h-20 rounded-xl bg-[#1A1A1A] border-2 border-[#D8FF45] flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-white font-mono">{readiness?.overall_readiness_pct || 0}%</span>
            </div>
          </div>

          <div className="bg-[#242219] border border-[#52451C] rounded-xl p-4 text-xs text-[#EAB308] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Manual Verification Notice:</span> Self-reported compliance does not imply official endorsement. All documents and generator/safety certifications must be validated by the procurement review committee.
            </div>
          </div>

          <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
              Item-by-Item Compliance Verification
            </h3>

            <div className="space-y-3">
              {readiness?.checklist_items?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#333333] bg-[#1D1D1D] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-medium text-xs text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2A2A2A] text-[#A1A1AA] font-mono flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{item.title}</span>
                      {item.mandatory && (
                        <span className="text-[10px] text-[#F87171] bg-[#2D1B1B] border border-[#642B2B] px-1.5 py-0.2 rounded font-mono">
                          Mandatory
                        </span>
                      )}
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStatusChange(item.req_id, 'ready')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          item.status === 'ready'
                            ? 'bg-[#1C2E21] text-[#4ADE80] border border-[#28492F]'
                            : 'bg-[#181818] border border-[#333333] text-[#71717A] hover:text-white'
                        }`}
                      >
                        ✓ Ready
                      </button>

                      <button
                        onClick={() => handleStatusChange(item.req_id, 'needs_verification')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          item.status === 'needs_verification'
                            ? 'bg-[#2E2E2E] text-white border border-[#4B4B4B]'
                            : 'bg-[#181818] border border-[#333333] text-[#71717A] hover:text-white'
                        }`}
                      >
                        Verify
                      </button>

                      <button
                        onClick={() => handleStatusChange(item.req_id, 'missing_evidence')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          item.status === 'missing_evidence'
                            ? 'bg-[#2E2817] text-[#EAB308] border border-[#52451C]'
                            : 'bg-[#181818] border border-[#333333] text-[#71717A] hover:text-white'
                        }`}
                      >
                        Missing
                      </button>

                      <button
                        onClick={() => handleStatusChange(item.req_id, 'not_met')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          item.status === 'not_met'
                            ? 'bg-[#2D1B1B] text-[#F87171] border border-[#642B2B]'
                            : 'bg-[#181818] border border-[#333333] text-[#71717A] hover:text-white'
                        }`}
                      >
                        Not Met
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#71717A] italic pl-7">
                    {item.notes}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setActiveTab('submit')}
                className="px-5 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Proceed to Submit Proposal</span>
                <ChevronRight className="w-4 h-4 text-[#121212]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROPOSAL SUBMISSION & STATUS */}
      {activeTab === 'submit' && (
        <div className="space-y-6">
          {myProposal ? (
            <div className="space-y-6">
              <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                      Your Active Bid
                    </span>
                    <h3 className="text-lg font-semibold text-white">
                      Bid Status: {myProposal.status.replace('_', ' ').toUpperCase()}
                    </h3>
                  </div>

                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-md bg-[#1A1A1A] border border-[#3A3A3A] text-[#D8FF45]">
                    {myProposal.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                    <span className="text-[#71717A] block text-[10px] uppercase font-mono">Quoted Amount</span>
                    <span className="text-base font-semibold text-white font-mono">₹{myProposal.quote_amount.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                    <span className="text-[#71717A] block text-[10px] uppercase font-mono">Delivery Timeline</span>
                    <span className="font-medium text-white">{myProposal.delivery_timeline}</span>
                  </div>
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                    <span className="text-[#71717A] block text-[10px] uppercase font-mono">Readiness Score</span>
                    <span className="font-bold text-[#D8FF45] font-mono">{myProposal.readiness_score || 95}%</span>
                  </div>
                </div>

                <div className="text-xs text-[#D4D4D8] bg-[#1D1D1D] p-4 rounded-lg border border-[#333333] space-y-1">
                  <span className="font-medium text-white block">Proposal Summary:</span>
                  <p className="leading-relaxed">{myProposal.proposal_summary}</p>
                </div>
              </div>

              {/* Clarification Threads */}
              <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#D8FF45]" />
                  <h3 className="font-medium text-sm text-white">
                    Buyer Clarification Thread
                  </h3>
                </div>

                {myProposal.clarification_threads?.length === 0 ? (
                  <p className="text-xs text-[#71717A]">No clarification requests sent by the buyer yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myProposal.clarification_threads.map((thread, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg text-xs space-y-1 ${
                          thread.sender === 'institution'
                            ? 'bg-[#242219] border border-[#52451C] text-[#EAB308]'
                            : 'bg-[#1D1D1D] border border-[#383838] text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span>{thread.sender_name}</span>
                          <span className="text-[10px] text-[#71717A] font-mono">{new Date(thread.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="leading-relaxed">{thread.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    value={clarificationReply}
                    onChange={(e) => setClarificationReply(e.target.value)}
                    placeholder="Type official clarification response for the buyer..."
                    className="flex-1 text-xs border border-[#383838] rounded-lg px-3.5 py-2 focus:outline-none focus:border-[#D8FF45] bg-[#1A1A1A] text-white placeholder-[#71717A]"
                  />
                  <button
                    onClick={() => handleSendClarificationReply(myProposal.id)}
                    disabled={!clarificationReply.trim()}
                    className="px-4 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Proposal Submission Form */
            <form onSubmit={handleSubmitProposal} className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white">Submit Formal Proposal / Quotation</h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Your submission is strictly confidential and will only be accessible by {opportunity.organisation_name}.
                </p>
              </div>

              {/* Confidentiality Warning */}
              <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-3.5 text-xs text-[#A1A1AA] flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#D8FF45] shrink-0" />
                <span>Platform Guarantee: Competing vendors will never see your quoted prices or itemized schedules.</span>
              </div>

              {errorMessage && (
                <div className="bg-[#2D1B1B] border border-[#642B2B] text-[#F87171] p-3 rounded-lg text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Quote Amount & Delivery Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                    Total Quoted Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="e.g. 420000"
                    required
                    className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 focus:border-[#D8FF45] bg-[#1A1A1A] text-white focus:outline-none"
                  />
                  {opportunity.is_budget_disclosed && (
                    <span className="text-[10px] text-[#71717A] mt-1 block font-mono">
                      Target budget: ₹{opportunity.budget_min.toLocaleString()} - ₹{opportunity.budget_max.toLocaleString()}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                    Delivery & Setup Timeline *
                  </label>
                  <input
                    type="text"
                    value={deliveryTimeline}
                    onChange={(e) => setDeliveryTimeline(e.target.value)}
                    placeholder="e.g. Rigging starts 48 hrs prior; testing Nov 11 evening"
                    required
                    className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 focus:border-[#D8FF45] bg-[#1A1A1A] text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Proposal Summary */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Technical Proposal & Equipment Specification Summary *
                </label>
                <textarea
                  rows={4}
                  value={proposalSummary}
                  onChange={(e) => setProposalSummary(e.target.value)}
                  placeholder="Detail your equipment caliber (e.g. JBL VTX line array), certified personnel, power setup, and compliance with the buyer's rider..."
                  required
                  className="w-full text-xs border border-[#383838] rounded-lg p-3.5 focus:border-[#D8FF45] bg-[#1A1A1A] text-white focus:outline-none placeholder-[#71717A]"
                />
              </div>

              {/* Line-item breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                    Line-Item Cost Breakdown (Optional but Recommended)
                  </label>
                  <button
                    type="button"
                    onClick={addBreakdownRow}
                    className="text-[11px] text-[#D8FF45] hover:underline font-mono cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {breakdownItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => handleBreakdownChange(idx, 'item', e.target.value)}
                        placeholder="Deliverable description"
                        className="flex-1 text-xs border border-[#383838] rounded-lg px-3 py-2 bg-[#1A1A1A] text-white"
                      />
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleBreakdownChange(idx, 'amount', e.target.value)}
                        placeholder="Amount (₹)"
                        className="w-36 text-xs border border-[#383838] rounded-lg px-3 py-2 bg-[#1A1A1A] text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#2E2E2E] flex items-center justify-between">
                <span className="text-xs text-[#71717A]">
                  Readiness Score attached: <strong className="text-white font-mono">{readiness?.overall_readiness_pct || 90}%</strong>
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#121212]" />
                  <span>{submitting ? 'Submitting Bid...' : 'Submit Confidential Proposal'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: INVITATIONS MANAGEMENT (FOR BUYER / ADMIN) */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Private Tender Vendor Invitations
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Manage authorised vendor invitations for this tender. Only invited suppliers can access specifications, review riders, and submit bids.
              </p>
            </div>

            {/* Invite Vendor Form */}
            <form onSubmit={handleInviteVendor} className="p-4 rounded-xl bg-[#1D1D1D] border border-[#383838] space-y-3">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                Invite Additional Vendor (Email Address)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteVendorEmail}
                  onChange={(e) => setInviteVendorEmail(e.target.value)}
                  placeholder="e.g. contact@apexaudio.com or orders@royalfeast.in"
                  required
                  className="flex-1 text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#141414] text-white focus:outline-none focus:border-[#D8FF45]"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#121212]" />
                  <span>{inviting ? 'Inviting...' : 'Send Invitation'}</span>
                </button>
              </div>
              {invitationMessage && (
                <div className="text-xs font-medium text-[#D8FF45] pt-1 font-mono">
                  {invitationMessage}
                </div>
              )}
            </form>

            {/* Invitations List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                Active & Past Invitations ({opportunity.invitations?.length || 0})
              </h4>
              {(!opportunity.invitations || opportunity.invitations.length === 0) ? (
                <div className="py-8 text-center text-xs text-[#71717A] bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
                  No vendor invitations issued yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {opportunity.invitations.map(inv => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-xl border border-[#333333] bg-[#1D1D1D] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">
                            {inv.vendor_organisation?.name || inv.invited_email}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            inv.status === 'REVOKED'
                              ? 'bg-[#2D1B1B] text-[#F87171] border border-[#642B2B]'
                              : 'bg-[#1C2E21] text-[#4ADE80] border border-[#28492F]'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#71717A] font-mono">
                          Email: {inv.invited_email} • Invited: {new Date(inv.invited_at).toLocaleDateString()}
                          {inv.notes && ` • Notes: ${inv.notes}`}
                        </div>
                      </div>

                      {inv.status !== 'REVOKED' && (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#642B2B] text-[#F87171] hover:bg-[#2D1B1B] text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          Revoke Invitation
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
