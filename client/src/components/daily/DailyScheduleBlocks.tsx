import React from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { ScheduleBlock } from '@planner/shared';
import { CircleCheckbox } from '../journal/CircleCheckbox';

interface DailyScheduleBlocksProps {
  schedule: ScheduleBlock[];
  onUpdateSchedule: (schedule: ScheduleBlock[]) => void;
}

export const DailyScheduleBlocks: React.FC<DailyScheduleBlocksProps> = ({
  schedule,
  onUpdateSchedule,
}) => {
  const handleSlotChange = (index: number, timeSlot: string) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], timeSlot };
    onUpdateSchedule(updated);
  };

  const handleActivityChange = (index: number, activity: string) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], activity };
    onUpdateSchedule(updated);
  };

  const handleToggleDone = (index: number, done: boolean) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], done };
    onUpdateSchedule(updated);
  };

  const handleAddSlot = () => {
    const newBlock: ScheduleBlock = {
      id: crypto.randomUUID(),
      timeSlot: '08:00 AM',
      activity: '',
      done: false,
    };
    onUpdateSchedule([...schedule, newBlock]);
  };

  const handleRemoveSlot = (index: number) => {
    const updated = schedule.filter((_, i) => i !== index);
    onUpdateSchedule(updated);
  };

  return (
    <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sage" />
          <h2 className="font-serif text-lg font-semibold text-ink">
            Daily Flow &amp; Schedule
          </h2>
        </div>
        <button
          type="button"
          onClick={handleAddSlot}
          className="inline-flex items-center gap-1.5 text-xs font-serif text-sage hover:text-sage-dark font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage rounded-md px-1.5 py-0.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Time Block</span>
        </button>
      </div>

      <p className="text-xs text-ink-muted font-serif">
        Gentle structure for your hours. Time-block deep work, stillness, and everyday rhythms.
      </p>

      {schedule.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border-subtle rounded-xl">
          <p className="font-serif text-xs italic text-ink-muted">No scheduled time blocks.</p>
          <button
            type="button"
            onClick={handleAddSlot}
            className="mt-2 text-xs font-serif text-sage hover:underline cursor-pointer"
          >
            Add first block
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {schedule.map((block, idx) => (
            <div
              key={block.id || idx}
              className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-paper/60 transition-colors group"
            >
              <CircleCheckbox
                checked={block.done}
                onChange={(checked) => handleToggleDone(idx, checked)}
                size="sm"
                aria-label={`Toggle schedule item: ${block.timeSlot} - ${block.activity || 'Activity'}`}
              />

              {/* Editable Time Slot */}
              <input
                type="text"
                value={block.timeSlot}
                onChange={(e) => handleSlotChange(idx, e.target.value)}
                placeholder="Time (e.g. 09:00 AM)"
                className="w-24 sm:w-28 text-xs font-mono font-medium text-ink bg-transparent border-b border-stone-200 focus:border-stone-600 focus:outline-none px-1 py-0.5 transition-colors"
                aria-label="Time slot"
              />

              {/* Editable Activity */}
              <input
                type="text"
                value={block.activity}
                onChange={(e) => handleActivityChange(idx, e.target.value)}
                placeholder="Focus activity or appointment..."
                className={`flex-1 text-sm font-serif bg-transparent border-b border-stone-200 focus:border-stone-600 focus:outline-none px-1 py-0.5 transition-colors placeholder:text-stone-300 placeholder:italic ${
                  block.done ? 'line-through text-ink-muted' : 'text-ink'
                }`}
                aria-label="Activity description"
              />

              <button
                type="button"
                onClick={() => handleRemoveSlot(idx)}
                className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-1 text-ink-muted hover:text-red-600 transition-opacity cursor-pointer rounded"
                title="Remove block"
                aria-label="Remove block"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
