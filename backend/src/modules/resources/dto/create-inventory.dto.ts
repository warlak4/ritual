import { IsBoolean, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  @Length(3, 200)
  name!: string;

  @IsString()
  @Length(3, 100)
  sku!: string;

  @IsString()
  @Length(3, 100)
  category!: string;

  @IsInt()
  quantityTotal!: number;

  @IsInt()
  quantityAvailable!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

