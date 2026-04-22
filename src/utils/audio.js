/**
 * @file audio.js
 * @description Enhanced Audio management system using Web Audio API for immersive casino sounds.
 */

/**
 * @class AudioManager
 * @description Manages synthesized audio and an immersive background soundscape.
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
        /** @type {number|null} */
        this.chimeTimeout = null;
        /** @type {OscillatorNode[]} */
        this.activeNodes = [];
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
     * Starts the multi-layered casino soundscape.
     * @private
     */
    _startAmbience() {
        if (this.activeNodes.length > 0) return;

        this._createPad();
        this._createMurmur();
        this._scheduleChime();
        this.ambienceGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    }

    /**
     * Creates a warm, evolving pad sound using detuned oscillators and LFO.
     * @private
     */
    _createPad() {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
        filter.connect(this.ambienceGain);

        // LFO for filter modulation to create movement
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        this.activeNodes.push(lfo);

        // C3, E3, G3 detuned for warmth
        const freqs = [130.81, 164.81, 196.00];
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, this.ctx.currentTime);
            osc.detune.setValueAtTime((i - 1) * 5, this.ctx.currentTime);
            osc.connect(filter);
            osc.start();
            this.activeNodes.push(osc);
        });
    }

    /**
     * Creates a subtle 'crowd murmur' using filtered white noise.
     * @private
     */
    _createMurmur() {
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(600, this.ctx.currentTime);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ambienceGain);
        whiteNoise.start();
        this.activeNodes.push(whiteNoise);
    }

    /**
     * Schedules occasional random chimes in a major pentatonic scale.
     * @private
     */
    _scheduleChime() {
        const delay = (Math.random() * 7 + 8) * 1000; // 8-15 seconds
        this.chimeTimeout = setTimeout(() => {
            if (!this.isMuted) {
                const notes = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5-A5 Pentatonic
                const note = notes[Math.floor(Math.random() * notes.length)];
                this._playTone(note, 2.0, 'sine', 0.05);
            }
            this._scheduleChime();
        }, delay);
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

        this.ambienceGain.gain.setTargetAtTime(0.01, this.ctx.currentTime, 0.1);

        let delay = 100;
        const playClick = () => {
            this._playTone(200, 0.05, 'square', 0.1);
            if (this.spinInterval) {
                delay = Math.min(delay + 10, 250);
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
