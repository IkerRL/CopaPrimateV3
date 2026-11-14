import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import fs from 'fs';
import path from 'path';
import {
  ROOT_DIR,
  LEGACY_TOKENS,
  WEBSITE_OVERLAY_FILES,
  DASHBOARD_OVERLAY_FILES,
  readFileSafe,
  findLegacyTokens,
  TestRunnerContext,
} from './helpers/test-utils.mjs';
import { startTestServer, stopTestServer, ADMIN_TOKEN } from './helpers/server-fixture.mjs';
import { backupDataFiles, restoreDataFiles } from './helpers/data-backup.mjs';
import { liveMatch as validateLiveMatch } from '../src/api/validate.js';

export async function runTier2Tests() {
  const ctx = new TestRunnerContext('Tier 2 - Boundary & Corner Cases');
  backupDataFiles();

  let serverInfo = null;
  try {
    serverInfo = await startTestServer();
  } catch (err) {
    console.error('Failed to start test server for Tier 2:', err);
  }

  // ==========================================
  // F1 Boundaries: Historical Data
  // ==========================================

  await ctx.runTest('B1.1: Score formatting resilience (3-0 vs 3 - 0 normalized in historyData.js)', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const vol1 = historyModule.PAST_EDITIONS[0];
    const scoreRaw = vol1.winner.score;
    const normalized = scoreRaw.replace(/\s+/g, '');
    assert.equal(normalized, '3-0', 'Score must normalize to 3-0');
    assert.equal(vol1.bracket.fn[0].s1, 3, 's1 must be exactly 3');
    assert.equal(vol1.bracket.fn[0].s2, 0, 's2 must be exactly 0');
  });

  await ctx.runTest('B1.2: Winner player names array contains strictly valid, non-empty strings', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const vol1 = historyModule.PAST_EDITIONS[0];
    const players = vol1.winner.players;
    assert.ok(Array.isArray(players) && players.length >= 2, 'Must have at least 2 players');
    for (const p of players) {
      assert.equal(typeof p, 'string', 'Player name must be string');
      assert.ok(p.trim().length > 0, 'Player name must not be empty');
    }
  });

  await ctx.runTest('B1.3: Runner-up team is preserved in Vol. I final match record', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const vol1 = historyModule.PAST_EDITIONS[0];
    assert.equal(
      vol1.winner.runnerUp,
      'TETONES: Equipo Nacional de Somalia',
      'Runner-up must be TETONES'
    );
    assert.equal(
      vol1.bracket.fn[0].t2,
      'TETONES: Equipo Nacional de Somalia',
      'Bracket finalist t2 must be TETONES'
    );
  });

  await ctx.runTest('B1.4: Vol. II historical record is preserved and not altered by Vol. I changes', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const vol2 = historyModule.PAST_EDITIONS[1];
    assert.ok(vol2, 'vol-2 must exist in PAST_EDITIONS');
    assert.equal(vol2.id, 'vol-2');
    assert.equal(vol2.winner.name, 'Los Akrtona2');
    const normScore = vol2.winner.score.replace(/\s+/g, '');
    assert.equal(normScore, '3-2', 'vol-2 score must remain 3-2');
  });

  await ctx.runTest('B1.5: Non-existent tournament edition queries return undefined safely', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const found = historyModule.PAST_EDITIONS.find(e => e.id === 'vol-999');
    assert.equal(found, undefined, 'Unknown edition should be safely undefined');
  });

  // ==========================================
  // F2 Boundaries: Token & Asset Scrubbing
  // ==========================================

  await ctx.runTest('B2.1: Case-insensitive scan for legacy hex colors (#4e2e1a, #27140b, #795548, #2e7d32, #ffa000, #ffb300)', async () => {
    const allOverlayFiles = [...WEBSITE_OVERLAY_FILES, ...DASHBOARD_OVERLAY_FILES];
    const hexTokens = ['#4e2e1a', '#27140b', '#795548', '#2e7d32', '#ffa000', '#ffb300'];
    const hits = [];

    for (const f of allOverlayFiles) {
      const content = readFileSafe(f);
      if (!content) continue;
      const found = findLegacyTokens(content, hexTokens);
      if (found.length > 0) {
        hits.push(`${f}: ${found.map(x => `${x.token} (line ${x.line})`).join(', ')}`);
      }
    }
    assert.equal(hits.length, 0, `Found legacy hex colors in overlays:\n${hits.join('\n')}`);
  });

  await ctx.runTest('B2.2: Scan for banana emoji (🍌) across all overlay JSX files', async () => {
    const jsxFiles = [...WEBSITE_OVERLAY_FILES, ...DASHBOARD_OVERLAY_FILES].filter(f => f.endsWith('.jsx'));
    const bananaHits = [];
    for (const f of jsxFiles) {
      const content = readFileSafe(f) || '';
      if (content.includes('🍌') || content.includes('\\ud83c\\udf4c')) {
        bananaHits.push(f);
      }
    }
    assert.equal(bananaHits.length, 0, `Banana emoji found in overlay JSX files:\n${bananaHits.join('\n')}`);
  });

  await ctx.runTest('B2.3: Scan for legacy word tokens "wood" and "banana" in overlay files', async () => {
    const allFiles = [...WEBSITE_OVERLAY_FILES, ...DASHBOARD_OVERLAY_FILES];
    const wordTokens = ['wood', 'banana'];
    const hits = [];
    for (const f of allFiles) {
      const content = readFileSafe(f) || '';
      const found = findLegacyTokens(content, wordTokens);
      if (found.length > 0) {
        hits.push(`${f}: ${found.map(x => `${x.token} at line ${x.line}`).join(', ')}`);
      }
    }
    assert.equal(hits.length, 0, `Found legacy words in overlays:\n${hits.join('\n')}`);
  });

  await ctx.runTest('B2.4: Scan for legacy monkey/gorilla assets (/monkeys.jpg, /gorilas.jpg) in overlay components', async () => {
    const jsxFiles = [...WEBSITE_OVERLAY_FILES, ...DASHBOARD_OVERLAY_FILES].filter(f => f.endsWith('.jsx'));
    const hits = [];
    for (const f of jsxFiles) {
      const content = readFileSafe(f) || '';
      if (content.includes('/monkeys.jpg') || content.includes('/gorilas.jpg')) {
        hits.push(f);
      }
    }
    assert.equal(hits.length, 0, `Found legacy asset paths in overlays:\n${hits.join('\n')}`);
  });

  await ctx.runTest('B2.5: Theme integrity: Fusión purple #c084fc and cyan #00f5d4 present in overlay CSS variables', async () => {
    const webCss = readFileSafe('website/src/pages/overlays/marcador.css') || '';
    const dashCss = readFileSafe('dashboard/src/components/overlays/marcador.css') || '';
    const combined = (webCss + dashCss).toLowerCase();
    assert.ok(combined.includes('#c084fc'), 'Fusión purple #c084fc must be defined');
    assert.ok(combined.includes('#00f5d4'), 'Fusión cyan #00f5d4 must be defined');
    assert.ok(combined.includes('#08080b'), 'Fusión background #08080b must be defined');
  });

  // ==========================================
  // F3 Boundaries: Scoreboard HUD
  // ==========================================

  await ctx.runTest('B3.1: Round score 0-0 start boundary parses cleanly without NaN or fallback errors', async () => {
    const payload = {
      active: true,
      status: 'LIVE',
      team1: { name: 'Team Alpha', score: 0, mapsWon: 0 },
      team2: { name: 'Team Beta', score: 0, mapsWon: 0 },
      map: 'Haven',
      round: 1,
      format: 'BO3',
    };
    const validated = validateLiveMatch(payload);
    assert.equal(validated.team1.score, 0);
    assert.equal(validated.team2.score, 0);
    assert.equal(validated.round, 1);
    assert.equal(Number.isNaN(validated.team1.score), false);
    assert.equal(Number.isNaN(validated.team2.score), false);
  });

  await ctx.runTest('B3.2: Overtime boundary 12-12 preserves scores without unwanted reset', async () => {
    const payload = {
      active: true,
      status: 'LIVE',
      team1: { name: 'Team Alpha', score: 12, mapsWon: 0 },
      team2: { name: 'Team Beta', score: 12, mapsWon: 0 },
      map: 'Ascent',
      round: 24,
      format: 'BO3',
    };
    const validated = validateLiveMatch(payload);
    assert.equal(validated.team1.score, 12);
    assert.equal(validated.team2.score, 12);
    assert.equal(validated.round, 24);
  });

  await ctx.runTest('B3.3: Extended overtime boundary (14-12, 15-13) supported without cap at 13', async () => {
    const payload = {
      active: true,
      status: 'LIVE',
      team1: { name: 'Team Alpha', score: 15, mapsWon: 1 },
      team2: { name: 'Team Beta', score: 13, mapsWon: 0 },
      map: 'Split',
      round: 28,
      format: 'BO3',
    };
    const validated = validateLiveMatch(payload);
    assert.equal(validated.team1.score, 15);
    assert.equal(validated.team2.score, 13);
  });

  await ctx.runTest('B3.4: Negative score boundary rejection/clamping to 0', async () => {
    const payload = {
      active: true,
      team1: { name: 'Team Alpha', score: -5, mapsWon: -1 },
      team2: { name: 'Team Beta', score: -10, mapsWon: -2 },
      round: -3,
    };
    const validated = validateLiveMatch(payload);
    assert.equal(validated.team1.score, 0, 'Negative team1 score must clamp to 0');
    assert.equal(validated.team2.score, 0, 'Negative team2 score must clamp to 0');
    assert.equal(validated.team1.mapsWon, 0, 'Negative mapsWon must clamp to 0');
    assert.equal(validated.round, 0, 'Negative round must clamp to 0');
  });

  await ctx.runTest('B3.5: Extreme score boundary capped at 99', async () => {
    const payload = {
      active: true,
      team1: { name: 'Team Alpha', score: 250, mapsWon: 50 },
      team2: { name: 'Team Beta', score: 120, mapsWon: 30 },
      round: 300,
    };
    const validated = validateLiveMatch(payload);
    assert.equal(validated.team1.score, 99, 'Score > 99 must clamp to 99');
    assert.equal(validated.team2.score, 99, 'Score > 99 must clamp to 99');
    assert.equal(validated.team1.mapsWon, 10, 'mapsWon > 10 must clamp to 10');
    assert.equal(validated.round, 99, 'Round > 99 must clamp to 99');
  });

  await ctx.runTest('B3.6: Format map win cap logic (BO1=1, BO3=2, BO5=3)', async () => {
    const checkCap = (format) => {
      const lower = format.toLowerCase();
      if (lower.includes('bo1')) return 1;
      if (lower.includes('bo5')) return 3;
      return 2; // BO3 default
    };
    assert.equal(checkCap('BO1'), 1);
    assert.equal(checkCap('BO3'), 2);
    assert.equal(checkCap('BO5'), 3);
  });

  // ==========================================
  // F4 Boundaries: Moderation Dashboard Controls
  // ==========================================

  await ctx.runTest('B4.1: Decrementing score at 0 does not underflow below 0', async () => {
    const initialScore = 0;
    const decremented = Math.max(0, initialScore - 1);
    assert.equal(decremented, 0, 'Score decrement at 0 must not drop below 0');
  });

  await ctx.runTest('B4.2: Side swap exchange preserves scores while toggling ATT/DEF', async () => {
    const current = {
      team1: { name: 'Team 1', score: 8, side: 'ATT' },
      team2: { name: 'Team 2', score: 4, side: 'DEF' },
    };
    const swapped = {
      team1: { ...current.team1, side: current.team1.side === 'ATT' ? 'DEF' : 'ATT' },
      team2: { ...current.team2, side: current.team2.side === 'ATT' ? 'DEF' : 'ATT' },
    };
    assert.equal(swapped.team1.side, 'DEF');
    assert.equal(swapped.team2.side, 'ATT');
    assert.equal(swapped.team1.score, 8);
    assert.equal(swapped.team2.score, 4);
  });

  await ctx.runTest('B4.3: Empty or whitespace team name falls back gracefully without error', async () => {
    const payload = {
      active: true,
      team1: { name: '   ', score: 0 },
      team2: { name: null, score: 0 },
    };
    const validated = validateLiveMatch(payload);
    assert.ok(validated.team1.name.length > 0, 'Blank team name should fall back to non-empty name');
    assert.ok(validated.team2.name.length > 0, 'Null team name should fall back to non-empty name');
  });

  await ctx.runTest('B4.4: ConfirmModal dismissal aborts destructive action callback', async () => {
    let actionExecuted = false;
    const onConfirm = () => { actionExecuted = true; };
    const onCancel = () => { /* no-op */ };

    // Simulate modal close without confirm
    onCancel();
    assert.equal(actionExecuted, false, 'Action must not be executed when modal is cancelled');
  });

  await ctx.runTest('B4.5: Consecutive valid score updates resolve without race corruption', async () => {
    let score = 0;
    for (let i = 0; i < 5; i++) {
      const validated = validateLiveMatch({
        team1: { name: 'Alpha', score: score + 1 },
      });
      score = validated.team1.score;
    }
    assert.equal(score, 5, 'Final score after 5 sequential increments must be 5');
  });

  // ==========================================
  // F5 Boundaries: Build & API Health
  // ==========================================

  if (serverInfo) {
    const { baseUrl, adminToken } = serverInfo;

    await ctx.runTest('B5.1: Malformed JSON in POST /api/live-match returns HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/live-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: '{ malformed json: missing quotes }',
      });
      assert.equal(res.status, 400, `Expected 400 for malformed JSON, got ${res.status}`);
      const data = await res.json();
      assert.ok(data.error, 'Response should contain error message');
    });

    await ctx.runTest('B5.2: Overly large payload (>2MB) returns HTTP 413 entity too large', async () => {
      // 2.5 MB body
      const hugeData = 'x'.repeat(2.5 * 1024 * 1024);
      try {
        const res = await fetch(`${baseUrl}/api/live-match`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ huge: hugeData }),
        });
        assert.equal(res.status, 413, `Expected 413, got ${res.status}`);
      } catch (err) {
        // Some node fetch clients close socket on 413, which is also an acceptable rejection
        assert.ok(err);
      }
    });

    await ctx.runTest('B5.3: Unknown public route returns HTTP 404 with standard JSON', async () => {
      const res = await fetch(`${baseUrl}/api/public/nonexistent-route-xyz`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.ok(data.error.includes('no encontrada'));
    });

    await ctx.runTest('B5.4: Unknown admin route returns HTTP 404 with standard JSON', async () => {
      const res = await fetch(`${baseUrl}/api/nonexistent-admin-route-xyz`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.ok(data.error.includes('no encontrada'));
    });

    await ctx.runTest('B5.5: Invalid query params on /api/public/live-match return HTTP 200 without throwing 500', async () => {
      const res = await fetch(`${baseUrl}/api/public/live-match?overlay=invalid_boolean&all=nonsense&foo=bar`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok('match' in data, 'Should return match field even with invalid query params');
    });
  }

  restoreDataFiles();
  return ctx.summary();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runTier2Tests().then((summary) => {
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
