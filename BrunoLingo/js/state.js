// ================================================================
//  STATE
// ================================================================
const State = {
  allWords: [],
  settings: { categories: [], mode: 'mc', mcType: 'normal' },
  currentUser: null,
  wordStats: {},
  categoryRounds: {},
  statsLoaded: false,
  saveTimer: null,

  mc: {
    queue: [],
    index: 0,
    score: 0,
    totalAttempts: 0,
    hearts: CONFIG.MAX_HEARTS,
    currentItem: null,
    currentOptions: [],
    correctAnswer: null,
    answered: false,
    wrongAttemptRecorded: false,
    pool: [],
    activeCats: []
  },

  verbs: {
    queue: [],
    currentVerb: null,
    score: 0,
    totalAttempts: 0,
    hearts: CONFIG.MAX_HEARTS,
    mcCorrect: 0,
    matchCorrect: 0,
    phase: 'mc',
    _mcAnswered: false
  },

  matching: {
    pairs: [],
    shuffledRight: [],
    onComplete: null,
    onHeartLost: null,
    selectedLeft: null,
    selectedRight: null,
    matchedCount: 0,
    correctCount: 0,
    isLocked: false,
    erred: new Set()
  }
};