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
    setBalance(amount) { this._balance = amount; }
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
    setLevel(level, xp) {
        this._level = level;
        this._xp = xp;
    }
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
    setStats(stats) {
        if (stats) {
            this._totalSpins = stats.totalSpins || 0;
            this._biggestWin = stats.biggestWin || 0;
            this._totalCoinsWon = stats.totalCoinsWon || 0;
        }
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
    /**
     * Evaluates the spin result for wins.
     * @description BUG FIX: Only pays out for exact 3-symbol matches.
     * @param {string[]} symbols 
     * @returns {number} Payout multiplier.
     */
    evaluate(symbols) {
        // Strict match check: all 3 symbols must be identical
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            for (const entry of this.paytable) {
                // Find matching entry in paytable
                if (symbols[0] === entry.symbols[0]) {
                    return entry.payout;
                }
            }
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
    claimRescueFunds(amount) {
        this.wallet.addCoins(amount);
        return amount;
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
            { symbol: '7️⃣', weight: 1 },
            { symbol: '💎', weight: 2 },
            { symbol: '🍒', weight: 8 },
            { symbol: '🍋', weight: 12 },
            { symbol: '⚪', weight: 7 }
        ],
        [
            { symbol: '7️⃣', weight: 1 },
            { symbol: '💎', weight: 2 },
            { symbol: '🍒', weight: 8 },
            { symbol: '🍋', weight: 12 },
            { symbol: '⚪', weight: 7 }
        ],
        [
            { symbol: '7️⃣', weight: 1 },
            { symbol: '💎', weight: 2 },
            { symbol: '🍒', weight: 8 },
            { symbol: '🍋', weight: 12 },
            { symbol: '⚪', weight: 7 }
        ]
    ],
    paytable: [
        { symbols: ['7️⃣', '7️⃣', '7️⃣'], payout: 200 },
        { symbols: ['💎', '💎', '💎'], payout: 100 },
        { symbols: ['🍒', '🍒', '🍒'], payout: 20 },
        { symbols: ['🍋', '🍋', '🍋'], payout: 8 }
    ]
};

const engine = new SlotEngine(config);
const wallet = new Wallet(1000);
const leveling = new Leveling();
const gameController = new GameController(engine, wallet, leveling);
const audioManager = new AudioManager();

/** @type {'social' | 'gambling' | null} */
let currentMode = null;
/** @type {string | null} */
let currentUser = null;

// --- DOM Elements ---
const levelEl = document.getElementById('current-level');
const balanceEl = document.getElementById('current-balance');
const balanceLabel = document.getElementById('balance-label');
const spinBtn = document.getElementById('spin-button');
const statsBtn = document.getElementById('stats-button');
const closeStatsBtn = document.getElementById('close-stats');
const statsModal = document.getElementById('stats-modal');
const rulesBtn = document.getElementById('rules-button');
const closeRulesBtn = document.getElementById('close-rules');
const rulesModal = document.getElementById('rules-modal');
const betInput = document.getElementById('bet-amount');
const betLabel = document.getElementById('bet-label');
const messageEl = document.getElementById('message-display');
const celebrationOverlay = document.getElementById('celebration-overlay');
const confettiCanvas = document.getElementById('confetti-canvas');
const audioToggleBtn = document.getElementById('audio-toggle');
const modeSwitchBtn = document.getElementById('mode-switch-button');
const usernameDisplay = document.getElementById('username-display');
const modeBadge = document.getElementById('mode-badge');
const gamblingBanner = document.getElementById('gambling-banner');
const footerDisclaimer = document.getElementById('footer-disclaimer');
const cashButtonsContainer = document.getElementById('cash-buttons');
const cashInBtn = document.getElementById('cash-in-button');
const cashOutBtn = document.getElementById('cash-out-button');

const reelContainer = document.getElementById('reel-container');
const reels = [
    document.getElementById('reel-0'),
    document.getElementById('reel-1'),
    document.getElementById('reel-2')
];

// Auth Modal elements
const authModal = document.getElementById('auth-modal');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');

// Cash In Modal elements
const cashInModal = document.getElementById('cash-in-modal');
const cashInAmountInput = document.getElementById('cash-in-amount');
const cashInSubmit = document.getElementById('cash-in-submit');
const cashInCancel = document.getElementById('cash-in-cancel');
const cashInError = document.getElementById('cash-in-error');
const cashInSuccess = document.getElementById('cash-in-success');

// Broke Modal elements
const brokeModal = document.getElementById('broke-modal');
const mathChallenges = document.getElementById('math-challenges');
const mathSubmit = document.getElementById('math-submit');
const adRefillOption = document.getElementById('ad-refill-option');
const adContainer = document.getElementById('ad-container');
const adCountdown = document.getElementById('ad-countdown');
const adStartBtn = document.getElementById('ad-start');
const refillError = document.getElementById('refill-error');
const mathRewardText = document.getElementById('math-reward-text');

// --- Audio Initialization ---
function updateAudioButton() {
    audioToggleBtn.textContent = audioManager.isMuted ? '🔇' : '🔊';
}
updateAudioButton();

audioToggleBtn.addEventListener('click', async () => {
    await audioManager.toggleMute();
    updateAudioButton();
});

// --- Persistence Logic ---

/**
 * Saves the current game state to localStorage.
 * @description Stores currentMode, currentUser, balance, level, xp, and statistics.
 */
function saveGameState() {
    if (!currentMode) return;
    
    const state = {
        currentMode,
        currentUser,
        balance: wallet.getBalance(),
        level: leveling.getLevel(),
        xp: leveling.getXP(),
        stats: gameController.stats.getStats()
    };
    localStorage.setItem('slot_machine_session', JSON.stringify(state));
}

/**
 * Loads the game state from localStorage.
 * @description Restores previous session if it exists.
 * @returns {boolean} True if a session was successfully restored.
 */
function loadGameState() {
    const saved = localStorage.getItem('slot_machine_session');
    if (!saved) return false;

    try {
        const state = JSON.parse(saved);
        currentMode = state.currentMode;
        currentUser = state.currentUser;
        wallet.setBalance(state.balance);
        leveling.setLevel(state.level, state.xp);
        gameController.stats.setStats(state.stats);

        if (currentMode === 'gambling') {
            enterGamblingMode(true);
        } else {
            enterSocialMode(true);
        }
        
        updateUI({
            newBalance: wallet.getBalance(),
            level: leveling.getLevel(),
            stats: gameController.stats.getStats()
        });
        
        return true;
    } catch (e) {
        console.error('Failed to load saved state:', e);
        localStorage.removeItem('slot_machine_session');
        return false;
    }
}

/**
 * Resets the game state and clears persistence.
 * @description Resets all player progress and clears session localStorage.
 */
function resetGameState() {
    localStorage.removeItem('slot_machine_session');
    currentMode = null;
    currentUser = null;
    wallet.setBalance(1000);
    leveling.setLevel(1, 0);
    gameController.stats.setStats({ totalSpins: 0, biggestWin: 0, totalCoinsWon: 0 });
    
    // Reset UI
    modeBadge.classList.add('hidden');
    gamblingBanner.classList.add('hidden');
    usernameDisplay.classList.add('hidden');
    cashButtonsContainer.classList.add('hidden');
    balanceLabel.textContent = 'Coins';
    betLabel.textContent = 'Bet:';
    betInput.min = '1';
    betInput.step = '5';
    betInput.max = '';
    betInput.value = '10';
    footerDisclaimer.textContent = 'NO REAL MONEY REQUIRED. This is a social casino for entertainment purposes only.';
    
    updateUI({
        newBalance: wallet.getBalance(),
        level: leveling.getLevel(),
        stats: gameController.stats.getStats()
    });
    
    const modeModal = document.getElementById('mode-modal');
    if (modeModal) modeModal.classList.remove('hidden');
}

// --- Auth Simulation Logic ---

/**
 * Gets all registered users.
 * @returns {Array} Array of user objects.
 */
function getUsers() {
    return JSON.parse(localStorage.getItem('slotUsers') || '[]');
}

/**
 * Registers a new user.
 * @param {string} username 
 * @param {string} password 
 * @returns {boolean} Success.
 */
function registerUser(username, password) {
    const users = getUsers();
    if (users.find(u => u.username === username)) return false;
    users.push({ username, password });
    localStorage.setItem('slotUsers', JSON.stringify(users));
    return true;
}

/**
 * Logs in a user.
 * @param {string} username 
 * @param {string} password 
 * @returns {boolean} Success.
 */
function loginUser(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = username;
        return true;
    }
    return false;
}

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
    const isGambling = currentMode === 'gambling';
    const prefix = isGambling ? '$' : '';
    const suffix = isGambling ? '' : ' COINS';

    balanceEl.textContent = `${prefix}${state.newBalance}`;
    levelEl.textContent = state.level;

    if (state.symbols) {
        state.symbols.forEach((symbol, i) => {
            reels[i].textContent = symbol;
        });

        reelContainer.classList.remove('win-flash', 'lose-flash');
        messageEl.classList.remove('msg-win', 'msg-lose');

        if (state.winAmount > 0) {
            messageEl.textContent = `YOU WON ${prefix}${state.winAmount}${suffix}! 🎉`;
            messageEl.classList.add('msg-win');
            reelContainer.classList.add('win-flash');
            triggerCelebration();
            audioManager.playWinSound();
        } else {
            messageEl.textContent = 'No win this time';
            messageEl.classList.add('msg-lose');
            reelContainer.classList.add('lose-flash');
            audioManager.playLoseSound();
        }

        if (state.leveledUp) {
            messageEl.textContent += ` LEVEL UP! Reached Level ${state.level}!`;
            triggerCelebration();
            audioManager.playBigWinSound();
        }

        // Check for "Broke" state after spin ends
        if (gameController.isEligibleForRescue()) {
            setTimeout(() => {
                showBrokeModal();
            }, 1000);
        }

        // Remove flash classes after animation finishes
        setTimeout(() => {
            reelContainer.classList.remove('win-flash', 'lose-flash');
        }, 1500);
    }

    // Update Modal data if it exists in state
    if (state.stats) {
        document.getElementById('stat-total-spins').textContent = state.stats.totalSpins;
        document.getElementById('stat-biggest-win').textContent = state.stats.biggestWin;
        document.getElementById('stat-total-won').textContent = state.stats.totalCoinsWon;
    }
}

/**
 * Switches the app to Social Mode UI.
 * @param {boolean} [skipSave=false] Whether to skip saving state.
 */
function enterSocialMode(skipSave = false) {
    currentMode = 'social';
    document.getElementById('mode-modal').classList.add('hidden');
    messageEl.textContent = 'Welcome back to Social Mode!';
    adRefillOption.classList.remove('hidden');
    mathRewardText.textContent = '200 coins';
    if (!skipSave) saveGameState();
}

/**
 * Switches the app to Gambling Mode UI.
 * @param {boolean} [skipSave=false] Whether to skip saving state.
 */
function enterGamblingMode(skipSave = false) {
    currentMode = 'gambling';
    modeBadge.classList.remove('hidden');
    gamblingBanner.classList.remove('hidden');
    usernameDisplay.textContent = `👤 ${currentUser}`;
    usernameDisplay.classList.remove('hidden');
    cashButtonsContainer.classList.remove('hidden');
    balanceLabel.textContent = 'USD $';
    betLabel.textContent = 'Bet ($):';
    betInput.min = '0.25';
    betInput.step = '0.25';
    betInput.max = '100';
    if (!skipSave) betInput.value = '1.00';
    footerDisclaimer.textContent = '⚠️ Gambling involves financial risk. Must be 18+. Play responsibly. This is a DEMO only.';
    
    adRefillOption.classList.add('hidden');
    mathRewardText.textContent = '$20';

    const verificationModal = document.getElementById('verification-modal');
    if (verificationModal) verificationModal.classList.add('hidden');
    document.getElementById('mode-modal').classList.add('hidden');
    authModal.classList.add('hidden');
    
    messageEl.textContent = `Welcome, ${currentUser}! Good Luck!`;
    if (!skipSave) saveGameState();
}

// --- Refill Logic ---

/**
 * Shows the "Broke" modal and generates math problems.
 */
function showBrokeModal() {
    brokeModal.classList.remove('hidden');
    generateMathChallenges();
}

/**
 * Generates 3 random math problems.
 */
function generateMathChallenges() {
    mathChallenges.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const op = Math.random() > 0.5 ? '+' : '-';
        const result = op === '+' ? a + b : a - b;
        
        const problemDiv = document.createElement('div');
        problemDiv.className = 'math-problem';
        problemDiv.dataset.answer = result;
        problemDiv.innerHTML = `
            <span>${a} ${op} ${b} = </span>
            <input type="number">
        `;
        mathChallenges.appendChild(problemDiv);
    }
}

/**
 * Validates math challenge answers.
 */
function validateMathChallenges() {
    const problems = mathChallenges.querySelectorAll('.math-problem');
    let allCorrect = true;
    
    problems.forEach(p => {
        const input = p.querySelector('input');
        if (parseInt(input.value) === parseInt(p.dataset.answer)) {
            p.classList.remove('wrong');
        } else {
            p.classList.add('wrong');
            allCorrect = false;
        }
    });

    if (allCorrect) {
        const reward = currentMode === 'gambling' ? 20 : 200;
        gameController.claimRescueFunds(reward);
        brokeModal.classList.add('hidden');
        updateUI({
            newBalance: wallet.getBalance(),
            level: leveling.getLevel()
        });
        saveGameState();
        alert(`Correct! Received ${currentMode === 'gambling' ? '$' : ''}${reward} refill.`);
    } else {
        refillError.textContent = 'Some answers are incorrect. Try again.';
        refillError.classList.remove('hidden');
    }
}

/**
 * Starts ad simulation.
 */
function startAdSimulation() {
    adStartBtn.disabled = true;
    adContainer.classList.remove('hidden');
    let seconds = 5;
    
    const interval = setInterval(() => {
        seconds--;
        adCountdown.textContent = `Ad playing... ${seconds}`;
        if (seconds <= 0) {
            clearInterval(interval);
            gameController.claimRescueFunds(100);
            brokeModal.classList.add('hidden');
            adContainer.classList.add('hidden');
            adStartBtn.disabled = false;
            adCountdown.textContent = 'Ad playing... 5';
            updateUI({
                newBalance: wallet.getBalance(),
                level: leveling.getLevel()
            });
            saveGameState();
        }
    }, 1000);
}

// --- Event Listeners ---

const socialModeBtn = document.getElementById('social-mode-btn');
const gamblingModeBtn = document.getElementById('gambling-mode-btn');

socialModeBtn.addEventListener('click', () => {
    enterSocialMode();
});

gamblingModeBtn.addEventListener('click', () => {
    document.getElementById('mode-modal').classList.add('hidden');
    authModal.classList.remove('hidden');
});

// Auth Tabs
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

// Register
document.getElementById('reg-submit').addEventListener('click', () => {
    const user = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;
    const conf = document.getElementById('reg-confirm').value;

    if (!user || !pass) {
        authError.textContent = 'Username and password required.';
        authError.classList.remove('hidden');
        return;
    }
    if (pass !== conf) {
        authError.textContent = 'Passwords do not match.';
        authError.classList.remove('hidden');
        return;
    }

    if (registerUser(user, pass)) {
        authError.classList.add('hidden');
        alert('Account created! Please login.');
        loginTab.click();
    } else {
        authError.textContent = 'Username already exists.';
        authError.classList.remove('hidden');
    }
});

// Login
document.getElementById('login-submit').addEventListener('click', () => {
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;

    if (loginUser(user, pass)) {
        authError.classList.add('hidden');
        authModal.classList.add('hidden');
        document.getElementById('verification-modal').classList.remove('hidden');
    } else {
        authError.textContent = 'Invalid credentials.';
        authError.classList.remove('hidden');
    }
});

// Verification (Identity)
document.getElementById('verify-submit').addEventListener('click', () => {
    const isAgeConfirmed = document.getElementById('age-checkbox').checked;
    const hasIdUploaded = document.getElementById('id-upload').files.length > 0;
    const verifyingMsg = document.getElementById('verifying-msg');
    const verificationError = document.getElementById('verification-error');

    if (isAgeConfirmed && hasIdUploaded) {
        verificationError.classList.add('hidden');
        verifyingMsg.classList.remove('hidden');
        document.getElementById('verify-submit').disabled = true;

        setTimeout(() => {
            verifyingMsg.classList.add('hidden');
            document.getElementById('verify-submit').disabled = false;
            enterGamblingMode();
        }, 2000);
    } else {
        verificationError.classList.remove('hidden');
    }
});

// Cash Flow
cashInBtn.addEventListener('click', () => {
    cashInModal.classList.remove('hidden');
    cashInSuccess.classList.add('hidden');
});

cashInSubmit.addEventListener('click', () => {
    const amount = parseInt(cashInAmountInput.value);
    if (isNaN(amount) || amount < 10 || amount > 500) {
        cashInError.textContent = 'Amount must be between $10 and $500.';
        cashInError.classList.remove('hidden');
        return;
    }
    
    // Internally, 1 USD = 1000 coins, but we work with USD in the UI for Gambling Mode
    wallet.addCoins(amount);
    saveGameState();
    updateUI({
        newBalance: wallet.getBalance(),
        level: leveling.getLevel()
    });
    
    cashInError.classList.add('hidden');
    cashInSuccess.classList.remove('hidden');
    setTimeout(() => {
        cashInModal.classList.add('hidden');
    }, 1500);
});

cashInCancel.addEventListener('click', () => {
    cashInModal.classList.add('hidden');
});

cashOutBtn.addEventListener('click', () => {
    const balance = wallet.getBalance();
    if (confirm(`Cash out $${balance}? This would process a real withdrawal in production.`)) {
        wallet.setBalance(0);
        saveGameState();
        updateUI({
            newBalance: 0,
            level: leveling.getLevel()
        });
        alert('Cashing out... Goodbye!');
    }
});

// Refill Listeners
mathSubmit.addEventListener('click', validateMathChallenges);
adStartBtn.addEventListener('click', startAdSimulation);

modeSwitchBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to switch modes? Your current session progress will be reset.')) {
        resetGameState();
    }
});

spinBtn.addEventListener('click', () => {
    const bet = parseFloat(betInput.value);
    
    try {
        if (wallet.getBalance() < bet) {
            showBrokeModal();
            throw new Error('Insufficient balance');
        }

        spinBtn.disabled = true;
        modeSwitchBtn.disabled = true;
        messageEl.textContent = 'Spinning...';
        messageEl.classList.remove('msg-win', 'msg-lose');
        messageEl.style.color = 'var(--color-white)';
        
        audioManager.startSpinLoop();

        // Get result at the start
        const result = gameController.playSpin(bet);
        const intervals = [];

        reels.forEach((reel, i) => {
            reel.classList.add('spinning');
            
            // Get symbol pool for this reel
            const symbolPool = config.reels[i].map(s => s.symbol);
            
            // Rapidly cycle symbols every 100ms
            const interval = setInterval(() => {
                const randomSymbol = symbolPool[Math.floor(Math.random() * symbolPool.length)];
                reel.textContent = randomSymbol;
            }, 100);
            
            intervals.push(interval);

            // Staggered stop: 4s, 5s, 6s
            const stopTime = 4000 + (i * 1000);
            
            setTimeout(() => {
                clearInterval(intervals[i]);
                reel.classList.remove('spinning');
                reel.textContent = result.symbols[i];
                
                // If this is the last reel, finish the spin
                if (i === reels.length - 1) {
                    audioManager.stopSpinLoop();
                    updateUI(result);
                    saveGameState();
                    spinBtn.disabled = false;
                    modeSwitchBtn.disabled = false;
                }
            }, stopTime);
        });

    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.style.color = 'var(--color-red)';
        spinBtn.disabled = false;
        modeSwitchBtn.disabled = false;
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

rulesBtn.addEventListener('click', () => {
    rulesModal.classList.remove('hidden');
});

closeRulesBtn.addEventListener('click', () => {
    rulesModal.classList.add('hidden');
});

// Identity verification image preview
document.getElementById('id-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('id-preview');
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.innerHTML = `<img src="${event.target.result}" alt="ID Preview">`;
        };
        reader.readAsDataURL(file);
    } else if (file) {
        preview.innerHTML = `<span>${file.name} uploaded</span>`;
    }
});

// Initialize game
if (!loadGameState()) {
    const modeModal = document.getElementById('mode-modal');
    if (modeModal) modeModal.classList.remove('hidden');
}
