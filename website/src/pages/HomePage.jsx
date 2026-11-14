import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users, ShieldAlert, ChevronDown, Sparkles, History } from 'lucide-react';
import { usePageTitle, useReveal, useCountUp } from '../hooks';
import { fetchPublic } from '../api';
import { TEAMS } from '../data';

function Stat({ value, label, suffix = '', prefix = '' }) {
  const [ref, n] = useCountUp(value);
  return (
    <div className="stat" ref={ref}>
      <div className="stat-value text-gradient">{prefix}{n}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Trophy,
    color: 'var(--feat-1)',
    title: 'Formato Champions',
    text: 'Liga única con bombos por Elo, repechaje y fase final directa. Solo los mejores sobrevivirán a la jungla.',
  },
  {
    icon: Users,
    color: 'var(--feat-2)',
    title: 'Equipos Nivelados',
    text: 'Sistema de Elo y restricciones estrictas para asegurar enfrentamientos justos, equilibrados y muy emocionantes.',
  },
  {
    icon: ShieldAlert,
    color: 'var(--feat-3)',
    title: 'Supervisión Activa',
    text: 'Moderación estricta y sistemas anti-boosting para mantener la integridad, respeto y diversión en el torneo.',
  },
];

const STEPS = [
  { title: 'Forma tu trío', text: 'Reúne a 3 titulares y, si quieres, 1 suplente.' },
  { title: 'Abre un ticket', text: 'Envía en Discord los enlaces de tracker.gg de cada jugador.' },
  { title: 'Validación', text: 'Nuestro bot anti-smurf verifica rango, nivel y Elo del equipo.' },
  { title: 'A la jungla', text: 'Equipo confirmado: espera el sorteo y prepárate para competir.' },
];

export default function HomePage() {
  usePageTitle(null);
  useReveal();

  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchPublic('/summary')
      .then(data => {
        if (data) setSummary(data);
      })
      .catch(() => {});
  }, []);

  const totalTeams = 16;
  const totalPlayers = 48;

  return (
    <div>
      {/* HERO */}
      <section className="hero animate-fade-in">
        <div className="hero-glow" />
        <div className="vct-watermark hero-watermark" aria-hidden="true">PRIMATE // 03</div>
        <div className="vct-coords" aria-hidden="true">// PROTOCOLO PRIMATE · VOL. III</div>

        <div className="hero-badge">
          <span className="pill"><span className="pulse-dot" /> INSCRIPCIONES</span>
          Temporada 2026 · Torneo de Valorant
        </div>

        {/* Emblema Oficial del Torneo */}
        <div className="hero-emblem-wrap">
          <img
            src="./copa-logo.png"
            alt="Copa Primate Vol. III - Logo Oficial"
            className="hero-copa-logo animate-float"
          />
        </div>

        <h1 className="hero-title">COPA PRIMATE</h1>

        <div className="hero-vol">
          <img
            src="./monito-der.png"
            alt="Mono izquierdo"
            className="monkey left animate-float"
          />
          <h2 className="text-gradient">VOL. III</h2>
          <img
            src="./monito-izq.png"
            alt="Mono derecho"
            className="monkey right animate-float-delayed"
          />
        </div>

        <p className="hero-text">
          Demuestra tu habilidad en el campo de batalla. Solo los equipos más fuertes sobrevivirán a la fase de grupos
          y alcanzarán la gloria en la Gran Final.
        </p>

        <div className="hero-actions">
          <Link to="/equipos" className="btn btn-primary" id="cta-teams">
            Ver Equipos <ArrowRight size={20} />
          </Link>
          <Link to="/normas" className="btn btn-secondary" id="cta-rules">
            Reglamento <ShieldAlert size={20} />
          </Link>
        </div>

        <ChevronDown className="scroll-cue" size={28} />
      </section>

      {/* STATS */}
      <section className="reveal">
        <div className="stats-strip">
          <Stat value={totalTeams} label="Equipos" />
          <Stat value={totalPlayers} label="Jugadores" />
          <Stat value={16} label="Elo máximo" suffix=" pts" />
          <Stat value={40} label="Nivel mínimo" prefix="+" />
        </div>
      </section>

      <div className="laser-divider" aria-hidden="true" />

      {/* FEATURES */}
      <section className="section">
        <div className="section-head reveal" data-watermark="COMPETITIVE">
          <span className="eyebrow"><Sparkles size={14} /> Por qué la Copa Primate</span>
          <h2 className="section-title">Un torneo hecho para <span className="text-gradient">competir de verdad</span></h2>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="glass-card hoverable feature-card reveal"
                style={{ '--accent': f.color, transitionDelay: `${i * 100}ms` }}
              >
                <div className="feature-icon"><Icon size={28} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* STEPS */}
      <section className="section">
        <div className="section-head reveal" data-watermark="PROTOCOL">
          <span className="eyebrow">Inscripción</span>
          <h2 className="section-title">Cómo participar</h2>
          <p className="section-sub">Cuatro pasos y estás dentro. Todo el proceso se gestiona desde nuestro Discord.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className="step reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="step-num">0{i + 1}</div>
              <h4>{s.title}</h4>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TIME MACHINE TEASER */}
      <section className="section">
        <div className="glass-card time-machine-teaser reveal">
          <div className="tmt-left">
            <span className="eyebrow"><History size={14} /> Archivo Histórico</span>
            <h2 className="section-title">Revive las <span className="text-gradient">ediciones anteriores</span></h2>
            <p>Descubre los archivos de la Copa Primate: los equipos, grupos, jornadas de liga cruzada y las eliminatorias que se vivieron en el canal de Twitch de MakacaGótica.</p>
            <div className="tmt-actions">
              <Link to="/maquina-del-tiempo" className="btn btn-primary" id="cta-time-machine">
                Entrar a la Máquina del Tiempo <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="tmt-champs">
            <div className="tmt-badge">
              <span className="tmt-vol">VOL. I (2026)</span>
              <img src="/logos-v1/logo2.png" alt="Golden Sex" />
              <div className="tmt-badge-info">
                <strong>Golden Sex (3-0)</strong>
                <span>Max & Broken 🏆</span>
              </div>
            </div>
            <div className="tmt-badge">
              <span className="tmt-vol">VOL. II (2026)</span>
              <img src="/logo2.png" alt="Los Akrtona2" />
              <div className="tmt-badge-info">
                <strong>Los Akrtona2 (3-2)</strong>
                <span>Kira & Serax 🏆</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band reveal">
        <h2>¿Listo para <span className="text-gradient">reinar en la jungla</span>?</h2>
        <p>Revisa las normas, monta tu equipo y abre un ticket. La moderación validará tu roster en minutos.</p>
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link to="/normas" className="btn btn-primary">Ver requisitos <ArrowRight size={20} /></Link>
          <Link to="/clasificacion" className="btn btn-secondary">Clasificación <Trophy size={20} /></Link>
        </div>
      </section>
    </div>
  );
}
