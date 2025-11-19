import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { StaffAssignmentEntity } from './staff-assignment.entity';
import { VehicleBookingEntity } from './vehicle-booking.entity';

@Entity({ name: 'staff', schema: 'domain' })
export class StaffEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @Column({ name: 'full_name', type: 'nvarchar', length: 200 })
  fullName!: string;

  @Column({ type: 'nvarchar', length: 100 })
  role!: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'external_company', type: 'nvarchar', length: 200, nullable: true })
  externalCompany?: string;

  @Column({ name: 'is_active', type: 'bit', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @OneToMany(() => StaffAssignmentEntity, (assignment) => assignment.staff)
  assignments?: StaffAssignmentEntity[];

  @OneToMany(() => VehicleBookingEntity, (booking) => booking.driver)
  vehicleBookings?: VehicleBookingEntity[];
}

