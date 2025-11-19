import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VehicleBookingEntity } from './vehicle-booking.entity';

@Entity({ name: 'vehicles', schema: 'domain' })
@Index('UQ_vehicles_plate', ['plateNumber'], { unique: true })
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'plate_number', type: 'nvarchar', length: 20 })
  plateNumber!: string;

  @Column({ type: 'nvarchar', length: 50 })
  type!: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @Column({ name: 'is_active', type: 'bit', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @OneToMany(() => VehicleBookingEntity, (booking) => booking.vehicle)
  bookings?: VehicleBookingEntity[];
}

