import { useState, useEffect, useRef } from 'react';
import {
  Users, Ticket, MessageCircle, Wifi, WifiOff, Clock, Zap, Hash, Shield,
  UserPlus, UserMinus, Search, Megaphone, Send, Server, RefreshCw, Activity,
  Sparkles, Calendar, BookOpen, Tv, ChevronDown, ChevronUp, CheckCircle, Bell
} from 'lucide-react';

import { apiFetch } from '../api';
const POLL_MS = 10000;

// Contador animado
function useCountUp(value, duration = 800) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (value == null || isNaN(value)) return;
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

function formatUptime(ms) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'hace unos segundos';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

const ACTIVITY_META = {
  system: { icon: Zap, color: 'var(--info)', label: 'Sistema' },
  join: { icon: UserPlus, color: 'var(--success)', label: 'Entrada' },
  leave: { icon: UserMinus, color: 'var(--danger)', label: 'Salida' },
  tracker: { icon: Search, color: 'var(--primate-orange)', label: 'Anti-Smurf' },
  ticket: { icon: Send, color: 'var(--violet)', label: 'Ticket' },
  announcement: { icon: Megaphone, color: 'var(--warning)', label: 'Anuncio' },
};

function StatCard({ icon: Icon, label, value, sub, accent, delay = 0, suffix = '' }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <div className="stat-card glass-card" style={{ '--accent': accent, animationDelay: `${delay}ms` }}>
      <div className="stat-card-glow" />
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon"><Icon size={20} /></div>
      </div>
      <div className="stat-value">
        {typeof value === 'number' ? animated.toLocaleString('es-ES') : (value ?? '—')}
        {suffix && <span className="stat-suffix">{suffix}</span>}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function ActivityChart({ data }) {
  const max = Math.max(1, ...data.map(d => d.count));
  const [hovered, setHovered] = useState(null);

  return (
    <div className="chart">
      <div className="chart-bars">
        {data.map((d, i) => {
          const h = (d.count / max) * 100;
          const date = new Date(d.hour);
          return (
            <div
              key={d.hour}
              className={`chart-bar-wrap ${hovered === i ? 'hovered' : ''}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && (
                <div className="chart-tooltip">
                  <strong>{d.count}</strong> mensajes
                  <span>{date.getHours().toString().padStart(2, '0')}:00</span>
                </div>
              )}
              <div className="chart-bar" style={{ height: `${Math.max(h, 2)}%`, animationDelay: `${i * 25}ms` }} />
            </div>
          );
        })}
      </div>
      <div className="chart-axis">
        {data.filter((_, i) => i % 4 === 0).map(d => (
          <span key={d.hour}>{new Date(d.hour).getHours().toString().padStart(2, '0')}:00</span>
        ))}
      </div>
    </div>
  );
}

export default function Overview({ onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showModNews, setShowModNews] = useState(true);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch(`/stats`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setError(false);
      setLastUpdate(new Date());
    } catch {
      setError(true);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const bot = data?.bot;
  const guild = data?.guild;
  const counters = data?.counters || {};
  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Buenas noches' : hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches';

  const pingQuality = bot?.ping == null ? 'off' : bot.ping < 120 ? 'good' : bot.ping < 300 ? 'mid' : 'bad';

  return (
    <div className="overview fade-in">
      {/* Cabecera */}
      <header className="overview-header">
        <div className="overview-title">
          {guild?.icon ? (
            <img src={guild.icon} alt={guild.name} className="guild-icon" />
          ) : (
            <div className="guild-icon guild-icon-fallback"><Server size={26} /></div>
          )}
          <div>
            <span className="eyebrow">{greeting}, moderador</span>
            <h2>{guild?.name || 'Panel de Control'}</h2>
          </div>
        </div>

        <div className="overview-actions">
          <div className={`live-pill ${error || !bot?.online ? 'offline' : ''}`}>
            <span className="live-dot" />
            {error ? 'API desconectada' : bot?.online ? 'En directo' : 'Bot desconectado'}
          </div>
          <button className="btn-icon" onClick={fetchStats} title="Actualizar">
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
      </header>

      {/* Tablón de Novedades de Moderación */}
      {showModNews && (
        <div
          className="glass-card fade-in"
          style={{
            padding: '22px 26px',
            marginBottom: '26px',
            borderLeft: '4px solid var(--primary)',
            background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.08) 0%, rgba(10, 20, 15, 0.6) 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,179,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Novedades & Cambios para Moderadores</h3>
                  <span style={{ fontSize: '11px', background: 'rgba(255,179,0,0.2)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                    MOD PACK 2026
                  </span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Nuevas funcionalidades añadidas al panel para la gestión de partidos, stream y soporte.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModNews(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-muted)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ✕ Cerrar aviso
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                <Calendar size={16} /> Horarios & Enfrentamientos
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                Tras generar el sorteo, ahora puedes modificar fechas y horas, cambiar mapas y actualizar estados en vivo.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                <Activity size={16} /> K/D/A y Agentes por Jugador
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                Al concluir un partido, registra los agentes seleccionados y estadísticas individuales para sincronizarlas con la web.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9146ff', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                <Tv size={16} /> Overlays para OBS & Twitch
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                Nuevo apartado de marcadores y pantallas Versus en tiempo real para las transmisiones en el canal de MakacaGótica.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--info)', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                <BookOpen size={16} /> Manual de Reglas & Protocolos
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                Consulta rápida de límites de Elo (16 pts), brecha de tiers, protocolo de tickets y comandos de moderación.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <WifiOff size={20} />
          <div>
            <strong>No se puede conectar con el bot.</strong>
            <span> Asegúrate de que <code>node bot.js</code> está en marcha en el puerto 3001.</span>
          </div>
        </div>
      )}

      {/* Tarjetas principales */}
      <section className="stats-grid">
        <StatCard
          icon={Users}
          label="Miembros"
          value={guild?.memberCount}
          sub={guild?.onlineCount != null ? <><span className="dot-online" /> {guild.onlineCount.toLocaleString('es-ES')} conectados</> : 'Total del servidor'}
          accent="#ff9900"
          delay={0}
        />
        <StatCard
          icon={Ticket}
          label="Tickets abiertos"
          value={data?.tickets?.open}
          sub={`${data?.tickets?.replies ?? 0} respuestas enviadas`}
          accent="#a78bfa"
          delay={80}
        />
        <StatCard
          icon={MessageCircle}
          label="Mensajes · 24h"
          value={counters.messages24h}
          sub="Desde que arrancó el bot"
          accent="#38bdf8"
          delay={160}
        />
        <StatCard
          icon={bot?.online ? Wifi : WifiOff}
          label="Latencia"
          value={bot?.ping}
          suffix="ms"
          sub={<><Clock size={13} /> Activo {formatUptime(bot?.uptime)}</>}
          accent={pingQuality === 'good' ? '#00ff88' : pingQuality === 'mid' ? '#fbbf24' : '#ff4655'}
          delay={240}
        />
      </section>

      {/* Gráfico + info */}
      <section className="overview-row">
        <div className="glass-card panel panel-wide">
          <div className="panel-head">
            <div>
              <h3>Actividad del servidor</h3>
              <p>Mensajes por hora en las últimas 24 horas</p>
            </div>
            <div className="panel-badge"><Activity size={14} /> {counters.messages24h ?? 0} total</div>
          </div>
          {data?.hourly ? <ActivityChart data={data.hourly} /> : <div className="skeleton" style={{ height: 220 }} />}
        </div>

        <div className="glass-card panel">
          <div className="panel-head">
            <div>
              <h3>Estado del sistema</h3>
              <p>Bot y servidor de Discord</p>
            </div>
          </div>
          <div className="bot-identity">
            <div className="bot-avatar-wrap">
              <img src={bot?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="bot" />
              <span className={`status-ring ${bot?.online ? 'on' : 'off'}`} />
            </div>
            <div>
              <div className="bot-name">{bot?.tag || 'Desconocido'}</div>
              <div className={`bot-state ${bot?.online ? 'on' : 'off'}`}>{bot?.online ? 'Operativo' : 'Sin conexión'}</div>
            </div>
          </div>
          <ul className="info-list">
            <li><span><Hash size={15} /> Canales</span><strong>{guild?.channelCount ?? '—'}</strong></li>
            <li><span><Shield size={15} /> Roles</span><strong>{guild?.roleCount ?? '—'}</strong></li>
            <li><span><Zap size={15} /> Mejoras</span><strong>{guild ? `${guild.boostCount} · Nivel ${guild.boostTier}` : '—'}</strong></li>
            <li><span><Clock size={15} /> Uptime</span><strong>{formatUptime(bot?.uptime)}</strong></li>
          </ul>
          <div className="mini-counters">
            <div><UserPlus size={15} color="var(--success)" /><strong>{counters.joins ?? 0}</strong><span>Entradas</span></div>
            <div><UserMinus size={15} color="var(--danger)" /><strong>{counters.leaves ?? 0}</strong><span>Salidas</span></div>
            <div><Search size={15} color="var(--primate-orange)" /><strong>{counters.trackerLookups ?? 0}</strong><span>Verificados</span></div>
            <div><Megaphone size={15} color="var(--warning)" /><strong>{counters.announcements ?? 0}</strong><span>Anuncios</span></div>
          </div>
        </div>
      </section>

      {/* Actividad + miembros */}
      <section className="overview-row">
        <div className="glass-card panel panel-wide">
          <div className="panel-head">
            <div>
              <h3>Actividad reciente</h3>
              <p>Eventos registrados por el bot en esta sesión</p>
            </div>
          </div>
          <div className="activity-feed">
            {(data?.activity || []).length === 0 && (
              <div className="empty-state">Todavía no hay eventos. Aparecerán aquí en tiempo real.</div>
            )}
            {(data?.activity || []).slice(0, 8).map((ev, i) => {
              const meta = ACTIVITY_META[ev.type] || ACTIVITY_META.system;
              const Icon = meta.icon;
              return (
                <div key={ev.timestamp + i} className="activity-item" style={{ '--c': meta.color, animationDelay: `${i * 40}ms` }}>
                  <div className="activity-icon"><Icon size={16} /></div>
                  <div className="activity-text">
                    <span>{ev.text}</span>
                    <small>{meta.label} · {timeAgo(ev.timestamp)}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card panel">
          <div className="panel-head">
            <div>
              <h3>Nuevos miembros</h3>
              <p>Últimas incorporaciones</p>
            </div>
          </div>
          <div className="member-list">
            {(data?.recentMembers || []).length === 0 && <div className="empty-state">Sin datos de miembros.</div>}
            {(data?.recentMembers || []).map(m => (
              <div key={m.id} className="member-item">
                <img src={m.avatar} alt={m.tag} />
                <div>
                  <span>{m.tag}</span>
                  <small>{timeAgo(m.joinedAt)}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="quick-actions">
            <button className="btn-secondary" onClick={() => onNavigate?.('tickets')}><Ticket size={16} /> Ver tickets</button>
            <button className="btn-secondary" onClick={() => onNavigate?.('announcements')}><Megaphone size={16} /> Anunciar</button>
          </div>
        </div>
      </section>

      <footer className="overview-foot">
        {lastUpdate ? `Última actualización: ${lastUpdate.toLocaleTimeString('es-ES')} · se refresca cada ${POLL_MS / 1000}s` : 'Cargando datos…'}
      </footer>
    </div>
  );
}
