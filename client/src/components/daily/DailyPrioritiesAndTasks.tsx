import React from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { DayTask } from '@planner/shared';
import { CircleCheckbox } from '../journal/CircleCheckbox';
import { RuledInput } from '../journal/RuledInput';

interface DailyPrioritiesAndTasksProps {
  primaryPriorities: DayTask[];
  additionalTasks: DayTask[];
  onUpdatePriorities: (priorities: DayTask[]) => void;
  onUpdateAdditionalTasks: (tasks: DayTask[]) => void;
}

export const DailyPrioritiesAndTasks: React.FC<DailyPrioritiesAndTasksProps> = ({
  primaryPriorities,
  additionalTasks,
  onUpdatePriorities,
  onUpdateAdditionalTasks,
}) => {
  // Ensure we always have exactly 3 priority slots
  const priorities: DayTask[] = [
    primaryPriorities[0] || { id: 'p1', text: '', done: false },
    primaryPriorities[1] || { id: 'p2', text: '', done: false },
    primaryPriorities[2] || { id: 'p3', text: '', done: false },
  ];

  const handlePriorityTextChange = (index: number, text: string) => {
    const updated = [...priorities];
    updated[index] = { ...updated[index], text };
    onUpdatePriorities(updated);
  };

  const handlePriorityToggle = (index: number, done: boolean) => {
    const updated = [...priorities];
    updated[index] = { ...updated[index], done };
    onUpdatePriorities(updated);
  };

  const handleAddTask = () => {
    const newTask: DayTask = {
      id: crypto.randomUUID(),
      text: '',
      done: false,
    };
    onUpdateAdditionalTasks([...additionalTasks, newTask]);
  };

  const handleTaskTextChange = (index: number, text: string) => {
    const updated = [...additionalTasks];
    updated[index] = { ...updated[index], text };
    onUpdateAdditionalTasks(updated);
  };

  const handleTaskToggle = (index: number, done: boolean) => {
    const updated = [...additionalTasks];
    updated[index] = { ...updated[index], done };
    onUpdateAdditionalTasks(updated);
  };

  const handleRemoveTask = (index: number) => {
    const updated = additionalTasks.filter((_, i) => i !== index);
    onUpdateAdditionalTasks(updated);
  };

  // Progress metrics
  const completedPriorities = priorities.filter((p) => p.done && p.text.trim().length > 0).length;
  const activePriorities = priorities.filter((p) => p.text.trim().length > 0).length;

  const getEncouragement = () => {
    if (activePriorities === 0) return 'Choose 1 to 3 essentials for today.';
    if (completedPriorities === 0) return 'Take the first small, deliberate step.';
    if (completedPriorities < activePriorities) return `${completedPriorities} of ${activePriorities} completed • Steady, intentional progress.`;
    return 'All primary priorities completed • Well done!';
  };

  return (
    <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-6">
      {/* Rule of 3 Header & Gentle Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-semibold text-ink">
              Top 3 Priorities
            </h2>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-sage/10 text-sage font-serif font-medium">
              Rule of 3
            </span>
          </div>
          <p className="text-xs text-ink-muted font-serif mt-0.5">
            Focus on what truly moves the needle. Automatically synced with your weekly spread.
          </p>
        </div>

        {/* Gentle Progress Indicator */}
        <div className="flex items-center gap-2 text-xs font-serif text-sage bg-sage/10 px-3 py-1.5 rounded-full self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5 text-sage flex-shrink-0" />
          <span>{getEncouragement()}</span>
        </div>
      </div>

      {/* 3 Primary Priority Items */}
      <div className="space-y-4">
        {priorities.map((item, idx) => (
          <div key={item.id || idx} className="flex items-center gap-3">
            <span className="font-serif text-xs text-ink-muted w-4 text-center select-none">
              {idx + 1}.
            </span>
            <CircleCheckbox
              checked={item.done}
              onChange={(checked) => handlePriorityToggle(idx, checked)}
              size="md"
              aria-label={`Mark Priority ${idx + 1} as ${item.done ? 'incomplete' : 'complete'}`}
            />
            <RuledInput
              value={item.text}
              onChange={(val) => handlePriorityTextChange(idx, val)}
              placeholder={`Priority ${idx + 1}...`}
              className={item.done ? 'line-through text-ink-muted' : ''}
            />
          </div>
        ))}
      </div>

      {/* Additional Tasks Section */}
      <div className="border-t border-border-subtle pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm font-semibold text-ink">
            Additional Tasks &amp; Errands
          </h3>
          <button
            type="button"
            onClick={handleAddTask}
            className="inline-flex items-center gap-1.5 text-xs font-serif text-sage hover:text-sage-dark font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage rounded-md px-1.5 py-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        {additionalTasks.length === 0 ? (
          <p className="text-xs font-serif italic text-ink-muted py-2">
            No secondary tasks. Keeping today light and focused.
          </p>
        ) : (
          <div className="space-y-2.5">
            {additionalTasks.map((task, idx) => (
              <div key={task.id || idx} className="flex items-center gap-2.5 group">
                <CircleCheckbox
                  checked={task.done}
                  onChange={(checked) => handleTaskToggle(idx, checked)}
                  size="sm"
                  aria-label={`Toggle task: ${task.text || 'Untitled task'}`}
                />
                <RuledInput
                  value={task.text}
                  onChange={(val) => handleTaskTextChange(idx, val)}
                  placeholder="Task item..."
                  className={task.done ? 'line-through text-ink-muted' : ''}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTask(idx)}
                  className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-1 text-ink-muted hover:text-red-600 transition-opacity rounded cursor-pointer"
                  title="Remove task"
                  aria-label="Remove task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
