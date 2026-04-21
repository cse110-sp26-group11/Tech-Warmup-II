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
        const initialLevel = this._level;
        this._xp += amount;
        const newLevel = Math.floor(this._xp / this._XP_PER_LEVEL) + 1;
        let leveledUp = false;

        if (newLevel > initialLevel) {
            leveledUp = true;
            this._level = newLevel;
            
            // Reward calculation using arithmetic progression sum
            const sumInitial = (initialLevel * (initialLevel + 1)) / 2;
            const sumNew = (newLevel * (newLevel + 1)) / 2;
            const totalReward = (sumNew - sumInitial) * 500;
            
            wallet.addCoins(totalReward);
        }
        return { leveledUp, newLevel: this._level };
    }
    getProgress() {
        const threshold = this._level * this._XP_PER_LEVEL;
        const prevThreshold = (this._level - 1) * this._XP_PER_LEVEL;
        return Math.floor(((this._xp - prevThreshold) / (threshold - prevThreshold)) * 100);
    }
}

class StatisticsTracker {
    constructor() {
        this._totalSpins = 0;
        this._biggestWin = 0;
        this._totalCoinsWon = 0;
    }
    updateStats(winAmount) {
        this._totalSpins++;
        this._totalCoinsWon += winAmount;
        if (winAmount > this._biggestWin) this._biggestWin = winAmount;
    }
    getStats() {
        return {
            totalSpins: this._totalSpins,
            biggestWin: this._biggestWin,
            totalCoinsWon: this._totalCoinsWon
        };
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
        this.stats = new StatisticsTracker();
    }
    isEligibleForRescue() {
        return this.wallet.getBalance() < 10;
    }
    claimRescueFunds() {
        if (!this.isEligibleForRescue()) {
            throw new Error('Balance must be below 10 coins to claim rescue funds');
        }
        this.wallet.addCoins(500);
        return 500;
    }
    playSpin(betAmount) {
        this.wallet.deductCoins(betAmount);
        const spinResult = this.engine.spin();
        const winAmount = spinResult.payout * betAmount;
        
        // Update stats
        this.stats.updateStats(winAmount);
        
        if (winAmount > 0) this.wallet.addCoins(winAmount);
        const levelResult = this.leveling.addXP(betAmount, this.wallet);
        
        return {
            symbols: spinResult.symbols,
            winAmount,
            newBalance: this.wallet.getBalance(),
            level: this.leveling.getLevel(),
            leveledUp: levelResult.leveledUp,
            stats: this.stats.getStats()
        };
    }
}

// --- App Initialization ---

const config = {
    reels: [
        [
            { symbol: '🍒', weight: 5 },
            { symbol: '🍋', weight: 10 },
            { symbol: '7️⃣', weight: 1 },
            { symbol: '💎', weight: 1 },
            { symbol: '⚪', weight: 23 }
        ],
        [
            { symbol: '🍒', weight: 5 },
            { symbol: '🍋', weight: 10 },
            { symbol: '7️⃣', weight: 1 },
            { symbol: '💎', weight: 1 },
            { symbol: '⚪', weight: 23 }
        ],
        [
            { symbol: '🍒', weight: 5 },
            { symbol: '🍋', weight: 10 },
            { symbol: '7️⃣', weight: 1 },
            { symbol: '💎', weight: 1 },
            { symbol: '⚪', weight: 23 }
        ]
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
const audioManager = new AudioManager();

// --- DOM Elements ---
const levelEl = document.getElementById('current-level');
const balanceEl = document.getElementById('current-balance');
const spinBtn = document.getElementById('spin-button');
const rescueBtn = document.getElementById('rescue-button');
const statsBtn = document.getElementById('stats-button');
const closeStatsBtn = document.getElementById('close-stats');
const statsModal = document.getElementById('stats-modal');
const betInput = document.getElementById('bet-amount');
const messageEl = document.getElementById('message-display');
const celebrationOverlay = document.getElementById('celebration-overlay');
const confettiCanvas = document.getElementById('confetti-canvas');
const audioToggleBtn = document.getElementById('audio-toggle');
const reels = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2')
];

// --- Audio Initialization ---
function updateAudioButton() {
    audioToggleBtn.textContent = audioManager.isMuted ? '🔇' : '🔊';
}
updateAudioButton();

audioToggleBtn.addEventListener('click', () => {
    const isMuted = audioManager.toggleMute();
    updateAudioButton();
});

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

    animate();
    
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
    
    // Toggle Rescue Button visibility
    if (gameController.isEligibleForRescue()) {
        rescueBtn.classList.remove('hidden');
    } else {
        rescueBtn.classList.add('hidden');
    }

    if (state.symbols) {
        state.symbols.forEach((symbol, i) => {
            reels[i].textContent = symbol;
        });

        if (state.winAmount > 0) {
            messageEl.textContent = `WIN: ${state.winAmount} COINS!`;
            messageEl.style.color = 'var(--color-gold)';
            triggerCelebration();
            
            if (state.winAmount >= parseInt(betInput.value) * 10) {
                audioManager.playBigWinSound();
            } else {
                audioManager.playWinSound();
            }
        } else {
            messageEl.textContent = 'Try Again!';
            messageEl.style.color = 'var(--color-white)';
            audioManager.playLoseSound();
        }

        if (state.leveledUp) {
            messageEl.textContent += ` LEVEL UP! Reached Level ${state.level}!`;
            audioManager.playBigWinSound();
        }
    }

    // Update Modal data if it exists in state
    if (state.stats) {
        document.getElementById('stat-total-spins').textContent = state.stats.totalSpins;
        document.getElementById('stat-biggest-win').textContent = state.stats.biggestWin;
        document.getElementById('stat-total-won').textContent = state.stats.totalCoinsWon;
    }
}

// --- Event Listeners ---

spinBtn.addEventListener('click', () => {
    const bet = parseInt(betInput.value);
    
    try {
        if (wallet.getBalance() < bet) {
            if (gameController.isEligibleForRescue()) {
                rescueBtn.classList.remove('hidden');
            }
            throw new Error('Insufficient balance');
        }

        spinBtn.disabled = true;
        messageEl.textContent = 'Spinning...';
        
        audioManager.playSpinSound();
        reels.forEach(reel => reel.classList.add('spinning'));

        setTimeout(() => {
            const result = gameController.playSpin(bet);
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

rescueBtn.addEventListener('click', () => {
    try {
        const amount = gameController.claimRescueFunds();
        messageEl.textContent = `RESCUE GRANTED: ${amount} COINS!`;
        messageEl.style.color = 'var(--color-gold)';
        updateUI({
            newBalance: wallet.getBalance(),
            level: leveling.getLevel()
        });
        triggerCelebration();
        audioManager.playBigWinSound();
    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.style.color = 'var(--color-red)';
    }
});

statsBtn.addEventListener('click', () => {
    const currentStats = gameController.stats.getStats();
    document.getElementById('stat-total-spins').textContent = currentStats.totalSpins;
    document.getElementById('stat-biggest-win').textContent = currentStats.biggestWin;
    document.getElementById('stat-total-won').textContent = currentStats.totalCoinsWon;
    statsModal.classList.remove('hidden');
});

closeStatsBtn.addEventListener('click', () => {
    statsModal.classList.add('hidden');
});
