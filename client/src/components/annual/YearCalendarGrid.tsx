import type { FC, KeyboardEvent } from 'react';
import { generateMonthGrid, getMonthName, isLeapYear } from '@planner/shared';
import { useLanguage } from '../../context/LanguageContext';

interface YearCalendarGridProps {
  year: number;
  weekStart?: 'monday' | 'sunday';
  onDateClick?: (dateStr: string) => void;
  onMonthClick?: (month: number) => void;
}

export const YearCalendarGrid: FC<YearCalendarGridProps> = ({
  year,
  weekStart = 'sunday',
  onDateClick,
  onMonthClick,
}) => {
  const { t, language } = useLanguage();

  const weekdays =
    language === 'am' && t.daysShort
      ? weekStart === 'monday'
        ? [t.daysShort[0], t.daysShort[1], t.daysShort[2], t.daysShort[3], t.daysShort[4], t.daysShort[5], t.daysShort[6]]
        : [t.daysShort[6], t.daysShort[0], t.daysShort[1], t.daysShort[2], t.daysShort[3], t.daysShort[4], t.daysShort[5]]
      : weekStart === 'monday'
        ? ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
        : ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  const getCardMonthName = (m: number) => {
    return language === 'am' && t.months?.[m - 1] ? t.months[m - 1] : getMonthName(m);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleMonthKeyDown = (month: number, e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onMonthClick?.(month);
    }
  };

  return (
    <div className="space-y-8">
      {/* Authentic "202_" large title matching reference image 122958.png */}
      <div className="text-center">
        <h2 className="font-serif text-4xl sm:text-5xl font-normal text-ink tracking-widest inline-block border-b-2 border-transparent hover:border-sage transition-colors pb-1">
          {year}
        </h2>
        {isLeapYear(year) && (
          <p className="text-xs text-sage font-serif italic mt-1.5 font-medium">
            {language === 'am'
              ? 'ድርብ ዓመት • 366 የታሰበባቸው ቀናት (የካቲት 29 ተካቷል)'
              : 'Leap Year • 366 Intentional Days (Feb 29 Included)'}
          </p>
        )}
      </div>

      {/* 12-Month Grid: 3 columns × 4 rows exactly as in reference image */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
          const tiles = generateMonthGrid(year, month, weekStart);
          const monthName = getCardMonthName(month);

          return (
            <div
              key={month}
              className="bg-paper p-4 rounded-xl border border-border-subtle hover:border-stone-400 transition-all hover:shadow-paper flex flex-col justify-between"
            >
              {/* Centered Serif Month Heading */}
              <div
                onClick={() => onMonthClick?.(month)}
                onKeyDown={(e) => handleMonthKeyDown(month, e)}
                className="text-center mb-3 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-sage rounded-md p-1"
                role="button"
                tabIndex={0}
                aria-label={`Open ${monthName} ${year} monthly planner`}
              >
                <h3 className="font-serif text-sm sm:text-base font-semibold uppercase tracking-widest text-ink group-hover:text-sage transition-colors">
                  {monthName}
                </h3>
                {month === 2 && isLeapYear(year) && (
                  <span className="text-[10px] font-sans text-sage font-medium block mt-0.5">
                    {language === 'am' ? t.leapYearBadge : 'Leap Year • 29 Days'}
                  </span>
                )}
              </div>

              {/* Weekday labels matching SU MO TU WE TH FR SA or Amharic */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekdays.map((wd) => (
                  <span
                    key={wd}
                    className="text-[9px] sm:text-[10px] font-serif uppercase tracking-wider text-ink/80 font-bold"
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Sage Green Rounded Square Tiles matching 122958.png with high-contrast legibility */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label={`${monthName} ${year} calendar`}>
                {tiles.map((tile, idx) => {
                  const isToday = tile.dateStr === todayStr;

                  if (!tile.isCurrentMonth) {
                    return (
                      <div
                        key={idx}
                        className="w-full aspect-square rounded-[3px] bg-transparent opacity-0 pointer-events-none"
                      />
                    );
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onDateClick?.(tile.dateStr)}
                      title={`${tile.dateStr}${isToday ? ` (${t.todayLabel || 'Today'})` : ''}`}
                      aria-label={`${tile.dateStr}${isToday ? ` (${t.todayLabel || 'Today'})` : ''}. Click to open week.`}
                      className={`w-full aspect-square rounded-[4px] flex items-center justify-center text-[11px] sm:text-xs font-sans font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                        isToday
                          ? 'bg-sage-dark text-white ring-2 ring-sage shadow-xs scale-105'
                          : 'bg-[#8CA862] hover:bg-sage-dark text-ink hover:text-white shadow-2xs border border-[#7A9652]'
                      }`}
                    >
                      {tile.dayNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
