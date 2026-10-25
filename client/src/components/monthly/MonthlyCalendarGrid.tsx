import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateMonthGrid, getMonthName } from '@planner/shared';
import { SpiralBinding } from '../journal/SpiralBinding';
import { useLanguage } from '../../context/LanguageContext';

interface MonthlyCalendarGridProps {
  year: number;
  month: number;
  calendarNotes: Record<string, string>;
  onUpdateNotes: (notes: Record<string, string>) => void;
}

export const MonthlyCalendarGrid: React.FC<MonthlyCalendarGridProps> = ({
  year,
  month,
  calendarNotes,
  onUpdateNotes,
}) => {
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDate !== null) {
        setSelectedDate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate]);

  const tiles = generateMonthGrid(year, month, 'monday');
  const monthName = language === 'am' && t.months[month - 1] ? t.months[month - 1] : getMonthName(month);
  const weekdays =
    language === 'am' && t.daysFull
      ? t.daysFull.map((d) => d.toUpperCase())
      : [
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ];

  const handleCellClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEditingText(calendarNotes[dateStr] || '');
  };

  const handleCellKeyDown = (dateStr: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(dateStr);
    }
  };

  const handleSaveNote = () => {
    if (!selectedDate) return;
    const updated = { ...calendarNotes };
    if (editingText.trim()) {
      updated[selectedDate] = editingText.trim();
    } else {
      delete updated[selectedDate];
    }
    onUpdateNotes(updated);
    setSelectedDate(null);
  };

  return (
    <div className="relative bg-paper border border-border-subtle rounded-2xl shadow-paper-lg p-6 sm:p-10 max-w-6xl mx-auto overflow-hidden">
      {/* Top Header matching reference image 122526.png: "MONTH 1" */}
      <div className="flex items-center justify-between mb-6 pb-2">
        <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide text-ink uppercase">
          {language === 'am' ? `ወር ${month} (MONTH ${month})` : `MONTH ${month}`} <span className="text-stone-400 font-light text-xl">| {monthName} {year}</span>
        </h2>
        <span className="text-xs font-serif text-ink-muted hidden sm:inline-block">
          {language === 'am' ? 'የወሩ አጠቃላይ እይታ እና ዋና ዋና ኩነቶች' : 'Landscape Overview & Compounding Milestones'}
        </span>
      </div>

      {/* 5x7 Calendar Grid */}
      <div className="border border-stone-800 rounded-sm overflow-hidden bg-paper">
        {/* Sage Green Weekday Header Row matching 122526.png */}
        <div className="grid grid-cols-7 bg-[#8AA868] border-b border-stone-800 text-stone-900">
          {weekdays.map((day) => (
            <div
              key={day}
              className="py-2.5 px-1 text-center font-serif text-[10px] sm:text-xs font-semibold tracking-wider border-r last:border-r-0 border-stone-800/40"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells (5 or 6 rows x 7 columns) */}
        <div className="grid grid-cols-7" role="grid" aria-label={`Monthly grid for ${monthName} ${year}`}>
          {tiles.map((tile, idx) => {
            const note = calendarNotes[tile.dateStr];
            const isToday = tile.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(tile.dateStr)}
                onKeyDown={(e) => handleCellKeyDown(tile.dateStr, e)}
                role="button"
                tabIndex={0}
                aria-label={`Date: ${tile.dateStr}${note ? ', note: ' + note : ', empty'}. Press Enter to edit.`}
                className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 border-b border-r last:border-r-0 border-stone-300 transition-colors flex flex-col justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                  tile.isCurrentMonth
                    ? 'bg-paper hover:bg-sage-surface/30'
                    : 'bg-paper-alt/40 opacity-40'
                } ${isToday ? 'ring-1 ring-inset ring-sage' : ''}`}
              >
                {/* Date Number in upper corner */}
                <div className="flex items-center justify-between">
                  <span
                    className={`font-serif text-xs font-medium ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-sage text-white flex items-center justify-center font-bold text-[10px]'
                        : tile.isCurrentMonth
                        ? 'text-stone-900 font-semibold'
                        : 'text-stone-400 italic'
                    }`}
                  >
                    {tile.dayNumber}
                  </span>
                  {note && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" title="Has journal note" />
                  )}
                </div>

                {/* Blank ruled writing lines or entered note */}
                <div className="flex-1 mt-1 flex flex-col justify-end space-y-2 overflow-hidden">
                  {note ? (
                    <p className="font-script text-ink text-xs line-clamp-3 leading-tight select-none">
                      {note}
                    </p>
                  ) : (
                    <>
                      <div className="w-full border-b border-stone-200/80" />
                      <div className="w-full border-b border-stone-200/80" />
                      <div className="w-full border-b border-stone-200/80" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Spiral Binding Loops matching reference image 122526.png */}
      <div className="mt-8 pt-4 flex justify-center">
        <SpiralBinding position="top" count={24} />
      </div>

      {/* Accessible Cell Note Edit Modal Dialog */}
      {selectedDate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cell-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 motion-reduce:transition-none"
        >
          <div className="bg-paper border border-border-subtle rounded-xl shadow-paper-lg p-5 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h4 id="cell-modal-title" className="font-serif font-semibold text-ink text-base">
                {language === 'am' ? `ማስታወሻ ለ ${selectedDate}` : `Notes for ${selectedDate}`}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label="Close note dialog"
                className="text-stone-400 hover:text-ink text-lg leading-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage rounded p-1"
              >
                &times;
              </button>
            </div>

            <div>
              <label htmlFor="calendar-day-note-input" className="block text-xs font-serif uppercase tracking-wider text-ink-muted mb-1">
                {language === 'am' ? 'የቀኑ ዋና ዋና ተግባራት እና ግዴታዎች' : 'Day Milestone & Commitments'}
              </label>
              <textarea
                id="calendar-day-note-input"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                rows={4}
                placeholder={
                  language === 'am'
                    ? 'ዋና ዋና ተግባራትን፣ ቀጠሮዎችን ወይም ማስታወሻዎችን እዚህ ይጻፉ...'
                    : 'Write focus items, events, appointments, or journal notes...'
                }
                autoFocus
                className="w-full bg-paper-alt border border-border-subtle rounded-lg p-3 text-sm font-serif text-ink focus:outline-none focus:border-sage resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <Link
                to={`/daily/${selectedDate}`}
                className="text-xs font-serif text-sage hover:text-sage-dark hover:underline flex items-center gap-1"
                title="Navigate to full daily planner and journal for this day"
              >
                <span>{language === 'am' ? 'ሙሉውን የዕለት ገጽ ክፈት →' : 'Open Full Daily Page →'}</span>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="px-3 py-1.5 text-xs font-serif text-ink-muted hover:text-ink cursor-pointer"
                >
                  {language === 'am' ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 text-xs font-serif font-medium bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors cursor-pointer shadow-xs"
                >
                  {language === 'am' ? 'አስቀምጥ' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
