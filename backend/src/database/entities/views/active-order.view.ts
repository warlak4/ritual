import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ schema: 'domain', name: 'vw_active_orders' })
export class ActiveOrderView {
  @ViewColumn()
  id!: string;

  @ViewColumn({ name: 'contract_number' })
  contractNumber!: string | null;

  @ViewColumn()
  status!: string;

  @ViewColumn({ name: 'total_amount' })
  totalAmount!: number;

  @ViewColumn()
  currency!: string;

  @ViewColumn({ name: 'created_at' })
  createdAt!: Date;

  @ViewColumn({ name: 'client_name' })
  clientName!: string;

  @ViewColumn({ name: 'manager_name' })
  managerName!: string | null;

  @ViewColumn({ name: 'deceased_name' })
  deceasedName!: string;

  @ViewColumn({ name: 'services_count' })
  servicesCount!: number;
}

