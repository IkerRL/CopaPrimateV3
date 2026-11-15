/**
 * Schedule Math Oracle for Copa OBS Stream & Sorteo Champions League
 * Implements canonical 1-factorization schedule generation and mathematical validation.
 */

export const CANONICAL_POTS = {
  A: [
    { id: 'A1', name: 'Thunder Buddies', pot: 1, grupo: 'A', logo: '/logo3.png', jugadores: ['Brrokeen', 'Pipe'] },
    { id: 'A2', name: 'Los Akrtona2', pot: 2, grupo: 'A', logo: '/logo2.png', jugadores: ['Kira', 'Serax'] },
    { id: 'A3', name: 'Chuu-Chuu 100% MAX', pot: 3, grupo: 'A', logo: '/logo8.png', jugadores: ['MakaQuillo', 'Max'] },
    { id: 'A4', name: 'REHENKARMACIÓN', pot: 4, grupo: 'A', logo: '/logo1.png', jugadores: ['Satha', 'Makflat'] },
  ],
  B: [
    { id: 'B1', name: 'Entry Baiters', pot: 1, grupo: 'B', logo: '/logo5.png', jugadores: ['レックウザ', 'Militantedelsoe'] },
    { id: 'B2', name: 'Dream Team', pot: 2, grupo: 'B', logo: '/logo7.png', jugadores: ['JoKker', 'Pepardo'] },
    { id: 'B3', name: 'Makaco Ninja-Pelocho', pot: 3, grupo: 'B', logo: '/logo6.png', jugadores: ['MakacoNinja', 'Iker 😎'] },
    { id: 'B4', name: 'Kizuna', pot: 4, grupo: 'B', logo: '/logo4.png', jugadores: ['Alezita', 'Sarix'] },
  ],
  C: [
    { id: 'C1', name: 'Sakura', pot: 1, grupo: 'C', logo: '/logo14.png', jugadores: ['Gustavo', 'Carlos'] },
    { id: 'C2', name: 'Soul Resonance', pot: 2, grupo: 'C', logo: '/logo11.png', jugadores: ['KrypT', 'Charly'] },
    { id: 'C3', name: 'Stranger Picks', pot: 3, grupo: 'C', logo: '/logo9.png', jugadores: ['TheDori', 'Sotomi'] },
    { id: 'C4', name: 'MARIIKS', pot: 4, grupo: 'C', logo: '/logo10.png', jugadores: ['Acid', 'Bru'] },
  ],
  D: [
    { id: 'D1', name: 'Primates FC', pot: 1, grupo: 'D', logo: '/logo12.png', jugadores: ['Knekro', 'IlloJuan'] },
    { id: 'D2', name: 'Chimp Squad', pot: 2, grupo: 'D', logo: '/logo13.png', jugadores: ['Boaster', 'Derke'] },
    { id: 'D3', name: 'Banana Kings', pot: 3, grupo: 'D', logo: '/logo15.png', jugadores: ['Maka', 'Mixwell'] },
    { id: 'D4', name: 'Golden Gorillas', pot: 4, grupo: 'D', logo: '/logo10.png', jugadores: ['TenZ', 'ScreaM'] },
  ],
};

/**
 * Generates the reference 32-match schedule across 4 jornadas.
 * Inter-group pairings in J1-J3, Intra-group pairings in J4.
 */
export function generateReferenceSchedule(grupos = CANONICAL_POTS) {
  const gA = grupos.A || [];
  const gB = grupos.B || [];
  const gC = grupos.C || [];
  const gD = grupos.D || [];

  if (gA.length < 4 || gB.length < 4 || gC.length < 4 || gD.length < 4) {
    throw new Error('All 4 groups must contain at least 4 teams to generate schedule');
  }

  // J1: A vs B, C vs D
  const j1Raw = [
    { t1: gA[0], t2: gB[0] },
    { t1: gA[1], t2: gB[1] },
    { t1: gA[2], t2: gB[2] },
    { t1: gA[3], t2: gB[3] },
    { t1: gC[0], t2: gD[0] },
    { t1: gC[1], t2: gD[1] },
    { t1: gC[2], t2: gD[2] },
    { t1: gC[3], t2: gD[3] },
  ];

  // J2: A vs C, B vs D
  const j2Raw = [
    { t1: gA[0], t2: gC[0] },
    { t1: gA[1], t2: gC[1] },
    { t1: gA[2], t2: gC[2] },
    { t1: gA[3], t2: gC[3] },
    { t1: gB[0], t2: gD[0] },
    { t1: gB[1], t2: gD[1] },
    { t1: gB[2], t2: gD[2] },
    { t1: gB[3], t2: gD[3] },
  ];

  // J3: A vs D, B vs C
  const j3Raw = [
    { t1: gA[0], t2: gD[0] },
    { t1: gA[1], t2: gD[1] },
    { t1: gA[2], t2: gD[2] },
    { t1: gA[3], t2: gD[3] },
    { t1: gB[0], t2: gC[0] },
    { t1: gB[1], t2: gC[1] },
    { t1: gB[2], t2: gC[2] },
    { t1: gB[3], t2: gC[3] },
  ];

  // J4: Intra-group pairings (A0-A1, A2-A3, B0-B1, B2-B3, C0-C1, C2-C3, D0-D1, D2-D3)
  const j4Raw = [
    { t1: gA[0], t2: gA[1] },
    { t1: gA[2], t2: gA[3] },
    { t1: gB[0], t2: gB[1] },
    { t1: gB[2], t2: gB[3] },
    { t1: gC[0], t2: gC[1] },
    { t1: gC[2], t2: gC[3] },
    { t1: gD[0], t2: gD[1] },
    { t1: gD[2], t2: gD[3] },
  ];

  let matchIndex = 1;
  const formatList = (rawList, jNum) =>
    rawList.map((p, idx) => ({
      id: matchIndex++,
      jornada: jNum,
      round: `J${jNum}`,
      t1: { name: p.t1.name, logo: p.t1.logo || '/copa-logo.png', grupo: p.t1.grupo },
      t2: { name: p.t2.name, logo: p.t2.logo || '/copa-logo.png', grupo: p.t2.grupo },
      score1: 0,
      score2: 0,
      status: 'Programado',
      format: 'BO1 (Swiftplay)',
      date: `Jornada ${jNum} · Partido ${idx + 1}`,
    }));

  const jornadas = [
    formatList(j1Raw, 1),
    formatList(j2Raw, 2),
    formatList(j3Raw, 3),
    formatList(j4Raw, 4),
  ];

  return {
    jornadas,
    matches: jornadas.flat(),
  };
}

/**
 * Validates the mathematical assertions required for the 32-match schedule.
 */
export function validateScheduleMath(matches, jornadas) {
  const errors = [];

  if (!Array.isArray(matches)) {
    return { valid: false, errors: ['matches must be an array'] };
  }

  // 1. Total match count = 32
  if (matches.length !== 32) {
    errors.push(`Expected 32 matches, got ${matches.length}`);
  }

  // 2. Jornadas structure if provided
  if (jornadas) {
    if (!Array.isArray(jornadas) || jornadas.length !== 4) {
      errors.push(`Expected 4 jornadas, got ${jornadas?.length}`);
    } else {
      jornadas.forEach((jList, idx) => {
        if (!Array.isArray(jList) || jList.length !== 8) {
          errors.push(`Jornada ${idx + 1} expected 8 matches, got ${jList?.length}`);
        }
      });
    }
  }

  // 3. Team match counts and uniqueness
  const teamMatchCounts = new Map();
  const pairCounts = new Map();
  const matchIds = new Set();
  const jornadaTeamPresence = [new Set(), new Set(), new Set(), new Set()];

  for (const m of matches) {
    // ID uniqueness
    if (m.id !== undefined) {
      if (matchIds.has(m.id)) {
        errors.push(`Duplicate match ID found: ${m.id}`);
      }
      matchIds.add(m.id);
    }

    const t1 = m.t1?.name?.trim();
    const t2 = m.t2?.name?.trim();

    if (!t1 || !t2) {
      errors.push(`Match ${m.id || '?'} is missing t1 or t2 name`);
      continue;
    }

    // Zero self-matches
    if (t1.toLowerCase() === t2.toLowerCase()) {
      errors.push(`Self-match detected: ${t1} vs ${t2} in match ${m.id}`);
    }

    // Participation count
    teamMatchCounts.set(t1, (teamMatchCounts.get(t1) || 0) + 1);
    teamMatchCounts.set(t2, (teamMatchCounts.get(t2) || 0) + 1);

    // Duplicate pairings (undirected pair key)
    const pairKey = [t1, t2].sort().join(' vs ');
    pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
    if (pairCounts.get(pairKey) > 1) {
      errors.push(`Duplicate pairing detected: "${pairKey}" appeared ${pairCounts.get(pairKey)} times`);
    }

    // Per-jornada single match constraint
    const jNum = Number(m.jornada) || (m.round ? Number(String(m.round).replace(/\D/g, '')) : 0);
    if (jNum >= 1 && jNum <= 4) {
      const set = jornadaTeamPresence[jNum - 1];
      if (set.has(t1)) {
        errors.push(`Team "${t1}" plays more than 1 match in Jornada ${jNum}`);
      }
      if (set.has(t2)) {
        errors.push(`Team "${t2}" plays more than 1 match in Jornada ${jNum}`);
      }
      set.add(t1);
      set.add(t2);
    }
  }

  // Exactly 16 teams
  if (teamMatchCounts.size !== 16) {
    errors.push(`Expected 16 unique participating teams, got ${teamMatchCounts.size}`);
  }

  // Exactly 4 matches per team
  for (const [teamName, count] of teamMatchCounts.entries()) {
    if (count !== 4) {
      errors.push(`Team "${teamName}" scheduled for ${count} matches, expected exactly 4`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    teamCount: teamMatchCounts.size,
    matchCount: matches.length,
    pairCount: pairCounts.size,
  };
}
