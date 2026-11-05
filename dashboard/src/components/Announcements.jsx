import { useState } from 'react';
import { Send, Info } from 'lucide-react';

import { apiFetch } from '../api';

export default function Announcements() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('#ff9900');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) return;

    setStatus({ type: 'loading', text: 'Enviando anuncio a Discord...' });
    try {
      const res = await apiFetch(`/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, color })
      });
      const data = await res.json();
      
      if (data.error) {
        setStatus({ type: 'error', text: data.error });
      } else {
        setStatus({ type: 'success', text: '¡Anuncio publicado correctamente en Discord!' });
        setTitle('');
        setMessage('');
        setTimeout(() => setStatus(null), 5000);
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Error de conexión con el bot local.' });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h2>Centro de Anuncios</h2>
        <p>Envía comunicados y actualizaciones oficiales con formato Embed al servidor de Discord.</p>
      </div>

      <div className="glass-card" style={{ padding: '40px' }}>
        {status && (
          <div style={{ 
            padding: '16px', 
            borderRadius: '8px',
            background: status.type === 'error' ? 'rgba(255, 70, 85, 0.1)' : 'rgba(0, 255, 136, 0.1)',
            border: `1px solid ${status.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
            color: status.type === 'error' ? 'var(--danger)' : 'var(--success)',
            marginBottom: '30px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <Info size={20} />
            {status.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título del Embed</label>
            <input 
              type="text" 
              className="premium-input" 
              placeholder="Ej: NUEVA JORNADA - LIGA PRIMATE"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Color de la Franja Lateral</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <input 
                type="color" 
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
              />
              <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                {color}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Contenido del Mensaje</label>
            <textarea 
              className="premium-input" 
              rows="10" 
              placeholder="Escribe el anuncio. Puedes usar negritas (**texto**), cursivas (*texto*), o menciones de Discord..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ resize: 'vertical', lineHeight: '1.6' }}
              required
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
            <button type="submit" className="btn-primary">
              <Send size={18} /> PUBLICAR AHORA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
