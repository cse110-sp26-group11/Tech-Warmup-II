const { AudioManager } = require('../src/utils/audio.js');

describe('AudioManager', () => {
    let audioManager;
    let mockAudioContext;
    let mockGainNode;
    let mockOscillator;
    let mockBufferSource;
    let mockBiquadFilter;

    beforeEach(() => {
        jest.useFakeTimers();
        
        mockOscillator = {
            type: '',
            frequency: { 
                setValueAtTime: jest.fn(), 
                exponentialRampToValueAtTime: jest.fn() 
            },
            detune: { setValueAtTime: jest.fn() },
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn()
        };

        mockGainNode = {
            gain: {
                setValueAtTime: jest.fn(),
                exponentialRampToValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn(),
                setTargetAtTime: jest.fn()
            },
            connect: jest.fn()
        };

        mockBufferSource = {
            buffer: null,
            loop: false,
            connect: jest.fn(),
            start: jest.fn()
        };

        mockBiquadFilter = {
            type: '',
            frequency: { setValueAtTime: jest.fn() },
            connect: jest.fn()
        };

        mockAudioContext = {
            createOscillator: jest.fn(() => mockOscillator),
            createGain: jest.fn(() => mockGainNode),
            createBiquadFilter: jest.fn(() => mockBiquadFilter),
            createBuffer: jest.fn(() => ({
                getChannelData: jest.fn(() => new Float32Array(100))
            })),
            createBufferSource: jest.fn(() => mockBufferSource),
            currentTime: 0,
            sampleRate: 44100,
            destination: {},
            state: 'running'
        };

        global.window = {
            AudioContext: jest.fn(() => mockAudioContext),
            webkitAudioContext: jest.fn(() => mockAudioContext),
            localStorage: (function() {
                let store = {};
                return {
                    getItem: jest.fn(key => store[key] || null),
                    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
                    clear: jest.fn(() => { store = {}; }),
                    removeItem: jest.fn(key => { delete store[key]; })
                };
            })()
        };
        global.localStorage = global.window.localStorage;
        
        audioManager = new AudioManager();
    });

    afterEach(() => {
        if (audioManager.chimeTimeout) clearTimeout(audioManager.chimeTimeout);
        jest.useRealTimers();
        delete global.window;
        delete global.localStorage;
    });

    test('should initialize as muted by default', () => {
        expect(audioManager.isMuted).toBe(true);
    });

    test('should toggle mute state and store in localStorage', () => {
        const newState = audioManager.toggleMute();
        expect(newState).toBe(false);
        expect(audioManager.isMuted).toBe(false);
        expect(global.localStorage.setItem).toHaveBeenCalledWith('slot_machine_muted', false);
    });

    test('should initialize multi-layered ambience on toggleMute', () => {
        audioManager.toggleMute();
        expect(global.window.AudioContext).toHaveBeenCalled();
        // 1 LFO + 3 Pad Oscs = 4 Oscillators
        expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
        expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
        expect(audioManager.activeNodes.length).toBeGreaterThan(0);
    });

    test('startSpinLoop should duck ambience and start clicks', () => {
        audioManager.toggleMute(); // Enable sound
        audioManager.startSpinLoop();
        expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalledWith(0.01, 0, 0.1);
        
        jest.advanceTimersByTime(100);
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    test('stopSpinLoop should clear interval and restore ambience', () => {
        audioManager.toggleMute();
        audioManager.startSpinLoop();
        audioManager.stopSpinLoop();
        expect(audioManager.spinInterval).toBeNull();
        expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalledWith(0.05, 0, 0.5);
    });

    test('should schedule and play random chimes', () => {
        audioManager.toggleMute(); // This enables sound and starts ambience/chimes
        
        const playToneSpy = jest.spyOn(audioManager, '_playTone');
        
        // Fast forward 16 seconds (max delay is 15s)
        jest.advanceTimersByTime(16000);
        
        expect(playToneSpy).toHaveBeenCalled();
        expect(playToneSpy.mock.calls[0][2]).toBe('sine');
    });

    test('should not play sounds when muted', () => {
        audioManager.isMuted = true;
        mockAudioContext.createOscillator.mockClear();
        audioManager._playTone(440, 1);
        expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
});
