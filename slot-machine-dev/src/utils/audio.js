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
        /** @type {AudioBufferSourceNode|null} */
        this.drumSource = null;
        /** @type {OscillatorNode|null} */
        this.humOscillator = null;
        /** @type {boolean} */
        this.isInitialized = false;
        /** @type {boolean} */
        this.isInitializing = false;
        /** @type {number|null} */
        this.atmosphereTimer = null;
    }

    /**
     * Ensures AudioContext is initialized and assets are loaded.
     * @private
     */
    async _initContext() {
        if (this.isInitialized || this.isInitializing) return;
        this.isInitializing = true;
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            
            this.ambienceGain = this.ctx.createGain();
            this.ambienceGain.connect(this.masterGain);
            
            this._updateVolume();
            await this._loadAssets();
            this._startAmbience();
            this._startAtmosphere();
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Loads and decodes all audio assets.
     * @private
     */
    async _loadAssets() {
        const assets = {
            background: 'sounds/background.mp3',
            drum: 'sounds/drum.wav',
            winning: 'sounds/winning.mp3',
            losing: 'sounds/losing.wav',
            clap: 'sounds/clap.mp3',
            start: 'sounds/start.mp3'
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
     * Starts the background music loop and mechanical hum.
     * @private
     */
    _startAmbience() {
        if (this.isMuted) return;

        // 1. Background Music Loop
        if (this.buffers.background && !this.backgroundSource) {
            this.backgroundSource = this.ctx.createBufferSource();
            this.backgroundSource.buffer = this.buffers.background;
            this.backgroundSource.loop = true;
            this.backgroundSource.connect(this.ambienceGain);
            
            this.ambienceGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            this.backgroundSource.start();
        }

        // 2. Mechanical Hum (Classic Slot Machine Vibe)
        if (!this.humOscillator) {
            this.humOscillator = this.ctx.createOscillator();
            const humGain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            this.humOscillator.type = 'triangle';
            this.humOscillator.frequency.setValueAtTime(60, this.ctx.currentTime); // 60Hz hum
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(150, this.ctx.currentTime);
            
            humGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            
            // Evolving effect: subtle volume fluctuation
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.setValueAtTime(0.5, this.ctx.currentTime);
            lfoGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
            lfo.connect(lfoGain);
            lfoGain.connect(humGain.gain);
            lfo.start();

            this.humOscillator.connect(filter);
            filter.connect(humGain);
            humGain.connect(this.ambienceGain);
            this.humOscillator.start();
        }
    }

    /**
     * Starts random atmosphere sounds (distant wins, clinks).
     * @private
     */
    _startAtmosphere() {
        if (this.atmosphereTimer) return;

        const playRandomClink = () => {
            if (this.isMuted) {
                this.atmosphereTimer = setTimeout(playRandomClink, 5000 + Math.random() * 10000);
                return;
            }

            const sounds = ['winning', 'clap'];
            const sound = sounds[Math.floor(Math.random() * sounds.length)];
            
            // Play a very quiet, distant version of the sound
            const distGain = this.ctx.createGain();
            distGain.gain.setValueAtTime(0.01 + Math.random() * 0.02, this.ctx.currentTime);
            distGain.connect(this.ambienceGain);

            this._playBuffer(sound, Math.random() * 2, 1, distGain);
            
            this.atmosphereTimer = setTimeout(playRandomClink, 3000 + Math.random() * 7000);
        };

        playRandomClink();
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

        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        this.isMuted = !this.isMuted;
        localStorage.setItem('slot_machine_muted', this.isMuted);
        this._updateVolume();
        
        if (!this.isMuted) {
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
        if (this.isMuted || !this.buffers[key]) return null;
        
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[key];
        source.connect(output);
        source.start(this.ctx.currentTime, offset, duration);
        return source;
    }

    /**
     * Starts the continuous reel spin sound sequence.
     * Plays a start sound, then enters the drum loop with smooth deceleration.
     */
    async startSpinLoop() {
        await this._initContext();
        if (this.isMuted) return;

        // Reduce ambience during spin focus
        this.ambienceGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.1);

        // 1. Play the "Lever Pull/Start" sound
        if (this.buffers.start) {
            this._playBuffer('start', 0, 1.5);
        }

        // 2. Schedule the drum loop to start shortly after
        setTimeout(() => {
            if (this.isMuted || this.drumSource) return;

            this.drumSource = this.ctx.createBufferSource();
            this.drumSource.buffer = this.buffers.drum;
            this.drumSource.loop = true;
            this.drumSource.connect(this.masterGain);
            
            // Set initial fast playback rate
            const startRate = 2.5;
            const endRate = 0.6;
            const duration = 6000; // 6 seconds
            let elapsed = 0;
            
            this.drumSource.playbackRate.setValueAtTime(startRate, this.ctx.currentTime);
            this.drumSource.start();

            // Smooth deceleration every 100ms
            this.spinInterval = setInterval(() => {
                elapsed += 100;
                const progress = Math.min(elapsed / duration, 1);
                
                // rate = 0.6 + (2.5 - 0.6) * Math.pow(1 - progress, 2)
                const currentRate = endRate + (startRate - endRate) * Math.pow(1 - progress, 2);
                
                if (this.drumSource) {
                    this.drumSource.playbackRate.setTargetAtTime(currentRate, this.ctx.currentTime, 0.05);
                }

                if (progress >= 1) {
                    clearInterval(this.spinInterval);
                }
            }, 100);

        }, 300); // 300ms delay for the pull sound to feel distinct
    }

    /**
     * Stops the spin sequence and restores ambience.
     */
    stopSpinLoop() {
        if (this.spinInterval) {
            clearInterval(this.spinInterval);
            this.spinInterval = null;
        }
        if (this.drumSource) {
            this.drumSource.stop();
            this.drumSource = null;
        }
        if (this.ambienceGain) {
            this.ambienceGain.gain.setTargetAtTime(0.2, this.ctx.currentTime, 0.5);
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
