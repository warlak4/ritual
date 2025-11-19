import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategoryEntity, ServiceEntity, ServicePackageEntity, PackageServiceEntity } from '../../database/entities';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCategoryEntity, ServiceEntity, ServicePackageEntity, PackageServiceEntity])],
  providers: [CatalogService],
  controllers: [CatalogController],
  exports: [CatalogService],
})
export class CatalogModule {}

