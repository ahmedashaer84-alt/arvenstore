import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item glass-panel-strong toast-${toast.variant}`}
          role={toast.variant === 'error' ? 'alert' : 'status'}
        >
          {toast.variant === 'success' && (
            <CheckCircle2 size={18} color="var(--color-success)" aria-hidden="true" />
          )}
          {toast.variant === 'error' && (
            <AlertTriangle size={18} color="var(--color-danger)" aria-hidden="true" />
          )}
          {toast.variant === 'info' && (
            <Info size={18} color="var(--color-champagne)" aria-hidden="true" />
          )}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--color-warm-gray)',
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
