const { DailyLogin } = require('../src/meta/dailyLogin');
const { Wallet } = require('../src/meta/wallet');

describe('DailyLogin Module', () => {
  let wallet;
  let dailyLogin;

  beforeEach(() => {
    wallet = new Wallet(0);
    dailyLogin = new DailyLogin();
  });

  describe('Login Logic', () => {
    test('should award 100 coins on the first login (Day 1)', () => {
      const today = new Date('2026-04-21T12:00:00Z');
      const reward = dailyLogin.processLogin(wallet, today);
      
      expect(reward).toBe(100);
      expect(wallet.getBalance()).toBe(100);
      expect(dailyLogin.getStreak()).toBe(1);
    });

    test('should scale rewards for consecutive logins (Day 2)', () => {
      const day1 = new Date('2026-04-21T12:00:00Z');
      const day2 = new Date('2026-04-22T12:00:00Z');
      
      dailyLogin.processLogin(wallet, day1);
      const reward = dailyLogin.processLogin(wallet, day2);
      
      expect(reward).toBe(200);
      expect(wallet.getBalance()).toBe(300); // 100 + 200
      expect(dailyLogin.getStreak()).toBe(2);
    });

    test('should cap rewards at Day 7', () => {
      let lastReward = 0;
      for (let i = 0; i < 10; i++) {
        const date = new Date(new Date('2026-04-21T12:00:00Z').getTime() + i * 24 * 60 * 60 * 1000);
        lastReward = dailyLogin.processLogin(wallet, date);
      }
      
      expect(dailyLogin.getStreak()).toBe(10);
      expect(lastReward).toBe(700); // Caps at 700 coins (100 * 7)
    });

    test('should reset streak if a day is missed', () => {
      const day1 = new Date('2026-04-21T12:00:00Z');
      const day3 = new Date('2026-04-23T12:00:00Z'); // Missed the 22nd
      
      dailyLogin.processLogin(wallet, day1);
      const reward = dailyLogin.processLogin(wallet, day3);
      
      expect(reward).toBe(100); // Reset to Day 1 reward
      expect(dailyLogin.getStreak()).toBe(1);
    });

    test('should not award reward if logged in twice on the same day', () => {
      const day1 = new Date('2026-04-21T12:00:00Z');
      const day1Later = new Date('2026-04-21T18:00:00Z');
      
      dailyLogin.processLogin(wallet, day1);
      const reward = dailyLogin.processLogin(wallet, day1Later);
      
      expect(reward).toBe(0);
      expect(wallet.getBalance()).toBe(100);
      expect(dailyLogin.getStreak()).toBe(1);
    });

    test('should throw error if wallet is missing', () => {
      expect(() => dailyLogin.processLogin(null, new Date()))
        .toThrow('Valid Wallet instance is required');
    });

    test('should throw error for invalid date input', () => {
      expect(() => dailyLogin.processLogin(wallet, 'not-a-date')).toThrow('Valid Date is required');
    });
  });
});
