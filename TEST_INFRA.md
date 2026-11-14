# Test Infrastructure — Copa Primate Vol. III

## Overview
This document describes the automated opaque-box End-to-End (E2E) testing framework developed for the Copa Primate Vol. III tournament platform. The test suite covers all 5 core platform features across 4 systematic tiers, providing rigorous regression protection, boundary validation, pairwise integration coverage, and real-world multi-step scenario simulation.

---

## Test Directory Structure
```
tests/
├── e2e-suite.mjs                 # Master test runner aggregating all tiers
├── tier1-features.test.mjs       # Tier 1: Feature Coverage (F1 to F5, 28 tests)
├── tier2-boundaries.test.mjs     # Tier 2: Boundary & Corner Cases (26 tests)
├── tier3-combinations.test.mjs   # Tier 3: Cross-Feature Combinations (5 tests)
├── tier4-scenarios.test.mjs      # Tier 4: Real-World Broadcast Scenarios (5 tests)
└── helpers/
    ├── data-backup.mjs           # Data file backup & automatic rollback on process exit
    ├── server-fixture.mjs        # Ephemeral-port Express test server lifecycle & auth
    └── test-utils.mjs            # Token scanners, Fusión color definitions, test runner
```

---

## Systematic Test Tiers

### Tier 1 — Feature Coverage (28 tests)
Verifies expected primary behaviors for all 5 requirements:
- **F1: Historical Finals Record**: Verifies that `historyData.js` and `HomePage.jsx` display a 3-0 scoreline for Golden Sex (Max & Broken) in Vol. I without residual 3-2 strings.
- **F2: Overlays Visual Palette**: Verifies that all 5 overlay components (`OverlayLive.jsx`, `OverlayScoreboard.jsx`, `OverlayMatchup.jsx`, `OverlayRoulette.jsx`, `OverlayTicker.jsx`) and associated stylesheets in both `website/` and `dashboard/` contain no legacy tokens (`wood`, `banana`, `#4e2e1a`, `#27140b`, `#795548`, `#2e7d32`, `#ffa000`, `#ffb300`, `/monkeys.jpg`, `/gorilas.jpg`) and incorporate the official Fusión colors (`#c084fc`, `#00f5d4`, `#08080b`).
- **F3: Scoreboard HUD**: Verifies presence of map name, round counter, side indicators (ATT/DEF), radianite pips (instead of banana emojis), text truncation on team names, and `tabular-nums` typography.
- **F4: Moderation Dashboard**: Verifies direct single-action +1/-1 controls, existence and structure of `ConfirmModal.jsx`, confirmation guards on destructive actions, embedded OBS scene switcher in `Scoreboard.jsx`, and React Rules of Hooks compliance in `App.jsx`.
- **F5: Build & API Health**: Verifies that Vite build scripts (`npm run build:web`, `npm run build:dashboard`) exit with code 0, public API routes return HTTP 200, admin API routes return HTTP 200 with valid `ADMIN_TOKEN`, and unauthorized requests are rejected with HTTP 401.

### Tier 2 — Boundary & Corner Cases (26 tests)
Stress tests extreme values, malicious inputs, and edge conditions:
- **Historical Boundaries**: Formatting variations (3-0 vs 3 - 0), player array constraints, runner-up preservation, Vol. II score independence, non-existent edition queries.
- **Visual Token Boundaries**: Case-insensitive hex matching, unicode banana emoji scan, substring collisions, theme variable integrity.
- **HUD Boundaries**: 0-0 match start, 12-12 overtime deadlock, extended overtime past 13 (e.g. 15-13), negative score clamping to 0, extreme score capping at 99, BO1/BO3/BO5 map win caps.
- **Moderation Boundaries**: Score decrement underflow guard (no negative scores), halftime side-swap score preservation, empty/null team name sanitization, confirmation modal cancellation.
- **API Boundaries**: Malformed JSON rejection (HTTP 400), payload size limit enforcement (HTTP 413 for >2MB), 404 routing for unknown endpoints, malformed query parameters resilience.

### Tier 3 — Cross-Feature Combinations (5 tests)
Verifies multi-component interactions and pipeline synchronization:
- **C1**: Admin score update -> `live-match.json` atomic disk write -> `GET /api/public/live-match?overlay=1` broadcast delivery.
- **C2**: Admin scene mode change -> `overlay-state.json` disk persistence -> `GET /api/public/overlay-state` delivery.
- **C3**: Sequential toggling across all 5 overlay scenes (`scoreboard`, `matchup`, `roulette`, `ticker`, `hidden`).
- **C4**: Inactive match state filtering (`active: false` yields `null` on public web while passing match object to `?overlay=1` for fade-out transitions).
- **C5**: Halftime side-swap synchronization (updating sides, round, and score alignment).

### Tier 4 — Real-World Application Scenarios (5 tests)
Full end-to-end simulations of actual production tournament workflows:
- **Scenario 1: Pre-Match Setup**: Setting matchup scene, selecting teams, configuring map, initializing 0-0 scores and verifying public overlay output.
- **Scenario 2: Live Match Progression**: Cycling through 12 first-half rounds, executing Round 12 halftime side-swap, verifying Round 13 state.
- **Scenario 3: Overtime Battle**: Handling 12-12 tie, match point at 13-12, and 15-13 victory without unwanted resets.
- **Scenario 4: Map Victory Declaration**: Guarding map victory with `ConfirmModal`, handling cancellation, confirming victory, incrementing mapsWon, and resetting round scores to 0-0 for Map 2.
- **Scenario 5: Full Broadcast Production Cycling**: Progressing sequentially through Roulette -> Matchup -> Scoreboard -> Ticker -> Hidden.

---

## Test Execution Commands

### Run Entire Test Suite (All Tiers)
```powershell
node tests/e2e-suite.mjs
```

### Run Specific Tier via Runner Flag
```powershell
node tests/e2e-suite.mjs --tier=1    # Tier 1: Feature Coverage
node tests/e2e-suite.mjs --tier=2    # Tier 2: Boundary & Corner Cases
node tests/e2e-suite.mjs --tier=3    # Tier 3: Cross-Feature Combinations
node tests/e2e-suite.mjs --tier=4    # Tier 4: Real-World Scenarios
```

### Run Individual Test Modules Directly
```powershell
node tests/tier1-features.test.mjs
node tests/tier2-boundaries.test.mjs
node tests/tier3-combinations.test.mjs
node tests/tier4-scenarios.test.mjs
```

---

## State Isolation & Safety Protocol
- **Zero Polluting State**: `tests/helpers/data-backup.mjs` snapshots all runtime data files (`live-match.json`, `overlay-state.json`, `matches.json`, `teams.json`, `web-settings.json`) before executing tests.
- **Automatic Rollback**: On completion or unhandled exit (`process.on('exit')`), all data files are restored to their pre-test contents.
- **Ephemeral Test Server**: The test server in `tests/helpers/server-fixture.mjs` binds to OS-assigned port 0 (`127.0.0.1:0`), completely avoiding port collisions with any active development servers on port 3001, 5173, or 5174.
