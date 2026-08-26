// ================================================================
//  UI MANAGER
// ================================================================
const UI = {
  screens: ['login', 'setup', 'mc', 'match', 'end'],

  show(screenName, userName) {
    this.screens.forEach(s => $(`screen-${s}`).classList.add('hidden'));
    $(`screen-${screenName}`).classList.remove('hidden');
    $('header-tag').textContent = (screenName === 'login') ? 'login' :
      (screenName === 'setup' ? userName || 'setup' : screenName);
    $('history-card').classList.toggle('hidden', screenName !== 'setup');
  },

  updateHearts(hearts, targetId = 'mc-hearts') {
    const container = $(targetId);
    if (!container) return;
    let html = '';
    for (let i = 0; i < CONFIG.MAX_HEARTS; i++) {
      html += `<span class="${i < hearts ? 'heart-filled' : 'heart-empty'}">♥</span>`;
    }
    container.innerHTML = html;
  },

  showCategory(category) {
    const el = $('mc-category');
    el.textContent = category;
    el.className = 'word-caption revealed';
  },

  hideCategory() {
    const el = $('mc-category');
    el.textContent = '';
    el.className = 'word-caption';
  },

  clearRevealButton() {
    $('mc-reveal-container').innerHTML = '';
  },

  disableAllOptions() {
    $('mc-options').querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  },

  showCorrectAnswer(options) {
    const buttons = $('mc-options').querySelectorAll('.option-btn');
    buttons.forEach((btn, idx) => {
      if (options[idx].isCorrect) {
        btn.classList.add('correct');
      }
      btn.disabled = true;
    });
  }
};