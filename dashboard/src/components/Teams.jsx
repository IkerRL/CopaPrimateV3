import { useState, useEffect } from 'react';
import { 
  Calculator, AlertTriangle, CheckCircle, ShieldAlert, Link, 
  Send, Check, X, Trash2, UserPlus, Save, Users, Upload, Eye, EyeOff, Image as ImageIcon, Sparkles, Globe, Search
} from 'lucide-react';

import { apiFetch } from '../api';
const MAX_POINTS = 16;

const RANKS = [
  { name: 'Hierro', points: 1, tier: 0, color: '#545454' },
  { name: 'Bronce', points: 2, tier: 1, color: '#8b5a2b' },
  { name: 'Plata', points: 3, tier: 2, color: '#a6a6a6' },
  { name: 'Oro', points: 4, tier: 3, color: '#ffd700' },
  { name: 'Platino', points: 5, tier: 4, color: '#00ced1' },
  { name: 'Diamante', points: 6, tier: 5, color: '#b982cc' },
  { name: 'Ascendente', points: 7, tier: 6, color: '#2e8b57' },
  { name: 'Inmortal / Radiante', points: 8, tier: 7, color: '#ff4655' },
];

const getRankIndex = (rankVal) => {
  if (typeof rankVal === 'number') return Math.max(0, Math.min(7, rankVal));
  if (!rankVal || typeof rankVal !== 'string') return 0;
  const str = rankVal.toLowerCase();
  if (str.includes('radiant') || str.includes('radiante')) return 7;
  if (str.includes('immortal') || str.includes('inmortal')) return 7;
  if (str.includes('ascendant') || str.includes('ascendente')) return 6;
  if (str.includes('diamond') || str.includes('diamante')) return 5;
  if (str.includes('platinum') || str.includes('platino')) return 4;
  if (str.includes('gold') || str.includes('oro')) return 3;
  if (str.includes('silver') || str.includes('plata')) return 2;
  if (str.includes('bronze') || str.includes('bronce')) return 1;
  if (str.includes('iron') || str.includes('hierro')) return 0;
  return 0;
};

export default function Teams({ initialTeam }) {
  const [ticketSource, setTicketSource] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('/copa-logo.png');
  const [allowOverLimit, setAllowOverLimit] = useState(false);
  const [isHidden, setIsHidden] = useState(true); // Oculto por defecto para esta copa
  const [statusMessage, setStatusMessage] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [savedTeams, setSavedTeams] = useState([]);

  // 3 titulares + 1 suplente opcional
  const [players, setPlayers] = useState([
    { name: '', currentRank: 0, peakRank: 0, peakRecency: 'recent', level: '' },
    { name: '', currentRank: 0, peakRank: 0, peakRecency: 'recent', level: '' },
    { name: '', currentRank: 0, peakRank: 0, peakRecency: 'recent', level: '' },
    { name: '', currentRank: 0, peakRank: 0, peakRecency: 'recent', level: '' }, // Suplente
  ]);

  useEffect(() => {
    fetchSavedTeams();
  }, []);

  useEffect(() => {
    if (initialTeam) {
      setTicketSource(initialTeam.ticketName || null);
      setTicketId(initialTeam.ticketId || null);
      setTeamName(initialTeam.name || (initialTeam.ticketName ? `Team ${initialTeam.ticketName.replace('ticket-', '')}` : ''));
      if (initialTeam.logo) setTeamLogo(initialTeam.logo);

      const filledPlayers = (initialTeam.players || []).map(p => ({
        name: p.name || '',
        currentRank: getRankIndex(p.currentRank !== undefined ? p.currentRank : p.rank),
        peakRank: getRankIndex(p.peakRank !== undefined ? p.peakRank : (p.currentRank || p.rank)),
        peakRecency: p.peakRecency || 'recent',
        level: p.level || ''
      }));

      while (filledPlayers.length < 4) {
        filledPlayers.push({ name: '', currentRank: 0, peakRank: 0, peakRecency: 'recent', level: '' });
      }
      setPlayers(filledPlayers.slice(0, 4));
    }
  }, [initialTeam]);

  const fetchTrackerForPlayer = async (index) => {
    const target = (players[index]?.name || '').trim();
    if (!target.includes('#')) return;
    const parts = target.split('#');
    const u = encodeURIComponent(parts[0].trim());
    const t = encodeURIComponent(parts[1].trim());

    try {
      const res = await apiFetch(`/tracker/profile?username=${u}&tag=${t}`);
      const data = await res.json();
      if (data?.profile) {
        const p = data.profile;
        const newPlayers = [...players];
        newPlayers[index] = {
          ...newPlayers[index],
          name: `${p.name}#${p.tag}`,
          currentRank: getRankIndex(p.currentRankText),
          peakRank: getRankIndex(p.peakRankText || p.currentRankText),
          level: String(p.level || '')
        };
        setPlayers(newPlayers);
        setStatusMessage({ type: 'success', text: `✅ Tracker actualizado: ${p.name}#${p.tag} (${p.currentRankText} / Peak: ${p.peakRankText}) - Nivel ${p.level}` });
      }
    } catch (err) {
      console.warn('Error consultando tracker:', err);
    }
  };

  const fetchSavedTeams = async () => {
    try {
      const res = await apiFetch(`/teams`);
      const data = await res.json();
      setSavedTeams(data.teams || []);
    } catch (err) {
      console.error('Error cargando equipos:', err);
    }
  };

  const handlePlayerChange = (index, field, value) => {
    const newPlayers = [...players];
    newPlayers[index][field] = value;
    setPlayers(newPlayers);
  };

  // Cálculo individual de puntos con media ponderada entre rango actual y peak
  const calculatePlayerPoints = (p) => {
    const cur = RANKS[p.currentRank || 0]?.points || 1;
    const peak = RANKS[p.peakRank !== undefined ? p.peakRank : 0]?.points || cur;
    const maxPeak = Math.max(cur, peak);

    let wCur = 0.50;
    let wPeak = 0.50;
    if (p.peakRecency === 'old') {
      wCur = 0.70;
      wPeak = 0.30;
    } else if (p.peakRecency === 'moderate') {
      wCur = 0.60;
      wPeak = 0.40;
    }

    const raw = (cur * wCur) + (maxPeak * wPeak);
    return Math.round(raw * 10) / 10;
  };

  // Manejo de carga de imagen de equipo
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTeamLogo(reader.result);
      setStatusMessage({ type: 'success', text: '¡Imagen del equipo cargada correctamente!' });
    };
    reader.readAsDataURL(file);
  };

  // Cálculo de Elo sobre los 3 titulares
  const starters = players.slice(0, 3);
  const substitute = players[3];
  const hasSubstitute = substitute.name.trim() !== '';

  const starterPointsList = starters.map(p => calculatePlayerPoints(p));
  const totalPoints = Math.round(starterPointsList.reduce((sum, pts) => sum + pts, 0) * 10) / 10;

  // Brecha de tiers (usando tier del rango actual o evaluado)
  const starterTiers = starters.map(p => RANKS[p.peakRank || p.currentRank || 0].tier);
  const maxTier = Math.max(...starterTiers);
  const minTier = Math.min(...starterTiers);
  const tierDiff = maxTier - minTier;

  // Validación de cuentas nivel 40
  const hasInvalidStarterLevel = starters.some(p => p.level !== '' && parseInt(p.level) < 40);
  const hasInvalidSubLevel = hasSubstitute && substitute.level !== '' && parseInt(substitute.level) < 40;
  
  const isPointsStandardValid = totalPoints <= MAX_POINTS;
  const isPointsPermitted = isPointsStandardValid || allowOverLimit;
  const isDiffValid = tierDiff <= 4;
  const isLevelValid = !hasInvalidStarterLevel && !hasInvalidSubLevel && starters.every(p => p.level !== '');
  const isTeamValid = isPointsPermitted && isDiffValid && isLevelValid;

  // Generar motivos de rechazo
  const getRejectionReasons = () => {
    const reasons = [];
    if (!isPointsStandardValid && !allowOverLimit) reasons.push(`Coste de Elo excedido: ${totalPoints}/${MAX_POINTS} puntos permitidos`);
    if (!isDiffValid) reasons.push(`Brecha de rango excesiva: diferencia de ${tierDiff} tiers (máximo 4)`);
    if (hasInvalidStarterLevel || hasInvalidSubLevel) reasons.push(`Cuentas con nivel menor a 40 (requisito anti-smurf no superado)`);
    if (starters.some(p => !p.level)) reasons.push(`Falta especificar el nivel de cuenta de todos los titulares`);
    return reasons;
  };

  // 1. Enviar Veredicto de Aprobación a Discord
  const handleApprove = async () => {
    if (!ticketId) {
      alert('Para responder en Discord, primero extrae el equipo desde un ticket activo.');
      return;
    }
    setLoadingAction(true);
    try {
      const activePlayers = players.filter(p => p.name.trim() !== '');
      const res = await apiFetch(`/tickets/${ticketId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          teamName: teamName || ticketSource,
          totalPoints,
          tierDiff,
          overLimitApproved: allowOverLimit && !isPointsStandardValid,
          players: activePlayers.map(p => ({
            name: p.name,
            rank: `${RANKS[p.currentRank].name} (Peak: ${RANKS[p.peakRank].name}) - ${calculatePlayerPoints(p)} pts`,
            level: p.level,
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ 
          type: 'success', 
          text: `¡Veredicto de APROBACIÓN ${allowOverLimit && !isPointsStandardValid ? '(CON EXCEPCIÓN)' : ''} enviado al canal de Discord!` 
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error al enviar a Discord' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error de conexión con el bot' });
    }
    setLoadingAction(false);
  };

  // 2. Enviar Rechazo a Discord
  const handleReject = async () => {
    if (!ticketId) {
      alert('Para responder en Discord, primero extrae el equipo desde un ticket activo.');
      return;
    }
    const reasons = getRejectionReasons();
    setLoadingAction(true);
    try {
      const activePlayers = players.filter(p => p.name.trim() !== '');
      const res = await apiFetch(`/tickets/${ticketId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          teamName: teamName || ticketSource,
          totalPoints,
          tierDiff,
          reasons,
          players: activePlayers.map(p => ({
            name: p.name,
            rank: `${RANKS[p.currentRank].name} / ${RANKS[p.peakRank].name}`,
            level: p.level,
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'warning', text: 'Veredicto de RECHAZO enviado al canal de Discord explicando los motivos.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error al enviar a Discord' });
    }
    setLoadingAction(false);
  };

  // 3. Subir a la Web & Confirmar en Ticket
  const handleUploadToWeb = async () => {
    const finalName = teamName.trim() || `Equipo #${ticketSource || Date.now().toString().slice(-4)}`;
    setLoadingAction(true);

    const teamPayload = {
      name: finalName,
      logo: teamLogo,
      hidden: isHidden,
      overLimitApproved: allowOverLimit && !isPointsStandardValid,
      totalPoints,
      ticketSource: ticketSource || null,
      players: players.filter(p => p.name.trim() !== '').map(p => ({
        name: p.name,
        currentRank: RANKS[p.currentRank || 0].name,
        peakRank: RANKS[p.peakRank || 0].name,
        rank: RANKS[p.peakRank || 0].name,
        points: calculatePlayerPoints(p),
        level: parseInt(p.level) || 40,
      }))
    };

    try {
      const res = await apiFetch(`/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          team: teamPayload,
          notifyTicketId: ticketId || null 
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ 
          type: 'success', 
          text: `🎉 ¡Equipo "${finalName}" subido a la web (${isHidden ? 'Oculto para esta Copa' : 'Público'}) y mensaje de confirmación enviado al ticket!` 
        });
        fetchSavedTeams();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error guardando equipo' });
      }
    } catch (err) {
      console.error('Error guardando equipo:', err);
      setStatusMessage({ type: 'error', text: 'Error al conectar con la API' });
    }
    setLoadingAction(false);
  };

  // Alternar visibilidad (Oculto / Público)
  const handleToggleHidden = async (id) => {
    try {
      const res = await apiFetch(`/teams/${id}/toggle-hidden`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        fetchSavedTeams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este equipo registrado?')) return;
    try {
      await apiFetch(`/teams/${id}`, { method: 'DELETE' });
      fetchSavedTeams();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2>Gestión de Equipos, Rosters & Límite 16 Elo</h2>
          <p>Escala 1 a 8 ascendente con media ponderada de Peak Rank y antiguedad. Límite máximo: 16 puntos.</p>
        </div>
        {ticketSource && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 153, 0, 0.1)', border: '1px solid var(--primate-orange)', padding: '8px 16px', borderRadius: '20px', color: 'var(--primate-orange)' }}>
            <Link size={16} /> Vinculado a: <strong>#{ticketSource}</strong>
          </div>
        )}
      </div>

      {statusMessage && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '8px',
          background: statusMessage.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : statusMessage.type === 'warning' ? 'rgba(255, 174, 0, 0.1)' : 'rgba(255, 70, 85, 0.1)',
          border: `1px solid ${statusMessage.type === 'success' ? 'var(--success)' : statusMessage.type === 'warning' ? 'var(--warning)' : 'var(--danger)'}`,
          color: statusMessage.type === 'success' ? 'var(--success)' : statusMessage.type === 'warning' ? 'var(--warning)' : 'var(--danger)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Panel Datos del Equipo & Imagen */}
      <div className="glass-card" style={{ padding: '22px 26px', display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '24px', alignItems: 'center' }}>
        {/* Preview del Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', 
            border: '2px solid var(--glass-border)', background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
          }}>
            {teamLogo ? (
              <img src={teamLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <ImageIcon size={32} color="var(--text-muted)" />
            )}
          </div>
          <label className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={14} /> Subir Logo
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Nombre del equipo */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Nombre del Equipo</label>
          <input 
            type="text" 
            className="premium-input" 
            placeholder="Ej: Gorilas Salvajes"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
          />
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            URL del Logo:
            <input 
              type="text" 
              className="premium-input" 
              placeholder="/copa-logo.png o https://..."
              value={teamLogo}
              onChange={e => setTeamLogo(e.target.value)}
              style={{ marginTop: '4px', fontSize: '12px', padding: '6px 10px' }}
            />
          </div>
        </div>

        {/* Opciones de Publicación / Oculto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: isHidden ? '#ffb300' : '#fff' }}>
            <input 
              type="checkbox" 
              checked={isHidden} 
              onChange={e => setIsHidden(e.target.checked)} 
              style={{ width: '18px', height: '18px', accentColor: 'var(--primate-orange)' }}
            />
            <span style={{ fontWeight: '600' }}>🔒 Mantener Oculto en la Web (Modo Copa)</span>
          </label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            *Para esta copa los equipos inscritos están ocultos al público. Estará registrado internamente sin mostrarse en la web pública.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: allowOverLimit ? 'var(--warning)' : 'var(--text-muted)' }}>
            <input 
              type="checkbox" 
              checked={allowOverLimit} 
              onChange={e => setAllowOverLimit(e.target.checked)} 
              style={{ width: '18px', height: '18px', accentColor: 'var(--warning)' }}
            />
            <span>⚠️ Aceptar aunque supere el límite de 16 pts (Excepción)</span>
          </label>
        </div>
      </div>

      {/* Grid Principal: Jugadores + Panel Lateral de Verificación */}
      <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '24px' }}>
        {/* Jugadores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {players.map((player, idx) => {
            const isSub = idx === 3;
            const pts = calculatePlayerPoints(player);
            return (
              <div key={idx} className="glass-card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: isSub ? '#ffb300' : RANKS[player.peakRank || player.currentRank || 0].color }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: isSub ? 'rgba(255, 179, 0, 0.2)' : 'rgba(255,255,255,0.1)', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: isSub ? '#ffb300' : '#fff' }}>
                      {isSub ? 'S' : idx + 1}
                    </div>
                    {isSub ? 'SUPLENTE (OPCIONAL)' : `JUGADOR TITULAR #${idx + 1}`}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Media Evaluada:</span>
                    <strong style={{ color: 'var(--primate-orange)', fontSize: '15px' }}>{pts} pts</strong>
                  </div>
                </div>
                
                <div className="player-fields" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr 0.7fr 0.6fr', gap: '10px', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Riot ID</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="text" 
                        className="premium-input" 
                        placeholder="Usuario#TAG"
                        value={player.name}
                        onChange={e => handlePlayerChange(idx, 'name', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => fetchTrackerForPlayer(idx)}
                        className="btn-secondary"
                        style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}
                        title="Consultar datos de Tracker.gg para este usuario"
                        disabled={!player.name || !player.name.includes('#')}
                      >
                        <Search size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rango Actual</label>
                    <select 
                      className="premium-input"
                      value={player.currentRank || 0}
                      onChange={e => handlePlayerChange(idx, 'currentRank', parseInt(e.target.value))}
                    >
                      {RANKS.map((r, i) => (
                        <option key={i} value={i}>{r.name} ({r.points}p)</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Peak Rank</label>
                    <select 
                      className="premium-input"
                      value={player.peakRank || 0}
                      onChange={e => handlePlayerChange(idx, 'peakRank', parseInt(e.target.value))}
                    >
                      {RANKS.map((r, i) => (
                        <option key={i} value={i}>{r.name} ({r.points}p)</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Peak Cuándo</label>
                    <select 
                      className="premium-input"
                      value={player.peakRecency || 'recent'}
                      onChange={e => handlePlayerChange(idx, 'peakRecency', e.target.value)}
                    >
                      <option value="recent">Reciente (50/50)</option>
                      <option value="moderate">Moderado (60/40)</option>
                      <option value="old">Antiguo (70/30)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nivel</label>
                    <input 
                      type="number" 
                      className="premium-input" 
                      placeholder="+40"
                      value={player.level}
                      onChange={e => handlePlayerChange(idx, 'level', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resultado & Acciones */}
        <div className="glass-card" style={{ 
          padding: '28px', 
          display: 'flex', 
          flexDirection: 'column',
          border: `1px solid ${isTeamValid ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 70, 85, 0.3)'}`,
          background: isTeamValid ? 'rgba(0, 255, 136, 0.02)' : 'rgba(255, 70, 85, 0.02)',
          height: 'fit-content'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '84px', 
              fontFamily: "'Bebas Neue', sans-serif", 
              lineHeight: '0.9', 
              color: isPointsStandardValid ? '#fff' : (allowOverLimit ? 'var(--warning)' : 'var(--danger)') 
            }}>
              {totalPoints}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Puntos de Elo (3 Titulares) · Máx 16 pts
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: isPointsStandardValid ? 'var(--success)' : (allowOverLimit ? 'var(--warning)' : 'var(--danger)') }}>
              {isPointsStandardValid ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                Coste de Elo (Máx {MAX_POINTS} pts): {totalPoints} pts {allowOverLimit && !isPointsStandardValid && '⚠️ (Excepción activada)'}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: isDiffValid ? 'var(--success)' : 'var(--danger)' }}>
              {isDiffValid ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Brecha de Tiers: {tierDiff} Tiers (Máx 4)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: isLevelValid ? 'var(--success)' : 'var(--danger)' }}>
              {isLevelValid ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Cuentas Nivel +40 (Anti-Smurf)</span>
            </div>
          </div>

          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            textAlign: 'center',
            background: isTeamValid ? (allowOverLimit && !isPointsStandardValid ? 'rgba(255, 174, 0, 0.15)' : 'rgba(0, 255, 136, 0.15)') : 'rgba(255, 70, 85, 0.15)',
            color: isTeamValid ? (allowOverLimit && !isPointsStandardValid ? 'var(--warning)' : 'var(--success)') : 'var(--danger)',
            fontWeight: '700',
            letterSpacing: '1px',
            fontSize: '15px',
            marginBottom: '20px'
          }}>
            {isTeamValid 
              ? (allowOverLimit && !isPointsStandardValid ? '⚠️ APROBADO POR EXCEPCIÓN DE ELO' : '✅ EQUIPO VÁLIDO') 
              : '❌ EQUIPO NO CUMPLE RESTICCIONES'}
          </div>

          {/* Botones de acción principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={handleUploadToWeb} 
              disabled={!isTeamValid || loadingAction}
              className="btn-primary" 
              style={{ justifyContent: 'center', background: 'var(--primate-orange)', color: '#000', fontWeight: '700' }}
            >
              <Globe size={18} /> SUBIR A LA WEB & CONFIRMAR EN TICKET
            </button>

            {ticketId && (
              <>
                <button 
                  onClick={handleApprove} 
                  disabled={!isTeamValid || loadingAction}
                  className="btn-secondary" 
                  style={{ justifyContent: 'center', border: '1px solid var(--success)', color: 'var(--success)' }}
                >
                  <Check size={18} /> ENVIAR APROBACIÓN A DISCORD {allowOverLimit && !isPointsStandardValid ? '(EXCEPCIÓN)' : ''}
                </button>
                <button 
                  onClick={handleReject} 
                  disabled={loadingAction}
                  className="btn-secondary" 
                  style={{ justifyContent: 'center', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                >
                  <X size={18} /> RECHAZAR Y NOTIFICAR MOTIVO EN DISCORD
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Equipos Registrados Oficiales */}
      <div className="glass-card" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 className="title-font" style={{ fontSize: '22px', color: 'var(--primate-orange)', margin: 0 }}>
              Equipos Oficiales Registrados ({savedTeams.length})
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Equipos en base de datos. Los marcados con candado están ocultos al público de la web para esta copa.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {savedTeams.map((team) => (
            <div key={team.id} className="glass-card" style={{ padding: '18px', background: 'rgba(0,0,0,0.3)', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <img 
                  src={team.logo || '/copa-logo.png'} 
                  alt={team.name} 
                  style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>{team.name}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Total: {team.totalPoints ? `${team.totalPoints} pts` : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    onClick={() => handleToggleHidden(team.id)} 
                    className="btn-secondary" 
                    style={{ padding: '6px', color: team.hidden ? '#ffb300' : 'var(--success)' }}
                    title={team.hidden ? "Oculto (Haz clic para hacer público)" : "Público (Haz clic para ocultar)"}
                  >
                    {team.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteTeam(team.id)} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
                    title="Eliminar equipo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                {(team.players || []).map((p, idx) => (
                  <div key={idx} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{p.name}</span>
                    <strong style={{ color: '#fff' }}>
                      {p.currentRank ? `${p.currentRank} (Peak: ${p.peakRank})` : p.rank} {p.points ? `· ${p.points}p` : ''}
                    </strong>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: team.hidden ? '#ffb300' : 'var(--success)', fontWeight: '600' }}>
                  {team.hidden ? '🔒 Roster Oculto (Copa)' : '🌐 Público en Web'}
                </span>
                {team.overLimitApproved && (
                  <span style={{ color: 'var(--warning)', fontSize: '11px' }}>⚠️ Excepción Elo</span>
                )}
              </div>
            </div>
          ))}
          {savedTeams.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>
              No hay equipos registrados aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
