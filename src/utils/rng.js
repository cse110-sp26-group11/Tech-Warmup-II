/**
 * @module utils/rng
 * @description Cryptographically Secure Random Number Generator utility for the Slot Machine Math Engine.
 */

const crypto = require('crypto');

/**
 * Generates a cryptographically secure random integer between min (inclusive) and max (exclusive).
 * 
 * @param {number} minOrMax - The minimum value (inclusive) if two arguments are provided, otherwise the maximum value (exclusive).
 * @param {number} [maxVal] - The maximum value (exclusive) if two arguments are provided.
 * @returns {number} A cryptographically secure random integer.
 * @throws {Error} Throws an error if parameters are missing, not integers, or if min is not less than max.
 * 
 * @example
 * // Returns a random integer between 0 and 9
 * const val = generateRandomInt(10);
 * 
 * @example
 * // Returns a random integer between 5 and 14
 * const val = generateRandomInt(5, 15);
 */
function generateRandomInt(minOrMax, maxVal) {
  let min;
  let max;

  // Handle parameter overloading
  if (maxVal === undefined) {
    min = 0;
    max = minOrMax;
  } else {
    min = minOrMax;
    max = maxVal;
  }

  // Validate presence
  if (max === undefined) {
    throw new Error('Max parameter is required');
  }

  // Validate types (must be integers)
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error('Parameters must be integers');
  }

  // Validate range logic
  if (min >= max) {
    throw new Error('min must be less than max');
  }

  /**
   * Node.js crypto.randomInt(min, max)
   * The range is [min, max), meaning min is inclusive and max is exclusive.
   */
  return crypto.randomInt(min, max);
}

module.exports = {
  generateRandomInt,
};
