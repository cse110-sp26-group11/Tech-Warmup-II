/**
 * @file audio.js
 * @description Audio management system using Web Audio API for synthesized game sounds.
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
            this._updateVolume();
        }
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
     * @private
     */
    _playTone(freq, duration, type = 'sine') {
        this._initContext();
        if (this.isMuted || this.ctx.state === 'suspended') return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    /**
     * Plays the spin sound (short click/thud).
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
