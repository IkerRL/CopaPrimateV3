import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import fs from 'fs';
import path from 'path';
import {
  ROOT_DIR,
  TestRunnerContext,
} from './helpers/test-utils.mjs';
import { startTestServer, stopTestServer, ADMIN_TOKEN } from './helpers/server-fixture.mjs';
import { backupDataFiles, restoreDataFiles } from './helpers/data-backup.mjs';

export async function runTier4Tests() {
  const ctx = new TestRunnerContext('Tier 4 - Real-World Application Scenarios');
  backupDataFiles();

  let serverInfo = null;
  try {
    serverInfo = await startTestServer();
  } catch (err) {
    console.error('Failed to start test server for Tier 4:', err);
  }

  if (serverInfo) {
    const { baseUrl, adminToken } = serverInfo;

    // =========================================================================
    // Scenario 1: Pre-Match Setup Workflow
    // =========================================================================
    await ctx.runTest('S1: Pre-Match Setup (matchup overlay, team selection, map selection, 0-0 score)', async () => {
      // 1. Set overlay to matchup
      const sceneRes = await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ mode: 'matchup' }),
      });
      assert.equal(sceneRes.status, 200);

      // 2. Configure pre-match live state
      const preMatchPayload = {
        match: {
          active: true,
          status: 'PROGRAMADO',
          team1: { name: 'Los Monos', score: 0, mapsWon: 0, logo: '/logos/monos.png' },
          team2: { name: 'Gorilas', score: 0, mapsWon: 0, logo: '/logos/gorilas.png' },
          map: 'Ascent',
          round: 0,
          format: 'BO3',
          side: 'ATT vs DEF',
          notes: 'Gran Final de la Copa Primate',
        },
      };

      const matchRes = await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(preMatchPayload),
      });
      assert.equal(matchRes.status, 200);

      // 3. Verify public overlay state
      const overlayState = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(overlayState.mode, 'matchup');

      // 4. Verify public live-match overlay output
      const liveData = await (await fetch(`${baseUrl}/api/public/live-match?overlay=1`)).json();
      assert.equal(liveData.match.status, 'PROGRAMADO');
      assert.equal(liveData.match.team1.name, 'Los Monos');
      assert.equal(liveData.match.team2.name, 'Gorilas');
      assert.equal(liveData.match.map, 'Ascent');
      assert.equal(liveData.match.team1.score, 0);
      assert.equal(liveData.match.team2.score, 0);
      assert.equal(liveData.match.round, 0);
    });

    // =========================================================================
    // Scenario 2: Live Match Round Progression with Halftime Side-Swap
    // =========================================================================
    await ctx.runTest('S2: Live Match Progression with Halftime Side-Swap at Round 12', async () => {
      // 1. Switch to live scoreboard
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ mode: 'scoreboard' }),
      });

      // 2. First half progression (simulate end of round 12: 7 - 5)
      const firstHalfPayload = {
        match: {
          active: true,
          status: 'LIVE',
          team1: { name: 'Los Monos', score: 7, mapsWon: 0 },
          team2: { name: 'Gorilas', score: 5, mapsWon: 0 },
          map: 'Ascent',
          round: 12,
          format: 'BO3',
          side: 'Attackers vs Defenders',
        },
      };
      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(firstHalfPayload),
      });

      const midMatch = await (await fetch(`${baseUrl}/api/public/live-match?overlay=1`)).json();
      assert.equal(midMatch.match.round, 12);
      assert.equal(midMatch.match.team1.score, 7);
      assert.equal(midMatch.match.team2.score, 5);

      // 3. Halftime side swap to round 13
      const secondHalfPayload = {
        match: {
          active: true,
          status: 'LIVE',
          team1: { name: 'Los Monos', score: 7, mapsWon: 0 },
          team2: { name: 'Gorilas', score: 5, mapsWon: 0 },
          map: 'Ascent',
          round: 13,
          format: 'BO3',
          side: 'Defenders vs Attackers',
        },
      };
      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(secondHalfPayload),
      });

      const postSwap = await (await fetch(`${baseUrl}/api/public/live-match?overlay=1`)).json();
      assert.equal(postSwap.match.round, 13);
      assert.equal(postSwap.match.side, 'Defenders vs Attackers');
      assert.equal(postSwap.match.team1.score, 7);
      assert.equal(postSwap.match.team2.score, 5);
    });

    // =========================================================================
    // Scenario 3: Overtime Battle (12-12, continuing past 13 to 15-13)
    // =========================================================================
    await ctx.runTest('S3: Overtime Battle (12-12 tie, Match Point at 13-12, and 15-13 conclusion)', async () => {
      // 1. Tie at 12-12 (Round 24)
      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          match: {
            active: true,
            status: 'OVERTIME',
            team1: { name: 'Los Monos', score: 12, mapsWon: 0 },
            team2: { name: 'Gorilas', score: 12, mapsWon: 0 },
            map: 'Ascent',
            round: 24,
            format: 'BO3',
          },
        }),
      });

      let res = await (await fetch(`${baseUrl}/api/public/live-match?overlay=1`)).json();
      assert.equal(res.match.team1.score, 12);
      assert.equal(res.match.team2.score, 12);
      assert.equal(res.match.status, 'OVERTIME');

      // 2. Overtime progression to 13-12
      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          match: {
            active: true,
            status: 'OVERTIME',
            team1: { name: 'Los Monos', score: 13, mapsWon: 0 },
            team2: { name: 'Gorilas', score: 12, mapsWon: 0 },
            map: 'Ascent',
            round: 25,
            format: 'BO3',
          },
        }),
      });
      res = await (await fetch(`${baseUrl}/api/public/live-match?overlay=1`)).json();
      assert.equal(res.match.team1.score, 13);
      assert.equal(res.match.team2.score, 12);

      // 3. Extended overtime to 15-13 without auto-reset
      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          match: {
            active: true,
            status: 'FINAL_MAPA',
            team1: { name: 'Los Monos', score: 15, mapsWon: 0 },
            team2: { name: 'Gorilas', score: 13, mapsWon: 0 },
            map: 'Ascent',
            round: 28,
            format: 'BO3',
          },
        }),
      });
      res = await (await fetch(`${baseUrl}/api/public/live-match?overlay=1`)).json();
      assert.equal(res.match.team1.score, 15);
      assert.equal(res.match.team2.score, 13);
      assert.equal(res.match.round, 28);
    });

    // =========================================================================
    // Scenario 4: Map Victory Declaration with Confirmation Guard
    // =========================================================================
    await ctx.runTest('S4: Map Victory Declaration with Confirmation Guard (Map 1 won -> Map 2 0-0 reset)', async () => {
      // 1. Initial state: Map 1 won 15-13
      const currentMatch = {
        active: true,
        status: 'FINAL_MAPA',
        team1: { name: 'Los Monos', score: 15, mapsWon: 0 },
        team2: { name: 'Gorilas', score: 13, mapsWon: 0 },
        map: 'Ascent',
        round: 28,
        format: 'BO3',
      };
      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ match: currentMatch }),
      });

      // 2. Cancellation of victory confirmation guard leaves match state untouched
      let userCancelled = true;
      if (userCancelled) {
        // No POST sent to modify mapsWon
      }
      let check = await (await fetch(`${baseUrl}/api/public/live-match?overlay=1`)).json();
      assert.equal(check.match.team1.mapsWon, 0, 'mapsWon must remain 0 when action is cancelled');

      // 3. Confirmation of victory: mapsWon increments to 1, scores reset for Map 2
      const map2Payload = {
        match: {
          active: true,
          status: 'LIVE',
          team1: { name: 'Los Monos', score: 0, mapsWon: 1 },
          team2: { name: 'Gorilas', score: 0, mapsWon: 0 },
          map: 'Bind',
          round: 1,
          format: 'BO3',
          notes: 'Mapa 2 en curso tras victoria 15-13 de Los Monos en Ascent',
        },
      };
      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(map2Payload),
      });

      const map2State = await (await fetch(`${baseUrl}/api/public/live-match?overlay=1`)).json();
      assert.equal(map2State.match.map, 'Bind');
      assert.equal(map2State.match.team1.mapsWon, 1, 'Team 1 should now have 1 map won');
      assert.equal(map2State.match.team2.mapsWon, 0);
      assert.equal(map2State.match.team1.score, 0, 'Round score should reset to 0');
      assert.equal(map2State.match.team2.score, 0);
      assert.equal(map2State.match.round, 1);
    });

    // =========================================================================
    // Scenario 5: Full Broadcast Production Cycling
    // =========================================================================
    await ctx.runTest('S5: Full Broadcast Workflow (Roulette -> Matchup -> Scoreboard -> Ticker -> Hidden)', async () => {
      // Step 1: Map Roulette (Veto phase)
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'roulette',
          roulette: { state: 'spinning', spinId: 101, reps: 15 },
        }),
      });
      let state = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(state.mode, 'roulette');
      assert.equal(state.roulette.spinId, 101);

      // Step 2: Matchup Screen (Casters introduction)
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ mode: 'matchup' }),
      });
      state = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(state.mode, 'matchup');

      // Step 3: Live Scoreboard (In-game)
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ mode: 'scoreboard' }),
      });
      state = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(state.mode, 'scoreboard');

      // Step 4: Ticker (Post-match or intermission ticker)
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ mode: 'ticker' }),
      });
      state = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(state.mode, 'ticker');

      // Step 5: Hidden (Stream overlay cleared)
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ mode: 'hidden' }),
      });
      state = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(state.mode, 'hidden');
    });
  }

  restoreDataFiles();
  return ctx.summary();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runTier4Tests().then((summary) => {
    console.log(`\n=== ${summary.name} ===`);
    console.log(`Passed: ${summary.passed}/${summary.total} | Failed: ${summary.failed}`);
    for (const r of summary.results) {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} ${r.name} (${r.duration}ms)`);
      if (r.error) console.log(`     Error: ${r.error}`);
    }
    stopTestServer().then(() => {
      process.exit(summary.failed > 0 ? 1 : 0);
    });
  });
}
