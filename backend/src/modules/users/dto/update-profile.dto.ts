import { IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class UpdateProfileDto {
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

  @IsOptional()
  savedFilters?: string;
}

