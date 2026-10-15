import React, { useState, useEffect } from 'react';
import { BookOpen, Award, ShieldAlert, Lightbulb, Check } from 'lucide-react';
import { AnnualPlan, AnnualReviewData } from '@planner/shared';

interface AnnualReviewSectionProps {
  year: number;
  plan: AnnualPlan | null;
  onUpdatePlan: (updated: Partial<AnnualPlan>) => Promise<boolean | void>;
}

export const AnnualReviewSection: React.FC<AnnualReviewSectionProps> = ({
  year,
  plan,
  onUpdatePlan,
}) => {
  const [celebrations, setCelebrations] = useState<string>('');
  const [obstacles, setObstacles] = useState<string>('');
  const [lessons, setLessons] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (plan?.annualReview) {
      setCelebrations(plan.annualReview.celebrations || '');
      setObstacles(plan.annualReview.obstaclesEncountered || '');
      setLessons(plan.annualReview.keyLessonsLearned || '');
    }
  }, [plan]);

  const handleSaveReview = async () => {
    setSaving(true);
    try {
      const reviewData: AnnualReviewData = {
        celebrations: celebrations.trim() || undefined,
        obstaclesEncountered: obstacles.trim() || undefined,
        keyLessonsLearned: lessons.trim() || undefined,
        completedAt: new Date().toISOString(),
      };
      await onUpdatePlan({ annualReview: reviewData });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-paper border border-border-subtle rounded-xl p-6 shadow-paper space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sage" />
            <h3 className="font-serif text-xl text-ink font-semibold">
              {year} Annual Retrospective & Reflections
            </h3>
          </div>
          <p className="text-xs text-ink-muted mt-1 font-serif">
            Distill the year's journey into insight. Reflect honestly on what brought life, what tested you, and what you learned.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveReview}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-serif font-medium text-paper bg-sage hover:bg-sage-dark rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs self-start sm:self-auto"
        >
          {saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </>
          ) : (
            <span>{saving ? 'Saving...' : 'Save Retrospective'}</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Celebrations */}
        <div className="bg-paper-alt border border-border-subtle rounded-xl p-4 shadow-paper flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-ochre" />
            <h4 className="font-serif text-sm font-semibold text-ink">
              Celebrations & Milestones
            </h4>
          </div>
          <p className="text-[11px] text-ink-muted font-serif mb-3">
            What went well? Small wins, triumphs, and joyful moments to honor.
          </p>
          <textarea
            value={celebrations}
            onChange={(e) => setCelebrations(e.target.value)}
            rows={6}
            placeholder="Document your proudest achievements, joyful encounters, and breakthroughs..."
            className="w-full flex-1 p-3 text-xs font-serif bg-paper border border-border-subtle rounded-lg text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage resize-none leading-relaxed"
          />
        </div>

        {/* Obstacles Encountered */}
        <div className="bg-paper-alt border border-border-subtle rounded-xl p-4 shadow-paper flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-terracotta" />
            <h4 className="font-serif text-sm font-semibold text-ink">
              Obstacles & Challenges
            </h4>
          </div>
          <p className="text-[11px] text-ink-muted font-serif mb-3">
            Where did you meet resistance, fatigue, or friction? What tested you?
          </p>
          <textarea
            value={obstacles}
            onChange={(e) => setObstacles(e.target.value)}
            rows={6}
            placeholder="Acknowledge setbacks, pivots, and emotional low tides with compassion..."
            className="w-full flex-1 p-3 text-xs font-serif bg-paper border border-border-subtle rounded-lg text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage resize-none leading-relaxed"
          />
        </div>

        {/* Key Lessons Learned */}
        <div className="bg-paper-alt border border-border-subtle rounded-xl p-4 shadow-paper flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-sage" />
            <h4 className="font-serif text-sm font-semibold text-ink">
              Key Lessons & Wisdom
            </h4>
          </div>
          <p className="text-[11px] text-ink-muted font-serif mb-3">
            What principles or truths will you carry forward into future chapters?
          </p>
          <textarea
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            rows={6}
            placeholder="Summarize the timeless wisdom this year taught you..."
            className="w-full flex-1 p-3 text-xs font-serif bg-paper border border-border-subtle rounded-lg text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
