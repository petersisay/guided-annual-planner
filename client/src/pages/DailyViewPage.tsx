import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import {
  DailyPlan,
  DailyContext,
  isValidDateStr,
  getPreviousDay,
  getNextDay,
  formatDisplayDate,
  getDayOfWeekName,
} from '@planner/shared';
import { PlannerLayout } from '../components/layout/PlannerLayout';
import { DailyPrioritiesAndTasks } from '../components/daily/DailyPrioritiesAndTasks';
import { DailyScheduleBlocks } from '../components/daily/DailyScheduleBlocks';
import { DailyJournalSection } from '../components/daily/DailyJournalSection';
import { DailyContextSummary } from '../components/daily/DailyContextSummary';
import { RuledInput } from '../components/journal/RuledInput';
import { SaveStatusBadge } from '../components/common/SaveStatusBadge';
import { ConflictResolutionModal } from '../components/common/ConflictResolutionModal';
import { PageLoadingState, PageErrorState } from '../components/common/PageStatusBanner';
import { saveDailyPlanToLocalStorage } from '../utils/localStorageBackup';
import { getCachedRecord, saveCachedRecord } from '../utils/offlineDb';
import { syncManager } from '../services/syncManager';
import { ConflictResolutionStrategy } from '@planner/shared';
import { useAuth } from '../context/AuthContext';
import { usePlanAutosave } from '../hooks/usePlanAutosave';

function getTodayIsoString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DailyViewPage: React.FC = () => {
  const { date: paramDate } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const activeDate = paramDate && isValidDateStr(paramDate) ? paramDate : getTodayIsoString();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [context, setContext] = useState<DailyContext>({
    habits: [],
    monthlyMustDos: [],
  });

  const [yearNum, monthNum] = activeDate.split('-').map(Number);

  const [showConflictModal, setShowConflictModal] = useState(false);

  const saveDailyUpdates = useCallback(
    async (updates: Partial<DailyPlan>): Promise<DailyPlan> => {
      const res = await fetch(`/api/v1/planner/daily/${activeDate}`, {
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
        throw new Error(errorData?.error?.message || 'Failed to save daily updates');
      }

      const data = await res.json();
      if (data.plan && user) {
        saveDailyPlanToLocalStorage(activeDate, data.plan, {
          id: user.id,
          name: user.name,
          email: user.email,
        });
        saveCachedRecord(user.id, 'daily', activeDate, data.plan, data.plan.updatedAt);
      }
      return data.plan;
    },
    [activeDate, user]
  );

  const {
    plan,
    setConfirmedPlan,
    saveStatus,
    saveError,
    activeConflict,
    triggerSave,
    retryLastSave,
  } = usePlanAutosave<DailyPlan>(null, {
    saveFn: saveDailyUpdates,
    entityType: 'daily',
    entityKey: activeDate,
    userId: user?.id,
    endpoint: `/api/v1/planner/daily/${activeDate}`,
    method: 'PUT',
  });

  const fetchDailyPlan = useCallback(
    async (dateStr: string) => {
      try {
        setLoading(true);
        setFetchError(null);

        // Check offline cache first if offline
        if (!navigator.onLine && user) {
          const cached = await getCachedRecord<DailyPlan>(user.id, 'daily', dateStr);
          if (cached) {
            setConfirmedPlan(cached.data);
            setLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/v1/planner/daily/${dateStr}`, {
          headers: { 'X-Planner-Client': 'WebApp' },
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setConfirmedPlan(data.plan);
          if (data.context) {
            setContext(data.context);
          }
          if (data.plan && user) {
            saveDailyPlanToLocalStorage(dateStr, data.plan, {
              id: user.id,
              name: user.name,
              email: user.email,
            });
            saveCachedRecord(user.id, 'daily', dateStr, data.plan, data.plan.updatedAt);
          }
        } else {
          // Check cached record fallback
          if (user) {
            const cached = await getCachedRecord<DailyPlan>(user.id, 'daily', dateStr);
            if (cached) {
              setConfirmedPlan(cached.data);
              return;
            }
          }
          setFetchError(`Unable to open daily page for ${dateStr}.`);
        }
      } catch (err) {
        console.error('Failed to load daily plan:', err);
        if (user) {
          const cached = await getCachedRecord<DailyPlan>(user.id, 'daily', dateStr);
          if (cached) {
            setConfirmedPlan(cached.data);
            return;
          }
        }
        setFetchError('Connection error while loading your daily page.');
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
      setConfirmedPlan(activeConflict.serverVersion as DailyPlan);
    } else if (strategy === 'combine' && mergedData) {
      await triggerSave(mergedData);
    } else if (strategy === 'keep_local' && plan) {
      await triggerSave({ ...plan });
    }
    setShowConflictModal(false);
  };

  useEffect(() => {
    fetchDailyPlan(activeDate);
  }, [activeDate, fetchDailyPlan]);

  const handlePrevDay = () => {
    const prev = getPreviousDay(activeDate);
    navigate(`/daily/${prev}`);
  };

  const handleNextDay = () => {
    const next = getNextDay(activeDate);
    navigate(`/daily/${next}`);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    if (isValidDateStr(selected)) {
      navigate(`/daily/${selected}`);
    }
  };

  const dayOfWeek = getDayOfWeekName(activeDate);
  const displayDateStr = formatDisplayDate(activeDate);

  return (
    <PlannerLayout currentYear={yearNum}>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Date Navigator Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevDay}
              title="Previous Day"
              aria-label="Navigate to previous day"
              className="p-1.5 text-ink-muted hover:text-ink rounded-lg bg-paper-alt border border-border-subtle hover:bg-paper transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-semibold text-ink leading-none">
                  {dayOfWeek}, {displayDateStr}
                </h1>
                {/* Native Accessible Date Picker */}
                <input
                  type="date"
                  value={activeDate}
                  onChange={handleDatePickerChange}
                  aria-label="Select date"
                  className="w-7 h-7 opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-0 text-transparent focus:outline-none focus:ring-1 focus:ring-sage rounded"
                  title="Pick a specific date"
                />
              </div>
              <span className="text-[11px] text-ink-muted font-serif">
                Daily Focus &bull; Rule of 3 &bull; Evening Reflection
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              title="Next Day"
              aria-label="Navigate to next day"
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

        {/* Loading and Error States */}
        {loading ? (
          <PageLoadingState message={`Opening daily journal for ${displayDateStr}...`} />
        ) : fetchError ? (
          <PageErrorState
            title="Failed to Load Daily Journal"
            message={fetchError}
            onRetry={() => fetchDailyPlan(activeDate)}
          />
        ) : plan ? (
          <div className="space-y-6">
            {/* Daily Intention Banner */}
            <div className="bg-paper-alt border border-border-subtle rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-4 h-4 text-sage" />
                <label
                  htmlFor="daily-intention"
                  className="font-serif text-sm font-semibold text-ink"
                >
                  Today&apos;s Core Intention &bull; Focus Word
                </label>
              </div>
              <RuledInput
                value={plan.intention || ''}
                onChange={(val) => triggerSave({ intention: val })}
                placeholder="What energy, mindset, or single purpose defines today?"
                className="text-base"
              />
            </div>

            {/* 2-Column Responsive Spread */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Priorities & Schedule (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <DailyPrioritiesAndTasks
                  primaryPriorities={plan.primaryPriorities || []}
                  additionalTasks={plan.additionalTasks || []}
                  onUpdatePriorities={(primaryPriorities) =>
                    triggerSave({ primaryPriorities: primaryPriorities as [any, any, any] })
                  }
                  onUpdateAdditionalTasks={(additionalTasks) =>
                    triggerSave({ additionalTasks })
                  }
                />

                <DailyScheduleBlocks
                  schedule={plan.schedule || []}
                  onUpdateSchedule={(schedule) => triggerSave({ schedule })}
                />
              </div>

              {/* Right Column: Journal, Gratitude & Context Summary (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <DailyJournalSection
                  journal={plan.journal}
                  reflection={plan.reflection || ''}
                  onUpdateJournal={(journal) => triggerSave({ journal })}
                  onUpdateReflection={(reflection) => triggerSave({ reflection })}
                />

                <DailyContextSummary
                  context={context}
                  year={yearNum}
                  month={monthNum}
                />
              </div>
            </div>
          </div>
        ) : null}

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
