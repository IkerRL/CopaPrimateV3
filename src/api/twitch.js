import { Router } from 'express';
import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_MODERATORS, ADMIN_TOKEN } from '../config.js';

// ===== Endpoints de autenticación de Twitch para el panel de moderación =====
const router = Router();

// Configuración pública de Twitch para que el frontend sepa si está activo el botón
router.get('/config', (req, res) => {
    res.json({
        enabled: Boolean(TWITCH_CLIENT_ID),
        clientId: TWITCH_CLIENT_ID || null,
        moderatorsCount: TWITCH_MODERATORS.length,
    });
});

// Verificación de credenciales de Twitch (token o código OAuth)
router.post('/verify', async (req, res) => {
    try {
        const { token, code, redirectUri } = req.body || {};
        let accessToken = token;

        // Si el cliente envía un código de autorización (Authorization Code Flow)
        if (!accessToken && code) {
            if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
                return res.status(400).json({
                    error: 'Falta TWITCH_CLIENT_SECRET en el servidor para intercambiar el código OAuth.'
                });
            }

            const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: TWITCH_CLIENT_ID,
                    client_secret: TWITCH_CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri || '',
                }),
            });

            const tokenData = await tokenRes.json();
            if (!tokenRes.ok || !tokenData.access_token) {
                return res.status(401).json({
                    error: tokenData.message || 'Código de autorización de Twitch inválido o expirado'
                });
            }
            accessToken = tokenData.access_token;
        }

        if (!accessToken) {
            return res.status(400).json({ error: 'No se ha proporcionado token ni código de acceso de Twitch.' });
        }

        // 1. Validar el token contra el endpoint oficial de validación de Twitch
        const validateRes = await fetch('https://id.twitch.tv/oauth2/validate', {
            headers: {
                Authorization: `OAuth ${accessToken}`,
            },
        });

        if (!validateRes.ok) {
            return res.status(401).json({ error: 'Token de Twitch no válido o sesión caducada en Twitch.' });
        }

        const tokenInfo = await validateRes.json();
        const twitchLogin = (tokenInfo.login || '').toLowerCase();
        const twitchUserId = tokenInfo.user_id;

        // 2. Comprobar permisos en la lista de moderadores
        const isAllowed = TWITCH_MODERATORS.includes('*') || TWITCH_MODERATORS.includes(twitchLogin);
        if (!isAllowed) {
            console.warn(`[Twitch Auth] Denegado acceso a @${tokenInfo.login} (no está en TWITCH_MODERATORS)`);
            return res.status(403).json({
                error: `Acceso denegado: La cuenta de Twitch @${tokenInfo.login} no está registrada como moderador autorizado.`,
                login: tokenInfo.login,
            });
        }

        // 3. Obtener avatar y nombre formateado desde Twitch Helix
        let displayName = tokenInfo.login;
        let avatar = null;

        if (TWITCH_CLIENT_ID) {
            try {
                const userRes = await fetch(`https://api.twitch.tv/helix/users?id=${twitchUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Client-Id': TWITCH_CLIENT_ID,
                    },
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    if (userData.data && userData.data[0]) {
                        displayName = userData.data[0].display_name || displayName;
                        avatar = userData.data[0].profile_image_url || null;
                    }
                }
            } catch (err) {
                console.warn('[Twitch Auth] No se pudo obtener foto de perfil de Helix:', err.message);
            }
        }

        console.log(`[Twitch Auth] Sesión autorizada con éxito para @${displayName} (${twitchLogin})`);

        return res.json({
            ok: true,
            token: ADMIN_TOKEN,
            user: {
                login: twitchLogin,
                displayName,
                avatar,
            },
        });
    } catch (err) {
        console.error('[Twitch Auth Error]', err);
        return res.status(500).json({ error: 'Error interno al comunicarse con Twitch.' });
    }
});

export default router;

