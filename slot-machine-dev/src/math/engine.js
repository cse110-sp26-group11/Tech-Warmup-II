/**
 * @module math/engine
 * @description Core game engine for the Social Casino Slot Machine.
 */

const { spinReel } = require('./reels');

/**
 * @typedef {Object} PaytableEntry
 * @property {string[]} symbols - Array of symbols that form a winning combination.
 * @property {number} payout - The multiplier or reward for this combination.
 */

/**
 * @typedef {Object} SlotConfig
 * @property {import('./reels').SymbolWeight[][]} reels - Configuration for each reel.
 * @property {PaytableEntry[]} paytable - Winning combinations and their payouts.
 */

/**
 * @class SlotEngine
 * @description Manages the slot machine logic, including spinning reels and evaluating wins.
 */
class SlotEngine {
  /**
   * @param {SlotConfig} config - The engine configuration including reels and paytable.
   * @throws {Error} If configuration is invalid or missing.
   */
  constructor(config) {
    this._validateConfig(config);
    this.reels = config.reels;
    this.paytable = config.paytable;
  }

  /**
   * Validates the configuration object.
   * @private
   * @param {SlotConfig} config 
   */
  _validateConfig(config) {
    if (!config || !config.reels || !config.paytable) {
      throw new Error('Invalid configuration: reels and paytable are required');
    }
    if (config.reels.length === 0 || config.paytable.length === 0) {
      throw new Error('Invalid configuration: reels and paytable cannot be empty');
    }
  }

  /**
   * Executes a single spin of the slot machine.
   * @returns {{ symbols: string[], payout: number }} The result of the spin.
   */
  spin() {
    const symbols = this.reels.map(reel => spinReel(reel));
    const payout = this.evaluate(symbols);
    return { symbols, payout };
  }

  /**
   * Evaluates a set of symbols against the paytable.
   * @param {string[]} symbols - The symbols generated from a spin.
   * @returns {number} The resulting payout (0 if no win).
   */
  evaluate(symbols) {
    for (const entry of this.paytable) {
      if (this._isMatch(symbols, entry.symbols)) {
        return entry.payout;
      }
    }
    return 0;
  }

  /**
   * Checks if the spin symbols match a paytable entry.
   * @private
   * @param {string[]} spinSymbols 
   * @param {string[]} targetSymbols 
   * @returns {boolean}
   */
  _isMatch(spinSymbols, targetSymbols) {
    if (spinSymbols.length !== targetSymbols.length) {
      return false;
    }
    return spinSymbols.every((s, i) => s === targetSymbols[i]);
  }
}

module.exports = {
  SlotEngine,
};
