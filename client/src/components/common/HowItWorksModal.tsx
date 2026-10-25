import React from 'react';
import { X, Calendar, CalendarDays, LayoutGrid, Sun, CheckCircle2, ShieldCheck, Heart, BookOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

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
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 id="how-it-works-title" className="font-serif text-lg font-semibold text-ink leading-tight">
                {t.howItWorks}
              </h2>
              <p className="text-xs font-serif text-ink-muted">
                {t.howItWorksSub}
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
              <span>{t.howItWorksWhatIs}</span>
            </h3>
            <p className="text-xs font-serif text-ink leading-relaxed">
              {t.howItWorksWhatIsDesc}
            </p>
          </div>

          {/* 4 Simple Steps */}
          <div className="space-y-3">
            <h4 className="font-serif text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {t.howItWorksFourStepRhythm}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-paper border border-border-subtle space-y-1.5">
                <div className="flex items-center gap-2 text-sage font-serif font-semibold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>{t.howItWorksStep1Title}</span>
                </div>
                <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                  {t.howItWorksStep1Desc}
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-paper border border-border-subtle space-y-1.5">
                <div className="flex items-center gap-2 text-sage font-serif font-semibold text-xs">
                  <CalendarDays className="w-4 h-4" />
                  <span>{t.howItWorksStep2Title}</span>
                </div>
                <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                  {t.howItWorksStep2Desc}
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-paper border border-border-subtle space-y-1.5">
                <div className="flex items-center gap-2 text-sage font-serif font-semibold text-xs">
                  <LayoutGrid className="w-4 h-4" />
                  <span>{t.howItWorksStep3Title}</span>
                </div>
                <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                  {t.howItWorksStep3Desc}
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl bg-paper border border-border-subtle space-y-1.5">
                <div className="flex items-center gap-2 text-sage font-serif font-semibold text-xs">
                  <Sun className="w-4 h-4" />
                  <span>{t.howItWorksStep4Title}</span>
                </div>
                <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                  {t.howItWorksStep4Desc}
                </p>
              </div>
            </div>
          </div>

          {/* The Golden Rule */}
          <div className="p-4 rounded-xl bg-paper border border-border-subtle space-y-2">
            <h4 className="font-serif text-xs font-semibold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest" />
              <span>{t.howItWorksRuleOf3Title}</span>
            </h4>
            <p className="text-xs font-serif text-ink-muted leading-relaxed">
              {t.howItWorksRuleOf3Desc}
            </p>
          </div>

          {/* Privacy & Backup Note */}
          <div className="p-4 rounded-xl bg-paper border border-border-subtle flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-serif text-xs font-semibold text-ink">
                {t.howItWorksPrivacyTitle}
              </h4>
              <p className="text-[12px] font-serif text-ink-muted leading-relaxed">
                {t.howItWorksPrivacyDesc}
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
            {t.howItWorksGotIt}
          </button>
        </div>
      </div>
    </div>
  );
};
