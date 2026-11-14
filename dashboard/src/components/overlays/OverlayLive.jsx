import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../api';
import OverlayScoreboard from './OverlayScoreboard';
import OverlayRoulette from './OverlayRoulette';
import OverlayMatchup from './OverlayMatchup';
import OverlayTicker from './OverlayTicker';
import OverlayGruposSorteo from './OverlayGruposSorteo';

export default function OverlayLive() {
  const [serverMode, setServerMode] = useState('scoreboard');
  const [displayMode, setDisplayMode] = useState('scoreboard');
  const [isExiting, setIsExiting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    document.body.style.background = 'transparent';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.background = 'transparent';

    let mounted = true;
    const fetchMode = async () => {
      try {
        const res = await fetch(`${API_URL}/public/overlay-state`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.mode && data.mode !== serverMode) {
            setServerMode(data.mode);
          }
        }
      } catch (err) {}
    };

    fetchMode();
    const interval = setInterval(fetchMode, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, [serverMode]);

  // Transición suave direccional de entrada y salida entre escenas
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setDisplayMode(serverMode);
      return;
    }

    if (serverMode !== displayMode) {
      setIsExiting(true);
      setIsSwitching(true);

      const switchTimer = setTimeout(() => {
        setDisplayMode(serverMode);
        setIsExiting(false);
      }, 360);

      const flareTimer = setTimeout(() => {
        setIsSwitching(false);
      }, 620);

      return () => {
        clearTimeout(switchTimer);
        clearTimeout(flareTimer);
      };
    }
  }, [serverMode, displayMode]);

  const getExitTransform = (m) => {
    if (m === 'scoreboard') return 'translateY(-90px) scale(0.98)';
    if (m === 'ticker') return 'translateY(90px)';
    return 'scale(0.92) translateY(-18px)';
  };

  const getEnterAnimation = (m) => {
    if (m === 'scoreboard') return 'scoreboardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    if (m === 'ticker') return 'tickerEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    return 'modalEnter 0.46s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  };

  const renderContent = (currentMode) => {
    switch (currentMode) {
      case 'hidden':
        return null;
      case 'roulette':
        return <OverlayRoulette />;
      case 'matchup':
        return <OverlayMatchup />;
      case 'ticker':
        return <OverlayTicker />;
      case 'sorteo':
      case 'grupos':
        return <OverlayGruposSorteo />;
      case 'scoreboard':
      default:
        return <OverlayScoreboard />;
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <style>{`
        @keyframes scoreboardEnter {
          0% {
            opacity: 0;
            transform: translateY(-80px) scale(0.98);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes tickerEnter {
          0% {
            opacity: 0;
            transform: translateY(80px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes modalEnter {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(18px);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }

        @keyframes overlaySweepFlare {
          0% {
            transform: translateX(-120%) skewX(-25deg);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            transform: translateX(250%) skewX(-25deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Ráfaga luminosa estilo broadcast al cambiar de escena */}
      {isSwitching && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 99999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '40vw',
              background: 'linear-gradient(90deg, transparent 0%, rgba(192, 132, 252, 0.2) 25%, rgba(255, 255, 255, 0.6) 50%, rgba(0, 245, 212, 0.25) 75%, transparent 100%)',
              boxShadow: '0 0 50px rgba(192, 132, 252, 0.6), 0 0 20px rgba(0, 245, 212, 0.8)',
              animation: 'overlaySweepFlare 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            }}
          />
        </div>
      )}

      {/* Contenedor animado con entrada y salida direccional */}
      {displayMode !== 'hidden' && (
        <div
          key={displayMode}
          style={{
            width: '100%',
            height: '100%',
            opacity: isExiting ? 0 : 1,
            transform: isExiting ? getExitTransform(displayMode) : 'translateY(0) scale(1)',
            filter: isExiting ? 'blur(5px)' : 'blur(0px)',
            transition: 'opacity 0.36s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.36s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.36s ease',
            animation: !isExiting ? getEnterAnimation(displayMode) : 'none',
            willChange: 'opacity, transform, filter',
          }}
        >
          {renderContent(displayMode)}
        </div>
      )}
    </div>
  );
}
