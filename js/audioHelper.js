// ================================================================
//  AUDIO HELPERS - GitHub Audio Support
// ================================================================
const AudioHelper = {
  // Cache for loaded audio (maps wordKey to audio URL or blob)
  audioCache: new Map(),
  _currentAudio: null,
  
  // Get the GitHub raw URL for an audio file
  getGitHubAudioUrl(wordObj) {
    if (!wordObj || !wordObj.audioFile) return null;
    return `https://raw.githubusercontent.com/hubitml/Audrey/main/${wordObj.audioFile}`;
  },
  
  // Check if a word has audio available
  hasAudio(wordObj) {
    return wordObj && wordObj.audioFile && wordObj.audioFile.length > 0;
  },
  
  // Play audio from GitHub with iOS support
  async playAudio(wordObj) {
    if (!this.hasAudio(wordObj)) {
      console.warn('No audio for:', wordObj?.word);
      return false;
    }
    
    const url = this.getGitHubAudioUrl(wordObj);
    if (!url) return false;
    
    try {
      // Stop any currently playing audio
      if (this._currentAudio) {
        this._currentAudio.pause();
        this._currentAudio = null;
      }
      
      // Check cache first
      const wordKey = Utils.wordKey(wordObj);
      let audioUrl = this.audioCache.get(wordKey);
      
      if (!audioUrl) {
        // Try to load the audio
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        audioUrl = URL.createObjectURL(blob);
        this.audioCache.set(wordKey, audioUrl);
      }
      
      // Unlock audio context for iOS
      if (window.AudioContext || window.webkitAudioContext) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
      }
      
      const audio = new Audio(audioUrl);
      this._currentAudio = audio;
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          this._currentAudio = null;
          resolve(true);
        };
        audio.onerror = (e) => {
          console.error('Audio error:', e);
          this._currentAudio = null;
          // Try fallback: create new audio element with fresh URL
          this.playFallbackAudio(url).then(resolve).catch(reject);
        };
        
        audio.play().then(() => {
          resolve(true);
        }).catch(err => {
          console.warn('Play failed:', err);
          this._currentAudio = null;
          // Try fallback for iOS
          this.playFallbackAudio(url).then(resolve).catch(reject);
        });
      });
      
    } catch (err) {
      console.error('Audio playback error:', err);
      return false;
    }
  },
  
  // Fallback for iOS - creates a new audio element with user interaction
  async playFallbackAudio(url) {
    try {
      const audio = new Audio(url);
      this._currentAudio = audio;
      // For iOS, we need a user gesture. If this is called from a click event,
      // the gesture should be available.
      await audio.play();
      return true;
    } catch (err) {
      console.warn('Fallback play failed:', err);
      return false;
    }
  },
  
  // Get speaker HTML for the word
  getSpeakerHTML(wordObj, size = '20px') {
    if (!this.hasAudio(wordObj)) return '';
    const wordKey = Utils.wordKey(wordObj);
    return `<span class="speaker-icon" style="font-size:${size};cursor:pointer;display:inline-block;margin-left:8px;" data-wordkey="${wordKey}" onclick="event.stopPropagation(); AudioHelper.handleSpeakerClick('${wordKey}')">🔊</span>`;
  },
  
  // Handle speaker button click
  async handleSpeakerClick(wordKey) {
    // Find the word object in the current pool
    const wordObj = State.allWords.find(w => Utils.wordKey(w) === wordKey);
    if (!wordObj) {
      console.warn('Word not found:', wordKey);
      return;
    }
    
    // Find the speaker icon
    const icon = document.querySelector(`.speaker-icon[data-wordkey="${wordKey}"]`);
    if (!icon) return;
    
    // Show loading state
    const originalText = icon.textContent;
    icon.textContent = '⏳';
    icon.style.opacity = '0.7';
    
    try {
      const success = await this.playAudio(wordObj);
      
      if (success) {
        icon.textContent = '🔊';
        icon.style.opacity = '1';
        icon.style.color = '#6FA97A';
        setTimeout(() => {
          icon.style.color = '';
        }, 500);
      } else {
        icon.textContent = '🔇';
        icon.style.opacity = '1';
        setTimeout(() => {
          icon.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      icon.textContent = '🔇';
      icon.style.opacity = '1';
      setTimeout(() => {
        icon.textContent = originalText;
      }, 2000);
    }
  },
  
  // Preload audio for multiple words
  async preloadAudioBatch(wordObjects, batchSize = 3) {
    const toLoad = wordObjects.filter(w => this.hasAudio(w));
    console.log(`📥 Preloading ${toLoad.length} audio files...`);
    
    let loaded = 0;
    let failed = 0;
    
    for (let i = 0; i < toLoad.length; i += batchSize) {
      const batch = toLoad.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(w => this.preloadAudio(w))
      );
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          loaded++;
        } else {
          failed++;
        }
      });
    }
    
    console.log(`✅ Preloaded ${loaded} files, ${failed} failed`);
    return { loaded, failed };
  },
  
  // Preload a single audio file
  async preloadAudio(wordObj) {
    if (!this.hasAudio(wordObj)) return false;
    
    const wordKey = Utils.wordKey(wordObj);
    if (this.audioCache.has(wordKey)) return true;
    
    const url = this.getGitHubAudioUrl(wordObj);
    if (!url) return false;
    
    try {
      const response = await fetch(url);
      if (!response.ok) return false;
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      this.audioCache.set(wordKey, objectUrl);
      return true;
    } catch (err) {
      console.warn('Preload failed for:', wordObj.word, err);
      return false;
    }
  },
  
  // Clear audio cache
  clearCache() {
    for (const url of this.audioCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.audioCache.clear();
    if (this._currentAudio) {
      this._currentAudio.pause();
      this._currentAudio = null;
    }
  },
  
  // Check if audio is available for the current word
  async ensureAudioAvailable(wordObj) {
    if (!this.hasAudio(wordObj)) return false;
    
    const wordKey = Utils.wordKey(wordObj);
    if (this.audioCache.has(wordKey)) return true;
    
    return await this.preloadAudio(wordObj);
  }
};

// ================================================================
//  IOS AUDIO UNLOCK - Run this once at startup
// ================================================================
function enableIOSAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      const unlock = () => {
        ctx.resume().then(() => {
          console.log('🔊 Audio context unlocked');
          document.removeEventListener('click', unlock);
          document.removeEventListener('touchstart', unlock);
          document.removeEventListener('touchend', unlock);
        }).catch(err => {
          console.warn('Audio unlock failed:', err);
        });
      };
      document.addEventListener('click', unlock);
      document.addEventListener('touchstart', unlock);
      document.addEventListener('touchend', unlock);
    } else {
      console.log('🔊 Audio context already running');
    }
  }
}

// Call this on page load
enableIOSAudio();

// ================================================================
//  EXTRA: Load audio status in the MC
// ================================================================

// Add this to your MC or VerbsMode start function
// After loading words, check audio availability
function checkAudioAvailability() {
  const wordsWithAudio = State.allWords.filter(w => w.audioFile);
  const totalWords = State.allWords.length;
  const audioCount = wordsWithAudio.length;
  
  if (audioCount === 0) {
    UI.showToast('ℹ️ No audio files found. Record words in the Editor and upload to GitHub.', 'info');
  } else {
    console.log(`🎵 ${audioCount}/${totalWords} words have audio`);
    // Preload audio in the background
    AudioHelper.preloadAudioBatch(wordsWithAudio).then(result => {
      console.log(`📥 Audio preload: ${result.loaded} loaded, ${result.failed} failed`);
    });
  }
}
