// ================================================================
//  EVENT BINDINGS & INIT
// ================================================================

// Event bindings
$('login-btn').addEventListener('click', () => Login.attempt());
$('login-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') Login.attempt();
});

$('replay-btn').addEventListener('click', () => {
  if (!State.currentUser) return;
  const pool = WordManager.getActivePool();
  if (State.settings.mode === 'mc') MC.start(pool);
  else VerbsMode.start(pool);
});

$('change-settings-btn').addEventListener('click', () => UI.show('setup', State.currentUser));

// ================================================================
//  INITIALIZATION
// ================================================================
async function init() {
  Firebase.init();
  Setup.init();
  await VoiceManager.init();
  await WordManager.load();
  if (State.currentUser) {
    await Login.afterLogin();
  }
}

init();