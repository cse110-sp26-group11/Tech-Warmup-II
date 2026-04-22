# System Context & Engineering Standards: Social Casino App

## 1. Core Architecture & Constraints
* **Model:** Social/Freemium Casino. Non-exchangeable in-game currency only. No real-world money.
* **Target Engine:** Node.js backend / Vanilla JS or Framework frontend.

## 2. Strict Software Engineering Standards (CRITICAL)
* **Code Style & Cleanliness:** Code must be clear, not clever. Use meaningful variable/function names. Keep functions and classes small and modular. Strictly adhere to DRY (Don't Repeat Yourself) principles. 
* **Error Handling:** Implement robust error handling across all modules.
* **Documentation:** Every function, class, and complex variable in JavaScript MUST be documented using JSDocs with explicit type annotations.
* **Linting Compliance:** All generated code must be ready to pass strict linters (ESLint for JS, HTML validators, Stylelint for CSS).

## 3. Testing Strategy
* **Unit Tests:** All business logic, especially the math engine, must have accompanying unit tests. Preference for Test-Driven Development (TDD).
* **End-to-End (E2E):** The application must support E2E testing. Assume Playwright will be used to test UI interactions.

## 4. Mathematical Engine & RNG
* **Randomness:** Use Cryptographically Secure Pseudorandom Number Generators (CSPRNG) — specifically `crypto.randomInt` in Node.js. NEVER use `Math.random()`.
* **Reel Mechanics:** Implement weighted reels. The visibly perceivable frequencies must not match actual probabilities.
* **Payback Rate (RTP):** Must be strictly < 100%.

## 5. Developer Workflow constraints (For AI)
* **Do Not Commit:** The AI must never attempt to run `git commit` or push code. The human developer handles all version control.
* **Incremental Generation:** Output code in small, testable, and cohesive blocks to maintain architectural consistency.

## 6. Features & Mechanics
* **Reel Modifiers:** Cascading reels, Megaways, Expanding reels.
* **Symbols:** Pay symbols, Wilds, Scatters, Sticky, Multipliers.
* **Meta-Systems:** Daily login rewards, Leveling systems, Missions/Quests, Leaderboards.

## 7. UI/UX & Psychological Feedback
* **Color Psychology:** Red (attention/jackpots), Blue (longer play/wins), Gold (confidence/reward). High-contrast required.
* **Feedback:** Fast, themed audio and distinct visual cues for wins, near-misses, and reel spins.