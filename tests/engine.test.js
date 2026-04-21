const { SlotEngine } = require('../src/math/engine');

describe('SlotEngine', () => {
  const config = {
    reels: [
      [
        { symbol: 'Cherry', weight: 10 },
        { symbol: 'Lemon', weight: 20 },
        { symbol: 'Seven', weight: 5 }
      ],
      [
        { symbol: 'Cherry', weight: 10 },
        { symbol: 'Lemon', weight: 20 },
        { symbol: 'Seven', weight: 5 }
      ],
      [
        { symbol: 'Cherry', weight: 10 },
        { symbol: 'Lemon', weight: 20 },
        { symbol: 'Seven', weight: 5 }
      ]
    ],
    paytable: [
      { symbols: ['Seven', 'Seven', 'Seven'], payout: 100 },
      { symbols: ['Cherry', 'Cherry', 'Cherry'], payout: 10 },
      { symbols: ['Lemon', 'Lemon', 'Lemon'], payout: 2 }
    ]
  };

  describe('Initialization', () => {
    test('should initialize with a valid configuration', () => {
      const engine = new SlotEngine(config);
      expect(engine).toBeDefined();
    });

    test('should throw an error for missing reels', () => {
      expect(() => new SlotEngine({ paytable: [] })).toThrow('Invalid configuration: reels and paytable are required');
    });

    test('should throw an error for empty paytable', () => {
      expect(() => new SlotEngine({ reels: [[]], paytable: [] })).toThrow('Invalid configuration: reels and paytable cannot be empty');
    });
  });

  describe('Spin Logic', () => {
    test('should return a spin result with symbols and payout', () => {
      const engine = new SlotEngine(config);
      const result = engine.spin();

      expect(result).toHaveProperty('symbols');
      expect(result).toHaveProperty('payout');
      expect(result.symbols).toHaveLength(config.reels.length);
      expect(typeof result.payout).toBe('number');
    });
  });

  describe('Payout Evaluation', () => {
    test('should correctly calculate payout for a winning combination (3x Seven)', () => {
      const engine = new SlotEngine(config);
      // We manually check evaluation for known symbols
      const payout = engine.evaluate(['Seven', 'Seven', 'Seven']);
      expect(payout).toBe(100);
    });

    test('should correctly calculate payout for a winning combination (3x Lemon)', () => {
      const engine = new SlotEngine(config);
      const payout = engine.evaluate(['Lemon', 'Lemon', 'Lemon']);
      expect(payout).toBe(2);
    });

    test('should return 0 for a losing combination', () => {
      const engine = new SlotEngine(config);
      const payout = engine.evaluate(['Seven', 'Lemon', 'Cherry']);
      expect(payout).toBe(0);
    });
  });
});
