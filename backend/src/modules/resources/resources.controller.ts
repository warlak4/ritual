import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, AppRole } from '../../common/decorators/roles.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Resources')
@ApiBearerAuth()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('staff')
  @Roles(AppRole.Admin, AppRole.Client)
  async staffList() {
    return this.resourcesService.listStaff();
  }

  @Post('staff')
  @Roles(AppRole.Admin)
  async createStaff(@Body() dto: CreateStaffDto) {
    return this.resourcesService.createStaff(dto);
  }

  @Patch('staff/:id')
  @Roles(AppRole.Admin)
  async updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.resourcesService.updateStaff(id, dto);
  }

  @Get('vehicles')
  @Roles(AppRole.Admin, AppRole.Client)
  async vehicleList() {
    return this.resourcesService.listVehicles();
  }

  @Post('vehicles')
  @Roles(AppRole.Admin)
  async createVehicle(@Body() dto: CreateVehicleDto) {
    return this.resourcesService.createVehicle(dto);
  }

  @Patch('vehicles/:id')
  @Roles(AppRole.Admin)
  async updateVehicle(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.resourcesService.updateVehicle(id, dto);
  }

  @Get('inventory')
  @Roles(AppRole.Admin, AppRole.Client)
  async inventoryList() {
    return this.resourcesService.listInventory();
  }

  @Post('inventory')
  @Roles(AppRole.Admin)
  async createInventory(@Body() dto: CreateInventoryDto) {
    return this.resourcesService.createInventory(dto);
  }

  @Patch('inventory/:id')
  @Roles(AppRole.Admin)
  async updateInventory(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.resourcesService.updateInventory(id, dto);
  }
}

