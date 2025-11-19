import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ schema: 'domain', name: 'vw_ceremony_schedule' })
export class CeremonyScheduleView {
  @ViewColumn()
  id!: string;

  @ViewColumn({ name: 'start_at' })
  startAt!: Date;

  @ViewColumn({ name: 'end_at' })
  endAt!: Date;

  @ViewColumn()
  status!: string;

  @ViewColumn()
  notes!: string | null;

  @ViewColumn({ name: 'location_name' })
  locationName!: string;

  @ViewColumn({ name: 'location_type' })
  locationType!: string;

  @ViewColumn()
  address!: string;

  @ViewColumn({ name: 'contract_number' })
  contractNumber!: string | null;

  @ViewColumn({ name: 'client_name' })
  clientName!: string;

  @ViewColumn({ name: 'deceased_name' })
  deceasedName!: string;
}

