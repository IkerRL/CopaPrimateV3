import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../api';
import './ruleta.css';

const INITIAL_MAP_POOL = [
  {
    name: 'Ascent',
    location: 'Venecia, Italia',
    url: 'https://static.wikia.nocookie.net/valorant/images/e/e7/Loading_Screen_Ascent.png',
    active: true
  },
  {
    name: 'Bind',
    location: 'Rabat, Marruecos',
    url: 'https://static.wikia.nocookie.net/valorant/images/2/23/Loading_Screen_Bind.png',
    active: true
  },
  {
    name: 'Breeze',
    location: 'Triángulo de las Bermudas, Océano Atlántico',
    url: 'https://static.wikia.nocookie.net/valorant/images/1/10/Loading_Screen_Breeze.png',
    active: true
  },
  {
    name: 'Fracture',
    location: 'Santa Fe, Nuevo México, EE. UU.',
    url: 'https://static.wikia.nocookie.net/valorant/images/f/fc/Loading_Screen_Fracture.png',
    active: true
  },
  {
    name: 'Haven',
    location: 'Timbu, Bután',
    url: 'https://static.wikia.nocookie.net/valorant/images/7/70/Loading_Screen_Haven.png',
    active: true
  },
  {
    name: 'Icebox',
    location: 'Isla Bennett, Rusia',
    url: 'https://static.wikia.nocookie.net/valorant/images/1/13/Loading_Screen_Icebox.png',
    active: true
  },
  {
    name: 'Lotus',
    location: 'Ghats occidentales, India',
    url: 'https://static.wikia.nocookie.net/valorant/images/d/d0/Loading_Screen_Lotus.png',
    active: true
  },
  {
    name: 'Pearl',
    location: 'Lisboa, Portugal',
    url: 'https://static.wikia.nocookie.net/valorant/images/a/af/Loading_Screen_Pearl.png',
    active: true
  },
  {
    name: 'Split',
    location: 'Tokio, Japón',
    url: 'https://static.wikia.nocookie.net/valorant/images/d/d6/Loading_Screen_Split.png',
    active: true
  },
  {
    name: 'Sunset',
    location: 'Los Ángeles, California, EE. UU.',
    url: 'https://static.wikia.nocookie.net/valorant/images/5/5c/Loading_Screen_Sunset.png',
    active: true
  },
  {
    name: 'Abyss',
    location: 'Jan Mayen, Noruega',
    url: 'https://static.wikia.nocookie.net/valorant/images/6/61/Loading_Screen_Abyss.png',
    active: true
  },
  {
    name: 'District',
    location: 'Sarajevo, Bosnia y Herzegovina',
    url: 'https://static.wikia.nocookie.net/valorant/images/6/6f/Loading_Screen_Corrode.png',
    active: true
  },
  {
    name: 'Summit',
    location: 'Montañas de China, China',
    url: 'https://wiki.playvalorant.com/en-us/images/thumb/Loading_Screen_Summit.png/550px-Loading_Screen_Summit.png?33fee',
    active: true
  }
];

const ITEM_WIDTH = 180;

export default function MapRoulette() {
  const [mapPool, setMapPool] = useState(INITIAL_MAP_POOL);
  const [viewState, setViewState] = useState('lobby'); // 'lobby' | 'roulette' | 'reward'
  const [winnerMap, setWinnerMap] = useState(null);
  const [rouletteItems, setRouletteItems] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  const audioCtxRef = useRef(null);
  const winBufferRef = useRef(null);
  const winSoundRef = useRef(null);
  const rouletteRef = useRef(null);
  const itemsContainerRef = useRef(null);
  const isSpinningRef = useRef(false);
  const lastCenteredIndexRef = useRef(-1);
  const lastTickTimeRef = useRef(0);

  const activeMaps = mapPool.filter((m) => m.active);

  // Inicialización y pre-decodificación del audio en Web Audio API (RAM)
  const getAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      return audioCtxRef.current;
    } catch (e) {
      return null;
    }
  };

  const loadWinAudioBuffer = async (ctx) => {
    if (winBufferRef.current || !ctx) return;
    try {
      const res = await fetch('/partida.mp3');
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        ctx.decodeAudioData(arrayBuf, (decoded) => {
          winBufferRef.current = decoded;
        }, () => {});
      }
    } catch (e) {}
  };

  const initAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            if (ctx.state === 'running') {
              loadWinAudioBuffer(ctx);
            }
          }).catch(() => {});
        } else if (ctx.state === 'running') {
          loadWinAudioBuffer(ctx);
        }
      }
      if (winSoundRef.current) {
        winSoundRef.current.load();
        winSoundRef.current.volume = 1.0;
      }
    } catch (e) {}
  };

  const playTickSound = () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx || ctx.state !== 'running') return;

      const now = ctx.currentTime;
      if (now - lastTickTimeRef.current < 0.026) return;
      lastTickTimeRef.current = now;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const startTime = now + 0.002;
      const duration = 0.035;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700, startTime);
      osc.frequency.exponentialRampToValueAtTime(150, startTime + duration);

      gainNode.gain.setValueAtTime(0.12, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);

      setTimeout(() => {
        try {
          osc.disconnect();
          gainNode.disconnect();
        } catch (e) {}
      }, 50);
    } catch (e) {}
  };

  const playWinSound = () => {
    if (isMuted) return;
    let played = false;
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'running' && winBufferRef.current) {
        const source = ctx.createBufferSource();
        source.buffer = winBufferRef.current;
        const gain = ctx.createGain();
        gain.gain.value = 1.0;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        played = true;
      }
    } catch (e) {}

    if (!played) {
      try {
        if (winSoundRef.current) {
          winSoundRef.current.currentTime = 0;
          winSoundRef.current.volume = 1.0;
          winSoundRef.current.play().catch(() => {});
        } else {
          const direct = new Audio('/partida.mp3');
          direct.volume = 1.0;
          direct.play().catch(() => {});
        }
      } catch (e) {}
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Sincronizar cambios de selección en tiempo real con el overlay
  const broadcastPoolChange = (updatedPool) => {
    const activeNames = updatedPool.filter((m) => m.active).map((m) => m.name);
    apiFetch('/overlay-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'roulette',
        roulette: {
          state: 'lobby',
          activeMaps: activeNames,
          spinId: 0,
        },
      }),
    }).catch(() => {});
  };

  // Controles de selección de mapas
  const selectAll = () => {
    if (isSpinningRef.current) return;
    const next = mapPool.map((m) => ({ ...m, active: true }));
    setMapPool(next);
    broadcastPoolChange(next);
  };

  const deselectAll = () => {
    if (isSpinningRef.current) return;
    const next = mapPool.map((m) => ({ ...m, active: false }));
    setMapPool(next);
    broadcastPoolChange(next);
  };

  const selectRotation = () => {
    if (isSpinningRef.current) return;
    const rotacionActual = ['Ascent', 'Breeze', 'Haven', 'Lotus', 'Summit', 'Sunset', 'Split'];
    const next = mapPool.map((m) => ({ ...m, active: rotacionActual.includes(m.name) }));
    setMapPool(next);
    broadcastPoolChange(next);
  };

  const toggleMap = (name) => {
    if (isSpinningRef.current) return;
    const next = mapPool.map((m) => (m.name === name ? { ...m, active: !m.active } : m));
    setMapPool(next);
    broadcastPoolChange(next);
  };

  // Tick checker con requestAnimationFrame (idéntico a script.js)
  const checkTick = () => {
    if (!isSpinningRef.current || !itemsContainerRef.current || !rouletteRef.current) return;

    try {
      const style = window.getComputedStyle(itemsContainerRef.current);
      const matrix = new DOMMatrixReadOnly(style.transform);
      const currentX = matrix.m41;

      const viewportWidth = rouletteRef.current.offsetWidth || 950;
      const centerOffset = viewportWidth / 2;
      const relativeCenter = centerOffset - currentX;
      const currentCenteredIndex = Math.floor(relativeCenter / ITEM_WIDTH);

      if (currentCenteredIndex !== lastCenteredIndexRef.current && currentCenteredIndex >= 0) {
        lastCenteredIndexRef.current = currentCenteredIndex;
        playTickSound();
      }
    } catch (e) {}

    if (isSpinningRef.current) {
      requestAnimationFrame(checkTick);
    }
  };

  // INICIO DEL GIRO ORIGINAL
  const handleStartSpin = () => {
    if (isSpinningRef.current || activeMaps.length < 2) return;

    initAudio();

    const totalActive = activeMaps.length;
    const chosenIdx = Math.floor(Math.random() * totalActive);
    const targetItemsCount = 150;
    const reps = Math.ceil(targetItemsCount / totalActive);
    const chosen = activeMaps[chosenIdx];

    // Sincronizar giro con el overlay de OBS
    const spinId = Date.now();
    apiFetch('/overlay-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'roulette',
        roulette: {
          state: 'spinning',
          spinId,
          chosenIdx,
          reps,
          targetMap: chosen.name,
          winnerMap: chosen,
          activeMaps: activeMaps.map(m => m.name),
        }
      })
    }).catch(() => {});

    // Auto-sincronizar el mapa ganado con el marcador oficial
    apiFetch('/live-match')
      .then(r => r.json())
      .then(data => {
        if (data && data.match) {
          apiFetch('/live-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              match: {
                ...data.match,
                map: chosen.name
              }
            })
          }).catch(() => {});
        }
      })
      .catch(() => {});

    aplicarSpin(chosenIdx, reps, chosen);
  };

  const aplicarSpin = (chosenIdx, reps, chosen) => {
    const totalActive = activeMaps.length;
    setWinnerMap(chosen);
    setViewState('roulette');

    // Construir lista de items repetidos
    const items = [];
    for (let r = 0; r < reps; r++) {
      activeMaps.forEach((map) => {
        items.push(map);
      });
    }
    setRouletteItems(items);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!itemsContainerRef.current || !rouletteRef.current) return;

        const viewportWidth = rouletteRef.current.offsetWidth || 950;
        const centerOffset = viewportWidth / 2;
        const targetRepetition = reps - 2;
        const absoluteWinningIdx = (targetRepetition * totalActive) + chosenIdx;
        const landingPos = (absoluteWinningIdx * ITEM_WIDTH) - centerOffset + (ITEM_WIDTH / 2);

        // Resetear y forzar reflow
        itemsContainerRef.current.style.transition = 'none';
        itemsContainerRef.current.style.transform = 'translateX(0)';
        void itemsContainerRef.current.offsetWidth;

        isSpinningRef.current = true;
        lastCenteredIndexRef.current = -1;
        requestAnimationFrame(checkTick);

        itemsContainerRef.current.style.transition = 'transform 6s cubic-bezier(0.1, 0, 0.1, 1)';
        itemsContainerRef.current.style.transform = `translateX(-${landingPos}px)`;

        const onTransitionEnd = () => {
          if (itemsContainerRef.current) {
            itemsContainerRef.current.removeEventListener('transitionend', onTransitionEnd);
          }
          isSpinningRef.current = false;

          setTimeout(() => {
            setViewState('reward');
            playWinSound();
          }, 600);
        };

        itemsContainerRef.current.addEventListener('transitionend', onTransitionEnd, { once: true });
      });
    });
  };

  const resetGame = () => {
    setViewState('lobby');
    if (itemsContainerRef.current) {
      itemsContainerRef.current.style.transition = 'none';
      itemsContainerRef.current.style.transform = 'translateX(0)';
    }

    // Notificar al overlay que regrese al lobby
    apiFetch('/overlay-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'roulette',
        roulette: {
          state: 'lobby',
          spinId: Date.now()
        }
      })
    }).catch(() => {});
  };

  return (
    <div className="val-roulette-root">
      <audio ref={winSoundRef} src="/partida.mp3" preload="auto" />

      {/* Controles superiores */}
      <div className="top-bar">
        <div className="brand">COPA PRIMATE // SELECTOR DE MAPA</div>
        <button
          type="button"
          onClick={toggleMute}
          className="mute-btn"
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            {isMuted ? (
              <path fill="currentColor" d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.48,12.43 16.5,12.22 16.5,12Z" />
            ) : (
              <path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
            )}
          </svg>
        </button>
      </div>

      {/* Lobby principal */}
      <div id="lobby" style={{ display: viewState === 'lobby' ? 'flex' : 'none' }}>
        <div className="lobby-content" style={{ marginTop: '20px' }}>
          <div className="map-pool-section">
            <h3 className="section-title">POOL DE MAPAS</h3>
            <div className="map-pool-controls">
              <button type="button" className="btn-text-only" onClick={selectAll}>SELECCIONAR TODOS</button>
              <span className="divider">/</span>
              <button type="button" className="btn-text-only" onClick={selectRotation}>ROTACIÓN ACTUAL</button>
              <span className="divider">/</span>
              <button type="button" className="btn-text-only" onClick={deselectAll}>DESACTIVAR TODOS</button>
            </div>
            <div id="map-pool" className="map-pool-grid">
              {mapPool.map((map) => (
                <div
                  key={map.name}
                  className={`map-card ${map.active ? 'active' : ''}`}
                  onClick={() => toggleMap(map.name)}
                >
                  <img className="map-card-img" src={map.url} alt={map.name} />
                  <div className="map-card-overlay">
                    <span className="map-card-name">{map.name}</span>
                  </div>
                  <div className="map-card-checkbox" />
                </div>
              ))}
            </div>
          </div>

          <div className="action-section">
            <button
              type="button"
              id="playBtn"
              className="v-btn-play glow-effect"
              disabled={activeMaps.length < 2}
              onClick={handleStartSpin}
            >
              START
            </button>
            <p className="lobby-status-text">
              {activeMaps.length < 2 ? 'ACTIVA AL MENOS 2 MAPAS PARA EL SORTEO' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor de la ruleta original */}
      <div
        id="roulette-container"
        className="csgo-overlay"
        ref={rouletteRef}
        style={{ display: viewState === 'roulette' ? 'block' : 'none' }}
      >
        <h2 className="roulette-header-title">SELECCIONANDO MAPA DE JUEGO</h2>
        <div className="roulette-viewport">
          <div className="selector" />
          <div
            className="items-wrap"
            ref={itemsContainerRef}
          >
            {rouletteItems.map((map, idx) => (
              <div key={`${map.name}-${idx}`} className="item">
                <img className="item-img" src={map.url} alt={map.name} />
                <div className="item-overlay">
                  <span className="item-name-overlay">{map.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="status-text">BUSCANDO PARTIDA...</p>
      </div>

      {/* Pantalla de ganador original (Reward Display) */}
      <div
        id="reward-display"
        className="reward-overlay"
        style={{ display: viewState === 'reward' && winnerMap ? 'flex' : 'none' }}
      >
        {winnerMap && (
          <div className="reward-content">
            <div className="reward-badge">PARTIDA ENCONTRADA</div>
            <h2 className="reward-title">{winnerMap.name}</h2>
            <p className="reward-subtitle">{winnerMap.location}</p>

            <div className="reward-image-container">
              <img id="winner-img" src={winnerMap.url} alt={winnerMap.name} />
              <div className="image-glow" />
              <div className="image-corner top-left" />
              <div className="image-corner top-right" />
              <div className="image-corner bottom-left" />
              <div className="image-corner bottom-right" />
            </div>

            <button
              type="button"
              onClick={resetGame}
              className="v-btn-play btn-small glow-effect"
            >
              VOLVER AL LOBBY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
