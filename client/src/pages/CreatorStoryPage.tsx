import React from 'react';
import { PlannerLayout } from '../components/layout/PlannerLayout';
import { SpiralBinding } from '../components/journal/SpiralBinding';
import { Compass, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const CreatorStoryPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <PlannerLayout>
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Authentic Journal Page matching reference image 123051.png */}
        <div className="relative bg-paper border border-border-subtle rounded-2xl shadow-paper-lg p-8 sm:p-14 overflow-hidden">
          {/* Left Spiral Binding Ring Holes */}
          <div className="absolute left-0 top-0 bottom-0 z-10">
            <SpiralBinding position="left" count={26} />
          </div>

          <div className="pl-6 sm:pl-10 space-y-8 max-w-2xl mx-auto">
            {/* Header: "Why I Created This?" */}
            <div className="text-center space-y-3 border-b border-stone-200 pb-6">
              <div className="flex justify-center mb-1">
                <img
                  src="/images/gp-monogram.png"
                  alt="Guided Annual Planner Logo"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-surface border border-sage/30 text-sage text-xs font-serif font-medium">
                <Compass className="w-3.5 h-3.5" />
                <span>{t.originNarrativeBadge}</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-wide text-ink">
                {t.creatorStoryHeading}
              </h1>
              <p className="font-script text-lg text-ink-muted">
                {t.creatorStorySubheading}
              </p>
            </div>

            {/* Narrative Paragraphs transcribed verbatim from reference image 123051.png */}
            <div className="space-y-6 text-ink/90 font-serif text-base sm:text-lg leading-relaxed">
              <p>{t.storyP1}</p>
              <p>{t.storyP2}</p>
              <p>{t.storyP3}</p>
              <p>{t.storyP4}</p>

              <div className="p-6 bg-paper-alt border-l-2 border-sage rounded-r-xl my-6">
                <p className="italic text-ink font-serif text-lg leading-relaxed">
                  &ldquo;{t.storyQuote}&rdquo;
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sage text-xs font-serif font-medium">
                <Heart className="w-4 h-4 fill-sage/20" />
                <span>{t.craftedForCreators}</span>
              </div>
              <span className="font-script text-2xl text-ink">
                {t.founderName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PlannerLayout>
  );
};
