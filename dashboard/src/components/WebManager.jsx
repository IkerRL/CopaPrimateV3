import { useState, useEffect } from 'react';
import { Globe, Eye, EyeOff, Save, CheckCircle2, AlertCircle, RefreshCw, Layers, Calendar, Trophy, Users, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { apiFetch } from '../api';

export default function WebManager() {
  const [settings, setSettings] = useState({
    showStandings: false,
    showGroups: false,
    showMatches: false,
    tournamentPhase: 'inscripciones',
    activeMatchday: 'J1',
    totalSlots: 16,
    announcementBanner: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/web-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error('Error cargando ajustes web:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await handleSave(next);
  };

  const handleSave = async (customSettings = null) => {
    const toSave = customSettings || settings;
    try {
      setSaving(true);
      const res = await apiFetch('/web-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });

      if (res.ok) {
        setSettings(toSave);
        setToast({ type: 'success', msg: '¡Ajustes guardados permanentemente en la base de datos!' });
      } else {
        setToast({ type: 'error', msg: 'Error al guardar los ajustes en el servidor.' });
      }
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', msg: 'Error de conexión con el servidor.' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const applyPreset = (preset) => {
    let next = { ...settings };
    if (preset === 'pre-tournament') {
      next = {
        ...next,
        tournamentPhase: 'inscripciones',
        showStandings: false,
        showGroups: false,
        showMatches: false,
        activeMatchday: 'J1',
      };
    } else if (preset === 'draw') {
      next = {
        ...next,
        tournamentPhase: 'sorteo',
        showStandings: false,
        showGroups: true,
        showMatches: false,
      };
    } else if (preset === 'league') {
      next = {
        ...next,
        tournamentPhase: 'liga',
        showStandings: true,
        showGroups: true,
        showMatches: true,
      };
    }
    handleSave(next);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notificación */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: toast.type === 'success' ? '#0d281e' : '#2b1114',
          border: `1px solid ${toast.type === 'success' ? '#00f5d4' : '#ff4655'}`,
          color: '#fff',
          padding: '14px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
          animation: 'fadeIn 0.25s ease'
        }}>
          {toast.type === 'success' ? <CheckCircle2 color="#00f5d4" size={20} /> : <AlertCircle color="#ff4655" size={20} />}
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}

      {/* Cabecera */}
      <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderLeft: '4px solid #c084fc' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#c084fc', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '1px' }}>
              // MODERACIÓN Y CONTROL PÚBLICO
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe color="#c084fc" size={26} /> Gestión y Visibilidad de la Web
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Decide qué secciones están visibles o en estado de preparación durante cada fase del torneo de 16 equipos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <ExternalLink size={16} /> Abrir Web Pública
          </a>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSave()}
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Presets Rápidos por Fase */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles color="#ffd700" size={18} /> Modos Rápidos de Torneo
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Configura con un solo clic el estado de toda la web según el momento actual de la competición:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <button
            type="button"
            onClick={() => applyPreset('pre-tournament')}
            style={{
              background: settings.tournamentPhase === 'inscripciones' ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${settings.tournamentPhase === 'inscripciones' ? '#c084fc' : 'rgba(255,255,255,0.1)'}`,
              padding: '14px',
              borderRadius: '8px',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong style={{ fontSize: '14px', color: '#c084fc' }}>1. Pre-Torneo (Inscripciones)</strong>
              {settings.tournamentPhase === 'inscripciones' && <CheckCircle2 size={16} color="#c084fc" />}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Oculta clasificación, grupos y partidos falsos. La web muestra las 16 plazas y el reglamento.
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('draw')}
            style={{
              background: settings.tournamentPhase === 'sorteo' ? 'rgba(0, 245, 212, 0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${settings.tournamentPhase === 'sorteo' ? '#00f5d4' : 'rgba(255,255,255,0.1)'}`,
              padding: '14px',
              borderRadius: '8px',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong style={{ fontSize: '14px', color: '#00f5d4' }}>2. Fase de Sorteo de Bombos</strong>
              {settings.tournamentPhase === 'sorteo' && <CheckCircle2 size={16} color="#00f5d4" />}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Activa la distribución oficial de los 4 bombos y deja el calendario preparado para los cruces.
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('league')}
            style={{
              background: settings.tournamentPhase === 'liga' ? 'rgba(255, 70, 85, 0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${settings.tournamentPhase === 'liga' ? '#ff4655' : 'rgba(255,255,255,0.1)'}`,
              padding: '14px',
              borderRadius: '8px',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong style={{ fontSize: '14px', color: '#ff4655' }}>3. Liga Única en Directo</strong>
              {settings.tournamentPhase === 'liga' && <CheckCircle2 size={16} color="#ff4655" />}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Activa la tabla de clasificación en vivo, cruces de Jornadas 1 a 4 y estadísticas de jugadores.
            </div>
          </button>
        </div>
      </div>

      {/* Interruptores de Visibilidad Individuales */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '17px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers color="#c084fc" size={20} /> Visibilidad de Secciones Públicas
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Clasificación */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: settings.showStandings ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: settings.showStandings ? '#00f5d4' : 'var(--text-muted)' }}>
                <Trophy size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '15px', color: '#fff', display: 'block' }}>Tabla de Clasificación General</strong>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {settings.showStandings
                    ? 'Visible: Muestra la tabla oficial de 16 equipos, puntos, podio y líneas de corte.'
                    : 'Oculta: La web muestra el estado de Pre-Temporada explicando el formato de liga sin inventar datos.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateSetting('showStandings', !settings.showStandings)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: `1px solid ${settings.showStandings ? '#00f5d4' : 'rgba(255,255,255,0.2)'}`,
                background: settings.showStandings ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255,255,255,0.05)',
                color: settings.showStandings ? '#00f5d4' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {settings.showStandings ? <><Eye size={16} /> ACTIVADA</> : <><EyeOff size={16} /> EN ESPERA</>}
            </button>
          </div>

          {/* Sorteo & Grupos */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: settings.showGroups ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: settings.showGroups ? '#c084fc' : 'var(--text-muted)' }}>
                <Users size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '15px', color: '#fff', display: 'block' }}>Distribución de Grupos / Bombos</strong>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {settings.showGroups
                    ? 'Visible: Muestra los grupos y bombos asignados a cada equipo.'
                    : 'Oculta: Muestra tarjeta informativa indicando que el sorteo se realizará en Twitch.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateSetting('showGroups', !settings.showGroups)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: `1px solid ${settings.showGroups ? '#c084fc' : 'rgba(255,255,255,0.2)'}`,
                background: settings.showGroups ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255,255,255,0.05)',
                color: settings.showGroups ? '#c084fc' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {settings.showGroups ? <><Eye size={16} /> ACTIVADA</> : <><EyeOff size={16} /> PENDIENTE</>}
            </button>
          </div>

          {/* Cruces & Partidos */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: settings.showMatches ? 'rgba(255, 70, 85, 0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: settings.showMatches ? '#ff4655' : 'var(--text-muted)' }}>
                <Calendar size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '15px', color: '#fff', display: 'block' }}>Cruces y Enfrentamientos por Jornada (J1 - J4)</strong>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {settings.showMatches
                    ? 'Visible: Muestra los partidos programados organizados por Jornada 1, 2, 3 y 4.'
                    : 'Oculta: Muestra tarjeta de "Calendario en Preparación" a la espera del sorteo.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateSetting('showMatches', !settings.showMatches)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: `1px solid ${settings.showMatches ? '#ff4655' : 'rgba(255,255,255,0.2)'}`,
                background: settings.showMatches ? 'rgba(255, 70, 85, 0.15)' : 'rgba(255,255,255,0.05)',
                color: settings.showMatches ? '#ff4655' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {settings.showMatches ? <><Eye size={16} /> ACTIVADA</> : <><EyeOff size={16} /> EN ESPERA</>}
            </button>
          </div>
        </div>
      </div>

      {/* Configuración de Jornadas y Anuncio */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Selector de Jornada Activa */}
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: '#fff' }}>Jornada Destacada / Filtro Activo</h4>
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Selecciona cuál jornada debe aparecer seleccionada por defecto en el calendario:
          </p>

          <select
            value={settings.activeMatchday}
            onChange={(e) => updateSetting('activeMatchday', e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              padding: '10px 14px',
              color: '#fff',
              outline: 'none',
              fontSize: '14px',
            }}
          >
            <option value="J1">Jornada 1 (J1)</option>
            <option value="J2">Jornada 2 (J2)</option>
            <option value="J3">Jornada 3 (J3)</option>
            <option value="J4">Jornada 4 (J4)</option>
            <option value="ALL">Todas las Jornadas</option>
          </select>
        </div>

        {/* Banner Opcional de Anuncio */}
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: '#fff' }}>Cinta de Anuncio Global en la Web</h4>
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Escribe un mensaje de aviso que se mostrará arriba en la web (se guarda automáticamente al salir o pulsar Enter):
          </p>

          <input
            type="text"
            placeholder="Ej: ¡Sorteo de grupos este viernes a las 20:00 en twitch.tv/makacagotica!"
            value={settings.announcementBanner || ''}
            onChange={(e) => setSettings(s => ({ ...s, announcementBanner: e.target.value }))}
            onBlur={() => handleSave(settings)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(settings); }}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              padding: '10px 14px',
              color: '#fff',
              outline: 'none',
              fontSize: '13px',
            }}
          />
        </div>
      </div>
    </div>
  );
}

