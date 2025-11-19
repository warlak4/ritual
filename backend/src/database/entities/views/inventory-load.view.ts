import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ schema: 'domain', name: 'vw_inventory_load' })
export class InventoryLoadView {
  @ViewColumn({ name: 'inventory_id' })
  inventoryId!: string;

  @ViewColumn()
  name!: string;

  @ViewColumn()
  category!: string;

  @ViewColumn({ name: 'quantity_total' })
  quantityTotal!: number;

  @ViewColumn({ name: 'quantity_available' })
  quantityAvailable!: number;

  @ViewColumn({ name: 'booked_upcoming' })
  bookedUpcoming!: number;

  @ViewColumn({ name: 'booked_past' })
  bookedPast!: number;
}

