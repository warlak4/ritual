import { ArrayNotEmpty, IsArray, IsDateString, IsInt, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CeremonyStaffDto {
  @IsUUID()
  staffId!: string;

  @IsString()
  role!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class CeremonyVehicleDto {
  @IsUUID()
  vehicleId!: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class CeremonyInventoryDto {
  @IsUUID()
  inventoryId!: string;

  @IsInt()
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignResourcesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CeremonyStaffDto)
  staff!: CeremonyStaffDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CeremonyVehicleDto)
  vehicles!: CeremonyVehicleDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CeremonyInventoryDto)
  inventory!: CeremonyInventoryDto[];
}

