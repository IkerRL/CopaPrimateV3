import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../api';
import './overlayGruposSorteo.css';

// Web Audio sound synthesizer for Champions League Sorteo
function playScannerSweepSound(ctx) {
  if (!ctx || ctx.state !== 'running') return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  } catch {}
}

function playLockInChimeSound(ctx, stepIndex) {
  if (!ctx || ctx.state !== 'running') return;
  try {
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const baseFreq = freqs[Math.min(freqs.length - 1, Math.max(0, (stepIndex || 1) - 1))] || 523.25;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.66);

    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.3);
    subGain.gain.setValueAtTime(0.2, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.31);
  } catch {}
}

export function getTeamTag(name) {
  if (!name) return 'TBD';
  const clean = name.trim().toUpperCase();
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

  if (/^[A-Za-z0-9]{2,4}$/.test(name.trim())) {
    return name.trim().toUpperCase();
  }

  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }
  if (words.length === 2 && words[0].length >= 1 && words[1].length >= 2) {
    return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
  }
  const alphanum = name.replace(/[^a-zA-Z0-9]/g, '');
  return alphanum.slice(0, 3).toUpperCase() || 'TBD';
}

const DEFAULT_GRUPOS = {
  A: [
    { id: 'A1', name: "Thunder Buddies", jugadores: ["Brrokeen", "Pipe"], logo: "/logo3.png", grupo: 'A' },
    { id: 'A2', name: "Los Akrtona2", jugadores: ["Kira", "Serax"], logo: "/logo2.png", grupo: 'A' },
    { id: 'A3', name: "Chuu-Chuu 100% MAX", jugadores: ["MakaQuillo", "Max"], logo: "/logo8.png", grupo: 'A' },
    { id: 'A4', name: "REHENKARMACIÓN", jugadores: ["Satha", "Makflat"], logo: "/logo1.png", grupo: 'A' }
  ],
  B: [
    { id: 'B1', name: "Entry Baiters", jugadores: ["レックウザ", "Militantedelsoe"], logo: "/logo5.png", grupo: 'B' },
    { id: 'B2', name: "Dream Team", jugadores: ["JoKker", "Pepardo"], logo: "/logo7.png", grupo: 'B' },
    { id: 'B3', name: "Makaco Ninja-Pelocho", jugadores: ["MakacoNinja", "Iker 😎"], logo: "/logo6.png", grupo: 'B' },
    { id: 'B4', name: "Kizuna", jugadores: ["Alezita", "Sarix"], logo: "/logo4.png", grupo: 'B' }
  ],
  C: [
    { id: 'C1', name: "Sakura", jugadores: ["Gustavo", "Carlos"], logo: "/logo14.png", grupo: 'C' },
    { id: 'C2', name: "Soul Resonance", jugadores: ["KrypT", "Charly"], logo: "/logo11.png", grupo: 'C' },
    { id: 'C3', name: "Stranger Picks", jugadores: ["TheDori", "Sotomi"], logo: "/logo9.png", grupo: 'C' },
    { id: 'C4', name: "MARIIKS", jugadores: ["Acid", "Bru"], logo: "/logo10.png", grupo: 'C' }
  ],
  D: [
    { id: 'D1', name: "Primates FC", jugadores: ["Knekro", "IlloJuan"], logo: "/logo12.png", grupo: 'D' },
    { id: 'D2', name: "Chimp Squad", jugadores: ["Boaster", "Derke"], logo: "/logo13.png", grupo: 'D' },
    { id: 'D3', name: "Banana Kings", jugadores: ["Maka", "Mixwell"], logo: "/logo15.png", grupo: 'D' },
    { id: 'D4', name: "Golden Gorillas", jugadores: ["TenZ", "ScreaM"], logo: "/logo10.png", grupo: 'D' }
  ]
};

export default function OverlayGruposSorteo() {
  const [grupos, setGrupos] = useState(DEFAULT_GRUPOS);
  const [revealedTeams, setRevealedTeams] = useState([]);
  const [activePhase, setActivePhase] = useState('presentacion'); // 'presentacion' | 'sorteo' | 'liga'
  const [drawingTeam, setDrawingTeam] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [jornadas, setJornadas] = useState([]);
  const [spotlightTeam, setSpotlightTeam] = useState(null);
  const [championsAnimation, setChampionsAnimation] = useState(null);
  const [animClock, setAnimClock] = useState(Date.now());

  const audioCtxRef = useRef(null);
  const championsAudioRef = useRef(null);
  const lastPlayedStepRef = useRef(0);
  const lastAnimIdRef = useRef(null);

  // AudioContext unlock on first user gesture (OBS browser source automatically permits audio)
  useEffect(() => {
    const unlock = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
      } catch {}
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // AudioContext & audio unmount cleanup
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      if (championsAudioRef.current) {
        championsAudioRef.current.pause();
        championsAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Polling HTTP interval for real-time overlay synchronization
  useEffect(() => {
    document.body.style.background = 'transparent';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.background = 'transparent';

    let mounted = true;

    const fetchState = async () => {
      try {
        const [resMatches, resOverlay] = await Promise.all([
          fetch(`${API_BASE}/matches`),
          fetch(`${API_BASE}/overlay-state`),
        ]);

        if (resMatches.ok) {
          const mData = await resMatches.json();
          if (mounted && mData) {
            if (mData.groups && Object.keys(mData.groups).length === 4) {
              setGrupos(mData.groups);
            }
            if (Array.isArray(mData.jornadas)) {
              setJornadas(mData.jornadas);
            }
          }
        }

        if (resOverlay.ok) {
          const oData = await resOverlay.json();
          if (mounted && oData && oData.sorteo) {
            const s = oData.sorteo;
            if (s.activePhase) setActivePhase(s.activePhase);
            if (Array.isArray(s.revealedTeams)) setRevealedTeams(s.revealedTeams);
            if (s.grupos) setGrupos(s.grupos);
            if (s.drawingTeam !== undefined) setDrawingTeam(s.drawingTeam);
            if (s.isSpinning !== undefined) setIsSpinning(s.isSpinning);
            if (s.spotlightTeam !== undefined || s.zoomedTeam !== undefined) {
              const active = s.spotlightTeam ?? s.zoomedTeam ?? null;
              setSpotlightTeam(active);
            }
            if (s.championsAnimation !== undefined) {
              setChampionsAnimation(s.championsAnimation);
            }
          }
        }
      } catch {}
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, []);

  // Local animation clock loop during Champions League animation
  useEffect(() => {
    if (!championsAnimation) {
      lastPlayedStepRef.current = 0;
      if (championsAudioRef.current) {
        try {
          championsAudioRef.current.pause();
          championsAudioRef.current.currentTime = 0;
        } catch {}
      }
      return;
    }

    if (championsAnimation.animId && championsAnimation.animId !== lastAnimIdRef.current) {
      lastAnimIdRef.current = championsAnimation.animId;
      lastPlayedStepRef.current = 0;
      if (championsAudioRef.current) {
        try {
          championsAudioRef.current.pause();
          championsAudioRef.current.currentTime = 0;
        } catch {}
      }
    }

    const timer = setInterval(() => {
      setAnimClock(Date.now());
    }, 60);

    return () => clearInterval(timer);
  }, [championsAnimation]);

  // Audio cues emission when steps advance
  useEffect(() => {
    if (!championsAnimation) return;
    if (!audioCtxRef.current) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      } catch {}
    }

    const startedAt = championsAnimation.startedAt || Date.now();
    const stepDuration = championsAnimation.stepDuration || 1600;
    const elapsed = Date.now() - startedAt;
    const computedStep = Math.min(4, Math.max(1, Math.floor(elapsed / stepDuration) + 1));
    const currentStep = championsAnimation.revealedCount || championsAnimation.step || (championsAnimation.status === 'completed' ? 4 : computedStep);
    const isCompleted = championsAnimation.status === 'completed' || (elapsed >= stepDuration * 4 && !championsAnimation.revealedCount);

    if (currentStep > lastPlayedStepRef.current) {
      if (lastPlayedStepRef.current === 0 && currentStep >= 4) {
        playLockInChimeSound(audioCtxRef.current, 4);
      } else {
        for (let s = lastPlayedStepRef.current + 1; s <= currentStep; s++) {
          playLockInChimeSound(audioCtxRef.current, s);
        }
      }
      lastPlayedStepRef.current = currentStep;

      if (currentStep >= 4 || isCompleted) {
        try {
          if (!championsAudioRef.current) {
            championsAudioRef.current = new Audio('/champions.mp3');
          }
          championsAudioRef.current.currentTime = 0;
          championsAudioRef.current.volume = 0.5;
          championsAudioRef.current.play().catch(() => {});
        } catch {}
      }
    }
  }, [animClock, championsAnimation]);

  const isTeamRevealed = (tName) => {
    return Boolean(revealedTeams && Array.isArray(revealedTeams) && revealedTeams.includes(tName));
  };

  const groupKeys = ['A', 'B', 'C', 'D'];

  return (
    <div className="overlay-sorteo-root">
      <div className="overlay-sorteo-container">
        {/* ENCABEZADO OFICIAL */}
        <div className="sorteo-header">
          <img
            src="/monito-izq.png"
            className="sorteo-monkey-img sorteo-monkey-left"
            alt="Mono Izquierdo"
          />

          <div className="sorteo-header-center">
            <div className="sorteo-title-top">
              <img src="/copa-logo.png" alt="Copa" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              <span>COPA PRIMATE // VOL. III</span>
            </div>
            <h1 className="sorteo-title-main">
              {activePhase === 'sorteo'
                ? 'SORTEO OFICIAL DE LIGA'
                : activePhase === 'liga'
                ? 'CALENDARIO & JORNADAS'
                : 'DISTRIBUCIÓN DE GRUPOS'}
            </h1>
            <div className="sorteo-phase-pill">
              {activePhase === 'sorteo'
                ? 'BOMBOS & ASIGNACIÓN EN DIRECTO'
                : activePhase === 'liga'
                ? 'FASE DE LIGA · 4 JORNADAS'
                : '16 EQUIPOS · 4 GRUPOS OFICIALES'}
            </div>
          </div>

          <img
            src="/monito-der.png"
            className="sorteo-monkey-img sorteo-monkey-right"
            alt="Mono Derecho"
          />
        </div>

        {/* CÁMARA DE SORTEO EN VIVO (SI SE ESTÁ SORTEANDO) */}
        {(activePhase === 'sorteo' || isSpinning || drawingTeam) && (
          <div className="sorteo-live-chamber">
            <div className="sorteo-orb-spinning">
              {drawingTeam ? '🐒' : '🎰'}
            </div>
            {drawingTeam ? (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#c084fc', letterSpacing: '2px', fontWeight: 900 }}>
                  EQUIPO EXTRAÍDO:
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>
                  {drawingTeam.name}
                </div>
                {drawingTeam.targetGroup && (
                  <div className="sorteo-destination-badge" style={{ marginTop: '6px' }}>
                    ➔ ASIGNADO AL GRUPO {drawingTeam.targetGroup}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#00f5d4', fontWeight: 900, letterSpacing: '2px' }}>
                {isSpinning ? 'MEZCLANDO BOMBOS DEL SORTEO...' : 'ESPERANDO EXTRACCIÓN DE BOLA...'}
              </div>
            )}
          </div>
        )}

        {/* FASE DE LIGA: JORNADAS */}
        {activePhase === 'liga' && jornadas && jornadas.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            width: '100%',
            flex: 1,
            overflowY: 'auto',
            zIndex: 2,
          }}>
            {jornadas.map((jList, jIdx) => (
              <div
                key={jIdx}
                style={{
                  background: 'rgba(12, 16, 26, 0.75)',
                  border: '1.5px solid rgba(192, 132, 252, 0.4)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{
                  color: '#00f5d4',
                  fontWeight: 900,
                  fontSize: '14px',
                  letterSpacing: '1.5px',
                  textAlign: 'center',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}>
                  JORNADA {jIdx + 1}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                  {jList.map((m, mIdx) => {
                    const t1Tag = getTeamTag(m.t1?.name);
                    const t2Tag = getTeamTag(m.t2?.name);
                    const hasScores = m.score1 !== '' && m.score2 !== '';
                    return (
                      <div
                        key={mIdx}
                        style={{
                          background: 'rgba(0,0,0,0.45)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '40%', overflow: 'hidden' }}>
                          <img src={m.t1?.logo || '/logo1.png'} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/logo1.png'; }} />
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t1Tag}
                          </span>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '40px' }}>
                          {hasScores ? (
                            <span style={{ fontSize: '13px', fontWeight: 900, color: '#00f5d4', fontVariantNumeric: 'tabular-nums' }}>
                              {m.score1} - {m.score2}
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 900 }}>VS</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '40%', overflow: 'hidden', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t2Tag}
                          </span>
                          <img src={m.t2?.logo || '/logo2.png'} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/logo2.png'; }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* GRID DE LOS 4 GRUPOS (A, B, C, D) */
          <div className="grupos-grid">
            {groupKeys.map((gKey) => {
              const teamList = grupos[gKey] || [];
              return (
                <div key={gKey} className={`grupo-col col-${gKey}`}>
                  <div className="grupo-header">
                    <span className="grupo-title">GRUPO {gKey}</span>
                    <span className="grupo-tag">{teamList.length} ESCUADRAS</span>
                  </div>

                  <div className="grupo-teams-list">
                    {teamList.map((t, idx) => {
                      const revealed = isTeamRevealed(t.name);
                      const tTag = getTeamTag(t.name);
                      const playersStr = Array.isArray(t.jugadores) ? t.jugadores.join(' · ') : '';

                      return (
                        <div
                          key={t.id || idx}
                          className={`team-slot-card ${revealed ? 'revealed' : 'hidden-slot'}`}
                        >
                          <span className="team-rank-num">#{idx + 1}</span>

                          {revealed ? (
                            <>
                              <img
                                src={t.logo || '/copa-logo.png'}
                                className="team-slot-logo"
                                alt={t.name}
                                onError={(e) => { e.target.src = '/copa-logo.png'; }}
                              />
                              <div className="team-slot-info">
                                <span className="team-slot-tag" title={t.name}>
                                  {tTag} · {t.name}
                                </span>
                                {playersStr && (
                                  <span className="team-slot-players" title={playersStr}>
                                    {playersStr}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="mystery-card-back mystery-box">
                              <div className="mystery-card-back-inner">
                                <img
                                  src="/copa-logo.png"
                                  className="mystery-card-back-logo"
                                  alt="Copa Logo"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div className="mystery-card-back-text-col">
                                  <span className="mystery-card-back-label">BOMBO {idx + 1}</span>
                                  <span className="mystery-card-back-status">OCULTO</span>
                                </div>
                              </div>
                              <div className="mystery-shimmer" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SPOTLIGHT STREAM ZOOM VIEW */}
        {spotlightTeam && (
          <div className="sorteo-spotlight-backdrop">
            <div className={`sorteo-spotlight-card grupo-${spotlightTeam.grupo || 'A'}`}>
              <div className="spotlight-header-badge">
                <span className="spotlight-live-dot" /> STREAM SPOTLIGHT // EN DIRECTO
              </div>

              <div className="spotlight-logo-wrap">
                <div className="spotlight-logo-halo" />
                <img
                  src={spotlightTeam.logo || '/copa-logo.png'}
                  className="spotlight-logo-img"
                  alt={spotlightTeam.name}
                  onError={(e) => { e.target.src = '/copa-logo.png'; }}
                />
              </div>

              <div className="spotlight-tag-pill">
                {getTeamTag(spotlightTeam.name)}
              </div>

              <h2 className="spotlight-team-name">
                {spotlightTeam.name}
              </h2>

              <div className="spotlight-pills-row">
                <div className="spotlight-pill bombo-pill">
                  BOMBO {spotlightTeam.bombo || 1}
                </div>
                {spotlightTeam.grupo && (
                  <div className={`spotlight-pill grupo-pill grupo-${spotlightTeam.grupo}`}>
                    GRUPO {spotlightTeam.grupo}
                  </div>
                )}
              </div>

              {Array.isArray(spotlightTeam.jugadores) && spotlightTeam.jugadores.length > 0 && (
                <div className="spotlight-roster-section">
                  <div className="spotlight-roster-title">ROSTER OFICIAL</div>
                  <div className="spotlight-roster-grid">
                    {spotlightTeam.jugadores.map((jug, jIdx) => (
                      <div key={jIdx} className="spotlight-player-card">
                        <span className="spotlight-player-icon">🎮</span>
                        <span className="spotlight-player-name">{jug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAMPIONS LEAGUE DRAW HUD OVERLAY (R2) */}
        {championsAnimation && (
          <div className="champions-draw-modal">
            {(() => {
              const startedAt = championsAnimation.startedAt || Date.now();
              const stepDuration = championsAnimation.stepDuration || 1600;
              const elapsed = Date.now() - startedAt;
              const autoStep = Math.min(4, Math.max(1, Math.floor(elapsed / stepDuration) + 1));
              const currentStep = championsAnimation.revealedCount || championsAnimation.step || (championsAnimation.status === 'completed' ? 4 : autoStep);
              const isCompleted = championsAnimation.status === 'completed' || (elapsed >= stepDuration * 4 && !championsAnimation.revealedCount);

              const teamObj = typeof championsAnimation.team === 'string'
                ? { name: championsAnimation.team, logo: '/copa-logo.png', grupo: 'A', bombo: 1 }
                : (championsAnimation.team || drawingTeam || { name: 'Equipo', logo: '/copa-logo.png', grupo: 'A', bombo: 1 });

              const teamName = teamObj.name || 'Equipo';
              const teamLogo = teamObj.logo || '/copa-logo.png';
              const teamGroup = teamObj.grupo || 'A';
              const teamBombo = teamObj.bombo || 1;

              const matchupsList = Array.isArray(championsAnimation.matchups)
                ? championsAnimation.matchups
                : (Array.isArray(championsAnimation.revealedMatchups) ? championsAnimation.revealedMatchups : []);

              return (
                <div className="champions-hud-container">
                  {/* HUD Header */}
                  <div className="champions-hud-header">
                    <div className="champions-hud-title-wrap">
                      <span className="champions-stars-icon">⭐</span>
                      <div>
                        <div className="champions-hud-subtitle">CHAMPIONS LEAGUE // SORTEO DE ENFRENTAMIENTOS</div>
                        <h2 className="champions-hud-title">COPA PRIMATE DRAW SYSTEM</h2>
                      </div>
                    </div>
                    <div className={`champions-status-badge ${isCompleted ? 'completed' : 'running'}`}>
                      <span className="spotlight-live-dot" />
                      {isCompleted ? 'SORTEO FINALIZADO' : 'ESCANEANDO RIVALES EN DIRECTO'}
                    </div>
                  </div>

                  {/* Selected Team Showcase */}
                  <div className="champions-selected-team-banner">
                    <div className="shield-halo" />
                    <div className="champions-team-main-col">
                      <div className="champions-team-logo-wrap">
                        <img
                          src={teamLogo}
                          alt={teamName}
                          className="champions-team-logo"
                          onError={(e) => { e.target.src = '/copa-logo.png'; }}
                        />
                      </div>
                      <div className="champions-team-info-col">
                        <span className="champions-team-tag">{getTeamTag(teamName)}</span>
                        <h3 className="champions-team-name">{teamName}</h3>
                      </div>
                    </div>
                    <div className="champions-team-badges-col">
                      <span className="champions-pot-pill">BOMBO {teamBombo}</span>
                      <span className="champions-group-pill">GRUPO {teamGroup}</span>
                    </div>
                  </div>

                  {/* 4 Matchups Grid */}
                  <div className="champions-matchups-grid">
                    {[1, 2, 3, 4].map((jNum) => {
                      const matchItem = matchupsList.find(m => Number(m.jornada) === jNum) || matchupsList[jNum - 1];
                      const opp = matchItem?.opponent || (matchItem?.rival ? {
                        name: matchItem.rival,
                        logo: matchItem.logo || '/copa-logo.png',
                        grupo: matchItem.grupo || 'A',
                        bombo: matchItem.bombo || 1,
                      } : null);

                      const isRevealed = jNum <= currentStep && opp;
                      const isScanning = jNum === currentStep + 1 && !isCompleted;
                      const isPending = !isRevealed && !isScanning;

                      return (
                        <div
                          key={jNum}
                          className={`matchup-card-slot ${isRevealed ? 'revealed' : ''} ${isScanning ? 'scanning' : ''} ${isPending ? 'pending' : ''}`}
                        >
                          <div className="matchup-jornada-header">
                            <span className="matchup-jornada-title">JORNADA {jNum}</span>
                            <span className="matchup-status-icon">
                              {isRevealed ? '✅' : isScanning ? '⚡' : '🔒'}
                            </span>
                          </div>

                          {isRevealed ? (
                            <div className="matchup-revealed-body">
                              {jNum === currentStep && <div className="lock-flash" />}
                              <img
                                src={opp.logo || '/copa-logo.png'}
                                alt={opp.name}
                                className="matchup-opponent-logo"
                                onError={(e) => { e.target.src = '/copa-logo.png'; }}
                              />
                              <span className="matchup-opponent-tag">{getTeamTag(opp.name)}</span>
                              <div className="matchup-opponent-name" title={opp.name}>
                                {opp.name}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <span className="lock-pill locked">BOMBO {opp.bombo || 1}</span>
                                {opp.grupo && <span className="lock-pill locked">G-{opp.grupo}</span>}
                              </div>
                            </div>
                          ) : isScanning ? (
                            <div className="matrix-scanner">
                              <div className="scan-laser" />
                              <div className="matrix-scanner-orb">🎰</div>
                              <span className="matrix-glitch-text">BUSCANDO RIVAL...</span>
                              <span style={{ fontSize: '10px', color: '#00f5d4', fontWeight: 800, letterSpacing: '1px' }}>
                                B{jNum} MATRIX LOCK
                              </span>
                            </div>
                          ) : (
                            <div className="matchup-pending-body">
                              <span className="matchup-pending-icon">🔒</span>
                              <span className="matchup-pending-label">PENDIENTE</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* HUD Footer */}
                  <div className="champions-hud-footer">
                    <span className="champions-hud-engine-note">
                      QUANTUM DRAW ENGINE // 100% COLLISION FREE · 32 PARTIDOS
                    </span>
                    <div className="champions-hud-progress-wrap">
                      <div className="champions-hud-progress-bar">
                        <div
                          className="champions-hud-progress-fill"
                          style={{ width: `${Math.min(100, (currentStep / 4) * 100)}%` }}
                        />
                      </div>
                      <span className="champions-hud-progress-text">{currentStep} / 4 RIVALES</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="sorteo-bottom-bar" />
      </div>
    </div>
  );
}
