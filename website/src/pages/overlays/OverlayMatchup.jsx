import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';

export default function OverlayMatchup() {
  const [match, setMatch] = useState({
    active: true,
    status: 'LIVE',
    team1: { name: 'Los Monos', logo: '/monkeys.jpg', score: 0 },
    team2: { name: 'Gorilas', logo: '/gorilas.jpg', score: 0 },
    map: 'Ascent',
    round: 0,
    format: 'BO3',
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
        const res = await fetch(`${API_BASE}/live-match?overlay=1`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.match) {
            setMatch(data.match);
          }
        }
      } catch (err) {}
    };

    fetchLive();
    const interval = setInterval(fetchLive, 1500);
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
        background: 'linear-gradient(135deg, rgba(20, 26, 22, 0.96) 0%, rgba(10, 14, 12, 0.98) 100%)',
        border: '3px solid #ffb300',
        borderRadius: '24px',
        padding: '40px 60px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(255, 179, 0, 0.25)',
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
          background: 'radial-gradient(circle at center, rgba(255, 179, 0, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
          <img src="/copa-logo.png" alt="Logo" style={{ width: '54px', height: '54px', objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(255,179,0,0.45))' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#ffb300', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase' }}>
              COPA PRIMATE 2026
            </span>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: 900, letterSpacing: '1px' }}>
              ENFRENTAMIENTO OFICIAL
            </h2>
          </div>
          <img src="/copa-logo.png" alt="Logo" style={{ width: '54px', height: '54px', objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(255,179,0,0.45))' }} />
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
              background: 'rgba(0,0,0,0.5)',
              border: '3px solid #2e7d32',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(46, 125, 50, 0.4)',
            }}>
              <img
                src={match.team1?.logo || '/monkeys.jpg'}
                alt=""
                onError={(e) => { e.target.src = '/monkeys.jpg'; }}
                style={{ width: '90px', height: '90px', objectFit: 'contain' }}
              />
            </div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: 900, letterSpacing: '1px' }}>
              {match.team1?.name || 'Equipo 1'}
            </h3>
            <span style={{
              fontSize: '12px',
              color: '#4caf50',
              fontWeight: 800,
              background: 'rgba(76, 175, 80, 0.15)',
              padding: '3px 12px',
              borderRadius: '6px',
            }}>
              LADO AZUL / DEFENSOR
            </span>
          </div>

          {/* VS Y METADATOS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#ffb300',
              fontFamily: "'Rajdhani', 'Bebas Neue', sans-serif",
              lineHeight: 1,
              textShadow: '0 0 25px rgba(255, 179, 0, 0.8)',
            }}>
              VS
            </span>
            <div style={{
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '6px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '13px', color: '#ffb300', fontWeight: 800, letterSpacing: '1.5px' }}>
                FASE DE LIGA
              </div>
            </div>
          </div>

          {/* EQUIPO 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '20px',
              background: 'rgba(0,0,0,0.5)',
              border: '3px solid #ffb300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(255, 179, 0, 0.4)',
            }}>
              <img
                src={match.team2?.logo || '/gorilas.jpg'}
                alt=""
                onError={(e) => { e.target.src = '/gorilas.jpg'; }}
                style={{ width: '90px', height: '90px', objectFit: 'contain' }}
              />
            </div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: 900, letterSpacing: '1px' }}>
              {match.team2?.name || 'Equipo 2'}
            </h3>
            <span style={{
              fontSize: '12px',
              color: '#ffb300',
              fontWeight: 800,
              background: 'rgba(255, 179, 0, 0.15)',
              padding: '3px 12px',
              borderRadius: '6px',
            }}>
              LADO ROJO / ATACANTE
            </span>
          </div>
        </div>

        {/* PIE CON ESTADO O NOTA */}
        {match.notes && (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '8px',
            padding: '8px 20px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.7)',
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

