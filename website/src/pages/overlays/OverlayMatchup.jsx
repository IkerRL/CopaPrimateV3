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
    team1: { name: 'Por Determinar', logo: '/copa-logo.png', score: 0, mapsWon: 0 },
    team2: { name: 'Por Determinar', logo: '/copa-logo.png', score: 0, mapsWon: 0 },
    map: '',
    round: 0,
    format: 'BO3',
    side: 'DEF vs ATK',
    mvp: '',
    notes: '',
    showMap: false,
    showScore: false,
    matchMoment: 'previa',
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
  const team1Glow = isSwapped ? 'rgba(255, 70, 85, 0.4)' : 'rgba(0, 245, 212, 0.4)';
  const team2Glow = isSwapped ? 'rgba(0, 245, 212, 0.4)' : 'rgba(255, 70, 85, 0.4)';

  const t1Tag = getTeamTag(match.team1);
  const t2Tag = getTeamTag(match.team2);

  const m1 = Number(match.team1?.mapsWon || 0);
  const m2 = Number(match.team2?.mapsWon || 0);

  // Formato y platanitos dinámicos (BO1: 1, BO3: 2, BO5: 3)
  const rawFormat = (match.format || 'BO3').toUpperCase();
  const maxBananas = rawFormat.includes('BO1') ? 1 : rawFormat.includes('BO5') ? 3 : 2;

  // Mapa visible solo si está elegido y no es nulo/vacío/TBD/desconocido
  const hasValidMap = Boolean(
    match.showMap !== false &&
    match.map &&
    typeof match.map === 'string' &&
    match.map.trim().length > 0 &&
    !['TBD', 'POR DECIDIR', 'SIN MAPA', 'NINGUNO', 'PENDIENTE', 'DESCONOCIDO', 'OCULTAR'].includes(match.map.trim().toUpperCase())
  );

  // Resultado visible según momento (antes del partido = oculto, después del partido / post = visible)
  const showScore = Boolean(
    match.showScore === true ||
    match.matchMoment === 'post' ||
    match.status === 'FINALIZADO' ||
    (match.showScore !== false && match.matchMoment !== 'previa' && (match.team1?.score > 0 || match.team2?.score > 0 || m1 > 0 || m2 > 0))
  );

  const rawPhase = String(match.phase || '').trim().toUpperCase();
  const phaseText = rawPhase
    ? rawPhase.replace(/\s*\(?\s*BO\d+\s*\)?/gi, '').trim() || 'FASE DE GRUPOS'
    : 'FASE DE GRUPOS';

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      fontFamily: "'Rajdhani', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#fff',
      padding: '30px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes vsPulseAnim {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(192, 132, 252, 0.45)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 32px rgba(192, 132, 252, 0.85)); }
        }
        @keyframes monkeyBobLeft {
          0% { transform: translateY(0px) rotate(-3deg); }
          100% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes monkeyBobRight {
          0% { transform: translateY(0px) rotate(3deg); }
          100% { transform: translateY(-8px) rotate(-3deg); }
        }
        @keyframes borderGlowPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .banana-dot {
          font-size: 16px;
          filter: grayscale(1) opacity(0.35);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .banana-dot.active {
          filter: grayscale(0) opacity(1) drop-shadow(0 0 8px #facc15);
          transform: scale(1.2);
        }
      `}</style>

      {/* CONTENEDOR PRINCIPAL */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1240px',
        background: 'linear-gradient(135deg, rgba(10, 14, 24, 0.96) 0%, rgba(5, 7, 14, 0.98) 100%)',
        border: '1.5px solid rgba(192, 132, 252, 0.4)',
        borderRadius: '24px',
        padding: '36px 48px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 50px rgba(192, 132, 252, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflow: 'hidden',
      }}>
        {/* HALOS AMBIENTALES */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '10%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 245, 212, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          right: '10%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 70, 85, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ENCABEZADO OFICIAL (SIN LOGO DE LA COPA AL LADO DEL TÍTULO) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '16px',
          zIndex: 2,
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
              {showScore ? (match.status === 'FINALIZADO' || match.matchMoment === 'post' ? 'RESULTADO FINAL DEL ENFRENTAMIENTO' : 'PARTIDO EN DIRECTO') : 'PREVIA DEL PARTIDO'}
            </h2>

            {/* PÍLDORA EXCLUSIVA DE FASE */}
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

            {/* Platanitos de mapas adaptados a BO1 / BO3 / BO5 */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }} title={`Formato: ${rawFormat}`}>
              {Array.from({ length: maxBananas }).map((_, i) => (
                <span key={i} className={`banana-dot ${m1 > i ? 'active' : ''}`}>🍌</span>
              ))}
            </div>
          </div>

          {/* VS CENTRAL CON ESCUDO, MAPA (SI APLICA) Y MARCADOR (SI APLICA) */}
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

            {/* MARCADOR SI ESTÁ HABILITADO / POST-PARTIDO */}
            {showScore && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.95), rgba(8, 12, 22, 0.98))',
                border: '1.5px solid #00f5d4',
                borderRadius: '10px',
                padding: '4px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 0 18px rgba(0, 245, 212, 0.3)',
              }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#00f5d4', fontVariantNumeric: 'tabular-nums' }}>
                  {m1 > 0 || m2 > 0 ? `${m1} - ${m2}` : `${match.team1?.score || 0} - ${match.team2?.score || 0}`}
                </span>
                <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 900, letterSpacing: '1px' }}>
                  {match.status === 'FINALIZADO' || match.matchMoment === 'post' ? 'FINAL' : 'MAPAS'}
                </span>
              </div>
            )}

            {/* MAPA SELECCIONADO (SI NO SE SABE O ESTÁ OCULTO, NO SE MUESTRA) */}
            {hasValidMap && (
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

            {/* Platanitos de mapas adaptados a BO1 / BO3 / BO5 */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }} title={`Formato: ${rawFormat}`}>
              {Array.from({ length: maxBananas }).map((_, i) => (
                <span key={i} className={`banana-dot ${m2 > i ? 'active' : ''}`}>🍌</span>
              ))}
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
