import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCatalogQuery, type CatalogService, useProfileQuery, useSyncCartMutation } from '../../api/hooks';
import { useCartStore } from '../../store/cartStore';
import { SearchBar } from '../../components/ui/SearchBar';
import styles from './client-store.module.css';

// Конвертация валюты: RUB -> USD (примерно 1 USD = 100 RUB)
const RUB_TO_USD_RATE = 100;

function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === 'RUB' && toCurrency === 'USD') {
    return amount / RUB_TO_USD_RATE;
  }
  if (fromCurrency === 'USD' && toCurrency === 'RUB') {
    return amount * RUB_TO_USD_RATE;
  }
  return amount;
}

function formatCurrency(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${currency}`;
  }
}

export function ClientStorePage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useCatalogQuery();
  const { items, getTotal } = useCartStore();
  const addToCart = useCartStore((state) => state.addItem);
  const { data: profile } = useProfileQuery();
  const syncCartMutation = useSyncCartMutation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'packages' | 'services'>('all');

  const packages = useMemo(() => data?.packages ?? [], [data]);
  const services = useMemo(() => data?.services ?? [], [data]);

  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU';
  const isEnglish = i18n.language === 'en';
  const displayCurrency = isEnglish ? 'USD' : 'RUB';

  const filteredPackages = useMemo(() => {
    if (!searchQuery) return packages;
    const query = searchQuery.toLowerCase();
    return packages.filter(
      (pkg) => {
        const name = isEnglish ? (pkg.nameEn || pkg.nameRu) : pkg.nameRu;
        return (
          name?.toLowerCase().includes(query) ||
          pkg.services?.some((s) => {
            const serviceName = isEnglish ? (s.service.nameEn || s.service.nameRu) : s.service.nameRu;
            return serviceName?.toLowerCase().includes(query);
          })
        );
      }
    );
  }, [packages, searchQuery, isEnglish]);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    const query = searchQuery.toLowerCase();
    return services.filter(
      (svc) => {
        const name = isEnglish ? (svc.nameEn || svc.nameRu) : svc.nameRu;
        const description = isEnglish ? (svc.descriptionEn || svc.descriptionRu) : svc.descriptionRu;
        return name?.toLowerCase().includes(query) || description?.toLowerCase().includes(query);
      }
    );
  }, [services, searchQuery, isEnglish]);

  const handleAddToCart = (item: { id: string; name: string; price: number; currency: string; description?: string }, type: 'package' | 'service') => {
    addToCart({
      id: item.id,
      name: item.name,
      type,
      price: item.price,
      currency: item.currency,
      description: item.description,
    });
  };

  // Синхронизируем корзину с ботом при изменении
  useEffect(() => {
    if (profile?.phone && items.length > 0) {
      const total = getTotal();
      const currency = items[0]?.currency || 'RUB';
      const timeoutId = setTimeout(() => {
        syncCartMutation.mutate({
          phone: profile.phone,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            price: item.price,
            currency: item.currency,
            description: item.description,
          })),
          total,
          currency,
        });
      }, 500); // Задержка для избежания слишком частых запросов
      
      return () => clearTimeout(timeoutId);
    }
  }, [items, profile?.phone]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className="brand-heading">{t('client.store.title', 'Каталог услуг')}</h1>
        <p>{t('client.store.subtitle', 'Выберите услуги для заказа')}</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          <button
            className={activeTab === 'all' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('all')}
          >
            {t('client.store.all', 'Все')}
          </button>
          <button
            className={activeTab === 'packages' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('packages')}
          >
            {t('client.store.packages', 'Пакеты')}
          </button>
          <button
            className={activeTab === 'services' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('services')}
          >
            {t('client.store.services', 'Услуги')}
          </button>
        </div>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('client.store.searchPlaceholder', 'Поиск услуг и товаров...')}
          className={styles.search}
        />
      </div>

      {(activeTab === 'all' || activeTab === 'packages') && (
        <section>
          <div className={styles.sectionTitle}>
            <h2>{t('client.store.packages', 'Пакеты услуг')}</h2>
          </div>
          {isLoading ? (
            <div className={styles.placeholder}>{t('client.store.loading', 'Загрузка...')}</div>
          ) : filteredPackages.length === 0 ? (
            <div className={styles.placeholder}>{t('client.store.emptyPackages', 'Нет доступных пакетов')}</div>
          ) : (
            <div className={styles.grid}>
              {filteredPackages.map((pkg) => {
                const packageName = isEnglish ? (pkg.nameEn || pkg.nameRu) : pkg.nameRu;
                const packagePrice = convertCurrency(pkg.basePrice, pkg.currency, displayCurrency);
                const packageDescription = t('client.store.packageDescription', {
                  count: pkg.services.length,
                  defaultValue: isEnglish
                    ? `Package of ${pkg.services.length} services`
                    : `Пакет из ${pkg.services.length} услуг`,
                });
                return (
                  <article key={pkg.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3>{packageName}</h3>
                      <span className={styles.price}>{formatCurrency(packagePrice, displayCurrency, locale)}</span>
                    </div>
                    <ul className={styles.list}>
                      {pkg.services.map((item) => {
                        const serviceName = isEnglish ? (item.service.nameEn || item.service.nameRu) : item.service.nameRu;
                        const servicePrice = convertCurrency(item.service.basePrice, pkg.currency, displayCurrency);
                        return (
                          <li key={item.service.id}>
                            <strong>{serviceName}</strong>
                            <span>
                              {item.quantity} × {formatCurrency(servicePrice, displayCurrency, locale)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <button
                      className={styles.orderButton}
                      onClick={() =>
                        handleAddToCart(
                          {
                            id: pkg.id,
                            name: packageName,
                            price: packagePrice,
                            currency: displayCurrency,
                            description: packageDescription,
                          },
                          'package'
                        )
                      }
                    >
                      {t('client.store.addToCart', 'В корзину')}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {(activeTab === 'all' || activeTab === 'services') && (
        <section>
          <div className={styles.sectionTitle}>
            <h2>{t('client.store.services', 'Отдельные услуги')}</h2>
          </div>
          {isLoading ? (
            <div className={styles.placeholder}>{t('client.store.loading', 'Загрузка...')}</div>
          ) : filteredServices.length === 0 ? (
            <div className={styles.placeholder}>{t('client.store.emptyServices', 'Нет доступных услуг')}</div>
          ) : (
            <div className={styles.servicesGrid}>
              {filteredServices.map((svc: CatalogService) => {
                const serviceName = isEnglish ? (svc.nameEn || svc.nameRu) : svc.nameRu;
                const serviceDescription = isEnglish
                  ? (svc.descriptionEn || svc.descriptionRu)
                  : svc.descriptionRu;
                const servicePrice = convertCurrency(svc.basePrice, svc.currency, displayCurrency);
                return (
                  <article key={svc.id} className={styles.serviceCard}>
                    <h3>{serviceName}</h3>
                    <p className={styles.serviceDescription}>
                      {serviceDescription ?? t('client.store.noDescription', 'Нет описания')}
                    </p>
                    <div className={styles.serviceFooter}>
                      <span className={styles.price}>{formatCurrency(servicePrice, displayCurrency, locale)}</span>
                      <button
                        className={styles.orderButton}
                        onClick={() =>
                          handleAddToCart(
                            {
                              id: svc.id,
                              name: serviceName,
                              price: servicePrice,
                              currency: displayCurrency,
                              description: serviceDescription ?? undefined,
                            },
                            'service'
                          )
                        }
                      >
                        {t('client.store.addToCart', 'В корзину')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

