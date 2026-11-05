import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PORT, ALLOWED_ORIGINS, ADMIN_TOKEN, ADMIN_TOKEN_IS_TEMPORARY } from '../config.js';
import { client } from '../discord/client.js';
import { requireAdmin, rateLimit } from './auth.js';
import publicRouter from './public.js';
import adminRouter from './admin.js';
import twitchRouter from './twitch.js';

export function startApi() {
    const app = express();
    app.disable('x-powered-by');

    const ROOT_DIR = process.cwd();
    const websiteDist = path.join(ROOT_DIR, 'website', 'dist');
    const dashboardDist = path.join(ROOT_DIR, 'dashboard', 'dist');

    // Cabeceras de seguridad básicas
    app.use((req, res, next) => {
        res.set({
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'no-referrer',
        });
        if (req.path.startsWith('/api')) {
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            });
        }
        next();
    });

    // CORS: solo los orígenes configurados (las peticiones sin Origin, p. ej. curl o mismo origen, se permiten)
    app.use(cors({
        origin(origin, cb) {
            if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
            cb(null, false);
        },
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 600,
    }));

    app.use(express.json({ limit: '2mb' }));

    // Salud del servicio (pública)
    app.get('/api/health', (req, res) => {
        res.json({ ok: true, discord: client.isReady() });
    });

    // Autenticación de Twitch para moderadores (pública)
    app.use('/api/auth/twitch', rateLimit({ windowMs: 60_000, max: 60 }), twitchRouter);

    // Web pública: solo lectura, con límite generoso
    app.use('/api/public', rateLimit({ windowMs: 60_000, max: 240 }), publicRouter);
    app.use('/api/public', (req, res) => res.status(404).json({ error: 'Ruta de API pública no encontrada' }));

    // Panel de moderación: requiere token
    app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }), requireAdmin, adminRouter);
    app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta de API de moderación no encontrada' }));

    // ===== Panel de Moderación (Dashboard) servido en /admin/ =====
    app.use('/admin', (req, res, next) => {
        if (req.originalUrl === '/admin') {
            return res.redirect(301, '/admin/');
        }
        next();
    });
    if (fs.existsSync(dashboardDist)) {
        app.use('/admin', express.static(dashboardDist));
        app.use('/admin', (req, res) => {
            res.sendFile(path.join(dashboardDist, 'index.html'));
        });
    }

    // ===== Web Oficial del Torneo servida en la raíz / =====
    if (fs.existsSync(websiteDist)) {
        app.use(express.static(websiteDist));
        app.use((req, res, next) => {
            if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
                return next();
            }
            res.sendFile(path.join(websiteDist, 'index.html'));
        });
    }

    // Manejador de errores centralizado
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Petición demasiado grande' });
        if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
        const expected = Number.isInteger(err.status) && err.status < 600;
        const status = expected ? err.status : 500;
        if (!expected) console.error(`[API] ${req.method} ${req.originalUrl}:`, err);
        res.status(status).json({ error: expected ? err.message : 'Error interno del servidor' });
    });

    app.listen(PORT, () => {
        console.log(`\n==================================================`);
        console.log(`🍌 COPA PRIMATE VOL. III - SERVIDOR CENTRAL`);
        console.log(`==================================================`);
        console.log(`🌐 Web Oficial del Torneo:      http://localhost:${PORT}/`);
        console.log(`🛡️  Panel de Moderación:         http://localhost:${PORT}/admin/`);
        console.log(`📡 Endpoints API Bot:           http://localhost:${PORT}/api/public`);
        console.log(`🎮 Overlays OBS:                http://localhost:${PORT}/overlay/live`);
        console.log(`==================================================\n`);
        if (ADMIN_TOKEN_IS_TEMPORARY) {
            console.warn('⚠️  No hay ADMIN_TOKEN en .env. Token TEMPORAL para el panel (cambia en cada reinicio):');
            console.warn(`   ${ADMIN_TOKEN}`);
        }
    });

    return app;
}
