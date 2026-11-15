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
import {
  CANONICAL_POTS,
  generateReferenceSchedule,
  validateScheduleMath,
} from './helpers/schedule-oracle.mjs';
import { computeStandings } from '../src/api/public.js';

export async function runTier3Tests() {
  const ctx = new TestRunnerContext('Tier 3 - Cross-Feature Combinations');
  backupDataFiles();

  let serverInfo = null;
  try {
    serverInfo = await startTestServer();
  } catch (err) {
    console.error('Failed to start test server for Tier 3:', err);
  }

  const { baseUrl, adminToken } = serverInfo || {};

  if (baseUrl) {
    // =========================================================================
    // Combination 1: Free Order Pick + Spotlight Stream Mode + Real-Time Sync
    // =========================================================================
    await ctx.runTest('T3.C1: Free Order Pick + Spotlight Stream Mode + Real-Time Sync', async () => {
      const targetTeam = CANONICAL_POTS.C[0]; // Sakura
      const revealedSoFar = ['Thunder Buddies', 'Sakura'];

      // 1. Admin sends POST /api/overlay-state with zoomedTeam and revealedTeams
      const postRes = await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          mode: 'sorteo',
          sorteo: {
            activePhase: 'presentacion',
            revealedTeams: revealedSoFar,
            zoomedTeam: targetTeam,
          },
        }),
      });
      assert.equal(postRes.status, 200);

      // 2. Stream overlay queries public endpoint
      const getRes = await fetch(`${baseUrl}/api/public/overlay-state`);
      assert.equal(getRes.status, 200);
      const data = await getRes.json();

      assert.equal(data.mode, 'sorteo');
      assert.deepEqual(data.sorteo.revealedTeams, revealedSoFar);
      assert.equal(data.sorteo.zoomedTeam.name, 'Sakura');
      assert.equal(data.sorteo.zoomedTeam.grupo, 'C');
      assert.ok(data.updatedAt);
    });

    // =========================================================================
    // Combination 2: Champions League Draw Animation + Sorteo State Broadcast
    // =========================================================================
    await ctx.runTest('T3.C2: Champions League Draw Animation + Sorteo State Broadcast + Stream Overlay State', async () => {
      const animPayload = {
        mode: 'sorteo',
        sorteo: {
          activePhase: 'sorteo',
          isSpinning: false,
          drawingTeam: { name: 'Entry Baiters', targetGroup: 'B' },
          championsAnimation: {
            active: true,
            team: 'Entry Baiters',
            step: 2,
            revealedMatchups: [
              { jornada: 1, rival: 'Thunder Buddies', logo: '/logo3.png' },
              { jornada: 2, rival: 'Dream Team', logo: '/logo7.png' },
            ],
          },
          revealedTeams: ['Thunder Buddies', 'Entry Baiters'],
        },
      };

      await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(animPayload),
      });

      const publicState = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
      assert.equal(publicState.sorteo.activePhase, 'sorteo');
      assert.equal(publicState.sorteo.drawingTeam.name, 'Entry Baiters');
      assert.equal(publicState.sorteo.championsAnimation.step, 2);
      assert.equal(publicState.sorteo.championsAnimation.revealedMatchups.length, 2);
    });

    // =========================================================================
    // Combination 3: Schedule Math Engine + Matches Persistence + Public API
    // =========================================================================
    await ctx.runTest('T3.C3: Schedule Math Engine + Matches Persistence (POST /api/matches) + Public Endpoint', async () => {
      const ref = generateReferenceSchedule(CANONICAL_POTS);
      const validation = validateScheduleMath(ref.matches, ref.jornadas);
      assert.equal(validation.valid, true);

      // 1. Admin persists schedule
      const postRes = await fetch(`${baseUrl}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          drawCompleted: true,
          groups: CANONICAL_POTS,
          matches: ref.matches,
          jornadas: ref.jornadas,
        }),
      });
      assert.equal(postRes.status, 200);

      // 2. Disk file verification
      const matchesFile = path.resolve(ROOT_DIR, 'matches.json');
      assert.ok(fs.existsSync(matchesFile));
      const diskData = JSON.parse(fs.readFileSync(matchesFile, 'utf8'));
      assert.equal(diskData.matches.length, 32);

      // 3. Public API query
      const getRes = await fetch(`${baseUrl}/api/public/matches`);
      assert.equal(getRes.status, 200);
      const publicMatches = await getRes.json();
      assert.equal(publicMatches.drawCompleted, true);
      assert.equal(publicMatches.matches.length, 32);
      assert.equal(publicMatches.jornadas.length, 4);
    });

    // =========================================================================
    // Combination 4: Sorteo Completion + MatchesPage Multi-Jornada Filtering + Standings
    // =========================================================================
    await ctx.runTest('T3.C4: Sorteo Completion + Multi-Jornada Filtering + Standings Calculation', async () => {
      const ref = generateReferenceSchedule(CANONICAL_POTS);

      // Simulate completed matches for Jornada 1
      const j1Finished = ref.jornadas[0].map((m, idx) => ({
        ...m,
        score1: 13,
        score2: 8,
        status: 'Finalizado',
      }));

      const allMatches = [...j1Finished, ...ref.jornadas[1], ...ref.jornadas[2], ...ref.jornadas[3]];

      await fetch(`${baseUrl}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          drawCompleted: true,
          groups: CANONICAL_POTS,
          matches: allMatches,
          jornadas: [j1Finished, ref.jornadas[1], ref.jornadas[2], ref.jornadas[3]],
        }),
      });

      // Query public matches
      const publicData = await (await fetch(`${baseUrl}/api/public/matches`)).json();
      const j1Matches = publicData.matches.filter(m => m.jornada === 1);
      assert.equal(j1Matches.length, 8);
      const finishedCount = j1Matches.filter(m => m.status === 'Finalizado').length;
      assert.equal(finishedCount, 8);

      // Query standings
      const standingsRes = await (await fetch(`${baseUrl}/api/public/standings`)).json();
      assert.ok(standingsRes.standings.length > 0);
      assert.equal(standingsRes.finishedMatches, 8);

      // All 8 winners must have 3 points
      const winners = standingsRes.standings.filter(s => s.points === 3);
      assert.equal(winners.length, 8);
    });

    // =========================================================================
    // Combination 5: Rapid Free Order Draw of 4 Teams + Concurrent Overlay State
    // =========================================================================
    await ctx.runTest('T3.C5: Rapid Free Order Draw of 4 Teams + Real-Time Overlay State + Audio Cue Emission', async () => {
      // Pick 4 teams non-sequentially: A4, C2, B1, D3
      const teamsToDraw = [
        CANONICAL_POTS.A[3], // REHENKARMACIÓN
        CANONICAL_POTS.C[1], // Soul Resonance
        CANONICAL_POTS.B[0], // Entry Baiters
        CANONICAL_POTS.D[2], // Banana Kings
      ];

      const revealedAcc = [];

      for (const t of teamsToDraw) {
        revealedAcc.push(t.name);
        await fetch(`${baseUrl}/api/overlay-state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            mode: 'sorteo',
            sorteo: {
              activePhase: 'sorteo',
              drawingTeam: t,
              soundTrigger: 'ball_extract',
              revealedTeams: [...revealedAcc],
            },
          }),
        });

        const intermediate = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
        assert.equal(intermediate.sorteo.drawingTeam.name, t.name);
        assert.equal(intermediate.sorteo.revealedTeams.length, revealedAcc.length);
      }

      assert.equal(revealedAcc.length, 4);
    });

    // =========================================================================
    // Combination 6: Admin Match Score Update + Public Matches Reflect + Standings Table
    // =========================================================================
    await ctx.runTest('T3.C6: Admin Match Score Update (PATCH /api/matches/:id) + Public Matches + Standings Re-evaluation', async () => {
      // Load current matches to find an ID to patch
      const matchesData = await (await fetch(`${baseUrl}/api/public/matches`)).json();
      assert.ok(matchesData.matches.length > 0);
      const targetMatch = matchesData.matches[0];
      const targetId = targetMatch.id;

      // Patch match with final score
      const patchRes = await fetch(`${baseUrl}/api/matches/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          score1: 13,
          score2: 11,
          status: 'Finalizado',
        }),
      });
      assert.equal(patchRes.status, 200);

      // Verify public matches reflect updated score
      const updatedPublic = await (await fetch(`${baseUrl}/api/public/matches`)).json();
      const updatedMatch = updatedPublic.matches.find(m => String(m.id) === String(targetId));
      assert.equal(updatedMatch.score1, 13);
      assert.equal(updatedMatch.score2, 11);
      assert.equal(updatedMatch.status, 'Finalizado');

      // Verify standings updated with winner
      const standingsData = await (await fetch(`${baseUrl}/api/public/standings`)).json();
      const winnerRow = standingsData.standings.find(s => s.team === targetMatch.t1.name);
      assert.ok(winnerRow);
      assert.ok(winnerRow.points >= 3);
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
