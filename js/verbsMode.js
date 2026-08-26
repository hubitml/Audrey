// ================================================================
//  GAME - VERBS MODE (with Audio)
// ================================================================
const VerbsMode = {
  start(pool) {
    const verbPool = pool.filter(w => w.conjugations && Array.isArray(w.conjugations) && w.conjugations.length === 6);
    if (verbPool.length === 0) {
      $('setup-status').textContent = 'No verbs with conjugations found! Add "conjugations" array to verbs in words.json';
      $('setup-status').className = 'status-msg error';
      return;
    }
    const v = State.verbs;
    v.queue = Mastery.weightedSample(verbPool, State.wordStats, State.categoryRounds, 1000);
    v.score = 0;
    v.totalAttempts = 0;
    v.hearts = CONFIG.MAX_HEARTS;
    v.mcCorrect = 0;
    v.matchCorrect = 0;
    v.phase = 'mc';
    v._mcAnswered = false;
    this.nextVerb();
    $('match-quit-btn').classList.remove('hidden');
    $('match-quit-btn').onclick = () => this.quit();
    $('mc-quit-btn').classList.remove('hidden');
    $('mc-quit-btn').onclick = () => this.quit();
  },

  nextVerb() {
    const v = State.verbs;
    if (v.queue.length === 0 || v.hearts <= 0) {
      this.endGame();
      return;
    }
    v.currentVerb = v.queue.shift();
    v.phase = 'mc';
    v._mcAnswered = false;
    this.runMC();
  },

  async runMC() {
    const v = State.verbs;
    const verb = v.currentVerb;
    const isReversed = State.settings.mcType === 'reversed';

    UI.show('mc');
    UI.clearRevealButton();
    UI.hideCategory();
    UI.updateHearts(v.hearts);
    $('mc-score').textContent = '✅ ' + v.score;
    $('mc-count').textContent = 'Verb MC';

    let wordText, displayWord;
    if (isReversed) {
      wordText = verb.translation;
      displayWord = verb;
    } else {
      wordText = verb.word;
      displayWord = verb;
    }

    const wordDisplay = $('mc-word');
    const speakerHTML = AudioHelper.getSpeakerHTML(displayWord);
    wordDisplay.innerHTML = wordText + ' ' + speakerHTML;

    const pool = WordManager.getActivePool();
    let options = [];
    const distractors = Utils.shuffle(pool.filter(w => {
      const compare = isReversed ? w.word : w.translation;
      return compare !== (isReversed ? verb.word : verb.translation);
    })).slice(0, 3);
    const optionItems = Utils.shuffle([verb, ...distractors]);
    options = optionItems.map(item => {
      const isCorrect = (isReversed ? item.word : item.translation) === (isReversed ? verb.word : verb.translation);
      return {
        text: isReversed ? item.word : item.translation,
        value: item,
        isCorrect: isCorrect,
        wordObj: item
      };
    });

    const container = $('mc-options');
    container.innerHTML = '';
    for (let idx = 0; idx < options.length; idx++) {
      const opt = options[idx];
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      
      let speakerHTML = '';
      if (isReversed && opt.wordObj) {
        speakerHTML = AudioHelper.getSpeakerHTML(opt.wordObj, '18px');
      }
      
      btn.innerHTML = speakerHTML + `<span class="option-text">${opt.text}</span>`;
      btn.dataset.index = idx;
      btn.addEventListener('click', () => this.handleMCAnswer(idx, options));
      container.appendChild(btn);
    }

    // Auto-play audio for the verb
    if (AudioHelper.hasAudio(verb)) {
      setTimeout(async () => {
        if (!v._mcAnswered) {
          try {
            await AudioHelper.playAudio(verb);
          } catch (err) {
            // Silent fail for auto-play
          }
        }
      }, 500);
    }
  },

  handleMCAnswer(index, options) {
    const v = State.verbs;
    if (v._mcAnswered) return;
    v._mcAnswered = true;

    const verb = v.currentVerb;
    const option = options[index];
    const isCorrect = option.isCorrect;

    Mastery.recordAttempt(verb, State.wordStats, State.categoryRounds, isCorrect, false);
    v.totalAttempts++;
    if (isCorrect) {
      v.mcCorrect++;
      v.score++;
    } else {
      v.hearts--;
      UI.updateHearts(v.hearts);
      if (v.hearts <= 0) {
        const btns = $('mc-options').querySelectorAll('.option-btn');
        btns.forEach((b, i) => {
          b.disabled = true;
          if (options[i].isCorrect) b.classList.add('correct');
        });
        setTimeout(() => this.endGame(), 1000);
        return;
      }
    }

    const btns = $('mc-options').querySelectorAll('.option-btn');
    btns.forEach((b, i) => {
      b.disabled = true;
      if (options[i].isCorrect) b.classList.add('correct');
      if (i === index && !isCorrect) b.classList.add('wrong');
    });

    // Stop any playing audio
    if (AudioHelper._currentAudio) {
      AudioHelper._currentAudio.pause();
      AudioHelper._currentAudio = null;
    }

    setTimeout(() => {
      v._mcAnswered = false;
      v.phase = 'matching';
      this.runMatching();
    }, 800);
  },

  runMatching() {
    const v = State.verbs;
    const verb = v.currentVerb;
    const conj = verb.conjugations;
    const pronouns = CONFIG.PRONOUNS;
    const pairs = pronouns.map((p, i) => ({
      id: i,
      left: p,
      right: conj[i] || '?'
    }));

    $('match-count').textContent = 'Conjugate: ' + verb.word;
    $('match-score').textContent = 'Correct: 0/' + pairs.length;
    $('match-status').textContent = 'Select any item.';
    UI.updateHearts(v.hearts, 'match-hearts');

    MatchingEngine.start(pairs, (result) => {
      v.matchCorrect += result.correct;
      v.totalAttempts += result.total;
      v.score += result.correct;
      const allCorrect = result.correct === pairs.length;
      Mastery.recordAttempt(verb, State.wordStats, State.categoryRounds, allCorrect, false);
      setTimeout(() => {
        v.phase = 'mc';
        this.nextVerb();
      }, 600);
    }, () => {
      v.hearts--;
      UI.updateHearts(v.hearts, 'match-hearts');
      if (v.hearts <= 0) {
        this.endGame();
        return false;
      }
      return true;
    });
  },

  endGame() {
    const v = State.verbs;
    if (AudioHelper._currentAudio) {
      AudioHelper._currentAudio.pause();
      AudioHelper._currentAudio = null;
    }
    Game.end(v.score, v.totalAttempts);
  },

  quit() {
    const v = State.verbs;
    if (AudioHelper._currentAudio) {
      AudioHelper._currentAudio.pause();
      AudioHelper._currentAudio = null;
    }
    Game.end(v.score, v.totalAttempts);
  }
};
