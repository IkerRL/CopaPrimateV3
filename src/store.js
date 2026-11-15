import fs from 'fs';
import path from 'path';

// ===== Almacenamiento JSON con caché en memoria y escritura atómica =====
// Se lee el archivo una sola vez (o cuando cambia en disco) y se escribe mediante
// un archivo temporal + rename, evitando JSON corruptos si el proceso se corta a mitad.

const ROOT = process.cwd();

function createJsonStore(fileName, fallback) {
    const file = path.join(ROOT, fileName);
    let cache = null;
    let cachedMtime = 0;

    const clone = (v) => (v === undefined ? v : structuredClone(v));

    function read() {
        try {
            if (!fs.existsSync(file)) {
                const seed = typeof fallback === 'function' ? fallback() : fallback;
                if (seed !== null && seed !== undefined && typeof fallback === 'function') write(seed);
                return clone(seed);
            }
            const { mtimeMs } = fs.statSync(file);
            if (cache === null || mtimeMs !== cachedMtime) {
                cache = JSON.parse(fs.readFileSync(file, 'utf-8'));
                cachedMtime = mtimeMs;
            }
            return clone(cache);
        } catch (e) {
            console.error(`Error leyendo ${fileName}:`, e.message);
            const seed = typeof fallback === 'function' ? fallback() : fallback;
            return clone(seed);
        }
    }

    function write(data) {
        try {
            const tmp = `${file}.${process.pid}.tmp`;
            fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
            fs.renameSync(tmp, file);
            cache = clone(data);
            cachedMtime = fs.statSync(file).mtimeMs;
        } catch (e) {
            console.error(`Error guardando ${fileName}:`, e.message);
            throw e;
        }
    }

    return { read, write, file };
}

// Si teams.json no existe se inicializa vacío para que el organizador cargue sus propios equipos
function seedTeams() {
    return [];
}

export const teamsStore = createJsonStore('teams.json', seedTeams);
export const matchesStore = createJsonStore('matches.json', { groups: { A: [], B: [], C: [], D: [] }, matches: [], jornadas: [[], [], [], []], drawCompleted: false });
export const liveMatchStore = createJsonStore('live-match.json', null);

export const loadTeams = () => {
    const t = teamsStore.read();
    return Array.isArray(t) ? t : [];
};
export const saveTeams = (teams) => teamsStore.write(teams);

export const loadMatches = () => {
    const m = matchesStore.read();
    return m && typeof m === 'object' ? { groups: {}, matches: [], ...m } : { groups: {}, matches: [] };
};
export const saveMatches = (data) => matchesStore.write(data);

export const loadLiveMatch = () => liveMatchStore.read();
export const saveLiveMatch = (match) => liveMatchStore.write(match);

export const overlayStore = createJsonStore('overlay-state.json', { mode: 'scoreboard', roulette: { spinId: 0, targetMap: null } });
export const loadOverlayState = () => overlayStore.read() || { mode: 'scoreboard', roulette: { spinId: 0, targetMap: null } };
export const saveOverlayState = (state) => overlayStore.write(state);

function seedWebSettings() {
    return {
        showStandings: false,            // Ocultar clasificación hasta que empiece la liga
        showGroups: false,               // Ocultar grupos hasta realizar el sorteo
        showMatches: false,              // Ocultar cruces hasta que se publiquen
        tournamentPhase: 'inscripciones', // 'inscripciones' | 'sorteo' | 'liga' | 'playoffs' | 'final'
        activeMatchday: 'J1',            // 'J1' | 'J2' | 'J3' | 'J4' | 'ALL'
        totalSlots: 16,                  // Capacidad oficial: 16 equipos
        announcementBanner: '',          // Banner o aviso opcional en la web
    };
}
export const webSettingsStore = createJsonStore('web-settings.json', seedWebSettings);
export const loadWebSettings = () => webSettingsStore.read() || seedWebSettings();
export const saveWebSettings = (settings) => webSettingsStore.write(settings);
