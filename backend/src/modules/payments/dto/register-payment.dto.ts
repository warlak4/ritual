import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class RegisterPaymentDto {
  @IsUUID()
  orderId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsString()
  method!: string;

  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

