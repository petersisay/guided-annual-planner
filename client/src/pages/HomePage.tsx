import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  LayoutGrid,
  Sun,
  Heart,
  ArrowRight,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LandingAnimatedBackground } from '../components/common/LandingAnimatedBackground';
import { LanguageSelector } from '../components/common/LanguageSelector';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col antialiased selection:bg-sage/20 selection:text-ink">
      {/* Public Top Navigation */}
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/images/gp-monogram.png"
              alt="Guided Annual Planner Logo"
              className="w-9 h-9 object-contain flex-shrink-0 transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-serif font-semibold text-ink text-base tracking-tight leading-none">
                {t.appName}
              </span>
              <span className="text-[10px] text-ink-muted font-serif italic">
                {t.appTagline}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-serif text-sm">
            <a href="#horizons" className="text-ink-muted hover:text-ink transition-colors">
              {t.theHorizons}
            </a>
            <a href="#philosophy" className="text-ink-muted hover:text-ink transition-colors">
              {t.philosophy}
            </a>
            <Link to="/story" className="text-ink-muted hover:text-ink transition-colors">
              {t.creatorStory}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            {user ? (
              <Link
                to="/annual"
                className="inline-flex items-center gap-2 px-4 py-2 bg-sage hover:bg-sage-dark text-white rounded-xl font-serif text-sm font-medium transition-all shadow-xs"
              >
                <span>{t.enterPlanner}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-serif text-ink-muted hover:text-ink transition-colors"
                >
                  {t.signIn}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sage hover:bg-sage-dark text-white rounded-xl font-serif text-sm font-medium transition-all shadow-xs"
                >
                  <span>{t.getStarted}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-border-subtle bg-radial from-paper-alt/60 via-paper to-paper">
        <LandingAnimatedBackground />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Botanical Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-surface border border-sage/30 text-sage text-xs font-serif font-medium shadow-xs">
            <Compass className="w-3.5 h-3.5" />
            <span>{t.ethiopianOrigin}</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-ink leading-tight">
              {t.planWithIntention} <br />
              <span className="italic font-normal font-serif text-sage">
                {t.liveWithClarity}
              </span>
            </h1>
            <p className="max-w-2xl mx-auto font-serif text-base sm:text-xl text-ink-muted leading-relaxed">
              {t.heroSubheadline}
            </p>
          </div>

          {/* Primary Compounding Philosophy Banner */}
          <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-paper-alt border border-border-subtle rounded-2xl shadow-paper relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-sage text-white text-[11px] font-serif uppercase tracking-widest rounded-full">
              {t.corePhilosophyLabel}
            </div>
            <blockquote className="font-serif text-lg sm:text-2xl text-ink italic leading-snug">
              &ldquo;{t.compoundingQuote}&rdquo;
            </blockquote>
            <p className="font-serif text-xs text-ink-muted mt-2">
              {t.guidingPrincipleLabel}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to={user ? '/annual' : '/login'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-sage hover:bg-sage-dark text-white rounded-xl font-serif text-base font-medium transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>{user ? t.openYourJournal : t.getStartedWithPlanner}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/story"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-paper-alt hover:bg-paper text-ink border border-border-subtle rounded-xl font-serif text-base transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-sage" />
              <span>{t.readOriginStory}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The 4 Connected Horizons */}
      <section id="horizons" className="py-20 sm:py-28 bg-paper border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-serif uppercase tracking-widest text-sage font-medium">
              {t.unifiedArchitecture}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-ink">
              {t.fourHorizonsHeadline}
            </h2>
            <p className="font-serif text-sm sm:text-base text-ink-muted leading-relaxed">
              {t.fourHorizonsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Horizon 1: Annual */}
            <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 space-y-4 hover:border-sage/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sage/10 text-sage flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-serif uppercase tracking-wider text-sage font-semibold">
                  Horizon 1
                </span>
                <h3 className="font-serif text-xl font-medium text-ink">{t.h1Title}</h3>
                <p className="font-serif text-xs text-ink-muted leading-relaxed">
                  {t.h1Desc}
                </p>
              </div>
              <ul className="text-xs font-serif text-ink-muted space-y-2 border-t border-border-subtle pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h1Point1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h1Point2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h1Point3}</span>
                </li>
              </ul>
            </div>

            {/* Horizon 2: Monthly */}
            <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 space-y-4 hover:border-sage/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sage/10 text-sage flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-serif uppercase tracking-wider text-sage font-semibold">
                  Horizon 2
                </span>
                <h3 className="font-serif text-xl font-medium text-ink">{t.h2Title}</h3>
                <p className="font-serif text-xs text-ink-muted leading-relaxed">
                  {t.h2Desc}
                </p>
              </div>
              <ul className="text-xs font-serif text-ink-muted space-y-2 border-t border-border-subtle pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h2Point1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h2Point2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h2Point3}</span>
                </li>
              </ul>
            </div>

            {/* Horizon 3: Weekly */}
            <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 space-y-4 hover:border-sage/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sage/10 text-sage flex items-center justify-center">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-serif uppercase tracking-wider text-sage font-semibold">
                  Horizon 3
                </span>
                <h3 className="font-serif text-xl font-medium text-ink">{t.h3Title}</h3>
                <p className="font-serif text-xs text-ink-muted leading-relaxed">
                  {t.h3Desc}
                </p>
              </div>
              <ul className="text-xs font-serif text-ink-muted space-y-2 border-t border-border-subtle pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h3Point1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h3Point2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h3Point3}</span>
                </li>
              </ul>
            </div>

            {/* Horizon 4: Daily */}
            <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 space-y-4 hover:border-sage/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sage/10 text-sage flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-serif uppercase tracking-wider text-sage font-semibold">
                  Horizon 4
                </span>
                <h3 className="font-serif text-xl font-medium text-ink">{t.h4Title}</h3>
                <p className="font-serif text-xs text-ink-muted leading-relaxed">
                  {t.h4Desc}
                </p>
              </div>
              <ul className="text-xs font-serif text-ink-muted space-y-2 border-t border-border-subtle pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h4Point1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h4Point2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                  <span>{t.h4Point3}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section id="philosophy" className="py-20 sm:py-28 bg-paper-alt border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-serif uppercase tracking-widest text-sage font-medium">
              {t.guidingPrincipleLabel}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-ink">
              {t.quietIntentionHeading}
            </h2>
            <p className="font-serif text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
              {t.philosophyBody1}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-paper border border-border-subtle rounded-2xl space-y-3 shadow-xs">
              <div className="text-2xl font-serif text-sage font-bold">01</div>
              <h3 className="font-serif text-xl font-medium text-ink">
                {language === 'am' ? 'የ3ቱ ቅድሚያዎች ህግ' : 'The Rule of 3'}
              </h3>
              <p className="font-serif text-xs sm:text-sm text-ink-muted leading-relaxed">
                {language === 'am'
                  ? 'ሁሉም ነገር ቅድሚያ ሲሰጠው፣ ምንም ቅድሚያ አይኖረውም። እያንዳንዱን ቀን በ3 ትርጉም ባላቸው የትኩረት ነጥቦች መገደብ ያለ አእምሮ ድካም ዘላቂ ፍጥነት ይፈጥራል።'
                  : 'When everything is a priority, nothing is. Limiting each day to 3 meaningful focus items creates sustainable momentum without cognitive exhaustion.'}
              </p>
            </div>

            <div className="p-8 bg-paper border border-border-subtle rounded-2xl space-y-3 shadow-xs">
              <div className="text-2xl font-serif text-sage font-bold">02</div>
              <h3 className="font-serif text-xl font-medium text-ink">
                {language === 'am' ? 'ከጥፋተኝነት ነጻ የሆነ ወጥነት' : 'Non-Guilt Consistency'}
              </h3>
              <p className="font-serif text-xs sm:text-sm text-ink-muted leading-relaxed">
                {language === 'am'
                  ? 'ህይወት ቀጥተኛ መስመር አይደለችም። የልማድ ማትሪክስ እና የስሜት መከታተያዎቻችን ለስላሳ ራስን ማወቅ የተነደፉ ናቸው እንጂ ለጭንቀት አይደለም።'
                  : 'Life is nonlinear. Our habit matrix and mood trackers are designed for gentle self-awareness, not punitive streak-breaking anxiety.'}
              </p>
            </div>

            <div className="p-8 bg-paper border border-border-subtle rounded-2xl space-y-3 shadow-xs">
              <div className="text-2xl font-serif text-sage font-bold">03</div>
              <h3 className="font-serif text-xl font-medium text-ink">
                {language === 'am' ? 'የማባዛት ውጤት' : 'Compounding Impact'}
              </h3>
              <p className="font-serif text-xs sm:text-sm text-ink-muted leading-relaxed">
                {language === 'am'
                  ? 'በየቀኑ ሶስት የታሰበባቸው ተግባራትን ማጠናቀቅ በዓመት ከ1,000 በላይ ትርጉም ያላቸው ስኬቶችን ያስገኛል። ትናንሽ፣ ጸጥተኛ ታማኝነቶች ወደ ዘላቂ የህይወት ቅርስዎ ይባዛሉ።'
                  : 'Completing three intentional actions daily yields over 1,000 meaningful milestones in a year. Small, quiet faithfulness compounds into your lifetime legacy.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Story Spotlight */}
      <section className="py-20 sm:py-28 bg-paper border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 bg-paper-alt border border-border-subtle rounded-3xl shadow-paper relative overflow-hidden space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/images/gp-monogram.png"
                alt="GP Logo"
                className="w-12 h-12 object-contain"
              />
              <div>
                <span className="font-serif font-semibold text-ink text-lg block leading-none">
                  {t.founderName}
                </span>
                <span className="text-xs text-ink-muted font-serif italic">
                  {t.founderRole}
                </span>
              </div>
            </div>

            <blockquote className="font-serif text-lg sm:text-xl text-ink leading-relaxed italic border-l-2 border-sage pl-4 sm:pl-6">
              &ldquo;{t.storyQuote}&rdquo;
            </blockquote>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border-subtle">
              <div className="flex items-center gap-2 text-xs font-serif text-sage">
                <Heart className="w-4 h-4 fill-sage/20" />
                <span>{t.craftedForCreators}</span>
              </div>
              <Link
                to="/story"
                className="inline-flex items-center gap-1.5 text-sm font-serif font-medium text-sage hover:text-sage-dark hover:underline"
              >
                <span>{t.readCreatorStory}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-radial from-sage-surface/40 to-paper text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-ink">
            {t.beginJourneyHeadline}
          </h2>
          <p className="font-serif text-sm sm:text-base text-ink-muted max-w-xl mx-auto">
            {t.beginJourneySubheadline}
          </p>
          <div className="pt-2">
            <Link
              to={user ? '/annual' : '/login'}
              className="inline-flex items-center gap-2 px-8 py-4 bg-sage hover:bg-sage-dark text-white rounded-xl font-serif text-base font-medium transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>{user ? t.openYourJournal : t.getStartedFree}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Restrained Footer */}
      <footer className="bg-paper-alt border-t border-border-subtle py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <img
              src="/images/gp-monogram.png"
              alt="GP Monogram"
              className="w-8 h-8 object-contain"
            />
            <div>
              <span className="font-serif font-semibold text-ink text-sm block leading-none">
                {t.appName}
              </span>
              <span className="text-[11px] font-serif text-ink-muted">
                {t.appTagline} &bull; Addis Ababa
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 font-serif text-xs text-ink-muted">
            <Link to="/annual" className="hover:text-ink transition-colors">
              {language === 'am' ? 'ዓመታዊ አድማስ' : 'Annual Horizon'}
            </Link>
            <Link to="/monthly/2026/1" className="hover:text-ink transition-colors">
              {language === 'am' ? 'ወርሃዊ' : 'Monthly'}
            </Link>
            <Link to="/weekly/2026/1" className="hover:text-ink transition-colors">
              {language === 'am' ? 'ሳምንታዊ እቅድ' : 'Weekly Spread'}
            </Link>
            <Link to="/daily" className="hover:text-ink transition-colors">
              {language === 'am' ? 'ዕለታዊ ማስታወሻ' : 'Daily Focus'}
            </Link>
            <Link to="/story" className="hover:text-ink transition-colors">
              {t.creatorStory}
            </Link>
          </div>

          <div className="text-xs font-serif text-ink-muted">
            &copy; {new Date().getFullYear()} {t.appName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
