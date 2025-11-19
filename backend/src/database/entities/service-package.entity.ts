import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PackageServiceEntity } from './package-service.entity';
import { OrderEntity } from './order.entity';

@Entity({ name: 'service_packages', schema: 'domain' })
@Index('UQ_service_packages_code', ['code'], { unique: true })
export class ServicePackageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'nvarchar', length: 50 })
  code!: string;

  @Column({ name: 'name_ru', type: 'nvarchar', length: 150 })
  nameRu!: string;

  @Column({ name: 'name_en', type: 'nvarchar', length: 150 })
  nameEn!: string;

  @Column({ name: 'description_ru', type: 'nvarchar', nullable: true })
  descriptionRu?: string;

  @Column({ name: 'description_en', type: 'nvarchar', nullable: true })
  descriptionEn?: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 18, scale: 2 })
  basePrice!: number;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ name: 'is_active', type: 'bit', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', nullable: true })
  updatedAt?: Date;

  @OneToMany(() => PackageServiceEntity, (ps) => ps.package)
  services?: PackageServiceEntity[];

  @OneToMany(() => OrderEntity, (order) => order.package)
  orders?: OrderEntity[];
}

