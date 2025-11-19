import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCatalogQuery, type CatalogService } from '../../api/hooks';
import styles from './store.module.css';

function formatCurrency(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${currency}`;
  }
}

export function StorePage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useCatalogQuery();

  const packages = useMemo(() => data?.packages ?? [], [data]);
  const services = useMemo(() => data?.services ?? [], [data]);

  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU';

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className="brand-heading">{t('store.title')}</h1>
        <p>{t('store.subtitle')}</p>
      </header>

      <section>
        <div className={styles.sectionTitle}>
          <h2>{t('store.packages')}</h2>
        </div>
        {isLoading ? (
          <div className={styles.placeholder}>{t('store.loading')}</div>
        ) : packages.length === 0 ? (
          <div className={styles.placeholder}>{t('store.emptyPackages')}</div>
        ) : (
          <div className={styles.grid}>
            {packages.map((pkg) => (
              <article key={pkg.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{pkg.nameRu}</h3>
                  <span className={styles.price}>{formatCurrency(pkg.basePrice, pkg.currency, locale)}</span>
                </div>
                <ul className={styles.list}>
                  {pkg.services.map((item) => (
                    <li key={item.service.id}>
                      <strong>{item.service.nameRu}</strong>
                      <span>
                        {item.quantity} Г— {formatCurrency(item.service.basePrice, pkg.currency, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className={styles.sectionTitle}>
          <h2>{t('store.services')}</h2>
        </div>
        {isLoading ? (
          <div className={styles.placeholder}>{t('store.loading')}</div>
        ) : services.length === 0 ? (
          <div className={styles.placeholder}>{t('store.emptyServices')}</div>
        ) : (
          <div className={styles.servicesGrid}>
            {services.map((svc: CatalogService) => (
              <article key={svc.id} className={styles.serviceCard}>
                <h3>{svc.nameRu}</h3>
                <p className={styles.serviceDescription}>{svc.descriptionRu ?? t('store.noDescription')}</p>
                <span className={styles.price}>{formatCurrency(svc.basePrice, svc.currency, locale)}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
