// ================================================================
//  MASTERY ENGINE
// ================================================================
const Mastery = {
  getOrCreate(wordKey, stats) {
    if (!stats[wordKey]) {
      stats[wordKey] = {
        pCorrect: 0,
        pIncorrect: 0,
        catCorrect: 0,
        catIncorrect: 0,
        lastCorrectMark: 0,
        lastSeen: 0
      };
    }
    return stats[wordKey];
  },

  practiceMastery(item, stats) {
    const w = stats[Utils.wordKey(item)];
    if (!w) return 0.5;
    const pCorrect = w.pCorrect || 0;
    const pIncorrect = w.pIncorrect || 0;
    return (pCorrect + 1) / (pCorrect + pIncorrect + 2);
  },

  categoryMastery(item, stats) {
    const w = stats[Utils.wordKey(item)];
    if (!w) return 0.5;
    const catCorrect = w.catCorrect || 0;
    const catIncorrect = w.catIncorrect || 0;
    return (catCorrect + 1) / (catCorrect + catIncorrect + 2);
  },

  combinedMastery(item, stats) {
    const pm = this.practiceMastery(item, stats);
    const cm = this.categoryMastery(item, stats);
    return (1 - CONFIG.BETA) * pm + CONFIG.BETA * cm;
  },

  selectionWeight(item, stats, categoryRounds, poolSize) {
    const w = stats[Utils.wordKey(item)];
    const cm = this.combinedMastery(item, stats);
    const cooldown = Math.max(1, poolSize * CONFIG.COOLDOWN_FRACTION);
    const roundsSince = (categoryRounds[item.category] || 0) - (w ? (w.lastCorrectMark || 0) : 0);
    const recencyFactor = Utils.clamp(roundsSince / cooldown, 0, 1);
    return CONFIG.FLOOR + (1 - CONFIG.FLOOR) * (1 - cm) * recencyFactor;
  },

  weightedSample(items, stats, categoryRounds, n) {
    const pool = items.slice();
    const picked = [];
    const count = Math.min(n, pool.length);
    for (let i = 0; i < count; i++) {
      const weights = pool.map(item => this.selectionWeight(item, stats, categoryRounds, pool.length));
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      let idx = pool.length - 1;
      for (let j = 0; j < weights.length; j++) {
        r -= weights[j];
        if (r <= 0) { idx = j; break; }
      }
      picked.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return picked;
  },

  recordAttempt(item, stats, categoryRounds, correct, isCategoryMode) {
    const w = this.getOrCreate(Utils.wordKey(item), stats);
    if (isCategoryMode) {
      if (correct) {
        w.catCorrect = (w.catCorrect || 0) + 1;
        w.lastCorrectMark = categoryRounds[item.category] || 0;
      } else {
        w.catIncorrect = (w.catIncorrect || 0) + 1;
      }
    } else {
      if (correct) {
        w.pCorrect = (w.pCorrect || 0) + 1;
        w.lastCorrectMark = categoryRounds[item.category] || 0;
      } else {
        w.pIncorrect = (w.pIncorrect || 0) + 1;
      }
    }
    w.lastSeen = Date.now();
  },

  incrementRounds(categoryRounds, categories, amount) {
    categories.forEach(c => {
      categoryRounds[c] = (categoryRounds[c] || 0) + amount;
    });
  }
};