import { Router } from 'express';
import { loadTeams, loadMatches, loadLiveMatch, loadOverlayState, loadWebSettings } from '../store.js';

// ===== Rutas públicas (web oficial) =====
// Solo lectura y SIN datos confidenciales: los equipos ocultos se envían anonimizados.

const router = Router();

const isHiddenTeam = (t) => t.hidden !== false || t.status === 'Aprobado (Oculto)' || t.status === 'Oculto';

export function toPublicTeams(teams) {
    let slot = 0;
    return teams.map((t) => {
        if (isHiddenTeam(t)) {
            slot++;
            return {
                id: `hidden-${slot}`,
                hidden: true,
                slot,
                playerCount: Array.isArray(t.players) ? Math.min(t.players.length, 3) : 3,
                validatedAt: t.validatedAt,
            };
        }
        return {
            id: t.id,
            name: t.name,
            logo: t.logo,
            hidden: false,
            players: (t.players || []).map(p => ({
                name: p.name,
                rank: p.rank,
                currentRank: p.currentRank,
                peakRank: p.peakRank,
                points: p.points,
                level: p.level,
                agent: p.agent,
                stats: p.stats,
                agents: p.agents,
                cupsPlayed: p.cupsPlayed,
            })),
            totalPoints: t.totalPoints,
            overLimitApproved: !!t.overLimitApproved,
            cupsPlayed: t.cupsPlayed,
            topAgents: t.topAgents,
            validatedAt: t.validatedAt,
        };
    });
}

const isFinished = (m) => /final/i.test(m?.status || '');
const isLive = (m) => /live|vivo|directo/i.test(m?.status || '');

// Clasificación calculada a partir de los partidos finalizados (3 pts por victoria)
export function computeStandings({ groups = {}, matches = [] }) {
    const table = new Map();
    const ensure = (t) => {
        const name = t?.name;
        if (!name) return null;
        if (!table.has(name)) {
            table.set(name, { team: name, logo: t.logo, group: null, p: 0, w: 0, l: 0, d: 0, points: 0, roundsFor: 0, roundsAgainst: 0, form: [] });
        }
        return table.get(name);
    };

    for (const [g, list] of Object.entries(groups)) {
        for (const t of list || []) {
            const row = ensure(t);
            if (row) row.group = g;
        }
    }

    const finished = matches.filter(isFinished);
    for (const m of finished) {
        const a = ensure(m.t1);
        const b = ensure(m.t2);
        if (!a || !b) continue;
        const s1 = Number(m.score1) || 0;
        const s2 = Number(m.score2) || 0;
        a.p++; b.p++;
        a.roundsFor += s1; a.roundsAgainst += s2;
        b.roundsFor += s2; b.roundsAgainst += s1;
        if (s1 > s2) { a.w++; b.l++; a.points += 3; a.form.push('W'); b.form.push('L'); }
        else if (s2 > s1) { b.w++; a.l++; b.points += 3; b.form.push('W'); a.form.push('L'); }
        else { a.d++; b.d++; a.points++; b.points++; a.form.push('D'); b.form.push('D'); }
    }

    const rows = [...table.values()]
        .map(r => ({ ...r, diff: r.roundsFor - r.roundsAgainst, form: r.form.slice(-5) }))
        .sort((x, y) => y.points - x.points || y.diff - x.diff || y.roundsFor - x.roundsFor || x.team.localeCompare(y.team));
    rows.forEach((r, i) => { r.rank = i + 1; });

    return { standings: rows, finishedMatches: finished.length };
}

router.get('/teams', (req, res) => {
    const teams = toPublicTeams(loadTeams());
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ teams });
});

router.get('/matches', (req, res) => {
    const data = loadMatches();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
        drawCompleted: !!data.drawCompleted,
        drawnAt: data.drawnAt || null,
        groups: data.groups || {},
        matches: data.matches || [],
    });
});

router.get('/standings', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(computeStandings(loadMatches()));
});

router.get('/live-match', (req, res) => {
    const match = loadLiveMatch();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (req.query.overlay === '1' || req.query.all === '1') {
        return res.json({ match: match || null });
    }
    res.json({ match: match && match.active !== false ? match : null });
});

router.get('/overlay-state', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(loadOverlayState());
});

router.get('/settings', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(loadWebSettings());
});

// Resumen ligero para la portada
router.get('/summary', (req, res) => {
    const teams = loadTeams();
    const { matches = [] } = loadMatches();
    const live = loadLiveMatch();
    const settings = loadWebSettings();
    const nextMatch = matches.find(m => !isFinished(m) && !isLive(m)) || null;
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
        teamsCount: teams.length,
        totalSlots: 16,
        playersCount: teams.reduce((s, t) => s + (t.players?.length || 0), 0),
        hiddenCount: teams.filter(isHiddenTeam).length,
        matchesPlayed: matches.filter(isFinished).length,
        matchesTotal: matches.length,
        liveMatch: live && live.active !== false ? live : null,
        nextMatch,
        settings,
    });
});

export default router;
