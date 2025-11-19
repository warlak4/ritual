import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
  status!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

