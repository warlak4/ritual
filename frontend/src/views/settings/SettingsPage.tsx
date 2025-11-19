import { type FormEvent, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSettingsQuery, useUpdateSettingsMutation } from '../../api/hooks';
import { useSettingsStore } from '../../store/settingsStore';
import styles from './settings.module.css';

export function SettingsPage() {
  const { t } = useTranslation();
  const { data } = useSettingsQuery();
  const updateMutation = useUpdateSettingsMutation();
  const { theme, language, dateFormat, numberFormat, pageSize, setTheme, setLanguage, updateSettings } = useSettingsStore();
  const [form, setForm] = useState({
    theme,
    language,
    dateFormat,
    numberFormat,
    pageSize,
  });

  useEffect(() => {
    if (data) {
      setForm({
        theme,
        language,
        dateFormat: data.dateFormat ?? dateFormat,
        numberFormat: data.numberFormat ?? numberFormat,
        pageSize: data.pageSize ?? pageSize,
      });
    }
  }, [data, theme, language, dateFormat, numberFormat, pageSize]);

  const submit = () => {
    updateSettings(form);
    setTheme(form.theme);
    setLanguage(form.language as 'ru' | 'en');
    updateMutation.mutate(form);
  };

  useHotkeys(
    'ctrl+s',
    (event) => {
      event.preventDefault();
      submit();
    },
    { enableOnFormTags: true },
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  return (
    <div className={styles.wrapper}>
      <header>
        <h1 className="brand-heading">{t('settings.title')}</h1>
        <p>{t('tagline')}</p>
      </header>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          {t('settings.theme')}
          <select value={form.theme} onChange={(event) => setForm((prev) => ({ ...prev, theme: event.target.value as 'light' | 'dark' }))}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          {t('settings.language')}
          <select value={form.language} onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value as 'ru' | 'en' }))}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          {t('settings.dateFormat')}
          <input value={form.dateFormat} onChange={(event) => setForm((prev) => ({ ...prev, dateFormat: event.target.value }))} />
        </label>
        <label>
          {t('settings.numberFormat')}
          <input value={form.numberFormat} onChange={(event) => setForm((prev) => ({ ...prev, numberFormat: event.target.value }))} />
        </label>
        <label>
          {t('settings.pageSize')}
          <input
            type="number"
            min={5}
            max={100}
            value={form.pageSize}
            onChange={(event) => setForm((prev) => ({ ...prev, pageSize: Number(event.target.value) }))}
          />
        </label>
        <button type="submit" className={styles.primary} disabled={updateMutation.isPending}>
          {t('actions.save')}
        </button>
      </form>
    </div>
  );
}

