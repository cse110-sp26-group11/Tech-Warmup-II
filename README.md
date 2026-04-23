# Tech-Warmup-II

A feature-rich, web-based social casino application designed for entertainment purposes only. This project was built using a strict Test-Driven Development (TDD) approach, focusing on a mathematically sound backend engine, robust meta-systems (leveling, daily logins, virtual economy), and a clean, responsive vanilla frontend with zero external animation libraries.

**Disclaimer:** This is a social casino. No real money is required, deposited, or won. All in-game currency is strictly virtual.

## Features
* **Mathematically Sound Engine:** Uses cryptographically secure random number generation (`crypto.randomInt`) and weighted reel math to ensure a realistic Return To Player (RTP) experience.
* **Virtual Economy:** Fully functional wallet system with a "Bankruptcy Rescue" feature to ensure players can always keep playing for free.
* **Progression Systems:** Includes an Experience (XP) and Leveling system, plus a Daily Login streak tracker for bonus rewards.
* **Player Statistics:** Tracks and saves session data, including Total Spins, Biggest Win, and Total Coins Won for bragging rights.
* **Flashy Visuals:** Pure CSS/Vanilla JS reel spin animations and celebratory win confetti.

---

## 🛠 Prerequisites

Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v16.x or higher recommended)
* npm (comes with Node.js)

---

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cse110-sp26-group11/Tech-Warmup-II
   cd Tech-Warmup-II
   ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Run the app:**
    ```bash
    cd slot-machine-dev
    npx serve public
    ```

## Testing
1. **Unit tests:**
    ```bash
    npm test
    ```
2. **Playwright**
    ```bash
    npm playwright test
    ```
## Linting
1. **Run All Linters:**
    ```bash
    npm run lint
    ```

2. **Run Specific Linters:**
    ```bash
    npm run lint:js
    npm run lint:css
    npm run lint:html
    ```
3. **Fix Issues:**
    ```bash
    npm run lint:js -- --fix
    npm run lint:css -- --fix
    npm run lint:html -- --fix
    ```
