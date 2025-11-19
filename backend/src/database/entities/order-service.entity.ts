import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { OrderEntity } from './order.entity';
import { ServiceEntity } from './service.entity';

@Entity({ name: 'order_services', schema: 'domain' })
export class OrderServiceEntity {
  @PrimaryColumn({ name: 'order_id', type: 'uniqueidentifier' })
  orderId!: string;

  @PrimaryColumn({ name: 'service_id', type: 'uniqueidentifier' })
  serviceId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  discount!: number;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  notes?: string;

  @ManyToOne(() => OrderEntity, (order) => order.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @ManyToOne(() => ServiceEntity, (service) => service.orderEntries, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service!: ServiceEntity;
}

