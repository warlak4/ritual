import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_log', schema: 'audit' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'user_id', type: 'uniqueidentifier', nullable: true })
  userId?: string;

  @Column({ type: 'nvarchar', length: 100 })
  action!: string;

  @Column({ type: 'nvarchar', length: 100 })
  entity!: string;

  @Column({ name: 'entity_id', type: 'nvarchar', length: 100 })
  entityId!: string;

  @Column({ name: 'before_data', type: 'nvarchar', nullable: true })
  beforeData?: string;

  @Column({ name: 'after_data', type: 'nvarchar', nullable: true })
  afterData?: string;

  @Column({ name: 'ip_address', type: 'nvarchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'nvarchar', length: 400, nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;
}

