import { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = '¿Confirmar acción?',
  message = '¿Estás seguro de que deseas continuar con esta operación?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmStyle = 'danger',
  onConfirm,
  onCancel,
}) {
  const modalRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus the confirm button on open
    setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getStyleProps = () => {
    switch (confirmStyle) {
      case 'danger':
        return {
          icon: <AlertTriangle size={28} color="#ff4655" />,
          btnBg: 'linear-gradient(135deg, #ff4655 0%, #b91c1c 100%)',
          btnBorder: '1px solid #ff4655',
          glow: 'rgba(255, 70, 85, 0.4)',
        };
      case 'warning':
        return {
          icon: <AlertCircle size={28} color="#c084fc" />,
          btnBg: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
          btnBorder: '1px solid #c084fc',
          glow: 'rgba(192, 132, 252, 0.4)',
        };
      case 'success':
      case 'primary':
      default:
        return {
          icon: <CheckCircle2 size={28} color="#00f5d4" />,
          btnBg: 'linear-gradient(135deg, #00f5d4 0%, #0d9488 100%)',
          btnBorder: '1px solid #00f5d4',
          glow: 'rgba(0, 245, 212, 0.4)',
        };
    }
  };

  const styleConfig = getStyleProps();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 8, 11, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
        animation: 'modalBackdropFade 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <style>{`
        @keyframes modalBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalCardScale {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        ref={modalRef}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 25, 35, 0.98) 0%, rgba(8, 8, 11, 0.98) 100%)',
          border: '1.5px solid rgba(192, 132, 252, 0.35)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          padding: '28px 24px 22px',
          boxShadow: `0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px ${styleConfig.glow}`,
          position: 'relative',
          animation: 'modalCardScale 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#ffffff',
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.2s, background 0.2s',
          }}
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {styleConfig.icon}
          </div>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <h3
              id="confirm-modal-title"
              style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '0.5px',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'rgba(255, 255, 255, 0.75)',
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => {
              onConfirm?.();
            }}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              background: styleConfig.btnBg,
              border: styleConfig.btnBorder,
              color: confirmStyle === 'primary' || confirmStyle === 'success' ? '#08080b' : '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${styleConfig.glow}`,
              letterSpacing: '0.5px',
              transition: 'transform 0.15s, filter 0.2s',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
