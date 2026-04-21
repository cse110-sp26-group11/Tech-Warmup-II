/**
 * @module meta/leveling
 * @description Player progression system for tracking XP and levels.
 */

/**
 * @class Leveling
 * @description Manages player Experience Points (XP), Levels, and level-up rewards.
 */
class Leveling {
  /**
   * Initializes the leveling system at Level 1 with 0 XP.
   */
  constructor() {
    this._level = 1;
    this._xp = 0;
    this._XP_PER_LEVEL = 1000;
    this._REWARD_PER_LEVEL = 500;
  }

  /**
   * Retrieves the current level.
   * @returns {number}
   */
  getLevel() {
    return this._level;
  }

  /**
   * Retrieves the current total XP.
   * @returns {number}
   */
  getXP() {
    return this._xp;
  }

  /**
   * Adds XP to the player's total and checks for level-ups.
   * 
   * @param {number} amount - The amount of XP to add.
   * @param {import('./wallet').Wallet} wallet - The player's Wallet to receive level-up rewards.
   * @returns {{ leveledUp: boolean, newLevel: number }} Result of the XP gain.
   * @throws {Error} If amount is invalid or wallet is missing.
   */
  addXP(amount, wallet) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('XP to add must be a positive number');
    }
    if (!wallet || typeof wallet.addCoins !== 'function') {
      throw new Error('Valid Wallet instance is required for rewards');
    }

    this._xp += amount;
    const initialLevel = this._level;
    const newLevel = Math.floor(this._xp / this._XP_PER_LEVEL) + 1;
    let leveledUp = false;

    if (newLevel > initialLevel) {
      leveledUp = true;
      this._level = newLevel;

      /**
       * Calculate total rewards for all levels gained.
       * Sum of arithmetic progression: (L_initial + 1) + ... + L_new
       * Reward = REWARD_PER_LEVEL * [Sum(L_new) - Sum(L_initial)]
       * where Sum(n) = n * (n + 1) / 2
       */
      const sumInitial = (initialLevel * (initialLevel + 1)) / 2;
      const sumNew = (newLevel * (newLevel + 1)) / 2;
      const totalReward = (sumNew - sumInitial) * this._REWARD_PER_LEVEL;

      wallet.addCoins(totalReward);
    }

    return {
      leveledUp,
      newLevel: this._level,
    };
  }

  /**
   * Calculates the percentage progress to the next level.
   * @returns {number} Percentage (0-100).
   */
  getProgress() {
    const currentLevelThreshold = (this._level - 1) * this._XP_PER_LEVEL;
    const nextLevelThreshold = this._level * this._XP_PER_LEVEL;
    
    const xpInCurrentLevel = this._xp - currentLevelThreshold;
    const totalXPRequiredForLevel = nextLevelThreshold - currentLevelThreshold;
    
    return Math.min(Math.floor((xpInCurrentLevel / totalXPRequiredForLevel) * 100), 99);
  }
}

module.exports = {
  Leveling,
};
