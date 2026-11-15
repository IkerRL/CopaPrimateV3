import { useState, useEffect } from 'react';
import { 
  Tv, Radio, Copy, Check, ExternalLink, Monitor, 
  Layers, Sliders, RefreshCw, Sparkles, CheckCircle, Compass, EyeOff, Play 
} from 'lucide-react';
import { apiFetch } from '../api';

const MAP_NAMES = ['Ascent', 'Bind', 'Haven', 'Split', 'Sunset', 'Lotus', 'Abyss', 'Icebox', 'Breeze', 'Fracture', 'Pearl'];

const MAP_POOL_DATA = {
  Ascent: { location: 'Venecia, Italia', url: 'https://static.wikia.nocookie.net/valorant/images/e/e7/Loading_Screen_Ascent.png' },
  Bind: { location: 'Rabat, Marruecos', url: 'https://static.wikia.nocookie.net/valorant/images/2/23/Loading_Screen_Bind.png' },
  Breeze: { location: 'Triángulo de las Bermudas, Océano Atlántico', url: 'https://static.wikia.nocookie.net/valorant/images/1/10/Loading_Screen_Breeze.png' },
  Fracture: { location: 'Santa Fe, Nuevo México, EE. UU.', url: 'https://static.wikia.nocookie.net/valorant/images/f/fc/Loading_Screen_Fracture.png' },
  Haven: { location: 'Timbu, Bután', url: 'https://static.wikia.nocookie.net/valorant/images/7/70/Loading_Screen_Haven.png' },
  Icebox: { location: 'Isla Bennett, Rusia', url: 'https://static.wikia.nocookie.net/valorant/images/1/13/Loading_Screen_Icebox.png' },
  Lotus: { location: 'Ghats occidentales, India', url: 'https://static.wikia.nocookie.net/valorant/images/d/d0/Loading_Screen_Lotus.png' },
  Pearl: { location: 'Lisboa, Portugal', url: 'https://static.wikia.nocookie.net/valorant/images/a/af/Loading_Screen_Pearl.png' },
  Split: { location: 'Tokio, Japón', url: 'https://static.wikia.nocookie.net/valorant/images/d/d6/Loading_Screen_Split.png' },
  Sunset: { location: 'Los Ángeles, California, EE. UU.', url: 'https://static.wikia.nocookie.net/valorant/images/5/5c/Loading_Screen_Sunset.png' },
  Abyss: { location: 'Tierras Altas de Noruega', url: 'https://static.wikia.nocookie.net/valorant/images/6/61/Loading_Screen_Abyss.png' }
};

export default function Overlays() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [overlayStyle, setOverlayStyle] = useState('scoreboard'); // scoreboard | matchup | ticker
  const [customScore1, setCustomScore1] = useState(11);
  const [customScore2, setCustomScore2] = useState(9);
  const [customRound, setCustomRound] = useState(21);
  const [activeOverlayMode, setActiveOverlayMode] = useState('scoreboard');
  const [isSpinningLive, setIsSpinningLive] = useState(false);
  const [showMatchupConfigModal, setShowMatchupConfigModal] = useState(false);
  const [showSorteoPhaseModal, setShowSorteoPhaseModal] = useState(false);
  const [selectedSorteoPhase, setSelectedSorteoPhase] = useState('presentacion');
  const [matchupModalConfig, setMatchupModalConfig] = useState({
    map: '',
    moment: 'previa',
    format: 'BO3',
    m1: 0,
    m2: 0,
  });

  useEffect(() => {
    fetchMatches();
    fetchOverlayState();
  }, []);

  const fetchOverlayState = async () => {
    try {
      const res = await apiFetch('/overlay-state');
      if (res.ok) {
        const data = await res.json();
        if (data.mode) setActiveOverlayMode(data.mode);
      }
    } catch (e) {}
  };

  const handleSetOverlayMode = async (mode) => {
    if (mode === 'matchup') {
      const currentMap = currentMatch?.map || '';
      const isKnown = currentMap && !['TBD', 'POR DECIDIR', 'SIN MAPA', 'NINGUNO'].includes(currentMap.trim().toUpperCase());
      setMatchupModalConfig({
        map: isKnown ? currentMap : '',
        moment: 'previa',
        format: 'BO3',
        m1: 0,
        m2: 0,
      });
      setShowMatchupConfigModal(true);
      return;
    }
    if (mode === 'sorteo') {
      setShowSorteoPhaseModal(true);
      return;
    }
    setActiveOverlayMode(mode);
    try {
      await apiFetch('/overlay-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmSorteoPhase = async (phase) => {
    const chosenPhase = phase || selectedSorteoPhase;
    setSelectedSorteoPhase(chosenPhase);
    setActiveOverlayMode('sorteo');
    try {
      const prevRes = await apiFetch('/overlay-state');
      const prevData = prevRes.ok ? await prevRes.json() : {};
      await apiFetch('/overlay-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'sorteo',
          sorteo: {
            ...(prevData.sorteo || {}),
            activePhase: chosenPhase,
          }
        })
      });
      setShowSorteoPhaseModal(false);
    } catch (e) {
      console.error('Error al actualizar fase de sorteo:', e);
    }
  };

  const handleConfirmMatchupBroadcast = async () => {
    const isMapValid = Boolean(matchupModalConfig.map && matchupModalConfig.map.trim() !== '' && matchupModalConfig.map !== 'SIN MAPA');
    const isPost = matchupModalConfig.moment === 'post';

    try {
      await apiFetch('/live-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: true,
          status: isPost ? 'FINALIZADO' : 'LIVE',
          phase: 'FASE DE GRUPOS',
          team1: { name: currentMatch.t1?.name || 'Los Monos', logo: currentMatch.t1?.logo || '/logo1.png', mapsWon: isPost ? matchupModalConfig.m1 : 0 },
          team2: { name: currentMatch.t2?.name || 'Gorilas', logo: currentMatch.t2?.logo || '/logo2.png', mapsWon: isPost ? matchupModalConfig.m2 : 0 },
          map: isMapValid ? matchupModalConfig.map : '',
          showMap: isMapValid,
          format: matchupModalConfig.format,
          matchMoment: matchupModalConfig.moment,
          showScore: isPost,
        })
      });
      await apiFetch('/overlay-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'matchup' })
      });
      setActiveOverlayMode('matchup');
      setShowMatchupConfigModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerRouletteSpin = async () => {
    setIsSpinningLive(true);
    setActiveOverlayMode('roulette');
    const idx = Math.floor(Math.random() * MAP_NAMES.length);
    const randomMapName = MAP_NAMES[idx];
    const mapInfo = MAP_POOL_DATA[randomMapName] || { location: 'Mapa Táctico', url: 'https://static.wikia.nocookie.net/valorant/images/e/e7/Loading_Screen_Ascent.png' };
    try {
      await apiFetch('/overlay-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'roulette',
          roulette: {
            state: 'spinning',
            spinId: Date.now(),
            chosenIdx: idx,
            reps: 12,
            targetMap: randomMapName,
            winnerMap: { name: randomMapName, location: mapInfo.location, url: mapInfo.url }
          }
        })
      });
      setTimeout(() => setIsSpinningLive(false), 6600);
    } catch (e) {
      setIsSpinningLive(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await apiFetch('/matches');
      const data = await res.json();
      if (Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches);
        setSelectedMatchId(data.matches[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentMatch = matches.find((m) => m.id === selectedMatchId) || matches[0] || {
    id: 1,
    t1: { name: 'Los Monos', logo: '/logo1.png' },
    t2: { name: 'Gorilas', logo: '/logo2.png' },
    map: 'Ascent',
    date: 'Jornada 1',
    format: 'BO1 (Swiftplay)'
  };

  const copyUrl = (type, path) => {
    const baseOrigin = window.location.port === '5174' ? window.location.origin.replace(':5174', ':5173') : window.location.origin;
    const fullUrl = `${baseOrigin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Modal interactivo de configuración de Pantalla Versus */}
      {showMatchupConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(8, 8, 11, 0.88)',
            backdropFilter: 'blur(10px)',
            padding: '20px',
            animation: 'modalBackdropFade 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMatchupConfigModal(false);
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0c101a',
              borderRadius: '16px',
              border: '1.5px solid #c084fc',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(192, 132, 252, 0.3)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#c084fc', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚔️ CONFIGURACIÓN PANTALLA VERSUS
              </h3>
              <button
                type="button"
                onClick={() => setShowMatchupConfigModal(false)}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
              Configura la información que se mostrará en el stream antes de cambiar a la escena Versus:
            </p>

            {/* 1. MAPA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00f5d4', letterSpacing: '1px' }}>
                1. ¿QUÉ MAPA SE JUEGA?
              </label>
              <select
                value={matchupModalConfig.map}
                onChange={(e) => setMatchupModalConfig({ ...matchupModalConfig, map: e.target.value })}
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: '1px solid rgba(0, 245, 212, 0.4)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                }}
              >
                <option value="">🙈 Sin mapa / Por decidir (Ocultar contenedor de mapa)</option>
                <option value="Ascent">Ascent</option>
                <option value="Bind">Bind</option>
                <option value="Haven">Haven</option>
                <option value="Split">Split</option>
                <option value="Icebox">Icebox</option>
                <option value="Breeze">Breeze</option>
                <option value="Sunset">Sunset</option>
                <option value="Lotus">Lotus</option>
                <option value="Abyss">Abyss</option>
              </select>
              <span style={{ fontSize: '0.72rem', color: '#888' }}>
                Si aún no se ha hecho el veto de mapas, déjalo en blanco y no se mostrará nada.
              </span>
            </div>

            {/* 2. MOMENTO DE LA EMISIÓN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c084fc', letterSpacing: '1px' }}>
                2. MOMENTO DE LA PARTIDA
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMatchupModalConfig({ ...matchupModalConfig, moment: 'previa' })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: matchupModalConfig.moment === 'previa' ? '2px solid #00f5d4' : '1px solid rgba(255,255,255,0.15)',
                    background: matchupModalConfig.moment === 'previa' ? 'rgba(0,245,212,0.15)' : 'rgba(0,0,0,0.4)',
                    color: matchupModalConfig.moment === 'previa' ? '#00f5d4' : '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>🕒 Previa / Antes del partido</span>
                  <span style={{ fontSize: '0.7rem', color: '#888' }}>Ocultar resultado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMatchupModalConfig({ ...matchupModalConfig, moment: 'post' })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: matchupModalConfig.moment === 'post' ? '2px solid #ff4655' : '1px solid rgba(255,255,255,0.15)',
                    background: matchupModalConfig.moment === 'post' ? 'rgba(255,70,85,0.15)' : 'rgba(0,0,0,0.4)',
                    color: matchupModalConfig.moment === 'post' ? '#ff4655' : '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>🏆 Post-partido / Con Resultado</span>
                  <span style={{ fontSize: '0.7rem', color: '#888' }}>Mostrar marcador final</span>
                </button>
              </div>
            </div>

            {/* 3. FORMATO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '1px' }}>
                3. FORMATO DE LA SERIE (PLATANITOS 🍌)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {['BO1', 'BO3', 'BO5'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setMatchupModalConfig({ ...matchupModalConfig, format: fmt })}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: matchupModalConfig.format === fmt ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.15)',
                      background: matchupModalConfig.format === fmt ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0,0,0,0.4)',
                      color: matchupModalConfig.format === fmt ? '#fbbf24' : '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    {fmt} ({fmt === 'BO1' ? '🍌' : fmt === 'BO3' ? '🍌🍌' : '🍌🍌🍌'})
                  </button>
                ))}
              </div>
            </div>

            {/* MARCADOR SI ES POST */}
            {matchupModalConfig.moment === 'post' && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: '#00f5d4', fontWeight: 800 }}>Mapas {currentMatch.t1?.name}</span>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={matchupModalConfig.m1}
                    onChange={(e) => setMatchupModalConfig({ ...matchupModalConfig, m1: Number(e.target.value) })}
                    style={{ width: '100%', background: '#08080b', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px', borderRadius: '4px', textAlign: 'center', fontWeight: 900 }}
                  />
                </div>
                <span style={{ fontWeight: 900, color: '#aaa', marginTop: '14px' }}>VS</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: '#ff4655', fontWeight: 800 }}>Mapas {currentMatch.t2?.name}</span>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={matchupModalConfig.m2}
                    onChange={(e) => setMatchupModalConfig({ ...matchupModalConfig, m2: Number(e.target.value) })}
                    style={{ width: '100%', background: '#08080b', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px', borderRadius: '4px', textAlign: 'center', fontWeight: 900 }}
                  />
                </div>
              </div>
            )}

            {/* BOTONES */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowMatchupConfigModal(false)}
                className="btn-secondary"
                style={{ padding: '9px 16px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMatchupBroadcast}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #c084fc 0%, #7c3aed 100%)',
                  borderColor: '#c084fc',
                  color: '#fff',
                  fontWeight: 900,
                  padding: '9px 20px',
                }}
              >
                🚀 Transmitir a OBS
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE SELECCIÓN DE FASE: GRUPOS & SORTEO */}
      {showSorteoPhaseModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowSorteoPhaseModal(false); }}>
          <div className="glass-modal" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, color: '#00f5d4', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                🏆 ACTIVAR ESCENA: GRUPOS & SORTEO
              </h3>
              <button
                type="button"
                onClick={() => setShowSorteoPhaseModal(false)}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>
              Selecciona qué fase del módulo deseas mostrar en directo en la emisión de OBS:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { id: 'presentacion', label: '1. Presentación', desc: 'Cuatro grupos fijos A, B, C, D (Tiers)', icon: '🐒' },
                { id: 'sorteo', label: '2. Sorteo en Vivo', desc: 'Animación de bombos y cruces', icon: '🎲' },
                { id: 'clasificacion', label: '3. Clasificación', desc: 'Tabla general de posiciones (Top 1-16)', icon: '🏆' },
                { id: 'jornadas', label: '4. Jornadas', desc: 'Calendario de 4 jornadas (32 partidos)', icon: '📅' },
              ].map((p) => {
                const isSelected = selectedSorteoPhase === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedSorteoPhase(p.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #00f5d4' : '1px solid rgba(255,255,255,0.15)',
                      background: isSelected ? 'rgba(0, 245, 212, 0.15)' : 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxShadow: isSelected ? '0 0 16px rgba(0, 245, 212, 0.25)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{p.icon}</span>
                    <strong style={{ color: isSelected ? '#00f5d4' : '#fff', fontSize: '13px' }}>{p.label}</strong>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{p.desc}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setShowSorteoPhaseModal(false)}
                className="btn-secondary"
                style={{ padding: '9px 16px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSorteoPhase(selectedSorteoPhase)}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #00f5d4 0%, #00bbf9 100%)',
                  borderColor: '#00f5d4',
                  color: '#08080b',
                  fontWeight: 900,
                  padding: '9px 20px',
                  cursor: 'pointer',
                }}
              >
                🚀 Confirmar y Activar en Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(145, 70, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9146ff' }}>
            <Tv size={22} />
          </div>
          <div>
            <h2>Centro de Overlays para Stream (OBS & Twitch)</h2>
            <p>Herramientas visuales y fuentes de navegador transparentes para los directos de MakacaGótica.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchMatches}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} /> Sincronizar Partidos
          </button>
        </div>
      </div>

      {/* PANEL MAESTRO: CONTROL DE QUÉ MOSTRAR EN STREAM */}
      <div className="glass-card" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.15) 0%, rgba(0, 245, 212, 0.1) 100%)',
        border: '2px solid rgba(192, 132, 252, 0.4)',
        boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '18px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#00f5d4', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
              ENLACE MAESTRO UNIFICADO PARA OBS
            </span>
            <h3 style={{ margin: '4px 0 6px', color: '#fff', fontSize: '20px' }}>
              ¿Qué mostrar en el Stream ahora mismo?
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              Añade <strong>este único enlace</strong> en OBS Studio. Desde aquí cambias lo que ven los espectadores en tiempo real con un solo clic.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => copyUrl('master', '/overlay/live')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: copiedUrl === 'master' ? 'var(--success)' : '#9146ff',
                color: '#fff',
                fontWeight: 800,
                fontSize: '13px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {copiedUrl === 'master' ? <Check size={16} /> : <Copy size={16} />}
              {copiedUrl === 'master' ? '¡Enlace Maestro Copiado!' : 'Copiar Enlace Maestro OBS'}
            </button>

            <a
              href={`${window.location.port === '5174' ? window.location.origin.replace(':5174', ':5173') : window.location.origin}/overlay/live`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px', textDecoration: 'none', borderRadius: '8px' }}
            >
              <ExternalLink size={15} /> Probar Overlay ↗
            </a>
          </div>
        </div>

        {/* SELECTOR DE ESCENAS EN STREAM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { id: 'scoreboard', label: 'Marcador HUD', icon: '💎', desc: 'Puntuación y radianita' },
            { id: 'sorteo', label: 'Grupos & Sorteo', icon: '🏆', desc: 'Overlay dedicado de grupos y liga' },
            { id: 'roulette', label: 'Ruleta de Mapas', icon: '🎰', desc: 'Sorteo animado en vivo' },
            { id: 'matchup', label: 'Pantalla Versus', icon: '⚔️', desc: 'Previa de los dos equipos' },
            { id: 'ticker', label: 'Ticker Inferior', icon: '📰', desc: 'Cinta inferior de noticias' },
            { id: 'hidden', label: 'Ocultar / Off', icon: '🙈', desc: 'Lienzo 100% transparente' },
          ].map((item) => {
            const isActive = activeOverlayMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSetOverlayMode(item.id)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.25) 0%, rgba(0, 245, 212, 0.1) 100%)' : 'rgba(0,0,0,0.4)',
                  border: isActive ? '2px solid #00f5d4' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '14px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: isActive ? '0 0 18px rgba(0, 245, 212, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  {isActive && (
                    <span style={{ fontSize: '10px', fontWeight: 900, background: '#00f5d4', color: '#08080b', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.8px' }}>
                      EN STREAM
                    </span>
                  )}
                </div>
                <strong style={{ color: isActive ? '#00f5d4' : '#fff', fontSize: '14px' }}>
                  {item.label}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* ACCIONES EXTRAS SI LA RULETA ESTÁ SELECCIONADA */}
        {activeOverlayMode === 'roulette' && (
          <div style={{
            marginTop: '16px',
            padding: '14px 18px',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(192, 132, 252, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🎰</span>
              <div>
                <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>
                  La Ruleta de Mapas está activa en OBS
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Haz clic en el botón para girarla con animación y sonido en directo frente a los espectadores.
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={isSpinningLive}
              onClick={handleTriggerRouletteSpin}
              style={{
                background: 'linear-gradient(90deg, #c084fc, #00f5d4)',
                color: '#08080b',
                fontWeight: 900,
                fontSize: '13px',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Play size={16} fill="#000" /> {isSpinningLive ? '¡Girando en Stream...!' : '¡Girar Ruleta en Stream!'}
            </button>
          </div>
        )}
      </div>

      {/* Selector de Partido y Tipo de Overlay */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Partido Seleccionado para la Transmisión
            </label>
            <select
              value={selectedMatchId || ''}
              onChange={(e) => setSelectedMatchId(Number(e.target.value))}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--glass-border)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id} style={{ background: '#0e1814', color: '#fff' }}>
                  {m.t1?.name} vs {m.t2?.name} ({m.map || 'Sin mapa'} · {m.date || 'Jornada'})
                </option>
              ))}
              {matches.length === 0 && <option value="">Thunder Buddies vs Entry Baiters (Demostración)</option>}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Tipo de Overlay Visual
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'scoreboard', label: 'Marcador HUD' },
                { id: 'matchup', label: 'Pantalla VS' },
                { id: 'ticker', label: 'Ticker Inferior' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOverlayStyle(tab.id)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: overlayStyle === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    color: overlayStyle === tab.id ? '#000' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE PREVISUALIZACIÓN EN VIVO (Simulador de Stream) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '17px', color: '#fff' }}>Simulador de Emisión (Lienzo 16:9)</h3>
          </div>
          <span style={{ fontSize: '12px', color: '#00ff88', background: 'rgba(0,255,136,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
            ● Vista Previa Activa
          </span>
        </div>

        {/* Lienzo estilo OBS */}
        <div
          style={{
            width: '100%',
            height: '360px',
            background: 'linear-gradient(135deg, #08080b 0%, #0f1923 100%)',
            borderRadius: '12px',
            border: '2px solid rgba(192, 132, 252, 0.25)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Fondo simulando juego / gameplay */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle, rgba(192, 132, 252, 0.25) 0%, transparent 70%)' }} />

          {/* OVERLAY TIPO SCOREBOARD */}
          {overlayStyle === 'scoreboard' && (
            <div
              style={{
                position: 'absolute',
                top: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'rgba(15, 25, 35, 0.95)',
                border: '1px solid rgba(192, 132, 252, 0.35)',
                borderRadius: '10px',
                padding: '10px 24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 15px rgba(192, 132, 252, 0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={currentMatch.t1?.logo || '/logo1.png'} alt="" style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'contain' }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>{currentMatch.t1?.name}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 16px', borderRadius: '6px', border: '1px solid rgba(192, 132, 252, 0.2)' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#00f5d4', fontFamily: "'Bebas Neue', sans-serif", fontVariantNumeric: 'tabular-nums' }}>{customScore1}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>-</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#ff4655', fontFamily: "'Bebas Neue', sans-serif", fontVariantNumeric: 'tabular-nums' }}>{customScore2}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>{currentMatch.t2?.name}</span>
                <img src={currentMatch.t2?.logo || '/logo2.png'} alt="" style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'contain' }} />
              </div>

              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '14px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                <div>MAPA: <strong style={{ color: '#00f5d4' }}>{currentMatch.map || 'Ascent'}</strong></div>
                <div>RONDA: <strong style={{ color: '#c084fc' }}>{customRound}</strong></div>
              </div>
            </div>
          )}

          {/* OVERLAY TIPO PANTALLA VS */}
          {overlayStyle === 'matchup' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
                background: 'rgba(15, 25, 35, 0.95)',
                padding: '30px 50px',
                borderRadius: '16px',
                border: '1.5px solid rgba(192, 132, 252, 0.4)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 25px rgba(192, 132, 252, 0.2)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <img src={currentMatch.t1?.logo || '/logo1.png'} alt="" style={{ width: '80px', height: '80px', borderRadius: '14px', objectFit: 'contain', border: '2px solid #00f5d4' }} />
                <h4 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>{currentMatch.t1?.name}</h4>
                <span style={{ fontSize: '11px', color: '#00f5d4', background: 'rgba(0, 245, 212, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #00f5d4' }}>Lado Defensor</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '38px', fontWeight: 900, color: '#c084fc', fontFamily: "'Bebas Neue', sans-serif" }}>VS</span>
                <span style={{ fontSize: '11px', color: '#00f5d4', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0, 245, 212, 0.4)', padding: '3px 12px', borderRadius: '12px', fontWeight: 900, letterSpacing: '1px' }}>
                  FASE DE GRUPOS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <img src={currentMatch.t2?.logo || '/logo2.png'} alt="" style={{ width: '80px', height: '80px', borderRadius: '14px', objectFit: 'contain', border: '2px solid #ff4655' }} />
                <h4 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>{currentMatch.t2?.name}</h4>
                <span style={{ fontSize: '11px', color: '#ff4655', background: 'rgba(255, 70, 85, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ff4655' }}>Lado Atacante</span>
              </div>
            </div>
          )}

          {/* OVERLAY TIPO TICKER */}
          {overlayStyle === 'ticker' && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(90deg, rgba(8, 8, 11, 0.98) 0%, rgba(15, 25, 35, 0.96) 50%, rgba(8, 8, 11, 0.98) 100%)',
                borderTop: '2px solid #c084fc',
                padding: '10px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#fff',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'linear-gradient(90deg, #c084fc, #00f5d4)', color: '#08080b', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11px' }}>
                  COPA PRIMATE 2026
                </span>
                <span>🔴 Siguiente partido: <strong>{currentMatch.t1?.name}</strong> vs <strong>{currentMatch.t2?.name}</strong> ({currentMatch.date})</span>
              </div>
              <span style={{ color: '#c084fc', fontSize: '12px', fontWeight: 700 }}>Canal de Twitch: twitch.tv/makacagotica</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas con Enlaces Directos para OBS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {[
          {
            id: 'obs-hud',
            title: 'Marcador HUD Superior',
            desc: 'Fuente de navegador transparente con tanteo en directo, mapa y ronda. Se actualiza automáticamente.',
            res: '1920 x 160 px',
            url: '/overlay/scoreboard',
          },
          {
            id: 'obs-roulette',
            title: 'Ruleta de Mapas Oficial',
            desc: 'Sorteo animado de mapas en directo con sonido y tarjeta de resultado para el veto de mapas en stream.',
            res: '1920 x 1080 px',
            url: '/overlay/roulette',
          },
          {
            id: 'obs-vs',
            title: 'Pantalla Versus (Previa del Partido)',
            desc: 'Presentación oficial de los dos equipos con logos, lados tácticos y fase del torneo para las previas.',
            res: '1920 x 1080 px',
            url: '/overlay/matchup',
          },
          {
            id: 'obs-sorteo',
            title: 'Sorteo & Grupos de Liga',
            desc: 'Overlay dedicado para la emisión del sorteo de liga, bombos, presentación de los 4 grupos y seguimiento de las jornadas.',
            res: '1920 x 1080 px',
            url: '/overlay/sorteo',
          },
          {
            id: 'obs-ticker',
            title: 'Ticker Inferior de Noticias',
            desc: 'Cinta inferior deslizante con el calendario, resultados de la jornada y avisos para los espectadores.',
            res: '1920 x 80 px',
            url: '/overlay/ticker',
          },
        ].map((ov) => (
          <div key={ov.id} className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{ov.title}</h4>
                <span style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(255,179,0,0.12)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {ov.res}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: '1.5' }}>{ov.desc}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => copyUrl(ov.id, ov.url)}
                className="btn-primary"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '9px 12px',
                  background: copiedUrl === ov.id ? 'var(--success)' : 'var(--primary)',
                  color: '#000',
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {copiedUrl === ov.id ? <Check size={14} /> : <Copy size={14} />}
                {copiedUrl === ov.id ? '¡URL Copiada!' : 'Copiar URL para OBS'}
              </button>

              <a
                href={`${window.location.port === '5174' ? window.location.origin.replace(':5174', ':5173') : window.location.origin}${ov.url}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px 12px',
                  textDecoration: 'none',
                  borderRadius: '8px',
                }}
                title="Abrir vista previa del overlay"
              >
                <ExternalLink size={14} /> Abrir ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* GUÍA RÁPIDA DE CONFIGURACIÓN OBS */}
      <div className="glass-card" style={{ padding: '24px', background: 'rgba(255, 179, 0, 0.04)', border: '1px solid var(--border-gold)' }}>
        <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--primary)" /> Cómo añadir la fuente a OBS Studio
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '8px' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>1. Añadir Fuente</strong>
            En OBS, en el panel de <em>Fuentes</em>, pulsa en el botón <strong>+</strong> y selecciona <strong>Navegador</strong>.
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '8px' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>2. Pegar URL</strong>
            En la casilla <strong>URL</strong>, pega el enlace copiado con el botón de arriba.
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '8px' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>3. Resolución</strong>
            Configura <strong>Ancho: 1920</strong> y <strong>Alto: 1080</strong> (el fondo es 100% transparente).
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '8px' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>4. ¡Listo!</strong>
            Cualquier cambio que guardes en Moderación se sincronizará automáticamente en tiempo real.
          </div>
        </div>
      </div>
    </div>
  );
}

