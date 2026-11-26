import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Building2, Store, Sparkles, UserCircle } from 'lucide-react';

export const RoleSwitcherBar = () => {
  const { user, demoUsers, switchDemoUser, logout } = useAuth();

  const getPersonaRoleBadge = (role) => {
    switch (role) {
      case 'institution':
        return { label: 'Institution Buyer', icon: Building2, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'vendor':
        return { label: 'Vendor', icon: Store, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'service_customer':
        return { label: 'Service Customer', icon: Users, color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'admin':
        return { label: 'Admin / Ops Team', icon: Shield, color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: 'Public Guest', icon: UserCircle, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs py-2 px-4 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Interactive Demo Role Switcher:
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Switch personas anytime to test role-guarded workflows:
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {demoUsers.map((p) => {
            const isCurrent = user?.id === p.id;
            const badge = getPersonaRoleBadge(p.role);
            return (
              <button
                key={p.id}
                onClick={() => switchDemoUser(p.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
                title={`${p.title} at ${p.organisation_name}`}
              >
                <badge.icon className="w-3 h-3" />
                <span>{p.name.split(' ')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                  isCurrent ? 'bg-blue-800 text-blue-100' : 'bg-slate-700 text-slate-300'
                }`}>
                  {p.role === 'institution' ? 'Institution' : p.role === 'vendor' ? 'Vendor' : p.role === 'service_customer' ? 'Customer' : 'Admin'}
                </span>
              </button>
            );
          })}

          <button
            onClick={logout}
            className={`px-2 py-1 rounded-md transition-all ${
              !user ? 'bg-amber-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Guest View
          </button>
        </div>
      </div>
    </div>
  );
};
