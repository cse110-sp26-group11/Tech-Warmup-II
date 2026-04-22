/**
 * @file audio.js
 * @description Audio management system using Web Audio API for playing custom audio files.
 */

/**
 * @class AudioManager
 * @description Manages playback of game audio files with precise segment control and looping.
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
        /** @type {Object.<string, AudioBuffer>} */
        this.buffers = {};
        /** @type {AudioBufferSourceNode|null} */
        this.backgroundSource = null;
        /** @type {number|null} */
        this.drumTimeout = null;
        /** @type {number|null} */
        this.startTimeout = null;
        /** @type {boolean} */
        this.isInitialized = false;
    }

    /**
     * Ensures AudioContext is initialized and assets are loaded.
     * @private
     */
    async _initContext() {
        if (this.isInitialized) return;
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            
            this.ambienceGain = this.ctx.createGain();
            this.ambienceGain.connect(this.masterGain);
            
            this._updateVolume();
            await this._loadAssets();
            this._startAmbience();
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
        }
    }

    /**
     * Loads and decodes all audio assets.
     * @private
     */
    async _loadAssets() {
        const assets = {
            background: 'sounds/background.mp3',
            start: 'sounds/start.mp3',
            drum: 'sounds/drum.wav',
            winning: 'sounds/winning.mp3',
            losing: 'sounds/losing.wav',
            clap: 'sounds/clap.mp3'
        };

        const loadPromises = Object.entries(assets).map(async ([key, url]) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                this.buffers[key] = await this.ctx.decodeAudioData(arrayBuffer);
            } catch (e) {
                console.error(`Failed to load audio asset: ${url}`, e);
            }
        });

        await Promise.all(loadPromises);
    }

    /**
     * Starts the background music loop.
     * @private
     */
    _startAmbience() {
        if (this.isMuted || !this.buffers.background) return;
        
        this.backgroundSource = this.ctx.createBufferSource();
        this.backgroundSource.buffer = this.buffers.background;
        this.backgroundSource.loop = true;
        this.backgroundSource.connect(this.ambienceGain);
        
        this.ambienceGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        this.backgroundSource.start();
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
    async toggleMute() {
        await this._initContext();

        // Explicitly resume the AudioContext to handle browser auto-play restrictions
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
            console.log('AudioContext successfully resumed on user interaction.');
        }

        this.isMuted = !this.isMuted;
        localStorage.setItem('slot_machine_muted', this.isMuted);
        this._updateVolume();
        
        if (!this.isMuted && !this.backgroundSource) {
            this._startAmbience();
        }
        return this.isMuted;
    }

    /**
     * Internal helper to play a sound buffer with segment control.
     * @param {string} key Asset key.
     * @param {number} [offset=0] Start time in seconds.
     * @param {number} [duration] Duration in seconds.
     * @param {GainNode} [output] Destination node.
     * @private
     */
    _playBuffer(key, offset = 0, duration = undefined, output = this.masterGain) {
        if (this.isMuted || !this.buffers[key]) return;
        
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[key];
        source.connect(output);
        source.start(this.ctx.currentTime, offset, duration);
        return source;
    }

    /**
     * Starts the spin sound sequence.
     */
    async startSpinLoop() {
        await this._initContext();
        if (this.isMuted) return;

        // Duck ambience
        this.ambienceGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.1);

        // Play start.mp3 (first 1.5s)
        this._playBuffer('start', 0, 1.5);

        // Start drum loop after 1s
        let interval = 100;
        const playDrum = () => {
            this._playBuffer('drum');
            if (this.drumTimeout) {
                interval = Math.min(interval + 15, 300); // Slow down
                this.drumTimeout = setTimeout(playDrum, interval);
            }
        };

        this.startTimeout = setTimeout(() => {
            this.drumTimeout = setTimeout(playDrum, 0);
        }, 1000);
    }

    /**
     * Stops the spin sequence and restores ambience.
     */
    stopSpinLoop() {
        if (this.drumTimeout) {
            clearTimeout(this.drumTimeout);
            this.drumTimeout = null;
        }
        if (this.startTimeout) {
            clearTimeout(this.startTimeout);
            this.startTimeout = null;
        }
        if (this.ambienceGain) {
            this.ambienceGain.gain.setTargetAtTime(0.25, this.ctx.currentTime, 0.5);
        }
    }

    /**
     * Plays a standard win sound (first 2s of winning.mp3).
     */
    playWinSound() {
        this._playBuffer('winning', 0, 2);
    }

    /**
     * Plays big win sound (winning.mp3 0-4s + clap.mp3 4-8s).
     */
    playBigWinSound() {
        this._playBuffer('winning', 0, 4);
        this._playBuffer('clap', 4, 4);
    }

    /**
     * Plays the lose sound (full losing.wav).
     */
    playLoseSound() {
        this._playBuffer('losing');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager };
} else if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
}
