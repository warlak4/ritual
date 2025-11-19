import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 'service-123' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 'Ритуальная услуга' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'service', enum: ['service', 'package'] })
  @IsString()
  type!: 'service' | 'package';

  @ApiProperty({ example: 1 })
  @IsNumber()
  quantity!: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 'RUB' })
  @IsString()
  currency!: string;
}

export class SendOrderDto {
  @ApiProperty({ example: '+79991234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiProperty({ example: 10000 })
  @IsNumber()
  total!: number;

  @ApiProperty({ example: 'RUB' })
  @IsString()
  currency!: string;

  @ApiProperty({ example: 'Иван Иванов', required: false })
  @IsString()
  userName?: string;
}

