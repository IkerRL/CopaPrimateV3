/**
 * Valorant Rank Utilities and Official Asset Resolvers
 * 
 * Uses official Valorant API CDN competitive tier asset catalog:
 * UUID: 03621f52-342b-cf4e-4f86-9350a49c6d04
 */

export const VALORANT_TIER_UUID = '03621f52-342b-cf4e-4f86-9350a49c6d04';

export const VALORANT_TIERS = {
  UNRANKED: 0,
  HIERRO_1: 3, HIERRO_2: 4, HIERRO_3: 5,
  BRONCE_1: 6, BRONCE_2: 7, BRONCE_3: 8,
  PLATA_1: 9, PLATA_2: 10, PLATA_3: 11,
  ORO_1: 12, ORO_2: 13, ORO_3: 14,
  PLATINO_1: 15, PLATINO_2: 16, PLATINO_3: 17,
  DIAMANTE_1: 18, DIAMANTE_2: 19, DIAMANTE_3: 20,
  ASCENDENTE_1: 21, ASCENDENTE_2: 22, ASCENDENTE_3: 23,
  INMORTAL_1: 24, INMORTAL_2: 25, INMORTAL_3: 26,
  RADIANTE: 27,
};

export const RANK_ICONS = {
  Hierro: `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/5/largeicon.png`,
  Bronce: `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/8/largeicon.png`,
  Plata: `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/11/largeicon.png`,
  Oro: `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/14/largeicon.png`,
  Platino: `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/17/largeicon.png`,
  Diamante: `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/20/largeicon.png`,
  Ascendente: `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/23/largeicon.png`,
  Inmortal: `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/26/largeicon.png`,
  Radiante: `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/27/largeicon.png`,
};

export const PLAYER_RANKS = {};

/**
 * Parses any rank representation into the official Valorant competitive tier number (0 to 27).
 *
 * @param {string|number|object} rankInput 
 * @param {string} [groupFallback] 'A', 'B', 'C', or 'D'
 * @returns {number} Tier number (0 to 27)
 */
export function parseValorantTier(rankInput, groupFallback) {
  if (typeof rankInput === 'number') {
    if (rankInput >= 3 && rankInput <= 27) return rankInput;
    // Map index 0-8 to division 2 of each rank
    const indexMap = [4, 7, 10, 13, 16, 19, 22, 25, 27];
    if (rankInput >= 0 && rankInput < indexMap.length) return indexMap[rankInput];
  }

  let text = '';
  if (typeof rankInput === 'string') {
    text = rankInput.trim();
  } else if (rankInput && typeof rankInput === 'object') {
    text = (rankInput.currentRank || rankInput.rank || rankInput.tierName || '').trim();
  }

  if (!text) {
    if (groupFallback === 'A') return VALORANT_TIERS.INMORTAL_1;
    if (groupFallback === 'B') return VALORANT_TIERS.ASCENDENTE_2;
    if (groupFallback === 'C') return VALORANT_TIERS.DIAMANTE_2;
    if (groupFallback === 'D') return VALORANT_TIERS.PLATINO_2;
    return VALORANT_TIERS.PLATINO_2;
  }

  const clean = text.toLowerCase();

  // Division detection (1, 2, 3)
  let div = 2; // Default to mid-division
  if (clean.includes('1') || clean.endsWith(' i')) div = 1;
  else if (clean.includes('3') || clean.endsWith(' iii')) div = 3;
  else if (clean.includes('2') || clean.endsWith(' ii')) div = 2;

  if (clean.includes('radiant') || clean.includes('radiante')) {
    return VALORANT_TIERS.RADIANTE;
  }
  if (clean.includes('inmortal') || clean.includes('immortal')) {
    return div === 1 ? VALORANT_TIERS.INMORTAL_1 : div === 3 ? VALORANT_TIERS.INMORTAL_3 : VALORANT_TIERS.INMORTAL_2;
  }
  if (clean.includes('ascend') || clean.includes('ascendant')) {
    return div === 1 ? VALORANT_TIERS.ASCENDENTE_1 : div === 3 ? VALORANT_TIERS.ASCENDENTE_3 : VALORANT_TIERS.ASCENDENTE_2;
  }
  if (clean.includes('diaman') || clean.includes('diamond')) {
    return div === 1 ? VALORANT_TIERS.DIAMANTE_1 : div === 3 ? VALORANT_TIERS.DIAMANTE_3 : VALORANT_TIERS.DIAMANTE_2;
  }
  if (clean.includes('platin') || clean.includes('platinum')) {
    return div === 1 ? VALORANT_TIERS.PLATINO_1 : div === 3 ? VALORANT_TIERS.PLATINO_3 : VALORANT_TIERS.PLATINO_2;
  }
  if (clean.includes('oro') || clean.includes('gold')) {
    return div === 1 ? VALORANT_TIERS.ORO_1 : div === 3 ? VALORANT_TIERS.ORO_3 : VALORANT_TIERS.ORO_2;
  }
  if (clean.includes('plata') || clean.includes('silver')) {
    return div === 1 ? VALORANT_TIERS.PLATA_1 : div === 3 ? VALORANT_TIERS.PLATA_3 : VALORANT_TIERS.PLATA_2;
  }
  if (clean.includes('bronce') || clean.includes('bronze')) {
    return div === 1 ? VALORANT_TIERS.BRONCE_1 : div === 3 ? VALORANT_TIERS.BRONCE_3 : VALORANT_TIERS.BRONCE_2;
  }
  if (clean.includes('hierro') || clean.includes('iron')) {
    return div === 1 ? VALORANT_TIERS.HIERRO_1 : div === 3 ? VALORANT_TIERS.HIERRO_3 : VALORANT_TIERS.HIERRO_2;
  }
  if (clean.includes('unranked') || clean.includes('sin rango')) {
    return VALORANT_TIERS.UNRANKED;
  }

  // Fallback by group
  if (groupFallback === 'A') return VALORANT_TIERS.INMORTAL_1;
  if (groupFallback === 'B') return VALORANT_TIERS.ASCENDENTE_2;
  if (groupFallback === 'C') return VALORANT_TIERS.DIAMANTE_2;
  if (groupFallback === 'D') return VALORANT_TIERS.PLATINO_2;

  return VALORANT_TIERS.PLATINO_2;
}

/**
 * Returns the official Valorant API CDN large icon URL for the rank.
 *
 * @param {string|number|object} rankInput 
 * @param {string} [groupFallback] 'A', 'B', 'C', or 'D'
 * @returns {string} Fully qualified CDN image URL
 */
export function getRankIconUrl(rankInput, groupFallback) {
  const tier = parseValorantTier(rankInput, groupFallback);
  return `https://media.valorant-api.com/competitivetiers/${VALORANT_TIER_UUID}/${tier}/largeicon.png`;
}

/**
 * Resolves a player's rank string formatted for display.
 *
 * @param {string|object} player Player name or object
 * @param {string} [teamGroup] Group A, B, C, or D
 * @returns {string} Human-readable rank string (e.g. "Diamante 2")
 */
export function getPlayerRank(player, teamGroup) {
  if (typeof player === 'object' && player) {
    if (player.currentRank) return player.currentRank;
    if (player.rank) return player.rank;
    if (player.name && PLAYER_RANKS[player.name]) return PLAYER_RANKS[player.name];
  }

  const nameStr = typeof player === 'string' ? player : (player?.name || '');
  if (PLAYER_RANKS[nameStr]) return PLAYER_RANKS[nameStr];

  for (const [k, v] of Object.entries(PLAYER_RANKS)) {
    if (nameStr.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(nameStr.toLowerCase())) {
      return v;
    }
  }

  if (teamGroup === 'A') return 'Inmortal 1';
  if (teamGroup === 'B') return 'Ascendente 2';
  if (teamGroup === 'C') return 'Diamante 2';
  return 'Platino 2';
}

/**
 * Legacy compatibility helper
 */
export function getRankIcon(rankName) {
  if (!rankName) return null;
  return getRankIconUrl(rankName);
}
