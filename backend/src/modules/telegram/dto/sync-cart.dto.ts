import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CartItemDto {
  @ApiProperty({ example: 'item_id_123' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 'Название услуги/пакета' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'service', enum: ['service', 'package'] })
  @IsString()
  @IsNotEmpty()
  type!: 'service' | 'package';

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @ApiProperty({ example: 'RUB' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ example: 'Описание', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class SyncCartDto {
  @ApiProperty({ example: '+79991234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @ApiProperty({ example: 3000.00 })
  @IsNumber()
  @IsNotEmpty()
  total!: number;

  @ApiProperty({ example: 'RUB' })
  @IsString()
  @IsNotEmpty()
  currency!: string;
}

