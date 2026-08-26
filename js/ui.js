// ================================================================
//  LOGIN
// ================================================================
const Login = {
  attempt() {
    const name = $('login-input').value.trim();
    if (!name) {
      $('login-status').textContent = 'Please enter your name.';
      $('login-status').className = 'status-msg error';
      return;
    }
    State.currentUser = name;
    $('header-tag').textContent = name;
    $('login-status').textContent = '';
    $('login-status').className = 'status-msg';
    this.afterLogin();
  },

  async afterLogin() {
    $('setup-status').textContent = 'Loading progress...';
    $('setup-status').className = 'status-msg';

    const data = await Firebase.loadWordStats(State.currentUser);
    State.wordStats = data.words;
    State.categoryRounds = data.categoryRounds;
    State.statsLoaded = true;

    $('setup-status').textContent = '';
    UI.show('setup', State.currentUser);
    WordManager.validate();
    await History.load(State.currentUser);
  },

  logout() {
    State.currentUser = null;
    $('login-input').value = '';
    UI.show('login');
    $('header-tag').textContent = 'login';
    $('stat-mc-num').textContent = '0/0';
    $('stat-mc-acc').textContent = '0%';
    $('stat-verbs-num').textContent = '0/0';
    $('stat-verbs-acc').textContent = '0%';
    $('history-list').innerHTML = '<div class="history-empty">Sign in to see history</div>';
  }
};