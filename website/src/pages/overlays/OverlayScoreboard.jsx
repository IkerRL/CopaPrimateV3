import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../api';
import './marcador.css';

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

export default function OverlayScoreboard() {
  const [match, setMatch] = useState({
    active: true,
    status: 'LIVE',
    team1: { name: 'SELECCIONAR', logo: '/logo1.png', score: 0, mapsWon: 0 },
    team2: { name: 'SELECCIONAR', logo: '/logo2.png', score: 0, mapsWon: 0 },
    map: '',
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

  const s1 = match.team1?.score ?? 0;
  const s2 = match.team2?.score ?? 0;
  const m1 = match.team1?.mapsWon ?? 0;
  const m2 = match.team2?.mapsWon ?? 0;

  // Animaciones para subida y bajada de puntuación
  const prevS1 = useRef(s1);
  const prevS2 = useRef(s2);
  const [score1Anim, setScore1Anim] = useState('');
  const [score2Anim, setScore2Anim] = useState('');
  const [score1Delta, setScore1Delta] = useState(0);
  const [score2Delta, setScore2Delta] = useState(0);

  useEffect(() => {
    if (prevS1.current !== s1) {
      const diff = s1 - prevS1.current;
      setScore1Delta(diff);
      setScore1Anim(diff > 0 ? 'score-up' : 'score-down');
      const timer = setTimeout(() => {
        setScore1Anim('');
        setScore1Delta(0);
      }, 1000);
      prevS1.current = s1;
      return () => clearTimeout(timer);
    }
  }, [s1]);

  useEffect(() => {
    if (prevS2.current !== s2) {
      const diff = s2 - prevS2.current;
      setScore2Delta(diff);
      setScore2Anim(diff > 0 ? 'score-up' : 'score-down');
      const timer = setTimeout(() => {
        setScore2Anim('');
        setScore2Delta(0);
      }, 1000);
      prevS2.current = s2;
      return () => clearTimeout(timer);
    }
  }, [s2]);

  const rawFormat = (match.format || 'BO3').toLowerCase();
  const formatClass = rawFormat.includes('bo1') ? 'format-bo1' : rawFormat.includes('bo5') ? 'format-bo5' : 'format-bo3';

  const isMatchPointT1 = s1 >= 12 && s1 > s2;
  const isMatchPointT2 = s2 >= 12 && s2 > s1;
  const isPause = String(match.status || '').toUpperCase().includes('PAUSA');
  const isOverlay = typeof window !== 'undefined' && (
    window.location.search.includes('overlay=1') ||
    window.location.pathname.includes('/overlay')
  );
  const isVisible = isOverlay || match.active !== false || true;

  const isSwapped = (match.side || '').toLowerCase().includes('atk vs def') || (match.side || '').toLowerCase() === 'swapped';
  const team1Side = isSwapped ? 'ATACANTE' : 'DEFENSOR';
  const team2Side = isSwapped ? 'DEFENSOR' : 'ATACANTE';
  const team1SideClass = isSwapped ? 'team-side-attacker' : 'team-side-defender';
  const team2SideClass = isSwapped ? 'team-side-defender' : 'team-side-attacker';

  const t1Tag = getTeamTag(match.team1);
  const t2Tag = getTeamTag(match.team2);

  return (
    <div
      style={{
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        background: 'transparent',
        transform: isVisible ? 'translateY(0)' : 'translateY(-90px)',
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(4px)',
        transition: 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease',
        animation: 'scoreboardDropIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        willChange: 'transform, opacity, filter',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <style>{`
        @keyframes scoreboardDropIn {
          0% {
            opacity: 0;
            transform: translateY(-80px) scale(0.97);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }
      `}</style>
      <div className={`main-container ${formatClass}`} id="main-scoreboard">
        {/* EQUIPO IZQUIERDA */}
        <div className="team-glow-container team-left" id="glow-container-left">
          <div className="team-wrapper" id="wrapper-left">
            <div className="match-point-badge" id="mp-left" style={{ display: isMatchPointT1 ? 'block' : 'none' }}>
              MATCH POINT
            </div>
            
            <div className="map-wins-container" id="maps-left" title="Mapas ganados">
              <div className={`map-win-dot ${m1 > 0 ? 'active' : ''}`} data-idx="0">🍌</div>
              <div className={`map-win-dot ${m1 > 1 ? 'active' : ''}`} data-idx="1">🍌</div>
              <div className={`map-win-dot ${m1 > 2 ? 'active' : ''}`} data-idx="2">🍌</div>
            </div>

            <div className="team-info team-info-left">
              <div className={`team-side-indicator ${team1SideClass}`}>
                {team1Side}
              </div>
              <span id="name-left" className="team-tag" title={match.team1?.name || 'SELECCIONAR'}>
                {t1Tag}
              </span>
              <div className="logo-box">
                <img
                  id="img-left"
                  src={match.team1?.logo || '/logo1.png'}
                  alt={t1Tag}
                  onError={(e) => { e.target.src = '/logo1.png'; }}
                />
              </div>
            </div>

            <div className={`score-box ${score1Anim}`} id="score-left" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span className="score-num">{s1}</span>
              {score1Delta !== 0 && (
                <span className={`score-delta delta-${score1Delta > 0 ? 'up' : 'down'}`}>
                  {score1Delta > 0 ? `+${score1Delta}` : score1Delta}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CENTRO DEL TORNEO REDISEÑADO CON MONOS OFICIALES Y COPA */}
        <div className="tournament-center">
          <div className="center-top-row">
            <img src="/copa-logo.png" className="center-cup-icon" alt="Copa" />
            <span className="main-title" id="display-title">COPA PRIMATE</span>
          </div>

          <div className="row-bottom">
            <div className="monkey-pad left-pad" id="monkey-pad-left" title="Monito Oficial">
              <img src="/monito-izq.png" className="monkey-avatar monkey-left-img" id="monkeyLeft" alt="Mono Izquierda" />
            </div>
            <div className="vol-pill">
              <span className="sub-title" id="display-subtitle">VOL. III</span>
            </div>
            <div className="monkey-pad right-pad" id="monkey-pad-right" title="Monito Oficial">
              <img src="/monito-der.png" className="monkey-avatar monkey-right-img" id="monkeyRight" alt="Mono Derecha" />
            </div>
          </div>

          <div className="center-accent-bar" />
        </div>

        {/* EQUIPO DERECHA */}
        <div className="team-glow-container team-right" id="glow-container-right">
          <div className="team-wrapper" id="wrapper-right">
            <div className={`score-box ${score2Anim}`} id="score-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span className="score-num">{s2}</span>
              {score2Delta !== 0 && (
                <span className={`score-delta delta-${score2Delta > 0 ? 'up' : 'down'}`}>
                  {score2Delta > 0 ? `+${score2Delta}` : score2Delta}
                </span>
              )}
            </div>

            <div className="team-info team-info-right">
              <div className="logo-box">
                <img
                  id="img-right"
                  src={match.team2?.logo || '/logo2.png'}
                  alt={t2Tag}
                  onError={(e) => { e.target.src = '/logo2.png'; }}
                />
              </div>
              <span id="name-right" className="team-tag" title={match.team2?.name || 'SELECCIONAR'}>
                {t2Tag}
              </span>
              <div className={`team-side-indicator ${team2SideClass}`}>
                {team2Side}
              </div>
            </div>

            <div className="map-wins-container" id="maps-right" title="Mapas ganados">
              <div className={`map-win-dot ${m2 > 2 ? 'active' : ''}`} data-idx="2">🍌</div>
              <div className={`map-win-dot ${m2 > 1 ? 'active' : ''}`} data-idx="1">🍌</div>
              <div className={`map-win-dot ${m2 > 0 ? 'active' : ''}`} data-idx="0">🍌</div>
            </div>

            <div className="match-point-badge" id="mp-right" style={{ display: isMatchPointT2 ? 'block' : 'none' }}>
              MATCH POINT
            </div>
          </div>
        </div>
      </div>

      {/* PAUSA TÉCNICA VALORANT FUSIÓN */}
      {isPause && (
        <div className="timer-overlay tech-pause" id="timer-overlay">
          <div className="timer-card">
            <div className="timer-title" id="timer-title">
              PAUSA TÉCNICA
            </div>
            <div className="timer-countdown" id="timer-countdown">
              PAUSA
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', letterSpacing: '1px' }}>
              PARTIDO EN PAUSA POR DECISIÓN ARBITRAL
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
