import { Fragment, useState } from 'react';
import { Crown, Flame, Trophy, ArrowUpDown, Swords, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePageTitle, useReveal } from '../hooks';
import { usePublicStandings, useWebSettings } from '../api';

const PODIUM_COLORS = { 1: '#f5a623', 2: '#00f5d4', 3: '#c084fc' };
const QUALIFY_DIRECT = 4;
const QUALIFY_PLAYOFF = 12;

export default function StandingsPage() {
  usePageTitle('Clasificación');
  useReveal();

  const { standings, isCalculated, finishedCount } = usePublicStandings();
  const { settings } = useWebSettings();

  const [sortField, setSortField] = useState('points');
  const [sortAsc, setSortAsc] = useState(false);

  // Solo mostrar la tabla si la moderación lo activa o si hay partidos oficiales terminados
  const shouldShowStandings = settings.showStandings || (isCalculated && finishedCount > 0);

  // Podio y líder oficiales
  const officialRanked = [...standings].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || (b.points ?? 0) - (a.points ?? 0));
  const top3 = officialRanked.slice(0, 3);
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);
  const leaderTeam = officialRanked[0];
  const mostWinsTeam = [...standings].sort((a, b) => (b.w || 0) - (a.w || 0) || (b.points || 0) - (a.points || 0))[0];

  const sortedStandings = [...standings].sort((a, b) => {
    let vA = a[sortField] ?? 0;
    let vB = b[sortField] ?? 0;
    if (typeof vA === 'string') {
      return sortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
    }
    return sortAsc ? vA - vB : vB - vA;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const showCutLines = (sortField === 'points' && !sortAsc) || (sortField === 'rank' && sortAsc);

  return (
    <div className="animate-fade-in">
      <header className="page-header" data-watermark="RANKING">
        <span className="eyebrow">
          Temporada 2026 · {shouldShowStandings ? `${finishedCount} partidos computados` : 'Pre-Temporada · 16 Plazas'}
        </span>
        <h1 className="page-title">Clasificación General</h1>
        <p className="page-subtitle">Tabla de posiciones oficial del torneo de Valorant Copa Primate Vol. III</p>
      </header>

      {/* Si no hay partidos disputados o la moderación la tiene en espera, mostrar pantalla de pre-temporada */}
      {!shouldShowStandings ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Tarjeta Central Informativa */}
          <div className="glass-card reveal" style={{ padding: '48px 28px', textAlign: 'center', borderTop: '3px solid var(--primary)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '16px' }}>
              <Trophy size={32} />
            </div>
            <h2 style={{ fontSize: '26px', color: '#fff', margin: '0 0 10px', fontFamily: "'Oswald', sans-serif", letterSpacing: '1px' }}>
              Clasificación en Espera · Pre-Temporada
            </h2>
            <p style={{ maxWidth: '620px', margin: '0 auto 20px', color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>
              La tabla general de la Liga Única de 16 equipos se activará y comenzará a actualizarse automáticamente en tiempo real con la disputa de los primeros enfrentamientos de la <strong>Jornada 1</strong>.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '6px 16px', borderRadius: '999px', border: '1px solid rgba(0, 245, 212, 0.35)', fontSize: '12px', color: '#00f5d4' }}>
              <span className="pulse-dot" style={{ background: '#00f5d4' }} />
              Estado: 0 partidos disputados · Periodo de inscripción activo
            </div>
          </div>

          {/* Explicación del Formato de Clasificación de la Liga Única */}
          <div>
            <div className="section-head reveal" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <span className="eyebrow"><Sparkles size={14} /> Estructura Oficial</span>
              <h3 style={{ fontSize: '22px', color: '#fff', margin: '4px 0 0' }}>Cómo funciona la tabla general</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Top 4 */}
              <div className="glass-card reveal" style={{ padding: '22px', borderLeft: '4px solid #00f5d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Crown size={20} color="#00f5d4" />
                  <strong style={{ fontSize: '16px', color: '#fff' }}>Puestos 1º al 4º</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#00f5d4', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Acceso Directo a Cuartos
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                  Los 4 mejores equipos al término de las 4 jornadas de liga clasifican directamente a los Cuartos de Final.
                </p>
              </div>

              {/* Repechaje 5º al 12º */}
              <div className="glass-card reveal" style={{ padding: '22px', borderLeft: '4px solid #c084fc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Swords size={20} color="#c084fc" />
                  <strong style={{ fontSize: '16px', color: '#fff' }}>Puestos 5º al 12º</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Zona de Repechaje / Playoffs
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                  Disputan cruces directos (5º vs 12º, 6º vs 11º, 7º vs 10º, 8º vs 9º) por las 4 plazas restantes de Cuartos.
                </p>
              </div>

              {/* Eliminación 13º al 16º */}
              <div className="glass-card reveal" style={{ padding: '22px', borderLeft: '4px solid #ff4655' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <ShieldAlert size={20} color="#ff4655" />
                  <strong style={{ fontSize: '16px', color: '#fff' }}>Puestos 13º al 16º</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#ff4655', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Zona de Eliminación
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                  Los 4 últimos clasificados quedan eliminados automáticamente al finalizar las jornadas de la fase regular.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tarjetas de Resumen Táctico VCT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }} className="reveal">
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid var(--val-purple, #c084fc)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '4px', background: 'rgba(192, 132, 252, 0.16)', border: '1px solid rgba(192, 132, 252, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                <Crown size={22} />
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: "'JetBrains Mono', monospace" }}>// LÍDER DE LIGA</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                  {leaderTeam?.team || '—'} ({leaderTeam?.points || 0} PTS)
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid var(--val-cyan, #00f5d4)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '4px', background: 'rgba(0, 245, 212, 0.16)', border: '1px solid rgba(0, 245, 212, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f5d4' }}>
                <Flame size={22} />
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: "'JetBrains Mono', monospace" }}>// RACHA DE VICTORIAS</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                  {mostWinsTeam?.team || '—'} ({mostWinsTeam?.w || 0} Victorias)
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid var(--val-red, #ff4655)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '4px', background: 'rgba(255, 70, 85, 0.16)', border: '1px solid rgba(255, 70, 85, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4655' }}>
                <Trophy size={22} />
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Competición Oficial</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Copa Primate Vol. III</div>
              </div>
            </div>
          </div>

          {/* Podio */}
          {podium.length >= 3 && (
            <div className="podium">
              {podium.map((t, i) => (
                <div
                  key={t.team}
                  className={`podium-spot ${t.rank === 1 ? 'first' : t.rank === 2 ? 'second' : 'third'}`}
                  style={{ '--c': PODIUM_COLORS[t.rank] || 'var(--primary)', animationDelay: `${[150, 0, 300][i]}ms` }}
                >
                  {t.rank === 1 && <Crown className="crown" size={30} />}
                  <img src={t.logo || '/copa-logo.png'} alt={t.team} />
                  <h3>{t.team}</h3>
                  <div className="pts">{t.points} PTS</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.w || 0}V - {t.l || 0}D
                  </div>
                  <div className="podium-base">{t.rank}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabla Principal Limpia */}
          <div className="glass-card table-wrap reveal" style={{ overflowX: 'auto' }}>
            <table className="standings-table" style={{ width: '100%', minWidth: '650px' }}>
              <thead>
                <tr>
                  <th className="gold" onClick={() => handleSort('rank')} style={{ cursor: 'pointer', width: '70px' }}>
                    POS <ArrowUpDown size={12} style={{ verticalAlign: -1, opacity: 0.7 }} />
                  </th>
                  <th className="left" onClick={() => handleSort('team')} style={{ cursor: 'pointer' }}>
                    EQUIPO <ArrowUpDown size={12} style={{ verticalAlign: -1, opacity: 0.7 }} />
                  </th>
                  <th onClick={() => handleSort('p')} style={{ cursor: 'pointer', textAlign: 'center', width: '80px' }}>PJ</th>
                  <th onClick={() => handleSort('w')} style={{ cursor: 'pointer', textAlign: 'center', width: '80px' }}>V</th>
                  <th onClick={() => handleSort('l')} style={{ cursor: 'pointer', textAlign: 'center', width: '80px' }}>D</th>
                  <th onClick={() => handleSort('diff')} style={{ cursor: 'pointer', textAlign: 'center', width: '80px' }}>
                    DIF <ArrowUpDown size={12} style={{ verticalAlign: -1, opacity: 0.7 }} />
                  </th>
                  <th style={{ textAlign: 'center', width: '140px' }}>FORMA</th>
                  <th className="gold" onClick={() => handleSort('points')} style={{ cursor: 'pointer', textAlign: 'center', width: '90px' }}>
                    PTS <ArrowUpDown size={12} style={{ verticalAlign: -1, opacity: 0.7 }} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStandings.map((t, idx) => {
                  const diffVal = t.diff ?? ((t.roundsFor || 0) - (t.roundsAgainst || 0));
                  const isCut4 = showCutLines && idx === QUALIFY_DIRECT - 1 && sortedStandings.length > QUALIFY_DIRECT;
                  const isCut12 = showCutLines && idx === QUALIFY_PLAYOFF - 1 && sortedStandings.length > QUALIFY_PLAYOFF;
                  const zoneClass = t.rank <= QUALIFY_DIRECT ? 'row-zone-direct' : t.rank <= QUALIFY_PLAYOFF ? 'row-zone-playoff' : 'row-zone-out';

                  return (
                    <Fragment key={t.team}>
                      <tr className={zoneClass} style={{ animationDelay: `${idx * 45}ms` }}>
                        <td>
                          <span className={`pos ${t.rank <= QUALIFY_DIRECT ? 'q' : t.rank <= QUALIFY_PLAYOFF ? 'q-playoff' : ''}`}>
                            {t.rank}
                          </span>
                        </td>
                        <td className="left">
                          <div className="team-cell">
                            <img src={t.logo || '/copa-logo.png'} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />
                            <div>
                              <strong style={{ color: '#fff', fontSize: '15px' }}>{t.team}</strong>
                              {t.group && <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>Gr. {t.group}</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>{t.p}</td>
                        <td style={{ color: 'var(--success)', textAlign: 'center', fontWeight: 700 }}>{t.w}</td>
                        <td style={{ color: 'var(--danger)', textAlign: 'center', fontWeight: 700 }}>{t.l}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: diffVal > 0 ? 'var(--success)' : diffVal < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {diffVal > 0 ? `+${diffVal}` : diffVal}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="form" style={{ justifyContent: 'center' }}>
                            {(t.form || ['W']).map((r, i) => (
                              <span key={i} className={r}>{r === 'W' ? 'V' : r === 'L' ? 'D' : 'E'}</span>
                            ))}
                          </div>
                        </td>
                        <td className="pts-cell" style={{ textAlign: 'center', fontSize: '18px' }}>{t.points}</td>
                      </tr>

                      {isCut4 && (
                        <tr className="standings-cut-row cut-direct" aria-hidden="true">
                          <td colSpan={8}>
                            <div className="cut-line-banner">
                              <span>▲ TOP 4 · ACCESO DIRECTO A CUARTOS DE FINAL</span>
                              <span>ZONA DE REPECHAJE (5º AL 12º) ▼</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {isCut12 && (
                        <tr className="standings-cut-row cut-playoff" aria-hidden="true">
                          <td colSpan={8}>
                            <div className="cut-line-banner danger">
                              <span>▲ LÍMITE DE REPECHAJE / PLAYOFFS</span>
                              <span>ZONA DE ELIMINACIÓN (13º AL 16º) ▼</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="legend">
            <span><i style={{ background: 'var(--success)' }} /> Clasificación Directa (Top 4 - Cuartos)</span>
            <span><i style={{ background: 'var(--danger)' }} /> Repechaje / Playoffs (5º al 12º)</span>
            <span><i style={{ background: 'rgba(255,255,255,0.2)' }} /> Eliminados (13º al 16º)</span>
          </div>
        </>
      )}
    </div>
  );
}
