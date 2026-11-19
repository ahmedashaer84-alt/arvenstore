import { useEffect } from 'react';
import { useI18n } from '../lib/i18n';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  busy = false,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        className="modal-card glass-panel-strong"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="modal-title">
          {title}
        </h2>
        <p className="modal-body">{description}</p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-glass btn-sm"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel ?? t('إلغاء', 'Cancel')}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <span className="spinner" />}
            <span>{confirmLabel ?? t('تأكيد', 'Confirm')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
