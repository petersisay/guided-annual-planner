import React from 'react';
import { MonthlyPlan, ChecklistItem, BookEntry } from '@planner/shared';
import { CircleCheckbox } from '../journal/CircleCheckbox';
import { RuledInput, RuledLinesArea } from '../journal/RuledInput';
import { Bookshelf } from '../journal/Bookshelf';
import { SpiralBinding } from '../journal/SpiralBinding';

interface MonthlyDashboardProps {
  plan: MonthlyPlan;
  onUpdate: (updates: Partial<MonthlyPlan>) => void;
  monthName: string;
  year: number;
}

export const MonthlyDashboard: React.FC<MonthlyDashboardProps> = ({
  plan,
  onUpdate,
  monthName,
  year,
}) => {
  // MUST DO'S (6 items)
  const mustDos: ChecklistItem[] = Array.from({ length: 6 }).map((_, i) => {
    return plan.mustDos?.[i] || { id: crypto.randomUUID(), text: '', checked: false };
  });

  const handleMustDoText = (index: number, text: string) => {
    const updated = [...mustDos];
    updated[index] = { ...updated[index], text };
    onUpdate({ mustDos: updated });
  };

  const handleMustDoCheck = (index: number, checked: boolean) => {
    const updated = [...mustDos];
    updated[index] = { ...updated[index], checked };
    onUpdate({ mustDos: updated });
  };

  // NEW HABITS (5 items)
  const newHabits: string[] = Array.from({ length: 5 }).map((_, i) => {
    return plan.newHabits?.[i] || '';
  });

  const handleHabitText = (index: number, text: string) => {
    const updated = [...newHabits];
    updated[index] = text;
    onUpdate({ newHabits: updated });
  };

  // TO-BUY (5 items in sage green card)
  const toBuy: ChecklistItem[] = Array.from({ length: 5 }).map((_, i) => {
    return plan.toBuy?.[i] || { id: crypto.randomUUID(), text: '', checked: false };
  });

  const handleToBuyText = (index: number, text: string) => {
    const updated = [...toBuy];
    updated[index] = { ...updated[index], text };
    onUpdate({ toBuy: updated });
  };

  const handleToBuyCheck = (index: number, checked: boolean) => {
    const updated = [...toBuy];
    updated[index] = { ...updated[index], checked };
    onUpdate({ toBuy: updated });
  };

  // BOOKS TO READ
  const handleBooksChange = (books: BookEntry[]) => {
    onUpdate({ books });
  };

  // SELF CHANGE REFLECTION
  const handleSelfChange = (text: string) => {
    onUpdate({ selfChangeReflection: text });
  };

  return (
    <div className="relative bg-paper border border-border-subtle rounded-2xl shadow-paper-lg p-6 sm:p-10 max-w-4xl mx-auto overflow-hidden">
      {/* Left Spiral Binding Ring Holes */}
      <div className="absolute left-0 top-0 bottom-0 z-10">
        <SpiralBinding position="left" count={26} />
      </div>

      {/* Main Page Area with Left Padding for Spiral */}
      <div className="pl-6 sm:pl-10 space-y-8">
        {/* Top Header whisper */}
        <div className="flex items-center justify-between border-b border-border-subtle/60 pb-3">
          <span className="font-serif uppercase tracking-widest text-xs text-ink-muted">
            {monthName} {year} &bull; Monthly Intentions
          </span>
          <span className="text-[11px] font-script text-stone-400">
            Guided Reflections & Daily Focus
          </span>
        </div>

        {/* Section 1: MUST DO'S (Left) & NEW HABITS (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* MUST DO'S */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-widest text-ink">
              MUST DO&apos;S
            </h3>
            <div className="space-y-3">
              {mustDos.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center gap-3">
                  <CircleCheckbox
                    checked={item.checked}
                    onChange={(checked) => handleMustDoCheck(idx, checked)}
                    size="md"
                    color="ink"
                    aria-label={`Must do task ${idx + 1}`}
                  />
                  <RuledInput
                    value={item.text}
                    onChange={(text) => handleMustDoText(idx, text)}
                    placeholder={`Must do ${idx + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* NEW HABITS (Boxed container matching screenshot 2) */}
          <div className="border border-stone-800 rounded-sm p-4 sm:p-5 bg-paper space-y-3">
            <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-widest text-center text-ink">
              NEW HABITS
            </h3>
            <div className="space-y-3 pt-1">
              {newHabits.map((habit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-900 flex-shrink-0" />
                  <RuledInput
                    value={habit}
                    onChange={(text) => handleHabitText(idx, text)}
                    placeholder={`Habit ${idx + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: TO-BUY (Left, Green Card) & BOOKS TO READ (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
          {/* TO-BUY (Sage green card with rounded corners matching screenshot 2) */}
          <div className="bg-[#9BB87A] rounded-xl p-5 text-white shadow-xs space-y-3">
            <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-widest text-center text-stone-900">
              &apos;TO-BUY
            </h3>
            <div className="space-y-2.5 pt-1">
              {toBuy.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center gap-3">
                  <CircleCheckbox
                    checked={item.checked}
                    onChange={(checked) => handleToBuyCheck(idx, checked)}
                    size="md"
                    color="ink"
                    aria-label={`To buy item ${idx + 1}`}
                    className="text-stone-900"
                  />
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleToBuyText(idx, e.target.value)}
                    placeholder={`Item ${idx + 1}...`}
                    className="w-full bg-transparent border-b border-stone-800/40 focus:border-stone-900 text-stone-900 text-sm font-serif px-1 py-0.5 focus:outline-none placeholder:text-stone-700/60 placeholder:italic"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* BOOKS TO READ */}
          <div className="space-y-2 flex flex-col items-center">
            <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-widest text-center text-ink">
              BOOKS TO READ
            </h3>
            <Bookshelf
              books={plan.books || []}
              onChange={handleBooksChange}
              maxBooks={5}
            />
          </div>
        </div>

        {/* Section 3: WRITE THINGS YOU WANT TO CHANGE ABOUT YOURSELF (Bottom) */}
        <div className="pt-4 border-t border-border-subtle/80 space-y-3">
          <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-wider text-ink italic">
            WRITE THINGS YOU WANT TO CHANGE ABOUT YOURSELF
          </h3>
          <RuledLinesArea
            value={plan.selfChangeReflection || ''}
            onChange={handleSelfChange}
            lines={5}
            placeholder="Write personal reflections, mental models to unlearn, and habits to reshape this month..."
          />
        </div>
      </div>
    </div>
  );
};
