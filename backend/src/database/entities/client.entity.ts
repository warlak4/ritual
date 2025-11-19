import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { OrderEntity } from './order.entity';
import { DeceasedEntity } from './deceased.entity';

@Entity({ name: 'clients', schema: 'domain' })
@Index('IX_clients_user', ['user'])
export class ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, (user) => user.clients, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @Column({ name: 'full_name', type: 'nvarchar', length: 200 })
  fullName!: string;

  @Column({ name: 'contact_email', type: 'nvarchar', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', type: 'nvarchar', length: 50, nullable: true })
  contactPhone?: string;

  @Column({ name: 'address_encrypted', type: 'varbinary', nullable: true })
  addressEncrypted?: Buffer | null;

  @Column({ name: 'passport_encrypted', type: 'varbinary', nullable: true })
  passportEncrypted?: Buffer | null;

  @Column({ type: 'nvarchar', nullable: true })
  notes?: string | null;

  @Column({ name: 'is_vip', type: 'bit', default: false })
  isVip!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', nullable: true })
  updatedAt?: Date | null;

  @OneToMany(() => OrderEntity, (order) => order.client)
  orders?: OrderEntity[];

  @OneToMany(() => DeceasedEntity, (deceased) => deceased.client)
  deceasedRelations?: DeceasedEntity[];
}

