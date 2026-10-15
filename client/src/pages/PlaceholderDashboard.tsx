import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PlaceholderDashboard: React.FC = () => {
  const { user, logout, loading } = useAuth();

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-border-subtle bg-paper-alt px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/gp-monogram.png"
              alt="Guided Annual Planner GP Logo"
              className="w-9 h-9 object-contain flex-shrink-0"
            />
            <div>
              <span className="font-serif font-medium text-ink text-lg block leading-none">
                Guided Annual Planner
              </span>
              <span className="text-[10px] text-ink-muted uppercase tracking-wider">
                Official Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-border-strong"
              />
            )}
            <div className="hidden sm:block text-right">
              <span className="text-xs font-medium text-ink block">{user?.name}</span>
              <span className="text-[10px] text-ink-muted block">{user?.email}</span>
            </div>
            <button
              onClick={() => logout()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-ink hover:bg-paper font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-paper-alt border border-border-subtle rounded-2xl p-8 shadow-paper"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-surface text-sage text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1 Verified: Authentication & Core Architecture</span>
          </div>

          <h2 className="font-serif text-3xl font-medium text-ink mb-3">
            Welcome to your journal, {user?.name}.
          </h2>

          <p className="text-sm text-ink-muted leading-relaxed mb-8">
            Your Google authentication is validated and your secure database-backed session is
            active in MongoDB Atlas. Every record you create in upcoming phases will be strictly
            isolated to your personal account.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-paper rounded-xl border border-border-subtle">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-sage" />
                Session Status
              </div>
              <ul className="text-xs text-ink-muted space-y-1.5">
                <li>• <strong>Session Storage:</strong> MongoDB Atlas Database-backed</li>
                <li>• <strong>Cookie Security:</strong> HttpOnly, SameSite=Lax</li>
                <li>• <strong>Rolling Lifespan:</strong> 30 Days (auto-rotated)</li>
                <li>• <strong>Default Week Start:</strong> {user?.preferences?.weekStart || 'Monday'}</li>
                <li>• <strong>Default Currency:</strong> {user?.preferences?.defaultCurrency || 'USD'}</li>
              </ul>
            </div>

            <div className="p-4 bg-paper rounded-xl border border-border-subtle">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-sage" />
                Next Phase Readiness
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Phase 1 foundation is complete. Phase 2 will implement the 12-month calendar engine,
                daily mood tracking tiles, and annual habit consistency heatmaps based on Screenshot 5.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-4 text-center text-xs text-ink-light">
        Guided Annual Planner &bull; Phase 1 Implementation Complete
      </footer>
    </div>
  );
};
