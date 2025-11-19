import { useState, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { Navigation } from './Navigation';
import { TopBar } from './TopBar';
import { HotkeysLegend } from './HotkeysLegend';
import styles from './layout.module.css';

export function AppLayout() {
  const { i18n } = useTranslation();
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const [isHotkeysOpen, setHotkeysOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const storedRoles = useAuthStore((state) => state.roles);

  const activeRoles = useMemo(() => (user?.roles?.length ? user.roles : storedRoles), [user, storedRoles]);
  const isGuestOnly = activeRoles.includes('guest') && activeRoles.length === 1;

  useHotkeys('ctrl+shift+a', () => navigate('/analytics'), { enabled: !isGuestOnly });
  useHotkeys('ctrl+shift+o', () => navigate('/ceremonies'), { enabled: !isGuestOnly });
  useHotkeys('shift+l', () => {
    const next = i18n.language === 'ru' ? 'en' : 'ru';
    setLanguage(next as 'ru' | 'en');
  });
  useHotkeys('shift+t', () => toggleTheme());
  useHotkeys('ctrl+shift+h', () => setHotkeysOpen((prev) => !prev));

  return (
    <div className={styles.layout}>
      <Navigation onHotkeys={() => setHotkeysOpen(true)} />
      <div className={styles.content}>
        <TopBar onOpenHotkeys={() => setHotkeysOpen(true)} />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <HotkeysLegend open={isHotkeysOpen} onClose={() => setHotkeysOpen(false)} />
    </div>
  );
}
