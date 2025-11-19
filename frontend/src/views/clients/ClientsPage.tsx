import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClientsQuery, useCreateClientMutation, type Client } from '../../api/hooks';
import styles from './clients.module.css';

export function ClientsPage() {
  const { t } = useTranslation();
  const { data } = useClientsQuery({ limit: 100 });
  const createClient = useCreateClientMutation();
  const [form, setForm] = useState({
    fullName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    isVip: false,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createClient.mutate(form);
    setForm({
      fullName: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
      isVip: false,
    });
  };

  return (
    <div className={styles.wrapper}>
      <header>
        <h1 className="brand-heading">{t('clients.title')}</h1>
        <p>{t('tagline')}</p>
      </header>

      <section className={styles.content}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2>{t('clients.createTitle')}</h2>
          <label>
            {t('forms.client.fullName')}
            <input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} required />
          </label>
          <div className={styles.row}>
            <label>
              {t('forms.client.contactEmail')}
              <input value={form.contactEmail} onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))} />
            </label>
            <label>
              {t('forms.client.contactPhone')}
              <input value={form.contactPhone} onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))} />
            </label>
          </div>
          <label>
            {t('forms.client.notes')}
            <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} rows={3} />
          </label>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={form.isVip}
              onChange={(event) => setForm((prev) => ({ ...prev, isVip: event.target.checked }))}
            />
            {t('forms.client.isVip')}
          </label>
          <button type="submit" className={styles.primary} disabled={createClient.isPending}>
            {t('actions.save')}
          </button>
        </form>

        <div className={styles.list}>
          <h2>{t('clients.title')}</h2>
          <table>
            <thead>
              <tr>
                <th>{t('clients.columns.name')}</th>
                <th>{t('clients.columns.email')}</th>
                <th>{t('clients.columns.phone')}</th>
                <th>{t('clients.columns.vip')}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((client: Client) => (
                <tr key={client.id}>
                  <td>{client.fullName}</td>
                  <td>{client.contactEmail ?? '—'}</td>
                  <td>{client.contactPhone ?? '—'}</td>
                  <td>{client.isVip ? '★' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

