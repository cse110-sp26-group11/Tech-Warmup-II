const { Wallet } = require('../src/meta/wallet');

describe('Wallet Module', () => {
  let wallet;

  beforeEach(() => {
    wallet = new Wallet(500);
  });

  describe('Initialization', () => {
    test('should initialize with a starting balance', () => {
      expect(wallet.getBalance()).toBe(500);
    });

    test('should default to 0 balance if none provided', () => {
      const defaultWallet = new Wallet();
      expect(defaultWallet.getBalance()).toBe(0);
    });

    test('should throw error for negative initial balance', () => {
      expect(() => new Wallet(-100)).toThrow('Initial balance cannot be negative');
    });
  });

  describe('addCoins', () => {
    test('should increase balance by specified amount', () => {
      wallet.addCoins(250);
      expect(wallet.getBalance()).toBe(750);
    });

    test('should throw error for non-positive or invalid amounts', () => {
      expect(() => wallet.addCoins(-10)).toThrow('Amount to add must be a positive number');
      expect(() => wallet.addCoins('100')).toThrow('Amount to add must be a positive number');
    });
  });

  describe('deductCoins', () => {
    test('should decrease balance by specified amount', () => {
      wallet.deductCoins(100);
      expect(wallet.getBalance()).toBe(400);
    });

    test('should throw error if balance is insufficient', () => {
      expect(() => wallet.deductCoins(1000)).toThrow('Insufficient balance');
    });

    test('should throw error for non-positive or invalid amounts', () => {
      expect(() => wallet.deductCoins(-10)).toThrow('Amount to deduct must be a positive number');
      expect(() => wallet.deductCoins(null)).toThrow('Amount to deduct must be a positive number');
    });
  });
});
