import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, Store } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { isSupabaseConfigured } from '../../lib/supabase';
import { signInAdmin } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export function AdminLoginPage() {
  const { t } = useI18n();
  const { user, isAdmin, loading, refreshAuth } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (!isSupabaseConfigured) {
      setError(
        t(
          'إعدادات Supabase غير مضبوطة. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY أولًا.',
          'Supabase environment variables are not configured.'
        )
      );
      return;
    }

    if (!email.trim() || !password) {
      setError(
        t('يرجى إدخال البريد الإلكتروني وكلمة المرور.', 'Please enter your email and password.')
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signInAdmin(email, password);
      await refreshAuth();
      showToast(t('مرحبًا بك في لوحة إدارة ARVEN.', 'Welcome to ARVEN Admin.'), 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('تعذر تسجيل الدخول.', 'Unable to sign in.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card glass-panel-strong">
        <div style={{ textAlign: 'center' }}>
          <div className="arven-wordmark" style={{ fontSize: '1.5rem', marginBottom: 6 }}>
            ARVEN
          </div>
          <span className="badge badge-champagne">
            <Lock size={13} aria-hidden="true" />
            <span>{t('دخول الإدارة المحمي', 'Protected Admin Sign-In')}</span>
          </span>
        </div>

        {!isSupabaseConfigured && (
          <div className="disclosure-note" role="alert">
            {t(
              'تنبيه: لم يتم ضبط متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY بعد.',
              'Notice: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not configured yet.'
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: '11px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field-group">
            <label htmlFor="admin-email" className="field-label">
              {t('البريد الإداري', 'Admin Email')}
            </label>
            <input
              id="admin-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ahmedashaer84@gmail.com"
            />
          </div>

          <div className="field-group">
            <label htmlFor="admin-password" className="field-label">
              {t('كلمة المرور', 'Password')}
            </label>
            <input
              id="admin-password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
            style={{ marginTop: 4 }}
          >
            {submitting && <span className="spinner" />}
            <span>{submitting ? t('جاري التحقق...', 'Signing in...') : t('تسجيل الدخول', 'Sign In')}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', paddingTop: 6 }}>
          <Link to="/" className="btn btn-ghost btn-sm">
            <Store size={15} aria-hidden="true" />
            <span>{t('العودة إلى المتجر العام', 'Return to Storefront')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
