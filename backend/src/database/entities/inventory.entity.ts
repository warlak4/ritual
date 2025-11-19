import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryBookingEntity } from './inventory-booking.entity';

@Entity({ name: 'inventory', schema: 'domain' })
@Index('UQ_inventory_sku', ['sku'], { unique: true })
export class InventoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'nvarchar', length: 200 })
  name!: string;

  @Column({ type: 'nvarchar', length: 100 })
  sku!: string;

  @Column({ type: 'nvarchar', length: 100 })
  category!: string;

  @Column({ name: 'quantity_total', type: 'int' })
  quantityTotal!: number;

  @Column({ name: 'quantity_available', type: 'int' })
  quantityAvailable!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @Column({ name: 'is_active', type: 'bit', default: true })
  isActive!: boolean;

  @OneToMany(() => InventoryBookingEntity, (booking) => booking.inventory)
  bookings?: InventoryBookingEntity[];
}

