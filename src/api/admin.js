import { Router } from 'express';
import { EmbedBuilder } from 'discord.js';
import { client } from '../discord/client.js';
import { fetchProfile } from '../discord/tracker.js';
import { GUILD_ID, TICKET_CATEGORY_ID, ANNOUNCEMENT_CHANNEL_ID, MAX_TEAM_POINTS, MAX_TIER_GAP } from '../config.js';
import { loadTeams, saveTeams, loadMatches, saveMatches, loadLiveMatch, saveLiveMatch, loadOverlayState, saveOverlayState, loadWebSettings, saveWebSettings } from '../store.js';
import { stats, logActivity, getHourlySeries, BOOT_TIME } from '../stats.js';
import * as v from './validate.js';

// ===== Rutas de administración (requieren ADMIN_TOKEN) =====
const router = Router();

class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status; }
}

// Envuelve handlers async para centralizar errores
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const clip = (s, max = 1024) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

function requireDiscord() {
    if (!client.isReady()) throw new HttpError(503, 'El bot de Discord no está conectado');
}

// Solo se permite actuar sobre canales que estén dentro de la categoría de tickets
async function fetchTicketChannel(id) {
    requireDiscord();
    if (!TICKET_CATEGORY_ID) throw new HttpError(400, 'Falta configurar TICKET_CATEGORY_ID en el .env');
    if (!v.isSnowflake(id)) throw new HttpError(400, 'ID de ticket inválido');
    const channel = await client.channels.fetch(id).catch(() => null);
    if (!channel || !channel.isTextBased() || channel.parentId !== TICKET_CATEGORY_ID) {
        throw new HttpError(404, 'Ticket no encontrado');
    }
    return channel;
}

const formatRoster = (players, rankKey = 'rank') => clip(
    players.length
        ? players.map((p, idx) => `• **${idx === 3 ? 'Suplente: ' : `Titular ${idx + 1}: `}**\`${p.name}\` — ${p[rankKey] || p.currentRank || 'Rango no def'} (Nv ${p.level || '?'})`).join('\n')
        : 'No especificados'
);

function confirmationEmbed({ teamName, totalPoints, overLimitApproved, hidden, players, logo }, title) {
    const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle(clip(title, 256))
        .setDescription('¡Enhorabuena! Todos los datos del equipo han sido validados y subidos a la web de la **Copa Primate**.')
        .addFields(
            { name: '🏆 Nombre del Equipo', value: `**${teamName}**`, inline: true },
            { name: '📊 Puntos Totales', value: `**${totalPoints ?? '—'} / ${MAX_TEAM_POINTS} pts** ${overLimitApproved ? '⚠️ *(Excepción de Elo)*' : '✅'}`, inline: true },
            { name: '🔒 Visibilidad en la Web', value: hidden !== false ? '👁️ **Roster Oculto** (Confidencial hasta revelación oficial)' : '🌐 **Público en la web**', inline: true },
            { name: '👥 Integrantes Registrados', value: formatRoster(players) }
        )
        .setFooter({ text: 'Copa Primate - Registro Oficial' })
        .setTimestamp();
    if (logo && /^https?:\/\//i.test(logo)) embed.setThumbnail(logo);
    return embed;
}

// Comprobación de sesión del panel
router.get('/auth/check', (req, res) => res.json({ ok: true }));

// Consulta en vivo de perfil de Tracker / HenrikDev
router.get('/tracker/profile', h(async (req, res) => {
    let { username, tag } = req.query;
    if (!username && req.query.riotId) {
        const parts = String(req.query.riotId).split('#');
        username = parts[0];
        tag = parts[1];
    }
    if (!username || !tag) throw new HttpError(400, 'Se requieren username y tag (o riotId)');
    try {
        const profile = await fetchProfile(username, tag);
        res.json({ success: true, profile });
    } catch (err) {
        throw new HttpError(404, err.message || 'No se pudo obtener el perfil de Valorant');
    }
}));

// 0. Estadísticas en vivo para el panel de Inicio
router.get('/stats', h(async (req, res) => {
    const online = client.isReady();
    let guildInfo = null;
    let ticketCount = 0;
    let recentMembers = [];

    if (online && GUILD_ID) {
        try {
            const guild = await client.guilds.fetch({ guild: GUILD_ID, withCounts: true, force: true });
            guildInfo = {
                name: guild.name,
                icon: guild.iconURL({ size: 128 }),
                memberCount: guild.approximateMemberCount ?? guild.memberCount,
                onlineCount: guild.approximatePresenceCount ?? null,
                channelCount: guild.channels.cache.size,
                roleCount: guild.roles.cache.size,
                boostCount: guild.premiumSubscriptionCount || 0,
                boostTier: guild.premiumTier,
                createdAt: guild.createdAt,
            };
            if (TICKET_CATEGORY_ID) {
                ticketCount = guild.channels.cache.filter(c =>
                    c.parentId === TICKET_CATEGORY_ID && c.isTextBased() && c.name.toLowerCase().startsWith('ticket')
                ).size;
            }
            recentMembers = guild.members.cache
                .filter(m => !m.user?.bot && m.joinedAt)
                .sort((a, b) => b.joinedTimestamp - a.joinedTimestamp)
                .first(6)
                .map(m => ({
                    id: m.id,
                    tag: m.user?.tag || 'Usuario',
                    avatar: m.user?.displayAvatarURL({ size: 64 }) || null,
                    joinedAt: m.joinedAt,
                }));
        } catch (err) {
            console.warn('Error al obtener guild info:', err.message);
        }
    }

    const hourly = getHourlySeries();
    res.json({
        bot: {
            online,
            tag: client.user?.tag || null,
            avatar: client.user?.displayAvatarURL({ size: 128 }) || null,
            ping: online ? Math.round(client.ws.ping) : null,
            uptime: Date.now() - BOOT_TIME,
        },
        guild: guildInfo,
        tickets: { open: ticketCount, replies: stats.ticketReplies },
        teamsCount: loadTeams().length,
        counters: {
            messages24h: hourly.reduce((s, x) => s + x.count, 0),
            joins: stats.joins,
            leaves: stats.leaves,
            trackerLookups: stats.trackerLookups,
            announcements: stats.announcements,
        },
        hourly,
        activity: stats.activity,
        recentMembers,
    });
}));

// 1. Listar tickets
router.get('/tickets', h(async (req, res) => {
    requireDiscord();
    if (!GUILD_ID) throw new HttpError(400, 'Falta SERVER_ID en .env');
    if (!TICKET_CATEGORY_ID) return res.json({ error: 'Falta configurar TICKET_CATEGORY_ID en el .env', tickets: [] });
    const guild = await client.guilds.fetch(GUILD_ID);
    const tickets = guild.channels.cache
        .filter(c => c.parentId === TICKET_CATEGORY_ID && c.isTextBased() && c.name.toLowerCase().startsWith('ticket'))
        .map(c => ({ id: c.id, name: c.name, createdAt: c.createdAt }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ tickets });
}));

// 2. Mensajes de un ticket
router.get('/tickets/:id/messages', h(async (req, res) => {
    const channel = await fetchTicketChannel(req.params.id);
    const messages = await channel.messages.fetch({ limit: 50 });
    const formatted = [...messages.values()].reverse().map(m => ({
        id: m.id,
        author: m.author.tag,
        authorId: m.author.id,
        avatar: m.author.displayAvatarURL(),
        content: m.content,
        isBot: m.author.bot,
        timestamp: m.createdAt,
        attachments: m.attachments.map(a => ({ url: a.url, contentType: a.contentType, name: a.name })),
        embeds: m.embeds.map(e => ({ title: e.title, description: e.description, fields: e.fields })),
    }));
    res.json({ messages: formatted });
}));

// 3. Responder en un ticket
router.post('/tickets/:id/messages', h(async (req, res) => {
    const message = v.str(req.body?.message, 4000);
    if (!message) throw new HttpError(400, 'El mensaje está vacío');
    const channel = await fetchTicketChannel(req.params.id);
    await channel.send({
        embeds: [new EmbedBuilder().setColor('#00ff88').setAuthor({ name: 'Soporte - Moderación' }).setDescription(message).setTimestamp()],
    });
    stats.ticketReplies++;
    logActivity('ticket', `Respuesta enviada en #${channel.name}`);
    res.json({ success: true });
}));

// 4. Veredicto oficial (Aprobado / Rechazado / Excepción)
router.post('/tickets/:id/decision', h(async (req, res) => {
    const body = req.body || {};
    const channel = await fetchTicketChannel(req.params.id);
    const isApproved = body.status === 'approved';
    const overLimitApproved = v.bool(body.overLimitApproved);
    const teamName = v.str(body.teamName, 60) || channel.name;
    const totalPoints = body.totalPoints === undefined ? '—' : v.num(body.totalPoints, 0, 64);
    const tierDiff = body.tierDiff === undefined ? '—' : v.num(body.tierDiff, 0, 10);
    const reasons = (Array.isArray(body.reasons) ? body.reasons : []).slice(0, 10).map(r => v.str(r, 200)).filter(Boolean);
    const players = v.decisionPlayers(body.players);

    let title = isApproved ? `✅ EQUIPO APROBADO: ${teamName}` : `❌ EQUIPO RECHAZADO: ${teamName}`;
    const color = isApproved ? (overLimitApproved ? '#ffae00' : '#00ff88') : '#ff4655';
    let description;
    if (isApproved && overLimitApproved) {
        title = `⚠️ EQUIPO APROBADO (CON EXCEPCIÓN DE ELO): ${teamName}`;
        description = `El equipo ha sido **aprobado por decisión de la organización** bajo una **excepción al límite de Elo** (Suma ${totalPoints} / ${MAX_TEAM_POINTS} pts estándar). ¡Roster validado para la Copa Primate!`;
    } else if (isApproved) {
        description = `¡Enhorabuena! El roster cumple con todas las restricciones de la **Copa Primate** (coste de Elo máximo ${MAX_TEAM_POINTS} puntos, brecha de tiers y nivel de cuentas).`;
    } else {
        description = `El equipo no cumple con las restricciones oficiales por los siguientes motivos:\n${reasons.map(r => `• **${r}**`).join('\n') || '• **Sin motivo especificado**'}\n\n*Por favor, ajustad el roster y volved a enviar los enlaces.*`;
    }

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(clip(title, 256))
        .setDescription(clip(description, 4000))
        .addFields(
            { name: '📊 Puntos de Elo', value: `${totalPoints} / ${MAX_TEAM_POINTS} pts ${overLimitApproved ? '⚠️ *(Excepción concedida)*' : '✅'}`, inline: true },
            { name: '⚖️ Brecha de Tiers', value: `${tierDiff} / ${MAX_TIER_GAP} max`, inline: true },
            { name: '👥 Jugadores Validados', value: clip(players.length ? players.map((p, idx) => `• **${idx === 3 ? 'Suplente: ' : ''}${p.name}**: ${p.rank} (Nv ${p.level || '?'})`).join('\n') : 'No detallados') }
        )
        .setFooter({ text: 'Copa Primate - Moderación Oficial' })
        .setTimestamp();

    await channel.send({ embeds: [embed] });
    stats.ticketReplies++;
    logActivity('ticket', `Veredicto (${isApproved ? (overLimitApproved ? 'Aprobado con Excepción' : 'Aprobado') : 'Rechazado'}) enviado a #${channel.name}`);
    res.json({ success: true });
}));

// 4.1 Confirmación oficial de inscripción
router.post('/tickets/:id/confirm-team', h(async (req, res) => {
    const body = req.body || {};
    const channel = await fetchTicketChannel(req.params.id);
    const teamName = v.str(body.teamName, 60) || channel.name;
    const players = v.decisionPlayers(body.players);
    await channel.send({
        embeds: [confirmationEmbed({
            teamName,
            totalPoints: body.totalPoints === undefined ? '—' : v.num(body.totalPoints, 0, 64),
            overLimitApproved: v.bool(body.overLimitApproved),
            hidden: body.hidden,
            players,
            logo: v.logo(body.logo, ''),
        }, `🎉 ¡EQUIPO CONFIRMADO E INSCRITO OFICIALMENTE: ${teamName}!`)],
    });
    stats.ticketReplies++;
    logActivity('ticket', `Confirmación oficial enviada a #${channel.name} (${teamName})`);
    res.json({ success: true });
}));

// 5. Cerrar y eliminar ticket
router.post('/tickets/:id/close', h(async (req, res) => {
    const channel = await fetchTicketChannel(req.params.id);
    await channel.send({
        embeds: [new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🔒 Ticket Cerrado')
            .setDescription('Este ticket ha sido cerrado por la moderación. El canal se eliminará en 5 segundos...')
            .setTimestamp()],
    });
    setTimeout(() => {
        channel.delete('Ticket cerrado desde el Dashboard').catch(err => console.error('Error al eliminar canal:', err.message));
    }, 5000);
    logActivity('ticket', `Ticket #${channel.name} cerrado`);
    res.json({ success: true });
}));

// 6. Anuncio global
router.post('/announcements', h(async (req, res) => {
    requireDiscord();
    if (!ANNOUNCEMENT_CHANNEL_ID) throw new HttpError(400, 'Falta configurar ANNOUNCEMENT_CHANNEL_ID en el .env');
    const title = v.str(req.body?.title, 256) || '📢 Anuncio Oficial';
    const message = v.str(req.body?.message, 4000);
    if (!message) throw new HttpError(400, 'El anuncio está vacío');

    const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) throw new HttpError(404, 'Canal de anuncios no encontrado');

    await channel.send({
        embeds: [new EmbedBuilder()
            .setColor(v.hexColor(req.body?.color, '#ffae00'))
            .setTitle(title)
            .setDescription(message)
            .setFooter({ text: 'Copa Primate - Organización' })
            .setTimestamp()],
    });
    stats.announcements++;
    logActivity('announcement', `Anuncio publicado: ${title}`);
    res.json({ success: true });
}));

// 7. Equipos (vista completa, incluidos los ocultos)
router.get('/teams', (req, res) => res.json({ teams: loadTeams() }));

router.post('/teams', h(async (req, res) => {
    const input = v.team(req.body?.team);
    const notifyTicketId = req.body?.notifyTicketId;
    const teams = loadTeams();

    const newTeam = {
        ...input,
        id: input.id ?? Date.now(),
        validatedAt: new Date().toISOString(),
        status: input.status || (input.hidden ? 'Aprobado (Oculto)' : 'Aprobado'),
    };

    const idx = teams.findIndex(t => String(t.id) === String(newTeam.id) || t.name.toLowerCase() === newTeam.name.toLowerCase());
    if (idx >= 0) teams[idx] = { ...teams[idx], ...newTeam, id: teams[idx].id };
    else teams.push(newTeam);
    saveTeams(teams);
    logActivity('tracker', `Equipo guardado en la web: ${newTeam.name} (${newTeam.hidden ? 'Oculto' : 'Público'})`);

    // Confirmación automática en el ticket (no bloquea el guardado si falla)
    if (notifyTicketId) {
        try {
            const channel = await fetchTicketChannel(String(notifyTicketId));
            await channel.send({
                embeds: [confirmationEmbed({ ...newTeam, teamName: newTeam.name }, `🎉 ¡EQUIPO CONFIRMADO Y SUBIDO A LA WEB: ${newTeam.name}!`)],
            });
            stats.ticketReplies++;
        } catch (err) {
            console.warn('No se pudo enviar confirmación automática al ticket:', err.message);
        }
    }

    res.json({ success: true, team: idx >= 0 ? teams[idx] : newTeam, teams });
}));

router.patch('/teams/:id/toggle-hidden', (req, res) => {
    const teams = loadTeams();
    const team = teams.find(t => String(t.id) === String(req.params.id));
    if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });
    team.hidden = !team.hidden;
    team.status = team.hidden ? 'Aprobado (Oculto)' : 'Aprobado (Público)';
    saveTeams(teams);
    logActivity('tracker', `Visibilidad de ${team.name} cambiada a: ${team.hidden ? 'Oculto' : 'Público'}`);
    res.json({ success: true, team, teams });
});

router.delete('/teams/:id', (req, res) => {
    const teams = loadTeams();
    const removed = teams.find(t => String(t.id) === String(req.params.id));
    if (!removed) return res.status(404).json({ error: 'Equipo no encontrado' });
    const remaining = teams.filter(t => t !== removed);
    saveTeams(remaining);
    logActivity('tracker', `Equipo eliminado: ${removed.name}`);
    res.json({ success: true, teams: remaining });
});

// 8. Marcador en vivo
router.get('/live-match', (req, res) => res.json({ match: loadLiveMatch() }));

router.post('/live-match', (req, res) => {
    const updated = { ...v.liveMatch(req.body?.match), updatedAt: new Date().toISOString() };
    saveLiveMatch(updated);
    logActivity('system', `Marcador en vivo actualizado: ${updated.team1.name} (${updated.team1.score}) vs ${updated.team2.name} (${updated.team2.score}) [${updated.status}]`);
    res.json({ success: true, match: updated });
});

// 8.1. Estado del overlay unificado para OBS (Marcador, Ruleta, Versus, Ticker)
router.get('/overlay-state', (req, res) => res.json(loadOverlayState()));

router.post('/overlay-state', (req, res) => {
    const prev = loadOverlayState();
    const body = req.body || {};
    const updated = {
        mode: typeof body.mode === 'string' ? body.mode : (prev.mode || 'scoreboard'),
        roulette: {
            state: body.roulette?.state || prev.roulette?.state || 'lobby',
            spinning: !!body.roulette?.spinning,
            spinId: Number(body.roulette?.spinId) || (prev.roulette?.spinId || 0),
            chosenIdx: typeof body.roulette?.chosenIdx === 'number' ? body.roulette.chosenIdx : (prev.roulette?.chosenIdx ?? 0),
            reps: Number(body.roulette?.reps) || (prev.roulette?.reps || 10),
            targetMap: body.roulette?.targetMap || prev.roulette?.targetMap || null,
            winnerMap: body.roulette?.winnerMap || prev.roulette?.winnerMap || null,
            activeMaps: Array.isArray(body.roulette?.activeMaps) ? body.roulette.activeMaps : (prev.roulette?.activeMaps || null),
        },
        sorteo: body.sorteo !== undefined ? body.sorteo : (prev.sorteo || null),
        updatedAt: new Date().toISOString(),
    };
    saveOverlayState(updated);
    logActivity('system', `Escena de overlay cambiada a: [${updated.mode}]`);
    res.json({ success: true, overlay: updated });
});

// 9. Sorteo, grupos y calendario
router.get('/matches', (req, res) => res.json(loadMatches()));

router.post('/matches', (req, res) => {
    const current = loadMatches();
    const body = req.body || {};
    const data = {
        ...current,
        groups: body.groups !== undefined ? v.groups(body.groups) : current.groups,
        matches: Array.isArray(body.matches) ? body.matches.slice(0, 500) : current.matches,
        jornadas: Array.isArray(body.jornadas) ? body.jornadas : current.jornadas,
    };
    if (body.drawCompleted !== undefined) data.drawCompleted = v.bool(body.drawCompleted);
    saveMatches(data);
    logActivity('system', 'Calendario y grupos actualizados');
    res.json({ success: true, data });
});

router.post('/matches/draw', (req, res) => {
    const body = req.body || {};
    const data = {
        drawCompleted: true,
        drawnAt: new Date().toISOString(),
        groups: v.groups(body.groups),
        matches: (Array.isArray(body.matches) ? body.matches : []).slice(0, 500).map(v.match),
    };
    if (Array.isArray(body.jornadas)) {
        data.jornadas = body.jornadas.map(j => (Array.isArray(j) ? j.slice(0, 500).map(v.match) : []));
    }
    saveMatches(data);
    logActivity('announcement', '🎲 Sorteo oficial de cruces completado y publicado');
    res.json({ success: true, data });
});

// Actualizar el resultado y datos de un partido concreto
router.patch('/matches/:id', (req, res) => {
    const data = loadMatches();
    const idx = (data.matches || []).findIndex(m => String(m.id) === String(req.params.id));
    if (idx < 0) return res.status(404).json({ error: 'Partido no encontrado' });
    data.matches[idx] = v.match({ ...data.matches[idx], ...req.body }, idx);
    data.matches[idx].id = data.matches[idx].id ?? req.params.id;
    const m = data.matches[idx];

    // Sincronizar también dentro de data.jornadas si existe
    if (Array.isArray(data.jornadas)) {
        for (let j = 0; j < data.jornadas.length; j++) {
            if (Array.isArray(data.jornadas[j])) {
                const jIdx = data.jornadas[j].findIndex(matchItem => String(matchItem?.id) === String(req.params.id));
                if (jIdx >= 0) {
                    data.jornadas[j][jIdx] = { ...m };
                }
            }
        }
    }

    saveMatches(data);

    // Si se enviaron estadísticas individuales por jugador, sincronizarlas en los perfiles de equipo
    if (req.body.updateTeamStats && req.body.playerStats) {
        const teams = loadTeams();
        const updatePlayerInTeams = (teamName, pStats) => {
            const team = teams.find(t => t.name?.toLowerCase() === teamName?.toLowerCase());
            if (!team || !Array.isArray(pStats)) return;
            pStats.forEach(ps => {
                const player = (team.players || []).find(p => p.name?.toLowerCase() === ps.name?.toLowerCase());
                if (player) {
                    player.stats = player.stats || { kills: 0, deaths: 0, assists: 0 };
                    player.stats.kills = (player.stats.kills || 0) + (Number(ps.kills) || 0);
                    player.stats.deaths = (player.stats.deaths || 0) + (Number(ps.deaths) || 0);
                    player.stats.assists = (player.stats.assists || 0) + (Number(ps.assists) || 0);
                    if (ps.agent) {
                        player.agents = Array.isArray(player.agents) ? [...player.agents, ps.agent] : [ps.agent];
                        player.agent = ps.agent;
                    }
                }
            });
            team.kills = (team.players || []).reduce((s, p) => s + (p.stats?.kills || 0), 0);
            team.deaths = (team.players || []).reduce((s, p) => s + (p.stats?.deaths || 0), 0);
            team.assists = (team.players || []).reduce((s, p) => s + (p.stats?.assists || 0), 0);
        };
        if (req.body.playerStats.t1) updatePlayerInTeams(m.t1?.name, req.body.playerStats.t1);
        if (req.body.playerStats.t2) updatePlayerInTeams(m.t2?.name, req.body.playerStats.t2);
        saveTeams(teams);
    }

    logActivity('system', `Resultado actualizado: ${m.t1?.name} ${m.score1}-${m.score2} ${m.t2?.name} [${m.status}]`);
    res.json({ success: true, match: m, data });
});

// Configuración y Control de la Web Oficial
router.get('/web-settings', (req, res) => {
    res.json(loadWebSettings());
});

router.post('/web-settings', (req, res) => {
    const current = loadWebSettings();
    const updated = { ...current, ...req.body };
    saveWebSettings(updated);
    logActivity('system', `Ajustes de la web actualizados [Fase: ${updated.tournamentPhase}]`);
    res.json({ ok: true, settings: updated });
});

export { HttpError };
export default router;
