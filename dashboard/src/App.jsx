import { useState, useEffect } from 'react';
import { Ticket, Megaphone, Users, Activity, LayoutDashboard, Menu, X, Radio, Shuffle, LogOut, Tv, BookOpen, Compass, Dices, Trophy, Globe } from 'lucide-react';
import Overview from './components/Overview';
import Tickets from './components/Tickets';
import Announcements from './components/Announcements';
import Teams from './components/Teams';
import Scoreboard from './components/Scoreboard';
import CopaGruposLiga from './components/CopaGruposLiga';
import MapRoulette from './components/MapRoulette';
import EquipmentRandomizer from './components/EquipmentRandomizer';
import Overlays from './components/Overlays';
import RulesGuide from './components/RulesGuide';
import WebManager from './components/WebManager';
import Login from './components/Login';
import OverlayScoreboard from './components/overlays/OverlayScoreboard';
import OverlayMatchup from './components/overlays/OverlayMatchup';
import OverlayTicker from './components/overlays/OverlayTicker';
import OverlayRoulette from './components/overlays/OverlayRoulette';
import OverlayLive from './components/overlays/OverlayLive';
import { apiFetch, getToken, clearToken, getTwitchUser } from './api';
import './index.css';

const NAV = [
  { id: 'overview', label: 'Inicio & Novedades', icon: LayoutDashboard },
  { id: 'web-manager', label: 'Gestión Web Oficial 🌐', icon: Globe },
  { id: 'draw', label: 'Grupos & Sorteo de Liga', icon: Trophy },
  { id: 'scoreboard', label: 'Marcador Oficial', icon: Radio },
  { id: 'map-roulette', label: 'Ruleta de Mapas', icon: Compass },
  { id: 'randomizer', label: 'Randomizer de Armas', icon: Dices },
  { id: 'overlays', label: 'Overlays para Stream', icon: Tv },
  { id: 'tickets', label: 'Gestión de Tickets', icon: Ticket, badge: 'tickets' },
  { id: 'teams', label: 'Equipos & Elos', icon: Users },
  { id: 'rules', label: 'Reglas & Protocolos', icon: BookOpen },
  { id: 'announcements', label: 'Anuncios Oficiales', icon: Megaphone },
];

function DashboardMain() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [sessionExpired, setSessionExpired] = useState(false);
  const [twitchUser, setTwitchUser] = useState(() => getTwitchUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [extractedTeam, setExtractedTeam] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [botStatus, setBotStatus] = useState({ online: false, ping: null, tickets: 0 });

  // Asegurar fondo oscuro permanente en el panel de moderación
  useEffect(() => {
    document.body.style.backgroundColor = '#08080b';
    document.body.style.color = '#f5f5f7';
    document.documentElement.style.backgroundColor = '#08080b';
    document.documentElement.style.color = '#f5f5f7';
  }, []);

  // Escuchar eventos de expiración de sesión (401 de la API)
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setSessionExpired(true);
    };
    window.addEventListener('primate:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('primate:unauthorized', handleUnauthorized);
  }, []);

  // Estado del bot en la barra lateral
  useEffect(() => {
    if (!isAuthenticated) return;
    const check = async () => {
      try {
        const res = await apiFetch('/stats');
        if (res.ok) {
          const json = await res.json();
          setBotStatus({ online: !!json.bot?.online, ping: json.bot?.ping, tickets: json.tickets?.open || 0, tag: json.bot?.tag });
        } else {
          setBotStatus({ online: false, ping: null, tickets: 0 });
        }
      } catch {
        setBotStatus({ online: false, ping: null, tickets: 0 });
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  const navigate = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const handleExtractTeam = (teamData) => {
    setExtractedTeam(teamData);
    navigate('teams');
  };

  const handleLogout = () => {
    clearToken();
    setTwitchUser(null);
    setIsAuthenticated(false);
    setSessionExpired(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="bg-mesh"></div>
        <div className="noise"></div>
        <Login
          onSuccess={() => {
            setIsAuthenticated(true);
            setSessionExpired(false);
            setTwitchUser(getTwitchUser());
          }}
          expired={sessionExpired}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-mesh"></div>
      <div className="noise"></div>

      <div className="app-container">
        {/* Barra superior móvil */}
        <div className="mobile-bar">
          <div className="brand compact">
            <img src="/copa-logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <h1 className="title-font">PRIMATE</h1>
          </div>
          <button className="btn-icon" onClick={() => setMenuOpen(o => !o)} aria-label="Menú">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

        {/* Sidebar */}
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="brand">
            <img
              src="/copa-logo.png"
              alt="Logo"
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 10px rgba(192,132,252,0.6))',
                flexShrink: 0
              }}
            />
            <div className="brand-text">
              <h1 className="title-font">PRIMATE</h1>
              <span>Dashboard de Moderación</span>
            </div>
          </div>

          {twitchUser && (
            <div className="twitch-user-badge">
              {twitchUser.avatar ? (
                <img src={twitchUser.avatar} alt={twitchUser.displayName} className="twitch-user-avatar" />
              ) : (
                <div className="twitch-user-avatar-placeholder">
                  {(twitchUser.displayName || 'M').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="twitch-user-meta">
                <span className="twitch-user-name">@{twitchUser.displayName || twitchUser.login}</span>
                <span className="twitch-user-tag">Moderador</span>
              </div>
            </div>
          )}

          <span className="nav-section">Navegación</span>
          <nav className="nav-menu">
            {NAV.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => navigate(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {item.badge === 'tickets' && botStatus.tickets > 0 && (
                    <span className="nav-badge">{botStatus.tickets}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className={`bot-status-card ${botStatus.online ? 'on' : 'off'}`}>
              <span className="live-dot" />
              <div>
                <strong>{botStatus.online ? 'Bot operativo' : 'Bot desconectado'}</strong>
                <small>{botStatus.online ? `${botStatus.ping ?? '—'} ms de latencia` : 'Inicia node bot.js'}</small>
              </div>
            </div>

            <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div key={activeTab} className="page-transition">
            {activeTab === 'overview' && <Overview onNavigate={navigate} />}
            {activeTab === 'web-manager' && <WebManager />}
            {activeTab === 'scoreboard' && <Scoreboard />}
            {activeTab === 'map-roulette' && <MapRoulette />}
            {activeTab === 'randomizer' && <EquipmentRandomizer />}
            {activeTab === 'draw' && <CopaGruposLiga />}
            {activeTab === 'overlays' && <Overlays />}
            {activeTab === 'tickets' && <Tickets onExtract={handleExtractTeam} />}
            {activeTab === 'rules' && <RulesGuide />}
            {activeTab === 'announcements' && <Announcements />}
            {activeTab === 'teams' && <Teams initialTeam={extractedTeam} />}
          </div>
        </main>
      </div>
    </>
  );
}

export default function App() {
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/overlay')) {
    if (currentPath.includes('roulette')) return <OverlayRoulette />;
    if (currentPath.includes('matchup')) return <OverlayMatchup />;
    if (currentPath.includes('ticker')) return <OverlayTicker />;
    if (currentPath.includes('scoreboard')) return <OverlayScoreboard />;
    return <OverlayLive />;
  }

  return <DashboardMain />;
}

