import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffEntity, VehicleEntity, InventoryEntity } from '../../database/entities';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(StaffEntity) private readonly staffRepository: Repository<StaffEntity>,
    @InjectRepository(VehicleEntity) private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(InventoryEntity) private readonly inventoryRepository: Repository<InventoryEntity>,
  ) {}

  async listStaff() {
    return this.staffRepository.find({ order: { fullName: 'ASC' } });
  }

  async createStaff(dto: CreateStaffDto) {
    const entity = this.staffRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return this.staffRepository.save(entity);
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException(`Staff ${id} not found`);
    }
    Object.assign(staff, dto);
    return this.staffRepository.save(staff);
  }

  async listVehicles() {
    return this.vehicleRepository.find({ order: { plateNumber: 'ASC' } });
  }

  async createVehicle(dto: CreateVehicleDto) {
    const entity = this.vehicleRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return this.vehicleRepository.save(entity);
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    Object.assign(vehicle, dto);
    return this.vehicleRepository.save(vehicle);
  }

  async listInventory() {
    return this.inventoryRepository.find({ order: { name: 'ASC' } });
  }

  async createInventory(dto: CreateInventoryDto) {
    if (dto.quantityAvailable > dto.quantityTotal) {
      throw new BadRequestException('Available quantity cannot exceed total quantity');
    }
    const entity = this.inventoryRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return this.inventoryRepository.save(entity);
  }

  async updateInventory(id: string, dto: UpdateInventoryDto) {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });
    if (!inventory) {
      throw new NotFoundException(`Inventory ${id} not found`);
    }
    const next = { ...inventory, ...dto };
    if (next.quantityAvailable > next.quantityTotal) {
      throw new BadRequestException('Available quantity cannot exceed total quantity');
    }
    Object.assign(inventory, dto);
    return this.inventoryRepository.save(inventory);
  }
}

