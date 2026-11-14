import { useState, useEffect, useRef } from 'react';
import { 
  Radio, Tv, ExternalLink, Layers, 
  RotateCcw, AlertTriangle, X
} from 'lucide-react';
import { apiFetch } from '../api';
import ConfirmModal from './ConfirmModal';
import './overlays/marcador.css';

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

const STATUSES = [
  { id: 'LIVE', label: '🔴 EN VIVO', color: '#ff4655' },
  { id: 'PAUSA', label: '⏸️ PAUSA TÉCNICA', color: '#ffb300' },
  { id: 'FINALIZADO', label: '🏁 FINALIZADO', color: '#00ff88' },
  { id: 'PENDIENTE', label: '⏳ PROGRAMADO', color: '#a6a6a6' },
];

const OVERLAY_SCENES = [
  { id: 'scoreboard', label: 'Marcador HUD' },
  { id: 'matchup', label: '⚔️ Previa Versus' },
  { id: 'roulette', label: '🎰 Ruleta Mapas' },
  { id: 'ticker', label: '📰 Ticker Noticias' },
  { id: 'hidden', label: '🙈 Ocultar Todo' },
];

export default function Scoreboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedOverlay, setCopiedOverlay] = useState(false);
  const [copiedLive, setCopiedLive] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [activeOverlayMode, setActiveOverlayMode] = useState('scoreboard');
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    confirmStyle: 'danger',
    onConfirm: null,
  });
  const firstRender = useRef(true);

  const [matchData, setMatchData] = useState({
    active: true,
    status: 'LIVE',
    team1: { name: 'Los Monos', logo: '/logo1.png', score: 11, mapsWon: 1, side: 'DEFENSOR' },
    team2: { name: 'Gorilas', logo: '/logo2.png', score: 9, mapsWon: 0, side: 'ATACANTE' },
    map: 'Ascent',
    round: 20,
    format: 'BO3',
    side: 'DEF vs ATK',
    mvp: 'TenZ#NA1',
    notes: 'Ronda 20: Compra completa. Defensa en A.',
  });

  // URLs de overlays para OBS
  const obsOrigin = window.location.origin.replace(':5174', ':5173');
  const overlayScoreboardUrl = `${obsOrigin}/overlay/scoreboard`;
  const overlayLiveUrl = `${obsOrigin}/overlay/live`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'live') {
      setCopiedLive(true);
      setTimeout(() => setCopiedLive(false), 2500);
    } else {
      setCopiedOverlay(true);
      setTimeout(() => setCopiedOverlay(false), 2500);
    }
  };

  // Auto-sincronización con OBS cuando cambia el tanteo
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!autoSync) return;

    const timer = setTimeout(async () => {
      try {
        await apiFetch(`/live-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match: matchData })
        });
      } catch (err) {
        console.error('Error auto-syncing overlay:', err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [matchData, autoSync]);

  useEffect(() => {
    fetchTeams();
    fetchLiveMatch();
    fetchOverlayMode();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await apiFetch(`/teams`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLiveMatch = async () => {
    try {
      const res = await apiFetch(`/live-match`);
      const data = await res.json();
      if (data.match) {
        setMatchData({
          ...data.match,
          team1: {
            ...data.match.team1,
            logo: data.match.team1?.logo || '/logo1.png',
            mapsWon: data.match.team1?.mapsWon || 0,
            side: data.match.team1?.side || 'DEFENSOR',
          },
          team2: {
            ...data.match.team2,
            logo: data.match.team2?.logo || '/logo2.png',
            mapsWon: data.match.team2?.mapsWon || 0,
            side: data.match.team2?.side || 'ATACANTE',
          },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOverlayMode = async () => {
    try {
      const res = await apiFetch(`/overlay-state`);
      const data = await res.json();
      if (data?.mode) {
        setActiveOverlayMode(data.mode);
      }
    } catch {}
  };

  const handleSetOverlayMode = async (mode) => {
    setActiveOverlayMode(mode);
    try {
      await apiFetch(`/overlay-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      setFeedback({ type: 'success', text: `🎬 Escena activa en OBS cambiada a: ${mode.toUpperCase()}` });
    } catch {
      setFeedback({ type: 'error', text: 'Error al cambiar la escena en OBS' });
    }
  };

  // Cambio de rondas desacoplado de wipe automático
  const handleScoreChange = (teamKey, delta) => {
    setMatchData(prev => {
      const currentScore = prev[teamKey]?.score || 0;
      const nextScore = Math.max(0, currentScore + delta);
      const otherTeamKey = teamKey === 'team1' ? 'team2' : 'team1';
      const otherScore = prev[otherTeamKey]?.score || 0;
      const totalRounds = nextScore + otherScore;

      return {
        ...prev,
        round: totalRounds,
        [teamKey]: {
          ...prev[teamKey],
          score: nextScore
        }
      };
    });
  };

  // Cambio manual de mapas ganados (+1 / -1)
  const handleBananaChange = (teamKey, delta) => {
    setMatchData(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        mapsWon: Math.max(0, Math.min(3, (prev[teamKey]?.mapsWon || 0) + delta))
      }
    }));
  };

  // Otorgar victoria de mapa con confirmación
  const requestAwardMap = (teamKey) => {
    const winnerName = matchData[teamKey]?.name || (teamKey === 'team1' ? 'Equipo Izquierda' : 'Equipo Derecha');
    setConfirmConfig({
      isOpen: true,
      title: '🏆 ¿Confirmar Victoria de Mapa?',
      message: `¿Declarar a ${winnerName} ganador de este mapa? Se sumará +1 mapa ganado y el tanteo de rondas volverá a 0 - 0.`,
      confirmText: 'Confirmar Victoria de Mapa',
      confirmStyle: 'success',
      onConfirm: () => {
        setMatchData(prev => {
          const format = (prev.format || 'BO3').toUpperCase();
          const maxMaps = format === 'BO5' ? 3 : format === 'BO1' ? 1 : 2;
          const currentMapsWon = prev[teamKey]?.mapsWon || 0;
          const newMapsWon = Math.min(maxMaps, currentMapsWon + 1);

          return {
            ...prev,
            round: 0,
            team1: {
              ...prev.team1,
              score: 0,
              mapsWon: teamKey === 'team1' ? newMapsWon : (prev.team1?.mapsWon || 0)
            },
            team2: {
              ...prev.team2,
              score: 0,
              mapsWon: teamKey === 'team2' ? newMapsWon : (prev.team2?.mapsWon || 0)
            }
          };
        });
        setFeedback({
          type: 'success',
          text: `🏆 ¡${winnerName} ha ganado el mapa! +1 mapa sumado y rondas reiniciadas a 0-0.`
        });
        setConfirmConfig(c => ({ ...c, isOpen: false }));
      }
    });
  };

  // Reiniciar solo rondas del mapa actual
  const requestResetRounds = () => {
    setConfirmConfig({
      isOpen: true,
      title: '🔄 ¿Reiniciar Marcador de Rondas?',
      message: '¿Estás seguro de reiniciar las rondas a 0 - 0 para ambos equipos en el mapa actual?',
      confirmText: 'Reiniciar Rondas (0-0)',
      confirmStyle: 'warning',
      onConfirm: () => {
        setMatchData(prev => ({
          ...prev,
          round: 0,
          team1: { ...prev.team1, score: 0 },
          team2: { ...prev.team2, score: 0 },
        }));
        setFeedback({ type: 'success', text: 'Marcador de rondas restablecido a 0 - 0.' });
        setConfirmConfig(c => ({ ...c, isOpen: false }));
      }
    });
  };

  // Reiniciar partido completo (mapas y rondas)
  const requestResetFullMatch = () => {
    setConfirmConfig({
      isOpen: true,
      title: '⚠️ ¿Reiniciar Todo el Partido?',
      message: 'Esta acción borrará todos los mapas ganados y rondas de ambos equipos. ¿Deseas continuar?',
      confirmText: 'Reiniciar Todo el Encuentro',
      confirmStyle: 'danger',
      onConfirm: () => {
        setMatchData(prev => ({
          ...prev,
          round: 0,
          team1: { ...prev.team1, score: 0, mapsWon: 0 },
          team2: { ...prev.team2, score: 0, mapsWon: 0 },
        }));
        setFeedback({ type: 'success', text: 'Partido reiniciado por completo (0-0 mapas, 0-0 rondas).' });
        setConfirmConfig(c => ({ ...c, isOpen: false }));
      }
    });
  };

  // Finalizar partido con guardia
  const requestEndMatch = () => {
    setConfirmConfig({
      isOpen: true,
      title: '🏁 ¿Finalizar Encuentro Oficial?',
      message: 'El estado del partido se actualizará a FINALIZADO y se notificará en pantalla.',
      confirmText: 'Finalizar Partido',
      confirmStyle: 'primary',
      onConfirm: () => {
        setMatchData(prev => ({ ...prev, status: 'FINALIZADO' }));
        setFeedback({ type: 'success', text: 'Encuentro marcado como FINALIZADO.' });
        setConfirmConfig(c => ({ ...c, isOpen: false }));
      }
    });
  };

  // Cambio de lados a la mitad del partido (Halftime side-swap)
  const handleSwapSides = () => {
    setMatchData(prev => {
      const isCurrentlySwapped = (prev.side || '').toLowerCase().includes('atk vs def') || (prev.side || '').toLowerCase() === 'swapped';
      const newSideStr = isCurrentlySwapped ? 'DEF vs ATK' : 'ATK vs DEF';
      const t1Side = isCurrentlySwapped ? 'DEFENSOR' : 'ATACANTE';
      const t2Side = isCurrentlySwapped ? 'ATACANTE' : 'DEFENSOR';

      return {
        ...prev,
        side: newSideStr,
        team1: { ...prev.team1, side: t1Side },
        team2: { ...prev.team2, side: t2Side },
      };
    });
    setFeedback({
      type: 'success',
      text: '🔄 ¡Lados cambiados (Halftime Side-Swap)! Roles de Defensor y Atacante invertidos.'
    });
  };

  const handleSelectTeam = (teamKey, teamName) => {
    const found = teams.find(t => t.name === teamName);
    setMatchData(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        name: teamName,
        logo: found?.logo || (teamKey === 'team1' ? '/logo1.png' : '/logo2.png'),
      }
    }));
  };

  const handleSaveLiveMatch = async (forceActive) => {
    setLoading(true);
    const toSave = {
      ...matchData,
      active: forceActive !== undefined ? forceActive : matchData.active
    };

    try {
      const res = await apiFetch(`/live-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match: toSave })
      });
      const data = await res.json();
      if (data.success) {
        setMatchData(toSave);
        setFeedback({ 
          type: 'success', 
          text: toSave.active 
            ? '🚀 ¡Marcador en vivo emitido a la web! El LiveBanner está activo.' 
            : '⏸️ Marcador desactivado. El LiveBanner de la web se ha ocultado.' 
        });
      } else {
        setFeedback({ type: 'error', text: 'Error al actualizar marcador' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de conexión con el bot' });
    }
    setLoading(false);
  };

  const s1 = matchData.team1?.score || 0;
  const s2 = matchData.team2?.score || 0;
  const m1 = matchData.team1?.mapsWon || 0;
  const m2 = matchData.team2?.mapsWon || 0;
  const isMatchPointT1 = s1 >= 12 && s1 > s2;
  const isMatchPointT2 = s2 >= 12 && s2 > s1;

  const isSwapped = (matchData.side || '').toLowerCase().includes('atk vs def') || (matchData.side || '').toLowerCase() === 'swapped';
  const team1Side = isSwapped ? 'ATACANTE' : 'DEFENSOR';
  const team2Side = isSwapped ? 'DEFENSOR' : 'ATACANTE';
  const team1SideClass = isSwapped ? 'team-side-attacker' : 'team-side-defender';
  const team2SideClass = isSwapped ? 'team-side-defender' : 'team-side-attacker';

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Modal de confirmación accesible */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmStyle={confirmConfig.confirmStyle}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
      />

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            CONTROL DE TRANSMISIÓN VALORANT FUSIÓN
          </span>
          <h2 style={{ margin: '4px 0 6px 0', fontSize: '26px', fontWeight: 900 }}>Marcador Oficial de la Copa Primate</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            Gestión en tiempo real de rondas, mapas ganados, control de escenas OBS y sincronización instantánea.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleSaveLiveMatch(!matchData.active)}
            className="btn-secondary"
            style={{
              borderColor: matchData.active ? 'var(--danger)' : '#00f5d4',
              color: matchData.active ? 'var(--danger)' : '#00f5d4',
              padding: '8px 16px',
              fontWeight: 700,
            }}
          >
            {matchData.active ? '⏸️ Desactivar LiveBanner' : '🔴 Activar LiveBanner'}
          </button>

          <button
            type="button"
            onClick={() => handleSaveLiveMatch(true)}
            className="btn-primary"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #c084fc 0%, #9333ea 100%)',
              color: '#fff',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(192, 132, 252, 0.4)',
            }}
          >
            <Radio size={18} /> Publicar Marcador
          </button>
        </div>
      </div>

      {/* OBS SCENE SWITCHER BAR (1-CLICK EMISSION TOGGLE) */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(90deg, rgba(15, 25, 35, 0.98) 0%, rgba(8, 8, 11, 0.98) 100%)',
          border: '1.5px solid rgba(192, 132, 252, 0.35)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(192, 132, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <Layers size={18} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 800 }}>
                Controlador de Escena OBS en Directo (Unified Stream Switcher)
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                Cambia instantáneamente la visualización en pantalla con 1 clic para los casters.
              </p>
            </div>
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(0, 245, 212, 0.15)', color: '#00f5d4', padding: '3px 10px', borderRadius: '20px', fontWeight: 800, border: '1px solid rgba(0, 245, 212, 0.3)' }}>
            ESCENA ACTIVA: {activeOverlayMode.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {OVERLAY_SCENES.map((scene) => {
            const isActive = activeOverlayMode === scene.id;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => handleSetOverlayMode(scene.id)}
                style={{
                  flex: 1,
                  minWidth: '130px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1.5px solid #00f5d4' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: isActive ? 'rgba(0, 245, 212, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#00f5d4' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 16px rgba(0, 245, 212, 0.3)' : 'none',
                }}
              >
                <span>{scene.label}</span>
                {isActive && (
                  <span style={{ fontSize: '9px', background: '#ff4655', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 900 }}>
                    EN DIRECTO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ENLACES OBS STUDIO */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          background: 'rgba(15, 25, 35, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tv size={16} color="#c084fc" />
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>
              Fuentes de Navegador para OBS Studio (Browser Sources 1920x1080 transparentes)
            </span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#fff' }}>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              style={{ accentColor: '#c084fc', cursor: 'pointer' }}
            />
            <span>Auto-enviar cambios al instante a OBS</span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Master Unified Overlay */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={overlayLiveUrl}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(192, 132, 252, 0.3)',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#00f5d4',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
              }}
              title="Overlay Unificado que alterna automáticamente escenas"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(overlayLiveUrl, 'live')}
              style={{
                padding: '8px 14px',
                background: copiedLive ? '#00f5d4' : '#c084fc',
                color: '#08080b',
                fontWeight: 800,
                fontSize: '12px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {copiedLive ? '¡Copiado!' : 'Copiar Live'}
            </button>
            <a
              href={overlayLiveUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#c084fc', padding: '6px', display: 'flex', alignItems: 'center' }}
              title="Abrir en pestaña nueva"
            >
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Marcador HUD Direct Link */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={overlayScoreboardUrl}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                padding: '8px 10px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => copyToClipboard(overlayScoreboardUrl, 'scoreboard')}
              style={{
                padding: '8px 14px',
                background: copiedOverlay ? '#00f5d4' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {copiedOverlay ? '¡Copiado!' : 'Copiar HUD'}
            </button>
            <a
              href={overlayScoreboardUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'rgba(255,255,255,0.7)', padding: '6px', display: 'flex', alignItems: 'center' }}
              title="Abrir en pestaña nueva"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          background: feedback.type === 'success' ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255, 70, 85, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? '#00f5d4' : '#ff4655'}`,
          color: feedback.type === 'success' ? '#00f5d4' : '#ff4655',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600,
          fontSize: '13px',
        }}>
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* BANNER INFORMATIVO DE PUNTO DE MAPA (CUANDO SCORE >= 12) */}
      {(s1 >= 12 || s2 >= 12) && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '10px',
            background: 'linear-gradient(90deg, rgba(255, 70, 85, 0.25) 0%, rgba(192, 132, 252, 0.2) 100%)',
            border: '1.5px solid #ff4655',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#ff4655" />
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>
              ⚡ <strong>PUNTO DE MAPA:</strong> {s1 >= 12 ? matchData.team1?.name : matchData.team2?.name} está a punto de ganar el mapa ({s1} - {s2}). Haz clic en &quot;Gana Mapa&quot; para confirmar victoria oficial.
            </span>
          </div>
          <button
            type="button"
            onClick={() => requestAwardMap(s1 >= s2 ? 'team1' : 'team2')}
            style={{
              padding: '6px 16px',
              background: '#ff4655',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            🏆 Declarar Ganador a {s1 >= s2 ? matchData.team1?.name : matchData.team2?.name}
          </button>
        </div>
      )}

      {/* MARCADOR HUD INTERACTIVO (1:1 CON STREAM OVERLAY) */}
      <div
        className="glass-card"
        style={{
          padding: '28px 24px',
          background: 'linear-gradient(135deg, rgba(15, 25, 35, 0.98) 0%, rgba(8, 8, 11, 0.98) 100%)',
          border: '1.5px solid rgba(192, 132, 252, 0.35)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
          borderRadius: '18px',
          position: 'relative',
        }}
      >
        {/* Cabecera superior del marcador */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                background: matchData.status === 'LIVE' ? '#ff4655' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '20px',
                letterSpacing: '1px',
              }}
            >
              {STATUSES.find((s) => s.id === matchData.status)?.label || 'PARTIDO'}
            </span>

            {/* Botón de cambio de lados (Halftime side-swap) */}
            <button
              type="button"
              onClick={handleSwapSides}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0, 245, 212, 0.12)',
                border: '1px solid rgba(0, 245, 212, 0.35)',
                color: '#00f5d4',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
              title="Cambiar roles de Defensor / Atacante entre equipos"
            >
              <RotateCcw size={14} /> Cambiar Lados
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {['BO1', 'BO3', 'BO5'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setMatchData({ ...matchData, format: fmt })}
                style={{
                  background: matchData.format === fmt ? '#c084fc' : 'rgba(255,255,255,0.06)',
                  color: matchData.format === fmt ? '#08080b' : 'rgba(255,255,255,0.7)',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* VISUAL INTERACTIVO 1:1 CON OverlayScoreboard */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0 20px', overflowX: 'auto' }}>
          <div className={`main-container format-${(matchData.format || 'BO3').toLowerCase()}`} id="main-scoreboard">
            {/* EQUIPO IZQUIERDA */}
            <div className="team-glow-container team-left" id="glow-container-left">
              <div className="team-wrapper" id="wrapper-left">
                <div className="match-point-badge" id="mp-left" style={{ display: isMatchPointT1 ? 'block' : 'none' }}>
                  MATCH POINT
                </div>
                <div className="map-wins-container" id="maps-left" title="Mapas ganados (Haz clic para alternar)">
                  <div
                    className={`map-win-dot ${m1 > 0 ? 'active' : ''}`}
                    data-idx="0"
                    onClick={() => handleBananaChange('team1', m1 >= 1 ? -1 : 1)}
                  >🍌</div>
                  <div
                    className={`map-win-dot ${m1 > 1 ? 'active' : ''}`}
                    data-idx="1"
                    onClick={() => handleBananaChange('team1', m1 >= 2 ? -1 : 1)}
                  >🍌</div>
                  <div
                    className={`map-win-dot ${m1 > 2 ? 'active' : ''}`}
                    data-idx="2"
                    onClick={() => handleBananaChange('team1', m1 >= 3 ? -1 : 1)}
                  >🍌</div>
                </div>

                <div className="team-info team-info-left">
                  <div className={`team-side-indicator ${team1SideClass}`}>
                    {team1Side}
                  </div>
                  <span id="name-left" className="team-tag" title={matchData.team1?.name || 'SELECCIONAR'}>
                    {getTeamTag(matchData.team1)}
                  </span>
                  <div className="logo-box">
                    <img
                      id="img-left"
                      src={matchData.team1?.logo || '/logo1.png'}
                      alt={getTeamTag(matchData.team1)}
                      onError={(e) => { e.target.src = '/logo1.png'; }}
                    />
                  </div>
                </div>

                <div
                  className="score-box"
                  id="score-left"
                  onClick={() => handleScoreChange('team1', 1)}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  title="Clic: +1 ronda"
                >
                  <span className="score-num">{s1}</span>
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
                <div
                  className="score-box"
                  id="score-right"
                  onClick={() => handleScoreChange('team2', 1)}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  title="Clic: +1 ronda"
                >
                  <span className="score-num">{s2}</span>
                </div>

                <div className="team-info team-info-right">
                  <div className="logo-box">
                    <img
                      id="img-right"
                      src={matchData.team2?.logo || '/logo2.png'}
                      alt={getTeamTag(matchData.team2)}
                      onError={(e) => { e.target.src = '/logo2.png'; }}
                    />
                  </div>
                  <span id="name-right" className="team-tag" title={matchData.team2?.name || 'SELECCIONAR'}>
                    {getTeamTag(matchData.team2)}
                  </span>
                  <div className={`team-side-indicator ${team2SideClass}`}>
                    {team2Side}
                  </div>
                </div>

                <div className="map-wins-container" id="maps-right" title="Mapas ganados (Haz clic para alternar)">
                  <div
                    className={`map-win-dot ${m2 > 2 ? 'active' : ''}`}
                    data-idx="2"
                    onClick={() => handleBananaChange('team2', m2 >= 3 ? -1 : 1)}
                  >🍌</div>
                  <div
                    className={`map-win-dot ${m2 > 1 ? 'active' : ''}`}
                    data-idx="1"
                    onClick={() => handleBananaChange('team2', m2 >= 2 ? -1 : 1)}
                  >🍌</div>
                  <div
                    className={`map-win-dot ${m2 > 0 ? 'active' : ''}`}
                    data-idx="0"
                    onClick={() => handleBananaChange('team2', m2 >= 1 ? -1 : 1)}
                  >🍌</div>
                </div>

                <div className="match-point-badge" id="mp-right" style={{ display: isMatchPointT2 ? 'block' : 'none' }}>
                  MATCH POINT
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DE CONTROL DIRECTO "PARA TONTOS" (GRANDES BOTONES DE 1 CLIC) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '20px',
            background: 'rgba(8, 8, 11, 0.7)',
            border: '1px solid rgba(192, 132, 252, 0.25)',
            borderRadius: '14px',
            padding: '20px',
            alignItems: 'center',
          }}
        >
          {/* CONTROL EQUIPO 1 (IZQUIERDA) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={matchData.team1?.name}
                onChange={(e) => handleSelectTeam('team1', e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(15, 25, 35, 0.9)',
                  border: '1px solid rgba(0, 245, 212, 0.4)',
                  color: '#fff',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none',
                }}
              >
                {teams.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
                {teams.length === 0 && <option value="Los Monos">Los Monos</option>}
              </select>
            </div>

            {/* Botones Grandes de Ronda para Equipo 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleScoreChange('team1', 1)}
                style={{
                  height: '46px',
                  background: 'linear-gradient(135deg, #00f5d4 0%, #0d9488 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#08080b',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(0, 245, 212, 0.3)',
                }}
              >
                +1 Ronda ({s1})
              </button>
              <button
                type="button"
                onClick={() => handleScoreChange('team1', -1)}
                style={{
                  height: '46px',
                  background: 'rgba(255, 70, 85, 0.15)',
                  border: '1.5px solid #ff4655',
                  borderRadius: '8px',
                  color: '#ff4655',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                -1 Ronda
              </button>
            </div>

            {/* Controles de Mapa para Equipo 1 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => requestAwardMap('team1')}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: 'rgba(192, 132, 252, 0.2)',
                  border: '1.5px solid #c084fc',
                  borderRadius: '6px',
                  color: '#c084fc',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                🏆 Gana Mapa ({m1})
              </button>
              <button
                type="button"
                onClick={() => handleBananaChange('team1', 1)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                title="Sumar mapa manual"
              >
                + Mapa
              </button>
              <button
                type="button"
                onClick={() => handleBananaChange('team1', -1)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                title="Restar mapa manual"
              >
                - Mapa
              </button>
            </div>
          </div>

          {/* CENTRO: ACCIONES GLOBALES Y RONDA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', minWidth: '160px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Control de Rondas
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setMatchData(prev => ({ ...prev, round: Math.max(0, (prev.round || 0) - 1) }))}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 900,
                }}
              >-</button>
              <strong style={{ fontSize: '20px', color: '#00f5d4', fontFamily: 'JetBrains Mono, monospace', minWidth: '40px', textAlign: 'center' }}>
                {matchData.round}
              </strong>
              <button
                type="button"
                onClick={() => setMatchData(prev => ({ ...prev, round: (prev.round || 0) + 1 }))}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 900,
                }}
              >+</button>
            </div>

            {/* Acciones de Reseteo Protegidas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '4px' }}>
              <button
                type="button"
                onClick={requestResetRounds}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                🔄 Reset Rondas (0-0)
              </button>
              <button
                type="button"
                onClick={requestResetFullMatch}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255, 70, 85, 0.1)',
                  border: '1px solid rgba(255, 70, 85, 0.3)',
                  borderRadius: '6px',
                  color: '#ff4655',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ⚠️ Reset Partido
              </button>
            </div>
          </div>

          {/* CONTROL EQUIPO 2 (DERECHA) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={matchData.team2?.name}
                onChange={(e) => handleSelectTeam('team2', e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(15, 25, 35, 0.9)',
                  border: '1px solid rgba(255, 70, 85, 0.4)',
                  color: '#fff',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none',
                  textAlign: 'right',
                }}
              >
                {teams.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
                {teams.length === 0 && <option value="Gorilas">Gorilas</option>}
              </select>
            </div>

            {/* Botones Grandes de Ronda para Equipo 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleScoreChange('team2', 1)}
                style={{
                  height: '46px',
                  background: 'linear-gradient(135deg, #ff4655 0%, #b91c1c 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(255, 70, 85, 0.3)',
                }}
              >
                +1 Ronda ({s2})
              </button>
              <button
                type="button"
                onClick={() => handleScoreChange('team2', -1)}
                style={{
                  height: '46px',
                  background: 'rgba(255, 70, 85, 0.15)',
                  border: '1.5px solid #ff4655',
                  borderRadius: '8px',
                  color: '#ff4655',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                -1 Ronda
              </button>
            </div>

            {/* Controles de Mapa para Equipo 2 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => requestAwardMap('team2')}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: 'rgba(192, 132, 252, 0.2)',
                  border: '1.5px solid #c084fc',
                  borderRadius: '6px',
                  color: '#c084fc',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                🏆 Gana Mapa ({m2})
              </button>
              <button
                type="button"
                onClick={() => handleBananaChange('team2', 1)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                title="Sumar mapa manual"
              >
                + Mapa
              </button>
              <button
                type="button"
                onClick={() => handleBananaChange('team2', -1)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                title="Restar mapa manual"
              >
                - Mapa
              </button>
            </div>
          </div>
        </div>

        {/* AJUSTES RÁPIDOS INFERIORES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px', fontWeight: 700 }}>
              ESTADO DEL ENCUENTRO
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={matchData.status}
                onChange={(e) => setMatchData({ ...matchData, status: e.target.value })}
                style={{ flex: 1, background: '#0a0f16', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={requestEndMatch}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(0, 255, 136, 0.15)',
                  border: '1px solid #00ff88',
                  color: '#00ff88',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                🏁 Finalizar
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px', fontWeight: 700 }}>
              MAPA EN DISPUTA
            </label>
            <input
              type="text"
              value={matchData.map || ''}
              onChange={(e) => setMatchData({ ...matchData, map: e.target.value })}
              placeholder="Ascent, Bind, Haven..."
              style={{ width: '100%', background: '#0a0f16', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px', fontWeight: 700 }}>
              NOTAS DEL CASTER (TWITCH)
            </label>
            <input
              type="text"
              value={matchData.notes || ''}
              onChange={(e) => setMatchData({ ...matchData, notes: e.target.value })}
              placeholder="Comentarios de la ronda actual"
              style={{ width: '100%', background: '#0a0f16', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
