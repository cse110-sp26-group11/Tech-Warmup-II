/**
 * @module meta/rescue
 * @description Meta-system to provide free coins to players who run out of balance.
 */

/**
 * @class BankruptcyRescue
 * @description Checks eligibility and grants rescue bonuses for players with low balances.
 */
class BankruptcyRescue {
  /**
   * Initializes the rescue system constants.
   */
  constructor() {
    this._MIN_REQUIRED_BET = 10;
    this._RESCUE_BONUS = 500;
  }

  /**
   * Checks if a player is eligible for a rescue bonus.
   * @param {import('./wallet').Wallet} wallet - The player's Wallet.
   * @returns {boolean} True if balance is below the minimum bet.
   * @throws {Error} If wallet is invalid.
   */
  isEligible(wallet) {
    if (!wallet || typeof wallet.getBalance !== 'function') {
      throw new Error('Valid Wallet instance is required');
    }
    return wallet.getBalance() < this._MIN_REQUIRED_BET;
  }

  /**
   * Awards the rescue bonus to the player's wallet if they are eligible.
   * @param {import('./wallet').Wallet} wallet - The player's Wallet.
   * @returns {number} The amount awarded.
   * @throws {Error} If the player is not eligible for the bonus.
   */
  claimBonus(wallet) {
    if (!this.isEligible(wallet)) {
      throw new Error(`Balance must be below ${this._MIN_REQUIRED_BET} coins to claim rescue funds`);
    }

    wallet.addCoins(this._RESCUE_BONUS);
    return this._RESCUE_BONUS;
  }
}

module.exports = {
  BankruptcyRescue,
};
