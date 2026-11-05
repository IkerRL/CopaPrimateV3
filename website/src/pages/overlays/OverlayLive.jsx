import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';
import OverlayScoreboard from './OverlayScoreboard';
import OverlayRoulette from './OverlayRoulette';
import OverlayMatchup from './OverlayMatchup';
import OverlayTicker from './OverlayTicker';

export default function OverlayLive() {
  const [mode, setMode] = useState('scoreboard');

  useEffect(() => {
    document.body.style.background = 'transparent';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.background = 'transparent';

    let mounted = true;
    const fetchMode = async () => {
      try {
        const res = await fetch(`${API_BASE}/overlay-state`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.mode && data.mode !== mode) {
            setMode(data.mode);
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
  }, [mode]);

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
        @keyframes overlayFadeIn {
          from { opacity: 0; transform: scale(0.97); filter: blur(3px); }
          to { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
      `}</style>

      {mode !== 'hidden' && (
        <div key={mode} style={{ width: '100%', height: '100%', animation: 'overlayFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {renderContent(mode)}
        </div>
      )}
    </div>
  );
}
