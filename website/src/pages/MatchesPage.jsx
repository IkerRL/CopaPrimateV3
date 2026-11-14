import { useState, useEffect } from 'react';
import { Calendar, Shuffle, ClipboardCheck, Users, Swords, Trophy, Crown, Check, Tv, MapPin, Clock } from 'lucide-react';
import { usePageTitle, useReveal } from '../hooks';
import { usePublicMatches, useWebSettings } from '../api';
import { getMapSplash } from '../agents';

const PHASES = [
  { icon: ClipboardCheck, title: 'Inscripciones (16 Equipos)', desc: 'Registro y validación de rosters por la moderación con límite de 16 pts Elo.', status: 'current' },
  { icon: Shuffle, title: 'Sorteo de Bombos & Cruces', desc: 'Distribución en 4 Bombos según Elo y calendario de 4 jornadas de Liga Única.', status: 'pending' },
  { icon: Users, title: 'Fase de Liga Única (J1 a J4)', desc: 'Tabla general de 16 equipos. Todos compiten por entrar al Top 4 o al Repechaje.', status: 'pending' },
  { icon: Swords, title: 'Repechaje (5º al 12º)', desc: 'Los puestos del 5º al 12º disputan cruces directos por 4 plazas a Cuartos.', status: 'pending' },
  { icon: Trophy, title: 'Cuartos, Semis y Gran Final', desc: 'Cuadro final de eliminación directa por la corona de la Copa Primate 2026.', status: 'pending' },
];

const STATUS_LABEL = { done: 'Completado', current: 'En curso', pending: 'Próximamente' };

const MATCHDAYS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'J1', label: 'Jornada 1' },
  { id: 'J2', label: 'Jornada 2' },
  { id: 'J3', label: 'Jornada 3' },
  { id: 'J4', label: 'Jornada 4' },
];

const DEFAULT_GRUPOS = {
  A: [
    { id: 'A1', name: "Thunder Buddies", jugadores: ["Brrokeen", "Pipe"], logo: "/logo3.png", tag: "THB" },
    { id: 'A2', name: "Los Akrtona2", jugadores: ["Kira", "Serax"], logo: "/logo2.png", tag: "AKR" },
    { id: 'A3', name: "Chuu-Chuu 100% MAX", jugadores: ["MakaQuillo", "Max"], logo: "/logo8.png", tag: "CHU" },
    { id: 'A4', name: "REHENKARMACIÓN", jugadores: ["Satha", "Makflat"], logo: "/logo1.png", tag: "REH" }
  ],
  B: [
    { id: 'B1', name: "Entry Baiters", jugadores: ["レックウザ", "Militantedelsoe"], logo: "/logo5.png", tag: "ENT" },
    { id: 'B2', name: "Dream Team", jugadores: ["JoKker", "Pepardo"], logo: "/logo7.png", tag: "DRM" },
    { id: 'B3', name: "Makaco Ninja-Pelocho", jugadores: ["MakacoNinja", "Iker 😎"], logo: "/logo6.png", tag: "MNP" },
    { id: 'B4', name: "Kizuna", jugadores: ["Alezita", "Sarix"], logo: "/logo4.png", tag: "KZN" }
  ],
  C: [
    { id: 'C1', name: "Sakura", jugadores: ["Gustavo", "Carlos"], logo: "/logo14.png", tag: "SAK" },
    { id: 'C2', name: "Soul Resonance", jugadores: ["KrypT", "Charly"], logo: "/logo11.png", tag: "SOU" },
    { id: 'C3', name: "Stranger Picks", jugadores: ["TheDori", "Sotomi"], logo: "/logo9.png", tag: "STR" },
    { id: 'C4', name: "MARIIKS", jugadores: ["Acid", "Bru"], logo: "/logo10.png", tag: "MRK" }
  ],
  D: [
    { id: 'D1', name: "Primates FC", jugadores: ["Knekro", "IlloJuan"], logo: "/logo12.png", tag: "PFC" },
    { id: 'D2', name: "Chimp Squad", jugadores: ["Boaster", "Derke"], logo: "/logo13.png", tag: "CHP" },
    { id: 'D3', name: "Banana Kings", jugadores: ["Maka", "Mixwell"], logo: "/logo15.png", tag: "BNK" },
    { id: 'D4', name: "Golden Gorillas", jugadores: ["TenZ", "ScreaM"], logo: "/logo10.png", tag: "GOR" }
  ]
};

export default function MatchesPage() {
  usePageTitle('Enfrentamientos');
  useReveal();

  const { matches: apiMatches, groups: apiGroups } = usePublicMatches();
  const { settings } = useWebSettings();

  const [selectedMatchday, setSelectedMatchday] = useState(settings?.activeMatchday || 'ALL');

  useEffect(() => {
    if (settings?.activeMatchday) {
      setSelectedMatchday(settings.activeMatchday);
    }
  }, [settings?.activeMatchday]);

  // Si la API tiene 4 grupos poblados se usan, si no se usan los 4 grupos oficiales del torneo
  const hasApiGroups = apiGroups && typeof apiGroups === 'object' && Object.keys(apiGroups).length === 4;
  const groups = hasApiGroups ? apiGroups : DEFAULT_GRUPOS;
  const showGroupsSection = settings.showGroups !== false;

  // Solo mostrar partidos si están activados en moderación y tienen datos reales
  const hasOfficialMatches = settings.showMatches && apiMatches && apiMatches.length > 0;
  const matches = hasOfficialMatches ? apiMatches : [];

  const filteredMatches = matches.filter(m => {
    if (selectedMatchday === 'ALL') return true;
    const roundStr = String(m.round || m.matchday || m.date || '').toUpperCase();
    if (selectedMatchday === 'J1') return /J1|JORNADA 1/i.test(roundStr);
    if (selectedMatchday === 'J2') return /J2|JORNADA 2/i.test(roundStr);
    if (selectedMatchday === 'J3') return /J3|JORNADA 3/i.test(roundStr);
    if (selectedMatchday === 'J4') return /J4|JORNADA 4/i.test(roundStr);
    return true;
  });

  return (
    <div className="animate-fade-in">
      <header className="page-header" data-watermark="MATCHES">
        <span className="eyebrow">Temporada 2026 · Torneo de 16 Equipos</span>
        <h1 className="page-title">Enfrentamientos & Calendario</h1>
        <p className="page-subtitle">Sigue los partidos y cruces oficiales de la Copa Primate Vol. III</p>
      </header>

      {/* Tarjeta Informativa del Sorteo & Canal Oficial */}
      <div className="glass-card draw-card">
        <div className="draw-icon"><Shuffle size={42} /></div>
        <h2>Sorteo Oficial de Bombos & Cruces</h2>
        <p>
          Los 16 equipos se repartirán en 4 bombos por Elo. El sorteo y los vetos de mapa se realizarán en directo por streaming.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
          <span className="chip"><Calendar size={18} color="var(--primary)" /> Temporada 2026</span>
          <a
            href="https://www.twitch.tv/makacagotica"
            target="_blank"
            rel="noopener noreferrer"
            className="chip chip-twitch"
            style={{ textDecoration: 'none' }}
          >
            <Tv size={16} /> Canal de Twitch: twitch.tv/makacagotica
          </a>
        </div>
      </div>

      {/* Sección de Grupos / Bombos */}
      {showGroupsSection && (
        <section className="section">
          <div className="section-head reveal" data-watermark="GROUPS">
            <span className="eyebrow"><Users size={14} /> Distribución Oficial</span>
            <h2 className="section-title">Bombos & Grupos de la <span className="text-gradient">Copa Primate</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0' }}>
              16 equipos distribuidos en 4 grupos oficiales para disputar las 4 jornadas de Liga Única.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {Object.entries(groups).map(([gName, gTeams]) => {
              const potColors = { A: '#ff4655', B: '#00f5d4', C: '#c084fc', D: '#fbbf24' };
              const potColor = potColors[gName] || 'var(--primary)';

              return (
                <div key={gName} className="glass-card group-card reveal" style={{ padding: '22px', borderTop: `3px solid ${potColor}`, boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${potColor}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: `${potColor}26`,
                        border: `1.5px solid ${potColor}`,
                        color: potColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '15px'
                      }}>
                        {gName}
                      </span>
                      <h3 style={{ fontSize: '20px', color: '#fff', margin: 0, fontFamily: "'Oswald', sans-serif", letterSpacing: '1.5px' }}>
                        GRUPO {gName}
                      </h3>
                    </div>
                    <span style={{ fontSize: '11px', color: potColor, background: `${potColor}18`, border: `1px solid ${potColor}55`, padding: '3px 10px', borderRadius: '6px', fontWeight: '800', letterSpacing: '1px' }}>
                      {(gTeams || []).length} EQUIPOS
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(gTeams || []).map((t, idx) => (
                      <div key={idx} className="group-team-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={t.logo || '/copa-logo.png'} alt="" className="group-team-logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/copa-logo.png'; }} />
                          <div>
                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>{t.name}</div>
                            {Array.isArray(t.jugadores) && t.jugadores.length > 0 && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {t.jugadores.join(' · ')}
                              </div>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', fontFamily: "'Rajdhani', monospace", letterSpacing: '1px' }}>
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Calendario de Enfrentamientos por Jornada (solo visible si se activa en moderación) */}
      {settings.showMatches && (
        <section className="section">
          <div className="section-head reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px', textAlign: 'left' }}>
            <div>
              <span className="eyebrow"><Swords size={14} /> Calendario Oficial</span>
              <h2 className="section-title">Cruces de <span className="text-gradient">Jornada</span></h2>
            </div>

            {/* Filtros de Jornada (J1, J2, J3, J4) */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.35)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {MATCHDAYS.map(day => (
                <button
                  key={day.id}
                  type="button"
                  className={`filter-pill ${selectedMatchday === day.id ? 'active' : ''}`}
                  onClick={() => setSelectedMatchday(day.id)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {hasOfficialMatches && filteredMatches.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px', marginTop: '20px' }}>
              {filteredMatches.map((m, i) => {
                const isFinished = /final|terminad|completad|cerrad/i.test(m.status || '');
                const isLive = /live|directo|curso/i.test(m.status || '');
                const hasScores = (m.score1 !== undefined && m.score2 !== undefined) && (isFinished || isLive || m.score1 > 0 || m.score2 > 0);
                const winner = isFinished ? (m.score1 > m.score2 ? 1 : m.score2 > m.score1 ? 2 : 0) : 0;
                const splashUrl = m.map ? getMapSplash(m.map) : null;

                return (
                  <div
                    key={m.id || i}
                    className={`glass-card hoverable match-card reveal ${isLive ? 'is-live' : ''}`}
                    style={{ padding: '24px', transitionDelay: `${i * 80}ms` }}
                  >
                    {/* Arte oficial del mapa si está asignado */}
                    {splashUrl && (
                      <>
                        <div
                          className="match-map-splash"
                          style={{ backgroundImage: `url(${splashUrl})` }}
                          aria-hidden="true"
                        />
                        <div className="match-map-vignette" aria-hidden="true" />
                      </>
                    )}

                    <div className="match-card-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-soft)', marginBottom: '18px' }}>
                        <span className="match-date-label">// {m.date || m.round || 'Jornada'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {m.round && (
                            <span className="match-group-pill">
                              {m.round}
                            </span>
                          )}
                          {isLive ? (
                            <span className="vct-live-indicator">
                              <span className="vct-live-dot" /> EN DIRECTO
                            </span>
                          ) : (
                            <span className={`status ${isFinished ? 'done' : 'pending'}`} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                              {m.status || 'Programado'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        {/* Equipo 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, textAlign: 'center' }}>
                          <div style={{ position: 'relative' }}>
                            <img
                              src={m.t1?.logo || '/copa-logo.png'}
                              alt={m.t1?.name}
                              className={`match-team-crest ${winner === 1 ? 'winner' : ''}`}
                            />
                            {winner === 1 && (
                              <Crown size={16} color="var(--primary)" style={{ position: 'absolute', top: -8, right: -8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
                            )}
                          </div>
                          <strong style={{ fontSize: '15px', color: winner === 1 ? 'var(--primary)' : '#fff' }}>{m.t1?.name}</strong>
                        </div>

                        {/* Centro: Tanteo o VS */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '96px' }}>
                          {hasScores ? (
                            <div className="match-score-box">
                              <span className={winner === 1 ? 'win-score' : ''}>{m.score1}</span>
                              <span className="score-sep">:</span>
                              <span className={winner === 2 ? 'win-score' : ''}>{m.score2}</span>
                            </div>
                          ) : (
                            <div className="match-vs-badge">VS</div>
                          )}
                          <span className="match-map-tag">
                            <MapPin size={11} /> {m.map ? m.map : 'Mapa por sorteo'}
                          </span>
                        </div>

                        {/* Equipo 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, textAlign: 'center' }}>
                          <div style={{ position: 'relative' }}>
                            <img
                              src={m.t2?.logo || '/copa-logo.png'}
                              alt={m.t2?.name}
                              className={`match-team-crest ${winner === 2 ? 'winner' : ''}`}
                            />
                            {winner === 2 && (
                              <Crown size={16} color="var(--primary)" style={{ position: 'absolute', top: -8, right: -8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
                            )}
                          </div>
                          <strong style={{ fontSize: '15px', color: winner === 2 ? 'var(--primary)' : '#fff' }}>{m.t2?.name}</strong>
                        </div>
                      </div>

                      {m.format && (
                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span>Formato: <strong style={{ color: '#fff' }}>{m.format}</strong></span>
                          <span style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>// COPA PRIMATE</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card reveal" style={{ padding: '42px 24px', textAlign: 'center', marginTop: '20px', borderTop: '3px solid var(--primary)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '14px' }}>
                <Clock size={30} />
              </div>
              <h3 style={{ fontSize: '22px', color: '#fff', margin: '0 0 8px', fontFamily: "'Oswald', sans-serif", letterSpacing: '1px' }}>
                Cruces de las Jornadas 1 a 4 en Preparación
              </h3>
              <p style={{ maxWidth: '600px', margin: '0 auto 18px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                Actualmente el torneo se encuentra en la <strong>Fase de Inscripciones</strong> para 16 equipos. Los cruces oficiales de las 4 jornadas (J1, J2, J3 y J4) y los horarios se publicarán automáticamente en cuanto se celebre el sorteo de bombos.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '6px 16px', borderRadius: '999px', border: '1px solid rgba(0, 245, 212, 0.35)', fontSize: '12px', color: '#00f5d4' }}>
                <span className="pulse-dot" style={{ background: '#00f5d4' }} />
                Estado: Esperando confirmación de los 16 equipos
              </div>
            </div>
          )}
        </section>
      )}

      {/* Timeline de Fases */}
      <section className="section">
        <div className="section-head reveal">
          <span className="eyebrow"><Crown size={14} /> Hoja de ruta</span>
          <h2 className="section-title">Fases del torneo 2026</h2>
        </div>

        <div className="timeline">
          {PHASES.map((p, i) => {
            const Icon = p.status === 'done' ? Check : p.icon;
            return (
              <div key={p.title} className={`tl-item ${p.status} reveal`} style={{ transitionDelay: `${i * 90}ms` }}>
                <div className="tl-dot"><Icon size={22} /></div>
                <div className="glass-card tl-body">
                  <div>
                    <h4>{p.title}</h4>
                    <p>{p.desc}</p>
                  </div>
                  <span className={`status ${p.status}`}>{STATUS_LABEL[p.status]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
