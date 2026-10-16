import React from 'react';
import { X, Calendar, CalendarDays, LayoutGrid, Sun, CheckCircle2, ShieldCheck, Heart, Sparkles } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-paper-alt border border-border-strong rounded-2xl shadow-paper-xl max-h-[90vh] flex flex-col overflow-hidden text-ink"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-paper">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sage-surface border border-sage/40 flex items-center justify-center text-sage">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="how-it-works-title" className="font-serif text-lg font-semibold text-ink leading-tight">
                How This Planner Works
              </h2>
              <p className="text-xs font-serif text-ink-muted">
                A simple guide to calm, focused planning
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-alt rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Purpose Card */}
          <div className="p-4 rounded-xl bg-sage-surface/60 border border-sage/30 space-y-2">
            <h3 className="font-serif text-sm font-semibold text-ink flex items-center gap-2">
              <Heart className="w-4 h-4 text-sage" />
              <span>What is the Guided Annual Planner?</span>
            </h3>
            <p className="text-xs font-serif text-ink leading-relaxed">
              Most planner apps give you endless, stressful to-do lists that leave you feeling behind. 
              This planner is different: it is a <strong>calm, private journal</strong> designed to help you 
              focus on just <strong>3 meaningful priorities</strong> each day while keeping your bigger life dreams in sight.
            </p>
          </div>

          {/* 4 Simple Steps */}
          <div className="space-y-3">
            <h4 className="font-serif text-xs font-semibold uppercase tracking-wider text-ink-muted">
              The 4-Step Rhythm (From Big Dreams to Daily Action)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-paper border border-border-subtle space-y-1.5">
                <div className="flex items-center gap-2 text-sage font-serif font-semibold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>1. Yearly Goals</span>
                </div>
                <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                  Choose a theme word for your year (e.g., &ldquo;Growth&rdquo;, &ldquo;Peace&rdquo;) and write down 2–3 big goals for health, career, and relationships.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-paper border border-border-subtle space-y-1.5">
                <div className="flex items-center gap-2 text-sage font-serif font-semibold text-xs">
                  <CalendarDays className="w-4 h-4" />
                  <span>2. Monthly Planner</span>
                </div>
                <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                  Break big yearly goals into 1–3 concrete monthly milestones. Track books you read and habit streaks across the days.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-paper border border-border-subtle space-y-1.5">
                <div className="flex items-center gap-2 text-sage font-serif font-semibold text-xs">
                  <LayoutGrid className="w-4 h-4" />
                  <span>3. Weekly Planner</span>
                </div>
                <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                  Every Sunday or Monday, look ahead at your 7 days. Pick your top 3 weekly outcomes and check off habits like exercise or meditation.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl bg-paper border border-border-subtle space-y-1.5">
                <div className="flex items-center gap-2 text-sage font-serif font-semibold text-xs">
                  <Sun className="w-4 h-4" />
                  <span>4. Daily Journal</span>
                </div>
                <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                  Each morning, write your <strong>Top 3 Priorities</strong>. That&apos;s all you need to win the day. In the evening, write one thing you are grateful for.
                </p>
              </div>
            </div>
          </div>

          {/* The Golden Rule */}
          <div className="p-4 rounded-xl bg-paper border border-border-subtle space-y-2">
            <h4 className="font-serif text-xs font-semibold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest" />
              <span>The &ldquo;Rule of 3&rdquo; Secret</span>
            </h4>
            <p className="text-xs font-serif text-ink-muted leading-relaxed">
              If you have 10 priorities, you have none. By picking only <strong>three important tasks</strong> each morning, 
              you eliminate decision fatigue and feel genuine accomplishment by sunset.
            </p>
          </div>

          {/* Privacy & Backup Note */}
          <div className="p-4 rounded-xl bg-paper border border-border-subtle flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-serif text-xs font-semibold text-ink">
                Your Privacy &amp; Data Are Always Protected
              </h4>
              <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                Everything you write is saved automatically to your private account. It works even when your internet drops, 
                and you can download a full backup copy to your computer anytime from <strong>Settings &amp; Backup</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border-subtle bg-paper flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-sage hover:bg-sage-dark text-white rounded-xl text-xs font-serif font-medium transition-all shadow-xs cursor-pointer"
          >
            Got it, Let&apos;s Plan!
          </button>
        </div>
      </div>
    </div>
  );
};
