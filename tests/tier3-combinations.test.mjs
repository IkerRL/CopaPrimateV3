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

export async function runTier3Tests() {
  const ctx = new TestRunnerContext('Tier 3 - Cross-Feature Combinations');
  backupDataFiles();

  let serverInfo = null;
  try {
    serverInfo = await startTestServer();
  } catch (err) {
    console.error('Failed to start test server for Tier 3:', err);
  }

  if (serverInfo) {
    const { baseUrl, adminToken } = serverInfo;

    // =========================================================================
    // Combination 1: Admin Score Update -> Persistence -> Public Overlay API
    // =========================================================================
    await ctx.runTest('C1: Admin score update -> live-match.json disk persistence -> GET /api/public/live-match?overlay=1', async () => {
      const payload = {
        match: {
          active: true,
          status: 'LIVE',
          team1: { name: 'Fusión Stars', score: 7, mapsWon: 1, logo: '/logos/fusion.png', side: 'ATT' },
          team2: { name: 'Neon Titans', score: 5, mapsWon: 0, logo: '/logos/neon.png', side: 'DEF' },
          map: 'Lotus',
          round: 13,
          format: 'BO3',
          side: 'Attackers vs Defenders',
          mvp: 'Broken',
          notes: 'Cambio de bando tras ronda 12',
        },
      };

      // 1. Admin sends POST /api/live-match
      const postRes = await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(postRes.status, 200, 'POST /api/live-match must return 200');

      // 2. Verify disk persistence in live-match.json
      const livePath = path.resolve(ROOT_DIR, 'live-match.json');
      assert.ok(fs.existsSync(livePath), 'live-match.json must exist on disk');
      const diskContent = JSON.parse(fs.readFileSync(livePath, 'utf8'));
      assert.equal(diskContent.team1.name, 'Fusión Stars');
      assert.equal(diskContent.team1.score, 7);
      assert.equal(diskContent.team2.score, 5);
      assert.equal(diskContent.map, 'Lotus');
      assert.equal(diskContent.round, 13);

      // 3. Verify public overlay endpoint serves persisted match
      const getRes = await fetch(`${baseUrl}/api/public/live-match?overlay=1`);
      assert.equal(getRes.status, 200, 'GET /api/public/live-match?overlay=1 must return 200');
      const getBody = await getRes.json();
      assert.ok(getBody.match, 'Should return match object');
      assert.equal(getBody.match.team1.name, 'Fusión Stars');
      assert.equal(getBody.match.team1.score, 7);
      assert.equal(getBody.match.team2.score, 5);
      assert.equal(getBody.match.map, 'Lotus');
      assert.equal(getBody.match.round, 13);
    });

    // =========================================================================
    // Combination 2: Admin Overlay Mode Change -> Persistence -> Public Overlay-State
    // =========================================================================
    await ctx.runTest('C2: Admin overlay mode change -> overlay-state.json disk persistence -> GET /api/public/overlay-state', async () => {
      const payload = {
        mode: 'matchup',
        roulette: {
          state: 'winner',
          spinning: false,
          spinId: 42,
          winnerMap: 'Sunset',
        },
      };

      // 1. Admin sends POST /api/overlay-state
      const postRes = await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(postRes.status, 200, 'POST /api/overlay-state must return 200');

      // 2. Verify disk persistence in overlay-state.json
      const overlayPath = path.resolve(ROOT_DIR, 'overlay-state.json');
      assert.ok(fs.existsSync(overlayPath), 'overlay-state.json must exist');
      const diskState = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
      assert.equal(diskState.mode, 'matchup');
      assert.equal(diskState.roulette?.spinId, 42);
      assert.equal(diskState.roulette?.winnerMap, 'Sunset');

      // 3. Verify public overlay-state endpoint reflects new mode
      const getRes = await fetch(`${baseUrl}/api/public/overlay-state`);
      assert.equal(getRes.status, 200, 'GET /api/public/overlay-state must return 200');
      const getState = await getRes.json();
      assert.equal(getState.mode, 'matchup');
      assert.equal(getState.roulette?.spinId, 42);
      assert.equal(getState.roulette?.winnerMap, 'Sunset');
    });

    // =========================================================================
    // Combination 3: Scene Mode Toggling Across All 5 Scenes
    // =========================================================================
    await ctx.runTest('C3: Toggling across all 5 overlay scenes (scoreboard, matchup, roulette, ticker, hidden)', async () => {
      const scenes = ['scoreboard', 'matchup', 'roulette', 'ticker', 'hidden'];

      for (const scene of scenes) {
        const postRes = await fetch(`${baseUrl}/api/overlay-state`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ mode: scene }),
        });
        assert.equal(postRes.status, 200, `POST /api/overlay-state mode="${scene}" must return 200`);

        const getRes = await fetch(`${baseUrl}/api/public/overlay-state`);
        assert.equal(getRes.status, 200);
        const body = await getRes.json();
        assert.equal(body.mode, scene, `Public endpoint must return mode="${scene}"`);
      }
    });

    // =========================================================================
    // Combination 4: Inactive Match State vs Overlay Query Parameter
    // =========================================================================
    await ctx.runTest('C4: Inactive match state filtering (public web returns null, overlay receives match for transition)', async () => {
      const inactivePayload = {
        match: {
          active: false,
          status: 'PAUSED',
          team1: { name: 'Team A', score: 3 },
          team2: { name: 'Team B', score: 2 },
          map: 'Bind',
          round: 6,
        },
      };

      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(inactivePayload),
      });

      // Regular public query (active !== false filter)
      const pubRes = await fetch(`${baseUrl}/api/public/live-match`);
      const pubData = await pubRes.json();
      assert.equal(pubData.match, null, 'Public web without ?overlay=1 should receive null for inactive match');

      // OBS overlay query (?overlay=1 bypasses active filter to animate drop-out)
      const overlayRes = await fetch(`${baseUrl}/api/public/live-match?overlay=1`);
      const overlayData = await overlayRes.json();
      assert.ok(overlayData.match, 'Overlay query ?overlay=1 must receive match object even when active=false');
      assert.equal(overlayData.match.active, false);
      assert.equal(overlayData.match.team1.name, 'Team A');
    });

    // =========================================================================
    // Combination 5: Halftime Side-Swap & Score Synchronization
    // =========================================================================
    await ctx.runTest('C5: Halftime side swap synchronization updates sides, round, and scores', async () => {
      // First half ending at round 12
      const round12Payload = {
        match: {
          active: true,
          status: 'LIVE',
          team1: { name: 'Los Primates', score: 8, side: 'ATT' },
          team2: { name: 'Los Chimpancés', score: 4, side: 'DEF' },
          map: 'Abyss',
          round: 12,
          format: 'BO3',
        },
      };
      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(round12Payload),
      });

      // Side swap at round 13
      const round13Payload = {
        match: {
          active: true,
          status: 'LIVE',
          team1: { name: 'Los Primates', score: 8, side: 'DEF' },
          team2: { name: 'Los Chimpancés', score: 4, side: 'ATT' },
          map: 'Abyss',
          round: 13,
          format: 'BO3',
        },
      };
      await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(round13Payload),
      });

      const res = await fetch(`${baseUrl}/api/public/live-match?overlay=1`);
      const data = await res.json();
      assert.equal(data.match.round, 13);
      assert.equal(data.match.team1.side, 'DEF');
      assert.equal(data.match.team2.side, 'ATT');
      assert.equal(data.match.team1.score, 8);
      assert.equal(data.match.team2.score, 4);
    });
  }

  restoreDataFiles();
  return ctx.summary();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runTier3Tests().then((summary) => {
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
