import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Store,
  Compass,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Award,
  ChevronRight,
  ExternalLink,
  Plus,
  Send,
  Building2,
  Sparkles,
  Lock
} from 'lucide-react';

export const VendorWorkspace = ({ onNavigate, onSelectOpportunity }) => {
  const { user, refreshUser } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [invitedTenders, setInvitedTenders] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals'); // 'proposals' | 'invitations' | 'enquiries' | 'profile'

  // Clarification reply state
  const [clarModalProposal, setClarModalProposal] = useState(null);
  const [clarReply, setClarReply] = useState('');
  const [sendingClar, setSendingClar] = useState(false);

  // Profile Edit State
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Portfolio Modal State
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [portTitle, setPortTitle] = useState('');
  const [portCategory, setPortCategory] = useState('');
  const [portClient, setPortClient] = useState('');
  const [portYear, setPortYear] = useState('2026');
  const [portDesc, setPortDesc] = useState('');
  const [portImage, setPortImage] = useState('');
  const [portTags, setPortTags] = useState('');
  const [savingPort, setSavingPort] = useState(false);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const [propsRes, enqRes, profRes, invitedRes] = await Promise.all([
        api.getMyProposals(),
        api.getEnquiries(),
        api.getMyVendorProfile().catch(() => ({ profile: null })),
        api.getInvitedOpportunities().catch(() => ({ opportunities: [] }))
      ]);

      setProposals(propsRes.proposals || []);
      setEnquiries(enqRes.enquiries || []);
      setInvitedTenders(invitedRes.opportunities || []);
      if (profRes.profile) {
        setProfile(profRes.profile);
        setBusinessName(profRes.profile.business_name || '');
        setTagline(profRes.profile.tagline || '');
        setDescription(profRes.profile.description || '');
        setCapacity(profRes.profile.capacity || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'vendor') {
      fetchVendorData();
    }
  }, [user]);

  const handleSendClarification = async (e) => {
    e.preventDefault();
    if (!clarModalProposal || !clarReply.trim()) return;

    setSendingClar(true);
    try {
      await api.sendClarification(clarModalProposal.id, clarReply);
      await fetchVendorData();
      setClarModalProposal(null);
      setClarReply('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingClar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateMyVendorProfile({
        business_name: businessName,
        tagline,
        description,
        capacity
      });
      await fetchVendorData();
      await refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    if (!portTitle || !portDesc) return;

    setSavingPort(true);
    try {
      await api.addPortfolioItem({
        title: portTitle,
        category: portCategory || 'Concert Rigging',
        client_name: portClient || 'University Festival',
        year: portYear,
        description: portDesc,
        images: portImage ? [portImage] : ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'],
        tags: portTags ? portTags.split(',').map(t => t.trim()) : ['Live Sound', 'Arena Stage']
      });
      await fetchVendorData();
      setPortfolioModalOpen(false);
      setPortTitle('');
      setPortDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPort(false);
    }
  };

  const pendingClarifications = proposals.filter(p => p.status === 'clarification_required');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#2E2E2E] pb-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#D8FF45] font-semibold">
            Vendor Business Workspace
          </span>
          <h1 className="text-3xl font-semibold text-white tracking-tight mt-1">
            {profile?.business_name || user?.name}
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Track submitted bids, respond to buyer clarifications, review private invitations, and update your supplier profile.
          </p>
        </div>

        <button
          onClick={() => onNavigate('opportunities')}
          className="px-5 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
        >
          <Compass className="w-4 h-4 text-[#121212]" />
          <span>Browse Matching Tenders</span>
        </button>
      </div>

      {/* Urgent Clarification Alert Banner */}
      {pendingClarifications.length > 0 && (
        <div className="bg-[#242219] border border-[#52451C] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#2E2817] text-[#EAB308] border border-[#52451C] shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-white">
                Action Required: Buyer Clarification Requested ({pendingClarifications.length})
              </h3>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                The institution reviewing your bid for <strong>"{pendingClarifications[0].opportunity?.title}"</strong> has sent a query. Respond to maintain qualification.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setClarModalProposal(pendingClarifications[0]);
              setClarReply('');
            }}
            className="px-4 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Review Query & Reply
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-[#2E2E2E] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`py-3 px-4 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'proposals'
              ? 'border-[#D8FF45] text-[#D8FF45]'
              : 'border-transparent text-[#A1A1AA] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Bid Proposals ({proposals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`py-3 px-4 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'invitations'
              ? 'border-[#D8FF45] text-[#D8FF45]'
              : 'border-transparent text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Private Invitations ({invitedTenders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`py-3 px-4 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'enquiries'
              ? 'border-[#D8FF45] text-[#D8FF45]'
              : 'border-transparent text-[#A1A1AA] hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Direct Buyer Enquiries ({enquiries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-[#D8FF45] text-[#D8FF45]'
              : 'border-transparent text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Supplier Profile & Portfolio</span>
        </button>
      </div>

      {/* TAB 1: MY PROPOSALS */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-12 text-center space-y-3">
              <Compass className="w-8 h-8 text-[#71717A] mx-auto" />
              <h3 className="font-semibold text-white text-sm">No bids submitted yet</h3>
              <p className="text-xs text-[#A1A1AA]">
                Explore active tenders and RFQs matching your equipment and services.
              </p>
              <button
                onClick={() => onNavigate('opportunities')}
                className="mt-2 px-4 py-2 rounded-lg bg-[#D8FF45] text-[#121212] text-xs font-semibold cursor-pointer"
              >
                Browse Opportunities
              </button>
            </div>
          ) : (
            proposals.map(prop => (
              <div
                key={prop.id}
                className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4 hover:border-[#4B4B4B] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                      Target Opportunity
                    </span>
                    <h3 className="text-base font-semibold text-white mt-0.5">
                      {prop.opportunity?.title || 'Procurement Opportunity'}
                    </h3>
                    <div className="text-xs text-[#A1A1AA] mt-1 flex items-center gap-2 font-mono">
                      <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>{prop.opportunity?.organisation_name}</span>
                      <span>•</span>
                      <span>Submitted {new Date(prop.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <span className={`text-xs font-mono px-3 py-1 rounded self-start sm:self-center ${
                    prop.status === 'clarification_required'
                      ? 'bg-[#2D2817] text-[#EAB308] border border-[#52451C]'
                      : prop.status === 'awarded'
                      ? 'bg-[#1C2E21] text-[#4ADE80] border border-[#28492F]'
                      : prop.status === 'shortlisted'
                      ? 'bg-[#252818] text-[#D8FF45] border border-[#444D20]'
                      : 'bg-[#1A1A1A] text-[#A1A1AA] border border-[#333333]'
                  }`}>
                    {prop.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Proposal Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                    <span className="text-[10px] text-[#71717A] uppercase font-mono block">Quoted Price</span>
                    <span className="text-base font-semibold text-white font-mono">₹{prop.quote_amount.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                    <span className="text-[10px] text-[#71717A] uppercase font-mono block">Timeline</span>
                    <span className="text-xs font-medium text-[#D4D4D8] line-clamp-1">{prop.delivery_timeline}</span>
                  </div>
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                    <span className="text-[10px] text-[#71717A] uppercase font-mono block">Readiness Meter</span>
                    <span className="text-xs font-bold text-[#D8FF45] font-mono">{prop.readiness_score || 95}% Verified</span>
                  </div>
                  <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                    <span className="text-[10px] text-[#71717A] uppercase font-mono block">Evaluation Note</span>
                    <span className="text-xs text-[#A1A1AA] italic line-clamp-1">
                      {prop.institution_notes || 'In standard review'}
                    </span>
                  </div>
                </div>

                {/* Clarification thread if active */}
                {prop.clarification_threads && prop.clarification_threads.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#242219] border border-[#52451C] text-xs space-y-2">
                    <div className="font-semibold text-white flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#EAB308]">
                        <MessageSquare className="w-4 h-4" />
                        <span>Buyer Clarification Query:</span>
                      </div>
                      <button
                        onClick={() => {
                          setClarModalProposal(prop);
                          setClarReply('');
                        }}
                        className="text-[#D8FF45] font-mono font-medium hover:underline cursor-pointer"
                      >
                        Reply Now
                      </button>
                    </div>
                    {prop.clarification_threads.map((ct, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#1A1A1A] border border-[#333333] text-[11px] text-[#D4D4D8]">
                        <strong className="text-white">{ct.sender_name}:</strong> {ct.message}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onSelectOpportunity(prop.opportunity_id)}
                    className="text-xs font-mono text-[#D8FF45] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Specifications</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: PRIVATE INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#242219] border border-[#52451C] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#2E2817] text-[#EAB308] border border-[#52451C] shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-white">
                Direct Buyer Invitations (Private Tenders)
              </h3>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                These opportunities have been issued directly to your organisation by institutions and event hosts. You have authorized access to inspect specifications and submit bids.
              </p>
            </div>
          </div>

          {invitedTenders.length === 0 ? (
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-12 text-center space-y-3">
              <Lock className="w-8 h-8 text-[#71717A] mx-auto" />
              <h3 className="font-semibold text-white text-sm">No private invitations currently</h3>
              <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                When buyers or universities invite your organization to a confidential tender, it will appear here.
              </p>
            </div>
          ) : (
            invitedTenders.map(t => {
              const deadline = new Date(t.submission_deadline);
              const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectOpportunity(t.id)}
                  className="bg-[#242424] hover:bg-[#282828] border border-[#333333] hover:border-[#4B4B4B] rounded-xl p-6 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#2D2817] text-[#EAB308] border border-[#52451C] flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Private Invitation
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C2E21] text-[#4ADE80] border border-[#28492F]">
                        Status: {t.invitation?.status || 'INVITED'}
                      </span>
                      <span className="text-[10px] font-medium text-[#A1A1AA] bg-[#1F1F1F] px-2 py-0.5 rounded border border-[#2F2F2F]">
                        {t.category}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white hover:text-[#D8FF45] transition-colors">
                      {t.title}
                    </h3>

                    <div className="text-xs text-[#A1A1AA] flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>{t.organisation_name || t.organisation?.name}</span>
                    </div>

                    <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                      {t.scope}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#2E2E2E]">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] block">
                        Budget Range
                      </span>
                      <span className="text-sm font-semibold text-white font-mono">
                        {t.is_budget_disclosed
                          ? `₹${t.budget_min.toLocaleString()} - ₹${t.budget_max.toLocaleString()}`
                          : 'Undisclosed'}
                      </span>
                      <div className="text-[11px] text-[#A1A1AA] font-mono mt-0.5">
                        Due: {deadline.toLocaleDateString()} ({daysLeft > 0 ? `${daysLeft} days left` : 'Closed'})
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOpportunity(t.id);
                      }}
                      className="px-4 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>{t.my_proposal_status ? 'Review My Bid' : 'Submit Bid'}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#121212]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: BUYER ENQUIRIES */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          {enquiries.length === 0 ? (
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-12 text-center text-xs text-[#71717A] font-mono">
              No buyer enquiries received yet.
            </div>
          ) : (
            enquiries.map(enq => (
              <div key={enq.id} className="bg-[#242424] border border-[#333333] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-white">{enq.subject}</h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1A1A1A] text-[#D8FF45] border border-[#383838]">
                    {enq.status}
                  </span>
                </div>
                <div className="text-xs text-[#A1A1AA]">From: <strong className="text-white">{enq.sender_name}</strong></div>
                <p className="text-xs text-[#D4D4D8] bg-[#1D1D1D] p-3 rounded-lg border border-[#333333]">
                  {enq.message}
                </p>
                {enq.responses && enq.responses.length > 0 && (
                  <div className="pl-4 border-l-2 border-[#D8FF45] space-y-2 pt-2">
                    {enq.responses.map((resp, i) => (
                      <div key={i} className="text-xs text-[#A1A1AA]">
                        <strong className="text-white">{resp.sender_name}:</strong> {resp.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: VENDOR PROFILE & PORTFOLIO */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-semibold text-white">Edit Company Profile</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Company / Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Brand Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Company Overview</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:border-[#D8FF45] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Operational Capacity Description</label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </form>

          {/* Portfolio Management */}
          <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Portfolio Projects & Evidence</h3>
                <p className="text-xs text-[#A1A1AA]">Showcase your past events and concert setups to university buyers.</p>
              </div>
              <button
                onClick={() => setPortfolioModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#2E2E2E] hover:bg-[#383838] text-white border border-[#3E3E3E] font-medium text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D8FF45]" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {profile?.portfolio?.map(item => (
                <div key={item.id} className="p-4 rounded-xl border border-[#333333] bg-[#1D1D1D] space-y-2">
                  <div className="flex justify-between text-xs font-medium text-white">
                    <span>{item.title}</span>
                    <span className="text-[#71717A] font-mono">{item.year}</span>
                  </div>
                  <div className="text-[11px] text-[#A1A1AA] font-mono">Client: {item.client_name}</div>
                  <p className="text-xs text-[#D4D4D8] line-clamp-2">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clarification Reply Modal */}
      {clarModalProposal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
              <h3 className="text-base font-semibold text-white">Respond to Buyer Clarification</h3>
              <button onClick={() => setClarModalProposal(null)} className="text-[#71717A] hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSendClarification} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Your Clarification Response *</label>
                <textarea
                  rows={4}
                  value={clarReply}
                  onChange={(e) => setClarReply(e.target.value)}
                  placeholder="e.g. Confirming that dual silent DG fuel for 3 full evenings is fully inclusive within our quoted line item..."
                  required
                  className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:border-[#D8FF45] focus:outline-none"
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
                  className="px-5 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {sendingClar ? 'Submitting...' : 'Send Clarification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Portfolio Modal */}
      {portfolioModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
              <h3 className="text-base font-semibold text-white">Add Portfolio Project Evidence</h3>
              <button onClick={() => setPortfolioModalOpen(false)} className="text-[#71717A] hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddPortfolio} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Project / Concert Title *</label>
                <input
                  type="text"
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  placeholder="e.g. IIT Delhi Annual Concert Sound & Stage Rigging"
                  required
                  className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Client Name</label>
                  <input
                    type="text"
                    value={portClient}
                    onChange={(e) => setPortClient(e.target.value)}
                    placeholder="e.g. Student Senate"
                    className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Year</label>
                  <input
                    type="text"
                    value={portYear}
                    onChange={(e) => setPortYear(e.target.value)}
                    placeholder="2026"
                    className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Description & Scope *</label>
                <textarea
                  rows={3}
                  value={portDesc}
                  onChange={(e) => setPortDesc(e.target.value)}
                  placeholder="Summarize equipment caliber, attendance size, and deliverables..."
                  required
                  className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Photo Image URL</label>
                <input
                  type="url"
                  value={portImage}
                  onChange={(e) => setPortImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setPortfolioModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[#A1A1AA] hover:text-white border border-[#383838] text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPort}
                  className="px-5 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingPort ? 'Saving...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
