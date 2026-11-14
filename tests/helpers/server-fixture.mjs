import express from 'express';
import cors from 'cors';
import { ADMIN_TOKEN } from '../../src/config.js';
import { client } from '../../src/discord/client.js';
import { requireAdmin } from '../../src/api/auth.js';
import publicRouter from '../../src/api/public.js';
import adminRouter from '../../src/api/admin.js';
import twitchRouter from '../../src/api/twitch.js';

let activeServer = null;
let activeBaseUrl = null;

export function buildApp() {
  const app = express();
  app.disable('x-powered-by');

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

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, discord: client.isReady() });
  });

  app.use('/api/auth/twitch', twitchRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/public', (req, res) => res.status(404).json({ error: 'Ruta de API pública no encontrada' }));

  app.use('/api', requireAdmin, adminRouter);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta de API de moderación no encontrada' }));

  // Centralized error handler
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Petición demasiado grande' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
    const expected = Number.isInteger(err.status) && err.status < 600;
    const status = expected ? err.status : 500;
    res.status(status).json({ error: expected ? err.message : 'Error interno del servidor' });
  });

  return app;
}

export async function startTestServer() {
  if (activeServer) {
    return { baseUrl: activeBaseUrl, server: activeServer, adminToken: ADMIN_TOKEN };
  }

  const app = buildApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      activeServer = server;
      activeBaseUrl = `http://127.0.0.1:${port}`;
      resolve({ baseUrl: activeBaseUrl, server: activeServer, adminToken: ADMIN_TOKEN });
    });
    server.on('error', reject);
  });
}

export async function stopTestServer() {
  if (activeServer) {
    return new Promise((resolve) => {
      activeServer.close(() => {
        activeServer = null;
        activeBaseUrl = null;
        resolve();
      });
    });
  }
}

export { ADMIN_TOKEN };
