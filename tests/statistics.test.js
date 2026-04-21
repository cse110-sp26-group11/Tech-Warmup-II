const { StatisticsTracker } = require('../src/meta/statistics');

describe('StatisticsTracker Module', () => {
  let tracker;

  beforeEach(() => {
    tracker = new StatisticsTracker();
  });

  describe('Initialization', () => {
    test('should initialize with zeroed stats', () => {
      const stats = tracker.getStats();
      expect(stats.totalSpins).toBe(0);
      expect(stats.biggestWin).toBe(0);
      expect(stats.totalCoinsWon).toBe(0);
    });
  });

  describe('updateStats', () => {
    test('should increment total spins on every update', () => {
      tracker.updateStats({ winAmount: 0 });
      tracker.updateStats({ winAmount: 100 });
      expect(tracker.getStats().totalSpins).toBe(2);
    });

    test('should accumulate total coins won', () => {
      tracker.updateStats({ winAmount: 100 });
      tracker.updateStats({ winAmount: 50 });
      expect(tracker.getStats().totalCoinsWon).toBe(150);
    });

    test('should track the biggest single win', () => {
      tracker.updateStats({ winAmount: 100 });
      tracker.updateStats({ winAmount: 500 });
      tracker.updateStats({ winAmount: 200 });
      expect(tracker.getStats().biggestWin).toBe(500);
    });

    test('should not update biggestWin if the win is smaller than current record', () => {
      tracker.updateStats({ winAmount: 1000 });
      tracker.updateStats({ winAmount: 50 });
      expect(tracker.getStats().biggestWin).toBe(1000);
    });

    test('should handle zero wins correctly', () => {
      tracker.updateStats({ winAmount: 0 });
      const stats = tracker.getStats();
      expect(stats.totalSpins).toBe(1);
      expect(stats.totalCoinsWon).toBe(0);
      expect(stats.biggestWin).toBe(0);
    });

    test('should throw error for invalid spin result', () => {
      expect(() => tracker.updateStats(null)).toThrow('Invalid spin result');
      expect(() => tracker.updateStats({})).toThrow('winAmount must be a number');
    });
  });
});
