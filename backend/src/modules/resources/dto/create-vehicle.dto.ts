import { IsBoolean, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @Length(5, 20)
  plateNumber!: string;

  @IsString()
  @Length(3, 50)
  type!: string;

  @IsOptional()
  @IsInt()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

