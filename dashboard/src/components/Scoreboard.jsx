import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, CheckCircle2, RefreshCw, Trophy, Radio, 
  Plus, Minus, Flame, Tv, Eye, Sparkles, Check, X, Bell,
  Copy, ExternalLink, Layers, CheckCircle
} from 'lucide-react';
import { apiFetch } from '../api';
import './overlays/marcador.css';

const STATUSES = [
  { id: 'LIVE', label: '🔴 EN VIVO', color: '#ff4655' },
  { id: 'PAUSA', label: '⏸️ PAUSA TÉCNICA', color: '#ffb300' },
  { id: 'FINALIZADO', label: '🏁 FINALIZADO', color: '#00ff88' },
  { id: 'PENDIENTE', label: '⏳ PROGRAMADO', color: '#a6a6a6' },
];

export default function Scoreboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedOverlay, setCopiedOverlay] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const firstRender = useRef(true);

  const [matchData, setMatchData] = useState({
    active: true,
    status: 'LIVE',
    team1: { name: 'Los Monos', logo: '/monkeys.jpg', score: 11, mapsWon: 1 },
    team2: { name: 'Gorilas', logo: '/gorilas.jpg', score: 9, mapsWon: 0 },
    map: 'Ascent',
    round: 21,
    format: 'BO3',
    side: 'Attackers vs Defenders',
    mvp: 'TenZ#NA1',
    notes: 'Ronda 21: Compra completa. Gorilas defendiendo el site de B.',
  });

  // URL del overlay para OBS (funciona tanto en el puerto de la web como del dashboard)
  const obsOrigin = window.location.origin.replace(':5174', ':5173');
  const overlayUrl = `${obsOrigin}/overlay/scoreboard`;

  const copyOverlay = (url = overlayUrl) => {
    navigator.clipboard.writeText(url);
    setCopiedOverlay(true);
    setTimeout(() => setCopiedOverlay(false), 2500);
  };

  // Auto-sincronización con OBS cuando cambia el tanteo si autoSync está activado
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
          team1: { ...data.match.team1, mapsWon: data.match.team1?.mapsWon || 0 },
          team2: { ...data.match.team2, mapsWon: data.match.team2?.mapsWon || 0 },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleScoreChange = (teamKey, delta) => {
    setMatchData(prev => {
      const currentScore = prev[teamKey]?.score || 0;
      const nextScore = Math.max(0, currentScore + delta);

      // Al llegar a 13 rondas se gana el mapa: se resetea a 0 el marcador y en BO3/BO5 se añade un plátano
      if (nextScore >= 13) {
        const format = (prev.format || 'BO3').toUpperCase();
        const maxBananas = format === 'BO5' ? 3 : format === 'BO1' ? 1 : 2;
        const currentMapsWon = prev[teamKey]?.mapsWon || 0;
        const newMapsWon = Math.min(maxBananas, currentMapsWon + 1);
        const winnerName = prev[teamKey]?.name || (teamKey === 'team1' ? 'Equipo Izquierda' : 'Equipo Derecha');

        setTimeout(() => {
          setFeedback({
            type: 'success',
            text: `🍌 ¡${winnerName} ha ganado el mapa con 13 rondas! Marcador reseteado a 0 y +1 plátano sumado.`
          });
        }, 80);

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
      }

      const totalRounds = (teamKey === 'team1' ? nextScore : (prev.team1?.score || 0)) + 
                          (teamKey === 'team2' ? nextScore : (prev.team2?.score || 0));
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

  const handleBananaChange = (teamKey, delta) => {
    setMatchData(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        mapsWon: Math.max(0, Math.min(3, (prev[teamKey]?.mapsWon || 0) + delta))
      }
    }));
  };

  const handleSelectTeam = (teamKey, teamName) => {
    const found = teams.find(t => t.name === teamName);
    setMatchData(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        name: teamName,
        logo: found?.logo || (teamKey === 'team1' ? '/monkeys.jpg' : '/gorilas.jpg'),
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
  const isMatchPointT1 = s1 >= 12 && s1 > s2;
  const isMatchPointT2 = s2 >= 12 && s2 > s1;

  const maxBananas = matchData.format === 'BO1' ? 1 : matchData.format === 'BO5' ? 3 : 2;

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, letterSpacing: '1px' }}>
            CONTROL DE TRANSMISIÓN OFICIAL
          </span>
          <h2>Marcador Oficial de la Copa Primate</h2>
          <p>Maneja los puntos, mapas ganados con plátanos 🍌, formato y sincronización directa con el LiveBanner.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleSaveLiveMatch(!matchData.active)}
            className="btn-secondary"
            style={{
              borderColor: matchData.active ? 'var(--danger)' : 'var(--success)',
              color: matchData.active ? 'var(--danger)' : 'var(--success)',
            }}
          >
            {matchData.active ? '⏸️ Desactivar LiveBanner' : '🔴 Activar LiveBanner'}
          </button>

          <button
            type="button"
            onClick={() => handleSaveLiveMatch(true)}
            className="btn-primary"
            disabled={loading}
            style={{ background: 'var(--primate-orange)', color: '#000', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Radio size={18} /> Publicar Marcador
          </button>
        </div>
      </div>

      {/* BARRA DE ENLACE DIRECTO PARA EL OVERLAY DE OBS */}
      <div className="glass-card" style={{
        padding: '18px 24px',
        background: 'linear-gradient(90deg, rgba(145, 70, 255, 0.12) 0%, rgba(255, 179, 0, 0.08) 100%)',
        border: '1px solid rgba(145, 70, 255, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(145, 70, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9146ff' }}>
              <Tv size={18} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>
                Overlay para OBS Studio (Fuente de Navegador)
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Pega este enlace en OBS como <em>Browser Source</em> (1920x1080 o 1920x160 con fondo transparente).
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#fff' }}>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>Auto-enviar cambios al instante a OBS</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            readOnly
            value={overlayUrl}
            style={{
              flex: 1,
              minWidth: '280px',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#00ff88',
              fontSize: '13px',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />

          <button
            type="button"
            className="btn-primary"
            onClick={() => copyOverlay(overlayUrl)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: copiedOverlay ? 'var(--success)' : 'var(--primary)',
              color: '#000',
              fontWeight: 800,
              fontSize: '13px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {copiedOverlay ? <Check size={16} /> : <Copy size={16} />}
            {copiedOverlay ? '¡Copiado!' : 'Copiar Link para OBS'}
          </button>

          <a
            href={overlayUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '13px',
              textDecoration: 'none',
              borderRadius: '8px',
            }}
          >
            <ExternalLink size={15} /> Abrir Overlay ↗
          </a>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '8px',
          background: feedback.type === 'success' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 70, 85, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* MARCADOR ESTILO MARCADOR-MAIN CON PLÁTANOS Y MONITOS */}
      <div
        className="glass-card"
        style={{
          padding: '36px 30px',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(15, 30, 22, 0.98) 0%, rgba(6, 15, 10, 0.98) 100%)',
          border: '2px solid var(--border-gold)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
          borderRadius: '20px',
          position: 'relative',
        }}
      >
        {/* Cabecera superior del marcador */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: matchData.status === 'LIVE' ? '#ff4655' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '20px',
                letterSpacing: '1px',
                animation: matchData.status === 'LIVE' ? 'pulse 2s infinite' : 'none',
              }}
            >
              {STATUSES.find((s) => s.id === matchData.status)?.label || 'PARTIDO'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Ronda {matchData.round}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {['BO1', 'BO3', 'BO5'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setMatchData({ ...matchData, format: fmt })}
                style={{
                  background: matchData.format === fmt ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                  color: matchData.format === fmt ? '#000' : 'var(--text-muted)',
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

        {/* VISUAL OFICIAL IDÉNTICO A MARCADOR-MAIN */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0 24px', overflowX: 'auto' }}>
          <div className={`main-container format-${(matchData.format || 'BO3').toLowerCase()}`} id="main-scoreboard">
            {/* EQUIPO IZQUIERDA */}
            <div className="team-glow-container team-left" id="glow-container-left">
              <div className="team-wrapper" id="wrapper-left">
                <div className="leaf-deco leaf-1"></div>
                <div className="leaf-deco leaf-2"></div>
                <div className="match-point-badge" id="mp-left" style={{ display: isMatchPointT1 ? 'block' : 'none' }}>
                  MATCH POINT
                </div>
                <div className="map-wins-container" id="maps-left" title="Mapas ganados (Haz clic para sumar o restar)">
                  <div
                    className={`map-win-dot ${(matchData.team1?.mapsWon || 0) > 0 ? 'active' : ''}`}
                    data-idx="0"
                    onClick={() => handleBananaChange('team1', (matchData.team1?.mapsWon || 0) >= 1 ? -1 : 1)}
                  >🍌</div>
                  <div
                    className={`map-win-dot ${(matchData.team1?.mapsWon || 0) > 1 ? 'active' : ''}`}
                    data-idx="1"
                    onClick={() => handleBananaChange('team1', (matchData.team1?.mapsWon || 0) >= 2 ? -1 : 1)}
                  >🍌</div>
                  <div
                    className={`map-win-dot ${(matchData.team1?.mapsWon || 0) > 2 ? 'active' : ''}`}
                    data-idx="2"
                    onClick={() => handleBananaChange('team1', (matchData.team1?.mapsWon || 0) >= 3 ? -1 : 1)}
                  >🍌</div>
                </div>
                <div className="team-info">
                  <span id="name-left" className="team-name">
                    {matchData.team1?.name || 'SELECCIONAR'}
                  </span>
                  <div className="logo-box">
                    <img
                      id="img-left"
                      src={matchData.team1?.logo || '/monkeys.jpg'}
                      alt="Logo A"
                      onError={(e) => { e.target.src = '/monkeys.jpg'; }}
                    />
                  </div>
                </div>
                <div
                  className="score-box"
                  id="score-left"
                  onClick={() => handleScoreChange('team1', 1)}
                  onContextMenu={(e) => { e.preventDefault(); handleScoreChange('team1', -1); }}
                  title="Clic izquierdo: +1 ronda | Clic derecho: -1 ronda"
                >
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
                <div
                  className="score-box"
                  id="score-right"
                  onClick={() => handleScoreChange('team2', 1)}
                  onContextMenu={(e) => { e.preventDefault(); handleScoreChange('team2', -1); }}
                  title="Clic izquierdo: +1 ronda | Clic derecho: -1 ronda"
                >
                  {s2}
                </div>
                <div className="team-info">
                  <div className="logo-box">
                    <img
                      id="img-right"
                      src={matchData.team2?.logo || '/gorilas.jpg'}
                      alt="Logo B"
                      onError={(e) => { e.target.src = '/gorilas.jpg'; }}
                    />
                  </div>
                  <span id="name-right" className="team-name">
                    {matchData.team2?.name || 'SELECCIONAR'}
                  </span>
                </div>
                <div className="map-wins-container" id="maps-right" title="Mapas ganados (Haz clic para sumar o restar)">
                  <div
                    className={`map-win-dot ${(matchData.team2?.mapsWon || 0) > 2 ? 'active' : ''}`}
                    data-idx="2"
                    onClick={() => handleBananaChange('team2', (matchData.team2?.mapsWon || 0) >= 3 ? -1 : 1)}
                  >🍌</div>
                  <div
                    className={`map-win-dot ${(matchData.team2?.mapsWon || 0) > 1 ? 'active' : ''}`}
                    data-idx="1"
                    onClick={() => handleBananaChange('team2', (matchData.team2?.mapsWon || 0) >= 2 ? -1 : 1)}
                  >🍌</div>
                  <div
                    className={`map-win-dot ${(matchData.team2?.mapsWon || 0) > 0 ? 'active' : ''}`}
                    data-idx="0"
                    onClick={() => handleBananaChange('team2', (matchData.team2?.mapsWon || 0) >= 1 ? -1 : 1)}
                  >🍌</div>
                </div>
                <div className="match-point-badge" id="mp-right" style={{ display: isMatchPointT2 ? 'block' : 'none' }}>
                  MATCH POINT
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENEDOR DE CONTROLES DE ADMINISTRACIÓN */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255, 179, 0, 0.25)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginTop: '10px',
          }}
        >
          {/* LADO IZQUIERDO: EQUIPO 1 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Equipo Izquierda:
              </label>
              <select
                value={matchData.team1?.name}
                onChange={(e) => handleSelectTeam('team1', e.target.value)}
                style={{ background: '#0a1610', border: '1px solid var(--glass-border)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, width: '100%', outline: 'none' }}
              >
                {teams.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
                {teams.length === 0 && <option value="Los Monos">Los Monos</option>}
              </select>
            </div>

            {/* Botones +/- Izquierda */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => handleScoreChange('team1', 1)}
                style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid var(--success)', color: 'var(--success)', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontWeight: 900, fontSize: '16px' }}
                title="Sumar 1 ronda"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleScoreChange('team1', -1)}
                style={{ background: 'rgba(255,70,85,0.15)', border: '1px solid var(--danger)', color: 'var(--danger)', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontWeight: 900, fontSize: '16px' }}
                title="Restar 1 ronda"
              >
                -
              </button>
            </div>
          </div>

          {/* CENTRO: RONDA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '130px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Ronda Actual
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setMatchData(prev => ({ ...prev, round: Math.max(0, (prev.round || 0) - 1) }))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}
                title="Restar ronda"
              >-</button>
              <strong style={{ fontSize: '18px', color: '#ffb300', fontFamily: "'Rajdhani', sans-serif", minWidth: '26px', textAlign: 'center' }}>
                {matchData.round}
              </strong>
              <button
                type="button"
                onClick={() => setMatchData(prev => ({ ...prev, round: (prev.round || 0) + 1 }))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}
                title="Sumar ronda"
              >+</button>
            </div>
          </div>

          {/* LADO DERECHO: EQUIPO 2 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', position: 'relative' }}>
            {/* Botones +/- Derecha */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => handleScoreChange('team2', -1)}
                style={{ background: 'rgba(255,70,85,0.15)', border: '1px solid var(--danger)', color: 'var(--danger)', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontWeight: 900, fontSize: '16px' }}
                title="Restar 1 ronda"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => handleScoreChange('team2', 1)}
                style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid var(--success)', color: 'var(--success)', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontWeight: 900, fontSize: '16px' }}
                title="Sumar 1 ronda"
              >
                +
              </button>
            </div>

            <div style={{ flex: 1, textAlign: 'right' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Equipo Derecha:
              </label>
              <select
                value={matchData.team2?.name}
                onChange={(e) => handleSelectTeam('team2', e.target.value)}
                style={{ background: '#0a1610', border: '1px solid var(--glass-border)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, width: '100%', outline: 'none', textAlign: 'right' }}
              >
                {teams.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
                {teams.length === 0 && <option value="Gorilas">Gorilas</option>}
              </select>
            </div>
          </div>
        </div>

        {/* AJUSTES RÁPIDOS INFERIORES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
              ESTADO DEL ENCUENTRO
            </label>
            <select
              value={matchData.status}
              onChange={(e) => setMatchData({ ...matchData, status: e.target.value })}
              style={{ width: '100%', background: '#0a1610', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
              NOTAS DEL CASTER (TWITCH)
            </label>
            <input
              type="text"
              value={matchData.notes || ''}
              onChange={(e) => setMatchData({ ...matchData, notes: e.target.value })}
              placeholder="Comentarios de la ronda actual"
              style={{ width: '100%', background: '#0a1610', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
