import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ServiceCategoryEntity,
  ServiceEntity,
  ServicePackageEntity,
  PackageServiceEntity,
} from '../../database/entities';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(ServiceCategoryEntity) private readonly categoryRepository: Repository<ServiceCategoryEntity>,
    @InjectRepository(ServiceEntity) private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(ServicePackageEntity) private readonly packageRepository: Repository<ServicePackageEntity>,
    @InjectRepository(PackageServiceEntity) private readonly packageServiceRepository: Repository<PackageServiceEntity>,
  ) {}

  async listCategories() {
    return this.categoryRepository.find({ order: { sortOrder: 'ASC' } });
  }

  async listServices() {
    return this.serviceRepository.find({
      where: { isActive: true },
      order: { nameRu: 'ASC' },
      relations: ['category'],
    });
  }

  async listPackages() {
    const packages = await this.packageRepository.find({
      where: { isActive: true },
      order: { nameRu: 'ASC' },
    });
    const packageServiceMap = await this.packageServiceRepository.find({
      relations: ['service'],
    });

    return packages.map((pkg) => ({
      ...pkg,
      services: packageServiceMap.filter((entry) => entry.packageId === pkg.id),
    }));
  }
}

