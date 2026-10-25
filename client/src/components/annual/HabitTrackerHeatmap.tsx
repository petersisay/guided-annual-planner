import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, Edit2, X, Flame } from 'lucide-react';
import { Habit, getMonthName, getDaysInMonth, formatDateStr, isLeapYear } from '@planner/shared';
import { useAuth } from '../../context/AuthContext';
import { syncManager } from '../../services/syncManager';

interface HabitTrackerHeatmapProps {
  year: number;
}

const HABIT_COLOR_SWATCHES = [
  { name: 'Sage', hex: '#7A9A48' },
  { name: 'Olive', hex: '#A2B97E' },
  { name: 'Terracotta', hex: '#C85A48' },
  { name: 'Ochre', hex: '#D4A373' },
  { name: 'Slate', hex: '#2F3E46' },
  { name: 'Berry', hex: '#9E4770' },
  { name: 'Teal', hex: '#3B7A77' },
];

export const HabitTrackerHeatmap: React.FC<HabitTrackerHeatmapProps> = ({ year }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddingHabit, setIsAddingHabit] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newColor, setNewColor] = useState<string>(HABIT_COLOR_SWATCHES[0].hex);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/trackers/habits?year=${year}`, {
        headers: { 'X-Planner-Client': 'WebApp' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const habitList: Habit[] = data.habits || [];
        setHabits(habitList);
        if (habitList.length > 0 && (!selectedHabitId || !habitList.some((h) => h.id === selectedHabitId))) {
          setSelectedHabitId(habitList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [year]);

  const activeHabit = habits.find((h) => h.id === selectedHabitId) || habits[0] || null;

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/v1/trackers/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle.trim(),
          colorHex: newColor,
          activeYear: year,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHabits((prev) => [...prev, data.habit]);
        setSelectedHabitId(data.habit.id);
        setNewTitle('');
        setIsAddingHabit(false);
      }
    } catch (err) {
      console.error('Failed to create habit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDate = async (dateStr: string) => {
    if (!activeHabit) return;
    const currentCompleted = !!activeHabit.completionDates[dateStr];
    const newCompleted = !currentCompleted;

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== activeHabit.id) return h;
        const updatedDates = { ...h.completionDates };
        if (newCompleted) {
          updatedDates[dateStr] = true;
        } else {
          delete updatedDates[dateStr];
        }
        return { ...h, completionDates: updatedDates };
      })
    );

    try {
      if (!navigator.onLine && user) {
        await syncManager.queueMutation({
          userId: user.id,
          entityType: 'habit',
          entityKey: activeHabit.id,
          endpoint: `/api/v1/trackers/habits/${activeHabit.id}/toggle`,
          method: 'POST',
          payload: { date: dateStr, completed: newCompleted },
        });
        return;
      }

      const res = await fetch(`/api/v1/trackers/habits/${activeHabit.id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify({ date: dateStr, completed: newCompleted }),
      });

      if (!res.ok) {
        if (user) {
          await syncManager.queueMutation({
            userId: user.id,
            entityType: 'habit',
            entityKey: activeHabit.id,
            endpoint: `/api/v1/trackers/habits/${activeHabit.id}/toggle`,
            method: 'POST',
            payload: { date: dateStr, completed: newCompleted },
          });
        } else {
          fetchHabits();
        }
      }
    } catch (err) {
      console.error('Failed to toggle habit date online, queueing offline mutation:', err);
      if (user) {
        try {
          await syncManager.queueMutation({
            userId: user.id,
            entityType: 'habit',
            entityKey: activeHabit.id,
            endpoint: `/api/v1/trackers/habits/${activeHabit.id}/toggle`,
            method: 'POST',
            payload: { date: dateStr, completed: newCompleted },
          });
        } catch (queueErr) {
          console.error('Failed to queue offline habit toggle:', queueErr);
          fetchHabits();
        }
      } else {
        fetchHabits();
      }
    }
  };

  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !editingHabit.title.trim()) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/v1/trackers/habits/${editingHabit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editingHabit.title.trim(),
          colorHex: editingHabit.colorHex,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHabits((prev) => prev.map((h) => (h.id === data.habit.id ? data.habit : h)));
        setEditingHabit(null);
      }
    } catch (err) {
      console.error('Failed to update habit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to remove this habit tracker?')) return;

    try {
      const res = await fetch(`/api/v1/trackers/habits/${habitId}`, {
        method: 'DELETE',
        headers: { 'X-Planner-Client': 'WebApp' },
        credentials: 'include',
      });

      if (res.ok) {
        setHabits((prev) => prev.filter((h) => h.id !== habitId));
        if (selectedHabitId === habitId) {
          const remaining = habits.filter((h) => h.id !== habitId);
          setSelectedHabitId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  // Calculations for active habit
  const totalDaysInYear = isLeapYear(year) ? 366 : 365;
  const completedCount = activeHabit
    ? Object.keys(activeHabit.completionDates).filter((d) => activeHabit.completionDates[d] && d.startsWith(`${year}-`)).length
    : 0;
  const completionPercentage = Math.round((completedCount / totalDaysInYear) * 100);

  // Calculate current streak
  const calculateStreak = (): number => {
    if (!activeHabit) return 0;
    let streak = 0;
    // Check backwards from today
    const checkDate = new Date();
    for (let i = 0; i < 366; i++) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;
      if (activeHabit.completionDates[dateKey]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today is not completed yet, check if yesterday was completed
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  return (
    <div className="space-y-8">
      {/* Habit Selector Bar & Add Habit */}
      <div className="bg-paper-alt border border-border-subtle rounded-xl p-6 shadow-paper">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-serif text-xl text-ink font-medium">Daily Habit Consistency Map</h3>
            <p className="text-xs text-ink-muted mt-1">
              Track compounding micro-actions across {year}. Small disciplines build remarkable years.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingHabit(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-medium text-paper bg-sage hover:bg-sage-dark rounded-md transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Habit</span>
          </button>
        </div>

        {/* Habit Pills Selector */}
        {habits.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
            {habits.map((habit) => {
              const isSelected = habit.id === selectedHabitId;
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => setSelectedHabitId(habit.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-serif transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-paper text-ink border-sage shadow-xs'
                      : 'bg-paper/50 text-ink-muted hover:text-ink border-border-subtle hover:border-border-strong'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: habit.colorHex }}
                  />
                  <span className="font-medium">{habit.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-6 border-t border-dashed border-border-subtle">
              <p className="text-sm font-serif text-ink-muted">No habits added for {year} yet.</p>
              <button
                type="button"
                onClick={() => setIsAddingHabit(true)}
                className="mt-2 text-xs font-serif text-sage hover:underline cursor-pointer"
              >
                + Define your first habit
              </button>
            </div>
          )
        )}
      </div>

      {/* Active Habit Details & Heatmap */}
      {activeHabit && (
        <div className="space-y-6">
          {/* Habit Banner & Stats */}
          <div className="bg-paper border border-border-subtle rounded-xl p-5 shadow-paper flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-md shadow-xs"
                style={{ backgroundColor: activeHabit.colorHex }}
              />
              <div>
                <h4 className="font-serif text-lg text-ink font-semibold">{activeHabit.title}</h4>
                <p className="text-xs text-ink-muted font-serif">
                  Click any day tile below to toggle completion.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              {streak > 0 && (
                <div className="flex items-center gap-1.5 bg-terracotta/10 text-terracotta px-2.5 py-1 rounded-md border border-terracotta/20">
                  <Flame className="w-3.5 h-3.5 fill-terracotta" />
                  <span className="font-serif font-semibold">{streak} Day Streak</span>
                </div>
              )}

              <div>
                <span className="font-serif text-ink font-semibold">{completedCount}</span>
                <span className="text-ink-muted"> / {totalDaysInYear} Days</span>
                <span className="ml-1.5 text-sage font-semibold">({completionPercentage}%)</span>
              </div>

              <div className="flex items-center gap-2 border-l border-border-subtle pl-4">
                <button
                  type="button"
                  onClick={() => setEditingHabit(activeHabit)}
                  className="p-1 text-ink-muted hover:text-ink rounded transition-colors"
                  title="Edit Habit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteHabit(activeHabit.id)}
                  className="p-1 text-ink-muted hover:text-terracotta rounded transition-colors"
                  title="Delete Habit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 12-Month Pixel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const daysInThisMonth = getDaysInMonth(year, m);

              return (
                <div
                  key={m}
                  className="bg-paper border border-border-subtle rounded-xl p-4 shadow-paper"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-1.5">
                    <span className="font-serif uppercase text-xs tracking-wider text-ink font-semibold">
                      {getMonthName(m)}
                    </span>
                    <span className="text-[10px] text-ink-muted font-sans">{daysInThisMonth} days</span>
                  </div>

                  {/* Day Tiles */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: daysInThisMonth }, (_, dayIdx) => {
                      const day = dayIdx + 1;
                      const dateStr = formatDateStr(year, m, day);
                      const isCompleted = !!activeHabit.completionDates[dateStr];

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDate(dateStr)}
                          className="group relative h-6 rounded-[3px] border border-border-subtle transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                          style={{
                            backgroundColor: isCompleted ? activeHabit.colorHex : '#FDFBF7',
                          }}
                          title={`${dateStr} — ${isCompleted ? 'Completed' : 'Not completed'}`}
                        >
                          <span
                            className={`text-[9px] font-sans font-medium opacity-90 ${
                              isCompleted ? 'text-white' : 'text-ink-muted'
                            }`}
                          >
                            {day}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      <AnimatePresence>
        {isAddingHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-paper-alt border border-border-strong rounded-2xl p-6 shadow-paper-lg"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-sage" />
                  <span className="font-serif text-lg font-medium text-ink">
                    New Annual Habit
                  </span>
                </div>
                <button
                  onClick={() => setIsAddingHabit(false)}
                  className="text-ink-muted hover:text-ink p-1 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateHabit} className="space-y-4">
                <div>
                  <label className="block text-xs font-serif text-ink-muted mb-1">
                    Habit Name / Intention
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Morning journaling, 30-min reading, Daily walk"
                    required
                    className="w-full px-3 py-2 text-sm bg-paper border border-border-subtle rounded-lg text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif text-ink-muted mb-2">
                    Accent Color
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {HABIT_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setNewColor(swatch.hex)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                          newColor === swatch.hex ? 'ring-2 ring-offset-2 ring-sage' : ''
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                      >
                        {newColor === swatch.hex && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsAddingHabit(false)}
                    className="px-4 py-2 text-xs font-serif text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !newTitle.trim()}
                    className="px-4 py-2 text-xs font-serif font-medium text-paper bg-sage hover:bg-sage-dark rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Habit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Habit Modal */}
      <AnimatePresence>
        {editingHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-paper-alt border border-border-strong rounded-2xl p-6 shadow-paper-lg"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-subtle">
                <span className="font-serif text-lg font-medium text-ink">Edit Habit</span>
                <button
                  onClick={() => setEditingHabit(null)}
                  className="text-ink-muted hover:text-ink p-1 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateHabit} className="space-y-4">
                <div>
                  <label className="block text-xs font-serif text-ink-muted mb-1">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    value={editingHabit.title}
                    onChange={(e) =>
                      setEditingHabit({ ...editingHabit, title: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 text-sm bg-paper border border-border-subtle rounded-lg text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif text-ink-muted mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {HABIT_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() =>
                          setEditingHabit({ ...editingHabit, colorHex: swatch.hex })
                        }
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                          editingHabit.colorHex === swatch.hex ? 'ring-2 ring-offset-2 ring-sage' : ''
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                      >
                        {editingHabit.colorHex === swatch.hex && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setEditingHabit(null)}
                    className="px-4 py-2 text-xs font-serif text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !editingHabit.title.trim()}
                    className="px-4 py-2 text-xs font-serif font-medium text-paper bg-sage hover:bg-sage-dark rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
