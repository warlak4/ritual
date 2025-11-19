import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { useOrdersQuery, useClientsQuery, useCatalogQuery, useCreateOrderMutation, type Client, type ServicePackage, type Order } from '../../api/hooks';
import { StatCard } from '../../components/ui/StatCard';
import styles from './orders.module.css';

export function OrdersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [isModalOpen, setModalOpen] = useState(false);
  const { data: ordersData, isFetching } = useOrdersQuery({ page, limit: 10 });
  const { data: clients } = useClientsQuery({ limit: 50 });
  const { data: catalog } = useCatalogQuery();
  const createOrderMutation = useCreateOrderMutation();

  useHotkeys('ctrl+n', (event) => {
    event.preventDefault();
    setModalOpen(true);
  });

  const packages = useMemo(() => (catalog?.packages ?? []) as ServicePackage[], [catalog?.packages]);
  const [form, setForm] = useState({
    clientId: '',
    deceasedId: '',
    packageId: '',
    currency: 'RUB',
  });

  const serviceLines = useMemo<
    Array<{ serviceId: string; name: string; quantity: number; unitPrice: number; discount: number }>
  >(() => {
    const pkg = packages.find((item) => item.id === form.packageId);
    if (!pkg) return [];
    return pkg.services?.map((entry) => ({
      serviceId: entry.service.id,
      name: entry.service.nameRu,
      quantity: entry.quantity ?? 1,
      unitPrice: entry.service.basePrice,
      discount: 0,
    }));
  }, [packages, form.packageId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.clientId || !form.deceasedId || serviceLines.length === 0) {
      return;
    }
    await createOrderMutation.mutateAsync({
      clientId: form.clientId,
      deceasedId: form.deceasedId,
      packageId: form.packageId,
      currency: form.currency,
      services: serviceLines.map((line) => ({
        serviceId: line.serviceId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
      })),
    });
    setModalOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h1 className="brand-heading">{t('orders.title')}</h1>
          <p>{t('tagline')}</p>
        </div>
        <button className={styles.primary} type="button" onClick={() => setModalOpen(true)}>
          {t('actions.newOrder')}
        </button>
      </header>

      <section className="grid two">
        <StatCard title={t('orders.list')} value={ordersData?.total ?? 0} icon="🗂️" />
        <StatCard
          title={t('dashboard.upcomingCeremonies')}
          value={(ordersData?.data ?? []).filter((order: Order) => order.status === 'confirmed').length}
          icon="🕯️"
        />
      </section>

      <section className="card">
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>{t('orders.columns.contract')}</th>
                <th>{t('orders.columns.client')}</th>
                <th>{t('orders.columns.deceased')}</th>
                <th>{t('orders.columns.status')}</th>
                <th>{t('orders.columns.total')}</th>
                <th>{t('orders.columns.createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {(ordersData?.data ?? []).map((order: Order) => (
                <tr key={order.id}>
                  <td>{order.contractNumber ?? '—'}</td>
                  <td>{order.client.fullName}</td>
                  <td>{order.deceased.fullName}</td>
                  <td>
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {t(`orders.status.${order.status}` as const)}
                    </span>
                  </td>
                  <td>
                    {Intl.NumberFormat('ru-RU', { style: 'currency', currency: order.currency ?? 'RUB' }).format(order.totalAmount)}
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(ordersData?.data?.length ?? 0) === 0 && !isFetching ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    Нет данных
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <footer className={styles.pagination}>
          <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
            ◀
          </button>
          <span>
            {page} / {Math.max(1, Math.ceil((ordersData?.total ?? 0) / 10))}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={(ordersData?.data?.length ?? 0) < 10}
          >
            ▶
          </button>
        </footer>
      </section>

      {isModalOpen ? (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>{t('orders.createTitle')}</h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </header>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label>
                {t('forms.order.client')}
                <select value={form.clientId} onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))} required>
                  <option value="">—</option>
                  {(clients?.data ?? []).map((client: Client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t('forms.order.deceased')}
                <select value={form.deceasedId} onChange={(event) => setForm((prev) => ({ ...prev, deceasedId: event.target.value }))} required>
                  <option value="">—</option>
                  {(clients?.data ?? []).flatMap((client: Client) =>
                    (client.deceasedRelations ?? []).map((deceased) => (
                      <option key={deceased.id} value={deceased.id}>
                        {deceased.fullName}
                      </option>
                    )),
                  )}
                </select>
              </label>
              <label>
                {t('forms.order.package')}
                <select
                  value={form.packageId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      packageId: event.target.value,
                      currency: packages.find((pkg) => pkg.id === event.target.value)?.currency ?? 'RUB',
                    }))
                  }
                  required
                >
                  <option value="">—</option>
                  {packages.map((pkg: ServicePackage) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.nameRu} — {Intl.NumberFormat('ru-RU', { style: 'currency', currency: pkg.currency }).format(pkg.basePrice)}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.services}>
                <h3>{t('forms.order.services')}</h3>
                <ul>
                  {serviceLines.map((line) => (
                    <li key={line.serviceId}>
                      <span>{line.name}</span>
                      <span>
                        {line.quantity} × {Intl.NumberFormat('ru-RU', { style: 'currency', currency: form.currency }).format(line.unitPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <footer>
                <button type="submit" className={styles.primary} disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? '…' : t('actions.create')}
                </button>
                <button type="button" onClick={() => setModalOpen(false)}>
                  {t('actions.cancel')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

