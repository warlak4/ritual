import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CeremonyEntity } from './ceremony.entity';
import { InventoryEntity } from './inventory.entity';

@Entity({ name: 'inventory_bookings', schema: 'domain' })
export class InventoryBookingEntity {
  @PrimaryColumn({ name: 'ceremony_id', type: 'uniqueidentifier' })
  ceremonyId!: string;

  @PrimaryColumn({ name: 'inventory_id', type: 'uniqueidentifier' })
  inventoryId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'nvarchar', length: 400, nullable: true })
  notes?: string;

  @Column({ name: 'booked_at', type: 'datetime2' })
  bookedAt!: Date;

  @ManyToOne(() => CeremonyEntity, (ceremony) => ceremony.inventoryBookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ceremony_id' })
  ceremony!: CeremonyEntity;

  @ManyToOne(() => InventoryEntity, (inventory) => inventory.bookings, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_id' })
  inventory!: InventoryEntity;
}

