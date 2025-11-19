import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @Length(3, 200)
  fullName!: string;

  @IsString()
  @Length(3, 100)
  role!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  externalCompany?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

