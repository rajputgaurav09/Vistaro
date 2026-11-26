import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Sparkles,
  Send,
  X,
  ExternalLink,
  Bot,
  User,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ContextualAIChatbot = ({ isOpen, onClose, onNavigate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const getPromptPills = () => {
    if (user?.role === 'vendor') {
      return [
        'What should I do next?',
        'Which of my saved opportunities closes soon?',
        'What is missing from my proposal?',
        'Has the buyer asked for clarification?'
      ];
    }
    if (user?.role === 'institution') {
      return [
        'What should I do next?',
        'How do I publish an opportunity?',
        'Are there pending proposals to review?',
        'How does criterion-based scoring work?'
      ];
    }
    if (user?.role === 'service_customer') {
      return [
        'What is the status of my service request?',
        'What should I do next?',
        'How do I request a promotional video shoot?',
        'What is included in event planning execution?'
      ];
    }
    return [
      'What is Vistaro?',
      'How do I publish an opportunity?',
      'How does vendor discovery work?',
      'What services can I request?'
    ];
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const roleText = user ? `as ${user.name} (${user.role.toUpperCase()})` : 'as a Public Visitor';
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          content: `Hello. I am the Vistaro procurement assistant.\n\nScoped to your authorized workspace ${roleText}. I can answer questions about specifications, deadlines, readiness checklists, and clarification threads.\n\nHow can I help you today?`,
          references: [],
          suggested_actions: []
        }
      ]);
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAssistant(text);
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: res.reply,
        references: res.references || [],
        suggested_actions: res.suggested_actions || []
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: 'An error occurred while accessing workspace records. Please try again shortly.',
          references: [],
          suggested_actions: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#1F1F1F] shadow-2xl flex flex-col border-l border-[#333333]">
      {/* Header */}
      <div className="bg-[#242424] border-b border-[#2E2E2E] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#383838] flex items-center justify-center text-[#D8FF45]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs tracking-wider uppercase font-mono text-white">Vistaro Procurement AI</h3>
              <span className="text-[10px] font-mono text-[#4ADE80] bg-[#1C2E21] border border-[#28492F] px-1.5 py-0.2 rounded">
                Grounded
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] font-mono">
              {user ? `Scoped: ${user.name} (${user.role})` : 'Public Workspace'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#71717A] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Notice Banner */}
      <div className="bg-[#1D1D1D] border-b border-[#2E2E2E] px-4 py-2 text-[11px] text-[#A1A1AA] flex items-center gap-2 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-[#D8FF45] shrink-0" />
        <span>Strict role permissions active. Private competitor bids remain sealed.</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#181818]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[#242424] border border-[#383838] text-[#D8FF45] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs shadow-xs ${
              msg.sender === 'user'
                ? 'bg-[#2E2E2E] border border-[#4B4B4B] text-white rounded-tr-none'
                : 'bg-[#242424] border border-[#333333] text-[#D4D4D8] rounded-tl-none space-y-2'
            }`}>
              <div className="leading-relaxed whitespace-pre-line">
                {msg.content.split('\n').map((line, i) => {
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <div key={i} className={line.startsWith('•') ? 'pl-2 py-0.5' : 'py-0.5'}>
                      {parts.map((p, idx) => {
                        if (p.startsWith('**') && p.endsWith('**')) {
                          return <strong key={idx} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
                        }
                        if (p.startsWith('*') && p.endsWith('*')) {
                          return <em key={idx} className="italic text-[#A1A1AA]">{p.slice(1, -1)}</em>;
                        }
                        return p;
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Record References */}
              {msg.references && msg.references.length > 0 && (
                <div className="pt-2 border-t border-[#2E2E2E]">
                  <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider block mb-1">
                    Referenced Record:
                  </span>
                  <div className="space-y-1">
                    {msg.references.map((ref, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (onNavigate && ref.link) {
                            onNavigate(ref.link);
                            onClose();
                          }
                        }}
                        className="w-full text-left bg-[#1D1D1D] hover:bg-[#282828] border border-[#333333] rounded p-1.5 flex items-center justify-between text-[11px] text-[#D8FF45] transition-colors cursor-pointer"
                      >
                        <span className="truncate pr-2">{ref.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-1.5">
                  {msg.suggested_actions.map((act, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (onNavigate && act.link) {
                          onNavigate(act.link);
                          onClose();
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-[#2E2E2E] hover:bg-[#383838] border border-[#3E3E3E] text-white font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{act.label}</span>
                      <ChevronRight className="w-3 h-3 text-[#D8FF45]" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#242424] border border-[#383838] text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-center text-[#71717A] text-xs">
            <div className="w-7 h-7 rounded-lg bg-[#242424] border border-[#383838] text-[#D8FF45] flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#242424] px-3.5 py-2.5 rounded-xl border border-[#333333] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D8FF45] animate-ping" />
              <span className="text-[11px] text-[#A1A1AA] ml-1 font-mono">Inspecting database records...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="p-3 bg-[#242424] border-t border-[#2E2E2E] space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] flex items-center gap-1">
          <HelpCircle className="w-3 h-3" /> Suggested Queries
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {getPromptPills().map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pill)}
              disabled={loading}
              className="text-[11px] bg-[#1A1A1A] hover:bg-[#282828] text-[#D4D4D8] hover:text-white border border-[#333333] hover:border-[#4B4B4B] rounded-lg px-2.5 py-1 text-left transition-colors cursor-pointer font-mono"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about deadlines, proposal readiness, RFQs..."
            disabled={loading}
            className="flex-1 bg-[#1A1A1A] border border-[#383838] rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#D8FF45] text-white placeholder-[#71717A]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] disabled:opacity-50 text-[#121212] transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#121212]" />
          </button>
        </form>
      </div>
    </div>
  );
};
