/**
 * @module meta/statistics
 * @description System for tracking player gameplay statistics and achievements.
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} totalSpins - Total number of spins executed.
 * @property {number} biggestWin - The largest single win amount achieved.
 * @property {number} totalCoinsWon - The cumulative total of all coins won.
 */

/**
 * @class StatisticsTracker
 * @description Tracks and persists player session metrics for bragging rights and progression.
 */
class StatisticsTracker {
  /**
   * Initializes the tracker with zeroed statistics.
   */
  constructor() {
    this._totalSpins = 0;
    this._biggestWin = 0;
    this._totalCoinsWon = 0;
  }

  /**
   * Updates statistics based on a spin result.
   * 
   * @param {Object} spinResult - The result object from a game spin.
   * @param {number} spinResult.winAmount - The amount of coins won in the spin.
   * @throws {Error} If spinResult is invalid.
   */
  updateStats(spinResult) {
    if (!spinResult) {
      throw new Error('Invalid spin result');
    }
    if (typeof spinResult.winAmount !== 'number') {
      throw new Error('winAmount must be a number');
    }

    this._totalSpins++;
    const win = spinResult.winAmount;
    this._totalCoinsWon += win;

    if (win > this._biggestWin) {
      this._biggestWin = win;
    }
  }

  /**
   * Retrieves the current player statistics.
   * @returns {PlayerStats}
   */
  getStats() {
    return {
      totalSpins: this._totalSpins,
      biggestWin: this._biggestWin,
      totalCoinsWon: this._totalCoinsWon,
    };
  }
}

module.exports = {
  StatisticsTracker,
};
