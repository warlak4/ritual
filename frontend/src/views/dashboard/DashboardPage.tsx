import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { useDashboardQuery, useOrdersQuery, type Order } from '../../api/hooks';
import { StatCard } from '../../components/ui/StatCard';
import styles from './dashboard.module.css';

const COLORS = ['#1b2a41', '#415a77', '#b38b59', '#6b7280'];

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: dashboard } = useDashboardQuery();
  const { data: orders } = useOrdersQuery({ limit: 5 });

  const orderDistribution = useMemo(() => {
    if (!orders?.data) return [];
    const groups: Record<string, number> = {};
    orders.data.forEach((order: Order) => {
      groups[order.status] = (groups[order.status] ?? 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [orders]);

  return (
    <div className={styles.wrapper}>
      <header>
        <h1 className="brand-heading">{t('dashboard.welcome', { name: dashboard?.activeOrders?.[0]?.client?.fullName ?? '' })}</h1>
        <p>{t('tagline')}</p>
      </header>

      <section className="grid three">
        <StatCard
          title={t('dashboard.activeOrders')}
          value={dashboard?.kpis.activeOrders ?? 0}
          icon="🗂️"
          trend={{ value: 8, label: 'vs last week' }}
        />
        <StatCard
          title={t('dashboard.completedOrders')}
          value={dashboard?.kpis.completedOrders ?? 0}
          icon="✅"
          trend={{ value: 5, label: 'vs last month' }}
        />
        <StatCard
          title={t('dashboard.totalRevenue')}
          value={`${Intl.NumberFormat().format(dashboard?.kpis.totalRevenue ?? 0)} ₽`}
          icon="💠"
          trend={{ value: 12, label: 'vs last month' }}
        />
      </section>

      <section className={styles.analytics}>
        <div className="card">
          <h2 className="brand-heading">{t('dashboard.revenueTrend')}</h2>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dashboard?.financial ?? []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b2a41" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#1b2a41" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
                <XAxis dataKey="contractNumber" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="amountPaid" stroke="#1b2a41" fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 className="brand-heading">{t('dashboard.ordersByStatus')}</h2>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie dataKey="value" data={orderDistribution} innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {orderDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className={styles.columns}>
        <div className="card">
          <h2 className="brand-heading">{t('dashboard.scheduleOverview')}</h2>
          <ul className={styles.list}>
            {dashboard?.activeOrders?.slice(0, 4).map((order) => (
              <li key={order.id}>
                <div>
                  <strong>{order.deceased?.fullName}</strong>
                  <span>{order.client?.fullName}</span>
                </div>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="brand-heading">{t('dashboard.inventoryPressure')}</h2>
          <ul className={styles.list}>
            {dashboard?.inventoryPressure?.slice(0, 5).map((item) => (
              <li key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                </div>
                <span>{Math.round(item.load * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

