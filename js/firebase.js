// ================================================================
//  VOICE MANAGER - IndexedDB (shared with editor)
// ================================================================
const VoiceManager = {
  dbName: 'WordDrillsVoices',
  dbVersion: 1,
  storeName: 'recordings',
  db: null,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'wordKey' });
        }
      };
      request.onsuccess = (event) => { this.db = event.target.result;
        resolve(); };
      request.onerror = (event) => { reject(event.target.error); };
    });
  },

  async getRecording(wordKey) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(wordKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  playAudio(audioBlob) {
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play();
    return audio;
  }
};