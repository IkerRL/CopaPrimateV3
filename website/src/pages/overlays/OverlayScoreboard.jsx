import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';
import './marcador.css';

export default function OverlayScoreboard() {
  const [match, setMatch] = useState({
    active: true,
    status: 'LIVE',
    team1: { name: 'SELECCIONAR', logo: '/monkeys.jpg', score: 0, mapsWon: 0 },
    team2: { name: 'SELECCIONAR', logo: '/gorilas.jpg', score: 0, mapsWon: 0 },
    map: '',
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
  const rawFormat = (match.format || 'BO3').toLowerCase();
  const formatClass = rawFormat.includes('bo1') ? 'format-bo1' : rawFormat.includes('bo5') ? 'format-bo5' : 'format-bo3';

  const isMatchPointT1 = s1 >= 12 && s1 > s2;
  const isMatchPointT2 = s2 >= 12 && s2 > s1;
  const isPause = String(match.status || '').toUpperCase().includes('PAUSA');
  const isVisible = match.active !== false;

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
            <div className="leaf-deco leaf-1"></div>
            <div className="leaf-deco leaf-2"></div>
            <div className="match-point-badge" id="mp-left" style={{ display: isMatchPointT1 ? 'block' : 'none' }}>
              MATCH POINT
            </div>
            <div className="map-wins-container" id="maps-left" title="Mapas ganados">
              <div className={`map-win-dot ${m1 > 0 ? 'active' : ''}`} data-idx="0">🍌</div>
              <div className={`map-win-dot ${m1 > 1 ? 'active' : ''}`} data-idx="1">🍌</div>
              <div className={`map-win-dot ${m1 > 2 ? 'active' : ''}`} data-idx="2">🍌</div>
            </div>
            <div className="team-info">
              <span id="name-left" className="team-name">
                {match.team1?.name || 'SELECCIONAR'}
              </span>
              <div className="logo-box">
                <img
                  id="img-left"
                  src={match.team1?.logo || '/monkeys.jpg'}
                  alt="Logo A"
                  onError={(e) => { e.target.src = '/monkeys.jpg'; }}
                />
              </div>
            </div>
            <div className="score-box" id="score-left">
              {s1}
            </div>
          </div>
        </div>

        {/* CENTRO DEL TORNEO */}
        <div className="tournament-center">
          <div className="row-top">
            <span className="main-title" id="display-title">Copa Primate</span>
          </div>

          <div className="row-bottom">
            <div className="monkey-pad left-pad" id="monkey-pad-left">
              <img src="/copa-logo.png" className="vol-logo" id="monkeyLeft" alt="Vol.III" />
            </div>
            <span className="sub-title" id="display-subtitle">VOL.III</span>
            <div className="monkey-pad right-pad" id="monkey-pad-right">
              <img src="/copa-logo.png" className="vol-logo monkey-right" id="monkeyRight" alt="Vol.III" />
            </div>
          </div>
          <div className="center-accent-bar"></div>
        </div>

        {/* EQUIPO DERECHA */}
        <div className="team-glow-container team-right" id="glow-container-right">
          <div className="team-wrapper" id="wrapper-right">
            <div className="leaf-deco leaf-1"></div>
            <div className="leaf-deco leaf-2"></div>
            <div className="score-box" id="score-right">
              {s2}
            </div>
            <div className="team-info">
              <div className="logo-box">
                <img
                  id="img-right"
                  src={match.team2?.logo || '/gorilas.jpg'}
                  alt="Logo B"
                  onError={(e) => { e.target.src = '/gorilas.jpg'; }}
                />
              </div>
              <span id="name-right" className="team-name">
                {match.team2?.name || 'SELECCIONAR'}
              </span>
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

      {/* PAUSA TÉCNICA ORIGINAL DE MARCADOR-MAIN */}
      {isPause && (
        <div className="timer-overlay tech-pause" id="timer-overlay">
          <div className="timer-card">
            <div className="timer-emoticon" id="timer-emoticon">🍌🐒</div>
            <div className="timer-title" id="timer-title" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '2.5rem', color: '#ffb300', fontWeight: 900, letterSpacing: '4px' }}>
              PAUSA TÉCNICA
            </div>
            <div className="timer-countdown" id="timer-countdown" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1.2rem', color: '#fff', marginTop: '10px', letterSpacing: '2px' }}>
              VOLVEMOS EN BREVE
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
