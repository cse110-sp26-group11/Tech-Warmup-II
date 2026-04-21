/**
 * @module controllers/gameController
 * @description Orchestrator for the Slot Machine game systems.
 */

/**
 * @class GameController
 * @description Coordinates the SlotEngine, Wallet, and Leveling systems.
 */
class GameController {
  /**
   * @param {import('../math/engine').SlotEngine} engine - The slot math engine.
   * @param {import('../meta/wallet').Wallet} wallet - The player's currency wallet.
   * @param {import('../meta/leveling').Leveling} leveling - The player's leveling system.
   */
  constructor(engine, wallet, leveling) {
    this.engine = engine;
    this.wallet = wallet;
    this.leveling = leveling;
  }

  /**
   * Executes a full game round (spin).
   * 
   * @param {number} betAmount - The amount of coins to wager.
   * @returns {Object} The consolidated result of the spin.
   * @throws {Error} If balance is insufficient or bet amount is invalid.
   * 
   * @example
   * const result = controller.playSpin(10);
   * console.log(result.newBalance);
   */
  playSpin(betAmount) {
    if (typeof betAmount !== 'number' || betAmount <= 0) {
      throw new Error('Bet amount must be a positive number');
    }

    // 1. Deduct Bet
    this.wallet.deductCoins(betAmount);

    // 2. Execute Spin
    const spinResult = this.engine.spin();
    const winAmount = spinResult.payout * betAmount;

    // 3. Add Winnings
    if (winAmount > 0) {
      this.wallet.addCoins(winAmount);
    }

    // 4. Award XP (based on bet amount)
    const levelResult = this.leveling.addXP(betAmount, this.wallet);

    // 5. Return Consolidated Result
    return {
      spinResult: {
        symbols: spinResult.symbols,
        payoutMultiplier: spinResult.payout,
        winAmount,
      },
      newBalance: this.wallet.getBalance(),
      levelInfo: {
        currentLevel: this.leveling.getLevel(),
        currentXP: this.leveling.getXP(),
        leveledUp: levelResult.leveledUp,
        progress: this.leveling.getProgress(),
      },
    };
  }
}

module.exports = {
  GameController,
};
