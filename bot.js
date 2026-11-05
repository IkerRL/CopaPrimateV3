// ===== Copa Primate - Bot de Discord + API del Dashboard =====
// Punto de entrada. La lógica vive en ./src:
//   src/config.js            → variables de entorno
//   src/store.js             → persistencia JSON (caché + escritura atómica)
//   src/stats.js             → actividad y contadores en memoria
//   src/rank.js              → ponderación de rangos (actual + peak)
//   src/discord/client.js    → cliente, slash commands y eventos
//   src/discord/tracker.js   → análisis de enlaces de tracker.gg
//   src/api/server.js        → servidor Express
//   src/api/public.js        → rutas públicas para la web (/api/public/*)
//   src/api/admin.js         → rutas del panel (requieren ADMIN_TOKEN)

import { loadTeams } from './src/store.js';
import { startDiscord } from './src/discord/client.js';
import { startApi } from './src/api/server.js';

export { parseRank, evaluatePlayerRank } from './src/rank.js';

// Inicializar teams.json si no existe
loadTeams();

startDiscord();
startApi();

process.on('unhandledRejection', (err) => console.error('Promesa no controlada:', err));
