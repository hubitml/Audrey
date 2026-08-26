// ================================================================
//  AUDIO HELPERS
// ================================================================
const AudioHelper = {
  async getSpeakerHTML(wordObj, size = '20px') {
    if (!wordObj) return '';
    const key = Utils.wordKey(wordObj);
    const record = await VoiceManager.getRecording(key);
    if (!record) return '';
    return `<span class="speaker-icon" style="font-size:${size};" data-wordkey="${key}" onclick="event.stopPropagation(); AudioHelper.play('${key}')">🔊</span>`;
  },

  async play(wordKey) {
    const record = await VoiceManager.getRecording(wordKey);
    if (record && record.audioBlob) {
      VoiceManager.playAudio(record.audioBlob);
      const icons = document.querySelectorAll(`.speaker-icon[data-wordkey="${wordKey}"]`);
      icons.forEach(icon => {
        icon.classList.add('playing');
        setTimeout(() => icon.classList.remove('playing'), 500);
      });
    }
  }
};