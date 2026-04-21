const { generateRandomInt } = require('../src/utils/rng');

describe('RNG Utility Module', () => {
  describe('generateRandomInt', () => {
    test('should generate an integer within the specified range [min, max)', () => {
      const min = 0;
      const max = 10;
      for (let i = 0; i < 100; i++) {
        const result = generateRandomInt(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThan(max);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    test('should handle a single argument as max with min defaulting to 0', () => {
      const max = 5;
      const result = generateRandomInt(max);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(max);
    });

    test('should throw an error if min is greater than or equal to max', () => {
      expect(() => generateRandomInt(10, 5)).toThrow('min must be less than max');
      expect(() => generateRandomInt(5, 5)).toThrow('min must be less than max');
    });

    test('should throw an error for non-integer inputs', () => {
      expect(() => generateRandomInt(1.5, 5)).toThrow('Parameters must be integers');
      expect(() => generateRandomInt(0, 5.5)).toThrow('Parameters must be integers');
    });

    test('should throw an error for non-number inputs', () => {
      expect(() => generateRandomInt('0', 10)).toThrow('Parameters must be integers');
      expect(() => generateRandomInt(0, null)).toThrow('Parameters must be integers');
    });

    test('should throw an error if parameters are missing', () => {
      expect(() => generateRandomInt()).toThrow('Max parameter is required');
    });
  });
});
