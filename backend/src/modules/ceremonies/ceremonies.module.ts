import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CeremonyEntity,
  LocationEntity,
  StaffEntity,
  StaffAssignmentEntity,
  VehicleEntity,
  VehicleBookingEntity,
  InventoryEntity,
  InventoryBookingEntity,
  CeremonyScheduleView,
} from '../../database/entities';
import { CeremoniesService } from './ceremonies.service';
import { CeremoniesController } from './ceremonies.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CeremonyEntity,
      LocationEntity,
      StaffEntity,
      StaffAssignmentEntity,
      VehicleEntity,
      VehicleBookingEntity,
      InventoryEntity,
      InventoryBookingEntity,
      CeremonyScheduleView,
    ]),
  ],
  providers: [CeremoniesService],
  controllers: [CeremoniesController],
  exports: [CeremoniesService],
})
export class CeremoniesModule {}

