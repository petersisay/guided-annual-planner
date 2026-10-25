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

  // Calendar
  months: string[];
  daysShort: string[];
  daysFull: string[];
  monthHeadingPrefix: string;
  leapYearBadge: string;
  notesForDate: string;
  dayMilestoneLabel: string;
  notesPlaceholder: string;
  openDailyPage: string;
  cancel: string;
  saveNote: string;
  todayLabel: string;

  // Landing Page Sections
  unifiedArchitecture: string;
  fourHorizonsHeadline: string;
  fourHorizonsSubtitle: string;
  openYourJournal: string;
  getStartedWithPlanner: string;
  readOriginStory: string;
  corePhilosophyLabel: string;
  guidingPrincipleLabel: string;

  // Horizon Cards
  h1Title: string;
  h1Desc: string;
  h1Point1: string;
  h1Point2: string;
  h1Point3: string;

  h2Title: string;
  h2Desc: string;
  h2Point1: string;
  h2Point2: string;
  h2Point3: string;

  h3Title: string;
  h3Desc: string;
  h3Point1: string;
  h3Point2: string;
  h3Point3: string;

  h4Title: string;
  h4Desc: string;
  h4Point1: string;
  h4Point2: string;
  h4Point3: string;

  // Philosophy Section
  quietIntentionHeading: string;
  philosophyBody1: string;
  philosophyBody2: string;
  founderQuote: string;
  founderName: string;
  founderRole: string;

  // How It Works Guide
  guideSubtitle: string;
  whatIsPlannerTitle: string;
  whatIsPlannerBody: string;
  fourStepRhythmTitle: string;
  step1Name: string;
  step1Detail: string;
  step2Name: string;
  step2Detail: string;
  step3Name: string;
  step3Detail: string;
  step4Name: string;
  step4Detail: string;
  ruleOf3SecretTitle: string;
  ruleOf3SecretBody: string;
  privacyProtectedTitle: string;
  privacyProtectedBody: string;
  gotItLetsPlan: string;

  // Creator Story
  creatorStoryHeading: string;
  creatorStorySubheading: string;
  originNarrativeBadge: string;
  craftedForCreators: string;
  storyP1: string;
  storyP2: string;
  storyP3: string;
  storyP4: string;
  storyQuote: string;

  // Final CTA
  beginJourneyHeadline: string;
  beginJourneySubheadline: string;
  getStartedFree: string;
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

    // Calendar
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    daysShort: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
    daysFull: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    monthHeadingPrefix: 'MONTH',
    leapYearBadge: 'Leap Year • 29 Days',
    notesForDate: 'Notes for',
    dayMilestoneLabel: 'Day Milestone & Commitments',
    notesPlaceholder: 'Write focus items, events, appointments, or journal notes...',
    openDailyPage: 'Open Full Daily Page →',
    cancel: 'Cancel',
    saveNote: 'Save Note',
    todayLabel: 'Today',

    // Landing Page Sections
    unifiedArchitecture: 'Unified Architecture',
    fourHorizonsHeadline: 'Four Horizons, One Continuous Journey',
    fourHorizonsSubtitle:
      'Most productivity tools fragment your attention. The Guided Annual Planner connects every moment to your overarching vision.',
    openYourJournal: 'Open Your Journal',
    getStartedWithPlanner: 'Get Started with Your Planner',
    readOriginStory: 'Read the Origin Story',
    corePhilosophyLabel: 'Core Philosophy',
    guidingPrincipleLabel: 'The Guiding Principle of the Guided Annual Planner',

    // Horizon Cards
    h1Title: 'Annual Vision',
    h1Desc: 'Year-at-a-glance calendar, overarching Word of the Year, lifetime intentions, bookshelf, and year-end celebrations.',
    h1Point1: 'Anchor Word & Theme',
    h1Point2: 'Reading Bookshelf',
    h1Point3: '365-Day Mood Matrix',

    h2Title: 'Monthly Rhythm',
    h2Desc: 'Monthly dashboard with high-priority Must-Dos, habit tracker overview, key events, and structured lined journaling.',
    h2Point1: 'Monthly Must-Dos',
    h2Point2: 'Habit Consistency Grid',
    h2Point3: 'Lined Reflection Notes',

    h3Title: 'Weekly 2-Page Spread',
    h3Desc: 'Authentic 2-page notebook spread with ISO Monday start, Rule of 3 daily tasks, weekly priorities, and next-week horizons.',
    h3Point1: 'Rule of 3 Focus',
    h3Point2: 'ISO 8601 Monday Start',
    h3Point3: 'Weekly Notes & Reminders',

    h4Title: 'Daily Focus & Journal',
    h4Desc: 'Start with 3 non-negotiable priorities, hourly structure, morning intention, gratitude, and evening check-out.',
    h4Point1: 'Rule of 3 Priority System',
    h4Point2: 'Mindful Morning Intention',
    h4Point3: 'Evening Gratitude & Closure',

    // Philosophy Section
    quietIntentionHeading: 'Designed with Quiet Intention',
    philosophyBody1:
      'Most digital productivity apps are engineered like noisy casinos—flooding you with notifications, artificial streaks, and robotic metrics that induce guilt instead of peace.',
    philosophyBody2:
      'The Guided Annual Planner is built as a sanctuary. Inspired by physical, thread-bound notebooks and Ethiopian traditions of thoughtful patience, it encourages you to write by hand or type mindfully, focusing on the small compounding rituals that truly shape a life.',
    founderQuote:
      '«When you connect daily actions to lifelong purpose, even quiet moments become profound.»',
    founderName: 'Peter Sisay',
    founderRole: 'Creator & Guide, Addis Ababa',

    // How It Works Guide
    guideSubtitle: 'A simple guide to calm, focused planning',
    whatIsPlannerTitle: 'What is the Guided Annual Planner?',
    whatIsPlannerBody:
      'Most planner apps give you endless, stressful to-do lists that leave you feeling behind. This planner is different: it is a calm, private journal designed to help you focus on just 3 meaningful priorities each day while keeping your bigger life dreams in sight.',
    fourStepRhythmTitle: 'The 4-Step Rhythm (From Big Dreams to Daily Action)',
    step1Name: '1. Yearly Goals',
    step1Detail: 'Choose a theme word for your year (e.g., “Growth”, “Peace”) and write down 2–3 big goals for health, career, and relationships.',
    step2Name: '2. Monthly Planner',
    step2Detail: 'Break big yearly goals into 1–3 concrete monthly milestones. Track books you read and habit streaks across the days.',
    step3Name: '3. Weekly Planner',
    step3Detail: 'Every Sunday or Monday, look ahead at your 7 days. Pick your top 3 weekly outcomes and check off habits like exercise or meditation.',
    step4Name: '4. Daily Journal',
    step4Detail: 'Each morning, write your Top 3 Priorities. That’s all you need to win the day. In the evening, write one thing you are grateful for.',
    ruleOf3SecretTitle: 'The “Rule of 3” Secret',
    ruleOf3SecretBody:
      'If you have 10 priorities, you have none. By picking only three important tasks each morning, you eliminate decision fatigue and feel genuine accomplishment by sunset.',
    privacyProtectedTitle: 'Your Privacy & Data Are Always Protected',
    privacyProtectedBody:
      'Everything you write is saved automatically to your private account. It works even when your internet drops, and you can download a full backup copy to your computer anytime from Settings & Backup.',
    gotItLetsPlan: 'Got it, Let’s Plan!',

    // Creator Story
    creatorStoryHeading: 'Why I Created This?',
    creatorStorySubheading: 'From Addis Ababa with love & deliberate intention',
    originNarrativeBadge: 'The Origin Narrative',
    craftedForCreators: 'Crafted for mindful creators',
    storyP1:
      'In Ethiopia, it’s nearly impossible to find a journal that’s more than just plain pages. I’ve always been big on planning—whatever I do, I make sure to put everything on paper. But finding a guided planner here has been a real challenge. For years, I had to buy planners from other countries just to get something that matched my needs.',
    storyP2:
      'Planning and journaling aren’t just habits for me; they’re how I leave a mark on my life. Every time I plan, I document my journey, and with each reflection, I see where I’ve been and where I need to go. It’s a process of constant growth and self-improvement.',
    storyP3:
      'But as much as I loved using those imported planners, they never felt truly mine. They didn’t reflect my culture, experiences, or how I wanted to live my life. That’s why I decided to create my own planner—one that’s guided, meaningful, and designed for people like me who want to leave a legacy of their journey, to look back, learn, and grow.',
    storyP4:
      'Whenever I take out my journal, people often ask me how I do it, and I realize that others could benefit from the same guidance I was searching for. That’s when I made it my mission to fulfill those requests and provide something that I, too, struggled to find.',
    storyQuote:
      '“I hope this planner will not only help you stay organized but also inspire you to document your life in a way that feels authentic and personal, just like it has for me.”',

    // Final CTA
    beginJourneyHeadline: 'Begin Your Guided Journey Today',
    beginJourneySubheadline: 'Take the first small, deliberate step toward clarity, steady progress, and mindful living.',
    getStartedFree: 'Get Started — It’s Free',
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

    // Calendar
    months: [
      'ጃንዋሪ (ጥር)',
      'ፌብሩዋሪ (የካቲት)',
      'ማርች (መጋቢት)',
      'ኤፕሪል (ሚያዝያ)',
      'ሜይ (ግንቦት)',
      'ጁን (ሰኔ)',
      'ጁላይ (ሐምሌ)',
      'ኦገስት (ነሐሴ)',
      'ሴፕቴምበር (መስከረም)',
      'ኦክቶበር (ጥቅምት)',
      'ኖቬምበር (ኅዳር)',
      'ዲሴምበር (ታኅሣሥ)',
    ],
    daysShort: ['ሰኞ', 'ማክ', 'ረቡዕ', 'ሐሙ', 'አርብ', 'ቅዳ', 'እሑድ'],
    daysFull: [
      'ሰኞ',
      'ማክሰኞ',
      'ረቡዕ',
      'ሐሙስ',
      'አርብ',
      'ቅዳሜ',
      'እሑድ',
    ],
    monthHeadingPrefix: 'ወር',
    leapYearBadge: 'የዘመን መለወጫ ድርብ ዓመት • 29 ቀናት',
    notesForDate: 'ማስታወሻ ለ',
    dayMilestoneLabel: 'የቀኑ ዋና ዋና ተግባራት እና ግዴታዎች',
    notesPlaceholder: 'ዋና ዋና ተግባራትን፣ ቀጠሮዎችን ወይም ማስታወሻዎችን እዚህ ይጻፉ...',
    openDailyPage: 'ሙሉውን የዕለት ገጽ ክፈት →',
    cancel: 'ሰርዝ',
    saveNote: 'አስቀምጥ',
    todayLabel: 'ዛሬ',

    // Landing Page Sections
    unifiedArchitecture: 'የተቀናጀ መዋቅር',
    fourHorizonsHeadline: 'አራት አድማሶች፣ አንድ ቀጣይ ጉዞ',
    fourHorizonsSubtitle:
      'አብዛኛዎቹ ዲጂታል መሳሪያዎች ትኩረትዎን ይበታትኑታል። መሪ ዓመታዊ እቅድ አውጪ እያንዳንዱን ቅጽበት ከዋናው ራዕይዎ ጋር ያስተሳስራል።',
    openYourJournal: 'የግል ማስታወሻዎን ይክፈቱ',
    getStartedWithPlanner: 'በእቅድ አውጪዎ ይጀምሩ',
    readOriginStory: 'የመነሻ ታሪኩን ያንብቡ',
    corePhilosophyLabel: 'ዋና ፍልስፍና',
    guidingPrincipleLabel: 'የመሪ ዓመታዊ እቅድ አውጪ መሪ መርህ',

    // Horizon Cards
    h1Title: 'ዓመታዊ ራዕይ',
    h1Desc: 'የዓመቱ አጠቃላይ የቀን መቁጠሪያ፣ የዓመቱ መሪ ቃል፣ የህይወት ዘመን ግቦች፣ የመጽሐፍ መደርደሪያ እና የዓመት መጨረሻ በዓላት።',
    h1Point1: 'የዓመቱ መሪ ቃል እና ጭብጥ',
    h1Point2: 'የንባብ መጽሐፍ መደርደሪያ',
    h1Point3: 'የ365 ቀናት የስሜት ማትሪክስ',

    h2Title: 'ወርሃዊ ምት',
    h2Desc: 'የወሩ ዋና ዋና ግዴታዎች፣ የልማድ ወጥነት መከታተያ፣ ቁልፍ ኩነቶች እና የተሰመረበት ማስታወሻ ማሰላሰያ።',
    h2Point1: 'የወሩ የማይታለፉ ግቦች',
    h2Point2: 'የልማድ ወጥነት መረብ',
    h2Point3: 'የተሰመረበት ማሰላሰያ ማስታወሻ',

    h3Title: 'ሳምንታዊ ባለሁለት ገጽ እቅድ',
    h3Desc: 'ከሰኞ የሚጀምር እውነተኛ ባለሁለት ገጽ ማስታወሻ፣ የ3ቱ ዋና ተግባራት መርህ፣ ሳምንታዊ ቅድሚያዎች እና የቀጣይ ሳምንት አድማስ።',
    h3Point1: 'የ3ቱ ዋና ዋና ተግባራት ትኩረት',
    h3Point2: 'ከሰኞ የሚጀምር ሳምንት',
    h3Point3: 'ሳምንታዊ ማስታወሻዎች እና ማሳሰቢያዎች',

    h4Title: 'ዕለታዊ ትኩረት እና ማሰላሰል',
    h4Desc: 'በ3 የማይደራደሩባቸው ቅድሚያዎች፣ የሰዓት ክፍፍል፣ የማለዳ ዓላማ፣ ምስጋና እና የምሽት ግምገማ ይጀምሩ።',
    h4Point1: 'የ3ቱ ዋና ዋና ቅድሚያዎች ስርዓት',
    h4Point2: 'አስተዋይ የማለዳ ዓላማ',
    h4Point3: 'የምሽት ምስጋና እና ማጠቃለያ',

    // Philosophy Section
    quietIntentionHeading: 'በመረጋጋት እና በዓላማ የተነደፈ',
    philosophyBody1:
      'አብዛኛዎቹ ዲጂታል ምርታማነት አፖች እንደ ጫጫታ ካሲኖ የተነደፉ ናቸው—በማሳወቂያዎች፣ በሰው ሰራሽ ሩጫዎች እና በሮቦታዊ መለኪያዎች ከሰላም ይልቅ የጥፋተኝነት ስሜት ይፈጥራሉ።',
    philosophyBody2:
      'መሪ ዓመታዊ እቅድ አውጪ እንደ ጸጥተኛ መጠለያ የተገነባ ነው። በእጅ ከተሰፉ ባህላዊ ማስታወሻ ደብተሮች እና በኢትዮጵያ አስተዋይ የትዕግስት ወጎች ተመስርቶ፣ ህይወትን በእውነት የሚቀርፁ ጥቃቅን እና ተከታታይ ልማዶች ላይ እንዲያተኩሩ ያበረታታዎታል።',
    founderQuote:
      '«ዕለታዊ ተግባራትን ከህይወት ዘመን ዓላማ ጋር ሲያስተሳስሩ፣ ጸጥተኛ የሆኑት ቅጽበቶች እንኳ ጥልቅ ትርጉም ይኖራቸዋል።»',
    founderName: 'ፒተር ሲሳይ',
    founderRole: 'ፈጣሪ እና መሪ፣ አዲስ አበባ',

    // How It Works Guide
    guideSubtitle: 'ለተረጋጋ እና ግልጽ እቅድ ቀላል መመሪያ',
    whatIsPlannerTitle: 'መሪ ዓመታዊ እቅድ አውጪ ምንድን ነው?',
    whatIsPlannerBody:
      'አብዛኛዎቹ የእቅድ መተግበሪያዎች ከኋላ የቀሩ እንደሆኑ እንዲሰማዎት የሚያደርጉ ማለቂያ የሌላቸው አስጨናቂ የስራ ዝርዝሮችን ይሰጡዎታል። ይህ እቅድ አውጪ የተለየ ነው፡ ትልልቅ የህይወት ህልሞችዎን እያዩ በየቀኑ በ3 ትርጉም ባላቸው ቅድሚያዎች ላይ ብቻ እንዲያተኩሩ የተነደፈ የተረጋጋ የግል ማስታወሻ ነው።',
    fourStepRhythmTitle: 'የ4ቱ ደረጃዎች ምት (ከትልልቅ ህልሞች እስከ ዕለታዊ ተግባር)',
    step1Name: '1. ዓመታዊ ግቦች',
    step1Detail: 'ለዓመቱ መሪ ቃል ይምረጡ (ለምሳሌ፡ «እድገት»፣ «ሰላም») እና ለጤና፣ ለስራ እና ለግንኙነት 2-3 ትልልቅ ግቦችን ይጻፉ።',
    step2Name: '2. ወርሃዊ እቅድ',
    step2Detail: 'ትልልቅ ዓመታዊ ግቦችን ወደ 1-3 ተጨባጭ ወርሃዊ ውጤቶች ይከፋፍሉ። የሚያነቧቸውን መጻሕፍት እና የልማድ ቀጣይነትን በቀናት ውስጥ ይከታተሉ።',
    step3Name: '3. ሳምንታዊ እቅድ',
    step3Detail: 'በየሳምንቱ እሑድ ወይም ሰኞ፣ መጪዎቹን 7 ቀናት ይመልከቱ። 3ቱን ዋና ዋና ውጤቶች ይምረጡ እና እንደ አካል ብቃት ወይም ማሰላሰል ያሉ ልማዶችን ምልክት ያድርጉ።',
    step4Name: '4. ዕለታዊ ማስታወሻ',
    step4Detail: 'በየማለዳው 3ቱን ዋና ዋና ቅድሚያዎችዎን ይጻፉ። ቀኑን በድል ለማጠናቀቅ የሚያስፈልግዎት ያ ብቻ ነው። በምሽት ደግሞ የሚያመሰግኑበትን አንድ ነገር ይጻፉ።',
    ruleOf3SecretTitle: 'የ«3ቱ ቅድሚያዎች» ሚስጥር',
    ruleOf3SecretBody:
      '10 ቅድሚያዎች ካሉዎት ምንም ቅድሚያ የለዎትም። በየማለዳው ሶስት አስፈላጊ ተግባራትን ብቻ በመምረጥ፣ የመወሰን ድካምን ያስወግዳሉ እንዲሁም ፀሐይ ስትጠልቅ እውነተኛ የስኬት ስሜት ይሰማዎታል።',
    privacyProtectedTitle: 'የእርስዎ ግላዊነት እና መረጃ ሁልጊዜ የተጠበቀ ነው',
    privacyProtectedBody:
      'የሚጽፉት ነገር ሁሉ በግል መለያዎ ውስጥ በራስ-ሰር ይቀመጣል። ኢንተርኔት በሚቋረጥበት ጊዜም እንኳን ይሰራል፣ እና ከቅንብሮች እና ምትኬ ገጽ በማንኛውም ጊዜ ሙሉ የመጠባበቂያ ቅጂ ወደ ኮምፒውተርዎ ማውረድ ይችላሉ።',
    gotItLetsPlan: 'ተረድቻለሁ፣ ማቀድ እንጀምር!',

    // Creator Story
    creatorStoryHeading: 'ይህን ለምን ፈጠርኩት?',
    creatorStorySubheading: 'ከአዲስ አበባ በፍቅር እና በታሰበበት ዓላማ',
    originNarrativeBadge: 'የመነሻ ትረካ',
    craftedForCreators: 'ለአስተዋይ ፈጣሪዎች የተዘጋጀ',
    storyP1:
      'በኢትዮጵያ ውስጥ ከተራ ነጭ ገጾች የበለጠ የሆነ እቅድ ማውጪያ ማስታወሻ ማግኘት ፈጽሞ የማይቻል ነው። እኔ ሁልጊዜ በእቅድ የማምን ሰው ነኝ—የማደርገውን ማንኛውንም ነገር በወረቀት ላይ ማስፈር እመርጣለሁ። ነገር ግን እዚህ አገር መሪ እቅድ አውጪ ማግኘት ትልቅ ፈተና ነበር። ለዓመታት ፍላጎቴን የሚያሟላ ነገር ለማግኘት ከሌሎች አገሮች ማዘዝ ነበረብኝ።',
    storyP2:
      'ማቀድ እና ማስታወሻ መጻፍ ለእኔ ልማዶች ብቻ አይደሉም፤ በህይወቴ ላይ አሻራዬን የማስቀምጥበት መንገድ ናቸው። ባቀድኩ ቁጥር ጉዞዬን እመዘግባለሁ፣ በእያንዳንዱ ማሰላሰልም የት እንደነበርኩ እና የት መሄድ እንዳለብኝ አያለሁ። ይህ ቀጣይነት ያለው እድገት እና ራስን የማሻሻል ሂደት ነው።',
    storyP3:
      'ነገር ግን እነዚያን ከውጭ የሚመጡ እቅድ አውጪዎች ብጠቀምባቸውም፣ መቼም የራሴ እንደሆኑ ተሰምቶኝ አያውቅም። ባህሌን፣ ልምዶቼን ወይም ህይወቴን እንዴት መምራት እንደምፈልግ አያንጸባርቁም ነበር። ለዚህም ነው የራሴን እቅድ አውጪ ለመፍጠር የወሰንኩት—የሚመራ፣ ትርጉም ያለው፣ እና እንደ እኔ የጉዟቸውን ቅርስ ለማስቀረት፣ ወደ ኋላ ተመልክተው ለመማር እና ለማደግ ለሚፈልጉ ሰዎች የተነደፈ።',
    storyP4:
      'ማስታወሻዬን ሳወጣ ሰዎች ሁልጊዜ እንዴት እንደማደርገው ይጠይቁኛል፣ እና እኔ ስፈልገው የነበረው መመሪያ ለሌሎችም እንደሚጠቅም ተገነዘብኩ። እኔም ለማግኘት የተቸገርኩትን ነገር ለማቅረብ እና እነዚያን ጥያቄዎች ለመመለስ አላማ አድርጌ ተነሳሁ።',
    storyQuote:
      '«ይህ እቅድ አውጪ የተደራጁ እንዲሆኑ ብቻ ሳይሆን፣ ለእኔ እንደሆነው ሁሉ ህይወትዎን እውነተኛ እና ግላዊ በሆነ መንገድ እንዲመዘግቡ ያነሳሳዎታል ብዬ ተስፋ አደርጋለሁ።»',

    // Final CTA
    beginJourneyHeadline: 'የተመራ ጉዞዎን ዛሬ ይጀምሩ',
    beginJourneySubheadline: 'ወደ ግልጽነት፣ የተረጋጋ እድገት እና አስተዋይ ኑሮ የመጀመሪያውን ትንሽ እና የታሰበበትን እርምጃ ይውሰዱ።',
    getStartedFree: 'ይጀምሩ — በነጻ ነው',
  },
};
