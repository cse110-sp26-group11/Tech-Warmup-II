/**
 * @file simulateRTP.js
 * @description Standalone script to simulate slot spins and calculate RTP and Hit Rate.
 */

const { SlotEngine } = require('../src/math/engine');

/**
 * Configuration designed for ~90% RTP.
 * Total combinations: 40 * 40 * 40 = 64,000
 */
const config = {
  reels: [
    [
      { symbol: 'Seven', weight: 1 },
      { symbol: 'Cherry', weight: 5 },
      { symbol: 'Lemon', weight: 10 },
      { symbol: 'Blank', weight: 24 }
    ],
    [
      { symbol: 'Seven', weight: 1 },
      { symbol: 'Cherry', weight: 5 },
      { symbol: 'Lemon', weight: 10 },
      { symbol: 'Blank', weight: 24 }
    ],
    [
      { symbol: 'Seven', weight: 1 },
      { symbol: 'Cherry', weight: 5 },
      { symbol: 'Lemon', weight: 10 },
      { symbol: 'Blank', weight: 24 }
    ]
  ],
  paytable: [
    { symbols: ['Seven', 'Seven', 'Seven'], payout: 500 }, // Prob: (1/40)^3 = 1/64000. Contrib: 500/64000 = 0.78%
    { symbols: ['Cherry', 'Cherry', 'Cherry'], payout: 250 }, // Prob: (5/40)^3 = 125/64000. Contrib: 31250/64000 = 48.8%
    { symbols: ['Lemon', 'Lemon', 'Lemon'], payout: 25 }     // Prob: (10/40)^3 = 1000/64000. Contrib: 25000/64000 = 39.0%
    // Total estimated RTP: 0.78 + 48.8 + 39.0 = 88.58%
  ]
};

const ITERATIONS = 100000;
const engine = new SlotEngine(config);

let totalPayout = 0;
let totalWins = 0;

console.log(`Starting simulation of ${ITERATIONS.toLocaleString()} spins...`);
console.time('Simulation Time');

for (let i = 0; i < ITERATIONS; i++) {
  const result = engine.spin();
  totalPayout += result.payout;
  if (result.payout > 0) {
    totalWins++;
  }
}

console.timeEnd('Simulation Time');

const rtp = (totalPayout / ITERATIONS) * 100;
const hitRate = (totalWins / ITERATIONS) * 100;

console.log('-----------------------------------');
console.log(`Results:`);
console.log(`Total Spins: ${ITERATIONS.toLocaleString()}`);
console.log(`Total Payout: ${totalPayout.toLocaleString()}`);
console.log(`Total Wins: ${totalWins.toLocaleString()}`);
console.log(`RTP (Return to Player): ${rtp.toFixed(2)}%`);
console.log(`Hit Rate: ${hitRate.toFixed(2)}%`);
console.log('-----------------------------------');

if (rtp >= 100) {
  console.error('CRITICAL ERROR: RTP is 100% or higher. House edge lost!');
  process.exit(1);
} else {
  console.log('Verification: House edge is active (RTP < 100%).');
}
