import { EmbedBuilder } from 'discord.js';
import { HENRIK_API_KEY, MAX_TEAM_POINTS, MIN_ACCOUNT_LEVEL, TICKET_CATEGORY_ID } from '../config.js';
import { evaluatePlayerRank } from '../rank.js';
import { stats, logActivity } from '../stats.js';

// ===== Análisis automático de enlaces de tracker.gg =====

const TRACKER_REGEX = /tracker\.gg\/valorant\/profile\/riot\/([^/]+?)(?:%23|#)([^/\s?]+)/i;
const HENRIK_BASE = 'https://api.henrikdev.xyz/valorant';
const CACHE_TTL_MS = 10 * 60 * 1000;   // 10 min por Riot ID
const USER_COOLDOWN_MS = 15 * 1000;     // 15 s por usuario
const FETCH_TIMEOUT_MS = 10 * 1000;

const profileCache = new Map();  // riotId(lower) -> { data, expires }
const userCooldown = new Map();  // userId -> timestamp

async function henrik(pathname) {
    const res = await fetch(`${HENRIK_BASE}${pathname}`, {
        headers: HENRIK_API_KEY ? { Authorization: HENRIK_API_KEY } : {},
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status === 429) throw new Error('Límite de peticiones de la API de Valorant alcanzado. Prueba en un minuto.');
    return res.json();
}

export async function fetchProfile(username, tag) {
    const key = `${username}#${tag}`.toLowerCase();
    const cached = profileCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.data;

    const u = encodeURIComponent(username);
    const t = encodeURIComponent(tag);

    // 1. Cuenta (nivel y región)
    const accountData = await henrik(`/v1/account/${u}/${t}`);
    if (accountData.status !== 200) {
        throw new Error(accountData.errors?.[0]?.message || 'No se encontró la cuenta');
    }
    const { region, account_level: level, card, name, tag: realTag } = accountData.data;

    // 2. Ranked (MMR v2 con peak y temporadas; fallback a v1)
    let currentRankText = 'Unranked';
    let peakRankText = 'Unranked';
    let peakSeason = '';
    let bySeason = {};

    try {
        const v2 = await henrik(`/v2/mmr/${region}/${u}/${t}`);
        if (v2.status !== 200 || !v2.data) throw new Error('fallback');
        currentRankText = v2.data.current_data?.currenttierpatched || 'Unranked';
        peakRankText = v2.data.highest_rank?.patched_tier || currentRankText;
        peakSeason = v2.data.highest_rank?.season || '';
        bySeason = v2.data.by_season || {};
    } catch {
        try {
            const v1 = await henrik(`/v1/mmr/${region}/${u}/${t}`);
            if (v1.status === 200 && v1.data) {
                currentRankText = v1.data.currenttierpatched || 'Unranked';
                peakRankText = currentRankText;
            }
        } catch { /* se mantiene Unranked */ }
    }

    const data = {
        name, tag: realTag, region, level,
        cardUrl: card?.small,
        currentRankText, peakRankText, peakSeason,
        evaluation: evaluatePlayerRank(currentRankText, peakRankText, peakSeason, bySeason),
    };
    profileCache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });

    // Limpieza ocasional de la caché
    if (profileCache.size > 500) {
        for (const [k, v] of profileCache) if (v.expires <= Date.now()) profileCache.delete(k);
    }
    return data;
}

function buildResultEmbed(p, username, tag) {
    const { evaluation } = p;
    const isLevelOk = p.level >= MIN_ACCOUNT_LEVEL;
    const embed = new EmbedBuilder()
        .setColor(isLevelOk ? '#00ff88' : '#ffae00')
        .setAuthor({ name: 'Valorant Tracker - Análisis Oficial Copa Primate', iconURL: 'https://img.icons8.com/color/48/valorant.png' })
        .setTitle(`Estadísticas de ${p.name}#${p.tag}`)
        .setURL(`https://tracker.gg/valorant/profile/riot/${encodeURIComponent(username)}%23${encodeURIComponent(tag)}/overview`)
        .addFields(
            { name: '🎖️ Rango Actual', value: `${p.currentRankText} (${evaluation.currentPoints} pts)`, inline: true },
            { name: '🏆 Peak Rank', value: `${p.peakRankText} (${evaluation.peakPoints} pts)${p.peakSeason ? ` [${p.peakSeason.toUpperCase()}]` : ''}`, inline: true },
            { name: '⚖️ Media Evaluada', value: `**${evaluation.evaluatedPoints} pts**`, inline: true },
            { name: '🕒 Antigüedad Peak', value: evaluation.recencyCategory, inline: true },
            { name: '📈 Nivel', value: `${p.level} (${isLevelOk ? `✅ Apto +${MIN_ACCOUNT_LEVEL}` : `❌ Menor a ${MIN_ACCOUNT_LEVEL}`})`, inline: true },
            { name: '🌍 Región', value: String(p.region || '—').toUpperCase(), inline: true },
            { name: '📋 Criterio Aplicado', value: evaluation.explanation, inline: false },
            { name: '📌 Regla de Límite', value: `Aporta **${evaluation.evaluatedPoints} pts** al máximo de ${MAX_TEAM_POINTS} pts del equipo`, inline: false }
        )
        .setFooter({ text: 'Copa Primate - Anti-Smurf & Elo Balancing' })
        .setTimestamp();
    if (p.cardUrl) embed.setThumbnail(p.cardUrl);
    return embed;
}

export async function handleTrackerMessage(message) {
    const isTicket = message.channel?.name?.toLowerCase().startsWith('ticket') ||
                     Boolean(TICKET_CATEGORY_ID && message.channel?.parentId === TICKET_CATEGORY_ID);

    const matches = [...message.content.matchAll(/tracker\.gg\/valorant\/profile\/riot\/([^/\s?]+?)(?:%23|#)([^/\s?]+)/gi)];
    if (!matches.length) return;

    // Cooldown solo fuera de los canales de tickets para no bloquear las inscripciones de equipos
    if (!isTicket) {
        const last = userCooldown.get(message.author.id) || 0;
        const wait = USER_COOLDOWN_MS - (Date.now() - last);
        if (wait > 0) {
            await message.react('⏳').catch(() => {});
            return;
        }
        userCooldown.set(message.author.id, Date.now());
    }

    const processed = new Set();
    for (const match of matches.slice(0, 4)) {
        let username, tag;
        try {
            username = decodeURIComponent(match[1]).replace(/^[<(]+/, '').trim();
            tag = decodeURIComponent(match[2]).replace(/[>)]+$/, '').split('?')[0].trim();
        } catch {
            continue;
        }

        const riotId = `${username}#${tag}`.toLowerCase();
        if (processed.has(riotId)) continue;
        processed.add(riotId);

        let replyMessage;
        try {
            replyMessage = await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ffae00')
                    .setDescription(`🔍 **Analizando perfil de Tracker...**\nExtrayendo rango actual, peak histórico y actividad de \`${username}#${tag}\``)],
            });
        } catch (err) {
            console.error('No se pudo enviar mensaje de análisis:', err.message);
            continue;
        }

        try {
            const profile = await fetchProfile(username, tag);
            await replyMessage.edit({ embeds: [buildResultEmbed(profile, username, tag)] });
            stats.trackerLookups++;
            logActivity('tracker', `Cuenta analizada: ${profile.name}#${profile.tag} (${profile.evaluation.evaluatedPoints} pts - Act: ${profile.currentRankText} / Peak: ${profile.peakRankText})`);
        } catch (error) {
            console.error('Error fetching Valorant data:', error.message);
            const reason = error.name === 'TimeoutError' ? 'La API de Valorant tardó demasiado en responder.' : error.message;
            await replyMessage.edit({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription(`⚠️ **Error al extraer datos reales de \`${username}#${tag}\`**\nNo se pudo obtener la información. Verifica que el Riot ID sea correcto o que el perfil no esté en privado.\n\n*Error: ${reason}*`)],
            }).catch(() => {});
        }
    }
}
