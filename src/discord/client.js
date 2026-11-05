import { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { TOKEN, GUILD_ID, MAX_TEAM_POINTS, MAX_TIER_GAP, MIN_ACCOUNT_LEVEL } from '../config.js';
import { loadTeams } from '../store.js';
import { BOOT_TIME, logActivity, stats, countMessage } from '../stats.js';
import { handleTrackerMessage } from './tracker.js';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// ===== Slash commands =====
const COMMANDS = [
    new SlashCommandBuilder()
        .setName('normas')
        .setDescription('Muestra el reglamento y restricciones de la Copa Primate'),
    new SlashCommandBuilder()
        .setName('calculadora')
        .setDescription('Muestra la tabla de costes de Elo y reglas de formación de equipos'),
    new SlashCommandBuilder()
        .setName('estado')
        .setDescription('Muestra el estado del bot y del torneo'),
].map(cmd => cmd.toJSON());

async function registerSlashCommands() {
    if (!TOKEN || !GUILD_ID || !client.user?.id) return;
    try {
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: COMMANDS });
        console.log('✅ Comandos Slash registrados correctamente en Discord');
    } catch (err) {
        console.warn('⚠️ No se pudieron registrar los comandos Slash:', err.message);
    }
}

function formatUptime(ms) {
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}min`;
    return `${m} min`;
}

const COMMAND_HANDLERS = {
    normas: () => new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('📜 Reglamento Oficial - Copa Primate')
        .setDescription('Normas principales de inscripción y competición en la Copa Primate:')
        .addFields(
            { name: '⚖️ Límite de Elo', value: `Máximo **${MAX_TEAM_POINTS} puntos** sumando los 3 titulares.`, inline: true },
            { name: '🔄 Brecha de Nivel', value: `Máximo **${MAX_TIER_GAP} tiers** de diferencia entre el más alto y el más bajo.`, inline: true },
            { name: '🛡️ Anti-Smurf', value: `Todas las cuentas deben ser **nivel ${MIN_ACCOUNT_LEVEL} o superior**.`, inline: true },
            { name: '👥 Suplentes', value: 'Se permite **1 suplente** opcional que cumpla la regla de Elo al ingresar.', inline: false },
            { name: '📊 Cálculo de Puntos', value: 'Se calcula la **media entre el rango actual y el peak** teniendo en cuenta la antigüedad del peak.', inline: false },
            { name: '🤝 Comportamiento', value: 'Cero tolerancia con toxicidad o smurfing deliberado.', inline: false }
        )
        .setFooter({ text: 'Copa Primate - Fair Play' })
        .setTimestamp(),

    calculadora: () => new EmbedBuilder()
        .setColor('#00ced1')
        .setTitle('🧮 Tabla de Puntos de Elo - Copa Primate')
        .setDescription('Coste de puntos (Escala ascendente del 1 al 8):\n*Se aplica la media ponderada entre Rango Actual y Peak Histórico.*')
        .addFields(
            { name: 'Hierro', value: '1 pt', inline: true },
            { name: 'Bronce', value: '2 pts', inline: true },
            { name: 'Plata', value: '3 pts', inline: true },
            { name: 'Oro', value: '4 pts', inline: true },
            { name: 'Platino', value: '5 pts', inline: true },
            { name: 'Diamante', value: '6 pts', inline: true },
            { name: 'Ascendente', value: '7 pts', inline: true },
            { name: 'Inmortal / Radiante', value: '8 pts', inline: true },
            { name: '📌 Ejemplo Válido', value: `Diamante (6) + Platino (5) + Platino (5) = **16 pts** ✅`, inline: false }
        )
        .setFooter({ text: `Máximo ${MAX_TEAM_POINTS} puntos en total` }),

    estado: () => {
        const teams = loadTeams();
        return new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('⚡ Estado del Sistema - Copa Primate')
            .addFields(
                { name: '🤖 Bot Latencia', value: `${Math.round(client.ws.ping)} ms`, inline: true },
                { name: '👥 Equipos Registrados', value: `${teams.length} equipos (${teams.filter(t => t.hidden !== false).length} ocultos)`, inline: true },
                { name: '⏱️ Uptime', value: formatUptime(Date.now() - BOOT_TIME), inline: true },
                { name: '🔍 Perfiles analizados', value: `${stats.trackerLookups}`, inline: true }
            )
            .setTimestamp();
    },
};

// ===== Eventos =====
client.once('ready', async () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}`);
    logActivity('system', `Bot conectado como ${client.user.tag}`);
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch();
    } catch (err) {
        console.warn('No se pudieron precargar los miembros:', err.message);
    }
    await registerSlashCommands();
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const handler = COMMAND_HANDLERS[interaction.commandName];
    if (!handler) return;
    try {
        await interaction.reply({ embeds: [handler()] });
    } catch (err) {
        console.error(`Error en /${interaction.commandName}:`, err.message);
    }
});

client.on('guildMemberAdd', (member) => {
    if (member.guild.id !== GUILD_ID) return;
    stats.joins++;
    logActivity('join', `${member.user.tag} se ha unido al servidor`);
});

client.on('guildMemberRemove', (member) => {
    if (member.guild.id !== GUILD_ID) return;
    stats.leaves++;
    logActivity('leave', `${member.user?.tag || 'Un usuario'} ha salido del servidor`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.guildId === GUILD_ID) countMessage();
    try {
        await handleTrackerMessage(message);
    } catch (err) {
        console.error('Error procesando mensaje:', err.message);
    }
});

client.on('error', (err) => console.error('Error del cliente de Discord:', err.message));

export function startDiscord() {
    if (!TOKEN) {
        console.warn('⚠️ Falta DISCORD_TOKEN en .env: el bot de Discord no se conectará (la API seguirá funcionando).');
        return;
    }
    client.login(TOKEN).catch(err => console.error('❌ No se pudo iniciar sesión en Discord:', err.message));
}
