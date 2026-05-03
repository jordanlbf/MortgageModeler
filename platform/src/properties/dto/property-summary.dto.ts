import { PropertyUse } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class PropertySummaryDto {
  id!: string;
  address!: string | null;
  suburb!: string | null;
  propertyUse!: PropertyUse;
  purchasePrice!: Decimal;
  annualCashflow!: Decimal | null;
  currentEquity!: Decimal | null;
  updatedAt!: Date;
}
