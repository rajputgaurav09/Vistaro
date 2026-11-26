import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  MessageSquare,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export const VendorProfileDetail = ({ vendorId, onBack, onNavigate }) => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Send enquiry state
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [budget, setBudget] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true);
        const res = await api.getVendor(vendorId);
        setVendor(res.vendor);
        setSubject(`Enquiry for ${res.vendor.business_name}`);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [vendorId]);

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }

    setSending(true);
    try {
      await api.sendVendorEnquiry(vendor.organisation_id, {
        subject,
        message,
        budget_range: budget,
        needed_by: neededBy
      });
      setSentSuccess(true);
      setTimeout(() => setEnquiryOpen(false), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading || !vendor) {
    return <div className="max-w-4xl mx-auto py-20 text-center text-xs text-[#71717A] font-mono bg-[#1F1F1F]">Loading supplier profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </button>

      {/* Main Vendor Header */}
      <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C2E21] text-[#4ADE80] border border-[#28492F] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                {vendor.verified_status}
              </span>
              <span className="text-xs font-mono text-[#EAB308] flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#EAB308] text-[#EAB308]" />
                {vendor.rating} ({vendor.completed_projects_count} completed jobs)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              {vendor.business_name}
            </h1>
            <p className="text-xs sm:text-sm text-[#A1A1AA] italic">{vendor.tagline}</p>
          </div>

          <button
            onClick={() => setEnquiryOpen(true)}
            className="px-5 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#121212]" />
            <span>Send Enquiry / RFQ</span>
          </button>
        </div>

        {/* Categories & Service Areas */}
        <div className="pt-4 border-t border-[#2E2E2E] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#71717A] block text-[10px] uppercase font-mono mb-1.5">Service Categories</span>
            <div className="flex flex-wrap gap-1.5">
              {vendor.service_categories?.map((cat, i) => (
                <span key={i} className="bg-[#1A1A1A] border border-[#333333] text-[#A1A1AA] font-mono px-2.5 py-0.5 rounded text-[11px]">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[#71717A] block text-[10px] uppercase font-mono mb-1.5">Coverage Areas</span>
            <div className="flex flex-wrap gap-1.5">
              {vendor.service_areas?.map((area, i) => (
                <span key={i} className="bg-[#1A1A1A] border border-[#333333] text-[#A1A1AA] font-mono px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#71717A]" />
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333] text-center">
            <span className="text-[#71717A] block text-[10px] uppercase font-mono">Experience</span>
            <span className="text-base font-semibold text-white font-mono">{vendor.experience_years} Years</span>
          </div>
          <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333] text-center">
            <span className="text-[#71717A] block text-[10px] uppercase font-mono">Completed Projects</span>
            <span className="text-base font-semibold text-white font-mono">{vendor.completed_projects_count}+</span>
          </div>
          <div className="bg-[#1D1D1D] p-3 rounded-lg border border-[#333333] text-center sm:col-span-2">
            <span className="text-[#71717A] block text-[10px] uppercase font-mono">Operational Capacity</span>
            <span className="text-xs font-medium text-white line-clamp-1">{vendor.capacity}</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
            Agency Overview & Technical Caliber
          </h3>
          <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed whitespace-pre-line">
            {vendor.description}
          </p>
        </div>

        {/* Certifications */}
        {vendor.certifications && vendor.certifications.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#2E2E2E]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
              Documented Credentials & Certifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {vendor.certifications.map((cert, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#1D1D1D] border border-[#333333] text-xs flex items-center gap-2 text-[#D4D4D8] font-mono">
                  <Award className="w-4 h-4 text-[#D8FF45] shrink-0" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Showcase */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">
          Portfolio & Past Project Track Record ({vendor.portfolio?.length || 0})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vendor.portfolio?.map(item => (
            <div key={item.id} className="bg-[#242424] border border-[#333333] rounded-xl overflow-hidden space-y-3">
              {item.images && item.images.length > 0 && (
                <div className="h-44 w-full overflow-hidden bg-[#1A1A1A]">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#71717A] font-mono">
                  <span>{item.category}</span>
                  <span>{item.year}</span>
                </div>
                <h3 className="font-semibold text-sm text-white">{item.title}</h3>
                <div className="text-xs text-[#A1A1AA]">Client: {item.client_name}</div>
                <p className="text-xs text-[#D4D4D8] leading-relaxed line-clamp-3">{item.description}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.tags?.map((tag, idx) => (
                    <span key={idx} className="text-[10px] bg-[#1A1A1A] border border-[#333333] text-[#A1A1AA] px-2 py-0.5 rounded font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enquiry Modal */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
              <h3 className="text-base font-semibold text-white">
                Direct RFQ / Enquiry for {vendor.business_name}
              </h3>
              <button onClick={() => setEnquiryOpen(false)} className="text-[#71717A] hover:text-white cursor-pointer">✕</button>
            </div>

            {sentSuccess ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#1C2E21] border border-[#28492F] text-[#4ADE80] flex items-center justify-center mx-auto">✓</div>
                <h4 className="font-semibold text-white text-sm">Enquiry Submitted</h4>
                <p className="text-xs text-[#A1A1AA]">The supplier has received your notification.</p>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Subject *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Requirements & Event Parameters *</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Specify dates, venue, equipment specs, and expected attendance..."
                    required
                    className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:border-[#D8FF45] focus:outline-none placeholder-[#71717A]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Budget Target</label>
                    <input
                      type="text"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. ₹3,50,000"
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Execution Date</label>
                    <input
                      type="date"
                      value={neededBy}
                      onChange={(e) => setNeededBy(e.target.value)}
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="pt-3 flex justify-end gap-2 border-t border-[#2E2E2E]">
                  <button
                    type="button"
                    onClick={() => setEnquiryOpen(false)}
                    className="px-4 py-2 rounded-lg text-[#A1A1AA] hover:text-white border border-[#383838] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send Enquiry'}
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
