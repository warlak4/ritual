import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useCartStore } from '../../store/cartStore';
import { useNavigate } from 'react-router-dom';
import styles from './topbar.module.css';

interface TopBarProps {
  onOpenHotkeys?: () => void;
}

export function TopBar({ onOpenHotkeys }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const logout = useAuthStore((state) => state.logout);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const navigate = useNavigate();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const user = useAuthStore((state) => state.user);
  const storedRoles = useAuthStore((state) => state.roles);
  const activeRoles = user?.roles?.length ? user.roles : storedRoles;
  const isClient = activeRoles.includes('client') && !activeRoles.includes('admin') && !activeRoles.includes('manager');

  useHotkeys('ctrl+f', (event) => {
    event.preventDefault();
    const input = document.getElementById('toolbar-search') as HTMLInputElement | null;
    input?.focus();
  });

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/orders?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className={styles.topbar}>
      <form className={styles.search} onSubmit={handleSearch}>
        <input
          id="toolbar-search"
          type="search"
          placeholder={`${t('actions.search')}…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>

      <div className={styles.actions}>
        {isClient && (
          <Link to="/cart" className={styles.cartButton} title={t('navigation.cart')}>
            🛒
            {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount}</span>}
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            const next = i18n.language === 'ru' ? 'en' : 'ru';
            setLanguage(next as 'ru' | 'en');
          }}
          className={styles.iconButton}
          title="Language"
        >
          🌐
        </button>
        <button type="button" onClick={toggleTheme} className={styles.iconButton} title="Theme">
          🌗
        </button>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className={styles.logout}
        >
          {t('actions.logout')}
        </button>
      </div>
    </header>
  );
}

