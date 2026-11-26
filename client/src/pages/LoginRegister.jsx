import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  UserPlus,
  Building2,
  Store,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const LoginRegister = ({ onComplete }) => {
  const { login, register, switchDemoUser, demoUsers } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('vendor'); // 'vendor' | 'institution'
  const [organisationName, setOrganisationName] = useState('');
  const [organisationType, setOrganisationType] = useState('University / Educational Institution');
  const [vendorCategory, setVendorCategory] = useState('AV & Sound Systems');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({
          name,
          email,
          password,
          role,
          organisationName,
          organisationType: role === 'vendor' ? vendorCategory : organisationType,
          phone
        });
      } else {
        await login(email, password);
      }
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSelect = async (userId) => {
    try {
      await switchDemoUser(userId);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 px-4 space-y-6 bg-[#1F1F1F]">
      {/* Brand header */}
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-lg bg-[#D8FF45] text-[#121212] flex items-center justify-center font-bold text-xl mx-auto shadow-xs">
          V
        </div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          {isRegister ? 'Create Your Account' : 'Sign In to Vistaro'}
        </h1>
        <p className="text-xs text-[#A1A1AA]">
          B2B Procurement Marketplace & Supplier Directory
        </p>
      </div>

      {/* Two Primary Entry Options (A: Find Tenders vs B: Publish Tenders) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setRole('vendor');
            if (!isRegister) setIsRegister(true);
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            role === 'vendor'
              ? 'bg-[#252818] border-[#515C1E] ring-1 ring-[#D8FF45]'
              : 'bg-[#242424] border-[#333333] hover:border-[#444444]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              role === 'vendor' ? 'bg-[#D8FF45] text-[#121212]' : 'bg-[#1A1A1A] text-[#71717A]'
            }`}>
              <Store className="w-4 h-4" />
            </div>
            {role === 'vendor' && <CheckCircle2 className="w-4 h-4 text-[#D8FF45]" />}
          </div>
          <div className="font-semibold text-xs text-white">Find Tenders</div>
          <div className="text-[10px] text-[#A1A1AA] mt-0.5">Vendors & Suppliers</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole('institution');
            if (!isRegister) setIsRegister(true);
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            role === 'institution'
              ? 'bg-[#252818] border-[#515C1E] ring-1 ring-[#D8FF45]'
              : 'bg-[#242424] border-[#333333] hover:border-[#444444]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              role === 'institution' ? 'bg-[#D8FF45] text-[#121212]' : 'bg-[#1A1A1A] text-[#71717A]'
            }`}>
              <Building2 className="w-4 h-4" />
            </div>
            {role === 'institution' && <CheckCircle2 className="w-4 h-4 text-[#D8FF45]" />}
          </div>
          <div className="font-semibold text-xs text-white">Publish Tenders</div>
          <div className="text-[10px] text-[#A1A1AA] mt-0.5">Institutions & Buyers</div>
        </button>
      </div>

      {/* Main Authentication Form */}
      <div className="bg-[#242424] border border-[#333333] rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2E2E2E]">
          <h2 className="font-medium text-white text-sm">
            {isRegister
              ? `Register as ${role === 'vendor' ? 'Vendor / Supplier' : 'Institution / Buyer'}`
              : 'Sign in with your credentials'}
          </h2>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-[#D8FF45] hover:underline font-mono cursor-pointer"
          >
            {isRegister ? 'Switch to Sign In' : 'Need an account? Register'}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#2D1B1B] border border-[#642B2B] text-[#F87171] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                {role === 'vendor' ? 'Contact Person Name' : 'Authorized Officer Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Verma"
                required
                className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2.5 focus:border-[#D8FF45] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Work / Official Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'vendor' ? 'e.g. contact@apexaudio.com' : 'e.g. buyer@delhi-tech.edu'}
              required
              className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2.5 focus:border-[#D8FF45] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2.5 focus:border-[#D8FF45] focus:outline-none"
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  {role === 'vendor' ? 'Business / Agency Name' : 'Institution / Organisation Name'}
                </label>
                <input
                  type="text"
                  value={organisationName}
                  onChange={(e) => setOrganisationName(e.target.value)}
                  placeholder={role === 'vendor' ? 'e.g. Apex Audio & Stage Systems' : 'e.g. Delhi Technical University'}
                  required
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2.5 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>

              {role === 'vendor' ? (
                <div>
                  <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Primary Vendor Category</label>
                  <select
                    value={vendorCategory}
                    onChange={(e) => setVendorCategory(e.target.value)}
                    className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2.5 focus:border-[#D8FF45] focus:outline-none"
                  >
                    <option value="AV & Sound Systems">AV & Sound Systems</option>
                    <option value="Stage & Concert Lighting">Stage & Concert Lighting</option>
                    <option value="Catering & Food Services">Catering & Food Services</option>
                    <option value="LED Display & Live Broadcasting">LED Display & Live Broadcasting</option>
                    <option value="Stage Fabrication & Venue Decor">Stage Fabrication & Venue Decor</option>
                    <option value="Merchandise & Delegate Kits">Merchandise & Delegate Kits</option>
                    <option value="Security & Logistics">Security & Logistics</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Organisation Type</label>
                  <select
                    value={organisationType}
                    onChange={(e) => setOrganisationType(e.target.value)}
                    className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2.5 focus:border-[#D8FF45] focus:outline-none"
                  >
                    <option value="University / Educational Institution">University / Educational Institution</option>
                    <option value="Corporate / Enterprise">Corporate / Enterprise</option>
                    <option value="Foundation / Global Summit">Foundation / Global Summit</option>
                    <option value="Festival / Student Committee">Festival / Student Committee</option>
                    <option value="Government / PSU Body">Government / PSU Body</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">Contact Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98101 23456"
                  className="w-full border border-[#383838] bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2.5 focus:border-[#D8FF45] focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-[#D8FF45] hover:bg-[#c9f034] text-[#121212] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : isRegister ? 'Complete Registration' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4 text-[#121212]" />
            </button>
          </div>
        </form>

        <div className="pt-3 border-t border-[#2E2E2E] text-center text-xs text-[#A1A1AA]">
          {isRegister ? 'Already registered on Vistaro?' : "Looking to register your organization?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-[#D8FF45] font-mono hover:underline cursor-pointer"
          >
            {isRegister ? 'Sign In' : 'Create an Account'}
          </button>
        </div>
      </div>

      {/* Developer Testing Quick Logins - subtle and non-intrusive */}
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-4 space-y-2.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
          <span>Developer / QA Evaluation Accounts:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {demoUsers.slice(0, 4).map(p => (
            <button
              key={p.id}
              onClick={() => handleDemoSelect(p.id)}
              className="p-2.5 rounded-lg bg-[#242424] hover:bg-[#2A2A2A] text-left border border-[#333333] transition-colors cursor-pointer"
            >
              <div className="font-medium text-white truncate text-xs">{p.name}</div>
              <div className="text-[10px] text-[#A1A1AA] font-mono capitalize">{p.role}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
