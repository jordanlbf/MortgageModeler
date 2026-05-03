import { PropertyUse, PurchaseMode } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  suburb?: string;

  @IsOptional()
  @IsEnum(PropertyUse)
  propertyUse?: PropertyUse;

  @IsOptional()
  @IsEnum(PurchaseMode)
  purchaseMode?: PurchaseMode;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsObject()
  inputs?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  inputsVersion?: number;
}
