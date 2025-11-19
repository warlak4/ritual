import { type FormEvent, useState } from 'react';
import { useNavigate, useLocation, Link, type Location } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { useLoginMutation } from '../../api/hooks';
import styles from './auth.module.css';

function resolveRedirect(roles: string[], fallbackFrom?: string) {
  const isGuestOnly = roles.includes('guest') && roles.length === 1;
  const fallback = isGuestOnly ? '/catalog' : '/dashboard';
  if (!fallbackFrom) {
    return fallback;
  }
  if (isGuestOnly && !fallbackFrom.startsWith('/catalog')) {
    return fallback;
  }
  return fallbackFrom;
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const data = await loginMutation.mutateAsync({ email, password });
      const roles: string[] = data.roles ?? [];
      const from = (location.state as { from?: Location })?.from?.pathname;
      navigate(resolveRedirect(roles, from), { replace: true });
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹РїРѕР»РЅРёС‚СЊ РІС…РѕРґ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.');
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
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1>{t('auth.loginTitle')}</h1>
          {error ? <div className={styles.error}>{error}</div> : null}
          <label>
            {t('auth.email')}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
          </label>
          <label>
            {t('auth.password')}
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? '...' : t('actions.login')}
          </button>
        </form>
        <p className={styles.switch}>
          {t('actions.register')}? <Link to="/register">{t('auth.registerTitle')}</Link>
        </p>
      </div>
    </div>
  );
}
