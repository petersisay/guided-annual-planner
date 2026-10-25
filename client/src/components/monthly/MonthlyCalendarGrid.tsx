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
  const monthName = language === 'am' && t.months?.[month - 1] ? t.months[month - 1] : getMonthName(month);
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
          {language === 'am' ? `ወር ${month} (MONTH ${month})` : `MONTH ${month}`}{' '}
          <span className="text-stone-400 font-light text-xl">
            | {monthName} {year}
          </span>
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

            if (!tile.isCurrentMonth) {
              return (
                <div
                  key={idx}
                  className="min-h-[105px] sm:min-h-[135px] border-b border-r last:border-r-0 border-stone-800/40 bg-stone-100/50 p-2 opacity-30 select-none"
                  aria-hidden="true"
                />
              );
            }

            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={() => handleCellClick(tile.dateStr)}
                onKeyDown={(e) => handleCellKeyDown(tile.dateStr, e)}
                aria-label={`${tile.dateStr}: ${note || 'No notes'}. Click to edit milestone.`}
                className={`min-h-[105px] sm:min-h-[135px] border-b border-r last:border-r-0 border-stone-800/40 p-2 sm:p-2.5 flex flex-col justify-between transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                  isToday ? 'bg-sage/10 font-medium' : 'bg-paper hover:bg-stone-50'
                }`}
              >
                {/* Day number at top right of cell */}
                <div className="flex items-center justify-between">
                  {note ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                  ) : (
                    <span />
                  )}
                  <span
                    className={`font-serif text-xs sm:text-sm ${
                      isToday
                        ? 'font-bold text-sage underline decoration-2'
                        : 'text-stone-700 group-hover:text-ink'
                    }`}
                  >
                    {tile.dayNumber}
                  </span>
                </div>

                {/* Optional Note excerpt preview inside cell */}
                <div className="mt-1 flex-1 overflow-hidden">
                  {note && (
                    <p className="font-serif text-[11px] sm:text-xs text-ink/80 line-clamp-3 leading-snug">
                      {note}
                    </p>
                  )}
                </div>

                {/* Subtle affordance hint */}
                <span className="text-[10px] text-sage opacity-0 group-hover:opacity-100 transition-opacity font-serif">
                  {language === 'am' ? '+ ማስታወሻ' : '+ Note'}
                </span>
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
                {language === 'am' ? `${t.notesForDate || 'ማስታወሻ ለ'} ${selectedDate}` : `Notes for ${selectedDate}`}
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
                {language === 'am' ? t.dayMilestoneLabel : 'Day Milestone & Commitments'}
              </label>
              <textarea
                id="calendar-day-note-input"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                rows={4}
                placeholder={
                  language === 'am'
                    ? t.notesPlaceholder
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
                <span>{language === 'am' ? t.openDailyPage : 'Open Full Daily Page →'}</span>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="px-3 py-1.5 text-xs font-serif text-ink-muted hover:text-ink cursor-pointer"
                >
                  {language === 'am' ? t.cancel : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 text-xs font-serif font-medium bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors cursor-pointer shadow-xs"
                >
                  {language === 'am' ? t.saveNote : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
