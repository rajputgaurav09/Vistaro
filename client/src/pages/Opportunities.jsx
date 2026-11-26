import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Building2,
  MapPin,
  Sparkles,
  ChevronRight,
  PlusCircle,
  CheckCircle2,
  Lock,
  Award
} from 'lucide-react';

export const Opportunities = ({ onSelectOpportunity, onNavigate }) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [personalized, setPersonalized] = useState(false);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedLocation !== 'all') params.location = selectedLocation;
      if (selectedVisibility !== 'all') params.visibility = selectedVisibility;
      if (personalized) params.personalized = 'true';

      const res = await api.getOpportunities(params);
      setOpportunities(res.opportunities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const catRes = await fetch('/api/v1/opportunities/meta/categories').then(r => r.json());
        setCategories(catRes.categories || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [search, selectedCategory, selectedType, selectedLocation, selectedVisibility, personalized]);

  const toggleSave = async (e, opp) => {
    e.stopPropagation();
    if (!user) {
      onNavigate('login');
      return;
    }

    try {
      if (opp.is_saved) {
        await api.unsaveOpportunity(opp.id);
        setOpportunities(opportunities.map(o => o.id === opp.id ? { ...o, is_saved: false } : o));
      } else {
        await api.saveOpportunity(opp.id);
        setOpportunities(opportunities.map(o => o.id === opp.id ? { ...o, is_saved: true } : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#2E2E2E] pb-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#D8FF45] font-semibold">
            Procurement Directory
          </span>
          <h1 className="text-3xl font-semibold text-white tracking-tight mt-1">
            Browse Sourcing Opportunities
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1 max-w-2xl">
            Explore active public tenders, sealed bids, RFQs, and event execution requirements from verified institutions.
          </p>
        </div>

        {user?.role === 'institution' && (
          <button
            onClick={() => onNavigate('create-opportunity')}
            className="px-5 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] text-xs font-semibold tracking-wide flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-[#121212]" />
            <span>Publish New Tender</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#242424] border border-[#333333] rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tender title, equipment specifications, venue, or buyer..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-[#383838] rounded-lg focus:outline-none focus:border-[#D8FF45] text-white bg-[#1A1A1A] placeholder-[#71717A]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Dropdown */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs border border-[#383838] rounded-lg px-3 py-2 bg-[#1A1A1A] text-[#D4D4D8] focus:outline-none focus:border-[#D8FF45]"
            >
              <option value="all">All Types (Tender, RFQ, RFP)</option>
              <option value="tender">Tender</option>
              <option value="rfp">RFP (Request for Proposal)</option>
              <option value="rfq">RFQ (Request for Quotation)</option>
            </select>

            {/* Location Dropdown */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="text-xs border border-[#383838] rounded-lg px-3 py-2 bg-[#1A1A1A] text-[#D4D4D8] focus:outline-none focus:border-[#D8FF45]"
            >
              <option value="all">All Locations</option>
              <option value="delhi">Delhi NCR</option>
              <option value="gurugram">Gurugram</option>
              <option value="noida">Noida</option>
            </select>

            {/* Visibility Dropdown (Public vs Private) */}
            <select
              value={selectedVisibility}
              onChange={(e) => setSelectedVisibility(e.target.value)}
              className="text-xs border border-[#383838] rounded-lg px-3 py-2 bg-[#1A1A1A] text-[#D4D4D8] focus:outline-none focus:border-[#D8FF45]"
            >
              <option value="all">All Access Levels</option>
              <option value="PUBLIC">Public Tenders</option>
              <option value="PRIVATE">Private (Invited Only)</option>
            </select>
          </div>
        </div>

        {/* Personalized Feed Toggle for Vendors */}
        {user?.role === 'vendor' && (
          <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
              <Sparkles className="w-3.5 h-3.5 text-[#D8FF45]" />
              <span>Matched to verified categories for {user.organisation?.name || 'your organisation'}</span>
            </div>
            <button
              onClick={() => setPersonalized(!personalized)}
              className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                personalized
                  ? 'bg-[#D8FF45] text-[#121212]'
                  : 'bg-[#2E2E2E] text-[#A1A1AA] hover:text-white border border-[#3A3A3A]'
              }`}
            >
              {personalized ? 'Ranked by Fit' : 'Show All'}
            </button>
          </div>
        )}
      </div>

      {/* Opportunity Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#71717A] font-mono">Loading procurement database...</div>
        ) : opportunities.length === 0 ? (
          <div className="bg-[#242424] border border-[#333333] rounded-xl p-12 text-center space-y-3">
            <Filter className="w-8 h-8 text-[#52525B] mx-auto" />
            <h3 className="font-semibold text-white text-sm">No matching opportunities found</h3>
            <p className="text-xs text-[#A1A1AA]">Adjust your search query or reset your filters.</p>
          </div>
        ) : (
          opportunities.map(opp => {
            const deadline = new Date(opp.submission_deadline);
            const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={opp.id}
                onClick={() => onSelectOpportunity(opp.id)}
                className="group bg-[#242424] hover:bg-[#282828] border border-[#333333] hover:border-[#4B4B4B] rounded-xl p-6 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Content */}
                <div className="space-y-3 flex-1">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#1A1A1A] text-[#D4D4D8] border border-[#3A3A3A]">
                      {opp.type}
                    </span>

                    {opp.visibility === 'PRIVATE' ? (
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#2D2817] text-[#EAB308] border border-[#52451C] flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Private Tender
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#1C2E21] text-[#4ADE80] border border-[#28492F]">
                        Public Tender
                      </span>
                    )}

                    <span className="text-[10px] font-medium text-[#A1A1AA] bg-[#1F1F1F] px-2 py-0.5 rounded border border-[#2F2F2F]">
                      {opp.category}
                    </span>

                    <span className="text-[11px] text-[#71717A] flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-[#71717A]" />
                      {opp.location}
                    </span>

                    {/* Direct Invitation badge */}
                    {opp.my_invitation_status && (
                      <span className="text-[10px] font-semibold text-[#D8FF45] bg-[#2E3516] border border-[#515C1E] px-2 py-0.5 rounded flex items-center gap-1">
                        <Award className="w-3 h-3 text-[#D8FF45]" />
                        Direct Invitation
                      </span>
                    )}

                    {/* Fit Reason */}
                    {opp.relevance_reason && (
                      <span className="text-[10px] font-medium text-[#D8FF45] bg-[#252818] border border-[#444D20] px-2 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {opp.relevance_reason}
                      </span>
                    )}

                    {/* Proposal status if vendor submitted */}
                    {opp.my_proposal_status && (
                      <span className="text-[10px] font-semibold text-white bg-[#2A2A2A] border border-[#444444] px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#D8FF45]" />
                        Bid: {opp.my_proposal_status.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Title & Organization */}
                  <div>
                    <h3 className="text-base font-semibold text-white group-hover:text-[#D8FF45] transition-colors">
                      {opp.title}
                    </h3>
                    <div className="text-xs text-[#A1A1AA] mt-1 flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>{opp.organisation_name}</span>
                    </div>
                  </div>

                  {/* Scope snippet */}
                  <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                    {opp.scope}
                  </p>

                  {/* Metadata counts */}
                  <div className="flex flex-wrap items-center gap-5 text-xs text-[#71717A] pt-1">
                    <span>
                      <strong className="text-[#D4D4D8] font-normal">Criteria:</strong> {opp.requirements?.length || 0} items
                    </span>
                    <span>
                      <strong className="text-[#D4D4D8] font-normal">Technical Rider:</strong> {opp.attachments?.length || 0} PDF(s)
                    </span>
                    <span>
                      <strong className="text-[#D4D4D8] font-normal">Submissions:</strong> {opp.proposals_count || 0} bids
                    </span>
                  </div>
                </div>

                {/* Right Metadata & Action */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#2E2E2E]">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#71717A] block font-mono">
                      Estimated Budget
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {opp.is_budget_disclosed
                        ? `₹${opp.budget_min.toLocaleString()} - ₹${opp.budget_max.toLocaleString()}`
                        : 'Undisclosed'}
                    </span>
                    <div className="text-[11px] text-[#A1A1AA] flex items-center md:justify-end gap-1 mt-0.5 font-mono">
                      <Clock className="w-3 h-3 text-[#71717A]" />
                      <span className={daysLeft <= 5 && daysLeft > 0 ? 'text-[#EF4444] font-medium' : ''}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Closed'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleSave(e, opp)}
                      className={`p-2 rounded-lg border transition-colors ${
                        opp.is_saved
                          ? 'bg-[#2E3516] border-[#515C1E] text-[#D8FF45]'
                          : 'bg-[#1A1A1A] border-[#383838] text-[#71717A] hover:text-white'
                      }`}
                      title={opp.is_saved ? 'Remove from saved' : 'Save opportunity'}
                    >
                      {opp.is_saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <button className="px-4 py-2 rounded-lg bg-[#2E2E2E] hover:bg-[#383838] text-white hover:text-[#D8FF45] font-medium text-xs border border-[#3E3E3E] transition-colors flex items-center gap-1 cursor-pointer">
                      <span>View Specifications</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
