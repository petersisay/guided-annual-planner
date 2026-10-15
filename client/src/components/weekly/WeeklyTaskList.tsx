import React from 'react';
import { Link } from 'react-router-dom';
import { DayPlan, DayTask } from '@planner/shared';
import { CircleCheckbox } from '../journal/CircleCheckbox';
import { RuledInput } from '../journal/RuledInput';
import { SpiralBinding } from '../journal/SpiralBinding';

interface WeeklyTaskListProps {
  days: DayPlan[];
  onUpdateDays: (days: DayPlan[]) => void;
  isoWeek: number;
  year: number;
}

const DAY_LABELS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const WeeklyTaskList: React.FC<WeeklyTaskListProps> = ({
  days,
  onUpdateDays,
  isoWeek,
  year,
}) => {
  const handleTaskText = (dayIndex: number, taskIndex: number, text: string) => {
    const updated = [...days];
    const day = updated[dayIndex];
    if (!day) return;
    const tasks = [...day.tasks] as [DayTask, DayTask, DayTask];
    tasks[taskIndex] = { ...tasks[taskIndex], text };
    updated[dayIndex] = { ...day, tasks };
    onUpdateDays(updated);
  };

  const handleTaskCheck = (dayIndex: number, taskIndex: number, done: boolean) => {
    const updated = [...days];
    const day = updated[dayIndex];
    if (!day) return;
    const tasks = [...day.tasks] as [DayTask, DayTask, DayTask];
    tasks[taskIndex] = { ...tasks[taskIndex], done };
    updated[dayIndex] = { ...day, tasks };
    onUpdateDays(updated);
  };

  return (
    <div className="relative bg-paper border border-border-subtle rounded-2xl shadow-paper-lg p-6 sm:p-8 flex-1 overflow-hidden">
      {/* Right Spiral Binding on Left Page (matching notebook center seam in 122758.png) */}
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 z-10">
        <SpiralBinding position="right" count={28} />
      </div>

      <div className="lg:pr-8 space-y-6">
        {/* Header: "WEEKLY PLANNER" matching reference image 122758.png */}
        <div className="border-b border-stone-300 pb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide text-ink uppercase">
            WEEKLY PLANNER
          </h2>
          <span className="font-serif text-xs text-stone-500 uppercase tracking-widest">
            Week {isoWeek} &bull; {year}
          </span>
        </div>

        {/* 7 Day Blocks with Rule of 3 */}
        <div className="space-y-4">
          {days.map((day, dayIdx) => {
            const dayName = DAY_LABELS[dayIdx] || `DAY ${dayIdx + 1}`;

            return (
              <div
                key={day.date || dayIdx}
                className="space-y-2 pb-3 border-b border-stone-200/60 last:border-b-0"
              >
                {/* Day Name & DATE: field */}
                <div className="flex items-center justify-between text-ink">
                  <span className="font-serif font-bold text-xs sm:text-sm tracking-widest uppercase">
                    {dayName}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-serif text-stone-500">
                    <span className="font-medium text-ink-muted">DATE:</span>
                    <Link
                      to={`/daily/${day.date}`}
                      title={`Open daily focus page for ${day.date}`}
                      className="border-b border-stone-400 min-w-[70px] text-center font-sans text-xs text-ink hover:text-sage hover:border-sage transition-colors cursor-pointer"
                    >
                      {day.date}
                    </Link>
                  </div>
                </div>

                {/* 3 Rule of 3 Tasks */}
                <div className="space-y-2 pl-1">
                  {day.tasks.map((task, taskIdx) => (
                    <div key={task.id || taskIdx} className="flex items-center gap-2.5">
                      <CircleCheckbox
                        checked={task.done}
                        onChange={(done) => handleTaskCheck(dayIdx, taskIdx, done)}
                        size="sm"
                        color="ink"
                        aria-label={`${dayName} Task ${taskIdx + 1}`}
                      />
                      <RuledInput
                        value={task.text}
                        onChange={(text) => handleTaskText(dayIdx, taskIdx, text)}
                        placeholder={`Focus ${taskIdx + 1}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
