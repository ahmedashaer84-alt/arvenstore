import { WifiOff, RefreshCw } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useI18n();
  return (
    <div className="state-card glass-panel" role="alert">
      <WifiOff size={30} strokeWidth={1.5} color="var(--color-danger)" aria-hidden="true" />
      <h3>{title ?? t('توجد مشكلة في الاتصال', 'Connection issue')}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-glass btn-sm" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" />
          <span>{t('إعادة المحاولة', 'Try Again')}</span>
        </button>
      )}
    </div>
  );
}
