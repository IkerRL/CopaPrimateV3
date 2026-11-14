import { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Shuffle, Eye, EyeOff, Radio, Save, Play, 
  RotateCcw, Sparkles, User, Award, CheckCircle2, ChevronDown, ChevronRight, Edit3, Crosshair, X
} from 'lucide-react';
import { apiFetch } from '../api';
import ConfirmModal from './ConfirmModal';
import './copaGrupos.css';

const MAPS = ['Ascent', 'Bind', 'Haven', 'Split', 'Sunset', 'Lotus', 'Abyss', 'Icebox', 'Breeze', 'Fracture', 'Pearl'];

const VALORANT_AGENTS = [
  'Jett', 'Reyna', 'Omen', 'Clove', 'Iso', 'Raze', 'Cypher', 'Killjoy',
  'Sova', 'Fade', 'Brimstone', 'Viper', 'Breach', 'KAY/O', 'Skye',
  'Gekko', 'Deadlock', 'Chamber', 'Yoru', 'Astra', 'Harbor', 'Phoenix', 'Vyse'
];

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

// Generador de cruces de fase de liga balanceados
function generarCalendarioLiga(gruposData) {
  const allTeams = Object.values(gruposData).flat();
  if (allTeams.length < 16) return [[], [], [], []];

  const gA = gruposData.A || [];
  const gB = gruposData.B || [];
  const gC = gruposData.C || [];
  const gD = gruposData.D || [];

  // 4 Jornadas equilibradas (Cruces entre grupos: A vs B, C vs D, A vs C, B vs D, etc.)
  const j1 = [
    { t1: gA[0], t2: gB[0] },
    { t1: gA[1], t2: gB[1] },
    { t1: gA[2], t2: gB[2] },
    { t1: gA[3], t2: gB[3] },
    { t1: gC[0], t2: gD[0] },
    { t1: gC[1], t2: gD[1] },
    { t1: gC[2], t2: gD[2] },
    { t1: gC[3], t2: gD[3] },
  ];

  const j2 = [
    { t1: gA[0], t2: gC[0] },
    { t1: gA[1], t2: gC[1] },
    { t1: gA[2], t2: gC[2] },
    { t1: gA[3], t2: gC[3] },
    { t1: gB[0], t2: gD[0] },
    { t1: gB[1], t2: gD[1] },
    { t1: gB[2], t2: gD[2] },
    { t1: gB[3], t2: gD[3] },
  ];

  const j3 = [
    { t1: gA[0], t2: gD[0] },
    { t1: gA[1], t2: gD[1] },
    { t1: gA[2], t2: gD[2] },
    { t1: gA[3], t2: gD[3] },
    { t1: gB[0], t2: gC[0] },
    { t1: gB[1], t2: gC[1] },
    { t1: gB[2], t2: gC[2] },
    { t1: gB[3], t2: gC[3] },
  ];

  const j4 = [
    { t1: gA[0], t2: gA[1] },
    { t1: gA[2], t2: gA[3] },
    { t1: gB[0], t2: gB[1] },
    { t1: gB[2], t2: gB[3] },
    { t1: gC[0], t2: gC[1] },
    { t1: gC[2], t2: gC[3] },
    { t1: gD[0], t2: gD[1] },
    { t1: gD[2], t2: gD[3] },
  ];

  const formatear = (partidos, jNum) =>
    partidos.map((p, idx) => ({
      id: `j${jNum}-m${idx + 1}`,
      jornada: jNum,
      t1: { name: p.t1.name, logo: p.t1.logo, grupo: p.t1.grupo },
      t2: { name: p.t2.name, logo: p.t2.logo, grupo: p.t2.grupo },
      score1: '',
      score2: '',
      status: 'Programado',
      format: 'BO1 (Swiftplay)',
      date: `Jornada ${jNum} · Partido ${idx + 1}`
    }));

  return [formatear(j1, 1), formatear(j2, 2), formatear(j3, 3), formatear(j4, 4)];
}

export default function CopaGruposLiga() {
  const [activePhase, setActivePhase] = useState('presentacion'); // 'presentacion' | 'sorteo' | 'liga'
  const [grupos, setGrupos] = useState(DEFAULT_GRUPOS);
  const [revealedTeams, setRevealedTeams] = useState([]);
  const [zoomedTeam, setZoomedTeam] = useState(null);
  const [jornadas, setJornadas] = useState([]);
  const [isSpinningBall, setIsSpinningBall] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [statsMatch, setStatsMatch] = useState(null);
  const [savingStats, setSavingStats] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    confirmStyle: 'warning',
    onConfirm: null,
  });

  const audioCtxRef = useRef(null);

  // Cargar estado inicial desde servidor o inicializar
  useEffect(() => {
    fetchLigaState();
  }, []);

  const playClickSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'running') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch (e) {}
  };

  const fetchLigaState = async () => {
    try {
      const res = await apiFetch('/matches');
      if (res.ok) {
        const data = await res.json();
        if (data && data.groups && Object.keys(data.groups).length === 4) {
          // Reconstruir grupos con jugadores
          const gA = data.groups.A || DEFAULT_GRUPOS.A;
          const gB = data.groups.B || DEFAULT_GRUPOS.B;
          const gC = data.groups.C || DEFAULT_GRUPOS.C;
          const gD = data.groups.D || DEFAULT_GRUPOS.D;
          setGrupos({ A: gA, B: gB, C: gC, D: gD });
        }

        if (data && Array.isArray(data.jornadas) && data.jornadas.length === 4) {
          setJornadas(data.jornadas);
        } else if (data && Array.isArray(data.matches) && data.matches.length > 0) {
          // Si los partidos vienen planos, agrupar por jornada
          const j1 = data.matches.filter(m => m.jornada === 1);
          const j2 = data.matches.filter(m => m.jornada === 2);
          const j3 = data.matches.filter(m => m.jornada === 3);
          const j4 = data.matches.filter(m => m.jornada === 4);
          if (j1.length || j2.length || j3.length || j4.length) {
            setJornadas([j1, j2, j3, j4]);
          } else {
            setJornadas(generarCalendarioLiga(DEFAULT_GRUPOS));
          }
        } else {
          setJornadas(generarCalendarioLiga(DEFAULT_GRUPOS));
        }
      }
    } catch (e) {
      setJornadas(generarCalendarioLiga(DEFAULT_GRUPOS));
    }
  };

  const saveLigaState = async (customJornadas = jornadas) => {
    setSaving(true);
    try {
      const allMatches = customJornadas.flat();
      await apiFetch('/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groups: grupos,
          matches: allMatches,
          jornadas: customJornadas,
          drawCompleted: true
        })
      });
      setSaveStatus('¡Guardado correctamente en el servidor!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      setSaveStatus('Error al guardar datos en el servidor.');
      setTimeout(() => setSaveStatus(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  // Controles de revelación
  const toggleReveal = (teamName) => {
    playClickSound();
    setRevealedTeams(prev => 
      prev.includes(teamName) ? prev.filter(t => t !== teamName) : [...prev, teamName]
    );
  };

  const revealAll = () => {
    playClickSound();
    const allNames = Object.values(grupos).flat().map(t => t.name);
    setRevealedTeams(allNames);
  };

  const hideAll = () => {
    playClickSound();
    setRevealedTeams([]);
  };

  // Guardia de confirmación para el sorteo
  const requestEjecutarSorteo = (animado = true) => {
    setConfirmConfig({
      isOpen: true,
      title: '⚠️ ¿Ejecutar Nuevo Sorteo de Liga?',
      message: 'Esta acción reorganizará los cruces de todos los grupos y sobrescribirá el calendario oficial del torneo.',
      confirmText: 'Sortear Grupos',
      confirmStyle: 'warning',
      onConfirm: () => {
        ejecutarSorteo(animado);
        setConfirmConfig(c => ({ ...c, isOpen: false }));
      }
    });
  };

  // Ejecución del Sorteo
  const ejecutarSorteo = (animado = true) => {
    playClickSound();
    if (animado) {
      setIsSpinningBall(true);
      setTimeout(() => {
        // Mezclar internamente equipos en los grupos manteniendo balance
        const shuffle = arr => [...arr].sort(() => 0.5 - Math.random());
        const nuevosGrupos = {
          A: shuffle(grupos.A),
          B: shuffle(grupos.B),
          C: shuffle(grupos.C),
          D: shuffle(grupos.D)
        };
        const nuevoCalendario = generarCalendarioLiga(nuevosGrupos);
        setGrupos(nuevosGrupos);
        setJornadas(nuevoCalendario);
        setIsSpinningBall(false);
        saveLigaState(nuevoCalendario);
      }, 1500);
    } else {
      const nuevoCalendario = generarCalendarioLiga(grupos);
      setJornadas(nuevoCalendario);
      saveLigaState(nuevoCalendario);
    }
  };

  // Actualizar marcador de un partido en la fase de liga
  const handleScoreChange = (jIdx, mIdx, side, value) => {
    const parsed = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    const updated = jornadas.map((jList, currentJIdx) => {
      if (currentJIdx !== jIdx) return jList;
      return jList.map((m, currentMIdx) => {
        if (currentMIdx !== mIdx) return m;
        const newScore1 = side === 1 ? parsed : m.score1;
        const newScore2 = side === 2 ? parsed : m.score2;
        const hasScore = newScore1 !== '' && newScore2 !== '';
        return {
          ...m,
          score1: newScore1,
          score2: newScore2,
          status: hasScore ? (newScore1 === 13 || newScore2 === 13 ? 'Finalizado' : 'LIVE') : 'Programado'
        };
      });
    });
    setJornadas(updated);
  };

  // Abrir modal de edición profunda (K/D/A, Agente y MVP)
  const openStatsModal = (m, jIdx, mIdx) => {
    playClickSound();
    const allTeams = Object.values(grupos).flat();
    const foundT1 = allTeams.find(t => t.name.toLowerCase() === m.t1.name.toLowerCase());
    const foundT2 = allTeams.find(t => t.name.toLowerCase() === m.t2.name.toLowerCase());

    const initPlayers = (teamObj, existingStats) => {
      if (Array.isArray(existingStats) && existingStats.length > 0) {
        return existingStats;
      }
      if (teamObj && Array.isArray(teamObj.jugadores) && teamObj.jugadores.length > 0) {
        return teamObj.jugadores.map((name, idx) => ({
          name,
          agent: idx === 0 ? 'Jett' : 'Reyna',
          kills: 0,
          deaths: 0,
          assists: 0
        }));
      }
      return [
        { name: `${teamObj?.name || 'Equipo'} Jugador 1`, agent: 'Jett', kills: 0, deaths: 0, assists: 0 },
        { name: `${teamObj?.name || 'Equipo'} Jugador 2`, agent: 'Reyna', kills: 0, deaths: 0, assists: 0 },
      ];
    };

    setStatsMatch({
      ...m,
      jIdx,
      mIdx,
      map: m.map || 'Ascent',
      mvp: m.mvp || '',
      date: m.date || `Jornada ${jIdx + 1} · Partido ${mIdx + 1}`,
      status: m.status || 'Programado',
      score1: m.score1 !== '' ? Number(m.score1) : 0,
      score2: m.score2 !== '' ? Number(m.score2) : 0,
      playerStats: {
        t1: initPlayers(foundT1, m.playerStats?.t1),
        t2: initPlayers(foundT2, m.playerStats?.t2),
      }
    });
  };

  const saveStatsModal = async () => {
    if (!statsMatch) return;
    setSavingStats(true);
    try {
      const s1 = Number(statsMatch.score1) || 0;
      const s2 = Number(statsMatch.score2) || 0;
      const updatedMatch = {
        ...statsMatch,
        score1: s1,
        score2: s2,
        status: (s1 === 13 || s2 === 13) ? 'Finalizado' : (s1 > 0 || s2 > 0 ? 'LIVE' : 'Programado')
      };

      const updatedJornadas = jornadas.map((jList, curJIdx) => {
        if (curJIdx !== statsMatch.jIdx) return jList;
        return jList.map((curM, curMIdx) => {
          if (curMIdx !== statsMatch.mIdx) return curM;
          return updatedMatch;
        });
      });
      setJornadas(updatedJornadas);

      // Guardar en la API con updateTeamStats para sincronizar KDA con teams.json
      const matchId = statsMatch.id || (statsMatch.jIdx * 8 + statsMatch.mIdx + 1);
      await apiFetch(`/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedMatch,
          updateTeamStats: true
        })
      }).catch(() => {});

      await saveLigaState(updatedJornadas);
      setStatsMatch(null);
      setSaveStatus('✅ ¡Estadísticas, KDA y agentes guardados correctamente!');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (e) {
      setSaveStatus('Error al guardar estadísticas.');
      setTimeout(() => setSaveStatus(null), 3500);
    } finally {
      setSavingStats(false);
    }
  };

  // Guardia de confirmación para enviar partido al marcador en directo
  const requestSendToLiveScoreboard = (match) => {
    setConfirmConfig({
      isOpen: true,
      title: '⚡ ¿Enviar al Marcador en Directo?',
      message: `¿Deseas enviar el partido ${match.t1.name} vs ${match.t2.name} al Marcador Oficial en directo? Se sobrescribirá el partido actual en emisión.`,
      confirmText: 'Enviar a Emisión',
      confirmStyle: 'primary',
      onConfirm: () => {
        handleSendToLiveScoreboard(match);
        setConfirmConfig(c => ({ ...c, isOpen: false }));
      }
    });
  };

  // Enviar partido directamente al marcador en directo
  const handleSendToLiveScoreboard = async (match) => {
    playClickSound();
    try {
      await apiFetch('/live-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match: {
            active: true,
            status: 'LIVE',
            team1: {
              name: match.t1.name,
              logo: match.t1.logo,
              score: Number(match.score1) || 0,
              mapsWon: 0
            },
            team2: {
              name: match.t2.name,
              logo: match.t2.logo,
              score: Number(match.score2) || 0,
              mapsWon: 0
            },
            round: (Number(match.score1) || 0) + (Number(match.score2) || 0) + 1,
            map: 'Ascent'
          }
        })
      });
      alert(`⚡ ¡El partido ${match.t1.name} vs ${match.t2.name} se ha enviado al Marcador Oficial en directo!`);
    } catch (e) {
      alert('Error al enviar el partido al marcador.');
    }
  };

  // Cálculo de la tabla de clasificación
  const calcularClasificacion = () => {
    const statsMap = {};
    Object.values(grupos).flat().forEach(t => {
      statsMap[t.name] = {
        name: t.name,
        logo: t.logo,
        grupo: t.grupo,
        pj: 0,
        wins: 0,
        losses: 0,
        rw: 0, // rounds won
        rl: 0, // rounds lost
        diff: 0,
        pts: 0
      };
    });

    jornadas.flat().forEach(m => {
      const s1 = parseInt(m.score1, 10);
      const s2 = parseInt(m.score2, 10);

      if (!isNaN(s1) && !isNaN(s2) && (s1 > 0 || s2 > 0)) {
        const eq1 = statsMap[m.t1.name];
        const eq2 = statsMap[m.t2.name];

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
            // Empate
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
  };

  const tablaClasificacion = calcularClasificacion();

  return (
    <div className="copa-v2-container">
      {/* HEADER CON MONITOS Y LOGO OFICIAL */}
      <header className="copa-header">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <img
            src="/copa-logo.png"
            alt="Logo Copa Primate"
            style={{ width: '84px', height: '84px', objectFit: 'contain', cursor: 'pointer', filter: 'drop-shadow(0 0 16px rgba(192,132,252,0.6))' }}
            onClick={playClickSound}
            title="Logo Oficial Copa Primate Vol. III"
          />
        </div>
        <h1 className="copa-title-main">COPA PRIMATE</h1>
        <div className="copa-vol-row">
          <img src="/monito-der.png" className="copa-sticker-monkey" alt="Mono izq" onClick={playClickSound} />
          <h2 className="copa-vol-text">VOL. III // FASE DE GRUPOS Y LIGA</h2>
          <img src="/monito-izq.png" className="copa-sticker-monkey" alt="Mono der" onClick={playClickSound} />
        </div>
      </header>

      {/* SELECTOR DE PANTALLAS / FASES */}
      <nav className="copa-phase-nav">
        <button
          type="button"
          className={`copa-phase-btn ${activePhase === 'presentacion' ? 'active' : ''}`}
          onClick={() => { playClickSound(); setActivePhase('presentacion'); }}
        >
          <Eye size={16} /> 1. PRESENTACIÓN DE GRUPOS
        </button>

        <button
          type="button"
          className={`copa-phase-btn ${activePhase === 'sorteo' ? 'active' : ''}`}
          onClick={() => { playClickSound(); setActivePhase('sorteo'); }}
        >
          <Shuffle size={16} /> 2. SORTEO FASE DE LIGA
        </button>

        <button
          type="button"
          className={`copa-phase-btn ${activePhase === 'liga' ? 'active' : ''}`}
          onClick={() => { playClickSound(); setActivePhase('liga'); }}
        >
          <Trophy size={16} /> 3. CLASIFICACIÓN & JORNADAS
        </button>
      </nav>

      {/* BARRA DE MENSAJES DE GUARDADO */}
      {saveStatus && (
        <div style={{
          background: saveStatus.includes('Error') ? 'rgba(229,57,53,0.3)' : 'rgba(76,175,80,0.3)',
          border: `1px solid ${saveStatus.includes('Error') ? '#e53935' : '#4caf50'}`,
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.85rem'
        }}>
          {saveStatus}
        </div>
      )}

      {/* =========================================================
          FASE 1: PRESENTACIÓN DE GRUPOS (REVELACIÓN DE TARJETAS)
          ========================================================= */}
      {activePhase === 'presentacion' && (
        <div>
          <div className="copa-action-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" className="btn-v-action" onClick={revealAll}>
                <Eye size={16} /> REVELAR TODOS
              </button>
              <button type="button" className="btn-v-secondary" onClick={hideAll}>
                <EyeOff size={16} /> OCULTAR TODOS
              </button>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#ffb300', fontWeight: 800 }}>
              💡 Haz clic en una tarjeta para revelarla o doble clic para hacer Zoom
            </div>

            <button
              type="button"
              className="btn-v-action"
              style={{ background: 'linear-gradient(135deg, #f57f17, #e65100)', borderColor: '#ffb300' }}
              onClick={() => { playClickSound(); setActivePhase('sorteo'); }}
            >
              IR AL SORTEO DE LIGA →
            </button>
          </div>

          <div className="copa-presentacion-grid">
            {['A', 'B', 'C', 'D'].map(gKey => (
              <div key={gKey} className={`copa-group-col ${gKey}`}>
                <div className="copa-group-header">
                  <h3 className="copa-group-title">GRUPO {gKey}</h3>
                  <span style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 800 }}>4 EQUIPOS</span>
                </div>

                {grupos[gKey]?.map(team => {
                  const isRevealed = revealedTeams.includes(team.name);
                  return (
                    <div
                      key={team.id || team.name}
                      className={`copa-team-card ${isRevealed ? 'revealed' : ''}`}
                      onClick={() => toggleReveal(team.name)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setZoomedTeam(team);
                      }}
                    >
                      <div className="copa-smoke-cover" />
                      <div className={`copa-group-badge ${gKey}`}>GRUPO {gKey}</div>
                      
                      <div className="copa-team-content">
                        <img
                          src={team.logo}
                          className="copa-team-logo"
                          alt={team.name}
                          onError={(e) => { e.target.src = '/logo1.png'; }}
                        />
                        <div className="copa-team-info">
                          <div className="copa-team-name">{team.name}</div>
                          <div className="copa-players-row">
                            {team.jugadores?.map((j, i) => (
                              <span key={i}>👤 {j}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          FASE 2: SORTEO DE LA FASE DE LIGA
          ========================================================= */}
      {activePhase === 'sorteo' && (
        <div>
          <div className="copa-sorteo-box">
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--omen-cyan)', letterSpacing: '2px', marginBottom: '8px' }}>
              SORTEO OFICIAL DE LA FASE DE LIGA
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', maxWidth: '600px', margin: '0 auto 20px' }}>
              16 equipos distribuidos en 4 bombos/grupos. El sorteo genera 4 jornadas con 8 enfrentamientos cada una garantizando que todos jueguen 4 partidos.
            </p>

            <div
              className={`sorteo-ball-interactive ${isSpinningBall ? 'spinning' : ''}`}
              onClick={() => !isSpinningBall && requestEjecutarSorteo(true)}
              title="Haz clic para sortear"
            >
              🐒
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-v-action"
                disabled={isSpinningBall}
                onClick={() => requestEjecutarSorteo(true)}
              >
                <Shuffle size={16} /> {isSpinningBall ? 'SORTEANDO PARTIDOS...' : 'SORTEO ALEATORIO ANIMADO'}
              </button>

              <button
                type="button"
                className="btn-v-secondary"
                disabled={isSpinningBall}
                onClick={() => requestEjecutarSorteo(false)}
              >
                <Sparkles size={16} /> REORDENAR CRUCES CLÁSICOS
              </button>

              <button
                type="button"
                className="btn-v-action"
                style={{ background: 'linear-gradient(135deg, #1565c0, #0d47a1)', borderColor: '#29b6f6' }}
                onClick={() => { playClickSound(); setActivePhase('liga'); }}
              >
                <Trophy size={16} /> VER CALENDARIO & RESULTADOS →
              </button>
            </div>
          </div>

          {/* Resumen de las 4 jornadas generadas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {jornadas.map((jList, jIdx) => (
              <div
                key={jIdx}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,179,0,0.3)',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              >
                <div style={{ fontWeight: 900, color: '#ffb300', marginBottom: '8px', textAlign: 'center', fontSize: '0.9rem' }}>
                  JORNADA {jIdx + 1} ({jList.length} PARTIDOS)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {jList.slice(0, 4).map((m, mIdx) => (
                    <div
                      key={mIdx}
                      style={{
                        fontSize: '0.72rem',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '42%' }}>{m.t1.name}</span>
                      <span style={{ color: '#4caf50', fontWeight: 900 }}>VS</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '42%', textAlign: 'right' }}>{m.t2.name}</span>
                    </div>
                  ))}
                  {jList.length > 4 && (
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#888' }}>
                      + {jList.length - 4} partidos más...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          FASE 3: LIGA SPLIT (TABLA DE CLASIFICACIÓN & JORNADAS)
          ========================================================= */}
      {activePhase === 'liga' && (
        <div>
          <div className="copa-action-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn-v-action"
                onClick={() => saveLigaState()}
                disabled={saving}
              >
                <Save size={16} /> {saving ? 'GUARDANDO...' : 'GUARDAR MARCADORES'}
              </button>

              <button
                type="button"
                className="btn-v-secondary"
                onClick={() => { playClickSound(); setActivePhase('sorteo'); }}
              >
                <RotateCcw size={16} /> REPETIR SORTEO
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
              🟢 1º-4º Cuartos Directos · 🟡 5º-12º Playoffs · 🔴 13º-16º Eliminados
            </div>
          </div>

          <div className="copa-liga-split">
            {/* COLUMNA IZQUIERDA: TABLA DE CLASIFICACIÓN */}
            <div className="copa-tabla-box">
              <div className="copa-section-title">
                <Trophy size={18} /> CLASIFICACIÓN GENERAL
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="copa-standings-table">
                  <thead>
                    <tr>
                      <th style={{ width: '28px' }}>#</th>
                      <th>EQUIPO</th>
                      <th>PJ</th>
                      <th>V</th>
                      <th>PTS</th>
                      <th>DIF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablaClasificacion.map((team, idx) => {
                      const pos = idx + 1;
                      const trStyle = pos <= 4 ? 'tr-direct' : pos <= 12 ? 'tr-playoff' : 'tr-elim';
                      const posStyle = pos <= 4 ? 'pos-direct' : pos <= 12 ? 'pos-playoff' : 'pos-elim';
                      return (
                        <tr key={team.name} className={trStyle}>
                          <td>
                            <span className={`pos-tag ${posStyle}`}>{pos}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <img
                                src={team.logo}
                                style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                alt={team.name}
                                onError={(e) => { e.target.src = '/logo1.png'; }}
                              />
                              <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                {team.name}
                              </span>
                            </div>
                          </td>
                          <td>{team.pj}</td>
                          <td>{team.wins}</td>
                          <td style={{ fontWeight: 900, color: '#ffb300' }}>{team.pts}</td>
                          <td style={{ color: team.diff > 0 ? '#4caf50' : team.diff < 0 ? '#e53935' : '#aaa' }}>
                            {team.diff > 0 ? `+${team.diff}` : team.diff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* COLUMNA DERECHA: ACORDEÓN DE JORNADAS */}
            <div className="copa-jornadas-box">
              <div className="copa-section-title">
                <Radio size={18} /> ENFRENTAMIENTOS POR JORNADA
              </div>

              {jornadas.map((jList, jIdx) => {
                const isOpen = activeAccordion === jIdx;
                return (
                  <div key={jIdx} className="copa-accordion-item">
                    <div
                      className="copa-accordion-header"
                      onClick={() => {
                        playClickSound();
                        setActiveAccordion(isOpen ? -1 : jIdx);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📁</span>
                        <span>JORNADA {jIdx + 1}</span>
                        <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 600 }}>
                          ({jList.length} partidos)
                        </span>
                      </div>
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>

                    {isOpen && (
                      <div className="copa-accordion-body">
                        {jList.map((m, mIdx) => (
                          <div key={m.id || mIdx} className="copa-match-card">
                            <div className="copa-match-row">
                              <div className="copa-match-side">
                                <img
                                  src={m.t1.logo}
                                  className="copa-match-logo"
                                  alt={m.t1.name}
                                  onError={(e) => { e.target.src = '/logo1.png'; }}
                                />
                                <span className="copa-match-name" title={m.t1.name}>
                                  {m.t1.name}
                                </span>
                              </div>

                              <div className="copa-score-inputs">
                                <input
                                  type="number"
                                  className="copa-score-input"
                                  placeholder="—"
                                  value={m.score1}
                                  onChange={(e) => handleScoreChange(jIdx, mIdx, 1, e.target.value)}
                                />
                                <span style={{ color: '#4caf50', fontWeight: 900, fontSize: '0.75rem' }}>:</span>
                                <input
                                  type="number"
                                  className="copa-score-input"
                                  placeholder="—"
                                  value={m.score2}
                                  onChange={(e) => handleScoreChange(jIdx, mIdx, 2, e.target.value)}
                                />
                              </div>

                              <div className="copa-match-side right">
                                <span className="copa-match-name" title={m.t2.name}>
                                  {m.t2.name}
                                </span>
                                <img
                                  src={m.t2.logo}
                                  className="copa-match-logo"
                                  alt={m.t2.name}
                                  onError={(e) => { e.target.src = '/logo1.png'; }}
                                />
                              </div>
                            </div>

                            <div className="copa-match-actions">
                              <span style={{ fontSize: '0.65rem', color: '#777' }}>
                                {m.map ? `🗺️ ${m.map} · ` : ''}{m.status} · {m.format}
                              </span>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn-send-live"
                                  style={{ background: 'rgba(76, 175, 80, 0.15)', borderColor: 'rgba(76, 175, 80, 0.5)', color: '#4caf50' }}
                                  onClick={() => openStatsModal(m, jIdx, mIdx)}
                                  title="Editar estadísticas detalladas, agentes y K/D/A de los jugadores"
                                >
                                  📊 STATS / KDA
                                </button>

                                <button
                                  type="button"
                                  className="btn-send-live"
                                  onClick={() => requestSendToLiveScoreboard(m)}
                                  title="Enviar al marcador oficial en directo"
                                >
                                  ⚡ MARCADOR EN VIVO
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL SPOTLIGHT ZOOM
          ========================================================= */}
      {zoomedTeam && (
        <div className="copa-zoom-overlay" onClick={() => setZoomedTeam(null)}>
          <div className="copa-zoom-card" onClick={(e) => e.stopPropagation()}>
            <img
              src={zoomedTeam.logo}
              className="copa-zoom-logo"
              alt={zoomedTeam.name}
              onError={(e) => { e.target.src = '/logo1.png'; }}
            />
            <div className={`copa-group-badge ${zoomedTeam.grupo}`} style={{ position: 'static', display: 'inline-block', marginBottom: '8px' }}>
              GRUPO {zoomedTeam.grupo}
            </div>
            <h2 className="copa-zoom-title">{zoomedTeam.name}</h2>

            <div className="copa-zoom-players">
              <div style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ROSTER OFICIAL
              </div>
              {zoomedTeam.jugadores?.map((j, i) => (
                <div key={i} className="copa-zoom-player-item">
                  <User size={16} /> {j}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn-v-action"
              style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
              onClick={() => setZoomedTeam(null)}
            >
              CERRAR SPOTLIGHT
            </button>
          </div>
        </div>
      )}

      {/* Modal de Estadísticas, Agentes y K/D/A */}
      {statsMatch && (
        <div 
          className="copa-modal-backdrop" 
          onClick={() => setStatsMatch(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            className="copa-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d1813',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.9)',
              color: '#fff'
            }}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Crosshair size={14} /> Moderación de Estadísticas & K/D/A
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '20px', color: '#fff' }}>
                  {statsMatch.t1?.name} <span style={{ color: '#ff4655', fontSize: '16px' }}>VS</span> {statsMatch.t2?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStatsMatch(null)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Ajustes Generales del Partido */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                  Estado del Encuentro
                </label>
                <select
                  value={statsMatch.status || 'Programado'}
                  onChange={(e) => setStatsMatch({ ...statsMatch, status: e.target.value })}
                  style={{ width: '100%', background: '#091510', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="Programado">Programado</option>
                  <option value="LIVE">🔴 En Directo (LIVE)</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                  Mapa Oficial
                </label>
                <select
                  value={statsMatch.map || 'Ascent'}
                  onChange={(e) => setStatsMatch({ ...statsMatch, map: e.target.value })}
                  style={{ width: '100%', background: '#091510', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                >
                  {MAPS.map((mp) => (
                    <option key={mp} value={mp}>{mp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                  Tanteo ({statsMatch.t1?.name} - {statsMatch.t2?.name})
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={statsMatch.score1 ?? 0}
                    onChange={(e) => setStatsMatch({ ...statsMatch, score1: Number(e.target.value) })}
                    style={{ width: '60px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px', borderRadius: '8px', textAlign: 'center', fontWeight: 700 }}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={statsMatch.score2 ?? 0}
                    onChange={(e) => setStatsMatch({ ...statsMatch, score2: Number(e.target.value) })}
                    style={{ width: '60px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px', borderRadius: '8px', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                  MVP de la Partida
                </label>
                <input
                  type="text"
                  placeholder="Ej: Brrokeen"
                  value={statsMatch.mvp || ''}
                  onChange={(e) => setStatsMatch({ ...statsMatch, mvp: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* SECCIÓN DE ESTADÍSTICAS INDIVIDUALES POR JUGADOR */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: '#00ff88', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crosshair size={16} /> Estadísticas por Jugador (Agente y K / D / A)
              </h4>
              <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#888' }}>
                Asigna el agente jugado por cada participante y anota sus Kills, Muertes y Asistencias para reflejarlas en el perfil de equipo y jugador.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Equipo 1 */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <img src={statsMatch.t1?.logo || '/logo1.png'} alt="" style={{ width: '22px', height: '22px', borderRadius: '4px' }} />
                    <strong style={{ color: '#fff', fontSize: '14px' }}>{statsMatch.t1?.name}</strong>
                  </div>
                  {(statsMatch.playerStats?.t1 || []).map((p, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ccc' }}>{p.name}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={p.agent || 'Jett'}
                          onChange={(e) => {
                            const newT1 = [...statsMatch.playerStats.t1];
                            newT1[pIdx] = { ...newT1[pIdx], agent: e.target.value };
                            setStatsMatch({ ...statsMatch, playerStats: { ...statsMatch.playerStats, t1: newT1 } });
                          }}
                          style={{ flex: 1.5, background: '#091510', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '12px' }}
                        >
                          {VALORANT_AGENTS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="K"
                          title="Kills (Bajas)"
                          value={p.kills}
                          onChange={(e) => {
                            const newT1 = [...statsMatch.playerStats.t1];
                            newT1[pIdx] = { ...newT1[pIdx], kills: Number(e.target.value) };
                            setStatsMatch({ ...statsMatch, playerStats: { ...statsMatch.playerStats, t1: newT1 } });
                          }}
                          style={{ width: '45px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="D"
                          title="Deaths (Muertes)"
                          value={p.deaths}
                          onChange={(e) => {
                            const newT1 = [...statsMatch.playerStats.t1];
                            newT1[pIdx] = { ...newT1[pIdx], deaths: Number(e.target.value) };
                            setStatsMatch({ ...statsMatch, playerStats: { ...statsMatch.playerStats, t1: newT1 } });
                          }}
                          style={{ width: '45px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,70,85,0.3)', color: '#ff4655', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="A"
                          title="Assists (Asistencias)"
                          value={p.assists}
                          onChange={(e) => {
                            const newT1 = [...statsMatch.playerStats.t1];
                            newT1[pIdx] = { ...newT1[pIdx], assists: Number(e.target.value) };
                            setStatsMatch({ ...statsMatch, playerStats: { ...statsMatch.playerStats, t1: newT1 } });
                          }}
                          style={{ width: '45px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Equipo 2 */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <img src={statsMatch.t2?.logo || '/logo2.png'} alt="" style={{ width: '22px', height: '22px', borderRadius: '4px' }} />
                    <strong style={{ color: '#fff', fontSize: '14px' }}>{statsMatch.t2?.name}</strong>
                  </div>
                  {(statsMatch.playerStats?.t2 || []).map((p, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ccc' }}>{p.name}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={p.agent || 'Reyna'}
                          onChange={(e) => {
                            const newT2 = [...statsMatch.playerStats.t2];
                            newT2[pIdx] = { ...newT2[pIdx], agent: e.target.value };
                            setStatsMatch({ ...statsMatch, playerStats: { ...statsMatch.playerStats, t2: newT2 } });
                          }}
                          style={{ flex: 1.5, background: '#091510', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '12px' }}
                        >
                          {VALORANT_AGENTS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="K"
                          title="Kills (Bajas)"
                          value={p.kills}
                          onChange={(e) => {
                            const newT2 = [...statsMatch.playerStats.t2];
                            newT2[pIdx] = { ...newT2[pIdx], kills: Number(e.target.value) };
                            setStatsMatch({ ...statsMatch, playerStats: { ...statsMatch.playerStats, t2: newT2 } });
                          }}
                          style={{ width: '45px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="D"
                          title="Deaths (Muertes)"
                          value={p.deaths}
                          onChange={(e) => {
                            const newT2 = [...statsMatch.playerStats.t2];
                            newT2[pIdx] = { ...newT2[pIdx], deaths: Number(e.target.value) };
                            setStatsMatch({ ...statsMatch, playerStats: { ...statsMatch.playerStats, t2: newT2 } });
                          }}
                          style={{ width: '45px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,70,85,0.3)', color: '#ff4655', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="A"
                          title="Assists (Asistencias)"
                          value={p.assists}
                          onChange={(e) => {
                            const newT2 = [...statsMatch.playerStats.t2];
                            newT2[pIdx] = { ...newT2[pIdx], assists: Number(e.target.value) };
                            setStatsMatch({ ...statsMatch, playerStats: { ...statsMatch.playerStats, t2: newT2 } });
                          }}
                          style={{ width: '45px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <button
                type="button"
                className="btn-v-action"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
                onClick={() => setStatsMatch(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-v-action primary"
                disabled={savingStats}
                onClick={saveStatsModal}
                style={{ minWidth: '160px', justifyContent: 'center' }}
              >
                <Save size={16} />
                {savingStats ? 'Guardando...' : 'GUARDAR STATS'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ConfirmModal para acciones del sorteo y envío a emisión */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmStyle={confirmConfig.confirmStyle}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
      />
    </div>
  );
}

