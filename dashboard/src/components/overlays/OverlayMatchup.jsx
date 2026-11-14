import { useState, useEffect } from 'react';
import { API_URL } from '../../api';

export default function OverlayMatchup() {
  const [match, setMatch] = useState({
    active: true,
    status: 'LIVE',
    team1: { name: 'Los Monos', logo: '/logo1.png', score: 0 },
    team2: { name: 'Gorilas', logo: '/logo2.png', score: 0 },
    map: 'Ascent',
    round: 0,
    format: 'BO3',
    side: 'DEF vs ATK',
    mvp: '',
    notes: '',
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
    const interval = setInterval(fetchLive, 1500);
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

  const isSwapped = (match.side || '').toLowerCase().includes('atk vs def') || (match.side || '').toLowerCase() === 'swapped';
  const team1Side = isSwapped ? 'LADO ROJO / ATACANTE' : 'LADO AZUL / DEFENSOR';
  const team2Side = isSwapped ? 'LADO AZUL / DEFENSOR' : 'LADO ROJO / ATACANTE';
  const team1Color = isSwapped ? '#ff4655' : '#00f5d4';
  const team2Color = isSwapped ? '#00f5d4' : '#ff4655';
  const team1Glow = isSwapped ? 'rgba(255, 70, 85, 0.4)' : 'rgba(0, 245, 212, 0.4)';
  const team2Glow = isSwapped ? 'rgba(0, 245, 212, 0.4)' : 'rgba(255, 70, 85, 0.4)';

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      fontFamily: "'Outfit', 'Rajdhani', sans-serif",
      userSelect: 'none',
      padding: '40px',
      boxSizing: 'border-box',
      pointerEvents: isVisible ? 'auto' : 'none',
    }}>
      <style>{`
        @keyframes matchupPopIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(24px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
      `}</style>
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 25, 35, 0.98) 0%, rgba(8, 8, 11, 0.98) 100%)',
        border: '1.5px solid rgba(192, 132, 252, 0.4)',
        borderRadius: '24px',
        padding: '40px 60px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(192, 132, 252, 0.22)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        maxWidth: '960px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(-20px)',
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(6px)',
        transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: 'matchupPopIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        willChange: 'transform, opacity, filter',
      }}>
        {/* Glow de fondo */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(192, 132, 252, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
          <img src="/copa-logo.png" alt="Logo" style={{ width: '54px', height: '54px', objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(192,132,252,0.5))' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#c084fc', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase' }}>
              COPA PRIMATE 2026
            </span>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: 900, letterSpacing: '1px' }}>
              ENFRENTAMIENTO OFICIAL
            </h2>
          </div>
          <img src="/copa-logo.png" alt="Logo" style={{ width: '54px', height: '54px', objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(192,132,252,0.5))' }} />
        </div>

        {/* CONTENEDOR VERSUS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '40px',
          width: '100%',
          zIndex: 1,
        }}>
          {/* EQUIPO 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '20px',
              background: 'rgba(0,0,0,0.6)',
              border: `3px solid ${team1Color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 20px ${team1Glow}`,
            }}>
              <img
                src={match.team1?.logo || '/logo1.png'}
                alt=""
                onError={(e) => { e.target.src = '/logo1.png'; }}
                style={{ width: '90px', height: '90px', objectFit: 'contain' }}
              />
            </div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: 900, letterSpacing: '1px' }}>
              {match.team1?.name || 'Equipo 1'}
            </h3>
            <span style={{
              fontSize: '12px',
              color: team1Color,
              fontWeight: 800,
              background: isSwapped ? 'rgba(255, 70, 85, 0.15)' : 'rgba(0, 245, 212, 0.15)',
              border: `1px solid ${team1Color}`,
              padding: '3px 12px',
              borderRadius: '6px',
            }}>
              {team1Side}
            </span>
          </div>

          {/* VS Y METADATOS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#c084fc',
              fontFamily: "'Rajdhani', 'Bebas Neue', sans-serif",
              lineHeight: 1,
              textShadow: '0 0 25px rgba(192, 132, 252, 0.8)',
            }}>
              VS
            </span>
            <div style={{
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(192, 132, 252, 0.3)',
              borderRadius: '8px',
              padding: '6px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '13px', color: '#00f5d4', fontWeight: 800, letterSpacing: '1.5px' }}>
                {match.format || 'BO3'} · FASE DE LIGA
              </div>
            </div>
          </div>

          {/* EQUIPO 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '20px',
              background: 'rgba(0,0,0,0.6)',
              border: `3px solid ${team2Color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 20px ${team2Glow}`,
            }}>
              <img
                src={match.team2?.logo || '/logo2.png'}
                alt=""
                onError={(e) => { e.target.src = '/logo2.png'; }}
                style={{ width: '90px', height: '90px', objectFit: 'contain' }}
              />
            </div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: 900, letterSpacing: '1px' }}>
              {match.team2?.name || 'Equipo 2'}
            </h3>
            <span style={{
              fontSize: '12px',
              color: team2Color,
              fontWeight: 800,
              background: isSwapped ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255, 70, 85, 0.15)',
              border: `1px solid ${team2Color}`,
              padding: '3px 12px',
              borderRadius: '6px',
            }}>
              {team2Side}
            </span>
          </div>
        </div>

        {/* PIE CON ESTADO O NOTA */}
        {match.notes && (
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px 20px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            maxWidth: '80%',
            zIndex: 1,
          }}>
            💬 {match.notes}
          </div>
        )}
      </div>
    </div>
  );
}
