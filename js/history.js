// ================================================================
//  GAME - END
// ================================================================
const Game = {
  end(score, total) {
    UI.show('end');
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    $('end-score').textContent = pct + '%';
    $('end-caption').textContent = '✅ ' + score + ' correct answers';

    const modeType = State.settings.mode === 'mc' ? State.settings.mcType : null;
    const session = {
      mode: State.settings.mode,
      categories: State.settings.categories.slice(),
      correct: score,
      total: total,
      mcType: modeType,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    Firebase.saveSession(State.currentUser, session);
    this.saveStats();
  },

  saveStats() {
    Firebase.saveWordStats(
      State.currentUser,
      State.wordStats,
      State.categoryRounds
    ).then(success => {
      if (success) {
        $('save-status').textContent = '✓ Progress saved';
        $('save-status').className = 'status-msg success';
        setTimeout(() => { $('save-status').textContent = ''; }, 2000);
      }
    });
  }
};