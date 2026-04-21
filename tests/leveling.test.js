const { Leveling } = require('../src/meta/leveling');
const { Wallet } = require('../src/meta/wallet');

describe('Leveling Module', () => {
  let wallet;
  let leveling;

  beforeEach(() => {
    wallet = new Wallet(0);
    leveling = new Leveling();
  });

  describe('Initialization', () => {
    test('should initialize at Level 1 with 0 XP', () => {
      expect(leveling.getLevel()).toBe(1);
      expect(leveling.getXP()).toBe(0);
    });
  });

  describe('addXP', () => {
    test('should increase XP when added', () => {
      leveling.addXP(500, wallet);
      expect(leveling.getXP()).toBe(500);
      expect(leveling.getLevel()).toBe(1);
    });

    test('should level up when XP threshold is reached', () => {
      // Threshold for Level 2 is 1000 XP
      const result = leveling.addXP(1000, wallet);
      
      expect(leveling.getLevel()).toBe(2);
      expect(leveling.getXP()).toBe(1000);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    test('should award coins to wallet on level up', () => {
      // Level 2 reward: level * 500 = 1000 coins
      leveling.addXP(1000, wallet);
      expect(wallet.getBalance()).toBe(1000);
    });

    test('should handle multiple level ups from a single XP gain', () => {
      // 3000 XP should reach Level 3 (0 -> 1000 -> 2000 -> 3000)
      const result = leveling.addXP(3500, wallet);
      
      expect(leveling.getLevel()).toBe(4); // 1000 (L2), 2000 (L3), 3000 (L4)
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(4);
      // Rewards: L2 (1000) + L3 (1500) + L4 (2000) = 4500
      expect(wallet.getBalance()).toBe(4500);
    });

    test('should throw error for invalid XP amount', () => {
      expect(() => leveling.addXP(-10, wallet)).toThrow('XP to add must be a positive number');
      expect(() => leveling.addXP('100', wallet)).toThrow('XP to add must be a positive number');
    });

    test('should throw error if wallet is missing', () => {
      expect(() => leveling.addXP(100, null)).toThrow('Valid Wallet instance is required for rewards');
    });
  });

  describe('Progress Calculation', () => {
    test('should return correct progress percentage to next level', () => {
      leveling.addXP(500, wallet);
      // Level 1: 0-1000. 500/1000 = 50%
      expect(leveling.getProgress()).toBe(50);
    });
  });
});
