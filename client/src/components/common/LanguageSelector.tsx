import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage } from '../../i18n/translations';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'minimal' | 'button' | 'badge';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'badge',
}) => {
  const { language, setLanguage } = useLanguage();

  const handleToggle = () => {
    const nextLang: SupportedLanguage = language === 'en' ? 'am' : 'en';
    setLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-serif transition-all cursor-pointer shadow-2xs select-none ${
        language === 'am'
          ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-semibold'
          : 'bg-paper-alt hover:bg-paper border-border-subtle text-ink-muted hover:text-ink'
      } ${className}`}
      title={language === 'en' ? 'Switch to Amharic (አማርኛ)' : 'Switch to English'}
      aria-label="Toggle language option"
    >
      <Globe className="w-3.5 h-3.5 text-sage flex-shrink-0" />
      <span className="flex items-center gap-1">
        <span className={language === 'en' ? 'font-bold text-ink' : 'opacity-60'}>EN</span>
        <span className="opacity-40">/</span>
        <span className={language === 'am' ? 'font-bold text-ink' : 'opacity-60'}>አማርኛ</span>
      </span>
    </button>
  );
};
