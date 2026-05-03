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

export class CreatePropertyDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  suburb?: string;

  @IsEnum(PropertyUse)
  propertyUse!: PropertyUse;

  @IsEnum(PurchaseMode)
  purchaseMode!: PurchaseMode;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice!: number;

  @IsDateString()
  purchaseDate!: string;

  @IsObject()
  inputs!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  inputsVersion?: number;
}
