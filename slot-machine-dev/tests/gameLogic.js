/**
 * @file gameLogic.js
 * @description Extracted game logic for unit testing purposes.
 */

class Wallet {
    /** @param {number} initialBalance */
    constructor(initialBalance = 1000) {
        this._balance = initialBalance;
    }
    /** @returns {number} */
    getBalance() { return this._balance; }
    /** @param {number} amount */
    setBalance(amount) { this._balance = amount; }
    /** @param {number} amount */
    addCoins(amount) { this._balance += amount; }
    /** @param {number} amount */
    deductCoins(amount) {
        if (this._balance < amount) throw new Error('Insufficient balance');
        this._balance -= amount;
    }
}

class SlotEngine {
    /** @param {Object} config */
    constructor(config) {
        this.reels = config.reels;
        this.paytable = config.paytable;
    }
    /**
     * Evaluates the spin result for wins.
     * @param {string[]} symbols 
     * @returns {number} Payout multiplier.
     */
    evaluate(symbols) {
        // Exact 3-symbol match check: symbols[0] === symbols[1] === symbols[2]
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            const matchSymbol = symbols[0];
            const entry = this.paytable.find(e => e.symbols[0] === matchSymbol);
            return entry ? entry.payout : 0;
        }
        return 0;
    }
}

module.exports = { Wallet, SlotEngine };
