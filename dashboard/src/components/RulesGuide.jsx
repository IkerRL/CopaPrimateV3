import { useState } from 'react';
import { 
  Shield, Scale, GitCompareArrows, AlertTriangle, CheckCircle, 
  UserCheck, Terminal, HelpCircle, Copy, Check, BookOpen
} from 'lucide-react';

export default function RulesGuide() {
  const [copiedCmd, setCopiedCmd] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,179,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <h2>Guía de Reglas & Protocolos de Moderación</h2>
            <p>Manual oficial de referencia rápida para el equipo de moderadores y árbitros de la Copa Primate.</p>
          </div>
        </div>
      </div>

      {/* Grid de Principios Clave */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Límite de 16 Puntos */}
        <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Scale size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Límite de Elo (16.0 Pts)</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            El valor total del trío titular <strong>no puede exceder los 16.0 puntos</strong>.
            La puntuación de cada jugador se calcula como la media aritmética entre su rango actual y su peak histórico:
          </p>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', margin: '14px 0', fontSize: '13px', color: '#ffb300', fontFamily: 'monospace' }}>
            Pts Jugador = (Pts Rango Actual + Pts Peak) / 2
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            ⚠️ Excepción: Solo el Head Mod o Administrador puede conceder un permiso de overlimit bajo circunstancias especiales.
          </small>
        </div>

        {/* Brecha de Tiers */}
        <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <GitCompareArrows size={20} color="var(--success)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Brecha Máxima (4 Tiers)</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            No puede existir una diferencia superior a <strong>4 Tiers</strong> entre el jugador de mayor rango y el de menor rango del trío titular.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', margin: '14px 0', fontSize: '12px', color: '#fff' }}>
            ✅ <strong>Ejemplo permitido:</strong> Diamante (Tier 6) y Bronce (Tier 2) &rarr; Diferencia de 4 tiers.<br />
            ❌ <strong>Ejemplo no permitido:</strong> Ascendente (Tier 7) y Bronce (Tier 2) &rarr; Diferencia de 5 tiers.
          </div>
        </div>

        {/* Cuentas & Anti-Smurf */}
        <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Shield size={20} color="var(--danger)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Requisito Anti-Smurf (+40 Nv)</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Todas las cuentas vinculadas deben ser <strong>nivel 40 o superior</strong> en Valorant sin excepción.
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', margin: '12px 0 0' }}>
            <li>Revisar siempre el enlace de <code>tracker.gg</code> facilitado en el ticket.</li>
            <li>Si el tracker está en privado, exigir al capitán que inicie sesión y lo haga público.</li>
            <li>Cuentas con menos de 20 partidas competitivas registradas deben ser auditadas.</li>
          </ul>
        </div>
      </div>

      {/* Tabla de Puntos por Rango */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px' }}>Tabla Oficial de Puntuaciones por Rango</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
          {[
            { rank: 'Hierro', pts: 1, color: '#7d7d7d', tier: 1 },
            { rank: 'Bronce', pts: 2, color: '#b0773e', tier: 2 },
            { rank: 'Plata', pts: 3, color: '#c4cdd3', tier: 3 },
            { rank: 'Oro', pts: 4, color: '#f0c43c', tier: 4 },
            { rank: 'Platino', pts: 5, color: '#3fd2c7', tier: 5 },
            { rank: 'Diamante', pts: 6, color: '#c88cf0', tier: 6 },
            { rank: 'Ascendente', pts: 7, color: '#3ecf8e', tier: 7 },
            { rank: 'Inmortal+', pts: 8, color: '#ff4f6d', tier: 8 },
          ].map((item) => (
            <div
              key={item.rank}
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '14px',
                borderRadius: '8px',
                borderLeft: `3px solid ${item.color}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{item.rank}</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: item.color, margin: '6px 0' }}>{item.pts} pt{item.pts > 1 ? 's' : ''}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tier {item.tier}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Protocolo Paso a Paso para Tickets */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px' }}>Protocolo Paso a Paso en Tickets de Inscripción</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            {
              step: '1',
              title: 'Recepción del Ticket',
              desc: 'Comprobar que el capitán envía los nombres exactos y enlaces de tracker.gg de los 3 titulares (y 1 suplente si aplica).'
            },
            {
              step: '2',
              title: 'Extracción & Verificación Automática',
              desc: 'Usa el botón "Extraer Equipo" en la pestaña de Tickets para que el bot audite niveles y elos automáticamente.'
            },
            {
              step: '3',
              title: 'Aprobación o Petición de Cambios',
              desc: 'Si cumple las 3 condiciones (<=16 pts, <=4 tiers, nv >=40), aprueba el roster. Si no, notifica al capitán qué jugador debe ser reemplazado.'
            },
            {
              step: '4',
              title: 'Cierre del Ticket',
              desc: 'Una vez asignado el rol y confirmado el equipo en la base de datos, procede a cerrar el ticket con un mensaje cordial.'
            }
          ].map((s) => (
            <div key={s.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,179,0,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                {s.step}
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: '15px' }}>{s.title}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comandos Rápidos del Bot */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Terminal size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '18px', color: '#fff', margin: 0 }}>Comandos Útiles de Discord para Moderadores</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {[
            { cmd: '/ticket close', desc: 'Cierra el canal de ticket actual tras archivar el log' },
            { cmd: '/anuncio', desc: 'Envía un mensaje oficial con formato Embed al canal de anuncios' },
            { cmd: '/elo', desc: 'Consulta el rango y peak en Riot Games de un Riot ID' },
            { cmd: '/sorteo', desc: 'Muestra la distribución de grupos actual en el servidor' },
          ].map((c) => (
            <div
              key={c.cmd}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.3)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div>
                <code style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '13px' }}>{c.cmd}</code>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.desc}</div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(c.cmd, c.cmd)}
                style={{ background: 'transparent', border: 'none', color: copiedCmd === c.cmd ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                title="Copiar comando"
              >
                {copiedCmd === c.cmd ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

