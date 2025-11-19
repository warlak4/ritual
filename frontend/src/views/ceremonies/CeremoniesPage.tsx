import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCeremoniesQuery, useResourcesQuery, useAssignResourcesMutation } from '../../api/hooks';
import styles from './ceremonies.module.css';

type CeremonySchedule = {
  id: string;
  contractNumber: string;
  deceasedName: string;
  locationName: string;
  startAt: string;
  status: string;
};

type StaffResource = { id: string; fullName: string };
type VehicleResource = { id: string; plateNumber: string; type: string };
type InventoryResource = { id: string; name: string; quantityAvailable: number; quantityTotal: number };

export function CeremoniesPage() {
  const { t } = useTranslation();
  const { data: ceremonies } = useCeremoniesQuery();
  const { data: resources } = useResourcesQuery();
  const assignMutation = useAssignResourcesMutation();
  const [ceremonyId, setCeremonyId] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!ceremonyId) return;
    assignMutation.mutate({
      ceremonyId,
      staff: selectedStaff.map((staffId) => ({
        staffId,
        role: 'Сотрудник',
      })),
      vehicles: selectedVehicle
        ? [
            {
              vehicleId: selectedVehicle,
              driverId: null,
              startAt: new Date().toISOString(),
              endAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            },
          ]
        : [],
      inventory: selectedInventory
        ? [
            {
              inventoryId: selectedInventory,
              quantity: 1,
            },
          ]
        : [],
    });
  };

  return (
    <div className={styles.wrapper}>
      <header>
        <h1 className="brand-heading">{t('ceremonies.title')}</h1>
        <p>{t('tagline')}</p>
      </header>

      <section className={styles.schedule}>
        <table>
          <thead>
            <tr>
              <th>{t('orders.columns.contract')}</th>
              <th>{t('clients.columns.name')}</th>
              <th>Локация</th>
              <th>Начало</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {(ceremonies ?? []).map((ceremony: CeremonySchedule) => (
              <tr key={ceremony.id}>
                <td>{ceremony.contractNumber}</td>
                <td>{ceremony.deceasedName}</td>
                <td>{ceremony.locationName}</td>
                <td>{new Date(ceremony.startAt).toLocaleString()}</td>
                <td>{ceremony.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.panel}>
        <form onSubmit={handleSubmit}>
          <h2>{t('ceremonies.assignTitle')}</h2>
          <label>
            Церемония
            <select value={ceremonyId} onChange={(event) => setCeremonyId(event.target.value)}>
              <option value="">—</option>
              {(ceremonies ?? []).map((ceremony: CeremonySchedule) => (
                <option key={ceremony.id} value={ceremony.id}>
                  {ceremony.deceasedName} — {new Date(ceremony.startAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>{t('resources.staff')}</legend>
            <div className={styles.grid}>
              {(resources?.staff ?? []).map((staff: StaffResource) => (
                <label key={staff.id} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedStaff.includes(staff.id)}
                    onChange={(event) =>
                      setSelectedStaff((prev) =>
                        event.target.checked ? [...prev, staff.id] : prev.filter((id) => id !== staff.id)
                      )
                    }
                  />
                  <span>{staff.fullName}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label>
            {t('resources.vehicles')}
            <select value={selectedVehicle ?? ''} onChange={(event) => setSelectedVehicle(event.target.value || null)}>
              <option value="">—</option>
              {(resources?.vehicles ?? []).map((vehicle: VehicleResource) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plateNumber} — {vehicle.type}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t('resources.inventory')}
            <select value={selectedInventory ?? ''} onChange={(event) => setSelectedInventory(event.target.value || null)}>
              <option value="">—</option>
              {(resources?.inventory ?? []).map((item: InventoryResource) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.quantityAvailable})
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className={styles.primary} disabled={assignMutation.isPending}>
            {t('actions.assignResources')}
          </button>
        </form>
      </section>
    </div>
  );
}

