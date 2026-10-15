import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  LayoutGrid,
  Sun,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SpiralBinding } from '../journal/SpiralBinding';
import { getISOWeekNumber, SyncStatus } from '@planner/shared';
import { syncManager } from '../../services/syncManager';

interface PlannerLayoutProps {
  children: React.ReactNode;
  currentYear?: number;
}

export const PlannerLayout: React.FC<PlannerLayoutProps> = ({
  children,
  currentYear: propYear,
}) => {
  const { user, logout, loading, pendingSyncCount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsub = syncManager.onStatusChange((status) => {
      setSyncStatus(status);
    });
    return () => unsub();
  }, []);

  const now = new Date();
  const currentYear = propYear || now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentWeek = getISOWeekNumber(now);

  const handleLogoutClick = () => {
    if (pendingSyncCount > 0) {
      setShowLogoutConfirm(true);
    } else {
      logout();
    }
  };

  const handleExportRescueBeforeLogout = () => {
    if (user?.id) {
      syncManager.exportUnsyncedData(user.id);
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const navLinks = [
    {
      to: '/annual',
      label: 'Annual Horizon',
      sub: 'Year-at-a-Glance (202_)',
      icon: Calendar,
      isActive: location.pathname.startsWith('/annual'),
    },
    {
      to: `/monthly/${currentYear}/${currentMonth}`,
      label: 'Monthly Planner',
      sub: 'Dashboard & Grid',
      icon: CalendarDays,
      isActive: location.pathname.startsWith('/monthly'),
    },
    {
      to: `/weekly/${currentYear}/${currentWeek}`,
      label: 'Weekly Planner',
      sub: '2-Page Spread & Rule of 3',
      icon: LayoutGrid,
      isActive: location.pathname.startsWith('/weekly'),
    },
    {
      to: '/daily',
      label: 'Daily Planner',
      sub: 'Rule of 3 & Journaling',
      icon: Sun,
      isActive: location.pathname.startsWith('/daily'),
    },
    {
      to: '/story',
      label: 'Why I Created This?',
      sub: 'Ethiopian Origin Story',
      icon: BookOpen,
      isActive: location.pathname === '/story',
    },
    {
      to: '/settings',
      label: 'Account & Settings',
      sub: 'Preferences & Backup',
      icon: Settings,
      isActive: location.pathname === '/settings',
    },
  ];

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row text-ink antialiased">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-paper-alt border-b border-border-subtle sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/gp-monogram.png"
            alt="GP Logo"
            className="w-8 h-8 object-contain flex-shrink-0"
          />
          <span className="font-serif font-semibold text-ink text-sm">
            Guided Annual Planner
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-ink-muted hover:text-ink rounded-lg cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } md:flex flex-col justify-between w-full md:w-64 bg-paper-alt border-r border-border-subtle relative z-30 flex-shrink-0 md:min-h-screen`}
      >
        {/* Right Spiral Binding on Sidebar Edge (simulating notebook left edge) */}
        <div className="hidden md:block absolute -right-4 top-0 bottom-0 z-20">
          <SpiralBinding position="left" count={28} />
        </div>

        <div className="p-6">
          {/* Planner Emblem & Title */}
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/images/gp-monogram.png"
              alt="Official GP Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div>
              <span className="font-serif font-semibold text-ink text-base block leading-tight">
                Guided Annual Planner
              </span>
              <span className="text-[10px] text-ink-muted font-serif italic block">
                Official Edition
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Planner Sections">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all font-serif text-sm ${
                    item.isActive
                      ? 'bg-paper text-ink font-semibold shadow-xs border border-border-subtle'
                      : 'text-ink-muted hover:text-ink hover:bg-paper/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      item.isActive ? 'text-sage' : 'text-stone-400'
                    }`}
                  />
                  <div>
                    <span className="block leading-none">{item.label}</span>
                    <span className="text-[10px] text-ink-muted/80 font-sans block mt-1">
                      {item.sub}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {/* Daily Philosophy Quote */}
          <div className="mt-8 p-3.5 bg-paper rounded-xl border border-border-subtle/80">
            <div className="flex items-center gap-1.5 text-sage text-[10px] uppercase tracking-wider font-sans font-semibold mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Core Intention</span>
            </div>
            <p className="font-script text-ink-muted text-sm leading-snug">
              &ldquo;Small daily actions compound over time into lifetime legacy.&rdquo;
            </p>
          </div>
        </div>

        {/* User Account / Sign Out / Public Sign In Area */}
        <div className="p-4 border-t border-border-subtle bg-paper-alt space-y-2">
          {/* Sync Health Indicator */}
          {user && (syncStatus !== 'synced' || pendingSyncCount > 0) && (
            <div
              className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-[11px] font-sans border ${
                syncStatus === 'conflict'
                  ? 'bg-terracotta/10 border-terracotta/30 text-terracotta'
                  : syncStatus === 'offline' || !navigator.onLine
                  ? 'bg-gold-light/20 border-gold/40 text-amber-900'
                  : 'bg-sage-surface/60 border-sage/30 text-sage-dark'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                ) : syncStatus === 'conflict' ? (
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                ) : (
                  <CloudOff className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">
                  {syncStatus === 'syncing'
                    ? 'Syncing changes…'
                    : syncStatus === 'conflict'
                    ? 'Conflict detected'
                    : 'Offline mode'}
                </span>
              </div>
              {pendingSyncCount > 0 && (
                <span className="font-semibold ml-1 shrink-0 px-1.5 py-0.2 rounded-full bg-paper text-[10px]">
                  {pendingSyncCount}
                </span>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-border-strong flex-shrink-0"
                  />
                ) : (
                  <img
                    src="/images/gp-monogram.png"
                    alt="User Avatar"
                    className="w-7 h-7 rounded-full object-contain bg-sage-surface/60 border border-sage/40 p-0.5 flex-shrink-0"
                  />
                )}
                <div className="truncate text-left">
                  <span className="text-xs font-serif font-medium text-ink block truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-ink-muted block truncate font-sans">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogoutClick}
                disabled={loading}
                title="Sign Out"
                className="p-1.5 text-ink-muted hover:text-terracotta rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-sage hover:bg-sage-dark text-white rounded-xl text-xs font-serif font-medium transition-colors shadow-xs"
            >
              <span>Sign In / Get Started</span>
            </NavLink>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-paper flex flex-col">
        {children}
      </main>

      {/* Unsaved Edits Logout Guard Modal */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-paper border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 font-sans">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-gold-light/40 text-amber-900 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 id="logout-confirm-title" className="font-serif font-bold text-lg text-ink">
                  Unsynced Offline Changes Queued
                </h3>
                <p className="text-sm text-ink-muted mt-1">
                  You have <span className="font-semibold text-ink">{pendingSyncCount}</span> unsynced change{pendingSyncCount === 1 ? '' : 's'} queued on this device.
                </p>
                <p className="text-xs text-ink-muted mt-2">
                  They are safely stored in this browser's local database and will automatically resume syncing when you sign back into this account on this device.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleExportRescueBeforeLogout}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-sage text-sage hover:bg-sage-surface cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Rescue Backup First
              </button>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-ink hover:bg-paper-alt cursor-pointer"
                >
                  Stay Signed In
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-terracotta text-white hover:bg-terracotta-dark cursor-pointer shadow-xs"
                >
                  Log Out Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
