import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './search-bar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder, className }: SearchBarProps) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      <input
        type="text"
        className={styles.input}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder || t('search.placeholder', 'Поиск...')}
      />
      {localValue && (
        <button type="button" className={styles.clearButton} onClick={handleClear} aria-label="Clear">
          ×
        </button>
      )}
      <span className={styles.icon}>🔍</span>
    </div>
  );
}

