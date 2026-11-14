import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';

export function getTeamTag(team) {
  if (!team) return 'TBD';
  if (team.tag && typeof team.tag === 'string' && team.tag.trim().length > 0) {
    return team.tag.trim().slice(0, 4).toUpperCase();
  }
  const raw = (team.name || '').trim();
  if (!raw || raw.toUpperCase() === 'SELECCIONAR' || raw.toUpperCase() === 'TBD') {
    return 'TBD';
  }

  const clean = raw.toUpperCase();
  if (clean.includes('GORIL')) return 'GOR';
  if (clean.includes('MONO') || clean.includes('MONKEY')) return 'MON';
  if (clean.includes('CHIMP')) return 'CHP';
  if (clean.includes('ORANG')) return 'ORA';
  if (clean.includes('BABUIN') || clean.includes('BABOON')) return 'BAB';
  if (clean.includes('HERETICS')) return 'THB';
  if (clean.includes('KOI')) return 'KOI';
  if (clean.includes('GIANTS')) return 'GIA';
  if (clean.includes('FNATIC')) return 'FNC';
  if (clean.includes('SENTINEL')) return 'SEN';
  if (clean.includes('FUSION')) return 'FSN';

  if (/^[A-Za-z0-9]{2,4}$/.test(raw)) {
    return raw.toUpperCase();
  }

  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }
  if (words.length === 2) {
    const w1 = words[0];
    const w2 = words[1];
    if (w1.length >= 1 && w2.length >= 2) {
      return (w1[0] + w2.slice(0, 2)).toUpperCase();
    }
  }

  const alphanum = raw.replace(/[^a-zA-Z0-9]/g, '');
  return alphanum.slice(0, 3).toUpperCase() || 'TBD';
}

export default function OverlayMatchup() {
  const [match, setMatch] = useState({
    active: true,
    status: 'LIVE',
    phase: 'FASE DE GRUPOS',
    team1: { name: 'Los Monos', logo: '/logo1.png', score: 0, mapsWon: 0 },
    team2: { name: 'Gorilas', logo: '/logo2.png', score: 0, mapsWon: 0 },
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
        const res = await fetch(`${API_BASE}/live-match?overlay=1`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.match) {
            setMatch(data.match);
          }
        }
      } catch {}
    };

    fetchLive();
    const interval = setInterval(fetchLive, 1000);
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
  const team1Side = isSwapped ? 'ATACANTE' : 'DEFENSOR';
  const team2Side = isSwapped ? 'DEFENSOR' : 'ATACANTE';
  const team1Color = isSwapped ? '#ff4655' : '#00f5d4';
  const team2Color = isSwapped ? '#00f5d4' : '#ff4655';
  const team1Glow = isSwapped ? 'rgba(255, 70, 85, 0.45)' : 'rgba(0, 245, 212, 0.45)';
  const team2Glow = isSwapped ? 'rgba(0, 245, 212, 0.45)' : 'rgba(255, 70, 85, 0.45)';

  const t1Tag = getTeamTag(match.team1);
  const t2Tag = getTeamTag(match.team2);

  // Extraer SOLO la fase (sin BO3 ni formatos)
  const getCleanPhase = () => {
    const raw = match.phase || match.stage || match.jornada || '';
    if (typeof raw === 'number') return `JORNADA ${raw}`;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      const clean = raw.replace(/\bBO[0-9]\b/gi, '').replace(/·/g, '').trim();
      if (clean) return clean.toUpperCase();
    }
    if (match.notes && !match.notes.toLowerCase().includes('bo')) {
      return match.notes.trim().toUpperCase();
    }
    return 'FASE DE GRUPOS';
  };

  const phaseText = getCleanPhase();
  const m1 = match.team1?.mapsWon ?? 0;
  const m2 = match.team2?.mapsWon ?? 0;

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
      padding: '30px',
      boxSizing: 'border-box',
      pointerEvents: isVisible ? 'auto' : 'none',
    }}>
      <style>{`
        @keyframes previaCardIn {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(30px);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
        @keyframes vsPulseAnim {
          0% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(192, 132, 252, 0.6)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 0 28px rgba(192, 132, 252, 0.95)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(192, 132, 252, 0.6)); }
        }
        @keyframes monkeyBobLeft {
          0% { transform: rotate(-3deg) scale(1); }
          100% { transform: rotate(3deg) scale(1.08); }
        }
        @keyframes monkeyBobRight {
          0% { transform: rotate(3deg) scale(1); }
          100% { transform: rotate(-3deg) scale(1.08); }
        }
        @keyframes energyScan {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .banana-dot {
          font-size: 1.35rem;
          filter: grayscale(1) opacity(0.25);
          transition: all 0.3s ease;
        }
        .banana-dot.active {
          filter: drop-shadow(0 0 8px #ffeb3b) brightness(1.2) !important;
          animation: 1s ease-in-out infinite alternate bananaWiggle;
        }
        @keyframes bananaWiggle {
          0% { transform: rotate(-10deg) scale(1.15); }
          100% { transform: rotate(10deg) scale(1.15); }
        }
      `}</style>

      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 22, 34, 0.98) 0%, rgba(9, 10, 16, 0.99) 100%)',
        border: '1.5px solid rgba(192, 132, 252, 0.45)',
        borderRadius: '24px',
        padding: '36px 54px',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 40px rgba(192, 132, 252, 0.22)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        maxWidth: '1040px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        animation: 'previaCardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}>
        {/* Glow ambiental central */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(192, 132, 252, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ENCABEZADO OFICIAL CON MONOS Y LOGO */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          zIndex: 2,
          width: '100%',
        }}>
          {/* Monito Izquierdo */}
          <img
            src="/monito-izq.png"
            alt="Mono Izquierdo"
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 12px rgba(0, 245, 212, 0.6))',
              animation: 'monkeyBobLeft 3s ease-in-out infinite alternate',
            }}
          />

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/copa-logo.png" alt="Copa" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase' }}>
                COPA PRIMATE // VOL. III
              </span>
            </div>
            <h2 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              background: 'linear-gradient(180deg, #ffffff 0%, #e9d5ff 60%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(192, 132, 252, 0.4)',
              lineHeight: 1.1,
            }}>
              PREVIA DEL PARTIDO
            </h2>

            {/* PÍLDORA EXCLUSIVA DE FASE (SIN BO3) */}
            <div style={{
              marginTop: '4px',
              background: 'linear-gradient(90deg, rgba(0, 245, 212, 0.15) 0%, rgba(192, 132, 252, 0.18) 50%, rgba(255, 70, 85, 0.15) 100%)',
              border: '1.5px solid rgba(192, 132, 252, 0.5)',
              borderRadius: '20px',
              padding: '4px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(192, 132, 252, 0.3)',
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#00f5d4',
                boxShadow: '0 0 8px #00f5d4',
              }} />
              <span style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>
                {phaseText}
              </span>
            </div>
          </div>

          {/* Monito Derecho */}
          <img
            src="/monito-der.png"
            alt="Mono Derecho"
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 12px rgba(255, 70, 85, 0.6))',
              animation: 'monkeyBobRight 3s ease-in-out infinite alternate',
            }}
          />
        </div>

        {/* CONTENEDOR VERSUS PRINCIPAL */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '36px',
          width: '100%',
          zIndex: 2,
        }}>
          {/* EQUIPO 1 (IZQUIERDA) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            border: `1.5px solid ${team1Color}`,
            borderRadius: '20px',
            padding: '24px 20px',
            boxShadow: `0 12px 30px rgba(0,0,0,0.7), inset 0 0 25px ${team1Glow}`,
            transition: 'all 0.3s ease',
          }}>
            {/* Logo en cápsula brillante */}
            <div style={{
              width: '110px',
              height: '110px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(20,25,35,0.9), rgba(10,12,18,0.95))',
              border: `2px solid ${team1Color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 10px 25px rgba(0,0,0,0.8), 0 0 20px ${team1Glow}`,
            }}>
              <img
                src={match.team1?.logo || '/logo1.png'}
                alt={t1Tag}
                onError={(e) => { e.target.src = '/logo1.png'; }}
                style={{ width: '85px', height: '85px', objectFit: 'contain' }}
              />
            </div>

            {/* Tag de 3 letras */}
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '2.4rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '2.5px',
              textShadow: `0 0 15px ${team1Glow}`,
              lineHeight: 1,
            }}>
              {t1Tag}
            </span>

            {/* Nombre completo */}
            <h3 style={{
              margin: 0,
              fontSize: '17px',
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 800,
              letterSpacing: '1px',
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {match.team1?.name || 'Equipo 1'}
            </h3>

            {/* Lado Táctico */}
            <div style={{
              fontSize: '11px',
              color: team1Color,
              fontWeight: 900,
              background: isSwapped ? 'rgba(255, 70, 85, 0.16)' : 'rgba(0, 245, 212, 0.16)',
              border: `1px solid ${team1Color}`,
              padding: '3px 14px',
              borderRadius: '6px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              boxShadow: `0 0 10px ${team1Glow}`,
            }}>
              {team1Side}
            </div>

            {/* Platanitos de mapas */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }} title="Mapas ganados">
              <span className={`banana-dot ${m1 > 0 ? 'active' : ''}`}>🍌</span>
              <span className={`banana-dot ${m1 > 1 ? 'active' : ''}`}>🍌</span>
              <span className={`banana-dot ${m1 > 2 ? 'active' : ''}`}>🍌</span>
            </div>
          </div>

          {/* VS CENTRAL CON ESCUDO */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.95), rgba(12, 10, 22, 0.98))',
              border: '2px solid rgba(192, 132, 252, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px rgba(192, 132, 252, 0.5), inset 0 0 15px rgba(192, 132, 252, 0.3)',
              animation: 'vsPulseAnim 3s infinite ease-in-out',
            }}>
              <span style={{
                fontSize: '44px',
                fontWeight: 900,
                color: '#c084fc',
                fontFamily: "'Rajdhani', 'Bebas Neue', sans-serif",
                lineHeight: 1,
                letterSpacing: '2px',
              }}>
                VS
              </span>
            </div>

            {/* Mapa si está activo */}
            {match.map && (
              <div style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(0, 245, 212, 0.4)',
                borderRadius: '8px',
                padding: '4px 14px',
                textAlign: 'center',
                boxShadow: '0 0 12px rgba(0, 245, 212, 0.25)',
              }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1.5px', fontWeight: 800 }}>
                  MAPA SELECCIONADO
                </div>
                <div style={{ fontSize: '13px', color: '#00f5d4', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {match.map}
                </div>
              </div>
            )}
          </div>

          {/* EQUIPO 2 (DERECHA) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            border: `1.5px solid ${team2Color}`,
            borderRadius: '20px',
            padding: '24px 20px',
            boxShadow: `0 12px 30px rgba(0,0,0,0.7), inset 0 0 25px ${team2Glow}`,
            transition: 'all 0.3s ease',
          }}>
            {/* Logo en cápsula brillante */}
            <div style={{
              width: '110px',
              height: '110px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(20,25,35,0.9), rgba(10,12,18,0.95))',
              border: `2px solid ${team2Color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 10px 25px rgba(0,0,0,0.8), 0 0 20px ${team2Glow}`,
            }}>
              <img
                src={match.team2?.logo || '/logo2.png'}
                alt={t2Tag}
                onError={(e) => { e.target.src = '/logo2.png'; }}
                style={{ width: '85px', height: '85px', objectFit: 'contain' }}
              />
            </div>

            {/* Tag de 3 letras */}
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '2.4rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '2.5px',
              textShadow: `0 0 15px ${team2Glow}`,
              lineHeight: 1,
            }}>
              {t2Tag}
            </span>

            {/* Nombre completo */}
            <h3 style={{
              margin: 0,
              fontSize: '17px',
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 800,
              letterSpacing: '1px',
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {match.team2?.name || 'Equipo 2'}
            </h3>

            {/* Lado Táctico */}
            <div style={{
              fontSize: '11px',
              color: team2Color,
              fontWeight: 900,
              background: isSwapped ? 'rgba(0, 245, 212, 0.16)' : 'rgba(255, 70, 85, 0.16)',
              border: `1px solid ${team2Color}`,
              padding: '3px 14px',
              borderRadius: '6px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              boxShadow: `0 0 10px ${team2Glow}`,
            }}>
              {team2Side}
            </div>

            {/* Platanitos de mapas */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }} title="Mapas ganados">
              <span className={`banana-dot ${m2 > 0 ? 'active' : ''}`}>🍌</span>
              <span className={`banana-dot ${m2 > 1 ? 'active' : ''}`}>🍌</span>
              <span className={`banana-dot ${m2 > 2 ? 'active' : ''}`}>🍌</span>
            </div>
          </div>
        </div>

        {/* PIE CON NOTA O INFORMACIÓN ADICIONAL */}
        {match.notes && (
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(192, 132, 252, 0.25)',
            borderRadius: '10px',
            padding: '8px 24px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'center',
            maxWidth: '85%',
            zIndex: 2,
            letterSpacing: '1px',
          }}>
            💬 {match.notes}
          </div>
        )}

        {/* BARRA DE ENERGÍA INFERIOR */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #00f5d4 0%, #c084fc 50%, #ff4655 100%)',
          boxShadow: '0 0 15px rgba(192, 132, 252, 0.8)',
        }} />
      </div>
    </div>
  );
}
