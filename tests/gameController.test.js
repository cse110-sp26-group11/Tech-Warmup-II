const { GameController } = require('../src/controllers/gameController');
const { SlotEngine } = require('../src/math/engine');
const { Wallet } = require('../src/meta/wallet');
const { Leveling } = require('../src/meta/leveling');

describe('GameController', () => {
  let engine;
  let wallet;
  let leveling;
  let controller;

  const config = {
    reels: [
      [{ symbol: 'Cherry', weight: 1 }],
      [{ symbol: 'Cherry', weight: 1 }],
      [{ symbol: 'Cherry', weight: 1 }]
    ],
    paytable: [
      { symbols: ['Cherry', 'Cherry', 'Cherry'], payout: 10 }
    ]
  };

  beforeEach(() => {
    engine = new SlotEngine(config);
    wallet = new Wallet(100);
    leveling = new Leveling();
    controller = new GameController(engine, wallet, leveling);
  });

  describe('playSpin', () => {
    test('should process a complete spin cycle', () => {
      const betAmount = 10;
      const result = controller.playSpin(betAmount);

      // 100 - 10 (bet) + 100 (win: 10 * 10) = 190
      expect(wallet.getBalance()).toBe(190);
      expect(leveling.getXP()).toBe(10); // XP matches bet
      expect(result).toHaveProperty('spinResult');
      expect(result.newBalance).toBe(190);
      expect(result.levelInfo).toBeDefined();
    });

    test('should throw error if wallet has insufficient funds', () => {
      expect(() => controller.playSpin(200)).toThrow('Insufficient balance');
    });

    test('should correctly report a level up during spin', () => {
      // Set XP just below threshold
      leveling.addXP(990, wallet);
      wallet.deductCoins(wallet.getBalance());
      wallet.addCoins(100);

      const result = controller.playSpin(20); // 20 XP will trigger level up

      expect(result.levelInfo.leveledUp).toBe(true);
      expect(result.levelInfo.currentLevel).toBe(2);
    });

    test('should throw error for invalid bet amount', () => {
      expect(() => controller.playSpin(-5)).toThrow('Bet amount must be a positive number');
      expect(() => controller.playSpin(0)).toThrow('Bet amount must be a positive number');
    });
  });
});
