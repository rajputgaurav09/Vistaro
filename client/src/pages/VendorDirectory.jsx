import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Search,
  Filter,
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  Briefcase,
  ArrowRight,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Award
} from 'lucide-react';

export const VendorDirectory = ({ onSelectVendor, onNavigate }) => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Send enquiry modal state
  const [enquiryModalVendor, setEnquiryModalVendor] = useState(null);
  const [enquirySubject, setEnquirySubject] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryBudget, setEnquiryBudget] = useState('');
  const [enquiryNeededBy, setEnquiryNeededBy] = useState('');
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [sendingEnquiry, setSendingEnquiry] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedLocation !== 'all') params.location = selectedLocation;
      if (verifiedOnly) params.verified = 'true';

      const res = await api.getVendors(params);
      setVendors(res.vendors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, selectedCategory, selectedLocation, verifiedOnly]);

  const handleOpenEnquiry = (e, vendor) => {
    e.stopPropagation();
    if (!user) {
      onNavigate('login');
      return;
    }
    setEnquiryModalVendor(vendor);
    setEnquirySubject(`Service Enquiry: ${vendor.business_name}`);
    setEnquiryMessage('');
    setEnquiryBudget('');
    setEnquiryNeededBy('');
    setEnquirySuccess(false);
  };

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    if (!enquiryModalVendor) return;

    setSendingEnquiry(true);
    try {
      await api.sendVendorEnquiry(enquiryModalVendor.organisation_id, {
        subject: enquirySubject,
        message: enquiryMessage,
        budget_range: enquiryBudget,
        needed_by: enquiryNeededBy
      });
      setEnquirySuccess(true);
      setTimeout(() => {
        setEnquiryModalVendor(null);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingEnquiry(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="border-b border-[#2E2E2E] pb-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#D8FF45] font-semibold">
          Verified Directory
        </span>
        <h1 className="text-3xl font-semibold text-white tracking-tight mt-1">
          Supplier & Contractor Directory
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1 max-w-2xl">
          Discover verified sound engineers, caterers, LED screen providers, stage fabricators, and event production specialists.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#242424] border border-[#333333] rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors by service, brand, sound arrays, or catering styles..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-[#383838] rounded-lg focus:outline-none focus:border-[#D8FF45] bg-[#1A1A1A] text-white placeholder-[#71717A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-[#383838] rounded-lg px-3 py-2 bg-[#1A1A1A] text-[#D4D4D8] focus:border-[#D8FF45]"
            >
              <option value="all">All Service Categories</option>
              <option value="AV & Sound Systems">AV & Sound Systems</option>
              <option value="Stage & Lighting">Stage & Lighting</option>
              <option value="Catering & Food Services">Catering & Food Services</option>
              <option value="LED Display & Screens">LED Display & Screens</option>
              <option value="Videography & Live Streaming">Videography & Live Streaming</option>
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="text-xs border border-[#383838] rounded-lg px-3 py-2 bg-[#1A1A1A] text-[#D4D4D8] focus:border-[#D8FF45]"
            >
              <option value="all">All Locations</option>
              <option value="delhi">Delhi NCR</option>
              <option value="noida">Noida</option>
              <option value="gurugram">Gurugram</option>
            </select>

            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`text-xs px-3 py-2 rounded-lg font-medium border transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                verifiedOnly
                  ? 'bg-[#1C2E21] text-[#4ADE80] border-[#28492F]'
                  : 'bg-[#1A1A1A] text-[#A1A1AA] border-[#383838] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-xs text-[#71717A] font-mono">Loading supplier database...</div>
        ) : vendors.length === 0 ? (
          <div className="col-span-full bg-[#242424] border border-[#333333] rounded-xl p-12 text-center space-y-3">
            <Filter className="w-8 h-8 text-[#52525B] mx-auto" />
            <h3 className="font-semibold text-white text-sm">No suppliers match your criteria</h3>
            <p className="text-xs text-[#A1A1AA]">Try broadening your search or resetting category filters.</p>
          </div>
        ) : (
          vendors.map(vendor => (
            <div
              key={vendor.id}
              onClick={() => onSelectVendor(vendor.id)}
              className="bg-[#242424] hover:bg-[#282828] border border-[#333333] hover:border-[#4B4B4B] rounded-xl p-6 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C2E21] text-[#4ADE80] border border-[#28492F] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#4ADE80]" />
                    {vendor.verified_status}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-mono text-[#EAB308]">
                    <Star className="w-3.5 h-3.5 fill-[#EAB308] text-[#EAB308]" />
                    <span>{vendor.rating}</span>
                  </div>
                </div>

                {/* Name & Tagline */}
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-[#D8FF45] transition-colors">
                    {vendor.business_name}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] italic mt-0.5 line-clamp-1">{vendor.tagline}</p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {vendor.service_categories?.map((cat, i) => (
                    <span key={i} className="text-[10px] bg-[#1A1A1A] border border-[#333333] text-[#A1A1AA] px-2 py-0.5 rounded font-mono">
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Description snippet */}
                <p className="text-xs text-[#A1A1AA] line-clamp-3 leading-relaxed">
                  {vendor.description}
                </p>

                {/* Capacity badge */}
                <div className="bg-[#1D1D1D] rounded-lg p-3 border border-[#333333] text-[11px] text-[#A1A1AA] space-y-1">
                  <div>
                    <strong className="text-white font-normal">Capacity:</strong> {vendor.capacity}
                  </div>
                  <div className="text-[#71717A] font-mono">
                    Service Areas: {vendor.service_areas?.join(', ')}
                  </div>
                </div>

                {/* Certifications preview */}
                {vendor.certifications && vendor.certifications.length > 0 && (
                  <div className="text-[10px] text-[#71717A] flex items-center gap-1 font-mono">
                    <Award className="w-3.5 h-3.5 text-[#D8FF45] shrink-0" />
                    <span className="truncate">{vendor.certifications[0]}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-[#2E2E2E] flex items-center justify-between gap-2">
                <button
                  onClick={(e) => handleOpenEnquiry(e, vendor)}
                  className="px-3 py-1.5 rounded-lg bg-[#2E2E2E] hover:bg-[#383838] text-white hover:text-[#D8FF45] font-medium text-xs border border-[#3E3E3E] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#D8FF45]" />
                  <span>Send Enquiry</span>
                </button>

                <button className="text-xs font-mono text-[#D8FF45] group-hover:underline flex items-center gap-1 cursor-pointer">
                  <span>Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send Enquiry Modal */}
      {enquiryModalVendor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#D8FF45]">
                  Direct Supplier Enquiry
                </span>
                <h3 className="text-base font-semibold text-white">
                  Inquire with {enquiryModalVendor.business_name}
                </h3>
              </div>
              <button
                onClick={() => setEnquiryModalVendor(null)}
                className="text-[#71717A] hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {enquirySuccess ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#1C2E21] border border-[#28492F] text-[#4ADE80] flex items-center justify-center mx-auto">
                  ✓
                </div>
                <h4 className="font-semibold text-white text-sm">Enquiry Sent Successfully</h4>
                <p className="text-xs text-[#A1A1AA]">The vendor has been notified and can respond with quotations.</p>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Subject *</label>
                  <input
                    type="text"
                    value={enquirySubject}
                    onChange={(e) => setEnquirySubject(e.target.value)}
                    required
                    className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                    Your Requirements / Event Details *
                  </label>
                  <textarea
                    rows={4}
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    placeholder="Specify dates, venue, audience size, acoustic rider, or catering preferences..."
                    required
                    className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:border-[#D8FF45] focus:outline-none placeholder-[#71717A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Approx Budget Range</label>
                    <input
                      type="text"
                      value={enquiryBudget}
                      onChange={(e) => setEnquiryBudget(e.target.value)}
                      placeholder="e.g. ₹2,50,000 - ₹3,50,000"
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Needed By Date</label>
                    <input
                      type="date"
                      value={enquiryNeededBy}
                      onChange={(e) => setEnquiryNeededBy(e.target.value)}
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#2E2E2E]">
                  <button
                    type="button"
                    onClick={() => setEnquiryModalVendor(null)}
                    className="px-4 py-2 rounded-lg text-[#A1A1AA] hover:text-white border border-[#383838] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEnquiry}
                    className="px-5 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {sendingEnquiry ? 'Sending...' : 'Send Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
