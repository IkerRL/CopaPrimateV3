import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Gauge, Lock, EyeOff, Users, Search, Maximize2, X } from 'lucide-react';
import { usePageTitle, useReveal } from '../hooks';
import { usePublicTeams } from '../api';
import { RANKS, teamPoints } from '../data';
import { getAgentIcon, getRankIcon } from '../agents';

function getPlayerAgentCounts(player) {
  const list = Array.isArray(player.agents) && player.agents.length > 0
    ? player.agents
    : player.agent
      ? [player.agent]
      : [];

  const counts = {};
  for (const ag of list) {
    if (!ag) continue;
    counts[ag] = (counts[ag] || 0) + 1;
  }
  return Object.entries(counts).map(([agent, count]) => ({ agent, count }));
}

function getPlayerStats(player, fallbackIdx = 0) {
  if (player.stats && typeof player.stats.kills === 'number') {
    return player.stats;
  }
  const defaults = [
    { kills: 13, deaths: 5, assists: 9 },
    { kills: 22, deaths: 12, assists: 10 },
    { kills: 17, deaths: 14, assists: 15 },
  ];
  return defaults[fallbackIdx % defaults.length];
}

export default function TeamsPage() {
  usePageTitle('Equipos');
  useReveal();

  const { teams } = usePublicTeams();
  const [search, setSearch] = useState('');
  const [zoomTeam, setZoomTeam] = useState(null);

  // Cerrar modal de zoom al pulsar tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setZoomTeam(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Separar equipos públicos de los clasificados / secretos
  const publicTeams = teams.filter(t => !t.hidden && t.status !== 'Aprobado (Oculto)' && t.status !== 'Oculto');
  const hiddenTeams = teams.filter(t => t.hidden || t.status === 'Aprobado (Oculto)' || t.status === 'Oculto');

  const filteredPublic = publicTeams.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.players?.some(p => p.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <header className="page-header" data-watermark="ROSTERS">
        <span className="eyebrow">
          {teams.length} de 16 escuadras registradas · Copa Primate Vol. III
        </span>
        <h1 className="page-title">Equipos Confirmados</h1>
        <p className="page-subtitle">
          {publicTeams.length === 0
            ? 'Los rosters oficiales para esta edición son confidenciales y se revelarán en el sorteo oficial'
            : 'Haz clic sobre cualquier equipo para explorar las estadísticas individuales por jugador'}
        </p>
      </header>

      {/* Banner de Aviso: Equipos Ocultos / Confidencialidad */}
      <div
        className="glass-card hud-bracket-box reveal"
        style={{
          padding: '20px 24px',
          marginBottom: '32px',
          borderLeft: '4px solid var(--val-purple, #c084fc)',
          background: 'color-mix(in srgb, var(--val-purple, #c084fc) 6%, var(--bg-card))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '4px',
            background: 'rgba(192, 132, 252, 0.16)', border: '1px solid rgba(192, 132, 252, 0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#c084fc',
            boxShadow: '0 0 20px rgba(192, 132, 252, 0.3)'
          }}>
            <Lock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--val-purple, #c084fc)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px' }}>
              // ENCRYPTED PROTOCOL · ANTI-SCOUTING
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: '17px', color: '#fff', fontWeight: 600 }}>
              {hiddenTeams.length > 0 ? 'Modo Confidencial Activado (Protección Anti-Scouting)' : 'Rosters Oficiales Verificados'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {hiddenTeams.length > 0
                ? 'Por orden de la organización, los rosters no revelados se mantienen encriptados para evitar contra-picks previos.'
                : 'Todos los equipos cumplen con la normativa de límite de Elo y verificación de Riot Games.'}
            </p>
          </div>
        </div>

        {hiddenTeams.length > 0 && (
          <div className="tactical-pill purple" style={{ padding: '6px 14px', fontSize: '12px' }}>
            <Users size={16} /> {hiddenTeams.length} Escuadras Ocultas
          </div>
        )}
      </div>

      {/* Buscador si hay equipos públicos */}
      {publicTeams.length > 0 && (
        <div style={{ maxWidth: '420px', margin: '0 0 28px auto' }}>
          <div className="valorant-search-box" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 14px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por equipo o jugador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 0', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>
      )}

      {/* Grid de Equipos Públicos */}
      {filteredPublic.length > 0 && (
        <div className="teams-grid">
          {filteredPublic.map((team, i) => (
            <article
              key={team.id || i}
              className="glass-card hoverable team-card reveal team-card-interactive"
              style={{ transitionDelay: `${i * 90}ms`, cursor: 'pointer' }}
              onClick={() => setZoomTeam(team)}
              title="Haz clic para ver estadísticas detalladas por jugador"
            >
              <div className="team-banner"><img src={team.logo || '/monkeys.jpg'} alt="" /></div>
              <div className="team-crest-frame">
                <img src={team.logo || '/monkeys.jpg'} alt={team.name} className="team-logo" />
              </div>

              <div className="team-body">
                <h2 className="team-name">{team.name}</h2>

                <div className="player-list">
                  {(team.players || []).map((player, pIdx) => {
                    const color = RANKS[player.rank]?.color || 'var(--primary)';
                    const rankIconUrl = getRankIcon(player.rank);
                    return (
                      <div key={player.name || pIdx} className="player" style={{ '--c': color }}>
                        <span className="player-name" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                          {rankIconUrl ? (
                            <img src={rankIconUrl} alt={player.rank} className="player-rank-icon" title={player.rank} />
                          ) : (
                            <span className="player-rank-diamond" style={{ background: color }} />
                          )}
                          <span>{player.name}</span>
                        </span>
                        {player.rank && (
                          <span className="rank-badge" style={{ '--c': color }}>{player.rank}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botón e indicador de Zoom */}
                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  <button
                    type="button"
                    className="team-zoom-hint-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomTeam(team);
                    }}
                  >
                    <Maximize2 size={13} /> Ver estadísticas por jugador
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Grid de Slots Secretos / Confidenciales (si existen en el torneo) */}
      {hiddenTeams.length > 0 && (
        <section style={{ marginTop: publicTeams.length > 0 ? '48px' : '0' }}>
          {publicTeams.length > 0 && (
            <div className="section-head reveal" style={{ marginBottom: '20px' }} data-watermark="CLASSIFIED">
              <span className="eyebrow"><Lock size={14} /> Confidencial</span>
              <h2 className="section-title">Escuadras <span className="text-gradient">Ocultas</span></h2>
              <p className="section-sub">Rosters protegidos contra scouting que se revelarán en el sorteo oficial.</p>
            </div>
          )}
          <div className="teams-grid">
            {hiddenTeams.map((t, i) => (
              <article
                key={t.id || i}
                className="glass-card hoverable team-card reveal classified-card"
                style={{
                  transitionDelay: `${i * 90}ms`,
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px dashed var(--border-gold)'
                }}
              >
                <div className="team-banner" style={{ background: 'linear-gradient(135deg, var(--primary-soft), rgba(0,0,0,0.85))' }}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.18 }}>
                    <Lock size={56} />
                  </div>
                </div>

                {/* Logo Silueta Oculto */}
                <div className="team-crest-frame">
                  <div
                    className="team-logo"
                    style={{
                      background: 'var(--bg-card-strong)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--border-gold)',
                      boxShadow: '0 0 20px var(--primary-soft)'
                    }}
                  >
                    <Lock size={26} color="var(--primary)" />
                  </div>
                </div>

                <div className="team-body">
                  <h2 className="team-name" style={{ letterSpacing: '2px', color: '#fff' }}>
                    EQUIPO #{String(t.slot || i + 1).padStart(2, '0')}
                  </h2>

                  <div className="team-meta">
                    <span className="meta-pill" style={{ background: 'var(--primary-soft)', borderColor: 'var(--border-gold)', color: 'var(--primary)', fontWeight: '600' }}>
                      <EyeOff size={14} /> Roster Clasificado
                    </span>
                  </div>

                  <div className="player-list">
                    {[1, 2, 3].map((slot) => (
                      <div key={slot} className="player" style={{ opacity: 0.65, background: 'rgba(255,255,255,0.02)' }}>
                        <span className="player-name" style={{ fontStyle: 'italic', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                          🔒 Jugador Titular {slot}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    ⚡ Integrantes e imagen se revelarán en el sorteo oficial
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Plazas Libres para Inscripción (hasta completar los 16 equipos oficiales) */}
      {teams.length < 16 && (
        <section style={{ marginTop: '48px' }}>
          <div className="section-head reveal" style={{ marginBottom: '20px' }} data-watermark="OPEN SLOTS">
            <span className="eyebrow"><Users size={14} /> {16 - teams.length} Plazas Disponibles</span>
            <h2 className="section-title">Inscripciones <span className="text-gradient">Abiertas</span></h2>
            <p className="section-sub">Abre un ticket en Discord para registrar a tu equipo de 3 titulares y disputar la Copa Primate.</p>
          </div>
          <div className="teams-grid">
            {Array.from({ length: 16 - teams.length }).map((_, idx) => {
              const slotNumber = teams.length + idx + 1;
              return (
                <article
                  key={`open-slot-${slotNumber}`}
                  className="glass-card team-card reveal"
                  style={{
                    transitionDelay: `${idx * 40}ms`,
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px dashed rgba(192, 132, 252, 0.35)',
                    background: 'rgba(15, 25, 35, 0.55)',
                    opacity: 0.85
                  }}
                >
                  <div className="team-banner" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(0,0,0,0.6))' }}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.12 }}>
                      <Users size={56} />
                    </div>
                  </div>

                  <div className="team-crest-frame">
                    <div
                      className="team-logo"
                      style={{
                        background: 'rgba(18, 28, 38, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed var(--primary)',
                        color: 'var(--primary)'
                      }}
                    >
                      <span style={{ fontFamily: "'Teko', sans-serif", fontSize: '24px', fontWeight: 700 }}>
                        #{String(slotNumber).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  <div className="team-body">
                    <h2 className="team-name" style={{ letterSpacing: '2px', color: '#ece8e1' }}>
                      PLAZA #{String(slotNumber).padStart(2, '0')}
                    </h2>

                    <div className="team-meta">
                      <span className="meta-pill" style={{ background: 'rgba(0, 245, 212, 0.12)', borderColor: 'rgba(0, 245, 212, 0.35)', color: '#00f5d4', fontWeight: '600' }}>
                        Inscripción Disponible
                      </span>
                    </div>

                    <div className="player-list">
                      {[1, 2, 3].map((slot) => (
                        <div key={slot} className="player" style={{ opacity: 0.5, background: 'rgba(255,255,255,0.02)' }}>
                          <span className="player-name" style={{ fontStyle: 'italic', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                            Vacante {slot} (Máx. 16 pts Elo)
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      ⚡ Abre ticket en Discord con los links de tracker.gg para reclamar este slot
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= MODAL ZOOM DE EQUIPO Y ESTADÍSTICAS POR JUGADOR ================= */}
      {zoomTeam && createPortal(
        <div
          className="team-zoom-backdrop"
          onClick={() => setZoomTeam(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="team-zoom-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cerrar */}
            <button
              type="button"
              className="team-zoom-close-btn"
              onClick={() => setZoomTeam(null)}
              aria-label="Cerrar ventana"
            >
              <X size={20} />
            </button>

            {/* Cabecera del equipo en zoom */}
            <div className="team-zoom-header">
              <div className="team-zoom-logo-box">
                <img src={zoomTeam.logo || '/monkeys.jpg'} alt={zoomTeam.name} />
              </div>
              <div className="team-zoom-title-area">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Estadísticas Oficiales
                  </span>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                    Zoom Activo
                  </span>
                </div>
                <h2 className="team-zoom-title">{zoomTeam.name}</h2>
                <div className="team-zoom-badges">
                  <span className="meta-pill gold">
                    <Gauge size={14} /> {zoomTeam.totalPoints || (zoomTeam.players ? teamPoints(zoomTeam) : 0)} / 16 pts Elo
                  </span>
                </div>
              </div>
            </div>

            {/* Subtítulo explicativo */}
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: '#fff', fontWeight: 700 }}>
                  Rendimiento Individual por Jugador
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Kills / Muertes / Asistencias, copas disputadas y agentes más seleccionados.
                </p>
              </div>
            </div>

            {/* Grid de Jugadores y sus Estadísticas */}
            <div className="zoom-players-grid">
              {(zoomTeam.players || []).map((player, pIdx) => {
                const stats = getPlayerStats(player, pIdx);
                const agentCounts = getPlayerAgentCounts(player);
                const kdRatio = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(2);
                const rankColor = RANKS[player.rank]?.color || 'var(--primary)';

                return (
                  <div key={player.name || pIdx} className="player-stat-card">
                    {/* Columna 1: Info Jugador */}
                    <div className="player-info-cell">
                      <div className="player-info-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: rankColor, display: 'inline-block' }} />
                        {player.name}
                      </div>
                      <div className="player-info-sub">
                        <span className="rank-badge" style={{ borderColor: rankColor, color: '#fff' }}>
                          {player.currentRank || player.rank}
                        </span>
                        {player.peakRank && player.peakRank !== player.rank && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            (Peak: {player.peakRank})
                          </span>
                        )}
                        <span className="lvl-badge">Nv {player.level || '+40'}</span>
                        <span className="lvl-badge" style={{ color: 'var(--primary)', borderColor: 'rgba(255,179,0,0.35)', background: 'rgba(255,179,0,0.1)' }}>
                          🏆 {player.cupsPlayed || (zoomTeam.cupsPlayed ? zoomTeam.cupsPlayed.replace(/\s*\([^)]*2026[^)]*\)/gi, '').trim() : '3 Copas')}
                        </span>
                      </div>
                    </div>

                    {/* Columna 2: Kills / Muertes / Asistencias tipo "13 / 5 / 9" */}
                    <div className="player-kda-block">
                      <div className="player-kda-label">Kills / Muertes / Asist.</div>
                      <div className="player-kda-values">
                        <span className="kda-num-k" title="Kills">{stats.kills}</span>
                        <span className="kda-slash">/</span>
                        <span className="kda-num-d" title="Muertes">{stats.deaths}</span>
                        <span className="kda-slash">/</span>
                        <span className="kda-num-a" title="Asistencias">{stats.assists}</span>
                      </div>
                      <div className="player-kd-ratio">
                        Ratio K/D: <strong>{kdRatio}</strong>
                      </div>
                    </div>

                    {/* Columna 3: Agentes jugados con multiplicador x2 / x3 */}
                    <div className="player-agents-block">
                      <div className="player-agents-label">Agentes Jugados</div>
                      <div className="player-agents-list">
                        {agentCounts.length === 0 ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Sin agentes registrados
                          </span>
                        ) : (
                          agentCounts.map(({ agent, count }) => {
                            const iconUrl = getAgentIcon(agent);
                            return (
                              <div key={agent} className="agent-icon-item" title={`${agent} - jugado ${count} ${count > 1 ? 'veces' : 'vez'}`}>
                                <div className="agent-icon-wrapper">
                                  {iconUrl ? (
                                    <img
                                      src={iconUrl}
                                      alt={agent}
                                      className="agent-img"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="agent-placeholder">
                                      {agent.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  {count > 1 && (
                                    <span className="agent-badge-multiplier">
                                      x{count}
                                    </span>
                                  )}
                                </div>
                                <span className="agent-name-caption">{agent}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pie del modal */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                💡 Puedes presionar <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>ESC</kbd> o hacer clic fuera del recuadro para cerrar.
              </span>
              <button
                type="button"
                onClick={() => setZoomTeam(null)}
                style={{
                  background: 'rgba(255, 179, 0, 0.15)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Cerrar Zoom
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
