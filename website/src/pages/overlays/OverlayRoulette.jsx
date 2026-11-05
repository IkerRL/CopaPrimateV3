import { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../../api';
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

export default function OverlayRoulette() {
  const [mapPool] = useState(INITIAL_MAP_POOL);
  const [viewState, setViewState] = useState('lobby'); // 'lobby' | 'roulette' | 'reward'
  const [winnerMap, setWinnerMap] = useState(null);
  const [rouletteItems, setRouletteItems] = useState([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const audioCtxRef = useRef(null);
  const winBufferRef = useRef(null);
  const winSoundRef = useRef(null);
  const rouletteRef = useRef(null);
  const itemsContainerRef = useRef(null);
  const isSpinningRef = useRef(false);
  const lastCenteredIndexRef = useRef(-1);
  const lastTickTimeRef = useRef(0);
  const lastSpinId = useRef(0);

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

  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            if (ctx.state === 'running') {
              setAudioUnlocked(true);
              loadWinAudioBuffer(ctx);
            }
          }).catch(() => {});
        } else if (ctx.state === 'running') {
          setAudioUnlocked(true);
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
    try {
      const ctx = getAudioContext();
      // NO encolar osciladores si el contexto está suspendido (evita explosión de sonido bugeado)
      if (!ctx || ctx.state !== 'running') return;

      const now = ctx.currentTime;
      // Prevenir saturación acústica y chasquidos (mínimo 26ms entre ticks)
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

    // Fallback con el elemento HTML5 Audio
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

  const ejecutarSpin = (chosenIdx, reps, winnerObj, activeList) => {
    unlockAudio();

    const currentPool = (activeList && activeList.length > 0)
      ? INITIAL_MAP_POOL.filter(m => activeList.includes(m.name))
      : INITIAL_MAP_POOL;

    const totalActive = currentPool.length || 1;
    const finalChosenIdx = (typeof chosenIdx === 'number' && chosenIdx >= 0 && chosenIdx < totalActive)
      ? chosenIdx
      : 0;

    const chosen = winnerObj || currentPool[finalChosenIdx] || INITIAL_MAP_POOL[0];
    const finalReps = reps || Math.ceil(150 / totalActive);

    setWinnerMap(chosen);
    setViewState('roulette');

    const items = [];
    for (let r = 0; r < finalReps; r++) {
      currentPool.forEach((map) => {
        items.push(map);
      });
    }
    setRouletteItems(items);

    // Esperar al siguiente repintado del navegador para asegurar medidas y reflow exacto
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!itemsContainerRef.current || !rouletteRef.current) return;

        const viewportWidth = rouletteRef.current.offsetWidth || 950;
        const centerOffset = viewportWidth / 2;
        const targetRepetition = finalReps - 2;
        const absoluteWinningIdx = (targetRepetition * totalActive) + finalChosenIdx;
        const landingPos = (absoluteWinningIdx * ITEM_WIDTH) - centerOffset + (ITEM_WIDTH / 2);

        // Resetear posición y forzar reflow obligatorio
        itemsContainerRef.current.style.transition = 'none';
        itemsContainerRef.current.style.transform = 'translateX(0)';
        void itemsContainerRef.current.offsetWidth;

        // Iniciar animación y seguimiento de ticks
        isSpinningRef.current = true;
        lastCenteredIndexRef.current = -1;
        requestAnimationFrame(checkTick);

        itemsContainerRef.current.style.transition = 'transform 6s cubic-bezier(0.1, 0, 0.1, 1)';
        itemsContainerRef.current.style.transform = `translateX(-${landingPos}px)`;

        // Detectar el fin exacto de la animación
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

  useEffect(() => {
    document.body.style.background = 'transparent';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.background = 'transparent';

    const handleInteraction = () => {
      unlockAudio();
    };

    // Intentar inicialización inmediata (en OBS CEF suele correr directamente)
    unlockAudio();

    window.addEventListener('click', handleInteraction);
    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    let mounted = true;
    const checkSpin = async () => {
      try {
        const res = await fetch(`${API_BASE}/overlay-state`);
        if (res.ok) {
          const data = await res.json();
          const rData = data?.roulette || {};
          const spinId = Number(rData.spinId) || 0;

          if (lastSpinId.current === 0) {
            lastSpinId.current = spinId;
            if (spinId > 0 && Date.now() - spinId < 9000 && !isSpinningRef.current) {
              const targetWinner = rData.winnerMap || INITIAL_MAP_POOL.find(m => m.name.toLowerCase() === (rData.targetMap || '').toLowerCase());
              ejecutarSpin(rData.chosenIdx, rData.reps, targetWinner, rData.activeMaps);
            } else if (rData.state === 'reward' && rData.winnerMap) {
              setWinnerMap(rData.winnerMap);
              setViewState('reward');
            }
          } else if (spinId > lastSpinId.current) {
            lastSpinId.current = spinId;
            if (rData.state === 'lobby') {
              setViewState('lobby');
              if (itemsContainerRef.current) {
                itemsContainerRef.current.style.transition = 'none';
                itemsContainerRef.current.style.transform = 'translateX(0)';
              }
            } else if (!isSpinningRef.current) {
              const targetWinner = rData.winnerMap || INITIAL_MAP_POOL.find(m => m.name.toLowerCase() === (rData.targetMap || '').toLowerCase());
              ejecutarSpin(rData.chosenIdx, rData.reps, targetWinner, rData.activeMaps);
            }
          }
        }
      } catch (e) {}
    };

    checkSpin();
    const interval = setInterval(checkSpin, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, []);

  return (
    <div className="val-roulette-root overlay-mode" onClick={unlockAudio}>
      <audio ref={winSoundRef} src="/partida.mp3" preload="auto" />

      {/* Indicador sutil si el navegador bloqueó el audio */}
      {!audioUnlocked && (
        <button
          type="button"
          onClick={unlockAudio}
          style={{
            position: 'absolute',
            bottom: '15px',
            right: '15px',
            background: 'rgba(255, 179, 0, 0.2)',
            border: '1px solid #ffb300',
            color: '#ffb300',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          }}
        >
          🔊 Clic para activar sonido en directo
        </button>
      )}

      {/* 1. LOBBY (Siempre en DOM para preservar medidas) */}
      <div
        id="lobby"
        style={{
          display: viewState === 'lobby' ? 'flex' : 'none',
          pointerEvents: 'none',
        }}
      >
        <div className="lobby-content" style={{ marginTop: '30px' }}>
          <div className="map-pool-section">
            <h3 className="section-title">POOL DE MAPAS</h3>
            <div id="map-pool" className="map-pool-grid">
              {mapPool.map((map) => (
                <div
                  key={map.name}
                  className={`map-card ${map.active ? 'active' : ''}`}
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
        </div>
      </div>

      {/* 2. RULETA (Siempre en DOM para referencias estables) */}
      <div
        id="roulette-container"
        className="csgo-overlay"
        ref={rouletteRef}
        style={{
          display: viewState === 'roulette' ? 'block' : 'none',
        }}
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

      {/* 3. REWARD SCREEN (Siempre en DOM, controlado por display) */}
      <div
        id="reward-display"
        className="reward-overlay"
        style={{
          display: viewState === 'reward' && winnerMap ? 'flex' : 'none',
        }}
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
          </div>
        )}
      </div>
    </div>
  );
}
