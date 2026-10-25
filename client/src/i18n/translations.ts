export type SupportedLanguage = 'en' | 'am';

export interface TranslationDictionary {
  // Brand & Shell
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
  howItWorksSub: string;
  coreIntention: string;
  aboutThisPlanner: string;

  // 4 Horizons
  annualVision: string;
  annualVisionDesc: string;
  monthlyRhythm: string;
  monthlyRhythmDesc: string;
  weeklySpread: string;
  weeklySpreadDesc: string;
  dailyFocus: string;
  dailyFocusDesc: string;

  // Philosophy & Landing Details
  corePhilosophy: string;
  whyPaperMatters: string;
  whyPaperMattersDesc: string;
  ethiopianOrigin: string;
  planWithIntention: string;
  liveWithClarity: string;
  heroSubheadline: string;
  compoundingQuote: string;
  fourHorizonsHeadline: string;
  fourHorizonsSubheadline: string;
  openJournal: string;
  getStartedPlanner: string;
  readOriginStory: string;
  guidingPrincipleSub: string;
  unifiedArchitecture: string;
  guidingPhilosophy: string;
  whySmallStepsMatter: string;
  whySmallStepsDesc: string;
  theRuleOfThreeTitle: string;
  theRuleOfThreeDesc: string;
  nonGuiltTitle: string;
  nonGuiltDesc: string;
  compoundingImpactTitle: string;
  compoundingImpactDesc: string;
  craftedForMindfulCreators: string;
  beginGuidedJourney: string;
  beginGuidedJourneySub: string;
  getStartedFree: string;

  // Creator Story
  creatorName: string;
  creatorRole: string;
  creatorQuote: string;

  // Guide Steps
  guideStep1Title: string;
  guideStep1Desc: string;
  guideStep2Title: string;
  guideStep2Desc: string;
  guideStep3Title: string;
  guideStep3Desc: string;

  // Days & Months
  daysShort: string[];
  daysFull: string[];
  months: string[];

  // Settings & Preferences
  settings: string;
  settingsAndBackup: string;
  account: string;
  planningPreferences: string;
  calendarAndAppearance: string;
  weekStartsOn: string;
  weekStartsOnDesc: string;
  monday: string;
  mondayDesc: string;
  sunday: string;
  sundayDesc: string;
  themeLabel: string;
  themeWarm: string;
  themeWarmDesc: string;
  themeEditorial: string;
  themeEditorialDesc: string;
  gentleTransitions: string;
  gentleTransitionsDesc: string;
  savePreferences: string;
  savedToProfile: string;
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
  languageDesc: string;
  englishOption: string;
  amharicOption: string;
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
    howItWorksSub: 'A simple guide to calm, focused planning',
    coreIntention: 'Core Intention',
    aboutThisPlanner: 'About This Planner',

    annualVision: 'Annual Vision',
    annualVisionDesc:
      'Capture lifetime ambitions, annual theme words, and overarching quarterly milestones on a single, expansive view.',
    monthlyRhythm: 'Monthly Rhythm',
    monthlyRhythmDesc:
      'Full-month calendar dashboard, habit consistency heatmaps, and emotional reflections with zero clutter.',
    weeklySpread: 'Weekly 2-Page Spread',
    weeklySpreadDesc:
      'Tactile physical 2-page spread featuring the Rule of 3, daily scheduling blocks, and dedicated notes.',
    dailyFocus: 'Daily Focus & Journal',
    dailyFocusDesc:
      'Deep daily execution. Top 3 non-negotiables, hour-by-hour timeline, gratitude, and evening reflection.',

    corePhilosophy: 'Core Philosophy',
    whyPaperMatters: 'Why Paper-Inspired Planning Matters',
    whyPaperMattersDesc:
      'Digital tools often fragment attention with endless notifications. This planner preserves the serene, deliberate feel of putting pen to paper while giving you effortless synchronization.',
    ethiopianOrigin: 'Mindful Journaling • Ethiopian Origin Story',
    planWithIntention: 'Plan with Intention.',
    liveWithClarity: 'Live with Quiet Clarity.',
    heroSubheadline:
      'A paper-inspired sanctuary designed to bridge your daily focus, weekly momentum, monthly clarity, and annual horizon into a lifetime legacy.',
    compoundingQuote:
      'Doing small things before taking major steps compounds over time to create a huge impact.',
    fourHorizonsHeadline: 'Four Horizons, One Continuous Journey',
    fourHorizonsSubheadline:
      'Most productivity tools fragment your attention. The Guided Annual Planner connects every moment to your overarching vision.',
    openJournal: 'Open Your Journal',
    getStartedPlanner: 'Get Started with Your Planner',
    readOriginStory: 'Read the Origin Story',
    guidingPrincipleSub: 'The Guiding Principle of the Guided Annual Planner',
    unifiedArchitecture: 'Unified Architecture',
    guidingPhilosophy: 'The Guiding Philosophy',
    whySmallStepsMatter: 'Why Small Steps Matter',
    whySmallStepsDesc:
      'Grand resolutions without daily architecture fade quickly. Our system grounds you in intentional rhythm.',
    theRuleOfThreeTitle: 'The Rule of 3',
    theRuleOfThreeDesc:
      'When everything is a priority, nothing is. Limiting each day to 3 meaningful focus items creates sustainable momentum without cognitive exhaustion.',
    nonGuiltTitle: 'Non-Guilt Consistency',
    nonGuiltDesc:
      'Life is nonlinear. Our habit matrix and mood trackers are designed for gentle self-awareness, not punitive streak-breaking anxiety.',
    compoundingImpactTitle: 'Compounding Impact',
    compoundingImpactDesc:
      'Completing three intentional actions daily yields over 1,000 meaningful milestones in a year. Small, quiet faithfulness compounds into your lifetime legacy.',
    craftedForMindfulCreators: 'Crafted for mindful creators everywhere',
    beginGuidedJourney: 'Begin Your Guided Journey Today',
    beginGuidedJourneySub:
      'Take the first small, deliberate step toward clarity, steady progress, and mindful living.',
    getStartedFree: 'Get Started — It’s Free',

    creatorName: 'Peter Sisay',
    creatorRole: 'Creator • Addis Ababa, Ethiopia',
    creatorQuote:
      'In Ethiopia, it’s nearly impossible to find a journal that’s more than just plain pages. Planning and journaling aren’t just habits for me; they’re how I leave a mark on my life. I created this planner to provide something that is guided, meaningful, and designed for people who want to document their journey and grow.',

    guideStep1Title: '1. Set Your Annual Vision',
    guideStep1Desc: 'Begin each year with your anchor word and core intentions.',
    guideStep2Title: '2. Monthly Rhythms',
    guideStep2Desc: 'Track your daily mood and habits over all 365 days.',
    guideStep3Title: '3. The Rule of 3',
    guideStep3Desc: 'Focus on exactly 3 vital priorities each morning to compound real momentum.',

    daysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    daysFull: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],

    settings: 'Settings',
    settingsAndBackup: 'Settings & Backup',
    account: 'Your Account',
    planningPreferences: 'Planning Preferences',
    calendarAndAppearance: 'Calendar & Appearance',
    weekStartsOn: 'Week Starts On',
    weekStartsOnDesc: 'Choose whether your weekly plan and calendar start on Monday or Sunday.',
    monday: 'Monday',
    mondayDesc: 'Standard workweek view (Saturday & Sunday grouped together)',
    sunday: 'Sunday',
    sundayDesc: 'Traditional calendar format starting on Sunday',
    themeLabel: 'Page Look & Color Theme',
    themeWarm: 'Warm Linen',
    themeWarmDesc: 'Soft, relaxing cream paper tone with gentle green accents',
    themeEditorial: 'Classic Editorial',
    themeEditorialDesc: 'Clean, crisp white paper style',
    gentleTransitions: 'Gentle Transitions',
    gentleTransitionsDesc: 'Turn off fast page animations for a calmer, simpler screen experience',
    savePreferences: 'Save Preferences',
    savedToProfile: 'Saved to Profile',
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
    languageDesc: 'Choose your preferred interface language between English and Amharic (አማርኛ).',
    englishOption: '🇺🇸 English (Default)',
    amharicOption: '🇪🇹 አማርኛ (Amharic)',
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
    howItWorksSub: 'ለረጋ እና ውጤታማ እቅድ አጭር መመሪያ',
    coreIntention: 'ዋና ዓላማ',
    aboutThisPlanner: 'ስለ እቅድ አውጪው',

    annualVision: 'ዓመታዊ ራዕይ',
    annualVisionDesc:
      'የህይወት ዘመን ምኞቶችዎን፣ የዓመቱን መሪ ቃል እና ዋና ዋና ሩብ ዓመታዊ ግቦችን በአንድ ሰፊ እይታ ይመልከቱ።',
    monthlyRhythm: 'ወርሃዊ ምት',
    monthlyRhythmDesc:
      'ሙሉ የወር የቀን መቁጠሪያ፣ የልማድ ወጥነት ሰንጠረዥ እና ከስሜት ውጣ ውረድ የጸዳ ማሰላሰያ።',
    weeklySpread: 'ሳምንታዊ ባለሁለት ገጽ እቅድ',
    weeklySpreadDesc:
      'የ3ቱን ዋና ቅድሚያዎች ህግ፣ ዕለታዊ የሰዓት መደቦችን እና ማስታወሻዎችን የያዘ ማራኪ ባለሁለት ገጽ እቅድ።',
    dailyFocus: 'ዕለታዊ ትኩረት እና ማስታወሻ',
    dailyFocusDesc:
      'ዕለታዊ ጥልቅ አፈፃፀም። 3 ዋና ዋና ተግባራት፣ የሰዓት በሰዓት የጊዜ ሰሌዳ፣ ምስጋና እና የምሽት ማጠቃለያ።',

    corePhilosophy: 'ዋና ፍልስፍና',
    whyPaperMatters: 'በወረቀት መንፈስ የታነጸ እቅድ ለምን አስፈለገ?',
    whyPaperMattersDesc:
      'ዲጂታል መሳሪያዎች በብዙ ማሳወቂያዎች ትኩረትን ይበታትናሉ። ይህ እቅድ አውጪ ብዕር በወረቀት ላይ የማሳረፍን ረጋ ያለ ስሜት ከዘመናዊ የቴክኖሎጂ አጠቃቀም ጋር ያጣምራል።',
    ethiopianOrigin: 'አስተዋይ ማስታወሻ • የኢትዮጵያ መነሻ ታሪክ',
    planWithIntention: 'በዓላማ ያቅዱ።',
    liveWithClarity: 'በመረጋጋት እና በግልፅነት ይኑሩ።',
    heroSubheadline:
      'ዕለታዊ ትኩረትዎን፣ ሳምንታዊ ጥረትዎን፣ ወርሃዊ ግልጽነትዎን እና ዓመታዊ ራዕይዎን ወደ ዘላቂ የህይወት ቅርስ ለማስተሳሰር የተነደፈ የወረቀት መንፈስ ያለው መድረክ።',
    compoundingQuote:
      'ትላልቅ እርምጃዎችን ከመውሰዳችን በፊት ጥቃቅን መልካም ነገሮችን በየቀኑ ማከናወን ውሎ አድሮ ትልቅ ለውጥ ያመጣል።',
    fourHorizonsHeadline: 'አራት አድማሶች፣ አንድ ቀጣይነት ያለው ጉዞ',
    fourHorizonsSubheadline:
      'አብዛኛዎቹ የቴክኖሎጂ መተግበሪያዎች ትኩረትን ይበታትናሉ። ይህ መሪ ዓመታዊ እቅድ አውጪ እያንዳንዱን ቅጽበት ከዋናው ራዕይዎ ጋር ያገናኛል።',
    openJournal: 'ማስታወሻዎን ይክፈቱ',
    getStartedPlanner: 'በእቅድ አውጪዎ ይጀምሩ',
    readOriginStory: 'የመነሻ ታሪኩን ያንብቡ',
    guidingPrincipleSub: 'የመሪ ዓመታዊ እቅድ አውጪው መመሪያ መርህ',
    unifiedArchitecture: 'የተዋሃደ መዋቅር',
    guidingPhilosophy: 'መሪ ፍልስፍና',
    whySmallStepsMatter: 'ጥቃቅን እርምጃዎች ለምን ወሳኝ ሆኑ?',
    whySmallStepsDesc:
      'ያለ ዕለታዊ ስርአት ትላልቅ ውሳኔዎች በፍጥነት ይደበዝዛሉ። የእኛ ስርአት በረጋ እና በታሰበበት ምት ያቆይዎታል።',
    theRuleOfThreeTitle: 'የ3ቱ ቅድሚያዎች ህግ',
    theRuleOfThreeDesc:
      'ሁሉም ነገር ቅድሚያ ሲሆን፣ ምንም ቅድሚያ የሚሰጠው አይኖርም። ዕለታዊ ትኩረትን በ3 ወሳኝ ጉዳዮች መገደብ ያለ አእምሮ ድካም ቀጣይነት ያለው ጉልበት ይፈጥራል።',
    nonGuiltTitle: 'ከጸጸት የጸዳ ወጥነት',
    nonGuiltDesc:
      'ህይወት ቀጥተኛ አይደለም። የእኛ የልማድ እና የስሜት መከታተያዎች ለረጋ ራስን ማወቅ የተነደፉ ናቸው እንጂ ለጭንቀት አይደለም።',
    compoundingImpactTitle: 'የሚደራረብ ተጽእኖ',
    compoundingImpactDesc:
      'በየቀኑ 3 የታሰበባቸውን ተግባራት ማከናወን በዓመት ውስጥ ከ1,000 በላይ ትርጉም ያላቸው ስኬቶችን ያመጣል። ጥቃቅን ዕለታዊ ጥረቶች ወደ ዘላቂ የህይወት ቅርስ ያድጋሉ።',
    craftedForMindfulCreators: 'በጥንቃቄ ለሚያስቡ ፈጣሪዎች በሙሉ የተዘጋጀ',
    beginGuidedJourney: 'የተመራ ጉዞዎን ዛሬ ይጀምሩ',
    beginGuidedJourneySub:
      'ወደ ግልጽነት፣ የተረጋጋ እድገት እና አስተዋይ አኗኗር የመጀመሪያውን የታሰበበትን እርምጃ ይውሰዱ።',
    getStartedFree: 'ይጀምሩ — ነፃ ነው',

    creatorName: 'Peter Sisay',
    creatorRole: 'ፈጣሪ • አዲስ አበባ፣ ኢትዮጵያ',
    creatorQuote:
      'በኢትዮጵያ ውስጥ ባዶ ገጾች ካሏቸው ደብተሮች ውጭ የተመራ እና የተቀናጀ ማስታወሻ ማግኘት በጣም ከባድ ነው። ለእኔ ማቀድ እና መፃፍ ልማድ ብቻ አይደሉም፤ በህይወቴ ላይ የራሴን አሻራ የማሳርፍበት መንገድ ነው። ይህንን እቅድ አውጪ የፈጠርኩት ትርጉም ያለው፣ የተመራ እና ጉዟቸውን መዝግበው ማደግ ለሚፈልጉ ሁሉ ነው።',

    guideStep1Title: '1. ዓመታዊ ራዕይዎን ያስቀምጡ',
    guideStep1Desc: 'ዓመቱን በመሪ ቃልዎ እና በዋና ዋና ዓላማዎችዎ ይጀምሩ።',
    guideStep2Title: '2. የወርሃዊ ምት',
    guideStep2Desc: 'የዕለት ተዕለት ስሜትዎን እና ልማዶችዎን በዓመቱ ሙሉ ይከታተሉ።',
    guideStep3Title: '3. የ3ቱ ዋና ቅድሚያዎች ህግ',
    guideStep3Desc: 'ከመጠን በላይ በሆኑ ዝርዝሮች ከመጨናነቅ ይልቅ በየቀኑ በ3 ዋና ዋና ውጤቶች ላይ ብቻ ያተኩሩ።',

    daysShort: ['ሰኞ', 'ማክሰ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ', 'እሑድ'],
    daysFull: ['ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ', 'እሑድ'],
    months: [
      'ጃንዋሪ', 'ፌብሩዋሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን',
      'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር'
    ],

    settings: 'ቅንብሮች',
    settingsAndBackup: 'ቅንብሮች እና ምትኬ',
    account: 'የእርስዎ መለያ',
    planningPreferences: 'የእቅድ ምርጫዎች',
    calendarAndAppearance: 'የቀን መቁጠሪያ እና ገጽታ',
    weekStartsOn: 'ሳምንት የሚጀምርበት ቀን',
    weekStartsOnDesc: 'ሳምንታዊ እቅድዎ እና የቀን መቁጠሪያዎ በሰኞ ወይም በእሑድ እንዲጀምር ይምረጡ።',
    monday: 'ሰኞ',
    mondayDesc: 'መደበኛ የስራ ሳምንት እይታ (ቅዳሜ እና እሑድ በአንድ ላይ)',
    sunday: 'እሑድ',
    sundayDesc: 'የተለመደው በእሑድ የሚጀምር የቀን መቁጠሪያ ቅርጸት',
    themeLabel: 'የገጽታ እና የቀለም ምርጫ',
    themeWarm: 'ሞቅ ያለ ወረቀት',
    themeWarmDesc: 'ለስላሳ የክሬም ወረቀት ቀለም ከረጋ አረንጓዴ ጋር',
    themeEditorial: 'ክላሲክ ነጭ',
    themeEditorialDesc: 'ንጹህ እና ጥርት ያለ የነጭ ወረቀት ዘይቤ',
    gentleTransitions: 'ረጋ ያሉ ሽግግሮች',
    gentleTransitionsDesc: 'ለቀላል እና ለረጋ የተጠቃሚ ስሜት ፈጣን አኒሜሽኖችን ይቀንሱ',
    savePreferences: 'ምርጫዎችን አስቀምጥ',
    savedToProfile: 'በመገለጫው ላይ ተቀምጧል',
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
    languageDesc: 'የመተግበሪያውን ቋንቋ በእንግሊዝኛ እና በአማርኛ መካከል ይምረጡ።',
    englishOption: '🇺🇸 English (Default)',
    amharicOption: '🇪🇹 አማርኛ (Amharic)',
  },
};
