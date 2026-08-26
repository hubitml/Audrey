// ================================================================
//  SETUP
// ================================================================
const Setup = {
  init() {
    $('category-toggle').addEventListener('click', () => {
      $('category-options').classList.toggle('hidden');
    });

    $$('#mode-row .mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#mode-row .mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.settings.mode = btn.dataset.mode;
        
        const categorySection = $('category-section');
        if (State.settings.mode === 'verbs') {
          categorySection.style.display = 'none';
          State.settings.categories = ['verbs'];
          $('category-summary').textContent = 'Verbs only';
          $('category-warning').textContent = '';
          $('category-warning').style.display = 'none';
        } else {
          categorySection.style.display = 'block';
          const checked = [...document.querySelectorAll('.cat-checkbox:checked')].map(c => c.value);
          State.settings.categories = checked.length > 0 ? checked : ['verbs'];
          WordManager.updateSummary();
        }

        const catBtn = document.querySelector('.mc-type-btn[data-mctype="category"]');
        if (State.settings.mode === 'verbs') {
          catBtn.style.display = 'none';
          if (State.settings.mcType === 'category') {
            State.settings.mcType = 'normal';
            document.querySelector('.mc-type-btn[data-mctype="normal"]').classList.add('active');
            document.querySelector('.mc-type-btn[data-mctype="category"]').classList.remove('active');
          }
        } else {
          catBtn.style.display = '';
        }
        WordManager.validate();
      });
    });

    $$('.mc-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.mc-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.settings.mcType = btn.dataset.mctype;
        WordManager.validate();
      });
    });

    $('start-btn').addEventListener('click', () => this.startGame());
    $('stats-btn').addEventListener('click', () => {
      window.open('https://hubitml.github.io/Audrey/stats', '_blank');
    });
    $('logout-btn').addEventListener('click', () => Login.logout());
  },

  startGame() {
    if (!State.currentUser) return;
    if (!State.statsLoaded) {
      $('setup-status').textContent = 'Still loading progress, one sec...';
      $('setup-status').className = 'status-msg';
      return;
    }

    if (State.settings.mode !== 'verbs') {
      if (State.settings.categories.length === 0) {
        $('setup-status').textContent = 'Select at least one category.';
        $('setup-status').className = 'status-msg error';
        return;
      }
      
      if (State.settings.mcType === 'category' && State.settings.categories.length < 4) {
        $('setup-status').textContent = 'Category mode requires at least 4 categories.';
        $('setup-status').className = 'status-msg error';
        return;
      }
    }

    if (State.settings.mode === 'verbs' && State.settings.mcType === 'category') {
      $('setup-status').textContent = 'Category mode not available for Verbs.';
      $('setup-status').className = 'status-msg error';
      return;
    }

    const pool = WordManager.getActivePool();
    
    if (State.settings.mode === 'verbs') {
      if (pool.length < 1) {
        $('setup-status').textContent = 'No verbs with conjugations found. Make sure your verbs have a "conjugations" array with 6 forms.';
        $('setup-status').className = 'status-msg error';
        return;
      }
    } else {
      if (pool.length < 2) {
        $('setup-status').textContent = 'Need at least 2 words in selected categories.';
        $('setup-status').className = 'status-msg error';
        return;
      }
    }

    if (State.settings.mode === 'mc') {
      MC.start(pool);
    } else {
      VerbsMode.start(pool);
    }
  }
};