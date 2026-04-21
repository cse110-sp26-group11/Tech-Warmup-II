/**
 * @module meta/dailyLogin
 * @description Retention system for tracking daily player logins and awarding bonuses.
 */

/**
 * @class DailyLogin
 * @description Tracks login streaks and handles reward distribution for players.
 */
class DailyLogin {
  /**
   * Initializes the DailyLogin system with a streak of 0 and no previous login date.
   */
  constructor() {
    this._streak = 0;
    this._lastLoginDate = null;
    this._REWARD_BASE = 100;
    this._MAX_STREAK_CAP = 7;
  }

  /**
   * Processes a player login.
   * Awards coins if it's a new day, increments streak if consecutive, resets if day missed.
   * 
   * @param {import('./wallet').Wallet} wallet - The player's Wallet instance to award coins to.
   * @param {Date} [currentDate=new Date()] - The date of the login attempt.
   * @returns {number} The reward amount awarded (0 if already claimed today).
   * @throws {Error} If wallet is invalid or currentDate is not a valid Date object.
   */
  processLogin(wallet, currentDate = new Date()) {
    if (!wallet || typeof wallet.addCoins !== 'function') {
      throw new Error('Valid Wallet instance is required');
    }
    if (!(currentDate instanceof Date) || isNaN(currentDate.getTime())) {
      throw new Error('Valid Date is required');
    }

    const today = this._stripTime(currentDate);

    // If it's the first login ever
    if (!this._lastLoginDate) {
      this._streak = 1;
      this._lastLoginDate = today;
      const reward = this._calculateReward(this._streak);
      wallet.addCoins(reward);
      return reward;
    }

    const lastLogin = this._stripTime(this._lastLoginDate);
    const diffDays = this._getDaysDifference(lastLogin, today);

    // Same day: no new reward
    if (diffDays === 0) {
      return 0;
    }

    // Consecutive day: increment streak
    if (diffDays === 1) {
      this._streak += 1;
    } else {
      // Missed day(s): reset streak
      this._streak = 1;
    }

    this._lastLoginDate = today;
    const reward = this._calculateReward(this._streak);
    wallet.addCoins(reward);
    return reward;
  }

  /**
   * Returns the current login streak.
   * @returns {number}
   */
  getStreak() {
    return this._streak;
  }

  /**
   * Calculates the reward based on the streak.
   * @private
   * @param {number} streak 
   * @returns {number}
   */
  _calculateReward(streak) {
    const cappedStreak = Math.min(streak, this._MAX_STREAK_CAP);
    return cappedStreak * this._REWARD_BASE;
  }

  /**
   * Sets time to 00:00:00 to compare calendar days only.
   * @private
   * @param {Date} date 
   * @returns {Date}
   */
  _stripTime(date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Gets difference in days between two dates.
   * @private
   * @param {Date} date1 
   * @param {Date} date2 
   * @returns {number}
   */
  _getDaysDifference(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
  }
}

module.exports = {
  DailyLogin,
};
