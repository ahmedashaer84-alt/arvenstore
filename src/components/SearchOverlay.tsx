import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = query.trim();
    onClose();
    navigate(cleaned ? `/shop?q=${encodeURIComponent(cleaned)}` : '/shop');
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t('البحث في المنتجات', 'Search products')}
      onClick={onClose}
    >
      <div
        className="modal-card glass-panel-strong"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h2 className="modal-title" style={{ margin: 0 }}>
            {t('البحث في متجر ARVEN', 'Search ARVEN Store')}
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label={t('إغلاق البحث', 'Close search')}
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="search-input-wrap">
            <Search size={18} className="search-input-icon" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              className="input search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('اكتب اسم المنتج...', 'Type a product name...')}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-glass btn-sm" onClick={onClose}>
              {t('إلغاء', 'Cancel')}
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {t('بحث', 'Search')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
