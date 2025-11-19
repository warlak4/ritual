import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useProfileQuery } from '../../api/hooks';
import styles from './profile.module.css';

export function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: profile, isLoading } = useProfileQuery();

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.placeholder}>{t('profile.loading', 'Загрузка...')}</div>
      </div>
    );
  }

  const displayUser = profile || user;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className="brand-heading">{t('profile.title', 'Профиль')}</h1>
        <p>{t('profile.subtitle', 'Управление личными данными')}</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>{t('profile.personalInfo', 'Личная информация')}</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>{t('profile.firstName', 'Имя')}</label>
              <div className={styles.value}>{displayUser?.firstName || '-'}</div>
            </div>
            <div className={styles.infoItem}>
              <label>{t('profile.lastName', 'Фамилия')}</label>
              <div className={styles.value}>{displayUser?.lastName || '-'}</div>
            </div>
            <div className={styles.infoItem}>
              <label>{t('profile.email', 'Электронная почта')}</label>
              <div className={styles.value}>{displayUser?.email || '-'}</div>
            </div>
            <div className={styles.infoItem}>
              <label>{t('profile.phone', 'Телефон')}</label>
              <div className={styles.value}>{profile?.phone || '-'}</div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>{t('profile.roles', 'Роли')}</h2>
          <div className={styles.roles}>
            {displayUser?.roles?.map((role: string) => (
              <span key={role} className={styles.roleBadge}>
                {String(t(`roles.${role}`, role))}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>{t('profile.account', 'Аккаунт')}</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>{t('profile.userId', 'ID пользователя')}</label>
              <div className={styles.value}>{displayUser?.id || '-'}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

