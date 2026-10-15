import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trash2 } from 'lucide-react';
import {
  MoodEntry,
  DEFAULT_MOOD_PALETTE,
  getAllYearDates,
  getMonthName,
  getDaysInMonth,
  formatDateStr,
} from '@planner/shared';
import { useAuth } from '../../context/AuthContext';
import { syncManager } from '../../services/syncManager';

interface MoodTrackerHeatmapProps {
  year: number;
}

export const MoodTrackerHeatmap: React.FC<MoodTrackerHeatmapProps> = ({ year }) => {
  const { user } = useAuth();
  const [moods, setMoods] = useState<Record<string, MoodEntry>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeMoodKey, setActiveMoodKey] = useState<string>('great');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const fetchMoods = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/trackers/mood/${year}`, {
        headers: { 'X-Planner-Client': 'WebApp' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const moodMap: Record<string, MoodEntry> = {};
        for (const m of data.moods || []) {
          moodMap[m.date] = m;
        }
        setMoods(moodMap);
      }
    } catch (err) {
      console.error('Failed to load mood entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoods();
  }, [year]);

  const handleTileClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = moods[dateStr];
    if (existing) {
      setActiveMoodKey(existing.moodKey);
      setNote(existing.note || '');
    } else {
      setActiveMoodKey('great');
      setNote('');
    }
  };

  const handleSaveMood = async () => {
    if (!selectedDate) return;
    setSaving(true);
    const option = DEFAULT_MOOD_PALETTE.find((p) => p.key === activeMoodKey) || DEFAULT_MOOD_PALETTE[0];
    const payload = {
      date: selectedDate,
      moodKey: option.key,
      colorHex: option.colorHex,
      label: option.label,
      note: note.trim() || undefined,
    };

    const optimisticMood: MoodEntry = {
      id: moods[selectedDate]?.id || `temp-mood-${Date.now()}`,
      userId: user?.id || '',
      date: selectedDate,
      year,
      moodKey: option.key,
      colorHex: option.colorHex,
      label: option.label,
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (!navigator.onLine && user) {
        await syncManager.queueMutation({
          userId: user.id,
          entityType: 'mood',
          entityKey: selectedDate,
          endpoint: '/api/v1/trackers/mood',
          method: 'POST',
          payload,
        });
        setMoods((prev) => ({ ...prev, [selectedDate]: optimisticMood }));
        setSelectedDate(null);
        return;
      }

      const res = await fetch('/api/v1/trackers/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setMoods((prev) => ({ ...prev, [selectedDate]: data.mood }));
        setSelectedDate(null);
      } else if (user) {
        await syncManager.queueMutation({
          userId: user.id,
          entityType: 'mood',
          entityKey: selectedDate,
          endpoint: '/api/v1/trackers/mood',
          method: 'POST',
          payload,
        });
        setMoods((prev) => ({ ...prev, [selectedDate]: optimisticMood }));
        setSelectedDate(null);
      }
    } catch (err) {
      console.error('Failed to save mood online, queueing offline mutation:', err);
      if (user) {
        try {
          await syncManager.queueMutation({
            userId: user.id,
            entityType: 'mood',
            entityKey: selectedDate,
            endpoint: '/api/v1/trackers/mood',
            method: 'POST',
            payload,
          });
          setMoods((prev) => ({ ...prev, [selectedDate]: optimisticMood }));
          setSelectedDate(null);
        } catch (queueErr) {
          console.error('Failed to queue offline mood mutation:', queueErr);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMood = async () => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      if (!navigator.onLine && user) {
        await syncManager.queueMutation({
          userId: user.id,
          entityType: 'mood',
          entityKey: selectedDate,
          endpoint: `/api/v1/trackers/mood/${selectedDate}`,
          method: 'DELETE',
          payload: {},
        });
        setMoods((prev) => {
          const next = { ...prev };
          delete next[selectedDate];
          return next;
        });
        setSelectedDate(null);
        return;
      }

      const res = await fetch(`/api/v1/trackers/mood/${selectedDate}`, {
        method: 'DELETE',
        headers: { 'X-Planner-Client': 'WebApp' },
        credentials: 'include',
      });

      if (res.ok) {
        setMoods((prev) => {
          const next = { ...prev };
          delete next[selectedDate];
          return next;
        });
        setSelectedDate(null);
      } else if (user) {
        await syncManager.queueMutation({
          userId: user.id,
          entityType: 'mood',
          entityKey: selectedDate,
          endpoint: `/api/v1/trackers/mood/${selectedDate}`,
          method: 'DELETE',
          payload: {},
        });
        setMoods((prev) => {
          const next = { ...prev };
          delete next[selectedDate];
          return next;
        });
        setSelectedDate(null);
      }
    } catch (err) {
      console.error('Failed to delete mood online, queueing offline mutation:', err);
      if (user) {
        try {
          await syncManager.queueMutation({
            userId: user.id,
            entityType: 'mood',
            entityKey: selectedDate,
            endpoint: `/api/v1/trackers/mood/${selectedDate}`,
            method: 'DELETE',
            payload: {},
          });
          setMoods((prev) => {
            const next = { ...prev };
            delete next[selectedDate];
            return next;
          });
          setSelectedDate(null);
        } catch (queueErr) {
          console.error('Failed to queue offline mood deletion:', queueErr);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  // Calculate annual mood statistics
  const totalRecordedDays = Object.keys(moods).length;
  const allYearDates = getAllYearDates(year);
  const totalDaysInYear = allYearDates.length;

  return (
    <div className="space-y-8">
      {/* Header & Legend */}
      <div className="bg-paper-alt border border-border-subtle rounded-xl p-6 shadow-paper">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-serif text-xl text-ink font-medium">Daily Mood & Emotion Map</h3>
            <p className="text-xs text-ink-muted mt-1">
              Reflect on emotional trends across {year}. Click any square to record or update your day.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-ink">
              {loading ? 'Loading...' : `${totalRecordedDays} of ${totalDaysInYear} Days Recorded`}
            </span>
            <div className="w-32 bg-paper-muted h-2 rounded-full overflow-hidden mt-1 border border-border-subtle">
              <div
                className="bg-sage h-full transition-all duration-500"
                style={{ width: `${Math.round((totalRecordedDays / totalDaysInYear) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Palette Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border-subtle text-xs">
          <span className="font-serif text-ink-muted">Palette:</span>
          {DEFAULT_MOOD_PALETTE.map((item) => {
            const count = Object.values(moods).filter((m) => m.moodKey === item.key).length;
            return (
              <div key={item.key} className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: item.colorHex }} />
                <span className="text-ink">{item.label}</span>
                <span className="text-ink-muted text-[10px]">({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-Month Pixel Heatmap Grid */}
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

              {/* Day Tiles in month (7 columns) */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: daysInThisMonth }, (_, dayIdx) => {
                  const day = dayIdx + 1;
                  const dateStr = formatDateStr(year, m, day);
                  const entry = moods[dateStr];

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleTileClick(dateStr)}
                      className="group relative h-6 rounded-[3px] border border-border-subtle transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                      style={{
                        backgroundColor: entry ? entry.colorHex : '#FDFBF7',
                      }}
                      title={`${dateStr}${entry ? ` — ${entry.label}${entry.note ? `: ${entry.note}` : ''}` : ' (Unrecorded)'}`}
                    >
                      <span
                        className={`text-[9px] font-sans font-medium opacity-80 ${
                          entry ? 'text-white' : 'text-ink-muted'
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

      {/* Interactive Daily Mood Popover / Modal */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-paper-alt border border-border-strong rounded-2xl p-6 shadow-paper-lg"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-sage" />
                  <span className="font-serif text-lg font-medium text-ink">
                    {selectedDate}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-ink-muted hover:text-ink p-1 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-serif text-ink-muted mb-2">
                    How was your day?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_MOOD_PALETTE.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setActiveMoodKey(p.key)}
                        className={`p-2.5 rounded-lg border text-xs font-sans flex items-center gap-2 transition-all ${
                          activeMoodKey === p.key
                            ? 'border-ink bg-paper shadow-xs font-semibold'
                            : 'border-border-subtle bg-paper/60 hover:bg-paper'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.colorHex }}
                        />
                        <span className="truncate text-ink">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-serif text-ink-muted mb-1.5">
                    Personal Reflection (Optional):
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What contributed to how you felt today? Any lessons learned?"
                    rows={3}
                    className="w-full bg-paper border border-border-subtle rounded-lg p-3 text-xs text-ink focus:outline-none focus:border-sage font-sans resize-none"
                    maxLength={1000}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {moods[selectedDate] ? (
                    <button
                      type="button"
                      onClick={handleDeleteMood}
                      disabled={saving}
                      className="text-xs text-terracotta hover:text-terracotta/80 inline-flex items-center gap-1 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Day</span>
                    </button>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      className="px-4 py-2 rounded-lg border border-border-subtle text-xs text-ink-muted hover:text-ink font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMood}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-sage hover:bg-sage-dark text-white text-xs font-medium transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Reflection'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
