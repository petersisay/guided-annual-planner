import React from 'react';
import { PlannerLayout } from '../components/layout/PlannerLayout';
import { SpiralBinding } from '../components/journal/SpiralBinding';
import { Compass, Heart } from 'lucide-react';

export const CreatorStoryPage: React.FC = () => {
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
                  alt="Official GP Logo"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-surface border border-sage/30 text-sage text-xs font-serif font-medium">
                <Compass className="w-3.5 h-3.5" />
                <span>The Origin Narrative</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-wide text-ink">
                Why I Created This?
              </h1>
              <p className="font-script text-lg text-ink-muted">
                From Addis Ababa with love & deliberate intention
              </p>
            </div>

            {/* Narrative Paragraphs transcribed verbatim from reference image 123051.png */}
            <div className="space-y-6 text-ink/90 font-serif text-base sm:text-lg leading-relaxed">
              <p>
                In Ethiopia, it&apos;s nearly impossible to find a journal that&apos;s more than just plain pages.
                I&apos;ve always been big on planning—whatever I do, I make sure to put everything on paper.
                But finding a guided planner here has been a real challenge. For years, I had to buy planners
                from other countries just to get something that matched my needs.
              </p>

              <p>
                Planning and journaling aren&apos;t just habits for me; they&apos;re how I leave a mark on my life.
                Every time I plan, I document my journey, and with each reflection, I see where I&apos;ve been and
                where I need to go. It&apos;s a process of constant growth and self-improvement.
              </p>

              <p>
                But as much as I loved using those imported planners, they never felt truly mine. They didn&apos;t
                reflect my culture, experiences, or how I wanted to live my life. That&apos;s why I decided to create
                my own planner—one that&apos;s guided, meaningful, and designed for people like me who want to leave a
                legacy of their journey, to look back, learn, and grow.
              </p>

              <p>
                Whenever I take out my journal, people often ask me how I do it, and I realize that others could
                benefit from the same guidance I was searching for. That&apos;s when I made it my mission to fulfill
                those requests and provide something that I, too, struggled to find.
              </p>

              <div className="p-6 bg-paper-alt border-l-2 border-sage rounded-r-xl my-6">
                <p className="italic text-ink font-serif text-lg leading-relaxed">
                  &ldquo;I hope this planner will not only help you stay organized but also inspire you to document
                  your life in a way that feels authentic and personal, just like it has for me.&rdquo;
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sage text-xs font-serif font-medium">
                <Heart className="w-4 h-4 fill-sage/20" />
                <span>Crafted for mindful creators</span>
              </div>
              <span className="font-script text-2xl text-ink">
                Peter Sisay
              </span>
            </div>
          </div>
        </div>
      </div>
    </PlannerLayout>
  );
};
