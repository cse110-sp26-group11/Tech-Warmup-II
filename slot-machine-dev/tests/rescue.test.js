const { BankruptcyRescue } = require('../src/meta/rescue');
const { Wallet } = require('../src/meta/wallet');

describe('BankruptcyRescue Module', () => {
  let wallet;
  let rescue;

  beforeEach(() => {
    wallet = new Wallet(100);
    rescue = new BankruptcyRescue();
  });

  describe('claimBonus', () => {
    test('should award 500 coins if balance is below 10', () => {
      wallet.deductCoins(95); // Balance = 5
      const result = rescue.claimBonus(wallet);
      
      expect(result).toBe(500);
      expect(wallet.getBalance()).toBe(505);
    });

    test('should throw an error if balance is 10 or higher', () => {
      wallet.deductCoins(90); // Balance = 10
      expect(() => rescue.claimBonus(wallet))
        .toThrow('Balance must be below 10 coins to claim rescue funds');
      expect(wallet.getBalance()).toBe(10);
    });

    test('should throw error for invalid wallet', () => {
      expect(() => rescue.claimBonus(null)).toThrow('Valid Wallet instance is required');
    });
  });

  describe('isEligible', () => {
    test('should return true if balance < 10', () => {
      wallet.deductCoins(91); // Balance = 9
      expect(rescue.isEligible(wallet)).toBe(true);
    });

    test('should return false if balance >= 10', () => {
      expect(rescue.isEligible(wallet)).toBe(false);
    });
  });
});
