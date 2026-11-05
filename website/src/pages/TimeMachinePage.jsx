import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Trophy,
  Sparkles,
  Swords,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  Tv,
  Calendar,
  Layers
} from 'lucide-react';
import { usePageTitle, useReveal } from '../hooks';
import { PAST_EDITIONS } from '../historyData';

export default function TimeMachinePage() {
  usePageTitle('Máquina del Tiempo');
  useReveal();

  const [selectedEditionId, setSelectedEditionId] = useState(PAST_EDITIONS[0].id);
  const [activeTab, setActiveTab] = useState('teams');
  const [searchQuery, setSearchQuery] = useState('');

  const currentEdition = PAST_EDITIONS.find((e) => e.id === selectedEditionId) || PAST_EDITIONS[0];

  const allEditionTeams = currentEdition.groups
    ? currentEdition.groups.flatMap((g) => g.teams.map((t) => ({ ...t, groupName: g.name })))
    : [];

  const filteredTeams = allEditionTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.players?.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`animate-fade-in time-machine-page ${currentEdition.themeClass || ''}`}>
      {/* HEADER */}
      <header className="page-header">
        <div className="time-machine-badge">
          <History className="animate-spin-slow" size={16} />
          <span>REGISTRO HISTÓRICO OFICIAL</span>
        </div>
        <h1 className="page-title">
          Máquina del <span className="text-gradient">Tiempo</span>
        </h1>
        <p className="page-subtitle">
          Archivos oficiales, brackets y resultados reales de las ediciones transmitidas en Twitch por{' '}
          <strong style={{ color: 'var(--primary)' }}>MakacaGótica</strong> (Team Makaco).
        </p>
      </header>

      {/* SELECTOR DE EDICIÓN (Copa 1 y Copa 2) */}
      <section className="time-travel-dial glass-card reveal">
        <div className="dial-header">
          <span className="eyebrow"><Sparkles size={13} /> Registros Temporales</span>
          <h3>Selecciona una Edición</h3>
        </div>

        <div className="dial-buttons">
          {PAST_EDITIONS.map((ed) => {
            const isSelected = ed.id === selectedEditionId;
            return (
              <button
                key={ed.id}
                type="button"
                className={`dial-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedEditionId(ed.id);
                  setSearchQuery('');
                  setActiveTab('teams');
                }}
              >
                <div className="dial-year">{ed.year}</div>
                <div className="dial-edition">{ed.name}</div>
                {ed.winner ? (
                  <div className="dial-champ" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700 }}>
                    <Trophy size={13} color="var(--primary)" /> {ed.winner.name} ({ed.winner.score})
                  </div>
                ) : (
                  <div className="dial-champ" style={{ color: 'var(--primary)', fontSize: '0.82rem' }}>
                    <Layers size={13} /> {ed.tagline}
                  </div>
                )}
                {isSelected && <span className="dial-active-glow" />}
              </button>
            );
          })}

          <Link to="/" className="dial-btn dial-present" title="Ir a la edición en curso">
            <div className="dial-year">2026</div>
            <div className="dial-edition">Vol. III (Actual)</div>
            <div className="dial-champ">
              <span className="pulse-dot-inline" /> ¡En Disputa!
            </div>
          </Link>
        </div>
      </section>

      {/* BANNER DE LA EDICIÓN */}
      <section className="edition-banner glass-card reveal">
        <div className="edition-meta-top">
          <span className="chip"><Calendar size={14} /> {currentEdition.year}</span>
          {currentEdition.winner && (
            <span className="chip chip-gold">
              <Trophy size={14} /> Campeón: {currentEdition.winner.name} ({currentEdition.winner.score})
            </span>
          )}
          <span className="chip"><Users size={14} /> {currentEdition.stats.teamsCount} Equipos</span>
          <a
            href={currentEdition.broadcaster.url}
            target="_blank"
            rel="noopener noreferrer"
            className="chip chip-twitch"
            title="Ver canal de Twitch de MakacaGótica"
          >
            <Tv size={14} /> Canal: {currentEdition.broadcaster.channel} <ExternalLink size={12} />
          </a>
        </div>

        <h2 className="edition-title">{currentEdition.name}</h2>
        <p className="edition-tagline">{currentEdition.tagline}</p>
        <p className="edition-desc">{currentEdition.formatDesc}</p>

        {/* Tarjeta de Broadcast Twitch de MakacaGótica */}
        <div className="twitch-official-badge">
          <div className="tob-left">
            <div className="tob-icon">
              <Tv size={22} className="pulse-icon" />
            </div>
            <div>
              <div className="tob-title">Casteo & Transmisión Oficial</div>
              <div className="tob-sub">
                Canal: <strong>{currentEdition.broadcaster.channel}</strong> ({currentEdition.broadcaster.platform}) · Comunidad {currentEdition.broadcaster.community}
              </div>
            </div>
          </div>
          <div className="tob-right">
            <a
              href={currentEdition.broadcaster.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              twitch.tv/makacagotica <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* NAVEGACIÓN POR PESTAÑAS SIN NÚMEROS */}
      <div className="history-tabs-nav reveal" style={{ marginTop: '2rem' }}>
        {currentEdition.id === 'vol-2' ? (
          // ORDEN VOL. II: Equipos -- Jornadas -- Clasificación Liga -- Playoff -- Bracket Final
          <>
            <button
              className={`history-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              <Users size={16} /> Equipos
            </button>
            <button
              className={`history-tab-btn ${activeTab === 'jornadas' ? 'active' : ''}`}
              onClick={() => setActiveTab('jornadas')}
            >
              <Calendar size={16} /> Jornadas
            </button>
            <button
              className={`history-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
              onClick={() => setActiveTab('table')}
            >
              <Layers size={16} /> Clasificación Liga
            </button>
            <button
              className={`history-tab-btn ${activeTab === 'playoff' ? 'active' : ''}`}
              onClick={() => setActiveTab('playoff')}
            >
              <Swords size={16} /> Playoff
            </button>
            <button
              className={`history-tab-btn ${activeTab === 'bracket' ? 'active' : ''}`}
              onClick={() => setActiveTab('bracket')}
            >
              <Trophy size={16} /> Bracket Final
            </button>
          </>
        ) : (
          // ORDEN VOL. I: Equipos -- Bracket Final
          <>
            <button
              className={`history-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              <Users size={16} /> Equipos
            </button>
            <button
              className={`history-tab-btn ${activeTab === 'bracket' ? 'active' : ''}`}
              onClick={() => setActiveTab('bracket')}
            >
              <Trophy size={16} /> Bracket Final
            </button>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. SECCIÓN EQUIPOS (VOL. I & VOL. II)                     */}
      {/* ======================================================== */}
      {activeTab === 'teams' && (
        <div className="tab-pane animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <div className="standings-filter-bar">
            <div className="search-input-wrap">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar equipo o jugador real..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-count">
              Mostrando {filteredTeams.length} equipos
            </div>
          </div>

          <div className="groups-grid-layout">
            {currentEdition.groups.map((group) => {
              const groupTeams = group.teams.filter(
                (t) =>
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.players?.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
              );

              if (groupTeams.length === 0) return null;

              return (
                <div key={group.name} className="glass-card group-block reveal">
                  <div className="group-header-row">
                    <h3 className="group-title">{group.name}</h3>
                    <span className="group-count">{groupTeams.length} equipos</span>
                  </div>

                  <div className="group-teams-list">
                    {groupTeams.map((team) => (
                      <div key={team.name} className="team-real-card">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="team-real-logo"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="team-real-info">
                          <div className="team-real-name">{team.name}</div>
                          <div className="team-real-players">
                            {team.players?.map((p) => (
                              <span key={p} className="player-tag">👤 {p}</span>
                            ))}
                          </div>
                        </div>
                        {team.status && (
                          <span className={`status-pill ${team.status.includes('Clasificado') || team.status.includes('Top') ? 'open' : 'closed'}`}>
                            {team.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SECCIÓN JORNADAS (VOL. II) (GRID 2x2 / 4 JORNADAS)     */}
      {/* ======================================================== */}
      {activeTab === 'jornadas' && currentEdition.jornadas && (
        <div className="tab-pane animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <div className="section-head" style={{ marginBottom: '1.2rem' }}>
            <span className="eyebrow"><Calendar size={14} /> Calendario Oficial</span>
            <h3 className="section-title">Las 4 Jornadas de la Liga Cruzada</h3>
            <p className="section-sub">Todos los enfrentamientos disputados en la fase regular distribuidos en 2 y 2.</p>
          </div>

          <div className="jornadas-grid-2x2">
            {currentEdition.jornadas.map((j) => (
              <div key={j.numero} className="glass-card jornada-card-compact reveal">
                <div className="jornada-header">
                  <span className="jornada-badge">JORNADA {j.numero}</span>
                  <span className="jornada-matches-count">{j.partidos.length} Partidos</span>
                </div>

                <div className="jornada-matches-list">
                  {j.partidos.map((p, idx) => (
                    <div key={idx} className="match-row-item">
                      <span className={`match-team ${p.s1 > p.s2 ? 'match-winner' : ''}`}>{p.t1}</span>
                      <div className="match-score-pill">
                        <span className={p.s1 > p.s2 ? 'score-winner' : ''}>{p.s1}</span>
                        <span className="score-divider">-</span>
                        <span className={p.s2 > p.s1 ? 'score-winner' : ''}>{p.s2}</span>
                      </div>
                      <span className={`match-team right ${p.s2 > p.s1 ? 'match-winner' : ''}`}>{p.t2}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SECCIÓN CLASIFICACIÓN LIGA (VOL. II)                  */}
      {/* ======================================================== */}
      {activeTab === 'table' && currentEdition.standings && (
        <div className="tab-pane animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <div className="section-head" style={{ marginBottom: '1.2rem' }}>
            <span className="eyebrow"><Trophy size={14} /> Tabla General</span>
            <h3 className="section-title">Clasificación de la Liga Cruzada</h3>
            <p className="section-sub">Los 4 primeros obtuvieron acceso directo a Cuartos de Final. Del 5º al 12º a Playoff.</p>
          </div>

          <div className="glass-card table-wrap">
            <table className="standings-table">
              <thead>
                <tr>
                  <th className="gold">POS</th>
                  <th className="left">EQUIPO</th>
                  <th>PJ</th>
                  <th>V</th>
                  <th>D</th>
                  <th>DIF</th>
                  <th>PTS</th>
                  <th>DESTINO</th>
                </tr>
              </thead>
              <tbody>
                {currentEdition.standings.map((t) => (
                  <tr key={t.team}>
                    <td>
                      <span className={`pos ${t.rank <= 4 ? 'gold-pos' : ''}`}>
                        {t.rank}
                      </span>
                    </td>
                    <td className="left">
                      <div className="team-cell">
                        <img src={t.logo} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <div>
                          <strong>{t.team}</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {t.players.join(' · ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{t.p}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{t.w}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{t.l}</td>
                    <td style={{ fontWeight: 600, color: t.diff.startsWith('+') ? 'var(--success)' : 'var(--danger)' }}>
                      {t.diff}
                    </td>
                    <td style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.05rem' }}>
                      {t.pts}
                    </td>
                    <td>
                      <span className={`status-pill ${t.status.includes('Top 4') ? 'open' : 'closed'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SECCIÓN PLAYOFF (5º AL 12º EN VOL. II) (GRID 2x2)     */}
      {/* ======================================================== */}
      {activeTab === 'playoff' && currentEdition.playoffs && (
        <div className="tab-pane animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <div className="section-head" style={{ marginBottom: '1.2rem' }}>
            <span className="eyebrow"><Swords size={14} /> Cruces Eliminatorios Previos</span>
            <h3 className="section-title">Playoff de Acceso a Cuartos (5º al 12º)</h3>
            <p className="section-sub">Los 4 ganadores sellaron su clasificación al Bracket Final.</p>
          </div>

          <div className="playoffs-grid-2x2">
            {currentEdition.playoffs.map((match, idx) => (
              <div key={idx} className="glass-card playoff-quad-card reveal">
                <div className="playoff-quad-header">
                  <span className="playoff-match-tag">CRUCE #{idx + 1}</span>
                  <span className="playoff-winner-badge">Clasifica: {match.winner}</span>
                </div>

                <div className="playoff-quad-teams">
                  <div className={`quad-team-line ${match.winner === match.t1 ? 'winner' : 'loser'}`}>
                    {match.seed1 && <span className="seed-num">#{match.seed1}</span>}
                    <img src={match.logo1} alt="" className="quad-team-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span className="quad-team-name">{match.t1}</span>
                    <span className="quad-team-score">{match.s1}</span>
                  </div>
                  <div className="quad-vs-sep">VS</div>
                  <div className={`quad-team-line ${match.winner === match.t2 ? 'winner' : 'loser'}`}>
                    {match.seed2 && <span className="seed-num">#{match.seed2}</span>}
                    <img src={match.logo2} alt="" className="quad-team-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span className="quad-team-name">{match.t2}</span>
                    <span className="quad-team-score">{match.s2}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SECCIÓN BRACKET FINAL (VOL. I & VOL. II)              */}
      {/* ======================================================== */}
      {activeTab === 'bracket' && currentEdition.bracket && (
        <div className="tab-pane animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <div className="section-head" style={{ marginBottom: '1.5rem' }}>
            <span className="eyebrow"><Trophy size={14} /> Cuadro de Eliminación Directa</span>
            <h3 className="section-title" style={{ fontSize: '1.8rem' }}>Bracket Final de {currentEdition.name}</h3>
            <p className="section-sub">Cuartos de Final → Semifinales → Gran Final</p>
          </div>

          <div className="official-bracket-wrapper glass-card">
            <div className="official-bracket-container">
              {/* COLUMNA 1: CUARTOS */}
              <div className="official-bracket-column">
                <div className="official-col-header">
                  <span className="col-step-tag">FASE 1</span>
                  <h4>CUARTOS DE FINAL</h4>
                </div>
                <div className="official-col-matches qf-col">
                  {currentEdition.bracket.qf.map((m, idx) => (
                    <div key={idx} className="official-match-card">
                      <div className={`official-team-row ${m.winner === m.t1 ? 'winner' : 'loser'}`}>
                        <img src={m.logo1} alt="" className="official-team-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <span className="official-team-name">{m.t1}</span>
                        <span className="official-team-score">{m.s1}</span>
                      </div>
                      <div className="official-match-divider" />
                      <div className={`official-team-row ${m.winner === m.t2 ? 'winner' : 'loser'}`}>
                        <img src={m.logo2} alt="" className="official-team-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <span className="official-team-name">{m.t2}</span>
                        <span className="official-team-score">{m.s2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA 2: SEMIFINALES */}
              <div className="official-bracket-column">
                <div className="official-col-header">
                  <span className="col-step-tag">FASE 2</span>
                  <h4>SEMIFINALES</h4>
                </div>
                <div className="official-col-matches sf-col">
                  {currentEdition.bracket.sf.map((m, idx) => (
                    <div key={idx} className="official-match-card">
                      <div className={`official-team-row ${m.winner === m.t1 ? 'winner' : 'loser'}`}>
                        <img src={m.logo1} alt="" className="official-team-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <span className="official-team-name">{m.t1}</span>
                        <span className="official-team-score">{m.s1}</span>
                      </div>
                      <div className="official-match-divider" />
                      <div className={`official-team-row ${m.winner === m.t2 ? 'winner' : 'loser'}`}>
                        <img src={m.logo2} alt="" className="official-team-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <span className="official-team-name">{m.t2}</span>
                        <span className="official-team-score">{m.s2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA 3: GRAN FINAL */}
              <div className="official-bracket-column">
                <div className="official-col-header gold">
                  <span className="col-step-tag gold">FINALÍSIMA</span>
                  <h4>⚡ GRAN FINAL</h4>
                </div>
                <div className="official-col-matches fn-col">
                  {currentEdition.bracket.fn.map((m, idx) => (
                    <div key={idx} className="official-match-card final-gold-card">
                      <div className="final-crown-head">
                        <Trophy size={20} color="var(--primary)" />
                        <span>POR EL TÍTULO</span>
                      </div>
                      <div className="official-team-row">
                        <img src={m.logo1} alt="" className="official-team-logo large" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <span className="official-team-name font-bold">{m.t1}</span>
                        {m.s1 !== '' && <span className="official-team-score gold">{m.s1}</span>}
                      </div>
                      <div className="official-match-divider" />
                      <div className="official-team-row">
                        <img src={m.logo2} alt="" className="official-team-logo large" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <span className="official-team-name font-bold">{m.t2}</span>
                        {m.s2 !== '' && <span className="official-team-score gold">{m.s2}</span>}
                      </div>
                      <div className="final-live-note">
                        <Tv size={14} />
                        <span>{m.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BANNER CTA */}
      <section className="cta-band reveal" style={{ marginTop: '4rem' }}>
        <h2>Edición actual en marcha: <span className="text-gradient">Vol. III</span></h2>
        <p>Sigue la Copa Primate en el canal de Twitch de MakacaGótica y participa en la comunidad.</p>
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link to="/" className="btn btn-primary">
            Ir a la Copa Actual <ChevronRight size={18} />
          </Link>
          <a
            href="https://www.twitch.tv/makacagotica"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Twitch de MakacaGótica <Tv size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}
