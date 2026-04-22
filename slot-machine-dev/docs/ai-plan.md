# AI Use Plan: Social Casino Slot Machine App

## 1. Project Overview & Harness Strategy
**Goal:** Build a mobile-friendly web slot machine application catering to Marie the Mom, Gary the Gambler, and Billy the Boy.
**Harness:** Gemini CLI / Code Assist.
**Model Rationale:** I will use Gemini 1.5 Pro via the CLI for complex logic generation (RNG, math engine, architectural scaffolding) due to its larger context window and advanced reasoning. For rapid iteration, linting fixes, and JSDoc generation, I may default to Gemini 1.5 Flash for speed.

## 2. Initial LLM Strategy & Methodology
1.  **Context & Skill Files:** Feed `system-context.md` and `personas.md` to ground the LLM in requirements and SWE standards.
2.  **Test-Driven Increments:** Write unit tests first (or prompt the LLM to write them based on requirements), then prompt the LLM to write the code to pass those tests.
3.  **Adversarial Prompting (Code Review):** Ask Gemini to "Act as a strict code reviewer" to check for DRY violations, missing JSDocs, or unhandled errors.
4.  **Simulation Agents:** Write scripts to simulate 10,000 spins to verify RTP (Return to Player) before building the UI.

## 3. Engineering & Repository Standards
* **Version Control:** All artifacts, tests, and code must be in the repository. I will make frequent, clear, manual commits. (No AI-generated commits). The workspace will be kept clean using a `.gitignore`.
* **Clean Code:** Enforce small functions/classes, meaningful names, DRY principles, and proper error handling. The codebase must read consistently as if written by a single human.
* **Documentation:** All JavaScript must include thorough JSDocs with type annotations. 
* **Linting:** Source code will be checked for quality (HTML validation, CSS use, JS style). Linters will be run concurrently with generation.
* **Testing:** Unit tests are required at a minimum for all math/logic modules. End-to-end testing using Playwright will be implemented as development progresses.

## 4. Hand-Editing Rules & Log Requirements
* **Default:** Maximize agent autonomy. Do not default to hand-editing.
* **Read & Evaluate:** I will constantly read and evaluate generated code.
* **Touch (Last Resort):** I will only manually touch/edit the code *after* attempting and failing to make a correction via prompting the AI.
* **Documentation:** Any manual edits will be explicitly documented in the `ai-use-log`, including the reason the prompt failed.

## 5. Phased Execution Plan
* **Phase 1: Project Scoping & Harness Setup** * Set up repo, `.gitignore`, linters, and Playwright. Resolve conflicting user stories (Social Casino pivot).
* **Phase 2: Math Engine (TDD approach)**
    * Prompt for RNG logic (`crypto.randomInt`) tests first, then implementation.
* **Phase 3: Gamification Systems**
    * Daily login hooks, leveling, and in-game currency management.
* **Phase 4: UI/UX & Feedback**
    * Frontend generation with strict HTML/CSS linting.
* **Phase 5: Edge cases & Meta UI**
    * Reload credits.
* **Phase 6: Achievements & Tracking**
    * Statistics tracker for number of spins payout and biggest win