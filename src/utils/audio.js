/**
 * @file audio.js
 * @description Enhanced Audio management system using Web Audio API for synthesized sounds.
 */

/**
 * @class AudioManager
 * @description Manages synthesized audio for the Slot Machine game.
 */
class AudioManager {
    /**
     * Initializes the AudioManager.
     * Default state is muted until user interaction.
     */
    constructor() {
        /** @type {AudioContext|null} */
        this.ctx = null;
        /** @type {boolean} */
        this.isMuted = localStorage.getItem('slot_machine_muted') !== 'false';
        /** @type {GainNode|null} */
        this.masterGain = null;
        /** @type {GainNode|null} */
        this.ambienceGain = null;
        /** @type {number|null} */
        this.spinInterval = null;
        /** @type {OscillatorNode[]} */
        this.ambienceOscs = [];
    }

    /**
     * Ensures AudioContext is initialized (must be called after user interaction).
     * @private
     */
    _initContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            
            this.ambienceGain = this.ctx.createGain();
            this.ambienceGain.connect(this.masterGain);
            
            this._updateVolume();
            this._startAmbience();
        }
    }

    /**
     * Starts a low-volume, cheerful background ambience (Major Third harmony).
     * @private
     */
    _startAmbience() {
        if (this.ambienceOscs.length > 0) return;
        
        // A3 (220Hz) and C#4 (277.18Hz) for a bright major third interval
        const frequencies = [220, 277.18];
        
        frequencies.forEach(freq => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.connect(this.ambienceGain);
            osc.start();
            this.ambienceOscs.push(osc);
        });

        this.ambienceGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    }

    /**
     * Updates the master gain based on mute state.
     * @private
     */
    _updateVolume() {
        if (this.masterGain) {
            const volume = this.isMuted ? 0 : 0.5;
            this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.01);
        }
    }

    /**
     * Toggles the mute state and persists it to localStorage.
     * @returns {boolean} The new mute state.
     */
    toggleMute() {
        this._initContext();
        this.isMuted = !this.isMuted;
        localStorage.setItem('slot_machine_muted', this.isMuted);
        this._updateVolume();
        return this.isMuted;
    }

    /**
     * Plays a simple synthesized sound.
     * @param {number} freq Frequency in Hz.
     * @param {number} duration Duration in seconds.
     * @param {OscillatorType} type Oscillator type ('sine', 'square', etc).
     * @param {number} vol Volume (0.0 to 1.0).
     * @private
     */
    _playTone(freq, duration, type = 'sine', vol = 0.2) {
        if (this.isMuted) return;
        this._initContext();
        if (this.ctx.state === 'suspended') return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    /**
     * Starts the continuous reel spin sound loop with ducked ambience.
     */
    startSpinLoop() {
        this._initContext();
        if (this.isMuted) return;

        // Duck ambience
        this.ambienceGain.gain.setTargetAtTime(0.01, this.ctx.currentTime, 0.1);

        let delay = 100;
        const playClick = () => {
            this._playTone(200, 0.05, 'square', 0.1);
            if (this.spinInterval) {
                delay = Math.min(delay + 10, 250); // Slow down the clicks
                this.spinInterval = setTimeout(playClick, delay);
            }
        };
        this.spinInterval = setTimeout(playClick, delay);
    }

    /**
     * Stops the spin loop and restores ambience.
     */
    stopSpinLoop() {
        if (this.spinInterval) {
            clearTimeout(this.spinInterval);
            this.spinInterval = null;
        }
        if (this.ctx && this.ambienceGain) {
            this.ambienceGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.5);
        }
    }

    /**
     * Plays the spin start sound (deprecated in favor of loop).
     */
    playSpinSound() {
        this._playTone(150, 0.1, 'square');
    }

    /**
     * Plays a standard win sound (ascending chime).
     */
    playWinSound() {
        this._playTone(523.25, 0.3); // C5
        setTimeout(() => this._playTone(659.25, 0.3), 100); // E5
        setTimeout(() => this._playTone(783.99, 0.5), 200); // G5
    }

    /**
     * Plays a big win sound (fanfare/arpeggio).
     */
    playBigWinSound() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((note, i) => {
            setTimeout(() => this._playTone(note, 0.4, 'triangle'), i * 150);
        });
    }

    /**
     * Plays a lose sound (descending low tone).
     */
    playLoseSound() {
        this._initContext();
        if (this.isMuted || this.ctx.state === 'suspended') return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}

// Support both ESM (via browser module support if used), Global, and CommonJS (Node/Jest)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager };
} else if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
}
