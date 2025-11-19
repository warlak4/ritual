import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCeremonyDto {
  @IsUUID()
  orderId!: string;

  @IsUUID()
  locationId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

