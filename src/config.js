import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// ===== Configuración central (variables de entorno) =====
export const TOKEN = process.env.DISCORD_TOKEN;
export const GUILD_ID = process.env.SERVER_ID;
export const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
export const ANNOUNCEMENT_CHANNEL_ID = process.env.ANNOUNCEMENT_CHANNEL_ID;
export const HENRIK_API_KEY = process.env.HENRIK_API_KEY;
export const PORT = Number(process.env.PORT) || 3001;

// Orígenes permitidos para CORS (separados por comas). Por defecto: servidores de Vite en local.
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
    'http://localhost:5173,http://localhost:5174,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:5174')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

// Twitch OAuth para el panel de moderación
export const TWITCH_CLIENT_ID = (process.env.TWITCH_CLIENT_ID || '').trim();
export const TWITCH_CLIENT_SECRET = (process.env.TWITCH_CLIENT_SECRET || '').trim();
export const TWITCH_MODERATORS = (process.env.TWITCH_MODERATORS || 'makacagotica,ikerrl')
    .split(',')
    .map(m => m.trim().toLowerCase())
    .filter(Boolean);

// Token del panel de moderación. Si no está configurado se genera uno temporal en cada arranque.
let adminToken = (process.env.ADMIN_TOKEN || '').trim();
export const ADMIN_TOKEN_IS_TEMPORARY = !adminToken;
if (!adminToken) adminToken = crypto.randomBytes(18).toString('base64url');
export const ADMIN_TOKEN = adminToken;

// Reglas del torneo
export const MAX_TEAM_POINTS = 16;
export const MAX_TIER_GAP = 4;
export const MIN_ACCOUNT_LEVEL = 40;
