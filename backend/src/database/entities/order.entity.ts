import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientEntity } from './client.entity';
import { UserEntity } from './user.entity';
import { DeceasedEntity } from './deceased.entity';
import { ServicePackageEntity } from './service-package.entity';
import { OrderServiceEntity } from './order-service.entity';
import { CeremonyEntity } from './ceremony.entity';
import { PaymentEntity } from './payment.entity';
import { DocumentEntity } from './document.entity';

@Entity({ name: 'orders', schema: 'domain' })
@Index('IX_orders_client_status', ['client', 'status'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ClientEntity, (client) => client.orders, { eager: true })
  @JoinColumn({ name: 'client_id' })
  client!: ClientEntity;

  @ManyToOne(() => UserEntity, (user) => user.responsibleOrders, { nullable: true, eager: true })
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser?: UserEntity | null;

  @ManyToOne(() => DeceasedEntity, (deceased) => deceased.orders, { eager: true })
  @JoinColumn({ name: 'deceased_id' })
  deceased!: DeceasedEntity;

  @ManyToOne(() => ServicePackageEntity, (pkg) => pkg.orders, { nullable: true, eager: true })
  @JoinColumn({ name: 'package_id' })
  package?: ServicePackageEntity | null;

  @Column({ type: 'nvarchar', length: 30 })
  status!: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 18, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ name: 'contract_number', type: 'nvarchar', length: 50, nullable: true })
  contractNumber?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', nullable: true })
  updatedAt?: Date;

  @Column({ name: 'deleted_at', type: 'datetime2', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => OrderServiceEntity, (service) => service.order, { cascade: true })
  services?: OrderServiceEntity[];

  @OneToMany(() => CeremonyEntity, (ceremony) => ceremony.order)
  ceremonies?: CeremonyEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.order)
  payments?: PaymentEntity[];

  @OneToMany(() => DocumentEntity, (doc) => doc.order)
  documents?: DocumentEntity[];
}

