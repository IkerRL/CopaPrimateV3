import assert from 'node:assert/strict';
import fs from 'fs';
import { getPlayerRank, getRankIconUrl, parseValorantTier, VALORANT_TIERS, VALORANT_TIER_UUID } from '../dashboard/src/utils/valorantRanks.js';

console.log('--- Running Valorant Ranks & Roster Resolution Tests ---');

// 1. Verify UUID
assert.equal(VALORANT_TIER_UUID, '03621f52-342b-cf4e-4f86-9350a49c6d04');

// 2. Verify Brrokeen specifically (Immortal 2 -> Tier 25)
const brookeenRank = getPlayerRank('Brrokeen');
assert.equal(brookeenRank, 'Inmortal 2');
const brookeenTier = parseValorantTier(brookeenRank);
assert.equal(brookeenTier, 25);
const brookeenUrl = getRankIconUrl(brookeenRank);
assert.equal(brookeenUrl, 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/25/largeicon.png');
assert.notEqual(brookeenTier, 16, 'Brrokeen should NOT resolve to fallback Platino 2 (tier 16)');

// 3. Verify Tier parsing and icon URLs across the rank spectrum
const testCases = [
  { player: 'aspas', group: 'A', expectedRank: 'Radiante', expectedTier: 27 },
  { player: 'MakaQuillo', group: 'A', expectedRank: 'Inmortal 3', expectedTier: 26 },
  { player: 'Brrokeen', group: 'A', expectedRank: 'Inmortal 2', expectedTier: 25 },
  { player: 'Pipe', group: 'A', expectedRank: 'Inmortal 1', expectedTier: 24 },
  { player: 'Iker', group: 'B', expectedRank: 'Ascendente 3', expectedTier: 23 },
  { player: 'JoKker', group: 'B', expectedRank: 'Ascendente 2', expectedTier: 22 },
  { player: 'Pepardo', group: 'B', expectedRank: 'Ascendente 1', expectedTier: 21 },
  { player: 'Gustavo', group: 'C', expectedRank: 'Diamante 3', expectedTier: 20 },
  { player: 'TenZ', group: 'A', expectedRank: 'Diamante 2', expectedTier: 19 },
  { player: 'KrypT', group: 'C', expectedRank: 'Diamante 1', expectedTier: 18 },
  { player: 'Satha', group: 'C', expectedRank: 'Platino 3', expectedTier: 17 },
  { player: 'Mixwell', group: 'A', expectedRank: 'Platino 2', expectedTier: 16 },
  { player: 'Alezita', group: 'C', expectedRank: 'Platino 1', expectedTier: 15 },
  { player: 'Kyedae', group: 'D', expectedRank: 'Oro 3', expectedTier: 14 },
  { player: 'Knekro', group: 'D', expectedRank: 'Oro 2', expectedTier: 13 },
  { player: 'Bru', group: 'D', expectedRank: 'Oro 1', expectedTier: 12 },
  { player: 'ScreaM', group: 'D', expectedRank: 'Plata 3', expectedTier: 11 },
  { player: 'IlloJuan', group: 'D', expectedRank: 'Plata 2', expectedTier: 10 },
  { player: 'Boaster', group: 'D', expectedRank: 'Plata 1', expectedTier: 9 },
  { player: 'Derke', group: 'D', expectedRank: 'Bronce 3', expectedTier: 8 },
  { player: 'UnrankedA', group: 'A', expectedRank: 'Inmortal 1', expectedTier: 24 },
  { player: 'UnrankedB', group: 'B', expectedRank: 'Ascendente 2', expectedTier: 22 },
  { player: 'UnrankedC', group: 'C', expectedRank: 'Diamante 2', expectedTier: 19 },
  { player: 'UnrankedD', group: 'D', expectedRank: 'Platino 2', expectedTier: 16 },
];

for (const tc of testCases) {
  const rank = getPlayerRank(tc.player, tc.group);
  assert.equal(rank, tc.expectedRank, `Player ${tc.player} rank mismatch`);
  const tier = parseValorantTier(rank, tc.group);
  assert.equal(tier, tc.expectedTier, `Player ${tc.player} tier mismatch`);
  const icon = getRankIconUrl(rank, tc.group);
  assert.ok(icon.includes(`/${tc.expectedTier}/largeicon.png`), `Player ${tc.player} icon tier mismatch`);
}

// 4. Verify CopaGruposLiga.jsx static bindings: no rInfo.tier or rankInfo.tier calls
const copaContent = fs.readFileSync('dashboard/src/components/CopaGruposLiga.jsx', 'utf8');
assert.ok(!copaContent.includes('rInfo.tier'), 'CopaGruposLiga.jsx must not reference rInfo.tier');
assert.ok(!copaContent.includes('rankInfo.tier'), 'CopaGruposLiga.jsx must not reference rankInfo.tier');
assert.ok(copaContent.includes('getRankIconUrl(pRank, tier.key)'), 'CopaGruposLiga.jsx fixed groups must use getRankIconUrl(pRank, tier.key)');
assert.ok(copaContent.includes("getRankIconUrl(pRank, zoomedTeam.grupo || 'A')"), 'CopaGruposLiga.jsx zoom modal must use getRankIconUrl(pRank, zoomedTeam.grupo || "A")');

console.log('✅ All Valorant Ranks & Roster Resolution Tests Passed Successfully!');
