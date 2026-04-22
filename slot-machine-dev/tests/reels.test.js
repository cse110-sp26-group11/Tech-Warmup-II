const { spinReel } = require('../src/math/reels');

describe('Reel Mechanics Module', () => {
  const mockSymbols = [
    { symbol: 'Cherry', weight: 10 },
    { symbol: 'Lemon', weight: 20 },
    { symbol: 'Seven', weight: 5 },
    { symbol: 'Diamond', weight: 1 }
  ];

  describe('spinReel', () => {
    test('should return a valid symbol from the input array', () => {
      const result = spinReel(mockSymbols);
      const symbolNames = mockSymbols.map(s => s.symbol);
      expect(symbolNames).toContain(result);
    });

    test('should throw an error if the symbols array is empty', () => {
      expect(() => spinReel([])).toThrow('Symbols array cannot be empty');
    });

    test('should throw an error if weights are invalid', () => {
      const invalidSymbols = [
        { symbol: 'Bad', weight: -1 }
      ];
      expect(() => spinReel(invalidSymbols)).toThrow('Weights must be positive integers');
    });

    test('should throw an error if weight is not a number', () => {
      const invalidSymbols = [
        { symbol: 'Bad', weight: '10' }
      ];
      expect(() => spinReel(invalidSymbols)).toThrow('Weights must be positive integers');
    });

    test('should follow a weighted distribution (statistical check)', () => {
      const iterations = 10000;
      const results = {};
      
      // Initialize results map
      mockSymbols.forEach(s => { results[s.symbol] = 0; });

      // Run simulations
      for (let i = 0; i < iterations; i++) {
        const symbol = spinReel(mockSymbols);
        results[symbol]++;
      }

      const totalWeight = mockSymbols.reduce((sum, s) => sum + s.weight, 0);

      // Check distribution within a margin of error (e.g., +/- 5%)
      mockSymbols.forEach(s => {
        const expectedProbability = s.weight / totalWeight;
        const actualProbability = results[s.symbol] / iterations;
        
        // Using a 2% tolerance for a large number of iterations
        expect(actualProbability).toBeGreaterThan(expectedProbability - 0.05);
        expect(actualProbability).toBeLessThan(expectedProbability + 0.05);
      });
    });
  });
});
