import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { LocationEntity } from './location.entity';
import { StaffAssignmentEntity } from './staff-assignment.entity';
import { VehicleBookingEntity } from './vehicle-booking.entity';
import { InventoryBookingEntity } from './inventory-booking.entity';

@Entity({ name: 'ceremonies', schema: 'domain' })
export class CeremonyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => OrderEntity, (order) => order.ceremonies, { eager: true })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @ManyToOne(() => LocationEntity, (location) => location.ceremonies, { eager: true })
  @JoinColumn({ name: 'location_id' })
  location!: LocationEntity;

  @Column({ name: 'start_at', type: 'datetime2' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'datetime2' })
  endAt!: Date;

  @Column({ type: 'nvarchar', length: 30 })
  status!: string;

  @Column({ type: 'nvarchar', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', nullable: true })
  updatedAt?: Date;

  @OneToMany(() => StaffAssignmentEntity, (assignment) => assignment.ceremony)
  staffAssignments?: StaffAssignmentEntity[];

  @OneToMany(() => VehicleBookingEntity, (booking) => booking.ceremony)
  vehicleBookings?: VehicleBookingEntity[];

  @OneToMany(() => InventoryBookingEntity, (booking) => booking.ceremony)
  inventoryBookings?: InventoryBookingEntity[];
}

