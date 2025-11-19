import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity({ name: 'documents', schema: 'domain' })
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => OrderEntity, (order) => order.documents, { eager: true })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ type: 'nvarchar', length: 50 })
  type!: string;

  @Column({ type: 'nvarchar', length: 200 })
  title!: string;

  @Column({ name: 'file_path', type: 'nvarchar', length: 500 })
  filePath!: string;

  @Column({ name: 'generated_at', type: 'datetime2' })
  generatedAt!: Date;

  @Column({ name: 'sign_status', type: 'nvarchar', length: 20 })
  signStatus!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;
}

