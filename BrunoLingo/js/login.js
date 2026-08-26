// ================================================================
//  HISTORY
// ================================================================
const History = {
  async load(user) {
    const sessions = await Firebase.loadHistory(user);
    this.render(sessions);
  },

  render(history) {
    const agg = { mc: { correct: 0, total: 0 }, verbs: { correct: 0, total: 0 } };
    history.forEach(h => {
      const key = h.mode === 'verbs' ? 'verbs' : 'mc';
      if (agg[key]) {
        agg[key].correct += h.correct || 0;
        agg[key].total += h.total || 0;
      }
    });

    $('stat-mc-num').textContent = agg.mc.correct + '/' + agg.mc.total;
    $('stat-mc-acc').textContent = (agg.mc.total ? Math.round(agg.mc.correct / agg.mc.total * 100) : 0) + '%';
    $('stat-verbs-num').textContent = agg.verbs.correct + '/' + agg.verbs.total;
    $('stat-verbs-acc').textContent = (agg.verbs.total ? Math.round(agg.verbs.correct / agg.verbs.total * 100) : 0) + '%';

    const container = $('history-list');
    if (history.length === 0) {
      container.innerHTML = '<div class="history-empty">No sessions yet</div>';
      return;
    }

    const modeLabel = m => m === 'verbs' ? 'Verbs' : 'MC';
    const allCats = [...new Set(State.allWords.map(w => w.category))];
    const catLabel = cats => {
      if (!Array.isArray(cats)) return cats === 'all' ? 'All' : Utils.capitalize(cats);
      if (cats.length === allCats.length) return 'All';
      return cats.map(Utils.capitalize).join(', ');
    };

    container.innerHTML = history.map(h =>
      `<div class="history-row">
        <span><span class="history-mode">${modeLabel(h.mode)}${h.mcType ? ' (' + h.mcType + ')' : ''}</span>
        <span class="history-score">✅ ${h.correct}</span></span>
        <span class="history-cat">${catLabel(h.categories !== undefined ? h.categories : h.category)}</span>
      </div>`
    ).join('');
  }
};