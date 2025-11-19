import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CeremoniesService } from './ceremonies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, AppRole } from '../../common/decorators/roles.decorator';
import { CreateCeremonyDto } from './dto/create-ceremony.dto';
import { AssignResourcesDto } from './dto/assign-resources.dto';

@Controller('ceremonies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Ceremonies')
@ApiBearerAuth()
export class CeremoniesController {
  constructor(private readonly ceremoniesService: CeremoniesService) {}

  @Get('schedule')
  @Roles(AppRole.Admin, AppRole.Client)
  async schedule() {
    return this.ceremoniesService.listSchedule();
  }

  @Get(':id')
  @Roles(AppRole.Admin, AppRole.Client)
  async getOne(@Param('id') id: string) {
    return this.ceremoniesService.getCeremony(id);
  }

  @Post()
  @Roles(AppRole.Admin)
  async create(@Body() dto: CreateCeremonyDto) {
    return this.ceremoniesService.createCeremony(dto);
  }

  @Post(':id/assign')
  @Roles(AppRole.Admin)
  async assign(@Param('id') id: string, @Body() dto: AssignResourcesDto) {
    return this.ceremoniesService.assignResources(id, dto);
  }
}

