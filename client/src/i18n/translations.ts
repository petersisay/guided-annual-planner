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
  creatorStoryTitle: string;
  creatorStorySubtitle: string;
  creatorStoryBadge: string;
  creatorStoryP1: string;
  creatorStoryP2: string;
  creatorStoryP3: string;
  creatorStoryP4: string;
  creatorStoryQuoteBox: string;

  // How it works modal
  howItWorksWhatIs: string;
  howItWorksWhatIsDesc: string;
  howItWorksFourStepRhythm: string;
  howItWorksStep1Title: string;
  howItWorksStep1Desc: string;
  howItWorksStep2Title: string;
  howItWorksStep2Desc: string;
  howItWorksStep3Title: string;
  howItWorksStep3Desc: string;
  howItWorksStep4Title: string;
  howItWorksStep4Desc: string;
  howItWorksRuleOf3Title: string;
  howItWorksRuleOf3Desc: string;
  howItWorksPrivacyTitle: string;
  howItWorksPrivacyDesc: string;
  howItWorksGotIt: string;

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
    creatorStoryTitle: 'Why I Created This?',
    creatorStorySubtitle: 'From Addis Ababa with love & deliberate intention',
    creatorStoryBadge: 'The Origin Narrative',
    creatorStoryP1:
      'In Ethiopia, it’s nearly impossible to find a journal that’s more than just plain pages. I’ve always been big on planning—whatever I do, I make sure to put everything on paper. But finding a guided planner here has been a real challenge. For years, I had to buy planners from other countries just to get something that matched my needs.',
    creatorStoryP2:
      'Planning and journaling aren’t just habits for me; they’re how I leave a mark on my life. Every time I plan, I document my journey, and with each reflection, I see where I’ve been and where I need to go. It’s a process of constant growth and self-improvement.',
    creatorStoryP3:
      'But as much as I loved using those imported planners, they never felt truly mine. They didn’t reflect my culture, experiences, or how I wanted to live my life. That’s why I decided to create my own planner—one that’s guided, meaningful, and designed for people like me who want to leave a legacy of their journey, to look back, learn, and grow.',
    creatorStoryP4:
      'Whenever I take out my journal, people often ask me how I do it, and I realize that others could benefit from the same guidance I was searching for. That’s when I made it my mission to fulfill those requests and provide something that I, too, struggled to find.',
    creatorStoryQuoteBox:
      'I hope this planner will not only help you stay organized but also inspire you to document your life in a way that feels authentic and personal, just like it has for me.',

    howItWorksWhatIs: 'What is the Guided Annual Planner?',
    howItWorksWhatIsDesc:
      'Most planner apps give you endless, stressful to-do lists that leave you feeling behind. This planner is different: it is a calm, private journal designed to help you focus on just 3 meaningful priorities each day while keeping your bigger life dreams in sight.',
    howItWorksFourStepRhythm: 'The 4-Step Rhythm (From Big Dreams to Daily Action)',
    howItWorksStep1Title: '1. Yearly Goals',
    howItWorksStep1Desc:
      'Choose a theme word for your year (e.g., “Growth”, “Peace”) and write down 2–3 big goals for health, career, and relationships.',
    howItWorksStep2Title: '2. Monthly Planner',
    howItWorksStep2Desc:
      'Break big yearly goals into 1–3 concrete monthly milestones. Track books you read and habit streaks across the days.',
    howItWorksStep3Title: '3. Weekly Planner',
    howItWorksStep3Desc:
      'Every Sunday or Monday, look ahead at your 7 days. Pick your top 3 weekly outcomes and check off habits like exercise or meditation.',
    howItWorksStep4Title: '4. Daily Journal',
    howItWorksStep4Desc:
      'Each morning, write your Top 3 Priorities. That’s all you need to win the day. In the evening, write one thing you are grateful for.',
    howItWorksRuleOf3Title: 'The “Rule of 3” Secret',
    howItWorksRuleOf3Desc:
      'If you have 10 priorities, you have none. By picking only three important tasks each morning, you eliminate decision fatigue and feel genuine accomplishment by sunset.',
    howItWorksPrivacyTitle: 'Your Privacy & Data Are Always Protected',
    howItWorksPrivacyDesc:
      'Everything you write is saved automatically to your private account. It works even when your internet drops, and you can download a full backup copy to your computer anytime from Settings & Backup.',
    howItWorksGotIt: 'Got it, Let’s Plan!',

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
    creatorStoryTitle: 'ይህን ለምን ፈጠርኩት?',
    creatorStorySubtitle: 'ከአዲስ አበባ በፍቅር እና በታሰበበት ዓላማ',
    creatorStoryBadge: 'የመነሻ ታሪክ',
    creatorStoryP1:
      'በኢትዮጵያ ውስጥ ባዶ ገጾች ካሏቸው ደብተሮች ውጭ የተመራ እና የተቀናጀ ማስታወሻ ማግኘት በጣም ከባድ ነው። ለእቅድ ሁልጊዜም ትልቅ ቦታ እሰጣለሁ — ምንም የማደርገው ነገር ቢኖር ሁሉንም ነገር በወረቀት ላይ ማስፈር እመርጣለሁ። ነገር ግን እዚህ አገር ፍላጎቴን የሚያሟላ መሪ እቅድ አውጪ ማግኘት እውነተኛ ፈተና ሆኖብኝ ቆይቷል። ለዓመታት ከውጭ አገር እቅድ አውጪዎችን ለማስመጣት እገደድ ነበር።',
    creatorStoryP2:
      'ለእኔ ማቀድ እና ማስታወሻ መያዝ ልማድ ብቻ አይደሉም፤ በህይወቴ ላይ የራሴን አሻራ የማሳርፍበት መንገድ ነው። ባቀድኩ ቁጥር ጉዞዬን እመዘግባለሁ፣ በየቀኑ ሳሰላስልም የት እንደነበርኩ እና ወዴት መሄድ እንዳለብኝ አያለሁ። ይህ ቀጣይነት ያለው እድገት እና ራስን የማሻሻል ሂደት ነው።',
    creatorStoryP3:
      'ነገር ግን እነዚያን ከውጭ የመጡ እቅድ አውጪዎችን ብጠቀምባቸውም፣ በፍፁም የእኔ እንደሆኑ ተሰምቶኝ አያውቅም። የእኔን ባህል፣ ልምዶች ወይም ህይወቴን እንዴት መምራት እንደምፈልግ አያንፀባርቁም ነበር። ለዚህም ነው የራሴን እቅድ አውጪ ለመፍጠር የወሰንኩት — መሪ የሆነ፣ ትርጉም ያለው፣ እና እንደ እኔ ጉዟቸውን መዝግበው ማደግ እና የህይወት አሻራቸውን ማሳረፍ ለሚፈልጉ የተዘጋጀ።',
    creatorStoryP4:
      'ማስታወሻዬን ሳወጣ ሰዎች እንዴት እንደማቅድ ይጠይቁኛል፤ እኔ እፈልገው ከነበረው መመሪያ ሌሎችም ሊጠቀሙ እንደሚችሉ ተረዳሁ። ያኔ ነበር እኔም ለማግኘት እቸገርበት የነበረውን ይህንን መሪ እቅድ አውጪ ለሁሉም ማቅረብን አላማዬ ያደረግኩት።',
    creatorStoryQuoteBox:
      'ይህ እቅድ አውጪ ስራዎን እንዲያደራጁ ብቻ ሳይሆን፣ ለእኔ እንደሆነው ሁሉ ህይወትዎን ትክክለኛ እና ግላዊ በሆነ መንገድ እንዲመዘግቡ ያነሳሳዎታል ብዬ ተስፋ አደርጋለሁ።',

    howItWorksWhatIs: 'መሪ ዓመታዊ እቅድ አውጪ ምንድን ነው?',
    howItWorksWhatIsDesc:
      'አብዛኛዎቹ የእቅድ መተግበሪያዎች አእምሮን የሚያጨናንቁ ረጅም የስራ ዝርዝሮችን ይሰጣሉ። ይህ እቅድ አውጪ ግን የተለየ ነው፤ ትላልቅ የህይወት ህልሞችዎ ሳይዘነጉ በየቀኑ በ3 ወሳኝ ቅድሚያዎች ላይ ብቻ እንዲያተኩሩ የተነደፈ ረጋ ያለ የግል ማስታወሻ ነው።',
    howItWorksFourStepRhythm: 'የ4ቱ ደረጃዎች ምት (ከትላልቅ ህልሞች ወደ ዕለታዊ ተግባር)',
    howItWorksStep1Title: '1. ዓመታዊ ግቦች',
    howItWorksStep1Desc:
      'ለዓመትዎ መሪ ቃል ይምረጡ (ለምሳሌ፡ “እድገት”፣ “ሰላም”) እና ለጤና፣ ለስራ እና ለግንኙነቶች 2–3 ዋና ዋና ግቦችን ያስቀምጡ።',
    howItWorksStep2Title: '2. ወርሃዊ እቅድ',
    howItWorksStep2Desc:
      'ትላልቅ ዓመታዊ ግቦችን ወደ 1–3 ተጨባጭ ወርሃዊ ውጤቶች ይከፋፍሉ። የሚያነቧቸውን መጽሐፍት እና የልማድ ወጥነትን ይከታተሉ።',
    howItWorksStep3Title: '3. ሳምንታዊ እቅድ',
    howItWorksStep3Desc:
      'በየእሑዱ ወይም ሰኞ የሚቀጥሉትን 7 ቀናት አስቀድመው ይመልከቱ። 3 ዋና ዋና ሳምንታዊ ውጤቶችን ይምረጡ እና እንደ ስፖርት ወይም ማሰላሰል ያሉ ልማዶችን ያረጋግጡ።',
    howItWorksStep4Title: '4. ዕለታዊ ማስታወሻ',
    howItWorksStep4Desc:
      'በየማለዳው 3ቱን ዋና ዋና ቅድሚያዎችዎን ይፃፉ። ቀኑን በስኬት ለማጠናቀቅ ይሄ በቂ ነው። በምሽት ደግሞ ያመሰገኑበትን አንድ ነገር ይፃፉ።',
    howItWorksRuleOf3Title: 'የ “3ቱ ቅድሚያዎች ህግ” ሚስጥር',
    howItWorksRuleOf3Desc:
      '10 ቅድሚያ የሚሰጣቸው ነገሮች ካሉዎት፣ ምንም ቅድሚያ የለዎትም። በየማለዳው 3 ዋና ዋና ተግባራትን ብቻ በመምረጥ ውሳኔ የማሳለፍ ድካምን ያስወግዳሉ፤ ምሽት ላይም እውነተኛ የእርካታ ስሜት ይሰማዎታል።',
    howItWorksPrivacyTitle: 'የእርስዎ ግላዊነት እና መረጃ ሁልጊዜ የተጠበቁ ናቸው',
    howItWorksPrivacyDesc:
      'የሚጽፉት ነገር ሁሉ በራስ-ሰር ወደ ግል መለያዎ ይቀመጣል። ኢንተርኔት በማይኖርበት ጊዜም ይሰራል፤ እንዲሁም በማንኛውም ጊዜ ከቅንብሮች እና ምትኬ ሙሉውን የመረጃዎን ኮፒ ወደ ኮምፒውተርዎ ማውረድ ይችላሉ።',
    howItWorksGotIt: 'ተረድቻለሁ፣ ማቀድ እንጀምር!',

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
