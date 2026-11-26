import React from 'react';
import { Shield, Lock } from 'lucide-react';

export const Footer = ({ onNavigate }) => {
  return (
    <footer className="bg-[#181818] border-t border-[#2A2A2A] text-zinc-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-[#D8FF45] text-black font-black flex items-center justify-center text-xs">
                V
              </span>
              <span className="text-base font-bold text-white tracking-tight">Vistaro</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              B2B procurement marketplace connecting institutions with verified suppliers, backed by turnkey on-ground event delivery.
            </p>
          </div>

          {/* Pillars */}
          <div>
            <h4 className="text-white font-medium mb-3 text-xs tracking-wider uppercase">Marketplace</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('opportunities')} className="hover:text-white transition-colors cursor-pointer">
                  Find Tenders
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('vendors')} className="hover:text-white transition-colors cursor-pointer">
                  Vendor Directory
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                  Services
                </button>
              </li>
            </ul>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="text-white font-medium mb-3 text-xs tracking-wider uppercase">Services</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                  Paid Campus Promotion
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                  Promotional Video Shoot & Editing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                  Event Planning & Ground Execution
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Principles */}
          <div className="space-y-2">
            <h4 className="text-white font-medium mb-3 text-xs tracking-wider uppercase">Privacy & Confidentiality</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Vendor bid proposals and pricing structures are strictly sealed. Private tender documents are protected by server-side authorization.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-zinc-400 text-xs">
              <Lock className="w-3.5 h-3.5 text-[#D8FF45]" />
              <span>Confidential sealed bidding</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#2A2A2A] text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Vistaro Premium. All rights reserved.</span>
          <span className="text-zinc-500">
            Institutional Procurement & Event Services Platform
          </span>
        </div>
      </div>
    </footer>
  );
};
