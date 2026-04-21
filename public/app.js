/**
 * @file app.js
 * @description Foundational frontend logic for the Social Casino Slot Machine.
 */

// --- Backend Simulation for Browser (since we are not using a bundler yet) ---
// These mirror the logic from src/ to allow the frontend to run independently.

class Wallet {
    constructor(initialBalance = 1000) {
        this._balance = initialBalance;
    }
    getBalance() { return this._balance; }
    addCoins(amount) { this._balance += amount; }
    deductCoins(amount) {
        if (this._balance < amount) throw new Error('Insufficient balance');
        this._balance -= amount;
    }
}

class Leveling {
    constructor() {
        this._level = 1;
        this._xp = 0;
        this._XP_PER_LEVEL = 1000;
    }
    getLevel() { return this._level; }
    getXP() { return this._xp; }
    addXP(amount, wallet) {
        this._xp += amount;
        let leveledUp = false;
        while (this._xp >= this._level * this._XP_PER_LEVEL) {
            this._level++;
            leveledUp = true;
            wallet.addCoins(this._level * 500);
        }
        return { leveledUp, newLevel: this._level };
    }
    getProgress() {
        const threshold = this._level * this._XP_PER_LEVEL;
        const prevThreshold = (this._level - 1) * this._XP_PER_LEVEL;
        return Math.floor(((this._xp - prevThreshold) / (threshold - prevThreshold)) * 100);
    }
}

class SlotEngine {
    constructor(config) {
        this.reels = config.reels;
        this.paytable = config.paytable;
    }
    spin() {
        const symbols = this.reels.map(reel => {
            const totalWeight = reel.reduce((sum, s) => sum + s.weight, 0);
            let r = Math.floor(Math.random() * totalWeight);
            for (const s of reel) {
                r -= s.weight;
                if (r < 0) return s.symbol;
            }
            return reel[reel.length - 1].symbol;
        });
        const payout = this.evaluate(symbols);
        return { symbols, payout };
    }
    evaluate(symbols) {
        for (const entry of this.paytable) {
            if (symbols.every((s, i) => s === entry.symbols[i])) return entry.payout;
        }
        return 0;
    }
}

class GameController {
    constructor(engine, wallet, leveling) {
        this.engine = engine;
        this.wallet = wallet;
        this.leveling = leveling;
    }
    playSpin(betAmount) {
        this.wallet.deductCoins(betAmount);
        const spinResult = this.engine.spin();
        const winAmount = spinResult.payout * betAmount;
        if (winAmount > 0) this.wallet.addCoins(winAmount);
        const levelResult = this.leveling.addXP(betAmount, this.wallet);
        return {
            symbols: spinResult.symbols,
            winAmount,
            newBalance: this.wallet.getBalance(),
            level: this.leveling.getLevel(),
            leveledUp: levelResult.leveledUp
        };
    }
}

// --- App Initialization ---

const config = {
    reels: [
        [{ symbol: '🍒', weight: 5 }, { symbol: '🍋', weight: 10 }, { symbol: '7️⃣', weight: 1 }, { symbol: '💎', weight: 1 }, { symbol: '⚪', weight: 23 }],
        [{ symbol: '🍒', weight: 5 }, { symbol: '🍋', weight: 10 }, { symbol: '7️⃣', weight: 1 }, { symbol: '💎', weight: 1 }, { symbol: '⚪', weight: 23 }],
        [{ symbol: '🍒', weight: 5 }, { symbol: '🍋', weight: 10 }, { symbol: '7️⃣', weight: 1 }, { symbol: '💎', weight: 1 }, { symbol: '⚪', weight: 23 }]
    ],
    paytable: [
        { symbols: ['7️⃣', '7️⃣', '7️⃣'], payout: 50 },
        { symbols: ['💎', '💎', '💎'], payout: 100 },
        { symbols: ['🍒', '🍒', '🍒'], payout: 10 },
        { symbols: ['🍋', '🍋', '🍋'], payout: 5 }
    ]
};

const engine = new SlotEngine(config);
const wallet = new Wallet(1000);
const leveling = new Leveling();
const gameController = new GameController(engine, wallet, leveling);

// --- DOM Elements ---
const levelEl = document.getElementById('current-level');
const balanceEl = document.getElementById('current-balance');
const spinBtn = document.getElementById('spin-button');
const betInput = document.getElementById('bet-amount');
const messageEl = document.getElementById('message-display');
const celebrationOverlay = document.getElementById('celebration-overlay');
const confettiCanvas = document.getElementById('confetti-canvas');
const reels = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2')
];

// --- Visual Effects Logic ---

/**
 * Triggers a lightweight confetti celebration effect.
 * @description Creates particles on a canvas that fall and fade.
 */
function triggerCelebration() {
    celebrationOverlay.classList.remove('hidden');
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FFD700', '#D32F2F', '#FFFFFF', '#1976D2'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 3 + 2,
            angle: Math.random() * 360
        });
    }

    function animate() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        let active = false;

        particles.forEach(p => {
            p.y += p.speed;
            p.angle += 1;
            if (p.y < confettiCanvas.height) {
                active = true;
                ctx.fillStyle = p.color;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle * Math.PI / 180);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
        });

        if (active) {
            requestAnimationFrame(animate);
        } else {
            celebrationOverlay.classList.add('hidden');
        }
    }

    // Audio Placeholder: Trigger Big Win Sound
    // document.getElementById('sound-big-win')?.play();

    animate();
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        celebrationOverlay.classList.add('hidden');
    }, 3000);
}

/**
 * Updates the UI with the latest game state.
 * @param {Object} state 
 */
function updateUI(state) {
    balanceEl.textContent = state.newBalance;
    levelEl.textContent = state.level;
    
    state.symbols.forEach((symbol, i) => {
        reels[i].textContent = symbol;
    });

    if (state.winAmount > 0) {
        messageEl.textContent = `WIN: ${state.winAmount} COINS!`;
        messageEl.style.color = 'var(--color-gold)';
        
        // Trigger celebration for any win
        triggerCelebration();

        // Audio Placeholder: Trigger Win Sound
        // document.getElementById('sound-win')?.play();
    } else {
        messageEl.textContent = 'Try Again!';
        messageEl.style.color = 'var(--color-white)';
    }

    if (state.leveledUp) {
        messageEl.textContent += ` LEVEL UP! Reached Level ${state.level}!`;
    }
}

// --- Event Listeners ---

spinBtn.addEventListener('click', () => {
    const bet = parseInt(betInput.value);
    
    try {
        // Validation check before starting animation
        if (wallet.getBalance() < bet) throw new Error('Insufficient balance');

        // Disable button and start animation
        spinBtn.disabled = true;
        messageEl.textContent = 'Spinning...';
        
        // Audio Placeholder: Trigger Spin Sound
        // document.getElementById('sound-spin')?.play();

        reels.forEach(reel => reel.classList.add('spinning'));

        // Delay the result reveal to match the animation (1.5 seconds)
        setTimeout(() => {
            const result = gameController.playSpin(bet);
            
            // Stop animation
            reels.forEach(reel => reel.classList.remove('spinning'));
            
            updateUI(result);
            spinBtn.disabled = false;
        }, 1500);

    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.style.color = 'var(--color-red)';
        spinBtn.disabled = false;
    }
});
