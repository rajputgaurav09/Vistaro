import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Building2,
  PlusCircle,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  MessageSquare,
  Award,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Lock,
  UserPlus,
  X,
  Send
} from 'lucide-react';

export const InstitutionWorkspace = ({ onNavigate, onSelectOpportunity }) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOppId, setSelectedOppId] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Evaluation Modal
  const [evalModalProposal, setEvalModalProposal] = useState(null);
  const [techScore, setTechScore] = useState(90);
  const [priceScore, setPriceScore] = useState(90);
  const [caliberScore, setCaliberScore] = useState(95);
  const [evalNotes, setEvalNotes] = useState('');
  const [savingEval, setSavingEval] = useState(false);

  // Clarification Modal
  const [clarModalProposal, setClarModalProposal] = useState(null);
  const [clarMessage, setClarMessage] = useState('');
  const [sendingClar, setSendingClar] = useState(false);

  // Invitations Modal
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invMessage, setInvMessage] = useState('');

  const fetchInstitutionData = async () => {
    try {
      setLoading(true);
      const res = await api.getOpportunities({ status: 'all' });
      const myOpps = (res.opportunities || []).filter(o => o.organisation_id === user?.organisation_id);
      setOpportunities(myOpps);

      if (myOpps.length > 0 && !selectedOppId) {
        setSelectedOppId(myOpps[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalsForOpp = async (oppId) => {
    try {
      const res = await api.getOpportunityProposals(oppId);
      setProposals(res.proposals || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvitations = async (oppId) => {
    try {
      const res = await api.getTenderInvitations(oppId);
      setInvitations(res.invitations || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteVendor = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedOppId) return;
    setInviting(true);
    setInvMessage('');
    try {
      await api.inviteVendorToTender(selectedOppId, { vendor_email: inviteEmail });
      setInvMessage('Vendor invited successfully.');
      setInviteEmail('');
      await fetchInvitations(selectedOppId);
    } catch (err) {
      setInvMessage(err.message || 'Failed to invite vendor');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvitation = async (invId) => {
    if (!window.confirm('Are you sure you want to revoke this vendor invitation?')) return;
    try {
      await api.revokeTenderInvitation(selectedOppId, invId);
      await fetchInvitations(selectedOppId);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'institution' || user?.role === 'admin') {
      fetchInstitutionData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedOppId) {
      fetchProposalsForOpp(selectedOppId);
    }
  }, [selectedOppId]);

  const handleOpenEval = (proposal) => {
    setEvalModalProposal(proposal);
    setTechScore(proposal.evaluation?.criteria_scores?.technical_compliance || 90);
    setPriceScore(proposal.evaluation?.criteria_scores?.price_competitiveness || 90);
    setCaliberScore(proposal.evaluation?.criteria_scores?.equipment_caliber || 90);
    setEvalNotes(proposal.evaluation?.notes || '');
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!evalModalProposal) return;

    setSavingEval(true);
    try {
      await api.evaluateProposal(evalModalProposal.id, {
        criteria_scores: {
          technical_compliance: Number(techScore),
          price_competitiveness: Number(priceScore),
          equipment_caliber: Number(caliberScore)
        },
        notes: evalNotes
      });
      await fetchProposalsForOpp(selectedOppId);
      setEvalModalProposal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEval(false);
    }
  };

  const handleSendClarification = async (e) => {
    e.preventDefault();
    if (!clarModalProposal || !clarMessage.trim()) return;

    setSendingClar(true);
    try {
      await api.sendClarification(clarModalProposal.id, clarMessage);
      await fetchProposalsForOpp(selectedOppId);
      setClarModalProposal(null);
      setClarMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingClar(false);
    }
  };

  const handleAwardDecision = async (proposal, decision) => {
    try {
      await api.recordDecision(proposal.id, decision, `Decision recorded by ${user.name}`);
      await fetchProposalsForOpp(selectedOppId);
      await fetchInstitutionData();
    } catch (err) {
      console.error(err);
    }
  };

  const currentOpp = opportunities.find(o => o.id === selectedOppId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#2E2E2E] pb-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#D8FF45] font-semibold">
            Institution Procurement Workspace
          </span>
          <h1 className="text-3xl font-semibold text-white tracking-tight mt-1">
            {user?.organisation?.name || 'Institution Workspace'}
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Manage published tenders, review sealed vendor quotations, evaluate criteria, and record awards.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-opportunity')}
          className="px-5 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-[#121212]" />
          <span>Publish New Tender</span>
        </button>
      </div>

      {/* Main Grid: Listings Selector on Left, Submissions Inbox on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Published Listings */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
            Active Listings ({opportunities.length})
          </h2>

          <div className="space-y-3">
            {opportunities.length === 0 ? (
              <div className="bg-[#242424] border border-[#333333] rounded-xl p-8 text-center text-xs text-[#71717A]">
                No listings published yet.
              </div>
            ) : (
              opportunities.map(opp => {
                const isSelected = opp.id === selectedOppId;
                return (
                  <div
                    key={opp.id}
                    onClick={() => setSelectedOppId(opp.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2A2A2A] border-[#D8FF45] ring-1 ring-[#D8FF45]'
                        : 'bg-[#242424] border-[#333333] hover:border-[#4B4B4B]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1A1A1A] text-[#D4D4D8] border border-[#383838]">
                          {opp.type}
                        </span>
                        {opp.visibility === 'PRIVATE' ? (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#2D2817] text-[#EAB308] border border-[#52451C] flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Private
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1C2E21] text-[#4ADE80] border border-[#28492F]">
                            Public
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1A1A1A] text-[#A1A1AA] border border-[#333333]">
                        {opp.status}
                      </span>
                    </div>

                    <h3 className="font-medium text-xs text-white line-clamp-2 leading-snug">
                      {opp.title}
                    </h3>

                    <div className="mt-3 pt-2 border-t border-[#333333] flex items-center justify-between text-[11px] text-[#A1A1AA] font-mono">
                      <span>{opp.proposals_count || 0} Submissions</span>
                      <span className="text-[#D8FF45] flex items-center gap-0.5">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Submissions Inbox & Comparison Matrix */}
        <div className="space-y-6 lg:col-span-2">
          {currentOpp ? (
            <div className="space-y-6">
              {/* Selected Listing Summary Card */}
              <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                    Submissions Inbox
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        fetchInvitations(currentOpp.id);
                        setInvModalOpen(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#3E3E3E] hover:border-[#D8FF45] bg-[#1A1A1A] text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Lock className="w-3 h-3 text-[#D8FF45]" />
                      <span>Manage Invitations</span>
                    </button>
                    <button
                      onClick={() => onSelectOpportunity(currentOpp.id)}
                      className="text-xs text-[#A1A1AA] hover:text-white font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Public Specifications</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-white">{currentOpp.title}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                    <span className="text-[10px] text-[#71717A] block uppercase font-mono">Target Budget</span>
                    <span className="font-semibold text-white font-mono">
                      ₹{currentOpp.budget_min.toLocaleString()} - ₹{currentOpp.budget_max.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                    <span className="text-[10px] text-[#71717A] block uppercase font-mono">Submission Deadline</span>
                    <span className="font-medium text-white font-mono">
                      {new Date(currentOpp.submission_deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333] col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#71717A] block uppercase font-mono">Bids Received</span>
                    <span className="font-semibold text-[#D8FF45] font-mono">{proposals.length} Submitted</span>
                  </div>
                </div>
              </div>

              {/* Submissions Comparison Table */}
              <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                    Bid Evaluation & Criterion Scoring
                  </h3>
                  <span className="text-[11px] text-[#71717A] font-mono">Confidential to {user.organisation?.name}</span>
                </div>

                {proposals.length === 0 ? (
                  <div className="py-14 text-center text-xs text-[#71717A] font-mono">
                    No proposals submitted yet for this listing.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposals.map(prop => (
                      <div
                        key={prop.id}
                        className="p-5 rounded-xl border border-[#333333] bg-[#1D1D1D] space-y-4 hover:border-[#4B4B4B] transition-all"
                      >
                        {/* Vendor Name & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-white">{prop.vendor_name}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C2E21] text-[#4ADE80] border border-[#28492F] font-mono">
                                {prop.vendor_profile?.verified_status || 'Verified Partner'}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#71717A] font-mono">
                              Submitted {new Date(prop.submitted_at).toLocaleDateString()}
                            </span>
                          </div>

                          <span className={`text-xs font-mono px-3 py-1 rounded self-start sm:self-center ${
                            prop.status === 'awarded'
                              ? 'bg-[#1C2E21] text-[#4ADE80] border border-[#28492F]'
                              : prop.status === 'clarification_required'
                              ? 'bg-[#2D2817] text-[#EAB308] border border-[#52451C]'
                              : prop.status === 'shortlisted'
                              ? 'bg-[#252818] text-[#D8FF45] border border-[#444D20]'
                              : 'bg-[#1A1A1A] text-[#A1A1AA] border border-[#333333]'
                          }`}>
                            {prop.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        {/* Proposal Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-[#181818] p-3 rounded-lg border border-[#2E2E2E]">
                            <span className="text-[10px] text-[#71717A] uppercase font-mono block">Quoted Price</span>
                            <span className="text-base font-semibold text-white font-mono">₹{prop.quote_amount.toLocaleString()}</span>
                          </div>
                          <div className="bg-[#181818] p-3 rounded-lg border border-[#2E2E2E]">
                            <span className="text-[10px] text-[#71717A] uppercase font-mono block">Timeline</span>
                            <span className="text-xs font-medium text-[#D4D4D8] line-clamp-1">{prop.delivery_timeline}</span>
                          </div>
                          <div className="bg-[#181818] p-3 rounded-lg border border-[#2E2E2E]">
                            <span className="text-[10px] text-[#71717A] uppercase font-mono block">Readiness Meter</span>
                            <span className="text-xs font-bold text-[#D8FF45] font-mono">{prop.readiness_score || 95}% Verified</span>
                          </div>
                          <div className="bg-[#181818] p-3 rounded-lg border border-[#2E2E2E]">
                            <span className="text-[10px] text-[#71717A] uppercase font-mono block">Review Score</span>
                            <span className="text-xs font-semibold text-white font-mono">
                              {prop.evaluation ? `${prop.evaluation.total_score} / 100` : 'Not Scored Yet'}
                            </span>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="text-xs text-[#D4D4D8] bg-[#181818] p-3.5 rounded-lg border border-[#2E2E2E]">
                          <span className="font-medium text-white block mb-1">Proposed Technical Solution:</span>
                          <p className="leading-relaxed">{prop.proposal_summary}</p>
                        </div>

                        {/* Breakdown */}
                        {prop.breakdown && prop.breakdown.length > 0 && (
                          <div className="space-y-1.5 text-xs">
                            <span className="text-[#A1A1AA] text-[11px] font-mono block">Itemized Cost Breakdown:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {prop.breakdown.map((item, idx) => (
                                <div key={idx} className="p-2 rounded-lg bg-[#181818] border border-[#2E2E2E] flex justify-between text-[11px]">
                                  <span className="truncate pr-2 text-[#A1A1AA]">{item.item}</span>
                                  <span className="font-semibold text-white shrink-0 font-mono">₹{Number(item.amount).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Clarifications thread preview */}
                        {prop.clarification_threads && prop.clarification_threads.length > 0 && (
                          <div className="p-3 rounded-lg bg-[#242219] border border-[#52451C] text-xs space-y-1.5">
                            <div className="font-medium text-[#EAB308] flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Clarification Thread:</span>
                            </div>
                            {prop.clarification_threads.map((ct, idx) => (
                              <div key={idx} className="text-[11px] pl-5 text-[#D4D4D8]">
                                <strong className="text-white">{ct.sender_name}:</strong> <em>"{ct.message}"</em>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions Row */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#2E2E2E]">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEval(prop)}
                              className="px-3 py-1.5 rounded-lg bg-[#252818] text-[#D8FF45] border border-[#444D20] font-medium text-xs transition-colors cursor-pointer"
                            >
                              {prop.evaluation ? 'Edit Criterion Scores' : 'Score Proposal'}
                            </button>

                            <button
                              onClick={() => {
                                setClarModalProposal(prop);
                                setClarMessage('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#A1A1AA] hover:text-white border border-[#333333] font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#71717A]" />
                              <span>Request Clarification</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {prop.status !== 'shortlisted' && prop.status !== 'awarded' && (
                              <button
                                onClick={() => handleAwardDecision(prop, 'shortlisted')}
                                className="px-3 py-1.5 rounded-lg bg-[#2E2E2E] hover:bg-[#383838] text-white border border-[#3E3E3E] font-medium text-xs transition-colors cursor-pointer"
                              >
                                Shortlist
                              </button>
                            )}

                            {prop.status !== 'awarded' && (
                              <button
                                onClick={() => handleAwardDecision(prop, 'awarded')}
                                className="px-4 py-1.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Award className="w-3.5 h-3.5 text-[#121212]" />
                                <span>Award Contract</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-[#71717A] font-mono bg-[#242424] border border-[#333333] rounded-xl">
              Select a published listing from the left to view submissions.
            </div>
          )}
        </div>
      </div>

      {/* Criterion-Based Scoring Modal */}
      {evalModalProposal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#D8FF45]">
                  Criterion Evaluation
                </span>
                <h3 className="text-base font-semibold text-white">{evalModalProposal.vendor_name}</h3>
              </div>
              <button onClick={() => setEvalModalProposal(null)} className="text-[#71717A] hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5 font-mono text-[#D4D4D8]">
                  <span>Technical Rider Compliance:</span>
                  <span className="text-[#D8FF45] font-bold">{techScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={techScore}
                  onChange={(e) => setTechScore(e.target.value)}
                  className="w-full accent-[#D8FF45]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5 font-mono text-[#D4D4D8]">
                  <span>Price Competitiveness:</span>
                  <span className="text-[#D8FF45] font-bold">{priceScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={priceScore}
                  onChange={(e) => setPriceScore(e.target.value)}
                  className="w-full accent-[#D8FF45]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5 font-mono text-[#D4D4D8]">
                  <span>Equipment Caliber & Safety:</span>
                  <span className="text-[#D8FF45] font-bold">{caliberScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={caliberScore}
                  onChange={(e) => setCaliberScore(e.target.value)}
                  className="w-full accent-[#D8FF45]"
                />
              </div>

              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Reviewer Evaluation Notes:</label>
                <textarea
                  rows={3}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="Record committee evaluation notes..."
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:outline-none focus:border-[#D8FF45]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setEvalModalProposal(null)}
                  className="px-4 py-2 rounded-lg text-[#A1A1AA] hover:text-white border border-[#383838] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEval}
                  className="px-5 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs cursor-pointer shadow-xs"
                >
                  {savingEval ? 'Saving...' : 'Save Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {clarModalProposal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#EAB308]">
                  Formal Clarification Request
                </span>
                <h3 className="text-base font-semibold text-white">Query for {clarModalProposal.vendor_name}</h3>
              </div>
              <button onClick={() => setClarModalProposal(null)} className="text-[#71717A] hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSendClarification} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Clarification Query *
                </label>
                <textarea
                  rows={4}
                  value={clarMessage}
                  onChange={(e) => setClarMessage(e.target.value)}
                  placeholder="e.g. Please clarify if silent DG set fuel is included in your quote, or billed separately on actuals..."
                  required
                  className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:outline-none focus:border-[#D8FF45]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setClarModalProposal(null)}
                  className="px-4 py-2 rounded-lg text-[#A1A1AA] hover:text-white border border-[#383838] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingClar}
                  className="px-5 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs cursor-pointer shadow-xs"
                >
                  {sendingClar ? 'Sending...' : 'Send Clarification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invitations Management Modal */}
      {invModalOpen && currentOpp && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2E2E2E]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2E2817] text-[#EAB308] border border-[#52451C] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Manage Vendor Invitations</h3>
                  <p className="text-[11px] text-[#A1A1AA]">{currentOpp.title}</p>
                </div>
              </div>
              <button
                onClick={() => setInvModalOpen(false)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInviteVendor} className="p-4 rounded-xl bg-[#1D1D1D] border border-[#333333] space-y-3">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                Invite Supplier by Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. orders@royalfeast.in or contact@apexaudio.com"
                  required
                  className="flex-1 text-xs border border-[#383838] bg-[#141414] text-white rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#D8FF45]"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#121212]" />
                  <span>{inviting ? 'Inviting...' : 'Invite'}</span>
                </button>
              </div>

              {/* Quick Partner Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-[#71717A]">Quick add:</span>
                <button
                  type="button"
                  onClick={() => setInviteEmail('contact@apexaudio.com')}
                  className="px-2.5 py-0.5 rounded bg-[#2A2A2A] border border-[#3A3A3A] text-white hover:border-[#D8FF45] transition-colors cursor-pointer"
                >
                  Apex Audio
                </button>
                <button
                  type="button"
                  onClick={() => setInviteEmail('orders@royalfeast.in')}
                  className="px-2.5 py-0.5 rounded bg-[#2A2A2A] border border-[#3A3A3A] text-white hover:border-[#D8FF45] transition-colors cursor-pointer"
                >
                  Royal Feast
                </button>
                <button
                  type="button"
                  onClick={() => setInviteEmail('hello@starlightmedia.com')}
                  className="px-2.5 py-0.5 rounded bg-[#2A2A2A] border border-[#3A3A3A] text-white hover:border-[#D8FF45] transition-colors cursor-pointer"
                >
                  Starlight Media
                </button>
              </div>

              {invMessage && (
                <div className="text-xs font-mono text-[#D8FF45] pt-1">
                  {invMessage}
                </div>
              )}
            </form>

            {/* Existing Invitations List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                Authorized Supplier Invitations ({invitations.length})
              </h4>
              {invitations.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#71717A] bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
                  No invitations issued yet for this listing.
                </div>
              ) : (
                <div className="space-y-2">
                  {invitations.map(inv => (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-xl border border-[#333333] bg-[#1D1D1D] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
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
                        <div className="text-[11px] text-[#71717A] font-mono mt-0.5">
                          {inv.invited_email} • {new Date(inv.invited_at).toLocaleDateString()}
                        </div>
                      </div>

                      {inv.status !== 'REVOKED' && (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="px-2.5 py-1 rounded-lg border border-[#642B2B] text-[#F87171] hover:bg-[#2D1B1B] text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Revoke
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
