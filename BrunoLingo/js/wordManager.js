// ================================================================
//  FIREBASE
// ================================================================
const Firebase = {
  init() {
    firebase.initializeApp(CONFIG.FIREBASE);
    this.db = firebase.firestore();
    this.auth = firebase.auth();

    this.auth.signInAnonymously()
      .then(() => {
        console.log('Signed in anonymously');
        $('login-status').textContent = 'Connected to Firestore';
        $('login-status').className = 'status-msg success';
      })
      .catch(err => {
        console.error('Auth error:', err);
        $('login-status').textContent = '⚠️ Firestore auth failed – data may not save.';
        $('login-status').className = 'status-msg error';
      });

    this.db.enablePersistence({ synchronizeTabs: true })
      .catch(err => console.warn('Persistence:', err));
  },

  wordStatsRef(user) {
    return this.db.collection('wordStats').doc(user);
  },

  userSessionsRef(user) {
    return this.db.collection('users').doc(user).collection('sessions');
  },

  async loadWordStats(user) {
    try {
      const snap = await this.wordStatsRef(user).get();
      const data = snap.exists ? snap.data() : {};
      return { words: data.words || {}, categoryRounds: data.categoryRounds || {} };
    } catch (e) {
      console.error('Failed to load word stats:', e);
      return { words: {}, categoryRounds: {} };
    }
  },

  async saveWordStats(user, words, categoryRounds) {
    try {
      await this.wordStatsRef(user).set({ words, categoryRounds });
      return true;
    } catch (e) {
      console.error('Failed to save word stats:', e);
      return false;
    }
  },

  async loadHistory(user) {
    try {
      const snapshot = await this.userSessionsRef(user)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      const sessions = [];
      snapshot.forEach(doc => sessions.push(doc.data()));
      return sessions;
    } catch (err) {
      console.warn('Error loading history:', err);
      return [];
    }
  },

  async saveSession(user, session) {
    try {
      await this.userSessionsRef(user).add(session);
      return true;
    } catch (err) {
      console.warn('Failed to save session:', err);
      return false;
    }
  }
};