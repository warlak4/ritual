import { useTranslation } from 'react-i18next';
import styles from './hotkeys.module.css';

interface HotkeysLegendProps {
  open: boolean;
  onClose: () => void;
}

const hotkeys = [
  { combo: 'Ctrl + N', key: 'hotkeys.newOrder' },
  { combo: 'Ctrl + F', key: 'hotkeys.search' },
  { combo: 'Shift + L', key: 'hotkeys.toggleLanguage' },
  { combo: 'Shift + T', key: 'hotkeys.toggleTheme' },
  { combo: 'Ctrl + S', key: 'hotkeys.saveSettings' },
  { combo: 'Ctrl + Shift + F', key: 'hotkeys.saveFilter' },
  { combo: 'Ctrl + Shift + A', key: 'hotkeys.openAnalytics' },
  { combo: 'Ctrl + Shift + O', key: 'hotkeys.openSchedule' }
];

export function HotkeysLegend({ open, onClose }: HotkeysLegendProps) {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>{t('hotkeys.title')}</h2>
          <button type="button" onClick={onClose}>
            ✕
          </button>
        </header>
        <ul>
          {hotkeys.map((hotkey) => (
            <li key={hotkey.combo}>
              <span className={styles.combo}>{hotkey.combo}</span>
              <span>{t(hotkey.key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

