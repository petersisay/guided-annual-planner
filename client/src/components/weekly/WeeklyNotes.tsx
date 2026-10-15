import React from 'react';
import { PriorityItem } from '@planner/shared';
import { CircleCheckbox } from '../journal/CircleCheckbox';
import { RuledInput } from '../journal/RuledInput';
import { SpiralBinding } from '../journal/SpiralBinding';

interface WeeklyNotesProps {
  priorities: PriorityItem[];
  reminder: string;
  nextWeek: string[];
  notes: string;
  onUpdate: (updates: {
    priorities?: PriorityItem[];
    reminder?: string;
    nextWeek?: string[];
    notes?: string;
  }) => void;
}

export const WeeklyNotes: React.FC<WeeklyNotesProps> = ({
  priorities: propPriorities,
  reminder,
  nextWeek: propNextWeek,
  notes,
  onUpdate,
}) => {
  // Ensure 5 priorities
  const priorities: PriorityItem[] = Array.from({ length: 5 }).map((_, i) => {
    return (
      propPriorities?.[i] || {
        id: crypto.randomUUID(),
        text: '',
        done: false,
      }
    );
  });

  const handlePriorityText = (index: number, text: string) => {
    const updated = [...priorities];
    updated[index] = { ...updated[index], text };
    onUpdate({ priorities: updated });
  };

  const handlePriorityCheck = (index: number, done: boolean) => {
    const updated = [...priorities];
    updated[index] = { ...updated[index], done };
    onUpdate({ priorities: updated });
  };

  // Ensure 3 next week lines
  const nextWeek: string[] = Array.from({ length: 3 }).map((_, i) => {
    return propNextWeek?.[i] || '';
  });

  const handleNextWeekText = (index: number, text: string) => {
    const updated = [...nextWeek];
    updated[index] = text;
    onUpdate({ nextWeek: updated });
  };

  return (
    <div className="relative bg-paper border border-border-subtle rounded-2xl shadow-paper-lg p-6 sm:p-8 flex-1 overflow-hidden">
      {/* Left Spiral Binding on Right Page (matching center seam in 122831.png) */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 z-10">
        <SpiralBinding position="left" count={28} />
      </div>

      <div className="lg:pl-8 space-y-6">
        {/* PRIORITIES Box matching reference image 122831.png */}
        <div className="space-y-2">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-widest text-ink">
            PRIORITIES
          </h3>
          <div className="border border-stone-800 rounded-sm p-4 bg-paper space-y-3">
            {priorities.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center gap-3">
                <CircleCheckbox
                  checked={item.done}
                  onChange={(done) => handlePriorityCheck(idx, done)}
                  size="md"
                  color="ink"
                  aria-label={`Weekly priority ${idx + 1}`}
                />
                <RuledInput
                  value={item.text}
                  onChange={(text) => handlePriorityText(idx, text)}
                  placeholder={`Priority ${idx + 1}...`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* REMINDER Box matching reference image 122831.png */}
        <div className="space-y-2">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-widest text-ink">
            REMINDER
          </h3>
          <div className="border border-stone-800 rounded-sm p-3 bg-paper">
            <textarea
              value={reminder}
              onChange={(e) => onUpdate({ reminder: e.target.value })}
              placeholder="Crucial reminders, deadlines, appointments..."
              rows={3}
              className="w-full bg-transparent border-none resize-none font-serif text-sm text-ink focus:outline-none placeholder:text-stone-300 placeholder:italic"
            />
          </div>
        </div>

        {/* NEXT WEEK matching reference image 122831.png */}
        <div className="space-y-2">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-widest text-ink">
            NEXT WEEK
          </h3>
          <div className="space-y-2 pl-1">
            {nextWeek.map((item, idx) => (
              <RuledInput
                key={idx}
                value={item}
                onChange={(text) => handleNextWeekText(idx, text)}
                placeholder={`Upcoming horizon ${idx + 1}...`}
              />
            ))}
          </div>
        </div>

        {/* NOTES with Cursive heading & Dot-Grid Area matching reference image 122831.png */}
        <div className="space-y-2 pt-2 border-t border-stone-200">
          <h3 className="font-script text-2xl text-ink font-semibold">
            Notes
          </h3>
          <div className="border border-stone-300 rounded-sm bg-dot-grid p-4 min-h-[160px] bg-paper">
            <textarea
              value={notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Brain dumps, meeting notes, reflection sketches..."
              rows={6}
              className="w-full h-full bg-transparent border-none resize-none font-serif text-sm text-ink leading-relaxed focus:outline-none placeholder:text-stone-300 placeholder:italic"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
