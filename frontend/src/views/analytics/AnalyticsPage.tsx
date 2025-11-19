import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { useAnalyticsOrdersQuery, useAnalyticsFinancialQuery, useAnalyticsInventoryQuery } from '../../api/hooks';
import styles from './analytics.module.css';

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { data: orders } = useAnalyticsOrdersQuery();
  const { data: financial } = useAnalyticsFinancialQuery();
  const { data: inventory } = useAnalyticsInventoryQuery();

  return (
    <div className={styles.wrapper}>
      <header>
        <h1 className="brand-heading">{t('analytics.title')}</h1>
        <p>{t('tagline')}</p>
      </header>

      <section className={styles.grid}>
        <div className="card">
          <h2 className="brand-heading">{t('analytics.ordersChart')}</h2>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orders ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalAmount" fill="#1b2a41" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 className="brand-heading">{t('analytics.revenueChart')}</h2>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financial ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis dataKey="contractNumber" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amountPaid" stroke="#b38b59" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 className="brand-heading">{t('analytics.inventoryChart')}</h2>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventory ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookedUpcoming" stackId="a" fill="#415a77" />
                <Bar dataKey="bookedPast" stackId="a" fill="#b38b59" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

