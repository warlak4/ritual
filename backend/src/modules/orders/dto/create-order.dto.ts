import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString, IsUUID, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderServiceItemDto {
  @IsUUID()
  serviceId!: string;

  @Type(() => Number)
  @IsNumber()
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  unitPrice!: number;

  @Type(() => Number)
  @IsNumber()
  discount!: number;
}

export class CreateOrderDto {
  @IsUUID()
  clientId!: string;

  @IsUUID()
  deceasedId!: string;

  @IsOptional()
  @IsUUID()
  responsibleUserId?: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderServiceItemDto)
  services!: OrderServiceItemDto[];
}

