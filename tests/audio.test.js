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

        mockBufferSource = {
            buffer: null,
            loop: false,
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn()
        };

        mockAudioContext = {
            createGain: jest.fn(() => mockGainNode),
            createBufferSource: jest.fn(() => mockBufferSource),
            decodeAudioData: jest.fn().mockResolvedValue(mockAudioBuffer),
            currentTime: 0,
            destination: {},
            state: 'running'
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

    test('should initialize and load assets on toggleMute', async () => {
        await audioManager.toggleMute();
        expect(global.fetch).toHaveBeenCalledTimes(6);
        expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
        expect(audioManager.isInitialized).toBe(true);
    });

    test('startSpinLoop should play start segment and schedule drum', async () => {
        await audioManager.toggleMute(); // Enable
        audioManager.buffers = { start: mockAudioBuffer, drum: mockAudioBuffer };
        
        await audioManager.startSpinLoop();
        
        // start.mp3 playback call (offset 0, duration 1.5)
        expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
        expect(mockBufferSource.start).toHaveBeenCalledWith(0, 0, 1.5);
        
        // Advance 1s to start drum loop
        jest.advanceTimersByTime(1001);
        expect(mockBufferSource.start).toHaveBeenCalledWith(0, 0, undefined);
    });

    test('playWinSound should play segment 0-2s', async () => {
        await audioManager.toggleMute();
        audioManager.buffers.winning = mockAudioBuffer;
        
        audioManager.playWinSound();
        expect(mockBufferSource.start).toHaveBeenCalledWith(0, 0, 2);
    });

    test('playBigWinSound should play multiple segments', async () => {
        await audioManager.toggleMute();
        audioManager.buffers = { winning: mockAudioBuffer, clap: mockAudioBuffer };
        
        audioManager.playBigWinSound();
        // winning.mp3 0-4s
        expect(mockBufferSource.start).toHaveBeenCalledWith(0, 0, 4);
        // clap.mp3 4-8s
        expect(mockBufferSource.start).toHaveBeenCalledWith(0, 4, 4);
    });

    test('should not play when muted', async () => {
        audioManager.isMuted = true;
        audioManager._playBuffer('winning');
        expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });
});
