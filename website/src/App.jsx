import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { Home, Info, Swords, Users, Trophy, Menu, X, History } from 'lucide-react';
import HomePage from './pages/HomePage';
import RulesPage from './pages/RulesPage';
import MatchesPage from './pages/MatchesPage';
import TeamsPage from './pages/TeamsPage';
import StandingsPage from './pages/StandingsPage';
import TimeMachinePage from './pages/TimeMachinePage';
import LiveBanner from './components/LiveBanner';
import OverlayScoreboard from './pages/overlays/OverlayScoreboard';
import OverlayMatchup from './pages/overlays/OverlayMatchup';
import OverlayTicker from './pages/overlays/OverlayTicker';
import OverlayRoulette from './pages/overlays/OverlayRoulette';
import OverlayLive from './pages/overlays/OverlayLive';
import OverlayGruposSorteo from './pages/overlays/OverlayGruposSorteo';

const LINKS = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/normas', label: 'Normas', icon: Info },
  { to: '/enfrentamientos', label: 'Enfrentamientos', icon: Swords },
  { to: '/equipos', label: 'Equipos', icon: Users },
  { to: '/clasificacion', label: 'Clasificación', icon: Trophy },
  { to: '/maquina-del-tiempo', label: 'Máquina del Tiempo', icon: History },
];

const SPORES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 5.7 + 3) % 96}%`,
  size: `${3 + (i % 4) * 1.5}px`,
  duration: `${12 + (i % 6) * 3}s`,
  delay: `-${(i * 1.9) % 15}s`,
  drift: `${(i % 2 === 0 ? 1 : -1) * (18 + (i % 5) * 10)}px`,
  isCyan: i % 3 === 0,
}));

function App() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Estilo oficial Fusión Valorant permanente
  useEffect(() => {
    document.documentElement.classList.add('theme-fusion');
    document.documentElement.classList.remove('theme-classic');
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Al cambiar de página: volver arriba
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Si es una ruta de overlay de OBS, renderizar transparente sin interfaz de la web
  const rawPath = (window.location.pathname + window.location.search + window.location.hash + location.pathname).toLowerCase();
  if (rawPath.includes('/overlay')) {
    if (rawPath.includes('scoreboard')) return <OverlayScoreboard />;
    if (rawPath.includes('roulette')) return <OverlayRoulette />;
    if (rawPath.includes('matchup')) return <OverlayMatchup />;
    if (rawPath.includes('ticker')) return <OverlayTicker />;
    if (rawPath.includes('sorteo') || rawPath.includes('grupos')) return <OverlayGruposSorteo />;
    return <OverlayLive />;
  }

  return (
    <div className="app-container theme-fusion">
      <div className="bg-image" />
      <div className="bg-overlay" />
      <div className="radianite-spores" aria-hidden="true">
        {SPORES.map((s) => (
          <span
            key={s.id}
            className={`spore ${s.isCyan ? 'cyan' : ''}`}
            style={{
              left: s.left,
              width: s.size,
              height: s.size,
              animationDuration: s.duration,
              animationDelay: s.delay,
              '--drift': s.drift,
            }}
          />
        ))}
      </div>
      <div className="noise-overlay" />
      <div className="scanlines" />

      <LiveBanner />

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="brand-group">
          <Link 
            to="/" 
            className="brand-logo-trigger" 
            title="Inicio · Copa Primate"
            aria-label="Copa Primate - Inicio"
          >
            <img src="./copa-logo.png" alt="Logo Copa Primate" />
            <span className="brand-logo-pulse" />
          </Link>

          <Link 
            to="/" 
            className="brand" 
            id="brand-link"
            title="Copa Primate Oficial"
          >
            COPA <span>PRIMATE</span>
          </Link>
        </div>

        <button
          className="nav-toggle"
          id="nav-toggle"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              id={`nav-${label.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="main-content" key={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/normas" element={<RulesPage />} />
          <Route path="/enfrentamientos" element={<MatchesPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/equipos" element={<TeamsPage />} />
          <Route path="/clasificacion" element={<StandingsPage />} />
          <Route path="/maquina-del-tiempo" element={<TimeMachinePage />} />
          <Route
            path="*"
            element={
              <div style={{ textAlign: 'center', padding: '90px 20px' }} className="animate-fade-in">
                <h1 style={{ fontSize: '72px', color: 'var(--primary)', margin: 0, fontFamily: "'Bebas Neue', sans-serif" }}>
                  404
                </h1>
                <h2 style={{ fontSize: '24px', color: '#fff', margin: '10px 0 16px' }}>
                  Página perdida en la jungla 🐒
                </h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 28px' }}>
                  No hemos encontrado esta sección de la Copa Primate. Puede que el enlace haya cambiado o esté mal escrito.
                </p>
                <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
                  Volver al Inicio
                </Link>
              </div>
            }
          />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <Link to="/" className="brand">
              <img src="./copa-logo.png" alt="Copa Primate" />
              COPA <span>PRIMATE</span>
            </Link>
            <p>El torneo de Valorant más salvaje de la jungla. Equipos nivelados, moderación activa y mucha banana.</p>
          </div>
          <div>
            <h4>Torneo</h4>
            <ul className="footer-links">
              <li><Link to="/normas">Reglamento</Link></li>
              <li><Link to="/enfrentamientos">Calendario</Link></li>
              <li><Link to="/clasificacion">Clasificación</Link></li>
              <li><Link to="/maquina-del-tiempo">Máquina del Tiempo</Link></li>
            </ul>
          </div>
          <div>
            <h4>Comunidad</h4>
            <ul className="footer-links">
              <li><Link to="/equipos">Equipos confirmados</Link></li>
              <li><Link to="/normas">Requisitos de inscripción</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2026 Copa Primate. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

export default App;
