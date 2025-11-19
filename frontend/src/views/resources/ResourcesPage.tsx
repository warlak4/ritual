import { useTranslation } from 'react-i18next';
import { useResourcesQuery } from '../../api/hooks';
import styles from './resources.module.css';

type StaffOverview = { id: string; fullName: string; role?: string | null };
type VehicleOverview = { id: string; plateNumber: string; type: string; capacity?: number | null };
type InventoryOverview = { id: string; name: string; quantityAvailable: number; quantityTotal: number };

export function ResourcesPage() {
  const { t } = useTranslation();
  const { data } = useResourcesQuery();

  return (
    <div className={styles.wrapper}>
      <header>
        <h1 className="brand-heading">{t('resources.staff')}</h1>
        <p>{t('tagline')}</p>
      </header>
      <section className={styles.grid}>
        <div className="card">
          <h2 className="brand-heading">{t('resources.staff')}</h2>
          <ul className={styles.list}>
            {(data?.staff ?? []).map((staff: StaffOverview) => (
              <li key={staff.id}>
                <strong>{staff.fullName}</strong>
                <span>{staff.role ?? 'вЂ”'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="brand-heading">{t('resources.vehicles')}</h2>
          <ul className={styles.list}>
            {(data?.vehicles ?? []).map((vehicle: VehicleOverview) => (
              <li key={vehicle.id}>
                <strong>{vehicle.plateNumber}</strong>
                <span>
                  {vehicle.type} вЂ” {vehicle.capacity ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="brand-heading">{t('resources.inventory')}</h2>
          <ul className={styles.list}>
            {(data?.inventory ?? []).map((item: InventoryOverview) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                <span>
                  {item.quantityAvailable} / {item.quantityTotal}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
