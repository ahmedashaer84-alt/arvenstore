import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CenteredSpinner } from './LoadingState';
import { useI18n } from '../lib/i18n';

/**
 * UI-level route guard backed by database-enforced `public.admin_users` check.
 * Note: Actual data security is enforced by PostgreSQL RLS & Storage RLS,
 * not solely by this UI guard.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="login-shell">
        <CenteredSpinner label={t('جاري التحقق من صلاحية الإدارة...', 'Verifying admin access...')} />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
