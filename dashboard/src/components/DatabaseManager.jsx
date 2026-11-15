import { useState, useEffect, useRef } from 'react';
import { 
  Database, Lock, Unlock, Key, Save, Trash2, Plus, Edit3, 
  Download, Upload, RefreshCw, Check, AlertTriangle, Eye, EyeOff, 
  FileJson, Search, X, ShieldAlert, Layers, Trophy, Radio, Globe, Users
} from 'lucide-react';
import { apiFetch } from '../api';
import './databaseManager.css';

const MASTER_PASSWORD = 'Iker2005izan@';
const STORAGE_KEY = 'copa_db_master_key';

// Generador de cruces de fase de liga balanceados para Database Manager
function generarCrucesPorDefecto(gruposData) {
  const gA = gruposData?.A || [];
  const gB = gruposData?.B || [];
  const gC = gruposData?.C || [];
  const gD = gruposData?.D || [];
  if (gA.length < 4 || gB.length < 4 || gC.length < 4 || gD.length < 4) return [[], [], [], []];

  const j1 = [
    { t1: gA[0], t2: gB[0] }, { t1: gA[1], t2: gB[1] }, { t1: gA[2], t2: gB[2] }, { t1: gA[3], t2: gB[3] },
    { t1: gC[0], t2: gD[0] }, { t1: gC[1], t2: gD[1] }, { t1: gC[2], t2: gD[2] }, { t1: gC[3], t2: gD[3] }
  ];
  const j2 = [
    { t1: gA[0], t2: gC[0] }, { t1: gA[1], t2: gC[1] }, { t1: gA[2], t2: gC[2] }, { t1: gA[3], t2: gC[3] },
    { t1: gB[0], t2: gD[0] }, { t1: gB[1], t2: gD[1] }, { t1: gB[2], t2: gD[2] }, { t1: gB[3], t2: gD[3] }
  ];
  const j3 = [
    { t1: gA[0], t2: gD[0] }, { t1: gA[1], t2: gD[1] }, { t1: gA[2], t2: gD[2] }, { t1: gA[3], t2: gD[3] },
    { t1: gB[0], t2: gC[0] }, { t1: gB[1], t2: gC[1] }, { t1: gB[2], t2: gC[2] }, { t1: gB[3], t2: gC[3] }
  ];
  const j4 = [
    { t1: gA[0], t2: gA[1] }, { t1: gA[2], t2: gA[3] },
    { t1: gB[0], t2: gB[1] }, { t1: gB[2], t2: gB[3] },
    { t1: gC[0], t2: gC[1] }, { t1: gC[2], t2: gC[3] },
    { t1: gD[0], t2: gD[1] }, { t1: gD[2], t2: gD[3] }
  ];

  const formatear = (partidos, jNum) =>
    partidos.map((p, idx) => ({
      id: `j${jNum}-m${idx + 1}`,
      jornada: jNum,
      round: `J${jNum}`,
      t1: { name: p.t1.name, logo: p.t1.logo || '/logo1.png', grupo: p.t1.grupo || 'A' },
      t2: { name: p.t2.name, logo: p.t2.logo || '/logo2.png', grupo: p.t2.grupo || 'B' },
      score1: '',
      score2: '',
      status: 'Programado',
      format: 'BO1 (Swiftplay)',
      date: `Jornada ${jNum} · Partido ${idx + 1}`
    }));

  return [formatear(j1, 1), formatear(j2, 2), formatear(j3, 3), formatear(j4, 4)];
}

export default function DatabaseManager() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === MASTER_PASSWORD;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Estados de datos
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' | 'matches' | 'overlay-state' | 'live-match' | 'web-settings'
  const [dbData, setDbData] = useState({
    teams: [],
    matches: { groups: {}, matches: [], jornadas: [] },
    overlayState: {},
    liveMatch: null,
    webSettings: {}
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modo JSON directo vs visual
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonSyntaxError, setJsonSyntaxError] = useState(null);

  // Modales
  const [teamModal, setTeamModal] = useState({ isOpen: false, isEditing: false, team: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJornadaTab, setSelectedJornadaTab] = useState(0);

  const fileInputRef = useRef(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Cargar toda la base de datos
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/database/all');
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
        syncRawText(activeTab, data);
      } else {
        notify('Error al cargar la base de datos', 'error');
      }
    } catch {
      notify('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const syncRawText = (tab, data = dbData) => {
    let target = null;
    if (tab === 'teams') target = data.teams;
    else if (tab === 'matches') target = data.matches;
    else if (tab === 'overlay-state') target = data.overlayState;
    else if (tab === 'live-match') target = data.liveMatch;
    else if (tab === 'web-settings') target = data.webSettings;

    setRawJsonText(JSON.stringify(target ?? {}, null, 2));
    setJsonSyntaxError(null);
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    syncRawText(newTab, dbData);
  };

  // Validación de login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await apiFetch('/database/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      if (res.ok && passwordInput === MASTER_PASSWORD) {
        sessionStorage.setItem(STORAGE_KEY, passwordInput);
        setIsAuthenticated(true);
        setPasswordInput('');
      } else {
        setAuthError('Contraseña incorrecta. Acceso restringido a administración.');
      }
    } catch {
      if (passwordInput === MASTER_PASSWORD) {
        sessionStorage.setItem(STORAGE_KEY, passwordInput);
        setIsAuthenticated(true);
      } else {
        setAuthError('Contraseña incorrecta.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Guardar JSON directo
  const handleSaveRawJson = async () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      setJsonSyntaxError(null);

      const res = await apiFetch(`/database/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsed,
          password: MASTER_PASSWORD
        })
      });

      if (res.ok) {
        notify(`¡Archivo ${activeTab}.json actualizado con éxito!`);
        fetchAllData();
      } else {
        const err = await res.json().catch(() => ({}));
        notify(err.error || 'Error al guardar datos', 'error');
      }
    } catch (err) {
      setJsonSyntaxError(`Error sintáctico JSON: ${err.message}`);
    }
  };

  // Guardar tabla específica
  const saveTableData = async (table, data) => {
    try {
      const res = await apiFetch(`/database/${table}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          password: MASTER_PASSWORD
        })
      });
      if (res.ok) {
        notify(`¡Cambios guardados en ${table}.json!`);
        fetchAllData();
        return true;
      }
      const err = await res.json().catch(() => ({}));
      notify(err.error || 'Error al guardar cambios', 'error');
      return false;
    } catch {
      notify('Error al conectar con la base de datos', 'error');
      return false;
    }
  };

  // Acciones en Equipos (teams.json)
  const handleOpenAddTeam = () => {
    setTeamModal({
      isOpen: true,
      isEditing: false,
      team: {
        id: Date.now(),
        name: '',
        logo: '/copa-logo.png',
        grupo: 'A',
        hidden: false,
        players: [
          { name: '', rank: 'Plata', level: 50 },
          { name: '', rank: 'Plata', level: 50 }
        ]
      }
    });
  };

  const handleOpenEditTeam = (team) => {
    setTeamModal({
      isOpen: true,
      isEditing: true,
      team: JSON.parse(JSON.stringify(team))
    });
  };

  const handleSaveTeamModal = async () => {
    if (!teamModal.team?.name?.trim()) {
      alert('El nombre del equipo es obligatorio');
      return;
    }
    const currentTeams = [...(dbData.teams || [])];
    if (teamModal.isEditing) {
      const idx = currentTeams.findIndex(t => String(t.id) === String(teamModal.team.id));
      if (idx >= 0) currentTeams[idx] = teamModal.team;
    } else {
      currentTeams.push(teamModal.team);
    }

    const ok = await saveTableData('teams', currentTeams);
    if (ok) setTeamModal({ isOpen: false, isEditing: false, team: null });
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`¿Estás seguro de ELIMINAR permanentemente al equipo "${teamName}" de la base de datos?`)) {
      return;
    }
    const filtered = (dbData.teams || []).filter(t => String(t.id) !== String(teamId));
    await saveTableData('teams', filtered);
  };

  const handleToggleTeamVisibility = async (teamId) => {
    const updated = (dbData.teams || []).map(t => {
      if (String(t.id) === String(teamId)) {
        const nextHidden = !t.hidden;
        return {
          ...t,
          hidden: nextHidden,
          status: nextHidden ? 'Aprobado (Oculto)' : 'Aprobado (Público)'
        };
      }
      return t;
    });
    await saveTableData('teams', updated);
  };

  // Backup & Restore
  const handleDownloadBackup = () => {
    const backupObj = {
      timestamp: new Date().toISOString(),
      version: 'CopaPrimateV3',
      database: dbData
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-copa-primate-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Copia de seguridad descargada con éxito');
  };

  const handleUploadBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const payload = parsed.database || parsed;

        if (!window.confirm('⚠️ ¿Sobrescribir TODA la base de datos con esta copia de seguridad? Esta acción no se puede deshacer.')) {
          return;
        }

        const res = await apiFetch('/database/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            backup: payload,
            password: MASTER_PASSWORD
          })
        });

        if (res.ok) {
          notify('¡Base de datos restaurada correctamente!');
          fetchAllData();
        } else {
          notify('Error al restaurar copia de seguridad', 'error');
        }
      } catch (err) {
        alert('Archivo de copia de seguridad no válido: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // PANTALLA DE BLOQUEO CON CONTRASEÑA
  if (!isAuthenticated) {
    return (
      <div className="db-vault-lock-screen">
        <div className="db-vault-card">
          <div className="db-vault-icon-wrap">
            <Lock size={44} color="#00f5d4" />
          </div>

          <h2 className="db-vault-title">BASE DE DATOS PROTEGIDA</h2>
          <p className="db-vault-desc">
            Esta sección contiene acceso directo de lectura, modificación y eliminación sobre los archivos de datos oficiales de la <strong>Copa Primate</strong>.
          </p>

          <form onSubmit={handleLoginSubmit} className="db-vault-form">
            <div className="db-password-input-group">
              <Key size={18} className="db-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Introduce la contraseña de acceso..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="db-password-input"
                autoFocus
              />
              <button
                type="button"
                className="db-eye-btn"
                onClick={() => setShowPassword(p => !p)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {authError && (
              <div className="db-auth-error">
                <ShieldAlert size={16} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" className="db-btn-unlock" disabled={isVerifying || !passwordInput}>
              {isVerifying ? 'Verificando...' : 'Desbloquear Base de Datos'}
            </button>
          </form>

          <div className="db-vault-footer">
            <span>🔒 Acceso exclusivo para administradores y moderadores oficiales</span>
          </div>
        </div>
      </div>
    );
  }

  // PANEL PRINCIPAL DE GESTIÓN DE BASE DE DATOS
  return (
    <div className="db-manager-container">
      {/* HEADER DE GESTIÓN */}
      <div className="db-manager-header">
        <div className="db-header-left">
          <div className="db-header-title-row">
            <Database size={26} color="#00f5d4" />
            <h1 className="db-main-title">GESTOR DE BASE DE DATOS</h1>
            <span className="db-badge-secure">ACCESO AUTORIZADO</span>
          </div>
          <p className="db-header-subtitle">
            Edita, añade, elimina o restaura directamente los datos almacenados en los archivos JSON locales.
          </p>
        </div>

        <div className="db-header-actions">
          <button type="button" className="db-btn-tool" onClick={fetchAllData} title="Recargar datos">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refrescar</span>
          </button>

          <button type="button" className="db-btn-tool" onClick={handleDownloadBackup} title="Descargar copia de seguridad completa">
            <Download size={15} />
            <span>Backup</span>
          </button>

          <button type="button" className="db-btn-tool" onClick={() => fileInputRef.current?.click()} title="Restaurar copia de seguridad">
            <Upload size={15} />
            <span>Restaurar</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleUploadBackup}
          />

          <button type="button" className="db-btn-lock" onClick={handleLock} title="Bloquear sesión de base de datos">
            <Lock size={15} />
            <span>Bloquear</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className={`db-notification-banner ${notification.type}`}>
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* SELECTOR DE TABLAS (JSON STORES) */}
      <div className="db-tabs-bar">
        <button
          type="button"
          className={`db-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => handleTabChange('teams')}
        >
          <Users size={16} />
          <span>Equipos & Jugadores (teams.json)</span>
          <span className="db-tab-count">{(dbData.teams || []).length}</span>
        </button>

        <button
          type="button"
          className={`db-tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => handleTabChange('matches')}
        >
          <Trophy size={16} />
          <span>Cruces & Jornadas (matches.json)</span>
        </button>

        <button
          type="button"
          className={`db-tab-btn ${activeTab === 'overlay-state' ? 'active' : ''}`}
          onClick={() => handleTabChange('overlay-state')}
        >
          <Layers size={16} />
          <span>Estado OBS & Sorteo (overlay-state.json)</span>
        </button>

        <button
          type="button"
          className={`db-tab-btn ${activeTab === 'live-match' ? 'active' : ''}`}
          onClick={() => handleTabChange('live-match')}
        >
          <Radio size={16} />
          <span>Partido en Directo (live-match.json)</span>
        </button>

        <button
          type="button"
          className={`db-tab-btn ${activeTab === 'web-settings' ? 'active' : ''}`}
          onClick={() => handleTabChange('web-settings')}
        >
          <Globe size={16} />
          <span>Ajustes Web (web-settings.json)</span>
        </button>

        <div className="db-mode-switch-wrap">
          <button
            type="button"
            className={`db-mode-pill ${!rawJsonMode ? 'active' : ''}`}
            onClick={() => setRawJsonMode(false)}
          >
            Vista Visual
          </button>
          <button
            type="button"
            className={`db-mode-pill ${rawJsonMode ? 'active' : ''}`}
            onClick={() => setRawJsonMode(true)}
          >
            <FileJson size={14} /> Editor JSON
          </button>
        </div>
      </div>

      {/* CONTENIDO: MODO EDITOR JSON EN BRUTO */}
      {rawJsonMode && (
        <div className="db-raw-editor-card">
          <div className="db-raw-editor-header">
            <div className="db-raw-file-info">
              <FileJson size={18} color="#c084fc" />
              <span>Editando directamente: <strong>{activeTab}.json</strong></span>
            </div>
            <div className="db-raw-header-actions">
              <button
                type="button"
                className="db-btn-raw-action"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(rawJsonText);
                    setRawJsonText(JSON.stringify(parsed, null, 2));
                    setJsonSyntaxError(null);
                  } catch (e) {
                    setJsonSyntaxError(`JSON inválido: ${e.message}`);
                  }
                }}
              >
                Formatear JSON
              </button>
              <button
                type="button"
                className="db-btn-raw-save"
                onClick={handleSaveRawJson}
              >
                <Save size={15} /> Guardar en {activeTab}.json
              </button>
            </div>
          </div>

          {jsonSyntaxError && (
            <div className="db-json-error-pill">
              <AlertTriangle size={15} />
              <span>{jsonSyntaxError}</span>
            </div>
          )}

          <textarea
            className="db-raw-textarea"
            value={rawJsonText}
            onChange={(e) => {
              setRawJsonText(e.target.value);
              try {
                JSON.parse(e.target.value);
                setJsonSyntaxError(null);
              } catch (err) {
                setJsonSyntaxError(`Error sintáctico: ${err.message}`);
              }
            }}
            spellCheck="false"
          />
        </div>
      )}

      {/* CONTENIDO: VISTAS VISUALES INTERACTIVAS */}
      {!rawJsonMode && (
        <div className="db-view-wrapper">
          {/* =========================================================
              1. TABLA EQUIPOS (teams.json)
              ========================================================= */}
          {activeTab === 'teams' && (() => {
            const teamsList = (dbData.teams || []).filter(t => {
              if (!searchTerm) return true;
              const q = searchTerm.toLowerCase();
              return t.name?.toLowerCase().includes(q) || (t.players || []).some(p => p.name?.toLowerCase().includes(q));
            });

            return (
              <div className="db-teams-section">
                <div className="db-toolbar-row">
                  <div className="db-search-wrap">
                    <Search size={16} className="db-search-icon" />
                    <input
                      type="text"
                      placeholder="Buscar por equipo o jugador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="db-search-input"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {dbData.teams && dbData.teams.length >= 16 && (
                      <button
                        type="button"
                        style={{
                          background: 'rgba(0, 245, 212, 0.15)',
                          border: '1px solid #00f5d4',
                          color: '#00f5d4',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={async () => {
                          if (!window.confirm('¿Asignar los 16 equipos de teams.json a los Grupos A, B, C y D de matches.json?')) return;
                          const all = dbData.teams || [];
                          const gA = all.slice(0, 4).map((t, idx) => ({ id: `A${idx+1}`, name: t.name, logo: t.logo || '/logo1.png', grupo: 'A', jugadores: (t.players || []).map(p => p.name) }));
                          const gB = all.slice(4, 8).map((t, idx) => ({ id: `B${idx+1}`, name: t.name, logo: t.logo || '/logo2.png', grupo: 'B', jugadores: (t.players || []).map(p => p.name) }));
                          const gC = all.slice(8, 12).map((t, idx) => ({ id: `C${idx+1}`, name: t.name, logo: t.logo || '/logo3.png', grupo: 'C', jugadores: (t.players || []).map(p => p.name) }));
                          const gD = all.slice(12, 16).map((t, idx) => ({ id: `D${idx+1}`, name: t.name, logo: t.logo || '/logo4.png', grupo: 'D', jugadores: (t.players || []).map(p => p.name) }));
                          const updatedMatches = {
                            ...dbData.matches,
                            groups: { A: gA, B: gB, C: gC, D: gD }
                          };
                          setDbData(prev => ({ ...prev, matches: updatedMatches }));
                          await saveTableData('matches', updatedMatches);
                          notify('16 equipos asignados a los Grupos A, B, C, D de matches.json');
                        }}
                      >
                        <Layers size={15} /> Asignar a Grupos A, B, C, D
                      </button>
                    )}

                    <button type="button" className="db-btn-add" onClick={handleOpenAddTeam}>
                      <Plus size={16} /> Añadir Nuevo Equipo
                    </button>
                  </div>
                </div>

                <div className="db-table-container">
                  <table className="db-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>ID</th>
                        <th style={{ width: '50px' }}>LOGO</th>
                        <th>EQUIPO</th>
                        <th style={{ width: '80px' }}>GRUPO</th>
                        <th>JUGADORES (ROSTER OFICIAL & RANGOS)</th>
                        <th style={{ width: '130px' }}>ESTADO</th>
                        <th style={{ width: '150px' }}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamsList.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', color: '#888' }}>
                            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📂</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                              No hay equipos registrados en teams.json
                            </div>
                            <div style={{ fontSize: '13px', marginTop: '4px' }}>
                              Todos los equipos de ejemplo han sido eliminados. Pulsa en "+ Añadir Nuevo Equipo" para subir tus equipos oficiales.
                            </div>
                          </td>
                        </tr>
                      )}
                      {teamsList.map((team, idx) => (
                        <tr key={team.id || idx}>
                          <td style={{ color: '#888' }}>{team.id}</td>
                          <td>
                            <img
                              src={team.logo || '/copa-logo.png'}
                              alt=""
                              className="db-table-team-logo"
                              onError={(e) => { e.target.src = '/copa-logo.png'; }}
                            />
                          </td>
                          <td>
                            <strong style={{ color: '#fff', fontSize: '14px' }}>{team.name}</strong>
                          </td>
                          <td>
                            <span className={`db-group-tag group-${team.grupo || 'A'}`}>
                              GRUPO {team.grupo || 'A'}
                            </span>
                          </td>
                          <td>
                            <div className="db-players-list">
                              {(team.players || []).map((p, pIdx) => (
                                <span key={pIdx} className="db-player-chip">
                                  <strong>{p.name || 'Sin nombre'}</strong> ({p.rank || p.currentRank || 'Plata'})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`db-badge-status ${team.hidden ? 'hidden' : 'public'}`}
                              onClick={() => handleToggleTeamVisibility(team.id)}
                              title="Haz clic para alternar visibilidad en la web"
                            >
                              {team.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{team.hidden ? 'Oculto' : 'Público'}</span>
                            </button>
                          </td>
                          <td>
                            <div className="db-row-actions">
                              <button
                                type="button"
                                className="db-btn-action-edit"
                                onClick={() => handleOpenEditTeam(team)}
                                title="Editar equipo"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                className="db-btn-action-delete"
                                onClick={() => handleDeleteTeam(team.id, team.name)}
                                title="Eliminar equipo"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* =========================================================
              2. TABLA PARTIDOS Y JORNADAS (matches.json)
              ========================================================= */}
          {activeTab === 'matches' && (() => {
            const jornadasList = dbData.matches?.jornadas || [];

            return (
              <div className="db-matches-section">
                <div className="db-jornada-tabs-row">
                  {[0, 1, 2, 3].map((jIdx) => (
                    <button
                      key={jIdx}
                      type="button"
                      className={`db-jornada-tab ${selectedJornadaTab === jIdx ? 'active' : ''}`}
                      onClick={() => setSelectedJornadaTab(jIdx)}
                    >
                      JORNADA {jIdx + 1}
                      <span className="db-pill-count">
                        {(jornadasList[jIdx] || []).length} Partidos
                      </span>
                    </button>
                  ))}
                </div>

                <div className="db-matches-grid">
                  {(jornadasList[selectedJornadaTab] || []).length === 0 ? (
                    <div style={{
                      gridColumn: '1 / -1',
                      padding: '40px 20px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: '1.5px dashed rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#aaa',
                    }}>
                      <div style={{ fontSize: '32px' }}>📭</div>
                      <div style={{ fontWeight: 800, color: '#fff', fontSize: '16px' }}>
                        No hay partidos registrados en la Jornada {selectedJornadaTab + 1}
                      </div>
                      <div style={{ fontSize: '13px', maxWidth: '420px', lineHeight: '1.5' }}>
                        El sorteo de partidos se ha eliminado o aún no se ha generado para esta jornada.
                      </div>
                    </div>
                  ) : (
                    (jornadasList[selectedJornadaTab] || []).map((m, mIdx) => (
                      <div key={m.id || mIdx} className="db-match-card">
                        <div className="db-match-card-header">
                          <span className="db-match-id">MATCH {m.id || `#${mIdx + 1}`}</span>
                          <span className="db-match-format">{m.format || 'BO1'}</span>
                        </div>

                        <div className="db-match-teams-row">
                          <div className="db-match-team-col">
                            <img src={m.t1?.logo || '/copa-logo.png'} alt="" className="db-match-logo" onError={(e) => { e.target.src = '/copa-logo.png'; }} />
                            <span className="db-match-team-name">{m.t1?.name}</span>
                          </div>

                          <div className="db-match-score-inputs">
                            <input
                              type="number"
                              className="db-score-input"
                              value={m.score1 ?? ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = JSON.parse(JSON.stringify(dbData.matches));
                                if (updated.jornadas?.[selectedJornadaTab]?.[mIdx]) {
                                  updated.jornadas[selectedJornadaTab][mIdx].score1 = val;
                                  setDbData(prev => ({ ...prev, matches: updated }));
                                }
                              }}
                            />
                            <span style={{ color: '#aaa', fontWeight: 900 }}>-</span>
                            <input
                              type="number"
                              className="db-score-input"
                              value={m.score2 ?? ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = JSON.parse(JSON.stringify(dbData.matches));
                                if (updated.jornadas?.[selectedJornadaTab]?.[mIdx]) {
                                  updated.jornadas[selectedJornadaTab][mIdx].score2 = val;
                                  setDbData(prev => ({ ...prev, matches: updated }));
                                }
                              }}
                            />
                          </div>

                          <div className="db-match-team-col align-right">
                            <span className="db-match-team-name">{m.t2?.name}</span>
                            <img src={m.t2?.logo || '/copa-logo.png'} alt="" className="db-match-logo" onError={(e) => { e.target.src = '/copa-logo.png'; }} />
                          </div>
                        </div>

                        <div className="db-match-footer">
                          <select
                            value={m.status || 'Programado'}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = JSON.parse(JSON.stringify(dbData.matches));
                              if (updated.jornadas?.[selectedJornadaTab]?.[mIdx]) {
                                updated.jornadas[selectedJornadaTab][mIdx].status = val;
                                setDbData(prev => ({ ...prev, matches: updated }));
                              }
                            }}
                            className="db-status-select"
                          >
                            <option value="Programado">Programado</option>
                            <option value="LIVE">LIVE (En Juego)</option>
                            <option value="Finalizado">Finalizado</option>
                          </select>

                          <button
                            type="button"
                            className="db-btn-del-match"
                            onClick={() => {
                              if (!window.confirm('¿Eliminar este partido de la jornada?')) return;
                              const updated = JSON.parse(JSON.stringify(dbData.matches));
                              updated.jornadas[selectedJornadaTab].splice(mIdx, 1);
                              saveTableData('matches', updated);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="db-matches-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="db-btn-danger"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        fontWeight: 700,
                        padding: '9px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px'
                      }}
                      onClick={async () => {
                        if (!window.confirm('¿Deseas ELIMINAR Y VACIAR todos los partidos de las 4 jornadas? (matches.json quedará con matches y jornadas vacíos a 0)')) return;
                        const currentGroups = dbData.matches?.groups || {};
                        const updated = {
                          groups: currentGroups,
                          matches: [],
                          jornadas: [[], [], [], []],
                          drawCompleted: false,
                          drawnAt: null,
                        };
                        setDbData(prev => ({ ...prev, matches: updated }));
                        await saveTableData('matches', updated);
                        notify('Cruces y jornadas eliminados correctamente. Sorteo a 0.');
                      }}
                    >
                      <Trash2 size={15} /> Vaciar y Eliminar Partidos de Todas las Jornadas
                    </button>

                    <button
                      type="button"
                      style={{
                        background: 'rgba(192, 132, 252, 0.15)',
                        border: '1px solid rgba(192, 132, 252, 0.4)',
                        color: '#c084fc',
                        fontWeight: 700,
                        padding: '9px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px'
                      }}
                      onClick={async () => {
                        if (!window.confirm('¿Generar automáticamente el calendario oficial de 32 partidos en 4 jornadas a partir de los grupos?')) return;
                        const currentGroups = dbData.matches?.groups || {};
                        const newJornadas = generarCrucesPorDefecto(currentGroups);
                        const allMatches = newJornadas.flat();
                        const updated = {
                          groups: currentGroups,
                          matches: allMatches,
                          jornadas: newJornadas,
                          drawCompleted: true,
                          drawnAt: new Date().toISOString(),
                        };
                        setDbData(prev => ({ ...prev, matches: updated }));
                        await saveTableData('matches', updated);
                        notify('32 partidos de jornadas generados correctamente.');
                      }}
                    >
                      <Trophy size={15} /> Generar Calendario Oficial (32 Partidos)
                    </button>
                  </div>

                  <button
                    type="button"
                    className="db-btn-save-all"
                    onClick={() => saveTableData('matches', dbData.matches)}
                  >
                    <Save size={16} /> Guardar Cambios en matches.json
                  </button>
                </div>
              </div>
            );
          })()}

          {/* =========================================================
              3. ESTADO OVERLAY (overlay-state.json)
              ========================================================= */}
          {activeTab === 'overlay-state' && (
            <div className="db-simple-card">
              <h3 className="db-card-title">ESTADO EN TIEMPO REAL DEL OVERLAY (OBS)</h3>
              <p className="db-card-subtitle">
                Modifica directamente las propiedades activas de la escena de retransmisión.
              </p>

              <div className="db-form-grid">
                <div className="db-form-group">
                  <label>Modo / Escena Activa</label>
                  <select
                    value={dbData.overlayState?.mode || 'scoreboard'}
                    onChange={(e) => {
                      const next = { ...(dbData.overlayState || {}), mode: e.target.value };
                      setDbData(d => ({ ...d, overlayState: next }));
                    }}
                    className="db-input-field"
                  >
                    <option value="sorteo">sorteo (Grupos & Sorteo de Liga)</option>
                    <option value="scoreboard">scoreboard (Marcador Principal)</option>
                    <option value="roulette">roulette (Ruleta de Mapas)</option>
                    <option value="versus">versus (Pantalla Versus)</option>
                    <option value="live">live (Stream Completo)</option>
                  </select>
                </div>

                <div className="db-form-group">
                  <label>Fase de Sorteo Activa</label>
                  <select
                    value={dbData.overlayState?.sorteo?.activePhase || 'presentacion'}
                    onChange={(e) => {
                      const prevS = dbData.overlayState?.sorteo || {};
                      const next = {
                        ...(dbData.overlayState || {}),
                        sorteo: { ...prevS, activePhase: e.target.value }
                      };
                      setDbData(d => ({ ...d, overlayState: next }));
                    }}
                    className="db-input-field"
                  >
                    <option value="presentacion">Presentación (Grupos por Nivel)</option>
                    <option value="sorteo">Sorteo (Extracción de Cruces en Vivo)</option>
                    <option value="clasificacion">Clasificación (Tabla 16 Equipos)</option>
                    <option value="jornadas">Jornadas (Calendario de Partidos)</option>
                  </select>
                </div>
              </div>

              <div className="db-form-actions">
                <button
                  type="button"
                  className="db-btn-save-all"
                  onClick={() => saveTableData('overlay-state', dbData.overlayState)}
                >
                  <Save size={16} /> Guardar Estado en overlay-state.json
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              4. PARTIDO EN DIRECTO (live-match.json)
              ========================================================= */}
          {activeTab === 'live-match' && (
            <div className="db-simple-card">
              <h3 className="db-card-title">PARTIDO EN DIRECTO (MARCADOR STREAM)</h3>
              <p className="db-card-subtitle">
                Controla los datos del partido activo en el marcador oficial.
              </p>

              {dbData.liveMatch ? (
                <div className="db-form-grid">
                  <div className="db-form-group">
                    <label>Equipo 1 (Nombre)</label>
                    <input
                      type="text"
                      className="db-input-field"
                      value={dbData.liveMatch.team1?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDbData(d => ({
                          ...d,
                          liveMatch: { ...d.liveMatch, team1: { ...d.liveMatch.team1, name: val } }
                        }));
                      }}
                    />
                  </div>
                  <div className="db-form-group">
                    <label>Equipo 1 (Puntos)</label>
                    <input
                      type="number"
                      className="db-input-field"
                      value={dbData.liveMatch.team1?.score ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDbData(d => ({
                          ...d,
                          liveMatch: { ...d.liveMatch, team1: { ...d.liveMatch.team1, score: val } }
                        }));
                      }}
                    />
                  </div>

                  <div className="db-form-group">
                    <label>Equipo 2 (Nombre)</label>
                    <input
                      type="text"
                      className="db-input-field"
                      value={dbData.liveMatch.team2?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDbData(d => ({
                          ...d,
                          liveMatch: { ...d.liveMatch, team2: { ...d.liveMatch.team2, name: val } }
                        }));
                      }}
                    />
                  </div>
                  <div className="db-form-group">
                    <label>Equipo 2 (Puntos)</label>
                    <input
                      type="number"
                      className="db-input-field"
                      value={dbData.liveMatch.team2?.score ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDbData(d => ({
                          ...d,
                          liveMatch: { ...d.liveMatch, team2: { ...d.liveMatch.team2, score: val } }
                        }));
                      }}
                    />
                  </div>

                  <div className="db-form-group">
                    <label>Mapa</label>
                    <input
                      type="text"
                      className="db-input-field"
                      value={dbData.liveMatch.map || 'Ascent'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDbData(d => ({
                          ...d,
                          liveMatch: { ...d.liveMatch, map: val }
                        }));
                      }}
                    />
                  </div>

                  <div className="db-form-group">
                    <label>Estado</label>
                    <select
                      className="db-input-field"
                      value={dbData.liveMatch.status || 'LIVE'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDbData(d => ({
                          ...d,
                          liveMatch: { ...d.liveMatch, status: val }
                        }));
                      }}
                    >
                      <option value="LIVE">LIVE (En Juego)</option>
                      <option value="WARMUP">WARMUP (Calentamiento)</option>
                      <option value="PAUSE">PAUSE (Pausa Táctica)</option>
                      <option value="ENDED">ENDED (Finalizado)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  No hay ningún partido activo en vivo en live-match.json.
                </div>
              )}

              <div className="db-form-actions">
                <button
                  type="button"
                  className="db-btn-save-all"
                  onClick={() => saveTableData('live-match', dbData.liveMatch)}
                >
                  <Save size={16} /> Guardar en live-match.json
                </button>
                <button
                  type="button"
                  className="db-btn-clear"
                  onClick={() => {
                    if (window.confirm('¿Limpiar y vaciar el partido en directo?')) {
                      saveTableData('live-match', null);
                    }
                  }}
                >
                  <Trash2 size={16} /> Limpiar Partido en Directo
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              5. AJUSTES WEB (web-settings.json)
              ========================================================= */}
          {activeTab === 'web-settings' && (
            <div className="db-simple-card">
              <h3 className="db-card-title">CONFIGURACIÓN GLOBAL DE LA WEB</h3>
              <p className="db-card-subtitle">
                Ajusta visibilidad de módulos, cupos y textos de la web pública.
              </p>

              <div className="db-form-grid">
                <div className="db-form-group">
                  <label>Fase del Torneo</label>
                  <select
                    className="db-input-field"
                    value={dbData.webSettings?.tournamentPhase || 'inscripciones'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDbData(d => ({
                        ...d,
                        webSettings: { ...d.webSettings, tournamentPhase: val }
                      }));
                    }}
                  >
                    <option value="inscripciones">Inscripciones Abiertas</option>
                    <option value="sorteo">Sorteo de Liga</option>
                    <option value="liga">Fase de Liga Regular</option>
                    <option value="playoffs">Playoffs / Fase Final</option>
                    <option value="final">Gran Final</option>
                  </select>
                </div>

                <div className="db-form-group">
                  <label>Jornada Activa</label>
                  <select
                    className="db-input-field"
                    value={dbData.webSettings?.activeMatchday || 'J1'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDbData(d => ({
                        ...d,
                        webSettings: { ...d.webSettings, activeMatchday: val }
                      }));
                    }}
                  >
                    <option value="J1">Jornada 1</option>
                    <option value="J2">Jornada 2</option>
                    <option value="J3">Jornada 3</option>
                    <option value="J4">Jornada 4</option>
                    <option value="ALL">Todas las Jornadas</option>
                  </select>
                </div>

                <div className="db-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Banner de Aviso en la Web</label>
                  <input
                    type="text"
                    className="db-input-field"
                    value={dbData.webSettings?.announcementBanner || ''}
                    placeholder="Texto opcional que aparecerá en la cabecera de la web..."
                    onChange={(e) => {
                      const val = e.target.value;
                      setDbData(d => ({
                        ...d,
                        webSettings: { ...d.webSettings, announcementBanner: val }
                      }));
                    }}
                  />
                </div>
              </div>

              <div className="db-form-actions">
                <button
                  type="button"
                  className="db-btn-save-all"
                  onClick={() => saveTableData('web-settings', dbData.webSettings)}
                >
                  <Save size={16} /> Guardar Ajustes en web-settings.json
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR / EDITAR EQUIPO */}
      {teamModal.isOpen && teamModal.team && (
        <div className="db-modal-backdrop" onClick={() => setTeamModal({ isOpen: false, isEditing: false, team: null })}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <h3>{teamModal.isEditing ? 'EDITAR EQUIPO' : 'AÑADIR NUEVO EQUIPO'}</h3>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setTeamModal({ isOpen: false, isEditing: false, team: null })}
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <div className="db-form-grid">
                <div className="db-form-group">
                  <label>Nombre del Equipo *</label>
                  <input
                    type="text"
                    className="db-input-field"
                    value={teamModal.team.name}
                    onChange={(e) => setTeamModal(m => ({ ...m, team: { ...m.team, name: e.target.value } }))}
                    placeholder="Ej: Nombre de la escuadra"
                  />
                </div>

                <div className="db-form-group">
                  <label>Grupo / Tier de Nivel</label>
                  <select
                    className="db-input-field"
                    value={teamModal.team.grupo || 'A'}
                    onChange={(e) => setTeamModal(m => ({ ...m, team: { ...m.team, grupo: e.target.value } }))}
                  >
                    <option value="A">Grupo A (Tier 1 - Cabezas de Serie)</option>
                    <option value="B">Grupo B (Tier 2 - Aspirantes Pro)</option>
                    <option value="C">Grupo C (Tier 3 - Intermedio)</option>
                    <option value="D">Grupo D (Tier 4 - Challengers)</option>
                  </select>
                </div>

                <div className="db-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Ruta o URL del Logo</label>
                  <input
                    type="text"
                    className="db-input-field"
                    value={teamModal.team.logo || ''}
                    onChange={(e) => setTeamModal(m => ({ ...m, team: { ...m.team, logo: e.target.value } }))}
                    placeholder="/logo1.png o https://..."
                  />
                </div>
              </div>

              {/* JUGADORES */}
              <div className="db-roster-editor-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 900, color: '#00f5d4', fontSize: '13px' }}>JUGADORES (ROSTER)</label>
                  <button
                    type="button"
                    className="db-btn-add-player"
                    onClick={() => {
                      const curPlayers = [...(teamModal.team.players || [])];
                      curPlayers.push({ name: '', rank: 'Plata', level: 50 });
                      setTeamModal(m => ({ ...m, team: { ...m.team, players: curPlayers } }));
                    }}
                  >
                    + Añadir Jugador
                  </button>
                </div>

                <div className="db-players-inputs-list">
                  {(teamModal.team.players || []).map((p, pIdx) => (
                    <div key={pIdx} className="db-player-input-row">
                      <span className="db-player-num">#{pIdx + 1}</span>
                      <input
                        type="text"
                        placeholder="Riot ID (Nombre#TAG)"
                        value={p.name || ''}
                        onChange={(e) => {
                          const curPlayers = [...teamModal.team.players];
                          curPlayers[pIdx].name = e.target.value;
                          setTeamModal(m => ({ ...m, team: { ...m.team, players: curPlayers } }));
                        }}
                        className="db-input-player-name"
                      />
                      <select
                        value={p.rank || 'Plata'}
                        onChange={(e) => {
                          const curPlayers = [...teamModal.team.players];
                          curPlayers[pIdx].rank = e.target.value;
                          setTeamModal(m => ({ ...m, team: { ...m.team, players: curPlayers } }));
                        }}
                        className="db-select-player-rank"
                      >
                        <option value="Hierro">Hierro</option>
                        <option value="Bronce">Bronce</option>
                        <option value="Plata">Plata</option>
                        <option value="Oro">Oro</option>
                        <option value="Platino">Platino</option>
                        <option value="Diamante">Diamante</option>
                        <option value="Ascendente">Ascendente</option>
                        <option value="Inmortal">Inmortal</option>
                        <option value="Radiante">Radiante</option>
                      </select>
                      <button
                        type="button"
                        className="db-btn-remove-player"
                        onClick={() => {
                          const curPlayers = teamModal.team.players.filter((_, i) => i !== pIdx);
                          setTeamModal(m => ({ ...m, team: { ...m.team, players: curPlayers } }));
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="db-modal-footer">
              <button
                type="button"
                className="db-btn-cancel"
                onClick={() => setTeamModal({ isOpen: false, isEditing: false, team: null })}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="db-btn-save-team"
                onClick={handleSaveTeamModal}
              >
                <Save size={15} /> Guardar Equipo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
