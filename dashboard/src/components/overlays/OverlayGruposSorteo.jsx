import { useState, useEffect } from 'react';
import { API_URL } from '../../api';
import './overlayGruposSorteo.css';
import { getPlayerRank, getRankIconUrl, parseValorantTier, RANK_ICONS, PLAYER_RANKS } from '../../utils/valorantRanks';

export { getPlayerRank, getRankIconUrl, parseValorantTier, RANK_ICONS, PLAYER_RANKS };

export function getTeamTag(name) {
  if (!name) return 'TBD';
  const raw = String(name).trim();
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

const DEFAULT_GRUPOS = {
  A: [
    { id: 'A1', name: "Los Monos", jugadores: ["TenZ#NA1", "Kyedae#0001", "ScreaM#1 tap"], logo: "/logo1.png", grupo: 'A' },
    { id: 'A2', name: "LOUD GG", jugadores: ["aspas", "Less", "cauanzin"], logo: "/logo2.png", grupo: 'A' },
    { id: 'A3', name: "Sentinels", jugadores: ["TenZ", "Zellsis", "johnqt"], logo: "/logo3.png", grupo: 'A' },
    { id: 'A4', name: "REHENKARMACIÓN", jugadores: ["Satha", "Makflat"], logo: "/logo1.png", grupo: 'A' }
  ],
  B: [
    { id: 'B1', name: "Gorilas", jugadores: ["Mixwell#G2", "Keloqz#FR", "Avova#123"], logo: "/gorilas.jpg", grupo: 'B' },
    { id: 'B2', name: "Fnatic Monkeys", jugadores: ["Boaster", "Derke", "Chronicle"], logo: "/logo6.png", grupo: 'B' },
    { id: 'B3', name: "Paper Rex", jugadores: ["f0rsakeN", "Jinggg", "mindfreak"], logo: "/logo7.png", grupo: 'B' },
    { id: 'B4', name: "Kizuna", jugadores: ["Alezita", "Sarix"], logo: "/logo4.png", grupo: 'B' }
  ],
  C: [
    { id: 'C1', name: "Sakura", jugadores: ["Gustavo", "Carlos"], logo: "/logo14.png", grupo: 'C' },
    { id: 'C2', name: "Soul Resonance", jugadores: ["KrypT", "Charly"], logo: "/logo11.png", grupo: 'C' },
    { id: 'C3', name: "Stranger Picks", jugadores: ["TheDori", "Sotomi"], logo: "/logo9.png", grupo: 'C' },
    { id: 'C4', name: "MARIIKS", jugadores: ["Acid", "Bru"], logo: "/logo10.png", grupo: 'C' }
  ],
  D: [
    { id: 'D1', name: "Primates FC", jugadores: ["Knekro#123", "IlloJuan#Malaga"], logo: "/logo12.png", grupo: 'D' },
    { id: 'D2', name: "Chimp Squad", jugadores: ["Boaster#FNC", "Derke#FNC"], logo: "/logo13.png", grupo: 'D' },
    { id: 'D3', name: "Banana Kings", jugadores: ["Maka", "Mixwell"], logo: "/logo15.png", grupo: 'D' },
    { id: 'D4', name: "Golden Gorillas", jugadores: ["TenZ", "ScreaM"], logo: "/logo10.png", grupo: 'D' }
  ]
};

function computeStandings(gruposData, jornadasData) {
  const statsMap = {};
  Object.values(gruposData || {}).flat().forEach((t) => {
    if (t?.name) {
      statsMap[t.name] = {
        name: t.name,
        logo: t.logo || '/logo1.png',
        grupo: t.grupo || 'A',
        pj: 0,
        wins: 0,
        losses: 0,
        rw: 0,
        rl: 0,
        diff: 0,
        pts: 0,
      };
    }
  });

  (jornadasData || []).flat().forEach((m) => {
    const s1 = parseInt(m?.score1, 10);
    const s2 = parseInt(m?.score2, 10);
    if (!isNaN(s1) && !isNaN(s2) && (s1 > 0 || s2 > 0)) {
      const eq1 = statsMap[m?.t1?.name];
      const eq2 = statsMap[m?.t2?.name];
      if (eq1 && eq2) {
        eq1.pj += 1;
        eq2.pj += 1;
        eq1.rw += s1;
        eq1.rl += s2;
        eq2.rw += s2;
        eq2.rl += s1;
        eq1.diff = eq1.rw - eq1.rl;
        eq2.diff = eq2.rw - eq2.rl;
        if (s1 > s2) {
          eq1.wins += 1;
          eq1.pts += 3;
          eq2.losses += 1;
        } else if (s2 > s1) {
          eq2.wins += 1;
          eq2.pts += 3;
          eq1.losses += 1;
        } else {
          eq1.pts += 1;
          eq2.pts += 1;
        }
      }
    }
  });

  return Object.values(statsMap).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.rw - a.rw;
  });
}

export default function OverlayGruposSorteo() {
  const [grupos, setGrupos] = useState(DEFAULT_GRUPOS);
  const [revealedTeams, setRevealedTeams] = useState([]);
  const [activePhase, setActivePhase] = useState('presentacion'); // 'presentacion' | 'sorteo' | 'clasificacion' | 'jornadas' | 'liga'
  const [drawingTeam, setDrawingTeam] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [jornadas, setJornadas] = useState([]);
  const [spotlightTeam, setSpotlightTeam] = useState(null);
  const [championsAnimation, setChampionsAnimation] = useState(null);
  const [animClock, setAnimClock] = useState(Date.now());
  const [serverStandings, setServerStandings] = useState([]);

  // Polling HTTP interval for real-time overlay synchronization
  useEffect(() => {
    document.body.style.background = 'transparent';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.background = 'transparent';

    let mounted = true;

    const fetchState = async () => {
      try {
        const [resMatches, resOverlay] = await Promise.all([
          fetch(`${API_URL}/matches`),
          fetch(`${API_URL}/overlay-state`),
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
            if (Array.isArray(s.standings)) {
              setServerStandings(s.standings);
            }
            if (Array.isArray(s.jornadas)) {
              setJornadas(s.jornadas);
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

  // Local animation clock loop during Copa Primate draw animation
  useEffect(() => {
    if (!championsAnimation) return;
    const timer = setInterval(() => {
      setAnimClock(Date.now());
    }, 60);
    return () => clearInterval(timer);
  }, [championsAnimation]);

  const isTeamRevealed = (tName) => {
    return Boolean(revealedTeams && Array.isArray(revealedTeams) && revealedTeams.includes(tName));
  };

  const groupKeys = ['A', 'B', 'C', 'D'];
  const standingsData = serverStandings && serverStandings.length > 0
    ? serverStandings
    : computeStandings(grupos, jornadas);

  const renderGruposGrid = () => (
    <div className="grupos-grid">
      {groupKeys.map((gKey) => {
        const teamList = grupos[gKey] || [];
        const tierName = gKey === 'A' ? 'TIER 1' : gKey === 'B' ? 'TIER 2' : gKey === 'C' ? 'TIER 3' : 'TIER 4';

        return (
          <div key={gKey} className={`grupo-col col-${gKey}`}>
            <div className="grupo-header">
              <span className="grupo-title">GRUPO {gKey}</span>
              <span className="grupo-tag">{tierName} · 4 ESCUADRAS</span>
            </div>

            <div className="grupo-teams-list">
              {teamList.map((t, idx) => {
                const revealed = isTeamRevealed(t.name);
                const tTag = getTeamTag(t.name);

                return (
                  <div
                    key={t.id || idx}
                    className={`team-slot-card ${revealed ? 'revealed' : 'hidden-slot'}`}
                  >
                    <span className="team-rank-num">#{idx + 1}</span>

                    {revealed ? (
                      <>
                        <img
                          src={t.logo || '/logo1.png'}
                          className="team-slot-logo"
                          alt={t.name}
                          onError={(e) => { e.target.src = '/logo1.png'; }}
                        />
                        <div className="team-slot-info">
                          <span className="team-slot-tag" title={t.name}>
                            {tTag} · {t.name}
                          </span>
                          {Array.isArray(t.jugadores) && t.jugadores.length > 0 && (
                            <div className="team-slot-players">
                              {t.jugadores.map((j, jIdx) => {
                                const pName = typeof j === 'string' ? j : (j?.name || `J${jIdx + 1}`);
                                const pRank = getPlayerRank(j, gKey);
                                const iconUrl = getRankIconUrl(pRank, gKey);
                                return (
                                  <span key={jIdx} className="team-slot-player-item" title={`${pName} (${pRank})`}>
                                    <img
                                      src={iconUrl}
                                      alt={pRank}
                                      className="team-slot-player-rank-icon"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <span className="team-slot-player-name">{pName}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="mystery-card-back mystery-box">
                        <div className="mystery-card-back-inner">
                          <span style={{ fontSize: '20px' }}>🐒</span>
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
  );

  return (
    <div className="overlay-sorteo-root">
      <div className="overlay-sorteo-container">
        {/* ENCABEZADO OFICIAL CON LOGO DE COPA PRIMATE */}
        <div className="sorteo-header">
          <img
            src="/monito-izq.png"
            className="sorteo-monkey-img sorteo-monkey-left"
            alt="Mono Izquierdo"
          />

          <div className="sorteo-header-center">
            <div className="sorteo-title-top">
              <img
                src="/copa-logo.png"
                className="sorteo-copa-logo"
                alt="Copa Primate"
                onError={(e) => { e.currentTarget.src = '/logo1.png'; }}
              />
              <span>COPA PRIMATE // VOL. III</span>
            </div>
            <h1 className="sorteo-title-main">
              {activePhase === 'sorteo'
                ? 'SORTEO OFICIAL DE LIGA'
                : activePhase === 'clasificacion'
                ? 'TABLA GENERAL DE CLASIFICACIÓN'
                : activePhase === 'jornadas' || activePhase === 'liga'
                ? 'CALENDARIO OFICIAL · 4 JORNADAS'
                : 'DISTRIBUCIÓN DE GRUPOS POR NIVEL'}
            </h1>
            <div className="sorteo-phase-pill">
              {activePhase === 'sorteo'
                ? 'BOMBOS & ASIGNACIÓN EN DIRECTO · SORTEO DE LIGA'
                : activePhase === 'clasificacion'
                ? 'FASE DE LIGA REGULAR · TOP 8 CLASIFICA A PLAYOFFS'
                : activePhase === 'jornadas' || activePhase === 'liga'
                ? '32 ENFRENTAMIENTOS · 4 JORNADAS DE LIGA'
                : '16 EQUIPOS · GRUPOS A, B, C, D (TIERS DE NIVEL)'}
            </div>
          </div>

          <img
            src="/monito-der.png"
            className="sorteo-monkey-img sorteo-monkey-right"
            alt="Mono Derecho"
          />
        </div>

        {/* FASE 1: PRESENTACIÓN DE GRUPOS */}
        {activePhase === 'presentacion' && (
          <div key={activePhase} className="phase-content-wrapper">
            {renderGruposGrid()}
          </div>
        )}

        {/* FASE 2: CÁMARA Y GRUPOS DEL SORTEO EN VIVO */}
        {activePhase === 'sorteo' && (
          <div key={activePhase} className="phase-content-wrapper">
            {(isSpinning || drawingTeam) && (
              <div className="sorteo-live-chamber">
                <div className="sorteo-orb-spinning">
                  {drawingTeam ? '🐒' : '🎰'}
                </div>
                {drawingTeam ? (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#c084fc', letterSpacing: '2px', fontWeight: 900 }}>
                      EQUIPO SELECCIONADO:
                    </span>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>
                      {drawingTeam.name}
                    </div>
                    {drawingTeam.targetGroup && (
                      <div className="sorteo-destination-badge" style={{ marginTop: '6px' }}>
                        GRUPO {drawingTeam.targetGroup}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#00f5d4', fontWeight: 900, letterSpacing: '2px' }}>
                    {isSpinning ? 'BUSCANDO RIVALES EN EL QUANTUM ENGINE...' : 'ESPERANDO SELECCIÓN DE EQUIPO...'}
                  </div>
                )}
              </div>
            )}
            {renderGruposGrid()}
          </div>
        )}

        {/* FASE 3: CLASIFICACIÓN GENERAL (TABLA 1-16 STREAM) */}
        {activePhase === 'clasificacion' && (
          <div key={activePhase} className="phase-content-wrapper">
            <div className="sorteo-standings-container">
              <div className="sorteo-standings-header-row">
                <div className="sorteo-standings-title">
                  <span>🏆 TABLA GENERAL DE POSICIONES</span>
                </div>
                <div className="sorteo-standings-legend">
                  <span className="legend-playoff">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5d4', display: 'inline-block' }} />
                    TOP 1-8 CLASIFICAN A PLAYOFFS
                  </span>
                </div>
              </div>

              <table className="sorteo-standings-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px' }}>POS</th>
                    <th className="th-team">EQUIPO</th>
                    <th style={{ width: '50px' }}>GRUPO</th>
                    <th style={{ width: '45px' }}>PJ</th>
                    <th style={{ width: '45px' }}>V</th>
                    <th style={{ width: '45px' }}>D</th>
                    <th style={{ width: '55px' }}>DIF</th>
                    <th style={{ width: '55px' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standingsData.map((team, idx) => {
                    const pos = idx + 1;
                    const isTop8 = pos <= 8;
                    const teamTag = getTeamTag(team.name);

                    return (
                      <tr key={team.name || idx} className={isTop8 ? 'top-qualifier' : ''}>
                        <td>
                          <span className={`standings-pos-badge ${pos === 1 ? 'gold' : isTop8 ? 'top8' : 'normal'}`}>
                            {pos}
                          </span>
                        </td>
                        <td>
                          <div className="standings-team-cell">
                            <img
                              src={team.logo || '/logo1.png'}
                              alt=""
                              className="standings-team-logo"
                              onError={(e) => { e.target.src = '/logo1.png'; }}
                            />
                            <span className="standings-team-tag">{teamTag}</span>
                            <span className="standings-team-name">{team.name}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 900,
                            color: team.grupo === 'A' ? '#ff4655' : team.grupo === 'B' ? '#00f5d4' : team.grupo === 'C' ? '#c084fc' : '#38bdf8',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}>
                            G-{team.grupo || 'A'}
                          </span>
                        </td>
                        <td>{team.pj || 0}</td>
                        <td style={{ color: '#00f5d4' }}>{team.wins || 0}</td>
                        <td style={{ color: '#ff4655' }}>{team.losses || 0}</td>
                        <td style={{ color: team.diff > 0 ? '#00f5d4' : team.diff < 0 ? '#ff4655' : '#aaa' }}>
                          {team.diff > 0 ? `+${team.diff}` : team.diff || 0}
                        </td>
                        <td className="standings-pts-cell">{team.pts || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FASE 4: JORNADAS / CALENDARIO (4 COLUMNAS DE PARTIDOS) */}
        {(activePhase === 'jornadas' || (activePhase === 'liga' && jornadas && jornadas.length > 0)) && (
          <div key={activePhase} className="phase-content-wrapper" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            width: '100%',
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
                    const hasScores = m.score1 !== '' && m.score2 !== '' && m.score1 !== undefined && m.score2 !== undefined;
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
        )}

        {/* MODO DEFAULT (FALLBACK) */}
        {activePhase !== 'presentacion' && activePhase !== 'sorteo' && activePhase !== 'clasificacion' && activePhase !== 'jornadas' && activePhase !== 'liga' && (
          <div key="default" className="phase-content-wrapper">
            {renderGruposGrid()}
          </div>
        )}

        {/* SPOTLIGHT STREAM ZOOM VIEW (SIN BADGE DE STREAM SPOTLIGHT, CON ROSTER Y RANGOS) */}
        {spotlightTeam && (
          <div className="sorteo-spotlight-backdrop">
            <div className={`sorteo-spotlight-card grupo-${spotlightTeam.grupo || 'A'}`}>
              <div className="spotlight-logo-wrap">
                <div className="spotlight-logo-halo" />
                <img
                  src={spotlightTeam.logo || '/logo1.png'}
                  className="spotlight-logo-img"
                  alt={spotlightTeam.name}
                  onError={(e) => { e.target.src = '/logo1.png'; }}
                />
              </div>

              <div className="spotlight-tag-pill">
                {getTeamTag(spotlightTeam.name)}
              </div>

              <h2 className="spotlight-team-name">
                {spotlightTeam.name}
              </h2>

              <div className="spotlight-pills-row">
                <div className={`spotlight-pill grupo-pill grupo-${spotlightTeam.grupo || 'A'}`}>
                  GRUPO {spotlightTeam.grupo || 'A'} · {spotlightTeam.grupo === 'A' ? 'TIER 1 (CABEZAS DE SERIE)' : spotlightTeam.grupo === 'B' ? 'TIER 2' : spotlightTeam.grupo === 'C' ? 'TIER 3' : 'TIER 4'}
                </div>
              </div>

              {/* ROSTER OFICIAL DE INTEGRANTES CON RANGO AL LADO */}
              <div className="spotlight-roster-section">
                <div className="spotlight-roster-title">INTEGRANTES DEL EQUIPO</div>
                <div className="spotlight-roster-grid">
                  {((Array.isArray(spotlightTeam.players) && spotlightTeam.players.length > 0)
                    ? spotlightTeam.players
                    : (Array.isArray(spotlightTeam.jugadores) && spotlightTeam.jugadores.length > 0)
                    ? spotlightTeam.jugadores
                    : ['Capitán', 'Duelista']
                  ).map((jug, jIdx) => {
                    const pName = typeof jug === 'string' ? jug : (jug?.name || `Jugador ${jIdx + 1}`);
                    const pRank = getPlayerRank(jug, spotlightTeam.grupo || 'A');
                    const pRankIcon = getRankIconUrl(pRank, spotlightTeam.grupo || 'A');

                    return (
                      <div key={jIdx} className="spotlight-player-card">
                        <img
                          src={pRankIcon}
                          alt={pRank}
                          className="spotlight-player-rank-icon"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className="spotlight-player-name">{pName}</span>
                        <span className="spotlight-player-rank">{pRank}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COPA PRIMATE DRAW HUD OVERLAY (SORTEO DE RIVALES EN VIVO) */}
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
                ? { name: championsAnimation.team, logo: '/logo1.png', grupo: 'A', bombo: 1 }
                : (championsAnimation.team || drawingTeam || { name: 'Equipo', logo: '/logo1.png', grupo: 'A', bombo: 1 });

              const teamName = teamObj.name || 'Equipo';
              const teamLogo = teamObj.logo || '/logo1.png';
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
                        <div className="champions-hud-subtitle">COPA PRIMATE // SORTEO DE LIGA</div>
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
                          onError={(e) => { e.target.src = '/logo1.png'; }}
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
                        logo: matchItem.logo || '/logo1.png',
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
                                src={opp.logo || '/logo1.png'}
                                alt={opp.name}
                                className="matchup-opponent-logo"
                                onError={(e) => { e.target.src = '/logo1.png'; }}
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
