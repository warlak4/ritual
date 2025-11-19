import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CeremonyEntity,
  CeremonyScheduleView,
  StaffEntity,
  VehicleEntity,
  InventoryEntity,
  LocationEntity,
} from '../../database/entities';
import { CreateCeremonyDto } from './dto/create-ceremony.dto';
import { AssignResourcesDto } from './dto/assign-resources.dto';

@Injectable()
export class CeremoniesService {
  constructor(
    @InjectRepository(CeremonyEntity) private readonly ceremonyRepository: Repository<CeremonyEntity>,
    @InjectRepository(CeremonyScheduleView) private readonly scheduleViewRepository: Repository<CeremonyScheduleView>,
    @InjectRepository(StaffEntity) private readonly staffRepository: Repository<StaffEntity>,
    @InjectRepository(VehicleEntity) private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(InventoryEntity) private readonly inventoryRepository: Repository<InventoryEntity>,
    @InjectRepository(LocationEntity) private readonly locationRepository: Repository<LocationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async listSchedule(): Promise<CeremonyScheduleView[]> {
    return this.scheduleViewRepository.find();
  }

  async getCeremony(id: string): Promise<CeremonyEntity> {
    const ceremony = await this.ceremonyRepository.findOne({
      where: { id },
      relations: [
        'order',
        'order.client',
        'location',
        'staffAssignments',
        'staffAssignments.staff',
        'vehicleBookings',
        'vehicleBookings.vehicle',
        'inventoryBookings',
        'inventoryBookings.inventory',
      ],
    });
    if (!ceremony) {
      throw new NotFoundException(`Ceremony ${id} not found`);
    }
    return ceremony;
  }

  async createCeremony(dto: CreateCeremonyDto): Promise<CeremonyEntity> {
    const ceremony = this.ceremonyRepository.create({
      order: { id: dto.orderId } as any,
      location: { id: dto.locationId } as any,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      status: dto.status,
      notes: dto.notes,
    });
    const saved = await this.ceremonyRepository.save(ceremony);
    return this.getCeremony(saved.id);
  }

  async assignResources(ceremonyId: string, dto: AssignResourcesDto): Promise<CeremonyEntity> {
    const params: any[] = [ceremonyId];
    let index = params.length;

    const staffValues =
      dto.staff.length > 0
        ? dto.staff
            .map((item) => {
              const placeholders = [`@${index}`, `@${index + 1}`, `@${index + 2}`];
              params.push(item.staffId, item.role, item.notes ?? null);
              index += 3;
              return `(${placeholders.join(', ')})`;
            })
            .join(',\n        ')
        : '';

    const vehicleValues =
      dto.vehicles.length > 0
        ? dto.vehicles
            .map((item) => {
              const placeholders = [`@${index}`, `@${index + 1}`, `@${index + 2}`, `@${index + 3}`, `@${index + 4}`];
              params.push(item.vehicleId, item.driverId ?? null, new Date(item.startAt), new Date(item.endAt), item.notes ?? null);
              index += 5;
              return `(${placeholders.join(', ')})`;
            })
            .join(',\n        ')
        : '';

    const inventoryValues =
      dto.inventory.length > 0
        ? dto.inventory
            .map((item) => {
              const placeholders = [`@${index}`, `@${index + 1}`, `@${index + 2}`];
              params.push(item.inventoryId, item.quantity, item.notes ?? null);
              index += 3;
              return `(${placeholders.join(', ')})`;
            })
            .join(',\n        ')
        : '';

    const sql = `
      DECLARE @Staff domain.udt_AssignStaff;
      DECLARE @Vehicles domain.udt_AssignVehicle;
      DECLARE @Inventory domain.udt_AssignInventory;
      ${staffValues ? `INSERT INTO @Staff (staff_id, role, notes) VALUES\n        ${staffValues};` : ''}
      ${vehicleValues ? `INSERT INTO @Vehicles (vehicle_id, driver_id, start_at, end_at, notes) VALUES\n        ${vehicleValues};` : ''}
      ${inventoryValues ? `INSERT INTO @Inventory (inventory_id, quantity, notes) VALUES\n        ${inventoryValues};` : ''}
      EXEC domain.sp_assign_ceremony_resources
        @CeremonyId = @0,
        @Staff = @Staff,
        @Vehicles = @Vehicles,
        @Inventory = @Inventory;
    `;

    await this.dataSource.query(sql, params);
    return this.getCeremony(ceremonyId);
  }
}

