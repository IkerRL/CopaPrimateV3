/**
 * Copa Primate Vol. III - Deterministic 1-Factorization Schedule Engine
 *
 * Implements a graph-theoretic 1-factorization schedule for 16 teams partitioned into 4 pots:
 * - 4 pots P0, P1, P2, P3 (4 teams each).
 * - J1: P0 <-> P1 and P2 <-> P3 (8 matches)
 * - J2: P0 <-> P2 and P1 <-> P3 (8 matches)
 * - J3: P0 <-> P3 and P1 <-> P2 (8 matches)
 * - J4: Within each pot, P_{k,0} <-> P_{k,1} and P_{k,2} <-> P_{k,3} (8 matches)
 *
 * Mathematical Invariants:
 * 1. Exactly 32 matches total.
 * 2. Exactly 4 jornadas of 8 matches each.
 * 3. Every team plays in every jornada exactly once (a true 1-factor).
 * 4. Zero self-matches (no team plays against itself).
 * 5. Exactly 32 unique unordered rivalries across the tournament (zero duplicate pairs).
 * 6. Every team plays exactly 4 distinct rivals, exactly 1 from each pot (balanced competition).
 */

export const DEFAULT_MAPS = [
    'Haven', 'Split', 'Ascent', 'Bind', 'Sunset', 'Lotus', 'Abyss', 'Icebox',
    'Breeze', 'Fracture', 'Pearl'
];

export const DEFAULT_BOMBOS = [
    { bombo: 1, title: 'Bombo 1 · Cabezas de Serie', teams: [] },
    { bombo: 2, title: 'Bombo 2', teams: [] },
    { bombo: 3, title: 'Bombo 3', teams: [] },
    { bombo: 4, title: 'Bombo 4', teams: [] },
];

/**
 * Normalizes input pots into an array of 4 arrays of team objects.
 */
function normalizePots(potsInput) {
    let rawPots = potsInput;
    if (!rawPots) {
        rawPots = DEFAULT_BOMBOS.map(b => b.teams);
    } else if (typeof rawPots === 'object' && !Array.isArray(rawPots)) {
        // Could be { A: [...], B: [...], C: [...], D: [...] } or { 1: [...], 2: [...], 3: [...], 4: [...] }
        rawPots = Object.values(rawPots);
    }

    if (!Array.isArray(rawPots) || rawPots.length < 4) {
        throw new Error('ScheduleEngine requires 4 pots of 4 teams each');
    }

    const pots = rawPots.slice(0, 4).map((p, potIdx) => {
        const teams = Array.isArray(p) ? p : (Array.isArray(p?.teams) ? p.teams : []);
        if (teams.length < 4) {
            throw new Error(`Pot ${potIdx + 1} has ${teams.length} teams, expected 4`);
        }
        return teams.slice(0, 4).map((t, tIdx) => {
            if (typeof t === 'string') {
                return { name: t, logo: '/copa-logo.png', bombo: potIdx + 1, potIndex: potIdx, teamIndex: tIdx };
            }
            return {
                ...t,
                name: t.name || `Equipo ${potIdx + 1}-${tIdx + 1}`,
                logo: t.logo || '/copa-logo.png',
                bombo: t.bombo ?? (potIdx + 1),
                potIndex: potIdx,
                teamIndex: tIdx,
            };
        });
    });

    return pots;
}

/**
 * Formats a match object.
 */
function createMatch(id, jornada, matchInJornada, t1, t2, options = {}) {
    const maps = options.maps || DEFAULT_MAPS;
    const map = maps[(id - 1) % maps.length];
    const format = options.format || 'BO1';

    return {
        id,
        jornada,
        round: `J${jornada}`,
        date: `Jornada ${jornada} · Partido ${matchInJornada}`,
        map,
        format,
        status: 'Programado',
        score1: 0,
        score2: 0,
        mvp: '',
        t1: {
            name: t1.name,
            logo: t1.logo || '/copa-logo.png',
            ...(t1.grupo ? { grupo: t1.grupo } : {}),
            ...(t1.id ? { id: t1.id } : {}),
        },
        t2: {
            name: t2.name,
            logo: t2.logo || '/copa-logo.png',
            ...(t2.grupo ? { grupo: t2.grupo } : {}),
            ...(t2.id ? { id: t2.id } : {}),
        },
    };
}

/**
 * Generates the 32-match schedule for 16 teams across 4 pots.
 *
 * @param {Array|Object} [potsInput] - 4 pots of 4 teams each
 * @param {Object} [options] - Optional settings (maps, format, startId)
 * @returns {{ matches: Array, jornadas: Array<Array> }}
 */
export function generateSchedule(potsInput, options = {}) {
    const P = normalizePots(potsInput);
    let matchId = options.startId ?? 1;

    // J1: P0 <-> P1 and P2 <-> P3 (8 matches)
    const j1Pairs = [
        [P[0][0], P[1][0]],
        [P[0][1], P[1][1]],
        [P[0][2], P[1][2]],
        [P[0][3], P[1][3]],
        [P[2][0], P[3][0]],
        [P[2][1], P[3][1]],
        [P[2][2], P[3][2]],
        [P[2][3], P[3][3]],
    ];

    // J2: P0 <-> P2 and P1 <-> P3 (8 matches)
    const j2Pairs = [
        [P[0][0], P[2][0]],
        [P[0][1], P[2][1]],
        [P[0][2], P[2][2]],
        [P[0][3], P[2][3]],
        [P[1][0], P[3][0]],
        [P[1][1], P[3][1]],
        [P[1][2], P[3][2]],
        [P[1][3], P[3][3]],
    ];

    // J3: P0 <-> P3 and P1 <-> P2 (8 matches)
    const j3Pairs = [
        [P[0][0], P[3][0]],
        [P[0][1], P[3][1]],
        [P[0][2], P[3][2]],
        [P[0][3], P[3][3]],
        [P[1][0], P[2][0]],
        [P[1][1], P[2][1]],
        [P[1][2], P[2][2]],
        [P[1][3], P[2][3]],
    ];

    // J4: Within each pot, P_{k,0} <-> P_{k,1} and P_{k,2} <-> P_{k,3} (8 matches)
    const j4Pairs = [
        [P[0][0], P[0][1]],
        [P[0][2], P[0][3]],
        [P[1][0], P[1][1]],
        [P[1][2], P[1][3]],
        [P[2][0], P[2][1]],
        [P[2][2], P[2][3]],
        [P[3][0], P[3][1]],
        [P[3][2], P[3][3]],
    ];

    const allJornadaPairs = [j1Pairs, j2Pairs, j3Pairs, j4Pairs];
    const jornadas = [];
    const matches = [];

    for (let jIdx = 0; jIdx < allJornadaPairs.length; jIdx++) {
        const jNum = jIdx + 1;
        const pairs = allJornadaPairs[jIdx];
        const jMatches = [];

        for (let mIdx = 0; mIdx < pairs.length; mIdx++) {
            const [t1, t2] = pairs[mIdx];
            const m = createMatch(matchId++, jNum, mIdx + 1, t1, t2, options);
            jMatches.push(m);
            matches.push(m);
        }

        jornadas.push(jMatches);
    }

    return { matches, jornadas };
}

// Alias for explicit naming
export const generateOneFactorSchedule = generateSchedule;

/**
 * Looks up the 4 matches (J1 to J4) for any team so the moderator can pick teams in any free order.
 *
 * @param {string} teamName - The name of the team to query
 * @param {Array} allMatches - Flat array of 32 matches or array of 4 jornadas
 * @returns {Array} Array of 4 enriched match objects sorted by jornada 1..4
 */
export function getTeamMatchups(teamName, allMatches) {
    if (!teamName || !Array.isArray(allMatches)) return [];
    const flat = Array.isArray(allMatches[0]) ? allMatches.flat() : allMatches;
    const norm = String(teamName).toLowerCase().trim();

    const matches = flat.filter(m => {
        const n1 = String(m?.t1?.name || '').toLowerCase().trim();
        const n2 = String(m?.t2?.name || '').toLowerCase().trim();
        return n1 === norm || n2 === norm;
    });

    matches.sort((a, b) => {
        const jA = Number(a.jornada ?? (typeof a.round === 'string' ? a.round.replace(/\D/g, '') : a.round) ?? 0);
        const jB = Number(b.jornada ?? (typeof b.round === 'string' ? b.round.replace(/\D/g, '') : b.round) ?? 0);
        return jA - jB;
    });

    return matches.map(m => {
        const isT1 = String(m?.t1?.name || '').toLowerCase().trim() === norm;
        const rival = isT1 ? m.t2 : m.t1;
        const jornada = m.jornada ?? (typeof m.round === 'string' ? Number(m.round.replace(/\D/g, '')) : m.round);
        return {
            ...m,
            jornada,
            rival,
            rivalName: rival?.name || '',
            rivalLogo: rival?.logo || '',
        };
    });
}

/**
 * Validates all schedule invariants.
 *
 * @param {Array} matchesOrData - Array of matches, array of jornadas, or object { matches, jornadas }
 * @param {number} [expectedTeams=16] - Expected team count
 * @returns {{ valid: boolean, errors: string[], stats: Object }}
 */
export function validateScheduleInvariants(matchesOrData, expectedTeams = 16) {
    const errors = [];
    let matches = [];
    let jornadas = null;

    if (Array.isArray(matchesOrData)) {
        if (Array.isArray(matchesOrData[0])) {
            jornadas = matchesOrData;
            matches = matchesOrData.flat();
        } else {
            matches = matchesOrData;
        }
    } else if (matchesOrData && typeof matchesOrData === 'object') {
        matches = matchesOrData.matches || [];
        jornadas = matchesOrData.jornadas || null;
    }

    const expectedMatches = (expectedTeams * 4) / 2; // 32
    if (matches.length !== expectedMatches) {
        errors.push(`Expected exactly ${expectedMatches} matches, found ${matches.length}`);
    }

    // Check jornadas if present
    if (jornadas) {
        if (jornadas.length !== 4) {
            errors.push(`Expected 4 jornadas, found ${jornadas.length}`);
        }
        jornadas.forEach((jList, idx) => {
            if (!Array.isArray(jList) || jList.length !== 8) {
                errors.push(`Jornada ${idx + 1} has ${jList?.length} matches, expected 8`);
            }
        });
    }

    const rivalries = new Set();
    const teamCounts = {};
    const teamsByJornada = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };

    for (const m of matches) {
        const n1 = m.t1?.name;
        const n2 = m.t2?.name;

        if (!n1 || !n2) {
            errors.push(`Match ${m.id} has invalid team: t1=${n1}, t2=${n2}`);
            continue;
        }

        if (n1 === n2) {
            errors.push(`Self-match detected: ${n1} vs ${n2} in match ${m.id}`);
        }

        const pair = [n1, n2].sort().join(' vs ');
        if (rivalries.has(pair)) {
            errors.push(`Duplicate rivalry detected: ${pair}`);
        }
        rivalries.add(pair);

        teamCounts[n1] = (teamCounts[n1] || 0) + 1;
        teamCounts[n2] = (teamCounts[n2] || 0) + 1;

        const jNum = m.jornada ?? (typeof m.round === 'string' ? Number(m.round.replace(/\D/g, '')) : null);
        if (jNum && teamsByJornada[jNum]) {
            if (teamsByJornada[jNum].has(n1)) {
                errors.push(`Team ${n1} plays multiple times in Jornada ${jNum}`);
            }
            if (teamsByJornada[jNum].has(n2)) {
                errors.push(`Team ${n2} plays multiple times in Jornada ${jNum}`);
            }
            teamsByJornada[jNum].add(n1);
            teamsByJornada[jNum].add(n2);
        }
    }

    const distinctTeams = Object.keys(teamCounts);
    if (distinctTeams.length !== expectedTeams) {
        errors.push(`Expected ${expectedTeams} distinct teams, found ${distinctTeams.length}`);
    }

    for (const [team, count] of Object.entries(teamCounts)) {
        if (count !== 4) {
            errors.push(`Team ${team} plays ${count} matches, expected exactly 4`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        stats: {
            totalMatches: matches.length,
            uniqueRivalries: rivalries.size,
            distinctTeams: distinctTeams.length,
            teamCounts,
        },
    };
}
