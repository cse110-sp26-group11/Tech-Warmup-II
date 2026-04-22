/**
 * @file wallet.test.js
 * @description Unit tests for Wallet class.
 */

const { Wallet } = require('./gameLogic');

describe('Wallet', () => {
    it('getBalance() returns initial balance of 1000 on construction', () => {
        const wallet = new Wallet(1000);
        expect(wallet.getBalance()).toBe(1000);
    });

    it('addCoins(500) increases balance by 500', () => {
        const wallet = new Wallet(1000);
        wallet.addCoins(500);
        expect(wallet.getBalance()).toBe(1500);
    });

    it('deductCoins(200) decreases balance by 200', () => {
        const wallet = new Wallet(1000);
        wallet.deductCoins(200);
        expect(wallet.getBalance()).toBe(800);
    });

    it('deductCoins() throws Error("Insufficient balance") when amount > balance', () => {
        const wallet = new Wallet(100);
        expect(() => wallet.deductCoins(200)).toThrow('Insufficient balance');
    });

    it('addCoins(0) does not change balance', () => {
        const wallet = new Wallet(1000);
        wallet.addCoins(0);
        expect(wallet.getBalance()).toBe(1000);
    });

    it('Multiple operations chain correctly', () => {
        const wallet = new Wallet(1000);
        wallet.deductCoins(200);
        wallet.addCoins(100);
        expect(wallet.getBalance()).toBe(900);
    });
});
