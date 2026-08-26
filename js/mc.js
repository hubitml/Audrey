// ================================================================
//  GAME - MULTIPLE CHOICE (with Audio)
// ================================================================
const MC = {
  start(pool) {
    const mc = State.mc;
    mc.pool = pool;
    mc.activeCats = State.settings.categories.slice();
    mc.queue = Mastery.weightedSample(
      pool,
      State.wordStats,
      State.categoryRounds,
      1000
    );
    mc.index = 0;
    mc.score = 0;
    mc.totalAttempts = 0;
    mc.hearts = CONFIG.MAX_HEARTS;
    mc.answered = false;
    mc.wrongAttemptRecorded = false;
    mc.audioPlayed = false;

    UI.show('mc');
    this.render();
    $('mc-quit-btn').classList.remove('hidden');
    $('mc-quit-btn').onclick = () => this.quit();
    
    // Check audio availability
    this.checkAudioAvailability();
  },

  checkAudioAvailability() {
    const withAudio = State.mc.pool.filter(w => AudioHelper.hasAudio(w));
    if (withAudio.length === 0) {
      UI.showToast('ℹ️ No audio files found. Record words in the Editor and upload to GitHub.', 'info');
    } else {
      // Preload audio for current batch
      AudioHelper.preloadAudioBatch(withAudio.slice(0, 10));
    }
  },

  async render() {
    const mc = State.mc;
    const isCategoryMode = State.settings.mcType === 'category';
    const isReversed = State.settings.mcType === 'reversed';

    if (mc.index >= mc.queue.length) {
      const more = Mastery.weightedSample(
        mc.pool,
        State.wordStats,
        State.categoryRounds,
        100
      );
      mc.queue = mc.queue.concat(more);
    }

    if (mc.hearts <= 0) {
      this.endGame();
      return;
    }

    Mastery.incrementRounds(State.categoryRounds, mc.activeCats, 1);

    mc.currentItem = mc.queue[mc.index];
    mc.answered = false;
    mc.wrongAttemptRecorded = false;
    mc.audioPlayed = false;

    let wordText, displayWord;
    if (isCategoryMode) {
      wordText = mc.currentItem.word;
      displayWord = mc.currentItem;
    } else if (isReversed) {
      wordText = mc.currentItem.translation;
      displayWord = mc.currentItem;
    } else {
      wordText = mc.currentItem.word;
      displayWord = mc.currentItem;
    }

    const wordDisplay = $('mc-word');
    let speakerHTML = '';
    if (!isReversed) {
      speakerHTML = AudioHelper.getSpeakerHTML(displayWord);
    }
    wordDisplay.innerHTML = wordText + ' ' + speakerHTML;

    UI.hideCategory();
    UI.clearRevealButton();

    $('mc-count').textContent = 'Question ' + (mc.index + 1);
    UI.updateHearts(mc.hearts);
    $('mc-score').textContent = '✅ ' + mc.score;

    let options = [];
    if (isCategoryMode) {
      const correctCat = mc.currentItem.category;
      const categoryOptions = WordManager.getCategoryOptions(
        State.settings.categories,
        correctCat
      );
      options = categoryOptions.map(cat => ({
        text: Utils.capitalize(cat),
        value: cat,
        isCorrect: cat === correctCat,
        wordObj: null
      }));
    } else {
      const correctTranslation = isReversed ? mc.currentItem.word : mc.currentItem.translation;
      const distractors = Utils.shuffle(mc.pool.filter(w => {
        const trans = isReversed ? w.word : w.translation;
        return trans !== correctTranslation;
      })).slice(0, 3);

      const optionItems = Utils.shuffle([mc.currentItem, ...distractors]);
      options = optionItems.map(item => {
        const isCorrect = (isReversed ? item.word : item.translation) === correctTranslation;
        return {
          text: isReversed ? item.word : item.translation,
          value: item,
          isCorrect: isCorrect,
          wordObj: item
        };
      });
    }

    mc.currentOptions = options;
    mc.correctAnswer = options.find(o => o.isCorrect);

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
      btn.addEventListener('click', () => this.handleAnswer(idx));
      container.appendChild(btn);
    }

    // Auto-play audio for the current word (with delay)
    if (!isCategoryMode && AudioHelper.hasAudio(mc.currentItem)) {
      setTimeout(async () => {
        if (!mc.answered && !mc.audioPlayed) {
          mc.audioPlayed = true;
          try {
            await AudioHelper.playAudio(mc.currentItem);
          } catch (err) {
            // Silent fail for auto-play
          }
        }
      }, 500);
    }
  },

  handleAnswer(index) {
    const mc = State.mc;
    if (mc.answered) return;

    const option = mc.currentOptions[index];
    const isCorrect = option.isCorrect;
    const isCategoryMode = State.settings.mcType === 'category';

    if (!isCorrect && !mc.wrongAttemptRecorded) {
      mc.wrongAttemptRecorded = true;
      mc.hearts--;
      UI.updateHearts(mc.hearts);
      mc.totalAttempts++;

      Mastery.recordAttempt(
        mc.currentItem,
        State.wordStats,
        State.categoryRounds,
        false,
        isCategoryMode
      );

      const btn = $('mc-options').querySelector(`.option-btn[data-index="${index}"]`);
      btn.classList.add('wrong');
      btn.classList.add('used');
      btn.disabled = true;

      if (mc.hearts <= 0) {
        setTimeout(() => {
          UI.showCorrectAnswer(mc.currentOptions);
          UI.disableAllOptions();
          setTimeout(() => this.endGame(), 800);
        }, 400);
        return;
      }
      return;
    }

    if (isCorrect) {
      mc.answered = true;
      mc.totalAttempts++;
      mc.score++;

      if (!mc.wrongAttemptRecorded) {
        Mastery.recordAttempt(
          mc.currentItem,
          State.wordStats,
          State.categoryRounds,
          true,
          isCategoryMode
        );
      }

      const btn = $('mc-options').querySelector(`.option-btn[data-index="${index}"]`);
      btn.classList.add('correct');
      UI.disableAllOptions();

      // Stop any playing audio
      if (AudioHelper._currentAudio) {
        AudioHelper._currentAudio.pause();
        AudioHelper._currentAudio = null;
      }

      setTimeout(() => {
        mc.index++;
        this.render();
      }, 600);
    } else {
      const btn = $('mc-options').querySelector(`.option-btn[data-index="${index}"]`);
      btn.classList.add('wrong');
      btn.classList.add('used');
      btn.disabled = true;
    }
  },

  endGame() {
    const mc = State.mc;
    // Stop any playing audio
    if (AudioHelper._currentAudio) {
      AudioHelper._currentAudio.pause();
      AudioHelper._currentAudio = null;
    }
    Game.end(mc.score, mc.totalAttempts);
  },

  quit() {
    const mc = State.mc;
    if (AudioHelper._currentAudio) {
      AudioHelper._currentAudio.pause();
      AudioHelper._currentAudio = null;
    }
    Game.end(mc.score, mc.totalAttempts);
  }
};
