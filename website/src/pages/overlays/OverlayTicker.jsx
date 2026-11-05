import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';

export default function OverlayTicker() {
  const [match, setMatch] = useState({
    active: true,
    status: 'LIVE',
    team1: { name: 'Los Monos', score: 0 },
    team2: { name: 'Gorilas', score: 0 },
    map: 'Ascent',
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
        const res = await fetch(`${API_BASE}/live-match?overlay=1`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.match) {
            setMatch(data.match);
          }
        }
      } catch (err) { }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isVisible = match.active !== false;

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
        background: 'linear-gradient(90deg, #101612 0%, #17241c 50%, #101612 100%)',
        borderTop: '3px solid #ffb300',
        padding: '12px 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 -10px 25px rgba(0,0,0,0.85)',
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
            background: 'linear-gradient(90deg, #ffb300, #ff8c00)',
            color: '#000',
            fontWeight: 900,
            fontSize: '12px',
            padding: '3px 10px',
            borderRadius: '4px',
            letterSpacing: '1px',
          }}>
            COPA PRIMATE 2026
          </span>

          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>
            🔴 <span style={{ color: '#ffb300' }}>{match.team1?.name || 'Equipo 1'}</span> ({match.team1?.score || 0}) vs <span style={{ color: '#ffb300' }}>{match.team2?.name || 'Equipo 2'}</span> ({match.team2?.score || 0})
            {match.map && match.map !== 'TBD' && (
              <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: '12px', fontSize: '13px' }}>
                · Mapa: {match.map}
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
            color: '#9146ff',
            background: 'rgba(145, 70, 255, 0.15)',
            border: '1px solid rgba(145, 70, 255, 0.4)',
            padding: '3px 10px',
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

