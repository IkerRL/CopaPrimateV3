import { useState, useEffect } from 'react';
import { API_URL } from '../../api';
import './overlayGruposSorteo.css';

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

  useEffect(() => {
    document.body.style.background = 'transparent';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.background = 'transparent';

    let mounted = true;

    const fetchState = async () => {
      try {
        const [resMatches, resOverlay] = await Promise.all([
          fetch(`${API_URL}/public/matches`),
          fetch(`${API_URL}/public/overlay-state`),
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
          }
        }
      } catch {}
    };

    fetchState();
    const interval = setInterval(fetchState, 1200);
    return () => {
      mounted = false;
      clearInterval(interval);
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, []);

  const isTeamRevealed = (tName) => {
    if (!revealedTeams || revealedTeams.length === 0) return true;
    return revealedTeams.includes(tName);
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
                            <div className="mystery-box">
                              <span className="mystery-icon">❓</span>
                              <span className="mystery-text">POR SORTEAR</span>
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

        <div className="sorteo-bottom-bar" />
      </div>
    </div>
  );
}
