import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, BookOpen, Heart } from 'lucide-react';
import { getMonthName } from '@planner/shared';
import { PlannerLayout } from '../components/layout/PlannerLayout';
import { MonthlyDashboard } from '../components/monthly/MonthlyDashboard';
import { MonthlyCalendarGrid } from '../components/monthly/MonthlyCalendarGrid';
import { MoodTrackerHeatmap } from '../components/annual/MoodTrackerHeatmap';
import { HabitTrackerHeatmap } from '../components/annual/HabitTrackerHeatmap';
import { saveMonthlyPlanToLocalStorage } from '../utils/localStorageBackup';
import { getCachedRecord, saveCachedRecord } from '../utils/offlineDb';
import { syncManager } from '../services/syncManager';
import { ConflictResolutionModal } from '../components/common/ConflictResolutionModal';
import { useAuth } from '../context/AuthContext';
import { usePlanAutosave } from '../hooks/usePlanAutosave';
import { SaveStatusBadge } from '../components/common/SaveStatusBadge';
import { PageLoadingState, PageErrorState, PageEmptyState } from '../components/common/PageStatusBanner';

export const MonthlyViewPage = () => {
  const { year: paramYear, month: paramMonth } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentYear = paramYear ? parseInt(paramYear, 10) : new Date().getFullYear();
  const currentMonth = paramMonth ? parseInt(paramMonth, 10) : new Date().getMonth() + 1;

  const [viewMode, setViewMode] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const monthName = getMonthName(currentMonth);
  const monthKey = `${currentYear}-${currentMonth}`;

  const saveMonthlyUpdates = useCallback(
    async (updates) => {
      const res = await fetch(`/api/v1/planner/monthly/${currentYear}/${currentMonth}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Failed to save monthly updates');
      }

      const data = await res.json();
      if (data.plan && user) {
        saveMonthlyPlanToLocalStorage(currentYear, currentMonth, data.plan, {
          id: user.id,
          name: user.name,
          email: user.email,
        });
        saveCachedRecord(user.id, 'monthly', monthKey, data.plan, data.plan.updatedAt);
      }
      return data.plan;
    },
    [currentYear, currentMonth, user, monthKey]
  );

  const {
    plan,
    setConfirmedPlan,
    saveStatus,
    saveError,
    activeConflict,
    triggerSave,
    retryLastSave,
  } = usePlanAutosave(null, {
    saveFn: saveMonthlyUpdates,
    entityType: 'monthly',
    entityKey: monthKey,
    userId: user?.id,
    endpoint: `/api/v1/planner/monthly/${currentYear}/${currentMonth}`,
    method: 'PUT',
  });

  const fetchMonthlyPlan = useCallback(
    async (y, m) => {
      const key = `${y}-${m}`;
      try {
        setLoading(true);
        setFetchError(null);

        // Offline first check
        if (!navigator.onLine && user) {
          const cached = await getCachedRecord(user.id, 'monthly', key);
          if (cached) {
            setConfirmedPlan(cached.data);
            setLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/v1/planner/monthly/${y}/${m}`, {
          headers: { 'X-Planner-Client': 'WebApp' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setConfirmedPlan(data.plan);
          if (data.plan && user) {
            saveMonthlyPlanToLocalStorage(y, m, data.plan, {
              id: user.id,
              name: user.name,
              email: user.email,
            });
            saveCachedRecord(user.id, 'monthly', key, data.plan, data.plan.updatedAt);
          }
        } else {
          if (user) {
            const cached = await getCachedRecord(user.id, 'monthly', key);
            if (cached) {
              setConfirmedPlan(cached.data);
              return;
            }
          }
          setFetchError(`Unable to load monthly plan for ${getMonthName(m)} ${y}.`);
        }
      } catch (err) {
        console.error('Failed to load monthly plan:', err);
        if (user) {
          const cached = await getCachedRecord(user.id, 'monthly', key);
          if (cached) {
            setConfirmedPlan(cached.data);
            return;
          }
        }
        setFetchError('Connection error while retrieving your monthly plan.');
      } finally {
        setLoading(false);
      }
    },
    [setConfirmedPlan, user]
  );

  const handleResolveConflict = async (strategy, mergedData) => {
    if (strategy === 'keep_server' && activeConflict?.serverVersion) {
      setConfirmedPlan(activeConflict.serverVersion);
    } else if (strategy === 'combine' && mergedData) {
      await triggerSave(mergedData);
    } else if (strategy === 'keep_local' && plan) {
      await triggerSave({ ...plan });
    }
    setShowConflictModal(false);
  };

  useEffect(() => {
    fetchMonthlyPlan(currentYear, currentMonth);
  }, [currentYear, currentMonth, fetchMonthlyPlan]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      navigate(`/monthly/${currentYear - 1}/12`);
    } else {
      navigate(`/monthly/${currentYear}/${currentMonth - 1}`);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      navigate(`/monthly/${currentYear + 1}/1`);
    } else {
      navigate(`/monthly/${currentYear}/${currentMonth + 1}`);
    }
  };

  return (
    <PlannerLayout currentYear={currentYear}>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Month Navigation & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          {/* Month Navigator */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              aria-label="Navigate to previous month"
              className="p-2 text-forest bg-paper-alt hover:bg-sage hover:text-white rounded-xl border border-sage/20 hover:border-sage transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>

            <div className="text-left">
              <h1 className="font-serif text-2xl font-semibold text-ink leading-none">
                {monthName} {currentYear}
              </h1>
              <span className="text-[11px] text-ink-muted font-serif">
                Month {currentMonth} of 12 &bull; Intentional Living
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              aria-label="Navigate to next month"
              className="p-2 text-forest bg-paper-alt hover:bg-sage hover:text-white rounded-xl border border-sage/20 hover:border-sage transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* View Mode Toggle Buttons and Live Save Feedback */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-paper-alt p-1.5 rounded-2xl border-2 border-border-subtle shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className={`group inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-serif font-semibold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                  viewMode === 'dashboard'
                    ? 'btn-tab-active bg-forest text-white shadow-md border-2 border-forest ring-2 ring-forest/20'
                    : 'btn-tab-inactive bg-paper border-2 border-border-subtle text-ink hover:text-forest hover:bg-sage-surface hover:border-sage/50 shadow-2xs'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 transition-colors ${viewMode === 'dashboard' ? 'text-white' : 'text-forest/70 group-hover:text-forest'}`} />
                <span className={viewMode === 'dashboard' ? 'text-white font-bold tracking-wide' : 'text-ink font-semibold group-hover:text-forest'}>Dashboard (Must-Do &amp; Books)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`group inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-serif font-semibold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                  viewMode === 'grid'
                    ? 'btn-tab-active bg-forest text-white shadow-md border-2 border-forest ring-2 ring-forest/20'
                    : 'btn-tab-inactive bg-paper border-2 border-border-subtle text-ink hover:text-forest hover:bg-sage-surface hover:border-sage/50 shadow-2xs'
                }`}
              >
                <Calendar className={`w-4 h-4 transition-colors ${viewMode === 'grid' ? 'text-white' : 'text-forest/70 group-hover:text-forest'}`} />
                <span className={viewMode === 'grid' ? 'text-white font-bold tracking-wide' : 'text-ink font-semibold group-hover:text-forest'}>Calendar Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('trackers')}
                className={`group inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-serif font-semibold transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                  viewMode === 'trackers'
                    ? 'btn-tab-active bg-forest text-white shadow-md border-2 border-forest ring-2 ring-forest/20'
                    : 'btn-tab-inactive bg-paper border-2 border-border-subtle text-ink hover:text-forest hover:bg-sage-surface hover:border-sage/50 shadow-2xs'
                }`}
              >
                <Heart className={`w-4 h-4 transition-colors ${viewMode === 'trackers' ? 'text-white' : 'text-forest/70 group-hover:text-forest'}`} />
                <span className={viewMode === 'trackers' ? 'text-white font-bold tracking-wide' : 'text-ink font-semibold group-hover:text-forest'}>Trackers</span>
              </button>
            </div>

            {/* Accessible Live Save Status Badge */}
            <SaveStatusBadge
              status={saveStatus}
              errorMessage={saveError}
              onRetry={retryLastSave}
              onReviewConflict={() => setShowConflictModal(true)}
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <PageLoadingState message={`Opening ${monthName} ${currentYear}...`} />
        ) : fetchError ? (
          <PageErrorState
            title="Failed to Load Monthly Spread"
            message={fetchError}
            onRetry={() => fetchMonthlyPlan(currentYear, currentMonth)}
          />
        ) : plan ? (
          <>
            {viewMode === 'dashboard' && (
              <MonthlyDashboard
                plan={plan}
                onUpdate={triggerSave}
                monthName={monthName}
                year={currentYear}
              />
            )}

            {viewMode === 'grid' && (
              <MonthlyCalendarGrid
                year={currentYear}
                month={currentMonth}
                calendarNotes={plan.calendarNotes || {}}
                onUpdateNotes={(notes) => triggerSave({ calendarNotes: notes })}
              />
            )}

            {viewMode === 'trackers' && (
              <div className="space-y-8">
                <div className="p-4 bg-paper-alt border border-border-subtle rounded-xl flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-sage flex-shrink-0" />
                  <p className="font-serif text-xs text-ink-muted">
                    Your monthly habit consistency and daily emotions automatically aggregate into your
                    annual journal below, ensuring zero duplicate records.
                  </p>
                </div>
                <HabitTrackerHeatmap year={currentYear} />
                <MoodTrackerHeatmap year={currentYear} />
              </div>
            )}
          </>
        ) : (
          <PageEmptyState
            title="Empty Month Spread"
            message="No journal record found for this month. Click below to initialize your planner."
          />
        )}

        {/* Conflict Resolution Modal */}
        <ConflictResolutionModal
          isOpen={showConflictModal || saveStatus === 'conflict'}
          conflict={activeConflict}
          localData={plan}
          onResolve={handleResolveConflict}
          onClose={() => setShowConflictModal(false)}
          onExportRescueBackup={() => {
            if (user?.id) {
              syncManager.exportUnsyncedData(user.id);
            }
          }}
        />
      </div>
    </PlannerLayout>
  );
};
