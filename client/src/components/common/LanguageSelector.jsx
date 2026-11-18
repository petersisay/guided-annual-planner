import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageSelector = ({
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();

  const handleToggle = () => {
    const nextLang = language === 'en' ? 'am' : 'en';
    setLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`group inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 text-xs sm:text-sm font-serif font-semibold transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm active:scale-95 select-none ${
        language === 'am'
          ? 'bg-amber-100/90 border-amber-400 text-amber-950 hover:bg-amber-200 hover:border-amber-500'
          : 'bg-paper border-sage/40 text-forest hover:bg-sage hover:text-white hover:border-sage'
      } ${className}`}
      title={language === 'en' ? 'Switch to Amharic (አማርኛ)' : 'Switch to English'}
      aria-label={
        language === 'en'
          ? 'Switch interface language to Amharic'
          : 'ቋንቋን ወደ እንግሊዝኛ ቀይር (Switch to English)'
      }
    >
      <Globe className={`w-4 h-4 flex-shrink-0 transition-colors ${language === 'am' ? 'text-amber-800' : 'text-sage group-hover:text-white'}`} />
      <span className="flex items-center gap-1.5">
        <span className={language === 'en' ? 'font-bold underline decoration-sage/60 decoration-2 underline-offset-2' : 'opacity-70'}>EN</span>
        <span className="opacity-40">/</span>
        <span className={language === 'am' ? 'font-bold underline decoration-amber-600 decoration-2 underline-offset-2' : 'opacity-70'}>አማርኛ</span>
      </span>
    </button>
  );
};
