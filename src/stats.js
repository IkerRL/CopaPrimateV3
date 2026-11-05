// ===== Registro de actividad en memoria (para el panel de Inicio) =====
export const BOOT_TIME = Date.now();
const HOUR_MS = 60 * 60 * 1000;
const MAX_ACTIVITY = 30;

export const stats = {
    messagesByHour: new Map(),
    joins: 0,
    leaves: 0,
    trackerLookups: 0,
    ticketReplies: 0,
    announcements: 0,
    activity: [],
};

export function logActivity(type, text) {
    stats.activity.unshift({ type, text, timestamp: new Date().toISOString() });
    if (stats.activity.length > MAX_ACTIVITY) stats.activity.length = MAX_ACTIVITY;
}

export function countMessage() {
    const hour = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
    stats.messagesByHour.set(hour, (stats.messagesByHour.get(hour) || 0) + 1);
    for (const key of stats.messagesByHour.keys()) {
        if (key < hour - 23 * HOUR_MS) stats.messagesByHour.delete(key);
    }
}

export function getHourlySeries() {
    const currentHour = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
    const series = [];
    for (let i = 23; i >= 0; i--) {
        const hour = currentHour - i * HOUR_MS;
        series.push({ hour: new Date(hour).toISOString(), count: stats.messagesByHour.get(hour) || 0 });
    }
    return series;
}
