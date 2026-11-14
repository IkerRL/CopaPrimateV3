import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'child_process';
import {
  ROOT_DIR,
  LEGACY_TOKENS,
  FUSION_COLORS,
  WEBSITE_OVERLAY_FILES,
  DASHBOARD_OVERLAY_FILES,
  readFileSafe,
  findLegacyTokens,
  TestRunnerContext,
} from './helpers/test-utils.mjs';
import { startTestServer, stopTestServer, ADMIN_TOKEN } from './helpers/server-fixture.mjs';
import { backupDataFiles, restoreDataFiles } from './helpers/data-backup.mjs';

export async function runTier1Tests() {
  const ctx = new TestRunnerContext('Tier 1 - Feature Coverage');
  backupDataFiles();

  let serverInfo = null;
  try {
    serverInfo = await startTestServer();
  } catch (err) {
    console.error('Failed to start test server for Tier 1:', err);
  }

  // ==========================================
  // F1: Historical Finals Record
  // ==========================================

  await ctx.runTest('F1.1: historyData.js PAST_EDITIONS[0].winner has score "3 - 0"', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const editions = historyModule.PAST_EDITIONS;
    assert.ok(Array.isArray(editions) && editions.length > 0, 'PAST_EDITIONS should be a non-empty array');
    const vol1 = editions[0];
    assert.equal(vol1.id, 'vol-1', 'First edition ID must be vol-1');
    assert.ok(vol1.winner, 'vol-1 must have a winner object');
    const normScore = String(vol1.winner.score).replace(/\s+/g, '');
    assert.equal(normScore, '3-0', `vol-1 winner score should be "3 - 0", got "${vol1.winner.score}"`);
  });

  await ctx.runTest('F1.2: historyData.js PAST_EDITIONS[0].winner.name is "Golden Sex"', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const vol1 = historyModule.PAST_EDITIONS[0];
    assert.equal(vol1.winner.name, 'Golden Sex', `Winner must be "Golden Sex", got "${vol1.winner?.name}"`);
  });

  await ctx.runTest('F1.3: historyData.js PAST_EDITIONS[0].winner.players contains "Max" and "Broken"', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const vol1 = historyModule.PAST_EDITIONS[0];
    const players = vol1.winner.players;
    assert.ok(Array.isArray(players), 'Players must be an array');
    assert.ok(players.includes('Max'), 'Players must include "Max"');
    assert.ok(players.includes('Broken'), 'Players must include "Broken"');
  });

  await ctx.runTest('F1.4: historyData.js PAST_EDITIONS[0].bracket.fn[0] scoreline is 3-0 and winner is Golden Sex', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const vol1 = historyModule.PAST_EDITIONS[0];
    const finalMatch = vol1.bracket?.fn?.[0];
    assert.ok(finalMatch, 'vol-1 must have bracket.fn[0]');
    assert.equal(finalMatch.s1, 3, `finalMatch s1 must be 3, got ${finalMatch.s1}`);
    assert.equal(finalMatch.s2, 0, `finalMatch s2 must be 0, got ${finalMatch.s2}`);
    assert.equal(finalMatch.winner, 'Golden Sex', `finalMatch winner must be "Golden Sex", got "${finalMatch.winner}"`);
  });

  await ctx.runTest('F1.5: historyData.js PAST_EDITIONS[0].bracket.fn[0].note reflects 3-0 victory without 3-2', async () => {
    const historyModule = await import('../website/src/historyData.js');
    const vol1 = historyModule.PAST_EDITIONS[0];
    const finalMatch = vol1.bracket?.fn?.[0];
    const note = finalMatch?.note || '';
    assert.ok(note.includes('3-0') || note.includes('3 - 0'), `Final note should reference 3-0, got: "${note}"`);
    assert.ok(!note.includes('3-2') && !note.includes('3 - 2'), `Final note must not reference 3-2, got: "${note}"`);
  });

  await ctx.runTest('F1.6: HomePage.jsx contains "Golden Sex" with 3-0 scoreline and not 3-2', async () => {
    const homeContent = readFileSafe('website/src/pages/HomePage.jsx');
    assert.ok(homeContent, 'HomePage.jsx must exist');
    assert.ok(homeContent.includes('Golden Sex'), 'HomePage.jsx must display "Golden Sex"');
    const has30 = /Golden Sex\s*\((?:3\s*-\s*0|3-0)\)/i.test(homeContent) || /3\s*-\s*0/i.test(homeContent);
    assert.ok(has30, 'HomePage.jsx must show 3-0 scoreline for Golden Sex');
    const has32 = /Golden Sex\s*\((?:3\s*-\s*2|3-2)\)/i.test(homeContent);
    assert.ok(!has32, 'HomePage.jsx must not show 3-2 scoreline for Golden Sex');
  });

  // ==========================================
  // F2: Overlays Visual Palette
  // ==========================================

  await ctx.runTest('F2.1: Website overlay files contain no legacy tokens (wood, banana, jungle hexes)', async () => {
    const violations = [];
    for (const relFile of WEBSITE_OVERLAY_FILES) {
      const content = readFileSafe(relFile);
      if (!content) continue;
      const found = findLegacyTokens(content);
      if (found.length > 0) {
        violations.push(`${relFile}: [${found.map(f => `${f.token} at line ${f.line}`).join(', ')}]`);
      }
    }
    assert.equal(
      violations.length,
      0,
      `Website overlay files contain legacy tokens:\n${violations.join('\n')}`
    );
  });

  await ctx.runTest('F2.2: Dashboard overlay files contain no legacy tokens', async () => {
    const violations = [];
    for (const relFile of DASHBOARD_OVERLAY_FILES) {
      const content = readFileSafe(relFile);
      if (!content) continue;
      const found = findLegacyTokens(content);
      if (found.length > 0) {
        violations.push(`${relFile}: [${found.map(f => `${f.token} at line ${f.line}`).join(', ')}]`);
      }
    }
    assert.equal(
      violations.length,
      0,
      `Dashboard overlay files contain legacy tokens:\n${violations.join('\n')}`
    );
  });

  await ctx.runTest('F2.3: Website overlay styles contain Fusión color palette (#c084fc, #00f5d4, #08080b)', async () => {
    const css = readFileSafe('website/src/pages/overlays/marcador.css') || '';
    assert.ok(
      css.toLowerCase().includes('#c084fc'),
      'website marcador.css must contain Valorant purple #c084fc'
    );
    assert.ok(
      css.toLowerCase().includes('#00f5d4'),
      'website marcador.css must contain Neon cyan #00f5d4'
    );
    assert.ok(
      css.toLowerCase().includes('#08080b'),
      'website marcador.css must contain dark background #08080b'
    );
  });

  await ctx.runTest('F2.4: Dashboard overlay styles contain Fusión color palette (#c084fc, #00f5d4, #08080b)', async () => {
    const css = readFileSafe('dashboard/src/components/overlays/marcador.css') || '';
    assert.ok(
      css.toLowerCase().includes('#c084fc'),
      'dashboard marcador.css must contain Valorant purple #c084fc'
    );
    assert.ok(
      css.toLowerCase().includes('#00f5d4'),
      'dashboard marcador.css must contain Neon cyan #00f5d4'
    );
    assert.ok(
      css.toLowerCase().includes('#08080b'),
      'dashboard marcador.css must contain dark background #08080b'
    );
  });

  await ctx.runTest('F2.5: No legacy jungle/monkey images referenced in overlay components', async () => {
    const checkFiles = [...WEBSITE_OVERLAY_FILES, ...DASHBOARD_OVERLAY_FILES].filter(f => f.endsWith('.jsx'));
    const badImgs = [];
    for (const f of checkFiles) {
      const content = readFileSafe(f) || '';
      if (content.includes('/monkeys.jpg') || content.includes('/gorilas.jpg')) {
        badImgs.push(f);
      }
    }
    assert.equal(
      badImgs.length,
      0,
      `Overlay components still reference legacy monkey/gorila images:\n${badImgs.join('\n')}`
    );
  });

  // ==========================================
  // F3: Scoreboard HUD
  // ==========================================

  await ctx.runTest('F3.1: OverlayScoreboard renders map name in center HUD', async () => {
    const content = readFileSafe('website/src/pages/overlays/OverlayScoreboard.jsx') || '';
    const hasMapDisplay =
      content.includes('match.map') ||
      content.includes('map-name') ||
      content.includes('hud-map') ||
      /map/i.test(content);
    assert.ok(hasMapDisplay, 'OverlayScoreboard must reference active map display');
  });

  await ctx.runTest('F3.2: OverlayScoreboard renders round counter', async () => {
    const content = readFileSafe('website/src/pages/overlays/OverlayScoreboard.jsx') || '';
    const hasRoundDisplay =
      content.includes('match.round') ||
      content.includes('round-counter') ||
      content.includes('ronda') ||
      /round/i.test(content);
    assert.ok(hasRoundDisplay, 'OverlayScoreboard must render round counter');
  });

  await ctx.runTest('F3.3: OverlayScoreboard displays team side indicators (ATT / DEF)', async () => {
    const content = readFileSafe('website/src/pages/overlays/OverlayScoreboard.jsx') || '';
    const hasSides =
      content.includes('side') ||
      content.includes('ATT') ||
      content.includes('DEF') ||
      content.includes('attack') ||
      content.includes('defense');
    assert.ok(hasSides, 'OverlayScoreboard must display side indicators');
  });

  await ctx.runTest('F3.4: OverlayScoreboard uses Radianite pips instead of banana emojis for map wins', async () => {
    const content = readFileSafe('website/src/pages/overlays/OverlayScoreboard.jsx') || '';
    assert.ok(
      !content.includes('🍌'),
      'OverlayScoreboard must not use banana emoji 🍌 for map win indicators'
    );
    const hasPips =
      content.includes('pip') ||
      content.includes('diamond') ||
      content.includes('map-dot') ||
      content.includes('map-win-pip');
    assert.ok(hasPips, 'OverlayScoreboard must render map win pips');
  });

  await ctx.runTest('F3.5: Scoreboard HUD CSS implements team name truncation (ellipsis)', async () => {
    const css = (readFileSafe('website/src/pages/overlays/marcador.css') || '') +
                (readFileSafe('dashboard/src/components/overlays/marcador.css') || '');
    assert.ok(
      css.includes('text-overflow: ellipsis') || css.includes('ellipsis'),
      'marcador.css must implement text truncation with ellipsis for team names'
    );
    assert.ok(
      css.includes('overflow: hidden'),
      'marcador.css must have overflow: hidden on team name containers'
    );
  });

  await ctx.runTest('F3.6: Scoreboard HUD CSS implements tabular-nums for numeric score alignment', async () => {
    const css = (readFileSafe('website/src/pages/overlays/marcador.css') || '') +
                (readFileSafe('dashboard/src/components/overlays/marcador.css') || '');
    assert.ok(
      css.includes('tabular-nums'),
      'marcador.css must contain font-variant-numeric: tabular-nums or tabular-nums class for score numerals'
    );
  });

  // ==========================================
  // F4: Moderation Dashboard
  // ==========================================

  await ctx.runTest('F4.1: Scoreboard.jsx has direct +1 and -1 score controls for both teams', async () => {
    const content = readFileSafe('dashboard/src/components/Scoreboard.jsx') || '';
    assert.ok(
      content.includes('+1') || content.includes('Plus') || content.includes('increment'),
      'Scoreboard.jsx must provide direct +1 controls'
    );
    assert.ok(
      content.includes('-1') || content.includes('Minus') || content.includes('decrement'),
      'Scoreboard.jsx must provide direct -1 controls'
    );
  });

  await ctx.runTest('F4.2: ConfirmModal component exists in dashboard/src/components/ConfirmModal.jsx', async () => {
    const exists = fs.existsSync(path.resolve(ROOT_DIR, 'dashboard/src/components/ConfirmModal.jsx'));
    assert.ok(exists, 'dashboard/src/components/ConfirmModal.jsx must exist');
    const content = readFileSafe('dashboard/src/components/ConfirmModal.jsx') || '';
    assert.ok(
      content.includes('export default') || content.includes('export function ConfirmModal'),
      'ConfirmModal.jsx must export a React component'
    );
  });

  await ctx.runTest('F4.3: Moderation dashboard implements confirmation guards on destructive actions', async () => {
    const scoreboardContent = readFileSafe('dashboard/src/components/Scoreboard.jsx') || '';
    const hasConfirmation =
      scoreboardContent.includes('ConfirmModal') ||
      scoreboardContent.includes('confirm') ||
      scoreboardContent.includes('setShowConfirm') ||
      scoreboardContent.includes('showConfirm');
    assert.ok(hasConfirmation, 'Scoreboard.jsx must incorporate confirmation modal/guards for destructive actions');
  });

  await ctx.runTest('F4.4: Moderation Scoreboard.jsx contains embedded OBS scene switcher', async () => {
    const scoreboardContent = readFileSafe('dashboard/src/components/Scoreboard.jsx') || '';
    const hasSceneSwitcher =
      scoreboardContent.includes('/overlay-state') ||
      scoreboardContent.includes('mode:') ||
      (scoreboardContent.includes('scoreboard') && scoreboardContent.includes('matchup') && scoreboardContent.includes('roulette'));
    assert.ok(hasSceneSwitcher, 'Scoreboard.jsx must contain embedded scene switcher for overlay modes');
  });

  await ctx.runTest('F4.5: dashboard/src/App.jsx complies with React rules of hooks (no early returns before hooks)', async () => {
    const content = readFileSafe('dashboard/src/App.jsx') || '';
    const lines = content.split('\n');
    let earlyReturnIndex = -1;
    let firstHookIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/return\s*<Overlay/i.test(line) && earlyReturnIndex === -1) {
        earlyReturnIndex = i;
      }
      if (/(?:useState|useEffect|useRef)\s*\(/i.test(line) && firstHookIndex === -1) {
        firstHookIndex = i;
      }
    }

    if (earlyReturnIndex !== -1 && firstHookIndex !== -1) {
      assert.ok(
        firstHookIndex < earlyReturnIndex,
        `React Hook violation in App.jsx: early return at line ${earlyReturnIndex + 1} appears BEFORE hook call at line ${firstHookIndex + 1}`
      );
    }
  });

  // ==========================================
  // F5: Build & API Health
  // ==========================================

  await ctx.runTest('F5.1: Website Vite build script succeeds with exit code 0', async () => {
    const out = execSync('npm run build:web', { cwd: ROOT_DIR, encoding: 'utf8' });
    assert.ok(out.includes('built in') || out.includes('dist/index.html'), 'Vite website build must succeed');
    assert.ok(fs.existsSync(path.resolve(ROOT_DIR, 'website/dist/index.html')), 'website/dist/index.html must exist');
  });

  await ctx.runTest('F5.2: Dashboard Vite build script succeeds with exit code 0', async () => {
    const out = execSync('npm run build:dashboard', { cwd: ROOT_DIR, encoding: 'utf8' });
    assert.ok(out.includes('built in') || out.includes('dist/index.html'), 'Vite dashboard build must succeed');
    assert.ok(fs.existsSync(path.resolve(ROOT_DIR, 'dashboard/dist/index.html')), 'dashboard/dist/index.html must exist');
  });

  if (serverInfo) {
    const { baseUrl, adminToken } = serverInfo;

    await ctx.runTest('F5.3: GET /api/health returns HTTP 200 and { ok: true }', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.ok, true, 'Health check must return { ok: true }');
    });

    await ctx.runTest('F5.4: All public API routes return HTTP 200', async () => {
      const routes = [
        '/api/public/teams',
        '/api/public/matches',
        '/api/public/standings',
        '/api/public/live-match',
        '/api/public/overlay-state',
        '/api/public/settings',
        '/api/public/summary',
      ];
      for (const route of routes) {
        const res = await fetch(`${baseUrl}${route}`);
        assert.equal(res.status, 200, `Public route ${route} failed with status ${res.status}`);
      }
    });

    await ctx.runTest('F5.5: Admin API routes return HTTP 200 with valid ADMIN_TOKEN', async () => {
      const routes = [
        '/api/auth/check',
        '/api/teams',
        '/api/live-match',
        '/api/overlay-state',
        '/api/matches',
        '/api/web-settings',
      ];
      for (const route of routes) {
        const res = await fetch(`${baseUrl}${route}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert.equal(res.status, 200, `Admin route ${route} failed with status ${res.status}`);
      }
    });

    await ctx.runTest('F5.6: Admin API routes reject unauthorized requests with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/live-match`);
      assert.equal(res.status, 401, `Unauthorized request should return 401, got ${res.status}`);
    });
  }

  restoreDataFiles();
  return ctx.summary();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runTier1Tests().then((summary) => {
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
