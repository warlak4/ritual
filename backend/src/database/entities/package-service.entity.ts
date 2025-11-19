import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ServicePackageEntity } from './service-package.entity';
import { ServiceEntity } from './service.entity';

@Entity({ name: 'package_services', schema: 'domain' })
export class PackageServiceEntity {
  @PrimaryColumn({ name: 'package_id', type: 'uniqueidentifier' })
  packageId!: string;

  @PrimaryColumn({ name: 'service_id', type: 'uniqueidentifier' })
  serviceId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @ManyToOne(() => ServicePackageEntity, (pkg) => pkg.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package!: ServicePackageEntity;

  @ManyToOne(() => ServiceEntity, (service) => service.packageEntries, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service!: ServiceEntity;
}

