// ================================================================
//  WORDS & CATEGORIES
// ================================================================
const WordManager = {
  async load() {
    try {
      const [wordsRes, verbsRes] = await Promise.all([
        fetch('words.json').then(r => r.ok ? r.json() : []),
        fetch('verbs.json').then(r => r.ok ? r.json() : [])
      ]);
      State.allWords = [...wordsRes, ...verbsRes];
      this.populateCategories();
      $('setup-status').textContent = State.allWords.length + ' words loaded';
      return State.allWords;
    } catch (e) {
      $('setup-status').textContent = 'Could not load words.json or verbs.json — check files exist.';
      $('setup-status').className = 'status-msg error';
      return [];
    }
  },

  populateCategories() {
    const cats = [...new Set(State.allWords.map(w => w.category))].sort();
    const panel = $('category-options');
    panel.innerHTML = cats.map(c =>
      `<label class="cat-check"><input type="checkbox" class="cat-checkbox" value="${c}" checked> ${Utils.capitalize(c)}</label>`
    ).join('');
    State.settings.categories = cats.slice();
    this.updateSummary();

    panel.querySelectorAll('.cat-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        State.settings.categories = [...panel.querySelectorAll('.cat-checkbox:checked')].map(c => c.value);
        this.updateSummary();
        this.validate();
      });
    });
  },

  updateSummary() {
    const allCats = [...new Set(State.allWords.map(w => w.category))];
    const summary = $('category-summary');
    if (State.settings.categories.length === 0) summary.textContent = 'Select at least one';
    else if (State.settings.categories.length === allCats.length) summary.textContent = 'All categories';
    else summary.textContent = State.settings.categories.map(Utils.capitalize).join(', ');
  },

  validate() {
    const warning = $('category-warning');
    if (State.settings.mcType === 'category' && State.settings.categories.length < 4) {
      warning.textContent = '⚠️ Category mode requires at least 4 categories selected.';
      warning.style.display = 'block';
      return false;
    }
    warning.textContent = '';
    warning.style.display = 'none';
    return true;
  },

  getActivePool() {
    if (State.settings.mode === 'verbs') {
      return State.allWords.filter(w => 
        w.conjugations && 
        Array.isArray(w.conjugations) && 
        w.conjugations.length === 6
      );
    }
    return State.allWords.filter(w => State.settings.categories.includes(w.category));
  },

  getCategoryOptions(selectedCategories, correctCategory) {
    const allCats = selectedCategories.slice();
    if (allCats.length === 4) {
      return allCats.sort();
    } else {
      const others = allCats.filter(c => c !== correctCategory);
      const randomOthers = Utils.shuffle(others).slice(0, 3);
      return Utils.shuffle([correctCategory, ...randomOthers]);
    }
  }
};