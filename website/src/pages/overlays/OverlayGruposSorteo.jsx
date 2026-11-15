import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';
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
  A: [],
  B: [],
  C: [],
  D: []
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

function getTeamMatchupsFromJornadas(teamName, jornadasData, gruposData) {
  if (!teamName || !Array.isArray(jornadasData)) return [];
  const norm = String(teamName).toLowerCase().trim();
  const res = [];
  for (let jIdx = 0; jIdx < 4; jIdx++) {
    const jNum = jIdx + 1;
    const jList = jornadasData[jIdx] || [];
    const match = jList.find(m => {
      const n1 = String(m?.t1?.name || '').toLowerCase().trim();
      const n2 = String(m?.t2?.name || '').toLowerCase().trim();
      return n1 === norm || n2 === norm;
    });
    if (match) {
      const isT1 = String(match?.t1?.name || '').toLowerCase().trim() === norm;
      const opp = isT1 ? match.t2 : match.t1;
      const oppName = opp?.name || `Rival J${jNum}`;
      const oppLogo = opp?.logo || '/logo1.png';
      let oppGrupo = opp?.grupo;
      if (!oppGrupo && gruposData) {
        for (const [gKey, list] of Object.entries(gruposData)) {
          if (Array.isArray(list) && list.some(t => t.name === oppName)) {
            oppGrupo = gKey;
            break;
          }
        }
      }
      res.push({
        jornada: jNum,
        opponent: {
          name: oppName,
          logo: oppLogo,
          grupo: oppGrupo || 'A',
          bombo: opp?.bombo || (oppGrupo === 'A' ? 1 : oppGrupo === 'B' ? 2 : oppGrupo === 'C' ? 3 : 4),
        }
      });
    }
  }
  return res;
}

export default function OverlayGruposSorteo() {
  const [grupos, setGrupos] = useState(DEFAULT_GRUPOS);
  const [revealedTeams, setRevealedTeams] = useState([]);
  const [activePhase, setActivePhase] = useState('presentacion'); // 'presentacion' | 'sorteo' | 'clasificacion' | 'jornadas' | 'liga'
  const [drawingTeam, setDrawingTeam] = useState(null);
  const [drawnTeamNames, setDrawnTeamNames] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [jornadas, setJornadas] = useState([]);
  const [spotlightTeam, setSpotlightTeam] = useState(null);
  const [championsAnimation, setChampionsAnimation] = useState(null);
  const [lastDrawnHero, setLastDrawnHero] = useState(null);
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
            if (s.drawingTeam !== undefined) {
              setDrawingTeam(s.drawingTeam);
              if (s.drawingTeam) setLastDrawnHero(s.drawingTeam);
            }
            if (Array.isArray(s.drawnTeamNames)) {
              setDrawnTeamNames(s.drawnTeamNames);
            }
            if (s.isSpinning !== undefined) setIsSpinning(s.isSpinning);
            if (s.spotlightTeam !== undefined || s.zoomedTeam !== undefined) {
              const active = s.spotlightTeam ?? s.zoomedTeam ?? null;
              setSpotlightTeam(active);
            }
            if (s.championsAnimation !== undefined) {
              setChampionsAnimation(s.championsAnimation);
              if (s.championsAnimation && s.championsAnimation.team) {
                setLastDrawnHero(s.championsAnimation.team);
              }
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

  // Local animation clock loop during draw animation
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

  // Determinar qué equipo y cruces mostrar en el Hero Draw Stage
  const activeDrawHero = championsAnimation?.team || drawingTeam || lastDrawnHero || null;
  const heroMatchups = (Array.isArray(championsAnimation?.matchups) && championsAnimation.matchups.length > 0)
    ? championsAnimation.matchups
    : (activeDrawHero ? getTeamMatchupsFromJornadas(activeDrawHero.name, jornadas, grupos) : []);

  const isAnimRunning = championsAnimation?.status === 'running';
  const currentAnimStep = championsAnimation?.revealedCount || (isAnimRunning ? Math.min(4, Math.max(1, Math.floor((Date.now() - (championsAnimation?.startedAt || Date.now())) / (championsAnimation?.stepDuration || 1600)) + 1)) : 4);

  const renderGruposGrid = (isSorteoMode = false) => (
    <div className={`grupos-grid ${isSorteoMode ? 'sorteo-mode-grid' : ''}`}>
      {groupKeys.map((gKey) => {
        const teamList = grupos[gKey] || [];
        const tierName = gKey === 'A' ? 'TIER 1 · CABEZAS' : gKey === 'B' ? 'TIER 2 · ASPIRANTES' : gKey === 'C' ? 'TIER 3 · INTERMEDIO' : 'TIER 4 · CHALLENGERS';
        const potNum = gKey === 'A' ? 1 : gKey === 'B' ? 2 : gKey === 'C' ? 3 : 4;

        return (
          <div key={gKey} className={`grupo-col col-${gKey}`}>
            <div className="grupo-header">
              <span className="grupo-title">{isSorteoMode ? `BOMBO ${potNum} · GRUPO ${gKey}` : `GRUPO ${gKey}`}</span>
              <span className="grupo-tag">{tierName} · 4 ESCUADRAS</span>
            </div>

            <div className="grupo-teams-list">
              {teamList.map((t, idx) => {
                const revealed = isSorteoMode || isTeamRevealed(t.name);
                const tTag = getTeamTag(t.name);
                const isDrawn = drawnTeamNames.includes(t.name);
                const isCurrentlyDrawing = (drawingTeam?.name === t.name) || (championsAnimation?.team?.name === t.name);

                return (
                  <div
                    key={t.id || idx}
                    className={`team-slot-card ${revealed ? 'revealed' : 'hidden-slot'} ${isCurrentlyDrawing ? 'currently-drawing' : ''} ${isDrawn ? 'team-drawn-card' : ''}`}
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span className="team-slot-tag" title={t.name}>
                              {tTag} · {t.name}
                            </span>
                            {isSorteoMode && (
                              <span className={`draw-status-pill ${isCurrentlyDrawing ? 'drawing' : isDrawn ? 'drawn' : 'pending'}`}>
                                {isCurrentlyDrawing ? '⚡ EN SORTEO' : isDrawn ? '✓ LISTO' : '⏳ EN BOMBO'}
                              </span>
                            )}
                          </div>
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
        {/* ENCABEZADO OFICIAL CON LOGO DE COPA PRIMATE Y MONITOS ANIMADOS */}
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
            {renderGruposGrid(false)}
          </div>
        )}

        {/* FASE 2: ESCENARIO DE SORTEO OFICIAL EN DIRECTO (BOMBOS & CRUCES) */}
        {activePhase === 'sorteo' && (
          <div key={activePhase} className="phase-content-wrapper sorteo-phase-wrapper">
            {/* HERO STAGE CENTRAL DE SORTEO */}
            <div className="sorteo-stage-card">
              {/* Barra de progreso y estado del sorteo */}
              <div className="sorteo-stage-header">
                <div className="sorteo-stage-header-left">
                  <span className={`sorteo-live-indicator ${isAnimRunning ? 'pulse-fast' : ''}`} />
                  <span className="sorteo-stage-title">
                    {isAnimRunning
                      ? `EXTRACCIÓN EN DIRECTO · ${activeDrawHero?.name || 'EQUIPO'}`
                      : drawnTeamNames.length === 16
                      ? 'SORTEO DE LIGA FINALIZADO (16/16 EQUIPOS)'
                      : 'SALA OFICIAL DE SORTEO Y EMPAREJAMIENTOS'}
                  </span>
                </div>
                <div className="sorteo-stage-header-right">
                  <div className="sorteo-progress-pill">
                    <span className="sorteo-progress-label">EMPAREJADOS:</span>
                    <span className="sorteo-progress-count">{drawnTeamNames.length} / 16</span>
                  </div>
                  <div className="sorteo-progress-bar-wrap">
                    <div
                      className="sorteo-progress-bar-fill"
                      style={{ width: `${Math.min(100, (drawnTeamNames.length / 16) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Contenido dinámico del escenario */}
              {activeDrawHero ? (
                <div className="sorteo-hero-showcase">
                  {/* Tarjeta del Equipo que se sortea */}
                  <div className={`sorteo-hero-team-box grupo-${activeDrawHero.grupo || 'A'}`}>
                    <div className="sorteo-hero-logo-wrap">
                      <div className="sorteo-hero-halo" />
                      <img
                        src={activeDrawHero.logo || '/logo1.png'}
                        alt={activeDrawHero.name}
                        className="sorteo-hero-logo"
                        onError={(e) => { e.target.src = '/logo1.png'; }}
                      />
                    </div>
                    <div className="sorteo-hero-info">
                      <span className="sorteo-hero-tag">{getTeamTag(activeDrawHero.name)}</span>
                      <h2 className="sorteo-hero-name">{activeDrawHero.name}</h2>
                      <div className="sorteo-hero-badges">
                        <span className={`sorteo-hero-bombo-badge bombo-${activeDrawHero.bombo || 1}`}>
                          BOMBO {activeDrawHero.bombo || 1}
                        </span>
                        <span className={`sorteo-hero-group-badge grupo-${activeDrawHero.grupo || 'A'}`}>
                          GRUPO {activeDrawHero.grupo || 'A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Casillas de Jornadas (Rival 1, Rival 2, Rival 3, Rival 4) */}
                  <div className="sorteo-hero-matchups-row">
                    {[1, 2, 3, 4].map((jNum) => {
                      const mItem = heroMatchups.find(m => Number(m.jornada) === jNum) || heroMatchups[jNum - 1];
                      const opp = mItem?.opponent || (mItem?.rival ? {
                        name: mItem.rival,
                        logo: mItem.logo || '/logo1.png',
                        grupo: mItem.grupo || 'A',
                        bombo: mItem.bombo || jNum,
                      } : null);

                      const isRevealed = Boolean(opp && (isAnimRunning ? jNum <= currentAnimStep : true));
                      const isScanning = Boolean(isAnimRunning && jNum === currentAnimStep + 1);

                      return (
                        <div
                          key={jNum}
                          className={`sorteo-matchup-slot ${isRevealed ? 'revealed' : isScanning ? 'scanning' : 'pending'}`}
                        >
                          <div className="sorteo-slot-header">
                            <span className="sorteo-slot-jornada">JORNADA {jNum}</span>
                            <span className="sorteo-slot-icon">
                              {isRevealed ? '✅' : isScanning ? '⚡' : '🔒'}
                            </span>
                          </div>

                          {isRevealed && opp ? (
                            <div className="sorteo-slot-body">
                              <img
                                src={opp.logo || '/logo1.png'}
                                alt={opp.name}
                                className="sorteo-slot-opp-logo"
                                onError={(e) => { e.target.src = '/logo1.png'; }}
                              />
                              <span className="sorteo-slot-opp-tag">{getTeamTag(opp.name)}</span>
                              <span className="sorteo-slot-opp-name" title={opp.name}>{opp.name}</span>
                              <div className="sorteo-slot-opp-badges">
                                <span className="sorteo-slot-mini-badge">B{opp.bombo || jNum}</span>
                                <span className="sorteo-slot-mini-badge">G-{opp.grupo || 'A'}</span>
                              </div>
                            </div>
                          ) : isScanning ? (
                            <div className="sorteo-slot-scanner">
                              <div className="sorteo-laser-line" />
                              <span className="sorteo-scanner-spin">🎰</span>
                              <span className="sorteo-scanner-text">EXTRAYENDO BOMBO {jNum}...</span>
                            </div>
                          ) : (
                            <div className="sorteo-slot-pending">
                              <span className="sorteo-pending-lock">🔒</span>
                              <span className="sorteo-pending-text">BOMBO {jNum} EN ESPERA</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* SALA DE ESPERA / HUB DE BOMBOS */
                <div className="sorteo-hub-waiting">
                  <div className="sorteo-hub-left">
                    <div className="sorteo-hub-orb-wrap">
                      <div className="sorteo-hub-orb">🎰</div>
                    </div>
                    <div className="sorteo-hub-text-col">
                      <div className="sorteo-hub-badge">SALA OFICIAL DE SORTEO</div>
                      <h3 className="sorteo-hub-title">EXTRACCIÓN DE CRUCES DE LIGA</h3>
                      <p className="sorteo-hub-desc">
                        16 equipos distribuidos en 4 niveles de habilidad. Cada equipo disputa 4 partidos frente a rivales de distinto nivel.
                      </p>
                    </div>
                  </div>

                  <div className="sorteo-hub-pots-summary">
                    {groupKeys.map(gKey => {
                      const potNum = gKey === 'A' ? 1 : gKey === 'B' ? 2 : gKey === 'C' ? 3 : 4;
                      const gTeams = grupos[gKey] || [];
                      const drawnCount = gTeams.filter(t => drawnTeamNames.includes(t.name)).length;
                      return (
                        <div key={gKey} className={`sorteo-pot-card pot-${gKey}`}>
                          <div className="sorteo-pot-header">
                            <span className="sorteo-pot-num">BOMBO {potNum}</span>
                            <span className="sorteo-pot-drawn">{drawnCount}/4</span>
                          </div>
                          <div className="sorteo-pot-label">
                            {gKey === 'A' ? 'TIER 1 · CABEZAS' : gKey === 'B' ? 'TIER 2 · ASPIRANTES' : gKey === 'C' ? 'TIER 3 · INTERMEDIO' : 'TIER 4 · CHALLENGERS'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CUADRÍCULA DE LOS 4 GRUPOS / BOMBOS CON ESTADOS EN VIVO */}
            {renderGruposGrid(true)}
          </div>
        )}

        {/* FASE 3: CLASIFICACIÓN GENERAL (TABLA 1-16 EN 2 COLUMNAS SIDE-BY-SIDE SIN SCROLL) */}
        {activePhase === 'clasificacion' && (() => {
          const top8 = standingsData.slice(0, 8);
          const bottom8 = standingsData.slice(8, 16);

          const renderStandingsSubTable = (teamsList, startPos, isPlayoffZone) => (
            <div className={`sorteo-standings-half-col ${isPlayoffZone ? 'zone-playoff' : 'zone-regular'}`}>
              <div className="sorteo-standings-col-header">
                <div className="col-header-left">
                  <span className={`col-indicator-dot ${isPlayoffZone ? 'dot-playoff' : 'dot-regular'}`} />
                  <span className="col-header-title">
                    {isPlayoffZone ? 'TOP 1 - 8 · CLASIFICADOS A PLAYOFFS' : 'PUESTOS 9 - 16 · FASE REGULAR'}
                  </span>
                </div>
                <span className={`col-header-tag ${isPlayoffZone ? 'tag-playoff' : 'tag-regular'}`}>
                  {isPlayoffZone ? 'ZONA PLAYOFFS 🏆' : 'FASE REGULAR'}
                </span>
              </div>

              <table className="sorteo-standings-table">
                <thead>
                  <tr>
                    <th style={{ width: '38px' }}>POS</th>
                    <th className="th-team">EQUIPO</th>
                    <th style={{ width: '46px' }}>GRUPO</th>
                    <th style={{ width: '36px' }}>PJ</th>
                    <th style={{ width: '36px' }}>V</th>
                    <th style={{ width: '36px' }}>D</th>
                    <th style={{ width: '46px' }}>DIF</th>
                    <th style={{ width: '46px' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {teamsList.map((team, idx) => {
                    const pos = startPos + idx;
                    const isTop1 = pos === 1;
                    const isTop3 = pos <= 3;
                    const isTop8 = pos <= 8;
                    const teamTag = getTeamTag(team.name);

                    return (
                      <tr key={team.name || idx} className={`standings-row ${isTop8 ? 'row-playoff' : 'row-regular'}`}>
                        <td>
                          <span className={`standings-pos-badge ${isTop1 ? 'gold' : isTop3 ? 'podium' : isTop8 ? 'top8' : 'normal'}`}>
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
                          <span className={`standings-group-pill group-pill-${team.grupo || 'A'}`}>
                            G-{team.grupo || 'A'}
                          </span>
                        </td>
                        <td>{team.pj || 0}</td>
                        <td className="stat-win">{team.wins || 0}</td>
                        <td className="stat-loss">{team.losses || 0}</td>
                        <td className={team.diff > 0 ? 'stat-diff-pos' : team.diff < 0 ? 'stat-diff-neg' : 'stat-diff-zero'}>
                          {team.diff > 0 ? `+${team.diff}` : team.diff || 0}
                        </td>
                        <td className="standings-pts-cell">{team.pts || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );

          return (
            <div key={activePhase} className="phase-content-wrapper">
              <div className="sorteo-standings-container">
                <div className="sorteo-standings-header-row">
                  <div className="sorteo-standings-title">
                    <span className="standings-trophy-icon">🏆</span>
                    <span>TABLA GENERAL DE CLASIFICACIÓN // FASE DE LIGA</span>
                    <span className="standings-count-badge">16 EQUIPOS</span>
                  </div>
                  <div className="sorteo-standings-legend">
                    <span className="legend-playoff">
                      <span className="legend-dot-cyan" />
                      TOP 1-8: CUARTOS DE FINAL (PLAYOFFS)
                    </span>
                    <span className="legend-regular">
                      <span className="legend-dot-gray" />
                      PUESTOS 9-16: ZONA ELIMINADA
                    </span>
                  </div>
                </div>

                <div className="sorteo-standings-split-grid">
                  {renderStandingsSubTable(top8, 1, true)}
                  {renderStandingsSubTable(bottom8, 9, false)}
                </div>
              </div>
            </div>
          );
        })()}

        {/* FASE 4: JORNADAS / CALENDARIO (4 COLUMNAS DE PARTIDOS O PENDIENTE DE SORTEO) */}
        {(activePhase === 'jornadas' || (activePhase === 'liga' && jornadas && jornadas.length > 0)) && (() => {
          const totalMatches = (jornadas || []).flat().length;

          if (totalMatches === 0) {
            return (
              <div key="jornadas-pending" className="phase-content-wrapper" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: '440px',
                background: 'rgba(12, 16, 26, 0.85)',
                border: '1.5px solid rgba(192, 132, 252, 0.45)',
                borderRadius: '18px',
                padding: '40px 24px',
                textAlign: 'center',
                zIndex: 2,
                gap: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
              }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'rgba(192, 132, 252, 0.15)',
                  border: '2px solid rgba(192, 132, 252, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  boxShadow: '0 0 25px rgba(192, 132, 252, 0.35)',
                }}>
                  ⏳
                </div>
                <div style={{
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '24px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}>
                  CALENDARIO OFICIAL · PENDIENTE DE SORTEO
                </div>
                <div style={{
                  color: '#00f5d4',
                  fontWeight: 700,
                  fontSize: '15px',
                  letterSpacing: '1px',
                  maxWidth: '560px',
                  lineHeight: '1.5'
                }}>
                  Los 32 enfrentamientos de las Jornadas 1 a 4 se generarán y mostrarán aquí durante el sorteo en directo.
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Jornada 1', 'Jornada 2', 'Jornada 3', 'Jornada 4'].map((jName, i) => (
                    <div key={i} style={{
                      padding: '10px 18px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#aaa',
                      letterSpacing: '1px',
                    }}>
                      🔒 {jName} (Pendiente)
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
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
                    {jList.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#666', fontSize: '11px', padding: '24px 0' }}>
                        Sin partidos programados
                      </div>
                    ) : (
                      jList.map((m, mIdx) => {
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
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* MODO DEFAULT (FALLBACK) */}
        {activePhase !== 'presentacion' && activePhase !== 'sorteo' && activePhase !== 'clasificacion' && activePhase !== 'jornadas' && activePhase !== 'liga' && (
          <div key="default" className="phase-content-wrapper">
            {renderGruposGrid(false)}
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

        <div className="sorteo-bottom-bar" />
      </div>
    </div>
  );
}
