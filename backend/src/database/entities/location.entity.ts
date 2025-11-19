import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CeremonyEntity } from './ceremony.entity';

@Entity({ name: 'locations', schema: 'domain' })
export class LocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'nvarchar', length: 30 })
  type!: string;

  @Column({ type: 'nvarchar', length: 200 })
  name!: string;

  @Column({ type: 'nvarchar', length: 300 })
  address!: string;

  @Column({ name: 'contact_phone', type: 'nvarchar', length: 50, nullable: true })
  contactPhone?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @Column({ name: 'is_partner', type: 'bit', default: false })
  isPartner!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @OneToMany(() => CeremonyEntity, (ceremony) => ceremony.location)
  ceremonies?: CeremonyEntity[];
}

