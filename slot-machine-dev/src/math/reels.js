/**
 * @module math/reels
 * @description Core reel mechanics for the Social Casino Slot Machine.
 */

const { generateRandomInt } = require('../utils/rng');

/**
 * @typedef {Object} SymbolWeight
 * @property {string} symbol - The name or identifier of the symbol (e.g., 'Cherry').
 * @property {number} weight - The weight determining the probability of this symbol appearing.
 */

/**
 * Performs a single reel spin and selects a symbol based on weighted probability.
 * 
 * This uses a cumulative weight algorithm:
 * 1. Sum all weights.
 * 2. Generate a random integer 'r' in the range [0, totalWeight).
 * 3. Iterate through symbols, adding weights until the sum exceeds 'r'.
 * 
 * @param {SymbolWeight[]} symbols - Array of symbol objects with their respective weights.
 * @returns {string} The symbol selected by the spin.
 * @throws {Error} If symbols array is empty or weights are invalid (non-integers or negative).
 * 
 * @example
 * const symbols = [
 *   { symbol: 'Wild', weight: 1 },
 *   { symbol: 'Cherry', weight: 10 }
 * ];
 * const result = spinReel(symbols); // returns 'Wild' ~9% of the time, 'Cherry' ~91%
 */
function spinReel(symbols) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error('Symbols array cannot be empty');
  }

  let totalWeight = 0;
  for (const item of symbols) {
    if (!Number.isInteger(item.weight) || item.weight <= 0) {
      throw new Error('Weights must be positive integers');
    }
    totalWeight += item.weight;
  }

  // Use our CSPRNG utility to get a value in [0, totalWeight)
  const randomValue = generateRandomInt(totalWeight);

  let cumulativeWeight = 0;
  for (const item of symbols) {
    cumulativeWeight += item.weight;
    if (randomValue < cumulativeWeight) {
      return item.symbol;
    }
  }

  // Fallback for safety (should not be reached due to logic above)
  return symbols[symbols.length - 1].symbol;
}

module.exports = {
  spinReel,
};
