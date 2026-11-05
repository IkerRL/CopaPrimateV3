import { useState } from 'react';
import { Scale, GitCompareArrows, BadgeCheck, HeartHandshake, UserPlus, Target, Crown, Swords, Skull, Calculator, CheckCircle2, XCircle, AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';
import { usePageTitle, useReveal } from '../hooks';
import { RANKS } from '../data';

const FORMAT = [
  { icon: Target, title: 'Fase de Liga Única (16 Equipos)', tag: 'Estilo Champions', type: 'info', desc: 'Una sola tabla general de 16 equipos. Se divide a los equipos en 4 bombos según su Elo y cada escuadra disputa 4 jornadas enfrentando rivales de cada bombo.' },
  { icon: Crown, title: 'Pase Directo a Cuartos', tag: 'Top 4', type: 'info', desc: 'Los 4 mejores equipos de la tabla (1º al 4º) avanzan directamente a los Cuartos de Final.' },
  { icon: Swords, title: 'Repechaje / Playoffs de Acceso', tag: 'Puestos 5º-12º', type: 'warning', desc: 'Los equipos clasificados del 5º al 12º disputan cruces directos (5º vs 12º, 6º vs 11º, 7º vs 10º, 8º vs 9º) por las 4 plazas restantes de Cuartos.' },
  { icon: Skull, title: 'Eliminación Directa', tag: 'Puestos 13º-16º', type: 'hard', desc: 'Los 4 últimos clasificados (13º al 16º) quedan eliminados automáticamente al terminar la fase de liga.' }
];

const RULES = [
  { icon: Scale, title: 'Límite de Elo (16 Puntos)', tag: 'Obligatorio', type: 'hard', desc: 'El coste máximo de Elo del equipo es de 16 puntos (sumando los 3 jugadores principales titulares).' },
  { icon: Calculator, title: 'Media Rango Actual + Peak', tag: 'Ponderación', type: 'info', desc: 'Cada jugador puntúa según la media entre su rango actual y su peak histórico. Se tiene en cuenta la antigüedad del peak para evitar penalizaciones injustas.' },
  { icon: GitCompareArrows, title: 'Brecha de Nivel (Tiers)', tag: 'Obligatorio', type: 'hard', desc: 'No puede haber una diferencia mayor a 4 Tiers entre el jugador de rango más alto y el más bajo del roster.' },
  { icon: BadgeCheck, title: 'Requisito de Cuenta', tag: 'Anti-Smurf', type: 'hard', desc: 'Todas las cuentas deben ser nivel 40 o superior para evitar smurfs y cuentas secundarias.' },
  { icon: UserPlus, title: 'Sustitutos', tag: 'Opcional', type: 'info', desc: 'Se permite 1 suplente por equipo. El suplente debe cumplir todas las restricciones de Elo al entrar al roster.' },
  { icon: HeartHandshake, title: 'Comportamiento', tag: 'Descalificación', type: 'hard', desc: 'Toxicidad, insultos o comportamiento antideportivo resultará en descalificación inmediata del equipo entero.' },
];

const POINTS = Object.entries(RANKS).filter(([name]) => name !== 'Radiante');
const MAX = 8;

const RANK_OPTIONS = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Ascendente', 'Inmortal', 'Radiante'];
const TIER_INDEX = {
  Hierro: 1,
  Bronce: 2,
  Plata: 3,
  Oro: 4,
  Platino: 5,
  Diamante: 6,
  Ascendente: 7,
  Inmortal: 8,
  Radiante: 8,
};

const DEFAULT_PLAYERS = [
  { name: 'Titular 1', currentRank: 'Platino', peakRank: 'Diamante', level: 65 },
  { name: 'Titular 2', currentRank: 'Oro', peakRank: 'Platino', level: 80 },
  { name: 'Titular 3', currentRank: 'Plata', peakRank: 'Oro', level: 45 },
];

export default function RulesPage() {
  usePageTitle('Normas');
  useReveal();

  const [players, setPlayers] = useState(DEFAULT_PLAYERS);

  const updatePlayer = (index, field, value) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const getPlayerElo = (p) => {
    const cur = RANKS[p.currentRank]?.points || 1;
    const peak = RANKS[p.peakRank]?.points || 1;
    return Math.round(((cur + peak) / 2) * 10) / 10;
  };

  const playerElos = players.map(getPlayerElo);
  const totalElo = Math.round(playerElos.reduce((a, b) => a + b, 0) * 10) / 10;

  const playerTiers = players.map((p) => Math.max(TIER_INDEX[p.currentRank] || 1, TIER_INDEX[p.peakRank] || 1));
  const minTier = Math.min(...playerTiers);
  const maxTier = Math.max(...playerTiers);
  const tierDiff = maxTier - minTier;

  const isEloValid = totalElo <= 16;
  const isDiffValid = tierDiff <= 4;
  const isLevelValid = players.every((p) => Number(p.level || 0) >= 40);
  const isTeamValid = isEloValid && isDiffValid && isLevelValid;

  return (
    <div className="animate-fade-in">
      <header className="page-header" data-watermark="RULESET">
        <span className="eyebrow">Reglamento oficial</span>
        <h1 className="page-title">Reglas del Torneo</h1>
        <p className="page-subtitle">Sistema de puntos del 1 al 8 con límite máximo de 16 pts y media ponderada</p>
      </header>

      <div className="rules-layout">
        <div className="rules-list">
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Formato de Competición</h2>
          {FORMAT.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <article
                key={rule.title}
                className="glass-card hoverable rule-card reveal"
                style={{ transitionDelay: `${idx * 70}ms` }}
              >
                <div className="rule-index"><Icon size={24} /></div>
                <div>
                  <h3>
                    {rule.title}
                    <span className={`rule-tag ${rule.type}`}>{rule.tag}</span>
                  </h3>
                  <p>{rule.desc}</p>
                </div>
              </article>
            );
          })}

          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginTop: '2rem', marginBottom: '0.5rem', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Normas Generales</h2>
          {RULES.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <article
                key={rule.title}
                className="glass-card hoverable rule-card reveal"
                style={{ transitionDelay: `${idx * 70}ms` }}
              >
                <div className="rule-index"><Icon size={24} /></div>
                <div>
                  <h3>
                    {rule.title}
                    <span className={`rule-tag ${rule.type}`}>{rule.tag}</span>
                  </h3>
                  <p>{rule.desc}</p>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="glass-card points-card hud-bracket-box reveal">
          <h3>Coste por rango (Escala 1 - 8)</h3>
          <p>Se evalúa la media ponderada entre <strong>rango actual</strong> y <strong>peak histórico</strong>. El total del trío titular no puede superar <strong>16 puntos</strong>.</p>

          {POINTS.map(([name, r], i) => (
            <div className="points-row" key={name} style={{ '--c': r.color }}>
              <span className="name"><i className="swatch" />{name === 'Inmortal' ? 'Inmo / Radi' : name}</span>
              <div className="bar"><span style={{ width: `${(r.points / MAX) * 100}%`, animationDelay: `${i * 80}ms` }} /></div>
              <span className="pts">{r.points} pt{r.points > 1 ? 's' : ''}</span>
            </div>
          ))}

          <div className="points-note">
            <strong>Ejemplo de trío válido:</strong><br />
            Diamante (6) + Platino (5) + Platino (5) = <strong>16 pts</strong> ✅<br />
            Ascendente (7) + Diamante (6) + Plata (3) = <strong>16 pts</strong> ✅
          </div>
        </aside>
      </div>

      <div className="laser-divider" aria-hidden="true" />

      {/* ================= CALCULADORA INTERACTIVA DE ELO ================= */}
      <section className="section reveal" style={{ marginTop: '24px' }}>
        <div className="section-head">
          <span className="eyebrow"><Calculator size={14} /> Herramienta Interactiva</span>
          <h2 className="section-title">Calculadora Oficial de <span className="text-gradient">Elo y Roster</span></h2>
          <p className="section-sub">
            Simula el trío de tu equipo introduciendo el rango actual, el peak histórico y el nivel de cuenta de cada jugador. Comprueba al instante si tu alineación cumple las normas de la Copa Primate.
          </p>
        </div>

        <div className="glass-card hud-bracket-box" style={{ padding: '28px', borderTop: '3px solid var(--val-purple, #c084fc)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '4px', background: 'rgba(192, 132, 252, 0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.4)' }}>
                <Calculator size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Configurador del Trío Titular</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cálculo automático de media ponderada y desfase de tiers</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPlayers(DEFAULT_PLAYERS)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text-muted)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} /> Restaurar Ejemplo
            </button>
          </div>

          {/* Grid de los 3 Jugadores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {players.map((p, idx) => {
              const elo = playerElos[idx];
              const curColor = RANKS[p.currentRank]?.color || 'var(--primary)';
              const peakColor = RANKS[p.peakRank]?.color || 'var(--primary)';

              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,179,0,0.2)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                        {idx + 1}
                      </span>
                      <strong style={{ color: '#fff', fontSize: '15px' }}>{p.name || `Titular ${idx + 1}`}</strong>
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        background: 'rgba(255,179,0,0.15)',
                        color: 'var(--primary)',
                        padding: '3px 10px',
                        borderRadius: '20px',
                      }}
                    >
                      {elo} pts
                    </span>
                  </div>

                  {/* Rango Actual */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      Rango Actual
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={p.currentRank}
                        onChange={(e) => updatePlayer(idx, 'currentRank', e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(15,25,20,0.9)',
                          border: `1px solid ${curColor}55`,
                          color: '#fff',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      >
                        {RANK_OPTIONS.map((r) => (
                          <option key={r} value={r} style={{ background: '#0d1813', color: '#fff' }}>
                            {r} ({RANKS[r]?.points} pt{RANKS[r]?.points > 1 ? 's' : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Peak Histórico */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      Peak Histórico
                    </label>
                    <select
                      value={p.peakRank}
                      onChange={(e) => updatePlayer(idx, 'peakRank', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(15,25,20,0.9)',
                        border: `1px solid ${peakColor}55`,
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    >
                      {RANK_OPTIONS.map((r) => (
                        <option key={r} value={r} style={{ background: '#0d1813', color: '#fff' }}>
                          {r} ({RANKS[r]?.points} pt{RANKS[r]?.points > 1 ? 's' : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nivel de Cuenta */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      Nivel de Cuenta (Mín. 40)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={p.level}
                      onChange={(e) => updatePlayer(idx, 'level', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(15,25,20,0.9)',
                        border: Number(p.level || 0) < 40 ? '1px solid var(--danger)' : '1px solid rgba(255,255,255,0.12)',
                        color: Number(p.level || 0) < 40 ? 'var(--danger)' : '#fff',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    {Number(p.level || 0) < 40 && (
                      <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px', display: 'block' }}>
                        ⚠️ Debe ser nivel 40 o superior
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel de Veredicto y Estadísticas del Equipo */}
          <div
            style={{
              marginTop: '28px',
              padding: '24px',
              borderRadius: '12px',
              background: isTeamValid ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 90, 54, 0.08)',
              border: `1px solid ${isTeamValid ? 'rgba(0, 255, 136, 0.35)' : 'rgba(255, 90, 54, 0.35)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Coste Total del Roster
                </span>
                <div style={{ fontSize: '28px', fontWeight: 900, color: isEloValid ? 'var(--success)' : 'var(--danger)', fontFamily: "'Bebas Neue', sans-serif" }}>
                  {totalElo} / 16.0 <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>PUNTOS ELO</span>
                </div>
              </div>

              {/* Badges de comprobación individual */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: isEloValid ? 'rgba(0,255,136,0.12)' : 'rgba(255,70,85,0.12)',
                    color: isEloValid ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${isEloValid ? 'rgba(0,255,136,0.3)' : 'rgba(255,70,85,0.3)'}`,
                  }}
                >
                  {isEloValid ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  Límite 16 Pts ({totalElo <= 16 ? 'Válido' : `+${(totalElo - 16).toFixed(1)} exceso`})
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: isDiffValid ? 'rgba(0,255,136,0.12)' : 'rgba(255,70,85,0.12)',
                    color: isDiffValid ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${isDiffValid ? 'rgba(0,255,136,0.3)' : 'rgba(255,70,85,0.3)'}`,
                  }}
                >
                  {isDiffValid ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  Brecha de Tiers: {tierDiff} / 4 máx.
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: isLevelValid ? 'rgba(0,255,136,0.12)' : 'rgba(255,70,85,0.12)',
                    color: isLevelValid ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${isLevelValid ? 'rgba(0,255,136,0.3)' : 'rgba(255,70,85,0.3)'}`,
                  }}
                >
                  {isLevelValid ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  Nivel de Cuenta (+40)
                </span>
              </div>
            </div>

            {/* Barra de progreso de Elo */}
            <div style={{ height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min((totalElo / 16) * 100, 100)}%`,
                  background: isEloValid ? 'linear-gradient(90deg, var(--primary-2), var(--primary))' : '#ff4655',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Veredicto Final */}
            {isTeamValid ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)', fontWeight: 700, fontSize: '14px' }}>
                <ShieldCheck size={20} />
                <span>¡ROSTER 100% VÁLIDO! Este trío cumple con todas las restricciones para inscribirse en la Copa Primate.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', fontWeight: 700, fontSize: '14px' }}>
                <AlertTriangle size={20} />
                <span>
                  ROSTER NO PERMITIDO: Revisa los avisos en rojo para ajustar los integrantes antes de presentar el ticket.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
