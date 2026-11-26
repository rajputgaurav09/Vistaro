import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  Store,
  Sparkles,
  Bell,
  CheckSquare,
  LogOut,
  LogIn,
  Menu,
  X,
  Plus,
  Briefcase
} from 'lucide-react';

export const Navbar = ({ currentView, setCurrentView, openNotifications, openTasks }) => {
  const { user, logout, unreadCount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getWorkspaceTitle = () => {
    if (!user) return 'Workspace';
    if (user.role === 'institution') return 'Institution Portal';
    if (user.role === 'vendor') return 'Vendor Workspace';
    if (user.role === 'service_customer') return 'Service Portal';
    if (user.role === 'admin') return 'Admin Ops';
    return 'Workspace';
  };

  const navItems = [
    { id: 'opportunities', label: 'Find Tenders' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'services', label: 'Services' },
    ...(user ? [{ id: 'dashboard', label: getWorkspaceTitle() }] : [])
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1F1F1F] border-b border-[#2E2E2E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-10">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-90 cursor-pointer"
            >
              <span className="w-7 h-7 rounded bg-[#D8FF45] text-black font-black flex items-center justify-center text-sm tracking-tight">
                V
              </span>
              <span className="text-lg font-bold tracking-tight text-white">Vistaro</span>
            </button>

            {/* Desktop Nav Links - Restrained Editorial Style */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#D8FF45] bg-[#2A2A2A]'
                        : 'text-zinc-400 hover:text-white hover:bg-[#262626]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-3">
            {/* Logged-In User Controls */}
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'institution' && (
                  <button
                    onClick={() => setCurrentView('create-opportunity')}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D8FF45]" />
                    <span>Publish Tender</span>
                  </button>
                )}

                <button
                  onClick={openTasks}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="My Tasks & Deadlines"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                <button
                  onClick={openNotifications}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 relative transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#D8FF45]" />
                  )}
                </button>

                <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-800">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-medium text-white leading-tight">{user.name}</div>
                    <div className="text-[10px] text-zinc-400 truncate max-w-[130px]">
                      {user.organisation?.name || user.role}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  onClick={() => setCurrentView('login')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#D8FF45] hover:bg-[#c6f035] text-zinc-950 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  Publish a Tender
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 md:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-zinc-800 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium ${
                  currentView === item.id ? 'bg-[#2A2A2A] text-[#D8FF45]' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
            {user?.role === 'institution' && (
              <button
                onClick={() => handleNavClick('create-opportunity')}
                className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-[#D8FF45] hover:bg-zinc-800"
              >
                Publish Tender
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
