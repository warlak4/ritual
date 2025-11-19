import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  @Public()
  async categories() {
    return this.catalogService.listCategories();
  }

  @Get('services')
  @Public()
  async services() {
    return this.catalogService.listServices();
  }

  @Get('packages')
  @Public()
  async packages() {
    return this.catalogService.listPackages();
  }
}

