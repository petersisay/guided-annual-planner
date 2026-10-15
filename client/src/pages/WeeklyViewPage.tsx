import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeeklyPlan, getISOWeeksInYear, getISOWeekNumber } from '@planner/shared';
import { PlannerLayout } from '../components/layout/PlannerLayout';
import { WeeklyTaskList } from '../components/weekly/WeeklyTaskList';
import { WeeklyNotes } from '../components/weekly/WeeklyNotes';
import { saveWeeklyPlanToLocalStorage } from '../utils/localStorageBackup';
import { getCachedRecord, saveCachedRecord } from '../utils/offlineDb';
import { syncManager } from '../services/syncManager';
import { ConflictResolutionStrategy } from '@planner/shared';
import { ConflictResolutionModal } from '../components/common/ConflictResolutionModal';
import { useAuth } from '../context/AuthContext';
import { usePlanAutosave } from '../hooks/usePlanAutosave';
import { SaveStatusBadge } from '../components/common/SaveStatusBadge';
import { PageLoadingState, PageErrorState, PageEmptyState } from '../components/common/PageStatusBanner';

export const WeeklyViewPage: React.FC = () => {
  const { year: paramYear, week: paramWeek } = useParams<{ year: string; week: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const now = new Date();
  const currentYear = paramYear ? parseInt(paramYear, 10) : now.getFullYear();
  const currentWeek = paramWeek ? parseInt(paramWeek, 10) : getISOWeekNumber(now);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const maxWeeks = getISOWeeksInYear(currentYear);
  const weekKey = `${currentYear}-${currentWeek}`;

  const saveWeeklyUpdates = useCallback(
    async (updates: Partial<WeeklyPlan>): Promise<WeeklyPlan> => {
      const res = await fetch(`/api/v1/planner/weekly/${currentYear}/${currentWeek}`, {
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
        throw new Error(errorData?.error?.message || 'Failed to save weekly updates');
      }

      const data = await res.json();
      if (data.plan && user) {
        saveWeeklyPlanToLocalStorage(currentYear, currentWeek, data.plan, {
          id: user.id,
          name: user.name,
          email: user.email,
        });
        saveCachedRecord(user.id, 'weekly', weekKey, data.plan, data.plan.updatedAt);
      }
      return data.plan;
    },
    [currentYear, currentWeek, user, weekKey]
  );

  const {
    plan,
    setConfirmedPlan,
    saveStatus,
    saveError,
    activeConflict,
    triggerSave,
    retryLastSave,
  } = usePlanAutosave<WeeklyPlan>(null, {
    saveFn: saveWeeklyUpdates,
    entityType: 'weekly',
    entityKey: weekKey,
    userId: user?.id,
    endpoint: `/api/v1/planner/weekly/${currentYear}/${currentWeek}`,
    method: 'PUT',
  });

  const fetchWeeklyPlan = useCallback(
    async (y: number, w: number) => {
      const key = `${y}-${w}`;
      try {
        setLoading(true);
        setFetchError(null);

        // Offline first check
        if (!navigator.onLine && user) {
          const cached = await getCachedRecord<WeeklyPlan>(user.id, 'weekly', key);
          if (cached) {
            setConfirmedPlan(cached.data);
            setLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/v1/planner/weekly/${y}/${w}`, {
          headers: { 'X-Planner-Client': 'WebApp' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setConfirmedPlan(data.plan);
          if (data.plan && user) {
            saveWeeklyPlanToLocalStorage(y, w, data.plan, {
              id: user.id,
              name: user.name,
              email: user.email,
            });
            saveCachedRecord(user.id, 'weekly', key, data.plan, data.plan.updatedAt);
          }
        } else {
          if (user) {
            const cached = await getCachedRecord<WeeklyPlan>(user.id, 'weekly', key);
            if (cached) {
              setConfirmedPlan(cached.data);
              return;
            }
          }
          setFetchError(`Unable to open weekly spread for Week ${w}, ${y}.`);
        }
      } catch (err) {
        console.error('Failed to load weekly plan:', err);
        if (user) {
          const cached = await getCachedRecord<WeeklyPlan>(user.id, 'weekly', key);
          if (cached) {
            setConfirmedPlan(cached.data);
            return;
          }
        }
        setFetchError('Connection error while loading your weekly spread.');
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
      setConfirmedPlan(activeConflict.serverVersion as WeeklyPlan);
    } else if (strategy === 'combine' && mergedData) {
      await triggerSave(mergedData);
    } else if (strategy === 'keep_local' && plan) {
      await triggerSave({ ...plan });
    }
    setShowConflictModal(false);
  };

  useEffect(() => {
    fetchWeeklyPlan(currentYear, currentWeek);
  }, [currentYear, currentWeek, fetchWeeklyPlan]);

  const handlePrevWeek = () => {
    if (currentWeek <= 1) {
      const prevYear = currentYear - 1;
      const prevMax = getISOWeeksInYear(prevYear);
      navigate(`/weekly/${prevYear}/${prevMax}`);
    } else {
      navigate(`/weekly/${currentYear}/${currentWeek - 1}`);
    }
  };

  const handleNextWeek = () => {
    if (currentWeek >= maxWeeks) {
      navigate(`/weekly/${currentYear + 1}/1`);
    } else {
      navigate(`/weekly/${currentYear}/${currentWeek + 1}`);
    }
  };

  return (
    <PlannerLayout currentYear={currentYear}>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Week Navigator Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevWeek}
              title="Previous Week"
              aria-label="Navigate to previous week"
              className="p-1.5 text-ink-muted hover:text-ink rounded-lg bg-paper-alt border border-border-subtle hover:bg-paper transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div>
              <h1 className="font-serif text-2xl font-semibold text-ink leading-none">
                Week {currentWeek} &bull; {currentYear}
              </h1>
              <span className="text-[11px] text-ink-muted font-serif">
                ISO 8601 Monday Start &bull; Rule of 3 Execution Spread
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextWeek}
              title="Next Week"
              aria-label="Navigate to next week"
              className="p-1.5 text-ink-muted hover:text-ink rounded-lg bg-paper-alt border border-border-subtle hover:bg-paper transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <SaveStatusBadge
              status={saveStatus}
              errorMessage={saveError}
              onRetry={retryLastSave}
              onReviewConflict={() => setShowConflictModal(true)}
            />
          </div>
        </div>

        {/* 2-Page Journal Spread */}
        {loading ? (
          <PageLoadingState message={`Opening Week ${currentWeek} spread...`} />
        ) : fetchError ? (
          <PageErrorState
            title="Failed to Load Weekly Spread"
            message={fetchError}
            onRetry={() => fetchWeeklyPlan(currentYear, currentWeek)}
          />
        ) : plan ? (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-center">
            {/* Left Page (Weekly Tasks & Days - matching Reference Image 122758.png) */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <WeeklyTaskList
                days={plan.days || []}
                onUpdateDays={(days) => triggerSave({ days })}
                isoWeek={currentWeek}
                year={currentYear}
              />
            </div>

            {/* Right Page (Priorities, Reminder, Next Week, Notes - matching Reference Image 122831.png) */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <WeeklyNotes
                priorities={plan.priorities || []}
                reminder={plan.reminder || ''}
                nextWeek={plan.nextWeek || []}
                notes={plan.notes || ''}
                onUpdate={triggerSave}
              />
            </div>
          </div>
        ) : (
          <PageEmptyState
            title="Empty Weekly Spread"
            message="No journal record found for this week. Enter your first task to get started."
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
