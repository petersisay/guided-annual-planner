import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Heart,
  Sun,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WeekStartPreference } from '@planner/shared';

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for onboarding
  const [themeOrWord, setThemeOrWord] = useState('');
  const [intentionText, setIntentionText] = useState('');
  const [weekStart, setWeekStart] = useState<WeekStartPreference>(
    user?.preferences?.weekStart || 'monday'
  );
  const [theme, setTheme] = useState<'paper-warm' | 'paper-editorial'>(
    user?.preferences?.theme || 'paper-warm'
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    user?.preferences?.prefersReducedMotion || false
  );

  const currentYear = new Date().getFullYear();

  const saveOnboarding = async (status: 'completed' | 'skipped') => {
    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/v1/user/onboarding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          preferences: {
            weekStart,
            theme,
            prefersReducedMotion,
            defaultYear: currentYear,
          },
          annualIntention:
            status === 'completed' && (themeOrWord.trim() || intentionText.trim())
              ? {
                  year: currentYear,
                  themeOrWord: themeOrWord.trim(),
                  intentionText: intentionText.trim(),
                }
              : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Failed to save onboarding progress');
      }

      await refreshUser();
      navigate('/annual');
    } catch (err: unknown) {
      console.error('Onboarding save error:', err);
      setError(err instanceof Error ? err.message : 'Connection error while saving onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      saveOnboarding('completed');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    saveOnboarding('skipped');
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased">
      {/* Top Bar with Brand & Skip Option */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/gp-monogram.png"
            alt="GP Monogram"
            className="w-8 h-8 object-contain"
          />
          <div>
            <span className="font-serif font-semibold text-ink text-sm block leading-none">
              Guided Annual Planner
            </span>
            <span className="text-[10px] text-ink-muted font-serif italic">
              First-Time Journey Setup
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting}
          className="text-xs font-serif text-ink-muted hover:text-ink cursor-pointer flex items-center gap-1 transition-colors px-2 py-1 rounded"
        >
          <span>Skip to Planner</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Step Container */}
      <div className="max-w-2xl mx-auto w-full my-auto py-8">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-8" aria-label={`Step ${step} of 5`}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-sage'
                  : s < step
                  ? 'w-2 bg-sage/60'
                  : 'w-2 bg-stone-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta text-xs font-serif rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="bg-paper-alt border border-border-subtle rounded-3xl p-6 sm:p-10 shadow-paper space-y-6">
          {/* Step 1: Welcome & Philosophy */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 rounded-full bg-sage-surface border border-sage/30 text-sage mx-auto flex items-center justify-center">
                <Compass className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-medium text-ink">
                  Welcome to Your Guided Sanctuary
                </h1>
                <p className="font-serif text-sm sm:text-base text-ink-muted leading-relaxed max-w-lg mx-auto">
                  A journal designed to slow down the rush of modern life. Here, every day connects to a weekly rhythm,
                  a monthly vision, and an annual horizon.
                </p>
              </div>

              <div className="p-6 bg-paper border border-border-subtle rounded-2xl text-left space-y-3">
                <span className="text-[11px] font-serif uppercase tracking-wider text-sage font-semibold block">
                  Our Guiding Principle
                </span>
                <blockquote className="font-serif text-base sm:text-lg text-ink italic leading-snug">
                  &ldquo;Doing small things before taking major steps compounds over time to create a huge impact.&rdquo;
                </blockquote>
                <p className="text-xs font-serif text-ink-muted">
                  You do not need to do everything today. You only need to take three deliberate steps.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Annual Anchor */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-sage/10 text-sage mx-auto flex items-center justify-center mb-2">
                  <Compass className="w-6 h-6" />
                </div>
                <h2 className="font-serif text-2xl font-medium text-ink">
                  Anchor Your Year ({currentYear})
                </h2>
                <p className="font-serif text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
                  Select a single word or theme that will serve as your north star whenever decisions feel complex.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label
                    htmlFor="theme-input"
                    className="block text-xs font-serif uppercase tracking-wider text-ink font-semibold mb-1"
                  >
                    Word or Theme of the Year (Optional)
                  </label>
                  <input
                    id="theme-input"
                    type="text"
                    value={themeOrWord}
                    onChange={(e) => setThemeOrWord(e.target.value)}
                    placeholder="e.g., Clarity, Stillness, Courage, Deep Roots..."
                    className="w-full bg-paper border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-serif text-ink focus:outline-none focus:border-sage transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="intention-input"
                    className="block text-xs font-serif uppercase tracking-wider text-ink font-semibold mb-1"
                  >
                    Your Primary Annual Intention (Optional)
                  </label>
                  <textarea
                    id="intention-input"
                    value={intentionText}
                    onChange={(e) => setIntentionText(e.target.value)}
                    rows={3}
                    placeholder="e.g., Write every morning for 30 minutes without self-judgment..."
                    className="w-full bg-paper border border-border-subtle rounded-xl p-3 text-sm font-serif text-ink focus:outline-none focus:border-sage resize-none transition-colors"
                  />
                  <span className="text-[11px] font-serif text-ink-muted italic block mt-1">
                    You can refine, add to, or change this anytime in your Annual Horizon page.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Rhythms & Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-sage/10 text-sage mx-auto flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="font-serif text-2xl font-medium text-ink">
                  Personal Rhythm &amp; Preferences
                </h2>
                <p className="font-serif text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
                  Tailor the planner layout to your natural working week and visual preferences.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-ink font-semibold mb-2">
                    Week Start Day
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWeekStart('monday')}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        weekStart === 'monday'
                          ? 'bg-paper border-sage ring-1 ring-sage'
                          : 'bg-paper/50 border-border-subtle hover:bg-paper'
                      }`}
                    >
                      <span className="font-serif text-sm font-medium block text-ink">
                        Monday (Recommended)
                      </span>
                      <span className="text-[11px] font-serif text-ink-muted block mt-0.5">
                        ISO 8601 standard &bull; Matches original physical planner spread
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWeekStart('sunday')}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        weekStart === 'sunday'
                          ? 'bg-paper border-sage ring-1 ring-sage'
                          : 'bg-paper/50 border-border-subtle hover:bg-paper'
                      }`}
                    >
                      <span className="font-serif text-sm font-medium block text-ink">
                        Sunday
                      </span>
                      <span className="text-[11px] font-serif text-ink-muted block mt-0.5">
                        Traditional calendar week start
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-serif uppercase tracking-wider text-ink font-semibold mb-2">
                    Visual Warmth
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('paper-warm')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        theme === 'paper-warm'
                          ? 'bg-paper border-sage ring-1 ring-sage'
                          : 'bg-paper/50 border-border-subtle'
                      }`}
                    >
                      <span className="font-serif text-sm font-medium text-ink block">
                        Warm Linen
                      </span>
                      <span className="text-[11px] font-serif text-ink-muted block">
                        Warm cream (#FDFBF7)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('paper-editorial')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        theme === 'paper-editorial'
                          ? 'bg-paper border-sage ring-1 ring-sage'
                          : 'bg-paper/50 border-border-subtle'
                      }`}
                    >
                      <span className="font-serif text-sm font-medium text-ink block">
                        Classic Editorial
                      </span>
                      <span className="text-[11px] font-serif text-ink-muted block">
                        Crisp paper (#F7F5F0)
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-paper border border-border-subtle">
                  <div>
                    <span className="font-serif text-xs font-medium text-ink block">
                      Reduce Motion
                    </span>
                    <span className="text-[11px] font-serif text-ink-muted block">
                      Honor prefers-reduced-motion preferences
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefersReducedMotion}
                    onChange={(e) => setPrefersReducedMotion(e.target.checked)}
                    className="w-4 h-4 text-sage rounded border-stone-300 focus:ring-sage cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: The Rule of 3 Walkthrough */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 rounded-full bg-sage/10 text-sage mx-auto flex items-center justify-center mb-2">
                <Sun className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-medium text-ink">
                  The Daily Rule of 3
                </h2>
                <p className="font-serif text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
                  Every morning, choose exactly three core priorities. These three items automatically flow into your weekly view.
                </p>
              </div>

              <div className="p-6 bg-paper border border-border-subtle rounded-2xl text-left space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-sage text-white text-xs font-serif flex items-center justify-center font-bold">
                      1
                    </span>
                    <span className="text-sm font-serif text-ink">
                      The Needle Mover &bull; High impact, focused effort
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-sage text-white text-xs font-serif flex items-center justify-center font-bold">
                      2
                    </span>
                    <span className="text-sm font-serif text-ink">
                      The Commitment &bull; Deliverable or promise kept
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-sage text-white text-xs font-serif flex items-center justify-center font-bold">
                      3
                    </span>
                    <span className="text-sm font-serif text-ink">
                      The Nourishment &bull; Space for health, stillness, or learning
                    </span>
                  </div>
                </div>

                <div className="border-t border-border-subtle pt-3 flex items-center gap-2 text-xs font-serif text-sage">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Accompanied by 3 gifts of gratitude and evening reflection.</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Ready to Begin */}
          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 rounded-full bg-sage-surface border border-sage/30 text-sage mx-auto flex items-center justify-center">
                <Heart className="w-7 h-7 fill-sage/20" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink">
                  You Are Ready
                </h2>
                <p className="font-serif text-sm sm:text-base text-ink-muted max-w-md mx-auto leading-relaxed">
                  Your guided sanctuary is prepared. Step inside with patience, kindness toward yourself, and deliberate presence.
                </p>
              </div>

              <div className="p-5 bg-paper rounded-2xl border border-border-subtle text-left space-y-2 text-xs font-serif text-ink-muted">
                <div className="flex items-center gap-2 text-ink font-medium">
                  <CheckCircle2 className="w-4 h-4 text-sage" />
                  <span>Your preferences are stored securely.</span>
                </div>
                <p className="pl-6">
                  You can change your week start, theme, or revisit this guide anytime in <strong>Account Settings</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-serif text-ink-muted hover:text-ink cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-sage hover:bg-sage-dark text-white rounded-xl font-serif text-sm font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <span>{step === 5 ? (submitting ? 'Entering...' : 'Enter Planner') : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center text-[11px] font-serif text-ink-muted pb-2">
        Guided Annual Planner &bull; Mindful Living from Addis Ababa
      </div>
    </div>
  );
};
