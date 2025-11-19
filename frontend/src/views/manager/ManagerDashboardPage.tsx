import { useTranslation } from 'react-i18next';
import { useOrdersQuery, useDashboardQuery } from '../../api/hooks';
import { StatCard } from '../../components/ui/StatCard';
import styles from './manager-dashboard.module.css';

export function ManagerDashboardPage() {
  const { t } = useTranslation();
  const { data: dashboard } = useDashboardQuery();
  const { data: orders } = useOrdersQuery({ limit: 10 });

  return (
    <div className={styles.wrapper}>
      <header>
        <h1 className="brand-heading">{t('manager.welcome', 'Панель менеджера')}</h1>
        <p>{t('manager.subtitle', 'Управление заказами и клиентами')}</p>
      </header>

      <section className="grid three">
        <StatCard
          title={t('manager.activeOrders', 'Активные заказы')}
          value={dashboard?.kpis.activeOrders ?? 0}
          icon="📋"
        />
        <StatCard
          title={t('manager.pendingOrders', 'Ожидающие обработки')}
          value={orders?.data?.filter((o: any) => o.status === 'pending').length ?? 0}
          icon="⏳"
        />
        <StatCard
          title={t('manager.totalRevenue', 'Общая выручка')}
          value={`${Intl.NumberFormat().format(dashboard?.kpis.totalRevenue ?? 0)} ₽`}
          icon="💰"
        />
      </section>

      <section className={styles.ordersSection}>
        <div className="card">
          <h2 className="brand-heading">{t('manager.recentOrders', 'Последние заказы')}</h2>
          <div className={styles.ordersList}>
            {orders?.data?.slice(0, 5).map((order: any) => (
              <div key={order.id} className={styles.orderItem}>
                <div>
                  <strong>{order.client?.fullName || 'Не указан'}</strong>
                  <span>{order.status}</span>
                </div>
                <div>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>{order.totalAmount ? `${order.totalAmount} ₽` : '-'}</span>
                </div>
              </div>
            )) ?? <p>{t('manager.noOrders', 'Нет заказов')}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

