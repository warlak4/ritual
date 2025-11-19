import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CeremonyEntity } from './ceremony.entity';
import { VehicleEntity } from './vehicle.entity';
import { StaffEntity } from './staff.entity';

@Entity({ name: 'vehicle_bookings', schema: 'domain' })
export class VehicleBookingEntity {
  @PrimaryColumn({ name: 'ceremony_id', type: 'uniqueidentifier' })
  ceremonyId!: string;

  @PrimaryColumn({ name: 'vehicle_id', type: 'uniqueidentifier' })
  vehicleId!: string;

  @Column({ name: 'driver_id', type: 'uniqueidentifier', nullable: true })
  driverId?: string;

  @Column({ name: 'start_at', type: 'datetime2' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'datetime2' })
  endAt!: Date;

  @Column({ type: 'nvarchar', length: 400, nullable: true })
  notes?: string;

  @ManyToOne(() => CeremonyEntity, (ceremony) => ceremony.vehicleBookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ceremony_id' })
  ceremony!: CeremonyEntity;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.bookings, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: VehicleEntity;

  @ManyToOne(() => StaffEntity, (staff) => staff.vehicleBookings, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: StaffEntity | null;
}

