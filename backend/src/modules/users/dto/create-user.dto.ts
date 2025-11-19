import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsPositive, IsString, Length, Max, Min } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 128)
  password!: string;

  @IsString()
  @Length(2, 120)
  firstName!: string;

  @IsString()
  @Length(2, 120)
  lastName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  phone!: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  numberFormat?: string;

  @IsOptional()
  @IsPositive()
  @Min(5)
  @Max(100)
  pageSize?: number;
}

