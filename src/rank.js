// ===== Ponderación de Rangos y Evaluación de Jugadores =====

const RANK_TABLE = [
    { keys: ['radiant', 'radiante'], name: 'Radiante', tierIndex: 7, points: 8 },
    { keys: ['immortal', 'inmortal'], name: 'Inmortal', tierIndex: 7, points: 8 },
    { keys: ['ascendant', 'ascendente'], name: 'Ascendente', tierIndex: 6, points: 7 },
    { keys: ['diamond', 'diamante'], name: 'Diamante', tierIndex: 5, points: 6 },
    { keys: ['platinum', 'platino'], name: 'Platino', tierIndex: 4, points: 5 },
    { keys: ['gold', 'oro'], name: 'Oro', tierIndex: 3, points: 4 },
    { keys: ['silver', 'plata'], name: 'Plata', tierIndex: 2, points: 3 },
    { keys: ['bronze', 'bronce'], name: 'Bronce', tierIndex: 1, points: 2 },
    { keys: ['iron', 'hierro'], name: 'Hierro', tierIndex: 0, points: 1 },
];

const UNRANKED = { name: 'Unranked', tierIndex: 0, points: 1 };

export function parseRank(rankStr) {
    if (!rankStr || typeof rankStr !== 'string') return { ...UNRANKED };
    const s = rankStr.toLowerCase();
    const found = RANK_TABLE.find(r => r.keys.some(k => s.includes(k)));
    if (!found) return { ...UNRANKED };
    const { keys, ...rank } = found;
    return rank;
}

export function evaluatePlayerRank(currentRankStr, peakRankStr, peakSeasonStr, bySeasonObj = {}) {
    const current = parseRank(currentRankStr);
    const peak = parseRank(peakRankStr || currentRankStr);

    let currentPoints = current.points;
    const peakPoints = Math.max(peak.points, currentPoints);

    let recencyCategory = 'Reciente';
    let weightCurrent = 0.50;
    let weightPeak = 0.50;
    let explanation = 'Media estándar 50/50 entre rango actual y peak reciente.';

    if (peakSeasonStr) {
        const m = peakSeasonStr.toLowerCase().match(/e(\d+)a(\d+)/);
        if (m) {
            const ep = parseInt(m[1], 10);
            if (ep <= 5) {
                recencyCategory = `Antiguo (Episodio ${ep})`;
                weightCurrent = 0.70;
                weightPeak = 0.30;
                explanation = `Peak en ${peakSeasonStr.toUpperCase()} (hace varios episodios). Ponderado 70% actual / 30% peak por antigüedad.`;
            } else if (ep <= 7) {
                recencyCategory = `Moderado (Episodio ${ep})`;
                weightCurrent = 0.60;
                weightPeak = 0.40;
                explanation = `Peak en ${peakSeasonStr.toUpperCase()}. Ponderado 60% actual / 40% peak.`;
            } else {
                recencyCategory = `Reciente (Episodio ${ep})`;
                explanation = `Peak reciente en ${peakSeasonStr.toUpperCase()}. Media 50/50.`;
            }
        }
    }

    // Sin rango activo: usar el último rango final de temporada conocido
    if (currentRankStr?.toLowerCase().includes('unranked') && bySeasonObj) {
        const seasons = Object.keys(bySeasonObj).sort().reverse();
        for (const s of seasons) {
            const entry = bySeasonObj[s];
            if (entry?.final_rank_patched && !entry.final_rank_patched.toLowerCase().includes('unranked')) {
                currentPoints = parseRank(entry.final_rank_patched).points;
                explanation += ` (Sin rango activo: considerado ${entry.final_rank_patched} de ${s.toUpperCase()})`;
                break;
            }
        }
    }

    const rawAvg = (currentPoints * weightCurrent) + (peakPoints * weightPeak);
    const evaluatedPoints = Math.round(rawAvg * 10) / 10;
    const effectiveTier = Math.max(0, Math.min(7, Math.round(evaluatedPoints) - 1));

    return {
        currentRank: currentRankStr || 'Unranked',
        currentPoints,
        peakRank: peakRankStr || currentRankStr || 'Unranked',
        peakPoints,
        peakSeason: peakSeasonStr || 'Actual',
        recencyCategory,
        evaluatedPoints,
        effectiveTier,
        explanation,
    };
}
