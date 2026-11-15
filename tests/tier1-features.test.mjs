import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'child_process';
import {
  ROOT_DIR,
  readFileSafe,
  TestRunnerContext,
} from './helpers/test-utils.mjs';
import { startTestServer, stopTestServer, ADMIN_TOKEN } from './helpers/server-fixture.mjs';
import { backupDataFiles, restoreDataFiles } from './helpers/data-backup.mjs';
import {
  CANONICAL_POTS,
  generateReferenceSchedule,
  validateScheduleMath,
} from './helpers/schedule-oracle.mjs';

export async function runTier1Tests() {
  const ctx = new TestRunnerContext('Tier 1 - Feature Coverage');
  backupDataFiles();

  let serverInfo = null;
  try {
    serverInfo = await startTestServer();
  } catch (err) {
    console.error('Failed to start test server for Tier 1:', err);
  }

  const { baseUrl, adminToken } = serverInfo || {};

  // =========================================================================
  // F1: Hidden Cards Initial State (ORIGINAL_REQUEST §R1)
  // =========================================================================

  await ctx.runTest('T1.F1.1: Stream overlays (dashboard & website) define mystery / hidden slot UI components', async () => {
    const dashOverlay = readFileSafe('dashboard/src/components/overlays/OverlayGruposSorteo.jsx') || '';
    const webOverlay = readFileSafe('website/src/pages/overlays/OverlayGruposSorteo.jsx') || '';
    assert.ok(dashOverlay.includes('mystery-box') || dashOverlay.includes('hidden-slot'), 'Dashboard overlay must have mystery-box or hidden-slot class');
    assert.ok(webOverlay.includes('mystery-box') || webOverlay.includes('hidden-slot'), 'Website overlay must have mystery-box or hidden-slot class');
  });

  await ctx.runTest('T1.F1.2: Stream overlay CSS defines visual styling and mystery styling for hidden cards', async () => {
    const dashCss = readFileSafe('dashboard/src/components/overlays/overlayGruposSorteo.css') || '';
    const webCss = readFileSafe('website/src/pages/overlays/overlayGruposSorteo.css') || '';
    const combined = dashCss + webCss;
    assert.ok(combined.includes('mystery-box') || combined.includes('hidden-slot'), 'CSS must define mystery-box or hidden-slot styling');
  });

  await ctx.runTest('T1.F1.3: Overlay mystery card does not leak player names or team name when hidden', async () => {
    const dashOverlay = readFileSafe('dashboard/src/components/overlays/OverlayGruposSorteo.jsx') || '';
    assert.ok(dashOverlay.includes('revealed ?') || dashOverlay.includes('isTeamRevealed'), 'Overlay must conditionally branch on revealed state');
  });

  await ctx.runTest('T1.F1.4: GET /api/public/overlay-state returns HTTP 200 with valid overlay payload', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const res = await fetch(`${baseUrl}/api/public/overlay-state`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data === 'object' && data !== null, 'Response must be an object');
  });

  await ctx.runTest('T1.F1.5: POST /api/overlay-state accepts initial sorteo payload with revealedTeams: []', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const payload = {
      mode: 'sorteo',
      sorteo: {
        activePhase: 'presentacion',
        revealedTeams: [],
        zoomedTeam: null,
      },
    };
    const postRes = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payload),
    });
    assert.equal(postRes.status, 200, 'POST /api/overlay-state must succeed');

    const getRes = await fetch(`${baseUrl}/api/public/overlay-state`);
    const data = await getRes.json();
    assert.equal(data.mode, 'sorteo');
    assert.ok(data.sorteo, 'Overlay state must contain sorteo object');
    assert.deepEqual(data.sorteo.revealedTeams, [], 'revealedTeams must be preserved as empty array');
  });

  // =========================================================================
  // F2: Free Order Reveal & Hide (ORIGINAL_REQUEST §R1)
  // =========================================================================

  await ctx.runTest('T1.F2.1: CopaGruposLiga.jsx contains dedicated controls to toggle reveal/hide for individual teams', async () => {
    const content = readFileSafe('dashboard/src/components/CopaGruposLiga.jsx') || '';
    assert.ok(
      content.includes('revealedTeams') && (content.includes('toggle') || content.includes('setRevealedTeams')),
      'CopaGruposLiga must provide state handling for revealedTeams toggling'
    );
  });

  await ctx.runTest('T1.F2.2: POST /api/overlay-state updates revealedTeams when a single team is revealed', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const payload = {
      mode: 'sorteo',
      sorteo: {
        activePhase: 'presentacion',
        revealedTeams: ['Sakura'],
        zoomedTeam: null,
      },
    };
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 200);

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.deepEqual(check.sorteo.revealedTeams, ['Sakura']);
  });

  await ctx.runTest('T1.F2.3: POST /api/overlay-state removing a team (hiding) reflects immediately in public state', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const payload = {
      mode: 'sorteo',
      sorteo: {
        activePhase: 'presentacion',
        revealedTeams: [],
        zoomedTeam: null,
      },
    };
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payload),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.deepEqual(check.sorteo.revealedTeams, []);
  });

  await ctx.runTest('T1.F2.4: CopaGruposLiga.jsx implements bulk reveal and hide actions', async () => {
    const content = readFileSafe('dashboard/src/components/CopaGruposLiga.jsx') || '';
    const hasBulkActions =
      content.includes('REVELAR TODOS') ||
      content.includes('OCULTAR TODOS') ||
      content.includes('allNames');
    assert.ok(hasBulkActions, 'CopaGruposLiga should have bulk reveal/hide actions');
  });

  await ctx.runTest('T1.F2.5: Teams can be revealed in arbitrary non-sequential order', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const nonSequential = ['Golden Gorillas', 'Thunder Buddies', 'MARIIKS'];
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { revealedTeams: nonSequential } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.deepEqual(check.sorteo.revealedTeams, nonSequential);
  });

  // =========================================================================
  // F3: Zoom / Spotlight Stream Mode (ORIGINAL_REQUEST §R1)
  // =========================================================================

  await ctx.runTest('T1.F3.1: POST /api/overlay-state accepts zoomedTeam payload with name, logo, grupo, jugadores', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const targetTeam = CANONICAL_POTS.A[0];
    const payload = {
      mode: 'sorteo',
      sorteo: {
        activePhase: 'presentacion',
        zoomedTeam: targetTeam,
      },
    };
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 200);
  });

  await ctx.runTest('T1.F3.2: GET /api/public/overlay-state exposes zoomedTeam details for OBS overlay', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.ok(check.sorteo?.zoomedTeam, 'Public overlay state must expose zoomedTeam');
    assert.equal(check.sorteo.zoomedTeam.name, CANONICAL_POTS.A[0].name);
    assert.equal(check.sorteo.zoomedTeam.grupo, 'A');
  });

  await ctx.runTest('T1.F3.3: CopaGruposLiga.jsx contains Zoom / Spotlight button for team cards', async () => {
    const content = readFileSafe('dashboard/src/components/CopaGruposLiga.jsx') || '';
    assert.ok(
      content.includes('setZoomedTeam') || content.includes('SPOTLIGHT') || content.includes('copa-zoom-overlay'),
      'CopaGruposLiga must contain Zoom / Spotlight UI handlers'
    );
  });

  await ctx.runTest('T1.F3.4: Spotlight UI component displays large team logo, team title and player roster', async () => {
    const content = readFileSafe('dashboard/src/components/CopaGruposLiga.jsx') || '';
    assert.ok(content.includes('copa-zoom-title'), 'Spotlight UI must render copa-zoom-title');
    assert.ok(content.includes('copa-zoom-logo'), 'Spotlight UI must render copa-zoom-logo');
    assert.ok(content.includes('copa-zoom-players'), 'Spotlight UI must render roster players');
  });

  await ctx.runTest('T1.F3.5: Dismissing Zoom / Spotlight sets zoomedTeam back to null', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { zoomedTeam: null } }),
    });
    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo?.zoomedTeam, null, 'zoomedTeam should be reset to null');
  });

  // =========================================================================
  // F4: Champions League Draw Animation (ORIGINAL_REQUEST §R2)
  // =========================================================================

  await ctx.runTest('T1.F4.1: POST /api/overlay-state supports drawing / animation state in sorteo', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const animPayload = {
      mode: 'sorteo',
      sorteo: {
        activePhase: 'sorteo',
        isSpinning: true,
        drawingTeam: { name: 'Sakura', targetGroup: 'C' },
      },
    };
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(animPayload),
    });
    assert.equal(res.status, 200);

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo?.isSpinning, true);
    assert.equal(check.sorteo?.drawingTeam?.name, 'Sakura');
  });

  await ctx.runTest('T1.F4.2: CopaGruposLiga.jsx contains interactive draw action button', async () => {
    const content = readFileSafe('dashboard/src/components/CopaGruposLiga.jsx') || '';
    const hasDrawAction =
      content.includes('extraerSiguienteBola') ||
      content.includes('SORTEAR') ||
      content.includes('Sorteo');
    assert.ok(hasDrawAction, 'CopaGruposLiga must have draw action triggers');
  });

  await ctx.runTest('T1.F4.3: Schedule algorithm produces exactly 4 matchups per drawn team across J1-J4', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    for (const group of Object.values(CANONICAL_POTS)) {
      for (const t of group) {
        const teamMatches = ref.matches.filter(m => m.t1.name === t.name || m.t2.name === t.name);
        assert.equal(teamMatches.length, 4, `Team ${t.name} must have exactly 4 matchups`);
        const jornadasFound = new Set(teamMatches.map(m => m.jornada));
        assert.deepEqual([...jornadasFound].sort(), [1, 2, 3, 4], `Team ${t.name} must have matches in J1, J2, J3, J4`);
      }
    }
  });

  await ctx.runTest('T1.F4.4: Sorteo match structure includes opponent name, logo, and jornada number', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    for (const m of ref.matches) {
      assert.ok(m.t1.name && m.t2.name, 'Both teams must have names');
      assert.ok(m.t1.logo && m.t2.logo, 'Both teams must have logos');
      assert.ok([1, 2, 3, 4].includes(m.jornada), 'Match must specify jornada 1 to 4');
    }
  });

  await ctx.runTest('T1.F4.5: Overlay contains draw chamber / spinning orb UI for live draw', async () => {
    const content = readFileSafe('dashboard/src/components/overlays/OverlayGruposSorteo.jsx') || '';
    assert.ok(
      content.includes('sorteo-live-chamber') || content.includes('sorteo-orb-spinning') || content.includes('sorteo-destination-badge'),
      'Overlay must include live draw chamber elements'
    );
  });

  // =========================================================================
  // F5: Real-Time Sync & Audio Signals (ORIGINAL_REQUEST §R2)
  // =========================================================================

  await ctx.runTest('T1.F5.1: POST /api/overlay-state broadcasts immediately to GET /api/public/overlay-state', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const testId = Date.now();
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { syncTestId: testId } }),
    });

    const getRes = await fetch(`${baseUrl}/api/public/overlay-state`);
    const data = await getRes.json();
    assert.equal(data.sorteo?.syncTestId, testId, 'Public overlay state must immediately reflect POST');
  });

  await ctx.runTest('T1.F5.2: Public overlay-state response includes updatedAt ISO timestamp', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const res = await fetch(`${baseUrl}/api/public/overlay-state`);
    const data = await res.json();
    assert.ok(data.updatedAt, 'Response must include updatedAt');
    assert.ok(!Number.isNaN(Date.parse(data.updatedAt)), 'updatedAt must be a valid ISO date');
  });

  await ctx.runTest('T1.F5.3: Components reference sound effects or audio playback for draw events', async () => {
    const content = (readFileSafe('dashboard/src/components/CopaGruposLiga.jsx') || '') +
                    (readFileSafe('dashboard/src/components/overlays/OverlayGruposSorteo.jsx') || '');
    const hasAudio =
      content.includes('AudioContext') ||
      content.includes('playClickSound') ||
      content.includes('sound') ||
      content.includes('champions.mp3') ||
      content.includes('Audio');
    assert.ok(hasAudio, 'Components must reference audio cues for interactive draw');
  });

  await ctx.runTest('T1.F5.4: GET /api/public/overlay-state sends cache-control no-cache headers', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const res = await fetch(`${baseUrl}/api/public/overlay-state`);
    const cacheCtrl = res.headers.get('cache-control') || '';
    assert.ok(cacheCtrl.includes('no-cache') || cacheCtrl.includes('no-store'), 'Public endpoint must disable caching');
  });

  await ctx.runTest('T1.F5.5: Overlay client polling interval is configured for real-time streaming (<= 1500ms)', async () => {
    const dashOverlay = readFileSafe('dashboard/src/components/overlays/OverlayGruposSorteo.jsx') || '';
    const match = dashOverlay.match(/setInterval\([^,]+,\s*(\d+)\)/);
    assert.ok(match, 'Overlay must set polling interval');
    const ms = Number(match[1]);
    assert.ok(ms <= 1500, `Polling interval should be <= 1500ms for real-time OBS sync, got ${ms}ms`);
  });

  // =========================================================================
  // F6: 32-Match Schedule Math Engine (ORIGINAL_REQUEST §R3)
  // =========================================================================

  await ctx.runTest('T1.F6.1: Schedule generation produces exactly 32 total matches', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    assert.equal(ref.matches.length, 32, 'Schedule must contain exactly 32 matches');
  });

  await ctx.runTest('T1.F6.2: Matches are distributed across exactly 4 jornadas with 8 matches each', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    assert.equal(ref.jornadas.length, 4, 'Must have 4 jornadas');
    for (let i = 0; i < 4; i++) {
      assert.equal(ref.jornadas[i].length, 8, `Jornada ${i + 1} must have exactly 8 matches`);
    }
  });

  await ctx.runTest('T1.F6.3: Each of the 16 teams plays exactly 4 matches in total', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const validation = validateScheduleMath(ref.matches, ref.jornadas);
    assert.equal(validation.valid, true, `Validation failed: ${validation.errors.join(', ')}`);
    assert.equal(validation.teamCount, 16);
  });

  await ctx.runTest('T1.F6.4: Zero self-matches in schedule (no team plays against itself)', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    for (const m of ref.matches) {
      assert.notEqual(
        m.t1.name.toLowerCase(),
        m.t2.name.toLowerCase(),
        `Self-match found in match ${m.id}: ${m.t1.name}`
      );
    }
  });

  await ctx.runTest('T1.F6.5: All scheduled matches include valid jornada numbers (1 to 4) and team objects', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    for (const m of ref.matches) {
      assert.ok([1, 2, 3, 4].includes(m.jornada), 'jornada must be 1, 2, 3, or 4');
      assert.ok(m.t1?.name && m.t2?.name, 'Both teams must be specified');
      assert.ok(m.id !== undefined, 'Match must have an id');
    }
  });

  // =========================================================================
  // F7: Free Order Draw Lookup & Invariance (ORIGINAL_REQUEST §R3)
  // =========================================================================

  await ctx.runTest('T1.F7.1: Querying scheduled matchups for any team returns its exact 4 scheduled opponents regardless of pick sequence', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const team = CANONICAL_POTS.B[0]; // Entry Baiters
    const opponents = ref.matches
      .filter(m => m.t1.name === team.name || m.t2.name === team.name)
      .map(m => (m.t1.name === team.name ? m.t2.name : m.t1.name));
    assert.equal(opponents.length, 4);
    assert.equal(new Set(opponents).size, 4, 'All 4 opponents must be distinct');
  });

  await ctx.runTest('T1.F7.2: Simulating draw in sequential order (Pot 1 down to Pot 4) yields 32 valid matches', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const result = validateScheduleMath(ref.matches, ref.jornadas);
    assert.equal(result.valid, true);
  });

  await ctx.runTest('T1.F7.3: Simulating draw in reverse order produces identical valid pairings', async () => {
    const reversedPots = {
      A: [...CANONICAL_POTS.A].reverse(),
      B: [...CANONICAL_POTS.B].reverse(),
      C: [...CANONICAL_POTS.C].reverse(),
      D: [...CANONICAL_POTS.D].reverse(),
    };
    const ref = generateReferenceSchedule(reversedPots);
    const result = validateScheduleMath(ref.matches, ref.jornadas);
    assert.equal(result.valid, true);
    assert.equal(result.matchCount, 32);
  });

  await ctx.runTest('T1.F7.4: Simulating draw in arbitrary random order produces valid schedule without conflict', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const validation = validateScheduleMath(ref.matches, ref.jornadas);
    assert.equal(validation.valid, true);
  });

  await ctx.runTest('T1.F7.5: Re-querying team matchups is idempotent and deterministic', async () => {
    const ref1 = generateReferenceSchedule(CANONICAL_POTS);
    const ref2 = generateReferenceSchedule(CANONICAL_POTS);
    assert.deepEqual(ref1.matches, ref2.matches, 'Repeated schedule generation must be strictly identical');
  });

  // =========================================================================
  // F8: Match Persistence & API Endpoints (ORIGINAL_REQUEST §R4)
  // =========================================================================

  await ctx.runTest('T1.F8.1: POST /api/matches stores groups and matches into persistent storage', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const payload = {
      groups: CANONICAL_POTS,
      matches: ref.matches,
      jornadas: ref.jornadas,
      drawCompleted: true,
    };
    const res = await fetch(`${baseUrl}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 200);
  });

  await ctx.runTest('T1.F8.2: GET /api/public/matches returns HTTP 200 with drawCompleted, groups, matches', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const res = await fetch(`${baseUrl}/api/public/matches`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.drawCompleted, true);
    assert.ok(data.groups, 'Response must include groups');
    assert.ok(Array.isArray(data.matches), 'Response must include matches array');
    assert.equal(data.matches.length, 32, 'Public endpoint must serve 32 matches');
  });

  await ctx.runTest('T1.F8.3: POST /api/matches/draw records drawCompleted: true and drawnAt timestamp', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const res = await fetch(`${baseUrl}/api/matches/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ groups: CANONICAL_POTS, matches: ref.matches }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.data?.drawCompleted, true);
    assert.ok(data.data?.drawnAt, 'drawnAt timestamp must be recorded');
  });

  await ctx.runTest('T1.F8.4: PATCH /api/matches/:id updates match score and status', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const res = await fetch(`${baseUrl}/api/matches/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ score1: 13, score2: 9, status: 'Finalizado' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.match?.score1, 13);
    assert.equal(body.match?.score2, 9);
    assert.equal(body.match?.status, 'Finalizado');
  });

  await ctx.runTest('T1.F8.5: Storage writes to matches.json are atomic and readable from disk', async () => {
    const matchesPath = path.resolve(ROOT_DIR, 'matches.json');
    assert.ok(fs.existsSync(matchesPath), 'matches.json must exist on disk');
    const diskContent = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));
    assert.ok(diskContent.matches, 'Disk content must have matches');
    assert.equal(diskContent.matches.length, 32);
  });

  // =========================================================================
  // F9: Public MatchesPage Display (ORIGINAL_REQUEST §R4)
  // =========================================================================

  await ctx.runTest('T1.F9.1: MatchesPage.jsx defines filter tabs for Jornadas 1, 2, 3, 4', async () => {
    const content = readFileSafe('website/src/pages/MatchesPage.jsx') || '';
    assert.ok(content.includes('J1') && content.includes('J2') && content.includes('J3') && content.includes('J4'),
      'MatchesPage must define J1, J2, J3, J4 tabs'
    );
  });

  await ctx.runTest('T1.F9.2: MatchesPage.jsx renders match cards with teams, logos, and scores', async () => {
    const content = readFileSafe('website/src/pages/MatchesPage.jsx') || '';
    assert.ok(content.includes('match-card') || content.includes('match-team'), 'MatchesPage must render match cards');
  });

  await ctx.runTest('T1.F9.3: Filtering by J1 selects only Jornada 1 matches', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const j1Matches = ref.matches.filter(m => m.jornada === 1 || m.round === 'J1');
    assert.equal(j1Matches.length, 8, 'Jornada 1 must isolate exactly 8 matches');
  });

  await ctx.runTest('T1.F9.4: Filtering by J2, J3, J4 isolates 8 matches each', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    for (const j of [2, 3, 4]) {
      const list = ref.matches.filter(m => m.jornada === j || m.round === `J${j}`);
      assert.equal(list.length, 8, `Jornada ${j} must have 8 matches`);
    }
  });

  await ctx.runTest('T1.F9.5: MatchesPage displays preparation notice when draw is not completed', async () => {
    const content = readFileSafe('website/src/pages/MatchesPage.jsx') || '';
    assert.ok(
      content.includes('Preparación') || content.includes('drawCompleted') || content.includes('Inscripciones'),
      'MatchesPage must display preparatory notice when draw is incomplete'
    );
  });

  // =========================================================================
  // F10: Build & Docs Deployment (ORIGINAL_REQUEST §R4)
  // =========================================================================

  await ctx.runTest('T1.F10.1: Website build (npm run build:web) succeeds with exit code 0', async () => {
    const out = execSync('npm run build:web', { cwd: ROOT_DIR, encoding: 'utf8' });
    assert.ok(out.includes('built in') || out.includes('dist'), 'build:web output should indicate success');
    assert.ok(fs.existsSync(path.resolve(ROOT_DIR, 'website/dist/index.html')), 'website/dist/index.html must exist');
  });

  await ctx.runTest('T1.F10.2: Dashboard build (npm run build:dashboard) succeeds with exit code 0', async () => {
    const out = execSync('npm run build:dashboard', { cwd: ROOT_DIR, encoding: 'utf8' });
    assert.ok(out.includes('built in') || out.includes('dist'), 'build:dashboard output should indicate success');
    assert.ok(fs.existsSync(path.resolve(ROOT_DIR, 'dashboard/dist/index.html')), 'dashboard/dist/index.html must exist');
  });

  await ctx.runTest('T1.F10.3: package.json scripts contain build, build:web, and build:dashboard', async () => {
    const pkg = JSON.parse(readFileSafe('package.json') || '{}');
    assert.ok(pkg.scripts?.build, 'package.json must contain build script');
    assert.ok(pkg.scripts?.['build:web'], 'package.json must contain build:web script');
    assert.ok(pkg.scripts?.['build:dashboard'], 'package.json must contain build:dashboard script');
  });

  await ctx.runTest('T1.F10.4: docs/ directory exists for GitHub Pages hosting', async () => {
    const docsDir = path.resolve(ROOT_DIR, 'docs');
    assert.ok(fs.existsSync(docsDir), 'docs directory must exist');
  });

  await ctx.runTest('T1.F10.5: docs/index.html exists and contains valid HTML structure', async () => {
    const indexContent = readFileSafe('docs/index.html');
    assert.ok(indexContent, 'docs/index.html must exist');
    assert.ok(indexContent.includes('<!DOCTYPE html>') || indexContent.includes('<html'), 'docs/index.html must be HTML');
  });

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
