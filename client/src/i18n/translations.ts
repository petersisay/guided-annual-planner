export type SupportedLanguage = 'en' | 'am';

export interface TranslationDictionary {
  appName: string;
  appTagline: string;
  theHorizons: string;
  philosophy: string;
  creatorStory: string;
  signIn: string;
  signOut: string;
  logOut: string;
  getStarted: string;
  enterPlanner: string;
  welcomeBack: string;
  welcomeToSpace: string;
  readCreatorStory: string;
  guide: string;
  howItWorks: string;
  coreIntention: string;
  annualVision: string;
  monthlyRhythm: string;
  weeklySpread: string;
  dailyFocus: string;
  settings: string;
  settingsAndBackup: string;
  account: string;
  planningPreferences: string;
  weekStartsOn: string;
  monday: string;
  sunday: string;
  topPriorities: string;
  secondaryTasks: string;
  dailyJournal: string;
  moodTracker: string;
  habitTracker: string;
  offlineNotice: string;
  syncedNotice: string;
  changePhoto: string;
  addPhoto: string;
  removePhoto: string;
  languageLabel: string;
  languageSelect: string;
  ethiopianOrigin: string;
  planWithIntention: string;
  liveWithClarity: string;
  heroSubheadline: string;
  compoundingQuote: string;
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'Guided Annual Planner',
    appTagline: 'Mindful Growth Edition',
    theHorizons: 'The Horizons',
    philosophy: 'Philosophy',
    creatorStory: 'Creator Story',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    logOut: 'Log Out',
    getStarted: 'Get Started',
    enterPlanner: 'Enter Planner',
    welcomeBack: 'Welcome back',
    welcomeToSpace: 'Welcome to Your Space',
    readCreatorStory: 'Read the Complete Creator Story',
    guide: 'Guide',
    howItWorks: 'How This Planner Works',
    coreIntention: 'Core Intention',
    annualVision: 'Annual Vision',
    monthlyRhythm: 'Monthly Rhythm',
    weeklySpread: 'Weekly 2-Page Spread',
    dailyFocus: 'Daily Focus & Journal',
    settings: 'Settings',
    settingsAndBackup: 'Settings & Backup',
    account: 'Your Account',
    planningPreferences: 'Planning Preferences',
    weekStartsOn: 'Week Starts On',
    monday: 'Monday',
    sunday: 'Sunday',
    topPriorities: 'Top 3 Priorities',
    secondaryTasks: 'Secondary Tasks',
    dailyJournal: 'Daily Journal & Reflection',
    moodTracker: 'Mood Tracker',
    habitTracker: 'Habit Consistency',
    offlineNotice: 'Offline Mode Active',
    syncedNotice: 'All changes synced',
    changePhoto: 'Change Photo',
    addPhoto: 'Add Profile Photo',
    removePhoto: 'Remove',
    languageLabel: 'Language / ቋንቋ',
    languageSelect: 'Select Language',
    ethiopianOrigin: 'Mindful Journaling • Ethiopian Origin Story',
    planWithIntention: 'Plan with Intention.',
    liveWithClarity: 'Live with Quiet Clarity.',
    heroSubheadline:
      'A paper-inspired sanctuary designed to bridge your daily focus, weekly momentum, monthly clarity, and annual horizon into a lifetime legacy.',
    compoundingQuote:
      'Doing small things before taking major steps compounds over time to create a huge impact.',
  },
  am: {
    appName: 'መሪ ዓመታዊ እቅድ አውጪ',
    appTagline: 'የማሰላሰል እና እድገት እትም',
    theHorizons: 'አድማሶች',
    philosophy: 'ፍልስፍና',
    creatorStory: 'የፈጣሪ ታሪክ',
    signIn: 'ይግቡ',
    signOut: 'ይውጡ',
    logOut: 'ይውጡ',
    getStarted: 'ይጀምሩ',
    enterPlanner: 'ወደ እቅድ አውጪው ግባ',
    welcomeBack: 'እንኳን ደህና መጡ',
    welcomeToSpace: 'እንኳን ወደ ግል ማስታወሻዎ በደህና መጡ',
    readCreatorStory: 'ሙሉውን የፈጣሪ ታሪክ ያንብቡ',
    guide: 'መመሪያ',
    howItWorks: 'ይህ እቅድ አውጪ እንዴት ይሰራል?',
    coreIntention: 'ዋና ዓላማ',
    annualVision: 'ዓመታዊ ራዕይ',
    monthlyRhythm: 'ወርሃዊ ምት',
    weeklySpread: 'ሳምንታዊ ባለሁለት ገጽ እቅድ',
    dailyFocus: 'ዕለታዊ ትኩረት እና ማስታወሻ',
    settings: 'ቅንብሮች',
    settingsAndBackup: 'ቅንብሮች እና ምትኬ',
    account: 'የእርስዎ መለያ',
    planningPreferences: 'የእቅድ ምርጫዎች',
    weekStartsOn: 'ሳምንት የሚጀምርበት ቀን',
    monday: 'ሰኞ',
    sunday: 'እሑድ',
    topPriorities: '3ቱ ዋና ዋና ቅድሚያዎች',
    secondaryTasks: 'ሁለተኛ ደረጃ ተግባራት',
    dailyJournal: 'ዕለታዊ ማስታወሻ እና ማሰላሰል',
    moodTracker: 'የስሜት መከታተያ',
    habitTracker: 'የልማድ ወጥነት',
    offlineNotice: 'ከመስመር ውጭ ሁነታ ነቅቷል',
    syncedNotice: 'ሁሉም ለውጦች ተመሳስለዋል',
    changePhoto: 'ፎቶ ቀይር',
    addPhoto: 'የመገለጫ ፎቶ አክል',
    removePhoto: 'አስወግድ',
    languageLabel: 'ቋንቋ / Language',
    languageSelect: 'ቋንቋ ይምረጡ',
    ethiopianOrigin: 'አስተዋይ ማስታወሻ • የኢትዮጵያ መነሻ ታሪክ',
    planWithIntention: 'በዓላማ ያቅዱ።',
    liveWithClarity: 'በመረጋጋት እና በግልፅነት ይኑሩ።',
    heroSubheadline:
      'ዕለታዊ ትኩረትዎን፣ ሳምንታዊ ጥረትዎን፣ ወርሃዊ ግልጽነትዎን እና ዓመታዊ ራዕይዎን ወደ ዘላቂ የህይወት ቅርስ ለማስተሳሰር የተነደፈ የወረቀት መንፈስ ያለው መድረክ።',
    compoundingQuote:
      'ትላልቅ እርምጃዎችን ከመውሰዳችን በፊት ጥቃቅን መልካም ነገሮችን በየቀኑ ማከናወን ውሎ አድሮ ትልቅ ለውጥ ያመጣል።',
  },
};
