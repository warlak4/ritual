import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { useRequestRegistrationCodeMutation, useRegisterWithCodeMutation } from '../../api/hooks';
import { useAuthStore } from '../../store/authStore';
import styles from './auth.module.css';

function resolveRedirect(roles: string[]) {
  if (roles.includes('admin')) {
    return '/dashboard';
  }
  if (roles.includes('manager')) {
    return '/manager';
  }
  if (roles.includes('client') || (roles.includes('guest') && roles.length === 1)) {
    return '/store';
  }
  // По умолчанию для клиентов
  return '/store';
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const requestCodeMutation = useRequestRegistrationCodeMutation();
  const registerMutation = useRegisterWithCodeMutation();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [code, setCode] = useState('');

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await requestCodeMutation.mutateAsync({ phone: form.phone });
      if (response?.message) {
        setStep('code');
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
        setError(errorMessage || 'Не удалось запросить код. Проверьте подключение к серверу.');
      } else {
        setError('Не удалось запросить код. Попробуйте еще раз.');
      }
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await registerMutation.mutateAsync({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        code: code,
      });
      // Используем роли из authStore, так как они уже сохранены в onSuccess хука
      const roles = useAuthStore.getState().roles;
      navigate(resolveRedirect(roles.length > 0 ? roles : ['client']));
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Не удалось зарегистрироваться. Попробуйте еще раз.');
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <span className="brand-heading">{t('appName')}</span>
          <p>{t('tagline')}</p>
        </div>
        {step === 'form' ? (
          <form className={styles.form} onSubmit={handleRequestCode}>
            <h1>{t('auth.registerTitle')}</h1>
            {error ? <div className={styles.error}>{error}</div> : null}
            <div className={styles.row}>
              <label>
                {t('auth.firstName')}
                <input value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} required />
              </label>
              <label>
                {t('auth.lastName')}
                <input value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} required />
              </label>
            </div>
            <label>
              {t('auth.email')}
              <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
            </label>
            <label>
              Номер телефона
              <input 
                type="tel" 
                value={form.phone} 
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} 
                placeholder="+79991234567" 
                required 
              />
            </label>
            <label>
              {t('auth.password')}
              <input type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} required />
            </label>
            <button type="submit" disabled={requestCodeMutation.isPending}>
              {requestCodeMutation.isPending ? '...' : 'Запросить код'}
            </button>
            <p style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem', opacity: 0.9 }}>
              После нажатия откройте Telegram бота <strong>@RitualCode_bot</strong> и отправьте ваш номер телефона
            </p>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <h1>Введите код подтверждения</h1>
            {error ? <div className={styles.error}>{error}</div> : null}
            <p style={{ fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem', opacity: 0.9 }}>
              Откройте Telegram бота <strong>@RitualCode_bot</strong> и отправьте номер телефона <strong>{form.phone}</strong> для получения кода
            </p>
            <label>
              Код подтверждения
              <input type="text" value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" maxLength={6} required />
            </label>
            <button type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? '...' : 'Зарегистрироваться'}
            </button>
            <button type="button" onClick={() => setStep('form')} style={{ marginTop: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)' }}>
              Назад
            </button>
          </form>
        )}
        <p className={styles.switch}>
          {t('actions.login')}? <Link to="/login">{t('auth.loginTitle')}</Link>
        </p>
      </div>
    </div>
  );
}
