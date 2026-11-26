import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Sparkles,
  Megaphone,
  Video,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Send,
  HelpCircle,
  FileCheck
} from 'lucide-react';

export const ServicesOverview = ({ selectedServiceSlug, onRequestCreated, onNavigate }) => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Service Request Modal State
  const [modalService, setModalService] = useState(null);
  const [briefDetails, setBriefDetails] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [location, setLocation] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [assetsLink, setAssetsLink] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await api.getServices();
        setServices(res.services || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedServiceSlug && services.length > 0) {
      const match = services.find(s => s.slug === selectedServiceSlug);
      if (match) openRequestModal(match);
    }
  }, [selectedServiceSlug, services]);

  const openRequestModal = (service) => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setModalService(service);
    setBriefDetails('');
    setTargetAudience('');
    setPreferredDates('');
    setLocation('');
    setBudgetRange('');
    setAssetsLink('');
    setSubmitSuccess(false);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!modalService) return;

    setSubmitting(true);
    try {
      const res = await api.submitServiceRequest({
        service_slug: modalService.slug,
        service_type: modalService.name,
        brief_details: briefDetails,
        target_audience: targetAudience,
        preferred_dates: preferredDates,
        location,
        budget_range: budgetRange,
        assets_link: assetsLink,
        contact_phone: contactPhone
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setModalService(null);
        if (onRequestCreated) onRequestCreated(res.request.id);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getServiceIcon = (slug) => {
    switch (slug) {
      case 'paid-promotion': return Megaphone;
      case 'promotional-video': return Video;
      case 'event-planner-execution': return Calendar;
      default: return Sparkles;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="border-b border-[#2E2E2E] pb-8">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#D8FF45] font-semibold">
          Turnkey Delivery
        </span>
        <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mt-1">
          In-House Event & Media Services
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-2 max-w-2xl leading-relaxed">
          Beyond marketplace bidding, Vistaro provides dedicated in-house execution for campus activations, cinematic recap videos, and full on-site event run-of-show direction.
        </p>
      </div>

      {/* 3 Detailed Service Cards */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#71717A] font-mono">Loading service specifications...</div>
        ) : (
          services.map((svc, idx) => {
            const Icon = getServiceIcon(svc.slug);
            return (
              <div
                key={svc.id}
                className="bg-[#242424] border border-[#333333] hover:border-[#4B4B4B] rounded-xl p-6 sm:p-8 transition-all space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1D1D1D] border border-[#333333] text-[#D8FF45] flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                        Service Package 0{idx + 1}
                      </span>
                      <h2 className="text-xl font-semibold text-white mt-0.5">{svc.name}</h2>
                      <p className="text-xs text-[#A1A1AA] italic mt-0.5">{svc.tagline}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => openRequestModal(svc)}
                    className="px-5 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 self-start md:self-center cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-[#121212]" />
                    <span>Request Quotation</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed">
                  {svc.description}
                </p>

                {/* Indicative Process & Scope Boundaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#2E2E2E]">
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D8FF45]" />
                      Execution Process & Timeline
                    </h3>
                    <ul className="space-y-1.5 text-xs text-[#D4D4D8]">
                      {svc.indicative_process?.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#1A1A1A] border border-[#383838] text-white text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                      Scope Commitments
                    </h3>
                    <ul className="space-y-1.5 text-xs text-[#D4D4D8]">
                      {svc.scope_boundaries?.map((bound, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80] shrink-0 mt-0.5" />
                          <span>{bound}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Service Request Modal Form */}
      {modalService && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#242424] border border-[#333333] rounded-xl max-w-xl w-full p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#D8FF45]">
                  Vistaro Service Request Form
                </span>
                <h3 className="text-lg font-semibold text-white">{modalService.name}</h3>
              </div>
              <button
                onClick={() => setModalService(null)}
                className="text-[#71717A] hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#1C2E21] border border-[#28492F] text-[#4ADE80] flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-semibold text-white text-sm">Service Request Submitted</h4>
                <p className="text-xs text-[#A1A1AA]">
                  The Vistaro operations team will review your brief and issue a customized quote with deliverables and pricing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                    Project Brief & Objective *
                  </label>
                  <textarea
                    rows={4}
                    value={briefDetails}
                    onChange={(e) => setBriefDetails(e.target.value)}
                    placeholder="Describe your event or campaign, desired deliverables, tone, and specific needs..."
                    required
                    className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg p-3 focus:outline-none focus:border-[#D8FF45] placeholder-[#71717A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Target Audience / Footfall
                    </label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g. 5,000 college delegates"
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Preferred Date(s)
                    </label>
                    <input
                      type="text"
                      value={preferredDates}
                      onChange={(e) => setPreferredDates(e.target.value)}
                      placeholder="e.g. Nov 12 - Nov 14, 2026"
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Venue Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Main Auditorium, Delhi"
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Budget Range Estimate
                    </label>
                    <input
                      type="text"
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      placeholder="e.g. ₹50,000 - ₹80,000"
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Brand Assets Link (URL)
                    </label>
                    <input
                      type="url"
                      value={assetsLink}
                      onChange={(e) => setAssetsLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98100 XXXXX"
                      className="w-full text-xs border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3 py-2 focus:border-[#D8FF45] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#2E2E2E]">
                  <button
                    type="button"
                    onClick={() => setModalService(null)}
                    className="px-4 py-2 rounded-lg text-[#A1A1AA] hover:text-white border border-[#383838] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-[#121212]" />
                    <span>{submitting ? 'Submitting...' : 'Send Service Request'}</span>
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
