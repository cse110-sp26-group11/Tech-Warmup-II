/**
 * @file app.js
 * @description Core frontend logic for the Social Casino Slot Machine.
 */

// --- Constants & Config ---

const INITIAL_BALANCE = 1000;
const MIN_BET_SOCIAL = 1;
const MIN_BET_GAMBLING = 0.25;
const SUDOKU_REWARD_SOCIAL = 300;
const SUDOKU_REWARD_GAMBLING = 30;
const MATH_REWARD_SOCIAL = 200;
const MATH_REWARD_GAMBLING = 20;

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

// --- Backend Simulation Classes ---

/**
 * @class Wallet
 * @description Manages player balance.
 */
class Wallet {
    /** @param {number} initialBalance */
    constructor(initialBalance = INITIAL_BALANCE) {
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

/**
 * @class StatisticsTracker
 * @description Tracks player win/loss statistics.
 */
class StatisticsTracker {
    constructor() {
        this._totalSpins = 0;
        this._biggestWin = 0;
        this._totalCoinsWon = 0;
    }
    /** @param {number} winAmount */
    updateStats(winAmount) {
        this._totalSpins++;
        this._totalCoinsWon += winAmount;
        if (winAmount > this._biggestWin) this._biggestWin = winAmount;
    }
    /** @returns {Object} */
    getStats() {
        return {
            totalSpins: this._totalSpins,
            biggestWin: this._biggestWin,
            totalCoinsWon: this._totalCoinsWon
        };
    }
    /** @param {Object} stats */
    setStats(stats) {
        if (stats) {
            this._totalSpins = stats.totalSpins || 0;
            this._biggestWin = stats.biggestWin || 0;
            this._totalCoinsWon = stats.totalCoinsWon || 0;
        }
    }
}

/**
 * @class SlotEngine
 * @description Core slot machine logic.
 */
class SlotEngine {
    /** @param {Object} config */
    constructor(config) {
        this.reels = config.reels;
        this.paytable = config.paytable;
    }
    /** @returns {Object} symbols and payout */
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
     * @description CRITICAL BUG FIX: Only pays out for exact 3-symbol matches.
     * @param {string[]} symbols 
     * @returns {number} Payout multiplier.
     */
    evaluate(symbols) {
        console.log('--- Evaluation Trace ---');
        console.log('Symbols:', symbols);
        
        // Exact 3-symbol match check: symbols[0] === symbols[1] === symbols[2]
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            const matchSymbol = symbols[0];
            const entry = this.paytable.find(e => e.symbols[0] === matchSymbol);
            const payout = entry ? entry.payout : 0;
            console.log('RESULT: WIN! Payout:', payout);
            return payout;
        }
        
        console.log('RESULT: LOSS.');
        return 0;
    }
}

/**
 * @class GameController
 * @description Orchestrates the game flow.
 */
class GameController {
    /** 
     * @param {SlotEngine} engine 
     * @param {Wallet} wallet 
     */
    constructor(engine, wallet) {
        this.engine = engine;
        this.wallet = wallet;
        this.stats = new StatisticsTracker();
    }
    /** @returns {boolean} */
    isEligibleForRescue() {
        return this.wallet.getBalance() < 10;
    }
    /** 
     * @param {number} amount 
     * @returns {number}
     */
    claimRescueFunds(amount) {
        this.wallet.addCoins(amount);
        return amount;
    }
    /** 
     * @param {number} betAmount 
     * @returns {Object} spin result data
     */
    playSpin(betAmount) {
        this.wallet.deductCoins(betAmount);
        const spinResult = this.engine.spin();
        const winAmount = spinResult.payout * betAmount;
        
        this.stats.updateStats(winAmount);
        if (winAmount > 0) this.wallet.addCoins(winAmount);
        
        return {
            symbols: spinResult.symbols,
            winAmount,
            newBalance: this.wallet.getBalance(),
            stats: this.stats.getStats()
        };
    }
}

// --- App State ---

const engine = new SlotEngine(config);
const wallet = new Wallet();
const gameController = new GameController(engine, wallet);
const audioManager = new AudioManager();

/** @type {'social' | 'gambling' | null} */
let currentMode = null;
/** @type {string | null} */
let currentUser = null;

// --- DOM Constants ---

const DOM = {
    balance: document.getElementById('current-balance'),
    balanceLabel: document.getElementById('balance-label'),
    spinBtn: document.getElementById('spin-button'),
    statsBtn: document.getElementById('stats-button'),
    closeStatsBtn: document.getElementById('close-stats'),
    statsModal: document.getElementById('stats-modal'),
    rulesBtn: document.getElementById('rules-button'),
    closeRulesBtn: document.getElementById('close-rules'),
    rulesModal: document.getElementById('rules-modal'),
    betInput: document.getElementById('bet-amount'),
    betLabel: document.getElementById('bet-label'),
    message: document.getElementById('message-display'),
    overlay: document.getElementById('celebration-overlay'),
    canvas: document.getElementById('confetti-canvas'),
    audioToggle: document.getElementById('audio-toggle'),
    modeSwitch: document.getElementById('mode-switch-button'),
    userDisplay: document.getElementById('username-display'),
    modeBadge: document.getElementById('mode-badge'),
    banner: document.getElementById('gambling-banner'),
    footer: document.getElementById('footer-disclaimer'),
    cashContainer: document.getElementById('cash-buttons'),
    cashIn: document.getElementById('cash-in-button'),
    cashOut: document.getElementById('cash-out-button'),
    reels: [
        document.getElementById('reel-0'),
        document.getElementById('reel-1'),
        document.getElementById('reel-2')
    ],
    reelContainer: document.getElementById('reel-container'),
    auth: {
        modal: document.getElementById('auth-modal'),
        loginTab: document.getElementById('login-tab'),
        regTab: document.getElementById('register-tab'),
        loginForm: document.getElementById('login-form'),
        regForm: document.getElementById('register-form'),
        error: document.getElementById('auth-error'),
        loginSubmit: document.getElementById('login-submit'),
        regSubmit: document.getElementById('reg-submit')
    },
    cashInModal: {
        modal: document.getElementById('cash-in-modal'),
        input: document.getElementById('cash-in-amount'),
        submit: document.getElementById('cash-in-submit'),
        cancel: document.getElementById('cash-in-cancel'),
        error: document.getElementById('cash-in-error'),
        success: document.getElementById('cash-in-success')
    },
    broke: {
        modal: document.getElementById('broke-modal'),
        math: document.getElementById('math-challenges'),
        mathSubmit: document.getElementById('math-submit'),
        sudoku: document.getElementById('sudoku-grid'),
        sudokuCheck: document.getElementById('sudoku-check'),
        sudokuGiveUp: document.getElementById('sudoku-giveup'),
        close: document.getElementById('broke-close'),
        error: document.getElementById('refill-error'),
        mathReward: document.getElementById('math-reward-text'),
        sudokuReward: document.getElementById('sudoku-reward-text')
    },
    modeModal: document.getElementById('mode-modal'),
    socialBtn: document.getElementById('social-mode-btn'),
    gamblingBtn: document.getElementById('gambling-mode-btn'),
    verify: {
        modal: document.getElementById('verification-modal'),
        submit: document.getElementById('verify-submit'),
        checkbox: document.getElementById('age-checkbox'),
        upload: document.getElementById('id-upload'),
        preview: document.getElementById('id-preview'),
        msg: document.getElementById('verifying-msg'),
        error: document.getElementById('verification-error')
    }
};

// --- Helper Functions ---

/**
 * Safely reads from localStorage with error handling.
 * @param {string} key 
 * @returns {any}
 */
function storageRead(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error('LocalStorage read error:', e);
        return null;
    }
}

/**
 * Safely writes to localStorage with error handling.
 * @param {string} key 
 * @param {string} value 
 */
function storageWrite(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error('LocalStorage write error:', e);
    }
}

/**
 * Saves current session state.
 */
function saveGameState() {
    if (!currentMode) return;
    const state = {
        currentMode,
        currentUser,
        balance: wallet.getBalance(),
        stats: gameController.stats.getStats()
    };
    storageWrite('slot_machine_session', JSON.stringify(state));
}

/**
 * Restores previous session if available.
 * @returns {boolean}
 */
function loadGameState() {
    const saved = storageRead('slot_machine_session');
    if (!saved) return false;
    try {
        const state = JSON.parse(saved);
        currentMode = state.currentMode;
        currentUser = state.currentUser;
        wallet.setBalance(state.balance);
        gameController.stats.setStats(state.stats);
        if (currentMode === 'gambling') {
            enterGamblingMode(true);
        } else {
            enterSocialMode(true);
        }
        updateUI({ newBalance: wallet.getBalance(), stats: gameController.stats.getStats() });
        return true;
    } catch (e) {
        console.error('Restore failed:', e);
        return false;
    }
}

/**
 * Resets all progress.
 */
function resetGameState() {
    localStorage.removeItem('slot_machine_session');
    currentMode = null;
    currentUser = null;
    wallet.setBalance(INITIAL_BALANCE);
    gameController.stats.setStats({ totalSpins: 0, biggestWin: 0, totalCoinsWon: 0 });
    
    DOM.modeBadge.classList.add('hidden');
    DOM.banner.classList.add('hidden');
    DOM.userDisplay.classList.add('hidden');
    DOM.cashContainer.classList.add('hidden');
    DOM.balanceLabel.textContent = 'Coins';
    DOM.betLabel.textContent = 'Bet:';
    DOM.betInput.min = '1';
    DOM.betInput.step = '5';
    DOM.betInput.value = '10';
    
    updateUI({ newBalance: INITIAL_BALANCE, stats: gameController.stats.getStats() });
    DOM.modeModal.classList.remove('hidden');
}

/**
 * Switches to Social Mode.
 * @param {boolean} skipSave 
 */
function enterSocialMode(skipSave = false) {
    currentMode = 'social';
    DOM.modeModal.classList.add('hidden');
    DOM.broke.mathReward.textContent = `${MATH_REWARD_SOCIAL} coins`;
    DOM.broke.sudokuReward.textContent = `${SUDOKU_REWARD_SOCIAL} coins`;
    if (!skipSave) saveGameState();
}

/**
 * Switches to Gambling Mode.
 * @param {boolean} skipSave 
 */
function enterGamblingMode(skipSave = false) {
    currentMode = 'gambling';
    DOM.modeBadge.classList.remove('hidden');
    DOM.banner.classList.remove('hidden');
    DOM.userDisplay.textContent = `👤 ${currentUser}`;
    DOM.userDisplay.classList.remove('hidden');
    DOM.cashContainer.classList.remove('hidden');
    DOM.balanceLabel.textContent = 'USD $';
    DOM.betLabel.textContent = 'Bet ($):';
    DOM.betInput.min = '0.25';
    DOM.betInput.step = '0.25';
    if (!skipSave) DOM.betInput.value = '1.00';
    DOM.broke.mathReward.textContent = `$${MATH_REWARD_GAMBLING}`;
    DOM.broke.sudokuReward.textContent = `$${SUDOKU_REWARD_GAMBLING}`;
    DOM.verify.modal.classList.add('hidden');
    DOM.modeModal.classList.add('hidden');
    DOM.auth.modal.classList.add('hidden');
    if (!skipSave) saveGameState();
}

// --- Visual Logic ---

/**
 * Triggers confetti effect.
 */
function triggerCelebration() {
    DOM.overlay.classList.remove('hidden');
    const ctx = DOM.canvas.getContext('2d');
    DOM.canvas.width = window.innerWidth;
    DOM.canvas.height = window.innerHeight;
    const particles = [];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * DOM.canvas.width,
            y: Math.random() * DOM.canvas.height - DOM.canvas.height,
            size: Math.random() * 10 + 5,
            color: ['#FFD700', '#D32F2F', '#FFFFFF', '#1976D2'][Math.floor(Math.random() * 4)],
            speed: Math.random() * 3 + 2,
            angle: Math.random() * 360
        });
    }
    const animate = () => {
        ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        let active = false;
        particles.forEach(p => {
            p.y += p.speed; p.angle += 1;
            if (p.y < DOM.canvas.height) {
                active = true;
                ctx.fillStyle = p.color; ctx.save();
                ctx.translate(p.x, p.y); ctx.rotate(p.angle * Math.PI / 180);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore();
            }
        });
        if (active) requestAnimationFrame(animate);
        else DOM.overlay.classList.add('hidden');
    };
    animate();
    setTimeout(() => DOM.overlay.classList.add('hidden'), 3000);
}

/**
 * Updates UI with state changes.
 * @param {Object} state 
 */
function updateUI(state) {
    const isG = currentMode === 'gambling';
    const pre = isG ? '$' : '';
    const suf = isG ? '' : ' COINS';
    DOM.balance.textContent = `${pre}${state.newBalance}`;
    if (state.symbols) {
        state.symbols.forEach((s, i) => DOM.reels[i].textContent = s);
        DOM.reelContainer.classList.remove('win-flash', 'lose-flash');
        DOM.message.classList.remove('msg-win', 'msg-lose');
        if (state.winAmount > 0) {
            DOM.message.textContent = `YOU WON ${pre}${state.winAmount}${suf}! 🎉`;
            DOM.message.classList.add('msg-win');
            DOM.reelContainer.classList.add('win-flash');
            triggerCelebration();
            audioManager.playWinSound();
        } else {
            DOM.message.textContent = 'No win this time';
            DOM.message.classList.add('msg-lose');
            DOM.reelContainer.classList.add('lose-flash');
            audioManager.playLoseSound();
        }
    }
    if (state.stats) {
        document.getElementById('stat-total-spins').textContent = state.stats.totalSpins;
        document.getElementById('stat-biggest-win').textContent = state.stats.biggestWin;
        document.getElementById('stat-total-won').textContent = state.stats.totalCoinsWon;
    }
}

// --- Mini-Game Logic ---

/**
 * Shows broke modal.
 */
function showBrokeModal() {
    DOM.broke.modal.classList.remove('hidden');
    generateMath();
    generateSudoku();
}

/**
 * Generates math problems.
 */
function generateMath() {
    DOM.broke.math.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const a = Math.floor(Math.random() * 20) + 1, b = Math.floor(Math.random() * 20) + 1;
        const op = Math.random() > 0.5 ? '+' : '-', res = op === '+' ? a + b : a - b;
        const div = document.createElement('div');
        div.className = 'math-problem'; div.dataset.answer = res;
        div.innerHTML = `<span>${a} ${op} ${b} = </span><input type="number">`;
        DOM.broke.math.appendChild(div);
    }
}

/**
 * Generates Sudoku.
 */
function generateSudoku() {
    DOM.broke.sudoku.innerHTML = '';
    const base = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]];
    const pattern = base.sort(() => Math.random() - 0.5);
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const cell = document.createElement('div'), val = pattern[r][c];
            cell.className = 'sudoku-cell'; cell.dataset.correct = val;
            if (Math.random() > 0.5) {
                cell.textContent = val; cell.classList.add('prefilled');
            } else {
                const input = document.createElement('input');
                input.type = 'number'; input.min = '1'; input.max = '4';
                cell.appendChild(input);
            }
            DOM.broke.sudoku.appendChild(cell);
        }
    }
}

/**
 * Validates Sudoku.
 */
function validateSudoku() {
    const cells = DOM.broke.sudoku.querySelectorAll('.sudoku-cell');
    let correct = true;
    cells.forEach(c => {
        const input = c.querySelector('input');
        if (input) {
            if (parseInt(input.value) === parseInt(c.dataset.correct)) c.classList.remove('wrong');
            else { c.classList.add('wrong'); correct = false; }
        }
    });
    if (correct) {
        const r = currentMode === 'gambling' ? SUDOKU_REWARD_GAMBLING : SUDOKU_REWARD_SOCIAL;
        gameController.claimRescueFunds(r);
        DOM.broke.modal.classList.add('hidden');
        updateUI({ newBalance: wallet.getBalance() });
        saveGameState();
    } else {
        DOM.broke.error.textContent = 'Incorrect. Check red cells.';
        DOM.broke.error.classList.remove('hidden');
    }
}

// --- Event Handlers ---

DOM.spinBtn.addEventListener('click', () => {
    const bet = parseFloat(DOM.betInput.value);
    try {
        if (wallet.getBalance() < bet) { showBrokeModal(); return; }
        DOM.spinBtn.disabled = true; DOM.modeSwitch.disabled = true;
        DOM.message.textContent = 'Spinning...';
        audioManager.startSpinLoop();
        const result = gameController.playSpin(bet);
        const intervals = [];
        DOM.reels.forEach((reel, i) => {
            reel.classList.add('spinning');
            const pool = config.reels[i].map(s => s.symbol);
            const interval = setInterval(() => {
                reel.textContent = pool[Math.floor(Math.random() * pool.length)];
            }, 100);
            intervals.push(interval);
            setTimeout(() => {
                clearInterval(intervals[i]); reel.classList.remove('spinning');
                reel.textContent = result.symbols[i];
                if (i === 2) {
                    audioManager.stopSpinLoop(); updateUI(result); saveGameState();
                    DOM.spinBtn.disabled = false; DOM.modeSwitch.disabled = false;
                }
            }, 4000 + (i * 1000));
        });
    } catch (e) {
        DOM.message.textContent = e.message; DOM.spinBtn.disabled = false;
        DOM.modeSwitch.disabled = false;
    }
});

DOM.broke.close.addEventListener('click', () => {
    DOM.broke.modal.classList.add('hidden');
    DOM.betInput.value = currentMode === 'gambling' ? MIN_BET_GAMBLING : MIN_BET_SOCIAL;
});

DOM.broke.sudokuCheck.addEventListener('click', validateSudoku);
DOM.broke.sudokuGiveUp.addEventListener('click', () => DOM.broke.close.click());

DOM.modeSwitch.addEventListener('click', () => {
    if (confirm('Switch modes? Progress will be reset.')) resetGameState();
});

// Initialization
if (!loadGameState()) DOM.modeModal.classList.remove('hidden');

DOM.rulesBtn.addEventListener('click', () => DOM.rulesModal.classList.remove('hidden'));
DOM.closeRulesBtn.addEventListener('click', () => DOM.rulesModal.classList.add('hidden'));
DOM.statsBtn.addEventListener('click', () => {
    const s = gameController.stats.getStats();
    document.getElementById('stat-total-spins').textContent = s.totalSpins;
    document.getElementById('stat-biggest-win').textContent = s.biggestWin;
    document.getElementById('stat-total-won').textContent = s.totalCoinsWon;
    DOM.statsModal.classList.remove('hidden');
});
DOM.closeStatsBtn.addEventListener('click', () => DOM.statsModal.classList.add('hidden'));

DOM.socialBtn.addEventListener('click', () => enterSocialMode());
DOM.gamblingBtn.addEventListener('click', () => {
    DOM.modeModal.classList.add('hidden');
    DOM.auth.modal.classList.remove('hidden');
});

// Auth, Cash Flow and ID preview logic truncated for brevity but maintained in original spirit
// (Assuming these are standard listeners like the ones previously implemented)

DOM.auth.loginTab.addEventListener('click', () => {
    DOM.auth.loginTab.classList.add('active'); DOM.auth.regTab.classList.remove('active');
    DOM.auth.loginForm.classList.remove('hidden'); DOM.auth.regForm.classList.add('hidden');
});
DOM.auth.regTab.addEventListener('click', () => {
    DOM.auth.regTab.classList.add('active'); DOM.auth.loginTab.classList.remove('active');
    DOM.auth.regForm.classList.remove('hidden'); DOM.auth.loginForm.classList.add('hidden');
});

DOM.auth.loginSubmit.addEventListener('click', () => {
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    const users = JSON.parse(storageRead('slotUsers') || '[]');
    const found = users.find(u => u.username === user && u.password === pass);
    if (found) {
        currentUser = user;
        DOM.auth.modal.classList.add('hidden');
        DOM.verify.modal.classList.remove('hidden');
    } else {
        DOM.auth.error.textContent = 'Invalid credentials';
        DOM.auth.error.classList.remove('hidden');
    }
});

DOM.auth.regSubmit.addEventListener('click', () => {
    const user = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;
    const conf = document.getElementById('reg-confirm').value;
    if (pass !== conf) { DOM.auth.error.textContent = 'Passwords mismatch'; return; }
    const users = JSON.parse(storageRead('slotUsers') || '[]');
    if (users.find(u => u.username === user)) { DOM.auth.error.textContent = 'Exists'; return; }
    users.push({ username: user, password: pass });
    storageWrite('slotUsers', JSON.stringify(users));
    DOM.auth.loginTab.click();
});

DOM.verify.submit.addEventListener('click', () => {
    if (DOM.verify.checkbox.checked && DOM.verify.upload.files.length > 0) {
        DOM.verify.msg.classList.remove('hidden');
        setTimeout(() => enterGamblingMode(), 2000);
    }
});

DOM.cashIn.addEventListener('click', () => {
    DOM.cashInModal.modal.classList.remove('hidden');
    DOM.cashInModal.success.classList.add('hidden');
});

DOM.cashInModal.submit.addEventListener('click', () => {
    const val = parseInt(DOM.cashInModal.input.value);
    if (val >= 10 && val <= 500) {
        wallet.addCoins(val); saveGameState();
        updateUI({ newBalance: wallet.getBalance() });
        DOM.cashInModal.success.classList.remove('hidden');
        setTimeout(() => DOM.cashInModal.modal.classList.add('hidden'), 1000);
    }
});

DOM.cashInModal.cancel.addEventListener('click', () => DOM.cashInModal.modal.classList.add('hidden'));

DOM.cashOut.addEventListener('click', () => {
    if (confirm(`Withdraw $${wallet.getBalance()}?`)) {
        wallet.setBalance(0); saveGameState();
        updateUI({ newBalance: 0 });
    }
});

DOM.verify.upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => DOM.verify.preview.innerHTML = `<img src="${ev.target.result}">`;
        reader.readAsDataURL(file);
    }
});

DOM.broke.mathSubmit.addEventListener('click', () => {
    const probs = DOM.broke.math.querySelectorAll('.math-problem');
    let ok = true;
    probs.forEach(p => {
        const i = p.querySelector('input');
        if (parseInt(i.value) === parseInt(p.dataset.answer)) i.style.borderColor = '';
        else { i.style.borderColor = 'red'; ok = false; }
    });
    if (ok) {
        const reward = currentMode === 'gambling' ? MATH_REWARD_GAMBLING : MATH_REWARD_SOCIAL;
        gameController.claimRescueFunds(reward);
        DOM.broke.modal.classList.add('hidden');
        updateUI({ newBalance: wallet.getBalance() });
        saveGameState();
    }
});
