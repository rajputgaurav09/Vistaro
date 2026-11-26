import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  FileCheck,
  UserCheck,
  XCircle,
  Layers,
  ChevronRight
} from 'lucide-react';

export const ServiceRequestDetail = ({ requestId, onBack, onNavigate }) => {
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await api.getServiceRequest(requestId);
      setRequest(res.request);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const handleQuoteDecision = async (decision) => {
    if (!request.quote) return;
    setActionInProgress(true);
    try {
      await api.respondToServiceQuote(request.quote.id, decision);
      await fetchRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading || !request) {
    return <div className="max-w-4xl mx-auto py-20 text-center text-xs text-[#71717A] font-mono bg-[#1F1F1F]">Loading service request...</div>;
  }

  const quote = request.quote;
  const milestones = request.milestones || [];

  const stages = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'quote_sent', label: 'Quote Issued' },
    { key: 'accepted', label: 'Confirmed' },
    { key: 'scheduled', label: 'In Progress' },
    { key: 'completed', label: 'Completed' }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === request.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 bg-[#1F1F1F] min-h-[calc(100vh-80px)]">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Workspace</span>
      </button>

      {/* Main Header & Status Pipeline */}
      <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D8FF45]">
              Turnkey Delivery Request
            </span>
            <h1 className="text-2xl font-semibold text-white mt-1">{request.service_type}</h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5 font-mono">
              Requested {new Date(request.created_at).toLocaleDateString()} by {request.customer_name}
            </p>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded bg-[#1A1A1A] border border-[#383838] text-[#D8FF45] self-start sm:self-center">
            {request.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Visual Pipeline Bar */}
        <div className="pt-2">
          <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-mono">
            {stages.map((stage, idx) => {
              const isPast = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stage.key} className="space-y-1.5">
                  <div className={`h-1.5 rounded-full ${
                    isCurrent
                      ? 'bg-[#D8FF45]'
                      : isPast
                      ? 'bg-[#4ADE80]'
                      : 'bg-[#2E2E2E]'
                  }`} />
                  <span className={`block truncate ${
                    isCurrent ? 'text-[#D8FF45] font-semibold' : isPast ? 'text-[#D4D4D8]' : 'text-[#71717A]'
                  }`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned team member */}
        <div className="pt-4 border-t border-[#2E2E2E] flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#D8FF45]" />
            <span>Assigned Lead: <strong className="text-white font-normal">{request.assigned_to_name || 'Vistaro Ops Lead'}</strong></span>
          </div>
          <div>
            <span>Execution Timeline: <strong className="text-white font-normal">{request.preferred_dates || 'Flexible'}</strong></span>
          </div>
        </div>
      </div>

      {/* Customer Brief Details */}
      <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
          Submitted Project Brief
        </h3>
        <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed whitespace-pre-line">
          {request.brief_details}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#2E2E2E] text-xs">
          <div>
            <span className="text-[#71717A] block text-[10px] uppercase font-mono">Target Audience</span>
            <span className="font-medium text-white">{request.target_audience || 'Campus delegates'}</span>
          </div>
          <div>
            <span className="text-[#71717A] block text-[10px] uppercase font-mono">Venue Location</span>
            <span className="font-medium text-white">{request.location || 'Delhi NCR'}</span>
          </div>
          <div>
            <span className="text-[#71717A] block text-[10px] uppercase font-mono">Budget Indication</span>
            <span className="font-medium text-white">{request.budget_range}</span>
          </div>
        </div>
      </div>

      {/* Official Quote Review */}
      {quote && (
        <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#D8FF45]" />
              <h3 className="text-base font-semibold text-white">
                Official Scope & Quotation (sq-{quote.id.slice(-4)})
              </h3>
            </div>
            <span className={`text-xs font-mono px-3 py-1 rounded ${
              quote.status === 'accepted'
                ? 'bg-[#1C2E21] text-[#4ADE80] border border-[#28492F]'
                : quote.status === 'declined'
                ? 'bg-[#2D1B1B] text-[#F87171] border border-[#642B2B]'
                : 'bg-[#2D2817] text-[#EAB308] border border-[#52451C]'
            }`}>
              {quote.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#1D1D1D] p-3.5 rounded-lg border border-[#333333]">
              <span className="text-[10px] text-[#71717A] uppercase font-mono block">Total Service Fee</span>
              <span className="text-xl font-semibold text-white font-mono">₹{quote.price.toLocaleString()}</span>
            </div>
            <div className="bg-[#1D1D1D] p-3.5 rounded-lg border border-[#333333]">
              <span className="text-[10px] text-[#71717A] uppercase font-mono block">Execution Timeline</span>
              <span className="text-xs font-medium text-white">{quote.timeline}</span>
            </div>
            <div className="bg-[#1D1D1D] p-3.5 rounded-lg border border-[#333333]">
              <span className="text-[10px] text-[#71717A] uppercase font-mono block">Quote Validity</span>
              <span className="text-xs font-medium text-white font-mono">Until {quote.validity_date}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <h4 className="font-mono uppercase tracking-wider text-[#A1A1AA]">Scope Overview:</h4>
            <p className="text-[#D4D4D8] leading-relaxed">{quote.scope}</p>
          </div>

          {/* Deliverables List */}
          <div className="space-y-2 text-xs">
            <h4 className="font-mono uppercase tracking-wider text-[#A1A1AA]">Agreed Concrete Deliverables:</h4>
            <ul className="space-y-1.5">
              {quote.deliverables?.map((deliv, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[#D4D4D8]">
                  <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
                  <span>{deliv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exclusions */}
          {quote.exclusions && (
            <div className="p-3 rounded-lg bg-[#1D1D1D] border border-[#333333] text-xs text-[#A1A1AA]">
              <span className="font-medium text-white block mb-0.5">Explicit Exclusions & Notes:</span>
              <p>{quote.exclusions}</p>
            </div>
          )}

          {/* Quote Actions for Customer */}
          {quote.status === 'sent' && (
            <div className="pt-4 border-t border-[#2E2E2E] flex items-center justify-end gap-3">
              <button
                onClick={() => handleQuoteDecision('declined')}
                disabled={actionInProgress}
                className="px-4 py-2 rounded-lg border border-[#383838] text-[#A1A1AA] hover:text-white text-xs font-medium cursor-pointer"
              >
                Decline Quote
              </button>

              <button
                onClick={() => handleQuoteDecision('accepted')}
                disabled={actionInProgress}
                className="px-6 py-2.5 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-[#121212]" />
                <span>Accept Quote & Confirm Booking</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Milestones Tracker */}
      {milestones.length > 0 && (
        <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D8FF45]" />
            <h3 className="font-semibold text-sm text-white">
              Execution Milestones & Schedule
            </h3>
          </div>

          <div className="space-y-3">
            {milestones.map((milestone) => {
              const isDone = milestone.status === 'completed';
              return (
                <div
                  key={milestone.id}
                  className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                    isDone ? 'bg-[#1C2E21] border-[#28492F]' : 'bg-[#1D1D1D] border-[#333333]'
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                    ) : (
                      <Clock className="w-4 h-4 text-[#71717A]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${isDone ? 'text-[#4ADE80]' : 'text-white'}`}>
                        {milestone.title}
                      </span>
                      <span className="text-[10px] text-[#71717A] font-mono">Due: {milestone.due_date}</span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">{milestone.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
