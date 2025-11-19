import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity({ name: 'payments', schema: 'domain' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => OrderEntity, (order) => order.payments, { eager: true })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: number;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'nvarchar', length: 30 })
  method!: string;

  @Column({ type: 'nvarchar', length: 30 })
  status!: string;

  @Column({ name: 'transaction_ref', type: 'nvarchar', length: 100, nullable: true })
  transactionRef?: string;

  @Column({ name: 'paid_at', type: 'datetime2', nullable: true })
  paidAt?: Date;

  @Column({ name: 'receipt_url', type: 'nvarchar', length: 400, nullable: true })
  receiptUrl?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;
}

