import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceEntity } from './service.entity';

@Entity({ name: 'service_categories', schema: 'ref' })
@Index('UQ_service_categories_code', ['code'], { unique: true })
export class ServiceCategoryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'nvarchar', length: 50 })
  code!: string;

  @Column({ name: 'name_ru', type: 'nvarchar', length: 100 })
  nameRu!: string;

  @Column({ name: 'name_en', type: 'nvarchar', length: 100 })
  nameEn!: string;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder!: number;

  @OneToMany(() => ServiceEntity, (service) => service.category)
  services?: ServiceEntity[];
}

