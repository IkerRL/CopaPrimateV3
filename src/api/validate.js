// ===== Validación y saneado de datos de entrada =====

export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.status = 400;
    }
}

export const str = (v, max = 200, fallback = '') => {
    if (v === undefined || v === null) return fallback;
    return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
};

export const num = (v, min = 0, max = 1e6, fallback = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
};

export const bool = (v, fallback = false) => (typeof v === 'boolean' ? v : fallback);

export const hexColor = (v, fallback) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback);

// Logos: rutas locales (/logo.png), URLs http(s) o imágenes en data URL (máx ~1.5 MB)
export function logo(v, fallback = '/copa-logo.png') {
    if (typeof v !== 'string' || !v) return fallback;
    if (v.startsWith('/') && v.length <= 300 && !v.includes('..')) return v;
    if (/^https?:\/\//i.test(v) && v.length <= 2000) return v;
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v) && v.length <= 1_500_000) return v;
    return fallback;
}

// IDs de Discord (snowflakes)
export const isSnowflake = (v) => typeof v === 'string' && /^\d{15,22}$/.test(v);

function player(p) {
    if (!p || typeof p !== 'object') return null;
    const name = str(p.name, 60);
    if (!name) return null;
    const out = {
        name,
        rank: str(p.rank, 40),
        level: num(p.level, 0, 5000, 0),
    };
    if (p.currentRank !== undefined) out.currentRank = str(p.currentRank, 40);
    if (p.peakRank !== undefined) out.peakRank = str(p.peakRank, 40);
    if (p.points !== undefined) out.points = num(p.points, 0, 8, 0);
    if (p.agent !== undefined) out.agent = str(p.agent, 30);
    if (p.stats && typeof p.stats === 'object') {
        out.stats = {
            kills: num(p.stats.kills, 0, 9999, 0),
            deaths: num(p.stats.deaths, 0, 9999, 0),
            assists: num(p.stats.assists, 0, 9999, 0),
        };
    }
    if (Array.isArray(p.agents)) out.agents = p.agents.slice(0, 10).map(a => str(a, 30)).filter(Boolean);
    return out;
}

export function team(t) {
    if (!t || typeof t !== 'object') throw new ValidationError('Datos de equipo inválidos');
    const name = str(t.name, 60);
    if (!name) throw new ValidationError('El equipo necesita un nombre');
    const players = (Array.isArray(t.players) ? t.players : []).slice(0, 5).map(player).filter(Boolean);
    const out = {
        name,
        logo: logo(t.logo),
        hidden: bool(t.hidden, true),
        players,
        overLimitApproved: bool(t.overLimitApproved, false),
    };
    if (t.id !== undefined && t.id !== null) out.id = typeof t.id === 'number' ? t.id : str(t.id, 40);
    if (t.totalPoints !== undefined) out.totalPoints = num(t.totalPoints, 0, 64, 0);
    if (t.ticketSource) out.ticketSource = str(t.ticketSource, 100);
    if (t.status) out.status = str(t.status, 40);
    if (t.cupsPlayed) out.cupsPlayed = str(t.cupsPlayed, 60);
    if (Array.isArray(t.topAgents)) out.topAgents = t.topAgents.slice(0, 5).map(a => str(a, 30)).filter(Boolean);
    return out;
}

const matchTeam = (t) => ({
    name: str(t?.name, 60) || 'Por determinar',
    logo: logo(t?.logo),
});

export function match(m, idx = 0) {
    if (!m || typeof m !== 'object') throw new ValidationError('Partido inválido');
    const out = {
        id: m.id ?? idx + 1,
        t1: matchTeam(m.t1),
        t2: matchTeam(m.t2),
        map: str(m.map, 30),
        format: str(m.format, 40),
        date: str(m.date, 80),
        status: str(m.status, 30) || 'Programado',
        score1: num(m.score1, 0, 99, 0),
        score2: num(m.score2, 0, 99, 0),
    };
    if (m.group) out.group = str(m.group, 10);
    if (m.kills1 !== undefined) out.kills1 = num(m.kills1, 0, 9999, 0);
    if (m.kills2 !== undefined) out.kills2 = num(m.kills2, 0, 9999, 0);
    if (m.round !== undefined) out.round = num(m.round, 0, 99, 0);
    if (m.mvp !== undefined) out.mvp = str(m.mvp, 60);
    if (m.playerStats && typeof m.playerStats === 'object') out.playerStats = m.playerStats;
    return out;
}

export function groups(g) {
    if (!g || typeof g !== 'object' || Array.isArray(g)) return {};
    const out = {};
    for (const [key, list] of Object.entries(g).slice(0, 16)) {
        out[str(key, 10)] = (Array.isArray(list) ? list : []).slice(0, 64).map(matchTeam);
    }
    return out;
}

export function liveMatch(m) {
    if (!m || typeof m !== 'object') throw new ValidationError('Datos de partido inválidos');
    const side = (t) => ({ ...matchTeam(t), score: num(t?.score, 0, 99, 0), mapsWon: num(t?.mapsWon, 0, 10, 0), side: str(t?.side, 20) });
    return {
        active: bool(m.active, true),
        status: str(m.status, 20) || 'LIVE',
        team1: side(m.team1),
        team2: side(m.team2),
        map: str(m.map, 30),
        round: num(m.round, 0, 99, 0),
        format: str(m.format, 40),
        side: str(m.side, 60),
        mvp: str(m.mvp, 60),
        notes: str(m.notes, 500),
    };
}

export function decisionPlayers(players) {
    return (Array.isArray(players) ? players : []).slice(0, 5).map(p => ({
        name: str(p?.name, 60) || 'Sin Riot ID',
        rank: str(p?.rank || p?.currentRank, 120) || 'Rango no def',
        level: str(p?.level, 6),
    }));
}
