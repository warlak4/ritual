import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'backup_jobs', schema: 'admin' })
export class BackupJobEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'job_name', type: 'nvarchar', length: 100 })
  jobName!: string;

  @Column({ name: 'backup_type', type: 'nvarchar', length: 20 })
  backupType!: string;

  @Column({ name: 'target_path', type: 'nvarchar', length: 400 })
  targetPath!: string;

  @Column({ name: 'last_run_at', type: 'datetime2', nullable: true })
  lastRunAt?: Date;

  @Column({ type: 'nvarchar', length: 20 })
  status!: string;

  @Column({ type: 'nvarchar', length: 400, nullable: true })
  comments?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', nullable: true })
  updatedAt?: Date;
}

