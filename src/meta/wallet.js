/**
 * @module meta/wallet
 * @description In-game economy wallet for managing virtual currency.
 */

/**
 * @class Wallet
 * @description Manages a player's virtual currency balance (coins/credits).
 */
class Wallet {
  /**
   * @param {number} [initialBalance=0] - Starting balance in coins.
   * @throws {Error} If initialBalance is negative or not a number.
   */
  constructor(initialBalance = 0) {
    if (typeof initialBalance !== 'number' || initialBalance < 0) {
      throw new Error('Initial balance cannot be negative');
    }
    this._balance = initialBalance;
  }

  /**
   * Retrieves the current balance.
   * @returns {number} The current balance in coins.
   */
  getBalance() {
    return this._balance;
  }

  /**
   * Adds coins to the wallet.
   * @param {number} amount - The number of coins to add.
   * @throws {Error} If amount is not a positive number.
   */
  addCoins(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount to add must be a positive number');
    }
    this._balance += amount;
  }

  /**
   * Deducts coins from the wallet.
   * @param {number} amount - The number of coins to deduct.
   * @throws {Error} If amount is not a positive number or if balance is insufficient.
   */
  deductCoins(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount to deduct must be a positive number');
    }
    if (this._balance < amount) {
      throw new Error('Insufficient balance');
    }
    this._balance -= amount;
  }
}

module.exports = {
  Wallet,
};
