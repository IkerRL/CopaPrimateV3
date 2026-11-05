import { useState } from 'react';
import { Activity, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { checkToken, setToken } from '../api';

export default function Login({ onSuccess, expired }) {
  const [token, setTokenValue] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(expired ? 'Tu sesión ha caducado. Vuelve a introducir el token.' : '');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
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
      <form className="login-card" onSubmit={submit}>
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <img
            src="/copa-logo.png"
            alt="Logo Copa Primate"
            style={{
              width: '76px',
              height: '76px',
              objectFit: 'contain',
              margin: '0 auto',
              filter: 'drop-shadow(0 0 16px rgba(192,132,252,0.65))',
              display: 'block'
            }}
          />
        </div>
        <h1 className="title-font">Panel Primate</h1>
        <p className="login-sub">Acceso restringido a la moderación de la Copa Primate</p>

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
            autoFocus
          />
        </div>

        <label className="login-remember">
          <input id="remember-token" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Recordar en este equipo
        </label>

        {error && <div className="login-error" role="alert">{error}</div>}

        <button id="login-submit" type="submit" className="login-btn" disabled={loading || !token.trim()}>
          {loading ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />}
          {loading ? 'Comprobando…' : 'Entrar al panel'}
        </button>
      </form>
    </div>
  );
}
