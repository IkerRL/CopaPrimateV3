/**
 * Copa Primate Vol. III - Schedule Math & Validation Invariant Test Suite
 *
 * Verifies:
 * 1. Backend validators (validate.js): preserves jornada, string round ("J1".."J4"), groups team details.
 * 2. Deterministic schedule engine (scheduleEngine.js): 1-factorization, pot balance, getTeamMatchups.
 * 3. 10,000 Monte Carlo randomized pot permutations: 0 collisions, 0 self-matches, 32 matches, 4 jornadas x 8.
 * 4. Production matches.json: validates tournament schedule satisfies all mathematical invariants.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as v from '../src/api/validate.js';
import {
    generateSchedule,
    getTeamMatchups,
    validateScheduleInvariants,
    DEFAULT_BOMBOS
} from '../src/scheduleEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function runTest(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        return true;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     Error: ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('\n===============================================================');
    console.log('📐 SCHEDULE MATHEMATICS & PERSISTENCE INVARIANT TEST SUITE');
    console.log('===============================================================\n');

    let totalTests = 0;
    let passedTests = 0;

    function test(name, fn) {
        totalTests++;
        if (runTest(name, fn)) passedTests++;
    }

    // -----------------------------------------------------------------
    // Section 1: Validator (validate.js) Invariants
    // -----------------------------------------------------------------
    console.log('📦 Section 1: Backend Validator (validate.js)');

    test('match() preserves jornada (number 1..10)', () => {
        const m1 = v.match({ id: 1, jornada: 1, t1: { name: 'A' }, t2: { name: 'B' } });
        assert.equal(m1.jornada, 1);
        const m4 = v.match({ id: 4, jornada: 4, t1: { name: 'A' }, t2: { name: 'B' } });
        assert.equal(m4.jornada, 4);
        const mStr = v.match({ id: 2, jornada: '3', t1: { name: 'A' }, t2: { name: 'B' } });
        assert.equal(mStr.jornada, 3);
    });

    test('match() accepts string round codes ("J1", "J2", "J3", "J4")', () => {
        for (const code of ['J1', 'J2', 'J3', 'J4', 'JORNADA 1']) {
            const m = v.match({ id: 1, round: code, t1: { name: 'A' }, t2: { name: 'B' } });
            assert.equal(m.round, code, `Failed for code ${code}`);
        }
    });

    test('match() preserves numeric round (0..99)', () => {
        const m = v.match({ id: 1, round: 2, t1: { name: 'A' }, t2: { name: 'B' } });
        assert.equal(m.round, 2);
    });

    test('groups() preserves full team metadata (id, name, logo, grupo, jugadores, tag, bombo)', () => {
        const input = {
            A: [
                {
                    id: 'A1',
                    name: 'Thunder Buddies',
                    logo: '/logo3.png',
                    grupo: 'A',
                    tag: 'TB',
                    bombo: 1,
                    jugadores: ['Brrokeen', 'Pipe'],
                },
                {
                    id: 'A2',
                    name: 'Los Akrtona2',
                    logo: '/logo2.png',
                    grupo: 'A',
                    tag: 'AK',
                    bombo: 2,
                    jugadores: ['Kira', 'Serax'],
                },
            ],
        };
        const validated = v.groups(input);
        assert.ok(validated.A, 'Group A must exist');
        assert.equal(validated.A.length, 2);

        const t1 = validated.A[0];
        assert.equal(t1.id, 'A1');
        assert.equal(t1.name, 'Thunder Buddies');
        assert.equal(t1.logo, '/logo3.png');
        assert.equal(t1.grupo, 'A');
        assert.equal(t1.tag, 'TB');
        assert.equal(t1.bombo, 1);
        assert.deepEqual(t1.jugadores, ['Brrokeen', 'Pipe']);
    });

    // -----------------------------------------------------------------
    // Section 2: Deterministic Schedule Algorithm (scheduleEngine.js)
    // -----------------------------------------------------------------
    console.log('\n⚙️ Section 2: Schedule Engine Invariants');

    test('generateSchedule() generates exactly 32 matches in 4 jornadas of 8', () => {
        const { matches, jornadas } = generateSchedule();
        assert.equal(matches.length, 32);
        assert.equal(jornadas.length, 4);
        jornadas.forEach((j, i) => {
            assert.equal(j.length, 8, `Jornada ${i + 1} must have 8 matches`);
        });
    });

    test('generateSchedule() enforces perfect pot balance for every team', () => {
        const { matches } = generateSchedule();
        // Pots: 1 (index 0), 2 (index 1), 3 (index 2), 4 (index 3)
        // Each team must play 1 rival from Pot 1, 1 from Pot 2, 1 from Pot 3, 1 from Pot 4
        const teamPots = {};
        DEFAULT_BOMBOS.forEach(b => {
            b.teams.forEach(t => {
                teamPots[t.name] = b.bombo;
            });
        });

        const rivalsByTeam = {};
        for (const m of matches) {
            const t1 = m.t1.name;
            const t2 = m.t2.name;
            if (!rivalsByTeam[t1]) rivalsByTeam[t1] = [];
            if (!rivalsByTeam[t2]) rivalsByTeam[t2] = [];
            rivalsByTeam[t1].push(t2);
            rivalsByTeam[t2].push(t1);
        }

        for (const [team, rivals] of Object.entries(rivalsByTeam)) {
            assert.equal(rivals.length, 4, `Team ${team} must have 4 rivals`);
            const potsFaced = rivals.map(r => teamPots[r]).sort((a, b) => a - b);
            assert.deepEqual(potsFaced, [1, 2, 3, 4], `Team ${team} must face pots [1, 2, 3, 4], got: ${JSON.stringify(potsFaced)}`);
        }
    });

    test('getTeamMatchups() returns 4 matches with rival info sorted J1..J4 for any team', () => {
        const { matches } = generateSchedule();
        const matchups = getTeamMatchups('Thunder Buddies', matches);
        assert.equal(matchups.length, 4);
        assert.equal(matchups[0].jornada, 1);
        assert.equal(matchups[1].jornada, 2);
        assert.equal(matchups[2].jornada, 3);
        assert.equal(matchups[3].jornada, 4);

        matchups.forEach((m, idx) => {
            assert.ok(m.rival, `Matchup J${idx + 1} must have rival`);
            assert.ok(m.rivalName, `Matchup J${idx + 1} must have rivalName`);
            assert.notEqual(m.rivalName, 'Thunder Buddies', 'Rival cannot be self');
        });

        // Case-insensitive check
        const lowerMatchups = getTeamMatchups('thunder buddies', matches);
        assert.equal(lowerMatchups.length, 4);
    });

    // -----------------------------------------------------------------
    // Section 3: 10,000 Monte Carlo Permutation Invariant Test
    // -----------------------------------------------------------------
    console.log('\n🎲 Section 3: Monte Carlo Permutation Test (10,000 iterations)');

    test('10,000 random permutations satisfy all schedule invariants with 0 errors', () => {
        const ITERATIONS = 10000;
        const allTeamNames = DEFAULT_BOMBOS.flatMap(b => b.teams.map(t => t.name));
        assert.equal(allTeamNames.length, 16);

        // Fast Fisher-Yates shuffle
        function shuffle(arr) {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = a[i];
                a[i] = a[j];
                a[j] = temp;
            }
            return a;
        }

        const tStart = Date.now();
        let totalCollisions = 0;
        let totalSelfMatches = 0;
        let totalInvalidRuns = 0;

        for (let iter = 0; iter < ITERATIONS; iter++) {
            // Shuffle teams across 4 pots
            const shuffled = shuffle(allTeamNames);
            const pot0 = shuffled.slice(0, 4);
            const pot1 = shuffled.slice(4, 8);
            const pot2 = shuffled.slice(8, 12);
            const pot3 = shuffled.slice(12, 16);

            const { matches, jornadas } = generateSchedule([pot0, pot1, pot2, pot3]);

            if (matches.length !== 32 || jornadas.length !== 4) {
                totalInvalidRuns++;
                continue;
            }

            const rivalries = new Set();
            const teamCounts = {};
            const teamsInJornada = [new Set(), new Set(), new Set(), new Set()];

            for (const m of matches) {
                const n1 = m.t1.name;
                const n2 = m.t2.name;

                if (n1 === n2) {
                    totalSelfMatches++;
                }

                const pair = n1 < n2 ? `${n1}|${n2}` : `${n2}|${n1}`;
                if (rivalries.has(pair)) {
                    totalCollisions++;
                }
                rivalries.add(pair);

                teamCounts[n1] = (teamCounts[n1] || 0) + 1;
                teamCounts[n2] = (teamCounts[n2] || 0) + 1;

                const jIdx = m.jornada - 1;
                teamsInJornada[jIdx].add(n1);
                teamsInJornada[jIdx].add(n2);
            }

            if (rivalries.size !== 32) totalInvalidRuns++;
            if (Object.keys(teamCounts).length !== 16) totalInvalidRuns++;
            for (const count of Object.values(teamCounts)) {
                if (count !== 4) totalInvalidRuns++;
            }
            for (let j = 0; j < 4; j++) {
                if (teamsInJornada[j].size !== 16) totalInvalidRuns++;
            }
        }

        const duration = Date.now() - tStart;
        console.log(`     Completed ${ITERATIONS.toLocaleString()} permutations in ${duration}ms`);
        console.log(`     Collisions: ${totalCollisions} | Self-matches: ${totalSelfMatches} | Invalid: ${totalInvalidRuns}`);

        assert.equal(totalCollisions, 0, 'Must have 0 duplicate rivalries across 10,000 permutations');
        assert.equal(totalSelfMatches, 0, 'Must have 0 self-matches across 10,000 permutations');
        assert.equal(totalInvalidRuns, 0, 'Must have 0 invalid runs across 10,000 permutations');
    });

    // -----------------------------------------------------------------
    // Section 4: Production matches.json Validation
    // -----------------------------------------------------------------
    console.log('\n📄 Section 4: Production matches.json Verification');

    test('matches.json exists and satisfies all schedule invariants', () => {
        const matchesPath = path.join(ROOT_DIR, 'matches.json');
        assert.ok(fs.existsSync(matchesPath), 'matches.json must exist');

        const raw = fs.readFileSync(matchesPath, 'utf8');
        const data = JSON.parse(raw);

        assert.equal(data.drawCompleted, true, 'drawCompleted must be true');
        assert.ok(data.drawnAt, 'drawnAt must be set');
        assert.ok(data.groups, 'groups must exist');
        assert.ok(data.matches, 'matches must exist');
        assert.ok(data.jornadas, 'jornadas must exist');

        const val = validateScheduleInvariants(data);
        if (!val.valid) {
            console.error('Validation errors:', val.errors);
        }
        assert.equal(val.valid, true, `matches.json validation failed: ${val.errors.join('; ')}`);
        assert.equal(val.stats.totalMatches, 32);
        assert.equal(val.stats.uniqueRivalries, 32);
        assert.equal(val.stats.distinctTeams, 16);

        // Every team plays exactly 4 matches
        for (const [team, count] of Object.entries(val.stats.teamCounts)) {
            assert.equal(count, 4, `Team ${team} plays ${count} matches, expected 4`);
        }
    });

    // -----------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`📊 SCHEDULE MATH SUITE RESULTS: ${passedTests}/${totalTests} passed`);
    console.log(`STATUS: ${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '❌ FAILURES DETECTED'}`);
    console.log('===============================================================\n');

    process.exit(passedTests === totalTests ? 0 : 1);
}

main().catch(err => {
    console.error('Unhandled fatal error in test suite:', err);
    process.exit(1);
});
