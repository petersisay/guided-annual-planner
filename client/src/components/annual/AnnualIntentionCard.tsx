import React, { useState, useEffect } from 'react';
import { Compass, Plus, Trash2, Check } from 'lucide-react';
import { AnnualPlan } from '@planner/shared';

interface AnnualIntentionCardProps {
  year: number;
  plan: AnnualPlan | null;
  onUpdatePlan: (updated: Partial<AnnualPlan>) => Promise<boolean | void>;
}

export const AnnualIntentionCard: React.FC<AnnualIntentionCardProps> = ({
  year,
  plan,
  onUpdatePlan,
}) => {
  const [theme, setTheme] = useState<string>('');
  const [intentions, setIntentions] = useState<string[]>([]);
  const [newIntention, setNewIntention] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (plan) {
      setTheme(plan.themeOrWord || '');
      setIntentions(plan.annualIntentions || []);
    }
  }, [plan]);

  const handleSaveTheme = async () => {
    setSaving(true);
    try {
      await onUpdatePlan({ themeOrWord: theme.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddIntention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntention.trim()) return;
    const updated = [...intentions, newIntention.trim()];
    setIntentions(updated);
    setNewIntention('');
    setSaving(true);
    try {
      await onUpdatePlan({ annualIntentions: updated });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveIntention = async (index: number) => {
    const updated = intentions.filter((_, i) => i !== index);
    setIntentions(updated);
    setSaving(true);
    try {
      await onUpdatePlan({ annualIntentions: updated });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Theme / Guiding Word Card */}
      <div className="bg-paper-alt border border-border-subtle rounded-xl p-6 shadow-paper flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-sage" />
            <span className="font-serif uppercase tracking-wider text-xs text-ink-muted font-semibold">
              Guiding Theme for {year}
            </span>
          </div>

          <p className="text-xs text-ink-muted mb-4 font-serif leading-relaxed">
            Choose a single word or anchor phrase that serves as your north star across the seasons.
          </p>

          <div className="relative">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onBlur={handleSaveTheme}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTheme()}
              placeholder="e.g. Flourish, Focus, Harmony..."
              className="w-full text-center font-serif text-2xl font-medium tracking-wide text-ink bg-paper border border-border-subtle rounded-lg py-4 px-3 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage shadow-xs"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-ink-muted">
          <span>{saveSuccess ? 'Theme saved' : 'Press Enter or click away to save'}</span>
          {saveSuccess && <Check className="w-3.5 h-3.5 text-sage" />}
        </div>
      </div>

      {/* Core Annual Intentions Card (Physical lined paper style) */}
      <div className="md:col-span-2 bg-paper border border-border-subtle rounded-xl p-6 shadow-paper flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sage" />
              <h3 className="font-serif text-lg text-ink font-semibold">
                Core Intentions & Commitments
              </h3>
            </div>
            <span className="text-xs text-ink-muted font-serif">
              {intentions.length} {intentions.length === 1 ? 'intention' : 'intentions'}
            </span>
          </div>

          <p className="text-xs text-ink-muted mb-4 font-serif">
            Root your actions in values rather than rigid deadlines. What are you dedicating yourself to this year?
          </p>

          {/* Lined Intentions List */}
          <div className="space-y-2 mb-4">
            {intentions.length === 0 ? (
              <p className="text-xs text-ink-muted italic py-3 text-center border border-dashed border-border-subtle rounded-lg">
                No intentions written yet. Add your first guiding intention below.
              </p>
            ) : (
              intentions.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between gap-3 p-2.5 bg-paper-alt border border-border-subtle rounded-lg transition-colors hover:border-border-strong"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="font-serif text-xs font-semibold text-sage mt-0.5">
                      {idx + 1}.
                    </span>
                    <span className="text-sm font-serif text-ink break-words">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveIntention(idx)}
                    className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-terracotta p-1 rounded transition-opacity cursor-pointer"
                    title="Remove intention"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Intention Input Form */}
        <form onSubmit={handleAddIntention} className="pt-3 border-t border-border-subtle flex gap-2">
          <input
            type="text"
            value={newIntention}
            onChange={(e) => setNewIntention(e.target.value)}
            placeholder="Write a new intention (e.g. Read 20 books, Daily contemplative walk)..."
            className="flex-1 px-3 py-2 text-xs font-serif bg-paper-alt border border-border-subtle rounded-lg text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
          />
          <button
            type="submit"
            disabled={saving || !newIntention.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-medium text-paper bg-sage hover:bg-sage-dark rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>
    </div>
  );
};
