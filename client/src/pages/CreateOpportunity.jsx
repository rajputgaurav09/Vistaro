import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  PlusCircle,
  Trash2,
  Calendar,
  Building2,
  DollarSign,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Mail,
  UserPlus
} from 'lucide-react';

export const CreateOpportunity = ({ onBack, onComplete }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('rfq');
  const [category, setCategory] = useState('AV, Sound & Stage Lighting');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [invitedEmails, setInvitedEmails] = useState('');
  const [scope, setScope] = useState('');
  const [quantities, setQuantities] = useState('');
  const [location, setLocation] = useState('New Delhi');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [isBudgetDisclosed, setIsBudgetDisclosed] = useState(true);
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [contactDetails, setContactDetails] = useState(
    user ? `${user.name} | ${user.email} | ${user.phone || ''}` : ''
  );

  const [requirements, setRequirements] = useState([
    { id: 'req-1', title: 'Minimum 3 years verifiable experience in similar capacity', mandatory: true },
    { id: 'req-2', title: 'Valid GST registration certificate', mandatory: true }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addRequirement = () => {
    setRequirements([
      ...requirements,
      { id: `req-${Date.now()}`, title: '', mandatory: false }
    ]);
  };

  const removeRequirement = (index) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index, field, value) => {
    const next = [...requirements];
    next[index][field] = value;
    setRequirements(next);
  };

  const handleSubmit = async (status = 'published') => {
    if (!title || !category || !type || !scope || !location || !submissionDeadline) {
      setError('Please fill in all mandatory fields before publishing.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const parsedInvitations = visibility === 'PRIVATE'
        ? invitedEmails.split(',').map(e => e.trim()).filter(Boolean)
        : [];

      const payload = {
        title,
        type,
        category,
        visibility,
        initial_invitations: parsedInvitations,
        scope,
        quantities,
        location,
        budget_min: Number(budgetMin) || 0,
        budget_max: Number(budgetMax) || 0,
        is_budget_disclosed: isBudgetDisclosed,
        submission_deadline: submissionDeadline,
        event_date: eventDate,
        contact_details: contactDetails,
        requirements: requirements.filter(r => r.title.trim()),
        status
      };

      const res = await api.createOpportunity(payload);

      if (onComplete) onComplete(res.opportunity.id);
    } catch (err) {
      setError(err.message || 'Failed to publish opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>
        <span className="text-xs text-[#71717A] font-mono">
          Authorised Organisation: <strong className="text-white font-normal">{user?.organisation?.name || 'Institution'}</strong>
        </span>
      </div>

      <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#2E2E2E] pb-5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#D8FF45] font-semibold">
            Procurement Listing
          </span>
          <h1 className="text-2xl font-semibold text-white tracking-tight mt-1">
            Publish Opportunity or RFP
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Configure technical specifications, timeline, budget parameters, and access permissions.
          </p>
        </div>

        {error && (
          <div className="bg-[#2D1B1B] border border-[#642B2B] text-[#F87171] p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-5">
          {/* Tender Visibility Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-2">
              Access Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('PUBLIC')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  visibility === 'PUBLIC'
                    ? 'bg-[#1F2E23] border-[#2A6538] ring-1 ring-[#4ADE80]'
                    : 'bg-[#1A1A1A] border-[#333333] hover:border-[#444444]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#4ADE80]" />
                    <span className="font-semibold text-xs text-white">PUBLIC TENDER</span>
                  </div>
                  {visibility === 'PUBLIC' && <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />}
                </div>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  Open to all verified vendors across the marketplace. Displayed in public feeds.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('PRIVATE')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  visibility === 'PRIVATE'
                    ? 'bg-[#2E2A19] border-[#665522] ring-1 ring-[#D8FF45]'
                    : 'bg-[#1A1A1A] border-[#333333] hover:border-[#444444]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#D8FF45]" />
                    <span className="font-semibold text-xs text-white">PRIVATE TENDER</span>
                  </div>
                  {visibility === 'PRIVATE' && <CheckCircle2 className="w-4 h-4 text-[#D8FF45]" />}
                </div>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  Confidential opportunity accessible strictly by invitation. Only designated vendors can view specs.
                </p>
              </button>
            </div>
          </div>

          {/* If Private Tender, show Initial Invitations input */}
          {visibility === 'PRIVATE' && (
            <div className="p-4 rounded-xl bg-[#1D1D1D] border border-[#3E3E3E] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#D8FF45]" />
                  <span>Invited Vendor Email Addresses (Comma Separated)</span>
                </label>
                <span className="text-[10px] text-[#D8FF45] font-mono">Invitation Only</span>
              </div>
              <input
                type="text"
                value={invitedEmails}
                onChange={(e) => setInvitedEmails(e.target.value)}
                placeholder="e.g. contact@apexaudio.com, orders@royalfeast.in"
                className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#141414] text-white focus:border-[#D8FF45] focus:outline-none placeholder-[#666666]"
              />
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="text-[#A1A1AA]">Quick invite registered partners:</span>
                <button
                  type="button"
                  onClick={() => {
                    const emails = invitedEmails ? invitedEmails.split(',').map(s => s.trim()) : [];
                    if (!emails.includes('contact@apexaudio.com')) {
                      setInvitedEmails([...emails, 'contact@apexaudio.com'].join(', '));
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-[#2A2A2A] border border-[#3A3A3A] text-white hover:border-[#D8FF45] transition-colors cursor-pointer"
                >
                  + Apex Audio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const emails = invitedEmails ? invitedEmails.split(',').map(s => s.trim()) : [];
                    if (!emails.includes('orders@royalfeast.in')) {
                      setInvitedEmails([...emails, 'orders@royalfeast.in'].join(', '));
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-[#2A2A2A] border border-[#3A3A3A] text-white hover:border-[#D8FF45] transition-colors cursor-pointer"
                >
                  + Royal Feast
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const emails = invitedEmails ? invitedEmails.split(',').map(s => s.trim()) : [];
                    if (!emails.includes('hello@starlightmedia.com')) {
                      setInvitedEmails([...emails, 'hello@starlightmedia.com'].join(', '));
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-[#2A2A2A] border border-[#3A3A3A] text-white hover:border-[#D8FF45] transition-colors cursor-pointer"
                >
                  + Starlight Media
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
              Opportunity Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Cultural Festival — Professional Sound, Stage Rigging & Lighting"
              className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none placeholder-[#666666]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Procurement Format *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none"
              >
                <option value="rfq">RFQ (Request for Quotation)</option>
                <option value="tender">Formal Tender</option>
                <option value="rfp">RFP (Request for Proposal)</option>
                <option value="event_requirement">Event Requirement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none"
              >
                <option value="AV, Sound & Stage Lighting">AV, Sound & Stage Lighting</option>
                <option value="Catering & Hospitality">Catering & Hospitality</option>
                <option value="LED Screens & Live Broadcasting">LED Screens & Live Broadcasting</option>
                <option value="Stage Fabrication & Venue Decor">Stage Fabrication & Venue Decor</option>
                <option value="Printing, Merchandise & ID Cards">Printing, Merchandise & ID Cards</option>
                <option value="Event Security & Crowd Logistics">Event Security & Crowd Logistics</option>
                <option value="Photography & Aftermovie Production">Photography & Aftermovie Production</option>
              </select>
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
              Scope of Work & Technical Description *
            </label>
            <textarea
              rows={4}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Describe required services, technical rider standards, acoustic requirements, or event objectives in detail..."
              className="w-full text-xs border border-[#383838] rounded-lg p-3.5 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none placeholder-[#666666]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
              Quantities & Key Deliverables
            </label>
            <input
              type="text"
              value={quantities}
              onChange={(e) => setQuantities(e.target.value)}
              placeholder="e.g. 2x 12-element line arrays, 8x dual-18 subs, 32 moving heads, 2x 125kVA DG sets"
              className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none placeholder-[#666666]"
            />
          </div>

          {/* Location & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Venue / Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New Delhi (Main Campus)"
                className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Submission Deadline *
              </label>
              <input
                type="datetime-local"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Event Execution Date
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="e.g. 2026-11-12 to 2026-11-14"
                className="w-full text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#333333] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-white">
                Indicative Budget Range (INR ₹)
              </label>
              <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBudgetDisclosed}
                  onChange={(e) => setIsBudgetDisclosed(e.target.checked)}
                  className="rounded text-[#D8FF45] focus:ring-0 bg-[#242424] border-[#383838]"
                />
                <span>Disclose budget to bidders</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="Minimum Budget (e.g. 350000)"
                className="text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#141414] text-white focus:border-[#D8FF45] focus:outline-none"
              />
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Maximum Budget (e.g. 500000)"
                className="text-xs border border-[#383838] rounded-lg px-3.5 py-2.5 bg-[#141414] text-white focus:border-[#D8FF45] focus:outline-none"
              />
            </div>
          </div>

          {/* Criteria / Requirements Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                Evaluation Criteria & Mandatory Requirements
              </label>
              <button
                type="button"
                onClick={addRequirement}
                className="text-[11px] text-[#D8FF45] hover:underline font-mono flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Requirement
              </button>
            </div>

            <div className="space-y-2">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={req.title}
                    onChange={(e) => updateRequirement(idx, 'title', e.target.value)}
                    placeholder="e.g. FSSAI License, 5 years concert rigging experience, CEA electrical clearance"
                    className="flex-1 text-xs border border-[#383838] rounded-lg px-3.5 py-2 bg-[#1A1A1A] text-white focus:border-[#D8FF45] focus:outline-none"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-[#A1A1AA] shrink-0 px-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={req.mandatory}
                      onChange={(e) => updateRequirement(idx, 'mandatory', e.target.checked)}
                      className="rounded text-[#D8FF45] focus:ring-0 bg-[#242424] border-[#383838]"
                    />
                    <span>Mandatory</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeRequirement(idx)}
                    className="p-1.5 text-[#71717A] hover:text-[#EF4444] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-[#2E2E2E] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={submitting}
            className="px-4 py-2.5 rounded-lg border border-[#383838] text-[#A1A1AA] hover:text-white hover:border-[#4B4B4B] font-medium text-xs transition-colors cursor-pointer"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-[#121212]" />
            <span>{submitting ? 'Publishing...' : 'Publish Listing'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
