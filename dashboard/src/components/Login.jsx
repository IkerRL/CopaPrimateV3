import { useState, useEffect } from 'react';
import { KeyRound, Loader2, ShieldCheck, AlertCircle, HelpCircle, X } from 'lucide-react';
import { checkToken, setToken, setTwitchUser, fetchTwitchConfig, verifyTwitchAuth } from '../api';

function TwitchIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  );
}

export default function Login({ onSuccess, expired }) {
  const [token, setTokenValue] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(expired ? 'Tu sesión ha caducado. Vuelve a iniciar sesión.' : '');
  const [loading, setLoading] = useState(false);
  const [twitchVerifying, setTwitchVerifying] = useState(false);
  const [twitchConfig, setTwitchConfig] = useState({ enabled: false, clientId: null });
  const [showTwitchHelp, setShowTwitchHelp] = useState(false);

  useEffect(() => {
    // 1. Comprobar configuración de Twitch en el backend
    fetchTwitchConfig()
      .then(cfg => setTwitchConfig(cfg || { enabled: false }))
      .catch(() => {});

    // 2. Comprobar si regresamos del flujo OAuth de Twitch
    const hash = window.location.hash.substring(1);
    const search = window.location.search.substring(1);
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(search);

    const accessToken = hashParams.get('access_token');
    const authCode = searchParams.get('code');
    const authError = hashParams.get('error_description') || hashParams.get('error') || searchParams.get('error_description') || searchParams.get('error');

    if (authError) {
      setError(`Twitch denegó el acceso: ${authError}`);
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    if (accessToken || authCode) {
      setLoading(true);
      setTwitchVerifying(true);
      setError('');

      const redirectUri = window.location.origin + window.location.pathname;
      window.history.replaceState(null, '', window.location.pathname);

      verifyTwitchAuth({ token: accessToken, code: authCode, redirectUri })
        .then(res => {
          if (res.ok) {
            setToken(res.token, true);
            setTwitchUser(res.user, true);
            onSuccess();
          } else {
            setError(res.error || 'Tu cuenta de Twitch no está en la lista de moderadores autorizados.');
          }
        })
        .catch(() => {
          setError('Error de comunicación con el servidor al verificar Twitch.');
        })
        .finally(() => {
          setLoading(false);
          setTwitchVerifying(false);
        });
    }
  }, [onSuccess]);

  const handleTwitchClick = () => {
    if (!twitchConfig.enabled) {
      setShowTwitchHelp(true);
      return;
    }

    setLoading(true);
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${twitchConfig.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=user:read:email`;
    window.location.href = authUrl;
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const value = token.trim();
    if (!value) return;
    setLoading(true);
    setError('');
    try {
      const result = await checkToken(value);
      if (result.ok) {
        setToken(value, remember);
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch {
      setError('No se puede conectar con la API. ¿Está iniciado node bot.js?');
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        {/* Logo oficial */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <img
            src="./copa-logo.png"
            alt="Logo Copa Primate"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              margin: '0 auto',
              filter: 'drop-shadow(0 0 20px rgba(192, 132, 252, 0.75))',
              display: 'block'
            }}
          />
        </div>

        <h1 className="title-font" style={{ background: 'linear-gradient(135deg, #fff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          PANEL PRIMATE
        </h1>
        <p className="login-sub">Acceso restringido para la moderación oficial de la Copa Primate</p>

        {error && (
          <div className="login-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Sección de Login con Twitch (Principal) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            className="login-twitch-btn"
            onClick={handleTwitchClick}
            disabled={loading}
          >
            {twitchVerifying ? (
              <>
                <Loader2 size={20} className="spin" />
                <span>Verificando permisos de Twitch…</span>
              </>
            ) : (
              <>
                <TwitchIcon size={20} />
                <span>Iniciar sesión con Twitch</span>
              </>
            )}
          </button>

          {!twitchConfig.enabled && (
            <div
              onClick={() => setShowTwitchHelp(true)}
              style={{
                fontSize: '11px',
                color: '#c084fc',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                opacity: 0.85
              }}
            >
              <HelpCircle size={13} />
              <span>¿Cómo configurar el acceso con Twitch?</span>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="login-divider">
          <span>o accede con token de moderador</span>
        </div>

        {/* Formulario alternativo con Token manual */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="admin-token" className="login-label">Token de administración</label>
            <div className="login-input-wrap">
              <KeyRound size={18} />
              <input
                id="admin-token"
                type="password"
                autoComplete="current-password"
                placeholder="ADMIN_TOKEN del archivo .env"
                value={token}
                onChange={(e) => setTokenValue(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <label className="login-remember">
            <input
              id="remember-token"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
            />
            Recordar sesión en este equipo
          </label>

          <button id="login-submit" type="submit" className="login-btn" disabled={loading || !token.trim()}>
            {loading && !twitchVerifying ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />}
            {loading && !twitchVerifying ? 'Comprobando…' : 'Entrar con Token'}
          </button>
        </form>

        {/* Modal de ayuda si Twitch aún no está configurado */}
        {showTwitchHelp && (
          <div className="twitch-help-modal">
            <div className="twitch-help-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TwitchIcon size={16} /> Configurar Acceso con Twitch
                </strong>
                <button
                  type="button"
                  onClick={() => setShowTwitchHelp(false)}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>
                Para permitir a los moderadores entrar con 1 clic usando Twitch:
              </p>
              <ol style={{ fontSize: '12px', color: '#aaa', paddingLeft: '18px', marginTop: '6px', lineHeight: '1.6' }}>
                <li>Entra en <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noreferrer" style={{ color: '#00f5d4' }}>dev.twitch.tv/console</a>.</li>
                <li>Crea una aplicación y pon en <em>OAuth Redirect URLs</em>: <code style={{ color: '#c084fc' }}>{window.location.origin}/admin/</code></li>
                <li>Copia el <strong>Client ID</strong> y añádelo en tu archivo <code style={{ color: '#fff' }}>.env</code>:</li>
              </ol>
              <pre style={{ background: '#0d0d12', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#c084fc', marginTop: '8px', overflowX: 'auto' }}>
                TWITCH_CLIENT_ID=tu_client_id_aqui{"\n"}
                TWITCH_MODERATORS=makacagotica,ikerrl
              </pre>
              <p style={{ fontSize: '11px', color: '#777', marginTop: '8px' }}>
                Mientras tanto, puedes acceder usando el Token manual de abajo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
