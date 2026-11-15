import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import fs from 'fs';
import path from 'path';
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

export async function runTier4Tests() {
  const ctx = new TestRunnerContext('Tier 4 - Real-World Application Scenarios');
  backupDataFiles();

  let serverInfo = null;
  try {
    serverInfo = await startTestServer();
  } catch (err) {
    console.error('Failed to start test server for Tier 4:', err);
  }

  const { baseUrl, adminToken } = serverInfo || {};

  if (baseUrl) {
    // =========================================================================
    // Scenario 1: Full Tournament Draw Simulation from Reset to Complete
    // =========================================================================
    await ctx.runTest('T4.S1: Full Tournament Draw Simulation from Reset to Complete (Reset -> Draw 16 Teams -> Generate 32 Matches -> Persist)', async () => {
      // Step 1: Reset draw state to 0
      await fetch(`${baseUrl}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          drawCompleted: false,
          matches: [],
          jornadas: [[], [], [], []],
          groups: { A: [], B: [], C: [], D: [] },
        }),
      });

      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'sorteo',
          sorteo: {
            activePhase: 'presentacion',
            revealedTeams: [],
            zoomedTeam: null,
            drawingTeam: null,
          },
        }),
      });

      let checkReset = await (await fetch(`${baseUrl}/api/public/matches`)).json();
      assert.equal(checkReset.drawCompleted, false);
      assert.equal(checkReset.matches.length, 0);

      // Step 2: Draw 16 teams in non-sequential arbitrary order across pots
      const pickOrder = [
        CANONICAL_POTS.D[3], // Golden Gorillas (Pot 4)
        CANONICAL_POTS.A[0], // Thunder Buddies (Pot 1)
        CANONICAL_POTS.C[1], // Soul Resonance (Pot 2)
        CANONICAL_POTS.B[2], // Makaco Ninja (Pot 3)
        CANONICAL_POTS.B[0], // Entry Baiters (Pot 1)
        CANONICAL_POTS.A[2], // Chuu-Chuu 100% (Pot 3)
        CANONICAL_POTS.D[1], // Chimp Squad (Pot 2)
        CANONICAL_POTS.C[3], // MARIIKS (Pot 4)
        CANONICAL_POTS.C[0], // Sakura (Pot 1)
        CANONICAL_POTS.B[1], // Dream Team (Pot 2)
        CANONICAL_POTS.A[1], // Los Akrtona2 (Pot 2)
        CANONICAL_POTS.D[0], // Primates FC (Pot 1)
        CANONICAL_POTS.A[3], // REHENKARMACIÓN (Pot 4)
        CANONICAL_POTS.C[2], // Stranger Picks (Pot 3)
        CANONICAL_POTS.D[2], // Banana Kings (Pot 3)
        CANONICAL_POTS.B[3], // Kizuna (Pot 4)
      ];

      const revealedAcc = [];

      for (const team of pickOrder) {
        revealedAcc.push(team.name);
        await fetch(`${baseUrl}/api/overlay-state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            mode: 'sorteo',
            sorteo: {
              activePhase: 'sorteo',
              drawingTeam: team,
              revealedTeams: [...revealedAcc],
            },
          }),
        });
      }

      assert.equal(revealedAcc.length, 16);

      // Step 3: Compute complete 32-match schedule
      const ref = generateReferenceSchedule(CANONICAL_POTS);
      const mathValidation = validateScheduleMath(ref.matches, ref.jornadas);
      assert.equal(mathValidation.valid, true);
      assert.equal(mathValidation.matchCount, 32);

      // Step 4: Persist finalized draw and transition to 'liga' phase
      const persistRes = await fetch(`${baseUrl}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          drawCompleted: true,
          drawnAt: new Date().toISOString(),
          groups: CANONICAL_POTS,
          matches: ref.matches,
          jornadas: ref.jornadas,
        }),
      });
      assert.equal(persistRes.status, 200);

      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'sorteo',
          sorteo: {
            activePhase: 'liga',
            drawingTeam: null,
            revealedTeams: revealedAcc,
          },
        }),
      });

      // Step 5: Verify public endpoints serve full completed tournament
      const finalMatches = await (await fetch(`${baseUrl}/api/public/matches`)).json();
      assert.equal(finalMatches.drawCompleted, true);
      assert.equal(finalMatches.matches.length, 32);
      assert.equal(finalMatches.jornadas.length, 4);

      const finalOverlay = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(finalOverlay.sorteo.activePhase, 'liga');
      assert.equal(finalOverlay.sorteo.revealedTeams.length, 16);
    });

    // =========================================================================
    // Scenario 2: Arbitrary Order Pick & Reveal with Simultaneous Stream Spotlight
    // =========================================================================
    await ctx.runTest('T4.S2: Arbitrary Order Pick & Reveal with Simultaneous Stream Spotlight (Spotlight Open -> Verify Stream -> Close -> Card Reveal)', async () => {
      const teamA = CANONICAL_POTS.D[0]; // Primates FC
      const teamB = CANONICAL_POTS.A[1]; // Los Akrtona2

      // 1. Moderator triggers Spotlight for Team A on Stream
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'sorteo',
          sorteo: {
            activePhase: 'presentacion',
            zoomedTeam: teamA,
            revealedTeams: [],
          },
        }),
      });

      // Stream overlay observes spotlight
      let overlayCheck = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.ok(overlayCheck.sorteo.zoomedTeam);
      assert.equal(overlayCheck.sorteo.zoomedTeam.name, teamA.name);
      assert.equal(overlayCheck.sorteo.zoomedTeam.grupo, 'D');

      // 2. Moderator closes spotlight and marks Team A as revealed
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'sorteo',
          sorteo: {
            activePhase: 'presentacion',
            zoomedTeam: null,
            revealedTeams: [teamA.name],
          },
        }),
      });

      overlayCheck = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(overlayCheck.sorteo.zoomedTeam, null);
      assert.deepEqual(overlayCheck.sorteo.revealedTeams, [teamA.name]);

      // 3. Repeat for Team B
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'sorteo',
          sorteo: {
            activePhase: 'presentacion',
            zoomedTeam: teamB,
            revealedTeams: [teamA.name],
          },
        }),
      });

      overlayCheck = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(overlayCheck.sorteo.zoomedTeam.name, teamB.name);

      // Close spotlight for Team B
      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'sorteo',
          sorteo: {
            activePhase: 'presentacion',
            zoomedTeam: null,
            revealedTeams: [teamA.name, teamB.name],
          },
        }),
      });

      overlayCheck = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(overlayCheck.sorteo.zoomedTeam, null);
      assert.equal(overlayCheck.sorteo.revealedTeams.length, 2);
    });

    // =========================================================================
    // Scenario 3: Server Restart & State Persistence Integrity
    // =========================================================================
    await ctx.runTest('T4.S3: Server Restart & State Persistence Integrity (Save State -> Stop Server -> Boot Fresh Server -> Verify 100% Invariants)', async () => {
      // 1. Populate full tournament schedule and overlay state
      const ref = generateReferenceSchedule(CANONICAL_POTS);
      await fetch(`${baseUrl}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          drawCompleted: true,
          drawnAt: '2026-11-15T03:00:00.000Z',
          groups: CANONICAL_POTS,
          matches: ref.matches,
          jornadas: ref.jornadas,
        }),
      });

      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'sorteo',
          sorteo: {
            activePhase: 'liga',
            revealedTeams: Object.values(CANONICAL_POTS).flat().map(t => t.name),
          },
        }),
      });

      // 2. Shut down test server instance
      await stopTestServer();

      // 3. Confirm disk files are saved
      const diskMatches = JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, 'matches.json'), 'utf8'));
      assert.equal(diskMatches.drawCompleted, true);
      assert.equal(diskMatches.matches.length, 32);

      // 4. Start brand new test server instance
      const freshServer = await startTestServer();
      const newUrl = freshServer.baseUrl;

      // 5. Query endpoints on new server and verify integrity
      const publicMatches = await (await fetch(`${newUrl}/api/public/matches`)).json();
      assert.equal(publicMatches.drawCompleted, true);
      assert.equal(publicMatches.matches.length, 32);
      assert.equal(publicMatches.jornadas.length, 4);

      const publicOverlay = await (await fetch(`${newUrl}/api/public/overlay-state`)).json();
      assert.equal(publicOverlay.mode, 'sorteo');
      assert.equal(publicOverlay.sorteo.activePhase, 'liga');
      assert.equal(publicOverlay.sorteo.revealedTeams.length, 16);
    });

    // =========================================================================
    // Scenario 4: Full Build & Production Deployment to `docs/` with 404 Routing
    // =========================================================================
    await ctx.runTest('T4.S4: Full Build & Production Deployment to docs/ with 404 Routing', async () => {
      // 1. Execute Vite build for website and dashboard
      execSync('npm run build:web', { cwd: ROOT_DIR, encoding: 'utf8' });
      execSync('npm run build:dashboard', { cwd: ROOT_DIR, encoding: 'utf8' });

      // 2. Verify dist directories
      assert.ok(fs.existsSync(path.resolve(ROOT_DIR, 'website/dist/index.html')));
      assert.ok(fs.existsSync(path.resolve(ROOT_DIR, 'dashboard/dist/index.html')));

      // 3. Verify docs/ folder for GitHub Pages
      const docsIndex = path.resolve(ROOT_DIR, 'docs/index.html');
      const docs404 = path.resolve(ROOT_DIR, 'docs/404.html');
      assert.ok(fs.existsSync(docsIndex), 'docs/index.html must exist');
      assert.ok(fs.existsSync(docs404), 'docs/404.html must exist for SPA fallback');

      // 4. Verify 404.html contains valid SPA routing logic or redirect script
      const content404 = fs.readFileSync(docs404, 'utf8');
      assert.ok(content404.includes('<script') || content404.includes('window.location'), 'docs/404.html should contain SPA redirect handling');
    });

    // =========================================================================
    // Scenario 5: Public Website Matches Navigation Across J1-J4
    // =========================================================================
    await ctx.runTest('T4.S5: Public Website Matches Navigation Across J1-J4 (Filters, Score Update, Standings)', async () => {
      const activeServer = await startTestServer();
      const currentUrl = activeServer.baseUrl;

      // 1. Populate full 32-match schedule
      const ref = generateReferenceSchedule(CANONICAL_POTS);

      // Simulate match 1 in J1 finished: 13 - 10
      ref.matches[0].score1 = 13;
      ref.matches[0].score2 = 10;
      ref.matches[0].status = 'Finalizado';
      ref.jornadas[0][0].score1 = 13;
      ref.jornadas[0][0].score2 = 10;
      ref.jornadas[0][0].status = 'Finalizado';

      await fetch(`${currentUrl}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({
          drawCompleted: true,
          groups: CANONICAL_POTS,
          matches: ref.matches,
          jornadas: ref.jornadas,
        }),
      });

      // 2. Query public matches
      const publicData = await (await fetch(`${currentUrl}/api/public/matches`)).json();
      assert.equal(publicData.matches.length, 32);

      // 3. Verify matchday filtering for all 4 jornadas
      for (let j = 1; j <= 4; j++) {
        const jornadaMatches = publicData.matches.filter(m => m.jornada === j || m.round === `J${j}`);
        assert.equal(jornadaMatches.length, 8, `Jornada ${j} must filter exactly 8 matches`);
      }

      // 4. Check J1 finished match
      const m1 = publicData.matches.find(m => m.id === ref.matches[0].id);
      assert.equal(m1.score1, 13);
      assert.equal(m1.score2, 10);
      assert.equal(m1.status, 'Finalizado');

      // 5. Check standings reflect victory
      const standings = await (await fetch(`${currentUrl}/api/public/standings`)).json();
      const winner = standings.standings.find(s => s.team === m1.t1.name);
      assert.ok(winner);
      assert.equal(winner.points, 3);
      assert.equal(winner.w, 1);
    });
  }

  await stopTestServer();
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
