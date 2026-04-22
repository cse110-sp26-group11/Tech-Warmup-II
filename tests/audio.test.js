const { AudioManager } = require('../src/utils/audio.js');

describe('AudioManager', () => {
    let audioManager;
    let mockAudioContext;
    let mockGainNode;
    let mockOscillator;

    beforeEach(() => {
        jest.useFakeTimers();
        // Mock window and localStorage for Node environment
        global.window = {
            AudioContext: jest.fn(),
            webkitAudioContext: jest.fn(),
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

        // Mock Web Audio API
        mockOscillator = {
            type: '',
            frequency: { 
                setValueAtTime: jest.fn(), 
                exponentialRampToValueAtTime: jest.fn() 
            },
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

        mockAudioContext = {
            createOscillator: jest.fn(() => mockOscillator),
            createGain: jest.fn(() => mockGainNode),
            currentTime: 0,
            destination: {},
            state: 'running'
        };

        global.window.AudioContext = jest.fn(() => mockAudioContext);
        
        audioManager = new AudioManager();
    });

    afterEach(() => {
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

        audioManager.toggleMute();
        expect(audioManager.isMuted).toBe(true);
        expect(global.localStorage.setItem).toHaveBeenCalledWith('slot_machine_muted', true);
    });

    test('should initialize AudioContext on toggleMute', () => {
        audioManager.toggleMute();
        expect(global.window.AudioContext).toHaveBeenCalled();
        expect(audioManager.ctx).toBeDefined();
    });

    test('startSpinLoop should duck ambience and start clicks', () => {
        audioManager.isMuted = false;
        audioManager.startSpinLoop();
        
        // Ducking
        expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalledWith(0.01, 0, 0.1);
        expect(audioManager.spinInterval).toBeDefined();
        
        // Fast forward to first click
        jest.advanceTimersByTime(100);
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    test('stopSpinLoop should clear interval and restore ambience', () => {
        audioManager.isMuted = false;
        audioManager.startSpinLoop();
        audioManager.stopSpinLoop();
        
        expect(audioManager.spinInterval).toBeNull();
        expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalledWith(0.05, 0, 0.5);
    });

    test('playSpinSound should call _playTone with correct params', () => {
        const playToneSpy = jest.spyOn(audioManager, '_playTone');
        audioManager.isMuted = false;
        audioManager.playSpinSound();
        expect(playToneSpy).toHaveBeenCalledWith(150, 0.1, 'square');
    });

    test('playWinSound should call _playTone multiple times', () => {
        const playToneSpy = jest.spyOn(audioManager, '_playTone');
        audioManager.isMuted = false;
        audioManager.playWinSound();
        
        expect(playToneSpy).toHaveBeenCalledWith(523.25, 0.3);
        
        jest.advanceTimersByTime(100);
        expect(playToneSpy).toHaveBeenCalledWith(659.25, 0.3);
        
        jest.advanceTimersByTime(100);
        expect(playToneSpy).toHaveBeenCalledWith(783.99, 0.5);
    });

    test('should not play sounds when muted', () => {
        audioManager.isMuted = true;
        // The first oscillator might be created by ambience in _initContext
        mockAudioContext.createOscillator.mockClear();
        
        audioManager._playTone(440, 1);
        expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
});
