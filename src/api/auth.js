import crypto from 'crypto';
import { ADMIN_TOKEN } from '../config.js';

// ===== Autenticación del panel de moderación =====
const expected = Buffer.from(ADMIN_TOKEN);

function safeEqual(a) {
    const given = Buffer.from(a || '');
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

// Bloqueo temporal por IP tras varios intentos fallidos (anti fuerza bruta)
const failures = new Map(); // ip -> { count, until }
const MAX_FAILURES = 8;
const LOCK_MS = 10 * 60 * 1000;

export function requireAdmin(req, res, next) {
    const ip = req.ip;
    const f = failures.get(ip);
    if (f && f.until > Date.now()) {
        return res.status(429).json({ error: 'Demasiados intentos fallidos. Espera unos minutos.' });
    }

    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (safeEqual(token)) {
        failures.delete(ip);
        return next();
    }

    // Si había un bloqueo y ya expiró, el contador vuelve a empezar
    const count = (f && f.until === 0 ? f.count : 0) + 1;
    failures.set(ip, { count, until: count >= MAX_FAILURES ? Date.now() + LOCK_MS : 0 });
    return res.status(401).json({ error: 'No autorizado. Inicia sesión en el panel con el ADMIN_TOKEN.' });
}

// ===== Rate limit sencillo en memoria =====
export function rateLimit({ windowMs, max }) {
    const hits = new Map(); // ip -> { count, reset }
    setInterval(() => {
        const now = Date.now();
        for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }, windowMs).unref();

    return (req, res, next) => {
        const now = Date.now();
        const entry = hits.get(req.ip);
        if (!entry || entry.reset <= now) {
            hits.set(req.ip, { count: 1, reset: now + windowMs });
            return next();
        }
        entry.count++;
        if (entry.count > max) {
            res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
            return res.status(429).json({ error: 'Demasiadas peticiones. Inténtalo de nuevo en unos segundos.' });
        }
        next();
    };
}
