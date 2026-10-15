import React from 'react';
import { Heart, Trophy, BookOpen, Feather } from 'lucide-react';
import { DailyJournal } from '@planner/shared';
import { RuledInput, RuledLinesArea } from '../journal/RuledInput';

interface DailyJournalSectionProps {
  journal: DailyJournal;
  reflection: string;
  onUpdateJournal: (journal: DailyJournal) => void;
  onUpdateReflection: (reflection: string) => void;
}

export const DailyJournalSection: React.FC<DailyJournalSectionProps> = ({
  journal,
  reflection,
  onUpdateJournal,
  onUpdateReflection,
}) => {
  const gratitudeEntries = [
    journal?.gratitude?.[0] || '',
    journal?.gratitude?.[1] || '',
    journal?.gratitude?.[2] || '',
  ];

  const handleGratitudeChange = (index: number, val: string) => {
    const updated = [...gratitudeEntries];
    updated[index] = val;
    onUpdateJournal({
      ...journal,
      gratitude: [updated[0], updated[1], updated[2]],
    });
  };

  return (
    <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-sage" />
          <h2 className="font-serif text-lg font-semibold text-ink">
            Daily Journal &amp; Reflection
          </h2>
        </div>
        <p className="text-xs text-ink-muted font-serif mt-0.5">
          Take a quiet moment to ground your thoughts, count small gifts, and close the day with gratitude.
        </p>
      </div>

      {/* 3 Things I Am Grateful For */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-rose-500/80" />
          <h3 className="font-serif text-sm font-semibold text-ink">
            3 Gifts of Today &bull; Gratitude
          </h3>
        </div>
        <div className="space-y-2.5">
          {gratitudeEntries.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="font-serif text-xs text-ink-muted w-4 text-center select-none">
                {idx + 1}.
              </span>
              <RuledInput
                value={item}
                onChange={(val) => handleGratitudeChange(idx, val)}
                placeholder={`I am grateful for...`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Today's Wins */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-amber-600/80" />
          <h3 className="font-serif text-sm font-semibold text-ink">
            Today&apos;s Wins
          </h3>
        </div>
        <RuledInput
          value={journal.wins || ''}
          onChange={(val) => onUpdateJournal({ ...journal, wins: val })}
          placeholder="Small steps, quiet victories, or breakthroughs..."
        />
      </div>

      {/* Challenges & Lessons */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-sage" />
          <h3 className="font-serif text-sm font-semibold text-ink">
            Challenges &amp; Lessons Learned
          </h3>
        </div>
        <RuledInput
          value={journal.challengesAndLessons || ''}
          onChange={(val) => onUpdateJournal({ ...journal, challengesAndLessons: val })}
          placeholder="What friction arose, and what did it teach me?"
        />
      </div>

      {/* Free-writing Ruled Area */}
      <div className="space-y-2">
        <h3 className="font-serif text-sm font-semibold text-ink">
          Evening Notes &amp; Stream of Consciousness
        </h3>
        <RuledLinesArea
          value={journal.freeWriting || ''}
          onChange={(val) => onUpdateJournal({ ...journal, freeWriting: val })}
          lines={4}
          placeholder="Unload thoughts, ideas, or impressions from the day..."
        />
      </div>

      {/* End-of-Day Reflection */}
      <div className="space-y-2 border-t border-border-subtle pt-4">
        <h3 className="font-serif text-sm font-semibold text-ink">
          Closing Reflection
        </h3>
        <RuledInput
          value={reflection}
          onChange={onUpdateReflection}
          placeholder="One thought to close the day with peace..."
        />
      </div>
    </div>
  );
};
