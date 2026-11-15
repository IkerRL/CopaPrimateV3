import { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Shuffle, Eye, EyeOff, Radio, Save, Play, 
  RotateCcw, Sparkles, User, Award, CheckCircle2, ChevronDown, ChevronRight, Edit3, Crosshair, X, Layers
} from 'lucide-react';
import { apiFetch } from '../api';
import ConfirmModal from './ConfirmModal';
import './copaGrupos.css';
import './overlays/overlayGruposSorteo.css';
import { getTeamTag } from './overlays/OverlayGruposSorteo';

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

const BOMBOS_DATA = [
  {
    bombo: 1,
    title: 'Bombo 1 · Cabezas de Serie',
    color: '#00f5d4',
    teams: [
      { id: 'A1', name: "Thunder Buddies", jugadores: ["Brrokeen", "Pipe"], logo: "/logo3.png" },
      { id: 'B1', name: "Entry Baiters", jugadores: ["レックウザ", "Militantedelsoe"], logo: "/logo5.png" },
      { id: 'C1', name: "Sakura", jugadores: ["Gustavo", "Carlos"], logo: "/logo14.png" },
      { id: 'D1', name: "Primates FC", jugadores: ["Knekro", "IlloJuan"], logo: "/logo12.png" }
    ]
  },
  {
    bombo: 2,
    title: 'Bombo 2',
    color: '#c084fc',
    teams: [
      { id: 'A2', name: "Los Akrtona2", jugadores: ["Kira", "Serax"], logo: "/logo2.png" },
      { id: 'B2', name: "Dream Team", jugadores: ["JoKker", "Pepardo"], logo: "/logo7.png" },
      { id: 'C2', name: "Soul Resonance", jugadores: ["KrypT", "Charly"], logo: "/logo11.png" },
      { id: 'D2', name: "Chimp Squad", jugadores: ["Boaster", "Derke"], logo: "/logo13.png" }
    ]
  },
  {
    bombo: 3,
    title: 'Bombo 3',
    color: '#ff4655',
    teams: [
      { id: 'A3', name: "Chuu-Chuu 100% MAX", jugadores: ["MakaQuillo", "Max"], logo: "/logo8.png" },
      { id: 'B3', name: "Makaco Ninja-Pelocho", jugadores: ["MakacoNinja", "Iker 😎"], logo: "/logo6.png" },
      { id: 'C3', name: "Stranger Picks", jugadores: ["TheDori", "Sotomi"], logo: "/logo9.png" },
      { id: 'D3', name: "Banana Kings", jugadores: ["Maka", "Mixwell"], logo: "/logo15.png" }
    ]
  },
  {
    bombo: 4,
    title: 'Bombo 4',
    color: '#fbbf24',
    teams: [
      { id: 'A4', name: "REHENKARMACIÓN", jugadores: ["Satha", "Makflat"], logo: "/logo1.png" },
      { id: 'B4', name: "Kizuna", jugadores: ["Alezita", "Sarix"], logo: "/logo4.png" },
      { id: 'C4', name: "MARIIKS", jugadores: ["Acid", "Bru"], logo: "/logo10.png" },
      { id: 'D4', name: "Golden Gorillas", jugadores: ["TenZ", "ScreaM"], logo: "/logo10.png" }
    ]
  }
];

// Utilidades de resolución de bombos y grupos
function getTeamPot(teamName) {
  for (const b of BOMBOS_DATA) {
    if (b.teams.some(t => t.name === teamName)) return b.bombo;
  }
  return 1;
}

function getTeamGroup(teamName, currentGrupos) {
  for (const [gKey, list] of Object.entries(currentGrupos || {})) {
    if (Array.isArray(list) && list.some(t => t.name === teamName)) return gKey;
  }
  return 'A';
}

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
      round: `J${jNum}`,
      t1: { name: p.t1.name, logo: p.t1.logo, grupo: p.t1.grupo, bombo: p.t1.bombo || getTeamPot(p.t1.name) },
      t2: { name: p.t2.name, logo: p.t2.logo, grupo: p.t2.grupo, bombo: p.t2.bombo || getTeamPot(p.t2.name) },
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
  const [spotlightTeam, setSpotlightTeam] = useState(null);
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

  const [drawingTeam, setDrawingTeam] = useState(null);
  const [isAutoDrawing, setIsAutoDrawing] = useState(false);
  const autoDrawTimerRef = useRef(null);

  // Milestone 3: Sorteo Champions League State
  const [selectedTeamForDraw, setSelectedTeamForDraw] = useState(null);
  const [drawnTeamNames, setDrawnTeamNames] = useState([]);
  const [championsModalState, setChampionsModalState] = useState(null);
  const championsAnimIntervalRef = useRef(null);
  const championsLastStepRef = useRef(0);

  const broadcastSorteoState = (
    customGrupos = grupos,
    customDrawing = drawingTeam,
    spinning = isSpinningBall,
    customRevealed = revealedTeams,
    phase = activePhase,
    customSpotlight = spotlightTeam,
    customChampionsAnim = championsModalState,
    customDrawnNames = drawnTeamNames
  ) => {
    let computedStandings = [];
    try {
      computedStandings = calcularClasificacion();
    } catch {}

    apiFetch('/overlay-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'sorteo',
        sorteo: {
          activePhase: phase,
          grupos: customGrupos,
          revealedTeams: customRevealed,
          drawingTeam: customDrawing,
          isSpinning: spinning,
          spotlightTeam: customSpotlight,
          zoomedTeam: customSpotlight,
          championsAnimation: customChampionsAnim !== undefined ? customChampionsAnim : null,
          drawnTeamNames: customDrawnNames,
          standings: computedStandings,
          jornadas: jornadas,
        }
      })
    }).catch(() => {});
  };

  const handleSwitchPhase = (phase) => {
    playClickSound();
    setActivePhase(phase);
    broadcastSorteoState(
      grupos,
      drawingTeam,
      isSpinningBall,
      revealedTeams,
      phase,
      spotlightTeam,
      championsModalState,
      drawnTeamNames
    );
  };

  const toggleSpotlightStream = (team) => {
    playClickSound();
    if (spotlightTeam?.name === team?.name) {
      setSpotlightTeam(null);
      broadcastSorteoState(grupos, drawingTeam, isSpinningBall, revealedTeams, activePhase, null);
    } else if (team) {
      const gKey = team.grupo || Object.keys(grupos).find(k => (grupos[k] || []).some(t => t.name === team.name)) || 'A';
      const potIdx = team.bombo || BOMBOS_DATA.find(b => b.teams.some(t => t.name === team.name))?.bombo || ((grupos[gKey] || []).findIndex(t => t.name === team.name) + 1) || 1;
      const target = {
        ...team,
        grupo: gKey,
        bombo: potIdx,
      };
      setSpotlightTeam(target);
      broadcastSorteoState(grupos, drawingTeam, isSpinningBall, revealedTeams, activePhase, target);
    }
  };

  const closeSpotlightStream = () => {
    playClickSound();
    setSpotlightTeam(null);
    broadcastSorteoState(grupos, drawingTeam, isSpinningBall, revealedTeams, activePhase, null);
  };

  const audioCtxRef = useRef(null);

  const playScannerSweepSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'running') {
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
      }
    } catch {}
  };

  const playLockInChimeSound = (stepIndex) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'running') {
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
      }
    } catch {}
  };

  // Helper para resolver los 4 enfrentamientos deterministas de un equipo
  const resolveTeamMatchups = (targetTeam, currentGrupos = grupos, currentJornadas = jornadas) => {
    let activeJornadas = currentJornadas;
    if (!activeJornadas || activeJornadas.length !== 4 || !activeJornadas[0] || activeJornadas[0].length !== 8) {
      activeJornadas = generarCalendarioLiga(currentGrupos);
    }

    const tNameNorm = String(targetTeam?.name || '').toLowerCase().trim();
    const matchups = [];

    for (let jIdx = 0; jIdx < 4; jIdx++) {
      const jNum = jIdx + 1;
      const jMatches = activeJornadas[jIdx] || [];
      const match = jMatches.find(m => {
        const n1 = String(m?.t1?.name || '').toLowerCase().trim();
        const n2 = String(m?.t2?.name || '').toLowerCase().trim();
        return n1 === tNameNorm || n2 === tNameNorm;
      });

      if (match) {
        const isT1 = String(match?.t1?.name || '').toLowerCase().trim() === tNameNorm;
        const oppRaw = isT1 ? match.t2 : match.t1;
        const oppName = oppRaw?.name || `Rival J${jNum}`;
        const oppLogo = oppRaw?.logo || '/copa-logo.png';
        const oppGrupo = oppRaw?.grupo || getTeamGroup(oppName, currentGrupos);
        const oppBombo = oppRaw?.bombo || getTeamPot(oppName);

        matchups.push({
          jornada: jNum,
          opponent: {
            name: oppName,
            logo: oppLogo,
            grupo: oppGrupo,
            bombo: oppBombo,
          },
          rival: oppName,
          logo: oppLogo,
          grupo: oppGrupo,
          bombo: oppBombo,
        });
      } else {
        matchups.push({
          jornada: jNum,
          opponent: {
            name: `Rival J${jNum}`,
            logo: '/copa-logo.png',
            grupo: 'A',
            bombo: jNum,
          },
          rival: `Rival J${jNum}`,
          logo: '/copa-logo.png',
          grupo: 'A',
          bombo: jNum,
        });
      }
    }

    return matchups;
  };

  // Disparador del Sorteo Champions League interactivo y sincronizado
  const triggerChampionsSorteo = (team) => {
    if (!team) return;
    playClickSound();

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    let activeJornadas = jornadas;
    if (!activeJornadas || activeJornadas.length !== 4 || !activeJornadas[0] || activeJornadas[0].length !== 8) {
      activeJornadas = generarCalendarioLiga(grupos);
      setJornadas(activeJornadas);
      saveLigaState(activeJornadas);
    }

    const tGrupo = team.grupo || getTeamGroup(team.name, grupos);
    const tBombo = team.bombo || getTeamPot(team.name);
    const teamFull = { ...team, grupo: tGrupo, bombo: tBombo };

    const matchups = resolveTeamMatchups(teamFull, grupos, activeJornadas);

    const animId = Date.now();
    const startedAt = Date.now();
    const stepDuration = 1600;

    const initialAnim = {
      animId,
      status: 'running',
      active: true,
      team: {
        name: teamFull.name,
        logo: teamFull.logo || '/copa-logo.png',
        grupo: tGrupo,
        bombo: tBombo,
      },
      matchups,
      revealedMatchups: [matchups[0]],
      revealedCount: 1,
      step: 1,
      startedAt,
      stepDuration,
    };

    setChampionsModalState(initialAnim);
    setDrawingTeam(teamFull);
    championsLastStepRef.current = 1;
    playLockInChimeSound(1);

    const nextDrawn = drawnTeamNames.includes(team.name) ? drawnTeamNames : [...drawnTeamNames, team.name];
    setDrawnTeamNames(nextDrawn);

    const nextRevealed = Array.from(new Set([...revealedTeams, team.name, matchups[0].opponent.name]));
    setRevealedTeams(nextRevealed);

    broadcastSorteoState(grupos, teamFull, false, nextRevealed, activePhase, spotlightTeam, initialAnim, nextDrawn);

    if (championsAnimIntervalRef.current) clearInterval(championsAnimIntervalRef.current);

    championsAnimIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const currentStep = Math.min(4, Math.max(1, Math.floor(elapsed / stepDuration) + 1));
      const isComplete = elapsed >= stepDuration * 4;

      if (currentStep > championsLastStepRef.current) {
        championsLastStepRef.current = currentStep;
        playLockInChimeSound(currentStep);

        const currentOppNames = matchups.slice(0, currentStep).map(m => m.opponent.name);
        const updatedRevealed = Array.from(new Set([...revealedTeams, team.name, ...currentOppNames]));
        setRevealedTeams(updatedRevealed);

        const updatedAnim = {
          ...initialAnim,
          status: isComplete ? 'completed' : 'running',
          revealedCount: currentStep,
          step: currentStep,
          revealedMatchups: matchups.slice(0, currentStep),
        };

        setChampionsModalState(updatedAnim);
        broadcastSorteoState(grupos, teamFull, false, updatedRevealed, activePhase, spotlightTeam, updatedAnim, nextDrawn);
      }

      if (isComplete) {
        clearInterval(championsAnimIntervalRef.current);
        championsAnimIntervalRef.current = null;

        const allOppNames = matchups.map(m => m.opponent.name);
        const finalRevealed = Array.from(new Set([...revealedTeams, team.name, ...allOppNames]));
        setRevealedTeams(finalRevealed);

        const completedAnim = {
          ...initialAnim,
          status: 'completed',
          active: false,
          revealedCount: 4,
          step: 4,
          revealedMatchups: matchups,
        };

        setChampionsModalState(completedAnim);
        broadcastSorteoState(grupos, teamFull, false, finalRevealed, activePhase, spotlightTeam, completedAnim, nextDrawn);
      }
    }, 100);
  };

  const dismissChampionsModal = () => {
    playClickSound();
    if (championsAnimIntervalRef.current) {
      clearInterval(championsAnimIntervalRef.current);
      championsAnimIntervalRef.current = null;
    }
    setChampionsModalState(null);
    broadcastSorteoState(grupos, drawingTeam, isSpinningBall, revealedTeams, activePhase, spotlightTeam, null, drawnTeamNames);
  };

  // Cargar estado inicial desde servidor o inicializar
  useEffect(() => {
    fetchLigaState();
  }, []);

  // Cleanup de intervalos y audio en desmontaje
  useEffect(() => {
    return () => {
      if (championsAnimIntervalRef.current) {
        clearInterval(championsAnimIntervalRef.current);
        championsAnimIntervalRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
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
      const [resMatches, resOverlay] = await Promise.all([
        apiFetch('/matches').catch(() => null),
        apiFetch('/overlay-state').catch(() => null),
      ]);

      if (resMatches && resMatches.ok) {
        const data = await resMatches.json();
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

      if (resOverlay && resOverlay.ok) {
        const oData = await resOverlay.json();
        if (oData && oData.sorteo) {
          if (Array.isArray(oData.sorteo.revealedTeams)) {
            setRevealedTeams(oData.sorteo.revealedTeams);
          }
          const activeSpot = oData.sorteo.spotlightTeam !== undefined
            ? oData.sorteo.spotlightTeam
            : (oData.sorteo.zoomedTeam !== undefined ? oData.sorteo.zoomedTeam : null);
          if (activeSpot) {
            setSpotlightTeam(activeSpot);
          }
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
    setRevealedTeams(prev => {
      const updated = prev.includes(teamName) ? prev.filter(t => t !== teamName) : [...prev, teamName];
      broadcastSorteoState(grupos, drawingTeam, isSpinningBall, updated, activePhase, spotlightTeam);
      return updated;
    });
  };

  const revealAll = () => {
    playClickSound();
    const allNames = Object.values(grupos).flat().map(t => t.name);
    setRevealedTeams(allNames);
    broadcastSorteoState(grupos, drawingTeam, isSpinningBall, allNames, activePhase, spotlightTeam);
  };

  const hideAll = () => {
    playClickSound();
    setRevealedTeams([]);
    broadcastSorteoState(grupos, drawingTeam, isSpinningBall, [], activePhase, spotlightTeam);
  };

  // Extraer una bola de forma individual
  const extraerSiguienteBola = () => {
    if (isSpinningBall) return;
    const currentTeams = Object.values(grupos).flat();
    const count = currentTeams.length;
    if (count >= 16) {
      alert('¡El sorteo ya está completo con los 16 equipos asignados!');
      return;
    }

    playClickSound();
    setIsSpinningBall(true);
    broadcastSorteoState(grupos, null, true);

    const potIdx = Math.floor(count / 4);
    const targetGroup = ['A', 'B', 'C', 'D'][count % 4];
    const potTeams = BOMBOS_DATA[potIdx].teams;
    const available = potTeams.filter(t => !currentTeams.some(c => c.name === t.name));
    const chosen = available[Math.floor(Math.random() * available.length)];
    const teamWithGroup = { ...chosen, grupo: targetGroup, id: `${targetGroup}${potIdx + 1}` };

    setTimeout(() => {
      setIsSpinningBall(false);
      setDrawingTeam({ ...teamWithGroup, targetGroup });
      const nextGrupos = {
        ...grupos,
        [targetGroup]: [...(grupos[targetGroup] || []), teamWithGroup]
      };
      setGrupos(nextGrupos);
      const nextRevealed = [...revealedTeams, chosen.name];
      setRevealedTeams(nextRevealed);

      if (count + 1 === 16) {
        const cal = generarCalendarioLiga(nextGrupos);
        setJornadas(cal);
        saveLigaState(cal);
      }

      broadcastSorteoState(nextGrupos, { ...teamWithGroup, targetGroup }, false, nextRevealed);
    }, 900);
  };

  // Sorteo Automático Paso a Paso
  const toggleSorteoAutomatico = () => {
    if (isAutoDrawing) {
      if (autoDrawTimerRef.current) clearInterval(autoDrawTimerRef.current);
      setIsAutoDrawing(false);
      return;
    }

    const currentTeams = Object.values(grupos).flat();
    let localGrupos = currentTeams.length >= 16 ? { A: [], B: [], C: [], D: [] } : { ...grupos };
    if (currentTeams.length >= 16) {
      setGrupos(localGrupos);
      setRevealedTeams([]);
    }

    setIsAutoDrawing(true);
    autoDrawTimerRef.current = setInterval(() => {
      const allAssigned = Object.values(localGrupos).flat();
      if (allAssigned.length >= 16) {
        clearInterval(autoDrawTimerRef.current);
        setIsAutoDrawing(false);
        return;
      }

      const potIdx = Math.floor(allAssigned.length / 4);
      const targetGroup = ['A', 'B', 'C', 'D'][allAssigned.length % 4];
      const available = BOMBOS_DATA[potIdx].teams.filter(t => !allAssigned.some(c => c.name === t.name));
      const chosen = available[Math.floor(Math.random() * available.length)];
      const teamWithGroup = { ...chosen, grupo: targetGroup, id: `${targetGroup}${potIdx + 1}` };

      localGrupos = {
        ...localGrupos,
        [targetGroup]: [...(localGrupos[targetGroup] || []), teamWithGroup]
      };
      setGrupos(localGrupos);
      setDrawingTeam({ ...teamWithGroup, targetGroup });
      setRevealedTeams(prev => [...prev, chosen.name]);

      if (allAssigned.length + 1 === 16) {
        const cal = generarCalendarioLiga(localGrupos);
        setJornadas(cal);
        saveLigaState(cal);
        clearInterval(autoDrawTimerRef.current);
        setIsAutoDrawing(false);
      }

      broadcastSorteoState(localGrupos, { ...teamWithGroup, targetGroup }, false);
    }, 1100);
  };

  // Reiniciar Sorteo a 0
  const reiniciarSorteo = () => {
    if (autoDrawTimerRef.current) clearInterval(autoDrawTimerRef.current);
    if (championsAnimIntervalRef.current) clearInterval(championsAnimIntervalRef.current);
    setIsAutoDrawing(false);
    setIsSpinningBall(false);
    setDrawingTeam(null);
    setChampionsModalState(null);
    setSelectedTeamForDraw(null);
    setDrawnTeamNames([]);
    // Los grupos A, B, C y D representan los niveles predefinidos (no se borran ni vacían)
    const baseGrupos = (grupos && Object.keys(grupos).length === 4 && Object.values(grupos).flat().length === 16)
      ? grupos
      : DEFAULT_GRUPOS;
    setGrupos(baseGrupos);
    const allNames = Object.values(baseGrupos).flat().map(t => t.name);
    setRevealedTeams(allNames);
    const cleanCalendario = generarCalendarioLiga(baseGrupos);
    setJornadas(cleanCalendario);
    saveLigaState(cleanCalendario);
    broadcastSorteoState(baseGrupos, null, false, allNames, activePhase, null, null, []);
  };

  // Sorteo instantáneo de todos los enfrentamientos de Liga
  const ejecutarSorteoInstantaneo = () => {
    playClickSound();
    if (autoDrawTimerRef.current) clearInterval(autoDrawTimerRef.current);
    if (championsAnimIntervalRef.current) clearInterval(championsAnimIntervalRef.current);
    setIsAutoDrawing(false);
    setIsSpinningBall(false);

    // Los grupos A, B, C y D representan los niveles y se mantienen intactos
    const activeGrupos = (grupos && Object.keys(grupos).length === 4 && Object.values(grupos).flat().length === 16)
      ? grupos
      : DEFAULT_GRUPOS;

    const nuevoCalendario = generarCalendarioLiga(activeGrupos);
    setGrupos(activeGrupos);
    setJornadas(nuevoCalendario);
    setDrawingTeam(null);
    setChampionsModalState(null);
    const allNames = Object.values(activeGrupos).flat().map(t => t.name);
    setRevealedTeams(allNames);
    setDrawnTeamNames(allNames);
    saveLigaState(nuevoCalendario);
    broadcastSorteoState(activeGrupos, null, false, allNames, activePhase, null, null, allNames);
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
          <img src="/monito-izq.png" className="copa-sticker-monkey" alt="Mono izq" onClick={playClickSound} />
          <h2 className="copa-vol-text">VOL. III</h2>
          <img src="/monito-der.png" className="copa-sticker-monkey" alt="Mono der" onClick={playClickSound} />
        </div>
      </header>

      {/* SELECTOR DE PANTALLAS / FASES (EMITE EN TIEMPO REAL A OBS) */}
      <nav className="copa-phase-nav">
        <button
          type="button"
          className={`copa-phase-btn ${activePhase === 'presentacion' ? 'active' : ''}`}
          onClick={() => handleSwitchPhase('presentacion')}
        >
          <Eye size={16} /> 1. PRESENTACIÓN (GRUPOS)
        </button>

        <button
          type="button"
          className={`copa-phase-btn ${activePhase === 'sorteo' ? 'active' : ''}`}
          onClick={() => handleSwitchPhase('sorteo')}
        >
          <Shuffle size={16} /> 2. SORTEO (CHAMPIONS)
        </button>

        <button
          type="button"
          className={`copa-phase-btn ${activePhase === 'clasificacion' ? 'active' : ''}`}
          onClick={() => handleSwitchPhase('clasificacion')}
        >
          <Trophy size={16} /> 3. CLASIFICACIÓN
        </button>

        <button
          type="button"
          className={`copa-phase-btn ${(activePhase === 'jornadas' || activePhase === 'liga') ? 'active' : ''}`}
          onClick={() => handleSwitchPhase('jornadas')}
        >
          <Layers size={16} /> 4. JORNADAS (32 PARTIDOS)
        </button>
      </nav>

      {/* BANNER DE ZOOM STREAM OBS ACTIVO */}
      {spotlightTeam && (
        <div className="copa-spotlight-active-banner">
          <div className="copa-spotlight-banner-left">
            <span className="copa-spotlight-pulse-dot" />
            <span className="copa-spotlight-banner-title">
              🔴 ZOOM STREAM ACTIVO: <strong className="copa-spotlight-banner-team">{spotlightTeam.name}</strong>
              {spotlightTeam.grupo ? ` (GRUPO ${spotlightTeam.grupo})` : ''}
              {spotlightTeam.bombo ? ` · BOMBO ${spotlightTeam.bombo}` : ''}
            </span>
          </div>
          <button
            type="button"
            className="copa-btn-close-spotlight"
            onClick={closeSpotlightStream}
          >
            <X size={15} /> CERRAR ZOOM STREAM
          </button>
        </div>
      )}

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
                  const isSpotlight = spotlightTeam?.name === team.name;
                  return (
                    <div
                      key={team.id || team.name}
                      className={`copa-team-card ${isRevealed ? 'revealed' : ''} ${isSpotlight ? 'spotlight-active' : ''}`}
                      onClick={() => toggleReveal(team.name)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setZoomedTeam(team);
                      }}
                    >
                      <div className="copa-card-actions">
                        <button
                          type="button"
                          className={`copa-card-btn copa-card-btn-reveal ${isRevealed ? 'active' : ''}`}
                          title={isRevealed ? "Ocultar en stream (Eye)" : "Revelar en stream (Eye)"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReveal(team.name);
                          }}
                        >
                          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          className={`copa-card-btn copa-card-btn-zoom ${isSpotlight ? 'active' : ''}`}
                          title={isSpotlight ? "Quitar Zoom Stream" : "Zoom Stream OBS"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSpotlightStream(team);
                          }}
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>

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
          FASE 2: SORTEO OFICIAL DE LA FASE DE LIGA (SISTEMA DE BOMBOS)
          ========================================================= */}
      {activePhase === 'sorteo' && (() => {
        const allAssigned = Object.values(grupos).flat();
        const totalCount = allAssigned.length;
        const currentPotIdx = Math.min(3, Math.floor(totalCount / 4));
        const nextGroup = totalCount < 16 ? ['A', 'B', 'C', 'D'][totalCount % 4] : 'COMPLETO';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* PANEL DE CONTROL UNIFICADO DEL SORTEO DE ENFRENTAMIENTOS */}
            <div className="copa-sorteo-box" style={{
              background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.95), rgba(10, 14, 24, 0.98))',
              border: '1.5px solid #00f5d4',
              borderRadius: '16px',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 8px 30px rgba(0, 245, 212, 0.15)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--omen-cyan)', letterSpacing: '2px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shuffle size={22} color="var(--omen-cyan)" /> SORTEO DE ENFRENTAMIENTOS DE LIGA (FORMATO CHAMPIONS)
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>
                    Los 16 equipos están organizados por nivel (Grupos A, B, C, D). Sortea en directo los 4 rivales que enfrentará cada equipo.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(0, 245, 212, 0.15)', border: '1px solid #00f5d4', padding: '6px 14px', borderRadius: '8px', color: '#00f5d4', fontWeight: 900, fontSize: '0.82rem', letterSpacing: '1px' }}>
                    SORTEADOS: {drawnTeamNames.length} / 16
                  </div>
                  <div style={{ background: 'rgba(192, 132, 252, 0.15)', border: '1px solid #c084fc', padding: '6px 14px', borderRadius: '8px', color: '#c084fc', fontWeight: 900, fontSize: '0.82rem', letterSpacing: '1px' }}>
                    PARTIDOS: 32 (J1 a J4)
                  </div>
                </div>
              </div>

              {/* SELECTOR LIBRE Y BOTONERA */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedTeamForDraw?.name || ''}
                  onChange={(e) => {
                    const allTeams = Object.entries(grupos).flatMap(([gKey, list]) => (list || []).map(t => ({ ...t, grupo: gKey, bombo: getTeamPot(t.name) })));
                    const found = allTeams.find(t => t.name === e.target.value);
                    if (found) setSelectedTeamForDraw(found);
                  }}
                  style={{
                    flex: '1 1 280px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    color: '#fff',
                    border: '1.5px solid rgba(0, 245, 212, 0.4)',
                    borderRadius: '8px',
                    padding: '11px 14px',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                  }}
                >
                  <option value="">-- Elige un equipo para sortear sus 4 rivales --</option>
                  {Object.entries(grupos).flatMap(([gKey, list]) => (list || []).map(t => ({ ...t, grupo: gKey }))).map(t => {
                    const isDrawn = drawnTeamNames.includes(t.name);
                    return (
                      <option key={t.name} value={t.name}>
                        {isDrawn ? '✓ ' : '○ '} [Grupo {t.grupo}] {t.name}
                      </option>
                    );
                  })}
                </select>

                <button
                  type="button"
                  className="btn-v-action"
                  disabled={!selectedTeamForDraw}
                  onClick={() => selectedTeamForDraw && triggerChampionsSorteo(selectedTeamForDraw)}
                  style={{
                    background: 'linear-gradient(135deg, #00f5d4 0%, #0284c7 100%)',
                    color: '#08080b',
                    borderColor: '#00f5d4',
                    fontWeight: 900,
                    padding: '11px 22px',
                    fontSize: '0.92rem',
                  }}
                >
                  <Sparkles size={16} /> SORTEAR RIVALES EN STREAM {selectedTeamForDraw ? `(${selectedTeamForDraw.name})` : ''}
                </button>

                <button
                  type="button"
                  className="btn-v-secondary"
                  onClick={ejecutarSorteoInstantaneo}
                  style={{ fontWeight: 800, padding: '11px 18px' }}
                >
                  <Play size={16} /> SORTEAR TODOS AUTOMÁTICO
                </button>

                <button
                  type="button"
                  className="btn-v-secondary"
                  onClick={reiniciarSorteo}
                  style={{ borderColor: '#ff4655', color: '#ff4655', fontWeight: 800, padding: '11px 18px' }}
                >
                  <RotateCcw size={16} /> REINICIAR SORTEO
                </button>

                <button
                  type="button"
                  className="btn-v-secondary"
                  onClick={() => handleSwitchPhase('clasificacion')}
                  style={{ borderColor: '#c084fc', color: '#c084fc', fontWeight: 800, padding: '11px 18px' }}
                >
                  <Trophy size={16} /> VER CLASIFICACIÓN →
                </button>
              </div>
            </div>

            {/* VISTA DE LOS 4 BOMBOS OFICIALES */}
            <div>
              <h4 style={{ fontSize: '1rem', color: '#fff', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--omen-cyan)" /> BOMBOS DEL SORTEO OFICIAL (16 EQUIPOS)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {BOMBOS_DATA.map((b) => (
                  <div
                    key={b.bombo}
                    style={{
                      background: 'rgba(12, 16, 26, 0.7)',
                      border: `1.5px solid ${b.color}55`,
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <span style={{ color: b.color, fontWeight: 900, fontSize: '0.85rem', letterSpacing: '1px' }}>
                        {b.title}
                      </span>
                      <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 800 }}>
                        {b.teams.filter(t => drawnTeamNames.includes(t.name) || allAssigned.some(a => a.name === t.name)).length}/4
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {b.teams.map((t) => {
                        const isDrawn = drawnTeamNames.includes(t.name) || allAssigned.some((a) => a.name === t.name);
                        const assignedTo = t.grupo || getTeamGroup(t.name, grupos) || allAssigned.find((a) => a.name === t.name)?.grupo;
                        return (
                          <div
                            key={t.name}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: isDrawn ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.04)',
                              border: isDrawn ? '1px solid rgba(0,245,212,0.3)' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              opacity: isDrawn ? 0.75 : 1,
                              transition: 'all 0.25s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              <img src={t.logo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/logo1.png'; }} />
                              <span style={{ fontSize: '12px', fontWeight: 800, color: isDrawn ? '#00f5d4' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.name}
                              </span>
                            </div>
                            {isDrawn ? (
                              <span style={{ fontSize: '10px', fontWeight: 900, color: '#00f5d4' }}>
                                ✓ G-{assignedTo}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn-v-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTeamForDraw(t);
                                  triggerChampionsSorteo(t);
                                }}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  background: 'rgba(0, 245, 212, 0.15)',
                                  borderColor: '#00f5d4',
                                  color: '#00f5d4',
                                  fontWeight: 900,
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                title={`Sortear rivales de ${t.name}`}
                              >
                                SORTEAR
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RESULTADO EN VIVO DE LOS 4 GRUPOS */}
            <div>
              <h4 style={{ fontSize: '1rem', color: '#fff', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} color="#c084fc" /> ESTADO EN VIVO DE LOS GRUPOS (EMISIÓN OBS)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {['A', 'B', 'C', 'D'].map((gKey) => {
                  const tList = grupos[gKey] || [];
                  return (
                    <div
                      key={gKey}
                      className={`copa-group-col ${gKey}`}
                      style={{ padding: '14px', borderRadius: '12px' }}
                    >
                      <div className="copa-group-header">
                        <h4 className="copa-group-title" style={{ fontSize: '1.1rem' }}>GRUPO {gKey}</h4>
                        <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 800 }}>{tList.length}/4</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                        {[0, 1, 2, 3].map((slotIdx) => {
                          const team = tList[slotIdx];
                          return (
                            <div
                              key={slotIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: team ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.02)',
                                border: team ? '1px solid rgba(192, 132, 252, 0.3)' : '1px dashed rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                minHeight: '36px',
                              }}
                            >
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 900 }}>#{slotIdx + 1}</span>
                              {team ? (
                                <>
                                  <img src={team.logo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/logo1.png'; }} />
                                  <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {team.name}
                                  </span>
                                </>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Por sortear...</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================
          FASE 3 & 4: CLASIFICACIÓN GENERAL Y JORNADAS
          ========================================================= */}
      {(activePhase === 'clasificacion' || activePhase === 'jornadas' || activePhase === 'liga') && (
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
                onClick={() => handleSwitchPhase('sorteo')}
              >
                <RotateCcw size={16} /> VOLVER AL SORTEO
              </button>

              <button
                type="button"
                className="btn-v-secondary"
                style={{ borderColor: '#00f5d4', color: '#00f5d4', fontWeight: 800 }}
                onClick={() => handleSwitchPhase(activePhase === 'clasificacion' ? 'clasificacion' : 'jornadas')}
              >
                <Eye size={16} /> EMITIR EN OBS
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
              🟢 1º-4º Cuartos Directos · 🟡 5º-12º Playoffs · 🔴 13º-16º Eliminados
            </div>
          </div>

          <div className="copa-liga-split" style={{
            display: 'grid',
            gridTemplateColumns: activePhase === 'clasificacion' ? '1fr' : activePhase === 'jornadas' ? '1fr' : '1fr 1fr',
            gap: '20px'
          }}>
            {/* TABLA DE CLASIFICACIÓN */}
            {(activePhase === 'clasificacion' || activePhase === 'liga') && (
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
            )}

            {/* ACORDEÓN DE JORNADAS */}
            {(activePhase === 'jornadas' || activePhase === 'liga') && (
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
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL CHAMPIONS LEAGUE SORTEO HUD (MILESTONE 3 / R2)
          ========================================================= */}
      {championsModalState && (
        <div className="champions-draw-modal" style={{ zIndex: 1100 }} onClick={dismissChampionsModal}>
          <div className="champions-hud-container" onClick={(e) => e.stopPropagation()}>
            <div className="champions-hud-header">
              <div className="champions-hud-title-wrap">
                <span className="champions-stars-icon">⭐</span>
                <div>
                  <div className="champions-hud-subtitle">CHAMPIONS LEAGUE // PANEL DE SORTEO EN VIVO</div>
                  <h2 className="champions-hud-title">COPA PRIMATE DRAW SYSTEM</h2>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className={`champions-status-badge ${championsModalState.status === 'completed' ? 'completed' : 'running'}`}>
                  <span className="spotlight-live-dot" />
                  {championsModalState.status === 'completed' ? 'SORTEO FINALIZADO' : 'ESCANEANDO RIVALES...'}
                </div>
                <button
                  type="button"
                  className="btn-v-secondary"
                  onClick={dismissChampionsModal}
                  style={{
                    background: 'rgba(255, 70, 85, 0.2)',
                    borderColor: '#ff4655',
                    color: '#fff',
                    fontWeight: 900,
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                  }}
                >
                  <X size={16} /> CERRAR
                </button>
              </div>
            </div>

            {/* Banner del equipo seleccionado */}
            <div className="champions-selected-team-banner">
              <div className="shield-halo" />
              <div className="champions-team-main-col">
                <div className="champions-team-logo-wrap">
                  <img
                    src={championsModalState.team?.logo || '/copa-logo.png'}
                    alt={championsModalState.team?.name}
                    className="champions-team-logo"
                    onError={(e) => { e.target.src = '/copa-logo.png'; }}
                  />
                </div>
                <div className="champions-team-info-col">
                  <span className="champions-team-tag">{getTeamTag(championsModalState.team?.name)}</span>
                  <h3 className="champions-team-name">{championsModalState.team?.name}</h3>
                </div>
              </div>
              <div className="champions-team-badges-col">
                <span className="champions-pot-pill">BOMBO {championsModalState.team?.bombo || 1}</span>
                <span className="champions-group-pill">GRUPO {championsModalState.team?.grupo || 'A'}</span>
              </div>
            </div>

            {/* 4 Matchups Grid */}
            <div className="champions-matchups-grid">
              {[1, 2, 3, 4].map((jNum) => {
                const currentStep = championsModalState.revealedCount || championsModalState.step || (championsModalState.status === 'completed' ? 4 : 1);
                const isComplete = championsModalState.status === 'completed';
                const matchItem = championsModalState.matchups?.find(m => Number(m.jornada) === jNum) || championsModalState.matchups?.[jNum - 1];
                const opp = matchItem?.opponent;
                const isRevealed = jNum <= currentStep && opp;
                const isScanning = jNum === currentStep + 1 && !isComplete;
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

            {/* Footer */}
            <div className="champions-hud-footer">
              <span className="champions-hud-engine-note">
                SORTEO DETERMINISTA SIN COLISIONES · 32 PARTIDOS EN CALENDARIO
              </span>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <span className="champions-hud-progress-text">
                  {(championsModalState.revealedCount || championsModalState.step || (championsModalState.status === 'completed' ? 4 : 1))} / 4 RIVALES REVELADOS
                </span>
                <button
                  type="button"
                  className="btn-v-action"
                  onClick={dismissChampionsModal}
                  style={{
                    background: 'linear-gradient(135deg, #00f5d4 0%, #0284c7 100%)',
                    color: '#08080b',
                    fontWeight: 900,
                    padding: '8px 18px',
                    fontSize: '0.85rem',
                  }}
                >
                  CONTINUAR SORTEO →
                </button>
              </div>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', width: '100%' }}>
              <button
                type="button"
                className="btn-v-action"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: spotlightTeam?.name === zoomedTeam.name 
                    ? 'linear-gradient(135deg, #ff4655, #b91c1c)' 
                    : 'linear-gradient(135deg, #00f5d4, #00b4d8)',
                  borderColor: spotlightTeam?.name === zoomedTeam.name ? '#ff4655' : '#00f5d4',
                  color: spotlightTeam?.name === zoomedTeam.name ? '#fff' : '#08080b',
                  fontWeight: 900
                }}
                onClick={() => toggleSpotlightStream(zoomedTeam)}
              >
                {spotlightTeam?.name === zoomedTeam.name ? (
                  <>🔴 QUITAR DE STREAM OBS</>
                ) : (
                  <>📡 MOSTRAR EN STREAM (ZOOM OBS)</>
                )}
              </button>

              <button
                type="button"
                className="btn-v-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setZoomedTeam(null)}
              >
                CERRAR SPOTLIGHT
              </button>
            </div>
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

