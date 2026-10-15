import React from 'react';
import { Link } from 'react-router-dom';
import { Smile, CheckSquare, Target, Sparkles, ExternalLink } from 'lucide-react';
import { DailyContext } from '@planner/shared';

interface DailyContextSummaryProps {
  context: DailyContext;
  year: number;
  month: number;
}

export const DailyContextSummary: React.FC<DailyContextSummaryProps> = ({
  context,
  year,
  month,
}) => {
  const mood = context?.mood;
  const habits = context?.habits || [];
  const monthlyMustDos = context?.monthlyMustDos || [];

  return (
    <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sage" />
          <h2 className="font-serif text-lg font-semibold text-ink">
            Journal Companion
          </h2>
        </div>
        <span className="text-[11px] font-serif text-ink-muted">
          Unified Horizon
        </span>
      </div>

      {/* Today's Mood */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-serif font-semibold text-ink">
            <Smile className="w-3.5 h-3.5 text-sage" />
            <span>Today&apos;s Mood</span>
          </div>
          <Link
            to="/annual"
            className="text-[11px] font-serif text-sage hover:underline flex items-center gap-0.5"
            title="Log or view in Annual Mood Tracker"
          >
            <span>Tracker</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>

        {mood ? (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-paper border border-border-subtle">
            <span
              className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10"
              style={{ backgroundColor: mood.colorHex }}
              aria-label={`Mood color: ${mood.label}`}
            />
            <div className="min-w-0">
              <span className="text-xs font-serif font-medium text-ink block truncate">
                {mood.label}
              </span>
              {mood.note && (
                <span className="text-[11px] font-serif italic text-ink-muted block truncate">
                  &ldquo;{mood.note}&rdquo;
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs font-serif italic text-ink-muted py-1">
            No mood logged for today.{' '}
            <Link to="/annual" className="text-sage hover:underline not-italic">
              Record your energy
            </Link>
          </p>
        )}
      </div>

      {/* Habit Check-In Preview */}
      <div className="space-y-2 border-t border-border-subtle pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-serif font-semibold text-ink">
            <CheckSquare className="w-3.5 h-3.5 text-sage" />
            <span>Today&apos;s Habits ({habits.length})</span>
          </div>
          <Link
            to="/annual"
            className="text-[11px] font-serif text-sage hover:underline flex items-center gap-0.5"
            title="Manage habits in Annual Tracker"
          >
            <span>All Habits</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>

        {habits.length === 0 ? (
          <p className="text-xs font-serif italic text-ink-muted py-1">
            No active habits tracked.
          </p>
        ) : (
          <div className="space-y-1.5">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-paper border border-border-subtle/60 text-xs font-serif"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: habit.colorHex }}
                  />
                  <span className="truncate text-ink">{habit.title}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    habit.completed
                      ? 'bg-emerald-100/80 text-emerald-800'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {habit.completed ? 'Done' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Must-Dos Preview */}
      <div className="space-y-2 border-t border-border-subtle pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-serif font-semibold text-ink">
            <Target className="w-3.5 h-3.5 text-sage" />
            <span>Monthly Must-Dos</span>
          </div>
          <Link
            to={`/monthly/${year}/${month}`}
            className="text-[11px] font-serif text-sage hover:underline flex items-center gap-0.5"
            title="Open Monthly Planner"
          >
            <span>Monthly</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>

        {monthlyMustDos.length === 0 ? (
          <p className="text-xs font-serif italic text-ink-muted py-1">
            No must-dos defined for this month.
          </p>
        ) : (
          <div className="space-y-1.5">
            {monthlyMustDos.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 text-xs font-serif py-1 px-1.5 rounded"
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                    item.checked
                      ? 'bg-sage border-sage text-white'
                      : 'border-stone-400 bg-transparent'
                  }`}
                >
                  {item.checked && '✓'}
                </span>
                <span
                  className={`truncate ${
                    item.checked ? 'line-through text-ink-muted' : 'text-ink'
                  }`}
                >
                  {item.text || 'Untitled milestone'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
