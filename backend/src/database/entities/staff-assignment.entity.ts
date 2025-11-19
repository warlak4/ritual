import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CeremonyEntity } from './ceremony.entity';
import { StaffEntity } from './staff.entity';

@Entity({ name: 'staff_assignments', schema: 'domain' })
export class StaffAssignmentEntity {
  @PrimaryColumn({ name: 'ceremony_id', type: 'uniqueidentifier' })
  ceremonyId!: string;

  @PrimaryColumn({ name: 'staff_id', type: 'uniqueidentifier' })
  staffId!: string;

  @Column({ type: 'nvarchar', length: 100 })
  role!: string;

  @Column({ type: 'nvarchar', length: 400, nullable: true })
  notes?: string;

  @Column({ name: 'assigned_at', type: 'datetime2' })
  assignedAt!: Date;

  @ManyToOne(() => CeremonyEntity, (ceremony) => ceremony.staffAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ceremony_id' })
  ceremony!: CeremonyEntity;

  @ManyToOne(() => StaffEntity, (staff) => staff.assignments, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff!: StaffEntity;
}

