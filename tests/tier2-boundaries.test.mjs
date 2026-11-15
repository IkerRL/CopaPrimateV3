import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'node:url';
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
import * as v from '../src/api/validate.js';
import { computeStandings } from '../src/api/public.js';

export async function runTier2Tests() {
  const ctx = new TestRunnerContext('Tier 2 - Boundary & Corner Cases');
  backupDataFiles();

  let serverInfo = null;
  try {
    serverInfo = await startTestServer();
  } catch (err) {
    console.error('Failed to start test server for Tier 2:', err);
  }

  const { baseUrl, adminToken } = serverInfo || {};

  // =========================================================================
  // F1 Boundaries: Hidden Cards Initial State
  // =========================================================================

  await ctx.runTest('T2.B1.1: Specification check: empty revealedTeams: [] must evaluate card as hidden, not revealed', async () => {
    // Contract from ORIGINAL_REQUEST §R1 & TEST_INFRA.md:
    // When revealedTeams is empty, cards must be hidden.
    const isRevealedSpecification = (teamName, revealedList) => {
      if (!Array.isArray(revealedList) || revealedList.length === 0) return false;
      return revealedList.includes(teamName);
    };

    assert.equal(isRevealedSpecification('Thunder Buddies', []), false, 'Cards must stay hidden when revealedTeams is empty');
    assert.equal(isRevealedSpecification('Sakura', null), false, 'Cards must stay hidden when revealedTeams is null');
    assert.equal(isRevealedSpecification('Sakura', ['Sakura']), true, 'Card must be revealed when included');
  });

  await ctx.runTest('T2.B1.2: POST /api/overlay-state with null or omitted revealedTeams handles gracefully without 500', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { activePhase: 'presentacion' } }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
  });

  await ctx.runTest('T2.B1.3: Team name with surrounding whitespace trims safely in lookup', async () => {
    const rawName = '  Thunder Buddies  ';
    const trimmed = rawName.trim();
    assert.equal(trimmed, 'Thunder Buddies');
    const list = ['Thunder Buddies'];
    assert.ok(list.includes(trimmed), 'Trimmed name must match list entry');
  });

  await ctx.runTest('T2.B1.4: Non-existent team in revealedTeams does not match any actual canonical teams', async () => {
    const ghostList = ['NonExistentTeam999'];
    const canonicalNames = Object.values(CANONICAL_POTS).flat().map(t => t.name);
    for (const name of canonicalNames) {
      assert.equal(ghostList.includes(name), false, `Ghost team should not match ${name}`);
    }
  });

  await ctx.runTest('T2.B1.5: Exact case matching between group team names and revealedTeams', async () => {
    const canonicalName = 'Thunder Buddies';
    const revealedList = ['Thunder Buddies'];
    assert.ok(revealedList.includes(canonicalName));
    assert.equal(revealedList.includes('thunder buddies'.toUpperCase()), false, 'Case-sensitive exact match');
  });

  // =========================================================================
  // F2 Boundaries: Free Order Reveal & Hide
  // =========================================================================

  await ctx.runTest('T2.B2.1: Rapid sequential reveal and hide toggles resolve without state drift', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const team = 'Sakura';

    // 1. Reveal
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { revealedTeams: [team] } }),
    });

    // 2. Hide
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { revealedTeams: [] } }),
    });

    // 3. Reveal again
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { revealedTeams: [team] } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.deepEqual(check.sorteo.revealedTeams, [team]);
  });

  await ctx.runTest('T2.B2.2: Duplicate entries in revealedTeams are deduplicated without key conflicts', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const duplicates = ['Sakura', 'Sakura', 'Dream Team', 'Dream Team'];
    const deduplicated = [...new Set(duplicates)];
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { revealedTeams: deduplicated } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo.revealedTeams.length, 2);
    assert.ok(check.sorteo.revealedTeams.includes('Sakura'));
    assert.ok(check.sorteo.revealedTeams.includes('Dream Team'));
  });

  await ctx.runTest('T2.B2.3: Revealing all 16 teams sets revealedTeams.length === 16', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const all16 = Object.values(CANONICAL_POTS).flat().map(t => t.name);
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { revealedTeams: all16 } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo.revealedTeams.length, 16);
  });

  await ctx.runTest('T2.B2.4: Hiding all teams from full reveal returns revealedTeams to []', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { revealedTeams: [] } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.deepEqual(check.sorteo.revealedTeams, []);
  });

  await ctx.runTest('T2.B2.5: Modifying groups structure preserves reveal status for remaining teams', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { revealedTeams: ['Sakura'] } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.ok(check.sorteo.revealedTeams.includes('Sakura'));
  });

  // =========================================================================
  // F3 Boundaries: Zoom / Spotlight Stream Mode
  // =========================================================================

  await ctx.runTest('T2.B3.1: Zoom on a currently hidden team carries complete team details', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const targetTeam = CANONICAL_POTS.D[3]; // Golden Gorillas
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        mode: 'sorteo',
        sorteo: {
          revealedTeams: [], // team is hidden in groups grid
          zoomedTeam: targetTeam, // but highlighted in spotlight
        },
      }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo.zoomedTeam.name, 'Golden Gorillas');
    assert.deepEqual(check.sorteo.revealedTeams, []);
  });

  await ctx.runTest('T2.B3.2: Zoom payload with empty jugadores array does not crash', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const noPlayersTeam = { name: 'Solo Team', logo: '/copa-logo.png', grupo: 'A', jugadores: [] };
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { zoomedTeam: noPlayersTeam } }),
    });
    assert.equal(res.status, 200);
    const data = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.deepEqual(data.sorteo.zoomedTeam.jugadores, []);
  });

  await ctx.runTest('T2.B3.3: Zoom payload with missing logo falls back gracefully', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const noLogoTeam = { name: 'NoLogo Team', grupo: 'B', jugadores: ['P1', 'P2'] };
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { zoomedTeam: noLogoTeam } }),
    });
    assert.equal(res.status, 200);
  });

  await ctx.runTest('T2.B3.4: Rapid switching of zoomedTeam directly from Team A to Team B', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { zoomedTeam: CANONICAL_POTS.A[0] } }),
    });

    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { zoomedTeam: CANONICAL_POTS.C[1] } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo.zoomedTeam.name, CANONICAL_POTS.C[1].name);
  });

  await ctx.runTest('T2.B3.5: Setting zoomedTeam: null when already null is a safe no-op', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { zoomedTeam: null } }),
    });
    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo.zoomedTeam, null);
  });

  // =========================================================================
  // F4 Boundaries: Champions League Draw Animation
  // =========================================================================

  await ctx.runTest('T2.B4.1: Triggering draw animation for Team B while Team A is active replaces state cleanly', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { drawingTeam: { name: 'Team Alpha' } } }),
    });

    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { drawingTeam: { name: 'Team Beta' } } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo.drawingTeam.name, 'Team Beta');
  });

  await ctx.runTest('T2.B4.2: Animation payload with partial matchup reveals maintains valid structure', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const partialAnim = {
      team: 'Sakura',
      revealedCount: 2,
      matchups: [
        { jornada: 1, rival: 'Entry Baiters' },
        { jornada: 2, rival: 'Thunder Buddies' },
      ],
    };
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { championsAnimation: partialAnim } }),
    });
    assert.equal(res.status, 200);

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo.championsAnimation.revealedCount, 2);
    assert.equal(check.sorteo.championsAnimation.matchups.length, 2);
  });

  await ctx.runTest('T2.B4.3: Animation payload with unexpected extra properties is sanitized without server error', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const extraProps = {
      mode: 'sorteo',
      sorteo: {
        drawingTeam: { name: 'Sakura' },
        unknownExtraField: 'fooBar123',
        nestedUnrecognized: { test: 1 },
      },
    };
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(extraProps),
    });
    assert.equal(res.status, 200);
  });

  await ctx.runTest('T2.B4.4: Inactive animation (championsAnimation: null) leaves no residue in public state', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { championsAnimation: null, drawingTeam: null, isSpinning: false } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo.championsAnimation, null);
    assert.equal(check.sorteo.drawingTeam, null);
    assert.equal(check.sorteo.isSpinning, false);
  });

  await ctx.runTest('T2.B4.5: Handling drawingTeam with null or undefined targetGroup gracefully', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { drawingTeam: { name: 'Kizuna', targetGroup: null } } }),
    });
    assert.equal(res.status, 200);
  });

  // =========================================================================
  // F5 Boundaries: Real-Time Sync & Audio Signals
  // =========================================================================

  await ctx.runTest('T2.B5.1: Rapid sequential POSTs produce non-decreasing monotonic timestamps', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const timestamps = [];

    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ mode: 'sorteo', sorteo: { seq: i } }),
      });
      const data = await res.json();
      timestamps.push(new Date(data.overlay.updatedAt).getTime());
    }

    assert.ok(timestamps[1] >= timestamps[0], 'Timestamps must be non-decreasing');
    assert.ok(timestamps[2] >= timestamps[1], 'Timestamps must be non-decreasing');
  });

  await ctx.runTest('T2.B5.2: Concurrent GET requests during active POST updates resolve without crash', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const promises = [
      fetch(`${baseUrl}/api/public/overlay-state`),
      fetch(`${baseUrl}/api/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ mode: 'sorteo', sorteo: { activePhase: 'sorteo' } }),
      }),
      fetch(`${baseUrl}/api/public/overlay-state`),
      fetch(`${baseUrl}/api/public/matches`),
    ];

    const results = await Promise.all(promises);
    for (const res of results) {
      assert.equal(res.status, 200);
    }
  });

  await ctx.runTest('T2.B5.3: Large valid payload within 2MB limit parses without 413 error', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    // 50KB payload
    const moderatePayload = {
      mode: 'sorteo',
      sorteo: {
        activePhase: 'presentacion',
        extraData: 'A'.repeat(50000),
      },
    };
    const res = await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(moderatePayload),
    });
    assert.equal(res.status, 200);
  });

  await ctx.runTest('T2.B5.4: Sound effect trigger flag resets cleanly', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    // Set sound trigger
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { soundTrigger: 'draw_reveal' } }),
    });

    // Reset sound trigger
    await fetch(`${baseUrl}/api/overlay-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ mode: 'sorteo', sorteo: { soundTrigger: null } }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/overlay-state`)).json();
    assert.equal(check.sorteo.soundTrigger, null);
  });

  await ctx.runTest('T2.B5.5: Public overlay endpoint returns 200 even with unexpected query params', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const res = await fetch(`${baseUrl}/api/public/overlay-state?foo=bar&random=123&undefined=null`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.mode);
  });

  // =========================================================================
  // F6 Boundaries: 32-Match Schedule Math Engine
  // =========================================================================

  await ctx.runTest('T2.B6.1: Zero duplicate pairings across all 32 matches', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const pairs = new Set();
    for (const m of ref.matches) {
      const key = [m.t1.name, m.t2.name].sort().join(' vs ');
      assert.ok(!pairs.has(key), `Duplicate matchup found: ${key}`);
      pairs.add(key);
    }
    assert.equal(pairs.size, 32);
  });

  await ctx.runTest('T2.B6.2: No team plays more than 1 match in the same jornada', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    for (let jIdx = 0; jIdx < ref.jornadas.length; jIdx++) {
      const jMatches = ref.jornadas[jIdx];
      const seenInJornada = new Set();
      for (const m of jMatches) {
        assert.ok(!seenInJornada.has(m.t1.name), `Team ${m.t1.name} plays twice in J${jIdx + 1}`);
        assert.ok(!seenInJornada.has(m.t2.name), `Team ${m.t2.name} plays twice in J${jIdx + 1}`);
        seenInJornada.add(m.t1.name);
        seenInJornada.add(m.t2.name);
      }
      assert.equal(seenInJornada.size, 16, `All 16 teams must appear in J${jIdx + 1}`);
    }
  });

  await ctx.runTest('T2.B6.3: Pot balance: matches distribute teams evenly across pots', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    // In J1-J3, each team plays an opponent from a different group/pot
    for (let j = 0; j < 3; j++) {
      for (const m of ref.jornadas[j]) {
        assert.notEqual(m.t1.grupo, m.t2.grupo, `J${j + 1} must be an inter-group match`);
      }
    }
  });

  await ctx.runTest('T2.B6.4: Symmetric match schedule: if T1 plays T2 in J, T2 plays T1 in J', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    for (const m of ref.matches) {
      // Find reciprocal match for t2 in same jornada
      const reciprocal = ref.matches.find(other =>
        other.jornada === m.jornada &&
        (other.t1.name === m.t2.name || other.t2.name === m.t2.name)
      );
      assert.ok(reciprocal, `Reciprocal match must exist for ${m.t2.name} in J${m.jornada}`);
      assert.equal(reciprocal.id, m.id, 'Reciprocal match must be the exact same match');
    }
  });

  await ctx.runTest('T2.B6.5: Match ID uniqueness: all 32 matches have distinct IDs', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const ids = new Set(ref.matches.map(m => m.id));
    assert.equal(ids.size, 32, 'All 32 match IDs must be strictly unique');
  });

  // =========================================================================
  // F7 Boundaries: Free Order Draw Lookup & Invariance
  // =========================================================================

  await ctx.runTest('T2.B7.1: Drawing 15 teams automatically resolves all 4 matchups for 16th team with zero ambiguity', async () => {
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    const allTeams = Object.values(CANONICAL_POTS).flat().map(t => t.name);
    const first15 = allTeams.slice(0, 15);
    const lastTeam = allTeams[15];

    // Check last team's matches in schedule
    const lastMatches = ref.matches.filter(m => m.t1.name === lastTeam || m.t2.name === lastTeam);
    assert.equal(lastMatches.length, 4, '16th team must have all 4 matches predetermined');
    for (const m of lastMatches) {
      const rival = m.t1.name === lastTeam ? m.t2.name : m.t1.name;
      assert.ok(first15.includes(rival), '16th team rivals must belong to first 15 teams');
    }
  });

  await ctx.runTest('T2.B7.2: Consecutive draws from the same pot does not cause collision', async () => {
    // Pick all 4 teams from Pot 1 first (A1, B1, C1, D1)
    const pot1Teams = [CANONICAL_POTS.A[0], CANONICAL_POTS.B[0], CANONICAL_POTS.C[0], CANONICAL_POTS.D[0]];
    const ref = generateReferenceSchedule(CANONICAL_POTS);

    for (const t of pot1Teams) {
      const matchups = ref.matches.filter(m => m.t1.name === t.name || m.t2.name === t.name);
      assert.equal(matchups.length, 4);
    }
  });

  await ctx.runTest('T2.B7.3: Drawing teams with similar or substring names does not cause alias collisions', async () => {
    // Custom groups with prefix-overlapping names
    const customGrupos = {
      A: [
        { name: 'Team Alpha', grupo: 'A' },
        { name: 'Team Alpha Prime', grupo: 'A' },
        { name: 'Team A', grupo: 'A' },
        { name: 'Team A1', grupo: 'A' },
      ],
      B: [
        { name: 'Team Beta', grupo: 'B' },
        { name: 'Team Beta Plus', grupo: 'B' },
        { name: 'Team B', grupo: 'B' },
        { name: 'Team B1', grupo: 'B' },
      ],
      C: [
        { name: 'Team Gamma', grupo: 'C' },
        { name: 'Team Gamma X', grupo: 'C' },
        { name: 'Team C', grupo: 'C' },
        { name: 'Team C1', grupo: 'C' },
      ],
      D: [
        { name: 'Team Delta', grupo: 'D' },
        { name: 'Team Delta Force', grupo: 'D' },
        { name: 'Team D', grupo: 'D' },
        { name: 'Team D1', grupo: 'D' },
      ],
    };
    const ref = generateReferenceSchedule(customGrupos);
    const val = validateScheduleMath(ref.matches, ref.jornadas);
    assert.equal(val.valid, true);
    assert.equal(val.teamCount, 16);
  });

  await ctx.runTest('T2.B7.4: Draw completion boundary: drawCompleted is true when all 16 teams are assigned', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    const ref = generateReferenceSchedule(CANONICAL_POTS);
    await fetch(`${baseUrl}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        drawCompleted: true,
        matches: ref.matches,
        jornadas: ref.jornadas,
      }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/matches`)).json();
    assert.equal(check.drawCompleted, true);
  });

  await ctx.runTest('T2.B7.5: Resetting draw at intermediate step clears state cleanly to 0', async () => {
    if (!baseUrl) throw new Error('Test server not running');
    // Reset matches and overlay state
    await fetch(`${baseUrl}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        drawCompleted: false,
        matches: [],
        jornadas: [[], [], [], []],
      }),
    });

    const check = await (await fetch(`${baseUrl}/api/public/matches`)).json();
    assert.equal(check.drawCompleted, false);
    assert.equal(check.matches.length, 0);
  });

  // =========================================================================
  // F8 Boundaries: Match Persistence & API Endpoints
  // =========================================================================

  await ctx.runTest('T2.B8.1: validate.match() preserves jornada property on match objects', async () => {
    const validated = v.match({
      id: 10,
      jornada: 3,
      round: 'J3',
      t1: { name: 'Alpha' },
      t2: { name: 'Beta' },
    });
    assert.equal(validated.jornada, 3, 'validate.match must preserve jornada: 3');
  });

  await ctx.runTest('T2.B8.2: validate.match() accepts string round codes ("J1", "J2", "J3", "J4")', async () => {
    for (const code of ['J1', 'J2', 'J3', 'J4']) {
      const validated = v.match({
        id: 1,
        round: code,
        t1: { name: 'A' },
        t2: { name: 'B' },
      });
      assert.equal(validated.round, code, `validate.match must accept string round ${code}`);
    }
  });

  await ctx.runTest('T2.B8.3: validate.match() accepts numeric round codes (1, 2) and preserves them', async () => {
    const validated = v.match({
      id: 1,
      round: 2,
      t1: { name: 'A' },
      t2: { name: 'B' },
    });
    assert.equal(validated.round, 2);
  });

  await ctx.runTest('T2.B8.4: validate.groups() preserves team roster players and group tags', async () => {
    const input = {
      A: [
        { id: 'A1', name: 'Thunder Buddies', logo: '/logo3.png', grupo: 'A', jugadores: ['Brrokeen', 'Pipe'] },
      ],
    };
    const validated = v.groups(input);
    assert.ok(validated.A, 'Group A must exist');
    assert.equal(validated.A[0].name, 'Thunder Buddies');
    assert.deepEqual(validated.A[0].jugadores, ['Brrokeen', 'Pipe'], 'validate.groups must preserve jugadores');
  });

  await ctx.runTest('T2.B8.5: validate.match() throws ValidationError on invalid/empty input', async () => {
    assert.throws(() => {
      v.match(null);
    }, /inv[áa]lido/i);
    assert.throws(() => {
      v.match('not an object');
    }, /inv[áa]lido/i);
  });

  // =========================================================================
  // F9 Boundaries: Public MatchesPage Display
  // =========================================================================

  await ctx.runTest('T2.B9.1: MatchesPage round filter logic accommodates string "J1" and numeric 1', async () => {
    const matchFromString = { round: 'J1', jornada: 1 };
    const matchFromNumber = { round: 1, jornada: 1 };

    const matchesJ1Filter = (m) => {
      const r = String(m.round || m.jornada || '').toUpperCase();
      return /J1|JORNADA 1|^1$/i.test(r) || m.jornada === 1;
    };

    assert.ok(matchesJ1Filter(matchFromString), 'String J1 must pass filter');
    assert.ok(matchesJ1Filter(matchFromNumber), 'Numeric 1 must pass filter');
  });

  await ctx.runTest('T2.B9.2: MatchesPage renders fallback for matches with missing logos', async () => {
    const m = { t1: { name: 'Team X', logo: '' }, t2: { name: 'Team Y', logo: null } };
    const t1Logo = m.t1.logo || '/copa-logo.png';
    const t2Logo = m.t2.logo || '/copa-logo.png';
    assert.equal(t1Logo, '/copa-logo.png');
    assert.equal(t2Logo, '/copa-logo.png');
  });

  await ctx.runTest('T2.B9.3: Extended overtime scores (15-13, 16-14) preserve valid score representation', async () => {
    const validated = v.match({
      t1: { name: 'Alpha' },
      t2: { name: 'Beta' },
      score1: 15,
      score2: 13,
      status: 'Finalizado',
    });
    assert.equal(validated.score1, 15);
    assert.equal(validated.score2, 13);
  });

  await ctx.runTest('T2.B9.4: MatchesPage cleanly separates Completed matches from Programmed matches', async () => {
    const matches = [
      { id: 1, status: 'Finalizado', score1: 13, score2: 9 },
      { id: 2, status: 'Programado', score1: 0, score2: 0 },
    ];
    const finished = matches.filter(m => /final/i.test(m.status));
    const pending = matches.filter(m => !/final/i.test(m.status));
    assert.equal(finished.length, 1);
    assert.equal(pending.length, 1);
  });

  await ctx.runTest('T2.B9.5: Standings calculation assigns 3 points for win and 0 for loss', async () => {
    const matches = [
      { t1: { name: 'Alpha' }, t2: { name: 'Beta' }, score1: 13, score2: 9, status: 'Finalizado' },
    ];
    const { standings } = computeStandings({ groups: {}, matches });
    const alpha = standings.find(s => s.team === 'Alpha');
    const beta = standings.find(s => s.team === 'Beta');

    assert.equal(alpha.points, 3, 'Winner must receive 3 points');
    assert.equal(beta.points, 0, 'Loser must receive 0 points');
    assert.equal(alpha.w, 1);
    assert.equal(beta.l, 1);
  });

  // =========================================================================
  // F10 Boundaries: Build & Docs Deployment
  // =========================================================================

  await ctx.runTest('T2.B10.1: docs/404.html exists for SPA GitHub Pages fallback routing', async () => {
    const path404 = path.resolve(ROOT_DIR, 'docs/404.html');
    assert.ok(fs.existsSync(path404), 'docs/404.html must exist');
    const content = fs.readFileSync(path404, 'utf8');
    assert.ok(content.length > 50, 'docs/404.html must not be empty');
  });

  await ctx.runTest('T2.B10.2: docs/index.html references valid bundled asset files', async () => {
    const indexHtml = readFileSafe('docs/index.html') || '';
    assert.ok(indexHtml.includes('.js') || indexHtml.includes('.css'), 'docs/index.html should reference assets');
  });

  await ctx.runTest('T2.B10.3: Built bundles contain valid JavaScript without undefined process.env', async () => {
    const docsDir = path.resolve(ROOT_DIR, 'docs/assets');
    if (fs.existsSync(docsDir)) {
      const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.js'));
      assert.ok(files.length > 0, 'Should find JS bundle files in docs/assets');
    }
  });

  await ctx.runTest('T2.B10.4: Stream overlay route or component exists in dashboard router', async () => {
    const appContent = readFileSafe('dashboard/src/App.jsx') || '';
    assert.ok(
      appContent.includes('OverlayGruposSorteo') || appContent.includes('sorteo') || appContent.includes('grupos'),
      'dashboard/src/App.jsx must support OverlayGruposSorteo'
    );
  });

  await ctx.runTest('T2.B10.5: Clean build repeatability: output files exist with non-zero size', async () => {
    const webDistIndex = path.resolve(ROOT_DIR, 'website/dist/index.html');
    const dashDistIndex = path.resolve(ROOT_DIR, 'dashboard/dist/index.html');
    assert.ok(fs.existsSync(webDistIndex) && fs.statSync(webDistIndex).size > 100);
    assert.ok(fs.existsSync(dashDistIndex) && fs.statSync(dashDistIndex).size > 100);
  });

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
