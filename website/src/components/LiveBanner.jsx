import { useState } from 'react';
import { Tv, Radio, X, ExternalLink } from 'lucide-react';
import { useLiveMatch } from '../api';

export default function LiveBanner() {
  const { match, isLive } = useLiveMatch(8000);
  const [dismissed, setDismissed] = useState(false);

  if (!isLive || !match || dismissed) {
    return null;
  }

  const t1 = match.team1 || match.t1 || { name: 'Equipo 1', score: 0 };
  const t2 = match.team2 || match.t2 || { name: 'Equipo 2', score: 0 };
  const score1 = t1.score ?? match.score1 ?? 0;
  const score2 = t2.score ?? match.score2 ?? 0;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(255, 70, 85, 0.95) 0%, rgba(18, 18, 22, 0.95) 25%, rgba(18, 18, 22, 0.95) 75%, rgba(255, 70, 85, 0.95) 100%)',
        borderBottom: '1px solid rgba(255, 70, 85, 0.4)',
        boxShadow: '0 4px 20px rgba(255, 70, 85, 0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        padding: '8px 16px',
        color: '#fff',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Lado izquierdo: Badge de Vivo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ff4655',
              color: '#fff',
              padding: '3px 10px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '11px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              boxShadow: '0 0 10px rgba(255, 70, 85, 0.6)',
              animation: 'pulse 1.8s infinite',
            }}
          >
            <Radio size={13} /> EN DIRECTO
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {match.map ? `Mapa: ${match.map}` : 'Partido Oficial'}
            {match.round ? ` · Ronda ${match.round}` : ''}
          </span>
        </div>

        {/* Centro: Tanteo en tiempo real */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {t1.logo && (
              <img
                src={t1.logo}
                alt=""
                style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
              />
            )}
            <span>{t1.name}</span>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '2px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '18px',
              letterSpacing: '1px',
              color: 'var(--primary)',
            }}
          >
            {score1} - {score2}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{t2.name}</span>
            {t2.logo && (
              <img
                src={t2.logo}
                alt=""
                style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
              />
            )}
          </div>
        </div>

        {/* Lado derecho: Enlace a Twitch y Botón Cerrar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href="https://www.twitch.tv/makacagotica"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#9146ff',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            <Tv size={14} /> Ver en Twitch <ExternalLink size={12} />
          </a>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Cerrar aviso en directo"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
