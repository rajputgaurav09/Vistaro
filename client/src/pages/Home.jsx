import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Compass,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Clock,
  Plus,
  Lock,
  Megaphone,
  Video,
  Calendar,
  Layers
} from 'lucide-react';

export const Home = ({ onNavigate, onSelectOpportunity, onSelectVendor, onSelectService }) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [oppsRes, vendorsRes] = await Promise.all([
          api.getOpportunities({ status: 'published' }),
          api.getVendors()
        ]);
        setOpportunities(oppsRes.opportunities?.slice(0, 3) || []);
        setVendors(vendorsRes.vendors?.slice(0, 3) || []);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const handlePublishClick = () => {
    if (user?.role === 'institution' || user?.role === 'admin') {
      onNavigate('create-opportunity');
    } else {
      onNavigate('login');
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section — Minimal Editorial Valdera Style */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-medium">
          <span>Vistaro Sourcing & Procurement</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-white leading-tight">
          Find the right opportunities.<br />
          <span className="text-zinc-300">Work with the right vendors.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 font-normal leading-relaxed">
          Vistaro brings procurement opportunities, supplier discovery, private tenders, and event services into one straightforward platform.
        </p>

        {/* Primary Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('opportunities')}
            className="px-6 py-3 rounded-lg bg-[#D8FF45] hover:bg-[#c6f035] text-zinc-950 font-semibold text-xs tracking-wide transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>Find Tenders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handlePublishClick}
            className="px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-medium text-xs tracking-wide transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>Publish a Tender</span>
          </button>

          <button
            onClick={() => onNavigate('services')}
            className="px-5 py-3 rounded-lg text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Explore Services
          </button>
        </div>

        {/* Two Entry Options — Editorial Split Cards */}
        <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-4xl mx-auto">
          <div
            onClick={() => onNavigate('opportunities')}
            className="bg-[#242424] border border-[#333333] hover:border-zinc-500 rounded-xl p-6 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="uppercase tracking-wider font-mono text-[11px]">For Vendors & Suppliers</span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-medium text-white">I am looking for tenders</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Explore public listings and access confidential private tenders with structured readiness checks and sealed bids.
            </p>
          </div>

          <div
            onClick={handlePublishClick}
            className="bg-[#242424] border border-[#333333] hover:border-zinc-500 rounded-xl p-6 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="uppercase tracking-wider font-mono text-[11px]">For Institutions & Buyers</span>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-medium text-white">I want to publish a tender</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Publish public RFQs or restricted private tenders, invite verified suppliers, and evaluate proposals with multi-criterion scoring.
            </p>
          </div>
        </div>

        {/* Value Pillars */}
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
          <div className="bg-[#222222] border border-[#2E2E2E] rounded-lg p-4">
            <div className="text-white font-medium text-sm flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D8FF45]" />
              <span>Public & Private</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">Open marketplace listings or invitation-only private bids</div>
          </div>
          <div className="bg-[#222222] border border-[#2E2E2E] rounded-lg p-4">
            <div className="text-white font-medium text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D8FF45]" />
              <span>Tender Readiness</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">Structured requirement checklists and rider validation</div>
          </div>
          <div className="bg-[#222222] border border-[#2E2E2E] rounded-lg p-4">
            <div className="text-white font-medium text-sm flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D8FF45]" />
              <span>In-House Delivery</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">Integrated promotional activations, video, and event crew</div>
          </div>
          <div className="bg-[#222222] border border-[#2E2E2E] rounded-lg p-4">
            <div className="text-white font-medium text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D8FF45]" />
              <span>Sealed Bids</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">Competing quotes are strictly confidential to the buyer</div>
          </div>
        </div>
      </section>

      {/* How Vistaro Works — Editorial Steps */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#2E2E2E] pt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Process</span>
              <h2 className="text-2xl font-normal text-white mt-1">How Vistaro Works</h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              A single platform built for direct collaboration between institutions and pre-qualified suppliers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor Column */}
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-[#D8FF45]">
                Vendor Journey
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-zinc-500">01</span>
                  <div>
                    <h4 className="text-xs font-medium text-white">Find Opportunities</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Search public tenders by category, budget, and location, or access private tenders issued to you.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-zinc-500">02</span>
                  <div>
                    <h4 className="text-xs font-medium text-white">Track Readiness</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Verify specifications against technical requirements, licenses, and equipment caliber.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-zinc-500">03</span>
                  <div>
                    <h4 className="text-xs font-medium text-white">Submit Sealed Proposals</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Submit itemized quotes and delivery timelines directly into the institution's review queue.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer Column */}
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-white">
                Institution Journey
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-zinc-500">01</span>
                  <div>
                    <h4 className="text-xs font-medium text-white">Define Scope & Rider</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Specify deliverable quantities, technical parameters, budget parameters, and deadlines.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-zinc-500">02</span>
                  <div>
                    <h4 className="text-xs font-medium text-white">Choose Public or Private</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      List openly for broad market response or issue invitations to selected suppliers for confidentiality.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-zinc-500">03</span>
                  <div>
                    <h4 className="text-xs font-medium text-white">Compare & Award</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Score submissions against compliance criteria, clarify technical details, and record award decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Procurement Opportunities Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#2E2E2E] pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Marketplace</span>
              <h2 className="text-2xl font-normal text-white mt-1">Active Tenders</h2>
            </div>
            <button
              onClick={() => onNavigate('opportunities')}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View all tenders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {opportunities.map(opp => (
              <div
                key={opp.id}
                onClick={() => onSelectOpportunity(opp.id)}
                className="bg-[#242424] border border-[#333333] hover:border-zinc-500 rounded-xl p-5 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-zinc-400 uppercase tracking-wide">
                      {opp.type}
                    </span>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      Due {new Date(opp.submission_deadline).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-white leading-snug line-clamp-2">
                      {opp.title}
                    </h3>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-zinc-500" />
                      <span>{opp.organisation_name}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {opp.scope}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#2E2E2E] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Budget</span>
                    <span className="text-white font-medium">
                      {opp.is_budget_disclosed
                        ? `₹${opp.budget_min.toLocaleString()} - ₹${opp.budget_max.toLocaleString()}`
                        : 'Undisclosed'}
                    </span>
                  </div>
                  <span className="text-[#D8FF45] font-medium text-xs flex items-center gap-1">
                    Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Vendors Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#2E2E2E] pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Directory</span>
              <h2 className="text-2xl font-normal text-white mt-1">Verified Suppliers</h2>
            </div>
            <button
              onClick={() => onNavigate('vendors')}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Explore vendor directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {vendors.map(vendor => (
              <div
                key={vendor.id}
                onClick={() => onSelectVendor(vendor.id)}
                className="bg-[#242424] border border-[#333333] hover:border-zinc-500 rounded-xl p-5 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {vendor.verified_status}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      Rating {vendor.rating} / 5
                    </span>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-white leading-snug">
                      {vendor.business_name}
                    </h3>
                    <p className="text-xs text-zinc-400 italic mt-0.5">{vendor.tagline}</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {vendor.service_categories?.slice(0, 3).map((cat, i) => (
                      <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
                        {cat}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {vendor.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#2E2E2E] flex items-center justify-between text-xs text-zinc-400">
                  <span>{vendor.experience_years} years experience</span>
                  <span className="text-[#D8FF45] font-medium flex items-center gap-1">
                    View profile <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services & Promotions — Flat Editorial Panels */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#2E2E2E] pt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Execution</span>
              <h2 className="text-2xl font-normal text-white mt-1">Turnkey Services by Vistaro</h2>
            </div>
            <button
              onClick={() => onNavigate('services')}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View all services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Service 1 */}
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 text-white flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-[#D8FF45]" />
                </div>
                <h3 className="text-base font-medium text-white">Paid Campus Promotion</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Targeted promotional campaigns across verified university channels, campus bulletin blitzes, ambassador activations, and co-branded creator posts.
                </p>
                <ul className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-[#2E2E2E]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[#D8FF45] shrink-0" />
                    <span>15+ verified university networks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[#D8FF45] shrink-0" />
                    <span>Physical placements & digital digests</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onSelectService('paid-promotion')}
                className="mt-6 w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                Request Promotion Brief
              </button>
            </div>

            {/* Service 2 */}
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 text-white flex items-center justify-center">
                  <Video className="w-4 h-4 text-[#D8FF45]" />
                </div>
                <h3 className="text-base font-medium text-white">Video Shoot & Editing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Filming, gimbal choreography, and rapid-turnaround editing for festival aftermovies, high-production teasers, and corporate conclaves.
                </p>
                <ul className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-[#2E2E2E]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[#D8FF45] shrink-0" />
                    <span>Cinema lenses, audio recordists & gimbal rigs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[#D8FF45] shrink-0" />
                    <span>Vertical cuts + master 4K aftermovie</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onSelectService('promotional-video')}
                className="mt-6 w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                Request Video Quote
              </button>
            </div>

            {/* Service 3 */}
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 text-white flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#D8FF45]" />
                </div>
                <h3 className="text-base font-medium text-white">Event Planning & Ground Execution</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  End-to-end event orchestrating from initial brief, stage fabrication, and sound coordination to on-the-day cueing, VIP hospitality, and run-of-show.
                </p>
                <ul className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-[#2E2E2E]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[#D8FF45] shrink-0" />
                    <span>Dedicated on-site Event Operations Lead</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[#D8FF45] shrink-0" />
                    <span>Rider fulfillment, stage cueing & crowd flow</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onSelectService('event-planner-execution')}
                className="mt-6 w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                Request Execution Plan
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
