import { useState, useEffect } from 'react';
import { API_URL } from '../../api';

export default function OverlayTicker() {
  const [match, setMatch] = useState({
    active: true,
    status: 'LIVE',
    team1: { name: 'TBD', score: 0 },
    team2: { name: 'TBD', score: 0 },
    map: '',
    round: 0,
    format: 'BO3',
  });

  useEffect(() => {
    document.body.style.background = 'transparent';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.background = 'transparent';

    let mounted = true;
    const fetchLive = async () => {
      try {
        const res = await fetch(`${API_URL}/public/live-match?overlay=1`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.match) {
            setMatch(data.match);
          }
        }
      } catch {}
    };

    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, []);

  const isOverlay = typeof window !== 'undefined' && (
    window.location.search.includes('overlay=1') ||
    window.location.pathname.includes('/overlay')
  );
  const isVisible = isOverlay || match.active !== false || true;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      background: 'transparent',
      fontFamily: "'Outfit', sans-serif",
      userSelect: 'none',
      boxSizing: 'border-box',
      pointerEvents: isVisible ? 'auto' : 'none',
    }}>
      <style>{`
        @keyframes tickerSlideUp {
          0% {
            opacity: 0;
            transform: translateY(100%);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div style={{
        width: '100%',
        background: 'linear-gradient(90deg, rgba(8, 8, 11, 0.98) 0%, rgba(15, 25, 35, 0.96) 50%, rgba(8, 8, 11, 0.98) 100%)',
        borderTop: '2px solid #c084fc',
        padding: '12px 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 -10px 25px rgba(0,0,0,0.85), 0 -2px 15px rgba(192, 132, 252, 0.3)',
        boxSizing: 'border-box',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
        animation: 'tickerSlideUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        willChange: 'transform, opacity',
      }}>
        {/* Lado izquierdo con marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{
            background: 'linear-gradient(90deg, #c084fc, #00f5d4)',
            color: '#08080b',
            fontWeight: 900,
            fontSize: '12px',
            padding: '4px 12px',
            borderRadius: '4px',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
          }}>
            COPA PRIMATE 2026
          </span>

          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>
            🔴 <span style={{ color: '#00f5d4', fontWeight: 800 }}>{match.team1?.name || 'Equipo 1'}</span> (<span style={{ fontVariantNumeric: 'tabular-nums' }}>{match.team1?.score || 0}</span>) vs <span style={{ color: '#ff4655', fontWeight: 800 }}>{match.team2?.name || 'Equipo 2'}</span> (<span style={{ fontVariantNumeric: 'tabular-nums' }}>{match.team2?.score || 0}</span>)
            {match.map && match.map !== 'TBD' && (
              <span style={{ color: '#c084fc', marginLeft: '14px', fontSize: '13px', fontWeight: 800, background: 'rgba(192, 132, 252, 0.12)', border: '1px solid rgba(192, 132, 252, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                MAPA: {match.map.toUpperCase()}
              </span>
            )}
            {match.round > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '10px', fontSize: '13px' }}>
                · RONDA {match.round}
              </span>
            )}
          </span>
        </div>

        {/* Lado derecho con canal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600 }}>
            EN DIRECTO EN:
          </span>
          <span style={{
            color: '#c084fc',
            background: 'rgba(192, 132, 252, 0.15)',
            border: '1px solid rgba(192, 132, 252, 0.4)',
            padding: '3px 12px',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '13px',
          }}>
            twitch.tv/makacagotica
          </span>
        </div>
      </div>
    </div>
  );
}
