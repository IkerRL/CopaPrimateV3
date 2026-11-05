import { useState, useEffect } from 'react';
import { 
  Shuffle, Calendar, Save, RefreshCw, Edit3, X, Radio, 
  CheckCircle2, Clock, Crosshair, Award, Check
} from 'lucide-react';
import { apiFetch } from '../api';

const MAPS = ['Ascent', 'Bind', 'Haven', 'Split', 'Sunset', 'Lotus', 'Abyss'];
const VALORANT_AGENTS = [
  'Jett', 'Reyna', 'Omen', 'Sova', 'Clove', 'Cypher', 'Killjoy', 'Fade',
  'Raze', 'Brimstone', 'Viper', 'Breach', 'KAY/O', 'Skye', 'Iso', 'Gekko',
  'Deadlock', 'Chamber', 'Yoru', 'Astra', 'Harbor', 'Phoenix'
];

export default function DrawManager() {
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState({ A: [], B: [] });
  const [matches, setMatches] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [savingMatch, setSavingMatch] = useState(false);

  useEffect(() => {
    fetchTeamsAndMatches();
  }, []);

  const fetchTeamsAndMatches = async () => {
    try {
      const [teamsRes, matchesRes] = await Promise.all([
        apiFetch(`/teams`),
        apiFetch(`/matches`)
      ]);
      const teamsData = await teamsRes.json();
      const matchesData = await matchesRes.json();

      const loadedTeams = teamsData.teams || [];
      setTeams(loadedTeams);

      if (matchesData.groups && Object.keys(matchesData.groups).length > 0) {
        setGroups(matchesData.groups);
      } else {
        const half = Math.ceil(loadedTeams.length / 2);
        setGroups({
          A: loadedTeams.slice(0, half).map(t => ({ name: t.name, logo: t.logo })),
          B: loadedTeams.slice(half).map(t => ({ name: t.name, logo: t.logo }))
        });
      }

      if (matchesData.matches && matchesData.matches.length > 0) {
        setMatches(matchesData.matches);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ejecutar Sorteo Aleatorio de Grupos y Cruces
  const handleRunDraw = () => {
    if (teams.length < 2) {
      alert('Se necesitan al menos 2 equipos para realizar el sorteo.');
      return;
    }

    setIsDrawing(true);
    setFeedback(null);

    setTimeout(() => {
      const shuffled = [...teams].sort(() => 0.5 - Math.random());
      const half = Math.ceil(shuffled.length / 2);
      const groupA = shuffled.slice(0, half).map(t => ({ name: t.name, logo: t.logo || '/monkeys.jpg' }));
      const groupB = shuffled.slice(half).map(t => ({ name: t.name, logo: t.logo || '/monkeys.jpg' }));

      const newGroups = { A: groupA, B: groupB };
      setGroups(newGroups);

      const generatedMatches = [];
      let matchId = 1;

      // Partidos Grupo A
      for (let i = 0; i < groupA.length; i++) {
        for (let j = i + 1; j < groupA.length; j++) {
          generatedMatches.push({
            id: matchId++,
            group: 'A',
            t1: groupA[i],
            t2: groupA[j],
            map: MAPS[Math.floor(Math.random() * MAPS.length)],
            format: 'BO1 (Swiftplay)',
            date: `Jornada 1 · 20:${String(matchId * 15).padStart(2, '0')} CET`,
            status: 'Programado',
            score1: 0,
            score2: 0,
            round: 0,
            mvp: ''
          });
        }
      }

      // Partidos Grupo B
      for (let i = 0; i < groupB.length; i++) {
        for (let j = i + 1; j < groupB.length; j++) {
          generatedMatches.push({
            id: matchId++,
            group: 'B',
            t1: groupB[i],
            t2: groupB[j],
            map: MAPS[Math.floor(Math.random() * MAPS.length)],
            format: 'BO1 (Swiftplay)',
            date: `Jornada 1 · 21:${String(matchId * 15).padStart(2, '0')} CET`,
            status: 'Programado',
            score1: 0,
            score2: 0,
            round: 0,
            mvp: ''
          });
        }
      }

      setMatches(generatedMatches);
      setIsDrawing(false);
      setFeedback({ type: 'success', text: '🎲 ¡Sorteo oficial completado con éxito! Ahora puedes ajustar horarios y publicar los cruces.' });
    }, 1000);
  };

  // Guardar y publicar sorteo en la API para la web
  const handlePublishDraw = async () => {
    try {
      const res = await apiFetch(`/matches/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups, matches })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: '🚀 ¡Sorteo y calendario oficial publicados en la web en tiempo real!' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error al publicar sorteo' });
    }
  };

  // Abrir editor de partido y preparar estadísticas de jugadores
  const openMatchEditor = (m) => {
    const fullTeam1 = teams.find(t => t.name?.toLowerCase() === m.t1?.name?.toLowerCase());
    const fullTeam2 = teams.find(t => t.name?.toLowerCase() === m.t2?.name?.toLowerCase());

    const initPlayers = (team, existingStats) => {
      if (Array.isArray(existingStats) && existingStats.length > 0) {
        return existingStats;
      }
      if (team && Array.isArray(team.players) && team.players.length > 0) {
        return team.players.map(p => ({
          name: p.name || 'Jugador',
          agent: p.agent || (p.agents && p.agents[0]) || 'Jett',
          kills: 0,
          deaths: 0,
          assists: 0
        }));
      }
      return [
        { name: 'Jugador 1', agent: 'Jett', kills: 0, deaths: 0, assists: 0 },
        { name: 'Jugador 2', agent: 'Reyna', kills: 0, deaths: 0, assists: 0 },
        { name: 'Jugador 3', agent: 'Omen', kills: 0, deaths: 0, assists: 0 },
      ];
    };

    setEditingMatch({
      ...m,
      date: m.date || 'Jornada 1 · 20:00 CET',
      status: m.status || 'Programado',
      map: m.map || 'Ascent',
      score1: m.score1 ?? 0,
      score2: m.score2 ?? 0,
      round: m.round ?? (Number(m.score1 || 0) + Number(m.score2 || 0) || 1),
      mvp: m.mvp || '',
      playerStats: {
        t1: initPlayers(fullTeam1, m.playerStats?.t1),
        t2: initPlayers(fullTeam2, m.playerStats?.t2),
      }
    });
  };

  // Guardar cambios de un partido individual (Horarios, Mapa, Resultados, Stats)
  const handleSaveMatch = async () => {
    if (!editingMatch) return;
    setSavingMatch(true);

    try {
      const res = await apiFetch(`/matches/${editingMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingMatch,
          updateTeamStats: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setMatches(prev => prev.map(m => m.id === editingMatch.id ? data.match : m));
        setEditingMatch(null);
        setFeedback({ type: 'success', text: `✅ ¡Partido #${editingMatch.id} actualizado con éxito! Horarios y estadísticas sincronizados con la web.` });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Error al actualizar el partido' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de conexión con el bot' });
    }
    setSavingMatch(false);
  };

  // Emitir partido directamente al Marcador en Vivo
  const handleBroadcastLive = async () => {
    if (!editingMatch) return;
    try {
      await apiFetch('/live-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match: {
            active: true,
            status: 'LIVE',
            team1: { name: editingMatch.t1.name, logo: editingMatch.t1.logo, score: Number(editingMatch.score1) || 0 },
            team2: { name: editingMatch.t2.name, logo: editingMatch.t2.logo, score: Number(editingMatch.score2) || 0 },
            map: editingMatch.map,
            round: Number(editingMatch.round) || 1,
            mvp: editingMatch.mvp,
            notes: `Partido en directo. ${editingMatch.t1.name} vs ${editingMatch.t2.name}`
          }
        })
      });
      setFeedback({ type: 'success', text: '🔴 ¡Marcador en vivo emitido! El LiveBanner de la web oficial se ha iluminado.' });
    } catch {
      setFeedback({ type: 'error', text: 'Error al emitir al marcador en vivo' });
    }
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2>Gestor de Sorteo, Horarios & Estadísticas</h2>
          <p>Organiza los grupos, programa los horarios de cada cruce y registra K/D/A y agentes jugados.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            onClick={handleRunDraw} 
            disabled={isDrawing || teams.length === 0}
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--primate-orange)', color: 'var(--primate-orange)' }}
          >
            <Shuffle size={16} className={isDrawing ? 'spin' : ''} /> {isDrawing ? 'Sorteando...' : '🎲 Ejecutar Sorteo Aleatorio'}
          </button>

          <button 
            type="button"
            onClick={handlePublishDraw} 
            className="btn-primary" 
            style={{ background: 'var(--primate-orange)', color: '#000', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} /> Publicar Calendario a la Web
          </button>
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
          <button type="button" onClick={() => setFeedback(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Grupos del Torneo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {Object.entries(groups).map(([gName, gTeams]) => (
          <div key={gName} className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', color: '#fff', margin: 0, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
                GRUPO {gName} ({gTeams.length} Equipos)
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fase Regular</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {gTeams.map((t, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <img src={t.logo || '/monkeys.jpg'} alt={t.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                  <strong style={{ color: '#fff', fontSize: '15px' }}>{t.name}</strong>
                </div>
              ))}
              {gTeams.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '10px 0' }}>
                  Sin equipos en este grupo. Pulsa en "Ejecutar Sorteo".
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Calendario de Cruces & Modificador de Horarios y Estadísticas */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} color="var(--primary)" /> Calendario de Partidos & Horarios ({matches.length})
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Pulsa en <strong>"Editar Partido"</strong> para cambiar la fecha/hora o registrar K/D/A y agentes.
            </p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px' }}>
            BO1 Swiftplay
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {matches.map((m) => {
            const isLive = /live|vivo/i.test(m.status || '');
            const isFinished = /final|terminad/i.test(m.status || '');

            return (
              <div 
                key={m.id} 
                style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '18px', 
                  borderRadius: '12px', 
                  border: isLive ? '1px solid #ff4655' : isFinished ? '1px solid rgba(0,255,136,0.3)' : '1px solid var(--glass-border)',
                  boxShadow: isLive ? '0 0 16px rgba(255,70,85,0.2)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 600 }}>
                      <Clock size={13} color="var(--primary)" /> {m.date || 'Jornada 1'}
                    </span>
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontWeight: 700,
                        background: isLive ? 'rgba(255,70,85,0.2)' : isFinished ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.08)',
                        color: isLive ? '#ff4655' : isFinished ? 'var(--success)' : 'var(--text-muted)'
                      }}
                    >
                      {m.status || 'Programado'}
                    </span>
                  </div>

                  {/* Enfrentamiento */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <img src={m.t1?.logo || '/monkeys.jpg'} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{m.t1?.name}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--primary)', fontFamily: "'Bebas Neue', sans-serif" }}>
                        {m.score1 !== undefined && m.score2 !== undefined && (isFinished || isLive) ? `${m.score1} - ${m.score2}` : 'VS'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m.map || 'Ascent'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flex: 1 }}>
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{m.t2?.name}</span>
                      <img src={m.t2?.logo || '/gorilas.jpg'} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>

                {/* Botón de Editar Partido */}
                <button
                  type="button"
                  onClick={() => openMatchEditor(m)}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(255, 179, 0, 0.1)',
                    border: '1px solid rgba(255, 179, 0, 0.3)',
                    color: 'var(--primary)'
                  }}
                >
                  <Edit3 size={13} /> Editar Horario & Estadísticas
                </button>
              </div>
            );
          })}

          {matches.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0', gridColumn: '1 / -1' }}>
              No se han generado partidos. Pulsa en "Ejecutar Sorteo Aleatorio" para crearlos.
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL DE EDICIÓN DE PARTIDO, HORARIOS Y STATS ================= */}
      {editingMatch && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setEditingMatch(null)}
        >
          <div
            style={{
              background: '#0d1813',
              border: '1px solid var(--border-gold)',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.9)',
              color: '#fff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Panel de Moderación de Partido #{editingMatch.id}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '20px', color: '#fff' }}>
                  {editingMatch.t1?.name} vs {editingMatch.t2?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Ajustes Generales del Partido */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Horario & Fecha (Visible en web)
                </label>
                <input
                  type="text"
                  value={editingMatch.date}
                  onChange={(e) => setEditingMatch({ ...editingMatch, date: e.target.value })}
                  placeholder="Ej: Sábado 20:30 CET"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Estado del Encuentro
                </label>
                <select
                  value={editingMatch.status}
                  onChange={(e) => setEditingMatch({ ...editingMatch, status: e.target.value })}
                  style={{ width: '100%', background: '#091510', border: '1px solid var(--glass-border)', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="Programado">Programado</option>
                  <option value="En Directo (LIVE)">🔴 En Directo (LIVE)</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Mapa Oficial
                </label>
                <select
                  value={editingMatch.map}
                  onChange={(e) => setEditingMatch({ ...editingMatch, map: e.target.value })}
                  style={{ width: '100%', background: '#091510', border: '1px solid var(--glass-border)', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                >
                  {MAPS.map((mp) => (
                    <option key={mp} value={mp}>{mp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Tanteo ({editingMatch.t1?.name} - {editingMatch.t2?.name})
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={editingMatch.score1}
                    onChange={(e) => setEditingMatch({ ...editingMatch, score1: Number(e.target.value) })}
                    style={{ width: '60px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', padding: '9px', borderRadius: '8px', textAlign: 'center', fontWeight: 700 }}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={editingMatch.score2}
                    onChange={(e) => setEditingMatch({ ...editingMatch, score2: Number(e.target.value) })}
                    style={{ width: '60px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', padding: '9px', borderRadius: '8px', textAlign: 'center', fontWeight: 700 }}
                  />
                  <input
                    type="text"
                    placeholder="MVP"
                    value={editingMatch.mvp || ''}
                    onChange={(e) => setEditingMatch({ ...editingMatch, mvp: e.target.value })}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN DE ESTADÍSTICAS INDIVIDUALES POR JUGADOR */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crosshair size={18} /> Estadísticas por Jugador (Agente y K/D/A)
              </h4>
              <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Introduce qué agente jugó cada participante y sus bajas, muertes y asistencias para reflejarlas en la web.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Equipo 1 */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
                    {editingMatch.t1?.name}
                  </strong>
                  {(editingMatch.playerStats?.t1 || []).map((p, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{p.name}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={p.agent}
                          onChange={(e) => {
                            const newT1 = [...editingMatch.playerStats.t1];
                            newT1[pIdx].agent = e.target.value;
                            setEditingMatch({ ...editingMatch, playerStats: { ...editingMatch.playerStats, t1: newT1 } });
                          }}
                          style={{ flex: 1.5, background: '#091510', border: '1px solid var(--glass-border)', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '12px' }}
                        >
                          {VALORANT_AGENTS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="K"
                          title="Kills"
                          value={p.kills}
                          onChange={(e) => {
                            const newT1 = [...editingMatch.playerStats.t1];
                            newT1[pIdx].kills = Number(e.target.value);
                            setEditingMatch({ ...editingMatch, playerStats: { ...editingMatch.playerStats, t1: newT1 } });
                          }}
                          style={{ width: '42px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#00ff88', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="D"
                          title="Muertes"
                          value={p.deaths}
                          onChange={(e) => {
                            const newT1 = [...editingMatch.playerStats.t1];
                            newT1[pIdx].deaths = Number(e.target.value);
                            setEditingMatch({ ...editingMatch, playerStats: { ...editingMatch.playerStats, t1: newT1 } });
                          }}
                          style={{ width: '42px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#ff4655', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="A"
                          title="Asistencias"
                          value={p.assists}
                          onChange={(e) => {
                            const newT1 = [...editingMatch.playerStats.t1];
                            newT1[pIdx].assists = Number(e.target.value);
                            setEditingMatch({ ...editingMatch, playerStats: { ...editingMatch.playerStats, t1: newT1 } });
                          }}
                          style={{ width: '42px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#38bdf8', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Equipo 2 */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
                    {editingMatch.t2?.name}
                  </strong>
                  {(editingMatch.playerStats?.t2 || []).map((p, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{p.name}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={p.agent}
                          onChange={(e) => {
                            const newT2 = [...editingMatch.playerStats.t2];
                            newT2[pIdx].agent = e.target.value;
                            setEditingMatch({ ...editingMatch, playerStats: { ...editingMatch.playerStats, t2: newT2 } });
                          }}
                          style={{ flex: 1.5, background: '#091510', border: '1px solid var(--glass-border)', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '12px' }}
                        >
                          {VALORANT_AGENTS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="K"
                          title="Kills"
                          value={p.kills}
                          onChange={(e) => {
                            const newT2 = [...editingMatch.playerStats.t2];
                            newT2[pIdx].kills = Number(e.target.value);
                            setEditingMatch({ ...editingMatch, playerStats: { ...editingMatch.playerStats, t2: newT2 } });
                          }}
                          style={{ width: '42px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#00ff88', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="D"
                          title="Muertes"
                          value={p.deaths}
                          onChange={(e) => {
                            const newT2 = [...editingMatch.playerStats.t2];
                            newT2[pIdx].deaths = Number(e.target.value);
                            setEditingMatch({ ...editingMatch, playerStats: { ...editingMatch.playerStats, t2: newT2 } });
                          }}
                          style={{ width: '42px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#ff4655', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="A"
                          title="Asistencias"
                          value={p.assists}
                          onChange={(e) => {
                            const newT2 = [...editingMatch.playerStats.t2];
                            newT2[pIdx].assists = Number(e.target.value);
                            setEditingMatch({ ...editingMatch, playerStats: { ...editingMatch.playerStats, t2: newT2 } });
                          }}
                          style={{ width: '42px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#38bdf8', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
              <button
                type="button"
                onClick={handleBroadcastLive}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4655', border: '1px solid #ff4655' }}
              >
                <Radio size={16} /> Emitir al Marcador en Vivo
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMatch}
                  disabled={savingMatch}
                  className="btn-primary"
                  style={{ background: 'var(--primary)', color: '#000', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={16} /> {savingMatch ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
