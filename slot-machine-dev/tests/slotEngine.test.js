/**
 * @file slotEngine.test.js
 * @description Unit tests for SlotEngine.evaluate() logic.
 */

const { SlotEngine } = require('./gameLogic');

describe('SlotEngine.evaluate()', () => {
    const testConfig = {
        paytable: [
            { symbols: ['7️⃣', '7️⃣', '7️⃣'], payout: 50 },
            { symbols: ['💎', '💎', '💎'], payout: 100 },
            { symbols: ['🍒', '🍒', '🍒'], payout: 10 },
            { symbols: ['🍋', '🍋', '🍋'], payout: 5 }
        ]
    };
    const engine = new SlotEngine(testConfig);

    it('returns correct payout for exact match [🍒, 🍒, 🍒]', () => {
        expect(engine.evaluate(['🍒', '🍒', '🍒'])).toBe(10);
    });

    it('returns correct payout for exact match [7️⃣, 7️⃣, 7️⃣]', () => {
        expect(engine.evaluate(['7️⃣', '7️⃣', '7️⃣'])).toBe(50);
    });

    it('returns correct payout for exact match [💎, 💎, 💎]', () => {
        expect(engine.evaluate(['💎', '💎', '💎'])).toBe(100);
    });

    it('returns correct payout for exact match [🍋, 🍋, 🍋]', () => {
        expect(engine.evaluate(['🍋', '🍋', '🍋'])).toBe(5);
    });

    it('returns 0 for [🍒, 🍒, 🍋] (two match, third different)', () => {
        expect(engine.evaluate(['🍒', '🍒', '🍋'])).toBe(0);
    });

    it('returns 0 for [🍒, 🍋, 💎] (all different)', () => {
        expect(engine.evaluate(['🍒', '🍋', '💎'])).toBe(0);
    });

    it('returns 0 for [⚪, ⚪, 🍒] (partial match)', () => {
        expect(engine.evaluate(['⚪', '⚪', '🍒'])).toBe(0);
    });

    it('returns 0 for [💎, 🍋, 🍋] (first different)', () => {
        expect(engine.evaluate(['💎', '🍋', '🍋'])).toBe(0);
    });
});
