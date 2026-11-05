import { useState } from 'react';
import { Sliders, Sparkles, RefreshCw, Send, Check } from 'lucide-react';
import { apiFetch } from '../api';

const SHIELD_OPTIONS = [
  { name: 'Sin Escudo', img: 'https://valorantinfo.com/images/es/grafiti-peligro_valorant_transparent_icon_4509.webp' },
  { name: 'Escudo Ligero', img: 'https://itzmrblox.github.io/ValorantRandom/assets/weapons/lightshields.png' },
  { name: 'Escudo Pesado', img: 'https://static.wikia.nocookie.net/valorant/images/6/62/Heavy_Armor.png' },
  { name: 'Regen Shield', img: 'https://static.wikia.nocookie.net/valorant/images/a/aa/Regen_Shield.png' }
];

const RANDOM_CHALLENGES = [
  { name: 'Modo Bailoteo', img: 'https://valorantinfo.com/images/es/grafiti-marcate-un-baile_valorant_gif_98518.gif' },
  { name: 'Nanomight', img: 'https://valorantinfo.com/images/es/grafiti-nanomight_valorant_transparent_icon_107829.webp' },
  { name: 'Técnicamente', img: 'https://valorantinfo.com/images/es/grafiti-tecnicamente_valorant_transparent_icon_107809.webp' },
  { name: 'Bombástico', img: 'https://valorantinfo.com/images/es/grafiti-bombastico_valorant_gif_80238.gif' },
  { name: 'Gato Avergonzado', img: 'https://valorantinfo.com/images/es/grafiti-gato-avergonzado_valorant_transparent_icon_95077.webp' },
  { name: 'Heroico', img: 'https://valorantinfo.com/images/es/grafiti-valiant-hero_valorant_gif_61992.gif' },
  { name: 'Hasta Nunqui', img: 'https://valorantinfo.com/images/es/grafiti-hasta-nunqui_valorant_gif_53241.gif' },
  { name: 'Perrete Especial 🐶', img: '/perrete.png' },
];

const WEAPONS = [
  { name: 'Classic', img: 'https://static.wikia.nocookie.net/valorant/images/5/57/Classic.png' },
  { name: 'Shorty', img: 'https://static.wikia.nocookie.net/valorant/images/7/77/Shorty.png' },
  { name: 'Frenzy', img: 'https://static.wikia.nocookie.net/valorant/images/f/f1/Frenzy.png' },
  { name: 'Ghost', img: 'https://static.wikia.nocookie.net/valorant/images/a/ab/Ghost.png' },
  { name: 'Sheriff', img: 'https://static.wikia.nocookie.net/valorant/images/3/3e/Sheriff.png' },
  { name: 'Stinger', img: 'https://static.wikia.nocookie.net/valorant/images/b/b6/Stinger.png' },
  { name: 'Spectre', img: 'https://static.wikia.nocookie.net/valorant/images/9/90/Spectre.png' },
  { name: 'Bucky', img: 'https://static.wikia.nocookie.net/valorant/images/e/eb/Bucky.png' },
  { name: 'Judge', img: 'https://static.wikia.nocookie.net/valorant/images/8/8a/Judge.png' },
  { name: 'Bulldog', img: 'https://static.wikia.nocookie.net/valorant/images/0/07/Bulldog.png' },
  { name: 'Guardian', img: 'https://static.wikia.nocookie.net/valorant/images/f/fd/Guardian.png' },
  { name: 'Phantom', img: 'https://static.wikia.nocookie.net/valorant/images/e/ec/Phantom.png' },
  { name: 'Vandal', img: 'https://static.wikia.nocookie.net/valorant/images/5/56/Vandal.png' },
  { name: 'Marshal', img: 'https://static.wikia.nocookie.net/valorant/images/b/b9/Marshal.png' },
  { name: 'Outlaw', img: 'https://static.wikia.nocookie.net/valorant/images/f/f0/Outlaw.png' },
  { name: 'Operator', img: 'https://static.wikia.nocookie.net/valorant/images/1/17/Operator.png' },
  { name: 'Ares', img: 'https://static.wikia.nocookie.net/valorant/images/0/05/Ares.png' },
  { name: 'Odin', img: 'https://static.wikia.nocookie.net/valorant/images/5/58/Odin.png' },
];

export default function EquipmentRandomizer() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [statusText, setStatusText] = useState('SISTEMA EN ESPERA...');
  const [currentShield, setCurrentShield] = useState(null);
  const [currentRandom, setCurrentRandom] = useState(null);
  const [currentWeapon, setCurrentWeapon] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const pullLever = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setLeverPulled(true);
    setStatusText('🎲 SORTEANDO EQUIPAMIENTO...');
    setFeedback(null);

    setTimeout(() => {
      setLeverPulled(false);
    }, 400);

    let count = 0;
    const interval = setInterval(() => {
      setCurrentShield(SHIELD_OPTIONS[Math.floor(Math.random() * SHIELD_OPTIONS.length)]);
      setCurrentRandom(RANDOM_CHALLENGES[Math.floor(Math.random() * RANDOM_CHALLENGES.length)]);
      setCurrentWeapon(WEAPONS[Math.floor(Math.random() * WEAPONS.length)]);

      count++;
      if (count > 25) {
        clearInterval(interval);
        setIsSpinning(false);
        setStatusText('✅ CONFIGURACIÓN LISTA');
      }
    }, 85);
  };

  const publishToDiscord = async () => {
    if (!currentShield || !currentWeapon) return;
    try {
      const title = '🎰 Ronda Especial // Ruleta de Armas';
      const message = `¡Los moderadores han activado una ronda especial con ruleta!\n\n🛡️ **Escudo:** ${currentShield.name}\n🎲 **Reto:** ${currentRandom?.name || 'Libre'}\n🔫 **Arma:** ${currentWeapon.name}`;
      await apiFetch('/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, color: '#ffb300' }),
      });
      setFeedback({ type: 'success', text: '¡Reto de armas publicado en Discord correctamente!' });
    } catch {
      setFeedback({ type: 'error', text: 'Error al enviar a Discord' });
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, letterSpacing: '1px' }}>
            SHOWMATCH & MINIJUEGOS // VALORANT
          </span>
          <h2>Tragamonedas & Randomizer de Armas</h2>
          <p>Tira de la palanca mecánica para sortear Escudo, Desafío y Arma en rondas especiales de la Copa Primate.</p>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '8px',
          background: feedback.type === 'success' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 70, 85, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* MÁQUINA TRAGAMONEDAS Y PALANCA */}
      <div
        className="glass-card"
        style={{
          padding: '40px 30px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px',
          flexWrap: 'wrap',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(20, 35, 25, 0.95) 0%, rgba(8, 15, 10, 0.98) 100%)',
          border: '2px solid var(--border-gold)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
          borderRadius: '20px',
        }}
      >
        {/* Cuerpo de la máquina */}
        <div style={{ flex: '1 1 500px', maxWidth: '620px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cabecera arcade */}
          <div
            style={{
              background: '#ff4655',
              padding: '12px 20px',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 20px rgba(255, 70, 85, 0.4)',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: 800, letterSpacing: '1px' }}>RANKED_ONLY</span>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>
                VALORANT EQUIPMENT RANDOMIZER
              </h3>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(0,0,0,0.3)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
              MAKACOS
            </span>
          </div>

          {/* Pantalla con 3 Carretes */}
          <div
            style={{
              background: '#040906',
              border: '3px solid rgba(255, 179, 0, 0.4)',
              borderRadius: '14px',
              padding: '24px 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)',
            }}
          >
            {/* Columna Escudo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, letterSpacing: '1px' }}>ESCUDO</span>
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  overflow: 'hidden',
                }}
              >
                {currentShield ? (
                  <img src={currentShield.img} alt={currentShield.name} style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '36px', color: 'rgba(255,255,255,0.2)', fontWeight: 900 }}>?</span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600, textAlign: 'center' }}>
                {currentShield?.name || '—'}
              </span>
            </div>

            {/* Columna Desafío Random */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, letterSpacing: '1px' }}>RETO RANDOM</span>
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  overflow: 'hidden',
                }}
              >
                {currentRandom ? (
                  <img src={currentRandom.img} alt={currentRandom.name} style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '36px', color: 'rgba(255,255,255,0.2)', fontWeight: 900 }}>?</span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600, textAlign: 'center' }}>
                {currentRandom?.name || '—'}
              </span>
            </div>

            {/* Columna Arma */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, letterSpacing: '1px' }}>ARMA</span>
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  overflow: 'hidden',
                }}
              >
                {currentWeapon ? (
                  <img src={currentWeapon.img} alt={currentWeapon.name} style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '36px', color: 'rgba(255,255,255,0.2)', fontWeight: 900 }}>?</span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600, textAlign: 'center' }}>
                {currentWeapon?.name || '—'}
              </span>
            </div>
          </div>

          {/* Barra de Estado inferior */}
          <div
            style={{
              background: 'rgba(0,0,0,0.6)',
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: isSpinning ? 'var(--primary)' : '#00ff88' }}>
              {statusText}
            </span>
            {currentWeapon && !isSpinning && (
              <button
                type="button"
                onClick={publishToDiscord}
                style={{
                  background: 'rgba(88, 101, 242, 0.2)',
                  border: '1px solid #5865F2',
                  color: '#fff',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Send size={12} /> Mandar Anuncio Discord
              </button>
            )}
          </div>
        </div>

        {/* PALANCA MECÁNICA INTERACTIVA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div
            onClick={pullLever}
            title="¡Haz clic en la palanca para activar la ruleta!"
            style={{
              width: '60px',
              height: '240px',
              position: 'relative',
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Bola roja superior de la palanca */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ff7685, #cc001a)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.6), 0 0 16px rgba(255,70,85,0.4)',
                transform: leverPulled ? 'translateY(110px) scale(0.92)' : 'translateY(0)',
                transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.3, 1)',
                zIndex: 2,
              }}
            />

            {/* Varilla metálica */}
            <div
              style={{
                width: '10px',
                height: leverPulled ? '50px' : '150px',
                background: 'linear-gradient(90deg, #888, #eee, #555)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                borderRadius: '4px',
                transform: leverPulled ? 'translateY(60px)' : 'translateY(0)',
                transition: 'all 0.35s cubic-bezier(0.2, 0.8, 0.3, 1)',
                zIndex: 1,
              }}
            />

            {/* Base mecánica */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                width: '54px',
                height: '40px',
                background: 'linear-gradient(180deg, #333, #151515)',
                border: '2px solid #555',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={pullLever}
            disabled={isSpinning}
            style={{
              background: 'var(--primary)',
              color: '#000',
              fontWeight: 800,
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 12px rgba(255,179,0,0.3)',
            }}
          >
            {isSpinning ? 'GIRANDO...' : 'TIRAR'}
          </button>
        </div>
      </div>
    </div>
  );
}

