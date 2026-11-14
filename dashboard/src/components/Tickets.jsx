import { useState, useEffect, useRef } from 'react';
import { 
  Send, RefreshCw, MessageSquare, Download, XCircle, Check, AlertTriangle, 
  Upload, Eye, EyeOff, Globe, Image as ImageIcon, ChevronDown, ChevronUp, ShieldAlert, Sparkles, Search
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

export default function Tickets({ onExtract }) {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Panel de gestión y aprobación dentro del ticket
  const [showRosterPanel, setShowRosterPanel] = useState(false);
  const [ticketTeamName, setTicketTeamName] = useState('');
  const [ticketLogo, setTicketLogo] = useState('/copa-logo.png');
  const [allowOverLimit, setAllowOverLimit] = useState(false);
  const [isHidden, setIsHidden] = useState(true); // Ocultos por defecto para esta copa
  const [ticketPlayers, setTicketPlayers] = useState([
    { name: '', currentRank: 0, peakRank: 0, level: '' },
    { name: '', currentRank: 0, peakRank: 0, level: '' },
    { name: '', currentRank: 0, peakRank: 0, level: '' },
    { name: '', currentRank: 0, peakRank: 0, level: '' },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/tickets`);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getRankIndex = (rankStr) => {
    if (!rankStr) return 0;
    const str = rankStr.toLowerCase();
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

  const openTicket = async (ticket) => {
    setActiveTicket(ticket);
    setLoading(true);
    setActionFeedback(null);
    setShowRosterPanel(false);

    try {
      const res = await apiFetch(`/tickets/${ticket.id}/messages`);
      const data = await res.json();
      const msgs = data.messages || [];
      setMessages(msgs);

      // Auto-analizar enlaces e imágenes del ticket
      autoPopulateRosterFromMessages(ticket, msgs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Consulta live a la API de Tracker para un jugador específico
  const fetchTrackerForPlayer = async (index, riotId) => {
    const target = (riotId || ticketPlayers[index]?.name || '').trim();
    if (!target.includes('#')) return;
    const parts = target.split('#');
    const u = encodeURIComponent(parts[0].trim());
    const t = encodeURIComponent(parts[1].trim());

    try {
      const res = await apiFetch(`/tracker/profile?username=${u}&tag=${t}`);
      const data = await res.json();
      if (data?.profile) {
        const p = data.profile;
        setTicketPlayers(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            name: `${p.name}#${p.tag}`,
            currentRank: getRankIndex(p.currentRankText),
            peakRank: getRankIndex(p.peakRankText || p.currentRankText),
            level: String(p.level || '')
          };
          return next;
        });
        setActionFeedback({ type: 'success', text: `✅ Tracker actualizado para ${p.name}#${p.tag}: ${p.currentRankText} (Peak: ${p.peakRankText}) - Nivel ${p.level}` });
      } else {
        setActionFeedback({ type: 'error', text: `❌ No se encontraron datos para ${target}` });
      }
    } catch (err) {
      console.warn('Error consultando tracker:', err.message);
    }
  };

  const fetchAllTrackerData = async () => {
    setActionLoading(true);
    for (let i = 0; i < ticketPlayers.length; i++) {
      if (ticketPlayers[i].name && ticketPlayers[i].name.includes('#')) {
        await fetchTrackerForPlayer(i, ticketPlayers[i].name);
      }
    }
    setActionLoading(false);
  };

  // Extraer datos de los mensajes para precargar el panel
  const autoPopulateRosterFromMessages = (ticket, msgs) => {
    const urls = [];
    const regex = /tracker\.gg\/valorant\/profile\/riot\/([^/\n\r?]+)/gi;
    const statsMap = {};
    let foundLogo = '/copa-logo.png';

    msgs.forEach(m => {
      const text = m.content || '';
      let match;
      while ((match = regex.exec(text)) !== null) {
        let rawId = match[1].split('?')[0].replace(/[>)]+$/, '').trim();
        try {
          rawId = decodeURIComponent(rawId);
        } catch {}
        if (rawId && !urls.includes(rawId)) {
          urls.push(rawId);
        }
      }

      // Buscar si el usuario subió imagen
      if (m.attachments && m.attachments.length > 0) {
        const img = m.attachments.find(a => a.contentType?.startsWith('image/') || a.url?.match(/\.(png|jpe?g|webp)/i));
        if (img) foundLogo = img.url;
      }

      // Buscar embeds del bot
      if (m.isBot && m.embeds && m.embeds.length > 0) {
        m.embeds.forEach(embed => {
          if (embed.title && embed.title.startsWith('Estadísticas de ')) {
            const riotId = embed.title.replace('Estadísticas de ', '').trim();
            let currentRank = '';
            let peakRank = '';
            let level = '';
            
            if (embed.fields) {
              embed.fields.forEach(f => {
                const fn = (f.name || '').toLowerCase();
                const fv = (f.value || '').trim();
                if (fn.includes('rango') && !fn.includes('peak')) {
                  currentRank = fv;
                } else if (fn.includes('peak')) {
                  peakRank = fv;
                } else if (fn.includes('nivel')) {
                  const numMatch = fv.match(/\b\d+\b/);
                  if (numMatch) level = numMatch[0];
                }
              });
            }
            if (!peakRank && currentRank) peakRank = currentRank;
            if (!currentRank && peakRank) currentRank = peakRank;
            statsMap[riotId] = { currentRank: currentRank || 'Unranked', peakRank: peakRank || 'Unranked', level };
          }
        });
      }
    });

    const uniqueIds = [...new Set(urls)].slice(0, 4);
    const parsedPlayers = uniqueIds.map(id => {
      const s = statsMap[id] || { currentRank: 'Unranked', peakRank: 'Unranked', level: '' };
      return {
        name: id,
        currentRank: getRankIndex(s.currentRank),
        peakRank: getRankIndex(s.peakRank),
        level: s.level || ''
      };
    });

    while (parsedPlayers.length < 4) {
      parsedPlayers.push({ name: '', currentRank: 0, peakRank: 0, level: '' });
    }

    setTicketTeamName(`Team ${ticket.name.replace('ticket-', '')}`);
    setTicketLogo(foundLogo);
    setTicketPlayers(parsedPlayers);

    // Auto-consultar datos en vivo para los que no tengan rango detectado de embeds
    parsedPlayers.forEach((p, idx) => {
      if (p.name && p.name.includes('#') && p.currentRank === 0 && !p.level) {
        fetchTrackerForPlayer(idx, p.name);
      }
    });
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    
    const text = replyText;
    setReplyText(''); 

    try {
      const res = await apiFetch(`/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      if (data.success) {
        openTicket(activeTicket);
      }
    } catch (err) {
      console.error(err);
      setReplyText(text); 
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    const ok = window.confirm(`¿Confirmas que deseas cerrar y eliminar el ticket #${activeTicket.name}? El canal de Discord se eliminará.`);
    if (!ok) return;

    setClosing(true);
    try {
      const res = await apiFetch(`/tickets/${activeTicket.id}/close`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActiveTicket(null);
        setTimeout(fetchTickets, 1500);
      }
    } catch (err) {
      console.error('Error cerrando ticket:', err);
    }
    setClosing(false);
  };

  // Cálculo individual de puntos para un jugador (media ponderada actual y peak)
  const calculatePlayerPoints = (p) => {
    const cur = RANKS[p.currentRank || 0]?.points || 1;
    const peak = RANKS[p.peakRank !== undefined ? p.peakRank : 0]?.points || cur;
    const maxPeak = Math.max(cur, peak);
    const avg = (cur * 0.5) + (maxPeak * 0.5);
    return Math.round(avg * 10) / 10;
  };

  // Puntos del trío titular
  const starters = ticketPlayers.slice(0, 3);
  const totalTicketPoints = Math.round(starters.reduce((sum, p) => sum + calculatePlayerPoints(p), 0) * 10) / 10;
  const starterTiers = starters.map(p => RANKS[p.peakRank || p.currentRank || 0].tier);
  const tierDiff = Math.max(...starterTiers) - Math.min(...starterTiers);
  const isPointsStandardValid = totalTicketPoints <= MAX_POINTS;
  const isPointsPermitted = isPointsStandardValid || allowOverLimit;
  const isDiffValid = tierDiff <= 4;
  const isLevelValid = starters.every(p => p.level === '' || parseInt(p.level) >= 40);

  // APROBAR DIRECTO EN DISCORD
  const handleApproveInTicket = async () => {
    if (!activeTicket) return;
    setActionLoading(true);
    try {
      const activePlayers = ticketPlayers.filter(p => p.name.trim() !== '');
      const res = await apiFetch(`/tickets/${activeTicket.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          teamName: ticketTeamName || activeTicket.name,
          totalPoints: totalTicketPoints,
          tierDiff,
          overLimitApproved: allowOverLimit && !isPointsStandardValid,
          players: activePlayers.map(p => ({
            name: p.name,
            rank: `${RANKS[p.currentRank].name} (Peak: ${RANKS[p.peakRank].name}) - ${calculatePlayerPoints(p)} pts`,
            level: p.level || '40',
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({ type: 'success', text: `✅ Veredicto de Aprobación ${allowOverLimit && !isPointsStandardValid ? '(CON EXCEPCIÓN)' : ''} enviado al ticket!` });
      }
    } catch (err) {
      console.error(err);
      setActionFeedback({ type: 'error', text: 'Error al enviar veredicto a Discord' });
    }
    setActionLoading(false);
  };

  // SUBIR A LA WEB & CONFIRMAR EN EL TICKET
  const handleUploadToWebAndConfirm = async () => {
    if (!activeTicket) return;
    setActionLoading(true);

    const teamPayload = {
      name: ticketTeamName || `Equipo #${activeTicket.name}`,
      logo: ticketLogo,
      hidden: isHidden,
      overLimitApproved: allowOverLimit && !isPointsStandardValid,
      totalPoints: totalTicketPoints,
      ticketSource: activeTicket.name,
      players: ticketPlayers.filter(p => p.name.trim() !== '').map(p => ({
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
          notifyTicketId: activeTicket.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({ 
          type: 'success', 
          text: `🎉 ¡Equipo subido a la web (${isHidden ? 'Oculto para esta Copa' : 'Público'}) y mensaje de confirmación enviado al ticket de Discord!` 
        });
      }
    } catch (err) {
      console.error(err);
      setActionFeedback({ type: 'error', text: 'Error al registrar en la web' });
    }
    setActionLoading(false);
  };

  // Extraer al Calculador de Equipos
  const handleExtractToCalculator = () => {
    if (!activeTicket) return;
    const teamData = {
      ticketId: activeTicket.id,
      ticketName: activeTicket.name,
      logo: ticketLogo,
      players: ticketPlayers.map(p => ({
        name: p.name,
        currentRank: p.currentRank,
        peakRank: p.peakRank,
        rank: p.peakRank,
        level: p.level
      }))
    };
    if (onExtract) onExtract(teamData);
  };

  return (
    <div className="tickets-layout">
      {/* Ticket List Sidebar */}
      <div className="glass-card tickets-list">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="title-font" style={{ fontSize: '24px', margin: 0, color: 'var(--primate-orange)' }}>Tickets Abiertos</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Canales de soporte & registro</p>
          </div>
          <button onClick={fetchTickets} className="btn-secondary" style={{ padding: '8px' }} title="Recargar tickets">
            <RefreshCw size={18} className={loading && !activeTicket ? 'spin' : ''} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {tickets.map(t => (
            <div 
              key={t.id} 
              className={`ticket-list-item ${activeTicket?.id === t.id ? 'active' : ''}`}
              onClick={() => openTicket(t)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={16} color="var(--primate-orange)" />
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#fff', fontSize: '15px' }}>#{t.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
          {tickets.length === 0 && !loading && (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No hay tickets activos en Discord.
            </div>
          )}
        </div>
      </div>

      {/* Ticket Chat View */}
      <div className="glass-card tickets-chat">
        {activeTicket ? (
          <>
            {/* Header del Ticket */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="title-font" style={{ fontSize: '24px', color: '#fff', margin: 0 }}>#{activeTicket.name}</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {activeTicket.id}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setShowRosterPanel(prev => !prev)} 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: showRosterPanel ? '#333' : 'var(--primate-orange)', color: showRosterPanel ? '#fff' : '#000' }}
                >
                  <Sparkles size={16} /> {showRosterPanel ? 'Ocultar Panel Roster' : '⚡ Gestionar & Aprobar Roster'}
                </button>

                <button onClick={handleExtractToCalculator} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--primate-orange)', color: 'var(--primate-orange)' }}>
                  <Download size={16} /> Abrir Calculador
                </button>

                <button onClick={handleCloseTicket} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--danger)', color: 'var(--danger)' }} disabled={closing}>
                  <XCircle size={16} /> {closing ? 'Cerrando...' : 'Cerrar Ticket'}
                </button>
              </div>
            </div>

            {/* Notificación de acción */}
            {actionFeedback && (
              <div style={{
                padding: '12px 20px',
                background: actionFeedback.type === 'success' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 70, 85, 0.15)',
                borderBottom: `1px solid ${actionFeedback.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                color: actionFeedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{actionFeedback.text}</span>
                <button onClick={() => setActionFeedback(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
              </div>
            )}

            {/* PANEL DE GESTIÓN Y APROBACIÓN INTEGRADO */}
            {showRosterPanel && (
              <div style={{
                background: 'rgba(20, 20, 24, 0.95)',
                borderBottom: '2px solid var(--primate-orange)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Thumbnail del Logo */}
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#000' }}>
                      <img src={ticketLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={ticketTeamName} 
                        onChange={e => setTicketTeamName(e.target.value)}
                        placeholder="Nombre del equipo"
                        className="premium-input"
                        style={{ fontSize: '16px', fontWeight: '600', padding: '6px 12px' }}
                      />
                    </div>
                  </div>

                  {/* Puntuación Actual vs Límite 16 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '28px', fontFamily: "'Bebas Neue', sans-serif", color: isPointsStandardValid ? '#fff' : (allowOverLimit ? 'var(--warning)' : 'var(--danger)') }}>
                        {totalTicketPoints} / {MAX_POINTS} pts
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Coste de Elo (3 Titulares)</span>
                    </div>

                    <div style={{ 
                      padding: '6px 12px', 
                      borderRadius: '6px', 
                      background: isPointsPermitted ? (allowOverLimit && !isPointsStandardValid ? 'rgba(255,174,0,0.2)' : 'rgba(0,255,136,0.15)') : 'rgba(255,70,85,0.2)',
                      color: isPointsPermitted ? (allowOverLimit && !isPointsStandardValid ? 'var(--warning)' : 'var(--success)') : 'var(--danger)',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}>
                      {isPointsStandardValid ? '✅ DENTRO DEL LÍMITE' : (allowOverLimit ? '⚠️ EXCEPCIÓN CONCEDIDA' : '❌ SUPERA 16 PTS')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Jugadores del Ticket</span>
                  <button
                    type="button"
                    onClick={fetchAllTrackerData}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    disabled={actionLoading}
                  >
                    <RefreshCw size={12} className={actionLoading ? 'animate-spin' : ''} /> Consultar Todo en Tracker
                  </button>
                </div>

                {/* Jugadores detectados en el ticket */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {ticketPlayers.map((p, idx) => {
                    const isSub = idx === 3;
                    const pts = calculatePlayerPoints(p);
                    return (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>{isSub ? 'Suplente' : `Titular ${idx + 1}`}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {p.level && <span style={{ color: parseInt(p.level) >= 40 ? 'var(--success)' : 'var(--danger)', fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: '4px' }}>Nv {p.level}</span>}
                            <strong style={{ color: 'var(--primate-orange)' }}>{pts} pts</strong>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                          <input 
                            type="text" 
                            value={p.name} 
                            placeholder="Usuario#TAG"
                            onChange={e => {
                              const updated = [...ticketPlayers];
                              updated[idx].name = e.target.value;
                              setTicketPlayers(updated);
                            }}
                            className="premium-input"
                            style={{ fontSize: '12px', padding: '4px 8px', flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => fetchTrackerForPlayer(idx, p.name)}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                            title="Consultar datos de Tracker.gg para este usuario"
                            disabled={!p.name || !p.name.includes('#') || actionLoading}
                          >
                            <Search size={12} />
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <select 
                            value={p.currentRank} 
                            onChange={e => {
                              const updated = [...ticketPlayers];
                              updated[idx].currentRank = parseInt(e.target.value);
                              setTicketPlayers(updated);
                            }}
                            className="premium-input"
                            style={{ fontSize: '11px', padding: '4px' }}
                            title="Rango Actual"
                          >
                            {RANKS.map((r, i) => <option key={i} value={i}>Act: {r.name}</option>)}
                          </select>
                          <select 
                            value={p.peakRank} 
                            onChange={e => {
                              const updated = [...ticketPlayers];
                              updated[idx].peakRank = parseInt(e.target.value);
                              setTicketPlayers(updated);
                            }}
                            className="premium-input"
                            style={{ fontSize: '11px', padding: '4px' }}
                            title="Peak Rank"
                          >
                            {RANKS.map((r, i) => <option key={i} value={i}>Peak: {r.name}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Toggles de Excepción & Oculto + Botones de Acción */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Toggle Aceptar aunque supere el límite */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: allowOverLimit ? 'var(--warning)' : '#fff' }}>
                      <input 
                        type="checkbox" 
                        checked={allowOverLimit} 
                        onChange={e => setAllowOverLimit(e.target.checked)} 
                        style={{ accentColor: 'var(--warning)', width: '16px', height: '16px' }}
                      />
                      <span><strong>Aceptar aunque supere el límite (16 pts)</strong></span>
                    </label>

                    {/* Toggle Oculto en la web para esta copa */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: isHidden ? '#ffb300' : 'var(--text-muted)' }}>
                      <input 
                        type="checkbox" 
                        checked={isHidden} 
                        onChange={e => setIsHidden(e.target.checked)} 
                        style={{ accentColor: 'var(--primate-orange)', width: '16px', height: '16px' }}
                      />
                      <span>🔒 Oculto en la web para esta Copa</span>
                    </label>
                  </div>

                  {/* Acciones principales */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={handleApproveInTicket}
                      disabled={(!isPointsPermitted || actionLoading)}
                      className="btn-secondary"
                      style={{ border: '1px solid var(--success)', color: 'var(--success)' }}
                    >
                      <Check size={16} /> Aprobar en Discord {allowOverLimit && !isPointsStandardValid ? '(Excepción)' : ''}
                    </button>

                    <button 
                      onClick={handleUploadToWebAndConfirm}
                      disabled={(!isPointsPermitted || actionLoading)}
                      className="btn-primary"
                      style={{ background: 'var(--primate-orange)', color: '#000', fontWeight: '700' }}
                    >
                      <Globe size={16} /> Subir a la Web & Confirmar en Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mensajes del Ticket */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
              {loading && messages.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <RefreshCw size={32} className="spin" color="var(--primate-orange)" />
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="chat-message">
                    <img src={msg.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="chat-avatar" alt="avatar" />
                    <div className="chat-body">
                      <div className="chat-header">
                        <span className="chat-author" style={{ color: msg.isBot ? 'var(--primate-orange)' : '#fff' }}>{msg.author}</span>
                        {msg.isBot && <span className="chat-bot-tag">BOT</span>}
                        <span className="chat-time">{new Date(msg.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="chat-content">{msg.content}</div>
                      
                      {/* Embeds del mensaje */}
                      {msg.embeds && msg.embeds.map((emb, idx) => (
                        <div key={idx} style={{ 
                          marginTop: '8px', 
                          background: 'rgba(0,0,0,0.4)', 
                          borderLeft: '3px solid var(--primate-orange)', 
                          padding: '12px 14px', 
                          borderRadius: '4px' 
                        }}>
                          {emb.title && <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '14px' }}>{emb.title}</h4>}
                          {emb.description && <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-muted)' }}>{emb.description}</p>}
                          {emb.fields && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                              {emb.fields.map((f, fi) => (
                                <div key={fi} style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px' }}>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.name}</div>
                                  <div style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{f.value}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Adjuntos del mensaje (Imágenes) */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                          {msg.attachments.map((att, i) => (
                            att.contentType?.startsWith('image/') || att.url?.match(/\.(png|jpe?g|webp)/i) ? (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '340px' }}>
                                <img src={att.url} alt="Attachment" className="chat-image" style={{ borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} />
                                <button 
                                  onClick={() => {
                                    setTicketLogo(att.url);
                                    setShowRosterPanel(true);
                                    setActionFeedback({ type: 'success', text: '📸 Imagen seleccionada como Logo del equipo' });
                                  }}
                                  className="btn-secondary" 
                                  style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}
                                >
                                  <ImageIcon size={14} /> Usar como Logo del Equipo
                                </button>
                              </div>
                            ) : (
                              <a key={i} href={att.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primate-orange)', fontSize: '14px' }}>
                                📁 Ver Archivo Adjunto
                              </a>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulario de Respuesta */}
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
              <form onSubmit={handleReply} style={{ display: 'flex', gap: '15px' }}>
                <input 
                  type="text" 
                  className="premium-input" 
                  placeholder={`Mensaje en #${activeTicket.name}...`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                  <Send size={18} /> ENVIAR
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <MessageSquare size={64} style={{ opacity: 0.2, marginBottom: '20px' }} />
            <h2 className="title-font" style={{ fontSize: '32px' }}>SELECCIONA UN TICKET</h2>
            <p>Elige un ticket de la lista para ver la conversación y gestionar el roster.</p>
          </div>
        )}
      </div>
    </div>
  );
}
