import { Prisma, PropertyUse, PurchaseMode } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class PropertyDetailDto {
  id!: string;
  address!: string | null;
  suburb!: string | null;
  propertyUse!: PropertyUse;
  purchaseMode!: PurchaseMode;
  purchasePrice!: Decimal;
  purchaseDate!: Date;
  inputs!: Prisma.JsonValue;
  inputsVersion!: number;
  cashflowResult!: Prisma.JsonValue | null;
  cashflowVersion!: number | null;
  annualCashflow!: Decimal | null;
  currentEquity!: Decimal | null;
  computedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
