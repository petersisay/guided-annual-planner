import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, BookOpen, Heart } from 'lucide-react';
import { MonthlyPlan, getMonthName } from '@planner/shared';
import { PlannerLayout } from '../components/layout/PlannerLayout';
import { MonthlyDashboard } from '../components/monthly/MonthlyDashboard';
import { MonthlyCalendarGrid } from '../components/monthly/MonthlyCalendarGrid';
import { MoodTrackerHeatmap } from '../components/annual/MoodTrackerHeatmap';
import { HabitTrackerHeatmap } from '../components/annual/HabitTrackerHeatmap';
import { saveMonthlyPlanToLocalStorage } from '../utils/localStorageBackup';
import { getCachedRecord, saveCachedRecord } from '../utils/offlineDb';
import { syncManager } from '../services/syncManager';
import { ConflictResolutionStrategy } from '@planner/shared';
import { ConflictResolutionModal } from '../components/common/ConflictResolutionModal';
import { useAuth } from '../context/AuthContext';
import { usePlanAutosave } from '../hooks/usePlanAutosave';
import { SaveStatusBadge } from '../components/common/SaveStatusBadge';
import { PageLoadingState, PageErrorState, PageEmptyState } from '../components/common/PageStatusBanner';

type ViewMode = 'dashboard' | 'grid' | 'trackers';

export const MonthlyViewPage: React.FC = () => {
  const { year: paramYear, month: paramMonth } = useParams<{ year: string; month: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentYear = paramYear ? parseInt(paramYear, 10) : new Date().getFullYear();
  const currentMonth = paramMonth ? parseInt(paramMonth, 10) : new Date().getMonth() + 1;

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const monthName = getMonthName(currentMonth);
  const monthKey = `${currentYear}-${currentMonth}`;

  const saveMonthlyUpdates = useCallback(
    async (updates: Partial<MonthlyPlan>): Promise<MonthlyPlan> => {
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
  } = usePlanAutosave<MonthlyPlan>(null, {
    saveFn: saveMonthlyUpdates,
    entityType: 'monthly',
    entityKey: monthKey,
    userId: user?.id,
    endpoint: `/api/v1/planner/monthly/${currentYear}/${currentMonth}`,
    method: 'PUT',
  });

  const fetchMonthlyPlan = useCallback(
    async (y: number, m: number) => {
      const key = `${y}-${m}`;
      try {
        setLoading(true);
        setFetchError(null);

        // Offline first check
        if (!navigator.onLine && user) {
          const cached = await getCachedRecord<MonthlyPlan>(user.id, 'monthly', key);
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
            const cached = await getCachedRecord<MonthlyPlan>(user.id, 'monthly', key);
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
          const cached = await getCachedRecord<MonthlyPlan>(user.id, 'monthly', key);
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

  const handleResolveConflict = async (
    strategy: ConflictResolutionStrategy,
    mergedData?: any
  ) => {
    if (strategy === 'keep_server' && activeConflict?.serverVersion) {
      setConfirmedPlan(activeConflict.serverVersion as MonthlyPlan);
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
              className="p-1.5 text-ink-muted hover:text-ink rounded-lg bg-paper-alt border border-border-subtle hover:bg-paper transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <ChevronLeft className="w-4 h-4" />
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
              className="p-1.5 text-ink-muted hover:text-ink rounded-lg bg-paper-alt border border-border-subtle hover:bg-paper transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle Buttons and Live Save Feedback */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-paper-alt p-1 rounded-xl border border-border-subtle shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition-all cursor-pointer ${
                  viewMode === 'dashboard'
                    ? 'bg-paper text-ink shadow-xs border border-border-subtle font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-sage" />
                <span>Dashboard (Must-Do & Books)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-paper text-ink shadow-xs border border-border-subtle font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-sage" />
                <span>Calendar Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('trackers')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition-all cursor-pointer ${
                  viewMode === 'trackers'
                    ? 'bg-paper text-ink shadow-xs border border-border-subtle font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-sage" />
                <span>Trackers</span>
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
