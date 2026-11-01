import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Heart,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CalendarDays,
  LayoutGrid,
  BookOpen,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AnnualPlan, isLeapYear, getISOWeekNumber } from '@planner/shared';
import { YearCalendarGrid } from '../components/annual/YearCalendarGrid';
import { MoodTrackerHeatmap } from '../components/annual/MoodTrackerHeatmap';
import { HabitTrackerHeatmap } from '../components/annual/HabitTrackerHeatmap';
import { AnnualIntentionCard } from '../components/annual/AnnualIntentionCard';
import { AnnualReviewSection } from '../components/annual/AnnualReviewSection';
import { SpiralBinding } from '../components/journal/SpiralBinding';
import { saveAnnualPlanToLocalStorage } from '../utils/localStorageBackup';
import { getCachedRecord, saveCachedRecord } from '../utils/offlineDb';
import { syncManager } from '../services/syncManager';
import { ConflictResolutionStrategy } from '@planner/shared';
import { ConflictResolutionModal } from '../components/common/ConflictResolutionModal';
import { usePlanAutosave } from '../hooks/usePlanAutosave';
import { SaveStatusBadge } from '../components/common/SaveStatusBadge';
import { PageLoadingState, PageErrorState } from '../components/common/PageStatusBanner';
import { LanguageSelector } from '../components/common/LanguageSelector';

type ActiveTab = 'overview' | 'mood' | 'habits';

export const AnnualViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const yearKey = String(selectedYear);

  const saveAnnualUpdates = useCallback(
    async (updates: Partial<AnnualPlan>): Promise<AnnualPlan> => {
      const res = await fetch(`/api/v1/planner/year/${selectedYear}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'Failed to save annual updates');
      }

      const data = await res.json();
      if (data.plan && user) {
        saveAnnualPlanToLocalStorage(selectedYear, data.plan, {
          id: user.id,
          name: user.name,
          email: user.email,
        });
        saveCachedRecord(user.id, 'annual', yearKey, data.plan, data.plan.updatedAt);
      }
      return data.plan;
    },
    [selectedYear, user, yearKey]
  );

  const {
    plan: annualPlan,
    setConfirmedPlan,
    saveStatus,
    saveError,
    activeConflict,
    triggerSave: handleUpdatePlan,
    retryLastSave,
  } = usePlanAutosave<AnnualPlan>(null, {
    saveFn: saveAnnualUpdates,
    entityType: 'annual',
    entityKey: yearKey,
    userId: user?.id,
    endpoint: `/api/v1/planner/year/${selectedYear}`,
    method: 'PUT',
  });

  const fetchAnnualPlan = useCallback(
    async (year: number) => {
      const key = String(year);
      try {
        setLoading(true);
        setFetchError(null);

        // Offline first check
        if (!navigator.onLine && user) {
          const cached = await getCachedRecord<AnnualPlan>(user.id, 'annual', key);
          if (cached) {
            setConfirmedPlan(cached.data);
            setLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/v1/planner/year/${year}`, {
          headers: { 'X-Planner-Client': 'WebApp' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setConfirmedPlan(data.plan);
          if (data.plan && user) {
            saveAnnualPlanToLocalStorage(year, data.plan, {
              id: user.id,
              name: user.name,
              email: user.email,
            });
            saveCachedRecord(user.id, 'annual', key, data.plan, data.plan.updatedAt);
          }
        } else {
          if (user) {
            const cached = await getCachedRecord<AnnualPlan>(user.id, 'annual', key);
            if (cached) {
              setConfirmedPlan(cached.data);
              return;
            }
          }
          setFetchError(`Unable to load annual plan for year ${year}.`);
        }
      } catch (err) {
        console.error('Failed to load annual plan:', err);
        if (user) {
          const cached = await getCachedRecord<AnnualPlan>(user.id, 'annual', key);
          if (cached) {
            setConfirmedPlan(cached.data);
            return;
          }
        }
        setFetchError('Connection error while loading annual plan.');
      } finally {
        setLoading(false);
      }
    },
    [setConfirmedPlan, user]
  );

  const handleResolveConflict = async (
    strategy: ConflictResolutionStrategy,
    mergedData?: any
  ) => {
    if (strategy === 'keep_server' && activeConflict?.serverVersion) {
      setConfirmedPlan(activeConflict.serverVersion as AnnualPlan);
    } else if (strategy === 'combine' && mergedData) {
      await handleUpdatePlan(mergedData);
    } else if (strategy === 'keep_local' && annualPlan) {
      await handleUpdatePlan({ ...annualPlan });
    }
    setShowConflictModal(false);
  };

  useEffect(() => {
    fetchAnnualPlan(selectedYear);
  }, [selectedYear, fetchAnnualPlan]);

  const isLeap = isLeapYear(selectedYear);

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between">
      {/* Top Paper Header */}
      <header className="border-b border-border-subtle bg-paper-alt px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Ethiopian Origin Story Whisper */}
          <div className="flex items-center gap-3">
            <img
              src="/images/gp-monogram.png"
              alt="Guided Annual Planner GP Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-medium text-ink text-xl block leading-none">
                  Guided Annual Planner
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage/10 text-sage font-semibold uppercase tracking-wider">
                  {language === 'am' ? 'አስተዋይ የእድገት እትም' : 'Mindful Growth Edition'}
                </span>
              </div>
              <span className="text-[11px] text-ink-muted font-serif italic block mt-0.5">
                {language === 'am'
                  ? 'በዓላማ መኖር እና በዕለታዊ ጥረት ላይ የተመሠረተ'
                  : 'Rooted in intentional living & compounding daily craft'}
              </span>
            </div>
          </div>

          {/* Year Navigator Controls & Live Save Feedback */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="flex items-center justify-center gap-1.5 bg-paper border-2 border-sage/30 rounded-2xl p-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setSelectedYear((prev) => prev - 1)}
                className="p-2 text-forest bg-paper-alt hover:bg-sage hover:text-white rounded-xl border border-sage/20 hover:border-sage transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
                title="Previous Year"
                aria-label="Previous Year"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-2 px-3">
                <span className="font-serif text-xl font-bold text-ink tracking-wider">
                  {selectedYear}
                </span>
                {isLeap && (
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-md bg-sage-surface text-forest font-semibold border border-sage/30">
                    Leap Year (366 Days)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedYear((prev) => prev + 1)}
                className="p-2 text-forest bg-paper-alt hover:bg-sage hover:text-white rounded-xl border border-sage/20 hover:border-sage transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
                title="Next Year"
                aria-label="Next Year"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <SaveStatusBadge
              status={saveStatus}
              errorMessage={saveError}
              onRetry={retryLastSave}
              onReviewConflict={() => setShowConflictModal(true)}
            />
          </div>

          {/* User Account, Language Selector & Logout */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <LanguageSelector />
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full border-2 border-border-strong shadow-2xs"
              />
            )}
            <div className="hidden sm:block text-right">
              <span className="text-xs font-serif font-semibold text-ink block">{user?.name}</span>
              <span className="text-[10px] text-ink-muted block font-sans">{user?.email}</span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              disabled={authLoading}
              aria-label="Sign Out of Journal"
              className="group inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl border-2 border-rose-200 bg-rose-50/80 text-rose-800 hover:bg-rose-600 hover:text-white hover:border-rose-600 font-serif text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <LogOut className="w-4 h-4 text-rose-700 group-hover:text-white transition-colors" />
              <span>{language === 'am' ? 'ውጣ' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        {user?.preferences?.onboardingStatus === 'not_started' && (
          <div className="p-4 sm:p-5 bg-sage-surface border-2 border-sage/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <Compass className="w-5 h-5 text-sage flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-serif font-semibold text-sm text-ink block">
                  Welcome to Your Guided Annual Planner!
                </span>
                <span className="text-xs font-serif text-ink-muted block mt-0.5">
                  Take a 2-minute guided tour to set your year&apos;s anchor word, planning rhythms, and the Rule of 3.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              <Link
                to="/onboarding"
                className="px-4.5 py-2.5 bg-sage hover:bg-forest text-white rounded-xl text-xs sm:text-sm font-serif font-semibold transition-all shadow-xs hover:shadow-sm active:scale-95"
              >
                Start Guided Tour &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2 bg-paper-alt p-1.5 rounded-2xl border-2 border-border-subtle shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`group inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-serif font-semibold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                activeTab === 'overview'
                  ? 'btn-tab-active bg-forest text-white shadow-md border-2 border-forest ring-2 ring-forest/20'
                  : 'btn-tab-inactive bg-paper border-2 border-border-subtle text-ink hover:text-forest hover:bg-sage-surface hover:border-sage/50 shadow-2xs'
              }`}
            >
              <Calendar className={`w-4 h-4 transition-colors ${activeTab === 'overview' ? 'text-white' : 'text-forest/70 group-hover:text-forest'}`} />
              <span className={activeTab === 'overview' ? 'text-white font-bold tracking-wide' : 'text-ink font-semibold group-hover:text-forest'}>12-Month Calendar &amp; Goals</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mood')}
              className={`group inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-serif font-semibold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                activeTab === 'mood'
                  ? 'btn-tab-active bg-forest text-white shadow-md border-2 border-forest ring-2 ring-forest/20'
                  : 'btn-tab-inactive bg-paper border-2 border-border-subtle text-ink hover:text-forest hover:bg-sage-surface hover:border-sage/50 shadow-2xs'
              }`}
            >
              <Heart className={`w-4 h-4 transition-colors ${activeTab === 'mood' ? 'text-white' : 'text-forest/70 group-hover:text-forest'}`} />
              <span className={activeTab === 'mood' ? 'text-white font-bold tracking-wide' : 'text-ink font-semibold group-hover:text-forest'}>Daily Mood Tracker</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('habits')}
              className={`group inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-serif font-semibold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                activeTab === 'habits'
                  ? 'btn-tab-active bg-forest text-white shadow-md border-2 border-forest ring-2 ring-forest/20'
                  : 'btn-tab-inactive bg-paper border-2 border-border-subtle text-ink hover:text-forest hover:bg-sage-surface hover:border-sage/50 shadow-2xs'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 transition-colors ${activeTab === 'habits' ? 'text-white' : 'text-forest/70 group-hover:text-forest'}`} />
              <span className={activeTab === 'habits' ? 'text-white font-bold tracking-wide' : 'text-ink font-semibold group-hover:text-forest'}>Habits Tracker</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to={`/monthly/${selectedYear}/${new Date().getMonth() + 1}`}
              className="group inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-serif font-semibold bg-paper border-2 border-sage/30 text-forest hover:bg-sage hover:text-white hover:border-sage transition-all duration-150 shadow-xs hover:shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <CalendarDays className="w-4 h-4 text-sage group-hover:text-white transition-colors" />
              <span>Monthly Planner</span>
            </Link>
            <Link
              to={`/weekly/${selectedYear}/${getISOWeekNumber(new Date())}`}
              className="group inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-serif font-semibold bg-paper border-2 border-sage/30 text-forest hover:bg-sage hover:text-white hover:border-sage transition-all duration-150 shadow-xs hover:shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <LayoutGrid className="w-4 h-4 text-sage group-hover:text-white transition-colors" />
              <span>Weekly Spread</span>
            </Link>
            <Link
              to="/story"
              className="group inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-serif font-semibold bg-paper border-2 border-sage/30 text-forest hover:bg-sage hover:text-white hover:border-sage transition-all duration-150 shadow-xs hover:shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <BookOpen className="w-4 h-4 text-sage group-hover:text-white transition-colors" />
              <span>Origin Story</span>
            </Link>
          </div>
        </div>

        {/* Dynamic Tab Views */}
        {loading ? (
          <PageLoadingState message={`Opening ${selectedYear} Annual Horizon...`} />
        ) : fetchError ? (
          <PageErrorState
            title="Failed to Load Annual Horizon"
            message={fetchError}
            onRetry={() => fetchAnnualPlan(selectedYear)}
          />
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key={`overview-${selectedYear}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8 motion-reduce:transition-none"
              >
                {/* Year Theme & Core Intentions */}
                <AnnualIntentionCard
                  year={selectedYear}
                  plan={annualPlan}
                  onUpdatePlan={handleUpdatePlan}
                />

                {/* 12-Month Calendar Grid with Spiral Seam matching Reference Image 122958.png */}
                <div className="relative bg-paper border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-paper-lg overflow-hidden">
                  <div className="hidden lg:block absolute right-0 top-0 bottom-0 z-10 pointer-events-none">
                    <SpiralBinding position="right" count={28} />
                  </div>

                  <div className="lg:pr-8">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
                      <div>
                        <h3 className="font-serif text-xl text-ink font-semibold">
                          {selectedYear} Annual Horizon
                        </h3>
                        <p className="text-xs text-ink-muted font-serif">
                          Click any month to open its dedicated dashboard & calendar grid.
                        </p>
                      </div>
                      <span className="text-xs font-serif text-sage font-medium bg-sage/10 px-3 py-1 rounded-full border border-sage/20 self-start sm:self-auto">
                        {isLeap ? '366 Days' : '365 Days'}
                      </span>
                    </div>

                    <YearCalendarGrid
                      year={selectedYear}
                      onMonthClick={(month) => navigate(`/monthly/${selectedYear}/${month}`)}
                      onDateClick={(dateStr) => {
                        const d = new Date(dateStr);
                        const week = getISOWeekNumber(d);
                        navigate(`/weekly/${selectedYear}/${week}`);
                      }}
                    />
                  </div>
                </div>

                {/* Annual Retrospective & Reviews */}
                <AnnualReviewSection
                  year={selectedYear}
                  plan={annualPlan}
                  onUpdatePlan={handleUpdatePlan}
                />
              </motion.div>
            )}

            {activeTab === 'mood' && (
              <motion.div
                key={`mood-${selectedYear}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="motion-reduce:transition-none"
              >
                <MoodTrackerHeatmap year={selectedYear} />
              </motion.div>
            )}

            {activeTab === 'habits' && (
              <motion.div
                key={`habits-${selectedYear}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="motion-reduce:transition-none"
              >
                <HabitTrackerHeatmap year={selectedYear} />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Conflict Resolution Modal */}
        <ConflictResolutionModal
          isOpen={showConflictModal || saveStatus === 'conflict'}
          conflict={activeConflict}
          localData={annualPlan}
          onResolve={handleResolveConflict}
          onClose={() => setShowConflictModal(false)}
          onExportRescueBackup={() => {
            if (user?.id) {
              syncManager.exportUnsyncedData(user.id);
            }
          }}
        />
      </main>

      {/* Warm Journal Footer */}
      <footer className="border-t border-border-subtle py-6 bg-paper-alt text-center text-xs text-ink-muted font-serif">
        <p>
          Guided Annual Planner &bull; Crafted for deliberate personal growth &bull; {selectedYear}
        </p>
      </footer>
    </div>
  );
};
