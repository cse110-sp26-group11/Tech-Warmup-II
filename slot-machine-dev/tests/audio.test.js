const { AudioManager } = require('../src/utils/audio.js');

describe('AudioManager', () => {
    let audioManager;
    let mockAudioContext;
    let mockGainNode;
    let mockBufferSource;
    let mockAudioBuffer;

    beforeEach(() => {
        jest.useFakeTimers();
        
        mockAudioBuffer = {
            duration: 10,
            numberOfChannels: 2,
            sampleRate: 44100
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

        const mockOscillator = {
            type: 'sine',
            frequency: { setValueAtTime: jest.fn() },
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn()
        };

        const mockFilter = {
            type: 'lowpass',
            frequency: { setValueAtTime: jest.fn() },
            connect: jest.fn()
        };

        mockBufferSource = {
            buffer: null,
            loop: false,
            playbackRate: {
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn(),
                setTargetAtTime: jest.fn()
            },
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn()
        };

        mockAudioContext = {
            createGain: jest.fn(() => mockGainNode),
            createBufferSource: jest.fn(() => mockBufferSource),
            createOscillator: jest.fn(() => mockOscillator),
            createBiquadFilter: jest.fn(() => mockFilter),
            decodeAudioData: jest.fn().mockResolvedValue(mockAudioBuffer),
            currentTime: 0,
            destination: {},
            state: 'running',
            resume: jest.fn().mockResolvedValue()
        };

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100))
        });

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
        jest.useRealTimers();
        delete global.window;
        delete global.localStorage;
        delete global.fetch;
    });

    test('should initialize and load assets', async () => {
        // Use private method to initialize for test purposes
        await audioManager._initContext();
        expect(global.fetch).toHaveBeenCalledTimes(6);
        expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
        expect(audioManager.isInitialized).toBe(true);
    });

    test('startSpinLoop should play start segment and schedule drum', async () => {
        await audioManager._initContext();
        audioManager.buffers = { start: mockAudioBuffer, drum: mockAudioBuffer };
        
        // Clear previous calls from ambience setup
        mockBufferSource.start.mockClear();
        
        await audioManager.startSpinLoop();
        
        // start.mp3 playback call (offset 0, duration 1.5)
        expect(mockBufferSource.start).toHaveBeenCalledWith(0, 0, 1.5);
        
        // Advance 301ms to start drum loop (300ms delay in code)
        jest.advanceTimersByTime(301);
        // Drum source start is called without arguments
        expect(mockBufferSource.start).toHaveBeenCalledWith();
    });

    test('playWinSound should play segment 0-2s', async () => {
        await audioManager._initContext();
        audioManager.buffers.winning = mockAudioBuffer;
        
        // Clear calls from ambience/atmosphere
        mockBufferSource.start.mockClear();
        
        audioManager.playWinSound();
        expect(mockBufferSource.start).toHaveBeenCalledWith(0, 0, 2);
    });

    test('playBigWinSound should play multiple segments', async () => {
        await audioManager._initContext();
        audioManager.buffers = { winning: mockAudioBuffer, clap: mockAudioBuffer };
        
        // Clear calls from ambience/atmosphere
        mockBufferSource.start.mockClear();
        
        audioManager.playBigWinSound();
        // winning.mp3 0-4s
        expect(mockBufferSource.start).toHaveBeenCalledWith(0, 0, 4);
        // clap.mp3 4-8s
        expect(mockBufferSource.start).toHaveBeenCalledWith(0, 4, 4);
    });

    test('should not play when muted', async () => {
        await audioManager._initContext();
        audioManager.isMuted = true;
        mockAudioContext.createBufferSource.mockClear();
        
        audioManager._playBuffer('winning');
        expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });

    test('toggleMute should toggle state and save to localStorage', async () => {
        expect(audioManager.isMuted).toBe(false);
        await audioManager.toggleMute();
        expect(audioManager.isMuted).toBe(true);
        expect(global.localStorage.setItem).toHaveBeenCalledWith('slot_machine_muted', true);
        
        await audioManager.toggleMute();
        expect(audioManager.isMuted).toBe(false);
        expect(global.localStorage.setItem).toHaveBeenCalledWith('slot_machine_muted', false);
    });
});
