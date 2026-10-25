import React from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { BookOpen, Calendar, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const JournalLoginCard: React.FC = () => {
  const { loginWithGoogle, loginDev, loading, error, clearError } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      await loginWithGoogle(credentialResponse.credential);
    }
  };

  const handleGoogleError = () => {
    console.error('Google One-Tap / Pop-up Sign In Failed');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="w-full max-w-4xl mx-auto bg-paper-alt border border-border-subtle rounded-2xl shadow-paper-lg overflow-hidden flex flex-col md:flex-row motion-reduce:transition-none"
    >
      {/* Left Column: Visual Journal Preview & Philosophy */}
      <div className="w-full md:w-5/12 bg-paper p-8 border-b md:border-b-0 md:border-r border-border-subtle flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative dot-grid at the top */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-dot-grid opacity-30 pointer-events-none" />

        <div>
          {/* Brand & Origin Badge */}
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/images/gp-monogram.png"
              alt="Guided Annual Planner GP Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div>
              <span className="text-xs uppercase tracking-widest text-ink font-serif font-bold block leading-tight">
                Guided Annual Planner
              </span>
              <span className="text-[10px] text-ink-muted font-sans font-medium block">
                Mindful Growth Edition
              </span>
            </div>
          </div>

          <h1 className="font-serif text-3xl font-medium text-ink leading-tight mb-3">
            A sanctuary for intentional living.
          </h1>

          <p className="font-sans text-sm text-ink-muted leading-relaxed mb-6">
            Ordinary planners leave you with blank pages. This guided system turns your small, daily
            efforts into meaningful, compounding progress.
          </p>

          {/* Miniature Planner Elements Preview */}
          <div className="space-y-4 mb-6">
            {/* 1. Miniature Bookshelf Preview */}
            <div className="p-3 bg-paper-alt border border-border-subtle rounded-lg">
              <div className="flex items-center justify-between text-xs font-serif text-ink mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-sage" /> Monthly Bookshelf
                </span>
                <span className="text-[10px] text-sage font-sans font-semibold">4 / 5 Read</span>
              </div>
              <div className="flex items-end gap-1.5 h-10 px-1 pt-1 border-b-2 border-stone-400">
                <div className="w-3.5 h-9 bg-sage rounded-t-[2px] transition-all" title="Book 1" />
                <div className="w-4 h-8 bg-olive rounded-t-[2px]" title="Book 2" />
                <div className="w-3.5 h-9 bg-amber-700/80 rounded-t-[2px]" title="Book 3" />
                <div className="w-4 h-7 bg-stone-700 rounded-t-[2px]" title="Book 4" />
                <div className="w-3.5 h-8 border border-dashed border-stone-400 rounded-t-[2px] bg-paper" title="In progress" />
              </div>
            </div>

            {/* 2. Miniature Annual Calendar Consistency Preview */}
            <div className="p-3 bg-paper-alt border border-border-subtle rounded-lg">
              <div className="flex items-center justify-between text-xs font-serif text-ink mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-sage" /> Annual Habit Heatmap
                </span>
                <span className="text-[10px] text-ink-muted font-sans">October 2026</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }).map((_, i) => {
                  const isDone = i % 3 !== 0;
                  return (
                    <div
                      key={i}
                      className={`h-2.5 rounded-[2px] transition-colors ${
                        isDone ? 'bg-sage/80' : 'bg-paper-muted border border-border-subtle'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Philosophy Quotation */}
        <div className="pt-4 border-t border-border-subtle">
          <blockquote className="font-script text-lg text-ink-muted italic">
            &ldquo;Doing small things before taking major steps compounds over time to create a huge impact.&rdquo;
          </blockquote>
        </div>
      </div>

      {/* Right Column: Google Sign-In Card */}
      <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-paper-alt">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-surface border border-sage/30 text-sage text-xs font-medium mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Step 1: Open Your Journal</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-ink mb-2">
              Welcome to Your Space
            </h2>
            <p className="font-sans text-sm text-ink-muted">
              Sign in with your verified Google account to access your private annual calendar,
              monthly intentions, and weekly execution workspace.
            </p>
          </div>

          {/* Error Message if present */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mb-6 rounded-lg bg-terracotta-light border border-terracotta/30 flex items-start gap-3 text-sm text-terracotta"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Authentication Notice</p>
                <p className="text-xs text-ink-muted mt-0.5">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-xs underline hover:text-ink font-medium"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* Google Sign In Area */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-center">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-3 px-6 rounded-lg border border-border-strong bg-paper text-ink-muted text-sm animate-pulse w-full">
                  <div className="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin" />
                  <span>Entering your journal...</span>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    text="continue_with"
                    logo_alignment="left"
                    width="100%"
                  />
                </div>
              )}
            </div>

            <p className="text-center text-xs text-ink-light">
              We only request basic profile and verified email to maintain your private journal space.
            </p>

            {import.meta.env.DEV && (
              <div className="pt-3 border-t border-dashed border-border-subtle text-center">
                <button
                  type="button"
                  onClick={() => loginDev()}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-sage/10 hover:bg-sage/20 border border-sage/40 text-sage font-serif font-medium text-xs transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Enter Local Demo Journal (Developer Mode)</span>
                </button>
              </div>
            )}
          </div>

          {/* Privacy & Security Guarantees */}
          <div className="pt-6 border-t border-border-subtle space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <CheckCircle2 className="w-4 h-4 text-sage flex-shrink-0" />
              <span>Zero third-party tracking or advertising</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <ShieldCheck className="w-4 h-4 text-sage flex-shrink-0" />
              <span>Encrypted database-backed sessions with instant sign-out</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <CheckCircle2 className="w-4 h-4 text-sage flex-shrink-0" />
              <span>100% data ownership with 1-click JSON export anytime</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
