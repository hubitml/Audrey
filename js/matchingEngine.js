// ================================================================
//  MATCHING ENGINE
// ================================================================
const MatchingEngine = {
  start(pairs, onComplete, onHeartLost) {
    const m = State.matching;
    m.pairs = pairs.map(p => ({ ...p, status: 'unmatched' }));
    m.onComplete = onComplete;
    m.onHeartLost = onHeartLost;
    m.selectedLeft = null;
    m.selectedRight = null;
    m.matchedCount = 0;
    m.correctCount = 0;
    m.isLocked = false;
    m.erred = new Set();

    m.shuffledRight = Utils.shuffle(m.pairs.map(p => p.id));

    UI.show('match');
    $('match-count').textContent = 'Conjugate: ';
    $('match-score').textContent = 'Correct: 0/' + pairs.length;
    $('match-status').textContent = 'Select any item.';
    this.render();
  },

  render() {
    const m = State.matching;
    const leftCol = $('match-left');
    const rightCol = $('match-right');
    leftCol.innerHTML = '';
    rightCol.innerHTML = '';

    const sortedPairs = [...m.pairs].sort((a, b) => a.id - b.id);
    for (const p of sortedPairs) {
      const div = document.createElement('div');
      let cls = 'match-item';
      if (p.status === 'correct') cls += ' matched-correct';
      if (m.erred.has('L' + p.id)) cls += ' erred';
      div.className = cls;
      div.textContent = p.left;
      div.dataset.id = p.id;
      div.dataset.side = 'left';
      if (p.status === 'unmatched') {
        div.addEventListener('click', () => this.select('left', p.id, div));
      } else {
        div.style.cursor = 'default';
      }
      leftCol.appendChild(div);
    }

    for (const id of m.shuffledRight) {
      const p = m.pairs.find(pair => pair.id === id);
      const div = document.createElement('div');
      let cls = 'match-item';
      if (p.status === 'correct') cls += ' matched-correct';
      if (m.erred.has('R' + p.id)) cls += ' erred';
      div.className = cls;
      div.textContent = p.right;
      div.dataset.id = p.id;
      div.dataset.side = 'right';
      if (p.status === 'unmatched') {
        div.addEventListener('click', () => this.select('right', p.id, div));
      } else {
        div.style.cursor = 'default';
      }
      rightCol.appendChild(div);
    }

    const total = m.pairs.length;
    const done = m.pairs.filter(p => p.status !== 'unmatched').length;
    $('match-score').textContent = 'Correct: ' + m.correctCount + '/' + total;

    if (done === total) {
      $('match-status').textContent = '✅ All matched!';
      setTimeout(() => {
        if (m.onComplete) {
          m.onComplete({ correct: m.correctCount, total: total });
        }
      }, 500);
    }
  },

  select(side, id, node) {
    const m = State.matching;
    if (m.isLocked) return;
    const pair = m.pairs.find(p => p.id === id);
    if (pair.status !== 'unmatched') return;

    if (side === 'left') {
      if (m.selectedLeft && m.selectedLeft.id === id) {
        m.selectedLeft.node.classList.remove('selected');
        m.selectedLeft = null;
        $('match-status').textContent = 'Select any item.';
        return;
      }
      if (m.selectedLeft) {
        m.selectedLeft.node.classList.remove('selected');
      }
      m.selectedLeft = { id, node };
      node.classList.add('selected');
      $('match-status').textContent = 'Now select the matching conjugation.';
    } else {
      if (m.selectedRight && m.selectedRight.id === id) {
        m.selectedRight.node.classList.remove('selected');
        m.selectedRight = null;
        $('match-status').textContent = 'Select any item.';
        return;
      }
      if (m.selectedRight) {
        m.selectedRight.node.classList.remove('selected');
      }
      m.selectedRight = { id, node };
      node.classList.add('selected');
      $('match-status').textContent = 'Now select the matching pronoun.';
    }

    if (m.selectedLeft && m.selectedRight) {
      this.attemptMatch();
    }
  },

  attemptMatch() {
    const m = State.matching;
    if (!m.selectedLeft || !m.selectedRight) return;
    m.isLocked = true;

    const leftId = m.selectedLeft.id;
    const rightId = m.selectedRight.id;
    const leftPair = m.pairs.find(p => p.id === leftId);
    const rightPair = m.pairs.find(p => p.id === rightId);

    if (leftPair.status !== 'unmatched' || rightPair.status !== 'unmatched') {
      m.selectedLeft.node.classList.remove('selected');
      m.selectedRight.node.classList.remove('selected');
      m.selectedLeft = null;
      m.selectedRight = null;
      m.isLocked = false;
      return;
    }

    const isMatch = (leftId === rightId);

    if (isMatch) {
      leftPair.status = 'correct';
      rightPair.status = 'correct';
      m.correctCount++;
      m.matchedCount++;
      $('match-status').textContent = '✅ Correct!';
      $('match-status').className = 'status-msg success';
      m.selectedLeft.node.classList.remove('selected');
      m.selectedRight.node.classList.remove('selected');
      m.selectedLeft.node.className = 'match-item matched-correct';
      m.selectedLeft.node.style.cursor = 'default';
      m.selectedRight.node.className = 'match-item matched-correct';
      m.selectedRight.node.style.cursor = 'default';
      m.selectedLeft = null;
      m.selectedRight = null;
      m.isLocked = false;

      const total = m.pairs.length;
      $('match-score').textContent = 'Correct: ' + m.correctCount + '/' + total;

      const done = m.pairs.filter(p => p.status !== 'unmatched').length;
      if (done === total) {
        $('match-status').textContent = '✅ All matched!';
        setTimeout(() => {
          if (m.onComplete) {
            m.onComplete({ correct: m.correctCount, total: total });
          }
        }, 500);
      }
    } else {
      const leftKey = 'L' + leftId;
      const rightKey = 'R' + rightId;
      const alreadyErred = m.erred.has(leftKey) || m.erred.has(rightKey);

      $('match-status').textContent = '❌ Wrong match!';
      $('match-status').className = 'status-msg error';

      const leftNode = m.selectedLeft.node;
      const rightNode = m.selectedRight.node;

      leftNode.classList.remove('selected');
      rightNode.classList.remove('selected');
      leftNode.classList.add('wrong-flash', 'erred');
      rightNode.classList.add('wrong-flash', 'erred');

      m.erred.add(leftKey);
      m.erred.add(rightKey);

      m.selectedLeft = null;
      m.selectedRight = null;

      setTimeout(() => {
        leftNode.classList.remove('wrong-flash');
        rightNode.classList.remove('wrong-flash');
        $('match-status').textContent = 'Select any item.';
        $('match-status').className = 'status-msg';
        m.isLocked = false;
      }, 400);

      if (!alreadyErred && m.onHeartLost) {
        m.onHeartLost();
      }
    }
  }
};